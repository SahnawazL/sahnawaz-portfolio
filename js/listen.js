/* ============================================================
   LISTEN — the speaker buttons on cards.
   Every clip is pre-made (audio/say/, made by .github/workflows/say-voice.yml):
   a natural voice over the same music as the tour. Nothing here generates
   speech. This file only loads when a section with clips comes near the
   screen, and a clip is fetched only when someone reaches for its button:
   touching it starts the download, so the tap usually plays at once, and
   "Preparing" shows only if it really has to wait.
   One clip plays at a time; the guided tour always takes priority.
   ============================================================ */
(function () {
  'use strict';
  if (window.shzListen) return;
  var BASE = '/audio/say/', index = null, audio = null, now = null, bar = null, raf = 0, data = {}, lastBtn = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>';
  function clock(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function $(s, r) { return (r || document).querySelector(s); }
  function all(s, fn) { Array.prototype.forEach.call(document.querySelectorAll(s), fn); }

  /* ── buttons ── */
  function pill(id, label) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sl-pill'; b.setAttribute('data-clip', id); b.setAttribute('data-label', label);
    paint(b, 'idle');
    return b;
  }
  function paint(b, state) {
    var id = b.getAttribute('data-clip'), c = index && index[id];
    b.setAttribute('data-state', state);
    b.innerHTML = state === 'prep' ? '<i class="sl-spin" aria-hidden="true"></i><span>Preparing…</span>'
      : state === 'on' ? '<i class="sl-eq" aria-hidden="true"><b></b><b></b><b></b></i><span>Playing</span>'
      : state === 'off' ? ICON + '<span>Couldn’t play. Tap to retry</span>'
      : ICON + '<span>' + b.getAttribute('data-label') + '</span>' + (c ? '<small>' + clock(c.s) + '</small>' : '');
  }
  function place() {
    var JOBS = { Xiaomi: 'job-xiaomi', Flipkart: 'job-flipkart', Rapido: 'job-rapido', Freelance: 'job-freelance' };
    all('.pwork-entry', function (e) {
      var name = ($('.pwork-company', e) || {}).textContent || '', body = $('.pwork-body-inner', e), key = Object.keys(JOBS).filter(function (k) { return name.indexOf(k) === 0; })[0];
      if (key && body && index[JOBS[key]] && !$('.sl-pill', body)) body.insertBefore(pill(JOBS[key], 'Hear the story'), body.firstChild);
    });
    ['tech', 'impact'].forEach(function (g) {
      var t = document.getElementById('kta3-title-' + g);
      if (t && !$('.sl-pill', t.parentNode)) { var p = pill('', 'Hear the story'); p.hidden = true; t.parentNode.insertBefore(p, t.nextSibling); }
    });
    all('.wio-card', function (c) {
      var id = 'offer' + c.getAttribute('data-idx'), back = $('.wio-back', c), plan = $('.wio-plan', c);
      if (back && index[id] && !$('.sl-pill', back)) back.insertBefore(pill(id, 'What do I get?'), plan || null);
    });
    [['StudyLens', 'pod-studylens'], ['Yojana Sahay', 'pod-yojanasahay']].forEach(function (p) {
      all('.mpj-card', function (c) {
        var links = $('.mpj-card-links', c), title = c.textContent.indexOf(p[0]) >= 0 && ($('h3', c) || c).textContent.indexOf(p[0]) >= 0;
        if (title && links && index[p[1]] && !$('.sl-pill', links)) links.appendChild(pill(p[1], 'Podcast'));
      });
    });
    syncStory();
  }
  /* the achievements share one panel per group, so its button follows the open card */
  function syncStory() {
    ['tech', 'impact'].forEach(function (g) {
      var t = document.getElementById('kta3-title-' + g), p = t && $('.sl-pill', t.parentNode), on = $('.kta3-card.kta3-on[data-group="' + g + '"]');
      if (!p) return;
      var id = on ? on.getAttribute('data-id') : '';
      if (id === p.getAttribute('data-clip')) return;
      p.setAttribute('data-clip', id); p.hidden = !(id && index[id]);
      paint(p, now && now.id === id ? 'on' : 'idle');
    });
  }

  /* ── getting a clip ready: as soon as a finger or pointer reaches the button ── */
  function player() {
    if (audio) return audio;
    audio = new Audio(); audio.preload = 'auto'; audio.setAttribute('playsinline', '');
    audio.addEventListener('playing', function () { if (now) { setAll(now.id, 'on'); bar.classList.add('sl-live'); paintBar(); } });
    audio.addEventListener('waiting', function () { if (now && !audio.paused) setAll(now.id, 'prep'); });
    audio.addEventListener('pause', paintBar);
    audio.addEventListener('ended', function () { close(); });
    audio.addEventListener('error', function () { if (now) { var id = now.id; close(); setAll(id, 'off'); } });
    return audio;
  }
  function setAll(id, state) { all('.sl-pill[data-clip="' + id + '"]', function (b) { paint(b, state); }); }
  function words(c) {
    if (!data[c.f]) data[c.f] = fetch(BASE + c.f + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { delete data[c.f]; return null; });
    return data[c.f];
  }
  var armed = '';
  function ready(id) {
    var c = index && index[id];
    if (!c || (now && now.id === id)) return;
    words(c);
    if (armed === id) return;
    armed = id;
    if (!now) { player().src = BASE + c.f + '.mp3'; audio.load(); }
  }

  /* ── playing ── */
  function buildBar() {
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'sl-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Now playing');
    bar.innerHTML = '<button type="button" class="sl-go" aria-label="Pause"></button>'
      + '<div class="sl-mid"><p class="sl-line" aria-live="off"></p><div class="sl-track"><i></i></div></div>'
      + '<span class="sl-tag">AI voice</span><button type="button" class="sl-x" aria-label="Stop">×</button>';
    document.body.appendChild(bar);
    $('.sl-go', bar).addEventListener('click', function () { if (!audio) return; if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
    $('.sl-x', bar).addEventListener('click', close);
  }
  function paintBar() {
    if (!bar) return;
    var go = $('.sl-go', bar), p = !audio || audio.paused;
    go.innerHTML = p ? PLAY : PAUSE; go.setAttribute('aria-label', p ? 'Play' : 'Pause');
  }
  function play(id, btn) {
    var c = index && index[id];
    if (!c) return;
    if (now && now.id === id) { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); return; }
    close();
    buildBar();
    lastBtn = btn;
    now = { id: id, c: c, text: null, chunk: -1, at: -1, spans: [] };
    var a = player(), url = BASE + c.f + '.mp3';
    if (a.src.indexOf(url) < 0) { a.src = url; a.load(); }
    armed = '';
    setAll(id, 'prep');
    $('.sl-line', bar).textContent = 'Preparing…';
    bar.classList.add('sl-open');
    var mine = now;
    var p = a.play();
    if (p && p.catch) p.catch(function (e) { if (now === mine && e && e.name !== 'AbortError') { close(); setAll(id, 'off'); } });
    words(c).then(function (d) { if (now === mine && d) { mine.text = d; follow(); } });
    follow();
    try { if (window.gtag) gtag('event', 'listen_play', { clip: id }); } catch (e) {}
  }
  function line(n) {
    var d = now.text, CH = 9, from = n * CH, el = $('.sl-line', bar);
    now.chunk = n; now.spans = [];
    el.textContent = '';
    d.text.slice(from, from + CH).forEach(function (w, k) {
      var s = document.createElement('span'); s.textContent = w; el.appendChild(s); el.appendChild(document.createTextNode(' ')); now.spans[k] = s;
    });
  }
  function follow() {
    cancelAnimationFrame(raf);
    var tick = function () {
      if (!now) return;
      raf = requestAnimationFrame(tick);
      var t = audio.currentTime || 0, d = now.c.s, fill = $('.sl-track i', bar);
      fill.style.transform = 'scaleX(' + Math.min(1, t / d).toFixed(4) + ')';
      var x = now.text;
      if (!x || !x.words.length) return;
      if (t < x.words[0][0]) { if (now.chunk < 0 && !audio.paused) $('.sl-line', bar).textContent = '…'; return; }
      var k = now.at < 0 || t < x.words[now.at][0] ? 0 : now.at;
      while (k + 1 < x.words.length && x.words[k + 1][0] <= t) k++;
      if (k === now.at) return;
      now.at = k;
      var n = Math.floor(k / 9);
      if (n !== now.chunk) line(n);
      now.spans.forEach(function (s, i) { s.className = i < k % 9 ? 'sl-said' : i === k % 9 ? 'sl-now' : ''; });
    };
    raf = requestAnimationFrame(tick);
  }
  function close() {
    cancelAnimationFrame(raf);
    if (audio) { try { audio.pause(); } catch (e) {} }
    if (now) { setAll(now.id, 'idle'); now = null; }
    if (bar) bar.classList.remove('sl-open', 'sl-live');
  }

  /* ── wiring: one listener for every button ── */
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.sl-pill');
    if (b) ready(b.getAttribute('data-clip'));
  }, true);
  document.addEventListener('mouseover', function (e) {
    var b = e.target.closest && e.target.closest('.sl-pill');
    if (b) ready(b.getAttribute('data-clip'));
  }, true);
  /* in the capture phase, so the card under the button doesn't flip or close */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.sl-pill');
    if (b) { e.stopPropagation(); e.preventDefault(); play(b.getAttribute('data-clip'), b); return; }
    if (e.target.closest && e.target.closest('.kta3-card, .kta3-close')) setTimeout(syncStory, 0);
  }, true);
  new MutationObserver(function () { if (document.documentElement.classList.contains('tour-on')) close(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && now) close(); });

  /* ── start: the small list of clips, the styles, then the buttons ── */
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'css/listen.css'; document.head.appendChild(css);
  fetch(BASE + 'index.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (x) {
    if (!x) return;
    index = x;
    place();
    window.shzListen = { stop: close };
  }).catch(function () {});
})();
