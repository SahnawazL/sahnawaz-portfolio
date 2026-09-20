/* ==== index.html line 9448 ==== */

function spawnButterflies(event) {
  const colors = ['#ffb3ba','#ffdfba','#ffffba','#baffc9','#bae1ff','#e0baff'];
  const num = 8;
  for (let i = 0; i < num; i++) {
    const b = document.createElement('div');
    b.textContent = '🦋';
    b.style.position = 'fixed';
    b.style.left = event.clientX + 'px';
    b.style.top = event.clientY + 'px';
    b.style.fontSize = (Math.random() * 14 + 16) + 'px';
    b.style.transform = 'rotate(' + (Math.random()*360) + 'deg)';
    b.style.color = colors[Math.floor(Math.random()*colors.length)];
    b.style.pointerEvents = 'none';
    b.style.transition = 'transform 1.5s ease-out, opacity 1.5s ease-out';
    document.body.appendChild(b);
    // force reflow
    void b.offsetWidth;
    const xOffset = (Math.random() - 0.5) * 200;
    const yOffset = - (Math.random() * 150 + 100);
    b.style.transform += ' translate(' + xOffset + 'px,' + yOffset + 'px) scale(' + (Math.random()*0.5+0.8) + ')';
    b.style.opacity = 0;
    setTimeout(() => b.remove(), 1600);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const buttons = Array.from(document.querySelectorAll('a, button'))
    .filter(el => /projects/i.test(el.textContent) || /contact/i.test(el.textContent));
  let _butterflyThrottle = 0;
  buttons.forEach(btn => {
    btn.addEventListener('click', e => {
      const now = Date.now();
      if (now - _butterflyThrottle < 1500) return;
      _butterflyThrottle = now;
      spawnButterflies(e);
    });
  });
});


/* ==== index.html line 9490 ==== */

/*
  Behavior:
  - If an element with id="hacker-toggle" already exists (the file already creates it),
    this script will use that element and attach scroll-based show/hide behavior.
  - If it doesn't exist, the script will create one.
  - The toggle appears (with a smooth fade) only when scrolled to the bottom (within 120px).
  - Left-bottom code button (#codeBtn) is NOT modified by this script.
*/
/* ── Centralized hacker toggle icon sync ─────────────────────────
   Single source of truth for the toggle icon. Always call this
   instead of setting toggle.textContent directly, so all click
   handlers, chat commands, and keyboard shortcuts stay in sync.
────────────────────────────────────────────────────────────────── */
function syncHackerToggleIcon() {
  var t = document.getElementById('hacker-toggle');
  if (!t) return;
  t.textContent = document.body.classList.contains('hacker-mode') ? '🖲️' : '🖥️';
}

/* Auto-scroll to the terminal's command input whenever Hacker Mode turns
   on, with a brief pulse on the existing hint text so it's obvious where
   to type — rather than leaving the visitor to notice/scroll to it
   themselves. No auto-focus on the input itself (deliberate — would pop
   the mobile keyboard open unexpectedly, which this site avoids elsewhere
   too). Safe to call any time; no-ops if the terminal isn't in the DOM
   or hacker mode isn't actually on. */
function scrollToTerminalWithHint() {
  if (!document.body.classList.contains('hacker-mode')) return;
  var term = document.getElementById('retro-terminal');
  if (!term) return;
  setTimeout(function () {
    term.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var hint = term.querySelector('#hint');
    if (hint) {
      hint.classList.remove('hint-pulse');
      void hint.offsetWidth; /* restart the animation if triggered again quickly */
      hint.classList.add('hint-pulse');
      setTimeout(function () { hint.classList.remove('hint-pulse'); }, 2200);
    }
  }, 350); /* small delay so the terminal has finished becoming visible first */
}

document.addEventListener('DOMContentLoaded', function () {
  // find or create the toggle element
  let toggle = document.getElementById('hacker-toggle');
  if (!toggle) {
    toggle = document.createElement('div');
    toggle.id = 'hacker-toggle';
    toggle.textContent = '🖥️';
    document.body.appendChild(toggle);
    // Core behavior: toggle hacker-mode class + sync icon
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('hacker-mode');
      syncHackerToggleIcon();
      scrollToTerminalWithHint();
    });
  } else {
    // Ensure the element has the right content (emoji) in case it was empty
    if (!toggle.textContent || toggle.textContent.trim().length === 0) {
      toggle.textContent = '🖥️';
    }
  }

  // accessibility
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('aria-label', 'Toggle retro / hacker mode (Easter Egg)');
  toggle.setAttribute('tabindex', '0');

  // allow keyboard activation (Enter / Space)
  toggle.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      toggle.click();
    }
  });

  let shown = false;

  function checkNearBottom() {
    // Consider "bottom" as within 120px of page bottom to be user-friendly on mobile
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 120);
    if (nearBottom && !shown) {
      shown = true;
      toggle.classList.add('visible');
    } else if (!nearBottom && shown) {
      shown = false;
      toggle.classList.remove('visible');
    }
  }

  // initial check (small delay to let layout settle)
  setTimeout(checkNearBottom, 120);

  // hacker-toggle scroll: handled by consolidated rAF scroll handler
  window.addEventListener('resize', checkNearBottom, { passive: true });
});


/* ==== index.html line 9591 ==== */

/* ── Single unified hacker-toggle interaction handler ──────────────
   Replaces the 3 previously stacked DOMContentLoaded blocks.
   One listener, no setTimeout chains, no redundant DOM appends.
──────────────────────────────────────────────────────────────────── */
/* Synthesized mouse-click sound for the hacker toggle — no mp3 dependency.
   Layers a short high "snap" transient with a low "thump" body, the way a
   real mechanical mouse click reads (sharp attack, near-instant decay). */
function _playHackerClickSound(){
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var o1 = ctx.createOscillator(), g1 = ctx.createGain();
    o1.type = 'square';
    o1.frequency.setValueAtTime(2200, ctx.currentTime);
    g1.gain.setValueAtTime(0.25, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    o1.connect(g1); g1.connect(ctx.destination);
    o1.start(ctx.currentTime); o1.stop(ctx.currentTime + 0.02);
    var o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(140, ctx.currentTime);
    g2.gain.setValueAtTime(0.18, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    o2.connect(g2); g2.connect(ctx.destination);
    o2.start(ctx.currentTime); o2.stop(ctx.currentTime + 0.035);
    setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 200);
  } catch(e){}
}

document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('hacker-toggle');
  if (!toggle) return;

  toggle.style.overflow = 'hidden'; /* needed for ripple clip */

  /* Tooltip */
  const tooltip = document.createElement('div');
  tooltip.id = 'hacker-toggle-tooltip';
  tooltip.textContent = 'Activate Retro Hacker Mode';
  document.body.appendChild(tooltip);
  toggle.addEventListener('mouseenter', () => tooltip.classList.add('visible'), { passive: true });
  toggle.addEventListener('mouseleave', () => tooltip.classList.remove('visible'), { passive: true });

  /* Random flicker — cosmetic only, low frequency */
  function randomFlicker() {
    toggle.classList.add('flicker');
    setTimeout(() => toggle.classList.remove('flicker'), 500);
    setTimeout(randomFlicker, 12000 + Math.random() * 6000);
  }
  setTimeout(randomFlicker, 10000);

  /* Easter egg: 5 quick clicks */
  let clickCount = 0, clickTimer = null;

  /* ── Single consolidated click handler ── */
  toggle.addEventListener('click', function(e) {
    /* 0. Click sound — fires first, still inside the user-gesture context */
    _playHackerClickSound();

    /* 1. Ripple — pure CSS animation, one DOM node, auto-removed */
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const rect = toggle.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height) + 'px';
    ripple.style.cssText = 'width:' + sz + ';height:' + sz
      + ';left:' + (e.clientX - rect.left - rect.width / 2) + 'px'
      + ';top:'  + (e.clientY - rect.top  - rect.height / 2) + 'px';
    toggle.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    /* 2. Icon sync — immediate, no setTimeout */
    syncHackerToggleIcon();

    /* 3. Vibration if just turned ON */
    if (document.body.classList.contains('hacker-mode')) {
      toggle.classList.remove('vibrating'); /* reset if already animating */
      void toggle.offsetWidth;              /* force reflow to restart */
      toggle.classList.add('vibrating');
      setTimeout(() => toggle.classList.remove('vibrating'), 1000);
    }

    /* 4. Easter egg counter */
    clickCount++;
    if (clickCount >= 5) {
      toggle.classList.add('easter-egg');
      setTimeout(() => toggle.classList.remove('easter-egg'), 1500);
      clickCount = 0;
      clearTimeout(clickTimer);
    } else {
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
    }
  });
});


/* ==== index.html line 9687 ==== */

document.addEventListener('DOMContentLoaded', function() {
  // 5. Matrix rain effect in footer
  const footer = document.querySelector('footer');
  if (footer) {
    const canvas = document.createElement('canvas');
    canvas.id = 'matrixRain';
    footer.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let width, height, letters, fontSize, columns, drops;

    function initMatrix() {
      width = canvas.width = footer.offsetWidth;
      height = canvas.height = footer.offsetHeight;
      fontSize = 14;
      columns = Math.floor(width / fontSize);
      letters = 'アァイィウヴエェオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      letters = letters.split('');
      drops = Array(columns).fill(1);
    }

    function drawMatrix() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#0f0';
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    initMatrix();
    let matrixInterval = null;
    let matrixObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !matrixInterval) {
          matrixInterval = setInterval(drawMatrix, 50);
        } else if (!entry.isIntersecting && matrixInterval) {
          clearInterval(matrixInterval);
          matrixInterval = null;
        }
      });
    }, {threshold: 0.1});
    matrixObserver.observe(canvas);
    window.addEventListener('resize', initMatrix, {passive: true});
  }

  /* Dead "footer console" scaffolding removed (2026 cleanup) — this was
     the tail end of an already-half-finished cleanup: the div it created
     was never appended to the DOM (the .appendChild call was already
     commented out), log/input were already hardcoded to null, and
     fakeCommands was a separate, much smaller command set than the real
     hacker terminal (which has reboot, selfdestruct, earthquake, etc.) —
     entirely disconnected from anything a visitor could ever trigger. */
});


/* ==== index.html line 9753 ==== */



/* ==== index.html line 9755 ==== */

document.addEventListener('DOMContentLoaded', function(){
  const viewExpBtn = document.querySelector('a[href="#projects"]');
  if(viewExpBtn){
    viewExpBtn.addEventListener('click', function(e){
      // scroll to projects
    });
  }
});


/* ==== index.html line 9765 ==== */

(function(){
    const cards = document.querySelectorAll('.skills-grid > *');
    const fill = document.querySelector('.global-xp-fill');
    const percentLabel = document.querySelector('.global-xp-percent');
    const totalCards = cards.length || 12; // fallback to 12
    let clickedCount = 0;
    let completed = false;

    // Ensure card container positioning for checkmark
    cards.forEach(card => { card.style.position = card.style.position || 'relative'; });

    function showPopup(text, duration=1400) {
        const popup = document.createElement('div');
        popup.className = 'xp-popup';
        popup.innerText = text;
        document.body.appendChild(popup);
        const rect = percentLabel.getBoundingClientRect();
        popup.style.left = (rect.left + rect.width/2 - popup.offsetWidth/2) + 'px';
        popup.style.top = (rect.top - 30 + window.scrollY) + 'px';
        setTimeout(() => popup.remove(), duration);
    }

    function showAchievement(){
        const wrap = document.createElement('div');
        wrap.className = 'xp-achievement';
        wrap.innerHTML = '<div class="xp-achievement-inner">🎉 Achievement Unlocked: <strong>100%</strong><br><span class="xp-hint">🔓 <em>Hidden Hint:</em> Click the Clock+Date to discover a secret about the site.</span></div>';
        document.body.appendChild(wrap);
        setTimeout(()=> wrap.remove(), 3500);
    }

    function updateXP(){
        // Exact fraction then round to 1 decimal for display
        let exact = (clickedCount * 100) / totalCards;
        // Force exact 100 when all cards are clicked
        if (clickedCount >= totalCards) exact = 100;
        const display = Math.round(exact * 10) / 10; // 1 decimal
        fill.style.width = display + '%';
        percentLabel.textContent = display.toFixed(1) + '%';
        percentLabel.style.left = `calc(${display}% - 14px)`;
        return display;
    }

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (completed) return;
            if (card.dataset.clicked === '1') return;

            // Mark this card as used
            card.dataset.clicked = '1';
            clickedCount += 1;

            // Visual: dim + checkmark
            card.style.opacity = '0.6';
            const check = document.createElement('div');
            check.innerHTML = '✓';
            check.style.position = 'absolute';
            check.style.top = '8px';
            check.style.right = '10px';
            check.style.color = '#0f0';
            check.style.fontSize = '20px';
            check.style.textShadow = '0 0 5px #0f0, 0 0 10px #0f0';
            card.appendChild(check);

            // Update and show popup with TOTAL ONLY
            const display = updateXP();
            showPopup(`${display.toFixed(1)}%`, 1400);

            if (display >= 100 && !completed) {
                completed = true;
                showAchievement();
            }
        });
    });
})();


/* ==== index.html line 9841 ==== */

document.addEventListener('DOMContentLoaded', function(){
  const viewExpBtn = document.querySelector('a[href="#projects"]');
  if(!viewExpBtn) return;

  function spawnSparkles(originX, originY){
    const count = 14;
    for(let i=0;i<count;i++){
      const span = document.createElement('span');
      span.className = 'sparkle-star';
      // Use a star glyph for crisp neon look
      span.textContent = '✦';
      // Randomize spread and size
      const dx = (Math.random()*260 - 130);          // -130..130
      const dy = (-80 - Math.random()*120);          // -80..-200
      const size = 12 + Math.random()*8;             // 12..20px
      const dur = 900 + Math.random()*600;           // 0.9..1.5s
      span.style.setProperty('--x', originX + 'px');
      span.style.setProperty('--y', originY + 'px');
      span.style.setProperty('--dx', dx + 'px');
      span.style.setProperty('--dy', dy + 'px');
      span.style.setProperty('--s', size + 'px');
      span.style.setProperty('--dur', dur + 'ms');
      document.body.appendChild(span);
      // Cleanup after animation
      setTimeout(()=> span.remove(), dur + 50);
    }
  }

  let _sparkleThrottle = 0;
  viewExpBtn.addEventListener('click', function(e){
    const now = Date.now();
    if (now - _sparkleThrottle < 1200) return; // prevent spam
    _sparkleThrottle = now;
    const rect = viewExpBtn.getBoundingClientRect();
    const x = rect.left + rect.width/2;
    const y = rect.top + rect.height/2;
    spawnSparkles(x, y);
  });
});


/* ==== index.html line 9882 ==== */

// ── UNIFIED GREETING SYSTEM ──────────────────────────────────────────────────
// Replaces two overlapping popups (time-based greet + first-visit milestone)
// with one smart popup. On visit #1 both messages are merged into one card.
// Milestone badges (visits 5, 10, 20) still use their own centered popup.
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  try {
    // ── Visit counter ──
    let visitCount = parseInt(localStorage.getItem('visitCount') || '0') + 1;
    localStorage.setItem('visitCount', visitCount);
    const isFirstVisit = (visitCount === 1);

    // ── Time-slot greeting ──
    const h = new Date().getHours();
    let slot, title, msg;
    if      (h >= 5  && h < 12) { slot = 'morning';   title = 'Good Morning ☀️';   msg = "Hope your day starts bright and productive!"; }
    else if (h >= 12 && h < 17) { slot = 'afternoon';  title = 'Good Afternoon 🌤'; msg = "Keep the momentum going!"; }
    else if (h >= 17 && h < 21) { slot = 'evening';    title = 'Good Evening 🌆';   msg = "Unwind and explore something new."; }
    else                         { slot = 'night';      title = 'Good Night 🌙';     msg = "Late-night browsing? You rock!"; }

    const todayKey   = new Date().toISOString().slice(0, 10);
    const storageKey = 'lastGreet_' + slot;
    const alreadySeen = localStorage.getItem(storageKey) === todayKey;

    // Case A: First visit  → merged time-greeting + welcome message (one popup)
    // Case B: Return visit, slot not yet greeted → time greeting only
    // Case C: Return visit, slot already greeted → no popup at all

    if (!alreadySeen && !document.querySelector('.greet-popup')) {
      const box = document.createElement('div');
      box.className = 'greet-popup';

      if (isFirstVisit) {
        box.innerHTML =
          '<strong>' + title + ' — Welcome!</strong>' +
          '<br><span style="opacity:.85">' + msg + '</span>' +
          '<br><span style="opacity:.6;font-size:.88em;margin-top:4px;display:block">Welcome, Explorer 🗺 Your journey begins here.</span>';
      } else {
        box.innerHTML = '<strong>' + title + '</strong><br><span style="opacity:.9">' + msg + '</span>';
      }

      document.body.appendChild(box);
      setTimeout(() => box.classList.add('show'), 50);
      const hide = () => { box.classList.remove('show'); setTimeout(() => box.remove(), 300); };
      setTimeout(hide, isFirstVisit ? 5000 : 3500);
      box.addEventListener('click', hide, { once: true });
      localStorage.setItem(storageKey, todayKey);
    }

    // ── Milestone badge popups (visits 5, 10, 20 only) ──
    const milestones = {
      5:  { title: '🎖 Loyal Explorer Badge', text: "You've officially visited 5 times!" },
      10: { title: '🏆 Elite Visitor',         text: "TEN visits! You're part of the legends." },
      20: { title: '💎 Ultra Loyal Badge',      text: "20 visits! We're basically friends now." }
    };

    if (milestones[visitCount]) {
      const { title: mTitle, text: mText } = milestones[visitCount];
      const existing = document.getElementById('surprise-popup');
      if (existing) existing.remove();
      const popup = document.createElement('div');
      popup.id = 'surprise-popup';
      const titleEl = document.createElement('h4');
      titleEl.textContent = mTitle;
      popup.appendChild(titleEl);
      const msgEl = document.createElement('div');
      msgEl.textContent = mText;
      popup.appendChild(msgEl);
      document.body.appendChild(popup);
      setTimeout(() => {
        popup.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => popup.remove(), 500);
      }, 4000);
    }

  } catch(e) { /* fail silently */ }
});


/* ==== index.html line 9962 ==== */

(function() {
  // Secret click element for Detective Mode
  function showDetectivePopup(title, message) {
    const existing = document.getElementById('surprise-popup');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'surprise-popup';
    const titleEl = document.createElement('h4');
    titleEl.textContent = title;
    popup.appendChild(titleEl);
    const msgEl = document.createElement('div');
    msgEl.textContent = message;
    popup.appendChild(msgEl);
    document.body.appendChild(popup);
    setTimeout(() => {
      popup.style.animation = 'fadeOut 0.5s ease forwards';
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  }

  document.addEventListener("DOMContentLoaded", function() {
    const secretEl = document.querySelector("#secret-trigger");
    if (secretEl) {
      secretEl.addEventListener("click", () => {
        showDetectivePopup("🔍 Detective Mode Unlocked", "You found the secret element!");
      });
    }
  });
})();


/* ==== index.html line 9993 ==== */

function typeSeqSmart(arr, lineDelay=300, charDelay=35){
  const out = document.getElementById('out');
  let i = 0;
  function nextLine(){
    if(i>=arr.length) return;
    const line = arr[i++];
    const hasHTML = /<[^>]+>/.test(line);
    if(hasHTML){
      out.innerHTML += line + "<br>";
      out.scrollTop = out.scrollHeight;
      setTimeout(nextLine, lineDelay);
    }else{
      const div = document.createElement('div');
      out.appendChild(div);
      let j=0;
      (function typeChar(){
        if(j<line.length){
          div.textContent += line[j++];
          out.scrollTop = out.scrollHeight;
          setTimeout(typeChar, charDelay);
        }else{
          setTimeout(nextLine, lineDelay);
        }
      })();
    }
  }
  nextLine();
}

function resetSuraiyaEffects(){
  document.body.classList.remove('suraiya-aura');
}

function createStarsAndEmojis(){
  const emojis=["💖","🌹","✨","🌸"];
  const count=10;
  for(let i=0;i<count;i++){
    setTimeout(()=>{
      let el=document.createElement("div");
      el.textContent=emojis[Math.floor(Math.random()*emojis.length)];
      el.className="suraiya-emoji";
      el.style.left=Math.random()*100+"%";
      el.style.fontSize=(Math.random()*1.1+1.1)+"rem";
      document.body.appendChild(el);
      setTimeout(()=>el.remove(),6000);
    }, i*700);
  }
}


/* ==== index.html line 10050 ==== */

/* Unlock on click + modal open (static border) */
(function(){
  function unlockCard(card) {
    if (!card.classList.contains('unlocked')) {
      card.classList.add('unlocked');
    }
  }
  document.querySelectorAll('.kta-card').forEach(function(card){
    card.addEventListener('click', function(){
      unlockCard(card);
      var modalId = card.getAttribute('data-modal');
      if (modalId && document.getElementById(modalId)) {
        document.getElementById(modalId).style.display = 'flex';
      }
    });
  });
  // modal close
  document.querySelectorAll('.kta-modal .close').forEach(function(btn){
    btn.addEventListener('click', function(){
      var modal = btn.closest('.kta-modal');
      if (modal) modal.style.display = 'none';
    });
  });
  window.addEventListener('click', function(e){
    if (e.target && e.target.classList && e.target.classList.contains('kta-modal')) {
      e.target.style.display = 'none';
    }
  });
})();
