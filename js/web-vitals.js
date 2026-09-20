/* ============================================================
   WEB VITALS  —  ByteWithSahnawaz
   This page measures its own performance and reports it honestly.

   Standalone. Injects its own CSS. No dependencies, no network calls,
   nothing sent anywhere — every number is read from the browser's own
   Performance APIs on this device, this visit.

   Open:  the "Performance" entry in the command palette
          any element with  data-web-vitals
          window.openWebVitals()

   Load this EARLY (in <head> or near the top of <body>). LCP and CLS
   can only be captured if the observers are running before the page
   finishes painting; attaching them late silently loses data.
   ============================================================ */
(function () {
  'use strict';

  if (window.__webVitalsLoaded) return;
  window.__webVitalsLoaded = true;

  var SUPPORTED = typeof PerformanceObserver !== 'undefined';

  /* ---------- thresholds (Google's own, ms except CLS) ---------- */
  var T = {
    LCP  : [2500, 4000],
    INP  : [200, 500],
    CLS  : [0.1, 0.25],
    FCP  : [1800, 3000],
    TTFB : [800, 1800]
  };

  var M = {
    LCP : { v: null, el: '' },
    INP : { v: null },
    CLS : { v: 0 },
    FCP : { v: null },
    TTFB: { v: null },
    bytes: { html: 0, css: 0, js: 0, img: 0, other: 0, total: 0, count: 0 }
  };

  function rate(k, v) {
    if (v == null || !T[k]) return 'na';
    return v <= T[k][0] ? 'good' : (v <= T[k][1] ? 'ok' : 'poor');
  }

  /* ---------- observers -------------------------------------- */
  function observe(type, cb, extra) {
    if (!SUPPORTED) return null;
    try {
      var po = new PerformanceObserver(function (list) { list.getEntries().forEach(cb); });
      var opt = { type: type, buffered: true };
      if (extra) for (var k in extra) opt[k] = extra[k];
      po.observe(opt);
      return po;
    } catch (e) { return null; }   /* unsupported entry type — skip it */
  }

  /* LCP: keep the latest candidate until the user interacts, which is
     the point the spec says the metric is final. */
  var lcpPO = observe('largest-contentful-paint', function (e) {
    M.LCP.v = e.renderTime || e.loadTime || e.startTime;
    M.LCP.el = e.element ? (e.element.tagName || '').toLowerCase() : '';
    paint();
  });
  function finalizeLCP() {
    if (lcpPO) { try { lcpPO.disconnect(); } catch (e) {} lcpPO = null; }
  }
  ['keydown', 'pointerdown', 'click'].forEach(function (t) {
    addEventListener(t, finalizeLCP, { once: true, capture: true });
  });

  /* CLS: the real metric is the largest *session window* — shifts
     grouped with <1s gaps and a 5s cap — not a naive running total,
     which over-reports on long-lived pages. */
  var clsCur = 0, clsFirst = 0, clsLast = 0;
  observe('layout-shift', function (e) {
    if (e.hadRecentInput) return;                 /* user-caused: excluded */
    var t = e.startTime;
    if (clsCur && (t - clsLast > 1000 || t - clsFirst > 5000)) clsCur = 0;
    if (!clsCur) clsFirst = t;
    clsLast = t;
    clsCur += e.value;
    if (clsCur > M.CLS.v) { M.CLS.v = clsCur; paint(); }
  });

  /* INP: worst interaction latency seen so far. The official metric is
     a high percentile over many interactions; on a portfolio visit the
     sample is tiny, so the slowest one is the honest thing to show. */
  observe('event', function (e) {
    var d = e.duration;
    if (d == null) return;
    if (M.INP.v == null || d > M.INP.v) { M.INP.v = d; paint(); }
  }, { durationThreshold: 16 });

  observe('paint', function (e) {
    if (e.name === 'first-contentful-paint') { M.FCP.v = e.startTime; paint(); }
  });

  /* ---------- navigation + transfer sizes --------------------- */
  function readNav() {
    try {
      var n = performance.getEntriesByType('navigation')[0];
      if (!n) return;
      M.TTFB.v = n.responseStart;
      M.bytes.html = n.transferSize || 0;
    } catch (e) {}
  }
  function readResources() {
    try {
      var b = M.bytes;
      b.css = b.js = b.img = b.other = 0; b.count = 0;
      performance.getEntriesByType('resource').forEach(function (r) {
        var size = r.transferSize || 0;
        b.count++;
        var u = (r.name || '').split('?')[0];
        if (/\.css$/i.test(u))                       b.css += size;
        else if (/\.m?js$/i.test(u))                 b.js  += size;
        else if (/\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(u)) b.img += size;
        else                                         b.other += size;
      });
      b.total = b.html + b.css + b.js + b.img + b.other;
    } catch (e) {}
  }
  readNav();
  addEventListener('load', function () { readResources(); paint(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintCard);
  } else {
    setTimeout(paintCard, 0);
  }
  /* metrics keep arriving after load (CLS, INP); refresh the card a few
     times early on so it is never left showing dashes. */
  [600, 1500, 3500].forEach(function (d) { setTimeout(paintCard, d); });

  /* ---------- formatting -------------------------------------- */
  function ms(v) {
    if (v == null) return '—';
    return v < 1000 ? Math.round(v) + ' ms' : (v / 1000).toFixed(2) + ' s';
  }
  function kb(n) {
    if (!n) return '0 KB';
    return n < 1024 * 1024 ? Math.round(n / 1024) + ' KB'
                           : (n / 1048576).toFixed(2) + ' MB';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- styles ------------------------------------------ */
  var CSS = [
'#wv-overlay{position:fixed;inset:0;z-index:100210;display:none;',
'  background:radial-gradient(120% 90% at 50% 0%,rgba(8,20,34,.80),rgba(2,7,14,.90));',
'  backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);',
'  align-items:flex-start;justify-content:center;padding:9vh 16px 16px;}',
'#wv-overlay.is-open{display:flex;animation:wvFade .18s ease both;}',
'@keyframes wvFade{from{opacity:0}to{opacity:1}}',
'#wv-box{width:100%;max-width:560px;position:relative;',
'  background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99));',
'  border:1px solid rgba(120,205,255,.20);border-radius:18px;overflow:hidden;',
'  box-shadow:0 40px 90px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,255,255,.05);',
'  animation:wvRise .22s cubic-bezier(.2,.85,.3,1) both;',
'  display:flex;flex-direction:column;max-height:80vh;}',
'@keyframes wvRise{from{opacity:0;transform:translateY(-14px) scale(.98)}to{opacity:1;transform:none}}',
'#wv-box::before{content:"";position:absolute;top:0;left:12%;right:12%;height:1px;',
'  background:linear-gradient(90deg,transparent,rgba(120,220,255,.55),transparent);}',

'#wv-head{display:flex;align-items:center;gap:11px;padding:16px;',
'  border-bottom:1px solid rgba(120,205,255,.12);flex:0 0 auto;}',
'#wv-head>svg{width:18px;height:18px;color:rgba(130,205,245,.75);flex:none;}',
'#wv-title{flex:1;min-width:0;}',
'#wv-title b{display:block;font-size:.95rem;font-weight:700;color:#eaf6ff;letter-spacing:.2px;}',
'#wv-title span{display:block;font-size:.72rem;color:rgba(172,208,233,.55);margin-top:2px;}',
'#wv-close{flex:none;display:flex;align-items:center;justify-content:center;',
'  width:34px;height:34px;border-radius:9px;cursor:pointer;',
'  background:rgba(130,200,240,.07);border:1px solid rgba(140,200,235,.22);',
'  color:rgba(175,215,240,.75);transition:all .16s ease;}',
'#wv-close:hover{background:rgba(130,200,240,.16);color:#eaf7ff;}',
'#wv-close:active{transform:scale(.93);}',
'#wv-close svg{width:15px;height:15px;}',

'#wv-body{overflow-y:auto;padding:14px 16px 18px;flex:1 1 auto;overscroll-behavior:contain;}',
'.wv-sec{font-size:.58rem;letter-spacing:.17em;text-transform:uppercase;font-weight:600;',
'  color:rgba(150,200,230,.42);margin:16px 0 9px;display:flex;align-items:center;gap:9px;}',
'.wv-sec:first-child{margin-top:2px;}',
'.wv-sec::after{content:"";flex:1;height:1px;',
'  background:linear-gradient(90deg,rgba(120,200,255,.16),transparent);}',

'.wv-row{display:flex;align-items:center;gap:12px;padding:10px 0;',
'  border-bottom:1px solid rgba(120,200,255,.06);}',
'.wv-row:last-child{border-bottom:none;}',
'.wv-k{min-width:0;flex:1;}',
'.wv-k b{display:block;font-size:.85rem;font-weight:600;color:#dceaf7;}',
'.wv-k span{display:block;font-size:.7rem;color:rgba(172,208,233,.5);margin-top:2px;line-height:1.35;}',
'.wv-v{font-family:ui-monospace,"SF Mono","Fira Code",monospace;font-size:.92rem;',
'  font-weight:600;text-align:right;flex:none;min-width:72px;}',
'.wv-pill{flex:none;font-size:.56rem;letter-spacing:.1em;text-transform:uppercase;',
'  font-weight:700;padding:3px 7px;border-radius:5px;min-width:52px;text-align:center;}',
'.wv-good .wv-v{color:#4fe0a2;} .wv-good .wv-pill{background:rgba(79,224,162,.14);color:#6ff0bb;}',
'.wv-ok   .wv-v{color:#ffcf6b;} .wv-ok   .wv-pill{background:rgba(255,207,107,.14);color:#ffd884;}',
'.wv-poor .wv-v{color:#ff7a7a;} .wv-poor .wv-pill{background:rgba(255,122,122,.14);color:#ff9a9a;}',
'.wv-na   .wv-v{color:rgba(170,205,230,.4);} ',
'.wv-na   .wv-pill{background:rgba(150,190,220,.09);color:rgba(175,210,235,.55);}',

'.wv-bar{display:flex;height:9px;border-radius:5px;overflow:hidden;margin:10px 0 8px;',
'  background:rgba(120,200,255,.07);}',
'.wv-bar i{display:block;height:100%;}',
'.wv-legend{display:flex;flex-wrap:wrap;gap:10px 16px;font-size:.68rem;',
'  color:rgba(172,208,233,.6);}',
'.wv-legend span{display:flex;align-items:center;gap:6px;}',
'.wv-legend i{width:9px;height:9px;border-radius:3px;flex:none;}',

'.wv-note{margin-top:16px;padding:11px 13px;border-radius:10px;',
'  background:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.12);',
'  font-size:.72rem;line-height:1.55;color:rgba(178,212,236,.62);}',
'.wv-note b{color:rgba(215,238,252,.85);font-weight:600;}',

'@media (max-width:640px){',
'  #wv-overlay{padding:5vh 10px 10px;}',
'  #wv-box{max-height:86vh;border-radius:16px;}',
'  .wv-v{font-size:.86rem;min-width:62px;}',
'  .wv-pill{min-width:46px;}',
'  .wv-k span{font-size:.68rem;}',
'}',
'@media (prefers-reduced-motion:reduce){',
'  #wv-overlay.is-open,#wv-box{animation:none!important;}',
'}',
/* hacker mode forces green + Courier on every element with !important;
   these ID-scoped rules outrank it so the panel keeps its own palette */
'#wv-overlay,#wv-overlay *{font-family:inherit!important;}',
'#wv-overlay #wv-box{background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99))!important;',
'  border-color:rgba(120,205,255,.20)!important;}',
'#wv-overlay .wv-row,#wv-overlay #wv-head{border-color:rgba(120,205,255,.10)!important;}',
'#wv-overlay #wv-title b,#wv-overlay .wv-k b{color:#e6f3ff!important;}',
'#wv-overlay #wv-title span,#wv-overlay .wv-k span,#wv-overlay .wv-legend{color:rgba(172,208,233,.55)!important;}',
'#wv-overlay .wv-good .wv-v{color:#4fe0a2!important;}',
'#wv-overlay .wv-ok   .wv-v{color:#ffcf6b!important;}',
'#wv-overlay .wv-poor .wv-v{color:#ff7a7a!important;}',
'#wv-overlay .wv-na   .wv-v{color:rgba(170,205,230,.4)!important;}',
'#wv-overlay .wv-note{background:rgba(120,200,255,.05)!important;',
'  border-color:rgba(120,200,255,.12)!important;color:rgba(178,212,236,.62)!important;}',
'#wv-overlay .wv-bar{background:rgba(120,200,255,.07)!important;}',
'#wv-overlay #wv-close{background:rgba(130,200,240,.07)!important;',
'  border-color:rgba(140,200,235,.22)!important;color:rgba(175,215,240,.75)!important;}'
  ].join('\n');

  /* ---------- panel ------------------------------------------- */
  var overlay, bodyEl, built = false;

  function build() {
    if (built) return;
    built = true;
    var st = document.createElement('style');
    st.id = 'wv-style'; st.textContent = CSS;
    document.head.appendChild(st);

    overlay = document.createElement('div');
    overlay.id = 'wv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Performance report');
    overlay.innerHTML =
      '<div id="wv-box">' +
        '<div id="wv-head">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/></svg>' +
          '<span id="wv-title"><b>Performance</b>' +
            '<span>Measured on your device, this visit</span></span>' +
          '<button id="wv-close" type="button" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
              'stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="wv-body"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    bodyEl = document.getElementById('wv-body');

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('wv-close').addEventListener('click', close);
  }

  function row(k, label, note, value, cls) {
    var r = cls || rate(k, value);
    var shown = (k === 'CLS')
      ? (value == null ? '—' : value.toFixed(3))
      : ms(value);
    var tag = r === 'good' ? 'Good' : r === 'ok' ? 'Fair' : r === 'poor' ? 'Poor' : 'Waiting';
    return '<div class="wv-row wv-' + r + '">' +
             '<span class="wv-k"><b>' + esc(label) + '</b><span>' + esc(note) + '</span></span>' +
             '<span class="wv-v">' + shown + '</span>' +
             '<span class="wv-pill">' + tag + '</span>' +
           '</div>';
  }

  /* ---------- inline card in the telemetry section ------------ */
  function paintCard() {
    var grid = document.getElementById('wvCardGrid');
    if (!grid) return;
    readNav(); readResources();
    var vals = {
      LCP : M.LCP.v == null ? null : M.LCP.v,
      CLS : M.CLS.v,
      INP : M.INP.v,
      PAGE: M.bytes.total || null
    };
    Array.prototype.forEach.call(grid.querySelectorAll('.wv-chip'), function (chip) {
      var k = chip.getAttribute('data-m');
      var v = vals[k];
      var cls, txt;
      if (k === 'PAGE') {
        cls = v == null ? 'na' : (v <= 600000 ? 'good' : v <= 1500000 ? 'ok' : 'poor');
        txt = v == null ? '\u2014' : kb(v);
      } else if (k === 'CLS') {
        cls = rate('CLS', v);
        txt = v == null ? '\u2014' : v.toFixed(3);
      } else if (v == null) {
        cls = 'na';
        txt = k === 'INP' ? 'tap' : '\u2014';   /* INP needs an interaction */
      } else {
        cls = rate(k, v);
        txt = ms(v);
      }
      chip.className = 'wv-chip wv-' + cls;
      var out = chip.querySelector('.wv-chip-v');
      if (out) out.textContent = txt;
    });
  }

  function paint() {
    paintCard();
    if (!built || !overlay || !overlay.classList.contains('is-open')) return;
    render();
  }

  function render() {
    if (!SUPPORTED) {
      bodyEl.innerHTML = '<div class="wv-note">This browser does not expose the ' +
        '<b>PerformanceObserver</b> API, so these metrics cannot be measured here. ' +
        'Chrome, Edge and recent Safari all support it.</div>';
      return;
    }
    readNav();
    readResources();
    var b = M.bytes;

    var seg = function (v, c) {
      if (!b.total || !v) return '';
      return '<i style="width:' + (v / b.total * 100).toFixed(2) + '%;background:' + c + '"></i>';
    };

    bodyEl.innerHTML =
      '<div class="wv-sec">Core Web Vitals</div>' +
      row('LCP', 'Largest Contentful Paint',
          'When the main content finished rendering' + (M.LCP.el ? ' \u00b7 <' + M.LCP.el + '>' : ''),
          M.LCP.v) +
      row('CLS', 'Cumulative Layout Shift',
          'How much the layout moved unexpectedly',
          M.CLS.v, M.CLS.v ? rate('CLS', M.CLS.v) : 'good') +
      row('INP', 'Interaction to Next Paint',
          M.INP.v == null ? 'Tap or click anything to measure this'
                          : 'Slowest interaction response so far',
          M.INP.v) +

      '<div class="wv-sec">Loading</div>' +
      row('TTFB', 'Time to First Byte', 'Server response latency', M.TTFB.v) +
      row('FCP', 'First Contentful Paint', 'First text or image painted', M.FCP.v) +

      '<div class="wv-sec">Transferred \u00b7 ' + kb(b.total) + ' over ' + b.count + ' requests</div>' +
      '<div class="wv-bar">' +
        seg(b.html, '#4fe0a2') + seg(b.css, '#5ac8ff') +
        seg(b.js, '#a78bfa') + seg(b.img, '#ffcf6b') + seg(b.other, '#7a8ca3') +
      '</div>' +
      '<div class="wv-legend">' +
        '<span><i style="background:#4fe0a2"></i>HTML ' + kb(b.html) + '</span>' +
        '<span><i style="background:#5ac8ff"></i>CSS ' + kb(b.css) + '</span>' +
        '<span><i style="background:#a78bfa"></i>JS ' + kb(b.js) + '</span>' +
        '<span><i style="background:#ffcf6b"></i>Images ' + kb(b.img) + '</span>' +
        '<span><i style="background:#7a8ca3"></i>Other ' + kb(b.other) + '</span>' +
      '</div>' +

      '<div class="wv-note">These are live readings from this device on this visit \u2014 ' +
        'not stored numbers, and nothing is sent anywhere. <b>LCP</b> stops updating at your ' +
        'first interaction and <b>CLS</b> keeps accumulating while the page is open, so both ' +
        'are measured exactly the way Chrome measures them.</div>';
  }

  function open() {
    build();
    render();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) close();
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-web-vitals]');
    if (t) { e.preventDefault(); open(); }
  });

  window.openWebVitals  = open;
  window.closeWebVitals = close;
  window.getWebVitals   = function () {
    readNav(); readResources();
    return { LCP: M.LCP.v, CLS: M.CLS.v, INP: M.INP.v,
             FCP: M.FCP.v, TTFB: M.TTFB.v, bytes: M.bytes };
  };

  /* register with the command palette once it exists */
  function registerCmd() {
    if (typeof window.registerPaletteCommands !== 'function') return false;
    window.registerPaletteCommands([{
      t: 'Performance',
      s: 'This page\u2019s own Core Web Vitals, measured live',
      g: 'Action',
      k: 'performance vitals lcp cls inp speed lighthouse metrics',
      i: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
      run: function () { open(); return true; }
    }]);
    return true;
  }
  if (!registerCmd()) {
    /* palette may load after this file; retry briefly, then give up */
    var tries = 0;
    var iv = setInterval(function () {
      if (registerCmd() || ++tries > 40) clearInterval(iv);
    }, 150);
  }
})();
