/* ==== index.html line 5658 ==== */

(function() {
  var CASE_STUDIES = {

    portfolio: {
      accent: '#00e5ff',
      icon: '🚀',
      status: '● LIVE — sahnawaz-portfolio.vercel.app',
      title: 'This Portfolio — Smart Contact Wizard + AI Assistant',
      lede: 'A blank "Message" textarea is the single biggest drop-off point on any portfolio — writing "what I need" from scratch is real effort, and most visitors just leave instead. This site replaces that blank box with two connected systems: a 3-tap quote wizard that turns project type + budget + timeline into an instant AI-priced estimate, and a full AI concierge chat that can answer questions, email a resume, or book a callback — entirely on its own, without ever routing back to a static form unless the visitor wants one.',
      stack: [
        'Vanilla JavaScript — zero frameworks',
        'Groq LLM — wizard fast-path + full chat',
        'Vercel Serverless — /api/chat, /api/contact, /api/resume, /api/callback',
        'Firebase Auth (Google) + Firestore session log',
        'Web Audio API — procedural UI sound design',
        'Web Speech API — voice input + read-aloud TTS',
        'Custom markup DSL — ##header## · !!highlight!! · >>compare<<'
      ],
      stats: [
        { value: '3',      label: 'tap-only questions to a priced quote' },
        { value: '40+',    label: 'curated knowledge-base entries' },
        { value: '14,400', label: 'AI messages/day capacity (Groq free tier)' },
        { value: '3',      label: 'independent guided lead flows' },
        { value: '24h',    label: 'reply guarantee, shown post-submit' },
        { value: '0',      label: 'required fields before the AI quote appears' }
      ],
      diagram: '<svg class="cs-diagram" viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg">'
        + '<defs><marker id="csArrow3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#00e5ff"/></marker></defs>'
        + '<rect x="16" y="92"  width="130" height="48" rx="9" fill="rgba(34,211,238,0.08)" stroke="#22d3ee" stroke-width="1.4"/>'
        + '<text x="81" y="112" text-anchor="middle" fill="#eafffb" font-size="11" font-weight="700">Visitor</text>'
        + '<text x="81" y="127" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.6">Lands on the page</text>'
        + '<rect x="16" y="200" width="130" height="54" rx="9" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" stroke-width="1.4"/>'
        + '<text x="81" y="222" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Firebase Auth</text>'
        + '<text x="81" y="237" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">Google login \u2192 known name/email</text>'
        + '<line x1="146" y1="105" x2="186" y2="35"  stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<line x1="146" y1="128" x2="186" y2="223" stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<line x1="146" y1="212" x2="186" y2="46"  stroke="#fbbf24" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<line x1="146" y1="227" x2="186" y2="231" stroke="#fbbf24" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<rect x="188" y="6"   width="190" height="54" rx="9" fill="rgba(34,211,238,0.08)" stroke="#22d3ee" stroke-width="1.4"/>'
        + '<text x="283" y="28" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">3-Step Wizard</text>'
        + '<text x="283" y="43" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">Project \u00b7 Budget \u00b7 Timeline</text>'
        + '<rect x="188" y="204" width="190" height="54" rx="9" fill="rgba(167,139,250,0.08)" stroke="#a78bfa" stroke-width="1.4"/>'
        + '<text x="283" y="226" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">AI Chat Widget</text>'
        + '<text x="283" y="241" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">40+ KB entries + guided flows</text>'
        + '<line x1="378" y1="35"  x2="414" y2="110" stroke="#4ade80" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<line x1="378" y1="225" x2="414" y2="140" stroke="#4ade80" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<line x1="378" y1="45"  x2="414" y2="215" stroke="#94a3b8" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<line x1="378" y1="240" x2="414" y2="230" stroke="#94a3b8" stroke-width="1.1" marker-end="url(#csArrow3)"/>'
        + '<rect x="416" y="92"  width="200" height="58" rx="9" fill="rgba(74,222,128,0.08)" stroke="#4ade80" stroke-width="1.4"/>'
        + '<text x="516" y="115" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Groq LLM</text>'
        + '<text x="516" y="130" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="7.6">Quotes + chat replies \u00b7 14,400 msgs/day</text>'
        + '<rect x="416" y="204" width="200" height="58" rx="9" fill="rgba(148,163,184,0.08)" stroke="#94a3b8" stroke-width="1.4"/>'
        + '<text x="516" y="227" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Vercel Functions</text>'
        + '<text x="516" y="242" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8">/api/contact \u00b7 resume \u00b7 callback \u2192 email</text>'
        + '</svg>',
      bugs: [
        {
          title: 'The wizard needed to feel instant, not like a form',
          problem: 'A generic project-inquiry form has brutal drop-off \u2014 most visitors bounce before typing a single sentence, because writing "what I need" from a blank textarea is real effort.',
          fix: 'Replaced the blank field with 3 tap-only questions \u2014 project type \u2192 budget \u2192 timeline \u2014 and on the third answer, fires a fast-path call to the *same* <code>/api/chat</code> endpoint the full assistant uses, tagged <code>source:\'wizard\'</code> server-side so it gets a leaner prompt and a stripped, <code>[CAT:]</code>-free reply. The visitor gets an instant, personalised quote before the actual contact form ever appears \u2014 the form itself stays visually locked (🔒) until the wizard completes, so it only ever shows up once there\u2019s already a warm, priced lead behind it.'
        },
        {
          title: 'Teaching Groq to reply in cards, not paragraphs',
          problem: 'Plain markdown wasn\u2019t expressive enough for what actually reads well in a narrow chat bubble \u2014 pricing breakdowns, comparison rows, and "pay attention to this" callouts all just collapsed into flat lines of text no matter how the prompt was worded.',
          fix: 'Built a tiny custom markup DSL the AI is prompted to emit: <code>##Header##</code> for section headers, <code>!!text!!</code> for highlight callouts, <code>&gt;&gt;label|value&lt;&lt;</code> for comparison rows, <code>---</code> for dividers. A <code>formatBotReply()</code> parser on the frontend walks the reply line by line and turns each tag into an actual styled component (<code>.bot-section-header</code>, <code>.bot-highlight</code>, <code>.bot-compare-row</code>) with staggered entrance animation \u2014 no markdown library, just a small state machine matched to five patterns.'
        },
        {
          title: 'Models don\u2019t agree on their own syntax',
          problem: 'The <code>[CAT:pricing]</code> intent tag every reply starts with (used to pick the right badge \u2014 💰 Pricing, 🛠️ Skills, 🤝 Hiring) came back inconsistently: sometimes <code>[CATEGORY:pricing]</code>, sometimes lowercase <code>kat:pricing</code>, sometimes bold-wrapped as <code>**CAT:about**</code>, sometimes left dangling mid-reply after the model second-guessed itself.',
          fix: 'The tag matcher accepts <code>CAT</code>, <code>CATEGORY</code>, or <code>KAT</code>, in any case, with or without brackets \u2014 and a second sweep strips any stray leftover tag anywhere else in the reply so nothing leaks into the visible answer. A synonym map (<code>services\u2192skills</code>, <code>hire\u2192hiring</code>, <code>work\u2192about</code>) absorbs categories the model invents on its own, instead of every naming drift silently becoming an untagged, badge-less "general" reply.'
        },
        {
          title: 'Don\u2019t make a returning visitor re-type their own name',
          problem: 'Both the wizard and the chat\u2019s guided lead flows \u2014 quick email, send résumé, request callback \u2014 started every single time by asking for name and email, even for someone who\u2019d already signed in with Google earlier in the same session.',
          fix: 'Every flow checks a cached <code>shnz_visitor_v1</code> object in <code>localStorage</code> before asking anything. If both name and email are already known, the résumé flow sends immediately with zero questions; quick-mail skips straight to "what\u2019s your message"; callback skips straight to the phone number. Each flow independently decides how many steps to skip based on exactly what\u2019s missing, rather than one blanket "skip everything if logged in" switch.'
        },
        {
          title: 'A cancel button that doesn\u2019t feel like giving up',
          problem: 'Once a guided flow starts, a visitor who mistypes or changes their mind needs an obvious way out \u2014 but the same "invalid email, try again" message repeated verbatim on every retry starts to feel like talking to a wall.',
          fix: 'Wrong input during a flow increments a per-field error counter and cycles through a small pool of differently-worded nudges on each retry, always ending with a reminder that ❌ Cancel is right there \u2014 shifting the tone from "you got it wrong" to "no rush, here\u2019s another way." Cancelling mid-flow doesn\u2019t just close it; it resets the input placeholder so the visitor can immediately ask the assistant something completely unrelated, in the same chat, with no reload.'
        }
      ],
      metrics: [
        '3-question wizard \u2192 instant AI-priced quote before the contact form even appears',
        'Zero repeat-typing \u2014 Google login pre-fills every flow: résumé, quick-mail, and callback alike',
        'Custom markup DSL renders AI replies as structured cards, not walls of text',
        '40+ curated knowledge-base entries with full Groq fallback for anything outside it',
        '3 independent guided lead-capture flows, each with its own smart-retry logic'
      ],
      note: null
    },

    yojanasahay: {
      accent: '#22d3ee',
      icon: '🇮🇳',
      status: '● LIVE — yojanasahay.vercel.app',
      title: 'YojanaSahay — AI Government Scheme Finder',
      lede: 'Millions of Indians qualify for welfare schemes they never find out about — the information is scattered across thousands of government pages, in English, written for officials rather than citizens. YojanaSahay is a bilingual AI layer over 1,116 Central and State schemes across 28 states, backed by a production-grade verification pipeline that keeps that data honest instead of going stale the way most scheme-listing sites do.',
      stack: [
        'React 18 (PWA, bilingual EN/HI)',
        'Vercel Serverless Functions — 30+ endpoints',
        'Firebase / Firestore',
        'Groq LLM — openai/gpt-oss-20b',
        'Tavily Extract API',
        'Serper (Google Search) API',
        'GitHub Actions — cron workers',
        'KV-backed cross-instance key rotation'
      ],
      stats: [
        { value: '1,116', label: 'schemes tracked, 28 states' },
        { value: '78%',   label: 'links verified live' },
        { value: '569',   label: 'schemes in active verify queue' },
        { value: '6',     label: 'Groq keys — chat rotation pool' },
        { value: '454',   label: 'combined API calls / 30 days' },
        { value: '30+',   label: 'serverless functions in prod' }
      ],
      diagram: '<svg class="cs-diagram" viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">'
        + '<defs><marker id="csArrow1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee"/></marker></defs>'
        + '<rect x="16" y="135" width="150" height="56" rx="10" fill="rgba(34,211,238,0.08)" stroke="#22d3ee" stroke-width="1.5"/>'
        + '<text x="91" y="159" text-anchor="middle" fill="#eafffb" font-size="11.5" font-weight="700">React PWA</text>'
        + '<text x="91" y="175" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="9">Bilingual EN/HI · client</text>'
        + '<line x1="166" y1="163" x2="194" y2="163" stroke="#22d3ee" stroke-width="1.5" marker-end="url(#csArrow1)"/>'
        + '<rect x="196" y="135" width="170" height="56" rx="10" fill="rgba(34,211,238,0.08)" stroke="#22d3ee" stroke-width="1.5"/>'
        + '<text x="281" y="159" text-anchor="middle" fill="#eafffb" font-size="11.5" font-weight="700">Vercel Functions</text>'
        + '<text x="281" y="175" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="9">30+ serverless endpoints</text>'
        + '<rect x="16" y="230" width="150" height="50" rx="10" fill="rgba(160,170,185,0.08)" stroke="#9aa5b1" stroke-width="1.5"/>'
        + '<text x="91" y="252" text-anchor="middle" fill="#eafffb" font-size="11" font-weight="700">GitHub Actions</text>'
        + '<text x="91" y="268" text-anchor="middle" fill="rgba(220,240,245,0.6)" font-size="8.7">Daily verify-schemes cron</text>'
        + '<line x1="91" y1="230" x2="91" y2="193" stroke="#9aa5b1" stroke-width="1.3" marker-end="url(#csArrow1)"/>'
        + '<line x1="366" y1="145" x2="396" y2="30"  stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow1)"/>'
        + '<line x1="366" y1="155" x2="396" y2="86"  stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow1)"/>'
        + '<line x1="366" y1="163" x2="396" y2="142" stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow1)"/>'
        + '<line x1="366" y1="171" x2="396" y2="198" stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow1)"/>'
        + '<line x1="366" y1="181" x2="396" y2="254" stroke="#22d3ee" stroke-width="1.1" marker-end="url(#csArrow1)"/>'
        + '<rect x="396" y="6"   width="222" height="48" rx="9" fill="rgba(74,222,128,0.08)" stroke="#4ade80" stroke-width="1.4"/>'
        + '<text x="507" y="26" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Groq LLM — Chat Pool</text>'
        + '<text x="507" y="41" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">6 rotating keys · gpt-oss-20b</text>'
        + '<rect x="396" y="62"  width="222" height="48" rx="9" fill="rgba(52,211,153,0.08)" stroke="#34d399" stroke-width="1.4"/>'
        + '<text x="507" y="82" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Groq LLM — Verify Pool</text>'
        + '<text x="507" y="97" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">Dedicated keys · JSON-only</text>'
        + '<rect x="396" y="118" width="222" height="48" rx="9" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" stroke-width="1.4"/>'
        + '<text x="507" y="138" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Tavily Extract</text>'
        + '<text x="507" y="153" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">Bypasses .gov.in / .nic.in blocks</text>'
        + '<rect x="396" y="174" width="222" height="48" rx="9" fill="rgba(251,146,60,0.08)" stroke="#fb923c" stroke-width="1.4"/>'
        + '<text x="507" y="194" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Serper Search</text>'
        + '<text x="507" y="209" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">Dead-link replacement finder</text>'
        + '<rect x="396" y="230" width="222" height="48" rx="9" fill="rgba(192,132,252,0.08)" stroke="#c084fc" stroke-width="1.4"/>'
        + '<text x="507" y="250" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Firestore</text>'
        + '<text x="507" y="265" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="8.3">1,116 schemes · Admin Control Centre</text>'
        + '</svg>',
      embed: {
        title: 'Scheme Eligibility Checker — Live Module',
        src: 'https://yojanasahay.vercel.app/embed',
        note: 'This is one module of the deployed app, embedded directly \u2014 not a screenshot or a mockup. Answer the questions and see real scheme matches.'
      },
      bugs: [
        {
          title: 'The 432 that wasn\u2019t a quota problem',
          problem: 'Tavily search calls started failing across the app with HTTP 432 errors — looked exactly like quota exhaustion at first glance.',
          fix: 'Traced it to a missing billing address on the Tavily account, not usage limits at all. Beyond the immediate fix, dead-link URL discovery was later migrated off Tavily entirely and onto Serper (Google Search), narrowing Tavily to the one thing it does that Serper can\u2019t: <code>Tavily Extract</code>\u2019s crawler bypasses the IP blocks that stop a plain Vercel fetch \u2014 and even the allorigins.win proxy \u2014 from reaching <code>.gov.in</code> / <code>.nic.in</code> pages. Two providers now, each scoped to what it\u2019s actually good at, instead of one provider doing everything and failing unpredictably.'
        },
        {
          title: 'A two-tier system for "is this link actually dead?"',
          problem: 'A simple ping-and-flag approach for scheme URLs produced false positives — pages that moved, not pages that died \u2014 and admins had no way to tell the difference without opening every link by hand.',
          fix: 'Tier 1 is a fast <code>HEAD</code>-with-<code>GET</code>-fallback ping across every scheme (mirrored in <code>ping-url.js</code> and reused inline in <code>find-new-url.js</code>). Anything that fails Tier 1 gets queued for Tier 2: <code>verify-scheme.js</code> pulls the page through Tavily Extract, strips it down to 4,000 clean characters, and sends it to Groq (<code>openai/gpt-oss-20b</code>, migrated off <code>llama-3.1-8b-instant</code> after Groq deprecated it) with a JSON-only prompt asking for exactly three fields: <code>lastDate</code>, <code>isActive</code>, <code>confidence</code>. 569 of the 1,116 schemes are currently "verifiable" (online + real URL) \u2014 the other 544 are offline-only (bank/CSC/in-person) and correctly excluded from the queue entirely rather than reported as false failures.'
        },
        {
          title: 'Making the model admit when it doesn\u2019t know',
          problem: 'The extraction prompt told Groq "if confidence is 0.0, isActive MUST be null" \u2014 but that rule lived only in the prompt text, and models don\u2019t reliably self-enforce instructions like that. A hallucinated <code>isActive:true</code> at <code>confidence:0</code> could still slip through untouched.',
          fix: 'Moved the rule out of the prompt and into code: any <code>confidence &lt; 0.3</code> now hard-overrides <code>isActive</code> to <code>null</code> server-side, regardless of what the model returned. The prompt is still the first line of defense, but the actual API contract is enforced where it can\u2019t be talked out of it \u2014 a small change, but it\u2019s the difference between "the AI usually behaves" and "the API is actually correct."'
        },
        {
          title: 'Key rotation that survives a cold start',
          problem: 'A naive round-robin key rotation \u2014 start at key #0 every invocation \u2014 works fine locally and then quietly breaks in production: serverless functions have no memory between invocations, so every cold start reset the counter to key #1, and burst traffic ended up hammering one Groq key while five others sat idle.',
          fix: 'Replaced the local counter with <code>getNextStartIdx()</code>, a shared counter read from Firestore/KV so every Vercel instance \u2014 cold or warm \u2014 picks up rotation exactly where the last one left off. The chat pool (6 keys) and the scheme-verification pool (a separate <code>GROQ_VERIFY_KEY</code> set) rotate completely independently, so a bulk overnight verification run can never starve the in-app AI chat of its daily quota.'
        },
        {
          title: 'A failed tool call isn\u2019t the same as a failed key',
          problem: 'Groq\u2019s function-calling occasionally returned <code>tool_use_failed</code> \u2014 the model couldn\u2019t format a valid <code>web_search</code> call for a specific prompt. The app was treating this like a dead key and rotating to the next one, which just produced the exact same failure again, since the problem was the prompt shape, not the key.',
          fix: 'Split the two failure classes explicitly in <code>chat.js</code>: true key-level failures (<code>401</code>, <code>organization_restricted</code>, <code>invalid_api_key</code>, <code>429</code>) rotate to the next key in the pool; <code>tool_use_failed</code> instead retries once on the *same* key with the <code>web_search</code> tool simply omitted \u2014 so the user still gets a normal, non-search answer instead of a raw error bubbling up from a retry loop that could never have succeeded.'
        }
      ],
      metrics: [
        '1,116 schemes across 28 states',
        'Two-tier verification — dead-link ping + AI content extraction',
        'Independent Groq key-rotation pools for chat vs. verification',
        'Confidence thresholds enforced in code, not just in the prompt',
        'Full admin Control Centre — live agent monitoring, attendance, PDF intelligence reports'
      ],
      note: null
    },

    studylens: {
      accent: '#a78bfa',
      icon: '📚',
      status: '● LIVE — studylens-ai-gamma.vercel.app',
      title: 'StudyLens AI — AI Homework Helper',
      lede: 'Students across Assam follow different boards (SEBA, AHSEC, CBSE, ICSE) and different home languages, but most AI study tools assume one syllabus in one language. StudyLens AI lets a student pick their board, class and subject, then ask a question by typing it or snapping a photo of the textbook page — and get a step-by-step answer in English, Bengali, Hindi or Assamese.',
      diagram: '<svg class="cs-diagram" viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg">'
        + '<defs><marker id="csArrow2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#a78bfa"/></marker></defs>'
        + '<rect x="16" y="80" width="150" height="60" rx="10" fill="rgba(167,139,250,0.08)" stroke="#a78bfa" stroke-width="1.5"/>'
        + '<text x="91" y="106" text-anchor="middle" fill="#eafffb" font-size="12" font-weight="700">Photo or Typed Q</text>'
        + '<text x="91" y="122" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="9.5">Board + Class + Subject</text>'
        + '<line x1="166" y1="110" x2="224" y2="110" stroke="#a78bfa" stroke-width="1.5" marker-end="url(#csArrow2)"/>'
        + '<rect x="226" y="80" width="150" height="60" rx="10" fill="rgba(96,165,250,0.08)" stroke="#60a5fa" stroke-width="1.5"/>'
        + '<text x="301" y="106" text-anchor="middle" fill="#eafffb" font-size="12" font-weight="700">Vision / OCR</text>'
        + '<text x="301" y="122" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="9.5">Extracts question text</text>'
        + '<line x1="376" y1="110" x2="434" y2="110" stroke="#a78bfa" stroke-width="1.5" marker-end="url(#csArrow2)"/>'
        + '<rect x="436" y="80" width="188" height="60" rx="10" fill="rgba(74,222,128,0.08)" stroke="#4ade80" stroke-width="1.5"/>'
        + '<text x="530" y="104" text-anchor="middle" fill="#eafffb" font-size="12" font-weight="700">Groq LLM</text>'
        + '<text x="530" y="120" text-anchor="middle" fill="rgba(220,240,245,0.65)" font-size="9.5">Board + language-aware answer</text>'
        + '<line x1="530" y1="140" x2="530" y2="180" stroke="#a78bfa" stroke-width="1.3" marker-end="url(#csArrow2)"/>'
        + '<rect x="436" y="182" width="188" height="34" rx="8" fill="rgba(192,132,252,0.08)" stroke="#c084fc" stroke-width="1.3"/>'
        + '<text x="530" y="203" text-anchor="middle" fill="#eafffb" font-size="10.5" font-weight="700">Firebase — per-profile sync</text>'
        + '</svg>',
      bugs: [
        {
          title: 'One AI, four boards, four languages',
          problem: 'The same "explain this" prompt needs to behave completely differently for a Class 3 SEBA student answering in Assamese versus a Class 12 CBSE student in English.',
          fix: 'Structured the prompt to take board, class and language as explicit context passed alongside the question, rather than trying to train or fine-tune separate models per board — one model, context-steered per request.'
        },
        {
          title: 'Turning a blurry textbook photo into a solvable question',
          problem: 'Real photos from students are skewed, glared, or handwritten — feeding a bad OCR extraction straight to the AI just produces a confident-sounding wrong answer.',
          fix: 'Treated OCR/vision extraction as its own verified step before the question ever reaches the LLM, with a graceful fallback to manual typing when extraction confidence is low, instead of letting garbled text silently corrupt the answer.'
        },
        {
          title: 'One family account, several students',
          problem: 'Siblings sharing one device and one Firebase login would otherwise see each other\u2019s history, bookmarks and quiz progress mixed together.',
          fix: 'Added multi-profile support scoped under a single auth account, so history, bookmarks and quiz state sync per student profile — not per login — across every device that profile signs into.'
        }
      ],
      metrics: ['4 boards — SEBA, AHSEC, CBSE, ICSE', '4 languages — EN, Bengali, Hindi, Assamese', 'Photo-based Q&A via OCR', 'Cross-device Firebase sync'],
      note: 'This one\u2019s newer than YojanaSahay, so this write-up focuses on the design decisions behind it rather than a long bug history yet — that\u2019ll grow as the product matures.'
    }
  };

  function renderCaseStudy(key) {
    var d = CASE_STUDIES[key];
    if (!d) return '';
    var bugsHtml = d.bugs.map(function(b, i) {
      return '<div class="cs-bug" style="--cs-accent:' + d.accent + '">'
        + '<div class="cs-bug-title"><span>' + String(i + 1).padStart(2, '0') + '</span>' + b.title + '</div>'
        + '<p><b>What happened:</b> ' + b.problem + '</p>'
        + '<p><b>Fix:</b> ' + b.fix + '</p>'
        + '</div>';
    }).join('');
    var metricsHtml = d.metrics.map(function(m) { return '<span class="cs-metric-pill">' + m + '</span>'; }).join('');
    var stackHtml = d.stack
      ? '<div class="cs-h">Tech Stack</div><div class="cs-stack">'
        + d.stack.map(function(s) { return '<span class="cs-stack-pill">' + s + '</span>'; }).join('')
        + '</div>'
      : '';
    var statsHtml = d.stats
      ? '<div class="cs-h">Production Data — Live</div><div class="cs-stat-grid">'
        + d.stats.map(function(s) {
            return '<div class="cs-stat"><div class="cs-stat-value" style="color:' + d.accent + '">'
              + s.value + '</div><div class="cs-stat-label">' + s.label + '</div></div>';
          }).join('')
        + '</div>'
      : '';
    // Lazily embedded, loaded only when this case study is opened (never on
    // initial page load). The iframe starts at opacity:0 with a spinner
    // behind it; its onload flips .cs-embed-loaded so it fades in once the
    // checker has actually rendered, instead of popping in blank/white.
    var embedHtml = d.embed
      ? '<div class="cs-h">' + d.embed.title + '</div>'
        + '<div class="cs-embed-wrap">'
        + '<div class="cs-phone-frame">'
        + '<div class="cs-phone-notch"></div>'
        + '<div class="cs-phone-screen">'
        + '<div class="cs-embed-loading">loading live checker…</div>'
        + '<iframe class="cs-embed-frame" src="' + d.embed.src + '" title="' + d.embed.title + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" onload="this.classList.add(\'cs-embed-loaded\')"></iframe>'
        + '</div>'
        + '<div class="cs-phone-home"></div>'
        + '</div>'
        + '</div>'
        + (d.embed.note
            ? '<p class="cs-embed-note">' + d.embed.note + ' <a href="' + d.embed.src + '" target="_blank" rel="noopener">Open full screen ↗</a></p>'
            : '')
      : '';
    return ''
      + '<div class="cs-icon">' + d.icon + '</div>'
      + '<h2 id="csTitle" class="cs-title">' + d.title + '</h2>'
      + '<div class="cs-status" style="color:' + d.accent + '">' + d.status + '</div>'
      + '<p class="cs-lede">' + d.lede + '</p>'
      + stackHtml
      + statsHtml
      + embedHtml
      + '<div class="cs-h">Architecture</div>'
      + d.diagram
      + '<div class="cs-h">Engineering Deep-Dive</div>'
      + bugsHtml
      + '<div class="cs-h">Outcome</div>'
      + '<div class="cs-metrics">' + metricsHtml + '</div>'
      + (d.note ? '<p class="cs-note">' + d.note + '</p>' : '');
  }

  // Exposed so the live-stat fetch script can update stats.value fields
  // in place — the modal re-renders from this object fresh every time
  // it opens, so mutating it here is enough to keep both the card AND
  // the case study showing the same live numbers.
  window.CASE_STUDIES = CASE_STUDIES;

  window.openCaseStudy = function(key) {
    var modal = document.getElementById('caseStudyModal');
    var content = document.getElementById('csContent');
    if (!modal || !content) return;
    content.innerHTML = renderCaseStudy(key);
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('cs-open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { modal.classList.add('cs-visible'); });
    });
  };

  window.closeCaseStudy = function() {
    var modal = document.getElementById('caseStudyModal');
    if (!modal) return;
    modal.classList.remove('cs-visible');
    document.body.style.overflow = '';
    setTimeout(function() {
      modal.classList.remove('cs-open');
      modal.setAttribute('aria-hidden', 'true');
    }, 340);
  };

  document.addEventListener('DOMContentLoaded', function() {
    var modal = document.getElementById('caseStudyModal');
    if (!modal) return;
    modal.querySelector('.cs-backdrop').addEventListener('click', window.closeCaseStudy);
    modal.querySelector('.cs-close').addEventListener('click', window.closeCaseStudy);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('cs-open')) window.closeCaseStudy();
    });
  });
})();
