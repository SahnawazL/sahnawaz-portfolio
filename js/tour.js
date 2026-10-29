/* ============================================================
   60-SECOND TOUR — a guided, narrated walk through the site.
   Any element with [data-tour] starts it (hero pill, Ctrl+K, chat chip,
   /tour short link). Each stop scrolls into view, gets a spotlight, a
   caption, and is read aloud from small pre-made clips (audio/tour/, made by
   .github/workflows/tour-voice.yml from these captions); the live voice
   (/api/speak) is a fallback. Muted or without sound, captions advance on a timer.
   Keys: → / Space next, ← back, Esc close.
   ============================================================ */
(function () {
  'use strict';
  if (window.shzTour) return;

  var SPEAK = 'https://sahnawaz-portfolio.vercel.app/api/speak';
  /* Narration made in advance (one small MP3 per stop, scripts/tour-voice):
     a clip is used only when its text matches the caption exactly; otherwise
     the live voice above, and failing that, captions on a timer. */
  var CLIPS = '/audio/tour/';
  var clipList = null;
  function clips() {
    if (!clipList) clipList = fetch(CLIPS + 'manifest.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { return (m && m.clips) || []; })
      .catch(function () { clipList = null; return []; });
    return clipList;
  }
  function clipFor(i) {
    return clips().then(function (list) {
      for (var k = 0; k < list.length; k++) if (list[k].i === i && list[k].text === STEPS[i].say) return { url: CLIPS + list[k].file, words: list[k].words || null };
      return null;
    });
  }
  var STEPS = [
    { sel: '#heroStatsBar', title: 'Hi, I’m Sahnawaz',
      say: 'Hi, I’m Sahnawaz — a full-stack developer and UI designer from Assam. Everything on this site is hand-coded, with no templates. Let me show you around in about a minute.' },
    { sel: '#my-projects', title: 'Live products',
      say: 'These are my live products: YojanaSahay, a free government-scheme finder used across India, StudyLens AI for students, and this website. Just below, live numbers come straight from each one.' },
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
      +   '<div class="tour-top"><span class="tour-step"></span>'
      +     '<span class="tour-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>'
      +     '<span class="tour-voice-tag" aria-hidden="true">AI narrator</span>'
      +     '<button type="button" class="tour-ic tour-mute" aria-label="Mute voice"></button>'
      +     '<button type="button" class="tour-ic tour-close" aria-label="Close tour">×</button></div>'
      +   '<div class="tour-body"><h3 class="tour-title"></h3>'
      +   '<p class="tour-text" aria-live="polite"></p>'
      +   '<p class="tour-voice" hidden></p></div>'
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
      voice: root.querySelector('.tour-voice'), body: root.querySelector('.tour-body'),
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
      if (muted) { stopAudio(); voiceNote(''); autoAdvance(STEPS[idx].say); } else { unlock(); show(idx); }
    });
    paintMute();
    return ui;
  }
  function paintMute() {
    ui.mute.innerHTML = muted
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
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
     (times come with the clip: audio/tour/manifest.json → words). */
  var words = [], syncRaf = 0;
  function renderWords(text) {
    ui.text.textContent = '';
    ui.text.classList.remove('live');
    words = text.split(' ').map(function (w, k) {
      var sp = document.createElement('span');
      sp.className = 'tw'; sp.textContent = w;
      ui.text.appendChild(sp);
      if (k < text.split(' ').length - 1) ui.text.appendChild(document.createTextNode(' '));
      return sp;
    });
  }
  function markAll() { words.forEach(function (w) { w.classList.remove('now'); w.classList.add('said'); }); }
  function follow(times, my) {
    cancelAnimationFrame(syncRaf);
    if (!times || !ui || !audio) { if (ui) ui.text.classList.remove('live'); return; }
    if (times.length !== words.length || reduce) { ui.text.classList.remove('live'); times = null; }
    else ui.text.classList.add('live');
    var a = audio, at = -1;
    words.forEach(function (w) { w.classList.remove('now', 'said'); });
    ui.bar.style.transition = 'none';
    (function tick() {
      if (my !== token || audio !== a) return;
      var t = a.currentTime || 0, d = a.duration;
      if (isFinite(d) && d > 0) ui.bar.style.width = Math.min(100, (t / d) * 100) + '%';
      if (times) {
        var cur = -1;
        for (var k = 0; k < times.length; k++) { if (times[k][0] <= t + 0.04) cur = k; else break; }
        if (cur !== at) {
          for (var j = 0; j < words.length; j++) {
            words[j].classList.toggle('said', j < cur);
            words[j].classList.toggle('now', j === cur);
          }
          at = cur;
        }
      }
      syncRaf = requestAnimationFrame(tick);
    })();
  }

  function voiceNote(t) { if (!ui) return; ui.voice.textContent = t || ''; ui.voice.hidden = !t; }
  function stopAudio() {
    clearTimeout(timer);
    follow(null);
    if (audio) { try { audio.pause(); } catch (e) {} audio.onended = null; audio.onloadedmetadata = null; audio = null; }
    if (ui) ui.wave.classList.remove('on');
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
  function next() { if (!active) return; idx < STEPS.length - 1 ? show(idx + 1) : finish(); }
  function finish() {
    ui.next.textContent = 'Done ✓';
    ui.text.textContent = STEPS[idx].say;
  }

  /* voice: one request at a time (the voice server allows one); the next
     stop is fetched while this one plays */
  function fetchVoice(i) {
    if (cache[i]) return cache[i];
    var attempt = function (n) {
      return fetch(SPEAK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: STEPS[i].say }) })
        .then(function (r) {
          /* the voice server makes one clip at a time: wait and retry when busy */
          if (r.status === 429 && n < 4) return new Promise(function (ok) { setTimeout(ok, 900); }).then(function () { return attempt(n + 1); });
          if (!r.ok) throw new Error('voice ' + r.status);
          return r.json().then(function (d) {
            if (!d || !d.audio) throw new Error('no audio');
            var bin = atob(d.audio), bytes = new Uint8Array(bin.length);
            for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
            return { url: URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })), words: null };
          });
        });
    };
    cache[i] = clipFor(i)
      .then(function (clip) {
        if (!clip) return attempt(0);
        /* warm the clip so it starts instantly */
        try { var pre = new Audio(); pre.preload = 'auto'; pre.src = clip.url; } catch (e) {}
        return clip;
      })
      .catch(function (e) { delete cache[i]; throw e; });
    return cache[i];
  }
  function speak(i, my) {
    if (my !== token) return;
    if (muted) { autoAdvance(STEPS[i].say); return; }
    ui.wave.classList.add('on');
    voiceNote('Loading voice…');
    fetchVoice(i).then(function (clip) {
      if (my !== token || !active || muted) return;
      if (!player) unlock();
      audio = player;
      audio.onloadedmetadata = null;
      audio.onended = function () { if (my === token) { ui.wave.classList.remove('on'); follow(null); markAll(); timer = setTimeout(next, 700); } };
      audio.src = clip.url;
      follow(clip.words, my);
      var p = audio.play();
      voiceNote('');
      if (p && p.catch) p.catch(function (err) {
        if (my !== token) return;
        ui.wave.classList.remove('on');
        follow(null);
        /* the browser blocked sound: say how to turn it on, keep the captions moving */
        voiceNote(err && err.name === 'NotAllowedError' ? 'Your browser blocked the sound — tap the speaker button to hear the voice.' : 'Voice unavailable right now — showing captions.');
        if (err && err.name === 'NotAllowedError') { muted = true; paintMute(); }
        autoAdvance(STEPS[i].say);
      });
      if (i + 1 < STEPS.length) setTimeout(function () { fetchVoice(i + 1).catch(function () {}); }, 400);
    }).catch(function () {
      if (my !== token || !active) return;
      ui.wave.classList.remove('on');
      voiceNote('Voice unavailable right now — showing captions.');
      autoAdvance(STEPS[i].say);
    });
  }

  /* Changing stop: the controls update at once; the caption fades out while
     the page scrolls, and the new caption fades in — and the voice starts —
     only when the page has arrived, so words, spotlight and scroll match. */
  function show(i) {
    if (i < 0 || i >= STEPS.length) return;
    var my = ++token;
    stopAudio();
    resetBar();
    voiceNote('');
    var first = idx < 0;
    idx = i;
    var s = STEPS[i], el = target(s);
    ui.step.textContent = (i + 1) + ' / ' + STEPS.length;
    ui.prev.disabled = i === 0;
    ui.next.textContent = i === STEPS.length - 1 ? 'Finish' : 'Next ›';
    Array.prototype.forEach.call(ui.dots.children, function (d, k) { d.classList.toggle('on', k === i); d.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    if (!muted) fetchVoice(i).catch(function () {});   // fetch the voice while the page scrolls
    if (first) { ui.title.textContent = s.title; renderWords(s.say); }
    var swapped = false, landed = false, faded = reduce || first;
    var reveal = function () {
      if (my !== token || !active || swapped || !landed || !faded) return;
      swapped = true;
      ui.title.textContent = s.title;
      renderWords(s.say);
      ui.body.classList.remove('out');
      ui.body.classList.add('in');
      setTimeout(function () { ui.body.classList.remove('in'); }, 420);
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
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (idx > 0) show(idx - 1); }
  }

  function start() {
    if (active) return;
    build();
    if (!muted) unlock();   // must run inside the tap
    clips();                 // fetch the narration list now, so the first stop speaks at once
    if (typeof window.closeChat === 'function') { try { window.closeChat(); } catch (e) {} }
    if (typeof window.closeCaseStudy === 'function') { try { window.closeCaseStudy(); } catch (e) {} }
    active = true;
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
