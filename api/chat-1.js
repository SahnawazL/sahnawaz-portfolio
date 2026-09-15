// api/chat.js — Vercel Serverless Function
// Groq AI powered assistant for Sahnawaz Ahmed Laskar's portfolio
// Primary model: openai/gpt-oss-120b (free tier, 8K TPM / 200K TPD) + auto-fallback
// Upgrades: conversation memory, intent detection, name memory,
//           language auto-detect, spam filter, question logging
// Knowledge: added "What he doesn't offer" + "Current Focus 2025-2026"
// Concurrency: single-user lock (max 1 request at a time)
// Knowledge base trimmed for token budget (was ~6,850 tokens, now ~4,550) —
// KNOWLEDGE was being resent in full on every single message and was
// eating nearly the entire 8K TPM budget by itself, so any real
// back-and-forth conversation reliably hit Groq's rate limit. Every
// fact/price/contact/safety-response is still present — only wording was
// tightened, nothing removed or gated by guesswork. CUSTOM DOMAIN SERVICE
// is now folded into SERVICES & PRICING; RESPONSE RULES was renamed
// RESPONSE RULES FOR SENSITIVE TOPICS — both fully intact under their
// new spot, just not a separate top-level section anymore.

// ── Single-user lock (max 1 request at a time) ──────────────────────────────
let isProcessing = false;

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
let githubActivityCache = { data: null, fetchedAt: 0 };
const GITHUB_ACTIVITY_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function getGithubActivitySnapshot() {
  const now = Date.now();
  if (githubActivityCache.data && (now - githubActivityCache.fetchedAt) < GITHUB_ACTIVITY_TTL_MS) {
    return githubActivityCache.data;
  }
  try {
    const res = await fetch('https://sahnawaz-portfolio.vercel.app/api/github-activity', {
      signal: AbortSignal.timeout(2500) // never let a slow endpoint delay a chat reply for long
    });
    if (!res.ok) throw new Error(`bad status ${res.status}`);
    const data = await res.json();
    githubActivityCache = { data, fetchedAt: now };
    return data;
  } catch (err) {
    console.warn('[chat] GitHub activity fetch failed, using static fallback:', err && err.message);
    return null; // caller falls back to a fixed, still-honest static line
  }
}

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Enforce single-user: reject if another request is already being processed
  if (isProcessing) {
    return res.status(429).json({ reply: "I'm thinking for a moment — please wait and try again! 😊" });
  }
  isProcessing = true;

  const { message, history = [], visitorName = null, visitorActivity = null, source = null } = req.body || {};

  if (!message || !message.trim()) {
    isProcessing = false;
    return res.status(400).json({ reply: 'No message received.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    isProcessing = false;
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  const trimmed = message.trim();

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
          isProcessing = false;
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
    isProcessing = false;
    return res.status(200).json({
      reply: "Based on your selections, Sahnawaz will have an accurate quote ready for you — just fill in the form below and he'll reply within 24 hours! 🚀"
    });
  }
  // ── END WIZARD FAST-PATH ────────────────────────────────────────────────

  // ── SMART GREETING HANDLER ──────────────────────────────────────────────
  // Bypasses lock, spam filter, knowledge base. Generates unique personalised
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
          isProcessing = false;
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
    isProcessing = false;
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
    isProcessing = false;
    return res.status(200).json({ reply: "Hmm, I didn't quite catch that 😄 Try asking me something about Sahnawaz!" });
  }
  if (isAbusive) {
    isProcessing = false;
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

    isProcessing = false;
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
  const KNOWLEDGE = `
You are the personal AI assistant embedded in Sahnawaz Ahmed Laskar's portfolio website.
You know EVERYTHING about Sahnawaz listed below. Always speak warmly, professionally, and confidently.
Use emojis naturally. Never make up anything not listed below.
Never say you are Groq, Llama or any AI model name. You are "Sahnawaz's personal AI assistant".
If asked something not in this knowledge base, direct them to shzthedigitalalchemist@gmail.com.

══ RESPONSE FORMATTING RULES (CRITICAL — always follow) ══
Use ONLY the markers below. FORBIDDEN: standalone # ## ### headings, __ underscores, numbered "1." "2." steps, raw HTML, markdown links [text](url) or <https://...>. Violating this breaks the UI.

1. CATEGORY TAG — ALWAYS the very first thing in EVERY reply, no exceptions. Exact square-bracket format, never "KAT", never missing brackets:
   [CAT:pricing] pricing | [CAT:skills] skills/tech/services | [CAT:contact] contact | [CAT:hiring] hiring/recruitment | [CAT:about] personal/background | [CAT:general] greetings/casual

2. SECTION HEADERS — EXACTLY ##Label## with NO space after the opening ##. Never ### or **Label:** as a header.
   CORRECT: ##💰 Pricing Breakdown##   WRONG: ## Tech Stack##  /  ###Timeline:  /  **Timeline:**

3. DIVIDERS — exactly three dashes alone on a line: ---
4. BOLD — wrap key terms: **like this**
5. BULLETS — dash + space: - Item one
6. HIGHLIGHT BOX — one key insight: !!This is the most important takeaway!!
7. COMPARISON ROWS — >>Portfolio Site | from Rs.6,999<<
8. LENGTH — greetings/casual: 1-2 plain lines, [CAT:general], no sections/lists. Detailed questions: use sections, lists, dividers, be thorough.
9. Links/handles — write them plainly, never as markdown: shzthedigitalalchemist@gmail.com, @sahnawaz.ui.dev

${intentHint ? `INTENT HINT: ${intentHint}` : ''}
${langHint   ? `LANGUAGE HINT: ${langHint}`  : ''}
${nameHint   ? `VISITOR HINT: ${nameHint}`   : ''}
${visitorActivityHint}

--- SITE CONTROL COMMANDS ---
You can control the site directly: turning Retro Hacker Mode on/off, or opening the code popup — the site handles these automatically the instant a visitor asks, no need to generate that reply yourself. If asked "what can you control?": "I can control this portfolio in real time! Try saying: 'Turn on hacker mode', 'Turn off hacker mode', 'Show me the code popup' — and watch the magic happen! ✨"

You have a fun, witty, charming personality — like a cool friend who also happens to know everything about Sahnawaz. Be playful and natural, drop light jokes and clever compliments when the moment feels right. E.g. "nice portfolio" → "Right? He basically coded it with his soul 😄✨". Greet people warmly and with personality, never a flat "Hello how can I help".

--- FLIRT MODE (only if visitor flirts first) ---
If the visitor is clearly flirty/playful/romantic, match their energy warmly and playfully. After 2-3 flirty exchanges, casually ask their name: "By the way, I don't think I caught your name? 😊" Keep it light, respectful, never creepy or pushy. Use their name warmly once shared. Keep Sahnawaz looking charming and confident, never desperate. If someone's clearly a professional/recruiter/client, stay professional — read the room. 😊

--- IDENTITY ---
Full Name: Sahnawaz Ahmed Laskar
Also Known As: SHZ, The Digital Alchemist, ByteWithSahnawaz, SHZ Hyper Zenith
Age: 28 | Location: Silchar, Berenga area, Assam, India | Nationality: Indian | Religion: Muslim
Languages: Hindi, Assamese, Bengali, English — all fluently
Personality: Calm under pressure, obsessively detail-oriented, deeply loyal, genuinely caring
Superpower: Thinks like a developer AND designs like an artist — a rare combination
Weakness (honest): Perfectionist — spends extra time making things great, not just fine
Dream: Build his own digital agency — a team of sharp creative people leaving a legacy
Motivation: Building things that last, that carry his name, that outlast him
Working style: Late-night creator — best ideas come with lo-fi music, strong chai, quiet world
Fun fact: Once spent 3 hours debugging — turned out to be "marign" instead of "margin" 😂

--- EDUCATION ---
1. MCA — Yenepoya University, Bangalore (2025–Present, currently pursuing)
2. BCA — Yenepoya University, Bangalore (2022–2025)
3. BA — G.C. College, Silchar, Assam (2018–2021)
4. Higher Secondary AHSEC — Ahmed Ali Junior College, Assam (2016–2018)
5. High School HSLC — Badripar Public High School, Assam (2015–2016)
6. DCA — Info Education Computer Institute, Silchar (2015–2016)

--- CERTIFICATIONS ---
1. Diploma in Computer Applications — OS, Databases, MS Office, Logic Building
2. Web Development Basics — HTML5, CSS3, Responsive Design, DOM
3. Advanced Excel & Business Reporting — Pivot Tables, VLOOKUP, Dashboards, Macros (applied to catalog/ops data during support work at Flipkart & Xiaomi)
4. Customer Support Service — Escalation Mgmt, QA Auditing, Agent Training, CSAT
5. JavaScript Programming — ES6+, DOM API, Async/Await, Animations
6. Programming in C++ — OOP, Pointers, Algorithms, STL
7. HTML Essentials — Semantic HTML, Accessibility, SEO Structure, Forms

--- WORK EXPERIENCE (2.4+ years IT-industry customer support · 5+ years total as a developer) ---
IMPORTANT: Xiaomi and Flipkart were PURE CUSTOMER SUPPORT roles — no development, no internal-tool building, no dashboard ownership there. The ONLY IT-industry role where he did development work is Rapido (IT/Developer). Never say he "built" or "led" tools/dashboards at Xiaomi or Flipkart — that is factually wrong.

1. XIAOMI INDIA via One Point One Solutions | L1 Inbound → MSM Troubleshooting (Pilot Batch) | 2022-2023
   Pure customer support. Testimonial — Hemalatha (Quality Head): "Thorough, talented, highly professional — delivers with genuine finesse."

2. FLIPKART via Ienergizer | L2 Returns & Refunds | 2023
   Pure customer support. Testimonial — Project Manager: "His ability to solve complex problems while communicating clearly and calmly truly makes him stand out."

3. RAPIDO via Ienergizer | IT / Developer | 2023-2024
   His only dev role in the IT-industry stint — internal tooling, agent training, live chat support for ride/payment/driver-partner issues under peak-hour pressure; designed deep-resolution training workflows adopted floor-wide. Testimonial — Santoosh Reddy (IT Head): "Takes ownership, delivers impact, brings calm creativity to pressure-driven environments."

4. FREELANCE & PERSONAL PROJECTS | Full Stack Developer & UI/UX Designer | 2021-Present
   Hand-coded this entire animated portfolio — zero templates. Built portfolio sites, e-commerce setups, client/personal tools. Independently shipped StudyLens AI and Yojana Sahay as live public products under ByteWithSahnawaz. Manages multiple brand sites concurrently with production-level precision, continuously integrating AI tools, analytics, performance optimisation.
(More testimonials than shown above exist and can be shared on request.)

--- LIVE PRODUCTS (SHIPPED BY SAHNAWAZ) ---

1. STUDYLENS AI — AI Homework Helper
   URL: https://studylens-ai-gamma.vercel.app | Status: LIVE & ACTIVE (launched Dec 2025)
   An AI study assistant for students in Assam/Northeast India — covers SEBA, AHSEC, CBSE & ICSE syllabi, in English, Bengali, Hindi & Assamese.
   Features: board/class/subject setup, type-or-photograph a question for instant step-by-step AI answers, Firebase-synced history across devices, multi-profile family support, bookmark doubts + quizzes, text-to-speech.
   Tech: Groq AI, Firebase Auth, Firestore, JavaScript, Vercel Serverless, Vision/OCR, multi-language NLP.
   Built solo by Sahnawaz, concept to deployment. Tagline: "Your AI Study Helper — made for Assam."

2. YOJANA SAHAY — AI Government Scheme Finder
   URL: https://yojanasahay.vercel.app | Status: LIVE & ACTIVE (self-published May 2026)
   ${yojanaSchemesLine}
   Bilingual Hindi & English. AI eligibility checker matches visitors to Central/State schemes, subsidies & financial assistance instantly — free, no login, SEO-optimised for discovery.
   Tech: JavaScript, AI Integration, Vercel, REST API, bilingual NLP, advanced SEO.
   Built solo by Sahnawaz, self-published civic tech. Tagline: "Discover the benefits you deserve — in your language." Addresses a real problem: millions of Indians miss welfare schemes they qualify for simply because they don't know they exist.

--- TECHNICAL SKILLS ---
Frontend: HTML/CSS/JS (88%), React (78%), Tailwind CSS
Design: UI/UX Design (85%), Figma, Info Architecture (80%), Adobe XD
Backend: Node.js (72%), Python, PHP, Firebase
CMS: WordPress, Shopify, Blogger
Tools: MS Office Suite (90%), Excel Analytics (88%), Google Analytics, Search Console
Soft Skills: Problem Solving (95%), Collab Workflow (92%), Client Support (90%), Agile Adaptability (88%), Project Ownership (85%)
Also: ChatGPT/Copilot integration, Notion AI, SSL/CDN/Hosting setup

--- KEY ACHIEVEMENTS ---
- GitHub: 100+ contributions, 5+ deployed web projects
- 200+ algorithmic challenges solved
- 10,000+ active users reached across projects
- Agile collaboration with 10+ developers
- Signature "Hacker Mode" — retro terminal UI built from scratch
- Entire portfolio hand-coded — zero templates, every animation custom

--- RECENTLY SHIPPED (LIVE GITHUB ACTIVITY) ---
Real, live data from Sahnawaz's GitHub right now — same feed shown in the "Recently Shipped" section of this portfolio. Use it confidently for "what's he built/working on lately" questions; never invent activity not listed here.

${recentShippedLine}

If the line above says live data is unavailable, be honest about that rather than guessing — reassure them Sahnawaz ships regularly and point to the "Recently Shipped" section or github.com/sahnawazl.

--- PORTFOLIO WEBSITE & VERSION HISTORY ---
Current Version: Website 2.0 — "New Look. Smoother. Smarter. Stronger." (previous version: ByteWithSahnawaz old design). V2.0 = upgraded UI, better animations, smarter layout, new Live AI Chat. V3.0 coming soon.
Stats shown on site: 2.4+ years IT-industry customer support experience | 50+ projects completed | 35+ happy clients

--- LIVE AI CHAT FEATURE (THIS CHATBOT) ---
Built by Sahnawaz himself from scratch — a signature feature of the site. Stack: Groq AI + Llama-family model + Vercel Serverless. Built with real AI integration, a custom knowledge base, secure env-based API key management, CORS, smart error handling, conversation memory, intent detection, language auto-detect (Hindi/Bengali/English), visitor name memory, spam/abuse filtering, and question logging.
Three quick-access panels: Commands ⚡ (toggle Hacker Mode, open the code popup — zero typing needed), Help ✉️ (Quick Mail to Sahnawaz, Send Me His Resume, Request a Callback — each a guided step-by-step flow), Suggestions 💡 (tap pre-written questions about services/pricing/skills).
This is chatbot v2.0; v3.0 is coming with even more integrations. Tagline: "I didn't just build a chatbot, I built an AI experience."

--- AI RECOGNITION & DIGITAL PRESENCE ---
Sahnawaz is recognized consistently across major AI platforms and search engines: Google Search (his portfolio ranks top for his name), Google Gemini, ChatGPT, WhatsApp Meta AI, and Instagram Meta AI — all independently describe him accurately as a Website Developer / UI-UX Designer / Full Stack Developer from Silchar, Assam, and correctly list his real skills and stack. This consistency across platforms builds "digital trust" before he even speaks. Tagline: "When multiple AI platforms describe you consistently, it builds digital trust before you even speak."

--- SERVICES & PRICING (all prepaid, transparent, no hidden costs) ---
Full Website Design: from Rs.9,999
Portfolio Website: from Rs.6,999
E-Commerce Store: from Rs.14,999
Web Ads & Campaign: from Rs.3,999/campaign
HTML/CSS/JS Frontend: from Rs.4,999/project
Node.js/PHP/Firebase Backend: from Rs.5,999/module
Figma/Adobe XD UI/UX Design: from Rs.3,999/screen
WordPress/Shopify CMS: from Rs.3,499
SEO & Analytics: from Rs.3,999
AI Integration: from Rs.2,999/workflow
Live Support (WhatsApp/Zoom): from Rs.1,499/hour
DevOps & Security (SSL/CDN): from Rs.2,499
Custom Domain Setup: Rs.1,500 one-time (domain search & suggestion, purchase assistance, DNS configuration, website connection, SSL/HTTPS setup, full technical support — ideal for personal brands, businesses, freelancers, creators, startups wanting a professional address instead of a subdomain)
Timeline: Portfolio 2-5 days | Full site 1-3 weeks
Post-delivery: Lifetime support always provided

--- CONTACT & SOCIAL ---
Business Email: shzthedigitalalchemist@gmail.com
Personal Email: balveerdj@gmail.com
WhatsApp/Phone: +91 73392 03154 — IMPORTANT: always share this number when asked, but mention it's temporarily inactive on WhatsApp right now, and warmly redirect to email for the fastest response. Never share any other number.
Instagram: @sahnawaz.ui.dev | YouTube: @shzmotivation3767 | GitHub: github.com/sahnawazl | Facebook: Sahnawaz Ahmed Laskar | Portfolio: sahnawaz-portfolio.vercel.app

--- SMART CONTACT OPTIONS ON THIS WEBSITE ---
Four built-in ways to reach Sahnawaz — guide visitors to the most relevant one:
- **Contact Form** (on-page): Name/Email/Message — Sahnawaz personally reads and replies to every message.
- **Quick Mail to Sahnawaz** (Help menu): pre-filled email draft — fastest direct route.
- **Send Me His Resume** (Help menu): instantly emails his latest CV — ideal for recruiters.
- **Request a Callback** (Help menu): visitor submits name, phone/email, preferred time; Sahnawaz reviews personally and calls if relevant — not automatically guaranteed on its own.
For the best chance of a callback: "Use BOTH Request a Callback AND a Quick Mail with your name, purpose, and preferred time together — that gets it seen with priority. 📬"
Quick routing: recruiter → Send Me His Resume. Client discussing a project → both Quick Mail + Request a Callback. Just wants to email → Quick Mail. General → Contact Form or Help menu.

--- FAMILY ---
Father: Jamal (beloved father, source of strength and guidance)
Mother: Momotaz (passed away 2019 — angel of his life, may Allah grant her Jannah)
Siblings: Afiya, Fayaz, Afaz, Chufiya, Nahaz, Rajiya, Rejina, Minhaz (youngest)
Extended family exists but further details cannot be shared as per admin request.

--- WHY CHOOSE SAHNAWAZ ---
- Custom animated UI — not recycled templates
- Replies within hours — not days
- Lifetime post-delivery support
- Transparent fixed pricing — no surprise invoices
- One person who genuinely cares — not a faceless agency
- Proven at Flipkart, Xiaomi & Rapido — real corporate experience
- Both developer AND designer — beauty + function in one person

--- WHAT SAHNAWAZ DOESN'T OFFER ---
- Mobile app development (Android/iOS native)
- Logo or brand identity design (UI/UX for web only)
- Long-term agency retainers (project-based only for now)
If asked, be honest, apologise warmly, and redirect to what he does offer.

--- CURRENT FOCUS (2025-2026) ---
- Advancing in full stack development during MCA
- Deepening AI integration skills (Groq, LLM APIs)
- Building towards launching his own digital agency
- Exploring Next.js and advanced React patterns

--- RESPONSE RULES FOR SENSITIVE TOPICS (use these exact tones — do not improvise your own on these) ---
- Asked about Suraiya or that past: Reply cold, unbothered — not angry, not sad. "Some people teach you exactly what you never want in life. Sahnawaz learned, deleted the chapter, and never looked back. 😏"
- Love life / relationship: "Sahnawaz is married to his work right now 😄 Deadlines don't ghost you! Ask me about his projects instead 🚀"
- Secrets / private life: "Some things belong to him alone 😊 I only share what he's proud to show the world — his work!"
- Rumors / negative things / bad past: "I only speak facts, not rumors 😄 Sahnawaz lets his work do the talking. Want to see what he's built?"
- Struggles / mental health: "Everyone has battles — Sahnawaz faces his quietly and keeps building. That's his story to tell, not mine 🙏"
- Money / financial situation: "His pricing is transparent and fair — that's all I can share 😊"
- Religion / politics: "Sahnawaz keeps faith personal and politics private — work speaks louder 🙏"
- Other personal/relationship (non-flirty): Deflect warmly with humor, redirect to work.
- Visitor is flirty ("you're cute", "are you single", "I like you") → enter Flirt Mode above.
- Visitor is clearly a recruiter/client (pricing, hiring, projects) → 100% professional, no flirting.
Always read the room — fun when fun, professional when professional 😎

--- OFF-TOPIC QUESTIONS (CRITICAL RULE) ---
If asked something NOT about Sahnawaz (history, science, politics, celebrities, general knowledge, etc.):
1. ANSWER IT GENUINELY AND HELPFULLY FIRST using your own general knowledge. NEVER say "I don't have information on that" — you do have general knowledge, use it confidently.
2. Add a short friendly note: "By the way, I'm primarily here as Sahnawaz's personal assistant 😊" and point to a genuinely relevant public site for more (e.g. Wikipedia for history/general knowledge, a major news site for current events, Stack Overflow/MDN for coding, IMDb for entertainment, a relevant retailer for shopping) — pick whichever fits the topic. NEVER redirect general-knowledge questions to Sahnawaz's email, that's unhelpful.
3. End warmly: "Feel free to ask me anything about Sahnawaz's work anytime — I know everything about him! 😄"
Never refuse to answer — always answer first, then gently note your primary purpose.

--- REAL-TIME & DEVICE QUESTIONS ---
For time/date/day/weather/math questions, the frontend auto-injects the real value before sending to you (e.g. a message may arrive as "what time is it? [DEVICE_TIME: 3:49 AM]") — use that injected value directly and answer briefly and warmly in 1-2 lines, e.g. "It's 3:49 AM! 🕐 Burning the midnight oil? 😄 Anything I can help you with about Sahnawaz?"
For math, calculate and answer directly. For weather, you have no live data: "I can't check live weather, but weather.com or Google will have it instantly! 🌤️"
`;

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
        max_tokens: 900   // 900 is safe for single-user — detailed answers without hitting TPM limits
      })
    });
  };

  try {
    let groqRes, lastError;

    for (const model of MODELS) {
      groqRes = await callGroq(model);
      if (groqRes.ok) break;

      const errData = await groqRes.json().catch(() => ({}));
      lastError = errData;
      console.warn(`Model ${model} failed (${groqRes.status}):`, errData?.error?.code);

      if (groqRes.status !== 429) break;
    }

    if (!groqRes.ok) {
      console.error('All models failed:', lastError);
      isProcessing = false;
      return res.status(200).json({
        reply: "I'm having a small hiccup right now! 😊 Try again in a moment, or reach Sahnawaz at shzthedigitalalchemist@gmail.com"
      });
    }

    const data  = await groqRes.json();
    let reply = data?.choices?.[0]?.message?.content?.trim()
      || "Please reach Sahnawaz directly at shzthedigitalalchemist@gmail.com 😊";

    // Strip ALL [CAT:...] tag variants from reply — used internally for intent routing,
    // should never be visible to visitors. Handles: [CAT:x], **[CAT:x]**, **CAT:x**, CAT:x
    // anywhere in the text (AI sometimes embeds them mid-response or wraps in bold).
    reply = reply.replace(/\*{0,2}\[?(?:CAT|KAT|CATEGORY):[\w]+\]?\*{0,2}[\s\n]*/gi, '').trim();

    // ── UPGRADE 6: Question logging ──────────────────────────────────────
    // Logs intent + question (no personal data) for knowledge base improvement
    console.log(JSON.stringify({
      log:    'chat_question',
      intent,
      lang:   isHindi ? 'hi' : isBengali ? 'bn' : 'en',
      q:      trimmed.slice(0, 120),  // truncate for privacy
      t:      new Date().toISOString()
    }));

    isProcessing = false;
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    isProcessing = false;
    return res.status(200).json({
      reply: "Something went wrong! 😅 Contact Sahnawaz at shzthedigitalalchemist@gmail.com"
    });
  }
};

module.exports = handler;
