// api/chat.js — Vercel Serverless Function
// Groq AI powered assistant for Sahnawaz Ahmed Laskar's portfolio
// Primary model: openai/gpt-oss-120b (free tier, 8K TPM / 200K TPD) + auto-fallback
// Upgrades: conversation memory, intent detection, name memory,
//           language auto-detect, spam filter, question logging
// Knowledge: added "What he doesn't offer" + "Current Focus 2025-2026"
// Concurrency: small per-instance cap (MAX_IN_FLIGHT), always released in `finally`

// ── Concurrency cap ─────────────────────────────────────────────────────────
// Previously a single boolean lock allowed only ONE chat request per warm
// instance, so a second visitor chatting at the same moment was turned away,
// and any uncaught exception left the lock stuck until the instance recycled.
// Now: a small counter (a few requests at once is well inside Groq's free-tier
// RPM) that is ALWAYS released in the wrapper's `finally`, crash or not.
const MAX_IN_FLIGHT = 3;
let inFlight = 0;

// ── LIVE YOJANASAHAY STATS ───────────────────────────────────────────────────
// The knowledge base used to hardcode "3,000+ schemes" for YojanaSahay, which
// drifted out of date as the real catalog (and its verification data) grew
// and changed. This fetches the same public /api/stats endpoint the portfolio
// site's project card uses, so the chatbot always cites the current real
// numbers instead of a stale guess.
//
// Cached at module scope for YOJANA_STATS_TTL_MS so a burst of chat messages
// in the same warm Vercel instance doesn't refetch on every single message —
// the underlying numbers only change roughly once a day anyway (daily cron).
// A short fetch timeout + try/catch means a slow or dead endpoint NEVER
// delays or breaks a chat reply — it just falls back to a safe static line.
let yojanaStatsCache = { data: null, fetchedAt: 0 };
const YOJANA_STATS_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getYojanaSahayLiveStats() {
  const now = Date.now();
  if (yojanaStatsCache.data && (now - yojanaStatsCache.fetchedAt) < YOJANA_STATS_TTL_MS) {
    return yojanaStatsCache.data;
  }
  try {
    const res = await fetch('https://yojanasahay.vercel.app/api/stats', {
      signal: AbortSignal.timeout(2500) // never let a slow endpoint delay a chat reply for long
    });
    if (!res.ok) throw new Error(`bad status ${res.status}`);
    const data = await res.json();
    if (typeof data.schemeCount === 'number' && typeof data.linkHealthPercent === 'number') {
      yojanaStatsCache = { data, fetchedAt: now };
      return data;
    }
    throw new Error('missing expected fields');
  } catch (err) {
    console.warn('[chat] YojanaSahay live stats fetch failed, using static fallback:', err && err.message);
    return null; // caller falls back to a fixed, still-accurate static line
  }
}

// ── LIVE GITHUB ACTIVITY ("Recently Shipped") ────────────────────────────────
// Same self-referential pattern as getYojanaSahayLiveStats() above: the
// portfolio's own /api/github-activity endpoint (already cached there via
// s-maxage=600, stale-while-revalidate=1800) is fetched here so the chatbot
// can talk about what Sahnawaz has actually shipped lately — instead of a
// static, always-drifting list. Cached at module scope so a burst of chat
// messages on the same warm Vercel instance doesn't refetch every time; the
// underlying feed only changes as often as Sahnawaz pushes commits anyway.
// A short fetch timeout + try/catch means a slow or dead endpoint NEVER
// delays or breaks a chat reply — it just falls back to a safe static line.
// Knowledge retrieval: send only the sections relevant to each question
// instead of the full ~6,700-token base every time. lib/ lives outside /api
// so it does not count against Vercel's function limit — it is bundled into
// this function.
const { buildKnowledge } = require('../lib/site-knowledge');
const projectBrief = require('../lib/project-brief');

let githubActivityCache = { data: null, fetchedAt: 0 };
const GITHUB_ACTIVITY_TTL_MS = 30 * 60 * 1000; // 30 minutes — the feed only changes when he pushes

async function getGithubActivitySnapshot() {
  const now = Date.now();
  if (githubActivityCache.data && (now - githubActivityCache.fetchedAt) < GITHUB_ACTIVITY_TTL_MS) {
    return githubActivityCache.data;
  }
  // The activity endpoint is heavy (GitHub API + streak + language
  // aggregation), so a single 2.5s attempt frequently timed out on a cold
  // start — which is why the assistant kept saying "GitHub data is
  // temporarily unavailable" even though the data exists. Two attempts with
  // a longer budget on the first, plus serving the last cached copy rather
  // than nothing, makes the streak reliably available.
  const attempt = (ms) => fetch('https://sahnawaz-portfolio.vercel.app/api/github-activity', {
    signal: AbortSignal.timeout(ms)
  }).then((res) => {
    if (!res.ok) throw new Error(`bad status ${res.status}`);
    return res.json();
  });

  try {
    let data;
    try {
      data = await attempt(6000);            // first try: generous, covers a cold start
    } catch (first) {
      console.warn('[chat] GitHub activity first attempt failed, retrying:', first && first.message);
      data = await attempt(4000);            // one quick retry
    }
    githubActivityCache = { data, fetchedAt: now };
    return data;
  } catch (err) {
    console.warn('[chat] GitHub activity fetch failed:', err && err.message);
    // If we ever fetched it successfully before, a slightly stale snapshot
    // (streak, commits) is far better than "unavailable". Only fall back to
    // the static line when we have never had any data at all.
    if (githubActivityCache.data) {
      console.warn('[chat] serving last cached GitHub snapshot instead of failing');
      return githubActivityCache.data;
    }
    return null;
  }
}

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Private terminal commands — tiny lookup, no AI call, so no concurrency slot
  if (req.body && req.body.source === 'terminal') return handleTerminal(req, res);

  if (inFlight >= MAX_IN_FLIGHT) {
    res.setHeader('Retry-After', '2');
    return res.status(429).json({ busy: true, reply: "I'm answering a few people at once — give me a second and try again! 😊" });
  }
  inFlight++;
  try {
    return await handleChat(req, res);
  } catch (err) {
    console.error('[chat] unhandled error:', err);
    if (!res.headersSent) {
      return res.status(200).json({
        reply: "Something went wrong! 😅 Contact Sahnawaz at shzthedigitalalchemist@gmail.com"
      });
    }
  } finally {
    inFlight--;
  }
};

async function handleChat(req, res) {
  const { message, history = [], visitorName = null, visitorActivity = null, source = null, visitorType = null } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'No message received.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  const trimmed = message.trim();

  // ── PROJECT BRIEF AGENT — one conversation turn ─────────────────────────
  // The AI extracts brief details from what the visitor wrote and asks for
  // what's missing; lib/project-brief.js decides completeness and validity.
  if (source === 'brief') {
    try {
      const out = await projectBrief.runTurn(apiKey, {
        message: trimmed,
        brief: req.body.brief,
        known: req.body.known,
        history: req.body.briefHistory
      });
      return res.status(200).json(out);
    } catch (e) {
      console.error('[brief] turn failed:', e && e.message);
      return res.status(200).json({ error: true, reply: "Sorry, I lost my train of thought there — could you say that again?" });
    }
  }

  // ── WIZARD FAST-PATH ────────────────────────────────────────────────────
  // Called by the contact form pre-screen wizard. Uses a lean system prompt
  // (no full knowledge base), strict 2-sentence cap, strips [CAT:] tags.
  if (source === 'wizard') {
    const wizardSystem = `You are the AI assistant on Sahnawaz Ahmed Laskar's portfolio website.
A visitor just answered 3 quick questions about their project. Give them an instant price estimate.

Sahnawaz's pricing:
- Website / Landing Page: ₹9,999 – ₹14,999 | delivery 2–3 weeks
- Portfolio Website: ₹6,999 – ₹9,999 | delivery 1–2 weeks
- E-Commerce Store: ₹14,999 – ₹24,999 | delivery 3–5 weeks
- UI/UX Design (Figma): ₹3,999/screen | delivery 1–2 weeks
- AI Integration: ₹2,999 – ₹7,999 | delivery 1–3 weeks
- Something Else / Custom: Custom quote | delivery varies

STRICT RULES:
- Reply in EXACTLY 2 sentences. No more.
- Sentence 1: State the estimated price range and delivery time for their specific project type. Be confident and specific.
- Sentence 2: Invite them to fill the form below for a personalised quote from Sahnawaz directly.
- Do NOT use [CAT:] tags. Do NOT use bullet points. Do NOT use headers. Plain warm text only.
- Do NOT pad with extra sentences, disclaimers, or explanations.`;

    try {
      const wizRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: wizardSystem },
            { role: 'user',   content: trimmed }
          ],
          temperature: 0.6,
          max_tokens: 400,
          reasoning_effort: 'low'
        })
      });

      if (wizRes.ok) {
        const wizData = await wizRes.json();
        let wizReply = wizData?.choices?.[0]?.message?.content?.trim() || null;
        if (wizReply) {
          // Strip any [CAT:...] tags just in case (all variants)
          wizReply = wizReply.replace(/\*{0,2}\[?(?:CAT|KAT|CATEGORY):[\w]+\]?\*{0,2}[\s\n]*/gi, '').trim();
          return res.status(200).json({ reply: wizReply });
        } else {
          console.error('[wizard] Groq returned no content:', JSON.stringify(wizData));
        }
      } else {
        const errBody = await wizRes.text().catch(() => '');
        console.error('[wizard] Groq request failed:', wizRes.status, errBody);
      }
    } catch(e) {
      console.error('[wizard] fetch threw:', e && e.message);
    }

    // Wizard fallback — should rarely trigger
    return res.status(200).json({
      reply: "Based on your selections, Sahnawaz will have an accurate quote ready for you — just fill in the form below and he'll reply within 24 hours! 🚀"
    });
  }
  // ── END WIZARD FAST-PATH ────────────────────────────────────────────────

  // ── SMART GREETING HANDLER ──────────────────────────────────────────────
  // Bypasses spam filter and knowledge base. Generates unique personalised
  // greeting every time using visitor activity data.
  if (trimmed.startsWith('__GREETING__:')) {
    const va = visitorActivity || {};
    const name = visitorName || 'there';
    const h = (req.body.clientHour !== undefined && req.body.clientHour >= 0 && req.body.clientHour <= 23)
      ? req.body.clientHour
      : new Date().getHours();
    const timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';

    const greetingSystemPrompt = `You are a warm, witty personal AI assistant on Sahnawaz Ahmed Laskar's portfolio website.
Your ONLY job right now is to generate a short, unique, personalised welcome-back greeting for a returning visitor.

Rules:
- 2-3 lines MAX. No long paragraphs.
- Use their name naturally.
- Reference their specific past activity (liked projects, resume, review, chat count) warmly and naturally.
- The current time of day is: ${timeOfDay}. You MUST use exactly this word — do NOT guess, override, or infer the time yourself under any circumstances.
- Use 1-2 emojis naturally.
- Every greeting must feel fresh — never repeat the same phrasing.
- Do NOT add [CAT:] tags. Do NOT end with a question. Just greet warmly.
- Do NOT say "How can I assist you" — too generic.
- Sound like a friendly human assistant, not a robot.`;

    const greetingUserPrompt = `Generate a welcome-back greeting for this visitor:
- Name: ${name}
- Time of day: ${timeOfDay}
- Projects they liked: ${va.likedProjects && va.likedProjects.length > 0 ? va.likedProjects.join(', ') : 'none yet'}
- Downloaded resume: ${va.resumeDownloaded ? 'Yes' : 'No'}
- Left a review: ${va.reviewSubmitted ? 'Yes, ' + va.reviewSubmitted.stars + ' stars' : 'No'}
- Total messages sent before: ${va.totalChats || 0}

Generate ONE unique greeting now. Be creative, warm, and personal.`;

    try {
      const greetRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: greetingSystemPrompt },
            { role: 'user',   content: greetingUserPrompt }
          ],
          temperature: 0.95,
          max_tokens: 400,
          reasoning_effort: 'low'
        })
      });

      if (greetRes.ok) {
        const greetData = await greetRes.json();
        const greetReply = greetData?.choices?.[0]?.message?.content?.trim() || null;
        if (greetReply) {
          return res.status(200).json({ reply: greetReply });
        } else {
          console.error('[greeting] Groq returned no content:', JSON.stringify(greetData));
        }
      } else {
        const errBody = await greetRes.text().catch(() => '');
        console.error('[greeting] Groq request failed:', greetRes.status, errBody);
      }
    } catch(e) {
      console.error('[greeting] fetch threw:', e && e.message);
    }

    // Fallback if API fails
    const fallbacks = [
      `Welcome back, ${name}! 😊 Great to see you again — I'm here whenever you need me.`,
      `Hey ${name}! 👋 Good ${timeOfDay} — glad you're back. What's on your mind?`,
      `Good ${timeOfDay}, ${name}! 🌟 Always a pleasure. Ask me anything about Sahnawaz's work!`
    ];
    return res.status(200).json({ reply: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
  }
  // ── END SMART GREETING HANDLER ──────────────────────────────────────────

  // ── UPGRADE 5: Spam / abuse filter ─────────────────────────────────────

  const isGibberish = trimmed.length < 2
    || /^(.)\1{5,}$/.test(trimmed)                          // "aaaaaaa"
    || /^[^a-zA-Z0-9\u0900-\u09FF\u0980-\u09FF ]{4,}$/.test(trimmed); // pure symbols

  const isAbusive = /\b(fuck|shit|bastard|idiot|stupid|moron|asshole|bitch|damn you)\b/i.test(trimmed);

  if (isGibberish) {
    return res.status(200).json({ reply: "Hmm, I didn't quite catch that 😄 Try asking me something about Sahnawaz!" });
  }
  if (isAbusive) {
    return res.status(200).json({ reply: "Hey, let's keep it friendly! 😊 I'm here to help — ask me anything about Sahnawaz's work." });
  }

  // ── UPGRADE 3: Intent detection ────────────────────────────────────────
  const msgLower = trimmed.toLowerCase();

  const intent =
    /price|cost|rate|charge|fee|budget|how much|₹|rs\.|rupee|package|quote/i.test(msgLower)   ? 'pricing'   :
    /hire|job|work with|collaboration|available|freelance|project|contract|recruit/i.test(msgLower) ? 'hiring'    :
    /contact|email|whatsapp|phone|reach|connect|instagram|linkedin/i.test(msgLower)             ? 'contact'   :
    /skill|tech|stack|language|framework|tools|experience|expert/i.test(msgLower)               ? 'skills'    :
    /hi|hello|hey|sup|yo|good morning|good evening|good night|salaam|namaste/i.test(msgLower)   ? 'greeting'  :
    'general';

  const intentHint =
    intent === 'pricing'  ? 'The visitor is asking about pricing — be clear, confident, highlight value.' :
    intent === 'hiring'   ? 'The visitor may be a recruiter or client — stay professional and impressive.' :
    intent === 'contact'  ? 'The visitor wants to get in touch — share contact info clearly and warmly.'  :
    intent === 'skills'   ? 'The visitor is curious about technical skills — be specific and confident.'   :
    intent === 'greeting' ? 'The visitor is just saying hi — be warm, fun and welcoming.'                 :
    '';

  // ── Visitor type (chosen in the chat: "What brings you here?") ──────────
  const VISITOR_TYPE_HINTS = {
    recruiter: 'The visitor said they are a RECRUITER / hiring. Stay professional. Lead with experience, skills and that he is open to full-time roles. When it fits, offer [[go:send-resume|📄 Email me his resume]].',
    client:    'The visitor said they HAVE A PROJECT (potential client). Focus on what they want built, pricing and timelines, and ask one short question about their project when useful. When they are ready to move forward, offer [[go:brief|📝 Plan my project with AI]] (you collect their project details and send Sahnawaz a brief with a typical price range); [[go:send-message|📧 Message Sahnawaz]] is the alternative.',
    browsing:  'The visitor said they are JUST BROWSING. Keep it light, friendly and short; show off his work and the fun parts of the site.'
  };
  const visitorTypeHint = VISITOR_TYPE_HINTS[visitorType] || '';

  // ── SITE COMMAND DETECTION (client-side execution, zero extra tokens) ─────
  // Detects natural language requests to control the portfolio site.
  // Returns a `command` field in the JSON response — frontend executes it.
  // NO AI call needed for commands — instant response, saves tokens entirely.

  const siteCommand =
    /\b(turn on|enable|activate|start|switch on|open)\b.{0,25}\b(hacker|retro|matrix|terminal|green)\b/i.test(msgLower)  ? 'hacker_on'       :
    /\b(turn off|disable|deactivate|stop|close|exit|switch off)\b.{0,25}\b(hacker|retro|matrix|terminal|green)\b/i.test(msgLower) ? 'hacker_off'      :
    /\b(hacker|retro|matrix|terminal)\b.{0,20}\b(on|enable|activate|start)\b/i.test(msgLower)                              ? 'hacker_on'       :
    /\b(hacker|retro|matrix|terminal)\b.{0,20}\b(off|disable|deactivate|stop)\b/i.test(msgLower)                           ? 'hacker_off'      :
    /\b(toggle|switch)\b.{0,20}\b(hacker|retro|matrix|terminal)\b/i.test(msgLower)                                         ? 'hacker_toggle'   :
    /\b(open|show|display|launch)\b.{0,20}\b(code|laptop|popup|typing)\b/i.test(msgLower)                                  ? 'open_code_popup' :

    null;

  // If a site command is detected → reply instantly, skip AI call entirely
  if (siteCommand) {
    const commandReplies = {
      hacker_on:       "[CAT:general] Activating **Retro Hacker Mode** 🟢 Welcome to the matrix, agent 😎",
      hacker_off:      "[CAT:general] Retro Hacker Mode **deactivated** 🔴 Back to normal — clean & premium ✨",
      hacker_toggle:   "[CAT:general] **Toggling** Retro Hacker Mode ⚡ Switching dimensions...",
      open_code_popup: "[CAT:general] Opening the **code popup** 💻 Here's Sahnawaz typing live...",
    };

    console.log(JSON.stringify({
      log: 'site_command', command: siteCommand,
      q: trimmed.slice(0, 80), t: new Date().toISOString()
    }));

    return res.status(200).json({
      reply:   commandReplies[siteCommand],
      command: siteCommand   // ← frontend reads this and executes
    });
  }

  // ── UPGRADE 4: Language detection (Script + Roman/Transliterated) ────────
  const isHindi   = /[\u0900-\u097F]/.test(trimmed);
  const isBengali = /[\u0980-\u09FF]/.test(trimmed);

  // Roman Hindi detection — common words typed in English letters
  const romanHindiWords = /\b(kya|hai|hain|kaise|kaisa|kaisi|kyun|kyunki|nahi|nahin|haan|acha|accha|theek|thik|bhai|yaar|dost|mujhe|tumhe|aapko|mera|tera|uska|karo|karna|karein|batao|bataye|chahiye|chahta|chahti|milna|milega|milegi|shukriya|dhanyavad|namaste|kahan|kidhar|kitna|kitne|abhi|kal|aaj|raat|subah|din|waqt|samay|paise|rupaye|kaam|kab|kaun|kuch|sab|bahut|thoda|zyada|bilkul|zaroor|matlab|seedha|seedhe|bolo|bata|dekho|suno|lena|dena|kar|raha|rahi|rahe|ho|hoon|hun)\b/i.test(trimmed);

  // Roman Bengali detection — stronger & more unique Bengali words
  const romanBengaliWords = /\b(kemon|achho|achhen|tumi|apni|amra|tomra|apnara|hya|bol|bolen|jao|janen|aso|asen|koro|koren|khub|bhalo|kothay|kothai|dao|den|nao|nen|pabo|paben|hobe|jonno|kaj|korcho|korchen|bolcho|bolchen|jaccho|jacchen|ascho|aschen|khaccho|khacchen|dekho|dekhen|shuno|shunen|thako|thaken|jani|janina|bujhi|bujhina|achhi|nachi|parbo|parben|lagbe|lagche|hoyeche|hoini|geche|gechi|niye|diye|kore|hole|thakle|gele|porte|bolte|korte|jete|ashte|dekhte|shunte)\b/i.test(trimmed);

  // Score both to pick the stronger match when message has mixed words
  const hindiScore   = (trimmed.match(/\b(kya|hai|hain|kaise|nahi|haan|acha|theek|bhai|yaar|mujhe|aapko|mera|karo|batao|chahiye|abhi|aaj|kaam|bahut|thoda|kar|raha|rahi|ho|hoon)\b/gi) || []).length;
  const bengaliScore = (trimmed.match(/\b(kemon|achho|tumi|apni|amra|hya|koro|bhalo|kothay|dao|jonno|kaj|korcho|bolcho|jaccho|ascho|lagbe|lagche|hoyeche|porte|korte|jete|ashte)\b/gi) || []).length;

  const langHint =
    isHindi   ? 'The visitor is writing in Hindi script — reply naturally in Hindi script.' :
    isBengali ? 'The visitor is writing in Bengali script — reply naturally in Bengali script.' :
    (bengaliScore > 0 && bengaliScore >= hindiScore)
              ? 'The visitor is writing in Roman Bengali (Bengali typed in English letters e.g. "kemon achho", "ki korcho", "jonno kaj koro"). Reply ONLY in Roman Bengali matching their exact style. Do NOT use Hindi, do NOT use Bengali script, do NOT use English.' :
    romanHindiWords
              ? 'The visitor is writing in Roman Hindi (Hindi typed in English letters e.g. "kya haal hai", "kaise ho", "batao"). Reply ONLY in Roman Hindi matching their exact style. Do NOT use Bengali, do NOT use Hindi script, do NOT use English.' :
    romanBengaliWords
              ? 'The visitor is writing in Roman Bengali (Bengali typed in English letters). Reply ONLY in Roman Bengali matching their exact style.' :
    '';

  // ⚠️ IMPORTANT: Detect language from the CURRENT message only — not from history.
  // If the visitor switches language mid-conversation, switch immediately to match them.

  // ── UPGRADE 2: Visitor name personalisation ────────────────────────────
  const nameHint = visitorName
    ? `The visitor's name is ${visitorName} — use their name naturally and warmly in replies.`
    : '';

  // ── UPGRADE 7: Visitor activity context personalisation ──────────────────
  let visitorActivityHint = '';
  if (visitorActivity && typeof visitorActivity === 'object') {
    const va = visitorActivity;
    const lines = ['--- VISITOR ACTIVITY CONTEXT (use this to personalise replies) ---'];
    if (va.name)  lines.push(`Visitor's name: ${va.name}`);
    if (va.email) lines.push(`Visitor's email: ${va.email}`);
    if (va.likedProjects && va.likedProjects.length > 0)
      lines.push(`Projects they liked: ${va.likedProjects.join(', ')}`);
    else
      lines.push('They have not liked any projects yet.');
    lines.push(`Downloaded/viewed resume: ${va.resumeDownloaded ? 'Yes' : 'No'}`);
    if (va.reviewSubmitted)
      lines.push(`Left a review: Yes — ${va.reviewSubmitted.stars} stars. Text: "${va.reviewSubmitted.text}"`);
    else
      lines.push('Has not submitted a review yet.');
    lines.push(`Total chat messages sent: ${va.totalChats || 0}`);
    lines.push('Use this naturally to personalise replies. Examples:');
    lines.push('- Liked projects → acknowledge it warmly: "You already liked [X], great taste! 😄"');
    lines.push('- Downloaded resume → "You even grabbed his CV — a strong sign! 📄"');
    lines.push('- Left 5-star review → "You gave him 5 stars — you clearly think so! 😄"');
    lines.push('- Returning user (totalChats > 0) → "Welcome back! Great to see you again 😊"');
    lines.push('- First visit (totalChats = 0) → greet them fresh and warmly.');
    visitorActivityHint = lines.join('\n');
  }

  // ── Live YojanaSahay stats — fetched once here, used in KNOWLEDGE below ──
  const yojanaStats = await getYojanaSahayLiveStats();
  const yojanaSchemesLine = yojanaStats
    ? `Covers: ${yojanaStats.schemeCount.toLocaleString('en-IN')}+ Central and State government schemes tracked (${yojanaStats.linkHealthPercent}% of links currently verified live) across every state in India`
    : 'Covers: 1,116+ Central and State government schemes across every state in India';

  // ── Live GitHub activity snapshot — fetched once here, used in KNOWLEDGE below ──
  const githubSnapshot = await getGithubActivitySnapshot();
  let recentShippedLine;
  if (githubSnapshot) {
    const items = (githubSnapshot.activity || []).slice(0, 5).map(a => `- ${a.message}`).join('\n');
    const pulse = githubSnapshot.pulse;
    const stats = githubSnapshot.stats;
    const pulseLine = pulse
      ? `Streak: ${pulse.currentStreak} day(s) current, ${pulse.longestStreak} day(s) longest | All-time contributions: ${pulse.totalContributions.toLocaleString('en-IN')}`
      : '';
    const statsLine = stats
      ? `This year so far: ${stats.commits} commits, ${stats.pullRequests} pull requests, ${stats.issues} issues, across ${stats.repos} repositories`
      : '';
    recentShippedLine = [
      items || 'No recent public GitHub activity found.',
      pulseLine,
      statsLine
    ].filter(Boolean).join('\n');
  } else {
    recentShippedLine = 'Live GitHub data is temporarily unavailable right now — Sahnawaz ships regularly across his portfolio, StudyLens AI, and YojanaSahay.';
  }

  // ── KNOWLEDGE BASE ─────────────────────────────────────────────────────
  // Retrieve only the sections this question needs. Core sections (persona,
  // formatting rules, identity, contact, deep-links) always go; topic
  // sections are matched against the question and the last few turns, so a
  // follow-up like "and how much for that?" keeps its topic. The live values
  // below are injected into the section placeholders exactly as the old
  // inline template used them.
  const recentTurns = Array.isArray(history)
    ? history.slice(-4).map(m => String(m && m.content || '')).join(' ')
    : '';

  const retrieved = buildKnowledge(trimmed, recentTurns, {
    intentHint: [intentHint ? `INTENT HINT: ${intentHint}` : '', visitorTypeHint ? `VISITOR TYPE: ${visitorTypeHint}` : ''].filter(Boolean).join('\n'),
    langHint: langHint ? `LANGUAGE HINT: ${langHint}` : '',
    nameHint: nameHint ? `VISITOR HINT: ${nameHint}` : '',
    visitorActivityHint: visitorActivityHint || '',
    yojanaSchemesLine: yojanaSchemesLine || '',
    recentShippedLine: recentShippedLine || ''
  });

  const KNOWLEDGE = retrieved.text;
  console.log('[chat] knowledge ' + retrieved.tokens + ' tokens \u00b7 ' + retrieved.used.join(', '));

  // ── UPGRADE 1: Conversation history ───────────────────────────────────
  // Accept last 8 messages from frontend, trim to avoid token overflow
  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 500) // cap each message at 500 chars
      }))
    : [];

  const messages = [
    { role: 'system',    content: KNOWLEDGE },
    ...safeHistory,
    { role: 'user',      content: trimmed }
  ];

  // ── Models in priority order ───────────────────────────────────────────
  // Updated Aug 2026: llama-4-scout / llama-3.3-70b-versatile / llama-3.1-8b-instant
  // were all deprecated by Groq (see console.groq.com/docs/deprecations).
  // Replaced with their official recommended, free-tier successors.
  const MODELS = [
    'openai/gpt-oss-120b',   // Primary: strong quality, 30 RPM / 8K TPM / 200K TPD (free)
    'openai/gpt-oss-20b',    // Fallback 1: fastest (1000 TPS), 30 RPM / higher TPD (free)
    'qwen/qwen3-32b'         // Fallback 2: safety net, 60 RPM / 6K TPM (free)
  ];

  // Reasoning models spend part of max_tokens on hidden "thinking". Without a
  // cap, a long think could use the whole budget and return EMPTY content,
  // which used to surface as the generic "please reach Sahnawaz" fallback.
  // gpt-oss: keep reasoning low (same as the greeting/wizard calls).
  // qwen3:   turn thinking off, otherwise <think>…</think> lands in the reply.
  const reasoningFor = (model) =>
    model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } :
    model.startsWith('qwen/')          ? { reasoning_effort: 'none' } :
    {};

  const callGroq = async (model) => {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.75,
        max_tokens: 1000,
        ...reasoningFor(model)
      })
    });
  };

  const cleanContent = (text) => String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')   // safety net for any leaked reasoning
    .trim();

  try {
    let reply = null, lastError = null;

    // Try each model in order. Move on to the next one when a model is rate
    // limited (429), the provider has a server error (5xx), or the model
    // returned an empty reply. Other 4xx errors are request problems that the
    // next model would hit too, so stop there.
    for (const model of MODELS) {
      let groqRes;
      try {
        groqRes = await callGroq(model);
      } catch (netErr) {
        lastError = { network: netErr && netErr.message };
        console.warn(`Model ${model} network error:`, netErr && netErr.message);
        continue;
      }

      if (groqRes.ok) {
        const data = await groqRes.json().catch(() => null);
        const content = cleanContent(data?.choices?.[0]?.message?.content);
        if (content) { reply = content; break; }
        lastError = { empty: true, finish: data?.choices?.[0]?.finish_reason };
        console.warn(`Model ${model} returned an empty reply (finish_reason: ${lastError.finish})`);
        continue;
      }

      const errData = await groqRes.json().catch(() => ({}));
      lastError = errData;
      console.warn(`Model ${model} failed (${groqRes.status}):`, errData?.error?.code);
      if (groqRes.status !== 429 && groqRes.status < 500) break;
    }

    if (!reply) {
      console.error('All models failed:', lastError);
      return res.status(200).json({
        reply: "I'm having a small hiccup right now! 😊 Try again in a moment, or reach Sahnawaz at shzthedigitalalchemist@gmail.com"
      });
    }

    // Strip ALL [CAT:...] tag variants from reply — used internally for intent routing,
    // should never be visible to visitors. Handles: [CAT:x], **[CAT:x]**, **CAT:x**, CAT:x
    // anywhere in the text (AI sometimes embeds them mid-response or wraps in bold).
    reply = reply.replace(/\*{0,2}\[?(?:CAT|KAT|CATEGORY):[\w]+\]?\*{0,2}[\s\n]*/gi, '').trim();

    // ── Offer the right in-chat action when the visitor clearly wants one ──
    // The model is asked to add these chips itself; this makes sure a visitor
    // who says "I want to hire him" always gets a one-tap way to act on it.
    // The chip goes FIRST so the page's two-chip limit never drops it.
    const flowChip = pickFlowChip(trimmed);
    if (flowChip && !/\[\[go:(send-message|send-resume|callback|brief)\|/i.test(reply)) {
      reply = flowChip + '\n' + reply;
    }

    // ── UPGRADE 6: Question logging ──────────────────────────────────────
    // Logs intent + question (no personal data) for knowledge base improvement
    console.log(JSON.stringify({
      log:    'chat_question',
      intent,
      lang:   isHindi ? 'hi' : isBengali ? 'bn' : 'en',
      q:      trimmed.slice(0, 120),  // truncate for privacy
      t:      new Date().toISOString()
    }));

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({
      reply: "Something went wrong! 😅 Contact Sahnawaz at shzthedigitalalchemist@gmail.com"
    });
  }
}

// ── PRIVATE TERMINAL COMMANDS ───────────────────────────────────────────────
// Personal easter eggs for the retro terminal (family names etc.) are NOT in
// the repo or the page. They live in the Vercel environment variable
// TERMINAL_EGGS as JSON:
//   { "<command>": { "lines": ["..."], "style": "seq", "effect": "hearts" },
//     "<public command>": { "variants": [["...", "..."]] } }
// The terminal asks here only when someone types a command it doesn't know,
// so the list of names can't be read from the site's code. Changing the
// variable in Vercel needs a redeploy to take effect.
let terminalEggs = null;
function loadTerminalEggs() {
  if (terminalEggs) return terminalEggs;
  try {
    terminalEggs = process.env.TERMINAL_EGGS ? JSON.parse(process.env.TERMINAL_EGGS) : {};
  } catch (e) {
    console.error('[terminal] TERMINAL_EGGS is not valid JSON:', e && e.message);
    terminalEggs = {};
  }
  return terminalEggs;
}

function handleTerminal(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const cmd = String(req.body.cmd || '').toLowerCase().trim().slice(0, 40);
  const eggs = loadTerminalEggs();
  const e = cmd && Object.prototype.hasOwnProperty.call(eggs, cmd) ? eggs[cmd] : null;
  if (!e || typeof e !== 'object') return res.status(200).json({ found: false });
  const strList = (a) => Array.isArray(a) ? a.filter(x => typeof x === 'string') : [];
  return res.status(200).json({
    found: true,
    lines: strList(e.lines),
    variants: Array.isArray(e.variants) ? e.variants.map(strList).filter(v => v.length) : [],
    effect: e.effect === 'hearts' ? 'hearts' : null
  });
}

// Strong, explicit wishes only — a passing "project" or "email" is not enough.
function pickFlowChip(text) {
  const t = String(text || '').toLowerCase();
  if (/\b(resume|résumé|cv|curriculum vitae)\b/.test(t) && /\b(send|share|email|mail|get|need|want|download|see)\b/.test(t)) {
    return '[[go:send-resume|📄 Email me his resume]]';
  }
  if (/\b(call ?back|call me|phone call|schedule (a )?call|book (a )?call|talk on (the )?phone)\b/.test(t)) {
    return '[[go:callback|📅 Request a callback]]';
  }
  // A project to plan → the AI project brief (collects details, sends Sahnawaz a brief)
  if (/\b(start (a|my|our) project|build (me|my|our)|make (me|my|our) (a )?(website|site|app|store)|(need|want|looking for|get) (a |an )?(new )?(website|site|web ?app|app|online store|e-?commerce|landing page|portfolio)|(get|need|want) (a )?(quote|estimate)|quotation|project brief)\b/.test(t)) {
    return '[[go:brief|📝 Plan my project with AI]]';
  }
  if (/\b(hire|hiring|recruit(ing|er)?|job offer|work with (him|you|sahnawaz)|contact (him|sahnawaz)|get in touch|send (him |sahnawaz )?(a )?message|message (him|sahnawaz)|email (him|sahnawaz))\b/.test(t)) {
    return '[[go:send-message|📧 Message Sahnawaz]]';
  }
  return null;
}

module.exports = handler;
