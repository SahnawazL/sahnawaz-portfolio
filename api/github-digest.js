// api/github-digest.js — Vercel Serverless Function
//
// AI-generated "Weekly Recap" for the portfolio's "Recently Shipped" section.
// Takes the same real activity data /api/github-activity already computes,
// hands it to Groq (same provider + same GROQ_API_KEY as api/chat.js — no
// second AI provider, no second key, no second billing setup) and asks for
// a short, technical, numbers-forward summary of what Sahnawaz has actually
// been shipping — e.g. "Signal spike this window: 9 pushes and 2 PRs landed
// across YojanaSahay and the portfolio, extending a 6-day streak against a
// 340-commit YTD baseline."
//
// v2 — STAT-DENSE / PREMIUM PASS:
//   - Every count in the recap is computed HERE, in plain JS, straight off
//     the same /api/github-activity payload the rest of the section renders
//     from (events by type, distinct repos touched, streak, YTD totals,
//     top language). Groq never invents or derives a number — it only gets
//     to phrase the ones it's handed. This is what lets the system prompt
//     safely demand specific figures without risking hallucinated stats.
//   - The prompt now asks for a terse, technical, "release-note" register
//     instead of a soft caption — the premium feel comes from precision and
//     restraint, not adjectives.
//   - The non-AI fallback (used when Groq/GROQ_API_KEY is unavailable) was
//     upgraded to the same stat-dense format, so even a total AI outage
//     still reads like a real status line instead of a placeholder.
//   - Fingerprinting now covers the computed signal block (not just the
//     first few raw messages), so the cache correctly busts when streaks/
//     YTD counters move even if the latest messages haven't changed.
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

const DIGEST_SYSTEM_PROMPT = `You write a "Weekly Recap" status line for a developer's portfolio website, summarizing their real recent GitHub activity.

VOICE: Premium engineering status line — think a terse release note or a CI build summary, not a casual caption. Confident, precise, third person. No fluff adjectives standing in for substance; let the numbers do the work.

STRICT RULES:
- Write EXACTLY 1-2 sentences. Never more, never a list, never a heading.
- You will be given a SIGNAL block with exact pre-computed counts (events by type, repos touched, streak, YTD totals, top language) and a list of raw activity messages. Ground the recap in that SIGNAL block — reference at least one concrete number from it (a count, a streak length, or a repo tally) rather than writing only in vague terms like "several updates."
- NEVER invent, round differently, or derive a number that is not explicitly present in the SIGNAL block or activity list. If a figure isn't given to you, don't state it.
- Mention specific repo names and the KIND of work (feature, fix, new repo, docs, release, etc.) only when the data actually supports it.
- NO emojis, NO hashtags, NO markdown formatting, NO surrounding quotation marks.
- If the SIGNAL block shows zero or near-zero recent events, write one honest, low-key sentence acknowledging a quieter stretch — you may still cite the streak/YTD numbers if given, but do not fabricate activity to fill space.`;

function buildActivityPrompt(activity) {
  if (!activity || !activity.length) return 'No recent public GitHub activity was found.';
  return activity.slice(0, 12).map((a) => `- ${a.message}`).join('\n');
}

// ── Signal block: every number Groq is allowed to use, computed here in
// plain JS from the same payload the page itself renders from. Nothing in
// this block is AI-derived, so the model can be told to quote it directly.
function buildSignalBlock(activityData) {
  const activity = (activityData && activityData.activity) || [];
  const pulse = activityData && activityData.pulse;
  const stats = activityData && activityData.stats;
  const languages = activityData && activityData.languages;

  const lines = [];

  if (activity.length) {
    const counts = { push: 0, pull_request: 0, issue: 0, release: 0, create_repo: 0 };
    const repos = new Set();
    activity.forEach((a) => {
      if (a.type && Object.prototype.hasOwnProperty.call(counts, a.type)) counts[a.type] += 1;
      if (a.repo) repos.add(a.repo);
    });
    const parts = [];
    if (counts.push) parts.push(`${counts.push} push${counts.push === 1 ? '' : 'es'}`);
    if (counts.pull_request) parts.push(`${counts.pull_request} PR update${counts.pull_request === 1 ? '' : 's'}`);
    if (counts.issue) parts.push(`${counts.issue} issue update${counts.issue === 1 ? '' : 's'}`);
    if (counts.release) parts.push(`${counts.release} release${counts.release === 1 ? '' : 's'}`);
    if (counts.create_repo) parts.push(`${counts.create_repo} new repo${counts.create_repo === 1 ? '' : 's'}`);
    lines.push(`WINDOW: ${activity.length} event${activity.length === 1 ? '' : 's'} across ${repos.size} repo${repos.size === 1 ? '' : 's'} (${repos.size ? Array.from(repos).slice(0, 5).join(', ') : 'none'})${parts.length ? ' — ' + parts.join(', ') : ''}.`);
  } else {
    lines.push('WINDOW: 0 events in the current window.');
  }

  if (pulse && (typeof pulse.currentStreak === 'number' || typeof pulse.totalContributions === 'number')) {
    const streakBits = [];
    if (typeof pulse.currentStreak === 'number') streakBits.push(`current streak ${pulse.currentStreak} day${pulse.currentStreak === 1 ? '' : 's'}`);
    if (typeof pulse.longestStreak === 'number') streakBits.push(`longest ${pulse.longestStreak} day${pulse.longestStreak === 1 ? '' : 's'}`);
    if (typeof pulse.totalContributions === 'number') streakBits.push(`${pulse.totalContributions} all-time contributions`);
    if (streakBits.length) lines.push(`STREAK: ${streakBits.join(', ')}.`);
  }

  if (stats && (stats.commits || stats.pullRequests || stats.issues || stats.repos)) {
    const y = new Date().getFullYear();
    lines.push(`YTD ${y}: ${stats.commits || 0} commits, ${stats.pullRequests || 0} PRs, ${stats.issues || 0} issues, ${stats.repos || 0} repos.`);
  }

  if (languages && languages.length) {
    const top = languages[0];
    lines.push(`TOP LANGUAGE: ${top.name} at ${top.percent}% of recent code.`);
  }

  return lines.join('\n');
}

// Cheap fingerprint (no hashing library needed) so we can tell "nothing new
// happened" apart from "something changed" between requests. Covers both
// the raw messages AND the computed signal block, since the recap now
// depends on streak/YTD counters that can move independently of the
// latest messages.
function fingerprintActivity(activity, signalBlock) {
  const msgPart = (!activity || !activity.length) ? 'empty' : activity.slice(0, 5).map((a) => a.message).join('|');
  return `${msgPart}::${signalBlock}`;
}

// Non-AI fallback — used only if Groq itself is unreachable or misconfigured,
// so the card never shows a raw error or goes blank for a visitor. Kept in
// the same stat-dense register as the AI output so a Groq outage doesn't
// visibly downgrade the card.
function buildFallbackDigest(activityData) {
  const activity = (activityData && activityData.activity) || [];

  if (!activity.length) {
    // Still surface streak/all-time numbers if we have them, instead of a
    // bare "no activity" placeholder.
    const pulse = activityData && activityData.pulse;
    if (pulse && typeof pulse.currentStreak === 'number' && typeof pulse.totalContributions === 'number') {
      return `No new public GitHub events in the current window — streak holding at ${pulse.currentStreak} day${pulse.currentStreak === 1 ? '' : 's'} against ${pulse.totalContributions} all-time contributions.`;
    }
    return 'No new public GitHub activity in the latest window — check back soon.';
  }

  const repos = [...new Set(activity.map((a) => a.repo).filter(Boolean))].slice(0, 3);
  const repoList = repos.length > 1
    ? `${repos.slice(0, -1).join(', ')} and ${repos[repos.length - 1]}`
    : (repos[0] || 'a few projects');

  const stats = activityData && activityData.stats;
  const ytd = stats && (stats.commits || stats.pullRequests || stats.issues || stats.repos)
    ? ` YTD: ${stats.commits || 0} commits, ${stats.pullRequests || 0} PRs across ${stats.repos || 0} repos.`
    : '';

  return `${activity.length} event${activity.length === 1 ? '' : 's'} logged this window across ${repoList}.${ytd}`;
}

async function fetchActivitySnapshot() {
  const res = await fetch(GITHUB_ACTIVITY_URL, {
    signal: AbortSignal.timeout(4000)
  });
  if (!res.ok) throw new Error(`activity endpoint returned ${res.status}`);
  return res.json();
}

async function callGroq(apiKey, activity, signalBlock) {
  const messages = [
    { role: 'system', content: DIGEST_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `SIGNAL (pre-computed, exact — use these numbers, invent none):\n${signalBlock}\n\nRAW ACTIVITY MESSAGES (for repo/work context only, not for extra counting):\n${buildActivityPrompt(activity)}\n\nWrite the Weekly Recap now.`
    }
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
          max_tokens: 180,
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
  const signalBlock = buildSignalBlock(activityData);
  const fingerprint = fingerprintActivity(activity, signalBlock);

  // Nothing new since the last generation — reuse the existing text and
  // just refresh the cache's timestamp. Skips Groq entirely.
  if (digestCache.text && digestCache.fingerprint === fingerprint) {
    digestCache.generatedAt = Date.now();
    return digestCache.text;
  }

  const apiKey = process.env.GROQ_API_KEY;
  let text;
  if (!apiKey) {
    text = buildFallbackDigest(activityData);
  } else {
    try {
      text = await callGroq(apiKey, activity, signalBlock);
    } catch (err) {
      console.warn('[github-digest] Groq generation failed, using fallback:', err && err.message);
      text = buildFallbackDigest(activityData);
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
