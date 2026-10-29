/* ============================================================
   PREMIUM EXTRAS  —  ByteWithSahnawaz
   Four light additions, each independent (one failing never stops
   the others) and each quiet when it is not on screen:

   1. Section guide (phones & tablets, < 1280px — wider screens have
      the desktop rail in desktop-layout.js). A small pill under the
      header while you scroll: which section you're in, how far down
      the page you are, and a tap opens a sheet to jump anywhere.
   2. Peek & expand. Long card sections show their first few cards
      with a soft fade and a "Show all" button; nothing is removed.
   3. Live from my products. Real numbers fetched now from each
      product (YojanaSahay's public stats, real-visitor speed of this
      site, a live reachability check) — labelled honestly when a
      product can't be reached.
   4. Code → design. In the hero, a few lines of code type out and
      turn into the real card they describe. Plays once when it comes
      into view, shows the finished card for reduced motion.
   Styles: css/premium-extras.css
   ============================================================ */
(function () {
  'use strict';
  if (window.__pxLoaded) return;
  window.__pxLoaded = true;

  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var part = function (name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[premium-extras] ' + name, e); } };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n) { try { return Number(n).toLocaleString('en-IN'); } catch (e) { return String(n); } };
  function headerBottom() {
    var h = $('header'); if (!h) return 0;
    var p = getComputedStyle(h).position;
    return (p === 'fixed' || p === 'sticky') ? Math.max(0, h.getBoundingClientRect().bottom) : 0;
  }
  function smoothTo(el) {
    if (!el) return;
    var aim = function () { return el.getBoundingClientRect().top + scrollY - headerBottom() - 10; };
    try { scrollTo({ top: Math.max(0, aim()), behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { scrollTo(0, aim()); }
    /* sections above may still grow while lazy parts render: correct once settled */
    [750, 1500].forEach(function (t) {
      setTimeout(function () {
        var off = el.getBoundingClientRect().top - headerBottom() - 10;
        if (Math.abs(off) > 24) { try { scrollTo({ top: Math.max(0, aim()), behavior: 'smooth' }); } catch (e) { scrollTo(0, aim()); } }
      }, t);
    });
  }
  /* count a number up once, smoothly (eases out) */
  function countUp(el, to, opts) {
    opts = opts || {};
    var dec = opts.decimals || 0, suffix = opts.suffix || '';
    var put = function (v) { el.textContent = (dec ? v.toFixed(dec) : fmt(Math.round(v))) + suffix; };
    if (reduce || !isFinite(to)) { put(to); return; }
    var t0 = performance.now(), d = opts.ms || 1100;
    (function f(t) {
      var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
      put(to * e);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  function onView(el, fn, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: margin || '0px 0px -12% 0px' });
    io.observe(el);
  }

  /* ── shared live data (one request per source, used by parts 3 and 4) ── */
  var YS_STATS = 'https://yojanasahay.vercel.app/api/stats';
  var live = {};
  function liveYS() {
    if (!live.ys) {
      var t0 = performance.now();
      live.ys = fetch(YS_STATS, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
        .then(function (d) { d.__ms = Math.round(performance.now() - t0); return d; })
        .catch(function (e) { live.ys = null; throw e; });
    }
    return live.ys;
  }

  /* ============================================================
     1. SECTION GUIDE (phones & tablets)
     ============================================================ */
  var SECTIONS = [
    ['section:has(> #pfpStage)', 'Home'],
    ['#my-projects', 'Projects'],
    ['#live-products', 'Live Products'],
    ['#projects', 'Experience'],
    ['#achievements', 'Achievements'],
    ['section.ts-section', 'Tech Stack'],
    ['#certSection', 'Certifications'],
    ['#recent-activity', 'Telemetry'],
    ['#job-fit', 'Hiring? Check my fit'],
    ['#what-i-offer', 'Services'],
    ['#why-website', 'Why a Website'],
    ['#website-check', 'Website Check'],
    ['#tools-services', 'Book a Service'],
    ['#testimonials', 'Testimonials'],
    ['#blog', 'Blog'],
    ['#contact', 'Contact']
  ];
  window.SHZ_SECTIONS = SECTIONS;
  function findSec(sel) {
    try { return document.querySelector(sel); }
    catch (e) { var p = $('#pfpStage'); return sel.indexOf('pfpStage') > -1 && p ? p.closest('section') : null; }
  }

  part('section guide', function () {
    var NARROW = window.matchMedia ? matchMedia('(max-width: 1279.98px)') : { matches: true };
    var root = null, sheet = null, items = [], io = null, active = 0, hideT = 0, raf = 0, shown = false;

    function build() {
      if (root) return;
      var found = SECTIONS.map(function (s) { return { el: findSec(s[0]), label: s[1] }; }).filter(function (s) { return s.el; });
      if (found.length < 4) return;
      items = found;

      root = document.createElement('div');
      root.className = 'sg';
      root.innerHTML =
        '<button type="button" class="sg-pill" aria-haspopup="dialog" aria-expanded="false">'
        + '<svg class="sg-ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" class="sg-ring-bg"/><circle cx="12" cy="12" r="9.5" class="sg-ring-fg" pathLength="100"/></svg>'
        + '<span class="sg-name"></span><span class="sg-count"></span>'
        + '<svg class="sg-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'
        + '</button>';
      document.body.appendChild(root);

      sheet = document.createElement('div');
      sheet.className = 'sg-sheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'Jump to a section');
      sheet.innerHTML =
        '<div class="sg-backdrop"></div>'
        + '<div class="sg-panel">'
        + '<div class="sg-grab" aria-hidden="true"></div>'
        + '<div class="sg-head"><span class="sg-title">Jump to a section</span>'
        + '<button type="button" class="sg-x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>'
        + '<ol class="sg-list"></ol>'
        + '</div>';
      document.body.appendChild(sheet);
      var list = sheet.querySelector('.sg-list');
      items.forEach(function (it, i) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'sg-item';
        b.innerHTML = '<span class="sg-num">' + String(i + 1).padStart(2, '0') + '</span><span class="sg-label"></span><span class="sg-here">You are here</span>';
        b.querySelector('.sg-label').textContent = it.label;
        b.addEventListener('click', function () { close(); setTimeout(function () { smoothTo(it.el); }, reduce ? 0 : 160); });
        li.appendChild(b); list.appendChild(li); it.btn = b;
      });

      root.querySelector('.sg-pill').addEventListener('click', open);
      sheet.querySelector('.sg-backdrop').addEventListener('click', close);
      sheet.querySelector('.sg-x').addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) close(); });

      io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          for (var k = 0; k < items.length; k++) if (items[k].el === e.target) { setActive(k); break; }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      items.forEach(function (it) { io.observe(it.el); });
      addEventListener('scroll', onScroll, { passive: true });
      setActive(0);
    }
    function destroy() {
      if (!root) return;
      io && io.disconnect();
      removeEventListener('scroll', onScroll);
      root.remove(); sheet.remove(); root = sheet = null; items = [];
    }
    function setActive(k) {
      active = k;
      if (!root) return;
      root.querySelector('.sg-name').textContent = items[k].label;
      root.querySelector('.sg-count').textContent = (k + 1) + '/' + items.length;
      items.forEach(function (it, n) {
        it.btn.classList.toggle('is-here', n === k);
        it.btn.classList.toggle('is-past', n < k);
        if (n === k) it.btn.setAttribute('aria-current', 'true'); else it.btn.removeAttribute('aria-current');
      });
    }
    function progress() {
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0;
      root.querySelector('.sg-ring-fg').style.strokeDashoffset = String(100 - p);
    }
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (!root) return;
        if (scrollY < 140) setActive(0);
        progress();
        root.style.top = (headerBottom() + 10) + 'px';
        var heroEnd = items[1] ? items[1].el.getBoundingClientRect().top + scrollY - innerHeight * 0.6 : 600;
        var want = scrollY > heroEnd && !document.documentElement.classList.contains('tour-on');
        show(want);
        clearTimeout(hideT);
        if (want) hideT = setTimeout(function () { if (!sheet.classList.contains('open')) show(false); }, 2200);
      });
    }
    function show(on) {
      if (on === shown) return;
      shown = on;
      root.classList.toggle('on', on);
    }
    function open() {
      clearTimeout(hideT);
      sheet.classList.add('open');
      root.querySelector('.sg-pill').setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('sg-open');
      var here = items[active] && items[active].btn;
      if (here) setTimeout(function () { try { here.scrollIntoView({ block: 'center' }); here.focus({ preventScroll: true }); } catch (e) {} }, 60);
    }
    function close() {
      if (!sheet) return;
      sheet.classList.remove('open');
      root.querySelector('.sg-pill').setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('sg-open');
      hideT = setTimeout(function () { show(false); }, 1600);
    }
    var apply = function () { NARROW.matches ? build() : destroy(); };
    apply();
    if (NARROW.addEventListener) NARROW.addEventListener('change', apply);
  });

  /* ============================================================
     2. PEEK & EXPAND
     ============================================================ */
  var PEEK = [
    { sec: '#blog', group: '.blog-grid', card: '.pblog-card', phone: 4, wide: 5, noun: 'posts' },
    { sec: '#achievements', group: '.kta3-grid', card: '.kta3-card', phone: 4, wide: 5, noun: 'achievements' },
    { sec: '#why-website', group: '.wnw-grid', card: '.wnw-card', phone: 4, wide: 5, noun: 'reasons' },
    { sec: '#tools-services', group: '.syb-grid', card: '.syb-card', phone: 4, wide: 8, noun: 'services' }
  ];
  part('peek', function () {
    var WIDE = window.matchMedia ? matchMedia('(min-width: 900px)') : { matches: false };
    var blocks = [];
    PEEK.forEach(function (cfg) {
      var sec = $(cfg.sec); if (!sec) return;
      [].slice.call(sec.querySelectorAll(cfg.group)).forEach(function (grid) {
        var cards = [].slice.call(grid.querySelectorAll(cfg.card));
        if (cards.length < 3) return;
        var bar = document.createElement('div');
        bar.className = 'pk-bar';
        bar.innerHTML = '<button type="button" class="pk-btn" aria-expanded="false"><span class="pk-txt"></span>'
          + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>';
        grid.parentNode.insertBefore(bar, grid.nextSibling);
        var b = { cfg: cfg, sec: sec, grid: grid, cards: cards, bar: bar, open: false };
        bar.querySelector('.pk-btn').addEventListener('click', function () { toggle(b); });
        blocks.push(b);
      });
    });
    function limit(b) { return WIDE.matches ? b.cfg.wide : b.cfg.phone; }
    function paint(b, animate) {
      var n = limit(b), extra = b.cards.length - n, peeking = extra > 0 && !b.open;
      b.cards.forEach(function (c, i) {
        var hide = peeking && i >= n;
        if (!hide && c.classList.contains('pk-hide') && animate && !reduce) {
          c.classList.add('pk-in');
          c.style.animationDelay = Math.min(6, i - n) * 55 + 'ms';
          setTimeout(function () { c.classList.remove('pk-in'); c.style.animationDelay = ''; }, 900);
        }
        c.classList.toggle('pk-hide', hide);
      });
      b.grid.classList.toggle('pk-peeking', peeking);
      b.bar.hidden = extra <= 0;
      var btn = b.bar.querySelector('.pk-btn');
      btn.setAttribute('aria-expanded', String(b.open));
      btn.classList.toggle('is-open', b.open);
      b.bar.querySelector('.pk-txt').textContent = b.open ? 'Show less' : 'Show all ' + b.cards.length + ' ' + b.cfg.noun + ' · ' + extra + ' more';
    }
    function toggle(b) {
      b.open = !b.open;
      if (!b.open) {
        /* collapsing: keep the reader where the shortened grid ends */
        paint(b, false);
        var r = b.bar.getBoundingClientRect();
        if (r.top < headerBottom() || r.top > innerHeight) {
          try { scrollTo({ top: Math.max(0, r.top + scrollY - innerHeight * 0.6), behavior: reduce ? 'auto' : 'smooth' }); } catch (e) {}
        }
      } else paint(b, true);
    }
    blocks.forEach(function (b) { paint(b, false); });
    if (WIDE.addEventListener) WIDE.addEventListener('change', function () { blocks.forEach(function (b) { paint(b, false); }); });
  });

  /* ============================================================
     3. LIVE FROM MY PRODUCTS
     ============================================================ */
  part('live products', function () {
    var sec = $('#live-products'); if (!sec) return;
    var updated = $('#lpUpdated', sec);
    var stamp = 0;
    function ago() {
      if (!stamp || !updated) return;
      var s = Math.round((Date.now() - stamp) / 1000);
      updated.textContent = s < 10 ? 'updated just now' : s < 60 ? 'updated ' + s + 's ago' : 'updated ' + Math.round(s / 60) + ' min ago';
    }
    function rel(iso) {
      var d = new Date(iso); if (isNaN(d)) return '';
      var m = Math.round((Date.now() - d) / 60000);
      return m < 2 ? 'just now' : m < 60 ? m + ' min ago' : m < 48 * 60 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago';
    }
    function setStatus(card, ok, text) {
      var s = $('.lp-status', card);
      s.classList.toggle('is-up', ok === true);
      s.classList.toggle('is-down', ok === false);
      $('.lp-status-t', s).textContent = text;
    }
    function metric(card, key, value, opts) {
      var m = $('[data-m="' + key + '"]', card); if (!m) return;
      var v = $('.lp-v', m);
      m.classList.add('is-live');
      if (typeof value === 'number') countUp(v, value, opts); else v.textContent = value;
    }
    function ring(card, pct) {
      var r = $('.lp-ring-fg', card); if (!r) return;
      r.style.strokeDashoffset = String(100 - Math.max(0, Math.min(100, pct)));
    }
    function run() {
      stamp = Date.now(); ago();
      setInterval(ago, 15000);

      /* YojanaSahay — public stats feed (schemes, checks run, link health) */
      var ys = $('[data-p="ys"]', sec);
      liveYS().then(function (d) {
        setStatus(ys, true, 'Online · ' + d.__ms + ' ms');
        if (typeof d.schemeCount === 'number') metric(ys, 'schemes', d.schemeCount);
        if (typeof d.checkerTotal === 'number') metric(ys, 'checks', d.checkerTotal);
        if (typeof d.linkHealthPercent === 'number') { metric(ys, 'links', d.linkHealthPercent, { suffix: '%' }); ring(ys, d.linkHealthPercent); }
        var f = $('.lp-foot-t', ys);
        if (f && d.lastVerifiedAt) f.textContent = 'Official links re-checked ' + rel(d.lastVerifiedAt);
      }).catch(function () { setStatus(ys, false, "Couldn't reach it right now"); });

      /* StudyLens AI — a real reachability check, timed from your browser */
      var sl = $('[data-p="sl"]', sec);
      var t0 = performance.now(), done = false;
      var tm = setTimeout(function () { if (!done) { done = true; setStatus(sl, false, 'Slow to answer right now'); } }, 9000);
      fetch('https://studylens-ai-gamma.vercel.app/', { mode: 'no-cors', cache: 'no-store' })
        .then(function () {
          if (done) return; done = true; clearTimeout(tm);
          var ms = Math.round(performance.now() - t0);
          setStatus(sl, true, 'Online · ' + ms + ' ms');
          metric(sl, 'ms', ms, { suffix: ' ms' });
        })
        .catch(function () { if (done) return; done = true; clearTimeout(tm); setStatus(sl, false, "Couldn't reach it right now"); });
    }
    onView(sec, run, '200px 0px 0px 0px');
  });

  /* ============================================================
     4. CODE → DESIGN (hero)
     ============================================================ */
  part('code to design', function () {
    var box = $('#c2d'); if (!box) return;
    var code = $('.c2d-code pre', box), stage = box;
    var LINES = [
      [['t', '<'], ['k', 'Card'], ['a', ' glow'], ['t', '>']],
      [['t', '  <'], ['k', 'Logo'], ['a', ' src'], ['t', '='], ['s', '"yojana.svg"'], ['t', ' />']],
      [['t', '  <'], ['k', 'Title'], ['t', '>'], ['x', 'Yojana Sahay'], ['t', '</'], ['k', 'Title'], ['t', '>']],
      [['t', '  <'], ['k', 'Stat'], ['a', ' value'], ['t', '={'], ['n', 'schemes'], ['t', '}'], ['a', ' live'], ['t', ' />']],
      [['t', '  <'], ['k', 'Button'], ['t', '>'], ['x', 'Open app →'], ['t', '</'], ['k', 'Button'], ['t', '>']],
      [['t', '</'], ['k', 'Card'], ['t', '>']]
    ];
    var playing = false, timer = 0, count = 1261;
    liveYS().then(function (d) { if (typeof d.schemeCount === 'number') count = d.schemeCount; }).catch(function () {});

    function renderAll() {
      code.innerHTML = LINES.map(function (l) {
        return l.map(function (p) { return '<span class="c2d-' + p[0] + '">' + esc(p[1]) + '</span>'; }).join('');
      }).join('\n');
    }
    function showCard() {
      stage.classList.add('is-ui');
      var v = $('.c2d-stat-v', box);
      if (v) countUp(v, count, { ms: 1200 });
      $('.c2d-replay', box).hidden = false;
    }
    function play() {
      if (playing) return;
      playing = true;
      stage.classList.remove('is-ui');
      $('.c2d-replay', box).hidden = true;
      if (reduce) { renderAll(); showCard(); playing = false; return; }
      code.innerHTML = '';
      var li = 0, pi = 0, ci = 0, line = null, span = null;
      (function step() {
        if (li >= LINES.length) {
          code.classList.add('is-done');
          timer = setTimeout(function () { showCard(); playing = false; }, 650);
          return;
        }
        if (!line) { line = document.createElement('span'); line.className = 'c2d-line'; code.appendChild(line); }
        var p = LINES[li][pi];
        if (!span) { span = document.createElement('span'); span.className = 'c2d-' + p[0]; line.appendChild(span); }
        span.textContent += p[1].charAt(ci++);
        if (ci >= p[1].length) { ci = 0; pi++; span = null; }
        if (pi >= LINES[li].length) { li++; pi = 0; line = null; if (li < LINES.length) code.appendChild(document.createTextNode('\n')); }
        timer = setTimeout(step, p[0] === 't' ? 16 : 30);
      })();
      code.classList.remove('is-done');
    }
    $('.c2d-replay', box).addEventListener('click', function () { clearTimeout(timer); playing = false; play(); });
    /* the "code" tab shows the code again without replaying */
    $('.c2d-tab-code', box).addEventListener('click', function () { stage.classList.remove('is-ui'); if (!code.textContent) renderAll(); });
    $('.c2d-tab-ui', box).addEventListener('click', function () { if (!code.textContent) renderAll(); showCard(); });
    onView(box, play, '0px 0px -18% 0px');
  });
})();
