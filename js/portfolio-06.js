/* ==== index.html line 7023 ==== */

/* One AudioContext for the whole page.
   Chrome caps a document at 6 concurrent AudioContexts. Each feature
   here (terminal keystrokes, popup typing, tab switch, telemetry ping)
   had been lazily creating its own long-lived context; together with the
   site's existing one that is 5 permanent contexts, and the terminal's
   transient success/error tones briefly push it to 6-7. Past the cap the
   constructor throws, and since every call site is wrapped in try/catch
   the failure is silent: sound simply stops working. A single shared,
   reference-counted context removes the ceiling entirely. */
window.__shzAudio = (function(){
  var ctx = null, dead = false;
  return function(){
    if(dead) return null;
    if(ctx) {
      if(ctx.state === 'suspended' && ctx.resume){ try{ ctx.resume(); }catch(e){} }
      return ctx;
    }
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC){ dead = true; return null; }
      ctx = new AC();
      /* iOS/Chrome start suspended until a user gesture */
      if(ctx.state === 'suspended' && ctx.resume){
        var wake = function(){ try{ ctx.resume(); }catch(e){} };
        ['pointerdown','keydown','touchstart'].forEach(function(evt){
          document.addEventListener(evt, wake, { once:false, passive:true });
        });
      }
      return ctx;
    }catch(e){ dead = true; return null; }
  };
})();


/* ==== index.html line 7058 ==== */


(function(){
  const container = document.getElementById('retro-terminal');
  if(!container) return;
  const input  = container.querySelector('#in');
  const out    = container.querySelector('#out');
  const hint   = container.querySelector('#hint');
  const beep   = container.querySelector('#beep');
  if(!input || !out) return;

  /* ─── Session State ──────────────────────────────────────────────── */
  /* Access key for the `connect` chain. Discoverable two ways:
       (a) catch three gold glyphs in `matrix`
       (b) read the page source — there is a comment in <head>
     Neither is guessable; both are earned. */
  const ACCESS_KEY='ALCHEMIST-1337';

  const hackerState = {
    cwd          : '/home/guest',
    glyphsCaught : 0,
    keyKnown     : false,
    awaitingKey  : false,
    keyTries     : 0,
    vaultOpen    : false,
    scanDone     : false,
    exploitTarget: null,
    sudoIdx      : 0,
    sessionStart : Date.now(),
    cmdCount     : 0,
    userFiles    : {},
    aliases      : {},
    bootDone     : false,
  };

  /* ─── Persistent command history ────────────────────────────────── */
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem('shz_hist') || '[]'); } catch(e){}
  let histIdx = history.length;

  /* ─── Fake Filesystem ───────────────────────────────────────────── */
  const FS = {
    '/'                                        : {type:'dir'},
    '/home'                                    : {type:'dir'},
    '/home/guest'                              : {type:'dir'},
    '/home/guest/about.txt'                    : {type:'file', content:'Name   : Sahnawaz Ahmed Laskar\nBrand  : ByteWithSahnawaz / SHZ  —  "The Digital Alchemist"\nRole   : Web Developer & UI Designer\nStudy  : MCA (pursuing)\nBase   : Silchar, Assam, India\nContact: type `social` or `website`'},
    '/home/guest/skills.txt'                   : {type:'file', content:'Languages  : JavaScript, HTML5, CSS3, Python\nFrameworks : React, Vite, Vanilla JS\nDesign     : Figma, UI/UX, PWA\nTools      : Git, VS Code, Vercel'},
    '/home/guest/projects'                     : {type:'dir'},
    '/home/guest/projects/yojanasahay.txt'     : {type:'file', content:'YojanaSahay  (a.k.a. YojanaSetu)\n──────────────────────────────────────\nStack   : React + Vite  (PWA)\nPurpose : Help Indian citizens discover govt welfare schemes\nStatus  : Active development'},
    '/home/guest/projects/studylens.txt'       : {type:'file', content:'StudyLens AI\n────────────\nStack   : Groq API + Gemini API\nPurpose : Homework helper for Indian students (KG–12)\nStatus  : Active'},
    '/home/guest/projects/portfolio.txt'       : {type:'file', content:'sahnawaz-portfolio.vercel.app\n─────────────────────────────\n16 000+ lines — pure HTML / CSS / Vanilla JS\nZero frameworks. Zero templates.\nFeatures: AI chat, particles, XP system, this very terminal.'},
    '/home/guest/secret.key'                   : {type:'file', content:'ACCESS DENIED\nRun `scan` to find the vulnerability, then `exploit` to unlock.'},
    '/etc'                                     : {type:'dir'},
    '/etc/passwd'                              : {type:'file', content:'root:x:0:0:root:/root:/bin/bash\nguest:x:1000:1000:Guest:/home/guest:/bin/sh\nalchemist:x:1337:1337:The Digital Alchemist:/home/alchemist:/bin/zsh'},
    '/etc/hostname'                            : {type:'file', content:'retro-terminal.shz.local'},
    '/etc/motd'                                : {type:'file', content:'Welcome to RetroOS v3.1.4 — The Digital Alchemist Edition\n"Code is not just syntax. It is thought, made precise."  — SHZ'},
    '/var'                                     : {type:'dir'},
    '/var/log'                                 : {type:'dir'},
    '/var/log/system.log'                      : {type:'file', content:'[2026-09-19 00:00:01] RetroOS boot sequence complete\n[2026-09-19 00:00:02] Hacker mode module loaded\n[2026-09-19 00:00:03] Terminal session started\n[2026-09-19 12:00:00] All systems nominal\n[2026-09-19 12:00:01] Firewall active — 1337 threats blocked today'},
    '/var/log/access.log'                      : {type:'file', content:'[VISITOR] Anonymous connection from 127.0.0.1\n[AUTH] Guest shell spawned\n[NOTE] Type `scan` to reveal hidden network activity'},
    '/usr'                                     : {type:'dir'},
    '/usr/bin'                                 : {type:'dir'},
    '/usr/bin/README'                          : {type:'file', content:'System binaries. Touch nothing you do not understand.'},
  };

  /* ─── Filesystem helpers ─────────────────────────────────────────── */
  function normPath(p){
    const parts = p.split('/').filter(Boolean);
    const r = [];
    for(const pt of parts){ if(pt==='..') r.pop(); else if(pt!=='.') r.push(pt); }
    return '/'+r.join('/');
  }
  function resolvePath(p){
    if(!p||p==='~') return '/home/guest';
    if(p.startsWith('/')) return normPath(p);
    return normPath(hackerState.cwd+'/'+p);
  }
  function getNode(path){
    const n = normPath(path);
    return FS[n] || hackerState.userFiles[n] || null;
  }
  function lsDir(path){
    const base = normPath(path);
    const all  = {...FS, ...hackerState.userFiles};
    const seen = new Set();
    const out  = [];
    for(const p in all){
      if(p===base) continue;
      const prefix = base==='/'? '/' : base+'/';
      if(!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      if(!rest||rest.includes('/')) continue;
      if(!seen.has(rest)){ seen.add(rest); out.push({name:rest,type:all[p].type}); }
    }
    return out;
  }

  /* ─── Output helpers ────────────────────────────────────────────── */
  function autoscroll(){
    out.scrollTop = out.scrollHeight;
    try{
      const term = document.getElementById('terminal');
      if(term){
        const b = term.getBoundingClientRect().bottom + window.scrollY;
        window.scrollTo(0, Math.max(0, b - window.innerHeight + 24));
      }
    }catch(e){}
  }
  /* synthesized keystroke — no mp3 dependency */
  let _tctx=null;
  function playKey(){
    try{
      _tctx = window.__shzAudio && window.__shzAudio();
      if(!_tctx) return;
      const t=_tctx.currentTime;
      const o=_tctx.createOscillator(), g=_tctx.createGain();
      o.type='square';
      o.frequency.setValueAtTime(1400+Math.random()*900,t);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.03,t+0.004);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.03);
      o.connect(g); g.connect(_tctx.destination);
      o.start(t); o.stop(t+0.034);
    }catch(e){}
  }
  /* ─── Input lock: prevents output interleaving ───────────────────
     Every async output path (typeLine, deferred setTimeout/setInterval)
     registers itself here. While busy>0 the input is locked and any
     Enter keypress is QUEUED rather than dropped — matching how a real
     terminal buffers typed input while a command is still running. */
  let busy=0;
  const cmdQueue=[];
  let queueBadge=null;

  function renderBusy(){
    const isBusy=busy>0;
    /* Deliberately NOT using input.disabled: a disabled input stops
       firing keydown, which would break both queuing and Ctrl+C. The
       user may keep typing freely — only EXECUTION is deferred. */
    input.classList.toggle('term-busy',isBusy);
    if(isBusy){
      input.placeholder=cmdQueue.length
        ? 'running… '+cmdQueue.length+' queued (Ctrl+C to cancel)'
        : 'running… (type ahead, Ctrl+C to cancel)';
    } else {
      input.placeholder='Type a command...';
    }
    if(hint){
      hint.classList.toggle('is-busy',isBusy);
      hint.textContent=isBusy
        ? '⏳ Executing… anything you type runs next'
        : '💡 Type help for commands · Tab autocompletes · ↑↓ history · Ctrl+C cancels';
    }
  }
  function lock(){ busy++; renderBusy(); }
  function unlock(){
    busy=Math.max(0,busy-1);
    renderBusy();
    if(busy===0) drainQueue();
  }
  function drainQueue(){
    if(busy>0||!cmdQueue.length) return;
    const next=cmdQueue.shift();
    renderBusy();
    setTimeout(()=>{
      handle(next);
      /* If `next` was synchronous it never locked, so unlock() will
         never fire to pull the following item. Re-drain explicitly. */
      if(busy===0&&cmdQueue.length) drainQueue();
    },60);
  }
  /* Deferred helpers that participate in the lock */
  function tdefer(ms,fn){
    lock();
    return setTimeout(()=>{ try{ fn(); } finally { unlock(); } },ms);
  }
  function tinterval(ms,fn){
    lock();
    let stopped=false;
    const id=setInterval(()=>{
      let done=false;
      try{ done=fn()===false; }catch(e){ done=true; }
      if(done&&!stopped){ stopped=true; clearInterval(id); unlock(); }
    },ms);
    return id;
  }
  function tpromise(p){
    lock();
    return Promise.resolve(p).finally(()=>unlock());
  }

  function typeLine(text, cb, cls){
    let i=0;
    const d=document.createElement('div');
    if(cls) d.className=cls;
    out.appendChild(d);
    lock();
    (function tick(){
      if(i<text.length){
        d.textContent+=text.charAt(i);
        if(i%2===0) playKey();
        i++;
        setTimeout(tick, 12+Math.random()*22);
        autoscroll();
      } else {
        /* cb() must run BEFORE unlock: a chained typeLine (printSeq)
           re-locks inside cb, so the count never dips to 0 mid-sequence
           and a queued command cannot interleave. */
        if(cb) cb();
        unlock();
      }
    })();
  }
  function printLine(text){
    const d=document.createElement('div');
    d.textContent=text;
    out.appendChild(d);
    autoscroll();
  }
  function printRaw(html){
    const d=document.createElement('div');
    d.innerHTML=html;
    out.appendChild(d);
    autoscroll();
  }
  function printSeq(lines, i=0){
    if(i<lines.length) typeLine(lines[i], ()=>printSeq(lines,i+1));
  }
  function printLink(label, href){
    const d=document.createElement('div');
    const a=document.createElement('a');
    a.href=href; a.target='_blank'; a.rel='noopener noreferrer';
    a.textContent=label+' → '+href;
    d.appendChild(a); out.appendChild(d); autoscroll();
  }
  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function fmtUptime(){
    const ms=Date.now()-hackerState.sessionStart;
    return Math.floor(ms/3600000)+'h '+Math.floor(ms/60000)%60+'m '+Math.floor(ms/1000)%60+'s';
  }

  /* ─── Sound effects ─────────────────────────────────────────────── */
  function _playOK(){
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)();
      const o1=ctx.createOscillator(),g1=ctx.createGain();
      o1.type='sine'; o1.frequency.setValueAtTime(520,ctx.currentTime);
      g1.gain.setValueAtTime(0.001,ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.35,ctx.currentTime+0.02);
      g1.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12);
      o1.connect(g1);g1.connect(ctx.destination);
      o1.start(ctx.currentTime);o1.stop(ctx.currentTime+0.13);
      const o2=ctx.createOscillator(),g2=ctx.createGain();
      o2.type='sine'; o2.frequency.setValueAtTime(780,ctx.currentTime+0.1);
      g2.gain.setValueAtTime(0.001,ctx.currentTime+0.1);
      g2.gain.exponentialRampToValueAtTime(0.3,ctx.currentTime+0.12);
      g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.24);
      o2.connect(g2);g2.connect(ctx.destination);
      o2.start(ctx.currentTime+0.1);o2.stop(ctx.currentTime+0.25);
      setTimeout(()=>{try{ctx.close();}catch(e){}},500);
    }catch(e){}
  }
  function _playErr(){
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)();
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sawtooth';
      o.frequency.setValueAtTime(120,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(55,ctx.currentTime+0.2);
      g.gain.setValueAtTime(0.4,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.22);
      o.connect(g);g.connect(ctx.destination);
      o.start(ctx.currentTime);o.stop(ctx.currentTime+0.22);
      setTimeout(()=>{try{ctx.close();}catch(e){}},500);
    }catch(e){}
  }

  /* ─── Animations ────────────────────────────────────────────────── */
  function hackAnim(done){
    let c=0;
    const chars='0123456789ABCDEF';
    const tags=['[AUTH]','[TRACE]','[PORT]','[SQLi]','[TOKEN]','[VULN]','[0DAY]'];
    tinterval(80,()=>{
      if(c>=22){ typeLine('💀 Hack simulation complete.'); if(done) done(); return false; }
      let s=''; for(let i=0;i<40;i++) s+=chars[Math.floor(Math.random()*chars.length)];
      printLine(rand(tags)+' '+s); c++;
    });
  }
  /* Interactive glyph rain. Most glyphs are decoration, but a few fall
     GOLD and are catchable. Catching three yields the access key for the
     `connect` chain — so `matrix` is a puzzle path, not a screensaver. */
  /* Interactive glyph rain.
     Timing notes: the canvas is only ~13 rows tall, so advancing one row
     per animation frame crossed it in 0.2s and read as static noise. The
     loop is now throttled to ~24fps with a fractional descent, so a column
     takes ~1.2s to fall and actually looks like rain. Gold glyphs fall
     slower still, with a generous hitbox, so they are tappable on a phone. */
  function matrixAnim(done){
    const cssH=190;
    const cv=document.createElement('canvas');
    cv.className='matrix';
    out.appendChild(cv);                       /* append first, then measure */
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const cssW=Math.max(160,cv.clientWidth||out.clientWidth-20);
    cv.width=Math.floor(cssW*dpr);
    cv.height=Math.floor(cssH*dpr);
    const ctx=cv.getContext('2d');
    ctx.scale(dpr,dpr);                        /* draw in CSS pixels, sharply */
    cv.style.cursor='crosshair';

    const glyphs='アカサタナハマヤラワ0123456789ABCDEF!@#$%^&*';
    const f=15, cols=Math.max(1,Math.floor(cssW/f));
    const drops=[], speed=[];
    for(let i=0;i<cols;i++){
      drops[i]=Math.random()*-12;              /* stagger the start */
      speed[i]=0.32+Math.random()*0.30;        /* rows per tick */
    }
    let raf=null, live=[], caught=0, ended=false, last=0;
    const FPS=24, STEP=1000/FPS;

    function spawnGold(){
      if(ended) return;
      if(live.length<2 && Math.random()>0.45){
        live.push({col:Math.floor(Math.random()*cols), y:0,
                   ch:glyphs[Math.floor(Math.random()*glyphs.length)]});
      }
      setTimeout(spawnGold,700);
    }

    function frame(ts){
      raf=requestAnimationFrame(frame);
      if(ended) return;
      if(ts-last<STEP) return;                 /* throttle to ~24fps */
      last=ts;

      /* stronger fade than before, so trails read as trails */
      ctx.fillStyle='rgba(0,16,10,0.16)';
      ctx.fillRect(0,0,cssW,cssH);
      ctx.font=f+'px monospace';
      for(let i=0;i<cols;i++){
        const y=drops[i]*f;
        if(y>0){
          ctx.fillStyle='#d8ffe8';             /* bright leading character */
          ctx.fillText(glyphs[Math.floor(Math.random()*glyphs.length)],i*f,y);
          ctx.fillStyle='#00c46a';             /* dimmer tail behind it */
          ctx.fillText(glyphs[Math.floor(Math.random()*glyphs.length)],i*f,y-f);
        }
        drops[i]+=speed[i];
        if(y>cssH+f && Math.random()>0.94) drops[i]=Math.random()*-6;
      }

      ctx.save();
      ctx.shadowColor='#ffd24d'; ctx.shadowBlur=14; ctx.fillStyle='#ffd24d';
      ctx.font='bold '+(f+7)+'px monospace';
      live=live.filter(g=>{
        g.y+=1.9;                              /* ~45px/s: catchable */
        if(g.y>cssH+14) return false;
        ctx.fillText(g.ch,g.col*f,g.y);
        return true;
      });
      ctx.restore();
    }

    function hit(ev){
      if(ended) return;
      const r=cv.getBoundingClientRect();
      const pt=(ev.touches&&ev.touches[0])||ev;
      const mx=(pt.clientX-r.left)*(cssW/r.width);
      const my=(pt.clientY-r.top)*(cssH/r.height);
      for(let i=0;i<live.length;i++){
        const g=live[i];
        if(Math.abs(mx-(g.col*f+f/2))<34 && Math.abs(my-(g.y-f/2))<34){
          live.splice(i,1); caught++; hackerState.glyphsCaught=caught;
          _playOK();
          if(caught<3){
            printRaw('<span style="color:#ffd24d">✦ Glyph caught ('+caught+
                     '/3) — fragment secured.</span>');
          } else {
            printRaw('<span style="color:#ffd24d">✦ Fragments assembled.</span>');
            printRaw('<span style="color:#ffd24d">ACCESS KEY: <b>'+ACCESS_KEY+
                     '</b> — use it with <b>connect</b>.</span>');
            hackerState.keyKnown=true;
          }
          ev.preventDefault(); return;
        }
      }
    }
    cv.addEventListener('click',hit);
    cv.addEventListener('touchstart',hit,{passive:false});

    printRaw('<span style="color:#ffd24d">Tap the GOLD glyphs — catch 3 '+
             'to earn the access key.</span>');
    spawnGold();
    raf=requestAnimationFrame(frame);
    tdefer(14000,()=>{                          /* 14s: time to actually play */
      ended=true; live=[];
      if(raf) cancelAnimationFrame(raf);
      typeLine(caught===0
        ? 'Matrix ended. (The gold glyphs are tappable — try again.)'
        : 'Matrix ended. Glyphs caught: '+caught+'/3');
      if(done) done();
    });
  }



  /* ─── Data pools ────────────────────────────────────────────────── */
  const pool={
    about:['Portfolio by Sahnawaz Ahmed Laskar.','Sahnawaz Ahmed Laskar — Full Stack Developer & Designer.','Creator: Sahnawaz Ahmed Laskar. Passionate about code & design.'],
    joke:[
      "Visitor: 'How secure is your portfolio?' — Terminal: 'So secure, even hackers bookmarked it 🔒'",
      "Why did the bug leave my portfolio? Because it couldn't handle my retro hacker mode 🐞➡️🚪",
      'My portfolio is like a virus… once you open it, you cannot stop exploring 😎',
      '404 Joke not found… oh wait, found it in my footer 👾',
      'Why do programmers prefer dark mode? Because light attracts bugs. 🐛',
      "I told my RAM it had too much memory. It said it couldn't remember why.",
    ],
    fortune:['You will debug successfully today.','A new framework will appear; you will master it.','Beware of semicolons; they hide in shadows.',"Today's bug is tomorrow's feature.",'Ship it. Then fix it. Then ship the fix.'],
    quote:[
      "'Talk is cheap. Show me the code.'  — Linus Torvalds",
      "'Programs must be written for people to read.'  — Harold Abelson",
      "'First, solve the problem. Then, write the code.'  — John Johnson",
      "'Any fool can write code a computer understands. Good programmers write code humans understand.'  — M. Fowler",
      "'Make it work, make it right, make it fast.'  — Kent Beck",
    ],
    sudo:[
      'Permission denied. Nice try. 🙅',
      'Permission denied. Elevating your ego is not a valid sudo operation.',
      'Permission denied. You are not in the sudoers file. This incident has been reported… to no one.',
      'Permission denied. Have you tried turning your privileges off and on again?',
      'Permission denied. The Digital Alchemist sees you. 👁️',
      'No. Just no.',
      'sudo: command not found in your authorization level. Consider bribing the sysadmin.',
    ],
  };

  /* ─── Medical easter eggs ───────────────────────────────────────── */
  function cmdDiagnose(){
    const v=[
      ['[LOADING: Patient profile]','[ANALYZING: Vitals, Labs, Smile Index]','Case: Suraiya A. Mazumder — JRRMCH MBBS','Dx: Acute Brilliance Syndrome (ABS) 🧠','Rx: Hydration, deep sleep, and unlimited love doses 💘'],
      ['[Connecting to JRRMCH console 🏥]','[Fetching academic metrics…]','Report: Beautiful soul + razor-sharp mind','Dx: Hyper-Intelligent Scholar Status','Rx: Confidence 100mg b.i.d, Avoid overthinking'],
      ['[Scan complete 🧠]','Finding: Exceptional neuron density','Dx: Chronic Cuteness with Complications of Perfection','Rx: 1 hug q6h, 1 smile t.i.d, PRN for stress'],
    ];
    printSeq(rand(v));
  }
  function cmdHeartbeat(){
    printSeq(rand([
      ['Initializing ECG monitor…','▁▁▂▃▄▅▆▇ █ ▇▆▅▄▃▂▁   78 BPM — Calm but excited'],
      ['Initializing ECG monitor…','▁▁▂▃▄▅▆▇ █ █ ▇▆▅▄▃▂▁  96 BPM — Heart races near me 💓'],
    ]));
  }
  function cmdPrescription(){
    printSeq(rand([
      ['🧾 Prescription #SRY-001','Tab. Happiness 500mg — 1-0-1 with meals','Cap. Confidence 100mg — b.i.d','Note: Long calls q.d  |  Refills: Infinite'],
      ['🧾 Prescription #HEART','Rx: Hugs — t.i.d, Smiles — q.i.d','PRN: Chocolate for stress','Prognosis: Lifelong happiness together ❤️'],
    ]));
  }

  /* ─── Tab autocomplete ──────────────────────────────────────────── */
  const ALL_CMDS=[
    'help','about','clear','secret','date','ping','joke','fortune','quote',
    'banner','matrix','easteregg','whoami','sysinfo','ipconfig','hack',
    'weather','website','social','projects','reboot','selfdestruct',
    'earthquake','timewarp','blackout','scan','warpdrive','diagnose',
    'heartbeat','prescription','stethoscope','galaxy','key',
    'jamal','momotaz','afiya','fayaz','afaz','chufiya','nahaz','rajiya',
    'rejina','minhaz','nurun','athikur','papiya','sabaz','jabir','azad',
    'afreen','khaleda','tashfiya','mampi','faizan','rushon','sabana',
    'saddik','komoi','ridwan','enaya','akbar','amir','fatima','suraiya',
    'pwd','ls','cd','cat','mkdir','touch','rm','grep','find',
    'echo','env','history','alias','which','man',
    'git','npm','node','python3','vim','nano','exit','quit',
    'sudo','chmod','ssh','nmap','curl','neofetch',
    'ps','top','df','free','uname','uptime','exploit','crack','connect','vault','code','vscode','editor',
    'sahnawaz','shz','laskar','bytewithsahnawaz','alchemist',
  ];

  function tabComplete(partial){
    if(!partial) return null;
    if(partial.includes(' ')) return null;
    const p=partial.toLowerCase();
    const m=ALL_CMDS.filter(c=>c.startsWith(p));
    if(m.length===1) return m[0];
    if(m.length>1){
      let prefix=m[0];
      for(const c of m){ let i=0; while(i<prefix.length&&prefix[i]===c[i]) i++; prefix=prefix.slice(0,i); }
      if(prefix.length>p.length) return prefix;
      printLine(m.join('  '));
    }
    return null;
  }

  /* ─── Argument parser ───────────────────────────────────────────── */
  function parseCmd(raw){
    const t=raw.trim();
    const m=t.match(/^(\S+)(?:\s+(.*))?$/);
    if(!m) return {cmd:'',args:[],argStr:'',raw:t};
    const cmd=m[1].toLowerCase();
    const argStr=m[2]||'';
    const args=argStr?argStr.split(/\s+/).filter(Boolean):[];
    return {cmd,args,argStr,raw:t};
  }

  /* ─── Prompt ─────────────────────────────────────────────────────── */
  function getPrompt(){
    return 'guest@shz:'+hackerState.cwd.replace('/home/guest','~')+'$ ';
  }
  function updatePrompt(){
    const el=container.querySelector('.prompt');
    if(el) el.textContent=getPrompt();
  }

  /* ─── neofetch ──────────────────────────────────────────────────── */
  function cmdNeofetch(){
    const logo=[
      '   ██████ ██   ██ ███████',
      '  ██      ██   ██    ███ ',
      '   ██████ ███████   ███  ',
      '        ██ ██   ██  ███  ',
      '   ██████  ██   ██ ███████',
    ];
    const info=[
      'OS:       RetroOS v3.1.4 — Digital Alchemist Edition',
      'Host:     '+document.location.hostname,
      'Shell:    SHZ-Terminal v2.0',
      'User:     Sahnawaz Ahmed Laskar',
      'Role:     Web Developer & UI Designer',
      'Stack:    JavaScript · React · Vite · CSS3',
      'Uptime:   '+fmtUptime(),
      'Cmds:     '+hackerState.cmdCount+' executed this session',
      'Build:    100% hand-coded — no templates',
    ];
    const len=Math.max(logo.length,info.length);
    for(let i=0;i<len;i++){
      printLine(((logo[i]||'').padEnd(28,' '))+'  '+(info[i]||''));
    }
    printLine('');
    printLine('████ ████ ████ ████ ████ ████ ████ ████ ████');
  }

  /* ─── Main command handler ──────────────────────────────────────── */
  function handle(cmdRaw){
    let raw=cmdRaw.trim();
    if(!raw) return;

    /* Bare subcommand routing — on mobile there is no Tab key, so people
       naturally type `status` or `install` after reading help. Route them
       to their real parent command instead of erroring out. */
    const _first=raw.split(/\s+/)[0].toLowerCase();
    if(['status','log','blame','push','clone'].includes(_first)) raw='git '+raw;
    else if(['install','audit','start','run'].includes(_first)) raw='npm '+raw;

    /* Alias resolution */
    const fw=raw.split(/\s+/)[0].toLowerCase();
    if(hackerState.aliases[fw]){ handle(raw.replace(fw,hackerState.aliases[fw])); return; }

    const {cmd,args,argStr}=parseCmd(raw);

    /* History */
    if(history[history.length-1]!==raw) history.push(raw);
    if(history.length>100) history.shift();
    histIdx=history.length;
    try{ sessionStorage.setItem('shz_hist',JSON.stringify(history.slice(-50))); }catch(e){}
    hackerState.cmdCount++;

    /* Styled prompt echo */
    const echo=document.createElement('div');
    echo.className='cmd-echo';
    echo.textContent=getPrompt()+raw;
    out.appendChild(echo);
    autoscroll();

    /* ── Multi-word: git ── */
    if(cmd==='git'){
      const sub=(args[0]||'').toLowerCase();
      switch(sub){
        case 'status': printSeq(["On branch main","Your branch is up to date with 'origin/main'.",'','nothing to commit, working tree clean']); break;
        case 'log':
          printSeq([
            'commit a1b2c3d4e5f (HEAD -> main, origin/main)',
            'Author: Sahnawaz Ahmed Laskar <shz@bytewithsahnawaz.dev>',
            'Date:   '+new Date().toDateString(),
            '','    feat: retro hacker terminal v2.0 — real shell engine 🚀','',
            'commit 9f8e7d6c5b4','Author: Sahnawaz Ahmed Laskar <shz@bytewithsahnawaz.dev>',
            'Date:   Mon Sep 15 2026','','    fix: optimize particle canvas performance','',
            'commit 3a2b1c0d9e8','','    feat: add YojanaSahay PWA v1.0',
          ]); break;
        case 'blame':
          printLine('git blame: '+(args[1]||'index.html'));
          printLine('a1b2c3d4 (Sahnawaz 2026-09-19) Every. Single. Line. Hand-coded. 💪'); break;
        case 'diff':
          printSeq(['diff --git a/terminal.js b/terminal.js','--- a/terminal.js','+++ b/terminal.js',
            '@@ -1 +1 @@','-flat switch-case with 0 features',
            '+real shell engine: filesystem, args, tab-complete, state 🔥']); break;
        case 'clone':
          typeLine("Cloning into '"+(args[1]||'repo')+"'...");
          tdefer(900,()=>{ printLine('remote: Counting objects: 1337, done.'); tdefer(1000,()=>typeLine('Cloning complete ✅')); }); break;
        case 'push':
          printSeq(['Pushing to origin/main…','✅ Pushed. Vercel deployment triggered.']); break;
        default:
          if(!sub){
            printLine('git — usage: git <subcommand>');
            printLine('  status · log · blame · diff · clone · push');
          } else {
            printLine("git: '"+sub+"' is not a git command.");
            printLine('  Try: status · log · blame · diff · clone · push');
          }
      }
      return;
    }

    /* ── Multi-word: npm ── */
    if(cmd==='npm'){
      const sub=(args[0]||'').toLowerCase();
      switch(sub){
        case 'install': case 'i':
          typeLine('npm warn deprecated some-old-package@1.0: use modern-alternative instead');
          tdefer(1000,()=>typeLine('added 1337 packages in 4.2s ✅')); break;
        case 'start':
          printSeq(['> portfolio@1.0.0 start','> vite --host',
            'VITE v5.0.0  ready in 312ms','➜  Local: http://localhost:5173/']); break;
        case 'run':
          if(!args[1]){
            printLine('npm run — usage: npm run <script-name>');
            printLine('  available: dev · build · preview · lint');
            break;
          }
          typeLine('Running script: '+args[1]+'…');
          tdefer(1200,()=>typeLine('Done. ✅')); break;
        case 'audit':
          typeLine('found 0 vulnerabilities in 1337 packages ✅'); break;
        default:
          if(!sub){
            printLine('npm — usage: npm <subcommand>');
            printLine('  install · start · run · audit');
          } else {
            printLine("npm: unknown command '"+sub+"'.");
            printLine('  Try: install · start · run · audit');
          }
      }
      return;
    }

    /* ── python3 / python ── */
    if(cmd==='python3'||cmd==='python'){
      printLine('Python 3.12.0 (RetroOS build)');
      printLine("Type exit() to quit. [This is a browser — no actual REPL, but nice try 🐍]");
      return;
    }

    switch(cmd){

      /* ── Help ── */
      case 'help':{
        const H=(label,cmds)=>printRaw(
          '<div class="help-row"><span class="help-label">'+label+'</span>'+
          '<span class="help-cmds">'+cmds+'</span></div>');
        printRaw('<div class="help-title">SHZ RETRO TERMINAL v2.0</div>');
        H('FILESYSTEM','pwd · ls · cd · cat · mkdir · touch · rm · grep · find');
        H('SYSTEM','whoami · neofetch · uname · uptime · ps · top · df · free · sysinfo');
        H('NETWORK','ping · ipconfig · nmap · ssh · curl · scan · exploit');
        H('GIT','git status · git log · git blame · git diff · git clone · git push');
        H('NPM','npm install · npm start · npm run · npm audit');
        H('INFO','about · date · env · weather · website · social · projects');
        H('FUN','joke · fortune · quote · matrix · hack · banner · echo · crack');
        H('SHELL','history · alias · which · man · sudo · chmod · clear · exit');
        H('EFFECTS','selfdestruct · earthquake · timewarp · blackout · warpdrive · reboot');
        H('SECRETS','secret · easteregg · key · galaxy · diagnose · heartbeat · prescription');
        printLine('');
        printRaw('<div class="help-note">\u2665 PERSONAL \u2014 if you are close to me,<br>'+
                 'type <b>your own first name</b> as a command<br>'+
                 'and the terminal will tell you who you are to me.</div>');
        printLine('');
        printRaw('<div class="help-foot">Tab autocompletes \u00b7 \u2191\u2193 history \u00b7 '+
                 'Ctrl+C cancels \u00b7 man &lt;cmd&gt; for docs</div>');
        printRaw('<div class="help-foot">Chain 1: <b>scan</b> → <b>exploit</b> → <b>cat secret.key</b></div>');
        printRaw('<div class="help-foot">Chain 2: <b>scan</b> → <b>connect</b> → key → <b>vault</b><br><span style="opacity:.85">the key is earned, not given — try <b>matrix</b>, or read the source</span></div>');
        break;
      }

      /* ── Filesystem ── */
      case 'pwd':
        printLine(hackerState.cwd);
        break;

      case 'ls':{
        const target=args[0]?resolvePath(args[0]):hackerState.cwd;
        const node=getNode(target);
        if(!node){ printLine("ls: cannot access '"+(args[0]||target)+"': No such file or directory"); break; }
        if(node.type==='file'){ printLine(target.split('/').pop()); break; }
        const entries=lsDir(target);
        if(!entries.length){ printLine('(empty directory)'); break; }
        printRaw(entries.map(e=>e.type==='dir'
          ?'<span style="color:#4dd2ff;font-weight:bold">'+e.name+'/</span>'
          :'<span style="color:#00ffcc">'+e.name+'</span>'
        ).join('  '));
        break;
      }

      case 'cd':{
        if(!args[0]||args[0]==='~'){ hackerState.cwd='/home/guest'; updatePrompt(); break; }
        const target=resolvePath(args[0]);
        const node=getNode(target);
        if(!node){ printLine('cd: no such file or directory: '+args[0]); break; }
        if(node.type==='file'){ printLine('cd: not a directory: '+args[0]); break; }
        hackerState.cwd=target; updatePrompt();
        break;
      }

      case 'cat':{
        if(!args[0]){ printLine('cat: missing file operand'); break; }
        const target=resolvePath(args[0]);
        if(target==='/home/guest/secret.key'&&!hackerState.secretUnlocked){
          printLine('cat: secret.key: Permission denied. Run `scan` then `exploit` first.'); break;
        }
        const node=getNode(target);
        if(!node){ printLine('cat: '+args[0]+': No such file or directory'); break; }
        if(node.type==='dir'){ printLine('cat: '+args[0]+': Is a directory'); break; }
        node.content.split('\n').forEach(l=>printLine(l));
        break;
      }

      case 'mkdir':{
        if(!args[0]){ printLine('mkdir: missing operand'); break; }
        const t=resolvePath(args[0]);
        if(getNode(t)){ printLine("mkdir: cannot create '"+args[0]+"': File exists"); break; }
        hackerState.userFiles[t]={type:'dir'};
        printLine("Directory '"+args[0]+"' created.");
        break;
      }

      case 'touch':{
        if(!args[0]){ printLine('touch: missing file operand'); break; }
        const t=resolvePath(args[0]);
        if(!getNode(t)){
          hackerState.userFiles[t]={type:'file',content:''};
          printLine("File '"+args[0]+"' created.");
        } else { printLine("'"+args[0]+"' already exists (timestamp updated)."); }
        break;
      }

      case 'rm':{
        if(!args[0]){ printLine('rm: missing operand'); break; }
        /* rm -rf / easter egg */
        if(args.includes('-rf')&&args.includes('/')){
          printSeq(["rm: it is dangerous to operate recursively on '/'",
            'rm: use --no-preserve-root to override this failsafe',
            '…just kidding. This terminal values your existence. 💚']); break;
        }
        const t=resolvePath(args[args.length-1]);
        if(hackerState.userFiles[t]){
          delete hackerState.userFiles[t];
          printLine("removed '"+args[args.length-1]+"'");
        } else if(FS[t]){
          printLine("rm: cannot remove '"+args[args.length-1]+"': Permission denied (system file)");
        } else {
          printLine("rm: cannot remove '"+args[args.length-1]+"': No such file or directory");
        }
        break;
      }

      case 'grep':{
        if(args.length<2){ printLine('Usage: grep <pattern> <file>'); break; }
        const t=resolvePath(args[1]);
        const node=getNode(t);
        if(!node){ printLine('grep: '+args[1]+': No such file or directory'); break; }
        if(node.type==='dir'){ printLine('grep: '+args[1]+': Is a directory'); break; }
        const re=new RegExp(args[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
        const hits=node.content.split('\n').filter(l=>re.test(l));
        if(hits.length) hits.forEach(l=>printRaw(l.replace(re,s=>'<span style="color:#ff6b6b;font-weight:bold">'+s+'</span>')));
        else printLine('(no matches for \''+args[0]+'\' in '+args[1]+')');
        break;
      }

      case 'find':{
        if(!args[0]){ printLine('Usage: find <path> [-name <pattern>]'); break; }
        const base=resolvePath(args[0]);
        const ni=args.indexOf('-name');
        const nf=ni!==-1?args[ni+1]:null;
        const all={...FS,...hackerState.userFiles};
        let res=Object.keys(all).filter(p=>p===base||p.startsWith(base==='/'?'/':base+'/'));
        if(nf){ const r=new RegExp(nf.replace(/\*/g,'.*'),'i'); res=res.filter(p=>r.test(p.split('/').pop())); }
        res.forEach(r=>printLine(r));
        if(!res.length) printLine("find: '"+args[0]+"': No results");
        break;
      }

      /* ── Shell utilities ── */
      case 'echo':
        printLine(argStr||'');
        break;

      case 'env':
        ['USER=guest','SHELL=/bin/shz','HOME=/home/guest','TERM=retro-terminal-256color',
          'EDITOR=vim','BRAND=ByteWithSahnawaz','ALCHEMIST=The Digital Alchemist',
          'PWD='+hackerState.cwd,'SESSION_UPTIME='+fmtUptime()
        ].forEach(l=>printLine(l));
        break;

      case 'history':
        if(!history.length){ printLine('(no command history)'); break; }
        history.forEach((h,i)=>printLine('  '+String(i+1).padStart(3)+'  '+h));
        break;

      case 'alias':{
        if(!argStr){
          const ex=Object.entries(hackerState.aliases);
          if(!ex.length){ printLine('(no aliases defined)'); break; }
          ex.forEach(([k,v])=>printLine('alias '+k+"='"+v+"'")); break;
        }
        const m=argStr.match(/^(\w+)=['"]?(.+?)['"]?$/);
        if(!m){ printLine("Usage: alias name='command'"); break; }
        hackerState.aliases[m[1]]=m[2];
        printLine('alias '+m[1]+"='"+m[2]+"' set.");
        break;
      }

      case 'which':{
        const q=args[0];
        if(!q){ printLine('Usage: which <command>'); break; }
        if(ALL_CMDS.includes(q.toLowerCase())) printLine('/usr/bin/'+q.toLowerCase());
        else printLine(q+': not found');
        break;
      }

      case 'man':{
        const q=(args[0]||'').toLowerCase();
        const pages={
          ls:'ls — list directory contents\nUsage: ls [path]',
          cd:'cd — change the current directory\nUsage: cd <path>  |  ~  |  ..',
          cat:'cat — concatenate and print file contents\nUsage: cat <file>',
          grep:'grep — search file for a pattern\nUsage: grep <pattern> <file>',
          sudo:'sudo — try to execute as superuser\nResult: always Permission denied.',
          git:'git — the stupid content tracker\nSubcommands: status · log · blame · diff · clone · push',
          npm:'npm — node package manager\nSubcommands: install · start · run · audit',
          scan:'scan — deep recon scan\nNote: reveals a vulnerability; run `exploit` after',
          exploit:'exploit — attack the target found by `scan`\nRequires: running `scan` first',
          neofetch:'neofetch — display ASCII system info',
          curl:'curl — live fetch from a URL (hits a real quote API)',
          exit:'exit — deactivate hacker mode and return to normal view',
          alias:"alias — create command shortcuts\nUsage: alias ll='ls -la'",
          find:'find — search the filesystem\nUsage: find <path> [-name <pattern>]',
        };
        if(pages[q]){ printLine('MANUAL: '+q); printLine('──────────────────'); pages[q].split('\n').forEach(l=>printLine(l)); }
        else if(!q) printLine('Usage: man <command>');
        else printLine("No manual entry for '"+q+"'");
        break;
      }

      /* ── System ── */
      case 'whoami':
        printLine('guest@retro-terminal — anonymous visitor');
        printLine('Alias: The Curious One 🔍');
        break;

      case 'uname':
        printLine(args[0]==='-a'
          ?'RetroOS 3.1.4 retro-terminal.shz.local #1 SMP Digital-Alchemist x86_64 GNU/Linux'
          :'RetroOS');
        break;

      case 'uptime':
        printLine('up '+fmtUptime()+'  —  1 user,  load average: 0.31, 0.28, 0.24');
        break;

      case 'ps':
        ['  PID TTY          TIME CMD',
         '    1 ?        00:00:01 systemd',
         '  666 ?        00:00:03 portfolio.js',
         ' 1337 pts/0    00:00:00 retro-terminal',
         ' 9999 ?        00:00:42 ai-chatbot.js',
        ].forEach(l=>printLine(l));
        break;

      case 'top':
        ['RetroOS Process Monitor  (type another command to dismiss)',
         'PID    %CPU  %MEM  COMMAND',
         '1337    0.3   1.2  retro-terminal',
         '9999   12.4   3.1  ai-chatbot.js',
         ' 666    0.0   0.1  particles.js',
         '   1    0.0   0.5  systemd',
        ].forEach(l=>printLine(l));
        break;

      case 'df':
        ['Filesystem        Size   Used  Avail  Use%  Mounted on',
         'portfolio.js      16K    14K     2K   87%   /',
         'ideas.brain       ∞      47%     ∞    47%   /home/guest',
         'coffee.reserves   2L     0.5L    1.5L 25%   /usr/energy',
        ].forEach(l=>printLine(l));
        break;

      case 'free':
        ['              total     used     free',
         'Mem:          64GB     1.2GB   62.8GB',
         'Swap:          8GB       0       8GB',
         'Creativity:    ∞        42%     ∞',
        ].forEach(l=>printLine(l));
        break;

      case 'neofetch': cmdNeofetch(); break;

      case 'sysinfo':
        ['═══ System Info ════════════════════════',
         'OS     : RetroOS v3.1.4',
         'CPU    : Quantum i9 — overclocked by passion',
         'RAM    : 64GB HyperSpeed (14GB used by Chrome 😅)',
         'Shell  : SHZ-Terminal v2.0',
         'Uptime : '+fmtUptime(),
         'Build  : Digital Alchemist Edition',
         '════════════════════════════════════════',
        ].forEach(l=>printLine(l));
        break;

      case 'ipconfig':
        ['Network Adapter — RetroEthernet',
         '  IPv4  : 192.168.0.42',
         '  Mask  : 255.255.255.0',
         '  GW    : 192.168.0.1',
         '  IPv6  : fe80::1337:c0de:cafe:0042',
         '  MAC   : 00:SH:Z1:33:7F:FF',
        ].forEach(l=>printLine(l));
        break;

      /* ── Network / Hacker ── */
      case 'ping':
        printLine('PING '+(args[0]||'127.0.0.1')+' 56 bytes of data.');
        [0,1,2].forEach(i=>tdefer(i*400,()=>
          printLine('64 bytes from '+(args[0]||'127.0.0.1')+': icmp_seq='+(i+1)+' ttl=64 time='+(Math.random()*2).toFixed(2)+' ms')
        ));
        tdefer(1400,()=>printLine('--- ping statistics: 3 transmitted, 3 received, 0% packet loss ✅'));
        break;

      case 'nmap':
        typeLine('Starting Nmap scan on '+(args[0]||'local network')+'...');
        tdefer(1500,()=>{
          ['PORT     STATE   SERVICE',
           '80/tcp   open    http',
           '443/tcp  open    https',
           '1337/tcp open    shz-terminal',
           '9999/tcp open    ai-chat',
           '22/tcp   filtered ssh',
          ].forEach(l=>printLine(l));
        });
        break;

      case 'ssh':
        typeLine('ssh: connect to host '+(args[0]||'localhost')+' — Connection refused. You are already inside. 🤯');
        break;

      case 'curl':{
        if(!args[0]){ printLine('Usage: curl <url>  — fetches a live tech quote'); break; }
        printLine('> Fetching live data...');
        tpromise(fetch('https://api.quotable.io/random?tags=technology')
          .then(r=>r.json())
          .then(d=>{ printLine('HTTP/1.1 200 OK'); printLine(''); printLine('"'+d.content+'"'); printLine('  — '+d.author); })
          .catch(()=>{ printLine('HTTP/1.1 200 OK (offline fallback)'); printLine('"Any sufficiently advanced technology is indistinguishable from magic."'); printLine('  — Arthur C. Clarke'); }));
        break;
      }

      case 'scan':
        hackerState.scanDone=false; hackerState.exploitTarget=null;
        typeLine('🔍 Initiating deep reconnaissance scan...');
        document.body.classList.add('scanfx');
        setTimeout(()=>document.body.classList.remove('scanfx'),3000);
        tdefer(800,()=>printLine('Browser : '+navigator.userAgent.split(' ').slice(-1)[0]));
        tdefer(1400,()=>printLine('Platform: '+(navigator.platform||'Unknown')));
        tdefer(2000,()=>printLine('[OPEN PORT] 1337/shz-terminal — exposed'));
        tdefer(2600,()=>printLine('[VULN FOUND] Weak auth on /home/guest/secret.key'));
        tdefer(3200,()=>{
          hackerState.scanDone=true; hackerState.exploitTarget='192.168.0.42:1337';
          printLine('');
          printLine('✅ Scan complete. Target: 192.168.0.42:1337');
          printLine('→ `exploit`  breach the weak auth.');
          printLine('→ `connect 192.168.0.42:1337`  needs an access key.');
        });
        break;

      case 'exploit':
        if(!hackerState.scanDone){
          printLine('❌ No target found. Run `scan` first to identify a vulnerability.');
          _playErr(); break;
        }
        printSeq([
          '[+] Target: '+hackerState.exploitTarget,
          '[+] Loading exploit module: SHZ-0x1337...',
          '[+] Bypassing firewall layer 1... ✅',
          '[+] Injecting payload...',
          '[+] Escalating privileges...',
          '[!] ACCESS GRANTED 🔓','',
          '╔══════════════════════════════════════════╗',
          '║  HIDDEN MESSAGE UNLOCKED                  ║',
          '║  "The best devs don\'t just write code.   ║',
          '║   They craft experiences."  — SHZ 💚     ║',
          '╚══════════════════════════════════════════╝','',
          '💡 Now try: cat /home/guest/secret.key',
        ]);
        FS['/home/guest/secret.key']={type:'file',content:
          '█████████████████████████████████████████\n'+
          '   SECRET UNLOCKED via exploit chain 🔓   \n'+
          '█████████████████████████████████████████\n\n'+
          '"I built this terminal from scratch.\n'+
          ' Not because I had to. Because I could.\n'+
          '                   — The Digital Alchemist"\n\n'+
          'Congratulations. You think like a hacker.\n'+
          'You explore. You dig. You persist.\n'+
          'That\'s exactly how great software is built. 🚀'
        };
        hackerState.secretUnlocked=true;
        hackerState.scanDone=false;
        break;

      case 'code': case 'vscode': case 'editor':{
        var wanted = (args[0]||'').toLowerCase();
        var known  = (window._cpFileNames||['portfolio.js','about.json','session.js','contact.sh']);
        if(typeof window._openCodePopup !== 'function'){
          printLine('code: editor module not loaded.');
          _playErr(); break;
        }
        window._openCodePopup();
        if(wanted){
          var match = known.filter(function(f){
            return f.toLowerCase().indexOf(wanted) === 0;
          })[0];
          if(match && window._cpOpenFile){
            window._cpOpenFile(match);
            printLine('Opened ' + match + ' in the editor.');
          } else {
            printLine("code: no such file '" + wanted + "'");
            printLine('  available: ' + known.join(' \u00b7 '));
          }
        } else {
          printLine('Editor opened. \u25b6 runs the file, \u29c9 copies it.');
          printLine('  files: ' + known.join(' \u00b7 '));
          printLine('  tip: `code session.js` shows live data about your visit.');
        }
        break;
      }

      case 'connect':{
        if(!hackerState.scanDone && !hackerState.vaultOpen){
          printRaw('<span style="color:#ff6b6b">connect: no known host.</span>');
          printLine('Run `scan` first to discover a reachable target.');
          _playErr(); break;
        }
        const host=args[0]||'';
        if(!host){ printLine('connect — usage: connect <host:port>'); break; }
        if(host!=='192.168.0.42:1337'&&host!=='192.168.0.42'){
          printRaw('<span style="color:#ff6b6b">connect: no route to host</span>');
          printLine('Known target from last scan: 192.168.0.42:1337');
          _playErr(); break;
        }
        printSeq(['[+] Resolving 192.168.0.42:1337 ...','[+] Handshake complete.',
                  '[!] Host requires an ACCESS KEY.']);
        tdefer(3200,()=>{
          hackerState.awaitingKey=true; hackerState.keyTries=0;
          printRaw('<span style="color:#ffd24d">Enter access key (or <b>abort</b>):</span>');
          if(!hackerState.keyKnown){
            printLine('');
            printLine('No key? Two ways to earn one:');
            printLine('  • run `matrix` and catch the gold glyphs');
            printLine('  • read this page\'s source — devs leave notes');
          }
          renderBusy();
        });
        break;
      }

      case 'vault':{
        if(!hackerState.vaultOpen){
          printRaw('<span style="color:#ff6b6b">vault: sealed.</span>');
          printLine('Chain: scan → connect 192.168.0.42:1337 → access key');
          _playErr(); break;
        }
        printSeq([
          '╔═════════════════════════╗',
          '   VAULT — ACCESS GRANTED',
          '╚═════════════════════════╝',
          '',
          'Sahnawaz Ahmed Laskar — "The Digital Alchemist"',
          'Full Stack Developer & UI/UX Designer',
          'Silchar, Assam, India',
          '',
          '── WHAT I DO ──',
          'Designing smart, modern interfaces with code and',
          'creativity. Blending structure, storytelling and',
          'seamless user journeys — focused on clarity,',
          'responsiveness and impact.',
          '',
          '── DELIVERED FOR ──',
          '  Flipkart  ·  Xiaomi India  ·  Rapido',
          '',
          '── STACK ──',
          '  React.js · Node.js · Tailwind CSS',
          '  HTML5 · CSS3 · JavaScript · Vite · PWA',
          '',
          '── BUILT ──',
          '  YojanaSahay   React/Vite PWA — helps Indian',
          '                citizens discover welfare schemes',
          '  StudyLens AI  Groq + Gemini homework helper',
          '                for students, KG–12',
          '  This site     16k+ lines, hand-written,',
          '                zero frameworks, zero templates',
          '',
          '── THIS TERMINAL ──',
          'Not a library. Built from scratch:',
          '  • parsed shell over a virtual filesystem',
          '  • stateful chains (scan → connect → vault)',
          '  • async output lock so nothing interleaves',
          '  • interactive canvas puzzle, two solution paths',
          '',
          'You reached this by exploring, not by being told.',
          'That is exactly how I build and debug.',
          '',
          '→ `website` or `social` to reach me.',
          '──────────────────────────'
        ]);
        break;
      }

      case 'crack':
        printSeq([
          '[+] Loading wordlist: rockyou.txt (14,344,391 entries)...',
          '[+] Trying: password123 ❌',
          '[+] Trying: admin1337 ❌',
          '[+] Trying: ilovecoding ❌',
          '[!] Hash cracked: the_digital_alchemist_shz',
          '[!] But this password only unlocks more questions. 🤔',
        ]);
        break;

      /* ── Developer tools ── */
      case 'vim': case 'vi':
        ['  ___      ___   ___ ','  | __|_ _| __|__/ _ \\','  | _|  | | _|(_) | | |','  |___|_,_|___| |_\\___|','',
          'Vim opened. To quit: :q!',
          '[Nobody actually knows how to exit vim.]',
          '[You are forever trapped. Press anything to escape.]',
        ].forEach(l=>printLine(l));
        break;

      case 'nano':
        printLine('GNU nano — easy to exit, unlike some editors 👀');
        printLine("Usage: Ctrl+X to exit. Yes, it's that simple.");
        break;

      case 'node':
        printLine('Welcome to Node.js v20.0.0 (RetroOS build).');
        printLine('Type .exit to quit. (This is a browser, though. Wink.)');
        printLine('> ');
        break;

      /* ── Sudo / Permissions ── */
      case 'sudo':
        printLine(pool.sudo[hackerState.sudoIdx % pool.sudo.length]);
        hackerState.sudoIdx++;
        break;

      case 'chmod':
        printLine("chmod: changing permissions of '"+(args[args.length-1]||'?')+"': Operation not permitted");
        printLine('[tip: you cannot chmod your way into a senior dev role 😄]');
        break;

      /* ── Session ── */
      case 'exit': case 'quit':
        typeLine('Deactivating hacker mode...', ()=>{
          document.body.classList.remove('hacker-mode');
          if(typeof syncHackerToggleIcon==='function') syncHackerToggleIcon();
          out.innerHTML='';
        });
        break;

      case 'clear':
        out.innerHTML='';
        if(typeof resetSuraiyaEffects==='function') resetSuraiyaEffects();
        break;

      /* ── Info ── */
      case 'about':  typeLine(rand(pool.about)); break;
      case 'date':   printLine(new Date().toString()); break;

      case 'weather':
        printLine('Fetching weather for Silchar, Assam, IN...');
        tdefer(600,()=>{
          printLine('🌤 Partly Cloudy  28°C  Humidity: 71%  Wind: 12km/h NE');
          printLine("Next 24h: Chance of rain 🌧 (it's Assam — it always rains)");
        });
        break;

      case 'banner':
        ['╔═══════════════════════════════════════════╗',
         '║   WELCOME TO SHZ RETRO TERMINAL v2.0      ║',
         '║     The Digital Alchemist — Sahnawaz       ║',
         '║         Code. Create. Alchemize.           ║',
         '╚═══════════════════════════════════════════╝',
        ].forEach(l=>printLine(l));
        break;

      case 'website': printLink('🌐 Portfolio','https://sahnawaz-portfolio.vercel.app/'); break;
      case 'social':  printLink('📸 Instagram','https://www.instagram.com/sahnawaz.ui.dev'); break;

      case 'projects':
        ['📂 /home/guest/projects/','  ├── yojanasahay.txt   (React PWA — govt welfare schemes)',
         '  ├── studylens.txt     (AI homework helper)','  └── portfolio.txt     (this site — 16k+ lines)','',
         '💡 Try: cat /home/guest/projects/yojanasahay.txt',
        ].forEach(l=>printLine(l));
        break;

      /* ── Fun ── */
      case 'joke':    typeLine(rand(pool.joke)); break;
      case 'fortune': typeLine(rand(pool.fortune)); break;
      case 'quote':   typeLine(rand(pool.quote)); break;
      case 'matrix':  typeLine('Booting glyph rain...', ()=>matrixAnim()); break;
      case 'hack':    typeLine('Initializing hack...', ()=>hackAnim()); break;

      /* ── Premium effects ── */
      case 'selfdestruct':{
        let c=5;
        document.body.classList.add('selfdestructing','shake');
        tinterval(1000,()=>{
          if(c<0){
            typeLine('💥 BOOM! Just kidding 😉');
            document.body.classList.remove('selfdestructing','shake');
            return false;            /* stop + release lock */
          }
          typeLine('💣 Self-destruct in '+c+'...');
          c--;
        });
        break;
      }
      case 'earthquake':
        typeLine('⚡ System Unstable... Earthquake detected!');
        document.body.style.animation='shake 0.2s infinite';
        setTimeout(()=>{ document.body.style.animation=''; },4000);
        break;
      case 'timewarp':
        typeLine('[Initializing Time Travel Protocol ⏳...]');
        document.body.classList.add('timewarpfx');
        setTimeout(()=>document.body.classList.remove('timewarpfx'),4000);
        printSeq(['Year → 3025','Civilization → Unknown','Note: You don\'t belong here 👀']);
        break;
      case 'blackout':
        typeLine('⚠️ System blackout triggered...');
        document.body.classList.add('blackoutfx');
        tdefer(4000,()=>{ document.body.classList.remove('blackoutfx'); typeLine('System restored ✅'); });
        break;
      case 'warpdrive':
        typeLine('[Engaging Warp Drive ⚡...]');
        document.body.classList.add('warpdrivefx');
        setTimeout(()=>document.body.classList.remove('warpdrivefx'),3000);
        printSeq(['Speed: Light Speed++ ✨','Destination: Unknown Galaxy 🌌','Status: You\'re not supposed to be here 👽']);
        break;
      case 'reboot':
        typeLine('[System reboot initiated...]');
        document.body.classList.add('flicker');
        setTimeout(()=>{ document.body.classList.remove('flicker'); location.reload(); },2000);
        break;

      /* ── Easter Eggs ── */
      case 'easteregg':
        printLine('🐇 Rabbit hole detected!');
        printLine('Hidden: diagnose · heartbeat · prescription · stethoscope · galaxy · key · secret · crack');
        printLine('Chain:  scan → exploit → cat /home/guest/secret.key  🔐');
        break;
      case 'secret':
        printSeq(['[Decrypting hidden secret 🔐...]','Truth: Behind every great portfolio, a relentless builder.','System cannot hide it anymore ❤️']);
        break;
      case 'diagnose':    cmdDiagnose(); break;
      case 'heartbeat':   cmdHeartbeat(); break;
      case 'prescription':cmdPrescription(); break;
      case 'stethoscope':
        printSeq(["[Placing stethoscope on Admin's heart 🎧...]",'Lub-dub... Lub-dub 💓','Analysis: Heartbeat syncs only when she\'s thought of.','Conclusion: Permanent condition → Irreversible Love Syndrome 🫶']);
        break;
      case 'galaxy':
        printSeq(['[Exploring star systems ✨...]','Observation: Billions of stars detected 🌌','Result: None shine brighter than one special soul 🌸','Conclusion: She is my entire universe ❤️']);
        break;
      case 'key':
        printSeq(['[Searching for master key 🔑...]','Access Granted: Only one key unlocks this heart ❤️','Key Holder: (Hidden… but she knows it\'s her 🌹)']);
        break;

      /* ── Suraiya (archived, special) ── */
      case 'suraiya':
        typeSeqSmart(["Unknown command: 'suraiya'.",'','No active record found.','This identifier has been archived due to irrelevance.','','Some stories fade from the system — intentionally.','Moving forward with cleaner code and clearer purpose.','','Autoclean: performative affection detected and purged.','System note: identity updated — operating as THE DIGITAL ALCHEMIST.','','— End of log —'],40,function(){});
        setTimeout(suraiyaFinalEffect,400);
        break;

      /* ── Owner identity (deliberately undocumented in `help`) ── */
      case 'sahnawaz': case 'shz': case 'laskar':
      case 'bytewithsahnawaz': case 'alchemist': case 'sahnawaz ahmed laskar':
        printSeq([
          '[ IDENTIFYING SYSTEM OWNER … ]',
          '',
          'root@shz — Sahnawaz Ahmed Laskar',
          'alias   : The Digital Alchemist / ByteWithSahnawaz',
          'role    : Full Stack Developer & UI/UX Designer',
          'origin  : Silchar, Assam, India',
          'worked  : Flipkart · Xiaomi India · Rapido',
          'stack   : React · Node · Tailwind · Vite · PWA',
          '',
          'Every line of this site — including this terminal',
          'you are typing into — was written by hand.',
          '',
          'You are a guest in a machine I built. Welcome. ✨'
        ]);
        break;

      /* ── Family & relatives ── */
      case 'jamal':    typeLine('Jamal is my beloved father — the root of our family tree, my strength and guidance. 💙'); break;
      case 'momotaz':  printSeq(['💙 My beloved mother, Momotaz —','the angel of my life.','She left us in 2019, but her love,','prayers, and blessings stay forever','in my heart. May Allah grant her Jannah. 💙']); break;
      case 'afiya':    typeLine('Afiya is my eldest sister — always protective, caring, and a second mother to me. ❤️'); break;
      case 'fayaz':    typeLine('Fayaz is my elder brother — strong, wise, and always guiding me forward. 🤝'); break;
      case 'afaz':     typeLine('Afaz is my elder brother — loving, supportive, and my true companion. 🤝'); break;
      case 'chufiya':  typeLine('Chufiya is my sister — sweet, kind, and full of love for the family. 🌸'); break;
      case 'nahaz':    typeLine('Nahaz is my brother — energetic, fun, and always close to my heart. ⚡'); break;
      case 'rajiya':   typeLine('Rajiya is my sister — caring and graceful, a pillar of warmth in our family. 🌹'); break;
      case 'rejina':   typeLine('Rejina is my sister — loving, cheerful, and a true blessing to us all. 🌼'); break;
      case 'minhaz':   typeLine('Minhaz is my youngest brother — the most adorable, and deeply loved by everyone. 💙'); break;
      case 'nurun':    typeLine('Nurun is my beloved aunt — a guiding figure full of love. 🌷'); break;
      case 'athikur':  typeLine('Athikur is my uncle — kind, wise, and always respected. 🤲'); break;
      case 'papiya':   typeLine('Papiya is my cousin sister — elder to me, like a friend and guide. 🌟'); break;
      case 'sabaz':    typeLine('Sabaz is my cousin brother — younger, lively and full of energy. 🔥'); break;
      case 'jabir':    typeLine('Jabir is my cousin brother — cheerful, playful, and dearly loved. 😊'); break;
      case 'azad':     typeLine("Azad is my brother-in-law (Afiya's husband) — respected and part of our family bond. 🤝"); break;
      case 'afreen':   typeLine("Afreen is Afiya's daughter — sweet and lovely, a little star in our family. 🌟"); break;
      case 'khaleda':  typeLine("Khaleda is my sister-in-law (Fayaz's wife) — caring and kind, adding joy to our home. 💐"); break;
      case 'tashfiya': typeLine("Tashfiya is Fayaz's daughter — a little princess, bright and loved by everyone. 👑"); break;
      case 'mampi':    typeLine("Mampi is my sister-in-law (Afaz's wife) — warm, graceful, and part of our family love. 🌺"); break;
      case 'faizan':   typeLine("Faizan is Afaz's son — small, innocent, and the heart of joy for us all. 🍼"); break;
      case 'rushon':   typeLine("Rushon is my brother-in-law (Chufiya's husband) — respected and part of our family circle. 🤝"); break;
      case 'sabana':   typeLine("Sabana is Chufiya's daughter — sweet and playful, bringing smiles always. 🌼"); break;
      case 'saddik':   typeLine("Saddik is Chufiya's son — little, bright, and a treasure of happiness. 🧸"); break;
      case 'komoi':    typeLine("Komoi is my brother-in-law (Rajiya's husband) — valued and respected in our family. 🙏"); break;
      case 'ridwan':   typeLine("Ridwan is Rajiya's son — smart, cheerful, and deeply loved. 😇"); break;
      case 'enaya':    typeLine("Enaya is Rajiya's daughter — tiny, lovely, and the soul of joy in our family. 💕"); break;
      case 'akbar':    typeLine("Akbar is my brother-in-law (Rejina's husband) — respected with love, making our family stronger. 🤝"); break;
      case 'amir':     typeLine('Amir is my elder brother, always supportive. 💪'); break;
      case 'fatima':   typeLine('Fatima is my lovely sister, caring and kind. 🌸'); break;

      default:
        printRaw('<span style="color:#ff6b6b">command not found: '+cmd+'</span>  — type <span style="color:#00ffcc">help</span> to see all commands, <span style="color:#00ffcc">Tab</span> to autocomplete');
        _playErr();
    }
  }

  /* ─── Boot sequence ─────────────────────────────────────────────── */
  function runBoot(cb){
    const lines=[
      'RetroOS v3.1.4 — The Digital Alchemist Edition',
      'BIOS POST: ████████████████ OK',
      '[ OK ] Kernel modules loaded',
      '[ OK ] SHZ-Terminal engine v2.0 initialized',
      '[ OK ] Fake filesystem: 18 nodes mounted at /',
      '[ OK ] Argument parser: multi-word commands active',
      '[ OK ] Tab autocomplete: 60+ commands indexed',
      '[ OK ] Session state: scan→exploit chain armed',
      '[ OK ] Web Audio: synthesized sounds ready',
      '',
      'Type `help` for all commands.',
      'Type `neofetch` for system info.',
      'Chain: scan → exploit → cat /home/guest/secret.key  🔐',
      '',
    ];
    let i=0;
    (function next(){
      if(i>=lines.length){ if(cb) cb(); return; }
      printLine(lines[i++]);
      autoscroll();
      setTimeout(next,55);
    })();
  }

  /* ─── CRT visual layers ─────────────────────────────────────────
     Injected as real elements because body.hacker-mode::before and
     ::after are already used by the legacy theme. Persistent layers
     live while hacker mode is on; power-on layers self-remove. */
  const CRT_PERSIST=['crt-scanlines','crt-roll','crt-vignette'];
  const CRT_ONESHOT=['crt-power','crt-static'];
  function crtMake(id){
    let el=document.getElementById(id);
    if(!el){
      el=document.createElement('div');
      el.id=id; el.setAttribute('aria-hidden','true');
      document.body.appendChild(el);
    }
    return el;
  }
  function crtOn(withPowerOn){
    CRT_PERSIST.forEach(crtMake);
    if(!withPowerOn) return;
    CRT_ONESHOT.forEach(id=>{
      const el=document.getElementById(id); if(el) el.remove();
      crtMake(id);
    });
    setTimeout(()=>CRT_ONESHOT.forEach(id=>{
      const el=document.getElementById(id); if(el) el.remove();
    }),1100);
  }
  function crtOff(){
    CRT_PERSIST.concat(CRT_ONESHOT).forEach(id=>{
      const el=document.getElementById(id); if(el) el.remove();
    });
  }

  /* Watch for hacker mode activation */
  (function initBoot(){
    let wasOn=document.body.classList.contains('hacker-mode');
    const sync=()=>{
      const isOn=document.body.classList.contains('hacker-mode');
      if(isOn&&!wasOn) crtOn(true);
      else if(isOn)    crtOn(false);
      else if(!isOn&&wasOn) crtOff();
      wasOn=isOn;
      if(isOn&&!hackerState.bootDone){
        hackerState.bootDone=true;
        out.innerHTML='';
        setTimeout(()=>runBoot(()=>{ updatePrompt(); input.focus(); }),620);
      }
    };
    const mo=new MutationObserver(sync);
    mo.observe(document.body,{attributes:true,attributeFilter:['class']});
    sync();
  })();

  /* ─── Keydown ───────────────────────────────────────────────────── */
  const _validSet=new Set(ALL_CMDS.concat(
    ['status','log','blame','diff','clone','push','install','start','run','audit']));

  input.addEventListener('keydown', e=>{
    /* Ctrl+C — abandon anything queued and force-release the lock */
    if((e.ctrlKey||e.metaKey) && (e.key==='c'||e.key==='C')){
      if(busy>0||cmdQueue.length){
        e.preventDefault();
        cmdQueue.length=0;
        busy=0;
        printLine('^C');
        renderBusy();
        input.focus();
      }
      return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      const raw=input.value.trim();
      if(!raw) return;

      /* Access-key mode: this line is a secret, not a command. Echo it
         masked and keep it out of shell history. */
      if(hackerState.awaitingKey){
        input.value='';
        const ke=document.createElement('div');
        ke.className='cmd-echo';
        ke.textContent='key: '+'•'.repeat(Math.min(raw.length,24));
        out.appendChild(ke);
        if(raw.toLowerCase()==='abort'){
          hackerState.awaitingKey=false;
          printLine('Connection closed by user.'); renderBusy(); return;
        }
        if(raw===ACCESS_KEY){
          hackerState.awaitingKey=false; hackerState.vaultOpen=true;
          hackerState.keyKnown=true; _playOK();
          FS['/home/guest/vault']={type:'dir'};
          FS['/home/guest/vault/README.txt']={type:'file',
            content:'Access granted via the connect chain.\nType `vault` to read it.'};
          printSeq(['[+] Key accepted.','[+] Escalating … root@192.168.0.42',
                    '[!] VAULT UNLOCKED — type `vault`.']);
          renderBusy(); return;
        }
        hackerState.keyTries++; _playErr();
        if(hackerState.keyTries>=3){
          hackerState.awaitingKey=false;
          printRaw('<span style="color:#ff6b6b">Too many attempts. Connection dropped.</span>');
          printLine('Reconnect with: connect 192.168.0.42:1337');
        } else {
          printRaw('<span style="color:#ff6b6b">Access denied. ('+hackerState.keyTries+'/3)</span>');
        }
        renderBusy(); return;
      }

      const {cmd}=parseCmd(raw);
      if(_validSet.has(cmd)||cmd==='git'||cmd==='npm'||cmd==='python3'||cmd==='python') _playOK();
      else _playErr();
      input.value='';
      /* While a command is still producing output, queue instead of
         running immediately — this is what stops outputs interleaving. */
      if(busy>0){
        if(cmdQueue.length<10){ cmdQueue.push(raw); renderBusy(); }
        return;
      }
      handle(raw);
    } else if(e.key==='Tab'){
      e.preventDefault();
      const completed=tabComplete(input.value);
      if(completed) input.value=completed;
    } else if(e.key==='ArrowUp'){
      if(histIdx>0){ histIdx--; input.value=history[histIdx]; }
      e.preventDefault();
    } else if(e.key==='ArrowDown'){
      if(histIdx<history.length-1){ histIdx++; input.value=history[histIdx]; }
      else{ histIdx=history.length; input.value=''; }
      e.preventDefault();
    }
  });
})();


/* ==== index.html line 8561 ==== */

/* ══ View Telemetry pill — click signature ══
   The pill links to #recent-activity (live engineering telemetry).
   On click: radar rings + a signal sweep + a short sonar ping, then the
   destination section gets a single scan-line pass on arrival. */
(function(){
  var pill = document.querySelector('.hero-cta-btn[href="#recent-activity"]');
  if(!pill) return;

  var reduced = false;
  try{ reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

  var actx = null;
  function ping(){
    if(reduced) return;
    try{
      actx = window.__shzAudio && window.__shzAudio();
      if(!actx) return;
      var t = actx.currentTime;
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1180, t);
      o.frequency.exponentialRampToValueAtTime(620, t + 0.28);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.10, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.36);
    }catch(e){}
  }

  function fire(){
    if(reduced) return;
    /* never stack effects if tapped repeatedly */
    var old = pill.querySelectorAll('.tele-ring, .tele-sweep');
    Array.prototype.forEach.call(old, function(n){ n.remove(); });

    var sweep = document.createElement('span');
    sweep.className = 'tele-sweep';
    pill.appendChild(sweep);

    ['', 'r2', 'r3'].forEach(function(cls){
      var r = document.createElement('span');
      r.className = 'tele-ring' + (cls ? ' ' + cls : '');
      pill.appendChild(r);
    });

    pill.classList.add('tele-firing');
    ping();

    setTimeout(function(){
      pill.classList.remove('tele-firing');
      var nodes = pill.querySelectorAll('.tele-ring, .tele-sweep');
      Array.prototype.forEach.call(nodes, function(n){ n.remove(); });
    }, 1250);
  }

  function arrive(){
    if(reduced) return;
    var sec = document.getElementById('recent-activity');
    if(!sec) return;
    sec.classList.remove('tele-arrived');
    /* the scan line travels the section's real height */
    sec.style.setProperty('--tele-h', Math.min(sec.offsetHeight, 900) + 'px');
    void sec.offsetWidth;                 /* restart the animation */
    sec.classList.add('tele-arrived');
    setTimeout(function(){ sec.classList.remove('tele-arrived'); }, 1700);
  }

  pill.addEventListener('click', function(){
    fire();
    /* let the browser's smooth scroll begin before the scan runs */
    setTimeout(arrive, 620);
  });
})();
