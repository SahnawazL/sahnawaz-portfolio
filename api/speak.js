// api/speak.js — Vercel Serverless Function
// Edge TTS proxy for Sahnawaz's portfolio chat widget.
// Cleans markdown/emoji out of bot replies, then calls Microsoft Edge's
// online voice service (via the edge-tts-universal package) to synthesize
// speech. No API key needed — this is the same service that powers Edge
// browser's built-in "Read Aloud" feature, called here from the server.

const { EdgeTTS } = require('edge-tts-universal');

let isSpeaking = false; // single-user lock, mirrors chat.js

const DEFAULT_VOICE  = 'en-GB-SoniaNeural';
const MAX_TOTAL_CHARS = 2000; // generous cap — Edge TTS has no per-call char limit like Orpheus did

// ── Strip markdown, [CAT:] tags, links, and emoji so the voice reads clean text ──
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  isSpeaking = true;

  try {
    const cleaned = truncateToLimit(cleanForSpeech(text), MAX_TOTAL_CHARS);
    if (!cleaned) {
      isSpeaking = false;
      return res.status(400).json({ error: 'Nothing speakable in that message.' });
    }

    // Basic validation so an arbitrary client-supplied string can't be used
    // to inject something unexpected into the voice name.
    const useVoice = (voice && /^[A-Za-z]{2}-[A-Za-z]{2}-[\w]+Neural$/.test(voice))
      ? voice
      : DEFAULT_VOICE;

    // Edge TTS is generally reliable but is an unofficial endpoint, so a
    // couple of quick retries guard against occasional transient hiccups.
    const MAX_RETRIES = 2;
    let audioBuffer;
    let lastErr;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const tts = new EdgeTTS(cleaned, useVoice);
        const result = await tts.synthesize();
        audioBuffer = Buffer.from(await result.audio.arrayBuffer());
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.error('Edge TTS failed (attempt ' + attempt + '):', e && e.message);
        if (attempt < MAX_RETRIES) await sleep(500 * Math.pow(2, attempt)); // 500ms, 1s
      }
    }

    if (lastErr || !audioBuffer) {
      isSpeaking = false;
      return res.status(502).json({ error: 'Voice generation failed. Please try again.' });
    }

    isSpeaking = false;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);

  } catch (err) {
    console.error('TTS server error:', err);
    isSpeaking = false;
    return res.status(500).json({ error: 'Something went wrong generating audio.' });
  }
};

module.exports = handler;
