/* ==== index.html line 10391 ==== */

(function(){

  /* ====================================================
     KNOWLEDGE BASE — warm, human, first-person voice
  ==================================================== */
  var QA = [
    { q:"Who are you?",
      a:"Hey! I'm Sahnawaz Ahmed Laskar — a 28-year-old Full Stack Developer & UI/UX Designer from Silchar (Berenga), Assam. I don't just build websites, I craft experiences that people actually enjoy using. Every pixel, every line of code comes from a genuine love for this craft. 🚀" },
    { q:"What services do you offer?",
      a:"Whatever your digital presence needs — full websites, portfolio sites, e-commerce stores, UI/UX design, web ads, SEO basics, SSL & hosting setup, or just someone to talk through your idea with.\n\nPrices start from ₹3,999. Flip the cards in the Services section to see everything in detail! 💼" },
    { q:"How can I hire you?",
      a:"I'd love to hear about your project! 😊\n\n📧 shzthedigitalalchemist@gmail.com\n📸 Instagram: @sahnawaz.ui.dev\n\nOr just fill the Contact form right here — I personally read every message and reply within a few hours. No bots, no delays." },
    { q:"What's your tech stack?",
      a:"My main playground: HTML · CSS · JavaScript · React · Node.js · Python · Advanced Excel · Figma · WordPress. I pick the right tool for each job rather than forcing everything into one box. Check the Tech Stack section for the full map! 🛠️" },
    { q:"Worked with big brands?",
      a:"Yes — and honestly, those experiences shaped how I work today. Flipkart taught me speed and precision. Xiaomi taught me quality at scale. Rapido taught me staying calm under pressure. Each one made me sharper. 🏆" },
    { q:"How long does a project take?",
      a:"Depends on what we're building together! A portfolio or landing page usually takes 2–5 days. A feature-rich or e-commerce site is more like 1–3 weeks. I always share a clear timeline before we start — no surprises. ⏱️" },
    { q:"Is pricing negotiable?",
      a:"I believe in fair, transparent pricing. My rates are prepaid and clearly listed in the Services section. For custom or larger projects, just message me — I'll always work with you to find something that feels right for both sides. 💡" },
    { q:"Post-delivery support?",
      a:"Always. I genuinely care about how your project performs after launch. Minor updates, bug fixes, small tweaks — I'm there. No ghosting, no excuses. That's just how I work. ✅" },
    { q:"Where are you based?",
      a:"I'm from Silchar — specifically the Berenga area — in Assam, India. But location has never been a barrier. I've worked with clients across India fully remotely via WhatsApp, Zoom, and email without a single hiccup. 🌐" },
    { q:"What makes this portfolio special?",
      a:"Honestly? Everything here was hand-coded with love — retro hacker mode 🖥️, laptop typing popup, particle animations, XP gamification, this very chat, character-by-character text effects. No templates. No shortcuts. Just me, my laptop, late nights, and lo-fi music. ❤️" }
  ];

  /* ====================================================
     TOPIC RULES — specific before generic, ORDER MATTERS
  ==================================================== */
  var TOPICS = [

    /* ── Greetings first — time-aware & warm ── */
    { rx:/^(hello|hi|hey|howdy|sup|hola|namaste|salam|assalamu|what'?s up|yo|good morning|good evening|good afternoon)\b/i,
      ans:(function(){
        var h = new Date().getHours();
        var greet = h < 12 ? "Good morning ☀️" : h < 17 ? "Good afternoon 👋" : h < 21 ? "Good evening 🌆" : "Hey, night owl! 🌙";
        var lines = [
          greet + " So glad you're here!",
          "I'm Sahnawaz's personal assistant — ask me anything about him.",
          "",
          "Here's what I can help you with:",
          "💼 Services & pricing",
          "🏆 Work experience (Flipkart, Xiaomi, Rapido)",
          "🛠️ Tech skills & projects",
          "📞 How to hire him",
          "",
          "What would you like to know? 😊"
        ].join("\n");
        return lines;
      })() },

    /* ── Gratitude ── */
    { rx:/\b(thank|thanks|thank you|appreciate|grateful|thx|ty)\b/i,
      ans:"Aww, you're so welcome! 😊 That genuinely means a lot. Feel free to ask anything else — I'm happy to chat!" },

    /* ── Age / DOB — must be before generic 'who' ── */
    { rx:/\b(how old|age|years old|born|birth|dob|year.?born)\b/i,
      ans:"Sahnawaz is 28 years old! Born and raised right here in Silchar, Assam — in the Berenga area specifically. Still young, already done so much. 🎂" },

    /* ── Identity / intro ── */
    { rx:/\b(who are you|who is sahnawaz|about you|tell me about|introduce yourself|introduce him|what do you do|your name)\b/i,
      idx:0 },

    /* ── Personality / vibe ── */
    { rx:/\b(personality|character|nature|kind of person|vibe|attitude|like as a person|what are you like)\b/i,
      ans:"People who know Sahnawaz well describe him in one word: creative. But dig a little deeper and you find someone who is genuinely calm under pressure, obsessively detail-oriented, and deeply loyal to the people he works with. He doesn't just deliver — he cares. 🎯" },

    /* ── Working style ── */
    { rx:/\b(working style|work style|how do you work|work with client|approach|collaborate|process)\b/i,
      ans:"Sahnawaz adapts to what each client actually needs. Sometimes that means being direct and honest — 'this won't work, here's why.' Sometimes it means being patient and walking someone through every decision. And sometimes it means treating the client as a true creative partner. He reads the room and adjusts. Always. 🤝" },

    /* ── Best creative time ── */
    { rx:/\b(when.*work|creative time|productive|best time|night|morning|work hours|routine)\b/i,
      ans:"Late nights are where the magic happens for Sahnawaz ☕ — lo-fi music playing softly, a strong cup of chai on the desk, the world quiet outside. That's when his best ideas flow and his best code gets written. There's something about that stillness that makes everything click. 🌙" },

    /* ── Proudest moment ── */
    { rx:/\b(proud|proudest|achievement|accomplish|moment|milestone|best moment|happiest)\b/i,
      ans:"There's one moment that will always stand out — a senior at Flipkart praised Sahnawaz's work publicly, in front of the entire team. No heads-up, no preparation. Just genuine recognition. For someone from a small city who worked incredibly hard to earn his place there, that moment meant everything. 🏅" },

    /* ── Dream / future ── */
    { rx:/\b(dream|goal|ambition|future|vision|5 years|next year|plan|aspire|want to be)\b/i,
      ans:"Sahnawaz's dream — and it's not a small one — is to build his own digital agency. A team of sharp, creative people building real things for real clients. Not just freelancing, but something that leaves a legacy. He's been quietly laying the foundation for that, one project at a time. 🌍" },

    /* ── What work means ── */
    { rx:/\b(meaning|beyond money|why.*work|passion for|love about|what drives|purpose|legacy)\b/i,
      ans:"For Sahnawaz, work has never really been just about money. It's about building something that outlasts you — putting your name on something great and knowing it will still be helping people long after you're done. That's the fuel that keeps him going at 2am when everyone else has logged off. 🔥" },

    /* ── Bias / small city ── */
    { rx:/\b(assam|northeast|small city|silchar|bias|underestimate|judge|regional|tier.?2|tier.?3)\b/i,
      ans:"Honestly? The bias is real. People assume that being from a smaller city like Silchar means limited thinking, basic work, less ambition. Sahnawaz has faced every one of those assumptions — and quietly, consistently, let his work do all the talking. Flipkart, Xiaomi, Rapido don't hire average people. 💪" },

    /* ── Hobbies / interests ── */
    { rx:/\b(hobbies|hobby|free time|fun|interest|outside work|when not coding|relax|leisure)\b/i,
      ans:"When he's not building something, Sahnawaz is usually exploring something — new design trends, YouTube content (@shzmotivation3767), or just thinking through his next big idea. Creativity doesn't really clock out for him. It's just who he is. 🎬" },

    /* ── Strengths ── */
    { rx:/\b(strength|superpower|best at|speciality|specialty|what makes you different|stand out|unique quality)\b/i,
      ans:"The thing that truly sets Sahnawaz apart? He can think like a developer AND design like an artist — and most people can only do one of those well. That means clients don't have to choose between a beautiful product and a functional one. They get both. ⚡" },

    /* ── Weakness / honest ── */
    { rx:/\b(weakness|flaw|not good at|struggle|challenge|difficult|hard for you|improve)\b/i,
      ans:"Sahnawaz will be the first to admit it — he's a perfectionist. He'll spend an extra hour on something that 'looks fine' because he knows it could look great. It's not always efficient, but clients never complain about the results. He's also actively levelling up his backend and DevOps skills. 🔧" },

    /* ── Motivation / inspiration ── */
    { rx:/\b(motivat|inspir|what keeps you|why do you|driven by|fuel|push you)\b/i,
      ans:"What keeps Sahnawaz going is the idea of permanence — building things that last, that carry his name, that people use and love without even knowing who made them. He's also motivated by proving that talent from Assam can compete with anyone, anywhere in the world. 🔥" },

    /* ── Languages spoken ── */
    { rx:/\b(speak|language|fluent|hindi|assamese|english|bengali|multilingual)\b/i,
      ans:"Sahnawaz speaks Hindi, Assamese, Bengali and English — all fluently. Honestly, it makes collaboration so much smoother with clients from different parts of India and beyond. No communication gaps, ever. 🗣️" },

    /* ── Experience / career ── */
    { rx:/\b(experience|years? of exp|career|professional background|work history|worked.*years|years.*worked)\b/i,
      ans:"5+ years total as a developer — including 2.4+ years of hands-on IT-industry experience: L1 inbound support → MSM troubleshooting at Xiaomi India, L2 returns/refunds support at Flipkart, and an IT/Developer role (internal tooling, agent training, live chat support) at Rapido — plus freelance and personal development work since 2021. Not just resume experience. Real work, real impact, real teams. 📅" },

    /* ── Brand specifics ── */
    { rx:/\b(flipkart|ienergizer)\b/i,
      ans:"At Flipkart (via Ienergizer), Sahnawaz started on L2 backend support — handling return and refund queries escalated from frontline agents — before moving onto the internal IT team, where he helped build tools that automated resolution workflows and got his first real hands-on development experience. Fast-paced, high-stakes work — and he loved every minute of it. 🛒" },
    { rx:/\b(xiaomi|one point one|1point1|mi support)\b/i,
      ans:"At Xiaomi India (via One Point One Solutions), Sahnawaz started out on L1 — taking live customer calls and resolving mobile issues via MSM-based troubleshooting — before moving into owning the order escalation dashboard. The Quality Head, Hemalatha, personally recognised his meticulous work — which meant a lot. 📱" },
    { rx:/\b(rapido|ride|cab)\b/i,
      ans:"At Rapido (via Ienergizer), Sahnawaz worked as IT/Developer — supporting internal tooling, leading live chat support for ride-related issues, and training agents on deep-resolution workflows. IT Head Santoosh Reddy called him someone who 'brings calm creativity to pressure-driven environments.' That one stuck. 🛵" },

    /* ── Education ── */
    { rx:/\b(certif|qualification|degree|education|study|college|diploma|background|university|mca|bca|school|secondary)\b/i,
      ans:"Here's Sahnawaz's full educational journey:\n\n🎓 Master of Computer Applications (MCA) — Yenepoya University, Bangalore, Karnataka (2025 – Present)\n🎓 Bachelor of Computer Applications (BCA) — Yenepoya University, Bangalore, Karnataka (2022 – 2025)\n🎓 Bachelor of Arts (BA) — G.C. College, Silchar, Assam (2018 – 2021)\n📚 Higher Secondary / AHSEC — Ahmed Ali Junior College, Assam (2016 – 2018)\n📚 High School / HSLC — Badripar Public High School, Assam (2015 – 2016)\n💻 Diploma in Computer Applications (DCA) — Info Education Computer Institute, Silchar, Assam (2015 – 2016)\n\nCurrently pursuing his MCA while actively building real-world projects — the perfect blend of theory and practice! 🚀" },

    /* ── Skills ── */
    { rx:/\b(skill|expert|good at|proficient|what can you do|capabilities|know how)\b/i,
      ans:"Core skills: HTML/CSS/JS, React, UI/UX Design, Excel Analytics, Info Architecture, Problem Solving, Agile workflows. But honestly, what makes those skills valuable is how Sahnawaz applies them — with care, context, and a genuine focus on the end user. 💪" },

    /* ── GitHub / open source ── */
    { rx:/\b(github|commit|open.?source|contribution|code repo|repository)\b/i,
      ans:"100+ GitHub contributions, 5+ deployed web apps, and 200+ algorithmic challenges solved. The code doesn't lie — it's all there if you want to see it. 🥇" },

    /* ── Testimonials ── */
    { rx:/\b(testimonial|review|client|feedback|say about|what.*people.*say|reference)\b/i,
      ans:"People who've worked with Sahnawaz consistently say the same things — professional, quick, meticulous, and genuinely cares about the outcome. Those aren't just nice words; they come from team leads and managers at Flipkart, Xiaomi and Rapido. Scroll down to the testimonials section to read them! ⭐" },

    /* ── Timeline — MUST be before pricing (catches "how much time", "how long", "time for a project") ── */
    { rx:/how (long|much time|many days|many weeks)|how (long|much time)|time (for|to (complete|finish|build|make|deliver))|(deadline|timeline|turnaround|delivery time|days|weeks|how fast|how quick|when.*ready|when.*done|when.*finish|when.*complete)\b/i,
      idx:5 },

    /* ── Pricing — only after timeline is ruled out ── */
    { rx:/\b(price|cost|fee|rate|rupee|budget|cheap|expensive|how much(?! time)|₹|affordable|charges|what.*charge|what.*cost)\b/i,
      ans:"Here's the full, transparent pricing — all prepaid, no hidden costs:\n\n🌐 Full Website Design — from ₹9,999\n📁 Portfolio Site — from ₹6,999\n🛒 E-Commerce Store — from ₹14,999\n📢 Web Ads / Campaign — from ₹3,999\n\n⚙️ Individual services:\n🖥️ Frontend Dev — from ₹4,999\n🔧 Backend / API — from ₹5,999\n🎨 UI/UX Design — from ₹3,999\n\nNeed something custom or have a tight budget? Just message — Sahnawaz always finds a way to make it work. 💡" },

    /* ── Post support ── */
    { rx:/\b(after.*deliver|maintain|update|bug.*fix|support|post.*launch|warranty|after.*project|once.*done)\b/i,
      idx:7 },

    /* ── Services ── */
    { rx:/\b(service|offer|build|create|make|can you help|what do you do|looking for|what.*offer)\b/i,
      idx:1 },

    /* ── Hiring / contact ── */
    { rx:/\b(hire|contact|reach|get in touch|work together|start a project|collaborate|work with you)\b/i,
      idx:2 },

    /* ── Tech stack ── */
    { rx:/\b(tech|stack|tool|html|css|javascript|react|python|figma|node|wordpress|framework|language.*use|what.*use)\b/i,
      idx:3 },

    /* ── Location ── */
    { rx:/\b(where.*based|location|city|assam|silchar|berenga|india|remote.*work|timezone|where.*from|which.*city)\b/i,
      idx:8 },

    /* ── Hacker Mode / Terminal — specific, before generic portfolio ── */
    { rx:/\b(hacker.?mode|retro.?terminal|retro.?hacker|terminal.*command|command.*terminal|hacker.*toggle|type.*command|what.*command|available.*command|how.*activate.*hacker|how.*turn.*on.*hacker|how.*use.*terminal|hacker.*feature|retro.*feature|easter.?egg|selfdestruct|warpdrive|timewarp|blackout|earthquake|matrixanim|hack.*command)\b/i,
      ans:"[CAT:about]\n##🖥️ Retro Hacker Mode##\n!!One of the most creative features on this portfolio — built 100% from scratch. 🔥!!\n---\n##⚡ How to Activate##\n- Click the **🎮 toggle button** in the bottom-right corner\n- The entire page transforms into a **green monospace terminal aesthetic** with scanline overlays\n- A fully functional **retro terminal** appears — type commands and explore\n---\n##💻 Commands You Can Try##\n>>General | help · about · clear · date · ping<<\n>>Fun | joke · fortune · quote · matrix · easteregg<<\n>>System | whoami · sysinfo · hack · scan · ipconfig<<\n>>Premium Effects | selfdestruct · earthquake · timewarp · blackout · warpdrive<<\n---\n##🐣 Hidden Easter Eggs##\n- Type **secret**, **diagnose**, **heartbeat**, **prescription** for surprise responses\n- Type a **family member\'s first name** (e.g. jamal, afiya) for personal messages\n- Type **easteregg** for a hint about even more hidden commands\n---\n!!Pure vanilla JavaScript — zero libraries. A creative flex that most developers can\'t even imagine, let alone build. 💪!!" },

    /* ── Portfolio ── */
    { rx:/\b(portfolio|this website|how.*built|retro|hacker.*mode|particle|animation|special.*about|what.*special)\b/i,
      idx:9 },

    /* ── Email specifics ── */
    { rx:/\b(official.?email|business.?email|professional.?email|work.*email)\b/i,
      ans:"Best email for project work: shzthedigitalalchemist@gmail.com — Sahnawaz checks it personally and replies fast. 📧" },
    { rx:/\b(personal.?email)\b/i,
      ans:"Sahnawaz's email for everything — personal and professional — is shzthedigitalalchemist@gmail.com. He checks it personally and replies fast. 📧" },

    /* ── Social ── */
    { rx:/\b(youtube|channel|video|content creator)\b/i,
      ans:"Sahnawaz runs a YouTube channel — @shzmotivation3767 — covering tech, motivation, and creative ideas. Worth a watch! 🎬" },
    { rx:/\b(instagram|insta|social media|follow)\b/i,
      ans:"You can follow Sahnawaz on Instagram @sahnawaz.ui.dev — it's where he shares design experiments, UI work, and creative updates. 📸" },

    /* ── Salary (handled with grace) ── */
    { rx:/\b(salary|ctc|package|earn|income|pay.*scale)\b/i,
      ans:"Freelance rates depend on the scope of work — all clearly listed in the Services section. For corporate opportunities, Sahnawaz is open to conversations. Just reach out and he'll be completely honest with you. 💼" },

    /* ── Blog / writing ── */
    { rx:/\b(blog|article|write|post|content|publishing)\b/i,
      ans:"Sahnawaz writes about things he actually knows from experience — building portfolios, Excel tricks, responsive design, debugging strategies, frontend performance. Real insights, not filler content. Check the Blog section! 📰" },

    /* ── Comparison ── */
    { rx:/\b(compare|better than|vs|other developer|different from|why.*you|why not.*else)\b/i,
      ans:"Honestly, here's the difference:\n\n✅ Custom animated UI — not recycled templates\n✅ Replies on WhatsApp within hours — not days\n✅ Lifetime post-delivery support — not just 'done and gone'\n✅ Transparent fixed pricing — no surprise invoices\n✅ One person who genuinely cares — not a faceless agency\n\nThat's not marketing. That's just how Sahnawaz works. 💥" },

    /* ── Fun / jokes ── */
    { rx:/\b(funny|joke|humor|laugh|comedy|tell me something fun)\b/i,
      ans:"Haha, okay! 😄 Sahnawaz once spent 3 hours debugging a layout issue — only to discover he'd accidentally typed 'marign' instead of 'margin'. A typo. Three hours. The chai did not help. 😂 Anyway — what can I actually help you with?" },

    /* ── Compliments ── */
    { rx:/\b(amazing|incredible|impressive|wow|great work|love.*portfolio|beautiful|sick|fire)\b/i,
      ans:"That really means a lot — and Sahnawaz would genuinely love to hear that too! 😊 Feel free to drop him a message. He reads every single one." },

    /* ── Smart / genius ── */
    { rx:/\b(smart|genius|intelligent|brilliant|talented|gifted)\b/i,
      ans:"I'll pass that on! 😄 But honestly, what makes Sahnawaz effective isn't just raw talent — it's the combination of technical depth, creative instinct, and a genuine desire to do good work. Clients at Flipkart, Xiaomi & Rapido noticed that too. 🧠✨" },

    /* ── Personal / relationship ── */
    { rx:/\b(married|single|relationship|girlfriend|wife|dating|love life)\b/i,
      ans:"Ha, that's a personal one! 😄 What I can say is — Sahnawaz's full commitment right now is to his craft and his clients. His work gets all the love. Want to hire him? 🚀" },

    /* ── Can you help me ── */
    { rx:/\b(can you help|need.*help|looking for|need.*website|want.*site|need.*developer|find.*developer)\b/i,
      ans:"Absolutely — that's exactly what this chat is for! 😊 Tell me a bit about what you need, and I'll point you to the right information. Or just reach out directly:\n\n📧 shzthedigitalalchemist@gmail.com\n📸 @sahnawaz.ui.dev\n\nSahnawaz will personally respond." },

    /* ── Trust / reliability ── */
    { rx:/\b(trust|reliable|honest|genuine|safe|legit|real|scam)\b/i,
      ans:"Completely valid to ask. Sahnawaz has worked with Flipkart, Xiaomi India, and Rapido — those don't take chances on unreliable people. Every testimonial on this page is real, from people who have his number. If you want references before committing, just ask. He has nothing to hide. 🤝" },

    /* ── Generic 'who' fallback ── */
    { rx:/\b(who|name|sahnawaz|about|himself|introduce)\b/i,
      idx:0 },

    /* ══════════════════════════════════════════
       PEOPLE — Family, close ones & Suraiya
    ══════════════════════════════════════════ */

    /* Suraiya — dignified, unbothered, total class */
    { rx:/\bsuraiya\b/i,
      ans:"That name belongs to a chapter Sahnawaz has already closed — quietly, with no bitterness and no explanation needed. Some things in life teach you more about yourself than you ever expected. He learned, he grew, and he moved forward. That's all that matters. 🚀" },

    /* Father */
    { rx:/\bjamal\b|\bfather\b|\babba\b|\bdad\b/i,
      ans:"Jamal is Sahnawaz's beloved father — the root of the family, the source of his strength and guidance. A man Sahnawaz deeply respects and loves. 💙" },

    /* Mother */
    { rx:/\bmomotaz\b|\bmother\b|\bammi\b|\bmom\b/i,
      ans:"Momotaz was Sahnawaz's beloved mother — the angel of his life. She passed away in 2019, but her love, prayers, and blessings live on in everything he does. May Allah grant her Jannah. 💙🤲" },

    /* Siblings */
    { rx:/\bafiya\b/i,
      ans:"Afiya is Sahnawaz's eldest sister — protective, caring, and a second mother to him. She's one of the most important people in his life. ❤️" },
    { rx:/\bfayaz\b/i,
      ans:"Fayaz is Sahnawaz's elder brother — strong, wise, and someone who has always guided him forward. 🤝" },
    { rx:/\bafaz\b/i,
      ans:"Afaz is Sahnawaz's elder brother — loving, supportive, and a true companion through everything. 🤝" },
    { rx:/\bchufiya\b/i,
      ans:"Chufiya is Sahnawaz's sister — sweet, kind, and full of love for the whole family. 🌸" },
    { rx:/\bnahaz\b/i,
      ans:"Nahaz is Sahnawaz's brother — energetic, fun, and always close to his heart. ⚡" },
    { rx:/\brajiya\b/i,
      ans:"Rajiya is Sahnawaz's sister — caring, graceful, and a pillar of warmth in their family. 🌹" },
    { rx:/\brejina\b/i,
      ans:"Rejina is Sahnawaz's sister — loving, cheerful, and a true blessing to the family. 🌼" },
    { rx:/\bminhaz\b/i,
      ans:"Minhaz is Sahnawaz's youngest brother — the most adorable one, deeply loved by everyone. 💙" },

    /* Extended family */
    { rx:/\bnurun\b/i,
      ans:"Nurun is Sahnawaz's beloved aunt — a guiding figure full of love in his life. 🌷" },
    { rx:/\bathikur\b/i,
      ans:"Athikur is Sahnawaz's uncle — kind, wise, and always deeply respected. 🤲" },
    { rx:/\bpapiya\b/i,
      ans:"Papiya is Sahnawaz's cousin sister — elder to him, like a friend and guide at the same time. 🌟" },
    { rx:/\bsabaz\b/i,
      ans:"Sabaz is Sahnawaz's cousin brother — younger, lively, and full of energy. 🔥" },
    { rx:/\bjabir\b/i,
      ans:"Jabir is Sahnawaz's cousin brother — cheerful, playful, and dearly loved. 😊" },

    /* In-laws & nieces/nephews */
    { rx:/\bazad\b/i,
      ans:"Azad is Afiya's husband — respected and a valued part of the family bond. 🤝" },
    { rx:/\bafreen\b/i,
      ans:"Afreen is Afiya's daughter — sweet, lovely, and a little star in the family. 🌟" },
    { rx:/\bkhaleda\b/i,
      ans:"Khaleda is Fayaz's wife — caring, kind, and a joy in their home. 💐" },
    { rx:/\btashfiya\b/i,
      ans:"Tashfiya is Fayaz's daughter — a little princess, bright and loved by everyone. 👑" },
    { rx:/\bmampi\b/i,
      ans:"Mampi is Afaz's wife — warm, graceful, and full of love for the family. 🌺" },
    { rx:/\bfaizan\b/i,
      ans:"Faizan is Afaz's son — small, innocent, and the heart of joy for the whole family. 🍼" },
    { rx:/\brushon\b/i,
      ans:"Rushon is Chufiya's husband — respected and a close part of their family circle. 🤝" },
    { rx:/\bsabana\b/i,
      ans:"Sabana is Chufiya's daughter — sweet and playful, always bringing smiles. 🌼" },
    { rx:/\bsaddik\b/i,
      ans:"Saddik is Chufiya's son — little, bright, and a treasure of happiness. 🧸" },
    { rx:/\bkomoi\b/i,
      ans:"Komoi is Rajiya's husband — a valued and respected part of their family. 🙏" },
    { rx:/\bridwan\b/i,
      ans:"Ridwan is Rajiya's son — smart, cheerful, and deeply loved. 😇" },
    { rx:/\benaya\b/i,
      ans:"Enaya is Rajiya's daughter — tiny, lovely, and the soul of joy in the family. 💕" },
    { rx:/\bakbar\b/i,
      ans:"Akbar is Rejina's husband — respected with love, making the family stronger. 🤝" },
  ];

  /* ========== Smart greeting by time of day (name-aware) ========== */
  function getWelcomeMsg(name){
    var h = new Date().getHours();
    var n = name ? ', ' + name + '!' : '!';
    if (h >= 5 && h < 12)
      return "Good morning" + n + " \u2600\uFE0F Ready to build something great today?\n\nI'm Sahnawaz's assistant \u2014 ask me about his work, pricing, or how to get started.";
    if (h >= 12 && h < 17)
      return "Good afternoon" + n + " \uD83D\uDC4B Hope your day's going well.\n\nI'm Sahnawaz's assistant \u2014 ask me about his services, past work, or pricing anytime.";
    if (h >= 17 && h < 21)
      return "Good evening" + n + " \uD83C\uDF06 Sahnawaz is online and available.\n\nAsk me about his work, pricing, or drop him a message directly.";
    return "Hey, night owl" + n + " \uD83C\uDF19 So is Sahnawaz!\n\nAsk me anything \u2014 services, pricing, or how to hire him. He replies fast even at night.";
  }
  var WELCOME = getWelcomeMsg();
  var WELCOME_RETURN = "Welcome back. What can I help you with today?";

  /* ========== DOM ========== */
  var widget      = document.getElementById('chatWidget');
  var closeBtn    = document.getElementById('chatClose');
  var clearBtn    = document.getElementById('chatClear');
  var expandBtn   = document.getElementById('chatExpand');
  var msgs        = document.getElementById('chatMessages');
  var chips       = document.getElementById('chatChips');
  var chipsWrap   = document.getElementById('chatChipsWrap');
  var chipsToggle = document.getElementById('chatChipsToggle');
  var input       = document.getElementById('chatInput');
  var sendBtn     = document.getElementById('chatSend');
  var statusTxt   = document.getElementById('chatStatusTxt');
  var liveDot     = document.getElementById('chatLiveDot');
  var followUpWrap  = document.getElementById('chatFollowUp');
  var followUpChips = document.getElementById('chatFollowChips');
  var quickReply    = document.getElementById('chatQuickReply');
  var userTypingEl  = document.getElementById('chatUserTyping');

  var isOpen       = false;
  var chipsVisible = false;
  var inited       = false;
  var botBusy      = false; /* lock: true while dots OR typewriter is running */

  /* ========== Feature 1: Returning visitor greeting ========== */
  var hasVisitedBefore = false;
  try { hasVisitedBefore = !!localStorage.getItem('chatVisited'); } catch(e){}

  /* ========== Feature 2: Idle nudge (resettable, fires twice with different messages) ========== */
  var idleTimer  = null;
  var idleTimer2 = null;
  var idleTimer3 = null;
  var idleCount  = 0; /* 0 = none fired, 1 = first, 2 = second, 3 = all fired */
  var IDLE_MSG  = (function(){ var _sv=null; try{_sv=JSON.parse(localStorage.getItem('shnz_visitor_v1')||'null');}catch(e){} var _n=_sv&&_sv.firstName?", "+_sv.firstName:""; return "Still here"+_n+"! 👋 Take your time — feel free to ask me anything about Sahnawaz's work, pricing, or services. 😊"; })();
  var IDLE_MSG2 = "No worries at all! 🌟 Whenever you're ready, I'm right here. You can also explore the **Help** menu below to mail Sahnawaz or request a callback directly. 📬";
  var IDLE_MSG3 = "It was lovely having you here! 🙏 Come back anytime — Sahnawaz and I will be right here waiting. Have a wonderful day! ✨";

  function resetIdleTimer(){
    clearTimeout(idleTimer);
    clearTimeout(idleTimer2);
    clearTimeout(idleTimer3);
    idleCount = 0; /* reset count so all nudges can fire again */
    if (!isOpen) return;

    /* First nudge after 120 s of silence */
    idleTimer = setTimeout(function(){
      if (!botBusy && isOpen && idleCount === 0){
        idleCount = 1;
        addBotTyping(IDLE_MSG, null, true); /* isNudge=true — won't restart timer */

        /* Second nudge — 40 s after the first (total 160s) */
        idleTimer2 = setTimeout(function(){
          if (!botBusy && isOpen && idleCount === 1){
            idleCount = 2;
            addBotTyping(IDLE_MSG2, null, true); /* isNudge=true */

            /* Third nudge — 30 s after the second (total 190s) */
            idleTimer3 = setTimeout(function(){
              if (!botBusy && isOpen && idleCount === 2){
                idleCount = 3;
                addBotTyping(IDLE_MSG3, null, true); /* isNudge=true */
              }
            }, 30000);
          }
        }, 40000);
      }
    }, 120000);
  }

  /* ========== Feature 3: Emoji intent reactions ========== */
  var INTENT_EMOJI = [
    { rx:/price|pricing|cost|₹|fee|charge|afford|budget/i,  emoji:'💰' },
    { rx:/hire|work with|contact|reach|email|whatsapp|book/i, emoji:'🤝' },
    { rx:/urgent|fast|quick|asap|soon|deadline/i,            emoji:'⚡' },
    { rx:/brand|flipkart|xiaomi|rapido|big company/i,        emoji:'🏆' },
    { rx:/dream|passion|goal|future|agency/i,                emoji:'🌍' },
    { rx:/design|portfolio|website|build|create/i,           emoji:'🎨' },
    { rx:/trust|safe|reliable|genuine|real/i,                emoji:'🛡️' },
  ];
  function showReaction(userText, botBubble){
    for (var i = 0; i < INTENT_EMOJI.length; i++){
      if (INTENT_EMOJI[i].rx.test(userText)){
        var r = document.createElement('span');
        r.className = 'chat-reaction';
        r.textContent = INTENT_EMOJI[i].emoji;
        botBubble.appendChild(r);
        setTimeout(function(){ if (r.parentNode) r.parentNode.removeChild(r); }, 2200);
        break;
      }
    }
  }

  /* ========== Feature 4: User typing indicator ========== */
  var userTypingTimeout = null;
  input && input.addEventListener('input', function(){
    if (botBusy) return;
    if (userTypingEl) userTypingEl.textContent = '✏️ You\'re typing…';
    clearTimeout(userTypingTimeout);
    userTypingTimeout = setTimeout(function(){
      if (userTypingEl) userTypingEl.textContent = '';
    }, 1200);
  });

  /* ========== Feature 5: Timestamps ========== */
  function formatTime(){
    return formatTimestamp(new Date().toISOString());
  }

  /* Smart timestamp: today → "9:47 PM", yesterday → "Yesterday 9:47 PM", older → "10 May 9:47 PM" */
  function formatTimestamp(isoOrStr){
    var d;
    if (!isoOrStr) {
      d = new Date();
    } else if (typeof isoOrStr === 'object' && isoOrStr !== null) {
      /* Firestore Timestamp object: {seconds, nanoseconds} or has .toDate() method */
      if (typeof isoOrStr.toDate === 'function') {
        d = isoOrStr.toDate();
      } else if (typeof isoOrStr.seconds === 'number') {
        d = new Date(isoOrStr.seconds * 1000);
      } else {
        d = new Date();
      }
    } else {
      /* String — try ISO parse first */
      d = new Date(isoOrStr);
      if (isNaN(d.getTime())) {
        /* Legacy stored string like "9:47 PM" — can't determine date, show as-is */
        return isoOrStr;
      }
    }
    var now = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12 || 12;
    var timeStr = hh + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;

    /* Compare calendar dates (midnight boundaries) */
    var todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var msgMidnight   = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
    var diffDays = Math.round((todayMidnight - msgMidnight) / 86400000);

    if (diffDays === 0)  return timeStr;                          /* Today: time only */
    if (diffDays === 1)  return 'Yesterday ' + timeStr;          /* Yesterday */
    /* Older: "10 May 9:47 PM" */
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + timeStr;
  }

  /* Lock / unlock the input area while bot is responding */
  function setBotBusy(busy){
    botBusy = busy;
    if (input){
      input.disabled = busy;
      input.style.opacity = busy ? '0.45' : '1';
      if (busy) {
        input.placeholder = 'Sahnawaz is thinking…';
      } else if (!window._helpFlowActive || !window._helpFlowActive()) {
        input.placeholder = 'Ask anything about Sahnawaz…';
      }
    }
    if (sendBtn){
      sendBtn.disabled = busy;
      sendBtn.style.opacity = busy ? '0.35' : '1';
      sendBtn.style.cursor = busy ? 'not-allowed' : 'pointer';
    }
  }

  /* ========== Conversation Memory ========== */
  var conversationHistory = []; // Array of {role:'user'|'bot', text: string}

  function addToHistory(role, text){
    conversationHistory.push({ role: role, text: text });
    // keep last 20 exchanges to avoid unbounded growth
    if (conversationHistory.length > 40) conversationHistory = conversationHistory.slice(-40);
  }

  /* Resolve pronouns using recent history context */
  function resolveContext(input){
    var t = input.toLowerCase().trim();
    // If input is very short and refers to a previous topic, look back
    var contextualPhrases = ['how long','how much','when did','tell me more','what about it','and that','that project','those brands','that role','that work','that last'];
    var isContextual = contextualPhrases.some(function(p){ return t.includes(p); });
    if (isContextual && conversationHistory.length >= 2){
      // Append last bot reply as context for matching
      var lastBotMsg = '';
      for (var i = conversationHistory.length - 1; i >= 0; i--){
        if (conversationHistory[i].role === 'bot'){
          lastBotMsg = conversationHistory[i].text;
          break;
        }
      }
      // Build enriched query by prepending recent context keywords
      var keywords = lastBotMsg.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(' ').filter(function(w){
        return w.length > 4 && !['their','there','about','which','where','these','those','after','before','every','other'].includes(w);
      }).slice(0,6).join(' ');
      return t + ' ' + keywords;
    }
    return t;
  }

  /* ========== Status: "Sahnawaz is typing..." ========== */
  function setTypingStatus(isTyping){
    if (!statusTxt || !liveDot) return;
    if (isTyping){
      statusTxt.textContent = 'Assistant is typing…';
      statusTxt.style.color = '#00ffcc';
      liveDot.style.background = '#00ffcc';
    } else {
      statusTxt.textContent = 'Online • replies instantly';
      statusTxt.style.color = '#00ff99';
      liveDot.style.background = '#00ff99';
    }
  }

  /* ========== Follow-up chips map ========== */
  var FOLLOWUP_MAP = {
    'who are you':       ['What\'s your dream?','Worked with big brands?','When do you do your best work?'],
    'how old are you':   ['Where are you from?','What\'s your educational background?','What\'s your proudest moment?'],
    'where are you from':['What languages do you speak?','What\'s your dream?','Who are you?'],
    'worked with big brands': ['What makes you different?','Can I trust you?','How long does a project take?'],
    'what services do you offer': ['What\'s your pricing?','How long does a project take?','How can I hire you?'],
    'what makes you different': ['Can I trust you?','Do you offer post-delivery support?','What\'s your pricing?'],
    'how can i hire you':['What\'s your pricing?','How long does a project take?','What services do you offer?'],
    "what's your pricing":['How long does a project take?','Do you offer post-delivery support?','Can you build me a website like this?'],
    'how long does a project take':['What\'s your pricing?','What makes you different?','Do you offer post-delivery support?'],
    'can i trust you':   ['Worked with big brands?','Do you offer post-delivery support?','How can I hire you?'],
    "what's your dream": ['What does your work mean to you?','When do you do your best work?','What\'s your proudest moment?'],
    "what's your proudest moment":['What does your work mean to you?','Who are you?','What makes you different?'],
    'how was this website built':['What\'s special about this portfolio?','Is this portfolio mobile friendly?','Can you build me a website like this?'],
    'what apps has sahnawaz built': ['What has Sahnawaz shipped recently? 🚀','Tell me about Yojana Sahay 🇮🇳','What is StudyLens AI? 📚'],
    'what has sahnawaz shipped recently': ['Is he actively coding right now?','What\'s his current GitHub streak? 🔥','What apps has Sahnawaz built? 🚀'],
    'is he actively coding right now': ['What has Sahnawaz shipped recently? 🚀','What\'s his current GitHub streak? 🔥','What\'s your tech stack?'],
    'whats his current github streak': ['What has Sahnawaz shipped recently? 🚀','Is he actively coding right now?','How was this AI chatbot built?'],
    'default':           ['Who are you?','What services do you offer?','How can I hire you?']
  };

  function showFollowUpChips(questionAsked){
    if (!followUpWrap || !followUpChips) return;
    var key = questionAsked.toLowerCase().replace(/[^a-z0-9 ']/g,'').trim();
    var suggestions = FOLLOWUP_MAP[key] || FOLLOWUP_MAP['default'];

    followUpChips.innerHTML = '';
    suggestions.forEach(function(q){
      // Don't show the same question that was just asked
      if (q.toLowerCase() === questionAsked.toLowerCase()) return;
      var btn = document.createElement('button');
      btn.className = 'chat-chip';
      btn.style.cssText = 'font-size:0.7rem; padding:4px 10px;';
      btn.textContent = q;
      btn.addEventListener('click', function(){
        btn.classList.add('used');
        followUpWrap.style.display = 'none';
        // find answer from CHIPS or QA
        var found = CHIPS.find(function(c){ return c.q.toLowerCase() === q.toLowerCase(); });
        if (found) handleQ(found.q, found.a);
        else handleQ(q, findAnswer(q));
      });
      followUpChips.appendChild(btn);
    });
    followUpWrap.style.display = 'block';
  }

  /* ========== Keyboard / viewport fix ========== */
  function handleViewport(){
    if (!window.visualViewport || !widget || !isOpen) return;
    var vv = window.visualViewport;
    var winH = window.innerHeight;
    var keyboardH = winH - vv.height - vv.offsetTop;
    if (keyboardH > 100) {
      // keyboard is open — pin widget above keyboard
      widget.style.bottom = (keyboardH + 8) + 'px';
      widget.style.maxHeight = (vv.height - 16) + 'px';
    } else {
      widget.style.bottom = '80px';
      widget.style.maxHeight = '';
    }
    scrollMsgs();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', handleViewport, { passive: true });
  }

  /* Focus input → trigger viewport handler */
  input && input.addEventListener('focus', function(){
    setTimeout(handleViewport, 300);
  });
  input && input.addEventListener('blur', function(){
    setTimeout(handleViewport, 300);
  });

  /* ========== Open / Close ========== */
  window.openChat = function(){
    if (!widget) return;
    widget.classList.add('chat-open');
    isOpen = true;
    idleCount = 0; /* reset so nudges fire fresh every time chat is opened */
    if (!inited){ inited = true; initChat(); }
    setTimeout(handleViewport, 350);
    resetIdleTimer();
    playOpen();

    /* Option 3 — hide pill when chat opens */
    var pill = document.getElementById('chatPill');
    if (pill) { pill.style.animation = 'pillOut 0.25s ease both'; setTimeout(function(){ pill.style.display = 'none'; }, 250); }

    /* Option 5 — set time-based ring color class */
    var h = new Date().getHours();
    widget.classList.remove('time-morning','time-day','time-evening','time-night');
    if      (h >= 5  && h < 12) widget.classList.add('time-morning');
    else if (h >= 12 && h < 17) widget.classList.add('time-day');
    else if (h >= 17 && h < 21) widget.classList.add('time-evening');
    else                         widget.classList.add('time-night');
  };

  function closeChat(){
    widget.classList.remove('chat-open');
    isOpen = false;
    playClose();
    clearTimeout(idleTimer);
    clearTimeout(idleTimer2);
    clearTimeout(idleTimer3);
    idleCount = 0;
    setChipsOpen(false);
    widget.style.bottom = '80px';
    widget.style.maxHeight = '';

    /* Option 3 — show pill when chat closes, auto-hide after 30s */
    var pill = document.getElementById('chatPill');
    if (pill){
      pill.style.display = 'flex';
      pill.style.animation = 'pillIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
      clearTimeout(pill._hideTimer);
      pill._hideTimer = setTimeout(function(){
        pill.style.animation = 'pillOut 0.4s ease both';
        setTimeout(function(){ pill.style.display = 'none'; }, 400);
      }, 30000);
    }
  }

  closeBtn && closeBtn.addEventListener('click', closeChat);

  /* Expand / shrink toggle — Windows-style resize */
  var isExpanded = false;
  expandBtn && expandBtn.addEventListener('click', function(){
    isExpanded = !isExpanded;
    widget.classList.toggle('chat-expanded', isExpanded);
    /* Swap icon: restore icon when expanded, maximise icon when normal */
    var restoreMask = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='15 3 21 3 21 9'/%3E%3Cpolyline points='9 21 3 21 3 15'/%3E%3Cline x1='21' y1='3' x2='14' y2='10'/%3E%3Cline x1='3' y1='21' x2='10' y2='14'/%3E%3C/svg%3E\") center/contain no-repeat";
    var expandMask = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Crect x='8' y='8' width='13' height='13' rx='1.5'/%3E%3C/svg%3E\") center/contain no-repeat";
    var pseudo = expandBtn.querySelector('::before');
    /* Update via a small injected style rule */
    var styleId = 'chatExpandIconStyle';
    var existing = document.getElementById(styleId);
    if (existing) existing.remove();
    var s = document.createElement('style');
    s.id = styleId;
    s.textContent = isExpanded
      ? '#chatExpand::before { -webkit-mask: ' + restoreMask + '; mask: ' + restoreMask + '; }'
      : '#chatExpand::before { -webkit-mask: ' + expandMask  + '; mask: ' + expandMask  + '; }';
    document.head.appendChild(s);
    expandBtn.title = isExpanded ? 'Shrink chat' : 'Expand chat';
    expandBtn.setAttribute('aria-label', isExpanded ? 'Shrink chat' : 'Expand chat');
    /* Scroll to bottom after resize so messages stay visible */
    setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 320);
  });

  /* Clear conversation */
  clearBtn && clearBtn.addEventListener('click', function(){
    msgs.innerHTML = '';
    conversationHistory = [];
    followUpWrap && (followUpWrap.style.display = 'none');
    if (quickReply) quickReply.style.display = 'flex';
    var _sv = null; try { _sv = JSON.parse(localStorage.getItem('shnz_visitor_v1')||'null'); } catch(e){}
    addMsg('bot', getWelcomeMsg(_sv && _sv.firstName ? _sv.firstName : null)); /* always use fresh time-based greeting */
    document.querySelectorAll('.chat-chip').forEach(function(c){ c.classList.remove('used'); });
    setChipsOpen(true);
    resetIdleTimer();
  });

  /* Option 8 — Typewriter welcome message (smooth rAF, no sound) */
  function addMsgTypewriter(text){
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap bot';

    var div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = '';
    wrap.appendChild(div);

    var ts = document.createElement('div');
    ts.className = 'chat-ts';
    var _isoTs = new Date().toISOString();
    ts.textContent = formatTimestamp(_isoTs);
    ts.dataset.iso = _isoTs;
    ts.style.opacity = '0';
    wrap.appendChild(ts);

    msgs.appendChild(wrap);
    scrollMsgs();

    var plain = text.replace(/<br>/g, '\n');
    var fmtWelcome = formatBotReply(plain);
    if (fmtWelcome.rich) {
      div.innerHTML = fmtWelcome.html;
      div.classList.add('rich-reply');
      ts.style.transition = 'opacity 0.4s ease';
      ts.style.opacity = '1';
      addToHistory('bot', text);
      /* Save the greeting to Firestore too (logged-in visitors only —
         _saveChatMessage no-ops harmlessly if no one is signed in), so a
         restored session doesn't jump straight to the visitor's first
         question with no assistant message before it. */
      if (window._saveChatMessage) window._saveChatMessage('bot', text);
      return;
    }

    /* rAF-based typewriter — smooth, no setTimeout stacking, no sound */
    var i = 0;
    var msPerChar = 22;
    var msPause   = 120;
    var last = null;

    function tick(ts_raf){
      if (last === null) last = ts_raf;
      var elapsed = ts_raf - last;
      var delay = (i > 0 && plain[i-1] === '\n') ? msPause : msPerChar;

      if (elapsed >= delay){
        last = ts_raf;
        div.innerHTML = plain.slice(0, ++i).replace(/\n/g, '<br>');
        if (i % 4 === 0) scrollMsgs();
      }

      if (i < plain.length){
        requestAnimationFrame(tick);
      } else {
        scrollMsgs();
        ts.style.transition = 'opacity 0.4s ease';
        ts.style.opacity = '1';
        addToHistory('bot', text);
        /* Same reasoning as above — save the greeting once it's fully typed out. */
        if (window._saveChatMessage) window._saveChatMessage('bot', text);
      }
    }

    setTimeout(function(){ requestAnimationFrame(tick); }, 300);
  }

  /* ========== Init ========== */
  function wireQuickReply() {
    /* Feature 6: Wire up quick-reply CTA buttons */
    if (quickReply){
      var qrBtns = quickReply.querySelectorAll('.chat-qr-btn');
      qrBtns.forEach(function(btn){
        btn.addEventListener('click', function(){
          var q = btn.getAttribute('data-q');
          quickReply.style.display = 'none'; /* hide after first use */
          followUpWrap && (followUpWrap.style.display = 'none');
          var found = CHIPS.find ? CHIPS.find(function(c){ return c.q === q; }) : null;
          /* fallback for IE */
          if (!found){ for(var i=0;i<CHIPS.length;i++){ if(CHIPS[i].q===q){found=CHIPS[i];break;} } }
          handleQ(q, found ? found.a : findAnswer(q));
          resetIdleTimer();
        });
      });
    }
  }

  function initChat(){
    /* Feature 1 + Smart greeting: personalised using Google login name */
    var _savedVisitor = null;
    try { _savedVisitor = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); } catch(e){}
    var _firstName = (_savedVisitor && _savedVisitor.firstName) ? _savedVisitor.firstName : null;
    var greeting = getWelcomeMsg(_firstName);

    /* ── CHAT HISTORY: Load past messages from Firestore if user is logged in ── */
    /* Show a skeleton placeholder immediately so chat never looks blank */
    var _histSkeleton = null;
    if (_savedVisitor && msgs) {
      _histSkeleton = document.createElement('div');
      _histSkeleton.style.cssText = 'text-align:center;padding:18px 0 6px;';
      _histSkeleton.innerHTML =
        '<span style="font-size:0.75rem;color:rgba(0,255,255,0.35);letter-spacing:0.05em;">⟳ loading history\u2026</span>';
      msgs.appendChild(_histSkeleton);
    }
    function _removeHistSkeleton() {
      if (_histSkeleton && _histSkeleton.parentNode) {
        _histSkeleton.parentNode.removeChild(_histSkeleton);
        _histSkeleton = null;
      }
    }

    /* Retry up to 10 times (3 seconds) to wait for Firebase/Firestore to be ready */
    function tryLoadHistory(attemptsLeft) {
      if (window._loadChatHistory && _savedVisitor) {
        window._loadChatHistory(function(history) {
          _removeHistSkeleton();
          if (history && history.length > 0) {
            /* Restore past messages into UI and conversationHistory */
            history.forEach(function(m) {
              var r = (m.role === 'bot') ? 'bot' : 'user';
              /* Normalise Firestore Timestamp → ISO string so formatTimestamp works */
              var savedTime = m.time || null;
              if (savedTime && typeof savedTime === 'object') {
                if (typeof savedTime.toDate === 'function') {
                  savedTime = savedTime.toDate().toISOString();
                } else if (typeof savedTime.seconds === 'number') {
                  savedTime = new Date(savedTime.seconds * 1000).toISOString();
                }
              }
              addMsg(r, m.content, savedTime);
              conversationHistory.push({ role: r, text: m.content });
            });
            /* Visual separator so user knows this is a new session */
            var sep = document.createElement('div');
            sep.style.cssText = 'text-align:center;font-size:0.68rem;color:rgba(0,255,255,0.3);margin:10px 0 6px;letter-spacing:0.05em;';
            sep.textContent = '── new session ──';
            msgs.appendChild(sep);
            scrollMsgs();
            /* Smart AI-powered returning visitor greeting via Groq API */
            var _act = window._visitorActivity;
            var h = new Date().getHours();
            var timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
            var greetingPrompt = 'Generate a warm, unique, personalised returning visitor greeting for a portfolio chatbot. ' +
              'Visitor name: ' + (_firstName || 'friend') + '. ' +
              'Time of day: ' + timeOfDay + '. ' +
              (_act && _act.likedProjects && _act.likedProjects.length > 0 ? 'They previously liked these projects: ' + _act.likedProjects.join(', ') + '. ' : '') +
              (_act && _act.resumeDownloaded ? 'They previously downloaded the resume. ' : '') +
              (_act && _act.reviewSubmitted ? 'They left a ' + _act.reviewSubmitted.stars + ' star review previously. ' : '') +
              (_act && _act.totalChats > 0 ? 'They have sent ' + _act.totalChats + ' messages before. ' : '') +
              'Make it feel genuinely personal, reference their specific activity naturally, use 1-2 emojis, keep it under 3 lines. Be creative and warm each time. No [CAT:] tag needed. No generic phrases.';

            /* Show subtle loading indicator while AI greeting loads */
            var loadingGreet = document.createElement('div');
            loadingGreet.style.cssText = 'color:rgba(0,255,255,0.35);font-size:0.78rem;padding:8px 14px;font-style:italic;';
            loadingGreet.textContent = '✦ personalising...';
            msgs.appendChild(loadingGreet);
            scrollMsgs();

            fetch('https://sahnawaz-portfolio.vercel.app/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: '__GREETING__: ' + greetingPrompt,
                history: [],
                visitorName: _firstName,
                visitorActivity: _act || null,
                clientHour: new Date().getHours()
              })
            })
            .then(function(r){ return r.json(); })
            .then(function(d){
              if (loadingGreet.parentNode) loadingGreet.parentNode.removeChild(loadingGreet);
              var aiGreeting = (d && d.reply && d.reply.trim())
                ? d.reply.replace(/^\[CAT:[^\]]*\]\s*/,'').trim()
                : greeting;
              if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
              addMsgTypewriter(aiGreeting);
              buildChips();
              setChipsOpen(false);
              wireQuickReply();
              /* Force scroll after greeting appears — typewriter may not reach bottom */
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 100);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 600);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 1200);
            })
            .catch(function(){
              if (loadingGreet.parentNode) loadingGreet.parentNode.removeChild(loadingGreet);
              if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
              addMsgTypewriter(greeting);
              buildChips();
              setChipsOpen(false);
              wireQuickReply();
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 100);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 600);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 1200);
            });
            return; /* API callback handles rendering — skip below */
          }
          if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
          addMsgTypewriter(greeting);
          buildChips();
          setChipsOpen(false);
          wireQuickReply();
        });
      } else if (_savedVisitor && attemptsLeft > 0) {
        /* Firebase not ready yet — wait 300ms and retry */
        setTimeout(function(){ tryLoadHistory(attemptsLeft - 1); }, 300);
      } else {
        /* Not logged in, or Firebase never became ready — show greeting immediately */
        _removeHistSkeleton();
        if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
        addMsgTypewriter(greeting);
        buildChips();
        setChipsOpen(false);
        wireQuickReply();
      }
    }
    tryLoadHistory(10);
  }

  /* ========== Chips scroll hint ========== */
  var scrollHint = document.getElementById('chipsScrollHint');

  function updateChipsScrollHint(){
    if (!chips || !chipsWrap) return;
    var scrollable = chips.scrollHeight > chips.clientHeight + 4;
    chipsWrap.classList.toggle('has-scroll', scrollable);
    if (!scrollable){
      chipsWrap.classList.remove('scrolled-to-end');
      if (scrollHint) { scrollHint.classList.remove('hint-visible'); }
      return;
    }
    var atBottom = chips.scrollTop + chips.clientHeight >= chips.scrollHeight - 8;
    chipsWrap.classList.toggle('scrolled-to-end', atBottom);
    if (scrollHint) { scrollHint.classList.toggle('hint-visible', !atBottom); }
  }

  if (chips) {
    chips.addEventListener('scroll', updateChipsScrollHint, { passive:true });
  }

  /* ========== Chips toggle ========== */
  function setChipsOpen(open){
    chipsVisible = open;
    chipsWrap.classList.toggle('chips-open', open);
    chipsToggle.classList.toggle('chips-open', open);
    if (open) { setTimeout(updateChipsScrollHint, 40); }
    else {
      chipsWrap.classList.remove('has-scroll','scrolled-to-end');
      if (scrollHint) scrollHint.classList.remove('hint-visible');
    }
  }

  /* ── Shared closeAll helper ── */
  function closeAllPanels() {
    setChipsOpen(false);
    var cp = document.getElementById('cmdPanel');
    var ct = document.getElementById('cmdToggle');
    if (cp) cp.classList.remove('cmd-open');
    if (ct) ct.classList.remove('cmd-open');
    var hp = document.getElementById('helpPanel');
    var ht = document.getElementById('helpToggle');
    if (hp) hp.classList.remove('help-open');
    if (ht) ht.classList.remove('help-open');
  }

  chipsToggle && chipsToggle.addEventListener('click', function(){
    if (window._helpFlowActive && window._helpFlowActive()) return;
    var opening = !chipsVisible;
    closeAllPanels();
    if (opening) setChipsOpen(true);
  });

  /* ========== Site Commands Panel ========== */
  (function(){
    var cmdToggleEl = document.getElementById('cmdToggle');
    var cmdPanelEl  = document.getElementById('cmdPanel');
    var cmdToast    = document.getElementById('cmdCopyToast');
    if (!cmdToggleEl || !cmdPanelEl) return;

    var cmdOpen = false;
    cmdToggleEl.addEventListener('click', function(){
      if (window._helpFlowActive && window._helpFlowActive()) return;
      /* Read the real DOM state, not the local flag — another panel's
         closeAllPanels() call can close this panel without ever touching
         cmdOpen, which used to leave it stale and require a double-click
         to reopen. */
      var opening = !cmdPanelEl.classList.contains('cmd-open');
      closeAllPanels();
      if (opening) {
        cmdOpen = true;
        cmdPanelEl.classList.add('cmd-open');
        cmdToggleEl.classList.add('cmd-open');
      } else {
        cmdOpen = false;
      }
    });

    /* Tap a command button → fill input and send */
    cmdPanelEl.addEventListener('click', function(e){
      var btn = e.target.closest('.cmd-btn');
      if (btn) {
        var cmd = btn.getAttribute('data-cmd');
        if (cmd && input) {
          input.value = cmd;
          /* close panel then send */
          cmdOpen = false;
          cmdPanelEl.classList.remove('cmd-open');
          cmdToggleEl.classList.remove('cmd-open');
          sendMessage();
        }
        return;
      }

      /* Copy button */
      var copyBtn = e.target.closest('.cmd-copy');
      if (copyBtn) {
        var text = copyBtn.getAttribute('data-copy');
        if (!text) return;
        try {
          navigator.clipboard.writeText(text).then(function(){
            copyBtn.classList.add('copied');
            copyBtn.textContent = '✓';
            if (cmdToast) { cmdToast.style.display = 'block'; }
            setTimeout(function(){
              copyBtn.classList.remove('copied');
              copyBtn.textContent = '⧉';
              if (cmdToast) { cmdToast.style.display = 'none'; }
            }, 1600);
          });
        } catch(err) {
          /* Fallback for older browsers */
          var ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.classList.add('copied');
          copyBtn.textContent = '✓';
          if (cmdToast) { cmdToast.style.display = 'block'; }
          setTimeout(function(){
            copyBtn.classList.remove('copied');
            copyBtn.textContent = '⧉';
            if (cmdToast) { cmdToast.style.display = 'none'; }
          }, 1600);
        }
      }
    });
  })();
  /* ========== End Site Commands Panel ========== */

  /* ========== Help Panel — Smart Actions ========== */
  (function(){
    var helpToggleEl = document.getElementById('helpToggle');
    var helpPanelEl  = document.getElementById('helpPanel');
    if (!helpToggleEl || !helpPanelEl) return;

    var helpOpen = false;

    /* Toggle help panel */
    helpToggleEl.addEventListener('click', function(){
      /* Read the real DOM state — see matching note in the Commands panel
         toggle above; a stale local flag caused the same double-click bug. */
      var opening = !helpPanelEl.classList.contains('help-open');
      closeAllPanels();
      if (opening) {
        helpOpen = true;
        helpPanelEl.classList.add('help-open');
        helpToggleEl.classList.add('help-open');
      } else {
        helpOpen = false;
      }
    });

    /* ── Conversational flow state ── */
    var _flow   = null;  // 'quickmail' | 'resume' | 'callback'
    var _step   = 0;
    var _data   = {};    // collected: name, email, message, phone, time
    var _apiUrl = 'https://sahnawaz-portfolio.vercel.app/api/';

    /* Inject a bot message that looks native */
    function botSay(text) {
      /* Re-use addBotTyping if available, else fallback */
      if (typeof addBotTyping === 'function') {
        addBotTyping(text, '');
      } else {
        var wrap = document.createElement('div');
        wrap.className = 'chat-msg-wrap bot';
        var bubble = document.createElement('div');
        bubble.className = 'chat-msg bot';
        bubble.textContent = text;
        wrap.appendChild(bubble);
        msgs.appendChild(wrap);
        scrollMsgs();
      }
    }

    /* Add user message to chat visually */
    function userSay(text) {
      if (typeof addMsg === 'function') addMsg('user', text);
      /* Also save help-flow user inputs (name, email, message steps) to Firestore */
      if (window._saveChatMessage) window._saveChatMessage('user', text);
    }

    /* Set input placeholder */
    function setPlaceholder(text) {
      setTimeout(function() {
        var inp = document.getElementById('chatInput');
        if (inp) inp.placeholder = text;
      }, 50);
    }

    /* Show cancel button in chat */
    function showCancelBtn() {
      var existing = document.getElementById('flowCancelWrap');
      if (existing) existing.parentNode.removeChild(existing);
      var chatMsgs = document.getElementById('chatMessages');
      if (!chatMsgs) return;
      var wrap = document.createElement('div');
      wrap.id = 'flowCancelWrap';
      wrap.style.cssText = 'padding:4px 12px;';
      var btn = document.createElement('button');
      btn.textContent = '❌ Cancel';
      btn.style.cssText = 'background:rgba(255,60,60,0.12);border:1px solid rgba(255,80,80,0.35);color:#ff6b6b;padding:6px 18px;border-radius:999px;font-size:0.8rem;cursor:pointer;';
      btn.onclick = function() {
        _flow = null; _step = 0; _data = {};
        setPlaceholder('Ask anything about Sahnawaz…');
        var el = document.getElementById('flowCancelWrap');
        if (el) el.parentNode.removeChild(el);
        botSay("No problem! Feel free to ask me anything 😊");
      };
      wrap.appendChild(btn);
      chatMsgs.appendChild(wrap);
      scrollMsgs();
    }

    /* Remove cancel button */
    function removeCancelBtn() {
      var el = document.getElementById('flowCancelWrap');
      if (el) el.parentNode.removeChild(el);
    }

    /* Reset flow */
    function resetFlow() {
      _flow = null; _step = 0; _data = {}; _errCount = {};
      setPlaceholder('Ask anything about Sahnawaz…');
      removeCancelBtn();
    }

    /* Start a flow */
    function startFlow(type) {
      resetFlow();
      _flow = type;
      _step = 1;
      helpOpen = false;
      helpPanelEl.classList.remove('help-open');
      helpToggleEl.classList.remove('help-open');

      /* ── Smart pre-fill: use Google login data if available ── */
      var _loggedIn = null;
      try { _loggedIn = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); } catch(e) {}
      var _knownName  = _loggedIn && _loggedIn.firstName  ? _loggedIn.firstName  : null;
      var _knownEmail = _loggedIn && _loggedIn.email      ? _loggedIn.email      : null;
      var _knownFull  = _loggedIn && _loggedIn.fullName   ? _loggedIn.fullName   : _knownName;

      if (type === 'quickmail') {
        if (_knownName && _knownEmail) {
          /* Both known — skip name + email, jump straight to message */
          _data.name  = _knownFull;
          _data.email = _knownEmail;
          _step = 3;
          botSay("Hey " + _knownName + "! 👋 I already have your details from your Google login.\n\nJust type your message for Sahnawaz below 💬");
          setPlaceholder('Type your message...');
        } else if (_knownName) {
          /* Name known — skip to email step */
          _data.name = _knownFull;
          _step = 2; _errCount.qmEmail = 0;
          botSay("Hey " + _knownName + "! 👋 What's your email address so Sahnawaz can reply to you?");
          setPlaceholder('Type your email...');
        } else {
          botSay("Sure! Let's send Sahnawaz a message 📧\n\nFirst, what's your name?");
          setPlaceholder('Type your name...');
        }

      } else if (type === 'resume') {
        if (_knownName && _knownEmail) {
          /* Both known — send resume immediately, no questions needed */
          _data.name  = _knownFull;
          _data.email = _knownEmail;
          botSay("Sending Sahnawaz's resume to **" + _knownEmail + "**... ⏳");
          var rsName = _data.name, rsEmail = _data.email;
          resetFlow();
          fetch(_apiUrl + 'resume', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: rsName, email: rsEmail })
          })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d.success) botSay("✅ Resume sent to " + rsEmail + "!\n\nCheck your inbox (and spam just in case). Hope it impresses you, " + rsName + "! 😄");
            else botSay("⚠️ Something went wrong. Please try opening the resume from the portfolio page directly.");
          })
          .catch(function() { botSay("⚠️ Network error. Please try the resume button on the portfolio page."); });
          return; /* flow already reset inside, skip showCancelBtn */
        } else if (_knownName) {
          _data.name = _knownFull;
          _step = 2; _errCount.rsEmail = 0;
          botSay("Hey " + _knownName + "! 📧 What email should I send the resume to?");
          setPlaceholder('Type your email...');
        } else {
          botSay("Sure! I'll email Sahnawaz's resume to you 📄\n\nWhat's your name?");
          setPlaceholder('Type your name...');
        }

      } else if (type === 'callback') {
        if (_knownName && _knownEmail) {
          /* Name + email known — skip both, start at phone */
          _data.name  = _knownFull;
          _data.email = _knownEmail;
          _step = 2; _errCount.cbPhone = 0;
          botSay("Hey " + _knownName + "! 📞 I've got your name and email from your Google login.\n\nPlease enter your 10-digit mobile number.\n(India: +91 is assumed — just type the 10 digits)");
          setPlaceholder('e.g. 9876543210');
        } else if (_knownName) {
          _data.name = _knownFull;
          _step = 2; _errCount.cbPhone = 0;
          botSay("Hey " + _knownName + "! 📞 Please enter your 10-digit mobile number.\n(India: +91 is assumed — just type the 10 digits)");
          setPlaceholder('e.g. 9876543210');
        } else {
          botSay("Let's set up a callback with Sahnawaz 📅\n\nWhat's your name?");
          setPlaceholder('Type your name...');
        }
      }

      showCancelBtn();
    }

    /* ── Validation helpers ── */
    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    }
    function isValidPhone(v) {
      var digits = v.trim().replace(/[\s\-().]/g, '');
      return /^\+?\d{10,13}$/.test(digits) && digits.replace(/\D/g,'').length >= 10;
    }
    function isValidContact(v) {
      return isValidEmail(v) || isValidPhone(v);
    }

    /* ── Per-field error counters — reset on every startFlow ── */
    var _errCount = {};
    var _origResetFlow = null; /* patched below */

    /* Smart cancel nudge — varies by attempt so it never feels robotic */
    /* Email-only flows (quickmail, resume) — no phone mention */
    var _cancelNudgesEmail = [
      "Still not quite right 😅 — try something like name@gmail.com\n\nOr if you'd rather ask something else, the ❌ Cancel button above will free you right up!",
      "No worries, typos happen! Double-check and try again 🙂\n\nAnd hey — if you've changed your mind or had another question pop up, just tap ❌ Cancel anytime.",
      "Still having trouble? A valid email looks like: user@mail.com ✍️\n\nNo pressure — hit ❌ Cancel above if you'd like to explore something else first.",
      "One more try! Make sure it has an @ and a domain — like name@gmail.com 📧\n\nOr use ❌ Cancel if you want to chat about something else — I'm not going anywhere! 😊"
    ];
    /* Callback flow — phone only nudges */
    var _cancelNudgesContact = [
      "Still not quite right 😅 — just 10 digits, like 9876543210. No +91 needed!\n\nOr if you'd rather ask something else, the ❌ Cancel button above will free you right up!",
      "No worries, typos happen! Double-check and try again 🙂 — exactly 10 digits.\n\nAnd hey — if you've changed your mind, just tap ❌ Cancel anytime.",
      "Still having trouble? Make sure it's exactly 10 digits 📋 — e.g. 98765 43210.\n\nNo pressure — hit ❌ Cancel above if you'd like to explore something else first.",
      "One more try! Just 10 digits — like 9876543210 ✍️\n\nOr use ❌ Cancel if you want to chat about something else — I'm not going anywhere! 😊"
    ];
    function getCancelNudge(errN, type) {
      var arr = (type === 'contact') ? _cancelNudgesContact : _cancelNudgesEmail;
      var idx = Math.min(errN - 2, arr.length - 1);
      return arr[idx];
    }

    /* Handle each step of the flow — called from sendMessage intercept */
    window._helpFlowActive = function() { return _flow !== null; };

    window._helpFlowStep = function(userInput) {
      if (!_flow) return false;

      userSay(userInput);

      /* ── Quick Mail flow ── */
      if (_flow === 'quickmail') {
        if (_step === 1) {
          _data.name = userInput; _step = 2; _errCount.qmEmail = 0;
          botSay("Nice to meet you, " + userInput + "! 😊\n\nWhat's your email address?");
          setPlaceholder('Type your email...'); return true;
        }
        if (_step === 2) {
          if (!isValidEmail(userInput)) {
            _errCount.qmEmail = (_errCount.qmEmail || 0) + 1;
            if (_errCount.qmEmail === 1) {
              botSay("Hmm, that doesn't look like a valid email. 🤔\n\nPlease enter a proper email — like name@example.com");
            } else {
              botSay(getCancelNudge(_errCount.qmEmail, 'email'));
            }
            return true;
          }
          _errCount.qmEmail = 0;
          _data.email = userInput; _step = 3;
          botSay("Got it! Now type your message for Sahnawaz 💬"); setPlaceholder('Type your message...'); return true;
        }
        if (_step === 3) {
          _data.message = userInput;
          botSay("Sending your message... ⏳");
          var qmName = _data.name, qmEmail = _data.email, qmMsg = _data.message;
          resetFlow();
          fetch(_apiUrl + 'contact', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name: qmName, email: qmEmail, message: qmMsg })
          })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success) botSay("✅ Message delivered to Sahnawaz!\n\nA confirmation has been sent to **" + qmEmail + "** — please check your inbox (and spam, just in case).\n\nHe'll reply to you within **24 hours**. Talk soon, " + qmName + "! 🚀");
            else botSay("⚠️ Something went wrong. Please email directly: shzthedigitalalchemist@gmail.com");
          })
          .catch(function(){ botSay("⚠️ Network error. Please try: shzthedigitalalchemist@gmail.com"); });
          return true;
        }
      }

      /* ── Resume flow ── */
      if (_flow === 'resume') {
        if (_step === 1) {
          _data.name = userInput; _step = 2; _errCount.rsEmail = 0;
          botSay("Nice to meet you, " + userInput + "! 📧\n\nWhat's your email address? I'll send the resume there.");
          setPlaceholder('Type your email...'); return true;
        }
        if (_step === 2) {
          if (!isValidEmail(userInput)) {
            _errCount.rsEmail = (_errCount.rsEmail || 0) + 1;
            if (_errCount.rsEmail === 1) {
              botSay("That doesn't look like a valid email. 🤔\n\nPlease enter a proper email — like name@example.com");
            } else {
              botSay(getCancelNudge(_errCount.rsEmail, 'email'));
            }
            return true;
          }
          _errCount.rsEmail = 0;
          _data.email = userInput;
          botSay("Sending resume to " + _data.email + "... ⏳");
          var rsName = _data.name, rsEmail = _data.email;
          resetFlow();
          fetch(_apiUrl + 'resume', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name: rsName, email: rsEmail })
          })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success) botSay("✅ Resume sent to " + rsEmail + "!\n\nCheck your inbox (and spam just in case). Hope it impresses you, " + rsName + "! 😄");
            else botSay("⚠️ Something went wrong. Please try opening the resume from the portfolio page directly.");
          })
          .catch(function(){ botSay("⚠️ Network error. Please try the resume button on the portfolio page."); });
          return true;
        }
      }

      /* ── Callback flow ── */
      if (_flow === 'callback') {
        /* Step 1 — Name */
        if (_step === 1) {
          _data.name = userInput; _step = 2; _errCount.cbPhone = 0;
          botSay("Hi " + userInput + "! 📞\n\nPlease enter your 10-digit mobile number.\n(India: +91 is assumed — just type the 10 digits)");
          setPlaceholder('e.g. 9876543210'); return true;
        }
        /* Step 2 — Phone (10 digits, +91 auto-prepended) */
        if (_step === 2) {
          var rawPhone = userInput.trim().replace(/[\s\-().]/g, '');
          var digitsOnly = rawPhone.replace(/^\+?91/, '').replace(/\D/g, '');
          if (digitsOnly.length !== 10) {
            _errCount.cbPhone = (_errCount.cbPhone || 0) + 1;
            if (_errCount.cbPhone === 1) {
              botSay("That doesn't look right. 🤔\n\nPlease enter your 10-digit Indian mobile number.\nExample: 9876543210\n(No need to add +91 — I've got that covered!)");
            } else {
              botSay("Still not matching 😅 — a 10-digit number like 98765 43210 is all I need.\n\nHit ❌ Cancel above if you'd like to try something else first.");
            }
            return true;
          }
          _errCount.cbPhone = 0;
          _data.phone = '+91 ' + digitsOnly; _step = 3;
          botSay("Got it! 🇮🇳 Saved as +91 " + digitsOnly + "\n\nBriefly, what's the purpose of your call?\n(e.g. 'Discuss a web project', 'Get a quote', 'Partnership idea')");
          setPlaceholder('e.g. Discuss a project...'); return true;
        }
        /* Step 3 — Purpose */
        if (_step === 3) {
          var purposeTrimmed = userInput.trim();
          if (purposeTrimmed.length < 3) {
            botSay("Just a few words is fine! 😊\n\nWhat would you like to discuss with Sahnawaz?\n(e.g. 'Web project', 'Freelance quote', 'Partnership idea')");
            return true;
          }
          _data.purpose = purposeTrimmed; _step = 4;
          botSay("Great context, thanks! 🙌\n\nWhen's a good time for the call?\n(e.g. 'Tomorrow 3 PM' or 'Weekdays after 6 PM')");
          setPlaceholder('Type preferred time...'); return true;
        }
        /* Step 4 — Preferred time */
        if (_step === 4) {
          _data.time = userInput;
          /* If email pre-filled from Google login — skip step 5, submit directly */
          if (_data.email && isValidEmail(_data.email)) {
            botSay("Sending your callback request... ⏳");
            var cbName4 = _data.name, cbPhone4 = _data.phone, cbEmail4 = _data.email, cbTime4 = _data.time, cbPurpose4 = _data.purpose;
            resetFlow();
            fetch(_apiUrl + 'callback', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cbName4, phone: cbPhone4, email: cbEmail4, purpose: cbPurpose4, time: cbTime4 })
            })
            .then(function(r){ return r.json(); })
            .then(function(d){
              if (d.success && d.confirmed) {
                botSay("✅ All done, " + cbName4 + "!\n\nSahnawaz has been notified and will call you at " + cbPhone4 + " around " + cbTime4 + ".\n\n📧 A confirmation email has been sent to " + cbEmail4 + " — check your inbox (and spam folder just in case).\n\nTalk soon! 🙌");
              } else if (d.success) {
                botSay("✅ Callback request sent to Sahnawaz!\n\nHe'll reach out at " + cbPhone4 + " around " + cbTime4 + ".\n\n⚠️ Confirmation email couldn't be delivered to " + cbEmail4 + " — but your request is safely logged. Talk soon, " + cbName4 + "! 🙌");
              } else {
                botSay("⚠️ Something went wrong. Please email Sahnawaz directly: shzthedigitalalchemist@gmail.com");
              }
            })
            .catch(function(){ botSay("⚠️ Network error. Please email: shzthedigitalalchemist@gmail.com"); });
            return true;
          }
          _step = 5; _errCount.cbEmail = 0;
          botSay("Perfect! Almost there. 🎯\n\nLastly, your email address please.\n\n📌 This lets us send you an instant confirmation so your callback is properly logged and gets priority attention from Sahnawaz.");
          setPlaceholder('Type your email...'); return true;
        }
        /* Step 5 — Email + submit */
        if (_step === 5) {
          if (!isValidEmail(userInput)) {
            _errCount.cbEmail = (_errCount.cbEmail || 0) + 1;
            if (_errCount.cbEmail === 1) {
              botSay("Hmm, that doesn't look like a valid email. 🤔\n\nPlease enter a proper email — like name@example.com");
            } else {
              botSay(getCancelNudge(_errCount.cbEmail, 'email'));
            }
            return true;
          }
          _errCount.cbEmail = 0;
          _data.email = userInput;
          botSay("Sending your callback request... ⏳");
          var cbName = _data.name, cbPhone = _data.phone, cbEmail = _data.email, cbTime = _data.time, cbPurpose = _data.purpose;
          resetFlow();

          fetch(_apiUrl + 'callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cbName,
              phone: cbPhone,
              email: cbEmail,
              purpose: cbPurpose,
              time: cbTime
            })
          })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success && d.confirmed) {
              botSay("✅ All done, " + cbName + "!\n\nSahnawaz has been notified and will call you at " + cbPhone + " around " + cbTime + ".\n\n📧 A confirmation email has been sent to " + cbEmail + " — check your inbox (and spam folder just in case).\n\nTalk soon! 🙌");
            } else if (d.success) {
              botSay("✅ Callback request sent to Sahnawaz!\n\nHe'll reach out at " + cbPhone + " around " + cbTime + ".\n\n⚠️ Confirmation email couldn't be delivered to " + cbEmail + " — but your request is safely logged. Talk soon, " + cbName + "! 🙌");
            } else {
              botSay("⚠️ Something went wrong. Please email Sahnawaz directly: shzthedigitalalchemist@gmail.com");
            }
          })
          .catch(function(){ botSay("⚠️ Network error. Please email: shzthedigitalalchemist@gmail.com"); });
          return true;
        }
      }

      return false;
    };

    /* Help button clicks */
    helpPanelEl.addEventListener('click', function(e){
      var btn = e.target.closest('.help-btn');
      if (!btn) return;
      var type = btn.getAttribute('data-help');
      if (type) startFlow(type);
    });

  })();
  /* ========== End Help Panel ========== */

  var CHIPS = [
    /* ── 🎯 Top 3 CTA questions — shown first ── */
    { q:"What services do you offer?",
      a: QA[1].a },
    { q:"What's your pricing?",
      a:"[CAT:pricing]\n##💰 Pricing Breakdown##\n!!All prepaid · Transparent · No hidden costs 🙌!!\n---\n##🌐 Full Packages##\n>>Full Website Design | from ₹9,999<<\n>>Portfolio Website | from ₹6,999<<\n>>E-Commerce Store | from ₹14,999<<\n>>Web Ads & Campaign | from ₹3,999<<\n---\n##⚙️ Individual Services##\n>>Frontend Dev (HTML/CSS/JS) | from ₹4,999<<\n>>Backend / API (Node/Firebase) | from ₹5,999<<\n>>UI/UX Design (Figma/XD) | from ₹3,999<<\n>>Custom Domain Setup | ₹1,500 one-time<<\n---\n!!Need something custom? Just message — Sahnawaz always finds a way. 💡!!" },
    { q:"How can I hire you?",
      a: QA[2].a },

    /* ── 🤖 AI & Chatbot highlights first ── */
    { q:"Is Sahnawaz recognized by AI?",
      a:"[CAT:about]\n##🌐 AI & Search Recognition##\n!!Sahnawaz is verified across every major AI platform — that's rare. 🚀!!\n---\n##🔍 Where He's Recognized##\n- **Google Search** — ranks at the top when you search his name\n- **Google Gemini** — accurately describes his skills & services\n- **ChatGPT** — identifies him as Website Developer & UI/UX Designer\n- **WhatsApp Meta AI** — knows his background & work\n- **Instagram Meta AI** — confirms his full skill set\n---\n##💡 Why This Matters##\nWhen multiple AI systems describe you consistently, it builds **digital trust** before you even speak. That's the power of a strong online identity." },
    { q:"How was this AI chatbot built?",
      a:"[CAT:skills]\n##🤖 About This AI Chatbot##\n!!Built from scratch by Sahnawaz — no third-party widget, no shortcuts. 🧠!!\n---\n##⚡ Tech Stack##\n- **Groq AI** — ultra-fast inference engine\n- **Llama Model** — powerful open-source AI\n- **Vercel Serverless** — lightning-fast scalable backend\n---\n##✅ Features Built In##\n- Custom knowledge base trained on everything about Sahnawaz\n- Conversation memory within a session\n- Intent detection (pricing, hiring, contact, skills)\n- Hindi & Bengali language auto-detection\n- Spam & abuse filter\n- 14,400 free messages / day capacity\n---\n!!This is v2.0 — and v3.0 is already in the works. 🔥!!" },

    /* ── 🚀 Live Products — StudyLens AI & Yojana Sahay ── */
    { q:"What apps has Sahnawaz built? 🚀",
      a:"[CAT:about]\n##🚀 Live Products — Built & Shipped##\n!!Two real, live AI-powered products — built solo, deployed to the world. 🌍!!\n---\n##📚 StudyLens AI##\n- AI homework helper for students in Assam\n- Covers **SEBA, AHSEC, CBSE & ICSE** syllabi\n- Answers in **4 languages** — English, Bengali, Hindi & Assamese\n- Snap a photo from your textbook — AI solves it instantly\n- 🔗 studylens-ai-gamma.vercel.app\n---\n##🇮🇳 Yojana Sahay##\n- India's free AI-powered **government scheme finder**\n- Covers **3,000+ Central & State welfare schemes**\n- Bilingual — **Hindi & English**\n- Find what you qualify for in minutes\n- 🔗 yojanasahay.vercel.app\n---\n!!Both built solo — from idea to deployed product. That's what a real full stack developer does. 💪!!" },

    { q:"What is StudyLens AI? 📚",
      a:"[CAT:about]\n##📚 StudyLens AI — AI Homework Helper##\n!!A full AI study platform built by Sahnawaz — live and free to use. 🎓!!\n---\n##🎯 What It Does##\n- Select your **board, class & subject** — fully personalised\n- **Type a question** or **snap a photo** from your textbook\n- Get a **step-by-step AI answer instantly**\n- Answers available in **English, Bengali, Hindi & Assamese**\n---\n##🏫 Boards Covered##\n>>SEBA | Assam State Board<<\n>>AHSEC | Assam Higher Secondary<<\n>>CBSE | Central Board<<\n>>ICSE | Indian Certificate<<\n---\n##⚡ Extra Features##\n- Firebase-synced history — works across all your devices\n- Multi-profile support — whole family can use one app\n- Bookmark doubts, take quick quizzes, read aloud\n---\n🔗 studylens-ai-gamma.vercel.app\n!!Built for students, parents & learners in Assam. Made with love. 🌿!!" },

    { q:"Tell me about Yojana Sahay 🇮🇳",
      a:"[CAT:about]\n##🇮🇳 Yojana Sahay — Government Scheme Finder##\n!!India's free AI platform to find welfare schemes you actually qualify for. 💡!!\n---\n##🎯 What It Does##\n- Covers **3,000+ Central & State government schemes**\n- AI eligibility checker — answer simple questions, get matched instantly\n- Fully **bilingual** — switch between Hindi and English\n- Covers PM schemes, state programs, subsidies & financial assistance\n---\n##💥 Why It Matters##\nMillions of Indians miss out on welfare benefits they legally qualify for — simply because they don't know these schemes exist. **Yojana Sahay fixes that.**\n---\n##🌍 Who It's For##\n- Every Indian citizen\n- Especially rural & semi-urban populations\n- Anyone searching for government benefits in their language\n---\n🔗 yojanasahay.vercel.app\n!!Free. No login. No barrier. Built as a civic contribution. 🙏!!" },

    /* ── 📡 Recently Shipped — live GitHub activity ── */
    { q:"What has Sahnawaz shipped recently? 🚀",
      a:"Great question — that's live data pulled straight from his GitHub, updated in real time. Check the \"Recently Shipped\" section on this page for the full feed, or just ask me directly!" },
    { q:"Is he actively coding right now?",
      a:"His GitHub activity updates live — ask me and I'll pull his current streak and latest pushes for you." },
    { q:"What's his current GitHub streak? 🔥",
      a:"His streak and all-time contribution count are tracked live from GitHub — ask me and I'll tell you the real current numbers." },

    /* ── 🌐 About this website first ── */
    { q:"How was this website built?",
      a:"Every single line of this portfolio was hand-coded by Sahnawaz — no templates, no page builders. HTML, CSS, JavaScript, with particles, retro hacker mode, XP gamification, this chat, typing animations — all written from scratch. Late nights, lo-fi music, and a whole lot of chai went into this. ❤️" },
    { q:"What's special about this portfolio?",
      a:"Most portfolios look the same — a photo, a list of skills, done. This one has a retro hacker mode 🖥️, a laptop typing popup, particle animations, XP-style gamification, character-by-character text effects, and an AI-powered chat. None of it was copied. All of it was felt. 🚀" },
    { q:"What is the Hacker Mode? 🖥️",
      a:"[CAT:about]\n##🖥️ Retro Hacker Mode##\n!!One of the most creative features on this portfolio — built 100% from scratch. 🔥!!\n---\n##⚡ How to Activate##\n- Click the **🎮 toggle button** in the bottom-right corner\n- The entire page transforms into a **green monospace terminal aesthetic** with scanline overlays\n- A fully functional **retro terminal** appears — type commands and explore\n---\n##💻 Commands You Can Try##\n>>General | help · about · clear · date · ping<<\n>>Fun | joke · fortune · quote · matrix · easteregg<<\n>>System | whoami · sysinfo · hack · scan · ipconfig<<\n>>Premium Effects | selfdestruct · earthquake · timewarp · blackout · warpdrive<<\n---\n##🐣 Hidden Easter Eggs##\n- Type **secret**, **diagnose**, **heartbeat**, **prescription** for surprise responses\n- Type a **family member\'s first name** (e.g. jamal, afiya) for personal messages\n- Type **easteregg** for a hint about even more hidden commands\n---\n!!Pure vanilla JavaScript — zero libraries. A creative flex that most developers can\'t even imagine, let alone build. 💪!!" },
    { q:"Is this portfolio mobile friendly?",
      a:"Absolutely — fully responsive across all screen sizes. Sahnawaz built it mobile-first, meaning it was designed for your phone before anything else. Fast load, clean layout, smooth animations — works beautifully on any device. 📱" },
    { q:"Can you build me a website like this?",
      a:"Yes! And it'll be built just as carefully — custom, responsive, and uniquely yours. No copy-paste. No recycled templates. Just clean, purposeful code that represents you well.\n\n📧 shzthedigitalalchemist@gmail.com\n📸 @sahnawaz.ui.dev\n\nJust reach out and let's talk. 😊" },

    /* ── 👤 About Sahnawaz ── */
    { q:"Who are you?",
      a: QA[0].a },
    { q:"How old are you?",
      a:"Sahnawaz is 28 years old! Born and raised right here in Silchar, Assam — in the Berenga area specifically. Still young, already done so much. 🎂" },
    { q:"Where are you from?",
      a:"Silchar (Berenga), Assam, India — a smaller city in Northeast India. And yes, he's proud of it. Talent doesn't come from geography. 🌏" },
    { q:"What's your educational background?",
      a:"Sahnawaz holds a Diploma in Computer Applications, plus certifications in Web Development, Advanced Excel, Technical & Backend Support, JavaScript, C++ and HTML. Every single one earned while working full-time. That kind of discipline doesn't show up on a certificate — but it shows up in the work. 🎖️" },
    { q:"What's your proudest moment?",
      a:"A senior at Flipkart praised Sahnawaz's work publicly — in front of the entire team. No warning, no preparation. Just pure, honest recognition. For someone from a small city who worked incredibly hard to earn that seat at the table, that moment meant everything. 🏅" },
    { q:"What's your dream?",
      a:"To build his own digital agency — a tight team of sharp, creative people making things that actually matter for real clients. Not just freelancing forever, but something with a name, a legacy, a culture. He's been laying that foundation one project at a time. 🌍" },
    { q:"When do you do your best work?",
      a:"Late nights, without question ☕ — lo-fi music low in the background, a strong cup of chai on the desk, the world completely quiet outside. That's when the ideas come fast and the code flows clean. Something about that stillness just clicks. 🌙" },
    { q:"What does your work mean to you?",
      a:"It's never just been about money. For Sahnawaz, it's about building something that outlasts him — putting his name on something great and knowing it'll still be helping people long after the project is delivered. That's what keeps him going at 2am. 🔥" },
    { q:"What languages do you speak?",
      a:"Hindi, Assamese, Bengali and English — all fluently. Working with clients from different parts of India or internationally has never had a communication barrier. That's actually a bigger advantage than people realise. 🗣️" },

    /* ── 💼 Work & services ── */
    { q:"Worked with big brands?",
      a: QA[4].a },
    { q:"What makes you different?",
      a:"[CAT:hiring]\n##💥 What Makes Sahnawaz Different##\n!!Not marketing — this is just how he works. 🔥!!\n---\n- **Custom animated UI** — not recycled templates\n- **Replies within hours** — not days\n- **Lifetime post-delivery support** — always there\n- **Transparent fixed pricing** — no surprise invoices\n- **One person who genuinely cares** — not a faceless agency\n- **Developer AND designer** — beauty + function in one person\n- **Proven at Flipkart, Xiaomi & Rapido** — real corporate experience" },
    { q:"What services do you offer?",
      a: QA[1].a },
    { q:"What's your tech stack?",
      a: QA[3].a },
    { q:"How long does a project take?",
      a: QA[5].a },
    { q:"What's your pricing?",
      a:"[CAT:pricing]\n##💰 Pricing Breakdown##\n!!All prepaid · Transparent · No hidden costs 🙌!!\n---\n##🌐 Full Packages##\n>>Full Website Design | from ₹9,999<<\n>>Portfolio Website | from ₹6,999<<\n>>E-Commerce Store | from ₹14,999<<\n>>Web Ads & Campaign | from ₹3,999<<\n---\n##⚙️ Individual Services##\n>>Frontend Dev (HTML/CSS/JS) | from ₹4,999<<\n>>Backend / API (Node/Firebase) | from ₹5,999<<\n>>UI/UX Design (Figma/XD) | from ₹3,999<<\n>>Custom Domain Setup | ₹1,500 one-time<<\n---\n!!Need something custom? Just message — Sahnawaz always finds a way. 💡!!" },
    { q:"Do you offer post-delivery support?",
      a: QA[7].a },
    { q:"Can I trust you?",
      a:"That's the most important question anyone can ask. Sahnawaz has worked with Flipkart, Xiaomi India, and Rapido — companies that don't take chances on unreliable people. Every testimonial on this page is real, from real colleagues and managers. References available on request. He has nothing to hide. 🤝" },
    { q:"How can I hire you?",
      a: QA[2].a }
  ];

  function buildChips(){
    chips.innerHTML = '';
    CHIPS.forEach(function(item, idx){
      var btn = document.createElement('button');
      btn.className = 'chat-chip';
      /* First 3 get CTA-style coloring */
      if (idx === 0) btn.style.cssText = 'background:rgba(0,255,120,0.12);border-color:rgba(0,255,120,0.4);color:#00ff88;font-weight:700;';
      if (idx === 1) btn.style.cssText = 'background:rgba(0,180,255,0.12);border-color:rgba(0,180,255,0.4);color:#00ccff;font-weight:700;';
      if (idx === 2) btn.style.cssText = 'background:rgba(255,160,0,0.12);border-color:rgba(255,160,0,0.4);color:#ffaa00;font-weight:700;';
      btn.textContent = item.q;
      btn.addEventListener('click', function(){
        btn.classList.add('used');
        handleQ(item.q, item.a);
        setChipsOpen(false);
      });
      chips.appendChild(btn);
    });
    /* re-check scroll hint after chips are built */
    setTimeout(updateChipsScrollHint, 20);
  }

  /* ========== Handle Q ========== */
  function handleQ(question, answer){
    followUpWrap && (followUpWrap.style.display = 'none');
    if (quickReply) quickReply.style.display = 'none';
    input.value = question;
    sendMessage();
  }

  /* ========== Web Audio Sound Engine (no files needed) ========== */
  var audioCtx = null;
  var soundOn = true; // default ON

  function getAudioCtx(){
    if (!audioCtx){
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    return audioCtx;
  }

  /* Soft click/pop for user send */
  function playSend(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  /* ── Premium open sound: warm rising two-note chime (C5 → E5 → G5) ── */
  function playOpen(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var now = ctx.currentTime;
    var notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major chord sweep
    notes.forEach(function(freq, i){
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = now + i * 0.10; // stagger each note by 100ms
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /* ── Premium close sound: soft falling two-note swoosh (G5 → E5 → C5) ── */
  function playClose(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var now = ctx.currentTime;
    var notes = [783.99, 659.25, 523.25]; // G5 → E5 → C5 — descending
    notes.forEach(function(freq, i){
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = now + i * 0.085;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /* Gentle notification 'ding' for bot reply */
  function playReceive(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523, ctx.currentTime);          // C5
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.07);   // E5
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.30);
  }



  /* =====================================================
     💎 PREMIUM RICH REPLY FORMATTER
     ===================================================== */
  /* ── Deep-link chips ──────────────────────────────────────────────────
     The assistant can end a reply with [[go:studylens|See the case study]].
     Rendered as a chip that uses the page's own functions where they exist,
     so the visitor lands on the right thing without a reload; if a function
     is missing it falls back to the deep link, which url-state.js handles. */
  var CHAT_LINKS = {
    yojanasahay: { url: '/?case=yojanasahay', run: function () { return callIf('openCaseStudy', 'yojanasahay'); } },
    studylens:   { url: '/?case=studylens',   run: function () { return callIf('openCaseStudy', 'studylens'); } },
    portfolio:   { url: '/?case=portfolio',   run: function () { return callIf('openCaseStudy', 'portfolio'); } },
    projects:    { url: '/#my-projects',      run: function () { return scrollTo_('#my-projects'); } },
    experience:  { url: '/#projects',         run: function () { return scrollTo_('#projects'); } },
    stack:       { url: '/#tech-stack',       run: function () { return scrollTo_('section.ts-section'); } },
    services:    { url: '/#what-i-offer',     run: function () { return scrollTo_('#what-i-offer'); } },
    telemetry:   { url: '/#recent-activity',  run: function () { return scrollTo_('#recent-activity'); } },
    contact:     { url: '/#contact',          run: function () { return scrollTo_('#contact'); } },
    resume:      { url: '/#contact',          run: function () { return callIf('openResumeEmailModal'); } },
    performance: { url: '/?report=performance', run: function () { return callIf('openWebVitals'); } }
  };

  function callIf(name, arg) {
    if (typeof window[name] !== 'function') return false;
    try { window[name](arg); return true; } catch (e) { return false; }
  }
  /* Sections below the target are still rendering while the page scrolls,
     which pushes the target down and leaves the jump short. Aim, then
     correct twice once things settle. */
  function scrollTo_(sel) {
    var el = document.querySelector(sel);
    if (!el) return false;
    var offset = function () {
      var h = document.querySelector('header');
      return h && /fixed|sticky/.test(getComputedStyle(h).position) ? h.getBoundingClientRect().height : 0;
    };
    var aim = function () {
      var top = el.getBoundingClientRect().top + pageYOffset - offset() - 8;
      try { scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } catch (e) { scrollTo(0, Math.max(0, top)); }
    };
    aim();
    [700, 1400].forEach(function (t) {
      setTimeout(function () {
        if (Math.abs(el.getBoundingClientRect().top - offset() - 8) > 28) aim();
      }, t);
    });
    return true;
  }

  /* turn the markers into chips; returns { text, chips } */
  function extractChatLinks(raw) {
    var chips = [];
    var text = String(raw).replace(/\[\[go:([a-z-]+)\|([^\]]{1,60})\]\]/gi, function (_, key, label) {
      var k = String(key).toLowerCase();
      if (CHAT_LINKS[k] && chips.length < 2) chips.push({ key: k, label: label.trim() });
      return '';
    });
    return { text: text.replace(/\n{3,}/g, '\n\n').trim(), chips: chips };
  }

  function chipsHtml(chips) {
    if (!chips.length) return '';
    return '<div class="bot-links">' + chips.map(function (c) {
      return '<button type="button" class="bot-link" data-bot-go="' + c.key + '">' +
        '<span>' + c.label.replace(/</g, '&lt;') + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' +
        '</button>';
    }).join('') + '</div>';
  }

  /* one delegated listener for every chip the chat ever renders */
  if (!window.__botLinksWired) {
    window.__botLinksWired = true;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-bot-go]');
      if (!btn) return;
      var entry = CHAT_LINKS[btn.getAttribute('data-bot-go')];
      if (!entry) return;
      if (typeof window.closeChatWidget === 'function') { try { window.closeChatWidget(); } catch (err) {} }
      if (!entry.run()) location.href = entry.url;     /* fallback: let the URL do it */
    });
  }

  function formatBotReply(raw) {
    var catKey = 'general';
    var catLabels = {
      pricing:'💰 Pricing', skills:'🛠️ Skills', contact:'📬 Contact',
      hiring:'🤝 Hiring', about:'👤 About Sahnawaz', general:'💬 Chat'
    };
    /* Accept [CAT:x] OR [CATEGORY:x] OR KAT:x OR CAT:x — AI uses all forms */
    var catMatch = raw.match(/^\[(?:CAT|CATEGORY|KAT):(\w+)\]\s*/i)
                || raw.match(/^(?:CAT|KAT):(\w+)\s*\n?/i);
    if (catMatch) { catKey = catMatch[1].toLowerCase(); raw = raw.slice(catMatch[0].length); }
    /* Strip ALL remaining CAT tag variants anywhere in text — including bold-wrapped like **CAT:about** */
    raw = raw.replace(/\*{0,2}\[?(?:CAT|KAT|CATEGORY):[\w]+\]?\*{0,2}[\s\n]*/gi, '').trim();
    /* Strip stray lone # / ## / ### lines the AI sometimes outputs as an opener (e.g. "# \n") */
    raw = raw.replace(/^#{1,3}\s*$/gm, '').trim();
    /* Normalise synonym keys AI sometimes invents */
    var catSynonyms = {services:'skills',service:'skills',tech:'skills',experience:'about',work:'about',hire:'hiring',recruitment:'hiring',general_info:'general'};
    if (catSynonyms[catKey]) catKey = catSynonyms[catKey];

    /* pull out any deep-link markers before the text is formatted */
    var linked = extractChatLinks(raw);
    raw = linked.text;
    var chips = chipsHtml(linked.chips);

    var hasStructure = /#{1,3}|---|!!|>>|^\s*[-•]\s|\*\*/m.test(raw);
    var isShort = raw.trim().length < 160;
    if (!hasStructure && isShort) {
      return { html: inlineFormat(raw) + chips, rich: !!chips, cat: catKey };
    }

    var lines = raw.split('\n');
    var html = '';
    var inList = false;
    var badgeLabel = catLabels[catKey] || catLabels['general'];
    html += '<span class="bot-cat-badge cat-' + catKey + '">' + badgeLabel + '</span>';

    var rowDelay = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      /* Match: #Label OR ##Label## OR ## Label## OR ###Label (all AI header variants incl. H1) */
      var secMatch = line.match(/^#{1,3}\s*(.+?)(?:#{1,3})?\s*$/);
      /* Also treat standalone **bold** lines as section headers */
      if (!secMatch) {
        var boldHeadMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
        if (boldHeadMatch) secMatch = boldHeadMatch;
      }
      if (secMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="bot-section-header">' + inlineFormat(secMatch[1].trim()) + '</div>';
        continue;
      }
      if (/^---\s*$/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<hr class="bot-divider">';
        continue;
      }
      var hlMatch = line.match(/^!!(.+?)!!\s*$/);
      if (hlMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="bot-highlight">' + inlineFormat(hlMatch[1]) + '</div>';
        continue;
      }
      var cmpMatch = line.match(/^>>(.+?)\|(.+?)<<\s*$/);
      if (cmpMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        rowDelay += 0.05;
        html += '<div class="bot-compare-row" style="animation-delay:' + rowDelay.toFixed(2) + 's">'
              + '<span class="bot-compare-label">' + escHtml(cmpMatch[1].trim()) + '</span>'
              + '<span class="bot-compare-value">' + escHtml(cmpMatch[2].trim()) + '</span>'
              + '</div>';
        continue;
      }
      /* Numbered list: 1. item */
      var numMatch = line.match(/^\s*\d+.\s+(.+)$/);
      if (numMatch) {
        if (!inList) { html += '<ul class="bot-list">'; inList = true; }
        html += '<li><span class="bot-list-dot"></span><span>' + inlineFormat(numMatch[1]) + '</span></li>';
        continue;
      }
      var bulletMatch = line.match(/^\s*[-•]\s+(.+)$/);
      if (bulletMatch) {
        if (!inList) { html += '<ul class="bot-list">'; inList = true; }
        html += '<li><span class="bot-list-dot"></span><span>' + inlineFormat(bulletMatch[1]) + '</span></li>';
        continue;
      }
      var isCtaLine = /shzthedigitalalchemist@gmail|@sahnawaz\.ui|reach sahnawaz|contact sahnawaz/i.test(line) && line.trim().length < 140;
      if (isCtaLine && line.trim()) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="bot-cta-line">' + inlineFormat(line) + '</div>';
        continue;
      }
      if (line.trim()) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<p class="bot-para">' + inlineFormat(line) + '</p>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
      }
    }
    if (inList) html += '</ul>';
    return { html: html + chips, rich: true, cat: catKey };
  }

  function inlineFormat(text) {
    /* Strip markdown links [label](url) — show just the label */
    text = text.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1');
    /* Strip angle-bracket URLs <https://...> — show just the url */
    text = text.replace(/<(https?:\/\/[^>]+)>/g, '$1');
    /* Strip remaining bare [...] reference brackets */
    text = text.replace(/\[([^\]]+)\]/g, '$1');
    return escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="bot-bold">$1</strong>');
  }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ========== Messages ========== */
  function addMsg(type, text, savedTime){
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap ' + type;

    var div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    if (type === 'bot') {
      var fmt = formatBotReply(text);
      div.innerHTML = fmt.html;
      if (fmt.rich) div.classList.add('rich-reply');
    } else {
      div.innerHTML = text.replace(/\n/g, '<br>');
    }
    wrap.appendChild(div);

    /* Feature 5: timestamp — store ISO so smart labels work across sessions */
    var tsRow = document.createElement('div');
    tsRow.className = 'chat-ts-row';
    var ts = document.createElement('div');
    ts.className = 'chat-ts';
    var _msgIso = savedTime || new Date().toISOString(); /* single ref avoids two Date() calls drifting */
    ts.textContent = formatTimestamp(_msgIso);
    ts.dataset.iso = _msgIso;
    tsRow.appendChild(ts);
    if (type === 'bot') addSpeakBtn(tsRow, text, div);
    wrap.appendChild(tsRow);

    /* 👍 Reactions — only on bot messages */
    if (type === 'bot') {
      setTimeout(function(){ addReactions(wrap); }, 500);
    }

    msgs.appendChild(wrap);
    addToHistory(type, text);
    scrollMsgs();
    return div; /* return the bubble itself for reaction injection */
  }

  /* Instagram / Meta AI style — dots → full message with CSS animation
     isNudge=true → do NOT restart the idle timer after rendering (prevents loop) */
  function addBotTyping(answer, questionAsked, isNudge){
    setBotBusy(true);
    setTypingStatus(true);

    /* 1. Show the thinking-dots bubble */
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap bot';

    var dot = document.createElement('div');
    dot.className = 'chat-msg bot';
    dot.style.animation = 'none'; /* suppress enter anim for dots bubble */
    dot.style.opacity   = '1';
    dot.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    wrap.appendChild(dot);

    var tsRow = document.createElement('div');
    tsRow.className = 'chat-ts-row';
    var ts = document.createElement('div');
    ts.className = 'chat-ts';
    var _isoNow = new Date().toISOString();
    ts.textContent = formatTimestamp(_isoNow);
    ts.dataset.iso = _isoNow;
    tsRow.appendChild(ts);
    addSpeakBtn(tsRow, answer, dot);
    wrap.appendChild(tsRow);

    msgs.appendChild(wrap);
    scrollMsgs();

    /* 2. After think-delay: swap dots → full message, replay CSS animation */
    var thinkDelay = 650 + Math.random() * 350;
    setTimeout(function(){
      /* Reset so botMsgIn animation fires cleanly */
      dot.style.animation = 'none';
      dot.style.opacity   = '0';
      void dot.offsetWidth; /* reflow */

      var fmtBot = formatBotReply(answer);
      dot.innerHTML = fmtBot.html;
      if (fmtBot.rich) dot.classList.add('rich-reply');
      dot.style.animation = 'botMsgIn 0.38s cubic-bezier(0.18,0.89,0.32,1.08) forwards';

      playReceive();
      addToHistory('bot', answer);
      /* ── Save bot reply to Firestore history (direct call — MutationObserver
         fires too early, before text is swapped in from dots, so we save here
         explicitly once the real answer is rendered) ── */
      if (window._saveChatMessage) window._saveChatMessage('bot', answer);
      scrollMsgs();

      setTimeout(function(){
        setTypingStatus(false);
        setBotBusy(false);
        if (questionAsked) showReaction(questionAsked, dot);
        /* 👍 Add reactions to the wrap */
        setTimeout(function(){ addReactions(wrap); }, 300);
        /* Don't restart idle timer for nudge messages — prevents infinite loop */
        if (!isNudge) resetIdleTimer();
      }, 400);
    }, thinkDelay);
  }

  function scrollMsgs(){
    msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
    /* Option 7 — toggle scroll shadow class */
    setTimeout(function(){
      if (msgs.scrollTop > 10) msgs.classList.add('scrolled');
      else msgs.classList.remove('scrolled');
    }, 320);
  }

  /* Option 7 — also update shadow on manual scroll */
  msgs.addEventListener('scroll', function(){
    if (msgs.scrollTop > 10) msgs.classList.add('scrolled');
    else msgs.classList.remove('scrolled');
  });

  /* ── Feature 6: Back-to-bottom button ── */
  (function(){
    var scrollBtn = document.getElementById('chatScrollBtn');
    if (!scrollBtn || !msgs) return;

    /* Show the button as soon as the user scrolls UP more than ~500px
       away from the bottom (≈ 6 inches on a phone screen).
       This is purely distance-from-bottom — nothing to do with total
       scroll height or percentage. Also requires at least 3 bubbles
       so it never shows on an empty / just-opened chat. */
    var THRESHOLD = 500; /* px from bottom — adjust up/down if needed */

    function updateScrollBtn(){
      var totalMsgs = msgs.querySelectorAll('.chat-msg-wrap').length;
      if (totalMsgs < 3) { scrollBtn.style.display = 'none'; return; }

      var distFromBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight;
      scrollBtn.style.display = distFromBottom > THRESHOLD ? 'block' : 'none';
    }

    msgs.addEventListener('scroll', updateScrollBtn, { passive: true });
    var mo = new MutationObserver(updateScrollBtn);
    mo.observe(msgs, { childList: true, subtree: true });

    scrollBtn.addEventListener('click', function(){
      msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
    });
  })();

  /* ══════════════════════════════════════════════════
     🎙️ VOICE INPUT — Web Speech API
     WhatsApp-style mic next to send button
  ══════════════════════════════════════════════════ */
  (function(){
    var micBtn = document.getElementById('chatMic');
    if (!micBtn) return;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      /* Browser doesn't support — hide mic gracefully */
      micBtn.style.display = 'none';
      return;
    }

    var recog = new SpeechRecognition();
    recog.lang = 'en-IN';           /* Indian English — works for Hindi-accented English too */
    recog.interimResults = true;    /* Show words as they're spoken */
    recog.maxAlternatives = 1;
    var listening = false;

    micBtn.addEventListener('click', function(){
      if (listening) {
        recog.stop();
        return;
      }
      try {
        recog.start();
      } catch(e) {}
    });

    recog.onstart = function(){
      listening = true;
      micBtn.classList.add('mic-listening');
      micBtn.title = 'Listening… tap to stop';
      micBtn.textContent = '🔴';
      input.placeholder = 'Listening…';
    };

    recog.onresult = function(e){
      var transcript = '';
      for (var i = e.resultIndex; i < e.results.length; i++){
        transcript += e.results[i][0].transcript;
      }
      input.value = transcript;
      /* If final result, auto-send after tiny delay */
      if (e.results[e.results.length - 1].isFinal) {
        setTimeout(function(){
          if (input.value.trim()) sendMessage();
        }, 400);
      }
    };

    recog.onerror = function(e){
      var msgs_map = {
        'not-allowed' : '⚠️ Mic permission denied. Please allow mic access.',
        'no-speech'   : 'No speech detected. Try again!',
        'network'     : 'Network error. Check connection.',
      };
      input.placeholder = msgs_map[e.error] || 'Voice error — try typing instead.';
      setTimeout(function(){ input.placeholder = 'Tap here to type…'; }, 3000);
    };

    recog.onend = function(){
      listening = false;
      micBtn.classList.remove('mic-listening');
      micBtn.title = 'Voice input';
      micBtn.textContent = '🎙️';
      if (!input.value.trim()) input.placeholder = 'Tap here to type…';
    };
  })();

  /* ══════════════════════════════════════════════════
     👍 MESSAGE REACTIONS
     Appears below every bot reply — 👍 ❤️ 🤔
  ══════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════
     👍 LONG-PRESS REACTIONS — WhatsApp style
     Hold any bot message → picker floats above it
  ══════════════════════════════════════════════════ */
  var EMOJIS = ['👍','❤️','😮','😂','🔥','🙏'];

  /* Create picker DOM once, reuse */
  var picker = document.createElement('div');
  picker.id = 'reactionPicker';
  picker.style.display = 'none';
  EMOJIS.forEach(function(em){
    var b = document.createElement('button');
    b.className = 'rp-btn';
    b.textContent = em;
    b.setAttribute('aria-label', em);
    picker.appendChild(b);
  });
  document.body.appendChild(picker);

  var pickerTarget = null; /* the bubble wrap currently targeted */
  var holdTimer    = null;
  var pickerOpen   = false;

  function showPicker(bubbleEl, triggerEl) {
    if (bubbleEl.dataset.reacted) return; /* already reacted */
    pickerTarget = bubbleEl;

    /* Position above the bubble */
    var rect = triggerEl.getBoundingClientRect();
    picker.style.display = 'flex';
    picker.classList.remove('picker-hide');

    /* Let browser measure picker width */
    requestAnimationFrame(function(){
      var pw = picker.offsetWidth;
      var ph = picker.offsetHeight;
      var left = rect.left + (rect.width / 2) - (pw / 2);
      /* Clamp to viewport */
      left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
      var top = rect.top - ph - 10;
      /* If too close to top, show below instead */
      if (top < 8) top = rect.bottom + 10;
      picker.style.left = left + 'px';
      picker.style.top  = top  + 'px';
    });
    pickerOpen = true;
  }

  function hidePicker(){
    if (!pickerOpen) return;
    picker.classList.add('picker-hide');
    setTimeout(function(){
      picker.style.display = 'none';
      picker.classList.remove('picker-hide');
      pickerOpen = false;
      pickerTarget = null;
    }, 150);
  }

  /* Dismiss on outside tap */
  document.addEventListener('pointerdown', function(e){
    if (pickerOpen && !picker.contains(e.target)) hidePicker();
  });

  /* Emoji chosen */
  picker.addEventListener('click', function(e){
    var btn = e.target.closest('.rp-btn');
    if (!btn || !pickerTarget) return;
    var em = btn.textContent;

    /* Add badge on bubble corner */
    var bubble = pickerTarget.querySelector('.chat-msg.bot');
    var badge = document.createElement('div');
    badge.className = 'msg-reaction-badge';
    badge.textContent = em;
    if (bubble) bubble.appendChild(badge);
    pickerTarget.dataset.reacted = '1';

    /* Bounce the chosen emoji button */
    btn.style.transform = 'scale(1.6)';
    setTimeout(function(){ btn.style.transform = ''; hidePicker(); }, 250);
  });

  /* Attach long-press to a bot message wrap */
  function addReactions(bubbleWrap) {
    var bubble = bubbleWrap.querySelector('.chat-msg.bot');
    if (!bubble) return;

    /* ── Touch: long press — attach to bubble directly ── */
    bubble.addEventListener('touchstart', function(e){
      /* Start timer */
      holdTimer = setTimeout(function(){
        showPicker(bubbleWrap, bubble);
        if (navigator.vibrate) navigator.vibrate(40);
      }, 500);
    }, { passive: true });

    bubble.addEventListener('touchend', function(){
      clearTimeout(holdTimer);
    }, { passive: true });

    bubble.addEventListener('touchmove', function(){
      clearTimeout(holdTimer);
    }, { passive: true });

    /* ── Mouse: long press (desktop) ── */
    bubble.addEventListener('mousedown', function(e){
      if (e.button !== 0) return;
      holdTimer = setTimeout(function(){ showPicker(bubbleWrap, bubble); }, 600);
    });
    bubble.addEventListener('mouseup',    function(){ clearTimeout(holdTimer); });
    bubble.addEventListener('mouseleave', function(){ clearTimeout(holdTimer); });
  }

  /* ══════════════════════════════════════════════════
     TEXT-TO-SPEECH — Edge TTS voice replies
     Read Aloud button on every bot bubble → /api/speak
     Includes centered loading state and word-by-word
     highlight synced to REAL WordBoundary timestamps
     returned by the voice engine — not estimated — so
     the highlight tracks the audio precisely.
  ══════════════════════════════════════════════════ */
  var ttsApiUrl        = 'https://sahnawaz-portfolio.vercel.app/api/speak';
  var _ttsAudio         = null;
  var _ttsBtnActive     = null;
  var _ttsStopHighlight = null;   // cancels the highlight animation loop
  var _ttsRestoreBubble = null;   // restores the bubble's original formatted HTML

  var ttsOverlay = document.getElementById('ttsLoadingOverlay');

  var TTS_ICON_SPEAKER =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16.5 12c0-1.77-.77-3.29-2-4.32v8.64c1.23-1.03 2-2.55 2-4.32z"/><path d="M18.5 4.55c2.4 1.85 3.9 4.63 3.9 7.45s-1.5 5.6-3.9 7.45l-.9-1.2c2.1-1.6 3.4-4 3.4-6.25s-1.3-4.65-3.4-6.25l.9-1.2z"/></svg>';
  var TTS_ICON_PAUSE =
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var TTS_ICON_WARN =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';

  function setBtnIdle(btn){
    btn.classList.remove('speak-loading', 'speak-playing', 'speak-error');
    btn.innerHTML = '<span class="tts-icon">' + TTS_ICON_SPEAKER + '</span><span>Listen</span>';
  }

  function showTtsOverlay(){ if (ttsOverlay) ttsOverlay.classList.add('show'); }
  function hideTtsOverlay(){ if (ttsOverlay) ttsOverlay.classList.remove('show'); }

  /* Wraps each word IN PLACE inside the bubble's existing formatted HTML,
     instead of discarding it and rebuilding plain text. Walks every text
     node under `root` (so it reaches text inside <b>, <li>, headers,
     colored spans, links, etc.) and wraps just the word-tokens inside
     each one with <span class="tts-word" data-i="N">, leaving all
     surrounding tags and whitespace exactly where they were. Tokens with
     no letters/digits (stray punctuation, emoji left over from markdown
     rendering) are left unwrapped and don't consume an index, since the
     server's word-timing list only counts spoken words. Indices are
     assigned in document (reading) order, matching the order the server's
     `words` array was generated in — that's what makes the positional
     lookup in startWordHighlight() line up correctly. Never throws even
     if the two counts drift slightly (e.g. an emoji or link the TTS
     cleaner stripped that's still visible on screen) — startWordHighlight
     already guards every span lookup with `if (spans[idx])`. */
  var TTS_WORD_CHAR_RE = /[\p{L}\p{N}]/u;
  function wrapWordsInPlace(root){
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) textNodes.push(n);

    var counter = 0;
    for (var t = 0; t < textNodes.length; t++) {
      var textNode = textNodes[t];
      var text = textNode.nodeValue;
      if (!text) continue;

      var parts = text.split(/(\s+)/); // keeps whitespace runs as their own entries
      var frag = document.createDocumentFragment();
      var changedThisNode = false;

      for (var p = 0; p < parts.length; p++) {
        var part = parts[p];
        if (part === '') continue;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          continue;
        }
        if (TTS_WORD_CHAR_RE.test(part)) {
          var span = document.createElement('span');
          span.className = 'tts-word';
          span.setAttribute('data-i', counter++);
          span.textContent = part;
          frag.appendChild(span);
          changedThisNode = true;
        } else {
          frag.appendChild(document.createTextNode(part)); // punctuation/symbol only — not a spoken word
        }
      }

      if (changedThisNode && textNode.parentNode) {
        textNode.parentNode.replaceChild(frag, textNode);
      }
    }
  }

  /* Drives the word highlight against actual audio.currentTime, using the
     real start/end timestamps (in seconds) the voice engine reported for
     each word — this is what makes the sync accurate rather than guessed.

     HIGHLIGHT_LEAD_SEC compensates for a small, fixed latency between the
     <audio> element's currentTime clock and what's actually audible —
     browsers take a moment to decode/buffer an MP3 blob before sound
     reaches your ears, so without this the highlight consistently trails
     the spoken word by a beat rather than drifting further out of sync
     over time. It's a constant nudge, not a per-word guess. 150ms is a
     reasonable starting point; if it still feels a touch early or late,
     adjust this single number up or down. */
  var HIGHLIGHT_LEAD_SEC = 0.15;

  function startWordHighlight(bubbleEl, words, audio){
    var spans = bubbleEl.querySelectorAll('.tts-word');
    var lastIdx = -1;
    var rafId;

    // Single element that glides between word positions — this is what
    // makes the highlight look like it *moves* rather than jumping.
    var pill = document.createElement('div');
    pill.className = 'tts-highlight-pill';
    bubbleEl.appendChild(pill);

    function movePillTo(span, instant){
      if (!span) { pill.style.opacity = '0'; return; }
      var bubbleRect = bubbleEl.getBoundingClientRect();
      var spanRect   = span.getBoundingClientRect();
      // Subtract clientLeft/Top too, since the containing block for an
      // absolutely-positioned child starts at the padding box (inside
      // the border), while getBoundingClientRect() measures from the
      // border's outer edge.
      var x = spanRect.left - bubbleRect.left - bubbleEl.clientLeft;
      var y = spanRect.top  - bubbleRect.top  - bubbleEl.clientTop;

      if (instant) pill.style.transition = 'none';
      pill.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      pill.style.width  = spanRect.width  + 'px';
      pill.style.height = spanRect.height + 'px';
      pill.style.opacity = '1';
      if (instant) {
        void pill.offsetWidth; // force layout so the 'none' transition actually applies first
        pill.style.transition = '';
      }
    }

    function tick(){
      if (_ttsAudio !== audio) return; /* stopped or replaced */
      var t = audio.currentTime + HIGHLIGHT_LEAD_SEC;
      var idx = lastIdx < 0 ? 0 : lastIdx;
      while (idx + 1 < words.length && t >= words[idx + 1].start) idx++;
      if (idx !== lastIdx) {
        if (spans[lastIdx]) spans[lastIdx].classList.remove('tts-active');
        if (spans[idx]) spans[idx].classList.add('tts-active');
        movePillTo(spans[idx], lastIdx < 0); // instant only for the very first word
        lastIdx = idx;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return function stopHighlight(){
      cancelAnimationFrame(rafId);
      for (var i = 0; i < spans.length; i++) spans[i].classList.remove('tts-active');
      if (pill.parentNode) pill.parentNode.removeChild(pill);
    };
  }

  function stopSpeaking(){
    if (_ttsAudio) {
      _ttsAudio.pause();
      _ttsAudio.src = '';
      _ttsAudio = null;
    }
    if (_ttsStopHighlight) { _ttsStopHighlight(); _ttsStopHighlight = null; }
    if (_ttsRestoreBubble) { _ttsRestoreBubble(); _ttsRestoreBubble = null; }
    hideTtsOverlay();
    if (_ttsBtnActive) {
      setBtnIdle(_ttsBtnActive);
      _ttsBtnActive = null;
    }
  }

  function addSpeakBtn(container, rawText, bubbleEl){
    if (!rawText || !rawText.trim()) return;
    var btn = document.createElement('button');
    btn.className = 'chat-speak-btn';
    btn.type = 'button';
    btn.title = 'Read this reply aloud';
    btn.setAttribute('aria-label', 'Read reply aloud');
    setBtnIdle(btn);
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      speakText(rawText, btn, bubbleEl);
    });
    container.appendChild(btn);
  }

  function speakText(rawText, btn, bubbleEl){
    /* Tapping the currently-playing/loading message again stops it */
    if (_ttsBtnActive === btn) { stopSpeaking(); return; }
    stopSpeaking();

    btn.classList.add('speak-loading');
    btn.innerHTML = '<span class="tts-spinner-sm"></span><span>Preparing</span>';
    _ttsBtnActive = btn;
    showTtsOverlay();

    // Safety net: give up if the request hangs, instead of leaving
    // "Generating audio..." on screen forever. The timeout scales with
    // message length rather than a fixed 20s — a longer bot reply means
    // a bigger base64 (audio + word-timing) JSON payload to *download*,
    // not necessarily slower generation. A fixed 20s was tight enough that
    // long replies on a slow connection (a few KB/s) got aborted mid-download
    // even though the server had already finished. BASE covers connection
    // setup + short-message generation; MS_PER_CHAR is a generous per-character
    // allowance for slow-link download time; MAX caps it so a runaway request
    // still gives up eventually.
    var TIMEOUT_BASE_MS     = 8000;
    var TIMEOUT_MS_PER_CHAR = 45;
    var TIMEOUT_MAX_MS      = 60000;
    var timeoutMs = Math.min(
      TIMEOUT_MAX_MS,
      TIMEOUT_BASE_MS + (rawText.length * TIMEOUT_MS_PER_CHAR)
    );

    var controller = new AbortController();
    var timeoutId = setTimeout(function(){ controller.abort(); }, timeoutMs);

    fetch(ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
      signal: controller.signal
    })
    .then(function(res){
      clearTimeout(timeoutId);
      if (!res.ok) {
        var err = new Error('TTS request failed (' + res.status + ')');
        err.status = res.status;
        throw err;
      }
      return res.json();
    })
    .then(function(data){
      /* User may have cancelled while we were waiting */
      if (_ttsBtnActive !== btn) return;
      hideTtsOverlay();

      // Decode the base64 MP3 back into a playable blob
      var binary = atob(data.audio);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var blob = new Blob([bytes], { type: 'audio/mpeg' });

      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      _ttsAudio = audio;
      btn.classList.remove('speak-loading');
      btn.classList.add('speak-playing');
      btn.innerHTML = '<span class="tts-icon"><span class="tts-bars"><span></span><span></span><span></span></span></span><span>Playing</span>';

      // Wrap words for highlighting IN PLACE, driven by the real per-word
      // timestamps from the server — this keeps all existing formatting
      // (bold, headers, bullets, colored spans) intact while it speaks.
      // Original HTML is restored the moment playback stops.
      var words = data.words || [];
      if (bubbleEl && words.length) {
        var origHTML = bubbleEl.innerHTML;
        wrapWordsInPlace(bubbleEl);
        _ttsRestoreBubble = function(){ bubbleEl.innerHTML = origHTML; };
        _ttsStopHighlight = startWordHighlight(bubbleEl, words, audio);
      }

      audio.addEventListener('ended', function(){
        URL.revokeObjectURL(url);
        stopSpeaking();
      });
      audio.play().catch(function(){
        URL.revokeObjectURL(url);
        stopSpeaking();
      });
    })
    .catch(function(err){
      clearTimeout(timeoutId);
      if (_ttsBtnActive === btn) _ttsBtnActive = null;
      hideTtsOverlay();
      btn.classList.remove('speak-loading', 'speak-playing');
      btn.classList.add('speak-error');
      var busy = err && err.status === 429;
      var timedOut = err && err.name === 'AbortError';
      var label = timedOut ? 'Timed out — retry' : (busy ? 'Busy — retry' : 'Retry');
      btn.innerHTML = '<span class="tts-icon">' + TTS_ICON_WARN + '</span><span>' + label + '</span>';
      setTimeout(function(){ setBtnIdle(btn); }, (busy || timedOut) ? 4000 : 2500);
    });
  }

  /* ========== Smart free-text matching ========== */
  function findAnswer(text){
    var t = text.toLowerCase().trim();
    /* 1. topic keyword scan */
    for (var i = 0; i < TOPICS.length; i++){
      var tp = TOPICS[i];
      if (tp.rx.test(t)){
        if (tp.ans) return tp.ans;
        if (tp.idx !== undefined) return QA[tp.idx].a;
      }
    }
    /* 2. word scoring against QA questions — require 2+ word matches to avoid false hits */
    var best = -1, bestScore = 0;
    for (var j = 0; j < QA.length; j++){
      var words = QA[j].q.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ').filter(function(w){ return w.length > 3; });
      var score = 0;
      words.forEach(function(w){ if (t.includes(w)) score++; });
      if (score > bestScore){ bestScore = score; best = j; }
    }
    if (bestScore >= 2) return QA[best].a;
    return FALLBACK;
  }

  /* ========== Send ========== */
  function sendMessage(){
    if (botBusy) return;
    var val = input.value.trim();
    if (!val) return;
    input.value = '';
    resetIdleTimer(); /* always restart idle countdown on every user send */
    /* Feature 4: clear typing indicator */
    clearTimeout(userTypingTimeout);
    if (userTypingEl) userTypingEl.textContent = '';
    followUpWrap && (followUpWrap.style.display = 'none');
    if (quickReply) quickReply.style.display = 'none';

    /* ── Help flow intercept — if a flow is active, route reply there ── */
    if (window._helpFlowActive && window._helpFlowActive()) {
      playSend && playSend();
      window._helpFlowStep(val);
      return;
    }
    /* ── End help flow intercept ── */
    playSend();
    addMsg('user', val);
    /* Save user message to Firestore — must be here while val is still intact.
       engagement.js click listener fires after input.value is already cleared. */
    if (window._saveChatMessage) window._saveChatMessage('user', val);
    setChipsOpen(false);
    var enriched = resolveContext(val);
    // Try Gemini AI first, fall back to local answers if it fails
    setBotBusy(true);
    setTypingStatus(true);
    // Show "thinking" bubble with label + 3 dots
    var thinkWrap = document.createElement('div');
    thinkWrap.className = 'chat-msg-wrap bot';
    thinkWrap.id = 'geminiThinkBubble';
    var thinkBubble = document.createElement('div');
    thinkBubble.className = 'chat-msg bot';
    thinkBubble.innerHTML = '<span style="font-size:0.72rem;color:rgba(0,255,204,0.7);margin-right:6px;">Sahnawaz\'s Assistant is thinking</span><div class="typing-dots" style="display:inline-flex;"><span></span><span></span><span></span></div>';
    thinkWrap.appendChild(thinkBubble);
    msgs.appendChild(thinkWrap);
    scrollMsgs();

    /* Always use Vercel URL so API works from GitHub Pages AND Vercel */
    var apiUrl = 'https://sahnawaz-portfolio.vercel.app/api/chat';

    /* Build history payload — last 8 messages for context */
    var historyPayload = conversationHistory.slice(-8).map(function(m){
      return { role: m.role, content: m.text };
    });

    /* Visitor name — stored if bot learned it during chat */
    var namePayload = window._chatVisitorName || null;

    /* ── Hacker Mode State Interceptor — short-circuit API if state already matches ── */
    var tLowCheck = val.toLowerCase();
    var isHackerOn = document.body.classList.contains('hacker-mode');

    /* Only match EXPLICIT commands: "turn on/off", "enable/disable", "activate/deactivate"
       directly followed by hacker-related words.
       Do NOT match descriptive phrases like "hacker mode is on, please turn it off"
       — those should go to the API which understands natural language context. */
    var wantOn  = /\b(turn\s+on|switch\s+on|enable|activate)\s+(retro\s+)?(hacker|hacker\s*mode|retro)\b/i.test(tLowCheck);
    var wantOff = /\b(turn\s+off|switch\s+off|disable|deactivate)\s+(retro\s+)?(hacker|hacker\s*mode|retro)\b/i.test(tLowCheck);

    if (wantOn && isHackerOn) {
      /* Already ON — give smart feedback without calling API */
      var bubble = document.getElementById('geminiThinkBubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      setTypingStatus(false); setBotBusy(false);
      addBotTyping('Retro Hacker Mode is **already active** 🟢 It\'s on and running — type "turn off hacker mode" to deactivate it. ✨', val);
      return;
    }
    if (wantOff && !isHackerOn) {
      /* Already OFF — give smart feedback without calling API */
      var bubble = document.getElementById('geminiThinkBubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      setTypingStatus(false); setBotBusy(false);
      addBotTyping('Retro Hacker Mode is **already off** 🔴 Nothing to deactivate — type "turn on hacker mode" to activate it. ✨', val);
      return;
    }
    /* ── End Hacker Mode State Interceptor ── */

    /* ── Real-time interceptor — inject device time/date before AI call ── */
    var msgToSend = val;
    var tLow = val.toLowerCase();

    /* Time */
    if (/\b(time|what time|current time|time now|kitna baj|baje hain)\b/i.test(tLow)) {
      var now = new Date();
      var timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
      msgToSend = val + ' [DEVICE_TIME: ' + timeStr + ']';
    }
    /* Date / Day */
    else if (/\b(date|today|what day|current date|aaj|din)\b/i.test(tLow)) {
      var now = new Date();
      var dateStr = now.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      msgToSend = val + ' [DEVICE_DATE: ' + dateStr + ']';
    }
    /* Math — calculate locally, send answer directly */
    else if (/^[\d\s\+\-\*\/\.\(\)\%\^]+$/.test(val.trim()) || /what\s+is\s+[\d].*[\+\-\*\/x]/.test(tLow)) {
      try {
        var expr = val.replace(/x/gi,'*').replace(/[^0-9\+\-\*\/\.\(\)\%]/g,'');
        if (expr) {
          var result = Function('"use strict"; return (' + expr + ')')();
          msgToSend = val + ' [CALC_RESULT: ' + result + ']';
        }
      } catch(e) {}
    }

    /* ── Reload latest visitor activity before every chat call ──
       Ensures likes/ratings/reviews done this session are reflected
       immediately without needing a page refresh.               */
    var _doFetch = function(freshActivity) {
      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          history: historyPayload,
          visitorName: conversationHistory.length <= 1 ? namePayload : null,
          visitorActivity: freshActivity || window._visitorActivity || null
        })
      })
      .then(function(res){
      if (!res.ok) { throw new Error('API returned status ' + res.status); }
      return res.json();
    })
    .then(function(data){
      var bubble = document.getElementById('geminiThinkBubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      setTypingStatus(false);
      setBotBusy(false);
      var aiReply = data && data.reply && data.reply.trim() ? data.reply : null;
      if (aiReply) {
        /* Upgrade 2 — detect if visitor shared their name in this message */
        if (!window._chatVisitorName) {
          var nameMatch = val.match(/^(?:i(?:'m| am)|my name(?:'s| is)?|call me|it'?s)\s+([A-Z][a-z]{1,20})\b/i)
                       || val.match(/^([A-Z][a-z]{1,20})(?:\s+here|$)/);
          if (nameMatch) window._chatVisitorName = nameMatch[1];
        }
        addBotTyping(aiReply, val);
      } else {
        addBotTyping("⚠️ I didn't get a response. Please try again in a moment.", val);
      }

      /* ── SITE COMMAND EXECUTOR ──────────────────────────────────────────
         If the API returned a `command` field, execute it client-side.
         Commands are detected in chat.js with zero AI tokens used.
      ──────────────────────────────────────────────────────────────────── */
      if (data && data.command) {
        setTimeout(function() {
          var cmd = data.command;

          /* Hacker / Retro mode — state-aware: only act if state would actually change */
          if (cmd === 'hacker_on') {
            var isAlreadyOn = document.body.classList.contains('hacker-mode');
            if (isAlreadyOn) {
              /* Already ON — replace last bot message with smart feedback */
              var bubbles = msgs.querySelectorAll('.chat-msg.bot');
              var lastBubble = bubbles[bubbles.length - 1];
              if (lastBubble) {
                var fmtMsg = formatBotReply('Retro Hacker Mode is **already active** 🟢 It\'s on and running — try "turn off hacker mode" to deactivate it. ✨');
                lastBubble.innerHTML = fmtMsg.html;
              }
            } else {
              document.body.classList.add('hacker-mode');
              syncHackerToggleIcon();
              scrollToTerminalWithHint();
            }

          } else if (cmd === 'hacker_off') {
            var isAlreadyOff = !document.body.classList.contains('hacker-mode');
            if (isAlreadyOff) {
              /* Already OFF — replace last bot message with smart feedback */
              var bubbles = msgs.querySelectorAll('.chat-msg.bot');
              var lastBubble = bubbles[bubbles.length - 1];
              if (lastBubble) {
                var fmtMsg = formatBotReply('Retro Hacker Mode is **already off** 🔴 Nothing to deactivate — try "turn on hacker mode" to activate it. ✨');
                lastBubble.innerHTML = fmtMsg.html;
              }
            } else {
              document.body.classList.remove('hacker-mode');
              syncHackerToggleIcon();
            }

          } else if (cmd === 'hacker_toggle') {
            document.body.classList.toggle('hacker-mode');
            syncHackerToggleIcon();
            scrollToTerminalWithHint();

          /* Code popup */
          } else if (cmd === 'open_code_popup') {
            if (typeof window._openCodePopup === 'function') {
              window._openCodePopup();
            }

          /* Scroll commands — smooth scroll to section */
          } else if (cmd === 'scroll_about') {
            window.scrollTo({ top: 0, behavior: 'smooth' });

          } else if (cmd === 'scroll_projects') {
            var el = document.getElementById('projects');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_skills') {
            var el = document.querySelector('.tech-stack') || document.querySelector('.ts-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_contact') {
            var el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_certs') {
            var el = document.getElementById('certSection');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_blog') {
            var el = document.getElementById('blog');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 600); /* small delay so the chat reply renders first */
      }
      /* ── END SITE COMMAND EXECUTOR ─────────────────────────────────── */

      resetIdleTimer();
      })
      .catch(function(err){
        var bubble = document.getElementById('geminiThinkBubble');
        if (bubble) bubble.parentNode.removeChild(bubble);
        setTypingStatus(false);
        setBotBusy(false);
        var noNet = !navigator.onLine;
        var errMsg = noNet
          ? "⚠️ No internet connection. Please check your network and try again."
          : "⚠️ I'm having trouble connecting right now. Please try again in a moment.";
        addBotTyping(errMsg, val);
      });
    }; /* end _doFetch */

    /* Refresh activity from Firestore then fire the request */
    if (window._loadVisitorActivity) {
      window._loadVisitorActivity(function(fresh) { _doFetch(fresh); });
    } else {
      _doFetch(null);
    }
  }

  sendBtn && sendBtn.addEventListener('click', sendMessage);
  input && input.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); sendMessage(); }
  });

  /* Option 3 — pill click opens chat */
  var pill = document.getElementById('chatPill');
  if (pill) pill.addEventListener('click', function(){ window.openChat && window.openChat(); });

  /* Manual dismiss — small × badge on the pill */
  var pillCloseBtn = document.getElementById('pillClose');
  if (pillCloseBtn && pill) {
    pillCloseBtn.addEventListener('click', function(e){
      e.stopPropagation(); /* don't trigger openChat */
      clearTimeout(pill._hideTimer); /* cancel the 30s auto-hide, we're closing now */
      pill.style.animation = 'pillDismiss 0.3s cubic-bezier(0.4,0,0.2,1) both';
      setTimeout(function(){ pill.style.display = 'none'; }, 300);
    });
  }

  /* Option 7 — haptic flash on send */
  if (sendBtn){
    sendBtn.addEventListener('click', function(){
      sendBtn.classList.remove('haptic');
      void sendBtn.offsetWidth;
      sendBtn.classList.add('haptic');
      setTimeout(function(){ sendBtn.classList.remove('haptic'); }, 400);
    });
  }

})();


/* ==== index.html line 13115 ==== */

/* === Passive touch listeners to fix heavy scroll === */
(function () {
  const opts = { passive: true };
  window.addEventListener('touchstart', function(){}, opts);
  window.addEventListener('touchmove', function(){}, opts);
  window.addEventListener('wheel', function(){}, opts);
})();


/* ==== index.html line 13124 ==== */

/* n8n Contact Form Automation */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });

    /* NOTE: Replace 'YOUR-N8N-WEBHOOK-URL' with your actual n8n webhook endpoint */
    const webhookUrl = "https://YOUR-N8N-WEBHOOK-URL";
    if (webhookUrl.includes("YOUR-N8N")) {
      /* Webhook not configured — skip silently, let ctSendMail handle submission */
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      alert("✅ Message sent successfully. I'll get back to you soon.");
      form.reset();
    } catch (err) {
      showToast("❌ Something went wrong. Please try again.", "error");
    }
  });
});
