// lib/project-brief.js
//
// The AI project-brief agent, shared by two functions:
//   api/chat.js     → one conversation turn  (source: 'brief')
//   api/contact.js  → sending a finished brief (mode: 'brief')
//
// Lives in /lib on purpose: files here are bundled into the functions that
// import them and do not count against Vercel's function limit.
//
// Design: the AI understands the visitor's words and writes the reply, but
// everything that must be reliable is decided here in code — which details
// are still missing, whether an email is valid, the price range shown, and
// when the brief is ready. The AI can never mark a brief "complete" early or
// invent a price.

'use strict';

/* ── Brief fields ───────────────────────────────────────────────────────── */
const REQUIRED = ['name', 'email', 'projectType', 'goal', 'budget', 'timeline'];
const OPTIONAL = ['phone', 'business', 'features', 'website', 'notes'];
const TEXT_FIELDS = ['name', 'email', 'phone', 'business', 'projectType', 'goal', 'budget', 'timeline', 'website', 'notes'];

const LABELS = {
  name: 'Name', email: 'Email', phone: 'Phone / WhatsApp', business: 'Business',
  projectType: 'Project', goal: 'Goal', features: 'Key features', budget: 'Budget',
  timeline: 'Timeline', website: 'Current website / link', notes: 'Notes'
};

/* Project types → typical range and delivery, from Sahnawaz's own pricing
   (the same numbers the contact-form estimate wizard uses). */
const PROJECT_TYPES = [
  'Business website', 'Landing page', 'Portfolio website', 'E-commerce store',
  'Web app / custom build', 'Website redesign', 'UI/UX design', 'AI chatbot / integration',
  'Web ads & promotion', 'Other'
];
const ESTIMATES = {
  'Business website':          { range: '₹9,999 – ₹14,999',  time: '2–3 weeks' },
  'Landing page':              { range: '₹9,999 – ₹14,999',  time: '2–3 weeks' },
  'Portfolio website':         { range: '₹6,999 – ₹9,999',   time: '1–2 weeks' },
  'E-commerce store':          { range: '₹14,999 – ₹24,999', time: '3–5 weeks' },
  'UI/UX design':              { range: '₹3,999 per screen', time: '1–2 weeks' },
  'AI chatbot / integration':  { range: '₹2,999 – ₹7,999',   time: '1–3 weeks' },
  'Web ads & promotion':       { range: '₹3,999 per campaign', time: 'Monthly report included' }
  // Web app / redesign / other → custom quote
};
function estimateFor(type) {
  return ESTIMATES[type] || { range: 'Custom quote', time: 'Depends on scope' };
}

/* ── Cleaning & validation ──────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
function clip(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n); }

function normalizePhone(v) {
  const raw = clip(v, 40);
  if (!raw) return '';
  const digits = raw.replace(/[^\d+]/g, '');
  const plain = digits.replace(/^\+/, '');
  if (plain.length === 10) return '+91 ' + plain.slice(0, 5) + ' ' + plain.slice(5);
  if (plain.length === 12 && plain.startsWith('91')) return '+91 ' + plain.slice(2, 7) + ' ' + plain.slice(7);
  if (plain.length >= 8 && plain.length <= 15) return (digits.startsWith('+') ? '+' : '') + plain;
  return '';
}

/* Clean one brief object coming from the AI or the browser. */
function clean(b) {
  b = b || {};
  const out = {};
  out.name = clip(b.name, 60);
  const em = clip(b.email, 120).toLowerCase();
  out.email = EMAIL_RE.test(em) ? em : '';
  out.phone = normalizePhone(b.phone);
  out.business = clip(b.business, 120);
  out.projectType = PROJECT_TYPES.indexOf(b.projectType) > -1 ? b.projectType : '';
  out.goal = clip(b.goal, 500);
  out.features = (Array.isArray(b.features) ? b.features : [])
    .map(function (f) { return clip(f, 80); }).filter(Boolean).slice(0, 10);
  out.budget = clip(b.budget, 60);
  out.timeline = clip(b.timeline, 60);
  const site = clip(b.website, 200);
  out.website = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(site) ? site : (site && /instagram|facebook|@/.test(site) ? site : '');
  out.notes = clip(b.notes, 400);
  return out;
}

/* Keep what we already had unless the new value says something. */
function merge(prev, next) {
  const a = clean(prev), b = clean(next), out = {};
  TEXT_FIELDS.forEach(function (k) { out[k] = b[k] || a[k]; });
  out.features = b.features.length ? b.features : a.features;
  return out;
}

function missing(b) {
  return REQUIRED.filter(function (k) { return !b[k]; });
}

/* Deterministic questions, used when the AI is unavailable or skipped one. */
const ASK = {
  name: "What's your name?",
  email: "What's the best email for Sahnawaz to reply to?",
  projectType: 'What kind of project is it — a business website, an online store, a portfolio, an app, or something else?',
  goal: 'What should the website do for you? A line about the main goal is enough.',
  budget: "Do you have a budget range in mind? It's completely fine to say not sure.",
  timeline: 'When would you like it ready?'
};

/* Minimal extraction without the AI (fallback only). */
function fallbackExtract(message, b) {
  const out = {};
  const m = String(message || '');
  const em = m.match(/[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i);
  if (em) out.email = em[0];
  const ph = m.match(/(\+?\d[\d\s-]{8,14}\d)/);
  if (ph) out.phone = ph[1];
  const first = missing(b)[0];
  if (first === 'name' && !em && m.length < 40) out.name = m.replace(/^(i'?m|i am|my name is|this is)\s+/i, '');
  else if (first === 'goal' && m.length > 20) out.goal = m;
  else if (first === 'budget' && !em) out.budget = m;
  else if (first === 'timeline' && !em) out.timeline = m;
  return out;
}

/* ── The AI turn ─────────────────────────────────────────────────────────── */
function turnSystemPrompt(brief, miss) {
  return [
    "You are Sahnawaz's AI assistant on his portfolio website. Right now you are helping a potential client put together a short project brief that will be sent to Sahnawaz (freelance full-stack web developer and UI/UX designer based in Bangalore, originally from Silchar, Assam; works remotely across India).",
    '',
    'Each turn: (1) read the visitor\'s latest message and extract every brief detail it contains, (2) write a short reply that acknowledges what they said and asks for the next one or two MISSING REQUIRED details.',
    '',
    'REQUIRED details: name, email, projectType, goal (what the site must do / the main aim), budget, timeline.',
    'OPTIONAL details — capture them if mentioned, never push for them: phone (or WhatsApp), business (name and/or industry), features (short list), website (existing site or social link), notes.',
    '',
    'projectType must be exactly one of: ' + PROJECT_TYPES.join(', ') + '. Choose the closest; use Other if genuinely unclear. Leave it empty if nothing about the type has been said yet.',
    'Extraction rules:',
    '- Never invent anything. Use the visitor\'s own meaning, lightly tidied (English for field values).',
    '- Return the COMPLETE brief every turn: copy existing values unchanged unless the visitor changes them; use "" for unknown, [] for no features.',
    '- Budgets: "15k" → "₹15,000"; "10-20k" → "₹10,000 – ₹20,000"; if they don\'t know → "Not sure yet".',
    '- Timelines: "asap" → "As soon as possible"; "no rush" → "Flexible"; keep dates/events as said (e.g. "Before Diwali").',
    '- If they correct something ("actually my budget is 20k"), replace that value.',
    '',
    'Reply rules:',
    '- 1 to 3 short sentences, warm and professional, at most one emoji. Plain text only: no markdown, no #, **, >>, !!, bullets or lists.',
    '- Match the visitor\'s language and style (English, Hindi, Bengali, Assamese, Roman Hindi, Roman Bengali…).',
    '- Ask at most two things at once, most important first.',
    '- Do not quote prices or promise dates on Sahnawaz\'s behalf (the brief card shows a typical range).',
    '- If they ask a question about Sahnawaz or something unrelated, do not guess or make claims about his services; say Sahnawaz will answer it personally (add the question to notes) or that they can tap ✕ on the brief bar to pause and ask the assistant anything. Then continue the brief.',
    '- If every required detail is known after this message, ask nothing more; say the brief is ready for them to review and send.',
    '',
    'Current brief: ' + JSON.stringify(brief),
    'Still missing before this message: ' + (miss.length ? miss.join(', ') : 'nothing')
  ].join('\n');
}

/* JSON schema for Groq structured outputs (strict: every field required). */
const TURN_SCHEMA = {
  name: 'project_brief_turn',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['reply', 'brief'],
    properties: {
      reply: { type: 'string' },
      brief: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'email', 'phone', 'business', 'projectType', 'goal', 'features', 'budget', 'timeline', 'website', 'notes'],
        properties: {
          name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
          business: { type: 'string' },
          projectType: { type: 'string', enum: PROJECT_TYPES.concat(['']) },
          goal: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          budget: { type: 'string' }, timeline: { type: 'string' },
          website: { type: 'string' }, notes: { type: 'string' }
        }
      }
    }
  }
};

/* Analysis for Sahnawaz, generated when the brief is sent. Never shown to
   the visitor. */
function analysisPrompt(brief) {
  return [
    'You help Sahnawaz, a freelance web developer and UI/UX designer in Assam, India, triage an incoming project brief from his portfolio website.',
    'His typical pricing: business website / landing page ₹9,999–₹14,999 (2–3 weeks); portfolio ₹6,999–₹9,999 (1–2 weeks); e-commerce ₹14,999–₹24,999 (3–5 weeks); UI/UX ₹3,999 per screen; AI chatbot/integration ₹2,999–₹7,999; web ads & promotion ₹3,999 per campaign (landing page, Google/Meta ads setup, tracking, monthly report); anything bigger is a custom quote.',
    'Be concise and practical. Do not invent facts about the client. Write in English.',
    'leadScore: "Hot" = clear need, realistic budget and timeline, reachable; "Warm" = genuine but vague or budget unclear; "Cool" = very vague, unrealistic, or looks like a test.',
    'Brief: ' + JSON.stringify(brief)
  ].join('\n');
}
const ANALYSIS_SCHEMA = {
  name: 'brief_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'leadScore', 'scoreReasons', 'suggestedPackage', 'questionsForCall', 'watchOuts'],
    properties: {
      summary: { type: 'string' },
      leadScore: { type: 'string', enum: ['Hot', 'Warm', 'Cool'] },
      scoreReasons: { type: 'array', items: { type: 'string' } },
      suggestedPackage: { type: 'string' },
      questionsForCall: { type: 'array', items: { type: 'string' } },
      watchOuts: { type: 'array', items: { type: 'string' } }
    }
  }
};

/* ── Groq helper: strict JSON with model fallback ───────────────────────── */
async function groqJSON(apiKey, messages, schema, opts) {
  opts = opts || {};
  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3-32b'];
  /* One overall deadline across the fallbacks, so a slow day can never
     keep the visitor waiting three full timeouts */
  const deadline = Date.now() + (opts.totalMs || 20000);
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 1500) break;
    const isOss = model.indexOf('gpt-oss') > -1;
    const body = {
      model, messages,
      temperature: opts.temperature == null ? 0.4 : opts.temperature,
      max_tokens: opts.maxTokens || 900,
      response_format: isOss ? { type: 'json_schema', json_schema: schema } : { type: 'json_object' }
    };
    if (isOss) body.reasoning_effort = 'low'; else body.reasoning_effort = 'none';
    if (!isOss) {
      /* json_object mode has no schema: describe it in the prompt */
      body.messages = messages.concat([{ role: 'system', content: 'Respond with ONLY a JSON object with this shape: ' + JSON.stringify(schema.schema) }]);
    }
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.min(opts.timeoutMs || 12000, left))
      });
      if (!r.ok) {
        console.warn('[brief] ' + model + ' failed ' + r.status);
        if (r.status === 429 || r.status >= 500) continue;
        continue;
      }
      const data = await r.json();
      let txt = String(data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '');
      txt = txt.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const a = txt.indexOf('{'), z = txt.lastIndexOf('}');
      if (a < 0 || z < a) continue;
      return JSON.parse(txt.slice(a, z + 1));
    } catch (e) {
      console.warn('[brief] ' + model + ' error: ' + (e && e.message));
    }
  }
  return null;
}

/* One conversation turn → { reply, brief, missing, ready, progress, estimate } */
async function runTurn(apiKey, input) {
  const message = clip(input.message, 800);
  const history = Array.isArray(input.history) ? input.history.slice(-6) : [];
  /* Google-login name/email only fill blanks, so a correction the visitor
     typed ("actually, call me Sam") is never overwritten */
  let brief = merge(input.known || {}, input.brief || {});
  const missBefore = missing(brief);

  let reply = '';
  let ai = null;
  if (apiKey && message) {
    const msgs = [{ role: 'system', content: turnSystemPrompt(brief, missBefore) }];
    history.forEach(function (h) {
      if (!h || !h.content) return;
      msgs.push({ role: h.role === 'user' ? 'user' : 'assistant', content: clip(h.content, 400) });
    });
    msgs.push({ role: 'user', content: message });
    ai = await groqJSON(apiKey, msgs, TURN_SCHEMA, { temperature: 0.4, maxTokens: 900, timeoutMs: 12000, totalMs: 18000 });
  }

  const typedEmail = /@/.test(message) && (message.match(/[^\s@<>()]+@[^\s@<>()]+/) || [])[0];
  if (ai && ai.brief) {
    brief = merge(brief, ai.brief);
    reply = clip(ai.reply, 600).replace(/[#*>]{2,}|!!/g, '');
  } else {
    brief = merge(brief, fallbackExtract(message, brief));
  }

  const miss = missing(brief);
  const ready = miss.length === 0;

  /* Code, not the AI, has the final word on what happens next */
  if (typedEmail && !brief.email) {
    reply = "That email doesn't look complete — could you check it? (like name@gmail.com)";
  } else if (ready) {
    if (!reply || /\?/.test(reply)) reply = "Perfect — your brief is ready. Have a look below and send it to Sahnawaz when you're happy. ✅";
  } else if (!reply || !/\?/.test(reply)) {
    reply = (reply ? reply + ' ' : '') + ASK[miss[0]];
  }

  return {
    reply,
    brief,
    missing: miss,
    ready,
    progress: { done: REQUIRED.length - miss.length, total: REQUIRED.length },
    estimate: brief.projectType ? estimateFor(brief.projectType) : null
  };
}

/* ── Output formats ─────────────────────────────────────────────────────── */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function rows(brief) {
  const order = ['name', 'email', 'phone', 'business', 'projectType', 'goal', 'features', 'budget', 'timeline', 'website', 'notes'];
  return order.map(function (k) {
    const v = k === 'features' ? (brief.features || []).join(', ') : brief[k];
    return v ? [LABELS[k], v] : null;
  }).filter(Boolean);
}

function plainText(brief, analysis, refId) {
  const est = estimateFor(brief.projectType);
  let t = '📝 AI PROJECT BRIEF · ' + refId + '\n';
  if (analysis) t += (analysis.leadScore === 'Hot' ? '🔥 ' : analysis.leadScore === 'Warm' ? '🌤️ ' : '❄️ ') + analysis.leadScore + ' lead — ' + analysis.summary + '\n';
  t += '\n' + rows(brief).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
  t += '\nTypical range shown to client: ' + est.range + ' · ' + est.time;
  if (analysis) {
    if (analysis.suggestedPackage) t += '\n\nSuggested package: ' + analysis.suggestedPackage;
    if (analysis.questionsForCall && analysis.questionsForCall.length) t += '\nAsk on the call:\n- ' + analysis.questionsForCall.join('\n- ');
    if (analysis.watchOuts && analysis.watchOuts.length) t += '\nWatch out:\n- ' + analysis.watchOuts.join('\n- ');
  }
  return t;
}

/* Which button the visitor started from — tells Sahnawaz what converts */
const FROM_LABELS = {
  hero: 'the hero “Plan Your Project with AI” button',
  header: 'the header “Let’s talk” button',
  menu: 'the desktop menu',
  card: 'a pricing card',
  services: 'the “Ready to Work With Me?” button',
  'why-website': 'the “Why do you need a website?” pop-up',
  link: 'a shared ?plan link',
  check: 'the free website check',
  search: 'Quick Search',
  chat: 'inside the chat'
};
function fromLabel(key) { return FROM_LABELS[key] || ''; }

function waLink(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length >= 10 ? 'https://wa.me/' + d : '';
}

function ownerEmailHtml(brief, analysis, refId, meta) {
  const est = estimateFor(brief.projectType);
  const score = analysis && analysis.leadScore;
  const scoreColor = score === 'Hot' ? '#ff7a45' : score === 'Warm' ? '#ffc53d' : '#69c0ff';
  const table = rows(brief).map(function (r) {
    return '<tr><td style="padding:7px 10px 7px 0;color:#7ec8e3;font-size:13px;vertical-align:top;white-space:nowrap;">' + esc(r[0]) +
      '</td><td style="padding:7px 0;color:#e2f6ff;font-size:14px;line-height:1.5;">' + esc(r[1]) + '</td></tr>';
  }).join('');
  const list = function (title, arr) {
    if (!arr || !arr.length) return '';
    return '<p style="margin:16px 0 6px;color:#7ec8e3;font-size:13px;font-weight:700;">' + esc(title) + '</p><ul style="margin:0;padding-left:18px;color:#cfe6f5;font-size:14px;line-height:1.6;">' +
      arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  };
  const wa = waLink(brief.phone);
  const replyHref = 'mailto:' + encodeURIComponent(brief.email) + '?subject=' + encodeURIComponent('Your project brief (' + refId + ')');
  return '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:auto;background:#0b1a2b;padding:24px;border-radius:14px;color:#e2f6ff;">' +
    '<div style="font-size:12px;letter-spacing:2px;color:#00dcff;font-weight:700;text-transform:uppercase;">AI project brief · ' + esc(refId) + '</div>' +
    '<h2 style="margin:8px 0 4px;color:#fff;font-size:20px;">' + esc(brief.projectType || 'New project') + (brief.business ? ' — ' + esc(brief.business) : '') + '</h2>' +
    (analysis ? '<div style="display:inline-block;margin:6px 0 10px;padding:4px 10px;border-radius:20px;background:' + scoreColor + '22;border:1px solid ' + scoreColor + ';color:' + scoreColor + ';font-size:13px;font-weight:700;">' +
      (score === 'Hot' ? '🔥 ' : score === 'Warm' ? '🌤️ ' : '❄️ ') + esc(score) + ' lead</div>' +
      '<p style="margin:0 0 6px;color:#cfe6f5;font-size:14px;line-height:1.6;">' + esc(analysis.summary) + '</p>' : '') +
    '<table cellpadding="0" cellspacing="0" style="width:100%;margin-top:10px;border-top:1px solid rgba(0,255,255,.15);">' + table + '</table>' +
    '<p style="margin:12px 0 0;color:#8fb3c7;font-size:13px;">Typical range shown to the client: <b style="color:#e2f6ff;">' + esc(est.range) + '</b> · ' + esc(est.time) + '</p>' +
    (analysis ? (analysis.suggestedPackage ? '<p style="margin:14px 0 0;color:#cfe6f5;font-size:14px;"><b style="color:#7ec8e3;">Suggested package:</b> ' + esc(analysis.suggestedPackage) + '</p>' : '') +
      list('Why this score', analysis.scoreReasons) + list('Ask on the call', analysis.questionsForCall) + list('Watch out for', analysis.watchOuts) : '') +
    '<div style="margin-top:20px;">' +
      '<a href="' + replyHref + '" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:10px;background:#00dcff;color:#021018;font-weight:700;text-decoration:none;font-size:14px;">Reply by email</a>' +
      (wa ? '<a href="' + wa + '" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:10px;background:#25d366;color:#04210f;font-weight:700;text-decoration:none;font-size:14px;">WhatsApp</a>' : '') +
    '</div>' +
    '<p style="margin:18px 0 0;font-size:12px;color:#4a7a8a;">Collected by the AI assistant on sahnawaz-portfolio.vercel.app' +
      (meta && meta.city ? ' · visitor near ' + esc(meta.city) + (meta.country ? ', ' + esc(meta.country) : '') : '') +
      (meta && meta.lang ? ' · chatted in ' + esc(meta.lang) : '') +
      (meta && fromLabel(meta.from) ? ' · started from ' + esc(fromLabel(meta.from)) : '') + '</p>' +
  '</div>';
}

function visitorEmailHtml(brief, refId) {
  const est = estimateFor(brief.projectType);
  const table = rows(brief).map(function (r) {
    return '<tr><td style="padding:6px 10px 6px 0;color:#7ec8e3;font-size:13px;vertical-align:top;white-space:nowrap;">' + esc(r[0]) +
      '</td><td style="padding:6px 0;color:#e2f6ff;font-size:14px;line-height:1.5;">' + esc(r[1]) + '</td></tr>';
  }).join('');
  return '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:auto;background:#0b1a2b;padding:24px;border-radius:14px;color:#e2f6ff;">' +
    '<div style="font-size:12px;letter-spacing:2px;color:#00dcff;font-weight:700;text-transform:uppercase;">Sahnawaz Ahmed Laskar · Web Developer &amp; UI/UX Designer</div>' +
    '<h2 style="margin:10px 0 6px;color:#fff;font-size:20px;">Thanks' + (brief.name ? ', ' + esc(brief.name.split(' ')[0]) : '') + ' — your project brief is with Sahnawaz ✅</h2>' +
    '<p style="margin:0 0 12px;color:#cfe6f5;font-size:14px;line-height:1.6;">He reads every brief personally and usually replies within 24 hours. Here is a copy of what you sent (reference <b>' + esc(refId) + '</b>).</p>' +
    '<table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid rgba(0,255,255,.15);">' + table + '</table>' +
    '<p style="margin:12px 0 0;color:#8fb3c7;font-size:13px;">Typical range for this kind of project: <b style="color:#e2f6ff;">' + esc(est.range) + '</b> · ' + esc(est.time) + '. Sahnawaz will confirm an exact quote after a short chat.</p>' +
    '<p style="margin:16px 0 0;color:#cfe6f5;font-size:14px;">Anything to add? Just reply to this email.</p>' +
    '<p style="margin:18px 0 0;font-size:12px;color:#4a7a8a;">sahnawaz-portfolio.vercel.app · If you did not request this, you can ignore this email.</p>' +
  '</div>';
}

module.exports = {
  REQUIRED, OPTIONAL, PROJECT_TYPES, LABELS,
  clean, merge, missing, estimateFor, runTurn,
  groqJSON, analysisPrompt, ANALYSIS_SCHEMA,
  plainText, ownerEmailHtml, visitorEmailHtml, esc, fromLabel
};
