/* ==== index.html line 13175 ==== */

(function () {

  /* ── 1. SYNC BORDER WRAP — removed ── */

  /* ── 2. CURSOR TRAIL ── */
  const ring   = document.getElementById('cursorRing');
  const DOTS   = 10;
  const dots   = [];
  for (let i = 0; i < DOTS; i++) {
    const d = document.createElement('div');
    d.className = 'cur-dot';
    document.body.appendChild(d);
    dots.push(d);
  }
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    const d = dots[Math.floor(Math.random() * DOTS)];
    d.style.left = mx + 'px'; d.style.top = my + 'px';
    d.style.opacity = '0.8';
    d.style.transform = `translate(-50%,-50%) scale(${0.4 + Math.random() * 0.7})`;
    clearTimeout(d._t);
    d._t = setTimeout(() => { d.style.opacity = '0'; }, 150);
  });
  (function animRing() {
    rx += (mx - rx) * 0.13; ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  /* ── 3. SECTION WIPE ── */
  document.querySelectorAll('section').forEach(s => {
    if (s.offsetHeight > 60) s.classList.add('sec-wipe');
  });
  const wObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('wipe-in'); wObs.unobserve(e.target); }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('section.sec-wipe').forEach(s => wObs.observe(s));

  /* ── 4. TOAST ── */
  window.showToast = function(msg, type) {
    const t  = document.getElementById('premiumToast');
    const mi = document.getElementById('toastIcon');
    const mm = document.getElementById('toastMsg');
    if (!t) return;
    t.classList.remove('toast-show','toast-ok','toast-fail');
    void t.offsetWidth;
    mi.textContent = type === 'success' ? '✅' : '❌';
    mm.textContent = msg;
    t.classList.add('toast-show', type === 'success' ? 'toast-ok' : 'toast-fail');
    clearTimeout(t._ht);
    t._ht = setTimeout(() => t.classList.remove('toast-show'), 3500);
  };

  /* Hook sendMail to show toast instead of opening mailto silently */
  const _orig = window.sendMail;
  window.sendMail = function(event) {
    event.preventDefault();
    const n = document.getElementById('name')?.value.trim();
    const e2 = document.getElementById('email')?.value.trim();
    const m = document.getElementById('message')?.value.trim();
    if (!n || !e2 || !m) { showToast('Please fill all fields first.', 'error'); return; }
    const sub  = encodeURIComponent('New Message from ' + n);
    const body = encodeURIComponent('Name: ' + n + '\nEmail: ' + e2 + '\n\nMessage:\n' + m);
    /* api/contact now handles sending - ctSendMail() called instead */
    ctSendMail();
  };

})();


/* ==== index.html line 13250 ==== */

/* ============================================================
   SCROLL PERFORMANCE PATCH
   - Consolidates multiple scroll event listeners into one rAF loop
   - Passive listeners for all scroll events
   - Throttled updates for scroll progress bar, back-to-top, wave bar
============================================================ */
(function() {
  var ticking = false;
  var lastScrollY = 0;

  function onScrollUpdate() {
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;


    // Hacker toggle
    var htoggle = document.getElementById('hacker-toggle');
    var near = (window.innerHeight + scrollTop) >= (document.body.offsetHeight - 120);
    if (htoggle) {
      if (near) htoggle.classList.add('visible');
      else htoggle.classList.remove('visible');
    }

    // Code button — smooth fade-in/out on scroll-to-bottom
    var codeBtn = document.getElementById('codeBtn');
    if (codeBtn) {
      if (near) {
        if (codeBtn.style.display === 'none' || !codeBtn.style.display) {
          codeBtn.style.display = 'flex';
          codeBtn.style.opacity = '0';
          codeBtn.style.transform = 'translateY(10px) scale(0.88)';
          requestAnimationFrame(function() {
            codeBtn.style.transition = 'opacity 0.38s cubic-bezier(0.16,1,0.3,1), transform 0.38s cubic-bezier(0.16,1,0.3,1)';
            codeBtn.style.opacity = '1';
            codeBtn.style.transform = 'translateY(0) scale(1)';
          });
        }
      } else {
        if (codeBtn.style.display !== 'none') {
          codeBtn.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
          codeBtn.style.opacity = '0';
          codeBtn.style.transform = 'translateY(8px) scale(0.9)';
          setTimeout(function() { codeBtn.style.display = 'none'; }, 240);
        }
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(onScrollUpdate);
      ticking = true;
    }
  }, { passive: true });
  
  // Initial call
  setTimeout(onScrollUpdate, 100);
})();


/* ==== index.html line 13315 ==== */

/* Prevent virtual keyboard from auto-opening when chat opens or chips are clicked.
   Keyboard only opens when the user deliberately taps the input field. */
document.addEventListener('DOMContentLoaded', function() {
  var chatInput = document.getElementById('chatInput');
  if (!chatInput) return;

  // Detect touch device
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  if (isTouch) {
    // Start with inputmode=none so tapping chat/chips won't trigger keyboard
    chatInput.setAttribute('inputmode', 'none');

    // When user explicitly taps the input box → allow keyboard
    chatInput.addEventListener('touchstart', function() {
      chatInput.setAttribute('inputmode', 'text');
    }, { passive: true });

    // When chat closes → reset to none so next open doesn't auto-keyboard
    var closeBtn = document.getElementById('chatClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        setTimeout(function() {
          chatInput.setAttribute('inputmode', 'none');
          chatInput.blur();
        }, 100);
      });
    }

    // After sending a message via chip or send button → reset inputmode
    var sendBtn = document.getElementById('chatSend');
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        // Small delay then reset so keyboard dismisses after send
        setTimeout(function() {
          chatInput.setAttribute('inputmode', 'none');
          chatInput.blur();
        }, 150);
      });
    }

    // After Enter key send → reset inputmode
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        setTimeout(function() {
          chatInput.setAttribute('inputmode', 'none');
          chatInput.blur();
        }, 150);
      }
    });
  }
});


/* ==== index.html line 13369 ==== */

(function(){
  var KEY = 'shz_site_rating_v1';
  var EXPR = {
    1: "😐 We'll strive to do better!",
    2: "🙂 Noted — always improving.",
    3: "😊 Glad it's good!",
    4: "😃 Thanks a lot!",
    5: "🌟 You're absolutely awesome!"
  };

  var stars     = document.querySelectorAll('.orb-star');
  var mood      = document.getElementById('orb-mood');
  var orbStars  = document.getElementById('orb-stars');
  var orbLabel  = document.getElementById('orb-rating-label');
  var thanks    = document.getElementById('orb-thanks');
  var thanksStars = document.getElementById('orb-thanks-stars');
  var exprEl    = document.getElementById('orb-expr');

  if (!stars.length) return;

  function spawnBurst(starEl) {
    for (var i = 0; i < 7; i++) {
      var p = document.createElement('span');
      p.className = 'orb-burst';
      var angle = (i / 7) * 2 * Math.PI;
      var dist  = 28 + Math.random() * 18;
      p.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--by', Math.sin(angle) * dist + 'px');
      p.style.left = '50%';
      p.style.top  = '50%';
      p.style.marginLeft = '-3px';
      p.style.marginTop  = '-3px';
      p.style.animationDelay = (i * 0.04) + 's';
      starEl.appendChild(p);
      setTimeout(function(){ if(p.parentNode) p.parentNode.removeChild(p); }, 700);
    }
  }

  function showLocked(rating) {
    // Hide interactive UI
    orbStars.style.display = 'none';
    if (mood) { mood.style.display = 'none'; }
    orbLabel.textContent = 'Your rating';

    // Build locked stars display
    thanksStars.innerHTML = '';
    for (var i = 1; i <= rating; i++) {
      var s = document.createElement('div');
      s.className = 'orb-thanks-star';
      s.textContent = '★';
      s.style.animationDelay = (i * 0.08) + 's';
      thanksStars.appendChild(s);
    }
    exprEl.textContent = EXPR[rating];

    thanks.style.display = 'flex';
  }

  // Check if already rated
  var saved = localStorage.getItem(KEY);
  if (saved) {
    showLocked(parseInt(saved));
    return;
  }

  // Hover interactions
  stars.forEach(function(star, idx) {
    star.addEventListener('mouseenter', function() {
      var val = parseInt(star.getAttribute('data-val'));
      stars.forEach(function(s, si) {
        s.classList.toggle('hovered', si < val);
        s.classList.remove('lit');
      });
      if (mood) {
        mood.textContent = EXPR[val];
        mood.classList.add('visible');
      }
    });

    star.addEventListener('mouseleave', function() {
      stars.forEach(function(s) { s.classList.remove('hovered'); });
      if (mood) { mood.classList.remove('visible'); }
    });

    star.addEventListener('click', function() {
      var val = parseInt(star.getAttribute('data-val'));

      // Burst effect
      spawnBurst(star);

      // Lock to localStorage FIRST (one-time only)
      localStorage.setItem(KEY, val);

      // Animate lit state briefly then show locked view
      stars.forEach(function(s, si) {
        s.classList.remove('hovered');
        if (si < val) {
          s.classList.add('lit');
          s.classList.add('locked');
        } else {
          s.classList.add('locked');
        }
        s.style.pointerEvents = 'none';
      });

      if (mood) {
        mood.textContent = EXPR[val];
        mood.classList.add('visible');
      }

      setTimeout(function() { showLocked(val); }, 900);
    });
  });
})();


/* ==== index.html line 13489 ==== */

/* ══════════════════════════════════════════════════════
   💻 PREMIUM codePopup — MacBook window DOM upgrade v2
   ══════════════════════════════════════════════════════ */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var popup = document.getElementById('codePopup');
    if (!popup) return;

    /* ── Build the MacBook-style window chrome ── */
    popup.innerHTML =
      '<div id="codePopup-titlebar">' +
        '<div id="codePopup-dots">' +
          '<span id="codePopup-dot-red"   title="Close"></span>' +
          '<span id="codePopup-dot-yellow" title="Minimise"></span>' +
          '<span id="codePopup-dot-green"  title="Maximise"></span>' +
        '</div>' +
        '<span id="codePopup-title">portfolio.js &mdash; Visual Studio Code</span>' +
        '<div id="codePopup-actions">' +
          '<button id="codePopup-run" type="button" title="Run code" aria-label="Run code">&#x25B6;</button>' +
          '<button id="codePopup-replay" type="button" title="Replay typing" aria-label="Replay typing">&#x21BB;</button>' +
          '<button id="codePopup-copy" type="button" title="Copy code" aria-label="Copy code">&#x29C9;</button>' +
          '<div id="codePopup-closex" title="Close">&#x2715;</div>' +
        '</div>' +
      '</div>' +
      '<div id="codePopup-tabbar">' +
        '<div class="cp-tab is-active" data-file="portfolio.js">' +
          '<span class="tab-icon">&#x1F7E1;</span>portfolio.js' +
          '<span class="tab-dot"></span>' +
        '</div>' +
        '<div class="cp-tab" data-file="about.json">' +
          '<span class="tab-icon">&#x1F7E0;</span>about.json' +
        '</div>' +
        '<div class="cp-tab" data-file="session.js">' +
          '<span class="tab-icon">&#x1F535;</span>session.js' +
        '</div>' +
        '<div class="cp-tab" data-file="contact.sh">' +
          '<span class="tab-icon">&#x1F7E2;</span>contact.sh' +
        '</div>' +
      '</div>' +
      '<div id="codePopup-body">' +
        '<div id="codePopup-code-wrap">' +
          '<div id="codePopup-lines">1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14<br>15<br>16</div>' +
          '<div id="codePopup-inner-content"></div>' +
        '</div>' +
      '</div>' +
      '<div id="codePopup-output" hidden>' +
        '<div id="codePopup-output-head">' +
          '<span>OUTPUT</span>' +
          '<button id="codePopup-output-close" type="button" aria-label="Hide output">&#x2715;</button>' +
        '</div>' +
        '<pre id="codePopup-output-body"></pre>' +
      '</div>';

    /* ── Create the typedContent target ── */
    var innerTarget = document.getElementById('codePopup-inner-content');
    var tc = document.createElement('div');
    tc.id = 'typedContent';
    innerTarget.appendChild(tc);

    /* ── Wire close function ── */
    function doClose() {
      /* fade out smoothly */
      popup.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(10px) scale(0.96)';
      setTimeout(function() {
        popup.style.display = 'none';
        popup.style.transition = '';
        popup.style.opacity   = '';
        popup.style.transform = '';
      }, 230);
      /* stop typing sound if running */
      if (typeof closeCodePopup === 'function') { try { closeCodePopup(); } catch(e){} }
    }

    /* Red traffic-light dot → close */
    var dotRed = document.getElementById('codePopup-dot-red');
    if (dotRed) dotRed.addEventListener('click', doClose);

    /* Top-right ✕ button → close */
    var closeX = document.getElementById('codePopup-closex');
    if (closeX) closeX.addEventListener('click', doClose);

    /* Click outside popup → close */
    document.addEventListener('click', function(e) {
      if (popup.style.display !== 'none' &&
          !popup.contains(e.target) &&
          e.target.id !== 'codeBtn') {
        doClose();
      }
    });

    /* ── Keep line numbers in sync with typed content ── */
    var linesEl = document.getElementById('codePopup-lines');
    function syncLines() {
      if (!tc || !linesEl) return;
      var text = tc.innerText || tc.textContent || '';
      var count = Math.max(12, text.split('\n').length + 2);
      var html = '';
      for (var n = 1; n <= count; n++) { html += n + '<br>'; }
      linesEl.innerHTML = html;
    }
    /* observe mutations on typedContent to keep lines fresh */
    if (window.MutationObserver) {
      new MutationObserver(syncLines).observe(tc, { childList: true, subtree: true, characterData: true });
    }

    /* ══ BATCH 1: real window controls ══
       The yellow and green dots previously had hover affordances
       (− and +) but no listeners. Now they behave like a real window. */
    var winState = 'normal';          /* normal | minimised | maximised */

    function applyState(next){
      var body = document.getElementById('codePopup-body');
      var tabs = document.getElementById('codePopup-tabbar');
      if(!body) return;
      winState = next;
      popup.classList.remove('cp-minimised','cp-maximised');
      if(next==='minimised'){
        popup.classList.add('cp-minimised');
        body.style.display='none';
        if(tabs) tabs.style.display='none';
      } else if(next==='maximised'){
        /* drop any dragged inline offsets so the CSS can take over */
        popup.style.top=''; popup.style.left='';
        popup.style.right=''; popup.style.bottom='';
        popup.classList.add('cp-maximised');
        body.style.display='';
        if(tabs) tabs.style.display='';
      } else {
        body.style.display='';
        if(tabs) tabs.style.display='';
        /* returning to normal re-docks to the default corner */
        if(window._cpResetPosition) window._cpResetPosition();
      }
      /* remember across the session */
      try{ sessionStorage.setItem('cpWinState', next); }catch(e){}
    }

    var dotYellow = document.getElementById('codePopup-dot-yellow');
    if(dotYellow) dotYellow.addEventListener('click', function(e){
      e.stopPropagation();
      applyState(winState==='minimised' ? 'normal' : 'minimised');
    });

    var dotGreen = document.getElementById('codePopup-dot-green');
    if(dotGreen) dotGreen.addEventListener('click', function(e){
      e.stopPropagation();
      applyState(winState==='maximised' ? 'normal' : 'maximised');
    });

    /* Double-clicking the titlebar toggles maximise, like a real window */
    var tbar = document.getElementById('codePopup-titlebar');
    if(tbar) tbar.addEventListener('dblclick', function(e){
      if(e.target.closest('#codePopup-dots')) return;
      applyState(winState==='maximised' ? 'normal' : 'maximised');
    });

    /* Minimised titlebar click restores */
    if(tbar) tbar.addEventListener('click', function(e){
      if(winState==='minimised' && !e.target.closest('#codePopup-dots')
         && e.target.id!=='codePopup-closex'){
        applyState('normal');
      }
    });

    /* Escape closes — expected of any modal-ish surface */
    document.addEventListener('keydown', function(e){
      if(e.key!=='Escape') return;
      if(popup.style.display==='none'||!popup.style.display) return;
      doClose();
    });

    /* restore last state when reopened */
    try{
      var saved = sessionStorage.getItem('cpWinState');
      if(saved && saved!=='normal') applyState(saved);
    }catch(e){}

    window._cpSetWindowState = applyState;

    /* Soft click for tab switching. Previously _cpTabSound was called
       but never defined, so switching files was the one silent control. */
    var _cpTabCtx = null;
    function _cpTabSound(){
      try{
        _cpTabCtx = window.__shzAudio && window.__shzAudio();
        if(!_cpTabCtx) return;
        var c = _cpTabCtx, t = c.currentTime;
        var o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(1320, t + 0.05);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.1);
      }catch(e){}
    }

    /* ══ BATCH 5: run ══ */
    (function wireRun(){
      var runBtn  = document.getElementById('codePopup-run');
      var panel   = document.getElementById('codePopup-output');
      var bodyEl  = document.getElementById('codePopup-output-body');
      var closeOut= document.getElementById('codePopup-output-close');
      if(!runBtn || !panel || !bodyEl) return;

      var CLS = { ok:'cpo-ok', err:'cpo-err', note:'cpo-note',
                  val:'cpo-val', time:'cpo-time' };

      function esc(s){
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      runBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!window._cpRun) return;
        panel.hidden = false;
        bodyEl.innerHTML = '<span class="cpo-note">\u25b8 running\u2026</span>';
        runBtn.classList.add('cp-busy');

        /* let the browser paint the running state before we block on exec */
        setTimeout(function(){
          var rows = window._cpRun();
          bodyEl.innerHTML = rows.map(function(r){
            return '<span class="' + (CLS[r.t] || 'cpo-val') + '">' + esc(r.v) + '</span>';
          }).join('\n');
          runBtn.classList.remove('cp-busy');
          panel.scrollTop = 0;
          var bodyWrap = document.getElementById('codePopup-body');
          if(bodyWrap) bodyWrap.scrollTop = bodyWrap.scrollHeight;
        }, 60);
      });

      if(closeOut) closeOut.addEventListener('click', function(e){
        e.stopPropagation();
        panel.hidden = true;
      });

      /* switching files clears stale output */
      document.addEventListener('cp:filechange', function(){ panel.hidden = true; });
    })();

    /* ══ BATCH 4: copy + replay ══ */
    (function wireActions(){
      var copyBtn   = document.getElementById('codePopup-copy');
      var replayBtn = document.getElementById('codePopup-replay');

      function flash(btn, glyph, ok){
        if(!btn) return;
        var prev = btn.innerHTML;
        btn.innerHTML = glyph;
        btn.classList.add(ok ? 'cp-ok' : 'cp-err');
        setTimeout(function(){
          btn.innerHTML = prev;
          btn.classList.remove('cp-ok','cp-err');
        }, 1100);
      }

      /* navigator.clipboard needs a secure context; fall back to a
         hidden textarea + execCommand so this still works on http. */
      function copyText(text){
        if(navigator.clipboard && window.isSecureContext){
          return navigator.clipboard.writeText(text);
        }
        return new Promise(function(resolve, reject){
          try{
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly','');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, text.length);   /* iOS needs the range */
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            ok ? resolve() : reject(new Error('execCommand failed'));
          }catch(err){ reject(err); }
        });
      }

      if(copyBtn) copyBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!window._cpPlainText) return;
        var text = window._cpPlainText();
        copyText(text).then(function(){
          flash(copyBtn, '&#x2713;', true);
        }).catch(function(){
          flash(copyBtn, '&#x2715;', false);
        });
      });

      if(replayBtn) replayBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(window._cpReplay) window._cpReplay();
        replayBtn.classList.add('cp-spin');
        setTimeout(function(){ replayBtn.classList.remove('cp-spin'); }, 620);
      });
    })();

    /* ══ BATCH 3: functional tabs ══ */
    (function wireTabs(){
      var tabEls = popup.querySelectorAll ? popup.querySelectorAll('.cp-tab') : [];
      function activate(name, el){
        if(!window._cpOpenFile) return;
        if(window._cpActiveFile === name) return;      /* already open */
        Array.prototype.forEach.call(tabEls, function(t){
          t.classList.remove('is-active');
        });
        if(el) el.classList.add('is-active');
        window._cpOpenFile(name);
        try{ document.dispatchEvent(new CustomEvent('cp:filechange')); }catch(err){}
        if(typeof _cpTabSound === 'function') _cpTabSound();
      }
      Array.prototype.forEach.call(tabEls, function(t){
        t.addEventListener('click', function(e){
          e.stopPropagation();
          activate(t.getAttribute('data-file'), t);
        });
      });
      /* keyboard: Ctrl/Cmd + 1..3 cycles files, like a real editor */
      document.addEventListener('keydown', function(e){
        if(popup.style.display === 'none' || !popup.style.display) return;
        if(!(e.ctrlKey || e.metaKey)) return;
        var n = parseInt(e.key, 10);
        if(!n || n < 1 || n > tabEls.length) return;
        e.preventDefault();
        activate(tabEls[n-1].getAttribute('data-file'), tabEls[n-1]);
      });
    })();

    /* ══ BATCH 2: draggable window ══
       Pointer Events so mouse, touch and pen all work through one path.
       The popup is anchored bottom/left in CSS; on first drag we convert
       to top/left so clamping math is straightforward. A movement
       threshold keeps a real click (restore-from-minimised) distinct
       from a drag. */
    (function makeDraggable(){
      if(!tbar || !window.PointerEvent) return;
      var dragging=false, moved=false;
      var startX=0, startY=0, baseL=0, baseT=0, pid=null;
      var THRESH=4;

      function clamp(l,t,w,h){
        var maxL=Math.max(0, window.innerWidth  - w);
        var maxT=Math.max(0, window.innerHeight - h);
        return [Math.min(Math.max(0,l),maxL), Math.min(Math.max(0,t),maxT)];
      }

      function toTopLeft(){
        var r=popup.getBoundingClientRect();
        popup.style.top    = r.top+'px';
        popup.style.left   = r.left+'px';
        popup.style.bottom = 'auto';
        popup.style.right  = 'auto';
        return r;
      }

      tbar.addEventListener('pointerdown', function(e){
        /* never start a drag from the controls */
        if(e.target.closest && (e.target.closest('#codePopup-dots') ||
           e.target.closest('#codePopup-closex'))) return;
        if(popup.classList.contains('cp-maximised')) return;   /* maximised is pinned */
        var r=toTopLeft();
        dragging=true; moved=false;
        startX=e.clientX; startY=e.clientY;
        baseL=r.left; baseT=r.top;
        pid=e.pointerId;
        try{ tbar.setPointerCapture(pid); }catch(err){}
        popup.classList.add('cp-dragging');
      });

      tbar.addEventListener('pointermove', function(e){
        if(!dragging || e.pointerId!==pid) return;
        var dx=e.clientX-startX, dy=e.clientY-startY;
        if(!moved && Math.abs(dx)<THRESH && Math.abs(dy)<THRESH) return;
        moved=true;
        e.preventDefault();
        var r=popup.getBoundingClientRect();
        var pos=clamp(baseL+dx, baseT+dy, r.width, r.height);
        popup.style.left=pos[0]+'px';
        popup.style.top =pos[1]+'px';
      });

      function endDrag(e){
        if(!dragging || (e && e.pointerId!==pid)) return;
        dragging=false;
        popup.classList.remove('cp-dragging');
        try{ tbar.releasePointerCapture(pid); }catch(err){}
        if(moved){
          try{
            sessionStorage.setItem('cpPos', JSON.stringify({
              l:parseFloat(popup.style.left), t:parseFloat(popup.style.top)
            }));
          }catch(err){}
          /* swallow the click that follows a drag, so minimise-restore
             and dblclick-maximise do not fire spuriously */
          var swallow=function(ev){ ev.stopPropagation(); ev.preventDefault(); };
          tbar.addEventListener('click', swallow, {capture:true, once:true});
        }
        moved=false; pid=null;
      }
      tbar.addEventListener('pointerup', endDrag);
      tbar.addEventListener('pointercancel', endDrag);

      /* restore a remembered position, clamped to the current viewport */
      try{
        var sp=JSON.parse(sessionStorage.getItem('cpPos')||'null');
        if(sp && typeof sp.l==='number' && typeof sp.t==='number'){
          popup.style.bottom='auto'; popup.style.right='auto';
          popup.style.left=sp.l+'px'; popup.style.top=sp.t+'px';
        }
      }catch(err){}

      /* a resized/rotated viewport must never strand the window off-screen */
      window.addEventListener('resize', function(){
        if(popup.style.display==='none'||!popup.style.top) return;
        if(popup.classList.contains('cp-maximised')) return;
        var r=popup.getBoundingClientRect();
        var pos=clamp(r.left, r.top, r.width, r.height);
        popup.style.left=pos[0]+'px';
        popup.style.top =pos[1]+'px';
      });

      /* reset position: green dot returning to normal re-docks the window */
      window._cpResetPosition=function(){
        popup.style.left=''; popup.style.top='';
        popup.style.bottom=''; popup.style.right='';
        try{ sessionStorage.removeItem('cpPos'); }catch(err){}
      };
    })();

    /* ── Tooltip on hover over laptop button ── */
    var codeBtn = document.getElementById('codeBtn');
    if (codeBtn) {
      var tip = document.createElement('div');
      tip.id = 'codeBtn-tooltip';
      tip.textContent = 'View Source';
      tip.style.cssText = [
        'position:fixed',
        'bottom:82px',
        'left:18px',
        'background:rgba(8,16,30,0.94)',
        'border:1px solid rgba(100,210,255,0.28)',
        'color:rgba(160,230,255,0.85)',
        'font-family:-apple-system,"SF Pro Text","Helvetica Neue",sans-serif',
        'font-size:0.62rem',
        'font-weight:500',
        'letter-spacing:0.5px',
        'padding:5px 10px',
        'border-radius:8px',
        'pointer-events:none',
        'opacity:0',
        'transform:translateY(4px)',
        'transition:opacity 0.18s ease,transform 0.18s ease',
        'z-index:10001',
        'white-space:nowrap',
        'box-shadow:0 4px 14px rgba(0,0,0,0.5),inset 0 1px 0 rgba(180,230,255,0.1)'
      ].join(';');
      document.body.appendChild(tip);

      codeBtn.addEventListener('mouseenter', function() {
        tip.style.opacity = '1';
        tip.style.transform = 'translateY(0)';
      });
      codeBtn.addEventListener('mouseleave', function() {
        tip.style.opacity = '0';
        tip.style.transform = 'translateY(4px)';
      });
      /* hide tooltip when popup opens */
      codeBtn.addEventListener('click', function() {
        tip.style.opacity = '0';
      });
    }

  });
})();
