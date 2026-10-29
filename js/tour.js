/* ============================================================
   60-SECOND TOUR — a guided, narrated walk through the site.
   Any element with [data-tour] starts it (hero pill, Ctrl+K, chat chip,
   /tour short link). Each stop scrolls into view, gets a spotlight in its own
   colour, a caption, quick actions, and is read aloud from small pre-made
   clips (audio/tour/, made by .github/workflows/tour-voice.yml from these
   captions); the live voice (/api/speak) is a fallback. Muted or without
   sound, captions advance on a timer. The clips carry word timings (the
   gliding highlight) and a loudness track (the voice orb and the waveform).
   The last stop ends on a short "That's the tour" card.
   Keys: → / Space next, ← back, Esc close.
   ============================================================ */
(function () {
  'use strict';
  if (window.shzTour) return;

  var SPEAK = 'https://sahnawaz-portfolio.vercel.app/api/speak';
  var WA = 'https://wa.me/917339203154';
  var GH = 'https://github.com/SahnawazL';
  /* Narration made in advance (one small MP3 per stop, scripts/tour-voice):
     a clip is used only when its text matches the caption exactly; otherwise
     the live voice above, and failing that, captions on a timer. */
  var CLIPS = '/audio/tour/';
  var clipList = null;
  /* every network wait has a time limit, so the tour can never hang on one */
  function timed(ms, run) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    return new Promise(function (ok, no) {
      var t = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) {} no(new Error('timeout')); }, ms);
      run(ctl ? ctl.signal : undefined).then(function (v) { clearTimeout(t); ok(v); }, function (e) { clearTimeout(t); no(e); });
    });
  }
  function clips() {
    if (!clipList) clipList = timed(6000, function (sig) {
      return fetch(CLIPS + 'manifest.json', { cache: 'no-cache', signal: sig }).then(function (r) { return r.ok ? r.json() : null; });
    })
      .then(function (m) { return (m && m.clips) || []; })
      .catch(function () { clipList = null; return []; });
    return clipList;
  }
  function clipFor(i) {
    return clips().then(function (list) {
      for (var k = 0; k < list.length; k++) {
        var c = list[k];
        if (c.i === i && c.text === STEPS[i].say) {
          return { url: CLIPS + c.file, net: CLIPS + c.file, words: c.words || null, seconds: c.seconds || 0,
            env: typeof c.env === 'string' && c.env.length ? c.env : null, fps: c.fps || 25 };
        }
      }
      return null;
    });
  }

  /* acc: the stop's colour (spotlight, card tint, highlight, waveform)
     acts: quick actions; tapping one ends the tour and goes there */
  var STEPS = [
    { sel: '#heroStatsBar', title: 'Hi, I’m Sahnawaz', acc: [0, 255, 208],
      say: 'Hi, I’m Sahnawaz — a full-stack developer and UI designer from Assam. Everything on this site is hand-coded, with no templates. Let me show you around in about a minute.',
      acts: [{ id: 'cv', label: 'Get my CV', icon: 'doc', go: 'cv' }] },
    { sel: '#my-projects', title: 'Live products', acc: [56, 189, 248],
      say: 'These are my live products: YojanaSahay, a free government-scheme finder used across India, StudyLens AI for students, and this website. Just below, live numbers come straight from each one.',
      acts: [{ id: 'live', label: 'See live numbers', icon: 'chart', go: 'live' }] },
    { sel: '#job-fit', title: 'Hiring? Check my fit', acc: [251, 191, 36],
      say: 'Hiring? Paste your job post here. An AI compares it with my real work and tells you honestly where I match, and where I don’t.',
      acts: [{ id: 'jobfit', label: 'Try it with a job post', icon: 'pen', go: 'jobfit' }] },
    { sel: '#how-i-ship', title: 'How I ship', acc: [167, 139, 250],
      say: 'This is how I ship. Every change goes through GitHub, is built automatically, and goes live in about a minute, with one-click rollback.',
      acts: [{ id: 'code', label: 'See this site’s code', icon: 'code', href: GH + '/sahnawaz-portfolio' }] },
    { sel: '#recent-activity .ra-header', fallback: '#recent-activity', title: 'Live engineering telemetry', acc: [52, 211, 153],
      say: 'And this is live telemetry, pulled straight from GitHub: what I shipped recently, my commit streak, and how healthy my projects are.',
      acts: [{ id: 'github', label: 'Open my GitHub', icon: 'github', href: GH }] },
    { sel: '#contact', title: 'Let’s talk', acc: [244, 114, 182],
      say: 'Ready to talk? Message me, WhatsApp me, or request a call. I personally read every message. Thanks for taking the tour!',
      acts: [{ id: 'whatsapp', label: 'Message me on WhatsApp', icon: 'chat', href: WA }] }
  ];
  var FIN_ACC = [0, 255, 208];
  var FIN_ACTS = [
    { id: 'fin_hire', label: 'Hire me', icon: 'brief', go: 'contact', main: true },
    { id: 'fin_whatsapp', label: 'WhatsApp', icon: 'chat', href: WA },
    { id: 'fin_cv', label: 'Get my CV', icon: 'doc', go: 'cv' }
  ];
  var GO = { live: '#live-products', jobfit: '#job-fit', contact: '#contact' };
  var ICONS = {
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
  };
  function icon(n) {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
  }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var muted = false;
  try { muted = localStorage.getItem('shz_tour_muted') === '1'; } catch (e) {}

  var ui = null, idx = -1, active = false, fin = false, audio = null, timer = null, raf = 0, cache = {}, token = 0;
  var accNow = STEPS[0].acc.join(',');
  /* One audio element, unlocked inside the tap that starts the tour: phones
     (iOS Safari, Android Chrome) only allow sound that starts from a tap, so
     every later stop reuses this already-unlocked element. */
  var player = null, unlocked = false;
  var SILENT = 'data:audio/wav;base64,UklGRogAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWQAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  function unlock() {
    if (!player) { player = new Audio(); player.preload = 'auto'; player.setAttribute('playsinline', ''); }
    if (unlocked) return;
    try {
      player.src = SILENT; player.volume = 1;
      var p = player.play();
      if (p && p.then) p.then(function () { unlocked = true; }).catch(function () {});
      else unlocked = true;
    } catch (e) {}
  }

  function build() {
    if (ui) return ui;
    var root = document.createElement('div');
    root.className = 'tour-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Guided tour');
    root.innerHTML =
      '<div class="tour-spot" aria-hidden="true"></div>'
      + '<div class="tour-card">'
      +   '<div class="tour-top"><span class="tour-orb" aria-hidden="true"><i></i></span><span class="tour-step"></span>'
      +     '<span class="tour-voice-tag" aria-hidden="true">AI narrator</span>'
      +     '<button type="button" class="tour-ic tour-mute" aria-label="Mute voice"></button>'
      +     '<button type="button" class="tour-ic tour-close" aria-label="Close tour">×</button></div>'
      +   '<div class="tour-body"><h3 class="tour-title"></h3>'
      +   '<p class="tour-text" aria-live="polite"></p>'
      +   '<p class="tour-voice" hidden></p>'
      +   '<div class="tour-acts"></div></div>'
      +   '<div class="tour-meter"><div class="tour-bar"><span></span></div><canvas class="tour-scope" aria-hidden="true"></canvas></div>'
      +   '<div class="tour-nav"><button type="button" class="tour-btn tour-prev">‹ Back</button>'
      +     '<span class="tour-dots"></span>'
      +     '<button type="button" class="tour-btn primary tour-next">Next ›</button></div>'
      +   '<div class="tour-fin" hidden>'
      +     '<div class="tour-fin-mark" aria-hidden="true"><svg viewBox="0 0 48 48" width="44" height="44"><circle cx="24" cy="24" r="20"/><path d="m15.5 24.5 5.8 5.8 11.2-12.3"/></svg></div>'
      +     '<h3 class="tour-fin-title">That’s the tour</h3>'
      +     '<p class="tour-fin-text">Live products people use every day, an honest job-fit check, releases in about a minute, and live telemetry from GitHub. All of it <span style="white-space:nowrap">hand-coded</span> by me.</p>'
      +     '<div class="tour-fin-acts"></div>'
      +     '<div class="tour-fin-foot"><button type="button" class="tour-link tour-replay">' + icon('replay') + '<span>Replay tour</span></button>'
      +       '<button type="button" class="tour-link tour-done">Close</button></div>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(root);
    ui = {
      root: root, spot: root.querySelector('.tour-spot'), card: root.querySelector('.tour-card'),
      step: root.querySelector('.tour-step'), title: root.querySelector('.tour-title'), text: root.querySelector('.tour-text'),
      bar: root.querySelector('.tour-bar span'), dots: root.querySelector('.tour-dots'), orb: root.querySelector('.tour-orb'),
      scope: root.querySelector('.tour-scope'), acts: root.querySelector('.tour-acts'),
      voice: root.querySelector('.tour-voice'), body: root.querySelector('.tour-body'),
      prev: root.querySelector('.tour-prev'), next: root.querySelector('.tour-next'), mute: root.querySelector('.tour-mute'), close: root.querySelector('.tour-close'),
      fin: root.querySelector('.tour-fin'), finActs: root.querySelector('.tour-fin-acts')
    };
    STEPS.forEach(function (_, i) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'tour-dot'; d.setAttribute('aria-label', 'Go to stop ' + (i + 1));
      d.addEventListener('click', function () { show(i); }); ui.dots.appendChild(d);
    });
    renderActs(ui.finActs, FIN_ACTS);
    ui.prev.addEventListener('click', function () { if (idx > 0) show(idx - 1); });
    ui.next.addEventListener('click', function () { idx < STEPS.length - 1 ? show(idx + 1) : finish(); });
    ui.close.addEventListener('click', stop);
    root.querySelector('.tour-done').addEventListener('click', stop);
    root.querySelector('.tour-replay').addEventListener('click', function () {
      if (!muted) unlock();
      try { if (window.gtag) gtag('event', 'tour_replay'); } catch (e) {}
      show(0);
    });
    ui.spot.addEventListener('animationend', function () { ui.spot.classList.remove('sweep'); });
    ui.mute.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem('shz_tour_muted', muted ? '1' : '0'); } catch (e) {}
      paintMute();
      if (fin) return;
      if (muted) { stopAudio(); ui.card.classList.remove('has-env'); voiceNote(''); autoAdvance(STEPS[idx].say); } else { unlock(); show(idx); }
    });
    window.addEventListener('resize', function () { if (active && !fin && hlAt >= 0) pill(hlAt, true); });
    paintMute();
    return ui;
  }
  function paintMute() {
    ui.mute.innerHTML = muted
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    ui.mute.setAttribute('aria-label', muted ? 'Turn voice on' : 'Mute voice');
  }

  /* the stop's colour: three numbers the stylesheet blends smoothly */
  function setAccent(rgb) {
    accNow = rgb.join(',');
    var st = ui.root.style;
    st.setProperty('--ar', rgb[0]); st.setProperty('--ag', rgb[1]); st.setProperty('--ab', rgb[2]);
  }
  function sweep() {
    if (reduce) return;
    ui.spot.classList.remove('sweep');
    void ui.spot.offsetWidth;
    ui.spot.classList.add('sweep');
  }

  /* Quick actions: each one ends the tour, then goes where it says. */
  function renderActs(box, list) {
    box.textContent = '';
    (list || []).forEach(function (a) {
      var el = document.createElement(a.href ? 'a' : 'button');
      el.className = 'tour-act' + (a.main ? ' main' : '');
      if (a.href) { el.href = a.href; el.target = '_blank'; el.rel = 'noopener'; } else el.type = 'button';
      el.innerHTML = icon(a.icon) + '<span>' + a.label + '</span>';
      el.addEventListener('click', function (e) { act(a, e); });
      box.appendChild(el);
    });
  }
  function act(a, e) {
    try { if (window.gtag) gtag('event', 'tour_action', { action: a.id }); } catch (x) {}
    if (!a.href && e) e.preventDefault();
    stop();
    if (a.href) return;                                // the link opens in a new tab by itself
    var go = a.go;
    if (go === 'cv') {
      if (typeof window.openResumeEmailModal === 'function') { try { window.openResumeEmailModal(); return; } catch (x) {} }
      go = 'contact';
    }
    var el = document.querySelector(GO[go]);
    if (!el) return;
    if (go === 'jobfit') {
      var box = document.getElementById('jfText');
      if (box) { try { box.focus({ preventScroll: true }); } catch (x) {} }
    }
    window.scrollTo({ top: Math.max(0, docTop(el) - headerH() - 14), behavior: reduce ? 'auto' : 'smooth' });
  }

  function target(s) { return document.querySelector(s.sel) || (s.fallback && document.querySelector(s.fallback)); }

  /* keep the spotlight glued to the element while the page settles/scrolls */
  function track() {
    cancelAnimationFrame(raf);
    var loop = function () {
      if (!active) return;
      if (fin) { ui.spot.classList.add('away'); raf = requestAnimationFrame(loop); return; }
      var el = target(STEPS[idx]);
      if (el) {
        var r = el.getBoundingClientRect(), pad = 10, vh = window.innerHeight, vw = window.innerWidth;
        var top = Math.max(8, r.top - pad), bottom = Math.min(vh - 8, r.bottom + pad);
        var left = Math.max(6, r.left - pad), right = Math.min(vw - 6, r.right + pad);
        var visible = bottom - top > 30 && r.bottom > 0 && r.top < vh;
        ui.spot.classList.toggle('away', !visible);       // off-screen mid-scroll: just dim
        if (!visible) { top = vh * 0.3; bottom = top + 60; }
        var st = ui.spot.style;
        st.transform = 'translate(' + left + 'px,' + top + 'px)';
        st.width = Math.max(40, right - left) + 'px';
        st.height = Math.max(40, bottom - top) + 'px';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  /* Scroll to the stop and call done() once the page has really stopped.
     Own scroller (not the site's section lander) so a quick Next/Back can
     cancel the previous scroll cleanly; re-aims up to twice if sections
     above finish rendering and shift the page. */
  function headerH() {
    var h = document.querySelector('header'); if (!h) return 0;
    var pos = getComputedStyle(h).position;
    return (pos === 'fixed' || pos === 'sticky') ? h.getBoundingClientRect().height : 0;
  }
  function docTop(el) { var y = 0; for (var n = el; n; n = n.offsetParent) y += n.offsetTop; return y; }
  function land(el, done, my) {
    var fired = false, fin = function () { if (fired) return; fired = true; clearTimeout(safety); if (my === token) done && done(); };
    var safety = setTimeout(fin, 2200);
    var aim = function () {
      var room = window.innerHeight - headerH();
      var top = docTop(el) - headerH() - 14;
      var h = el.offsetHeight;
      /* short sections: centre them a little in the space above the caption card */
      if (h < room * 0.55) top -= Math.round((room * 0.55 - h) / 3);
      return Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
    };
    var target = aim();
    if (Math.abs(window.pageYOffset - target) < 24) { fin(); return; }
    var root = document.documentElement, prevAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    var last = -1, still = 0, fixes = 0;
    (function watch() {
      if (fired || my !== token) { root.style.overflowAnchor = prevAnchor; return; }
      var y = Math.round(window.pageYOffset);
      still = y === last ? still + 1 : 0; last = y;
      if (still >= 5) {
        var t2 = aim();
        if (Math.abs(y - t2) > 24 && fixes < 2) { fixes++; still = 0; window.scrollTo({ top: t2, behavior: reduce ? 'auto' : 'smooth' }); }
        else { root.style.overflowAnchor = prevAnchor; fin(); return; }
      }
      requestAnimationFrame(watch);
    })();
  }

  /* Caption as words, so each one can light up the moment it is spoken
     (times come with the clip: audio/tour/manifest.json → words). A soft
     pill (with a slower glow trailing it) glides from word to word. */
  var words = [], syncRaf = 0, hl = null, hlTrail = null, hlAt = -1, hlTop = null;
  function renderWords(text) {
    ui.text.textContent = '';
    ui.text.classList.remove('live');
    hlTrail = document.createElement('span'); hlTrail.className = 'tour-hl trail'; hlTrail.setAttribute('aria-hidden', 'true');
    hl = document.createElement('span'); hl.className = 'tour-hl'; hl.setAttribute('aria-hidden', 'true');
    ui.text.appendChild(hlTrail); ui.text.appendChild(hl);
    hlAt = -1; hlTop = null;
    var list = text.split(' ');
    words = list.map(function (w, k) {
      var sp = document.createElement('span');
      sp.className = 'tw'; sp.textContent = w;
      ui.text.appendChild(sp);
      if (k < list.length - 1) ui.text.appendChild(document.createTextNode(' '));
      return sp;
    });
  }
  function pill(k, snap) {
    if (!hl) return;
    if (k < 0 || !words[k]) { hl.classList.remove('on'); hlTrail.classList.remove('on'); hlAt = -1; hlTop = null; return; }
    var w = words[k];
    var x = w.offsetLeft - 4, y = w.offsetTop - 1, ww = w.offsetWidth + 8, hh = w.offsetHeight + 2;
    var jump = snap || hlTop === null || Math.abs(y - hlTop) > 2;   // first word or a new line: no diagonal glide
    [hl, hlTrail].forEach(function (p) {
      if (jump) p.classList.add('jump');
      p.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      p.style.width = ww + 'px'; p.style.height = hh + 'px';
      p.classList.add('on');
    });
    if (jump) { void hl.offsetWidth; hl.classList.remove('jump'); hlTrail.classList.remove('jump'); }
    hlAt = k; hlTop = y;
  }
  function markAll() { pill(-1); words.forEach(function (w) { w.classList.remove('now'); w.classList.add('said'); }); }

  /* the voice orb: loudness at this moment, eased so it swells and settles */
  var amp = 0;
  function setAmp(v, hard) {
    if (reduce) v = v > 0 ? 0.45 : 0;
    amp = hard ? v : amp + (v - amp) * (v > amp ? 0.5 : 0.16);
    if (amp < 0.004) amp = 0;
    ui.orb.style.setProperty('--amp', amp.toFixed(3));
  }
  function digit(env, i) { var c = env.charCodeAt(i) - 48; return c >= 0 && c <= 9 ? c : 0; }
  function loud(env, fps, t) {
    var f = Math.max(0, t * fps), i0 = Math.floor(f), a = digit(env, i0), b = i0 + 1 < env.length ? digit(env, i0 + 1) : a;
    return (a + (b - a) * (f - i0)) / 9;
  }

  /* the waveform: the whole clip as bars, lit up to where the voice is */
  var scope = { env: null, w: 0, bars: null };
  function clearScope() {
    var c = ui.scope, g = c.getContext && c.getContext('2d');
    if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); }
    scope.env = null;
  }
  function drawScope(env, fps, t, d) {
    var c = ui.scope, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h || !c.getContext) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    if (scope.env !== env || scope.w !== w) {
      var n = Math.max(24, Math.min(140, Math.floor(w / 4))), bars = [];
      for (var k = 0; k < n; k++) {
        var from = Math.floor(k * env.length / n), to = Math.max(from + 1, Math.floor((k + 1) * env.length / n)), m = 0;
        for (var j = from; j < to && j < env.length; j++) m = Math.max(m, digit(env, j));
        bars.push(m / 9);
      }
      scope.env = env; scope.w = w; scope.bars = bars;
    }
    var total = isFinite(d) && d > 0 ? d : env.length / fps;
    var p = Math.min(1, Math.max(0, t / total));
    var g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    var B = scope.bars, N = B.length, stepW = w / N, bw = Math.max(1.5, stepW * 0.56), round = typeof g.roundRect === 'function';
    for (var pass = 0; pass < 2; pass++) {
      g.beginPath();
      for (var q = 0; q < N; q++) {
        var played = (q + 0.5) / N <= p;
        if (played !== (pass === 1)) continue;
        var bh = Math.max(2, B[q] * (h - 2)), x = q * stepW + (stepW - bw) / 2, y = (h - bh) / 2;
        if (round) g.roundRect(x, y, bw, bh, bw / 2); else g.rect(x, y, bw, bh);
      }
      g.fillStyle = pass === 1 ? 'rgba(' + accNow + ',.95)' : 'rgba(200,225,240,.17)';
      g.fill();
    }
  }

  /* The clip now playing, and a watchdog on it: if the sound stops moving
     (a stalled download, the phone pausing it, a decoding error) it is
     nudged to play again, then reloaded straight from the server; if it
     still won't move, the stop carries on silently on a clock, so the words,
     waveform and next stop keep exactly the same timing. Never stuck. */
  var run = null;
  function guessSeconds(text) { return Math.max(4.5, text.split(/\s+/).length * 0.36); }
  function revive(r, t) {
    r.tries++; r.tryAt = performance.now();
    var a = r.a;
    try {
      if (r.tries >= 2 && r.clip.net && a.src !== r.clip.net) a.src = r.clip.net + '#t=' + Math.max(0, t).toFixed(2);
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function toClock(r, t) {
    if (r.clock) return;
    try { r.a.pause(); } catch (e) {}
    if (!r.total) r.total = isFinite(r.a.duration) && r.a.duration > 0 ? r.a.duration : guessSeconds(STEPS[idx].say);
    r.clock = { t0: Math.min(Math.max(0, t), r.total), c0: performance.now() };
    ui.orb.classList.remove('on');
    voiceNote('The voice paused here, so the captions carry on.');
  }
  function rescue(r) {
    if (!r || r !== run || r.clock) return;
    var t = r.lastT > 0 ? r.lastT : 0;
    if (r.tries < 2 && r.clip.net) { r.tries = 1; revive(r, t); } else toClock(r, t);
  }
  function follow(clip, my, end) {
    cancelAnimationFrame(syncRaf);
    run = null;
    if (!clip || !ui || !audio) { if (ui) { ui.text.classList.remove('live'); pill(-1); setAmp(0, true); } return; }
    var times = clip.words;
    if (!times || times.length !== words.length || reduce) { ui.text.classList.remove('live'); times = null; }
    else ui.text.classList.add('live');
    var env = clip.env, fps = clip.fps || 25;
    var at = -1;
    var r = run = { clip: clip, a: audio, end: end, clock: null, lastT: -1, lastMove: performance.now(), tries: 0, tryAt: 0, total: clip.seconds || 0 };
    words.forEach(function (w) { w.classList.remove('now', 'said'); });
    pill(-1);
    ui.bar.style.transition = 'none';
    (function tick() {
      if (my !== token || run !== r) return;
      var a = r.a, t, d, ms = performance.now();
      if (r.clock) {
        t = r.clock.t0 + (ms - r.clock.c0) / 1000; d = r.total;
        if (t >= d) { r.end(); return; }
      } else {
        if (audio !== a) return;
        if (a.ended) { r.end(); return; }
        t = a.currentTime || 0; d = a.duration;
        if (t > r.lastT + 0.005) { r.lastT = t; r.lastMove = ms; r.tries = 0; }
        else if (!document.hidden && ms - r.lastMove > 2000) {
          if (r.tries < 2 && (r.tries === 0 || ms - r.tryAt > 2000)) revive(r, t);
          else if (ms - r.tryAt > 2000) toClock(r, t);
        }
      }
      if (isFinite(d) && d > 0) ui.bar.style.width = Math.min(100, (t / d) * 100) + '%';
      if (times) {
        var cur = -1;
        for (var k = 0; k < times.length; k++) { if (times[k][0] <= t + 0.04) cur = k; else break; }
        if (cur !== at) {
          for (var j = 0; j < words.length; j++) {
            words[j].classList.toggle('said', j < cur);
            words[j].classList.toggle('now', j === cur);
          }
          pill(cur);
          at = cur;
        }
      }
      /* loudness from the clip; the live voice has none, so a gentle stand-in */
      var v = r.clock || a.paused ? 0 : env ? loud(env, fps, t) : 0.32 + 0.28 * Math.abs(Math.sin(t * 8.3) * Math.sin(t * 2.9 + 1.2));
      setAmp(v);
      if (env) drawScope(env, fps, t, d);
      syncRaf = requestAnimationFrame(tick);
    })();
  }

  function voiceNote(t) { if (!ui) return; ui.voice.textContent = t || ''; ui.voice.hidden = !t; }
  function stopAudio() {
    clearTimeout(timer);
    follow(null);
    if (audio) { try { audio.pause(); } catch (e) {} audio.onended = null; audio.onerror = null; audio.onloadedmetadata = null; audio = null; }
    if (ui) ui.orb.classList.remove('on');
  }
  function resetBar() { ui.bar.style.transition = 'none'; ui.bar.style.width = '0%'; }
  function progress(ms) {
    ui.bar.style.transition = 'none'; ui.bar.style.width = '0%';
    void ui.bar.offsetWidth;
    ui.bar.style.transition = 'width ' + ms + 'ms linear'; ui.bar.style.width = '100%';
  }
  function autoAdvance(text) {
    clearTimeout(timer);
    var ms = Math.max(4500, Math.min(11000, text.split(/\s+/).length * 330));
    progress(ms);
    timer = setTimeout(next, ms);
  }
  function next() { if (!active || fin) return; idx < STEPS.length - 1 ? show(idx + 1) : finish(); }

  /* the closing card: a short summary and the three things people want next */
  function finish() {
    if (!active || !ui || fin) return;
    token++;
    stopAudio();
    resetBar();
    voiceNote('');
    fin = true;
    setAccent(FIN_ACC);
    ui.step.textContent = 'Tour complete';
    ui.card.classList.remove('has-env');
    ui.card.classList.add('fin');
    ui.root.classList.add('fin');
    ui.fin.hidden = false;
    ui.fin.classList.remove('play');
    void ui.fin.offsetWidth;
    ui.fin.classList.add('play');
    setTimeout(function () { try { var b = ui.finActs.querySelector('.tour-act.main'); if (b && fin) b.focus({ preventScroll: true }); } catch (e) {} }, 60);
    try { if (window.gtag) gtag('event', 'tour_complete'); } catch (e) {}
  }
  function leaveFin() {
    if (!fin) return false;
    fin = false;
    ui.card.classList.remove('fin');
    ui.root.classList.remove('fin');
    ui.fin.hidden = true;
    ui.fin.classList.remove('play');
    return true;
  }

  /* voice: one request at a time (the voice server allows one); the next
     stop is fetched while this one plays */
  function fetchVoice(i) {
    if (cache[i]) return cache[i];
    var attempt = function (n) {
      return timed(12000, function (sig) { return fetch(SPEAK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: STEPS[i].say }), signal: sig }); })
        .then(function (r) {
          /* the voice server makes one clip at a time: wait and retry when busy */
          if (r.status === 429 && n < 4) return new Promise(function (ok) { setTimeout(ok, 900); }).then(function () { return attempt(n + 1); });
          if (!r.ok) throw new Error('voice ' + r.status);
          return r.json().then(function (d) {
            if (!d || !d.audio) throw new Error('no audio');
            var bin = atob(d.audio), bytes = new Uint8Array(bin.length);
            for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
            return { url: URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })), words: null, env: null, fps: 25 };
          });
        });
    };
    cache[i] = clipFor(i)
      .then(function (clip) {
        if (!clip) return attempt(0);
        /* the whole clip (about 50 KB) is downloaded before it plays, so it
           starts at once and can't stall halfway on a slow connection;
           if that download fails it simply streams from the server */
        return timed(6000, function (sig) {
          return fetch(clip.net, { signal: sig }).then(function (r) { if (!r.ok) throw new Error('clip ' + r.status); return r.blob(); });
        }).then(function (b) {
          if (!b || !b.size) throw new Error('empty clip');
          clip.url = URL.createObjectURL(/^audio\//.test(b.type) ? b : new Blob([b], { type: 'audio/mpeg' }));
          return clip;
        }).catch(function () { clip.url = clip.net; return clip; });
      })
      .catch(function (e) { delete cache[i]; throw e; });
    return cache[i];
  }
  function speak(i, my) {
    if (my !== token) return;
    if (muted) { ui.card.classList.remove('has-env'); autoAdvance(STEPS[i].say); return; }
    ui.orb.classList.add('on');
    voiceNote('Loading voice…');
    var settled = false;
    var captionsOnly = function () {
      if (settled || my !== token || !active) return;
      settled = true;
      ui.orb.classList.remove('on');
      ui.card.classList.remove('has-env');
      voiceNote('Voice unavailable right now — showing captions.');
      autoAdvance(STEPS[i].say);
    };
    var guard = setTimeout(captionsOnly, 14000);      // the voice never keeps the tour waiting
    fetchVoice(i).then(function (clip) {
      if (settled) return;
      settled = true; clearTimeout(guard);
      if (my !== token || !active || muted) return;
      if (!player) unlock();
      audio = player;
      audio.onloadedmetadata = null;
      ui.card.classList.toggle('has-env', !!clip.env);
      var done = false;
      var end = function () {
        if (done || my !== token) return;
        done = true;
        ui.orb.classList.remove('on');
        follow(null); markAll();
        if (clip.env) drawScope(clip.env, clip.fps || 25, 1, 1);
        timer = setTimeout(next, 700);
      };
      audio.onended = end;
      audio.onerror = function () { if (my === token) rescue(run); };
      audio.src = clip.url;
      follow(clip, my, end);
      var p = audio.play();
      voiceNote('');
      if (p && p.catch) p.catch(function (err) {
        if (my !== token || done) return;
        if (err && err.name === 'AbortError') return;   // a newer play() took over; the watchdog keeps an eye on it
        if (err && err.name === 'NotAllowedError') {
          /* the browser blocked sound: say how to turn it on, keep the captions moving */
          ui.orb.classList.remove('on');
          ui.card.classList.remove('has-env');
          follow(null);
          voiceNote('Your browser blocked the sound — tap the speaker button to hear the voice.');
          muted = true; paintMute();
          autoAdvance(STEPS[i].say);
          return;
        }
        rescue(run);                                     // try again from the server, else carry on silently
      });
      if (i + 1 < STEPS.length) setTimeout(function () { fetchVoice(i + 1).catch(function () {}); }, 400);
    }).catch(function () { clearTimeout(guard); captionsOnly(); });
  }
  /* back from another app or tab: pick the voice up where it stopped */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden || !active || !run || run.clock || !audio || !audio.paused || audio.ended) return;
    run.lastMove = performance.now();
    try { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  });

  /* Changing stop: the controls update at once; the caption fades out while
     the page scrolls, and the new caption fades in — and the voice starts —
     only when the page has arrived, so words, spotlight and scroll match. */
  function show(i) {
    if (i < 0 || i >= STEPS.length) return;
    var my = ++token;
    stopAudio();
    resetBar();
    clearScope();
    voiceNote('');
    var first = leaveFin() || idx < 0;
    idx = i;
    var s = STEPS[i], el = target(s);
    setAccent(s.acc);
    ui.step.textContent = (i + 1) + ' / ' + STEPS.length;
    ui.prev.disabled = i === 0;
    ui.next.textContent = i === STEPS.length - 1 ? 'Finish' : 'Next ›';
    Array.prototype.forEach.call(ui.dots.children, function (d, k) { d.classList.toggle('on', k === i); d.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    if (!muted) fetchVoice(i).catch(function () {});   // fetch the voice while the page scrolls
    if (first) { ui.title.textContent = s.title; renderWords(s.say); renderActs(ui.acts, s.acts); }
    var swapped = false, landed = false, faded = reduce || first;
    var reveal = function () {
      if (my !== token || !active || swapped || !landed || !faded) return;
      swapped = true;
      ui.title.textContent = s.title;
      renderWords(s.say);
      renderActs(ui.acts, s.acts);
      ui.body.classList.remove('out');
      ui.body.classList.add('in');
      setTimeout(function () { ui.body.classList.remove('in'); }, 420);
      sweep();
      speak(i, my);
    };
    if (!faded) {
      ui.body.classList.add('out');
      setTimeout(function () { faded = true; reveal(); }, 200);
    }
    if (el) land(el, function () { landed = true; reveal(); }, my);
    else { landed = true; reveal(); }
    try { if (window.gtag) gtag('event', 'tour_step', { step: i + 1 }); } catch (e) {}
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); stop(); }
    else if (e.key === 'ArrowRight' || (e.key === ' ' && e.target === document.body)) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (fin) show(idx); else if (idx > 0) show(idx - 1); }
  }

  function start() {
    if (active) return;
    build();
    if (!muted) unlock();   // must run inside the tap
    clips();                 // fetch the narration list now, so the first stop speaks at once
    if (typeof window.closeChat === 'function') { try { window.closeChat(); } catch (e) {} }
    if (typeof window.closeCaseStudy === 'function') { try { window.closeCaseStudy(); } catch (e) {} }
    active = true;
    leaveFin();
    document.documentElement.classList.add('tour-on');
    ui.root.classList.add('open');
    document.addEventListener('keydown', onKey, true);
    track();
    idx = -1;
    show(0);
    setTimeout(function () { try { ui.next.focus({ preventScroll: true }); } catch (e) {} }, 50);
    try { if (window.gtag) gtag('event', 'tour_start'); } catch (e) {}
  }
  function stop() {
    if (!active) return;
    active = false; token++;
    stopAudio();
    Object.keys(cache).forEach(function (k) { cache[k].then(function (c) { try { if (c && /^blob:/.test(c.url)) URL.revokeObjectURL(c.url); } catch (e) {} }, function () {}); });
    cache = {};
    cancelAnimationFrame(raf);
    ui.root.classList.remove('open');
    document.documentElement.classList.remove('tour-on');
    document.removeEventListener('keydown', onKey, true);
    try { if (window.gtag) gtag('event', 'tour_end', { step: fin ? 'complete' : idx + 1 }); } catch (e) {}
  }

  window.shzTour = { start: start, stop: stop };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-tour]');
    if (!t) return;
    e.preventDefault();
    start();
  });
  /* ?tour opens the site straight into the tour */
  try {
    var p = new URLSearchParams(location.search);
    if (p.has('tour')) {
      p.delete('tour'); var q = p.toString();
      history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash);
      var go = function () { setTimeout(start, 700); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    }
  } catch (e) {}
})();
