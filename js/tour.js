/* ============================================================
   60-SECOND TOUR — a guided, narrated walk through the site.
   Any element with [data-tour] starts it (hero pill, Ctrl+K, chat chip,
   /tour short link). Each stop scrolls into view, gets a spotlight, a
   caption, and is read aloud by the same voice as the chat's Read Aloud
   (/api/speak). Muted or if the voice fails, captions advance on a timer.
   Keys: → / Space next, ← back, Esc close.
   ============================================================ */
(function () {
  'use strict';
  if (window.shzTour) return;

  var SPEAK = 'https://sahnawaz-portfolio.vercel.app/api/speak';
  var STEPS = [
    { sel: '#heroStatsBar', title: 'Hi, I’m Sahnawaz',
      say: 'Hi, I’m Sahnawaz — a full-stack developer and UI designer from Assam. Everything on this site is hand-coded, with no templates. Let me show you around in about a minute.' },
    { sel: '#my-projects', title: 'Live products',
      say: 'These are my live products: YojanaSahay, a free government-scheme finder used across India, StudyLens AI for students, and this website. Open any case study and you can ask it questions.' },
    { sel: '#job-fit', title: 'Hiring? Check my fit',
      say: 'Hiring? Paste your job post here. An AI compares it with my real work and tells you honestly where I match, and where I don’t.' },
    { sel: '#how-i-ship', title: 'How I ship',
      say: 'This is how I ship. Every change goes through GitHub, is built automatically, and goes live in about a minute, with one-click rollback.' },
    { sel: '#recent-activity .ra-header', fallback: '#recent-activity', title: 'Live engineering telemetry',
      say: 'And this is live telemetry, pulled straight from GitHub: what I shipped recently, my commit streak, and how healthy my projects are.' },
    { sel: '#contact', title: 'Let’s talk',
      say: 'Ready to talk? Message me, WhatsApp me, or request a call. I personally read every message. Thanks for taking the tour!' }
  ];

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var muted = false;
  try { muted = localStorage.getItem('shz_tour_muted') === '1'; } catch (e) {}

  var ui = null, idx = -1, active = false, audio = null, timer = null, raf = 0, cache = {}, token = 0;

  function build() {
    if (ui) return ui;
    var root = document.createElement('div');
    root.className = 'tour-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Guided tour');
    root.innerHTML =
      '<div class="tour-spot" aria-hidden="true"></div>'
      + '<div class="tour-card">'
      +   '<div class="tour-top"><span class="tour-step"></span>'
      +     '<span class="tour-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
      +     '<button type="button" class="tour-ic tour-mute" aria-label="Mute voice"></button>'
      +     '<button type="button" class="tour-ic tour-close" aria-label="Close tour">×</button></div>'
      +   '<h3 class="tour-title"></h3>'
      +   '<p class="tour-text" aria-live="polite"></p>'
      +   '<div class="tour-bar"><span></span></div>'
      +   '<div class="tour-nav"><button type="button" class="tour-btn tour-prev">‹ Back</button>'
      +     '<span class="tour-dots"></span>'
      +     '<button type="button" class="tour-btn primary tour-next">Next ›</button></div>'
      + '</div>';
    document.body.appendChild(root);
    ui = {
      root: root, spot: root.querySelector('.tour-spot'), card: root.querySelector('.tour-card'),
      step: root.querySelector('.tour-step'), title: root.querySelector('.tour-title'), text: root.querySelector('.tour-text'),
      bar: root.querySelector('.tour-bar span'), dots: root.querySelector('.tour-dots'), wave: root.querySelector('.tour-wave'),
      prev: root.querySelector('.tour-prev'), next: root.querySelector('.tour-next'), mute: root.querySelector('.tour-mute'), close: root.querySelector('.tour-close')
    };
    STEPS.forEach(function (_, i) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'tour-dot'; d.setAttribute('aria-label', 'Go to stop ' + (i + 1));
      d.addEventListener('click', function () { show(i); }); ui.dots.appendChild(d);
    });
    ui.prev.addEventListener('click', function () { if (idx > 0) show(idx - 1); });
    ui.next.addEventListener('click', function () { idx < STEPS.length - 1 ? show(idx + 1) : stop(); });
    ui.close.addEventListener('click', stop);
    ui.mute.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem('shz_tour_muted', muted ? '1' : '0'); } catch (e) {}
      paintMute();
      if (muted) { stopAudio(); autoAdvance(STEPS[idx].say); } else { show(idx); }
    });
    paintMute();
    return ui;
  }
  function paintMute() {
    ui.mute.textContent = muted ? '🔇' : '🔊';
    ui.mute.setAttribute('aria-label', muted ? 'Turn voice on' : 'Mute voice');
  }

  function target(s) { return document.querySelector(s.sel) || (s.fallback && document.querySelector(s.fallback)); }

  /* keep the spotlight glued to the element while the page settles/scrolls */
  function track() {
    cancelAnimationFrame(raf);
    var loop = function () {
      if (!active) return;
      var el = target(STEPS[idx]);
      if (el) {
        var r = el.getBoundingClientRect(), pad = 10, vh = window.innerHeight, vw = window.innerWidth;
        var top = Math.max(8, r.top - pad), bottom = Math.min(vh - 8, r.bottom + pad);
        var left = Math.max(6, r.left - pad), right = Math.min(vw - 6, r.right + pad);
        if (bottom - top < 60) { top = Math.max(8, r.top - pad); bottom = top + 60; }
        var st = ui.spot.style;
        st.transform = 'translate(' + left + 'px,' + top + 'px)';
        st.width = Math.max(40, right - left) + 'px';
        st.height = Math.max(40, bottom - top) + 'px';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function land(el) {
    if (typeof window.shzLandOn === 'function') { try { window.shzLandOn(el); return; } catch (e) {} }
    var y = el.getBoundingClientRect().top + window.pageYOffset - Math.round(window.innerHeight * 0.18);
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  }

  function stopAudio() {
    clearTimeout(timer);
    if (audio) { try { audio.pause(); } catch (e) {} audio.onended = null; audio = null; }
    if (ui) ui.wave.classList.remove('on');
  }
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
  function next() { if (!active) return; idx < STEPS.length - 1 ? show(idx + 1) : finish(); }
  function finish() {
    ui.next.textContent = 'Done ✓';
    ui.text.textContent = STEPS[idx].say;
  }

  /* voice: one request at a time (the voice server allows one); the next
     stop is fetched while this one plays */
  function fetchVoice(i) {
    if (cache[i]) return cache[i];
    cache[i] = fetch(SPEAK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: STEPS[i].say }) })
      .then(function (r) { if (!r.ok) throw new Error('voice ' + r.status); return r.json(); })
      .then(function (d) { if (!d || !d.audio) throw new Error('no audio'); return 'data:audio/mpeg;base64,' + d.audio; })
      .catch(function (e) { delete cache[i]; throw e; });
    return cache[i];
  }
  function speak(i) {
    var my = ++token;
    if (muted) { autoAdvance(STEPS[i].say); return; }
    ui.wave.classList.add('on');
    fetchVoice(i).then(function (src) {
      if (my !== token || !active || muted) return;
      audio = new Audio(src);
      audio.onloadedmetadata = function () { if (isFinite(audio.duration)) progress(audio.duration * 1000); };
      audio.onended = function () { if (my === token) { ui.wave.classList.remove('on'); timer = setTimeout(next, 650); } };
      var p = audio.play();
      if (p && p.catch) p.catch(function () { if (my === token) { ui.wave.classList.remove('on'); autoAdvance(STEPS[i].say); } });
      if (i + 1 < STEPS.length) setTimeout(function () { fetchVoice(i + 1).catch(function () {}); }, 400);
    }).catch(function () {
      if (my !== token || !active) return;
      ui.wave.classList.remove('on');
      autoAdvance(STEPS[i].say);
    });
  }

  function show(i) {
    if (i < 0 || i >= STEPS.length) return;
    stopAudio();
    idx = i;
    var s = STEPS[i], el = target(s);
    ui.step.textContent = (i + 1) + ' / ' + STEPS.length;
    ui.title.textContent = s.title;
    ui.text.textContent = s.say;
    ui.prev.disabled = i === 0;
    ui.next.textContent = i === STEPS.length - 1 ? 'Finish' : 'Next ›';
    Array.prototype.forEach.call(ui.dots.children, function (d, k) { d.classList.toggle('on', k === i); d.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    ui.card.classList.remove('tour-in'); void ui.card.offsetWidth; ui.card.classList.add('tour-in');
    if (el) land(el);
    progress(0);
    speak(i);
    try { if (window.gtag) gtag('event', 'tour_step', { step: i + 1 }); } catch (e) {}
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); stop(); }
    else if (e.key === 'ArrowRight' || (e.key === ' ' && e.target === document.body)) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (idx > 0) show(idx - 1); }
  }

  function start() {
    if (active) return;
    build();
    if (typeof window.closeChat === 'function') { try { window.closeChat(); } catch (e) {} }
    if (typeof window.closeCaseStudy === 'function') { try { window.closeCaseStudy(); } catch (e) {} }
    active = true;
    document.documentElement.classList.add('tour-on');
    ui.root.classList.add('open');
    document.addEventListener('keydown', onKey, true);
    track();
    show(0);
    setTimeout(function () { try { ui.next.focus({ preventScroll: true }); } catch (e) {} }, 50);
    try { if (window.gtag) gtag('event', 'tour_start'); } catch (e) {}
  }
  function stop() {
    if (!active) return;
    active = false; token++;
    stopAudio();
    cancelAnimationFrame(raf);
    ui.root.classList.remove('open');
    document.documentElement.classList.remove('tour-on');
    document.removeEventListener('keydown', onKey, true);
    try { if (window.gtag) gtag('event', 'tour_end', { step: idx + 1 }); } catch (e) {}
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
