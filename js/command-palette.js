/* ============================================================
   COMMAND PALETTE  —  ByteWithSahnawaz
   Standalone. Injects its own CSS. No dependencies.

   Open with:  Ctrl+K / Cmd+K  ·  or  /  ·  or  window.openCommandPalette()
   Any element with  data-command-palette  also opens it on click.

   Everything it runs is a function that already exists on the page;
   if one is missing the entry is hidden rather than throwing.
   ============================================================ */
(function () {
  'use strict';

  if (window.__cmdPaletteLoaded) return;      // never double-install
  window.__cmdPaletteLoaded = true;

  /* ---------- helpers ------------------------------------- */
  var $ = function (id) { return document.getElementById(id); };

  function go(hash) {
    var el = document.querySelector(hash);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  function has(fn) { return typeof window[fn] === 'function'; }
  function call(fn, arg) { if (has(fn)) { window[fn](arg); return true; } return false; }

  function openExternal(url) { window.open(url, '_blank', 'noopener'); }

  /* ---------- icons (inline, no emoji) -------------------- */
  var I = {
    section : '<path d="M4 6h16M4 12h16M4 18h10"/>',
    project : '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    action  : '<path d="M13 2 3 14h8l-1 8 10-12h-8z"/>',
    code    : '<path d="M8 6 2 12l6 6"/><path d="m16 6 6 6-6 6"/>',
    chat    : '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    doc     : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    link    : '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    top     : '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    term    : '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>'
  };

  /* ---------- the index ----------------------------------- */
  /* `when` (optional) gates an entry on something existing.   */
  var COMMANDS = [
    /* --- navigation --- */
    { t:'My Projects',          s:'Work I have shipped',        g:'Go to', i:I.section, k:'work portfolio built', run:function(){ return go('#my-projects'); } },
    { t:'What I Offer',         s:'Services',                   g:'Go to', i:I.section, k:'services hire freelance', run:function(){ return go('#what-i-offer'); } },
    { t:'Key Achievements',     s:'Technical highlights',       g:'Go to', i:I.section, k:'achievements awards', run:function(){ return go('#achievements'); } },
    { t:'Tools & Services',     s:'Stack and tooling',          g:'Go to', i:I.section, k:'tools stack tech', run:function(){ return go('#tools-services'); } },
    { t:'Testimonials',         s:'What clients say',           g:'Go to', i:I.section, k:'clients reviews feedback', run:function(){ return go('#testimonials'); } },
    { t:'Certifications',       s:'Credentials',                g:'Go to', i:I.section, k:'certificates courses', run:function(){ return go('#certSection'); } },
    { t:'Blog',                 s:'Writing',                    g:'Go to', i:I.section, k:'articles posts writing', run:function(){ return go('#blog'); } },
    { t:'Live Telemetry',       s:'Recent build activity',      g:'Go to', i:I.section, k:'telemetry activity commits stats', run:function(){ return go('#recent-activity'); } },
    { t:'Why You Need a Website', s:'',                         g:'Go to', i:I.section, k:'why website business', run:function(){ return go('#why-website'); } },
    { t:'Contact',              s:'Start a conversation',       g:'Go to', i:I.section, k:'contact email hire reach', run:function(){ return go('#contact'); } },
    { t:'Leave Feedback',       s:'Site feedback',              g:'Go to', i:I.section, k:'feedback suggestion', run:function(){ return go('#site-feedback'); } },
    { t:'Back to Top',          s:'',                           g:'Go to', i:I.top,     k:'top home hero start', run:function(){ window.scrollTo({top:0,behavior:'smooth'}); return true; } },

    /* --- case studies --- */
    { t:'YojanaSahay',   s:'Case study — govt scheme finder (PWA)', g:'Case study', i:I.project, k:'yojana sahay welfare scheme react pwa india',
      when:function(){ return has('openCaseStudy'); }, run:function(){ return call('openCaseStudy','yojanasahay'); } },
    { t:'StudyLens AI',  s:'Case study — AI homework helper',       g:'Case study', i:I.project, k:'studylens ai student groq gemini education',
      when:function(){ return has('openCaseStudy'); }, run:function(){ return call('openCaseStudy','studylens'); } },
    { t:'This Portfolio', s:'Case study — how this site is built',  g:'Case study', i:I.project, k:'portfolio site itself meta build',
      when:function(){ return has('openCaseStudy'); }, run:function(){ return call('openCaseStudy','portfolio'); } },

    /* --- actions --- */
    { t:'Toggle Hacker Mode', s:'Retro terminal takeover', g:'Action', i:I.term, k:'hacker terminal retro crt green matrix',
      run:function(){
        document.body.classList.toggle('hacker-mode');
        if (has('syncHackerToggleIcon')) window.syncHackerToggleIcon();
        return true;
      } },
    { t:'Open Code Editor', s:'Live editor with runnable files', g:'Action', i:I.code, k:'code editor vscode popup run javascript',
      when:function(){ return has('_openCodePopup') || $('codeBtn'); },
      run:function(){
        if (call('_openCodePopup')) return true;
        var b = $('codeBtn'); if (b) { b.click(); return true; }
        return false;
      } },
    { t:'Open session.js', s:'Live telemetry about your device', g:'Action', i:I.code, k:'session live device battery browser telemetry',
      when:function(){ return has('_openCodePopup') && has('_cpOpenFile'); },
      run:function(){ window._openCodePopup(); setTimeout(function(){ window._cpOpenFile('session.js'); }, 300); return true; } },
    { t:'Ask the AI Assistant', s:'Chat about my work', g:'Action', i:I.chat, k:'chat ai assistant bot ask question',
      when:function(){ return has('openChat') || $('chatToggle'); },
      run:function(){
        if (call('openChat')) return true;
        var b = $('chatToggle') || document.querySelector('[id*="chatToggle"],[class*="chat-fab"]');
        if (b) { b.click(); return true; }
        return false;
      } },
    { t:'Get the Resume', s:'Delivered to your inbox', g:'Action', i:I.doc, k:'resume cv download pdf hire',
      when:function(){ return has('openGateModal') || document.querySelector('[onclick*="openGateModal"]'); },
      run:function(){
        if (call('openGateModal')) return true;
        var b = document.querySelector('[onclick*="openGateModal"]');
        if (b) { b.click(); return true; }
        return false;
      } },

    /* --- links --- */
    { t:'GitHub',    s:'github.com/SahnawazL',      g:'Link', i:I.link, k:'github code repo source',
      run:function(){ openExternal('https://github.com/SahnawazL'); return true; } },
    { t:'Instagram', s:'@sahnawaz.ui.dev',          g:'Link', i:I.link, k:'instagram social ig',
      run:function(){ openExternal('https://www.instagram.com/sahnawaz.ui.dev'); return true; } },
    { t:'YojanaSahay (live)', s:'yojanasahay.vercel.app', g:'Link', i:I.link, k:'yojana live app open',
      run:function(){ openExternal('https://yojanasahay.vercel.app'); return true; } }
  ];

  /* ---------- fuzzy matching -------------------------------
     Subsequence match with a score: consecutive hits and
     word-start hits rank higher, so "myp" finds "My Projects"
     above anything that merely contains those letters. */
  function score(needle, hay) {
    if (!needle) return 0;
    needle = needle.toLowerCase();
    hay = hay.toLowerCase();
    if (hay.indexOf(needle) === 0) return 1000;          // prefix
    var direct = hay.indexOf(needle);
    if (direct > -1) return 700 - direct;                 // substring
    var n = 0, s = 0, streak = 0, prev = -2;
    for (var h = 0; h < hay.length && n < needle.length; h++) {
      if (hay[h] === needle[n]) {
        streak = (h === prev + 1) ? streak + 1 : 0;
        s += 10 + streak * 6;
        if (h === 0 || hay[h-1] === ' ' || hay[h-1] === '-') s += 14;  // word start
        prev = h; n++;
      }
    }
    return n === needle.length ? s : -1;                  // must match all
  }

  /* Extension point: other standalone modules can add their own
     commands without this file needing to know about them.
       window.registerPaletteCommands([{ t, s, g, i, k, when, run }])
     Registering the same title twice replaces the earlier entry, so a
     module that loads late or re-runs never duplicates itself. */
  window.registerPaletteCommands = function (list) {
    if (!list || !list.length) return;
    list.forEach(function (c) {
      if (!c || !c.t || typeof c.run !== 'function') return;
      var at = -1;
      for (var i = 0; i < COMMANDS.length; i++) {
        if (COMMANDS[i].t === c.t) { at = i; break; }
      }
      if (!c.i) c.i = I.action;
      if (!c.g) c.g = 'Action';
      at > -1 ? (COMMANDS[at] = c) : COMMANDS.push(c);
    });
  };

  function search(q) {
    var live = COMMANDS.filter(function (c) {
      try { return !c.when || c.when(); } catch (e) { return false; }
    });
    if (!q.trim()) return live;
    return live.map(function (c) {
      var best = Math.max(
        score(q, c.t),
        score(q, c.s || '') - 120,
        score(q, c.k || '') - 180,
        score(q, c.g || '') - 200
      );
      return { c: c, v: best };
    }).filter(function (r) { return r.v > -1; })
      .sort(function (a, b) { return b.v - a.v; })
      .map(function (r) { return r.c; });
  }

  /* ---------- styles -------------------------------------- */
  var CSS = [
'#cmdp-overlay{position:fixed;inset:0;z-index:100200;display:none;',
'  background:radial-gradient(120% 90% at 50% 0%,rgba(8,20,34,.80),rgba(2,7,14,.88));',
'  backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);',
'  align-items:flex-start;justify-content:center;padding:11vh 16px 16px;}',
'#cmdp-overlay.is-open{display:flex;animation:cmdpFade .18s ease both;}',
'@keyframes cmdpFade{from{opacity:0}to{opacity:1}}',

'#cmdp-box{width:100%;max-width:580px;position:relative;',
'  background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99));',
'  border:1px solid rgba(120,205,255,.20);border-radius:18px;overflow:hidden;',
'  box-shadow:0 40px 90px rgba(0,0,0,.66),0 0 0 1px rgba(120,205,255,.05),',
'             inset 0 1px 0 rgba(255,255,255,.05);',
'  animation:cmdpRise .22s cubic-bezier(.2,.85,.3,1) both;',
'  display:flex;flex-direction:column;max-height:76vh;}',
'@keyframes cmdpRise{from{opacity:0;transform:translateY(-14px) scale(.98)}to{opacity:1;transform:none}}',
/* hairline of light along the top edge */
'#cmdp-box::before{content:"";position:absolute;top:0;left:12%;right:12%;height:1px;',
'  background:linear-gradient(90deg,transparent,rgba(120,220,255,.55),transparent);}',

'#cmdp-head{display:flex;align-items:center;gap:11px;padding:16px 16px 14px;',
'  border-bottom:1px solid rgba(120,205,255,.12);flex:0 0 auto;}',
'#cmdp-head>svg{width:18px;height:18px;flex:none;color:rgba(130,205,245,.72);}',
'#cmdp-input{flex:1;background:transparent;border:none;outline:none;color:#eaf6ff;',
'  font-family:inherit;font-size:1.02rem;letter-spacing:.1px;min-width:0;padding:2px 0;}',
'#cmdp-input::placeholder{color:rgba(160,200,230,.38);}',

/* real close control — keyboard hint on desktop, tappable X on touch */
'#cmdp-close{flex:none;display:flex;align-items:center;justify-content:center;gap:0;',
'  background:rgba(130,200,240,.07);border:1px solid rgba(140,200,235,.22);',
'  border-radius:8px;cursor:pointer;color:rgba(175,215,240,.72);',
'  font-family:inherit;font-size:.6rem;letter-spacing:.1em;padding:0;',
'  height:30px;min-width:46px;transition:all .16s ease;}',
'#cmdp-close:hover{background:rgba(130,200,240,.16);color:#eaf7ff;border-color:rgba(140,205,240,.42);}',
'#cmdp-close:active{transform:scale(.94);}',
'#cmdp-close .cmdp-x{display:none;width:15px;height:15px;}',

'#cmdp-list{overflow-y:auto;padding:8px 8px 10px;flex:1 1 auto;overscroll-behavior:contain;}',
'#cmdp-list::-webkit-scrollbar{width:9px}',
'#cmdp-list::-webkit-scrollbar-thumb{background:rgba(120,200,255,.16);border-radius:8px;',
'  border:3px solid transparent;background-clip:content-box;}',

'.cmdp-group{display:flex;align-items:center;gap:9px;font-size:.58rem;letter-spacing:.17em;',
'  text-transform:uppercase;color:rgba(150,200,230,.42);padding:13px 11px 7px;font-weight:600;}',
'.cmdp-group::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,',
'  rgba(120,200,255,.16),transparent);}',

'.cmdp-item{display:flex;align-items:center;gap:13px;padding:11px 12px;border-radius:11px;',
'  cursor:pointer;color:#d2e8f8;position:relative;transition:background .13s ease;}',
'.cmdp-item>svg{width:17px;height:17px;flex:none;color:rgba(125,205,245,.66);transition:color .13s ease;}',
'.cmdp-txt{min-width:0;flex:1;}',
/* these MUST be block: as inline spans the title and subtitle ran together */
'.cmdp-t{display:block;font-size:.91rem;font-weight:600;line-height:1.3;color:#e6f3ff;',
'  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.cmdp-s{display:block;font-size:.735rem;line-height:1.35;margin-top:2px;',
'  color:rgba(172,208,233,.56);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.cmdp-go{flex:none;width:15px;height:15px;opacity:0;color:#7fe0ff;transition:opacity .13s ease;}',

'.cmdp-item.is-active{background:linear-gradient(90deg,rgba(95,205,255,.17),rgba(95,205,255,.03));}',
'.cmdp-item.is-active::before{content:"";position:absolute;left:0;top:18%;bottom:18%;width:2.5px;',
'  border-radius:0 3px 3px 0;background:linear-gradient(180deg,#7fe0ff,#4aa8ff);',
'  box-shadow:0 0 10px rgba(110,215,255,.75);}',
'.cmdp-item.is-active>svg{color:#8ce6ff;}',
'.cmdp-item.is-active .cmdp-go{opacity:.85;}',

'.cmdp-empty{padding:34px 16px;text-align:center;color:rgba(170,205,230,.5);font-size:.85rem;line-height:1.6;}',
'.cmdp-empty b{color:rgba(210,235,250,.8);font-weight:600;}',

'#cmdp-foot{display:flex;align-items:center;gap:16px;padding:10px 15px;',
'  border-top:1px solid rgba(120,205,255,.11);background:rgba(6,12,21,.5);',
'  font-size:.645rem;color:rgba(160,200,230,.44);flex:0 0 auto;}',
'#cmdp-foot kbd{font-family:ui-monospace,"SF Mono",monospace;font-size:.95em;',
'  color:rgba(200,230,248,.82);background:rgba(130,200,240,.09);',
'  border:1px solid rgba(140,200,235,.2);border-radius:4px;padding:1px 5px;margin-right:4px;}',
'#cmdp-count{margin-left:auto;letter-spacing:.06em;}',

'@media (max-width:640px){',
'  #cmdp-overlay{padding:6vh 10px 10px;}',
'  #cmdp-box{max-height:84vh;border-radius:16px;}',
'  #cmdp-input{font-size:16px;}',            /* 16px stops iOS zooming on focus */
'  .cmdp-item{padding:13px 12px;}',
'  .cmdp-t{font-size:.95rem;}',
'  .cmdp-s{font-size:.78rem;white-space:normal;}',
'  #cmdp-close{min-width:38px;height:34px;}',
'  #cmdp-close .cmdp-esc{display:none;}',
'  #cmdp-close .cmdp-x{display:block;}',
'  #cmdp-foot{display:none;}',
'}',
'@media (prefers-reduced-motion:reduce){',
'  #cmdp-overlay.is-open,#cmdp-box{animation:none!important;}',
'}'
  ].join('\n');

  /* ---------- build ---------------------------------------- */
  var overlay, input, list, results = [], active = 0, lastFocus = null;

  function build() {
    var st = document.createElement('style');
    st.id = 'cmdp-style';
    st.textContent = CSS;
    document.head.appendChild(st);

    overlay = document.createElement('div');
    overlay.id = 'cmdp-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Command palette');
    overlay.innerHTML =
      '<div id="cmdp-box">' +
        '<div id="cmdp-head">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
            'stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<input id="cmdp-input" type="text" autocomplete="off" autocorrect="off" ' +
            'spellcheck="false" placeholder="Search sections, projects, actions\u2026" ' +
            'aria-label="Search commands">' +
          '<button id="cmdp-close" type="button" aria-label="Close search">' +
            '<span class="cmdp-esc">ESC</span>' +
            '<svg class="cmdp-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="cmdp-list" role="listbox"></div>' +
        '<div id="cmdp-foot">' +
          '<span><kbd>\u2191\u2193</kbd>navigate</span>' +
          '<span><kbd>\u21B5</kbd>select</span>' +
          '<span><kbd>esc</kbd>close</span>' +
          '<span id="cmdp-count"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    input = $('cmdp-input');
    list  = $('cmdp-list');

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    /* tapping the search row focuses the field deliberately */
    var head = $('cmdp-head');
    if (head) head.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#cmdp-close')) return;
      try { input.focus(); } catch (err) {}
    });
    var closeBtn = $('cmdp-close');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); close(); });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', onKeys);
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function render(q) {
    results = search(q || '');
    active = 0;
    if (!results.length) {
      list.innerHTML = '<div class="cmdp-empty">Nothing matches <b>' + esc(q) + '</b>' +
        '<br>Try \u201cprojects\u201d, \u201cresume\u201d or \u201chacker\u201d.</div>';
      setCount(0);
      return;
    }
    var html = '', group = null;
    results.forEach(function (c, idx) {
      if (c.g !== group) { group = c.g; html += '<div class="cmdp-group">' + esc(group) + '</div>'; }
      html +=
        '<div class="cmdp-item' + (idx === 0 ? ' is-active' : '') + '" data-i="' + idx + '" role="option">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
            'stroke-linecap="round" stroke-linejoin="round">' + c.i + '</svg>' +
          '<span class="cmdp-txt">' +
            '<span class="cmdp-t">' + esc(c.t) + '</span>' +
            (c.s ? '<span class="cmdp-s">' + esc(c.s) + '</span>' : '') +
          '</span>' +
          '<svg class="cmdp-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="m9 18 6-6-6-6"/></svg>' +
        '</div>';
    });
    list.innerHTML = html;
    setCount(results.length);
    Array.prototype.forEach.call(list.querySelectorAll('.cmdp-item'), function (el) {
      el.addEventListener('click', function () { exec(+el.getAttribute('data-i')); });
      el.addEventListener('mousemove', function () { setActive(+el.getAttribute('data-i')); });
    });
  }

  function setCount(n) {
    var el = $('cmdp-count');
    if (el) el.textContent = n ? n + (n === 1 ? ' result' : ' results') : '';
  }

  function setActive(i) {
    var items = list.querySelectorAll('.cmdp-item');
    if (!items.length) return;
    active = Math.max(0, Math.min(i, items.length - 1));
    Array.prototype.forEach.call(items, function (el, n) {
      el.classList.toggle('is-active', n === active);
    });
    var el = items[active];
    if (el) {
      var r = el.getBoundingClientRect(), p = list.getBoundingClientRect();
      if (r.bottom > p.bottom) list.scrollTop += r.bottom - p.bottom + 6;
      else if (r.top < p.top)  list.scrollTop -= p.top - r.top + 6;
    }
  }

  function exec(i) {
    var c = results[i];
    if (!c) return;
    close();
    /* let the overlay finish closing before the action moves the page */
    setTimeout(function () {
      try { c.run(); } catch (e) { /* an action failing must not break the palette */ }
    }, 90);
  }

  function onKeys(e) {
    if (e.key === 'ArrowDown')      { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter')     { e.preventDefault(); exec(active); }
    else if (e.key === 'Escape')    { e.preventDefault(); close(); }
    else if (e.key === 'Home')      { setActive(0); }
    else if (e.key === 'End')       { setActive(results.length - 1); }
  }

  function open() {
    if (!overlay) build();
    if (overlay.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    input.value = '';
    render('');
    document.body.style.overflow = 'hidden';
    /* Only autofocus where there is a real keyboard. On touch devices
       focusing the field summons the on-screen keyboard, which covers
       most of the screen and hides the very list the visitor came to
       browse. They can tap the field themselves when they want to type. */
    if (hasKeyboard()) {
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 40);
    } else {
      try { input.blur(); } catch (e) {}
    }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  /* ---------- global shortcuts ----------------------------- */
  /* A device is treated as keyboard-driven only when it has a fine
     pointer and real hover — that rules out phones and tablets, which
     report (hover:none) and (pointer:coarse). */
  function hasKeyboard() {
    try {
      if (navigator.maxTouchPoints > 0 &&
          window.matchMedia('(hover: none)').matches) return false;
      return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) { return false; }   /* unsure? don't force the keyboard open */
  }

  function typingInField(t) {
    if (!t) return false;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    /* Ctrl/Cmd + K — works even while typing elsewhere */
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      overlay && overlay.classList.contains('is-open') ? close() : open();
      return;
    }
    /* "/" — only when not already typing into something */
    if (e.key === '/' && !typingInField(e.target)) {
      if (document.body.classList.contains('hacker-mode')) return;  // terminal owns "/"
      e.preventDefault();
      open();
    }
  });

  /* any element can open it: <button data-command-palette>  */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-command-palette]');
    if (t) { e.preventDefault(); open(); }
  });

  window.openCommandPalette  = open;
  window.closeCommandPalette = close;
})();
