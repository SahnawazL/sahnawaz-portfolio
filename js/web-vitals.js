/* ============================================================
   WEB VITALS  —  ByteWithSahnawaz
   This page measures its own performance and reports it honestly.

   Standalone. Injects its own CSS. No dependencies, no network calls,
   nothing stored or sent — every number is read from the browser's own
   Performance APIs on this device, during this visit.

   Surfaces:
     - the "This Page, Right Now" card  (#wvCard / #wvcBody in the page)
     - a full report popup  (command palette, [data-web-vitals], or
       window.openWebVitals())

   Load EARLY, in <head>. LCP, CLS and FCP cannot be observed
   retroactively; an observer attached after first paint loses them.
   ============================================================ */
(function () {
  'use strict';
  if (window.__webVitalsLoaded) return;
  window.__webVitalsLoaded = true;

  var SUPPORTED = typeof PerformanceObserver !== 'undefined';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- thresholds: [good, needs-improvement] ------------
     Web Vitals values are Google's published thresholds. PAGE is our
     own weight budget, labelled as such in the UI.                  */
  var T = {
    LCP : [2500, 4000],
    INP : [200, 500],
    CLS : [0.1, 0.25],
    FCP : [1800, 3000],
    TTFB: [800, 1800],
    PAGE: [600 * 1024, 1500 * 1024]
  };
  /* where each gauge ends: the "poor" zone gets a visible width */
  var SCALE = { LCP: 6000, INP: 750, CLS: 0.375, FCP: 4500, TTFB: 2700, PAGE: 2250 * 1024 };

  var NAMES = {
    LCP : 'Largest Contentful Paint',
    CLS : 'Cumulative Layout Shift',
    INP : 'Interaction to Next Paint',
    FCP : 'First Contentful Paint',
    TTFB: 'Time to First Byte',
    PAGE: 'Page Weight'
  };
  var MEANS = {
    LCP : 'When the main content finished rendering',
    CLS : 'How much the layout moved unexpectedly',
    INP : 'How fast the page answers a tap or click',
    FCP : 'When the first text or image appeared',
    TTFB: 'How fast the server started responding',
    PAGE: 'Total size of everything this page loaded'
  };

  var M = {
    LCP : { v: null, tag: '', snip: '' },
    INP : { v: null, type: '', target: '', delay: 0, proc: 0, pres: 0, count: 0 },
    CLS : { v: 0, shifts: 0, big: 0, src: '', dy: 0, dx: 0 },
    FCP : { v: null },
    TTFB: { v: null },
    NAV : { dcl: null, load: null, proto: '' },
    LT  : { count: 0, block: 0, longest: 0 },
    bytes: { html: 0, css: 0, js: 0, img: 0, font: 0, other: 0,
             total: 0, count: 0, cached: 0, top: [] }
  };

  function rate(k, v) {
    if (v == null || !T[k]) return 'na';
    return v <= T[k][0] ? 'good' : (v <= T[k][1] ? 'ok' : 'poor');
  }
  var TAG = { good: 'Good', ok: 'Needs work', poor: 'Poor', na: 'Pending' };

  /* ---------- element attribution ------------------------------ */
  function describeEl(el) {
    if (!el || !el.tagName) return '';
    var s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList && el.classList.length) s += '.' + el.classList[0];
    return s;
  }
  function snippetOf(el) {
    if (!el) return '';
    if (el.tagName === 'IMG') {
      return ((el.currentSrc || el.src || '').split('/').pop() || '').split('?')[0];
    }
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 46 ? t.slice(0, 44) + '\u2026' : t;
  }

  /* ---------- render scheduling --------------------------------
     Observers can fire in bursts; coalesce redraws into one frame. */
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(function () {
      queued = false;
      renderCard();
      if (overlay && overlay.classList.contains('is-open')) renderPanel();
    });
  }

  /* ---------- observers ---------------------------------------- */
  function observe(type, cb, extra) {
    if (!SUPPORTED) return null;
    try {
      var po = new PerformanceObserver(function (list) { list.getEntries().forEach(cb); });
      var opt = { type: type, buffered: true };
      if (extra) for (var k in extra) opt[k] = extra[k];
      po.observe(opt);
      return po;
    } catch (e) { return null; }
  }

  function onLCP(e) {
    M.LCP.v = e.renderTime || e.loadTime || e.startTime;
    M.LCP.tag = describeEl(e.element);
    M.LCP.snip = snippetOf(e.element);
    schedule();
  }
  var lcpPO = observe('largest-contentful-paint', onLCP);
  /* flush queued entries BEFORE disconnecting: a visitor who taps early
     would otherwise kill the observer while the entry was still pending */
  function finalizeLCP() {
    if (!lcpPO) return;
    try { (lcpPO.takeRecords ? lcpPO.takeRecords() : []).forEach(onLCP); } catch (e) {}
    try { lcpPO.disconnect(); } catch (e) {}
    lcpPO = null;
    schedule();
  }
  ['keydown', 'pointerdown', 'click'].forEach(function (t) {
    addEventListener(t, finalizeLCP, { once: true, capture: true });
  });

  /* CLS: largest session window (shifts <1s apart, window capped at 5s) */
  var clsCur = 0, clsFirst = 0, clsLast = 0;
  observe('layout-shift', function (e) {
    if (e.hadRecentInput) return;
    var t = e.startTime;
    if (clsCur && (t - clsLast > 1000 || t - clsFirst > 5000)) clsCur = 0;
    if (!clsCur) clsFirst = t;
    clsLast = t;
    clsCur += e.value;
    M.CLS.shifts++;
    if (clsCur > M.CLS.v) M.CLS.v = clsCur;
    /* remember the single biggest shift and the element that moved most
       in it — that is the thing to fix */
    if (e.value > M.CLS.big && e.sources && e.sources.length) {
      var best = null, far = -1;
      for (var i = 0; i < e.sources.length; i++) {
        var so = e.sources[i];
        if (!so.previousRect || !so.currentRect) continue;
        var d = Math.abs(so.currentRect.top - so.previousRect.top) +
                Math.abs(so.currentRect.left - so.previousRect.left);
        if (d > far) { far = d; best = so; }
      }
      if (best) {
        var node = best.node && best.node.nodeType === 3 ? best.node.parentElement : best.node;
        M.CLS.big = e.value;
        M.CLS.src = describeEl(node) || 'an element that has since been removed';
        M.CLS.dy = Math.round(best.currentRect.top - best.previousRect.top);
        M.CLS.dx = Math.round(best.currentRect.left - best.previousRect.left);
      }
    }
    schedule();
  });

  /* INP: only genuine interactions count. Event Timing also reports
     things like hover events that are not interactions; those carry
     interactionId 0 and must be ignored, or INP reads too high. */
  var seenInteractions = {};
  observe('event', function (e) {
    if (e.interactionId === 0) return;
    if (e.interactionId && !seenInteractions[e.interactionId]) {
      seenInteractions[e.interactionId] = 1;
      M.INP.count++;
    }
    var d = e.duration;
    if (d == null) return;
    if (M.INP.v == null || d > M.INP.v) {
      M.INP.v = d;
      M.INP.type = e.name || '';
      M.INP.target = describeEl(e.target);
      /* the three phases Chrome DevTools uses to explain INP */
      M.INP.delay = Math.max(0, (e.processingStart || e.startTime) - e.startTime);
      M.INP.proc  = Math.max(0, (e.processingEnd || e.processingStart || e.startTime) -
                                (e.processingStart || e.startTime));
      M.INP.pres  = Math.max(0, e.startTime + d - (e.processingEnd || e.startTime));
    }
    schedule();
  }, { durationThreshold: 16 });

  observe('paint', function (e) {
    if (e.name === 'first-contentful-paint') { M.FCP.v = e.startTime; schedule(); }
  });

  /* long tasks: main-thread work over 50 ms freezes input handling */
  observe('longtask', function (e) {
    M.LT.count++;
    M.LT.block += Math.max(0, e.duration - 50);
    if (e.duration > M.LT.longest) M.LT.longest = e.duration;
    schedule();
  });

  /* ---------- navigation + weight ------------------------------ */
  /* transferSize is 0 for cached files; fall back to body size so a
     repeat visit still shows real weight, and count the cache hits */
  function sizeOf(entry) {
    if (entry.transferSize) return { bytes: entry.transferSize, cached: false };
    var body = entry.encodedBodySize || entry.decodedBodySize || 0;
    return { bytes: body, cached: body > 0 };
  }
  function readNav() {
    try {
      var n = performance.getEntriesByType('navigation')[0];
      if (!n) return;
      M.TTFB.v = n.responseStart || null;
      M.NAV.dcl = n.domContentLoadedEventEnd || null;
      M.NAV.load = n.loadEventEnd || null;
      M.NAV.proto = n.nextHopProtocol || '';
      M.bytes.html = sizeOf(n).bytes;
    } catch (e) {}
  }
  function kindOf(url) {
    var u = (url || '').split('?')[0].split('#')[0];
    if (/\.css$/i.test(u)) return 'css';
    if (/\.m?js$/i.test(u)) return 'js';
    if (/\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(u)) return 'img';
    if (/\.(woff2?|ttf|otf)$/i.test(u) || /fonts\.(googleapis|gstatic)/.test(url)) return 'font';
    return 'other';
  }
  function readResources() {
    try {
      var b = M.bytes, files = [];
      b.css = b.js = b.img = b.font = b.other = 0;
      b.count = 0; b.cached = 0;
      performance.getEntriesByType('resource').forEach(function (r) {
        var info = sizeOf(r), k = kindOf(r.name);
        b[k] += info.bytes;
        b.count++;
        if (info.cached) b.cached++;
        if (info.bytes) {
          var nm = (r.name || '').split('?')[0].split('/').pop() || r.name;
          try { nm = decodeURIComponent(nm); } catch (e) {}
          /* Google Fonts serves hashed filenames; name the source instead */
          if (/fonts\.gstatic\.com/.test(r.name)) {
            nm = 'Google Fonts \u00b7 ' + (nm.split('.').pop() || 'font').toUpperCase();
          }
          files.push({ name: nm, bytes: info.bytes, kind: k });
        }
      });
      files.sort(function (a, z) { return z.bytes - a.bytes; });
      b.top = files.slice(0, 5);
      b.total = b.html + b.css + b.js + b.img + b.font + b.other;
    } catch (e) {}
  }
  readNav();
  addEventListener('load', function () { setTimeout(function () { readNav(); readResources(); schedule(); }, 0); });

  /* ---------- device context ----------------------------------- */
  function context() {
    var parts = [], ua = navigator.userAgent || '', d = navigator.userAgentData;
    var os = d && d.platform ? d.platform
      : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS'
      : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '';
    if (os) parts.push(os);
    var br = '';
    if (d && d.brands) {
      d.brands.forEach(function (x) {
        if (!br && !/Not.?A.?Brand|Chromium/i.test(x.brand)) br = x.brand + ' ' + x.version;
      });
    }
    if (!br) {
      var m = ua.match(/(Edg|OPR|SamsungBrowser|Firefox|Chrome|Version)\/(\d+)/);
      if (m) br = ({ Edg: 'Edge', OPR: 'Opera', Version: 'Safari' }[m[1]] || m[1]) + ' ' + m[2];
    }
    if (br) parts.push(br);
    var c = navigator.connection;
    if (c && c.effectiveType) parts.push(c.effectiveType.toUpperCase() + '-class network');
    if (navigator.hardwareConcurrency) parts.push(navigator.hardwareConcurrency + ' CPU cores');
    if (M.NAV.proto) parts.push(M.NAV.proto.toUpperCase().replace('H2', 'HTTP/2').replace('H3', 'HTTP/3'));
    return parts;
  }

  /* ---------- formatting --------------------------------------- */
  function ms(v) {
    if (v == null) return '\u2014';
    return v < 1000 ? Math.round(v) + ' ms' : (v / 1000).toFixed(2) + ' s';
  }
  function kb(n) {
    if (!n) return '0 KB';
    return n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(2) + ' MB';
  }
  function parts(k, v) {                       /* value + unit, split for styling */
    if (v == null) return ['\u2014', ''];
    if (k === 'CLS') return [v.toFixed(3), ''];
    if (k === 'PAGE') {
      return v < 1048576 ? [String(Math.round(v / 1024)), 'KB'] : [(v / 1048576).toFixed(2), 'MB'];
    }
    return v < 1000 ? [String(Math.round(v)), 'ms'] : [(v / 1000).toFixed(2), 's'];
  }
  function goal(k) {
    if (k === 'CLS')  return 'good \u2264 0.1';
    if (k === 'PAGE') return 'budget 600 KB';
    var g = T[k][0];
    return 'good \u2264 ' + (g >= 1000 ? (g / 1000) + ' s' : g + ' ms');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* ---------- shared components -------------------------------- */
  function gauge(k, v) {
    var max = SCALE[k], g = T[k][0] / max * 100, o = (T[k][1] - T[k][0]) / max * 100;
    return '<div class="wvg" role="img" aria-label="' + esc(NAMES[k]) + ' position on the scale">' +
             '<i class="wvg-g" style="width:' + g.toFixed(2) + '%"></i>' +
             '<i class="wvg-o" style="width:' + o.toFixed(2) + '%"></i>' +
             '<i class="wvg-p" style="width:' + (100 - g - o).toFixed(2) + '%"></i>' +
             (v == null ? '' : '<b class="wvg-mk" style="left:' +
               clamp(v / max * 100, 1.5, 98.5).toFixed(2) + '%"></b>') +
           '</div>';
  }

  function verdict() {
    var keys = ['LCP', 'CLS', 'INP'];
    var missing = keys.filter(function (k) { return M[k].v == null; });
    var weak = keys.filter(function (k) { return M[k].v != null && rate(k, M[k].v) !== 'good'; });
    var state, head, body;
    if (weak.length) {
      state = 'warn';
      head = 'Needs work';
      body = weak.map(function (k) {
        return k + ' ' + (k === 'CLS' ? M[k].v.toFixed(3) : ms(M[k].v)) + ' is above the ' +
               (k === 'CLS' ? '0.1' : ms(T[k][0])) + ' target';
      }).join(' \u00b7 ');
    } else if (missing.length) {
      state = 'pending';
      head = (3 - missing.length) + ' of 3 passing';
      body = missing.indexOf('INP') > -1 && missing.length === 1
        ? 'INP needs one tap or click to finish the assessment'
        : missing.join(' and ') + ' still being measured';
    } else {
      state = 'pass';
      head = 'Passes Core Web Vitals';
      body = 'LCP, CLS and INP are all in the good range';
    }
    var icon = state === 'pass'
      ? '<path d="M20 6 9 17l-5-5"/>'
      : state === 'warn' ? '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
      : '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
    return '<div class="wvv is-' + state + '">' +
             '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
               'stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg>' +
             '<span><b>' + esc(head) + '</b><em>' + esc(body) + '</em></span>' +
           '</div>';
  }

  /* Always five rows. Stages that haven't happened yet show a dash and an
     empty bar instead of being left out — otherwise the timeline grows
     a row at a time as values arrive, pushing everything below it down
     the screen, which is itself a layout shift. */
  function timeline() {
    var all = [
      ['Server response', 'TTFB', M.TTFB.v, 'TTFB'],
      ['First paint', 'FCP', M.FCP.v, 'FCP'],
      ['DOM ready', 'DCL', M.NAV.dcl, null],
      ['Main content', 'LCP', M.LCP.v, 'LCP'],
      ['Fully loaded', 'Load', M.NAV.load, null]
    ];
    var has = function (x) { return x[2] != null && x[2] > 0; };
    var known = all.filter(has).sort(function (a, z) { return a[2] - z[2]; });
    var rows = known.concat(all.filter(function (x) { return !has(x); }));
    var max = known.length ? known[known.length - 1][2] * 1.04 : 1;
    return '<div class="wvt">' +
      rows.map(function (x) {
        var k = has(x), r = k ? (x[3] ? rate(x[3], x[2]) : 'n') : 'na';
        return '<div class="wvt-row">' +
                 '<span class="wvt-l">' + esc(x[0]) + '<em>' + esc(x[1]) + '</em></span>' +
                 '<span class="wvt-track"><i class="is-' + r + '" style="width:' +
                   (k ? clamp(x[2] / max * 100, 2, 100).toFixed(2) : '0') + '%"></i></span>' +
                 '<span class="wvt-v">' + (k ? ms(x[2]) : '\u2014') + '</span>' +
               '</div>';
      }).join('') +
    '</div>';
  }

  /* ---------- the in-page card --------------------------------- */
  function chip(k, v) {
    var r = rate(k, v), p = parts(k, v);
    var shown = (k === 'INP' && v == null) ? ['tap', ''] : p;
    return '<div class="wvc-chip is-' + r + '">' +
             '<div class="wvc-top"><span class="wvc-abbr">' + (k === 'PAGE' ? 'SIZE' : k) + '</span>' +
               '<span class="wvc-tag">' + (k === 'INP' && v == null ? 'Tap to test' : TAG[r]) + '</span></div>' +
             '<div class="wvc-full">' + esc(NAMES[k]) + '</div>' +
             /* the unit element is always present, empty or not, so the chip's
                structure never changes as values arrive */
             '<div class="wvc-val">' + esc(shown[0]) + '<small>' + (shown[1] || '') + '</small></div>' +
             gauge(k, v) +
             '<div class="wvc-goal">' + goal(k) + '</div>' +
           '</div>';
  }

  function renderCard() {
    var host = $('wvcBody');
    if (!host) return;
    readNav(); readResources();
    if (!SUPPORTED) {
      host.innerHTML = '<div class="wvc-note">This browser does not expose the Performance ' +
                       'Observer API, so live vitals cannot be measured here.</div>';
      return;
    }
    host.innerHTML =
      verdict() +
      '<div class="wvc-grid">' +
        chip('LCP', M.LCP.v) + chip('CLS', M.CLS.v) +
        /* Fourth chip is FCP, not page weight. Every chip is graded against
           Google's published thresholds; weight has no official standard,
           and its real cost already shows up in FCP and LCP. Weight is
           still reported, neutrally, in the full report. */
        chip('INP', M.INP.v) + chip('FCP', M.FCP.v) +
      '</div>' +
      '<div class="wvc-sec">Load timeline</div>' + timeline() +
      '<div class="wvc-ctx">' + context().map(esc).join('<i></i>') + '</div>';
  }

  /* ---------- styles ------------------------------------------- */
  /* Every rule is scoped under an ID and marked !important, because the
     site's hacker mode forces colour, background and font on every
     element with !important. Keyframes cannot take !important, so they
     live in a separate string that is not transformed.              */
  var KEYFRAMES = [
    '@keyframes wvFade{from{opacity:0}to{opacity:1}}',
    '@keyframes wvRise{from{opacity:0;transform:translateY(-14px) scale(.98)}to{opacity:1;transform:none}}',
    '@keyframes wvPulse{0%{box-shadow:0 0 0 0 rgba(79,224,162,.55)}70%{box-shadow:0 0 0 9px rgba(79,224,162,0)}100%{box-shadow:0 0 0 0 rgba(79,224,162,0)}}'
  ].join('\n');

  var SHARED = ".wvg{position:relative;display:flex;height:5px;border-radius:4px;overflow:visible;margin-top:9px}.wvg i{display:block;height:100%}.wvg-g{background-color:rgba(79,224,162,.55);border-radius:4px 0 0 4px}.wvg-o{background-color:rgba(255,207,107,.45)}.wvg-p{background-color:rgba(255,122,122,.42);border-radius:0 4px 4px 0}.wvg-mk{position:absolute;top:50%;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;  background-color:#eaf6ff;border:2px solid #0b1422;box-shadow:0 0 0 1px rgba(234,246,255,.55),0 0 10px rgba(234,246,255,.45)}.wvv{display:flex;align-items:flex-start;gap:11px;padding:11px 13px;border-radius:12px;border:1px solid transparent;text-align:left}.wvv svg{width:18px;height:18px;flex:none;margin-top:1px}.wvv span{min-width:0}.wvv b{display:block;font-size:.84rem;font-weight:700;letter-spacing:.2px}.wvv em{display:block;font-style:normal;font-size:.72rem;line-height:1.45;margin-top:2px;color:rgba(200,225,242,.66)}.wvv.is-pass{background-color:rgba(79,224,162,.08);border-color:rgba(79,224,162,.28);color:#6ff0bb}.wvv.is-warn{background-color:rgba(255,207,107,.08);border-color:rgba(255,207,107,.28);color:#ffd884}.wvv.is-pending{background-color:rgba(120,200,255,.07);border-color:rgba(120,200,255,.22);color:#8ad8ff}.wvt{display:flex;flex-direction:column;gap:7px}.wvt-row{display:flex;align-items:center;gap:10px}.wvt-l{flex:0 0 40%;min-width:0;font-size:.74rem;color:rgba(205,228,244,.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}.wvt-l em{font-style:normal;font-family:' + MONO + ';font-size:.62rem;margin-left:6px;color:rgba(150,200,230,.5)}.wvt-track{flex:1;height:6px;border-radius:4px;background-color:rgba(120,200,255,.08);overflow:hidden}.wvt-track i{display:block;height:100%;border-radius:4px}.wvt-track i.is-good{background-color:#4fe0a2}.wvt-track i.is-ok{background-color:#ffcf6b}.wvt-track i.is-poor{background-color:#ff7a7a}.wvt-track i.is-n,.wvt-track i.is-na{background-color:#5ac8ff}.wvt-v{flex:0 0 58px;text-align:right;font-family:' + MONO + ';font-size:.72rem;font-weight:600;color:rgba(220,238,250,.88)}";
  /* shared pieces live inside both the card and the popup. They must
     carry an ID, or the ID-level reset below (which clears background on
     every descendant for hacker mode) would out-rank them and blank the
     gauge colours even in normal mode. */
  function scopeShared(css) {
    return css.replace(/([^{}]+)\{([^{}]*)\}/g, function (m, sel, decls) {
      var out = sel.split(',').map(function (x) {
        x = x.trim();
        return '#wvCard ' + x + ',#wv-overlay ' + x;
      }).join(',');
      return out + '{' + decls + '}';
    });
  }
  var FONT = "Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  var MONO = "ui-monospace,'SF Mono','JetBrains Mono','Fira Code',Menlo,monospace";

  var RULES = [
/* --- shared primitives (card + panel) --- */
'#wvCard,#wvCard *,#wv-overlay,#wv-overlay *{font-family:' + FONT + ';background-color:transparent;color:inherit;box-sizing:border-box}',
scopeShared(SHARED),
/* --- the card --- */
'#wvCard{margin:18px 0 26px;padding:17px;border-radius:16px;text-align:left;position:relative;',
'  background:linear-gradient(180deg,rgba(16,27,44,.82),rgba(9,16,28,.82));',
'  border:1px solid rgba(120,205,255,.17);box-shadow:0 18px 40px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)}',
'#wvCard::before{content:"";position:absolute;top:0;left:14%;right:14%;height:1px;',
'  background:linear-gradient(90deg,transparent,rgba(120,220,255,.5),transparent)}',
'#wvCard .wvc-head{display:flex;align-items:center;gap:12px}',
'#wvCard .wvc-title{flex:1;min-width:0;display:flex;align-items:center;gap:10px;font-size:1rem;font-weight:700;color:#eaf6ff;letter-spacing:.2px}',
'#wvCard .wvc-dot{width:8px;height:8px;border-radius:50%;flex:none;background-color:#4fe0a2;animation:wvPulse 2.4s ease-out infinite}',
'#wvCard .wvc-btn{flex:none;padding:7px 13px;border-radius:9px;cursor:pointer;font-size:.74rem;font-weight:600;',
'  color:#dff2ff;background-color:rgba(120,200,255,.10);border:1px solid rgba(130,200,240,.3);transition:background-color .17s ease,border-color .17s ease}',
'#wvCard .wvc-btn:hover{background-color:rgba(120,200,255,.2);border-color:rgba(140,210,245,.5)}',
'#wvCard .wvc-sub{margin:9px 0 14px;font-size:.78rem;line-height:1.55;color:rgba(172,208,233,.6);text-align:left}',
'#wvCard .wvc-sub b{color:#dcefff;font-weight:600}',
'#wvCard .wvc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 4px}',
'#wvCard .wvc-chip{padding:12px 12px 11px;border-radius:13px;background-color:rgba(120,200,255,.045);border:1px solid rgba(120,200,255,.12);min-width:0}',
'#wvCard .wvc-chip.is-good{border-color:rgba(79,224,162,.3);background-color:rgba(79,224,162,.06)}',
'#wvCard .wvc-chip.is-ok{border-color:rgba(255,207,107,.32);background-color:rgba(255,207,107,.06)}',
'#wvCard .wvc-chip.is-poor{border-color:rgba(255,122,122,.34);background-color:rgba(255,122,122,.07)}',
'#wvCard .wvc-top{display:flex;align-items:center;justify-content:space-between;gap:6px}',
'#wvCard .wvc-abbr{font-family:' + MONO + ';font-size:.68rem;font-weight:700;letter-spacing:.12em;color:#9fdcff}',
'#wvCard .wvc-tag{font-size:.55rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 6px;border-radius:5px;',
'  color:rgba(180,210,232,.7);background-color:rgba(150,190,220,.1);white-space:nowrap}',
'#wvCard .is-good .wvc-tag{color:#6ff0bb;background-color:rgba(79,224,162,.14)}',
'#wvCard .is-ok .wvc-tag{color:#ffd884;background-color:rgba(255,207,107,.14)}',
'#wvCard .is-poor .wvc-tag{color:#ff9a9a;background-color:rgba(255,122,122,.15)}',
'#wvCard .wvc-full{margin-top:5px;font-size:.68rem;line-height:1.3;color:rgba(172,208,233,.6);min-height:1.8em}',
'#wvCard .wvc-val{margin-top:7px;font-family:' + MONO + ';font-size:1.3rem;font-weight:700;letter-spacing:-.3px;color:#e8f5ff;line-height:1}',
'#wvCard .wvc-val small{font-family:' + MONO + ';font-size:.62em;font-weight:600;margin-left:3px;color:rgba(200,225,242,.6)}',
'#wvCard .is-good .wvc-val{color:#5fe8ad}',
'#wvCard .is-ok .wvc-val{color:#ffd884}',
'#wvCard .is-poor .wvc-val{color:#ff9a9a}',
'#wvCard .wvc-goal{margin-top:7px;font-family:' + MONO + ';font-size:.6rem;color:rgba(150,195,225,.48)}',
'#wvCard .wvc-sec{margin:16px 0 9px;display:flex;align-items:center;gap:9px;font-size:.58rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(150,200,230,.45)}',
'#wvCard .wvc-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(120,200,255,.18),transparent)}',
'#wvCard .wvc-ctx{margin-top:14px;padding-top:11px;border-top:1px solid rgba(120,200,255,.1);display:flex;flex-wrap:nowrap;align-items:center;',
'  overflow-x:auto;white-space:nowrap;scrollbar-width:none;line-height:1.6;min-height:calc(1.6em + 12px);',
'  font-family:' + MONO + ';font-size:.62rem;color:rgba(160,200,228,.55)}',
'#wvCard .wvc-ctx i{display:inline-block;width:3px;height:3px;border-radius:50%;margin:0 9px;background-color:rgba(150,200,230,.35)}',
/* fixed heights for text that changes: a sentence that wraps to one more
   line would push everything below it down, which is a layout shift */
'#wvCard .wvc-ctx::-webkit-scrollbar{display:none}',
'#wvCard .wvc-ctx i{flex:none}',
'#wvCard .wvv em{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.9em}',
'#wvCard .wvc-note{font-size:.76rem;color:rgba(172,208,233,.6)}',

/* --- the popup --- */
'#wv-overlay{position:fixed;inset:0;z-index:100210;display:none;align-items:flex-start;justify-content:center;padding:8vh 16px 16px;',
'  background:radial-gradient(120% 90% at 50% 0%,rgba(8,20,34,.82),rgba(2,7,14,.9));',
'  backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2)}',
'#wv-overlay.is-open{display:flex;animation:wvFade .18s ease both}',
'#wv-box{width:100%;max-width:600px;position:relative;display:flex;flex-direction:column;max-height:84vh;overflow:hidden;color:#d2e8f8;',
'  background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99));border:1px solid rgba(120,205,255,.2);border-radius:18px;',
'  box-shadow:0 40px 90px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,255,255,.05);animation:wvRise .22s cubic-bezier(.2,.85,.3,1) both}',
'#wv-box::before{content:"";position:absolute;top:0;left:12%;right:12%;height:1px;background:linear-gradient(90deg,transparent,rgba(120,220,255,.55),transparent)}',
'#wv-head{display:flex;align-items:center;gap:11px;padding:16px;border-bottom:1px solid rgba(120,205,255,.12);flex:0 0 auto}',
'#wv-head>svg{width:19px;height:19px;flex:none;color:#8ad8ff}',
'#wv-title{flex:1;min-width:0}',
'#wv-title b{display:block;font-size:.98rem;font-weight:700;color:#eaf6ff}',
'#wv-title span{display:block;font-size:.72rem;color:rgba(172,208,233,.55);margin-top:2px}',
'#wv-close{flex:none;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;cursor:pointer;',
'  color:rgba(190,222,242,.8);background-color:rgba(130,200,240,.08);border:1px solid rgba(140,200,235,.24);transition:background-color .16s ease}',
'#wv-close:hover{background-color:rgba(130,200,240,.18);color:#fff}',
'#wv-close svg{width:15px;height:15px}',
'#wv-body{overflow-y:auto;padding:14px 16px 18px;flex:1 1 auto;overscroll-behavior:contain;text-align:left}',
'#wv-body .wv-sec{margin:20px 0 10px;display:flex;align-items:center;gap:9px;font-size:.58rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(150,200,230,.45)}',
'#wv-body .wv-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(120,200,255,.18),transparent)}',
'#wv-body .wv-row{padding:11px 0 13px;border-bottom:1px solid rgba(120,200,255,.07)}',
'#wv-body .wv-row:last-child{border-bottom:none}',
'#wv-body .wv-line{display:flex;align-items:center;gap:12px}',
'#wv-body .wv-k{flex:1;min-width:0}',
'#wv-body .wv-k b{display:block;font-size:.86rem;font-weight:600;color:#e2f1fc}',
'#wv-body .wv-k b code{font-family:' + MONO + ';font-size:.72em;font-weight:700;margin-left:7px;padding:1px 5px;border-radius:4px;color:#9fdcff;background-color:rgba(120,200,255,.1)}',
'#wv-body .wv-k span{display:block;font-size:.71rem;line-height:1.4;margin-top:2px;color:rgba(172,208,233,.55)}',
'#wv-body .wv-v{flex:none;font-family:' + MONO + ';font-size:.95rem;font-weight:700;text-align:right;min-width:74px}',
'#wv-body .wv-pill{flex:none;font-size:.55rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 7px;border-radius:5px;min-width:70px;text-align:center}',
'#wv-body .is-good .wv-v{color:#4fe0a2}',
'#wv-body .is-good .wv-pill{color:#6ff0bb;background-color:rgba(79,224,162,.14)}',
'#wv-body .is-ok .wv-v{color:#ffcf6b}',
'#wv-body .is-ok .wv-pill{color:#ffd884;background-color:rgba(255,207,107,.14)}',
'#wv-body .is-poor .wv-v{color:#ff7a7a}',
'#wv-body .is-poor .wv-pill{color:#ff9a9a;background-color:rgba(255,122,122,.15)}',
'#wv-body .is-na .wv-v{color:rgba(170,205,230,.42)}',
'#wv-body .is-na .wv-pill{color:rgba(175,210,235,.6);background-color:rgba(150,190,220,.1)}',
'#wv-body .wv-attr{margin-top:10px;padding:10px 12px;border-radius:10px;background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.11)}',
'#wv-body .wv-attr-h{font-size:.72rem;color:rgba(190,220,240,.72);line-height:1.5}',
'#wv-body .wv-attr-h code{font-family:' + MONO + ';font-size:.95em;color:#9fdcff;padding:0 4px;border-radius:3px;background-color:rgba(120,200,255,.1)}',
'#wv-body .wv-phase{display:flex;height:8px;border-radius:5px;overflow:hidden;margin:9px 0 7px;background-color:rgba(120,200,255,.07)}',
'#wv-body .wv-phase i{display:block;height:100%}',
'#wv-body .wv-legend{display:flex;flex-wrap:wrap;gap:8px 15px;font-size:.68rem;color:rgba(172,208,233,.64)}',
'#wv-body .wv-legend span{display:flex;align-items:center;gap:6px}',
'#wv-body .wv-legend i{width:9px;height:9px;border-radius:3px;flex:none}',
'#wv-body .wv-legend b{font-family:' + MONO + ';font-weight:600;color:rgba(220,238,250,.86)}',
'#wv-body .wv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}',
'#wv-body .wv-stat{padding:10px;border-radius:11px;background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.11)}',
'#wv-body .wv-stat b{display:block;font-family:' + MONO + ';font-size:1rem;font-weight:700;color:#e2f1fc}',
'#wv-body .wv-stat span{display:block;font-size:.62rem;margin-top:3px;color:rgba(172,208,233,.55);line-height:1.35}',
'#wv-body .wv-files{margin-top:10px}',
'#wv-body .wv-file{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:.72rem;border-bottom:1px dashed rgba(120,200,255,.08)}',
'#wv-body .wv-file:last-child{border-bottom:none}',
'#wv-body .wv-file i{width:8px;height:8px;border-radius:2px;flex:none}',
'#wv-body .wv-file span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:' + MONO + ';color:rgba(205,228,244,.8)}',
'#wv-body .wv-file b{flex:none;font-family:' + MONO + ';font-weight:600;color:rgba(220,238,250,.86)}',
'#wv-body .wv-bar{display:flex;height:9px;border-radius:5px;overflow:hidden;margin:4px 0 9px;background-color:rgba(120,200,255,.07)}',
'#wv-body .wv-bar i{display:block;height:100%}',
'#wv-body .wv-note{margin-top:18px;padding:11px 13px;border-radius:10px;font-size:.72rem;line-height:1.6;',
'  color:rgba(178,212,236,.66);background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.12)}',
'#wv-body .wv-note b{color:#dcefff;font-weight:600}',
'#wv-body .wv-actions{display:flex;gap:9px;margin-top:14px}',
'#wv-body .wv-act{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;border-radius:10px;cursor:pointer;',
'  font-size:.76rem;font-weight:600;color:#dff2ff;background-color:rgba(120,200,255,.1);border:1px solid rgba(130,200,240,.28);transition:background-color .16s ease}',
'#wv-body .wv-act:hover{background-color:rgba(120,200,255,.2)}',
'#wv-body .wv-act svg{width:14px;height:14px}',
'#wv-body .wv-act.is-done{color:#6ff0bb;border-color:rgba(79,224,162,.4);background-color:rgba(79,224,162,.12)}',

/* --- responsive --- */
'@media (max-width:640px){',
'  #wvCard{padding:15px}',
'  #wvCard .wvc-grid{grid-template-columns:repeat(2,1fr);gap:9px}',
'  #wvCard .wvc-val{font-size:1.2rem}',
'  #wvCard .wvc-title{font-size:.95rem}',
'  #wv-overlay{padding:4vh 10px 10px}',
'  #wv-box{max-height:90vh;border-radius:16px}',
'  #wv-body .wv-v{font-size:.88rem;min-width:62px}',
'  #wv-body .wv-pill{min-width:62px}',
'  #wvCard .wvt-l,#wv-overlay .wvt-l{flex-basis:44%}',
'}',
'@media (prefers-reduced-motion:reduce){',
'  #wvCard .wvc-dot,#wv-overlay.is-open,#wv-box{animation:none}',
'}'
  ].join('\n');

  /* add !important to every declaration (keyframes are kept separate) */
  function important(css) {
    return css.replace(/([a-z-]+\s*:\s*[^;{}]+?)\s*(;|})/g, function (m, decl, end) {
      return (/!important$/.test(decl) ? decl : decl + ' !important') + end;
    });
  }

  function injectStyles() {
    if ($('wv-style')) return;
    var st = document.createElement('style');
    st.id = 'wv-style';
    st.textContent = KEYFRAMES + '\n' + important(RULES);
    (document.head || document.documentElement).appendChild(st);
  }
  injectStyles();

  /* ---------- popup -------------------------------------------- */
  var overlay, bodyEl;

  function buildPanel() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'wv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Performance report');
    overlay.innerHTML =
      '<div id="wv-box">' +
        '<div id="wv-head">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/></svg>' +
          '<span id="wv-title"><b>Performance Report</b><span>Measured live on your device, this visit</span></span>' +
          '<button id="wv-close" type="button" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="wv-body"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    bodyEl = $('wv-body');
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    $('wv-close').addEventListener('click', close);
    bodyEl.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-wv-copy]');
      if (b) copyReport(b);
    });
  }

  function row(k, v, sub) {
    var r = rate(k, v), shown = k === 'CLS' ? (v == null ? '\u2014' : v.toFixed(3)) : ms(v);
    var tag = (k === 'INP' && v == null) ? 'Tap to test' : TAG[r];
    return '<div class="wv-row is-' + r + '">' +
             '<div class="wv-line">' +
               '<span class="wv-k"><b>' + esc(NAMES[k]) + '<code>' + k + '</code></b>' +
                 '<span>' + esc(sub || MEANS[k]) + '</span></span>' +
               '<span class="wv-v">' + shown + '</span>' +
               '<span class="wv-pill">' + tag + '</span>' +
             '</div>' +
             gauge(k, v) +
           '</div>';
  }

  function renderPanel() {
    if (!bodyEl) return;
    readNav(); readResources();
    if (!SUPPORTED) {
      bodyEl.innerHTML = '<div class="wv-note">This browser does not expose the <b>PerformanceObserver</b> ' +
                         'API, so these metrics cannot be measured here. Chrome, Edge and recent Safari support it.</div>';
      return;
    }
    var b = M.bytes, I = M.INP;

    /* INP attribution: which element, which event, and where the time went */
    var inpAttr = '';
    if (I.v != null) {
      var tot = I.delay + I.proc + I.pres || I.v;
      var seg = function (x, c) { return '<i style="width:' + (x / tot * 100).toFixed(2) + '%;background-color:' + c + ' !important"></i>'; };
      inpAttr = '<div class="wv-attr">' +
        '<div class="wv-attr-h">Slowest of ' + Math.max(1, I.count) + ' interaction' + (I.count === 1 ? '' : 's') +
          ': <code>' + esc(I.type || 'input') + '</code>' +
          (I.target ? ' on <code>' + esc(I.target) + '</code>' : '') + '</div>' +
        '<div class="wv-phase">' + seg(I.delay, '#5ac8ff') + seg(I.proc, '#a78bfa') + seg(I.pres, '#ffcf6b') + '</div>' +
        '<div class="wv-legend">' +
          '<span><i style="background-color:#5ac8ff !important"></i>Input delay <b>' + ms(I.delay) + '</b></span>' +
          '<span><i style="background-color:#a78bfa !important"></i>Processing <b>' + ms(I.proc) + '</b></span>' +
          '<span><i style="background-color:#ffcf6b !important"></i>Rendering <b>' + ms(I.pres) + '</b></span>' +
        '</div></div>';
    }

    var lcpSub = MEANS.LCP + (M.LCP.tag ? ' \u00b7 element ' + M.LCP.tag : '');
    var lcpAttr = M.LCP.snip
      ? '<div class="wv-attr"><div class="wv-attr-h">Largest element: <code>' + esc(M.LCP.tag) + '</code> \u201c' +
        esc(M.LCP.snip) + '\u201d</div></div>'
      : '';

    var seg2 = function (v, c) {
      return (!b.total || !v) ? '' : '<i style="width:' + (v / b.total * 100).toFixed(2) + '%;background-color:' + c + ' !important"></i>';
    };
    var COLORS = { html: '#4fe0a2', css: '#5ac8ff', js: '#a78bfa', img: '#ffcf6b', font: '#f59ec8', other: '#7a8ca3' };

    bodyEl.innerHTML =
      verdict() +

      '<div class="wv-sec">Core Web Vitals</div>' +
      row('LCP', M.LCP.v, lcpSub) + lcpAttr.replace('<div class="wv-attr">', '<div class="wv-attr" style="margin:-4px 0 6px">') +
      row('CLS', M.CLS.v, MEANS.CLS + ' \u00b7 ' + M.CLS.shifts + ' shift' + (M.CLS.shifts === 1 ? '' : 's') + ' recorded') +
      (M.CLS.src ? '<div class="wv-attr" style="margin:-4px 0 6px"><div class="wv-attr-h">Biggest single shift (' +
        M.CLS.big.toFixed(3) + '): <code>' + esc(M.CLS.src) + '</code> moved ' +
        (M.CLS.dy ? Math.abs(M.CLS.dy) + ' px ' + (M.CLS.dy > 0 ? 'down' : 'up') : '') +
        (M.CLS.dy && M.CLS.dx ? ' and ' : '') +
        (M.CLS.dx ? Math.abs(M.CLS.dx) + ' px ' + (M.CLS.dx > 0 ? 'right' : 'left') : '') +
        '</div></div>' : '') +
      row('INP', I.v, I.v == null ? 'Tap or click anything on the page to measure this' : MEANS.INP) +
      inpAttr +

      '<div class="wv-sec">Loading</div>' +
      row('TTFB', M.TTFB.v) + row('FCP', M.FCP.v) +

      '<div class="wv-sec">Load timeline</div>' + timeline() +

      '<div class="wv-sec">Main thread</div>' +
      '<div class="wv-stats">' +
        '<div class="wv-stat"><b>' + M.LT.count + '</b><span>Long tasks over 50 ms</span></div>' +
        '<div class="wv-stat"><b>' + ms(M.LT.block) + '</b><span>Time input was blocked</span></div>' +
        '<div class="wv-stat"><b>' + (M.LT.longest ? ms(M.LT.longest) : '\u2014') + '</b><span>Longest single task</span></div>' +
      '</div>' +

      '<div class="wv-sec">' + (b.cached ? 'Page weight' : 'Transferred') + ' \u00b7 ' + kb(b.total) +
        ' \u00b7 ' + b.count + ' requests' + (b.cached ? ' \u00b7 ' + b.cached + ' cached' : '') + '</div>' +
      '<div class="wv-bar">' + seg2(b.html, COLORS.html) + seg2(b.css, COLORS.css) + seg2(b.js, COLORS.js) +
        seg2(b.img, COLORS.img) + seg2(b.font, COLORS.font) + seg2(b.other, COLORS.other) + '</div>' +
      '<div class="wv-legend">' +
        ['html', 'css', 'js', 'img', 'font', 'other'].map(function (k) {
          var label = { html: 'HTML', css: 'CSS', js: 'JS', img: 'Images', font: 'Fonts', other: 'Other' }[k];
          return '<span><i style="background-color:' + COLORS[k] + ' !important"></i>' + label + ' <b>' + kb(b[k]) + '</b></span>';
        }).join('') +
      '</div>' +
      (b.top.length ? '<div class="wv-files">' + b.top.map(function (f) {
        return '<div class="wv-file"><i style="background-color:' + COLORS[f.kind] + ' !important"></i><span>' + esc(f.name) +
               '</span><b>' + kb(f.bytes) + '</b></div>';
      }).join('') + '</div>' : '') +

      '<div class="wv-note">Live readings from <b>' + esc(context().slice(0, 2).join(' \u00b7 ') || 'this device') +
        '</b> on this visit \u2014 nothing is stored or sent anywhere. <b>LCP</b> is final at your first interaction, ' +
        '<b>CLS</b> uses Chrome\u2019s session-window method, and <b>INP</b> counts genuine interactions only.' +
        (b.cached ? ' ' + b.cached + ' file(s) came from your browser cache, so their decoded size is shown.' : '') +
      '</div>' +
      '<div class="wv-actions">' +
        '<button type="button" class="wv-act" data-wv-copy>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
          '<span>Copy JSON report</span></button>' +
      '</div>';
  }

  /* ---------- JSON report -------------------------------------- */
  function report() {
    readNav(); readResources();
    var r = function (k, v) { return { value: v == null ? null : +(+v).toFixed(k === 'CLS' ? 4 : 1), rating: rate(k, v) }; };
    return {
      url: location.href,
      measuredAt: new Date().toISOString(),
      environment: context(),
      coreWebVitals: { LCP: r('LCP', M.LCP.v), CLS: r('CLS', M.CLS.v), INP: r('INP', M.INP.v) },
      loading: { TTFB: r('TTFB', M.TTFB.v), FCP: r('FCP', M.FCP.v),
                 domContentLoaded: M.NAV.dcl, loadEvent: M.NAV.load },
      attribution: {
        lcpElement: M.LCP.tag || null,
        largestShift: M.CLS.src ? { element: M.CLS.src, score: +M.CLS.big.toFixed(4),
                                    movedY: M.CLS.dy, movedX: M.CLS.dx } : null,
        slowestInteraction: M.INP.v == null ? null : {
          event: M.INP.type, target: M.INP.target,
          inputDelay: +M.INP.delay.toFixed(1), processing: +M.INP.proc.toFixed(1),
          presentation: +M.INP.pres.toFixed(1), interactions: M.INP.count
        }
      },
      mainThread: { longTasks: M.LT.count, blockingTime: +M.LT.block.toFixed(1), longestTask: +M.LT.longest.toFixed(1) },
      weight: { total: M.bytes.total, html: M.bytes.html, css: M.bytes.css, js: M.bytes.js,
                images: M.bytes.img, fonts: M.bytes.font, other: M.bytes.other,
                requests: M.bytes.count, fromCache: M.bytes.cached, heaviest: M.bytes.top }
    };
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      try {
        var ta = document.createElement('textarea');
        ta.value = t; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
        var done = document.execCommand('copy');
        document.body.removeChild(ta);
        done ? ok() : no(new Error('copy failed'));
      } catch (e) { no(e); }
    });
  }
  function copyReport(btn) {
    var label = btn.querySelector('span');
    copyText(JSON.stringify(report(), null, 2)).then(function () {
      btn.classList.add('is-done'); if (label) label.textContent = 'Copied to clipboard';
    }).catch(function () {
      if (label) label.textContent = 'Copy failed';
    }).then(function () {
      setTimeout(function () { btn.classList.remove('is-done'); if (label) label.textContent = 'Copy JSON report'; }, 1600);
    });
  }

  /* ---------- open / close ------------------------------------- */
  function open() {
    buildPanel();
    renderPanel();
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

  /* ---------- first paint of the card -------------------------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderCard);
  else setTimeout(renderCard, 0);
  [600, 1500, 3500].forEach(function (d) { setTimeout(schedule, d); });

  window.openWebVitals  = open;
  window.closeWebVitals = close;
  window.getWebVitals   = report;

  /* ---------- command palette ---------------------------------- */
  function registerCmd() {
    if (typeof window.registerPaletteCommands !== 'function') return false;
    window.registerPaletteCommands([{
      t: 'Performance Report',
      s: 'Live Core Web Vitals, timeline and attribution',
      g: 'Performance',
      k: 'performance vitals lcp cls inp speed lighthouse metrics timeline',
      i: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
      run: function () { open(); return true; }
    }]);
    return true;
  }
  if (!registerCmd()) {
    var tries = 0, iv = setInterval(function () { if (registerCmd() || ++tries > 40) clearInterval(iv); }, 150);
  }
})();
