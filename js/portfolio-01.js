/* ==== index.html line 2592 ==== */

(function() {
  var kta3DB = {
    kt1: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 5H5a3 3 0 0 0 3 3"/><path d="M16 5h3a3 3 0 0 1-3 3"/><path d="M12 12v3"/><path d="M9 19h6"/><path d="M10 19v-2a2 2 0 0 1 4 0v2"/></svg>', title:'GitHub — 2,600+ Contributions (4 Repos)', group:'tech', accent:'#60a5fa',
      desc:'Consistency is the rarest skill in development. Across all 4 of my repositories, I\'ve logged 2,600+ contributions over the past year — with a 44-day active streak and a 63-day longest streak on record (last updated 14 Sep 2026). Every push represents a deliberate, version-controlled improvement. This discipline shaped how I think: in iterations, not leaps.',
      tags:['Git','Version Control','Commit Streak','4 Repos','Consistency'] },
    kt2: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c2.5 1.5 4 4.5 4 8 0 2-.5 3.8-1.3 5.2l-2.7 3-2.7-3C8.5 14.3 8 12.5 8 10.5c0-3.5 1.5-6.5 4-8z"/><circle cx="12" cy="9" r="1.6"/><path d="M8.3 13.5c-1.8.4-3 1.6-3.3 4.3 1.8-.6 3.1-1.4 3.9-2.4"/><path d="M15.7 13.5c1.8.4 3 1.6 3.3 4.3-1.8-.6-3.1-1.4-3.9-2.4"/><path d="M10.2 18.7c.5 1 1 1.8 1.8 2.3.8-.5 1.3-1.3 1.8-2.3"/></svg>', title:'Deployed 50+ Web Projects', group:'tech', accent:'#34d399',
      desc:'Building locally is one thing. Shipping to the real world — with real users, real traffic, and real consequences — is another. Beyond my 4 flagship products (this portfolio, StudyLens AI, YojanaSahay, and the SHG Directory), I\'ve deployed 50+ web projects overall — store management systems, e-commerce setups, personal portfolios, school websites, restaurant websites, and more — managing deployment pipelines, domain config, and post-launch iteration for each.',
      tags:['Deployment','Vercel','Client Projects','Hosting','Performance'] },
    kt3: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c2 0 5 .4 6.5 2v12c-1.5-1.4-4.5-1.8-6.5-1.8V5.5z"/><path d="M20 5.5c-2 0-5 .4-6.5 2v12c1.5-1.4 4.5-1.8 6.5-1.8V5.5z"/></svg>', title:'Advanced React — Deep Mastery', group:'tech', accent:'#f472b6',
      desc:'I didn\'t just learn React syntax — I mastered its mental model. Hooks, context, reducer patterns, memoisation, lazy loading, code splitting — all sharpened project after project since 2023, not through a single course or badge, but through real production work.',
      tags:['React','Hooks','State Mgmt','Component Design','Performance'] },
    kt5: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 8 0 1 0 0 16c1 0 1.8-.7 1.8-1.6 0-.4-.2-.8-.4-1.1-.2-.3-.4-.7-.4-1.1 0-.9.8-1.6 1.8-1.6H17c2.2 0 4-1.6 4-3.8C21 6 17 3 12 3z"/><circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/></svg>', title:'Responsive UI Engineering', group:'tech', accent:'#22d3ee',
      desc:'Pixel-perfect design must hold across every device, orientation, and screen density. I\'ve engineered fully responsive, mobile-first interfaces using fluid grids, CSS custom properties, and real-device testing. This portfolio you\'re viewing is itself the proof.',
      tags:['CSS Grid','Flexbox','Mobile-First','Breakpoints','Cross-device'] },
    kt6: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7 7.5L10.5 16"/><path d="M17 7.5L13.5 16"/></svg>', title:'Multi-Agent AI Integration', group:'tech', accent:'#a78bfa',
      desc:'AI isn\'t decoration here — it\'s infrastructure. This portfolio runs a live Groq-powered chat assistant with streamed, context-aware responses. YojanaSahay goes further: a Groq + Tavily stack handles conversational scheme search, while a separate automation layer — Tavily-backed scheme verification, link verification, and dead-URL/ping checks, alongside the Sharpe API — keeps scheme data accurate without manual upkeep. 5 AI agents run behind the scenes in the YojanaSahay backend, working autonomously so the data stays trustworthy 24/7.',
      tags:['Groq AI','Tavily','Multi-Agent AI','Link Verification','YojanaSahay'] },
    kt7: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>', title:'Two-Tier Link Verification System', group:'tech', accent:'#fb923c',
      desc:'A simple ping-and-flag check for scheme URLs kept producing false positives — pages that moved, not pages that died. I built a two-tier system instead: Tier 1 is a fast HEAD-with-GET-fallback ping across every scheme; anything that fails gets queued for Tier 2, which pulls the page through Tavily Extract, strips it to 4,000 clean characters, and sends it to Groq (openai/gpt-oss-20b) with a JSON-only prompt asking for lastDate, isActive, and confidence. 569 of 1,116 schemes are currently "verifiable" — the other 544 are offline-only and correctly excluded rather than reported as false failures. When confidence drops below 0.3, the code hard-overrides isActive to null server-side, regardless of what the model returned — the rule lives in code, not just in the prompt, so the model can\'t talk its way around it.',
      tags:['Two-Tier Verification','Tavily Extract','Groq JSON','Confidence Scoring','YojanaSahay'] },
    kt8: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>', title:'AI Chat Concierge — Mail, Resume & Callback', group:'tech', accent:'#c084fc',
      desc:'The chat assistant\'s Help menu opens three fully automated flows, not dumb forms: Quick Mail to Sahnawaz, Send Me His Resume, and Request a Callback. Each is a real multi-step conversation — it asks for a name, then validates an email inline with progressively friendlier retry nudges (up to 4 tries before suggesting Cancel), and for callbacks accepts a plain 10-digit Indian mobile number and quietly prepends +91 itself. Every flow ends by hitting a real serverless endpoint — /api/contact, /api/resume, or /api/callback — and reports back exactly what happened: a confirmation landing in the visitor\'s inbox, Sahnawaz notified instantly, or a clear fallback email address the moment a network call fails, so nobody is left wondering if their message actually went through.',
      tags:['Conversational UI','Input Validation','Serverless API','Two-Way Email','Graceful Fallbacks'] },
    kt9: { icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>', title:'On-Demand AI Recap & Live Ship Toast', group:'tech', accent:'#fbbf24',
      desc:'The AI Weekly Recap inside "Recently Shipped" never fires on page load or the moment it scrolls into view — the /api/github-digest call, and the Groq request behind it, only runs the instant a visitor taps the button, guarded against a fast double-click so it can never fire twice. Once the summary lands, it doesn\'t type out like a terminal — it reveals word by word with a soft blur/fade-up motion, timing each word\'s delay dynamically from the recap\'s own length (clamped between 28ms and 65ms per word) so a short recap doesn\'t crawl and a long one doesn\'t rush. If the request fails, the error state becomes the retry button itself — tap it and it tries again, no dead end. A sibling feature, the live "Just Shipped" toast, listens on the same Firestore collection the GitHub push webhook writes to and pops up the instant a real commit lands — reusing the same Firestore connection already wired up for reviews and chat history, with zero polling.',
      tags:['On-Demand AI','Word-Reveal Animation','Double-Fire Guard','Retry-as-CTA','Real-Time Webhook'] },
    ki1: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8" r="3"/><path d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 20c.2-2.6 1.9-4.6 4-5.2"/></svg>', title:'Team Development — Rapido', group:'impact', accent:'#ffcc00',
      desc:'Internal tooling for a process spanning ride-hailing, payments, and driver support doesn\'t get built alone. At Rapido, I worked alongside a team of fellow developers on internal tools for the process, while also leading real-time chat support for ride and driver issues and designing agent training programs that were adopted floor-wide.',
      tags:['Team Collaboration','Internal Tooling','Rapido','Cross-functional','Agent Training'] },
    ki2: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8.9.8 1.5v.1h5.4v-.1c0-.6.3-1.1.8-1.5A6 6 0 0 0 12 3z"/></svg>', title:'Signature "Hacker Mode" Feature', group:'impact', accent:'#facc15',
      desc:'Innovation means building things that didn\'t exist before. I designed and shipped a bespoke "Hacker Mode" — a creative UI state that transforms the interface into a terminal-aesthetic experience, complete with matrix rain effects, custom cursors, and sound cues.',
      tags:['Creative Coding','JS Canvas','UX Innovation','Signature Feature','UI Modes'] },
    ki3: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z"/></svg>', title:'Real-World Impact — Public Civic-Tech', group:'impact', accent:'#4ade80',
      desc:'Numbers matter less than who\'s behind them. YojanaSahay helps everyday citizens discover and check eligibility for government welfare schemes. StudyLens AI answers real academic questions for Assam students. The SHG Directory turns Self Help Group data from Cachar district into something people can actually use. Three public, solo-built projects doing real work — not internal demos.',
      tags:['Civic Tech','Public Access','YojanaSahay','StudyLens AI','SHG Directory'] },
    ki4: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>', title:'Portfolio — Engineered from Scratch', group:'impact', accent:'#00d4ff',
      desc:'This portfolio is not a template. Every line — from the particle canvas and matrix rain footer, to the AI-powered live chat, skill bars, hacker mode, animated profile ring, and this very achievement system — is hand-coded in pure HTML, CSS, and vanilla JavaScript. No frameworks, no page builders. 16,000+ lines of deliberate, performance-optimised code, built to showcase what a developer who truly understands the web can create solo.',
      tags:['Vanilla JS','CSS Animations','AI Chatbot','Performance','16k+ Lines','Zero Templates'] },
    ki5: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>', title:'Live System Health Dashboard', group:'impact', accent:'#2dd4bf',
      desc:'The "Recently Shipped" panel on this page runs its own independent health check — GitHub API, Firestore, and the push webhook — each shown with a live status dot and real latency in milliseconds, not a static "all systems operational" badge. It auto-rechecks every 30 seconds to match the endpoint\'s own cache window, and uses the Page Visibility API to pause polling the moment the tab goes hidden — so it never silently burns GitHub or Firestore quota in a forgotten background tab — then immediately re-checks the instant the tab comes back if enough time has passed. The same pattern real status dashboards use, built solo and self-contained.',
      tags:['System Status API','Firestore','Page Visibility API','Self-Healing Polling','Live Monitoring'] },
    ki6: { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20v-3h4v3"/><path d="M10 20v-6h4v6"/><path d="M16 20v-9h4v9"/></svg>', title:'Smart 3-Step Project Quote Wizard', group:'impact', accent:'#fb7185',
      desc:'The "What do you need built?" wizard in the Contact section asks three quick questions — project type, budget, timeline — and keeps the Quote & Contact form visibly locked behind a padlock until all three are answered, so visitors give useful context before they ever see a text box. It doesn\'t show a canned price list either: it calls the same Groq-powered /api/chat endpoint the AI assistant uses, tagged source:\'wizard\' for a leaner, faster prompt, and streams back a genuine instant estimate. If the visitor is already signed in, their name and email auto-fill from the Firebase session, and their three answers quietly fold into the message. Hitting send fires the exact same /api/contact pipeline as the chat\'s Quick Mail flow — one confirmation email out to the visitor, one instant notification in to Sahnawaz, no second implementation to maintain.',
      tags:['Progressive Disclosure','Groq AI Estimate','Firebase Auto-fill','Two-Way Email','Lead Qualification'] }
  };

  var activeCard = { tech: null, impact: null };

  // Moves the shared drawer to sit directly after the LAST card in the
  // same visual row as the clicked card, instead of always trailing at
  // the very end of the grid. Row membership is detected by matching
  // offsetTop (small rounding tolerance) rather than a hardcoded column
  // count, so it stays correct across the responsive auto-fill grid
  // (2 columns on mobile, more on wider screens) and even while the
  // drawer is currently open elsewhere in the same grid.
  function kta3PlaceDrawer(card, group) {
    var grid = document.getElementById('kta3-' + group + '-grid');
    var drawer = document.getElementById('kta3-drawer-' + group);
    if (!grid || !drawer) return;
    var cards = grid.querySelectorAll('.kta3-card');
    var cardTop = card.offsetTop;
    var lastInRow = card;
    cards.forEach(function(c){
      if (Math.abs(c.offsetTop - cardTop) < 4) lastInRow = c;
    });
    if (lastInRow.nextElementSibling !== drawer) {
      lastInRow.insertAdjacentElement('afterend', drawer);
    }
  }

  function kta3Open(card) {
    var id = card.getAttribute('data-id');
    var group = card.getAttribute('data-group');
    var d = kta3DB[id];
    if (!d) return;

    // ripple
    var rip = document.createElement('div');
    rip.className = 'kta3-rip';
    card.appendChild(rip);
    setTimeout(function(){ if (rip.parentNode) rip.parentNode.removeChild(rip); }, 650);

    // toggle same card
    if (activeCard[group] === card) {
      kta3Close(group);
      return;
    }

    // deactivate other cards in same group
    var grid = document.getElementById('kta3-' + group + '-grid');
    grid.querySelectorAll('.kta3-card').forEach(function(c){ c.classList.remove('kta3-on'); });
    card.classList.add('kta3-on');
    activeCard[group] = card;

    // populate panel
    document.getElementById('kta3-ico-' + group).innerHTML = d.icon;
    document.getElementById('kta3-title-' + group).textContent = d.title;
    document.getElementById('kta3-desc-' + group).textContent = d.desc;
    document.getElementById('kta3-panel-' + group).style.setProperty('--kp', d.accent);
    var tagsEl = document.getElementById('kta3-tags-' + group);
    tagsEl.innerHTML = d.tags.map(function(t){ return '<span class="kta3-tag">' + t + '</span>'; }).join('');

    // open drawer directly below the clicked card's row
    kta3PlaceDrawer(card, group);
    document.getElementById('kta3-drawer-' + group).classList.add('kta3-open');

    // smooth scroll
    setTimeout(function(){ card.scrollIntoView({ behavior:'smooth', block:'nearest' }); }, 90);
  }

  window.kta3Close = function(group) {
    var drawer = document.getElementById('kta3-drawer-' + group);
    if (drawer) drawer.classList.remove('kta3-open');
    var grid = document.getElementById('kta3-' + group + '-grid');
    if (grid) grid.querySelectorAll('.kta3-card').forEach(function(c){ c.classList.remove('kta3-on'); });
    activeCard[group] = null;
  };

  // attach click handlers + stagger delays
  document.querySelectorAll('.kta3-card').forEach(function(card, i) {
    card.style.animationDelay = (0.04 + i * 0.055) + 's';
    card.addEventListener('click', function(){ kta3Open(card); });
  });
})();
