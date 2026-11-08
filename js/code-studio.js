/* Code studio — the hero's code card on wide screens (960px and up).
   The code and the live result sit side by side, like an editor with a
   live preview: each line, as it is typed, builds its part of the card on
   the right (logo, title, the live number, the button), with an inspector
   outline showing which line made which part. When it finishes, pointing
   at a line lights up its part and the other way round.
   Three files, one per product: YojanaSahay (live scheme count from its
   own API), StudyLens AI and this portfolio. It moves to the next one by
   itself while it is on screen, pauses while the pointer is over it, and
   the file tabs switch by hand.
   Smarter touches: suggestions pop up while a component name is typed,
   files hand over smoothly (old lines slide out, the card folds back),
   the finished code is editable (title, button text, glow colour) with
   the preview following as you type, and the card tilts toward the
   pointer with a soft light.
   Phones keep the original Code / Preview card from premium-extras.js;
   this only takes over at desktop width and hands back below it. */
(function () {
  'use strict';
  var box = document.getElementById('c2d');
  if (!box) return;
  var wide = matchMedia('(min-width: 960px)');
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n) { try { return Number(n).toLocaleString('en-IN'); } catch (e) { return String(n); } };

  var FILES = [
    { id: 'ys', file: 'YojanaSahay.jsx', title: 'Yojana Sahay', logo: 'yojanasahay-logo.webp', glow: 'saffron', accent: '#00ffd0',
      key: 'schemes', value: 1200, suffix: '', label: 'schemes tracked', href: 'https://yojanasahay.vercel.app', host: 'yojanasahay.vercel.app', btn: 'Open app →' },
    { id: 'sl', file: 'StudyLens.jsx', title: 'StudyLens AI', logo: 'studylens-logo.svg', glow: 'violet', accent: '#a78bfa',
      key: 'languages', value: 4, suffix: '', label: 'languages · Class KG–12', href: 'https://studylens-ai-gamma.vercel.app', host: 'studylens-ai-gamma.vercel.app', btn: 'Ask a question →' },
    { id: 'pf', file: 'Portfolio.jsx', title: 'This portfolio', logo: 'profile-hero-360.webp', glow: 'cyan', accent: '#38bdf8', round: true,
      key: 'lines', value: 50000, suffix: '+', label: 'lines written by hand', href: 'https://github.com/SahnawazL/sahnawaz-portfolio', host: 'github.com/SahnawazL', btn: 'View the source →' }
  ];
  /* the live YojanaSahay number, from the same public feed as the rest of the page */
  fetch('https://yojanasahay.vercel.app/api/stats', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && typeof d.schemeCount === 'number') FILES[0].value = d.schemeCount; })
    .catch(function () {});

  function lines(f) {
    return [
      [['t', '<'], ['k', 'Card'], ['a', ' glow'], ['t', '='], ['q', '"'], ['e:glow', f.glow], ['q', '"'], ['t', '>']],
      [['t', '  <'], ['k', 'Logo'], ['a', ' src'], ['t', '='], ['s', '"' + f.logo + '"'], ['t', ' />']],
      [['t', '  <'], ['k', 'Title'], ['t', '>'], ['e:title', f.title], ['t', '</'], ['k', 'Title'], ['t', '>']],
      [['t', '  <'], ['k', 'Stat'], ['a', ' value'], ['t', '={'], ['n', f.key], ['t', '}'], ['a', ' live'], ['t', ' />']],
      [['t', '  <'], ['k', 'Button'], ['a', ' href'], ['t', '='], ['s', '"' + f.host + '"'], ['t', '>'], ['e:btn', f.btn], ['t', '</'], ['k', 'Button'], ['t', '>']],
      [['t', '</'], ['k', 'Card'], ['t', '>']]
    ];
  }
  /* a token's colour class; "e:…" tokens become editable once typed */
  function tok(p) {
    var el = document.createElement('span'), t = p[0];
    if (t.indexOf('e:') === 0) { el.className = (t === 'e:glow' ? 'cs-s' : 'cs-x') + ' cs-e'; el.setAttribute('data-edit', t.slice(2)); }
    else el.className = 'cs-' + (t === 'q' ? 's' : t);
    return el;
  }
  var COLORS = { saffron: '#ff9933', orange: '#ff9933', violet: '#a78bfa', purple: '#a78bfa', cyan: '#38bdf8', blue: '#60a5fa', teal: '#00ffd0',
    green: '#22e3a5', pink: '#f472b6', gold: '#fbbf24', yellow: '#fde047', red: '#f87171', white: '#e2f3ff' };
  var COMPONENTS = ['Card', 'Logo', 'Title', 'Stat', 'Button', 'Badge', 'Chart'];

  /* which part of the card each line builds */
  var PART = ['card', 'logo', 'title', 'stat', 'btn', 'card'];
  var TAG = ['<Card>', '<Logo>', '<Title>', '<Stat>', '<Button>', '<Card>'];

  var root = null, idx = 0, timers = [], nextTimer = 0, auto = true, hover = false, visible = false, playing = false, built = false, t0 = 0;
  var later = function (fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; };
  var stop = function () { timers.forEach(clearTimeout); timers = []; clearTimeout(nextTimer); playing = false; };

  function css() {
    if (document.getElementById('csCss')) return;
    var s = document.createElement('style');
    s.id = 'csCss';
    s.textContent = [
      '@media (min-width: 960px) {',
      '  section:has(> #pfpStage) > #c2d.cs-on { width: min(900px, 100%); }',
      '  #c2d.cs-on .c2d-tabs, #c2d.cs-on .c2d-replay, #c2d.cs-on .c2d-body, #c2d.cs-on .c2d-cap { display: none !important; }',
      '}',
      '#c2d:not(.cs-on) .cs { display: none; }',
      '.cs-tabs { display: flex; gap: 2px; margin-right: auto; padding: 2px; border-radius: 9px; background: rgba(255,255,255,.04); }',
      '.cs-tab { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; padding: .38rem .7rem; border-radius: 7px; font: 600 .72rem/1 "DM Mono","Courier New",monospace; color: rgba(180,215,230,.55); transition: color .2s, background .2s; position: relative; }',
      '.cs-tab i { width: 7px; height: 7px; border-radius: 2px; background: var(--c); opacity: .55; transition: opacity .2s; }',
      '.cs-tab[aria-selected="true"] { color: #eafcff; background: rgba(80,210,255,.12); }',
      '.cs-tab[aria-selected="true"] i { opacity: 1; box-shadow: 0 0 8px var(--c); }',
      '.cs-tab b { position: absolute; left: 8px; right: 8px; bottom: 2px; height: 2px; border-radius: 2px; background: var(--c); transform-origin: left; transform: scaleX(0); opacity: .8; }',
      '.cs-tab:focus-visible, .cs-ctl:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }',
      '.cs-ctl { all: unset; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; background: rgba(255,255,255,.04); color: rgba(200,236,250,.8); }',
      '.cs-ctl svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }',
      '.cs-ctls { display: flex; gap: 6px; }',
      '.cs-split { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr); height: 268px; }',
      '.cs-code { position: relative; display: flex; padding: .9rem 0; overflow: hidden; border-right: 1px solid rgba(255,255,255,.06); }',
      '.cs-gut { flex: none; width: 2.6rem; padding-right: .7rem; text-align: right; font: 500 .74rem/1.75 "DM Mono","Courier New",monospace; color: rgba(150,190,210,.28); user-select: none; }',
      '.cs-gut span { display: block; transition: color .2s; }',
      '.cs-gut span.on { color: rgba(200,240,255,.8); }',
      '.cs-pre { position: relative; margin: 0; flex: 1; min-width: 0; font: 500 .78rem/1.75 "DM Mono","Courier New",monospace; color: #cfe8f5; white-space: pre; overflow: hidden; }',
      '.cs-ln { display: block; position: relative; padding-right: .6rem; border-radius: 4px; transition: background .25s; cursor: default; }',
      '.cs-ln.on, .cs-ln.hl { background: rgba(80,210,255,.08); }',
      '.cs-ln.hl { box-shadow: inset 2px 0 0 var(--acc); }',
      '.cs-caret { display: inline-block; width: 7px; height: 1.05em; margin-left: 1px; vertical-align: -.18em; background: var(--acc); animation: csBlink 1s steps(1) infinite; }',
      '@keyframes csBlink { 50% { opacity: 0; } }',
      '.cs-t { color: rgba(170,200,220,.6); } .cs-k { color: #50d2ff; } .cs-a { color: #c4b5fd; } .cs-s { color: #fcd34d; } .cs-n { color: #00ffd0; } .cs-x { color: #f4fdff; }',
      '.cs-view { position: relative; display: grid; place-items: center; overflow: hidden;',
      '  background: radial-gradient(70% 70% at 50% 45%, color-mix(in srgb, var(--acc) 12%, transparent), transparent 70%), radial-gradient(rgba(150,210,240,.08) 1px, transparent 1px) 0 0 / 16px 16px; }',
      '.cs-view-tag { position: absolute; top: 9px; left: 12px; font: 600 .62rem/1 "DM Mono",monospace; letter-spacing: .08em; text-transform: uppercase; color: rgba(160,210,230,.4); }',
      '.cs-card { position: relative; width: 248px; padding: .95rem 1rem 1rem; border-radius: 16px; background: linear-gradient(160deg, #10304a, #08192a); border: 1px solid rgba(255,255,255,.08);',
      '  box-shadow: 0 14px 34px rgba(0,0,0,.45); transition: border-color .5s, box-shadow .6s, opacity .45s, transform .55s cubic-bezier(.16,1,.3,1); }',
      '.cs-card.pending { opacity: 0; transform: translateY(10px) scale(.96); }',
      '.cs-card.glow { border-color: color-mix(in srgb, var(--acc) 45%, transparent); box-shadow: 0 14px 34px rgba(0,0,0,.45), 0 0 34px color-mix(in srgb, var(--acc) 22%, transparent); }',
      '.cs-p { transition: opacity .45s ease, transform .55s cubic-bezier(.16,1,.3,1), filter .45s ease; }',
      '.cs-p.pending { opacity: 0; transform: translateY(8px); filter: blur(4px); }',
      '.cs-top { display: flex; align-items: center; justify-content: space-between; min-height: 36px; }',
      '.cs-logo { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; background: #fff; padding: 3px; box-sizing: border-box; }',
      '.cs-logo.round { border-radius: 50%; padding: 0; border: 2px solid var(--acc); }',
      '.cs-live { display: inline-flex; align-items: center; gap: .3rem; font: 700 .6rem/1 "DM Sans",sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--acc); transition: opacity .4s; }',
      '.cs-live i { width: 6px; height: 6px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 8px var(--acc); animation: csPulse 1.8s ease-in-out infinite; }',
      '@keyframes csPulse { 50% { opacity: .35; } }',
      '.cs-title { margin: .7rem 0 .2rem; font: 700 1.08rem/1.2 "Space Grotesk","DM Sans",sans-serif; color: #f2fcff; }',
      '.cs-stat { display: flex; align-items: baseline; gap: .38rem; margin-bottom: .8rem; }',
      '.cs-stat-v { font: 700 1.6rem/1 "Space Grotesk","DM Sans",sans-serif; color: var(--acc); font-variant-numeric: tabular-nums; text-shadow: 0 0 18px color-mix(in srgb, var(--acc) 40%, transparent); }',
      '.cs-stat-l { font: 500 .74rem/1.2 "DM Sans",sans-serif; color: rgba(180,220,235,.72); }',
      '.cs-btn { display: block; text-align: center; padding: .58rem; border-radius: 10px; text-decoration: none; font: 700 .78rem/1 "DM Sans",sans-serif; color: #021018; background: linear-gradient(90deg, var(--acc), #38bdf8); }',
      '.cs-p.hl, .cs-card.hl { outline: 1.5px dashed color-mix(in srgb, var(--acc) 80%, transparent); outline-offset: 4px; border-radius: 8px; }',
      '.cs-card.hl { border-radius: 16px; }',
      '.cs-chip { position: absolute; z-index: 2; padding: 3px 7px; border-radius: 5px; font: 600 .6rem/1 "DM Mono",monospace; color: #021018; background: var(--acc); pointer-events: none; opacity: 0; transform: translateY(4px); transition: opacity .2s, transform .25s, left .3s cubic-bezier(.16,1,.3,1), top .3s cubic-bezier(.16,1,.3,1); white-space: nowrap; }',
      '.cs-chip.on { opacity: 1; transform: none; }',
      '.cs-status { display: flex; align-items: center; gap: 14px; padding: .45rem .9rem; border-top: 1px solid rgba(255,255,255,.06); font: 500 .66rem/1 "DM Mono","Courier New",monospace; color: rgba(160,205,222,.55); background: rgba(255,255,255,.015); }',
      '.cs-status .ok { display: inline-flex; align-items: center; gap: 6px; color: rgba(190,240,225,.85); }',
      '.cs-status .ok i { width: 6px; height: 6px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 6px var(--acc); }',
      '.cs-status .grow { margin-left: auto; }',
      '.cs-fade { animation: csFade .35s ease both; }',
      '@keyframes csFade { from { opacity: 0; } }',
      /* IntelliSense box */
      '.cs-sug { position: absolute; z-index: 3; min-width: 180px; padding: 4px; border-radius: 8px; background: #0d2234; border: 1px solid rgba(120,200,255,.22); box-shadow: 0 10px 26px rgba(0,0,0,.5);',
      '  font: 500 .72rem/1 "DM Mono","Courier New",monospace; color: rgba(200,230,245,.75); opacity: 0; transform: translateY(-3px); pointer-events: none; transition: opacity .12s, transform .15s; }',
      '.cs-sug.on { opacity: 1; transform: none; }',
      '.cs-sug div { display: flex; align-items: center; gap: 7px; padding: 5px 7px; border-radius: 5px; }',
      '.cs-sug div.sel { background: rgba(80,210,255,.16); color: #eafcff; }',
      '.cs-sug i { font-style: normal; color: #c4b5fd; }',
      '.cs-sug b { color: #50d2ff; font-weight: 700; }',
      '.cs-sug em { margin-left: auto; font-style: normal; font-size: .62rem; color: rgba(160,200,220,.45); }',
      /* editable values */
      '.cs-editable .cs-e { cursor: text; border-radius: 3px; outline: none; box-shadow: 0 1px 0 rgba(252,211,77,.45); transition: background .2s, box-shadow .2s; }',
      '.cs-editable .cs-e:hover { background: rgba(252,211,77,.1); }',
      '.cs-editable .cs-e:focus { background: rgba(252,211,77,.14); box-shadow: 0 0 0 1px rgba(252,211,77,.6); }',
      '.cs-editable .cs-e.cs-x { box-shadow: 0 1px 0 rgba(244,253,255,.35); }',
      /* tilt and light */
      '.cs-card:not(.pending) { transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); }',
      '.cs-card.tilt { transition: transform .12s ease-out, border-color .5s, box-shadow .6s; }',
      '.cs-card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; transition: opacity .3s;',
      '  background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 30%), rgba(255,255,255,.1), transparent 60%); }',
      '.cs-card.tilt::after { opacity: 1; }',
      '@media (prefers-reduced-motion: reduce) { .cs-card, .cs-p, .cs-chip, .cs-sug { transition: none; } .cs-caret, .cs-live i { animation: none; } }'
    ].join('\n');
    document.head.appendChild(s);
  }

  var I = {
    play: '<path d="M7 5v14l11-7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>'
  };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };

  function build() {
    if (built) return;
    built = true;
    css();
    root = document.createElement('div');
    root.className = 'cs';
    root.innerHTML =
      '<div class="cs-split"><div class="cs-code"><div class="cs-gut" aria-hidden="true"></div><pre class="cs-pre" aria-hidden="true"></pre></div>'
      + '<div class="cs-view"><span class="cs-view-tag">Live preview</span>'
      + '<div class="cs-card pending" data-part="card"><div class="cs-top"><img class="cs-logo cs-p pending" data-part="logo" alt="" width="36" height="36" decoding="async">'
      + '<span class="cs-live"><i></i>Live</span></div>'
      + '<div class="cs-title cs-p pending" data-part="title"></div>'
      + '<div class="cs-stat cs-p pending" data-part="stat"><span class="cs-stat-v">0</span><span class="cs-stat-l"></span></div>'
      + '<a class="cs-btn cs-p pending" data-part="btn" target="_blank" rel="noopener"></a></div>'
      + '<span class="cs-chip"></span></div></div>'
      + '<div class="cs-status"><span class="ok"><i></i><span class="cs-st-a">Ready</span></span><span class="cs-st-b">JSX · UTF-8</span><span class="cs-st-c"></span>'
      + '<span class="grow">A few lines of code become the real interface</span></div>';
    box.appendChild(root);
    /* file tabs and controls go into the card's existing title bar */
    var bar = box.querySelector('.c2d-bar');
    var tabs = document.createElement('span');
    tabs.className = 'cs cs-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Choose a product');
    tabs.innerHTML = FILES.map(function (f, i) {
      return '<button type="button" class="cs-tab" role="tab" aria-selected="false" data-i="' + i + '" style="--c:' + f.accent + '"><i></i>' + f.file + '<b></b></button>';
    }).join('');
    var ctls = document.createElement('span');
    ctls.className = 'cs cs-ctls';
    ctls.innerHTML = '<button type="button" class="cs-ctl" data-cs="auto" aria-label="Pause the tour of files">' + svg(I.pause) + '</button>'
      + '<button type="button" class="cs-ctl" data-cs="replay" aria-label="Type it again">' + svg(I.replay) + '</button>';
    bar.insertBefore(tabs, bar.querySelector('.c2d-tabs'));
    bar.appendChild(ctls);

    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.cs-tab'); if (!t) return;
      setAuto(false);
      show(+t.getAttribute('data-i'));
    });
    tabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); setAuto(false);
      var n = (idx + (e.key === 'ArrowRight' ? 1 : FILES.length - 1)) % FILES.length;
      show(n); tabs.children[n].focus();
    });
    ctls.addEventListener('click', function (e) {
      var b = e.target.closest('.cs-ctl'); if (!b) return;
      if (b.getAttribute('data-cs') === 'replay') show(idx);
      else { setAuto(!auto); if (auto && !playing) next(1200); }
    });
    box.addEventListener('mouseenter', function () { hover = true; });
    box.addEventListener('mouseleave', function () { hover = false; if (auto && !playing) next(1500); });
    /* pointing at a line lights up the part it made, and the other way */
    root.addEventListener('mouseover', function (e) {
      if (playing) return;
      var ln = e.target.closest('.cs-ln'), part = e.target.closest('[data-part]');
      if (ln) inspect(+ln.getAttribute('data-l'));
      else if (part) inspect(PART.indexOf(part.getAttribute('data-part')));
    });
    root.addEventListener('mouseleave', function () { if (!playing) inspect(-1); });
    var pre = root.querySelector('.cs-pre');
    pre.addEventListener('focusin', function (e) {
      if (!e.target.hasAttribute('data-edit')) return;
      setAuto(false); inspect(+e.target.closest('.cs-ln').getAttribute('data-l'));
      status('Editing', 'type, and the preview changes as you type');
    });
    pre.addEventListener('focusout', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-edit')) inspect(-1); });
    pre.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-edit')) applyEdit(e.target); });
    pre.addEventListener('keydown', function (e) {
      if (!e.target.hasAttribute('data-edit')) return;
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.target.blur(); }
      else if (e.target.textContent.length >= 40 && e.key.length === 1) e.preventDefault();
    });
    pre.addEventListener('paste', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-edit')) return;
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ').slice(0, 40);
      document.execCommand('insertText', false, t);
    });
    var view = root.querySelector('.cs-view');
    view.addEventListener('pointermove', tilt);
    view.addEventListener('pointerleave', untilt);
  }

  function setAuto(on) {
    auto = on;
    var b = root && box.querySelector('[data-cs="auto"]');
    if (b) { b.innerHTML = svg(on ? I.pause : I.play); b.setAttribute('aria-label', on ? 'Pause the tour of files' : 'Play the tour of files'); }
    if (!on) {
      clearTimeout(nextTimer);
      var bar = box.querySelector('.cs-tab[aria-selected="true"] b');
      if (bar && bar.getAnimations) bar.getAnimations().forEach(function (a) { a.cancel(); });
    }
  }

  function inspect(i) {
    var lns = root.querySelectorAll('.cs-ln'), chip = root.querySelector('.cs-chip'), view = root.querySelector('.cs-view');
    lns.forEach(function (l, j) { l.classList.toggle('hl', j === i); });
    root.querySelectorAll('[data-part]').forEach(function (p) { p.classList.remove('hl'); });
    if (i < 0 || i >= PART.length) { chip.classList.remove('on'); return; }
    var el = root.querySelector('[data-part="' + PART[i] + '"]');
    if (!el) return;
    el.classList.add('hl');
    var r = el.getBoundingClientRect(), v = view.getBoundingClientRect();
    chip.textContent = TAG[i];
    /* the tag sits in the free space left of the card, level with the part */
    var cw = chip.offsetWidth || 64, cardLeft = root.querySelector('.cs-card').getBoundingClientRect().left - v.left;
    chip.style.left = Math.max(6, cardLeft - cw - 10) + 'px';
    chip.style.top = Math.max(6, r.top - v.top + r.height / 2 - 9) + 'px';
    chip.classList.add('on');
  }

  function countUp(el, to, suffix) {
    if (reduce) { el.textContent = fmt(to) + suffix; return; }
    var s = performance.now(), d = 1100;
    (function f(t) {
      var k = Math.min(1, (t - s) / d), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(to * e)) + (k === 1 ? suffix : '');
      if (k < 1 && root.contains(el)) requestAnimationFrame(f);
    })(s);
  }

  function reveal(i, f) {
    var part = PART[i];
    if (i === 5) { root.querySelector('.cs-card').classList.add('glow'); return; }
    var el = root.querySelector('[data-part="' + part + '"]');
    if (!el) return;
    el.classList.remove('pending');
    if (part === 'stat') countUp(el.querySelector('.cs-stat-v'), f.value, f.suffix);
    if (!reduce) { inspect(i); later(function () { if (playing) inspect(-1); }, 650); }
  }

  function selectTab(i) {
    box.querySelectorAll('.cs-tab').forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
  }
  /* the old file leaves first: its lines slide away one after another and
     the card folds back, then the new file starts typing */
  function show(i) {
    var lns = root.querySelectorAll('.cs-ln');
    if (reduce || !lns.length || !Element.prototype.animate) return start(i);
    stop(); suggest(null); selectTab(i);
    playing = true;
    status('Opening ' + FILES[i].file + '…', '');
    lns.forEach(function (l, j) { l.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-14px)' }], { duration: 200, delay: j * 28, easing: 'ease-in', fill: 'forwards' }); });
    root.querySelectorAll('.cs-gut span').forEach(function (g, j) { g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: j * 28, fill: 'forwards' }); });
    var card = root.querySelector('.cs-card');
    card.animate([{ opacity: 1, transform: getComputedStyle(card).transform === 'none' ? 'none' : getComputedStyle(card).transform }, { opacity: 0, transform: 'translateY(8px) scale(.94)' }], { duration: 260, delay: 60, easing: 'ease-in', fill: 'forwards' });
    later(function () { card.getAnimations().forEach(function (a) { a.cancel(); }); start(i); }, 340);
  }

  function start(i) {
    stop();
    idx = i;
    var f = FILES[i], L = lines(f);
    box.style.setProperty('--acc', f.accent);
    root.style.setProperty('--acc', f.accent);
    box.querySelectorAll('.cs-tab').forEach(function (t, j) {
      t.setAttribute('aria-selected', String(j === i));
      t.tabIndex = j === i ? 0 : -1;
      var bar = t.querySelector('b');
      if (bar.getAnimations) bar.getAnimations().forEach(function (a) { a.cancel(); });
    });
    /* reset the preview for this file */
    var card = root.querySelector('.cs-card'), logo = root.querySelector('.cs-logo');
    card.classList.add('pending'); card.classList.remove('glow');
    root.querySelectorAll('.cs-p').forEach(function (p) { p.classList.add('pending'); });
    logo.src = f.logo; logo.classList.toggle('round', !!f.round);
    root.querySelector('.cs-title').textContent = f.title;
    root.querySelector('.cs-stat-v').textContent = '0';
    root.querySelector('.cs-stat-l').textContent = f.label;
    var btn = root.querySelector('.cs-btn'); btn.textContent = f.btn; btn.href = f.href;
    inspect(-1);
    var pre = root.querySelector('.cs-pre'), gut = root.querySelector('.cs-gut');
    pre.innerHTML = ''; gut.innerHTML = '';
    root.classList.remove('cs-editable');
    pre.classList.remove('cs-fade'); void pre.offsetWidth; pre.classList.add('cs-fade');
    status('Typing…', 'Ln 1, Col 1');
    playing = true; t0 = performance.now();

    if (reduce) {
      L.forEach(function (l, li) { var ln = addLine(pre, gut, li); ln.classList.remove('on'); l.forEach(function (p) { var e = tok(p); e.textContent = p[1]; ln.appendChild(e); }); });
      card.classList.remove('pending');
      for (var k = 0; k < 6; k++) reveal(k, f);
      return finish(f, L);
    }
    var li = 0, pi = 0, ci = 0, line = null, span = null, caret = document.createElement('span');
    caret.className = 'cs-caret';
    later(function () { card.classList.remove('pending'); }, 120);
    (function step() {
      if (li >= L.length) { caret.remove(); suggest(null); return finish(f, L); }
      if (!line) { line = addLine(pre, gut, li); }
      var p = L[li][pi];
      if (!span) { span = tok(p); line.appendChild(span); }
      span.textContent += p[1].charAt(ci++);
      line.appendChild(caret);
      /* IntelliSense: suggestions pop up while a component name is typed */
      if (p[0] === 'k' && pi === 1 && li < 5) suggest(span.textContent, p[1], caret); else suggest(null);
      status('Typing…', 'Ln ' + (li + 1) + ', Col ' + (line.textContent.length + 1));
      if (ci >= p[1].length) { ci = 0; pi++; span = null; }
      if (pi >= L[li].length) {
        line.classList.remove('on'); gut.children[li].classList.remove('on');
        reveal(li, f);
        li++; pi = 0; line = null;
        return later(step, 170);
      }
      later(step, p[0] === 't' ? 14 : 26);
    })();
  }

  /* the IntelliSense box under the cursor */
  function suggest(typed, word, caret) {
    var pop = root.querySelector('.cs-sug');
    if (typed === null || typed.length < 1 || typed === word) { if (pop) pop.classList.remove('on'); return; }
    if (!pop) { pop = document.createElement('div'); pop.className = 'cs-sug'; root.querySelector('.cs-code').appendChild(pop); }
    var list = COMPONENTS.filter(function (c) { return c.toLowerCase().indexOf(typed.toLowerCase()) === 0; });
    if (list.indexOf(word) < 0) list.unshift(word);
    pop.innerHTML = list.slice(0, 3).map(function (c) {
      return '<div class="' + (c === word ? 'sel' : '') + '"><i>◇</i><b>' + esc(c.slice(0, typed.length)) + '</b>' + esc(c.slice(typed.length)) + '<em>component</em></div>';
    }).join('');
    var r = caret.getBoundingClientRect(), box2 = root.querySelector('.cs-code').getBoundingClientRect();
    pop.style.left = Math.min(box2.width - 190, Math.max(8, r.left - box2.left - 8 * typed.length)) + 'px';
    pop.style.top = (r.bottom - box2.top + 4) + 'px';
    pop.classList.add('on');
  }

  /* after it is written: the yellow values can be edited and the preview follows */
  function editable() {
    root.classList.add('cs-editable');
    root.querySelectorAll('[data-edit]').forEach(function (e) {
      e.setAttribute('contenteditable', 'plaintext-only');
      if (e.contentEditable !== 'plaintext-only') e.setAttribute('contenteditable', 'true');
      e.setAttribute('spellcheck', 'false');
      e.setAttribute('role', 'textbox');
      e.setAttribute('aria-label', 'Edit ' + e.getAttribute('data-edit'));
    });
  }
  function applyEdit(e) {
    var what = e.getAttribute('data-edit'), v = e.textContent.replace(/\s+/g, ' ').slice(0, 40);
    if (what === 'title') root.querySelector('.cs-title').textContent = v || ' ';
    if (what === 'btn') root.querySelector('.cs-btn').textContent = v || ' ';
    if (what === 'glow') {
      var c = COLORS[v.trim().toLowerCase()];
      if (c) { root.style.setProperty('--acc', c); status('Edited', 'glow = ' + v.trim()); }
      else status('Unknown colour', 'try saffron, violet, cyan, green, pink or gold');
      return;
    }
    status('Edited', 'the preview follows your code');
  }

  /* the preview card leans toward the pointer, with a soft light on it */
  function tilt(e) {
    var view = root.querySelector('.cs-view'), card = root.querySelector('.cs-card');
    if (reduce || playing || card.classList.contains('pending')) return;
    var r = view.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
    card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    card.style.setProperty('--mx', ((x + .5) * 100).toFixed(1) + '%');
    card.style.setProperty('--my', ((y + .5) * 100).toFixed(1) + '%');
    card.classList.add('tilt');
  }
  function untilt() { var card = root.querySelector('.cs-card'); card.classList.remove('tilt'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); }

  function addLine(pre, gut, li) {
    var ln = document.createElement('span');
    ln.className = 'cs-ln on'; ln.setAttribute('data-l', li);
    pre.appendChild(ln);
    var g = document.createElement('span'); g.textContent = li + 1; g.className = 'on';
    gut.appendChild(g);
    return ln;
  }

  function status(a, c) {
    root.querySelector('.cs-st-a').textContent = a;
    root.querySelector('.cs-st-c').textContent = c;
  }

  function finish(f, L) {
    playing = false;
    var ms = Math.round(performance.now() - t0);
    status('Rendered', 'Ln ' + L.length + ' · 5 components · click a yellow value to edit');
    editable();
    next(5200);
  }

  /* the next file, shown by itself while the card is on screen and not hovered */
  function next(wait) {
    if (!auto) return;
    var tab = box.querySelectorAll('.cs-tab')[idx], bar = tab && tab.querySelector('b');
    if (bar && bar.animate && !reduce) bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: wait, easing: 'linear', fill: 'forwards' });
    clearTimeout(nextTimer);
    nextTimer = setTimeout(function () {
      if (!auto || playing) return;
      if (hover || !visible || document.hidden) return next(1500);
      show((idx + 1) % FILES.length);
    }, wait);
  }

  function on() {
    build();
    box.classList.add('cs-on');
    if (!playing) show(idx);
  }
  function off() {
    stop();
    box.classList.remove('cs-on');
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && wide.matches && !built) on();
    }, { rootMargin: '0px 0px -15% 0px' }).observe(box);
  } else visible = true;
  var sync = function () { if (wide.matches) { if (built || visible) on(); } else if (built) off(); };
  if (wide.addEventListener) wide.addEventListener('change', sync);
})();
