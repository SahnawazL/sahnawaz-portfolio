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
    { t:'YojanaSahay',   s:'Case study — govt scheme finder (PWA)', g:'Case studies', i:I.project, k:'yojana sahay welfare scheme react pwa india',
      when:function(){ return has('openCaseStudy'); }, run:function(){ return call('openCaseStudy','yojanasahay'); } },
    { t:'StudyLens AI',  s:'Case study — AI homework helper',       g:'Case studies', i:I.project, k:'studylens ai student groq gemini education',
      when:function(){ return has('openCaseStudy'); }, run:function(){ return call('openCaseStudy','studylens'); } },
    { t:'This Portfolio', s:'Case study — how this site is built',  g:'Case studies', i:I.project, k:'portfolio site itself meta build',
      when:function(){ return has('openCaseStudy'); }, run:function(){ return call('openCaseStudy','portfolio'); } },

    /* --- actions --- */
    { t:'Toggle Hacker Mode', s:'Retro terminal takeover', g:'Interactive', i:I.term, k:'hacker terminal retro crt green matrix',
      run:function(){
        document.body.classList.toggle('hacker-mode');
        if (has('syncHackerToggleIcon')) window.syncHackerToggleIcon();
        return true;
      } },
    { t:'Open Code Editor', s:'Live editor with runnable files', g:'Interactive', i:I.code, k:'code editor vscode popup run javascript',
      when:function(){ return has('_openCodePopup') || $('codeBtn'); },
      run:function(){
        if (call('_openCodePopup')) return true;
        var b = $('codeBtn'); if (b) { b.click(); return true; }
        return false;
      } },
    { t:'Open session.js', s:'Live telemetry about your device', g:'Interactive', i:I.code, k:'session live device battery browser telemetry',
      when:function(){ return has('_openCodePopup') && has('_cpOpenFile'); },
      run:function(){ window._openCodePopup(); setTimeout(function(){ window._cpOpenFile('session.js'); }, 300); return true; } },
    { t:'Ask the AI Assistant', s:'Chat about my work', g:'Interactive', i:I.chat, k:'chat ai assistant bot ask question',
      when:function(){ return has('openChat') || $('chatToggle'); },
      run:function(){
        if (call('openChat')) return true;
        var b = $('chatToggle') || document.querySelector('[id*="chatToggle"],[class*="chat-fab"]');
        if (b) { b.click(); return true; }
        return false;
      } },
    { t:'Get the Resume', s:'Delivered to your inbox', g:'Share & contact', i:I.doc, k:'resume cv download pdf hire',
      when:function(){ return has('openGateModal') || document.querySelector('[onclick*="openGateModal"]'); },
      run:function(){
        if (call('openGateModal')) return true;
        var b = document.querySelector('[onclick*="openGateModal"]');
        if (b) { b.click(); return true; }
        return false;
      } },

    /* --- links --- */
    { t:'GitHub',    s:'github.com/SahnawazL',      g:'Links', i:I.link, k:'github code repo source',
      run:function(){ openExternal('https://github.com/SahnawazL'); return true; } },
    { t:'Instagram', s:'@sahnawaz.ui.dev',          g:'Links', i:I.link, k:'instagram social ig',
      run:function(){ openExternal('https://www.instagram.com/sahnawaz.ui.dev'); return true; } },
    { t:'YojanaSahay (live)', s:'yojanasahay.vercel.app', g:'Links', i:I.link, k:'yojana live app open',
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

  /* Groups always appear once each, in this order when browsing. The
     palette draws a heading whenever the group changes, so any ordering
     that splits a group — commands registered later by other modules,
     or search results sorted purely by score — would repeat headings. */
  var GROUP_ORDER = ['Go to', 'Case studies', 'Interactive', 'Performance', 'Share & contact', 'Links'];
  function groupRank(g) {
    var i = GROUP_ORDER.indexOf(g);
    /* a group this file doesn't know yet sits just before Links */
    return i < 0 ? GROUP_ORDER.length - 1.5 : i;
  }

  function search(q) {
    var live = COMMANDS.filter(function (c) {
      try { return !c.when || c.when(); } catch (e) { return false; }
    }).map(function (c, i) { return { c: c, i: i }; });

    if (!q.trim()) {
      /* browsing: groups in fixed order, commands in their listed order */
      return live.sort(function (a, b) {
        return (groupRank(a.c.g) - groupRank(b.c.g)) || (a.i - b.i);
      }).map(function (r) { return r.c; });
    }

    /* searching: the group holding the best match comes first, and each
       group stays together, best match first inside it */
    var scored = live.map(function (r) {
      var c = r.c;
      r.v = Math.max(
        score(q, c.t),
        score(q, c.s || '') - 120,
        score(q, c.k || '') - 180,
        score(q, c.g || '') - 200
      );
      return r;
    }).filter(function (r) { return r.v > -1; });

    var best = {};
    scored.forEach(function (r) {
      if (!(r.c.g in best) || r.v > best[r.c.g]) best[r.c.g] = r.v;
    });
    return scored.sort(function (a, b) {
      return (best[b.c.g] - best[a.c.g]) ||
             (groupRank(a.c.g) - groupRank(b.c.g)) ||
             (b.v - a.v) || (a.i - b.i);
    }).map(function (r) { return r.c; });
  }

  /* ---------- styles -------------------------------------- */
  var CSS = [
/* shell */
'#cmdp-overlay{position:fixed;inset:0;z-index:100200;display:none;',
'  background:radial-gradient(120% 90% at 50% 0%,rgba(8,20,34,.78),rgba(2,7,14,.88));',
'  backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);',
'  align-items:flex-start;justify-content:center;padding:10vh 16px 16px;}',
'#cmdp-overlay.is-open{display:flex;animation:cmdpFade .18s ease both;}',
'@keyframes cmdpFade{from{opacity:0}to{opacity:1}}',
'#cmdp-box{width:100%;max-width:480px;position:relative;display:flex;flex-direction:column;max-height:72vh;',
'  background:linear-gradient(180deg,rgba(14,23,37,.99),rgba(9,15,26,.99));',
'  border:1px solid rgba(120,205,255,.18);border-radius:16px;overflow:hidden;',
'  box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05);',
'  animation:cmdpRise .24s cubic-bezier(.2,.85,.3,1) both;}',
'@keyframes cmdpRise{from{opacity:0;transform:translateY(-10px) scale(.985)}to{opacity:1;transform:none}}',
'#cmdp-box::before{content:"";position:absolute;top:0;left:14%;right:14%;height:1px;',
'  background:linear-gradient(90deg,transparent,rgba(120,220,255,.5),transparent);}',

/* search bar */
'#cmdp-head{display:flex;align-items:center;gap:10px;padding:10px 11px 10px 14px;',
'  border-bottom:1px solid rgba(120,205,255,.1);flex:0 0 auto;}',
'#cmdp-head>svg{width:15px;height:15px;flex:none;color:rgba(130,205,245,.7);}',
'#cmdp-input{flex:1;background:transparent;border:none;outline:none;color:#eaf6ff;',
'  font-family:inherit;font-size:.88rem;min-width:0;padding:3px 0;}',
'#cmdp-input::placeholder{color:rgba(160,200,230,.4);}',
'#cmdp-close{flex:none;display:flex;align-items:center;justify-content:center;padding:0;',
'  height:26px;min-width:38px;border-radius:7px;cursor:pointer;font-family:inherit;',
'  font-size:.54rem;letter-spacing:.1em;color:rgba(175,215,240,.7);',
'  background:rgba(130,200,240,.07);border:1px solid rgba(140,200,235,.2);',
'  transition:background .16s ease,color .16s ease;}',
'#cmdp-close:hover{background:rgba(130,200,240,.16);color:#eaf7ff;}',
'#cmdp-close:active{transform:scale(.94);}',
'#cmdp-close .cmdp-x{display:none;width:14px;height:14px;}',

/* list */
'#cmdp-list{overflow-y:auto;padding:5px 6px 8px;flex:1 1 auto;overscroll-behavior:contain;position:relative;}',
'#cmdp-list::-webkit-scrollbar{width:8px}',
'#cmdp-list::-webkit-scrollbar-thumb{background:rgba(120,200,255,.15);border-radius:8px;',
'  border:3px solid transparent;background-clip:content-box;}',
'.cmdp-hint{padding:6px 9px 2px;font-size:.68rem;line-height:1.4;color:rgba(170,208,233,.48);}',
'.cmdp-group{padding:10px 9px 4px;font-size:.55rem;font-weight:700;letter-spacing:.16em;',
'  text-transform:uppercase;color:rgba(150,200,230,.4);}',

/* category row (the accordion header) */
'.cmdp-cat{width:100%;display:flex;align-items:center;gap:10px;padding:7px 8px;margin:1px 0;',
'  border:none;border-radius:10px;background:transparent;cursor:pointer;font-family:inherit;',
'  text-align:left;color:#d4e9f8;transition:background .18s ease,color .18s ease;}',
'.cmdp-cat-ic{flex:none;display:flex;align-items:center;justify-content:center;width:28px;height:28px;',
'  border-radius:8px;background:rgba(120,200,255,.07);border:1px solid rgba(120,200,255,.13);',
'  transition:background .22s ease,border-color .22s ease;}',
'.cmdp-cat-ic svg{width:14px;height:14px;color:#8ad8ff;}',
'.cmdp-cat-t{flex:1;min-width:0;font-size:.8rem;font-weight:600;letter-spacing:.1px;}',
'.cmdp-badge{flex:none;min-width:20px;text-align:center;padding:1px 7px;border-radius:20px;',
'  font-family:ui-monospace,"SF Mono",monospace;font-size:.6rem;font-weight:600;',
'  color:rgba(190,225,245,.66);background:rgba(120,200,255,.08);}',
'.cmdp-chev{flex:none;width:13px;height:13px;color:rgba(150,205,235,.45);',
'  transition:transform .3s cubic-bezier(.2,.8,.2,1),color .2s ease;}',
'.cmdp-sec.is-open .cmdp-cat{color:#fff;}',
'.cmdp-sec.is-open .cmdp-chev{transform:rotate(90deg);color:#8ad8ff;}',
'.cmdp-sec.is-open .cmdp-cat-ic{background:rgba(110,210,255,.15);border-color:rgba(130,215,255,.36);}',

/* the smooth reveal: height animates from 0 to its natural size,
   then each row fades in a beat after the one above it */
'.cmdp-sec-body{display:grid;grid-template-rows:0fr;',
'  transition:grid-template-rows .32s cubic-bezier(.2,.8,.2,1);}',
'.cmdp-sec.is-open .cmdp-sec-body{grid-template-rows:1fr;}',
'.cmdp-sec-in{overflow:hidden;min-height:0;margin-left:21px;padding-left:9px;',
'  border-left:1px solid rgba(120,200,255,.14);}',
'.cmdp-sec .cmdp-item{opacity:0;transform:translateY(-5px);',
'  transition:opacity .16s ease,transform .2s ease,background .15s ease;}',
'.cmdp-sec.is-open .cmdp-item{opacity:1;transform:none;transition-delay:calc(var(--d,0) * 30ms);}',

/* command row */
'.cmdp-item{display:flex;align-items:center;gap:10px;padding:6px 8px;margin:1px 0;border-radius:9px;',
'  cursor:pointer;color:#cfe6f7;}',
'.cmdp-item>svg{width:14px;height:14px;flex:none;color:rgba(125,205,245,.6);}',
'.cmdp-txt{min-width:0;flex:1;}',
'.cmdp-t{display:block;font-size:.78rem;font-weight:600;line-height:1.3;color:#e3f1fc;',
'  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'.cmdp-s{display:block;font-size:.66rem;line-height:1.3;margin-top:1px;color:rgba(170,206,232,.5);',
'  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',

/* states: tap feedback everywhere, hover only with a real pointer,
   and a highlight only once the keyboard is actually used */
'.cmdp-item:active,.cmdp-cat:active{background:rgba(110,205,255,.12);}',
'@media (hover:hover){.cmdp-item:hover,.cmdp-cat:hover{background:rgba(110,205,255,.07);}}',
'.cmdp-item.is-active,.cmdp-cat.is-active{background:rgba(95,205,255,.13);box-shadow:inset 2px 0 0 #5ac8ff;}',
'.cmdp-empty{padding:22px 14px;text-align:center;color:rgba(170,205,230,.5);font-size:.76rem;line-height:1.6;}',
'.cmdp-empty b{color:rgba(210,235,250,.8);font-weight:600;}',

/* footer (desktop only) */
'#cmdp-foot{display:flex;align-items:center;gap:14px;padding:7px 13px;',
'  border-top:1px solid rgba(120,205,255,.1);background:rgba(6,12,21,.5);',
'  font-size:.6rem;color:rgba(160,200,230,.42);flex:0 0 auto;}',
'#cmdp-hints{display:flex;gap:14px;flex-wrap:wrap}',
'#cmdp-foot kbd{font-family:ui-monospace,"SF Mono",monospace;font-size:.95em;',
'  color:rgba(200,230,248,.8);background:rgba(130,200,240,.09);',
'  border:1px solid rgba(140,200,235,.2);border-radius:4px;padding:0 4px;margin-right:4px;}',
'#cmdp-count{margin-left:auto;letter-spacing:.05em;}',

'@media (max-width:640px){',
'  #cmdp-overlay{padding:7vh 10px 10px;}',
'  #cmdp-box{max-height:80vh;border-radius:14px;}',
'  #cmdp-input{font-size:16px;}',            /* below 16px iOS zooms the page on focus */
'  #cmdp-close{min-width:32px;height:30px;}',
'  #cmdp-close .cmdp-esc{display:none;}',
'  #cmdp-close .cmdp-x{display:block;}',
'  #cmdp-foot{display:none;}',
'}',
'@media (prefers-reduced-motion:reduce){',
'  #cmdp-overlay.is-open,#cmdp-box{animation:none!important;}',
'  .cmdp-sec-body,.cmdp-sec .cmdp-item,.cmdp-chev{transition:none!important;}',
'}'
  ].join('\n');

  /* ---------- build ---------------------------------------- */
  var overlay, input, list, results = [], active = 0, lastFocus = null;

  /* ---------- categories ------------------------------------ */
  var GROUP_ICON = {
    'Go to':           I.section,
    'Case studies':    I.project,
    'Interactive':     I.term,
    'Performance':     '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    'Share & contact': '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    'Links':           I.link
  };

  /* ---------- recent commands -------------------------------- */
  var RKEY = 'cmdp-recent';
  function getRecent() {
    try { var a = JSON.parse(localStorage.getItem(RKEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function pushRecent(t) {
    try {
      var a = getRecent().filter(function (x) { return x !== t; });
      a.unshift(t);
      localStorage.setItem(RKEY, JSON.stringify(a.slice(0, 4)));
    } catch (e) {}
  }
  function liveCommands() {
    return COMMANDS.filter(function (c) {
      try { return !c.when || c.when(); } catch (e) { return false; }
    });
  }

  /* ---------- build ------------------------------------------ */
  var cmds = [], openGroup = null, paletteEntry = false;

  function build() {
    var st = document.createElement('style');
    st.id = 'cmdp-style';
    st.textContent = CSS;
    document.head.appendChild(st);

    overlay = document.createElement('div');
    overlay.id = 'cmdp-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Quick search');
    overlay.innerHTML =
      '<div id="cmdp-box">' +
        '<div id="cmdp-head">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
            'stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<input id="cmdp-input" type="text" autocomplete="off" autocorrect="off" ' +
            'spellcheck="false" placeholder="Search\u2026" aria-label="Search">' +
          '<button id="cmdp-close" type="button" aria-label="Close">' +
            '<span class="cmdp-esc">ESC</span>' +
            '<svg class="cmdp-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="cmdp-list" role="listbox"></div>' +
        '<div id="cmdp-foot"><span id="cmdp-hints">' +
          '<span><kbd>\u2191\u2193</kbd>move</span><span><kbd>\u21B5</kbd>open</span><span><kbd>esc</kbd>close</span>' +
        '</span><span id="cmdp-count"></span></div>' +
      '</div>';
    document.body.appendChild(overlay);

    input = $('cmdp-input');
    list  = $('cmdp-list');

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    $('cmdp-head').addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#cmdp-close')) return;
      try { input.focus(); } catch (err) {}
    });
    $('cmdp-close').addEventListener('click', function (e) { e.preventDefault(); close(); });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', onKeys);
    /* one listener for every row: a category toggles, a command runs */
    list.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var cat = e.target.closest('.cmdp-cat');
      if (cat) { toggle(cat.getAttribute('data-g')); return; }
      var it = e.target.closest('[data-c]');
      if (it) run(+it.getAttribute('data-c'));
    });
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function svgI(path, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) +
           '" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  /* ---------- rows -------------------------------------------- */
  function cmdRow(c, d) {
    var n = cmds.length;
    cmds.push(c);
    return '<div class="cmdp-item" data-c="' + n + '" role="option"' +
             (d != null ? ' style="--d:' + d + '"' : '') + '>' +
             svgI(c.i) +
             '<span class="cmdp-txt"><span class="cmdp-t">' + esc(c.t) + '</span>' +
               (c.s ? '<span class="cmdp-s">' + esc(c.s) + '</span>' : '') + '</span>' +
           '</div>';
  }
  function section(g, items) {
    return '<div class="cmdp-sec" data-sec="' + esc(g) + '">' +
             '<button type="button" class="cmdp-cat" data-g="' + esc(g) + '" aria-expanded="false">' +
               '<span class="cmdp-cat-ic">' + svgI(GROUP_ICON[g] || I.action) + '</span>' +
               '<span class="cmdp-cat-t">' + esc(g) + '</span>' +
               '<span class="cmdp-badge">' + items.length + '</span>' +
               '<svg class="cmdp-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
                 'stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
             '</button>' +
             '<div class="cmdp-sec-body"><div class="cmdp-sec-in">' +
               items.map(function (c, i) { return cmdRow(c, i); }).join('') +
             '</div></div>' +
           '</div>';
  }
  function heading(t) { return '<div class="cmdp-group">' + esc(t) + '</div>'; }
  function setCount(t) { var el = $('cmdp-count'); if (el) el.textContent = t || ''; }

  /* ---------- render ------------------------------------------ */
  function render(q) {
    q = q || '';
    cmds = []; openGroup = null;
    var live = liveCommands(), html = '';

    if (q.trim()) {
      /* searching: every match, grouped, nothing to expand */
      results = search(q);
      if (!results.length) {
        html = '<div class="cmdp-empty">Nothing matches <b>' + esc(q) + '</b><br>' +
               'Try \u201cprojects\u201d, \u201cresume\u201d or \u201chacker\u201d.</div>';
        setCount('');
      } else {
        var grp = null;
        results.forEach(function (c) {
          if (c.g !== grp) { grp = c.g; html += heading(grp); }
          html += cmdRow(c);
        });
        setCount(results.length + (results.length === 1 ? ' result' : ' results'));
      }
      /* with a keyboard, mark the top match: that is what Enter will run */
      active = results.length && hasKeyboard() ? 0 : -1;
    } else {
      /* browsing: recent commands, then collapsed categories */
      var byTitle = {};
      live.forEach(function (c) { byTitle[c.t] = c; });
      var recent = getRecent().map(function (t) { return byTitle[t]; }).filter(Boolean).slice(0, 3);
      if (recent.length) {
        html += heading('Recent');
        recent.forEach(function (c) { html += cmdRow(c); });
      }
      var byGroup = {};
      live.forEach(function (c) { (byGroup[c.g] = byGroup[c.g] || []).push(c); });
      var groups = Object.keys(byGroup).sort(function (a, b) { return groupRank(a) - groupRank(b); });
      html += heading('Categories');
      html += '<div class="cmdp-hint">Tap a category to see its options.</div>';
      groups.forEach(function (g) { html += section(g, byGroup[g]); });
      setCount(groups.length + ' categories');
      active = -1;                              /* nothing pre-selected */
    }
    list.innerHTML = html;
    list.scrollTop = 0;
    paint();
  }

  /* ---------- accordion --------------------------------------- */
  function sections() { return Array.prototype.slice.call(list.querySelectorAll('.cmdp-sec')); }

  function toggle(g) {
    var opening = openGroup !== g, target = null;
    sections().forEach(function (sec) {
      var mine = sec.getAttribute('data-sec') === g;
      var on = mine && opening;
      sec.classList.toggle('is-open', on);
      var btn = sec.querySelector('.cmdp-cat');
      if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) target = sec;
    });
    openGroup = opening ? g : null;
    if (target) reveal(target);
    /* keep the keyboard highlight on the category that was toggled */
    if (active > -1) {
      var items = visible();
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('cmdp-cat') && items[i].getAttribute('data-g') === g) { active = i; break; }
      }
      paint();
    }
  }

  /* scroll just enough for the opened section to fit, starting while it
     is still opening, so the options glide into view together */
  function reveal(sec) {
    setTimeout(function () {
      var head = sec.querySelector('.cmdp-cat'), inner = sec.querySelector('.cmdp-sec-in');
      if (!head || !inner) return;
      var h = head.getBoundingClientRect(), box = list.getBoundingClientRect();
      var bottom = h.bottom + inner.scrollHeight;
      if (bottom <= box.bottom) return;
      var by = Math.min(bottom - box.bottom + 8, h.top - box.top - 4);
      if (by <= 0) return;
      try { list.scrollBy({ top: by, behavior: 'smooth' }); } catch (e) { list.scrollTop += by; }
    }, 40);
  }

  /* ---------- keyboard ---------------------------------------- */
  function visible() {
    return Array.prototype.slice.call(list.querySelectorAll('.cmdp-cat, .cmdp-item')).filter(function (el) {
      if (!el.classList.contains('cmdp-item')) return true;
      var sec = el.closest ? el.closest('.cmdp-sec') : null;
      return !sec || sec.classList.contains('is-open');
    });
  }
  function paint() {
    var items = visible();
    Array.prototype.forEach.call(list.querySelectorAll('.is-active'), function (el) { el.classList.remove('is-active'); });
    if (active < 0 || !items.length) return;
    if (active >= items.length) active = items.length - 1;
    var el = items[active];
    el.classList.add('is-active');
    var r = el.getBoundingClientRect(), p = list.getBoundingClientRect();
    if (r.bottom > p.bottom) list.scrollTop += r.bottom - p.bottom + 6;
    else if (r.top < p.top)  list.scrollTop -= p.top - r.top + 6;
  }
  function activate(el) {
    if (!el) return;
    if (el.classList.contains('cmdp-cat')) toggle(el.getAttribute('data-g'));
    else run(+el.getAttribute('data-c'));
  }

  function onKeys(e) {
    var items = visible(), el = items[active];
    if (e.key === 'ArrowDown') {
      e.preventDefault(); active = active < 0 ? 0 : Math.min(active + 1, items.length - 1); paint();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); active = active <= 0 ? 0 : active - 1; paint();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      /* phones have no highlight, so Enter from the on-screen keyboard
         runs the top search result */
      activate(el || (input.value.trim() ? items[0] : null));
    } else if (e.key === 'ArrowRight' && !input.value && el && el.classList.contains('cmdp-cat')) {
      if (openGroup !== el.getAttribute('data-g')) { e.preventDefault(); toggle(el.getAttribute('data-g')); }
    } else if (e.key === 'ArrowLeft' && !input.value && el) {
      var sec = el.closest ? el.closest('.cmdp-sec') : null;
      if (sec && sec.classList.contains('is-open')) { e.preventDefault(); toggle(sec.getAttribute('data-sec')); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (input.value) { input.value = ''; render(''); } else close();
    }
  }

  /* ---------- run a command ----------------------------------- */
  function run(n) {
    var c = cmds[n];
    if (!c) return;
    pushRecent(c.t);
    var popped = close();
    var go = function () { setTimeout(function () { try { c.run(); } catch (e) {} }, 60); };
    /* If closing stepped the browser back, wait for that to finish before
       running: a command that adds its own history step (a case study,
       the editor) would otherwise be popped straight off again. */
    if (popped) {
      var done = false;
      var fire = function () { if (done) return; done = true; removeEventListener('popstate', fire); go(); };
      addEventListener('popstate', fire);
      setTimeout(fire, 450);
    } else go();
  }

  /* ---------- open / close ------------------------------------ */
  function open() {
    if (!overlay) build();
    if (overlay.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    input.value = '';
    render('');
    document.body.style.overflow = 'hidden';
    /* the back gesture closes the palette, like every other popup here */
    if (typeof window.shzPopupOpened === 'function') {
      paletteEntry = true;
      window.shzPopupOpened('palette', function () { close(true); });
    }
    /* autofocus only with a real keyboard: on a phone it would summon the
       on-screen keyboard and cover the list */
    if (hasKeyboard()) setTimeout(function () { try { input.focus(); } catch (e) {} }, 40);
    else { try { input.blur(); } catch (e) {} }
  }

  /* returns true when closing will step the browser back one entry */
  function close(fromHistory) {
    if (!overlay || !overlay.classList.contains('is-open')) return false;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    var had = paletteEntry;
    paletteEntry = false;
    if (fromHistory || !had || typeof window.shzPopupClosed !== 'function') return false;
    var st = history.state;
    var willPop = !!(st && st.shz && st.overlay === 'popup:palette');
    window.shzPopupClosed('palette');
    return willPop;
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
