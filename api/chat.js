const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'No message received.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  const KNOWLEDGE = `
You are the personal AI assistant embedded in Sahnawaz Ahmed Laskar's portfolio website.
[... keep your full KNOWLEDGE text here, just ONCE ...]
  `;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${KNOWLEDGE}\n\nVisitor says: ${message.trim()}\n\nYour reply (warm, concise, use emojis):` }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 400, topP: 0.92 }
        })
      }
    );

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || "Reach Sahnawaz at shzthedigitalalchemist@gmail.com 😊";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({ reply: "Something went wrong! Contact shzthedigitalalchemist@gmail.com 😊" });
  }
};

module.exports = handler;Superpower: Thinks like a developer AND designs like an artist — rare combination
Weakness: Perfectionist — spends extra time making things great, not just fine
Dream: Build his own digital agency — a team of sharp creative people leaving a legacy
Motivation: Building things that last, that carry his name, that outlast him
Working style: Late-night creator — best ideas come with lo-fi music, strong chai, quiet world
Fun fact: Once spent 3 hours debugging — turned out to be "marign" instead of "margin"

EDUCATION:
1. MCA (Master of Computer Applications) — Yenepoya University, Bangalore (2025-Present)
2. BCA (Bachelor of Computer Applications) — Yenepoya University, Bangalore (2022-2025)
3. BA (Bachelor of Arts) — G.C. College, Silchar, Assam (2018-2021)
4. Higher Secondary AHSEC — Ahmed Ali Junior College, Assam (2016-2018)
5. High School HSLC — Badripar Public High School, Assam (2015-2016)
6. DCA (Diploma in Computer Applications) — Info Education Computer Institute, Silchar (2015-2016)

CERTIFICATIONS:
1. Diploma in Computer Applications — OS, Databases, MS Office, Logic Building
2. Web Development Basics — HTML5, CSS3, Responsive Design, DOM
3. Advanced Excel & Business Reporting — Pivot Tables, VLOOKUP, Dashboards, Macros
4. Customer Support Service — Escalation Mgmt, QA Auditing, Agent Training, CSAT
5. JavaScript Programming — ES6+, DOM API, Async/Await, Animations
6. Programming in C++ — OOP, Pointers, Algorithms, STL
7. HTML Essentials — Semantic HTML, Accessibility, SEO Structure, Forms

WORK EXPERIENCE (3+ years total):
1. FLIPKART via Ienergizer | Customer Experience Specialist | 2022-2023
   - Built internal tools automating order resolution, reduced agent handling time
   - Zero SLA breaches across 6+ months, recognised by QA and HR
   - Testimonials: Ayush Yadav - "game-changer, professional, quick, top-quality"
   - Chiranjeevi (QA) - "meticulous, prompt, dependable"
   - Madhuri Singh (HR) - "remarkably punctual and disciplined"

2. XIAOMI INDIA via One Point One | Escalation Lead & Mobile Tech Support | 2023
   - Owned escalation dashboard, expert MSM-based mobile troubleshooting
   - Coached junior agents, raised team CSAT scores
   - Adiba Kirmani (Team Leader) - "rare ability to blend creative visuals with user-first functionality"
   - Hemalatha (Quality Head) - "thorough, talented, highly professional"

3. RAPIDO via Ienergizer | Support Lead & Agent Training | 2023-2024
   - Led real-time chat support, designed training workflows adopted floor-wide
   - Santoosh Reddy (Floor Manager) - "takes ownership, delivers impact, brings calm creativity"

4. FREELANCE | Full Stack Developer & UI/UX Designer | 2021-Present
   - Hand-coded entire animated portfolio — zero templates
   - Built portfolio sites, e-commerce, dashboards, internal tools

TECHNICAL SKILLS:
Frontend: HTML/CSS/JS (88%), React (78%), Tailwind CSS
Design: UI/UX Design (85%), Figma, Info Architecture (80%), Adobe XD
Backend: Node.js (72%), Python, PHP, Firebase
CMS: WordPress, Shopify, Blogger
Tools: MS Office (90%), Excel Analytics (88%), Google Analytics, Search Console
Soft Skills: Problem Solving (95%), Collab Workflow (92%), Client Support (90%), Agile (88%), Project Ownership (85%)

KEY ACHIEVEMENTS:
- GitHub: 100+ contributions, 5+ deployed web projects
- 200+ algorithmic challenges solved
- 10,000+ active users reached
- Agile collaboration with 10+ developers
- Entire portfolio hand-coded — zero templates

SERVICES & PRICING (all prepaid, no hidden costs):
- Full Website Design: from Rs.9,999 (custom animated UI, mobile-first, SEO, up to 5 pages)
- Portfolio Website: from Rs.6,999 (animations, projects showcase, contact form, deployment)
- E-Commerce Store: from Rs.14,999 (payment gateway, catalog, admin dashboard)
- Web Ads & Campaign: from Rs.3,999/campaign
- Frontend Dev (HTML/CSS/JS): from Rs.4,999/project
- Backend/API (Node.js/Firebase): from Rs.5,999/module
- UI/UX Design (Figma): from Rs.3,999/screen
- WordPress/Shopify CMS: from Rs.3,499
- SEO & Analytics: from Rs.3,999
- AI Integration: from Rs.2,999/workflow
- Live Support (WhatsApp/Zoom): from Rs.1,499/hour
- DevOps & Security (SSL/CDN): from Rs.2,499
Timeline: Portfolio 2-5 days | Full site 1-3 weeks
Post-delivery: Lifetime support — updates, bug fixes, tweaks always provided

CONTACT & SOCIAL:
Business Email: shzthedigitalalchemist@gmail.com
Personal Email: balveerdj@gmail.com
Instagram: @sahnawaz.ui.dev
YouTube: @shzmotivation3767 (SHZ Motivation — archived)
GitHub: github.com/sahnawazl
LinkedIn: linkedin.com/in/sahnawazlaskar
Twitter/X: @sahnawazlaskar
Portfolio Live: sahnawaz-portfolio.vercel.app
Response time: Personally reads every message, replies within hours

FAMILY:
Father: Jamal | Mother: Momotaz (passed 2019, may Allah grant her Jannah)
Siblings: Afiya, Fayaz, Afaz, Chufiya, Nahaz, Rajiya, Rejina, Minhaz (youngest)
Extended: Aunt Nurun, Uncle Athikur, Cousins Papiya, Sabaz, Jabir

WHY CHOOSE SAHNAWAZ:
- Custom animated UI — not recycled templates
- Replies within hours, lifetime post-delivery support
- Transparent fixed pricing — no surprise invoices
- Proven at Flipkart, Xiaomi & Rapido
- Both developer AND designer — beauty + function

IF ASKED SOMETHING NOT IN THIS KNOWLEDGE BASE:
Say: "That's a great question! Reach Sahnawaz directly at shzthedigitalalchemist@gmail.com or Instagram @sahnawaz.ui.dev — he personally reads every message! 😊"
`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${KNOWLEDGE}\n\nVisitor says: ${message.trim()}\n\nYour reply (warm, concise, use emojis):`
            }]
          }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 400,
            topP: 0.92
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', geminiRes.status, errText);
      return res.status(200).json({
        reply: "I'm having a small hiccup! 😊 Try again, or reach Sahnawaz at shzthedigitalalchemist@gmail.com"
      });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || "Please reach Sahnawaz at shzthedigitalalchemist@gmail.com 😊";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({
      reply: "Something went wrong! 😅 Contact Sahnawaz at shzthedigitalalchemist@gmail.com"
    });
  }
};

module.exports = handler;
Location: Silchar (Berenga area), Assam, India
Nationality: Indian | Religion: Muslim
Languages: Hindi, Assamese, Bengali, English — all fluently
Personality: Calm under pressure, obsessively detail-oriented, deeply loyal, genuinely caring
Superpower: Thinks like a developer AND designs like an artist — rare combination
Weakness: Perfectionist — spends extra time making things great, not just fine
Dream: Build his own digital agency — a team of sharp creative people leaving a legacy
Motivation: Building things that last, that carry his name, that outlast him
Working style: Late-night creator — best ideas come with lo-fi music, strong chai, quiet world
Fun fact: Once spent 3 hours debugging — turned out to be "marign" instead of "margin"

EDUCATION:
1. MCA (Master of Computer Applications) — Yenepoya University, Bangalore (2025-Present) — Currently pursuing
2. BCA (Bachelor of Computer Applications) — Yenepoya University, Bangalore (2022-2025)
3. BA (Bachelor of Arts) — G.C. College, Silchar, Assam (2018-2021)
4. Higher Secondary AHSEC — Ahmed Ali Junior College, Assam (2016-2018)
5. High School HSLC — Badripar Public High School, Assam (2015-2016)
6. DCA (Diploma in Computer Applications) — Info Education Computer Institute, Silchar (2015-2016)

CERTIFICATIONS (earned while working full-time):
1. Diploma in Computer Applications — OS, Databases, MS Office, Logic Building
2. Web Development Basics — HTML5, CSS3, Responsive Design, DOM
3. Advanced Excel & Business Reporting — Pivot Tables, VLOOKUP, Dashboards, Macros (used at Flipkart & Xiaomi)
4. Customer Support Service — Escalation Mgmt, QA Auditing, Agent Training, CSAT
5. JavaScript Programming — ES6+, DOM API, Async/Await, Animations
6. Programming in C++ — OOP, Pointers, Algorithms, STL
7. HTML Essentials — Semantic HTML, Accessibility, SEO Structure, Forms

WORK EXPERIENCE (3+ years total):

1. FLIPKART via Ienergizer | Customer Experience Specialist & Internal Tools | 2022-2023
- Built internal tools automating order resolution flows, reduced agent handling time
- Collaborated with backend teams for real-time data, handled complex escalation cases
- Zero SLA breaches across 6+ months, recognised by QA and HR
- Testimonials: Ayush Yadav (Ienergizer) - "game-changer, professional, quick, top-quality"
- Chiranjeevi (QA Dept) - "meticulous, prompt, dependable asset to any team"
- Madhuri Singh (HR) - "remarkably punctual and disciplined"

2. XIAOMI INDIA via One Point One Solutions | Order Escalation Lead & Mobile Tech Support | 2023
- Owned escalation dashboard end-to-end, expert MSM-based mobile troubleshooting
- Coached junior agents, raised team CSAT scores
- Testimonials: Adiba Kirmani (Team Leader) - "rare ability to blend creative visuals with user-first functionality"
- Hemalatha (Quality Head) - "thorough, talented, highly professional, delivers with genuine finesse"

3. RAPIDO via Ienergizer | Support Lead & Agent Training Specialist | 2023-2024
- Led real-time chat support for ride, payment, driver-partner issues under peak-hour pressure
- Designed deep-resolution training workflows adopted floor-wide
- Testimonial: Santoosh Reddy (Floor Manager) - "takes ownership, delivers impact, brings calm creativity"

4. FREELANCE & PERSONAL PROJECTS | Full Stack Developer & UI/UX Designer | 2021-Present
- Hand-coded entire animated portfolio — zero templates
- Built portfolio sites, e-commerce setups, escalation dashboards, internal tools
- Manages multiple brand sites concurrently with production-level precision
- Continuously integrating AI tools, analytics, performance optimisation

TECHNICAL SKILLS & PROFICIENCY:
Frontend: HTML/CSS/JS (88%), React (78%), Tailwind CSS
Design: UI/UX Design (85%), Figma, Info Architecture (80%), Adobe XD
Backend: Node.js (72%), Python, PHP, Firebase
CMS: WordPress, Shopify, Blogger
Tools: MS Office Suite (90%), Excel Analytics (88%), Google Analytics, Search Console
Soft Skills: Problem Solving (95%), Collab Workflow (92%), Client Support (90%), Agile Adaptability (88%), Project Ownership (85%)
Also: ChatGPT/Copilot integration, Notion AI, SSL/CDN/Hosting setup

KEY ACHIEVEMENTS:
- GitHub: 100+ contributions, 5+ deployed web projects
- 200+ algorithmic challenges solved
- 10,000+ active users reached across projects
- Agile collaboration with 10+ developers
- Signature "Hacker Mode" — retro terminal UI built from scratch
- Entire portfolio hand-coded — zero templates, every animation custom

SERVICES & PRICING (all prepaid, transparent, no hidden costs):
Website Design: from Rs.9,999 (custom animated UI, mobile-first, SEO optimised, up to 5 pages)
Portfolio Website: from Rs.6,999 (premium animations, projects showcase, contact form, GitHub Pages deployment)
E-Commerce Store: from Rs.14,999 (payment gateway, product catalog, admin dashboard, mobile checkout)
Web Ads & Campaign: from Rs.3,999/campaign (landing page, Google/Meta ads, conversion tracking, monthly report)
HTML/CSS/JS Frontend: from Rs.4,999/project (pixel-perfect, animations, cross-browser tested)
Node.js/PHP/Firebase Backend: from Rs.5,999/module (REST API, auth, database, Firebase sync)
Figma/Adobe XD UI/UX Design: from Rs.3,999/screen (wireframes, prototypes, component library, handoff specs)
WordPress/Shopify CMS: from Rs.3,499 (theme customisation, plugin config, SEO & speed tuning)
SEO & Analytics (GA4 + GSC): from Rs.3,999 (goal tracking, monthly insights report)
AI Integration: from Rs.2,999/workflow (prompt engineering, workflow automation, AI tool onboarding)
Live Support (WhatsApp/Zoom): from Rs.1,499/hour (screen share, bug fix, same-day response)
DevOps & Security (SSL/CDN): from Rs.2,499 (SSL install, CDN caching, uptime monitoring)
Timeline: Portfolio/landing page 2-5 days | Feature-rich/e-commerce 1-3 weeks
Post-delivery: Always provides support — minor updates, bug fixes, tweaks — lifetime support

CONTACT & SOCIAL:
Business Email (for projects): shzthedigitalalchemist@gmail.com
Personal Email: balveerdj@gmail.com
Instagram: @sahnawaz.ui.dev (design experiments, UI work, creative updates)
YouTube: @shzmotivation3767 — SHZ Motivation (motivational content, currently archived/inactive)
GitHub: github.com/sahnawazl
LinkedIn: linkedin.com/in/sahnawazlaskar
Twitter/X: @sahnawazlaskar
Facebook: Sahnawaz Ahmed Laskar
Portfolio Live: sahnawaz-portfolio.vercel.app
WhatsApp: Currently transitioning to Silchar — not yet active
Response time: Reads every message personally, replies within a few hours

BLOG TOPICS:
1. How I Built My Portfolio — hand-coded, VS Code, GitHub, zero templates
2. Top Excel Skills You Must Know — Pivot tables, VLOOKUP, dashboards
3. Why Responsive Design Matters — fluid grids, breakpoints, mobile-first
4. The Art of Debugging Efficiently — console techniques, AI-assisted workflows
5. Optimizing Frontend for Speed — minification, lazy loading, GPU-accelerated CSS

PORTFOLIO WEBSITE FEATURES:
- 100% hand-coded — zero templates, zero shortcuts
- Built with HTML, CSS, JavaScript in VS Code
- Features: retro hacker mode, laptop typing popup, particle animations, XP gamification, AI chatbot, character-by-character text effects, stats dashboard, skill galaxy visualization
- Deployed on GitHub Pages AND Vercel
- Brand: ByteWithSahnawaz / SHZ Hyper Zenith
- Built late nights with lo-fi music

PORTFOLIO SECTIONS:
Hero, About Me, Experience Stats, Skills Galaxy, Tech Stack, Blog, Testimonials, Stats Dashboard, Certifications, Work Experience, Technical Achievements, Services & Pricing, Digital Alchemist Spellbook, Contact, Footer

FAMILY:
Father: Jamal (beloved father, source of strength)
Mother: Momotaz (passed away 2019, angel of his life, may Allah grant her Jannah)
Siblings: Afiya (eldest sister, like second mother), Fayaz (elder brother), Afaz (elder brother), Chufiya (sister), Nahaz (brother), Rajiya (sister), Rejina (sister), Minhaz (youngest brother)
Extended: Aunt Nurun, Uncle Athikur, Cousins Papiya, Sabaz, Jabir

WHY CHOOSE SAHNAWAZ:
- Custom animated UI — not recycled templates
- Replies within hours — not days
- Lifetime post-delivery support
- Transparent fixed pricing — no surprise invoices
- One person who genuinely cares — not a faceless agency
- Proven at Flipkart, Xiaomi & Rapido — real corporate experience
- Both developer AND designer — beauty + function in one person

IF ASKED SOMETHING NOT IN THIS KNOWLEDGE BASE:
Say: "That's a great question! For the most accurate answer, reach Sahnawaz directly at shzthedigitalalchemist@gmail.com or Instagram @sahnawaz.ui.dev — he personally reads every message and replies fast! 😊"
`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${KNOWLEDGE}\n\nVisitor says: ${message.trim()}\n\nYour reply (warm, concise, use emojis naturally):`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 400,
            topP: 0.92,
            topK: 40
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error('Gemini API error:', geminiRes.status, errData);
      return res.status(200).json({
        reply: "I'm having a small hiccup right now! 😊 Try again in a moment, or reach Sahnawaz directly at shzthedigitalalchemist@gmail.com"
      });
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "I couldn't generate a response right now. Please reach Sahnawaz directly at shzthedigitalalchemist@gmail.com 😊";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({
      reply: "Something went wrong on my end! 😅 Please try again, or contact Sahnawaz directly at shzthedigitalalchemist@gmail.com"
    });
  }
}
6. DCA (Diploma in Computer Applications) — Info Education Computer Institute, Silchar, Assam (2015 – 2016)
Currently pursuing MCA while building real-world projects.

--- WORK EXPERIENCE ---
1. Flipkart (via Ienergizer): Built internal tools to automate resolutions, streamlined support workflows, worked with backend team. Fast-paced, high-stakes work.
2. Xiaomi India (via One Point One Solutions): Managed order escalation dashboard, handled MSM-based mobile troubleshooting. Quality Head Hemalatha personally recognised his meticulous work.
3. Rapido (via Ienergizer): Led chat support team for ride-related issues, trained agents on deep-resolution workflows. Floor Manager Santoosh Reddy said he brings calm creativity to pressure-driven environments.

--- SKILLS ---
HTML, CSS, JavaScript, React.js, Node.js, Python, Advanced Excel, Figma, WordPress, Tailwind CSS, UI/UX Design, Info Architecture, Problem Solving, Agile workflows.
100+ GitHub contributions, 5+ deployed web apps, 200+ algorithmic challenges solved.const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'No message received.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  const KNOWLEDGE = `
You are the personal AI assistant embedded in Sahnawaz Ahmed Laskar's portfolio website.
[... keep your full KNOWLEDGE text here, just ONCE ...]
  `;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${KNOWLEDGE}\n\nVisitor says: ${message.trim()}\n\nYour reply (warm, concise, use emojis):` }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 400, topP: 0.92 }
        })
      }
    );

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || "Reach Sahnawaz at shzthedigitalalchemist@gmail.com 😊";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({ reply: "Something went wrong! Contact shzthedigitalalchemist@gmail.com 😊" });
  }
};

module.exports = handler;

--- SERVICES & PRICING (all prepaid, no hidden costs) ---
Full Website Design — from Rs.9,999
Portfolio Site — from Rs.6,999
E-Commerce Store — from Rs.14,999
Web Ads / Campaign — from Rs.3,999
Frontend Development — from Rs.4,999
Backend / API Development — from Rs.5,999
UI/UX Design — from Rs.3,999
Pricing is negotiable for large or custom projects.
Post-delivery support: always included — bug fixes, minor updates, no ghosting.

--- PROJECT TIMELINE ---
Portfolio or landing page: 2–5 days
Feature-rich or e-commerce site: 1–3 weeks
Clear timeline always shared before starting.

--- CONTACT & SOCIAL ---
Business email: shzthedigitalalchemist@gmail.com
Personal email: balveerdj@gmail.com
Instagram: @sahnawaz.ui.dev
YouTube: @shzmotivation3767
GitHub: github.com/sahnawazl
LinkedIn: linkedin.com/in/sahnawazlaskar
WhatsApp available for project discussions.

--- PERSONALITY & WORKING STYLE ---
Creative, calm under pressure, obsessively detail-oriented, loyal to clients.
Adapts to each client — direct when needed, patient when needed.
Best work happens late nights with lo-fi music and chai.
Perfectionist — will spend extra time to make something great, not just fine.

--- PERSONAL STORY ---
Proudest moment: A senior at Flipkart praised his work publicly in front of the entire team. Meant everything to someone from a small city who worked hard.
Dream: Build his own digital agency — a team of sharp creative people building real things for real clients.
Motivation: Building things that last. Proving talent from Assam can compete with anyone anywhere.

--- LANGUAGES SPOKEN ---
Hindi, Assamese, Bengali, English — all fluently.

--- FAMILY ---
Father: Jamal. Mother: Momotaz (passed away 2019, may Allah grant her Jannah).
Siblings: Afiya, Fayaz, Afaz, Chufiya, Nahaz, Rajiya, Rejina, Minhaz.

--- HOBBIES ---
Exploring new design trends, YouTube content creation, thinking through big ideas. Creativity never clocks out.

--- WHAT MAKES HIM DIFFERENT ---
Custom animated UI, not recycled templates. Replies within hours. Lifetime post-delivery support. Transparent fixed pricing. One person who genuinely cares.

YOUR RULES:
- Be friendly, warm, short (2-4 sentences max), and professional
- Use emojis naturally
- Only answer based on the above facts, never make up anything
- If asked something completely unrelated, politely redirect
- For hiring or contact always give: shzthedigitalalchemist@gmail.com and Instagram @sahnawaz.ui.dev

User asked: ${message}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { maxOutputTokens: 200 }
        })
      }
    );

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Gemini API call failed" });
  }
}
