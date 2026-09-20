/* ==== index.html line 8672 ==== */

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM HUMAN-LIKE TYPING ENGINE v4 — CLEAN & RELIABLE
   - Syntax-highlighted token rendering (VS Code colours)
   - Variable-speed natural typing: fast bursts, pauses at punctuation
   - Blinking cursor that follows the text position
   - NO typo simulation (was causing rendering bugs — removed)
   - Sound: soft per-keystroke tick
   ═══════════════════════════════════════════════════════════════════ */
(function() {

  /* ── Flat token list: each entry = one coloured segment on one line ─ */
  /* Each line is an array of {text, color} segments. Empty = blank line */
  var LINES = [
    [ {text:'// portfolio.js \u2014 the build, not the bio',color:'#6a9955'} ],
    [ {text:'// run it \u25b6 to see what it returns',color:'#6a9955'} ],
    [],
    [ {text:'class ',color:'#569cd6'}, {text:'Developer',color:'#4ec9b0'}, {text:' {',color:'#d4d4d4'} ],
    [ {text:'  constructor',color:'#dcdcaa'}, {text:'(name) {',color:'#d4d4d4'} ],
    [ {text:'    this',color:'#569cd6'}, {text:'.name    = name;',color:'#d4d4d4'} ],
    [ {text:'    this',color:'#569cd6'}, {text:'.shipped = [];',color:'#d4d4d4'} ],
    [ {text:'    this',color:'#569cd6'}, {text:'.coffee  = ',color:'#d4d4d4'}, {text:'Infinity',color:'#b5cea8'}, {text:';',color:'#d4d4d4'} ],
    [ {text:'  }',color:'#d4d4d4'} ],
    [],
    [ {text:'  ship',color:'#dcdcaa'}, {text:'(project, users) {',color:'#d4d4d4'} ],
    [ {text:'    this',color:'#569cd6'}, {text:'.shipped.',color:'#d4d4d4'}, {text:'push',color:'#dcdcaa'}, {text:'({ project, users });',color:'#d4d4d4'} ],
    [ {text:'    return ',color:'#569cd6'}, {text:'this',color:'#569cd6'}, {text:';',color:'#d4d4d4'}, {text:'   // chainable',color:'#6a9955'} ],
    [ {text:'  }',color:'#d4d4d4'} ],
    [],
    [ {text:'  get ',color:'#569cd6'}, {text:'reach',color:'#dcdcaa'}, {text:'() {',color:'#d4d4d4'} ],
    [ {text:'    return this',color:'#569cd6'}, {text:'.shipped.',color:'#d4d4d4'}, {text:'reduce',color:'#dcdcaa'}, {text:'(',color:'#d4d4d4'} ],
    [ {text:'      (sum, p) => sum + p.users, ',color:'#d4d4d4'}, {text:'0',color:'#b5cea8'} ],
    [ {text:'    );',color:'#d4d4d4'} ],
    [ {text:'  }',color:'#d4d4d4'} ],
    [ {text:'}',color:'#d4d4d4'} ],
    [],
    [ {text:'const ',color:'#569cd6'}, {text:'shz',color:'#d4d4d4'}, {text:' = ',color:'#d4d4d4'}, {text:'new ',color:'#569cd6'}, {text:'Developer',color:'#4ec9b0'}, {text:'(',color:'#d4d4d4'}, {text:'"Sahnawaz"',color:'#ce9178'}, {text:')',color:'#d4d4d4'} ],
    [ {text:'  .',color:'#d4d4d4'}, {text:'ship',color:'#dcdcaa'}, {text:'(',color:'#d4d4d4'}, {text:'"YojanaSahay"',color:'#ce9178'}, {text:', ',color:'#d4d4d4'}, {text:'12000',color:'#b5cea8'}, {text:')',color:'#d4d4d4'} ],
    [ {text:'  .',color:'#d4d4d4'}, {text:'ship',color:'#dcdcaa'}, {text:'(',color:'#d4d4d4'}, {text:'"StudyLens AI"',color:'#ce9178'}, {text:', ',color:'#d4d4d4'}, {text:'8500',color:'#b5cea8'}, {text:')',color:'#d4d4d4'} ],
    [ {text:'  .',color:'#d4d4d4'}, {text:'ship',color:'#dcdcaa'}, {text:'(',color:'#d4d4d4'}, {text:'"this portfolio"',color:'#ce9178'}, {text:', ',color:'#d4d4d4'}, {text:'1',color:'#b5cea8'}, {text:');',color:'#d4d4d4'} ],
    [],
    [ {text:'const ',color:'#569cd6'}, {text:'result',color:'#d4d4d4'}, {text:' = {',color:'#d4d4d4'} ],
    [ {text:'  builder',color:'#9cdcfe'}, {text:': shz.name,',color:'#d4d4d4'} ],
    [ {text:'  projects',color:'#9cdcfe'}, {text:': shz.shipped.',color:'#d4d4d4'}, {text:'map',color:'#dcdcaa'}, {text:'(p => p.project),',color:'#d4d4d4'} ],
    [ {text:'  totalReach',color:'#9cdcfe'}, {text:': shz.reach,',color:'#d4d4d4'} ],
    [ {text:'  stillBuilding',color:'#9cdcfe'}, {text:': ',color:'#d4d4d4'}, {text:'true',color:'#569cd6'} ],
    [ {text:'};',color:'#d4d4d4'} ]
  ];
;

  /* ══ BATCH 3: multiple files ══
     Same {text,color} segment shape as LINES, so one renderer serves all. */
  var C = { com:'#6a9955', key:'#569cd6', prop:'#9cdcfe', str:'#ce9178',
            fn:'#dcdcaa', plain:'#d4d4d4', num:'#b5cea8' };

  var FILES = {
    'portfolio.js': LINES,

    'about.json': [
      [ {text:'{',color:C.plain} ],
      [ {text:'  "name"',color:C.prop}, {text:': ',color:C.plain}, {text:'"Sahnawaz Ahmed Laskar"',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  "alias"',color:C.prop}, {text:': ',color:C.plain}, {text:'"The Digital Alchemist"',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  "role"',color:C.prop}, {text:': ',color:C.plain}, {text:'"Full Stack Developer & UI/UX Designer"',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  "location"',color:C.prop}, {text:': ',color:C.plain}, {text:'"Silchar, Assam, India"',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  "worked_with"',color:C.prop}, {text:': ',color:C.plain}, {text:'["Flipkart", "Xiaomi India", "Rapido"]',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  "focus"',color:C.prop}, {text:': ',color:C.plain}, {text:'["clarity", "responsiveness", "impact"]',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  "open_to"',color:C.prop}, {text:': ',color:C.plain}, {text:'"freelance & full-time"',color:C.str} ],
      [ {text:'}',color:C.plain} ]
    ],

    'session.js': [
      [ {text:'// live telemetry \u2014 read at the moment you opened this',color:C.com} ],
      [ {text:'// nothing below is hard-coded. press \u25b6 to execute.',color:C.com} ],
      [],
      [ {text:'const ',color:C.key}, {text:'session',color:C.plain}, {text:' = {',color:C.plain} ],
      [ {text:'  date',color:C.prop},      {text:':      ',color:C.plain}, {text:'@@DATE@@',color:C.str},    {text:',',color:C.plain} ],
      [ {text:'  time',color:C.prop},      {text:':      ',color:C.plain}, {text:'@@TIME@@',color:C.str},    {text:',',color:C.plain} ],
      [ {text:'  timeZone',color:C.prop},  {text:':  ',color:C.plain},     {text:'@@TZ@@',color:C.str},      {text:',',color:C.plain} ],
      [ {text:'  battery',color:C.prop},   {text:':   ',color:C.plain},    {text:'@@BATT@@',color:C.str},    {text:',',color:C.plain} ],
      [ {text:'  network',color:C.prop},   {text:':   ',color:C.plain},    {text:'@@NET@@',color:C.str},     {text:',',color:C.plain} ],
      [ {text:'  linkSpeed',color:C.prop}, {text:': ',color:C.plain},      {text:'@@LINK@@',color:C.str},    {text:',',color:C.plain} ],
      [ {text:'  browser',color:C.prop},   {text:':   ',color:C.plain},    {text:'@@BROWSER@@',color:C.str}, {text:',',color:C.plain} ],
      [ {text:'  os',color:C.prop},        {text:':        ',color:C.plain},{text:'@@OS@@',color:C.str},     {text:',',color:C.plain} ],
      [ {text:'  screen',color:C.prop},    {text:':    ',color:C.plain},   {text:'@@SCREEN@@',color:C.str},  {text:',',color:C.plain} ],
      [ {text:'  viewport',color:C.prop},  {text:':  ',color:C.plain},     {text:'@@VIEW@@',color:C.str},    {text:',',color:C.plain} ],
      [ {text:'  cpuCores',color:C.prop},  {text:':  ',color:C.plain},     {text:'@@CORES@@',color:C.num},   {text:',',color:C.plain} ],
      [ {text:'  memory',color:C.prop},    {text:':    ',color:C.plain},   {text:'@@MEM@@',color:C.str},     {text:',',color:C.plain} ],
      [ {text:'  touch',color:C.prop},     {text:':     ',color:C.plain},  {text:'@@TOUCH@@',color:C.num},   {text:',',color:C.plain} ],
      [ {text:'  language',color:C.prop},  {text:':  ',color:C.plain},     {text:'@@LANG@@',color:C.str},    {text:',',color:C.plain} ],
      [ {text:'  theme',color:C.prop},     {text:':     ',color:C.plain},  {text:'@@THEME@@',color:C.str},   {text:',',color:C.plain} ],
      [ {text:'  online',color:C.prop},    {text:':    ',color:C.plain},   {text:'@@ONLINE@@',color:C.num},  {text:',',color:C.plain} ],
      [ {text:'  onPage',color:C.prop},    {text:':    ',color:C.plain},   {text:'@@DWELL@@',color:C.str} ],
      [ {text:'};',color:C.plain} ],
      [],
      [ {text:'// fields marked "unavailable" are not supported by',color:C.com} ],
      [ {text:'// your browser \u2014 shown honestly, never guessed.',color:C.com} ]
    ],

    'contact.sh': [
      [ {text:'#!/bin/bash',color:C.com} ],
      [ {text:'# reach the developer',color:C.com} ],
      [],
      [ {text:'SITE',color:C.prop}, {text:'=',color:C.plain}, {text:'"sahnawaz-portfolio.vercel.app"',color:C.str} ],
      [ {text:'IG',color:C.prop},   {text:'=',color:C.plain}, {text:'"@sahnawaz.ui.dev"',color:C.str} ],
      [],
      [ {text:'echo ',color:C.fn}, {text:'"Available for freelance & full-time."',color:C.str} ],
      [ {text:'open ',color:C.fn}, {text:'"$SITE"',color:C.str} ],
      [],
      [ {text:'# psst: the terminal below has a vault \ud83d\udd10',color:C.com} ]
    ]
  };

  /* ── Build a flat sequence of {ch, color} atoms ── */
  function buildSeq(lines) {
    var seq = [];
    (lines || LINES).forEach(function(segments, li) {
      if (li > 0) seq.push({ch:'\n', color:''});
      segments.forEach(function(seg) {
        for (var k = 0; k < seg.text.length; k++) {
          seq.push({ch: seg.text[k], color: seg.color});
        }
      });
    });
    return seq;
  }

  /* ── Timing (ms) ── */
  var BASE = 38, JITTER = 22;
  function delay(ch) {
    var d = BASE + (Math.random()*2-1)*JITTER;
    if (ch==='\n')               d = 85  + Math.random()*55;
    else if (ch===','||ch===';') d = 160 + Math.random()*70;
    else if (ch==='{'||ch==='}'||ch==='['||ch===']') d = 100 + Math.random()*35;
    else if (ch===' ')           d = 28  + Math.random()*18;
    return Math.max(16, d);
  }

  /* ── Audio ── */
  /* ══ BATCH 4: audio with a synthesized fallback ══
*/
  /* Audio is fully synthesized — typing.mp3 is no longer loaded or
     referenced. One shared AudioContext, one oscillator per keystroke. */
  var _actx = null, _muted = false;

  function initAudio(){ /* nothing to preload any more */ }

  function _ctx(){
    if(_actx) return _actx;
    _actx = window.__shzAudio ? window.__shzAudio() : null;
    return _actx;
  }

  function _synthKey(){
    var c = _ctx();
    if(!c) return;
    try{
      if(c.state === 'suspended' && c.resume) c.resume();
      var t = c.currentTime;
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(1500 + Math.random()*1000, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.04, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.036);
    }catch(e){}
  }

  function tick(ch){
    if(_muted || ch === '\n' || ch === ' ') return;
    _synthKey();
  }

  window._cpToggleMute = function(){ _muted = !_muted; return _muted; };

  /* ── Timer registry ── */
  window._codeTypingTimers = [];
  function sched(fn, ms) {
    var id = setTimeout(fn, ms);
    window._codeTypingTimers.push(id);
  }

  /* ── DOM helpers ── */
  function appendCh(parent, cursor, ch, color) {
    /* always insert BEFORE cursor so cursor stays at end */
    var node;
    if (ch === '\n') {
      node = document.createElement('br');
    } else {
      node = document.createElement('span');
      node.textContent = ch;
      if (color) node.style.color = color;
    }
    parent.insertBefore(node, cursor);
  }

  /* ── Main runner ── */
  function runTyping(container, fileName) {
    initAudio();
    var seq = buildSeq(resolvedLines(fileName));
    var i   = 0;

    /* Create cursor once, append to container — text inserts before it */
    var cursor = document.createElement('span');
    cursor.id  = 'codePopup-cursor';
    cursor.textContent = '|';
    cursor.style.cssText = 'color:#00e5ff;animation:cpCursorBlink 0.72s step-end infinite;font-weight:200;opacity:1;';
    container.appendChild(cursor);

    function step() {
      if (i >= seq.length) {
        sched(function() {
          /* fade cursor out */
          cursor.style.transition = 'opacity 0.5s ease';
          cursor.style.opacity = '0';
          sched(function() {
            if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
          }, 520);
          try{ sessionStorage.setItem('codeTyped','true');
                sessionStorage.setItem('cpTyped:'+(window._cpActiveFile||'portfolio.js'),'1'); }catch(e){}
          window._codeTypingTimers = [];
    
        }, 700);
        return;
      }
      var item = seq[i];
      appendCh(container, cursor, item.ch, item.color);
      tick(item.ch);
      i++;
      sched(step, delay(item.ch));
    }

    sched(step, 60);
  }

  /* ── Open popup ── */
  function openPopup() {
    var popup = document.getElementById('codePopup');
    var tc    = document.getElementById('typedContent');
    if (!popup || !tc) return;

    /* must be 'flex', not 'block': an inline display overrides the
       stylesheet, and the column layout is what docks the output
       panel to the bottom and lets the editor area shrink. */
    popup.style.display    = 'flex';
    popup.style.opacity    = '0';
    popup.style.transform  = 'translateY(18px) scale(0.95)';
    popup.style.transition = 'opacity 0.38s cubic-bezier(0.16,1,0.3,1), transform 0.38s cubic-bezier(0.16,1,0.3,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      popup.style.opacity   = '1';
      popup.style.transform = 'translateY(0) scale(1)';
    }); });

    if (sessionStorage.getItem('codeTyped') === 'true') return;

    /* clear any previous run */
    tc.innerHTML = '';
    if (window._codeTypingTimers) {
      window._codeTypingTimers.forEach(clearTimeout);
      window._codeTypingTimers = [];
    }
    sched(function(){ runTyping(tc, window._cpActiveFile || 'portfolio.js'); }, 340);
  }

  /* ── Synthesized techy click for #codeBtn — no mp3 dependency.
     A quick sawtooth sweep (low → high) with a high digital tick
     layered on top, for a sci-fi/interface "blip" feel — distinct
     from the hacker-toggle's mechanical click. ── */
  function _playCodeBtnClickSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(320, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.09);
      var o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'square';
      o2.frequency.setValueAtTime(2600, ctx.currentTime + 0.06);
      g2.gain.setValueAtTime(0.12, ctx.currentTime + 0.06);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      o2.connect(g2); g2.connect(ctx.destination);
      o2.start(ctx.currentTime + 0.06); o2.stop(ctx.currentTime + 0.1);
      setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 250);
    } catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('codeBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
      _playCodeBtnClickSound();  /* click sound fires instantly on press */
      openPopup();               /* then open popup */
    });
  });

  /* ══ BATCH 3: switch the open file ══
     Retypes on first view of a file; instant re-render afterwards so
     tab switching stays snappy once a file has been seen. */
  window._cpActiveFile = 'portfolio.js';
  window._cpFileNames  = Object.keys(FILES);

  window._cpOpenFile = function(name){
    var tc = document.getElementById('typedContent');
    if(!tc || !FILES[name]) return;
    window._cpActiveFile = name;

    /* cancel anything mid-type */
    if(window._codeTypingTimers){
      window._codeTypingTimers.forEach(clearTimeout);
      window._codeTypingTimers = [];
    }

    tc.innerHTML = '';

    var seen = false;
    try{ seen = sessionStorage.getItem('cpTyped:'+name) === '1'; }catch(e){}
    if(name === 'session.js') seen = false;   /* live data is never cached */

    if(seen){
      /* render instantly, no animation */
      var lines = resolvedLines(name);
      lines.forEach(function(segs, li){
        if(li > 0) tc.appendChild(document.createTextNode('\n'));
        segs.forEach(function(s){
          var sp = document.createElement('span');
          sp.style.color = s.color;
          sp.textContent = s.text;
          tc.appendChild(sp);
        });
      });
    } else {
      sched(function(){ runTyping(tc, name); }, 120);
    }

    /* keep the window title honest */
    var t = document.getElementById('codePopup-title');
    if(t) t.innerHTML = name + ' &mdash; Visual Studio Code';
    return true;
  };

  /* ══ BATCH 4: plain text + replay ══ */
  /* ══ BATCH 5: live values ══
     session.js carries @@TOKENS@@ that are replaced with real readings
     the moment the file is rendered, so the snippet is generated, not
     canned. _cpStart is set when the page loads. */
  var _cpStart = Date.now();

  /* Battery is asynchronous AND Chromium-only — Firefox and Safari
     removed it. We subscribe once at load and cache the readings, so
     token resolution stays synchronous. Unsupported browsers report
     "unavailable" rather than a fabricated number. */
  /* Chrome on Android freezes the UA string to "Android 10" for privacy,
     so the UA can never give the real OS version. userAgentData's
     high-entropy values can — they are async, so we prefetch and cache. */
  var _uad = { ready:false, platform:null, platformVersion:null,
               model:null, browser:null, browserVersion:null };
  (function initUAData(){
    var d = navigator.userAgentData;
    if(!d || !d.getHighEntropyValues){ _uad.ready = true; return; }
    try{
      d.getHighEntropyValues(['platformVersion','model','fullVersionList'])
       .then(function(v){
         _uad.ready = true;
         _uad.platform = d.platform || null;
         _uad.platformVersion = v.platformVersion || null;
         _uad.model = v.model || null;
         var list = v.fullVersionList || d.brands || [];
         for(var i=0;i<list.length;i++){
           var b = list[i].brand || '';
           if(/Not.?A.?Brand/i.test(b)) continue;
           if(/Chromium/i.test(b) && list.length > 1) continue;
           _uad.browser = b;
           _uad.browserVersion = (list[i].version || '').split('.')[0];
           break;
         }
       }).catch(function(){ _uad.ready = true; });
    }catch(e){ _uad.ready = true; }
  })();

  var _batt = { supported:false, level:null, charging:null, ready:false };
  (function initBattery(){
    if(!navigator.getBattery){ _batt.ready = true; return; }
    try{
      navigator.getBattery().then(function(b){
        _batt.supported = true; _batt.ready = true;
        function read(){ _batt.level = b.level; _batt.charging = b.charging; }
        read();
        b.addEventListener('levelchange', read);
        b.addEventListener('chargingchange', read);
      }).catch(function(){ _batt.ready = true; });
    }catch(e){ _batt.ready = true; }
  })();

  function _q(v){ return '"' + v + '"'; }

  function _liveVals(){
    var ua = navigator.userAgent;

    /* browser: order matters — Edge and Opera both contain "Chrome" */
    /* Each brand's version must come from ITS OWN token. A generic
       alternation matches whichever appears first, and Chromium-based
       browsers all carry "Chrome/<ver>" earlier in the string — which
       made Opera report Chrome's version instead of its own. */
    var brands = [
      ['Edge',             /Edg\//,             /Edg\/(\d+)/],
      ['Opera',            /OPR\//,             /OPR\/(\d+)/],
      ['Samsung Internet', /SamsungBrowser\//,  /SamsungBrowser\/(\d+)/],
      ['Firefox',          /Firefox\//,         /Firefox\/(\d+)/],
      ['Chrome',           /Chrome\//,          /Chrome\/(\d+)/],
      ['Safari',           /Safari\//,          /Version\/(\d+)/]
    ];
    var br = 'Unknown';
    if(_uad.browser){
      br = _uad.browser + (_uad.browserVersion ? ' ' + _uad.browserVersion : '');
    }
    for(var bi = 0; !_uad.browser && bi < brands.length; bi++){
      if(!brands[bi][1].test(ua)) continue;
      br = brands[bi][0];
      var vm = ua.match(brands[bi][2]);
      if(vm) br += ' ' + vm[1];
      break;
    }

    /* OS. The UA string's Android version is frozen at 10 by Chrome's
       UA-reduction, so we only trust a version from userAgentData.
       Otherwise we name the OS without a misleading number. */
    var os = 'Unknown', osFromUAD = false;
    if(_uad.platform){
      os = _uad.platform === 'macOS' ? 'macOS' : _uad.platform;
      if(_uad.platformVersion){
        var maj = String(_uad.platformVersion).split('.')[0];
        if(maj && maj !== '0'){ os += ' ' + maj; osFromUAD = true; }
      }
      if(_uad.model) os += ' (' + _uad.model + ')';
    }
    if(!osFromUAD && !_uad.platform){
      if(/Android/.test(ua)) os = 'Android';           /* version unreliable */
      else if(/iPhone|iPod/.test(ua)) {
        os = 'iOS';
        var im = ua.match(/OS\s+(\d+)[_\d]*/); if(im) os += ' ' + im[1];
      }
      else if(/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)){
        os = 'iPadOS';
        var im2 = ua.match(/OS\s+(\d+)[_\d]*/); if(im2) os += ' ' + im2[1];
      }
      else if(/Windows NT 10/.test(ua)) os = 'Windows 10/11';
      else if(/Windows/.test(ua))       os = 'Windows';
      else if(/Mac OS X/.test(ua))      os = 'macOS';
      else if(/CrOS/.test(ua))          os = 'ChromeOS';
      else if(/Linux/.test(ua))         os = 'Linux';
    }

    /* battery */
    var batt;
    if(!_batt.supported || _batt.level === null){
      batt = 'unavailable (browser blocks it)';
    } else {
      batt = Math.round(_batt.level * 100) + '%' +
             (_batt.charging ? ' \u26a1 charging' : '');
    }

    /* Network. Two separate things, previously conflated:
         connection.type          — the actual transport (wifi/cellular). Rarely exposed.
         connection.effectiveType — a SPEED CLASS ('4g' just means "4G-like
                                    throughput"). It is NOT the radio. On
                                    5G it commonly reads '4g'; on slow Wi-Fi
                                    it reads '3g'. Reporting it as the
                                    network generation was simply wrong.
       So: name the transport only when the browser truly knows it, and
       present the rest as the measured speed it actually is. */
    var net = 'unavailable', link = 'unavailable';
    var ci = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if(ci){
      var parts = [];
      if(ci.type){
        var tmap = { wifi:'Wi-Fi', cellular:'Cellular', ethernet:'Ethernet',
                     bluetooth:'Bluetooth', wimax:'WiMAX', none:'Offline',
                     other:'Other', unknown:'Unknown' };
        parts.push(tmap[ci.type] || ci.type);
      } else {
        parts.push('type hidden by browser');
      }
      if(ci.saveData) parts.push('data saver on');
      net = parts.join(' \u00b7 ');

      var lp = [];
      if(typeof ci.downlink === 'number') lp.push('~' + ci.downlink + ' Mbps');
      if(typeof ci.rtt === 'number' && ci.rtt > 0) lp.push(ci.rtt + ' ms RTT');
      if(ci.effectiveType) lp.push(ci.effectiveType.toUpperCase() + '-class');
      link = lp.length ? lp.join(' \u00b7 ') : 'unavailable';
    }

    /* preferences */
    var theme = 'unknown';
    try{
      if(window.matchMedia){
        if(window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
        else if(window.matchMedia('(prefers-color-scheme: light)').matches) theme = 'light';
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
          theme += ' \u00b7 reduced motion';
      }
    }catch(e){}

    var now  = new Date();
    var secs = Math.max(0, Math.round((Date.now() - _cpStart) / 1000));
    var dwell = secs < 60 ? secs + 's'
              : secs < 3600 ? Math.floor(secs/60) + 'm ' + (secs%60) + 's'
              : Math.floor(secs/3600) + 'h ' + Math.floor((secs%3600)/60) + 'm';

    var tz = '';
    try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){}
    var offMin = -now.getTimezoneOffset();
    var offStr = (offMin >= 0 ? '+' : '-') +
                 String(Math.floor(Math.abs(offMin)/60)).replace(/^(\d)$/,'0$1') + ':' +
                 String(Math.abs(offMin)%60).replace(/^(\d)$/,'0$1');

    /* deviceMemory is deliberately coarse: it snaps to 0.25/0.5/1/2/4/8
       and is CAPPED AT 8, so a 12GB phone still reports 8 and many
       report 4. Presenting it as an exact figure was misleading, so we
       show it as a lower bound. */
    var memRaw = (typeof navigator.deviceMemory === 'number')
                 ? navigator.deviceMemory : null;
    var mem = (memRaw === null) ? 'unavailable'
            : (memRaw >= 8 ? '8 GB or more (browser caps this)'
                           : memRaw + ' GB or more (approx)');

    return {
      '@@DATE@@'   : _q(now.toLocaleDateString(undefined,
                        {weekday:'long', year:'numeric', month:'long', day:'numeric'})),
      '@@TIME@@'   : _q(now.toLocaleTimeString(undefined,
                        {hour:'2-digit', minute:'2-digit', second:'2-digit'})),
      '@@TZ@@'     : _q((tz || 'n/a') + ' (UTC' + offStr + ')'),
      '@@BATT@@'   : _q(batt),
      '@@NET@@'    : _q(net),
      '@@LINK@@'   : _q(link),
      '@@BROWSER@@': _q(br),
      '@@OS@@'     : _q(os),
      '@@SCREEN@@' : _q(window.screen.width + '\u00d7' + window.screen.height +
                        ' @' + Math.round((window.devicePixelRatio || 1) * 100) / 100 + 'x'),
      '@@VIEW@@'   : _q(window.innerWidth + '\u00d7' + window.innerHeight),
      '@@CORES@@'  : (navigator.hardwareConcurrency || 'null'),
      '@@MEM@@'    : _q(mem),
      '@@TOUCH@@'  : (navigator.maxTouchPoints > 0 ? 'true' : 'false'),
      '@@LANG@@'   : _q(navigator.language || 'n/a'),
      '@@THEME@@'  : _q(theme),
      '@@ONLINE@@' : (navigator.onLine ? 'true' : 'false'),
      '@@DWELL@@'  : _q(dwell)
    };
  }

  /* Return a file's lines with live tokens resolved. */
  function resolvedLines(name){
    var lines = FILES[name] || LINES;
    if(name !== 'session.js') return lines;
    var v = _liveVals();
    return lines.map(function(segs){
      return segs.map(function(s){
        var t = s.text;
        for(var k in v){ if(t.indexOf(k) !== -1) t = t.split(k).join(v[k]); }
        return { text: t, color: s.color };
      });
    });
  }
  window._cpResolvedLines = resolvedLines;

  window._cpPlainText = function(name){
    var lines = resolvedLines(name || window._cpActiveFile);
    return lines.map(function(segs){
      return segs.map(function(s){ return s.text; }).join('');
    }).join('\n');
  };

  window._cpReplay = function(){
    var tc = document.getElementById('typedContent');
    var name = window._cpActiveFile || 'portfolio.js';
    if(!tc) return;
    if(window._codeTypingTimers){
      window._codeTypingTimers.forEach(clearTimeout);
      window._codeTypingTimers = [];
    }

    tc.innerHTML = '';
    try{ sessionStorage.removeItem('cpTyped:'+name); }catch(e){}
    sched(function(){ runTyping(tc, name); }, 120);
  };

  /* ══ BATCH 5: real execution ══
     This genuinely runs the code rather than printing a canned result.
     JS files go through `new Function` on author-controlled static text
     (never user input); JSON goes through a real JSON.parse; the shell
     file is interpreted for the handful of constructs it uses. If a CSP
     blocks Function construction we say so honestly instead of faking it. */
  window._cpRun = function(name){
    name = name || window._cpActiveFile || 'portfolio.js';
    var code = window._cpPlainText(name);
    var out  = [];
    var t0   = (window.performance && performance.now) ? performance.now() : Date.now();

    /* Compact formatter: anything that fits on one line stays on one
       line. The old version exploded every nested object across five
       lines, so `shipped` alone took 14 lines and pushed the actual
       result off-screen on a phone. */
    var INLINE_MAX = 52;

    function fmt(v, depth){
      depth = depth || 0;
      if(v === null) return 'null';
      if(v === undefined) return 'undefined';
      if(typeof v === 'string')  return '"' + v + '"';
      if(typeof v === 'number' || typeof v === 'boolean') return String(v);
      if(typeof v === 'function') return '[function]';

      var pad    = new Array(depth + 2).join('  ');
      var padEnd = new Array(depth + 1).join('  ');

      if(Array.isArray(v)){
        if(!v.length) return '[]';
        var items = v.map(function(x){ return fmt(x, depth + 1); });
        var oneLine = '[ ' + items.join(', ') + ' ]';
        if(oneLine.length <= INLINE_MAX && oneLine.indexOf('\n') === -1) return oneLine;
        return '[\n' + items.map(function(s){ return pad + s; }).join(',\n') +
               '\n' + padEnd + ']';
      }

      var ks = Object.keys(v);
      if(!ks.length) return '{}';
      var pairs = ks.map(function(k){ return k + ': ' + fmt(v[k], depth + 1); });
      var flat = '{ ' + pairs.join(', ') + ' }';
      if(flat.length <= INLINE_MAX && flat.indexOf('\n') === -1) return flat;
      return '{\n' + pairs.map(function(s){ return pad + s; }).join(',\n') +
             '\n' + padEnd + '}';
    }

    try{
      if(/\.json$/.test(name)){
        var parsed = JSON.parse(code);                       /* genuinely parsed */
        out.push({t:'ok',  v:'\u2713 Valid JSON \u2014 ' + Object.keys(parsed).length + ' keys'});
        out.push({t:'val', v:fmt(parsed)});

      } else if(/\.sh$/.test(name)){
        /* interpret the few constructs this script actually uses */
        var vars = {};
        code.split('\n').forEach(function(raw){
          var line = raw.trim();
          if(!line || line.charAt(0) === '#') return;
          var as = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
          if(as){ vars[as[1]] = as[2].replace(/^"|"$/g, ''); return; }
          var ec = line.match(/^echo\s+(.*)$/);
          if(ec){
            var s = ec[1].replace(/^"|"$/g, '');
            s = s.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, function(_, n){ return vars[n] || ''; });
            out.push({t:'val', v:s});
            return;
          }
          var op = line.match(/^open\s+(.*)$/);
          if(op){
            var u = op[1].replace(/^"|"$/g, '')
                         .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, function(_, n){ return vars[n] || ''; });
            out.push({t:'note', v:'\u2192 would open: ' + u});
          }
        });
        out.push({t:'ok', v:'\u2713 exit 0'});

      } else {
        /* real JS execution */
        /* Only report what THIS snippet declares. Probing fixed names
           leaked host-page globals: every element with an id creates a
           window property, so `id="projects"` on the page made
           `typeof projects !== "undefined"` true and printed the DOM
           node as `{}`. Parsing the declarations avoids that entirely. */
        var declared = [], dre = /^[ \t]*(?:const|let|var|class|function)\s+([A-Za-z_$][\w$]*)/gm, dm;
        while((dm = dre.exec(code)) !== null){
          if(declared.indexOf(dm[1]) === -1) declared.push(dm[1]);
        }
        if(!declared.length){
          out.push({t:'note', v:'(no top-level declarations found)'});
          out.push({t:'ok',   v:'\u2713 executed without errors'});
          var te = (window.performance && performance.now) ? performance.now() : Date.now();
          out.push({t:'time', v:'finished in ' + (te - t0).toFixed(1) + ' ms'});
          return out;
        }
        var runner = new Function(
          code + '\n;return {' +
          declared.map(function(n){ return JSON.stringify(n) + ':' + n; }).join(',') +
          '};'
        );
        var res = runner() || {};
        var shown = 0;
        /* Definitions are listed once, compactly. Values get the space. */
        var defs = [];
        declared.forEach(function(k){
          if(res[k] !== undefined && typeof res[k] === 'function'){
            defs.push((/^\s*class/.test(String(res[k])) ? 'class ' : 'function ') + k);
          }
        });
        if(defs.length) out.push({t:'note', v:'defined: ' + defs.join(', ')});

        declared.forEach(function(k){
          if(res[k] === undefined) return;
          if(typeof res[k] === 'function') return;   /* already listed above */
          shown++;
          out.push({t:'note', v:'> ' + k});
          out.push({t:'val',  v:fmt(res[k])});
        });
        if(!shown) out.push({t:'note', v:'(no exported bindings)'});
        out.push({t:'ok', v:'\u2713 executed without errors'});
      }
    }catch(err){
      var msg = (err && err.message) ? err.message : String(err);
      if(/Function|unsafe-eval|CSP/i.test(msg)){
        out.push({t:'err', v:'\u2715 Blocked by Content-Security-Policy'});
        out.push({t:'note', v:'This page forbids runtime code evaluation.'});
      } else {
        out.push({t:'err', v:'\u2715 ' + (err && err.name ? err.name + ': ' : '') + msg});
      }
    }

    var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
    out.push({t:'time', v:'finished in ' + (t1 - t0).toFixed(1) + ' ms'});
    return out;
  };

  window._openCodePopup = openPopup;
})();


/* ==== index.html line 9403 ==== */

function clearCodeTypingTimers() {
  if (window._codeTypingTimers && Array.isArray(window._codeTypingTimers)) {
    window._codeTypingTimers.forEach(function(id){ clearTimeout(id); });
    window._codeTypingTimers = [];
  }
}
function closeCodePopup() {
  var el = document.getElementById('codePopup');
  if (el) el.style.display = 'none';
  // stop typing sound if playing
  try { if (window._codePopupAudio) { window._codePopupAudio.pause(); window._codePopupAudio.currentTime = 0; } } catch(e){}
  clearCodeTypingTimers();
}


/* ==== index.html line 9418 ==== */
let feedbackIndex = 0;const feedbackCards = document.querySelectorAll('#more-client-feedback .testimonial-card'); function slideFeedback(direction) { if (feedbackCards.length === 0) return; feedbackCards[feedbackIndex].style.display = 'none'; feedbackIndex = (feedbackIndex + direction + feedbackCards.length) % feedbackCards.length; feedbackCards[feedbackIndex].style.display = 'block';} // Initialize to show first onlydocument.addEventListener("DOMContentLoaded", () => { feedbackCards.forEach((card, i) => { card.style.display = i === 0 ? 'block' : 'none'; });});

/* ==== index.html line 9420 ==== */

document.querySelectorAll('.timeline-node').forEach(node=>{
  node.addEventListener('mouseenter',()=>node.style.transform='rotateY(8deg) scale(1.05)');
  node.addEventListener('mouseleave',()=>node.style.transform='rotateY(0) scale(1)');
});


/* ==== index.html line 9426 ==== */

function activateMatrixMode(){
  document.body.style.background='#000';
  document.body.style.color='#00ff00';
}
function activateGoldMode(){
  document.body.style.background='linear-gradient(135deg, #FFD700, #FFA500)';
  document.body.style.color='#000';
}
document.addEventListener('keydown', function(e){
  /* Don't fire when user is typing in an input, textarea, or contenteditable */
  var tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
  if(e.key === 'm'){ activateMatrixMode(); }
  if(e.key === 'g'){ activateGoldMode(); }
});
