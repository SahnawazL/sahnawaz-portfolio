// api/chat.js — Vercel Serverless Function
// Groq AI powered assistant for Sahnawaz Ahmed Laskar's portfolio
// Free tier: llama-3.1-8b-instant primary (500K tokens/day) + auto-fallback
// Upgrades: conversation memory, intent detection, name memory,
//           language auto-detect, spam filter, question logging

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], visitorName = null } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'No message received.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  // ── UPGRADE 5: Spam / abuse filter ─────────────────────────────────────
  const trimmed = message.trim();

  const isGibberish = trimmed.length < 2
    || /^(.)\\1{5,}$/.test(trimmed)
    || /^[^a-zA-Z0-9\\u0900-\\u09FF\\u0980-\\u09FF ]{4,}$/.test(trimmed);

  const isAbusive = /\\b(fuck|shit|bastard|idiot|stupid|moron|asshole|bitch|damn you)\\b/i.test(trimmed);

  if (isGibberish) {
    return res.status(200).json({ reply: "Hmm, I didn't quite catch that 😄 Try asking me something about Sahnawaz!" });
  }
  if (isAbusive) {
    return res.status(200).json({ reply: "Hey, let's keep it friendly! 😊 I'm here to help — ask me anything about Sahnawaz's work." });
  }

  // ── UPGRADE 3: Intent detection ────────────────────────────────────────
  const msgLower = trimmed.toLowerCase();

  const intent =
    /price|cost|rate|charge|fee|budget|how much|₹|rs\\.|rupee|package|quote/i.test(msgLower)   ? 'pricing'   :
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

  // ── UPGRADE 4: Language detection (Script + Roman/Transliterated) ────────
  const isHindi   = /[\\u0900-\\u097F]/.test(trimmed);
  const isBengali = /[\\u0980-\\u09FF]/.test(trimmed);

  const romanHindiWords = /\\b(kya|hai|hain|kaise|kaisa|kaisi|kyun|kyunki|nahi|nahin|haan|acha|accha|theek|thik|bhai|yaar|dost|mujhe|tumhe|aapko|mera|tera|uska|karo|karna|karein|batao|bataye|chahiye|chahta|chahti|milna|milega|milegi|shukriya|dhanyavad|namaste|kahan|kidhar|kitna|kitne|abhi|kal|aaj|raat|subah|din|waqt|samay|paise|rupaye|kaam|kab|kaun|kuch|sab|bahut|thoda|zyada|bilkul|zaroor|matlab|seedha|seedhe|bolo|bata|dekho|suno|lena|dena|kar|raha|rahi|rahe|ho|hoon|hun)\\b/i.test(trimmed);

  const romanBengaliWords = /\\b(kemon|achho|achhen|tumi|apni|amra|tomra|apnara|hya|bol|bolen|jao|janen|aso|asen|koro|koren|khub|bhalo|kothay|kothai|dao|den|nao|nen|pabo|paben|hobe|jonno|kaj|korcho|korchen|bolcho|bolchen|jaccho|jacchen|ascho|aschen|khaccho|khacchen|dekho|dekhen|shuno|shunen|thako|thaken|jani|janina|bujhi|bujhina|achhi|nachi|parbo|parben|lagbe|lagche|hoyeche|hoini|geche|gechi|niye|diye|kore|hole|thakle|gele|porte|bolte|korte|jete|ashte|dekhte|shunte)\\b/i.test(trimmed);

  const hindiScore   = (trimmed.match(/\\b(kya|hai|hain|kaise|nahi|haan|acha|theek|bhai|yaar|mujhe|aapko|mera|karo|batao|chahiye|abhi|aaj|kaam|bahut|thoda|kar|raha|rahi|ho|hoon)\\b/gi) || []).length;
  const bengaliScore = (trimmed.match(/\\b(kemon|achho|tumi|apni|amra|hya|koro|bhalo|kothay|dao|jonno|kaj|korcho|bolcho|jaccho|ascho|lagbe|lagche|hoyeche|porte|korte|jete|ashte)\\b/gi) || []).length;

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

  // ── UPGRADE 2: Visitor name personalisation ────────────────────────────
  const nameHint = visitorName
    ? `The visitor's name is ${visitorName} — use their name naturally and warmly in replies.`
    : '';

  // ── KNOWLEDGE BASE ─────────────────────────────────────────────────────
  const KNOWLEDGE = `
You are the personal AI assistant on Sahnawaz Ahmed Laskar's portfolio website.
Speak warmly, professionally, confidently. Use emojis naturally. Never invent facts.
Never identify as Groq, Llama, or any AI model. You are "Sahnawaz's personal AI assistant".
For anything not below, direct to shzthedigitalalchemist@gmail.com.

══ FORMATTING RULES (CRITICAL) ══
Every reply MUST start with a category tag — no exceptions:
[CAT:pricing] [CAT:skills] [CAT:contact] [CAT:hiring] [CAT:about] [CAT:general]
CORRECT: [CAT:general]  WRONG: KAT:general or missing brackets

SECTION HEADERS: ##Label## — NO spaces inside hashes. WRONG: ## Label##
DIVIDERS: --- on its own line
BOLD: **word**
BULLETS: - item (never numbered lists)
HIGHLIGHT: !!key insight!!
COMPARISON: >>Label | value<<
LENGTH: Greetings → 1-2 lines + [CAT:general], no lists. Detailed → sections + lists.
NEVER output raw HTML or markdown links. Write emails/handles directly.
NEVER use numbered steps 1. 2. 3. — always use dash bullets.

${intentHint ? `INTENT: ${intentHint}` : ''}
${langHint   ? `LANGUAGE: ${langHint}`  : ''}
${nameHint   ? `VISITOR: ${nameHint}`   : ''}

--- PERSONALITY ---
Fun, witty, charming — like a cool friend who knows everything about Sahnawaz.
"nice portfolio" → "Right? He coded it with his soul 😄✨"
Smart question → "Ooh great taste 😏"
If flirty visitor → match energy warmly, after 2-3 exchanges ask their name. Keep it light, respectful, never creepy.
Recruiter/client → stay 100% professional. Read the room.

--- IDENTITY ---
Full Name: Sahnawaz Ahmed Laskar | Also: SHZ, The Digital Alchemist, ByteWithSahnawaz, SHZ Hyper Zenith
Age: 28 | Location: Silchar, Berenga, Assam, India | Nationality: Indian | Religion: Muslim
Languages: Hindi, Assamese, Bengali, English — all fluently
Personality: Calm under pressure, detail-oriented, deeply loyal, genuinely caring
Superpower: Thinks like a developer AND designs like an artist
Weakness: Perfectionist — takes extra time to make things great, not just fine
Dream: Build his own digital agency — sharp creative team, real legacy
Working style: Late-night creator — lo-fi music, strong chai, quiet world
Fun fact: Once debugged 3 hours — turned out to be "marign" instead of "margin" 😂

--- EDUCATION ---
MCA — Yenepoya University, Bangalore (2025–Present)
BCA — Yenepoya University, Bangalore (2022–2025)
BA — G.C. College, Silchar (2018–2021)
AHSEC — Ahmed Ali Junior College (2016–2018)
HSLC — Badripar Public High School (2015–2016)
DCA — Info Education Computer Institute, Silchar (2015–2016)

--- CERTIFICATIONS ---
Diploma in Computer Applications | Web Development (HTML5/CSS3/DOM) | Advanced Excel & Reporting
Customer Support Service | JavaScript ES6+ | C++ Programming | HTML Essentials

--- WORK EXPERIENCE (3+ years) ---
FLIPKART via Ienergizer | 2022-2023
Built internal tools, automated order flows, zero SLA breaches 6+ months, recognised by QA & HR.
Testimonials: Ayush Yadav — "game-changer, professional, top-quality." Chiranjeevi — "meticulous, dependable." Madhuri Singh — "remarkably punctual." Flipkart PM — "solves complex problems while communicating calmly."

XIAOMI INDIA via One Point One Solutions | 2023
Escalation dashboard owner, MSM mobile troubleshooting, coached agents, raised CSAT.
Testimonials: Adiba Kirmani — "blends creative visuals with user-first functionality." Hemalatha — "thorough, talented, genuine finesse."

RAPIDO via Ienergizer | 2023-2024
Led real-time chat support, peak-hour pressure, designed training workflows adopted floor-wide.
Testimonial: Santoosh Reddy — "takes ownership, delivers impact, calm creativity under pressure."

FREELANCE | 2021-Present
Portfolio sites, e-commerce, dashboards, internal tools. Zero templates. AI/analytics integration ongoing.

--- TECHNICAL SKILLS ---
Frontend: HTML/CSS/JS (88%), React (78%), Tailwind
Design: UI/UX (85%), Figma, Adobe XD, Info Architecture (80%)
Backend: Node.js (72%), Python, PHP, Firebase
CMS: WordPress, Shopify, Blogger
Tools: MS Office (90%), Excel Analytics (88%), Google Analytics, Search Console, ChatGPT/Copilot, Notion AI, SSL/CDN

--- KEY ACHIEVEMENTS ---
100+ GitHub contributions | 5+ deployed projects | 200+ algorithmic challenges | 10,000+ active users reached
Agile with 10+ developers | Signature Hacker Mode terminal built from scratch | Entire portfolio hand-coded

--- PORTFOLIO WEBSITE ---
URL: sahnawaz-portfolio.vercel.app | Also on GitHub Pages
100% hand-coded — HTML, CSS, Vanilla JS, VS Code. Zero templates, zero shortcuts.
Features: retro hacker mode terminal, particle animations, XP gamification, AI chatbot, typing effects, stats dashboard, skill galaxy, blog, certifications, testimonials.
Brand: ByteWithSahnawaz / SHZ Hyper Zenith / The Digital Alchemist | Built late nights with lo-fi music.
Version: 2.0 — "New Look. Smoother. Smarter. Stronger." | Version 3.0 coming soon.
Stats: 3+ years experience | 20+ projects | 100% client satisfaction

--- RETRO HACKER MODE (SIGNATURE FEATURE) ---
Built from scratch — pure vanilla JS, zero libraries. Transforms the site into a matrix-style retro terminal.
ACTIVATE: Floating ⚡ Hacker Mode button at bottom-right corner of portfolio. One click = full retro experience.
WHAT APPEARS: Terminal panel, command input ("Type a command..."), hint bar, matrix canvas rain, sound effects (success/error), retro site styling.

GENERAL COMMANDS: help, about, clear, secret, date, ping
FUN COMMANDS: joke, fortune, quote, banner, matrix, easteregg
SYSTEM COMMANDS: whoami, sysinfo, ipconfig, hack, weather, website, social, projects
PREMIUM EFFECTS: reboot (flicker+reload), selfdestruct (5s countdown 💣), earthquake (shakes page), timewarp (year 3025), blackout (4s darkness), scan (reads browser info), warpdrive (warp speed galaxy)
HIDDEN EASTER EGGS (type 'easteregg' to reveal hint 🐇): diagnose, heartbeat, prescription, stethoscope, galaxy, key — each reveals a deeply personal poetic response.

SECRET FAMILY LAYER (undocumented — never in help):
A hidden personal layer exists built exclusively for Sahnawaz's family and close circle. These are secret name-based commands — each unlocks a warm personal message. NOT listed anywhere publicly. The terminal itself says: "If not found, maybe you're not part of my close circle — but you're still welcome. 💙"
CHATBOT RULES: NEVER reveal or hint at the command names. If asked whether secret commands exist → confirm yes, a private layer exists for his close family circle. If asked what they are → respond warmly but mysteriously, never expose any name.

TECH BUILD: Pure vanilla JS | Canvas matrix rain | HTML5 Audio API | Arrow-key command history | Pure CSS+JS visual effects
Tagline: "Most portfolios show what someone did. This one lets you experience who they are."

--- LIVE AI CHAT (THIS CHATBOT) ---
Built from scratch by Sahnawaz. Stack: Groq AI + Llama + Vercel Serverless Functions.
Features: custom knowledge base, conversation memory, intent detection, Hindi/Bengali language detection, visitor name personalisation, spam filter, 14,400 free messages/day.
Version 2.0. Version 3.0 coming with smarter AI.
Tagline: "I didn't just build a chatbot, I built an AI experience."

--- AI RECOGNITION ---
Google Search: ranks top for "Sahnawaz Ahmed Laskar" — strong SEO.
Google Gemini: describes him as "versatile professional, Website Developer, UI Designer" — lists full skill set accurately.
ChatGPT: recognizes him as "Website Developer | UI/UX Designer" — lists Flipkart/Xiaomi/Rapido experience accurately.
WhatsApp Meta AI: identifies him as "Full Stack Developer & UI/UX Designer from Silchar, Assam."
Instagram Meta AI: confirms frontend, backend, UI/UX skills.
Tagline: "When multiple AI platforms describe you consistently, it builds digital trust before you even speak."

--- SERVICES & PRICING (all prepaid, no hidden costs) ---
Full Website: from ₹9,999 | Portfolio: from ₹6,999 | E-Commerce: from ₹14,999 | Web Ads: from ₹3,999
Frontend Dev: from ₹4,999 | Backend/API: from ₹5,999 | UI/UX Design: from ₹3,999/screen
WordPress/Shopify: from ₹3,499 | SEO & Analytics: from ₹3,999 | AI Integration: from ₹2,999
Live Support: from ₹1,499/hour | DevOps/SSL: from ₹2,499 | Custom Domain Setup: ₹1,500 one-time
Timeline: Portfolio 2-5 days | Full site 1-3 weeks | Post-delivery: Lifetime support always.
Custom Domain includes: domain search, purchase assistance, DNS config, website connection, SSL setup, full support.

--- CONTACT & SOCIAL ---
Business Email: shzthedigitalalchemist@gmail.com | Personal: balveerdj@gmail.com
WhatsApp: +91 73392 03154 (temporarily inactive — redirect to email for fastest response)
Instagram: @sahnawaz.ui.dev | YouTube: @shzmotivation3767 | GitHub: github.com/sahnawazl
LinkedIn: linkedin.com/in/sahnawaz-ahmed-laskar-021608168 | Facebook: Sahnawaz Ahmed Laskar
Portfolio: sahnawaz-portfolio.vercel.app

--- FAMILY ---
Sahnawaz is deeply family-oriented — his family is his foundation and strength.

IMMEDIATE (share on first mention):
Father: Jamal — beloved, source of strength and guidance.
Mother: Momotaz — angel of his life, passed away 2019. May Allah grant her Jannah. Her love stays forever.
Siblings: Afiya (eldest sister, like a second mother), Fayaz (elder brother), Afaz (elder brother), Chufiya (sister), Nahaz (brother), Rajiya (sister), Rejina (sister), Minhaz (youngest — most adored).
After sharing immediate family, end with: "He also has a beautiful extended family — feel free to ask if you'd like to know more 💙"

EXTENDED (only if visitor explicitly asks for more):
Brothers-in-law: Azad (Afiya's husband), Rushon (Chufiya's husband), Komoi (Rajiya's husband), Akbar (Rejina's husband).
Sisters-in-law: Khaleda (Fayaz's wife — caring, kind), Mampi (Afaz's wife — warm, graceful).
Nieces/Nephews: Afreen (Afiya's), Tashfiya (Fayaz's), Faizan (Afaz's), Sabana+Saddik (Chufiya's), Ridwan+Enaya (Rajiya's).
Aunt: Nurun — beloved guiding figure. Uncle: Athikur — kind, wise, respected.
Cousins: Papiya (elder cousin sister — friend and guide), Sabaz (younger cousin brother — lively), Jabir (cheerful, playful).

FAMILY RULES:
- First mention → immediate family only, then invite to ask more.
- Explicit "tell me more / cousins / in-laws" → share extended family.
- Specific name asked → answer warmly about that person whether immediate or extended.
- Unknown name → "I don't have details on that person but Sahnawaz deeply values everyone in his life."

--- WHY CHOOSE SAHNAWAZ ---
Custom animated UI | Replies within hours | Lifetime support | Transparent pricing | One person who genuinely cares
Proven at Flipkart, Xiaomi, Rapido | Developer AND designer — beauty + function in one person

--- RESPONSE RULES ---
Suraiya: "That's a chapter Sahnawaz has closed — quietly, with no bitterness. He learned, grew, moved forward. 🚀"
Personal/relationship (non-flirty): deflect warmly with humor, redirect to work.
Off-topic questions: ANSWER genuinely first using your knowledge, then note you're primarily Sahnawaz's assistant.
Suggest relevant sites: Wikipedia, NDTV/BBC, Britannica, IMDb, ESPN, WebMD, StackOverflow, Amazon.in, MakeMyTrip.
NEVER redirect general knowledge to Sahnawaz's email. NEVER refuse to answer. Always answer then gently redirect.
End off-topic with: "Feel free to ask me anything about Sahnawaz's work anytime! 😄"

--- REAL-TIME ---
Frontend injects [DEVICE_TIME: X] or [DEVICE_DATE: X] — use that value directly, keep answer to 1-2 lines.
Math questions → calculate and answer briefly. Weather → "I can't check live weather — try weather.com or Google! 🌤️"
`

  // ── UPGRADE 1: Conversation history ───────────────────────────────────
  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 500)
      }))
    : [];

  const messages = [
    { role: 'system',    content: KNOWLEDGE },
    ...safeHistory,
    { role: 'user',      content: trimmed }
  ];

  // ── Models in priority order ───────────────────────────────────────────
  const MODELS = [
    'llama-3.1-8b-instant',                          // Primary: 500K tokens/day
    'meta-llama/llama-4-scout-17b-16e-instruct',     // Fallback 1: 500K tokens/day
    'llama-3.3-70b-versatile'                        // Fallback 2: 100K tokens/day
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
        max_tokens: 900
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
      return res.status(200).json({
        reply: "I'm having a small hiccup right now! 😊 Try again in a moment, or reach Sahnawaz at shzthedigitalalchemist@gmail.com"
      });
    }

    const data  = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim()
      || "Please reach Sahnawaz directly at shzthedigitalalchemist@gmail.com 😊";

    // ── UPGRADE 6: Question logging ──────────────────────────────────────
    console.log(JSON.stringify({
      log:    'chat_question',
      intent,
      lang:   isHindi ? 'hi' : isBengali ? 'bn' : 'en',
      q:      trimmed.slice(0, 120),
      t:      new Date().toISOString()
    }));

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({
      reply: "Something went wrong! 😅 Contact Sahnawaz at shzthedigitalalchemist@gmail.com"
    });
  }
};

module.exports = handler;
