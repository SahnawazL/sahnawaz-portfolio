// api/speak.js — Vercel Serverless Function
// Groq Orpheus text-to-speech proxy for Sahnawaz's portfolio chat widget.
// Cleans markdown/emoji out of bot replies, splits into <=190-char chunks
// (Orpheus' hard limit is 200 chars), calls Groq TTS for each chunk, then
// stitches the WAV audio back into a single file before returning it.

let isSpeaking = false; // single-user lock, mirrors chat.js

const MODEL           = 'canopylabs/orpheus-v1-english';
const DEFAULT_VOICE   = 'hannah';
const MAX_CHUNK_CHARS = 190;   // safety margin under Orpheus' 200-char limit
const MAX_TOTAL_CHARS = 700;   // caps latency/cost per reply (~4 chunks)

// ── Strip markdown, [CAT:] tags, links, and emoji so Orpheus reads clean text ──
function cleanForSpeech(raw) {
  return String(raw)
    .replace(/\*{0,2}\[?(?:CAT|KAT|CATEGORY):[\w]+\]?\*{0,2}/gi, '')
    .replace(/\*{1,3}/g, '')
    .replace(/#{1,3}/g, '')
    .replace(/^[-•]\s+/gm, '')
    .replace(/!!|>>|---/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Truncate to a sentence boundary near the limit, instead of a hard cut ──
function truncateToLimit(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastStop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  return (lastStop > limit * 0.5 ? cut.slice(0, lastStop + 1) : cut).trim();
}

// ── Split into <=maxLen chunks on sentence boundaries (word-split as fallback) ──
function chunkText(text, maxLen) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const chunks = [];
  let cur = '';
  for (let s of sentences) {
    s = s.trim();
    if (!s) continue;
    if (s.length > maxLen) {
      if (cur) { chunks.push(cur); cur = ''; }
      let words = s.split(' '), piece = '';
      for (const w of words) {
        if ((piece + ' ' + w).trim().length > maxLen) { chunks.push(piece.trim()); piece = w; }
        else piece += (piece ? ' ' : '') + w;
      }
      if (piece.trim()) cur = piece.trim();
      continue;
    }
    if ((cur + ' ' + s).trim().length > maxLen) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur = (cur ? cur + ' ' : '') + s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

// ── Parse a WAV buffer, return its "fmt " chunk (with header) and raw PCM data ──
function parseWavChunks(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a valid WAV buffer');
  }
  let offset = 12, fmtChunk = null, dataChunk = null;
  while (offset + 8 <= buf.length) {
    const id   = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const payloadStart = offset + 8;
    const payloadEnd   = payloadStart + size;
    if (id === 'fmt ' && !fmtChunk) fmtChunk = buf.slice(offset, payloadEnd + (size % 2));
    else if (id === 'data' && !dataChunk) dataChunk = buf.slice(payloadStart, payloadEnd);
    offset = payloadEnd + (size % 2); // chunks are word-aligned
  }
  if (!fmtChunk || !dataChunk) throw new Error('Missing fmt/data chunk in WAV');
  return { fmtChunk, dataChunk };
}

// ── Stitch multiple same-format WAV buffers into one continuous WAV ──
function stitchWav(buffers) {
  if (buffers.length === 1) return buffers[0];
  const parsed      = buffers.map(parseWavChunks);
  const fmtChunk     = parsed[0].fmtChunk;
  const dataPayload  = Buffer.concat(parsed.map(p => p.dataChunk));
  const dataHeader   = Buffer.alloc(8);
  dataHeader.write('data', 0, 'ascii');
  dataHeader.writeUInt32LE(dataPayload.length, 4);
  const riffSize    = 4 + fmtChunk.length + dataHeader.length + dataPayload.length;
  const riffHeader  = Buffer.alloc(12);
  riffHeader.write('RIFF', 0, 'ascii');
  riffHeader.writeUInt32LE(riffSize, 4);
  riffHeader.write('WAVE', 8, 'ascii');
  return Buffer.concat([riffHeader, fmtChunk, dataHeader, dataPayload]);
}

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (isSpeaking) {
    return res.status(429).json({ error: 'Already generating audio — try again in a moment.' });
  }

  const { text, voice } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'No text received.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  isSpeaking = true;

  try {
    const cleaned = truncateToLimit(cleanForSpeech(text), MAX_TOTAL_CHARS);
    if (!cleaned) {
      isSpeaking = false;
      return res.status(400).json({ error: 'Nothing speakable in that message.' });
    }

    const chunks   = chunkText(cleaned, MAX_CHUNK_CHARS);
    const useVoice = (voice && /^[a-z]+$/i.test(voice)) ? voice : DEFAULT_VOICE;

    // Fetch all chunks in parallel — Promise.all preserves input order in the
    // results array, so the stitched audio still plays back in the right order.
    // This is the main latency win: N chunks now cost ~1 chunk's time, not N.
    const fetchChunk = async (chunk) => {
      const ttsRes = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: MODEL,
          voice: useVoice,
          input: chunk,
          response_format: 'wav'
        })
      });

      if (!ttsRes.ok) {
        const errBody = await ttsRes.text().catch(() => '');
        console.error('Groq TTS failed:', ttsRes.status, errBody);
        throw new Error('groq_tts_failed');
      }

      const arrBuf = await ttsRes.arrayBuffer();
      return Buffer.from(arrBuf);
    };

    let wavBuffers;
    try {
      wavBuffers = await Promise.all(chunks.map(fetchChunk));
    } catch (e) {
      isSpeaking = false;
      return res.status(502).json({ error: 'Voice generation failed. Please try again.' });
    }

    const finalWav = stitchWav(wavBuffers);

    isSpeaking = false;
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(finalWav);

  } catch (err) {
    console.error('TTS server error:', err);
    isSpeaking = false;
    return res.status(500).json({ error: 'Something went wrong generating audio.' });
  }
};

module.exports = handler;
