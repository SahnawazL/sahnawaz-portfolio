// Google Gemini as a backup for when every Groq model and key is busy.
// Only used if GEMINI_API_KEY (and optional GEMINI_API_KEY_2, _3) is set in
// Vercel; without a key these return null and nothing changes.
// lib/ is bundled into the functions that use it, so it adds no function.

const MODEL = 'gemini-2.5-flash';

function geminiKeys() {
  return [...new Set([process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3]
    .map(k => (k || '').trim()).filter(Boolean))];
}

// messages: OpenAI-style [{ role: 'system' | 'user' | 'assistant', content }]
async function geminiText(messages, opts) {
  opts = opts || {};
  const keys = geminiKeys();
  if (!keys.length) return null;
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
  const contents = [];
  messages.filter(m => m.role !== 'system').forEach(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    // Gemini wants user and model turns to alternate
    if (last && last.role === role) last.parts[0].text += '\n\n' + m.content;
    else contents.push({ role, parts: [{ text: String(m.content) }] });
  });
  if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: '(start)' }] });
  const body = {
    contents,
    generationConfig: Object.assign(
      { temperature: opts.temperature == null ? 0.5 : opts.temperature, maxOutputTokens: opts.maxTokens || 1000, thinkingConfig: { thinkingBudget: 0 } },
      opts.json ? { responseMimeType: 'application/json' } : {}
    )
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const deadline = Date.now() + (opts.totalMs || 15000);
  for (const key of keys) {
    const left = deadline - Date.now();
    if (left < 1500) return null;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(Math.min(opts.timeoutMs || 14000, left))
      });
      if (!r.ok) { console.warn('[gemini] failed ' + r.status); if (r.status === 429 || r.status >= 500) continue; return null; }
      const data = await r.json();
      const text = ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [])
        .map(p => p.text || '').join('').trim();
      if (text) return text;
    } catch (e) { console.warn('[gemini] error: ' + (e && e.message)); }
  }
  return null;
}

async function geminiJSON(messages, schema, opts) {
  const withShape = schema ? messages.concat([{ role: 'system', content: 'Respond with ONLY a JSON object with this shape: ' + JSON.stringify(schema.schema || schema) }]) : messages;
  const txt = await geminiText(withShape, Object.assign({}, opts, { json: true }));
  if (!txt) return null;
  const a = txt.indexOf('{'), z = txt.lastIndexOf('}');
  if (a < 0 || z < a) return null;
  try { return JSON.parse(txt.slice(a, z + 1)); } catch (e) { return null; }
}

module.exports = { geminiText, geminiJSON, geminiKeys };
