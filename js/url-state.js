/* ============================================================
   URL STATE  —  ByteWithSahnawaz
   Makes the page's state shareable, bookmarkable and Back-aware.

     ?case=yojanasahay | studylens | portfolio   a case study
     ?code=session.js  (or just ?code)           the code editor + file
     ?report=performance                         the performance report
     ?stack=frontend | backend | design          the tech-stack filter
     ?projects=fullstack | ui | tool             the My Projects filter
     ?mode=hacker                                retro hacker mode
     #section                                    left to the browser

   Behaviour
   - Opening a case study, the editor or the report adds ONE history
     entry, so Back (and the Android back gesture) closes it instead of
     leaving the site. Closing it any other way removes that entry again.
   - Mode and filter only ever REPLACE the current entry, so they never
     add Back steps. Unrelated query params (utm_source etc.) are kept.

   Standalone. No dependencies. Everything it drives already exists on
   the page; anything missing is skipped rather than throwing.
   Load LAST, after every feature it links to.
   ============================================================ */
(function () {
  'use strict';
  if (window.__urlStateLoaded) return;
  window.__urlStateLoaded = true;
  if (!window.history || !history.replaceState || !history.pushState || !window.URLSearchParams) return;

  var $ = function (id) { return document.getElementById(id); };
  var CASES  = ['yojanasahay', 'studylens', 'portfolio'];
  var FILES  = ['portfolio.js', 'about.json', 'session.js', 'contact.sh'];
  var STACKS = ['frontend', 'backend', 'design'];

  var restoring = true;        /* true while the initial URL is being applied */
  var openingByHistory = {};   /* overlay opened by Back/Forward: don't push */
  var closingByHistory = {};   /* overlay closed by Back/Forward: don't pop  */

  /* ---------- URL helpers -------------------------------------- */
  function params() { return new URLSearchParams(location.search); }
  function urlFrom(p) {
    var q = p.toString();
    return location.pathname + (q ? '?' + q : '') + location.hash;
  }
  function mergedState(extra) {
    var s = {}, cur = history.state;
    if (cur && typeof cur === 'object') for (var k in cur) s[k] = cur[k];
    s.shz = 1;
    if (extra) for (var j in extra) s[j] = extra[j];
    return s;
  }
  /* set or clear one param; push only for overlays */
  function setParam(key, val, push, extra) {
    var p = params();
    if (val == null || val === '') {
      if (!p.has(key)) return;
      p.delete(key);
    } else {
      if (p.get(key) === val) return;
      p.set(key, val);
    }
    try {
      if (push) history.pushState(mergedState(extra), '', urlFrom(p));
      else history.replaceState(mergedState(), '', urlFrom(p));
    } catch (e) {}
  }

  /* ---------- the three overlays ------------------------------- */
  var lastCase = null, caseOpen = false, codeOpen = false, repOpen = false;

  var OV = {
    case: {
      param: 'case',
      read: function (p) { var v = p.get('case'); return v && CASES.indexOf(v) > -1 ? v : null; },
      isOpen: function () { return caseOpen; },
      value: function () { return lastCase; },
      open: function (v) {
        if (typeof window.openCaseStudy !== 'function') return false;
        window.openCaseStudy(v); return true;
      },
      close: function () { if (typeof window.closeCaseStudy === 'function') window.closeCaseStudy(); }
    },
    code: {
      param: 'code',
      read: function (p) {
        if (!p.has('code')) return null;
        var v = p.get('code');
        return FILES.indexOf(v) > -1 ? v : 'portfolio.js';   /* bare ?code opens the default file */
      },
      isOpen: function () { return codeOpen; },
      value: function () { return window._cpActiveFile || 'portfolio.js'; },
      open: function (v) {
        if (typeof window._openCodePopup !== 'function') return false;
        window._openCodePopup();
        if (v && v !== (window._cpActiveFile || 'portfolio.js')) {
          /* go through the tab itself so its active styling updates too */
          setTimeout(function () {
            var tab = document.querySelector('#codePopup .cp-tab[data-file="' + v + '"]');
            if (tab) tab.click();
            else if (typeof window._cpOpenFile === 'function') window._cpOpenFile(v);
          }, 420);
        }
        return true;
      },
      close: function () { var x = $('codePopup-closex'); if (x) x.click(); }
    },
    report: {
      param: 'report',
      read: function (p) {
        var v = p.get('report');
        return v === 'performance' || v === 'vitals' ? 'performance' : null;
      },
      isOpen: function () { return repOpen; },
      value: function () { return 'performance'; },
      open: function () {
        if (typeof window.openWebVitals !== 'function') return false;
        window.openWebVitals(); return true;
      },
      close: function () { if (typeof window.closeWebVitals === 'function') window.closeWebVitals(); }
    }
  };
  var ORDER = ['case', 'code', 'report'];

  /* ---------- overlay lifecycle -------------------------------- */
  function onOpen(kind) {
    if (openingByHistory[kind]) { openingByHistory[kind] = false; return; }
    if (restoring) return;
    var o = OV[kind], v = o.value();
    if (!v || params().get(o.param) === v) return;
    /* one history step per overlay: this is what lets Back close it */
    setParam(o.param, v, true, { overlay: kind });
  }

  function onClose(kind) {
    if (closingByHistory[kind]) { closingByHistory[kind] = false; return; }
    if (restoring) return;
    var st = history.state;
    if (st && st.shz && st.overlay === kind) {
      /* we added this entry when it opened; step back off it */
      try { history.back(); } catch (e) {}
    } else {
      /* arrived via a shared link: just tidy the URL */
      setParam(OV[kind].param, null, false);
    }
  }

  /* case study: observe the modal's class instead of wrapping
     closeCaseStudy \u2014 its buttons captured a reference at load time,
     so a wrapper added later would never see those clicks */
  function watchCase() {
    var m = $('caseStudyModal');
    if (!m) return false;
    caseOpen = m.classList.contains('cs-open');
    new MutationObserver(function (recs) {
      recs.forEach(function (r) {
        var was = ' ' + (r.oldValue || '') + ' ', now = ' ' + m.className + ' ';
        var opened  = was.indexOf(' cs-open ') < 0 && now.indexOf(' cs-open ') > -1;
        var closing = (was.indexOf(' cs-visible ') > -1 && now.indexOf(' cs-visible ') < 0) ||
                      (was.indexOf(' cs-open ') > -1 && now.indexOf(' cs-open ') < 0);
        if (opened && !caseOpen)       { caseOpen = true;  onOpen('case'); }
        else if (closing && caseOpen)  { caseOpen = false; onClose('case'); }
      });
    }).observe(m, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    return true;
  }

  /* openCaseStudy is the only place the key is known; record it */
  function wrapOpenCase() {
    var f = window.openCaseStudy;
    if (typeof f !== 'function') return false;
    if (f.__shzWrapped) return true;
    var w = function (key) { lastCase = key; return f.apply(this, arguments); };
    w.__shzWrapped = true;
    window.openCaseStudy = w;
    return true;
  }

  function watchCode() {
    var pop = $('codePopup');
    if (!pop) return false;
    var vis = function () { return !!pop.style.display && pop.style.display !== 'none'; };
    codeOpen = vis();
    new MutationObserver(function () {
      var v = vis();                                  /* drag also edits style: ignore */
      if (v && !codeOpen)      { codeOpen = true;  onOpen('code'); }
      else if (!v && codeOpen) { codeOpen = false; onClose('code'); }
    }).observe(pop, { attributes: true, attributeFilter: ['style'] });
    return true;
  }

  /* switching files while the editor is open updates the link */
  function wrapOpenFile() {
    var f = window._cpOpenFile;
    if (typeof f !== 'function') return false;
    if (f.__shzWrapped) return true;
    var w = function (name) {
      var r = f.apply(this, arguments);
      if (!restoring && codeOpen && FILES.indexOf(name) > -1) setParam('code', name, false);
      return r;
    };
    w.__shzWrapped = true;
    window._cpOpenFile = w;
    return true;
  }

  /* the report popup is built on first open, so wait for it to exist */
  function watchReport() {
    var attach = function (ov) {
      repOpen = ov.classList.contains('is-open');
      new MutationObserver(function () {
        var o = ov.classList.contains('is-open');
        if (o && !repOpen)      { repOpen = true;  onOpen('report'); }
        else if (!o && repOpen) { repOpen = false; onClose('report'); }
      }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    };
    var ov = $('wv-overlay');
    if (ov) { attach(ov); return; }
    new MutationObserver(function (recs, obs) {
      var o = $('wv-overlay');
      if (!o) return;
      obs.disconnect();
      attach(o);
      /* it was created and opened in the same tick; catch that open */
      if (o.classList.contains('is-open')) { repOpen = true; onOpen('report'); }
    }).observe(document.body, { childList: true });
  }

  /* ---------- mode + stack: current page state is the truth ----- */
  function hackerOn() { return document.body.classList.contains('hacker-mode'); }
  function writeMode() { if (!restoring) setParam('mode', hackerOn() ? 'hacker' : null, false); }

  function activeStack() {
    var t = document.querySelector('.ts-tab.active');
    var c = t && t.getAttribute('data-cat');
    return c && c !== 'all' ? c : null;
  }
  function writeStack() { if (!restoring) setParam('stack', activeStack(), false); }

  /* My Projects filter. Its buttons call mpjFilter('ui', this) inline and
     mark themselves .active. The valid categories are read from the
     buttons, so a filter added to the page later is linkable for free. */
  function mpjButtons() {
    return Array.prototype.slice.call(document.querySelectorAll('.mpj-filter-btn'));
  }
  function mpjCatOf(btn) {
    var m = /mpjFilter\(\s*['"]([^'"]+)['"]/.exec(btn.getAttribute('onclick') || '');
    return m ? m[1] : null;
  }
  function projectCats() {
    return mpjButtons().map(mpjCatOf).filter(function (c) { return c && c !== 'all'; });
  }
  function activeProjects() {
    var b = document.querySelector('.mpj-filter-btn.active');
    var c = b && mpjCatOf(b);
    return c && c !== 'all' ? c : null;
  }
  function writeProjects() { if (!restoring) setParam('projects', activeProjects(), false); }

  function watchModeAndStack() {
    new MutationObserver(writeMode)
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    /* capture phase + defer, so the tab's own handler has already run */
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      if (e.target.closest('.ts-tab')) setTimeout(writeStack, 0);
      if (e.target.closest('.mpj-filter-btn')) setTimeout(writeProjects, 0);
    }, true);
  }

  /* ---------- Back / Forward ----------------------------------- */
  function reconcile() {
    var p = params();
    ORDER.forEach(function (kind) {
      var o = OV[kind], want = o.read(p), have = o.isOpen();
      if (want && !have) {
        openingByHistory[kind] = true;
        if (!o.open(want)) openingByHistory[kind] = false;
      } else if (!want && have) {
        closingByHistory[kind] = true;
        o.close();
      }
    });
    /* Back only ever steps through overlays. Mode and filter follow
       the page, so re-assert them rather than letting history undo them. */
    setParam('mode', hackerOn() ? 'hacker' : null, false);
    setParam('stack', activeStack(), false);
    setParam('projects', activeProjects(), false);
    /* safety: never leave a flag armed if a close/open silently failed */
    setTimeout(function () { openingByHistory = {}; closingByHistory = {}; }, 1500);
  }
  /* ---------- Back-closable popups --------------------------------
     For popups that have no link of their own (Performance Mode, Share).
     Opening one adds a history entry for the same address, so Back and
     the Android back gesture close it instead of leaving the site.
       window.shzPopupOpened(name, closeFn)   call when it opens
       window.shzPopupClosed(name)            call when the visitor closes it
     closeFn must NOT call shzPopupClosed: it runs because Back already
     removed the entry. */
  var popups = {};
  window.shzPopupOpened = function (name, closeFn) {
    if (!name || typeof closeFn !== 'function') return;
    popups[name] = closeFn;
    try { history.pushState(mergedState({ overlay: 'popup:' + name }), '', urlFrom(params())); } catch (e) {}
  };
  window.shzPopupClosed = function (name) {
    if (!popups[name]) return;
    delete popups[name];
    var st = history.state;
    if (st && st.shz && st.overlay === 'popup:' + name) { try { history.back(); } catch (e) {} }
  };
  function closeLeftPopups() {
    var st = history.state;
    Object.keys(popups).forEach(function (name) {
      if (st && st.overlay === 'popup:' + name) return;      /* still on its entry */
      var fn = popups[name];
      delete popups[name];
      try { fn(); } catch (e) {}
    });
  }

  addEventListener('popstate', function () {
    closeLeftPopups();
    if (!restoring) reconcile();
  });

  /* ---------- initial restore ---------------------------------- */
  function restore() {
    var p = params();

    if (p.get('mode') === 'hacker' && !hackerOn()) {
      document.body.classList.add('hacker-mode');
      if (typeof window.syncHackerToggleIcon === 'function') window.syncHackerToggleIcon();
    }

    var overlayWanted = ORDER.some(function (k) { return OV[k].read(p); });
    var scrollTo = null;

    var pj = p.get('projects');
    if (pj && projectCats().indexOf(pj) > -1) {
      var pjBtn = mpjButtons().filter(function (b) { return mpjCatOf(b) === pj; })[0];
      if (pjBtn) { pjBtn.click(); scrollTo = document.getElementById('my-projects'); }
    }

    var st = p.get('stack');
    if (st && STACKS.indexOf(st) > -1) {
      var tab = document.querySelector('.ts-tab[data-cat="' + st + '"]');
      if (tab) { tab.click(); scrollTo = scrollTo || document.querySelector('.ts-section'); }
    }

    /* a shared filter link should land on the filter it names. If both
       filters are in the link, projects wins: it is the stronger intent. */
    if (scrollTo && !location.hash && !overlayWanted) {
      var target = scrollTo;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
    }

    /* at most one overlay from a link, highest priority first */
    var opened = null, openedVal = null;
    for (var i = 0; i < ORDER.length; i++) {
      var v = OV[ORDER[i]].read(p);
      if (v && OV[ORDER[i]].open(v)) { opened = ORDER[i]; openedVal = v; break; }
    }

    /* drop values we don't recognise, keep everyone else's params */
    var clean = params();
    /* the URL must describe what is actually on screen: remove the params
       of overlays that were not opened, and name the file a bare ?code
       resolved to, so a re-shared link reproduces this exact view */
    ORDER.forEach(function (k) {
      if (k !== opened) clean.delete(OV[k].param);
      else clean.set(OV[k].param, openedVal);
    });
    if (clean.has('case') && !OV.case.read(clean)) clean.delete('case');
    if (clean.has('report') && !OV.report.read(clean)) clean.delete('report');
    if (clean.has('stack') && STACKS.indexOf(clean.get('stack')) < 0) clean.delete('stack');
    if (clean.has('projects') && projectCats().indexOf(clean.get('projects')) < 0) clean.delete('projects');
    if (clean.has('mode') && clean.get('mode') !== 'hacker') clean.delete('mode');
    try { history.replaceState(mergedState({ overlay: null }), '', urlFrom(clean)); } catch (e) {}

    /* let the opening transitions settle before listening for changes */
    setTimeout(function () { restoring = false; }, 900);
  }

  /* ---------- sharing ------------------------------------------ */
  function describe() {
    var p = params(), bits = [];
    var c = OV.case.read(p);
    if (c) bits.push({ yojanasahay: 'the YojanaSahay case study', studylens: 'the StudyLens AI case study',
                       portfolio: 'the portfolio case study' }[c]);
    if (OV.code.read(p)) bits.push(OV.code.read(p) + ' in the code editor');
    if (OV.report.read(p)) bits.push('the performance report');
    if (p.get('projects')) bits.push('your ' + p.get('projects') + ' projects');
    if (p.get('stack')) bits.push('the ' + p.get('stack') + ' stack filter');
    if (p.get('mode') === 'hacker') bits.push('hacker mode');
    if (location.hash) bits.push('the ' + location.hash.slice(1).replace(/-/g, ' ') + ' section');
    return bits;
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

  function share() {
    var url = location.href, bits = describe();
    var what = bits.length ? 'Opens ' + bits.join(', ') : 'Link to this page';
    /* native share sheet on phones; clipboard everywhere else */
    if (navigator.share) {
      navigator.share({ title: document.title, text: what, url: url }).catch(function () {});
      return;
    }
    copyText(url)
      .then(function () { toast('Link copied', what); })
      .catch(function () { toast('Could not copy', 'Copy the address bar instead'); });
  }

  /* ---------- toast (top-centre: bottom-centre is #shipToastRoot) */
  var toastEl, toastTimer;
  function toast(title, sub) {
    if (!toastEl) {
      var st = document.createElement('style');
      st.id = 'us-style';
      st.textContent =
        '#us-toast,#us-toast *{font-family:Inter,system-ui,-apple-system,sans-serif !important;' +
          'background-color:transparent !important;color:inherit !important;box-sizing:border-box !important}' +
        '#us-toast{position:fixed !important;left:50% !important;top:calc(env(safe-area-inset-top,0px) + 70px) !important;' +
          'z-index:100300 !important;transform:translate(-50%,-14px) !important;opacity:0 !important;pointer-events:none !important;' +
          'display:flex !important;align-items:center !important;gap:11px !important;max-width:min(92vw,440px) !important;' +
          'padding:11px 15px !important;border-radius:13px !important;color:#e6f4ff !important;' +
          'background:linear-gradient(180deg,rgba(16,27,44,.97),rgba(9,16,28,.97)) !important;' +
          'border:1px solid rgba(120,205,255,.26) !important;box-shadow:0 18px 44px rgba(0,0,0,.5) !important;' +
          'transition:opacity .22s ease,transform .22s cubic-bezier(.2,.8,.3,1) !important}' +
        '#us-toast.is-on{opacity:1 !important;transform:translate(-50%,0) !important}' +
        '#us-toast svg{width:18px !important;height:18px !important;flex:none !important;color:#6ff0bb !important}' +
        '#us-toast b{display:block !important;font-size:.84rem !important;font-weight:700 !important}' +
        '#us-toast span{display:block !important;font-size:.72rem !important;margin-top:2px !important;' +
          'color:rgba(180,212,236,.7) !important;line-height:1.4 !important}' +
        '@media (prefers-reduced-motion:reduce){#us-toast{transition:none !important}}';
      document.head.appendChild(st);
      toastEl = document.createElement('div');
      toastEl.id = 'us-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    toastEl.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
        'stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/>' +
        '<path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>' +
      '<div><b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>';
    clearTimeout(toastTimer);
    requestAnimationFrame(function () { toastEl.classList.add('is-on'); });
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ---------- Share popup -------------------------------------- */
  /* Quick links point at /share/<key>, which serves its own preview card
     to WhatsApp, LinkedIn and the rest before forwarding the visitor to
     the deep link. Plain ?case= links work too, they just all show the
     same homepage preview. */
  var QUICK = [
    ['yojanasahay', 'YojanaSahay case study',  'Government scheme finder, React PWA'],
    ['studylens',   'StudyLens AI case study', 'AI homework helper'],
    ['ui',          'UI projects',             'Scrolls to My Projects, UI filter on'],
    ['fullstack',   'Fullstack projects',      'Scrolls to My Projects, Fullstack filter on'],
    ['performance', 'Performance report',      'Live Core Web Vitals on their device'],
    ['hacker',      'Hacker mode',             'Opens straight into the retro terminal']
  ];
  /* the current view, when it matches a card we have */
  var SHARE_KEY = [
    ['case', 'yojanasahay', 'yojanasahay'], ['case', 'studylens', 'studylens'], ['case', 'portfolio', 'portfolio'],
    ['projects', 'ui', 'ui'], ['projects', 'fullstack', 'fullstack'],
    ['report', 'performance', 'performance'], ['mode', 'hacker', 'hacker']
  ];
  function cardFor(p) {
    var hit = null;
    SHARE_KEY.forEach(function (r) { if (p.get(r[0]) === r[1]) hit = r[2]; });
    return hit;
  }

  var ICON_LINK = '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>';
  var ICON_COPY = '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>';
  var ICON_SHARE = '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>';
  var svg = function (d, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) +
           '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  };

  /* ID-scoped and !important throughout: hacker mode forces colour,
     background and font on every element with !important */
  var SHARE_RULES = [
'#us-overlay,#us-overlay *{font-family:Inter,system-ui,-apple-system,sans-serif;background-color:transparent;color:inherit;box-sizing:border-box}',
'#us-overlay{position:fixed;inset:0;z-index:100210;display:none;align-items:flex-start;justify-content:center;padding:8vh 16px 16px;',
'  background:radial-gradient(120% 90% at 50% 0%,rgba(8,20,34,.82),rgba(2,7,14,.9));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
'#us-overlay.is-open{display:flex}',
'#us-box{width:100%;max-width:560px;position:relative;display:flex;flex-direction:column;max-height:84vh;overflow:hidden;color:#d2e8f8;',
'  background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99));border:1px solid rgba(120,205,255,.2);border-radius:18px;',
'  box-shadow:0 40px 90px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,255,255,.05)}',
'#us-head{display:flex;align-items:center;gap:11px;padding:16px;border-bottom:1px solid rgba(120,205,255,.12);flex:0 0 auto}',
'#us-head>svg{width:19px;height:19px;flex:none;color:#8ad8ff}',
'#us-title{flex:1;min-width:0}',
'#us-title b{display:block;font-size:.98rem;font-weight:700;color:#eaf6ff}',
'#us-title span{display:block;font-size:.72rem;margin-top:2px;color:rgba(172,208,233,.55)}',
'#us-close{flex:none;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;cursor:pointer;',
'  color:rgba(190,222,242,.8);background-color:rgba(130,200,240,.08);border:1px solid rgba(140,200,235,.24)}',
'#us-close svg{width:15px;height:15px}',
'#us-body{overflow-y:auto;padding:14px 16px 18px;flex:1 1 auto;overscroll-behavior:contain;text-align:left}',
'#us-body .us-sec{margin:18px 0 10px;display:flex;align-items:center;gap:9px;font-size:.58rem;font-weight:700;letter-spacing:.16em;',
'  text-transform:uppercase;color:rgba(150,200,230,.45)}',
'#us-body .us-sec:first-child{margin-top:2px}',
'#us-body .us-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(120,200,255,.18),transparent)}',
'#us-body .us-url{padding:11px 13px;border-radius:11px;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:.74rem;',
'  line-height:1.5;word-break:break-all;color:#9fdcff;background-color:rgba(120,200,255,.06);border:1px solid rgba(120,200,255,.16);',
'  user-select:all;-webkit-user-select:all}',
'#us-body .us-what{margin-top:9px;font-size:.74rem;line-height:1.5;color:rgba(185,215,238,.7)}',
'#us-body .us-what b{color:#e2f1fc;font-weight:600}',
'#us-body .us-acts{display:flex;gap:9px;margin-top:12px}',
'#us-body .us-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;border-radius:11px;cursor:pointer;',
'  font-size:.8rem;font-weight:700;color:#04121a;background-color:#6fd8ff;border:1px solid #6fd8ff}',
'#us-body .us-btn.is-ghost{color:#dff2ff;background-color:rgba(120,200,255,.1);border-color:rgba(130,200,240,.28)}',
'#us-body .us-btn svg{width:15px;height:15px}',
'#us-body .us-btn.is-done{color:#04121a;background-color:#5fe8ad;border-color:#5fe8ad}',
'#us-body .us-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid rgba(120,200,255,.07)}',
'#us-body .us-row:last-child{border-bottom:none}',
'#us-body .us-row>svg{width:15px;height:15px;flex:none;color:rgba(125,205,245,.6)}',
'#us-body .us-k{flex:1;min-width:0}',
'#us-body .us-k b{display:block;font-size:.84rem;font-weight:600;color:#e2f1fc}',
'#us-body .us-k span{display:block;font-size:.7rem;margin-top:2px;color:rgba(172,208,233,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#us-body .us-mini{flex:none;display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:9px;cursor:pointer;font-size:.72rem;',
'  font-weight:600;color:#dff2ff;background-color:rgba(120,200,255,.09);border:1px solid rgba(130,200,240,.24)}',
'#us-body .us-mini svg{width:13px;height:13px}',
'#us-body .us-mini.is-done{color:#6ff0bb;border-color:rgba(79,224,162,.45);background-color:rgba(79,224,162,.12)}',
'#us-body .us-note{margin-top:16px;padding:10px 12px;border-radius:10px;font-size:.7rem;line-height:1.55;color:rgba(178,212,236,.62);',
'  background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.11)}',
'@media (max-width:640px){#us-overlay{padding:4vh 10px 10px}#us-box{max-height:90vh;border-radius:16px}}'
  ].join('\n');
  function importantAll(css) {
    return css.replace(/([a-z-]+\s*:\s*[^;{}]+?)\s*(;|})/g, function (m, d, end) {
      return (/!important$/.test(d) ? d : d + ' !important') + end;
    });
  }

  var sov, sbody;
  function shareBase() { return location.origin + location.pathname; }

  function buildShare() {
    if (sov) return;
    var st = document.createElement('style');
    st.id = 'us-popup-style';
    st.textContent = importantAll(SHARE_RULES);
    document.head.appendChild(st);
    sov = document.createElement('div');
    sov.id = 'us-overlay';
    sov.setAttribute('role', 'dialog');
    sov.setAttribute('aria-modal', 'true');
    sov.setAttribute('aria-label', 'Share this view');
    sov.innerHTML =
      '<div id="us-box">' +
        '<div id="us-head">' + svg(ICON_SHARE, 1.8) +
          '<span id="us-title"><b>Share This View</b><span>A link that reopens exactly this</span></span>' +
          '<button id="us-close" type="button" aria-label="Close">' + svg('<path d="M18 6 6 18M6 6l12 12"/>') + '</button>' +
        '</div>' +
        '<div id="us-body"></div>' +
      '</div>';
    document.body.appendChild(sov);
    sbody = $('us-body');
    sov.addEventListener('click', function (e) { if (e.target === sov) closeShare(); });
    $('us-close').addEventListener('click', function () { closeShare(); });
    sbody.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-us-copy]');
      if (c) { copyFrom(c, c.getAttribute('data-us-copy')); return; }
      var n = e.target.closest && e.target.closest('[data-us-native]');
      if (n && navigator.share) {
        navigator.share({ title: document.title, url: location.href }).catch(function () {});
      }
    });
  }

  function copyFrom(btn, url) {
    var label = btn.querySelector('span');
    var before = label ? label.textContent : '';
    copyText(url).then(function () {
      btn.classList.add('is-done');
      if (label) label.textContent = 'Copied';
    }).catch(function () {
      if (label) label.textContent = 'Failed';
    }).then(function () {
      setTimeout(function () { btn.classList.remove('is-done'); if (label) label.textContent = before; }, 1500);
    });
  }

  function renderShare() {
    var bits = describe();
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    var key = cardFor(params());
    var here = key ? location.origin + '/share/' + key : location.href;
    sbody.innerHTML =
      '<div class="us-sec">This view</div>' +
      '<div class="us-url">' + esc(here) + '</div>' +
      '<div class="us-what">' + (bits.length ? 'Opens <b>' + esc(bits.join(', ')) + '</b>'
                                              : 'Opens the <b>top of the page</b>') + '</div>' +
      '<div class="us-acts">' +
        '<button type="button" class="us-btn" data-us-copy="' + esc(here) + '">' + svg(ICON_COPY) + '<span>Copy link</span></button>' +
        (navigator.share ? '<button type="button" class="us-btn is-ghost" data-us-native>' + svg(ICON_SHARE) + '<span>Share\u2026</span></button>' : '') +
      '</div>' +
      '<div class="us-sec">Quick links</div>' +
      QUICK.map(function (q) {
        var url = location.origin + '/share/' + q[0];
        return '<div class="us-row">' + svg(ICON_LINK) +
                 '<span class="us-k"><b>' + esc(q[1]) + '</b><span>' + esc(q[2]) + '</span></span>' +
                 '<button type="button" class="us-mini" data-us-copy="' + esc(url) + '">' + svg(ICON_COPY) + '<span>Copy</span></button>' +
               '</div>';
      }).join('') +
      '<div class="us-note">Links starting <b>/share/</b> show their own preview card on WhatsApp, ' +
        'LinkedIn and Slack, then open the same view. Plain links combine \u2014 ' +
        '<b>?mode=hacker&amp;case=studylens</b> works \u2014 and keep tracking tags such as ' +
        '<b>?utm_source=linkedin</b>.</div>';
  }

  function shareOpen() { return !!(sov && sov.classList.contains('is-open')); }
  function openShare() {
    buildShare();
    renderShare();
    sov.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    window.shzPopupOpened('share', function () { closeShare(true); });
  }
  function closeShare(fromHistory) {
    if (!shareOpen()) return;
    sov.classList.remove('is-open');
    document.body.style.overflow = '';
    if (!fromHistory) window.shzPopupClosed('share');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && shareOpen()) closeShare();
  });

  /* ---------- boot --------------------------------------------- */
  function boot() {
    var pending = { wrapCase: 1, watchCase: 1, wrapFile: 1, watchCode: 1 };
    var tries = 0;
    (function attach() {
      if (pending.wrapCase  && wrapOpenCase()) delete pending.wrapCase;
      if (pending.watchCase && watchCase())    delete pending.watchCase;
      if (pending.wrapFile  && wrapOpenFile()) delete pending.wrapFile;
      if (pending.watchCode && watchCode())    delete pending.watchCode;
      if (Object.keys(pending).length && ++tries < 30) return setTimeout(attach, 100);
      watchReport();
      watchModeAndStack();
      restore();
    })();
  }
  /* Boot on DOMContentLoaded, not load. `load` waits for every image and
     font, so a shared ?case= link on a slow connection would sit on the
     homepage for seconds before opening. Everything this drives is built
     by scripts that load earlier, and DOMContentLoaded listeners run in
     registration order, so theirs have finished before ours runs. The
     retry loop in boot() still covers anything that arrives late. */
  if (document.readyState !== 'loading') setTimeout(boot, 60);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 60); });

  window.shareCurrentView = share;
  window.openSharePopup = openShare;

  /* ---------- command palette ---------------------------------- */
  function registerCmd() {
    if (typeof window.registerPaletteCommands !== 'function') return false;
    window.registerPaletteCommands([{
      t: 'Share This View',
      s: 'A link that reopens exactly what you are looking at',
      g: 'Share & contact',
      k: 'share link copy url send deep link',
      i: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
      run: function () { setTimeout(openShare, 120); return true; }
    }]);
    return true;
  }
  if (!registerCmd()) {
    var t = 0, iv = setInterval(function () { if (registerCmd() || ++t > 40) clearInterval(iv); }, 150);
  }
})();
