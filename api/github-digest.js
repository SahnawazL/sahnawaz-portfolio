// api/github-digest.js — Vercel Serverless Function
//
// AI-generated "Weekly Recap" for the portfolio's "Recently Shipped" section.
// Takes the same real activity data /api/github-activity already computes,
// hands it to Groq (same provider + same GROQ_API_KEY as api/chat.js — no
// second AI provider, no second key, no second billing setup) and asks for
// a 1-2 sentence human summary of what Sahnawaz has actually been shipping —
// e.g. "This week: shipped the GitHub Pulse redesign to the portfolio, plus
// two fixes to YojanaSahay's admin dashboard."
//
// Kept as its OWN function (not folded into api/chat.js) because:
//   - api/chat.js enforces a single-user lock (isProcessing) for live
//     visitor chat — a digest generation must never compete with that or
//     get blocked by it.
//   - Different lifecycle: chat.js runs per-message, on-demand, for one
//     visitor at a time. This runs on a long shared cache (hours), for
//     every visitor.
//   - Different job: one narrow summarization task, not the full chatbot
//     personality + knowledge base — cheaper and faster to generate.
//
// Env vars:
//   GROQ_API_KEY   - same key already used by api/chat.js. No new secret
//                    needs to be added in Vercel → Settings → Environment
//                    Variables.
//
// Cost / rate-limit control (this never adds meaningful load to anything):
//   - Module-scope cache holds the last generated digest for DIGEST_TTL_MS.
//     Repeat requests inside that window return instantly with zero GitHub
//     or Groq calls.
//   - Even when the cache expires, if the underlying GitHub activity is
//     unchanged (same fingerprint) since the last generation, we just
//     extend the cache instead of calling Groq again — Groq is only ever
//     called when there is genuinely something new to summarize.
//   - In-flight de-duplication: if several requests land while a digest is
//     already being generated, they all await the SAME in-flight promise
//     instead of firing duplicate Groq calls.
//   - Vercel edge cache header on top, same pattern as github-activity.js.

const GITHUB_ACTIVITY_URL = 'https://sahnawaz-portfolio.vercel.app/api/github-activity';

let digestCache = { text: null, generatedAt: 0, fingerprint: null };
const DIGEST_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let pendingGeneration = null; // in-flight de-dupe, shared across concurrent requests

// Same model priority order as api/chat.js, so behaviour/quality stays
// consistent between the chatbot and the digest.
const MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3-32b'
];

const DIGEST_SYSTEM_PROMPT = `You write a short "Weekly Recap" caption for a developer's portfolio website, summarizing their real recent GitHub activity.

STRICT RULES:
- Write EXACTLY 1-2 sentences. Never more, never a list.
- Third person, confident, friendly tone — like a portfolio caption, not a commit log.
- Mention specific repo names and the KIND of work (feature, fix, new repo, docs, etc.) only when the data below actually supports it.
- NEVER invent details, numbers, or repo names that are not present in the activity list you are given.
- NO emojis, NO hashtags, NO markdown formatting, NO surrounding quotation marks.
- If the activity list is empty or very thin, write one honest, low-key sentence acknowledging a quieter stretch — do not fabricate activity to fill space.`;

function buildActivityPrompt(activity) {
  if (!activity || !activity.length) return 'No recent public GitHub activity was found.';
  return activity.slice(0, 12).map((a) => `- ${a.message}`).join('\n');
}

// Cheap fingerprint (no hashing library needed) so we can tell "nothing new
// happened" apart from "something changed" between requests.
function fingerprintActivity(activity) {
  if (!activity || !activity.length) return 'empty';
  return activity.slice(0, 5).map((a) => a.message).join('|');
}

// Non-AI fallback — used only if Groq itself is unreachable or misconfigured,
// so the card never shows a raw error or goes blank for a visitor.
function buildFallbackDigest(activity) {
  if (!activity || !activity.length) {
    return 'No new public GitHub activity in the latest window — check back soon.';
  }
  const repos = [...new Set(activity.map((a) => a.repo).filter(Boolean))].slice(0, 3);
  const repoList = repos.length > 1
    ? `${repos.slice(0, -1).join(', ')} and ${repos[repos.length - 1]}`
    : (repos[0] || 'a few projects');
  return `Recent activity includes ${activity.length} update${activity.length === 1 ? '' : 's'} across ${repoList}.`;
}

async function fetchActivitySnapshot() {
  const res = await fetch(GITHUB_ACTIVITY_URL, {
    signal: AbortSignal.timeout(4000)
  });
  if (!res.ok) throw new Error(`activity endpoint returned ${res.status}`);
  return res.json();
}

async function callGroq(apiKey, activity) {
  const messages = [
    { role: 'system', content: DIGEST_SYSTEM_PROMPT },
    { role: 'user', content: `Here is the recent GitHub activity:\n${buildActivityPrompt(activity)}\n\nWrite the Weekly Recap now.` }
  ];

  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 150,
          reasoning_effort: 'low'
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        lastErr = new Error(`Groq ${model} returned ${res.status}`);
        if (res.status !== 429) break; // only try the next model on a rate-limit
      }
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Groq models failed to return content');
}

async function generateDigest() {
  const activityData = await fetchActivitySnapshot();
  const activity = activityData?.activity || [];
  const fingerprint = fingerprintActivity(activity);

  // Nothing new since the last generation — reuse the existing text and
  // just refresh the cache's timestamp. Skips Groq entirely.
  if (digestCache.text && digestCache.fingerprint === fingerprint) {
    digestCache.generatedAt = Date.now();
    return digestCache.text;
  }

  const apiKey = process.env.GROQ_API_KEY;
  let text;
  if (!apiKey) {
    text = buildFallbackDigest(activity);
  } else {
    try {
      text = await callGroq(apiKey, activity);
    } catch (err) {
      console.warn('[github-digest] Groq generation failed, using fallback:', err && err.message);
      text = buildFallbackDigest(activity);
    }
  }

  digestCache = { text, generatedAt: Date.now(), fingerprint };
  return text;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const now = Date.now();
  const isFresh = digestCache.text && (now - digestCache.generatedAt) < DIGEST_TTL_MS;

  try {
    let text;
    if (isFresh) {
      text = digestCache.text;
    } else if (pendingGeneration) {
      // A generation is already in flight for another concurrent request —
      // piggyback on it instead of firing a duplicate Groq call.
      text = await pendingGeneration;
    } else {
      pendingGeneration = generateDigest();
      try {
        text = await pendingGeneration;
      } finally {
        pendingGeneration = null;
      }
    }

    return res.status(200).json({
      digest: text,
      generatedAt: new Date(digestCache.generatedAt || now).toISOString()
    });
  } catch (err) {
    console.error('[github-digest] fatal error:', err && err.message);
    // Last-resort fallback — generateDigest() already has its own internal
    // fallback, so this should basically never be reached.
    return res.status(200).json({
      digest: "Sahnawaz's GitHub activity updates live \u2014 check the Recently Shipped feed above for the latest.",
      generatedAt: new Date().toISOString()
    });
  }
};
