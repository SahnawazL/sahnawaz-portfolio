/* Recruiter quick view — the whole profile on one screen, for someone who
   has a minute. Opens from the hero button, Quick Search, the chat, or a
   shared link: /?view=recruiter (also #recruiter).
   Every fact here is also on the page or in the CV; the only number fetched
   live is YojanaSahay's scheme count, from the same public feed the
   "Live from my products" cards use. Nothing loads until it is opened. */
(function () {
  'use strict';
  var SITE = 'https://sahnawaz-portfolio.vercel.app';
  var EMAIL = 'shzthedigitalalchemist@gmail.com';
  var root = null, lastFocus = null, pushed = false;

  var I = {
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    out: '<path d="M7 17 17 7M9 7h8v8"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>'
  };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };

  var EXPERIENCE = [
    ['Full Stack Developer & UI/UX Designer', 'Freelance & own products', '2021 – now'],
    ['IT / Developer', 'Rapido (via Ienergizer)', '2023 – 2024'],
    ['L2 Support, Returns & Refunds', 'Flipkart (via Ienergizer)', '2023'],
    ['L1 Support → MSM Troubleshooting', 'Xiaomi India (via One Point One)', '2022 – 2023']
  ];
  var SKILLS = ['JavaScript', 'React', 'HTML & CSS', 'Tailwind CSS', 'Node.js', 'Firebase', 'Python', 'PHP', 'UI/UX Design', 'Figma', 'WordPress', 'Shopify', 'AI APIs (Groq, Gemini)', 'Vercel CI/CD'];

  function css() {
    if (document.getElementById('rqvCss')) return;
    var s = document.createElement('style');
    s.id = 'rqvCss';
    s.textContent = [
      '.rqv{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,10,18,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s ease}',
      '.rqv.on{opacity:1}',
      '.rqv-sheet{position:relative;display:flex;width:min(760px,100%);max-height:94vh;overflow:hidden;border-radius:22px 22px 0 0;background:linear-gradient(160deg,#0b1d2e,#081522);border:1px solid rgba(80,210,255,.18);box-shadow:0 -10px 50px rgba(0,0,0,.45);color:#e6f3fb;font-family:"DM Sans",Inter,system-ui,sans-serif;transform:translateY(24px);transition:transform .32s cubic-bezier(.2,.8,.2,1)}',
      '.rqv-body{flex:1;overflow:auto;overscroll-behavior:contain;padding:22px 18px 26px}',
      '.rqv.on .rqv-sheet{transform:none}',
      '@media(min-width:720px){.rqv{align-items:center}.rqv-sheet{border-radius:22px}.rqv-body{padding:28px 30px 30px}}',
      '.rqv-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:#0b1d2e;color:#cfe9f5;display:grid;place-items:center;cursor:pointer;z-index:2}',
      '.rqv svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
      '.rqv-tag{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5ae0ff}',
      '.rqv-tag{margin-right:56px}.rqv-head{display:flex;gap:16px;align-items:center;margin:10px 0 16px}',
      '.rqv-head img{width:78px;height:78px;border-radius:50%;object-fit:cover;border:2px solid rgba(90,224,255,.5);flex:none}',
      '.rqv h2{text-align:left;margin:0;font:700 1.45rem/1.2 "Playfair Display",Georgia,serif;color:#fff}',
      '.rqv-role{margin:3px 0 0;font-size:.95rem;color:#a9d6ea}',
      '.rqv-where{display:flex;align-items:center;gap:5px;margin:6px 0 0;font-size:.84rem;color:#8fb3c5}',
      '.rqv-where svg{width:14px;height:14px}',
      '.rqv-open{display:inline-block;margin-top:8px;padding:4px 10px;border-radius:99px;font-size:.78rem;font-weight:700;color:#04121a;background:linear-gradient(135deg,#5ae0ff,#4fe0a2)}',
      '.rqv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:4px 0 18px}',
      '@media(max-width:520px){.rqv-stats{grid-template-columns:repeat(2,1fr)}}',
      '.rqv-stat{padding:10px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);text-align:center}',
      '.rqv-stat b{display:block;font:700 1.25rem "DM Sans",sans-serif;color:#5ae0ff;font-variant-numeric:tabular-nums}',
      '.rqv-stat span{font-size:.74rem;color:#9cbccc}',
      '.rqv h3{margin:18px 0 8px;font-size:.78rem;letter-spacing:.09em;text-transform:uppercase;color:#7fc8e0}',
      '.rqv-prods{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '@media(max-width:520px){.rqv-prods{grid-template-columns:1fr}}',
      '.rqv-prod{padding:12px 14px;border-radius:14px;background:rgba(90,224,255,.06);border:1px solid rgba(90,224,255,.16)}',
      '.rqv-prod h4{margin:0;font-size:1rem;color:#fff}',
      '.rqv-prod p{margin:4px 0 8px;font-size:.84rem;line-height:1.45;color:#b6d3e0}',
      '.rqv-live{display:inline-flex;align-items:center;gap:5px;font-size:.78rem;color:#4fe0a2}',
      '.rqv-live i{width:7px;height:7px;border-radius:50%;background:#4fe0a2;box-shadow:0 0 0 3px rgba(79,224,162,.18)}',
      '.rqv-plinks{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
      '.rqv-plinks a,.rqv-plinks button{display:inline-flex;align-items:center;gap:5px;min-height:36px;padding:0 11px;border-radius:10px;font:600 .8rem "DM Sans",sans-serif;color:#cfeefa;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);cursor:pointer;text-decoration:none}',
      '.rqv-plinks svg{width:14px;height:14px}',
      '.rqv-xp{list-style:none;margin:0;padding:0}',
      '.rqv-xp li{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid rgba(255,255,255,.07);font-size:.88rem}',
      '.rqv-xp li:first-child{border-top:0}',
      '.rqv-xp b{color:#fff;font-weight:600}',
      '.rqv-xp small{display:block;color:#8fb3c5;font-size:.8rem}',
      '.rqv-xp em{flex:none;font-style:normal;color:#8fb3c5;font-size:.8rem;white-space:nowrap}',
      '.rqv-note{margin:6px 0 0;font-size:.78rem;color:#7d9cad}',
      '.rqv-skills{display:flex;flex-wrap:wrap;gap:6px}',
      '.rqv-skills span{padding:5px 10px;border-radius:99px;font-size:.8rem;color:#d6eef8;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}',
      '.rqv-edu{margin:0;font-size:.88rem;line-height:1.6;color:#cfe3ec}',
      '.rqv-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px}.rqv-acts .main{grid-column:1/-1}',
      '@media(max-width:520px){.rqv-acts{grid-template-columns:1fr}}',
      '.rqv-acts button,.rqv-acts a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 14px;border-radius:13px;font:700 .9rem "DM Sans",sans-serif;cursor:pointer;text-decoration:none;color:#e6f3fb;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}',
      '.rqv-acts .main{color:#04121a;background:linear-gradient(135deg,#5ae0ff,#4fe0a2);border-color:transparent}',
      '.rqv-acts button:active,.rqv-plinks button:active{transform:scale(.98)}',
      '.rqv-full{display:block;width:100%;margin-top:12px;min-height:44px;border:0;background:none;color:#8fd7ef;font:600 .88rem "DM Sans",sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
      '.rqv :focus-visible{outline:2px solid #5ae0ff;outline-offset:2px}',
      '@media(prefers-reduced-motion:reduce){.rqv,.rqv-sheet{transition:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function stat(selectorIndex, fallbackNum, fallbackLabel) {
    /* the hero's own numbers, so both places always agree */
    var items = document.querySelectorAll('#heroStatsBar .hsb-item');
    var it = items[selectorIndex];
    var num = it && it.querySelector('[data-target]');
    var label = it && it.querySelector('.hsb-label');
    var value = num ? num.getAttribute('data-target') + (num.getAttribute('data-suffix') || '') : fallbackNum;
    return '<div class="rqv-stat"><b>' + value + '</b><span>' + (label ? label.textContent.trim() : fallbackLabel) + '</span></div>';
  }

  function build() {
    css();
    root = document.createElement('div');
    root.className = 'rqv';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'rqvName');
    root.innerHTML =
      '<div class="rqv-sheet">'
      + '<button type="button" class="rqv-x" data-rqv="close" aria-label="Close quick view">' + svg(I.close) + '</button>'
      + '<div class="rqv-body">'
      + '<span class="rqv-tag">⏱ 60-second view</span>'
      + '<div class="rqv-head"><img src="profile-hero-360.webp" alt="Sahnawaz Ahmed Laskar" width="78" height="78" decoding="async">'
      +   '<div><h2 id="rqvName">Sahnawaz Ahmed Laskar</h2><p class="rqv-role">Full Stack Developer · UI/UX Designer</p>'
      +   '<p class="rqv-where">' + svg(I.pin) + 'Bangalore, India · originally from Silchar, Assam</p>'
      +   '<span class="rqv-open">Open to full-time roles and freelance work</span></div></div>'
      + '<div class="rqv-stats">' + stat(0, '5+', 'Yrs as Developer') + stat(1, '50+', 'Projects Built')
      +   '<div class="rqv-stat"><b>2</b><span>Live products, built solo</span></div>'
      +   '<div class="rqv-stat"><b>2,000+</b><span>Commits on YojanaSahay</span></div></div>'
      + '<h3>Live products</h3><div class="rqv-prods">'
      +   '<div class="rqv-prod"><h4>YojanaSahay</h4><p>Finds Indian government welfare schemes a person qualifies for. React, Firebase, Groq AI. Web, Android and Telegram bot. Open source.</p>'
      +     '<span class="rqv-live" id="rqvYs"><i></i>Checking live numbers…</span>'
      +     '<div class="rqv-plinks"><button type="button" data-rqv="case" data-key="yojanasahay">Case study ' + svg(I.arrow) + '</button><a href="https://yojanasahay.vercel.app" target="_blank" rel="noopener">Open ' + svg(I.out) + '</a></div></div>'
      +   '<div class="rqv-prod"><h4>StudyLens AI</h4><p>AI homework helper for Classes KG–12 in 4 languages, with Groq and Gemini, photo questions and a full admin dashboard.</p>'
      +     '<span class="rqv-live"><i></i>Live at studylens-ai-gamma.vercel.app</span>'
      +     '<div class="rqv-plinks"><button type="button" data-rqv="case" data-key="studylens">Case study ' + svg(I.arrow) + '</button><a href="https://studylens-ai-gamma.vercel.app" target="_blank" rel="noopener">Open ' + svg(I.out) + '</a></div></div>'
      + '</div>'
      + '<h3>Experience</h3><ul class="rqv-xp">' + EXPERIENCE.map(function (x) {
          return '<li><span><b>' + x[0] + '</b><small>' + x[1] + '</small></span><em>' + x[2] + '</em></li>';
        }).join('') + '</ul>'
      + '<p class="rqv-note">Xiaomi and Flipkart were customer support roles; Rapido was IT and development.</p>'
      + '<h3>Skills</h3><div class="rqv-skills">' + SKILLS.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>'
      + '<h3>Education</h3><p class="rqv-edu"><b>MCA</b>, Yenepoya University, Bangalore · 2025 – now<br><b>BCA</b>, Yenepoya University, Bangalore · 2022 – 2025</p>'
      + '<div class="rqv-acts">'
      +   '<button type="button" class="main" data-rqv="fit">' + svg(I.target) + 'Check my fit for your role</button>'
      +   '<a href="/resume-ats.pdf" download="Sahnawaz-Ahmed-Laskar-Resume.pdf" data-rqv-track="cv">' + svg(I.file) + 'Download resume (PDF)</a>'
      +   '<a href="https://github.com/SahnawazL" target="_blank" rel="noopener" data-rqv-track="github">' + svg(I.code) + 'View GitHub</a>'
      +   '<a href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Opportunity for Sahnawaz') + '">' + svg(I.mail) + 'Email me</a>'
      +   '<button type="button" data-rqv="share">' + svg(I.link) + '<span>Copy link to this view</span></button>'
      + '</div>'
      + '<button type="button" class="rqv-full" data-rqv="close">See the full portfolio</button>'
      + '</div></div>';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    liveNumbers();
  }

  function liveNumbers() {
    var el = document.getElementById('rqvYs');
    fetch('https://yojanasahay.vercel.app/api/stats', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (d) {
        if (!el) return;
        var bits = [];
        if (typeof d.schemeCount === 'number') bits.push(d.schemeCount.toLocaleString('en-IN') + ' schemes tracked');
        if (typeof d.checkerTotal === 'number') bits.push(d.checkerTotal.toLocaleString('en-IN') + ' eligibility checks run');
        el.innerHTML = '<i></i>' + (bits.length ? 'Live: ' + bits.join(' · ') : 'Live and running');
      })
      .catch(function () { if (el) el.innerHTML = '<i></i>Live at yojanasahay.vercel.app'; });
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = root.querySelectorAll('button, a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onClick(e) {
    if (e.target === root) return close();
    var t = e.target.closest('[data-rqv-track]');
    if (t) { try { if (window.gtag) gtag('event', 'recruiter_view_action', { action: t.getAttribute('data-rqv-track') }); } catch (x) {} return; }
    var b = e.target.closest('[data-rqv]');
    if (!b) return;
    var what = b.getAttribute('data-rqv');
    if (what === 'close') return close();
    if (what === 'case') {
      var key = b.getAttribute('data-key');
      close(function () { if (typeof window.openCaseStudy === 'function') window.openCaseStudy(key); else location.href = '/?case=' + key; });
    } else if (what === 'fit') {
      close(function () {
        var sec = document.getElementById('job-fit');
        if (!sec) return;
        if (typeof window.shzLandOn === 'function') window.shzLandOn(sec); else sec.scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () { var n = document.getElementById('jfName'); if (n && n.offsetParent) n.focus({ preventScroll: true }); }, 900);
      });
    } else if (what === 'cv') {
      close(function () { if (typeof window.printCV === 'function') window.printCV(); else window.print(); });
    } else if (what === 'share') {
      var link = SITE + '/?view=recruiter', label = b.querySelector('span');
      var done = function () { label.textContent = '✓ Link copied'; setTimeout(function () { label.textContent = 'Copy link to this view'; }, 1800); };
      if (navigator.share) navigator.share({ title: 'Sahnawaz Ahmed Laskar — 60-second view', url: link }).catch(function () {});
      else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () {});
    }
    try { if (window.gtag) gtag('event', 'recruiter_view_action', { action: what }); } catch (x) {}
  }

  function open() {
    if (!root) build();
    if (root.classList.contains('on')) return;
    lastFocus = document.activeElement;
    try { if (typeof window.closeChat === 'function') window.closeChat(); } catch (x) {}
    try { if (typeof window.closeCommandPalette === 'function') window.closeCommandPalette(); } catch (x) {}
    root.style.display = 'flex';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { root.classList.add('on'); });
    if (!pushed) { try { history.pushState({ rqv: 1 }, '', location.href); pushed = true; } catch (x) {} }
    setTimeout(function () { var x = root.querySelector('.rqv-x'); if (x) x.focus({ preventScroll: true }); }, 60);
    try { if (window.gtag) gtag('event', 'recruiter_view_open'); } catch (x) {}
  }

  function close(then) {
    if (!root || !root.classList.contains('on')) { if (typeof then === 'function') then(); return; }
    root.classList.remove('on');
    document.documentElement.style.overflow = '';
    setTimeout(function () {
      root.style.display = 'none';
      if (typeof then === 'function') then();
      else if (lastFocus && lastFocus.isConnected) try { lastFocus.focus({ preventScroll: true }); } catch (x) {}
    }, 260);
    if (pushed) { pushed = false; try { history.back(); } catch (x) {} }
  }

  addEventListener('popstate', function () { if (root && root.classList.contains('on')) { pushed = false; close(); } });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-recruiter-view]');
    if (t) { e.preventDefault(); open(); }
  });

  window.openRecruiterView = open;
  window.closeRecruiterView = close;

  /* shared link: /?view=recruiter or /#recruiter */
  var p = new URLSearchParams(location.search);
  if (p.get('view') === 'recruiter' || location.hash === '#recruiter') {
    var go = function () { setTimeout(open, 400); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }
})();
