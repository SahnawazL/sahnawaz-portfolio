/* ============================================================
   PERFORMANCE GOVERNOR  —  ByteWithSahnawaz
   Keeps the site's effects in step with what the device can handle,
   the way games scale their graphics.

   1. Off-screen pausing. Every CSS animation set to run forever is
      paused while it is out of view and resumed just before it
      returns. Found through the browser's own animation registry
      (document.getAnimations), so it sees animations on ::before and
      ::after, and ones switched on later by a class \u2014 neither of
      which a getComputedStyle sweep can see. Supersedes the older
      pauser in portfolio-11.js, which stands down when this is loaded.

   2. Adaptive tier.
        full \u2014 every effect, the default on capable devices
        lite \u2014 frosted-glass blur switched off: backdrop-filter is the
               most expensive thing this page paints
      Chosen from the device (data saver, memory, cores) and then from
      live evidence: slow interactions or a busy main thread move a
      struggling device to lite. It never steps back up by itself in
      the same visit, so it cannot flicker between modes.

   3. Reduced motion. If the visitor has asked their system for less
      motion, looping animations stay paused everywhere.

   Visitors can see what it decided and why, and override it, from
   the panel in the "This Page, Right Now" card.

   Load in <head>, right after web-vitals.js, so the tier is applied
   before first paint and never flashes.
   ============================================================ */
(function () {
  'use strict';
  if (window.__pgLoaded) return;
  window.__pgLoaded = true;
  /* tells the older pauser in portfolio-11.js to stand down */
  window.__pgOffscreen = true;

  var root = document.documentElement;
  var KEY = 'shz-perf-mode';
  var mq = function (q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } };

  /* ---------- state -------------------------------------------- */
  var state = {
    mode: 'auto',          /* auto | full | lite  (what the visitor chose) */
    tier: 'full',          /* full | lite          (what is applied)       */
    reason: '',
    still: mq('(prefers-reduced-motion: reduce)'),
    slow: [],              /* durations of slow interactions (ms)          */
    liveLite: false,       /* live evidence has already decided lite       */
    tracked: 0, paused: 0, scanned: false
  };
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'full' || saved === 'lite' || saved === 'auto') state.mode = saved;
  } catch (e) {}

  /* ---------- deciding the tier -------------------------------- */
  function deviceVerdict() {
    var n = navigator, c = n.connection || {};
    if (c.saveData) return { lite: true, why: 'Data Saver is on' };
    if (typeof n.deviceMemory === 'number' && n.deviceMemory <= 2)
      return { lite: true, why: n.deviceMemory + ' GB device memory' };
    if (n.hardwareConcurrency && n.hardwareConcurrency <= 2)
      return { lite: true, why: n.hardwareConcurrency + ' CPU cores' };
    var bits = [];
    if (n.hardwareConcurrency) bits.push(n.hardwareConcurrency + ' CPU cores');
    if (typeof n.deviceMemory === 'number') bits.push(n.deviceMemory + (n.deviceMemory >= 8 ? '+' : '') + ' GB memory');
    return { lite: false, why: (bits.join(' \u00b7 ') || 'device capable') + ' \u00b7 no slowdown detected yet' };
  }

  function decide() {
    var prev = state.tier;
    if (state.mode === 'full') {
      state.tier = 'full'; state.reason = 'Set by you \u2014 remembered on this device';
    } else if (state.mode === 'lite') {
      state.tier = 'lite'; state.reason = 'Set by you \u2014 remembered on this device';
    } else if (state.liveLite) {
      state.tier = 'lite'; state.reason = state.liveWhy;
    } else {
      var d = deviceVerdict();
      state.tier = d.lite ? 'lite' : 'full';
      state.reason = d.why;
    }
    root.classList.toggle('pg-lite', state.tier === 'lite');
    if (prev !== state.tier) renderSoon();
  }
  decide();   /* synchronous, in <head>: no flash of the wrong tier */

  /* ---------- live evidence ------------------------------------ */
  var settled = false, SETTLE = 2000;
  function settle() { setTimeout(function () { settled = true; }, SETTLE); }
  if (document.readyState === 'complete') settle();
  else addEventListener('load', settle);

  function stepDown(why) {
    if (state.liveLite) return;
    state.liveLite = true;
    state.liveWhy = why;
    if (state.mode === 'auto') decide();
    renderSoon();
  }

  function observe(type, cb, extra) {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      var o = { type: type, buffered: false };
      if (extra) for (var k in extra) o[k] = extra[k];
      new PerformanceObserver(function (l) { l.getEntries().forEach(cb); }).observe(o);
    } catch (e) {}
  }

  /* two genuinely slow taps (not hovers: interactionId 0 is excluded) */
  var seen = {};
  observe('event', function (e) {
    if (!settled || !e.interactionId || seen[e.interactionId]) return;
    if (e.duration < 300) return;
    seen[e.interactionId] = 1;
    state.slow.push(Math.round(e.duration));
    if (state.slow.length >= 2) {
      stepDown(state.slow.length + ' slow interactions (' +
               state.slow.slice(-2).map(function (d) { return d + ' ms'; }).join(', ') + ')');
    }
  }, { durationThreshold: 104 });

  /* or a main thread blocked for over a second within ten */
  var blocks = [];
  observe('longtask', function (e) {
    if (!settled) return;
    var now = e.startTime + e.duration;
    blocks.push({ t: now, b: Math.max(0, e.duration - 50) });
    while (blocks.length && now - blocks[0].t > 10000) blocks.shift();
    var sum = blocks.reduce(function (s, x) { return s + x.b; }, 0);
    if (sum >= 1200) stepDown('main thread blocked ' + Math.round(sum) + ' ms in 10 s');
  });

  /* ---------- styles ------------------------------------------- */
  var CSS =
    /* off-screen pausing: one class per place an animation can live */
    '.pg-off-e{animation-play-state:paused !important}' +
    '.pg-off-b::before{animation-play-state:paused !important}' +
    '.pg-off-a::after{animation-play-state:paused !important}' +
    /* lite tier: frosted glass off everywhere */
    'html.pg-lite *,html.pg-lite *::before,html.pg-lite *::after{' +
      '-webkit-backdrop-filter:none !important;backdrop-filter:none !important}' +
    /* the panel, inside #wvCard (IDs keep it safe in hacker mode) */
    '#wvCard #pgPanel{margin-top:14px !important;padding-top:13px !important;' +
      'border-top:1px solid rgba(120,200,255,.1) !important;text-align:left !important}' +
    '#wvCard #pgPanel .pg-row{display:flex !important;align-items:center !important;gap:10px !important;flex-wrap:wrap !important}' +
    '#wvCard #pgPanel .pg-h{flex:1 !important;min-width:140px !important;font-size:.58rem !important;font-weight:700 !important;' +
      'letter-spacing:.16em !important;text-transform:uppercase !important;color:rgba(150,200,230,.5) !important}' +
    '#wvCard #pgPanel .pg-seg{display:inline-flex !important;padding:3px !important;border-radius:10px !important;' +
      'background-color:rgba(120,200,255,.06) !important;border:1px solid rgba(120,200,255,.14) !important}' +
    '#wvCard #pgPanel .pg-seg button{font-family:Inter,system-ui,sans-serif !important;cursor:pointer !important;' +
      'padding:6px 12px !important;border-radius:7px !important;border:none !important;font-size:.72rem !important;' +
      'font-weight:600 !important;color:rgba(185,215,238,.7) !important;background-color:transparent !important;' +
      'transition:background-color .16s ease,color .16s ease !important}' +
    '#wvCard #pgPanel .pg-seg button.is-on{color:#04121a !important;background-color:#6fd8ff !important}' +
    '#wvCard #pgPanel .pg-st{display:flex !important;align-items:flex-start !important;gap:10px !important;margin-top:11px !important}' +
    '#wvCard #pgPanel .pg-dot{width:8px !important;height:8px !important;border-radius:50% !important;flex:none !important;margin-top:5px !important}' +
    '#wvCard #pgPanel .pg-dot.is-full{background-color:#4fe0a2 !important;box-shadow:0 0 8px rgba(79,224,162,.7) !important}' +
    '#wvCard #pgPanel .pg-dot.is-lite{background-color:#ffcf6b !important;box-shadow:0 0 8px rgba(255,207,107,.7) !important}' +
    '#wvCard #pgPanel .pg-st b{display:block !important;font-size:.84rem !important;font-weight:700 !important;color:#e8f4ff !important}' +
    '#wvCard #pgPanel .pg-st span{display:block !important;font-size:.72rem !important;line-height:1.5 !important;' +
      'margin-top:2px !important;color:rgba(172,208,233,.62) !important;' +
      'display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;' +
      'overflow:hidden !important;min-height:3em !important}' +
    '#wvCard #pgPanel .pg-meta{margin-top:9px !important;font-family:ui-monospace,"SF Mono",Menlo,monospace !important;' +
      'font-size:.62rem !important;color:rgba(160,200,228,.55) !important;line-height:1.6 !important;' +
      'display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;' +
      'overflow:hidden !important;min-height:3.2em !important}' +
    '#wvCard #pgPanel.pg-flash{animation:pgFlash 1.2s ease 1}' +
    '@keyframes pgFlash{0%{box-shadow:0 0 0 0 rgba(111,216,255,.0)}30%{box-shadow:0 0 0 6px rgba(111,216,255,.25)}100%{box-shadow:0 0 0 0 rgba(111,216,255,0)}}';
  (function () {
    var st = document.createElement('style');
    st.id = 'pg-style';
    st.textContent = CSS;
    (document.head || root).appendChild(st);
  })();

  /* ---------- off-screen pausing ------------------------------- */
  var hosts = new Map();          /* element -> { e, b, a, visible } */
  var io = null;
  var CAN = typeof document.getAnimations === 'function' && typeof IntersectionObserver !== 'undefined';

  function apply(el, h) {
    var off = state.still || !h.visible;
    el.classList.toggle('pg-off-e', off && h.e > 0);
    el.classList.toggle('pg-off-b', off && h.b > 0);
    el.classList.toggle('pg-off-a', off && h.a > 0);
  }

  function recount() {
    var t = 0, p = 0;
    hosts.forEach(function (h) {
      var n = h.e + h.b + h.a;
      t += n;
      if (state.still || !h.visible) p += n;
    });
    state.tracked = t; state.paused = p; state.scanned = true;
    renderSoon();
  }

  function scan() {
    if (!CAN) return;
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var h = hosts.get(en.target);
          if (!h) return;
          h.visible = en.isIntersecting;
          apply(en.target, h);
        });
        recount();
      }, { rootMargin: '200px 0px 200px 0px', threshold: 0 });
    }
    var found = new Map();
    try {
      document.getAnimations().forEach(function (a) {
        /* CSS animations only: animation-play-state has no effect on
           script-driven Web Animations, so don't claim to manage them */
        if (!('animationName' in a)) return;
        var fx = a.effect;
        if (!fx || !fx.getTiming || fx.getTiming().iterations !== Infinity) return;
        var el = fx.target;
        if (!el || el.nodeType !== 1 || el === root || el === document.body) return;
        var p = fx.pseudoElement || '';
        var k = p === '::before' ? 'b' : p === '::after' ? 'a' : p ? null : 'e';
        if (!k) return;
        var f = found.get(el) || { e: 0, b: 0, a: 0 };
        f[k]++;
        found.set(el, f);
      });
    } catch (e) { return; }

    /* forget hosts whose looping animation has gone */
    hosts.forEach(function (h, el) {
      if (!found.has(el)) {
        el.classList.remove('pg-off-e', 'pg-off-b', 'pg-off-a');
        io.unobserve(el);
        hosts.delete(el);
      }
    });
    /* track new ones; update counts on known ones */
    found.forEach(function (f, el) {
      var h = hosts.get(el);
      if (h) { h.e = f.e; h.b = f.b; h.a = f.a; apply(el, h); }
      else {
        /* assume visible until the observer reports, so nothing freezes on
           screen — but apply now, so reduced motion takes effect at once
           rather than waiting for the first visibility report */
        var nh = { e: f.e, b: f.b, a: f.a, visible: true };
        hosts.set(el, nh);
        apply(el, nh);
        io.observe(el);
      }
    });
    recount();
  }

  function idle(fn, timeout) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: timeout || 2000 });
    else setTimeout(fn, 200);
  }
  function loop() {
    if (!document.hidden) idle(scan, 3000);
    setTimeout(loop, 6000);
  }
  /* rescan soon after the page's mode changes (hacker mode etc.) */
  var bodyTimer;
  function watchBody() {
    if (!document.body) return;
    new MutationObserver(function () {
      clearTimeout(bodyTimer);
      bodyTimer = setTimeout(function () { idle(scan, 1500); }, 700);
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* reduced motion can be changed while the page is open */
  try {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
      state.still = e.matches;
      hosts.forEach(function (h, el) { apply(el, h); });
      recount();
    });
  } catch (e) {}

  /* ---------- panel -------------------------------------------- */
  var queued = false;
  function renderSoon() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; render(); renderPopup(); }, 250);
  }

  /* The panel is kept cheap to maintain: nothing is written while it is
     off-screen, and when only the live counter changes, just that line
     is updated. Without this, animations crossing the screen edge while
     scrolling rewrote the whole panel several times a second — wasted
     main-thread work from the module that exists to reduce it. */
  var panelVisible = false, panelDirty = true, lastKey = '', lastMeta = '';

  function metaText() {
    if (!CAN) return 'This browser cannot report its animations, so off-screen pausing is unavailable here.';
    if (!state.scanned) return 'Scanning looping animations\u2026';
    if (state.still) return state.tracked + ' looping animations \u00b7 all paused (your device asks for reduced motion)';
    return state.tracked + ' looping animations \u00b7 ' + state.paused + ' paused off-screen right now';
  }

  function render(force) {
    var host = document.getElementById('pgPanel');
    if (!host) return;
    if (!panelVisible && !force) { panelDirty = true; return; }
    panelDirty = false;

    var key = [state.mode, state.tier, state.reason, state.still, CAN].join('|');
    var meta = metaText();
    var metaEl = key === lastKey ? host.querySelector('.pg-meta') : null;
    if (metaEl) {
      if (meta !== lastMeta) { metaEl.textContent = meta; lastMeta = meta; }
      return;
    }
    lastKey = key; lastMeta = meta;

    var esc = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var label = state.tier === 'lite' ? 'Lite effects \u2014 frosted-glass blur off' : 'Full effects';
    var how = state.mode === 'auto' ? 'decided automatically' : 'chosen by you';
    host.innerHTML =
      '<div class="pg-row">' +
        '<span class="pg-h">Performance mode</span>' +
        '<span class="pg-seg" role="group" aria-label="Performance mode">' +
          ['auto', 'full', 'lite'].map(function (m) {
            return '<button type="button" data-pg-mode="' + m + '" aria-pressed="' + (state.mode === m) + '"' +
                   (state.mode === m ? ' class="is-on"' : '') + '>' +
                   m.charAt(0).toUpperCase() + m.slice(1) + '</button>';
          }).join('') +
        '</span>' +
      '</div>' +
      '<div class="pg-st"><i class="pg-dot is-' + state.tier + '"></i>' +
        '<div><b>' + label + '</b><span>' + esc(how) + ' \u00b7 ' + esc(state.reason) + '</span></div>' +
      '</div>' +
      '<div class="pg-meta">' + esc(meta) + '</div>';
  }

  function watchPanel() {
    var host = document.getElementById('pgPanel');
    if (!host) return;
    if (typeof IntersectionObserver === 'undefined') { panelVisible = true; return; }
    new IntersectionObserver(function (en) {
      panelVisible = en[0].isIntersecting;
      if (panelVisible && panelDirty) render();
    }, { rootMargin: '100px 0px' }).observe(host);
  }

  function setMode(m) {
    if (m !== 'auto' && m !== 'full' && m !== 'lite') return;
    state.mode = m;
    try { localStorage.setItem(KEY, m); } catch (e) {}
    decide();
    render(true);
    renderPopup();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#pgPanel [data-pg-mode], #pg-overlay [data-pg-mode]');
    if (b) { e.preventDefault(); setMode(b.getAttribute('data-pg-mode')); }
  });

  /* ---------- popup (opened from the command palette) ---------- */
  var POP_RULES = [
'#pg-overlay,#pg-overlay *{font-family:Inter,system-ui,-apple-system,sans-serif;background-color:transparent;color:inherit;box-sizing:border-box}',
'#pg-overlay{position:fixed;inset:0;z-index:100210;display:none;align-items:flex-start;justify-content:center;padding:8vh 16px 16px;',
'  background:radial-gradient(120% 90% at 50% 0%,rgba(8,20,34,.82),rgba(2,7,14,.9));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
'#pg-overlay.is-open{display:flex}',
'#pg-box{width:100%;max-width:560px;position:relative;display:flex;flex-direction:column;max-height:84vh;overflow:hidden;color:#d2e8f8;',
'  background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99));border:1px solid rgba(120,205,255,.2);border-radius:18px;',
'  box-shadow:0 40px 90px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,255,255,.05)}',
'#pg-head{display:flex;align-items:center;gap:11px;padding:16px;border-bottom:1px solid rgba(120,205,255,.12);flex:0 0 auto}',
'#pg-head>svg{width:19px;height:19px;flex:none;color:#8ad8ff}',
'#pg-title{flex:1;min-width:0}',
'#pg-title b{display:block;font-size:.98rem;font-weight:700;color:#eaf6ff}',
'#pg-title span{display:block;font-size:.72rem;margin-top:2px;color:rgba(172,208,233,.55)}',
'#pg-close{flex:none;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;cursor:pointer;',
'  color:rgba(190,222,242,.8);background-color:rgba(130,200,240,.08);border:1px solid rgba(140,200,235,.24)}',
'#pg-close svg{width:15px;height:15px}',
'#pg-body{overflow-y:auto;padding:14px 16px 18px;flex:1 1 auto;overscroll-behavior:contain;text-align:left}',
'#pg-body .p-sec{margin:18px 0 10px;display:flex;align-items:center;gap:9px;font-size:.58rem;font-weight:700;letter-spacing:.16em;',
'  text-transform:uppercase;color:rgba(150,200,230,.45)}',
'#pg-body .p-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(120,200,255,.18),transparent)}',
'#pg-body .p-seg{display:flex;padding:3px;border-radius:11px;background-color:rgba(120,200,255,.06);border:1px solid rgba(120,200,255,.14)}',
'#pg-body .p-seg button{flex:1;cursor:pointer;padding:9px 10px;border-radius:8px;border:none;font-size:.8rem;font-weight:700;',
'  color:rgba(185,215,238,.72);background-color:transparent}',
'#pg-body .p-seg button.is-on{color:#04121a;background-color:#6fd8ff}',
'#pg-body .p-st{display:flex;align-items:flex-start;gap:11px;margin-top:12px;padding:12px 13px;border-radius:12px;',
'  background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.12)}',
'#pg-body .p-dot{width:9px;height:9px;border-radius:50%;flex:none;margin-top:5px}',
'#pg-body .p-dot.is-full{background-color:#4fe0a2;box-shadow:0 0 9px rgba(79,224,162,.7)}',
'#pg-body .p-dot.is-lite{background-color:#ffcf6b;box-shadow:0 0 9px rgba(255,207,107,.7)}',
'#pg-body .p-st b{display:block;font-size:.9rem;font-weight:700;color:#e8f4ff}',
'#pg-body .p-st span{display:block;font-size:.74rem;line-height:1.5;margin-top:3px;color:rgba(172,208,233,.66)}',
'#pg-body .p-mode{display:flex;gap:11px;padding:10px 0;border-bottom:1px solid rgba(120,200,255,.07)}',
'#pg-body .p-mode:last-child{border-bottom:none}',
'#pg-body .p-mode i{flex:none;width:6px;border-radius:3px;background-color:rgba(120,200,255,.12)}',
'#pg-body .p-mode.is-on i{background-color:#6fd8ff}',
'#pg-body .p-mode b{display:block;font-size:.84rem;font-weight:700;color:#e2f1fc}',
'#pg-body .p-mode span{display:block;font-size:.72rem;line-height:1.5;margin-top:2px;color:rgba(172,208,233,.6)}',
'#pg-body .p-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}',
'#pg-body .p-stat{padding:10px;border-radius:11px;background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.11);min-width:0}',
'#pg-body .p-stat b{display:block;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:.95rem;font-weight:700;color:#e2f1fc}',
'#pg-body .p-stat span{display:block;font-size:.62rem;margin-top:3px;line-height:1.35;color:rgba(172,208,233,.55)}',
'#pg-body .p-act{margin-top:14px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;',
'  border-radius:11px;cursor:pointer;font-size:.78rem;font-weight:600;color:#dff2ff;background-color:rgba(120,200,255,.1);',
'  border:1px solid rgba(130,200,240,.28)}',
'#pg-body .p-act svg{width:14px;height:14px}',
'#pg-body .p-note{margin-top:14px;padding:10px 12px;border-radius:10px;font-size:.7rem;line-height:1.55;color:rgba(178,212,236,.62);',
'  background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.11)}',
'@media (max-width:640px){#pg-overlay{padding:4vh 10px 10px}#pg-box{max-height:90vh;border-radius:16px}#pg-body .p-grid{grid-template-columns:repeat(2,1fr)}}'
  ].join('\n');
  function importantAll(css) {
    return css.replace(/([a-z-]+\s*:\s*[^;{}]+?)\s*(;|})/g, function (m, d, end) {
      return (/!important$/.test(d) ? d : d + ' !important') + end;
    });
  }
  var ICON = '<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="M12 12 8 8"/><circle cx="12" cy="12" r="9"/>';
  var sv = function (d, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) +
           '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  };

  var pov, pbody;
  function popupOpen() { return !!(pov && pov.classList.contains('is-open')); }

  function buildPopup() {
    if (pov) return;
    var st = document.createElement('style');
    st.id = 'pg-popup-style';
    st.textContent = importantAll(POP_RULES);
    document.head.appendChild(st);
    pov = document.createElement('div');
    pov.id = 'pg-overlay';
    pov.setAttribute('role', 'dialog');
    pov.setAttribute('aria-modal', 'true');
    pov.setAttribute('aria-label', 'Performance mode');
    pov.innerHTML =
      '<div id="pg-box">' +
        '<div id="pg-head">' + sv(ICON, 1.8) +
          '<span id="pg-title"><b>Performance Mode</b><span>How this site adapts to your device</span></span>' +
          '<button id="pg-close" type="button" aria-label="Close">' + sv('<path d="M18 6 6 18M6 6l12 12"/>') + '</button>' +
        '</div>' +
        '<div id="pg-body"></div>' +
      '</div>';
    document.body.appendChild(pov);
    pbody = document.getElementById('pg-body');
    pov.addEventListener('click', function (e) { if (e.target === pov) closePopup(); });
    document.getElementById('pg-close').addEventListener('click', function () { closePopup(); });
    pbody.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-pg-show]')) {
        closePopup();
        setTimeout(function () {
          var p = document.getElementById('pgPanel');
          if (!p) return;
          p.scrollIntoView({ behavior: 'smooth', block: 'center' });
          p.classList.remove('pg-flash'); void p.offsetWidth; p.classList.add('pg-flash');
        }, 260);
      }
    });
  }

  function renderPopup() {
    if (!popupOpen()) return;
    var esc = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var n = navigator, c = n.connection || {};
    var label = state.tier === 'lite' ? 'Lite effects \u2014 frosted-glass blur off' : 'Full effects';
    var how = state.mode === 'auto' ? 'Decided automatically' : 'Chosen by you';
    var modes = [
      ['auto', 'Auto', 'Chooses for you from your device, then watches how the page actually runs. Two genuinely slow taps move a struggling device to Lite.'],
      ['full', 'Full', 'Every effect, including the frosted-glass blur on panels.'],
      ['lite', 'Lite', 'Switches off the frosted-glass blur \u2014 the most expensive thing this page paints. Everything else stays.']
    ];
    var stat = function (v, k) { return '<div class="p-stat"><b>' + esc(v) + '</b><span>' + esc(k) + '</span></div>'; };
    pbody.innerHTML =
      '<div class="p-seg" role="group" aria-label="Performance mode">' +
        modes.map(function (m) {
          return '<button type="button" data-pg-mode="' + m[0] + '" aria-pressed="' + (state.mode === m[0]) + '"' +
                 (state.mode === m[0] ? ' class="is-on"' : '') + '>' + m[1] + '</button>';
        }).join('') +
      '</div>' +
      '<div class="p-st"><i class="p-dot is-' + state.tier + '"></i><div><b>' + label + '</b>' +
        '<span>' + esc(how) + ' \u00b7 ' + esc(state.reason) + '</span></div></div>' +

      '<div class="p-sec">What each mode does</div>' +
      modes.map(function (m) {
        return '<div class="p-mode' + (state.mode === m[0] ? ' is-on' : '') + '"><i></i><div><b>' + m[1] + '</b>' +
               '<span>' + esc(m[2]) + '</span></div></div>';
      }).join('') +

      '<div class="p-sec">What it reads from this device</div>' +
      '<div class="p-grid">' +
        stat(n.hardwareConcurrency ? n.hardwareConcurrency : '\u2014', 'CPU cores') +
        stat(typeof n.deviceMemory === 'number' ? n.deviceMemory + (n.deviceMemory >= 8 ? '+ GB' : ' GB') : '\u2014', 'Memory (browser-rounded)') +
        stat(c.saveData ? 'On' : 'Off', 'Data Saver') +
        stat(state.still ? 'On' : 'Off', 'Reduced motion') +
        stat(state.slow.length, 'Slow taps this visit') +
        stat(state.scanned ? state.paused + ' / ' + state.tracked : '\u2026', 'Loops paused / total') +
      '</div>' +

      '<button type="button" class="p-act" data-pg-show>' + sv('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>') +
        'Show the panel on the page</button>' +
      '<div class="p-note">Your choice is remembered on this device. Everything here is read locally \u2014 ' +
        'nothing is stored online or sent anywhere.</div>';
  }

  function openPopup() {
    buildPopup();
    pov.classList.add('is-open');
    renderPopup();
    document.body.style.overflow = 'hidden';
    if (typeof window.shzPopupOpened === 'function') {
      window.shzPopupOpened('perf-mode', function () { closePopup(true); });
    }
  }
  function closePopup(fromHistory) {
    if (!popupOpen()) return;
    pov.classList.remove('is-open');
    document.body.style.overflow = '';
    if (!fromHistory && typeof window.shzPopupClosed === 'function') window.shzPopupClosed('perf-mode');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popupOpen()) closePopup();
  });

  /* ---------- boot --------------------------------------------- */
  function boot() {
    watchBody();
    render(true);
    watchPanel();
    idle(scan, 1500);
    setTimeout(loop, 6000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.perfGovernor = {
    get mode() { return state.mode; },
    get tier() { return state.tier; },
    get reason() { return state.reason; },
    stats: function () {
      return { mode: state.mode, tier: state.tier, reason: state.reason,
               reducedMotion: state.still, loopingAnimations: state.tracked,
               pausedOffscreen: state.paused, slowInteractions: state.slow.slice() };
    },
    setMode: setMode,
    openPopup: openPopup,
    rescan: scan
  };

  /* ---------- command palette ---------------------------------- */
  function registerCmd() {
    if (typeof window.registerPaletteCommands !== 'function') return false;
    window.registerPaletteCommands([{
      t: 'Performance Mode',
      s: 'See how the site adapts to your device, or override it',
      g: 'Action',
      k: 'performance mode lite full battery slow governor effects blur animations',
      i: '<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="M12 12 8 8"/><circle cx="12" cy="12" r="9"/>',
      run: function () { setTimeout(openPopup, 120); return true; }
    }]);
    return true;
  }
  if (!registerCmd()) {
    var t = 0, iv = setInterval(function () { if (registerCmd() || ++t > 60) clearInterval(iv); }, 150);
  }
})();
