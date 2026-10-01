/* ==== index.html line 10391 ==== */

(function(){

  /* Canned answers (QA / TOPICS) were removed: every question — typed or a
     tapped suggestion — is answered by the AI in api/chat.js, so they were
     never shown, and they exposed personal details via view-source. */

  /* ========== Smart greeting by time of day (name-aware) ========== */
  function getWelcomeMsg(name){
    var h = new Date().getHours();
    var n = name ? ', ' + name : '';
    var hello =
      (h >= 5  && h < 12) ? "Good morning" + n + "! \u2600\uFE0F" :
      (h >= 12 && h < 17) ? "Good afternoon" + n + "! \uD83D\uDC4B" :
      (h >= 17 && h < 21) ? "Good evening" + n + "! \uD83C\uDF06" :
                            "Hey there, night owl" + n + "! \uD83C\uDF19";
    /* Who the assistant is + what it can do, in one consistent voice */
    /* Kept under 160 characters so it renders as a plain message (no badge) */
    return hello + " I'm Sahnawaz's AI assistant.\n\n" +
      "Ask me about his work, pricing, availability, or how to reach him directly.";
  }
  var WELCOME = getWelcomeMsg();
  var WELCOME_RETURN = "Welcome back. What can I help you with today?";

  /* ========== DOM ========== */
  var widget      = document.getElementById('chatWidget');
  var closeBtn    = document.getElementById('chatClose');
  var clearBtn    = document.getElementById('chatClear');
  var expandBtn   = document.getElementById('chatExpand');
  var msgs        = document.getElementById('chatMessages');
  var chips       = document.getElementById('chatChips');
  var chipsWrap   = document.getElementById('chatChipsWrap');
  var chipsToggle = document.getElementById('chatChipsToggle');
  var input       = document.getElementById('chatInput');
  var sendBtn     = document.getElementById('chatSend');
  var statusTxt   = document.getElementById('chatStatusTxt');
  var liveDot     = document.getElementById('chatLiveDot');
  var followUpWrap  = document.getElementById('chatFollowUp');
  var followUpChips = document.getElementById('chatFollowChips');
  var quickReply    = document.getElementById('chatQuickReply');
  var userTypingEl  = document.getElementById('chatUserTyping');

  var isOpen       = false;
  var chipsVisible = false;
  var inited       = false;
  var botBusy      = false; /* lock: true while dots OR typewriter is running */

  /* ========== Feature 1: Returning visitor greeting ========== */
  var hasVisitedBefore = false;
  try { hasVisitedBefore = !!localStorage.getItem('chatVisited'); } catch(e){}

  /* ========== Feature 2: Idle nudge (resettable, fires twice with different messages) ========== */
  var idleTimer  = null;
  var idleTimer2 = null;
  var idleTimer3 = null;
  var idleCount  = 0; /* 0 = none fired, 1 = first, 2 = second, 3 = all fired */
  var IDLE_MSG  = (function(){ var _sv=null; try{_sv=JSON.parse(localStorage.getItem('shnz_visitor_v1')||'null');}catch(e){} var _n=_sv&&_sv.firstName?", "+_sv.firstName:""; return "Still here"+_n+"! 👋 Take your time — feel free to ask me anything about Sahnawaz's work, pricing, or services. 😊"; })();
  var IDLE_MSG2 = "No worries at all! 🌟 Whenever you're ready, I'm right here. You can also explore the **Help** menu below to mail Sahnawaz or request a callback directly. 📬";
  var IDLE_MSG3 = "It was lovely having you here! 🙏 Come back anytime — Sahnawaz and I will be right here waiting. Have a wonderful day! ✨";

  function resetIdleTimer(){
    clearTimeout(idleTimer);
    clearTimeout(idleTimer2);
    clearTimeout(idleTimer3);
    idleCount = 0; /* reset count so all nudges can fire again */
    if (!isOpen) return;

    /* First nudge after 120 s of silence */
    idleTimer = setTimeout(function(){
      if (!botBusy && isOpen && idleCount === 0){
        idleCount = 1;
        addBotTyping((briefApi && briefApi.isActive())
          ? "Still there? No rush — your project brief is saved on this device, so you can pick it up anytime. 🙂"
          : IDLE_MSG, null, true); /* isNudge=true — won't restart timer */

        /* Second nudge — 40 s after the first (total 160s) */
        idleTimer2 = setTimeout(function(){
          if (!botBusy && isOpen && idleCount === 1){
            idleCount = 2;
            addBotTyping(IDLE_MSG2, null, true); /* isNudge=true */

            /* Third nudge — 30 s after the second (total 190s) */
            idleTimer3 = setTimeout(function(){
              if (!botBusy && isOpen && idleCount === 2){
                idleCount = 3;
                addBotTyping(IDLE_MSG3, null, true); /* isNudge=true */
              }
            }, 30000);
          }
        }, 40000);
      }
    }, 120000);
  }

  /* ========== Feature 3: Emoji intent reactions ========== */
  var INTENT_EMOJI = [
    { rx:/price|pricing|cost|₹|fee|charge|afford|budget/i,  emoji:'💰' },
    { rx:/hire|work with|contact|reach|email|whatsapp|book/i, emoji:'🤝' },
    { rx:/urgent|fast|quick|asap|soon|deadline/i,            emoji:'⚡' },
    { rx:/brand|flipkart|xiaomi|rapido|big company/i,        emoji:'🏆' },
    { rx:/dream|passion|goal|future|agency/i,                emoji:'🌍' },
    { rx:/design|portfolio|website|build|create/i,           emoji:'🎨' },
    { rx:/trust|safe|reliable|genuine|real/i,                emoji:'🛡️' },
  ];
  function showReaction(userText, botBubble){
    for (var i = 0; i < INTENT_EMOJI.length; i++){
      if (INTENT_EMOJI[i].rx.test(userText)){
        var r = document.createElement('span');
        r.className = 'chat-reaction';
        r.textContent = INTENT_EMOJI[i].emoji;
        botBubble.appendChild(r);
        setTimeout(function(){ if (r.parentNode) r.parentNode.removeChild(r); }, 2200);
        break;
      }
    }
  }

  /* ========== Feature 4: User typing indicator ========== */
  var userTypingTimeout = null;
  input && input.addEventListener('input', function(){
    if (botBusy) return;
    if (userTypingEl) userTypingEl.textContent = '✏️ You\'re typing…';
    clearTimeout(userTypingTimeout);
    userTypingTimeout = setTimeout(function(){
      if (userTypingEl) userTypingEl.textContent = '';
    }, 1200);
  });

  /* ========== Feature 5: Timestamps ========== */
  function formatTime(){
    return formatTimestamp(new Date().toISOString());
  }

  /* Smart timestamp: today → "9:47 PM", yesterday → "Yesterday 9:47 PM", older → "10 May 9:47 PM" */
  function formatTimestamp(isoOrStr){
    var d;
    if (!isoOrStr) {
      d = new Date();
    } else if (typeof isoOrStr === 'object' && isoOrStr !== null) {
      /* Firestore Timestamp object: {seconds, nanoseconds} or has .toDate() method */
      if (typeof isoOrStr.toDate === 'function') {
        d = isoOrStr.toDate();
      } else if (typeof isoOrStr.seconds === 'number') {
        d = new Date(isoOrStr.seconds * 1000);
      } else {
        d = new Date();
      }
    } else {
      /* String — try ISO parse first */
      d = new Date(isoOrStr);
      if (isNaN(d.getTime())) {
        /* Legacy stored string like "9:47 PM" — can't determine date, show as-is */
        return isoOrStr;
      }
    }
    var now = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12 || 12;
    var timeStr = hh + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;

    /* Compare calendar dates (midnight boundaries) */
    var todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var msgMidnight   = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
    var diffDays = Math.round((todayMidnight - msgMidnight) / 86400000);

    if (diffDays === 0)  return timeStr;                          /* Today: time only */
    if (diffDays === 1)  return 'Yesterday ' + timeStr;          /* Yesterday */
    /* Older: "10 May 9:47 PM" */
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + timeStr;
  }

  /* Lock / unlock the input area while bot is responding */
  function setBotBusy(busy){
    botBusy = busy;
    if (input){
      input.disabled = busy;
      input.style.opacity = busy ? '0.45' : '1';
      if (busy) {
        input.placeholder = 'Sahnawaz is thinking…';
      } else if (!window._helpFlowActive || !window._helpFlowActive()) {
        input.placeholder = (checkChat && checkChat.isActive()) ? checkChat.placeholder()
          : (briefApi && briefApi.isActive()) ? briefApi.placeholder() : 'Ask anything about Sahnawaz…';
      }
    }
    if (sendBtn){
      sendBtn.disabled = busy;
      sendBtn.style.opacity = busy ? '0.35' : '1';
      sendBtn.style.cursor = busy ? 'not-allowed' : 'pointer';
    }
  }

  /* ========== Conversation Memory ========== */
  var conversationHistory = []; // Array of {role:'user'|'bot', text: string}

  function addToHistory(role, text){
    conversationHistory.push({ role: role, text: text });
    // keep last 20 exchanges to avoid unbounded growth
    if (conversationHistory.length > 40) conversationHistory = conversationHistory.slice(-40);
  }

  /* Resolve pronouns using recent history context */
  function resolveContext(input){
    var t = input.toLowerCase().trim();
    // If input is very short and refers to a previous topic, look back
    var contextualPhrases = ['how long','how much','when did','tell me more','what about it','and that','that project','those brands','that role','that work','that last'];
    var isContextual = contextualPhrases.some(function(p){ return t.includes(p); });
    if (isContextual && conversationHistory.length >= 2){
      // Append last bot reply as context for matching
      var lastBotMsg = '';
      for (var i = conversationHistory.length - 1; i >= 0; i--){
        if (conversationHistory[i].role === 'bot'){
          lastBotMsg = conversationHistory[i].text;
          break;
        }
      }
      // Build enriched query by prepending recent context keywords
      var keywords = lastBotMsg.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(' ').filter(function(w){
        return w.length > 4 && !['their','there','about','which','where','these','those','after','before','every','other'].includes(w);
      }).slice(0,6).join(' ');
      return t + ' ' + keywords;
    }
    return t;
  }

  /* ========== Status: "Sahnawaz is typing..." ========== */
  function setTypingStatus(isTyping){
    if (!statusTxt || !liveDot) return;
    if (isTyping){
      statusTxt.textContent = 'Assistant is typing…';
      statusTxt.style.color = '#00ffcc';
      liveDot.style.background = '#00ffcc';
    } else {
      statusTxt.textContent = 'Online • replies instantly';
      statusTxt.style.color = '#00ff99';
      liveDot.style.background = '#00ff99';
    }
  }


  /* ========== Keyboard / viewport ==========
     When the on-screen keyboard is open, the chat is pinned to the part of
     the screen the visitor can actually see (window.visualViewport), so the
     input always sits just above the keyboard — on Android and iPhone, in
     the normal and the expanded size. The old version worked the keyboard
     height out as innerHeight - vv.height - vv.offsetTop; the offsetTop part
     is the browser scrolling to reveal the input, so the chat was placed
     too low and the input ended up under the keyboard.
     All work is batched into one animation frame (the viewport fires many
     resize/scroll events while the keyboard slides in). */
  var _vvFrame = 0;
  function handleViewport(){
    if (_vvFrame) return;
    _vvFrame = requestAnimationFrame(applyViewport);
  }
  /* In-app browsers of social apps (Instagram, Facebook, TikTok…) often
     neither resize the page nor report the keyboard: it is simply drawn
     over the page, so nothing tells the chat where it is. There, if a
     moment after the input is focused no resize has happened at all, the
     chat moves to the top of the screen, sized to sit above a phone
     keyboard. A real resize, if one comes, takes over; leaving the input
     puts everything back. Normal browsers never use this. */
  var IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|musical_ly|Bytedance|TikTok|Snapchat|LinkedInApp|Line\/|Pinterest/i.test(navigator.userAgent || '');
  var _kbGuess = false, _kbBaseH = 0, _kbGuessT = 0;
  function guessAllowed(){
    var coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    return IN_APP && coarse && window.innerWidth <= 900;
  }
  function applyGuess(){
    var h = window.innerHeight, landscape = window.innerWidth > h;
    var kbH = Math.round(h * (landscape ? 0.6 : 0.45));   /* a phone keyboard with its suggestion row */
    var gap = widget.classList.contains('chat-expanded') ? 0 : 6;
    widget.classList.add('kb-open', 'kb-guess');
    widget.style.bottom = 'auto';
    widget.style.top = gap + 'px';
    widget.style.height = Math.max(180, h - kbH - gap * 2) + 'px';
    widget.style.maxHeight = 'none';
    scrollMsgs(true);
  }
  function clearViewportPin(){
    widget.classList.remove('kb-open', 'kb-guess');
    widget.style.top = '';
    widget.style.height = '';
    widget.style.bottom = '';
    widget.style.maxHeight = '';
  }
  function applyViewport(){
    _vvFrame = 0;
    if (!widget) return;
    if (!isOpen) { clearViewportPin(); return; }
    var vv = window.visualViewport;
    var typing = !!input && document.activeElement === input;
    /* keyboard = input focused and a big slice of the window hidden;
       pinch-zoom (scale > 1) is not a keyboard */
    var kb = !!vv && typing && (window.innerHeight - vv.height) > 120 && vv.scale < 1.05;
    /* real information always wins over the guess: the visual viewport
       shrank (kb), or the whole page was resized for the keyboard */
    if (kb || (_kbBaseH && window.innerHeight < _kbBaseH - 120)) _kbGuess = false;
    if (!kb && typing && _kbGuess) { applyGuess(); return; }
    if (!kb) {
      var was = widget.classList.contains('kb-open');
      clearViewportPin();
      if (was) scrollMsgs(true);
      return;
    }
    var gap = widget.classList.contains('chat-expanded') ? 0 : 6;
    widget.classList.remove('kb-guess');
    widget.classList.add('kb-open');
    widget.style.bottom = 'auto';
    widget.style.top = Math.round(vv.offsetTop + gap) + 'px';
    widget.style.height = Math.round(vv.height - gap * 2) + 'px';
    widget.style.maxHeight = 'none';
    scrollMsgs(true);
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', handleViewport, { passive: true });
  }
  window.addEventListener('resize', handleViewport, { passive: true });

  /* The keyboard slides in/out over ~300ms and some browsers only report
     the final size late, so check again a few times after focus changes. */
  function followKeyboard(e){
    if (e && e.type === 'focus') {
      _kbBaseH = window.innerHeight;
      clearTimeout(_kbGuessT);
      if (guessAllowed()) _kbGuessT = setTimeout(function(){
        if (!isOpen || document.activeElement !== input) return;
        var vv = window.visualViewport;
        var told = (vv && (window.innerHeight - vv.height) > 120) || window.innerHeight < _kbBaseH - 120;
        if (!told) { _kbGuess = true; handleViewport(); }
      }, 450);
    } else if (e && e.type === 'blur') {
      clearTimeout(_kbGuessT);
      _kbGuess = false;
    }
    handleViewport();
    [120, 300, 600].forEach(function(t){ setTimeout(handleViewport, t); });
  }
  input && input.addEventListener('focus', followKeyboard);
  input && input.addEventListener('blur', followKeyboard);

  /* ========== Open / Close ========== */
  window.openChat = function(){
    if (!widget) return;
    if (isOpen) return;
    widget.classList.add('chat-open');
    isOpen = true;
    idleCount = 0; /* reset so nudges fire fresh every time chat is opened */
    /* Start the open animation first; do the heavier work (first-time
       setup, sound) right after the first frame so the window appears
       instantly instead of waiting for it. */
    var firstOpen = !inited;
    if (firstOpen) inited = true;
    requestAnimationFrame(function(){
      setTimeout(function(){
        if (firstOpen) initChat();
        playOpen();
        handleViewport();
      }, 0);
    });
    resetIdleTimer();

    /* Option 3 — hide pill when chat opens */
    var pill = document.getElementById('chatPill');
    if (pill) { pill.style.animation = 'pillOut 0.25s ease both'; setTimeout(function(){ pill.style.display = 'none'; }, 250); }

    /* Option 5 — set time-based ring color class */
    var h = new Date().getHours();
    widget.classList.remove('time-morning','time-day','time-evening','time-night');
    if      (h >= 5  && h < 12) widget.classList.add('time-morning');
    else if (h >= 12 && h < 17) widget.classList.add('time-day');
    else if (h >= 17 && h < 21) widget.classList.add('time-evening');
    else                         widget.classList.add('time-night');
  };

  function closeChat(){
    if (!isOpen && !widget.classList.contains('chat-open')) return;
    widget.classList.remove('chat-open');
    isOpen = false;
    /* close the keyboard with the chat */
    if (input && document.activeElement === input) input.blur();
    clearTimeout(idleTimer);
    clearTimeout(idleTimer2);
    clearTimeout(idleTimer3);
    idleCount = 0;
    closeAllPanels();
    /* keep the pinned-above-keyboard position until the fade-out ends,
       then reset it, so the window doesn't jump while it disappears */
    setTimeout(function(){ if (!isOpen) clearViewportPin(); }, 220);
    setTimeout(playClose, 0);

    /* Option 3 — show pill when chat closes, auto-hide after 30s */
    var pill = document.getElementById('chatPill');
    if (pill){
      pill.style.display = 'flex';
      pill.style.animation = 'pillIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
      clearTimeout(pill._hideTimer);
      pill._hideTimer = setTimeout(function(){
        pill.style.animation = 'pillOut 0.4s ease both';
        setTimeout(function(){ pill.style.display = 'none'; }, 400);
      }, 30000);
    }
  }
  /* let other modules (e.g. the deep-link chips) close the chat and
     bring the pill back, exactly as the close button does */
  window.closeChat = closeChat;

  closeBtn && closeBtn.addEventListener('click', closeChat);

  /* Esc closes the chat on a keyboard (desktop) */
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && isOpen && !(window._helpFlowActive && window._helpFlowActive())) closeChat();
  });

  /* Expand / shrink toggle
     Phone: normal = compact window, expanded = full screen.
     Tablet / desktop: normal = corner window, expanded = large window.
     Sizes live in CSS (desktop.css, "CHAT WINDOW v2"); the icon swap is a
     CSS rule on .chat-expanded, so nothing is injected into <head>. */
  var isExpanded = false;
  function setExpanded(on){
    isExpanded = !!on;
    widget.classList.toggle('chat-expanded', isExpanded);
    expandBtn.title = isExpanded ? 'Shrink chat' : 'Expand chat';
    expandBtn.setAttribute('aria-label', isExpanded ? 'Shrink chat' : 'Expand chat');
    expandBtn.setAttribute('aria-pressed', isExpanded ? 'true' : 'false');
    handleViewport();
    requestAnimationFrame(function(){ scrollMsgs(true); });
  }
  expandBtn && expandBtn.addEventListener('click', function(){ setExpanded(!isExpanded); });

  /* Clear conversation */
  clearBtn && clearBtn.addEventListener('click', function(){
    msgs.innerHTML = '';
    conversationHistory = [];
    if (briefApi) briefApi.onClear(); /* brief paused, its draft is kept */
    if (checkChat) checkChat.reset();
    followUpWrap && (followUpWrap.style.display = 'none');
    renderQuickReplies();
    var _sv = null; try { _sv = JSON.parse(localStorage.getItem('shnz_visitor_v1')||'null'); } catch(e){}
    addMsg('bot', getWelcomeMsg(_sv && _sv.firstName ? _sv.firstName : null)); /* always use fresh time-based greeting */
    document.querySelectorAll('.chat-chip').forEach(function(c){ c.classList.remove('used'); });
    setChipsOpen(true);
    resetIdleTimer();
  });

  /* Option 8 — Typewriter welcome message (smooth rAF, no sound) */
  function addMsgTypewriter(text){
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap bot';

    var div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = '';
    wrap.appendChild(div);

    var ts = document.createElement('div');
    ts.className = 'chat-ts';
    var _isoTs = new Date().toISOString();
    ts.textContent = formatTimestamp(_isoTs);
    ts.dataset.iso = _isoTs;
    ts.style.opacity = '0';
    wrap.appendChild(ts);

    msgs.appendChild(wrap);
    scrollMsgs();

    var plain = text.replace(/<br>/g, '\n');
    var fmtWelcome = formatBotReply(plain);
    if (fmtWelcome.rich) {
      div.innerHTML = fmtWelcome.html;
      div.classList.add('rich-reply');
      ts.style.transition = 'opacity 0.4s ease';
      ts.style.opacity = '1';
      addToHistory('bot', text);
      /* Save the greeting to Firestore too (logged-in visitors only —
         _saveChatMessage no-ops harmlessly if no one is signed in), so a
         restored session doesn't jump straight to the visitor's first
         question with no assistant message before it. */
      if (window._saveChatMessage) window._saveChatMessage('bot', text);
      return;
    }

    /* rAF-based typewriter — smooth, no setTimeout stacking, no sound */
    var i = 0;
    var msPerChar = 22;
    var msPause   = 120;
    var last = null;

    function tick(ts_raf){
      if (last === null) last = ts_raf;
      var elapsed = ts_raf - last;
      var delay = (i > 0 && plain[i-1] === '\n') ? msPause : msPerChar;

      if (elapsed >= delay){
        last = ts_raf;
        div.innerHTML = plain.slice(0, ++i).replace(/\n/g, '<br>');
        if (i % 4 === 0) scrollMsgs();
      }

      if (i < plain.length){
        requestAnimationFrame(tick);
      } else {
        scrollMsgs();
        ts.style.transition = 'opacity 0.4s ease';
        ts.style.opacity = '1';
        addToHistory('bot', text);
        /* Same reasoning as above — save the greeting once it's fully typed out. */
        if (window._saveChatMessage) window._saveChatMessage('bot', text);
      }
    }

    setTimeout(function(){ requestAnimationFrame(tick); }, 300);
  }

  /* ========== Init ========== */
  /* ========== Visitor type + quick replies ==========
     First visit: "What brings you here?" with three buttons. The choice is
     remembered on this device, sent to the server with every message so
     answers are tailored, and swaps the starters for ones that fit. */
  var VISITOR_TYPES = [
    { type: 'recruiter', label: "👔 I'm hiring / recruiting" },
    { type: 'client',    label: '💼 I have a project' },
    { type: 'browsing',  label: '👀 Just browsing' }
  ];
  var VISITOR_TYPE_REPLY = {
    recruiter: "Thanks! 👔 Sahnawaz is open to full-time roles as well as freelance work.\n\n" +
               "I can email you his resume right now, or answer anything about his experience and skills.\n" +
               "[[go:send-resume|📄 Email me his resume]]\n[[go:experience|See his experience]]",
    client:    "Great, let's get your project moving! 🚀 I can plan it with you right here — describe it in your own words and " +
               "I'll prepare a brief for Sahnawaz with a typical price range. Or ask me anything first.\n" +
               "[[go:brief|📝 Plan my project with AI]]\n[[go:send-message|📧 Message Sahnawaz]]",
    browsing:  "Welcome! 😊 Have a look around. Ask me anything, or try one of these below."
  };
  var STARTERS = {
    none:      [['💼 See his best work', 'What apps has Sahnawaz built? 🚀'], ['💰 Pricing', "What's his pricing?"],
                ['🤝 Hire Sahnawaz', 'How can I hire Sahnawaz?'], ['✅ Is he available?', 'Is he available for work right now?']],
    recruiter: [['🧑‍💼 His experience', 'Has he worked with big brands?'], ['🛠️ Tech stack', "What's his tech stack?"],
                ['🚀 What he built', 'What apps has Sahnawaz built? 🚀']],
    client:    [['📝 Plan my project', '__brief__'], ['🩺 Check my website', '__check__'],
                ['💰 Pricing', "What's his pricing?"], ['✨ A site like this', 'Can Sahnawaz build me a website like this?']],
    browsing:  [['🚀 His apps', 'What apps has Sahnawaz built? 🚀'], ['🆕 What\'s new', 'What new AI features did Sahnawaz add to this site?'],
                ['🖥️ Hacker Mode', 'What is the Hacker Mode? 🖥️'], ['✨ This portfolio', "What's special about this portfolio?"]]
  };

  function getVisitorType() {
    var t = null;
    try { t = localStorage.getItem('shz_visitor_type'); } catch (e) {}
    if (!t && window._visitorTypeMem) t = window._visitorTypeMem;
    return (t === 'recruiter' || t === 'client' || t === 'browsing') ? t : null;
  }
  function setVisitorType(t) {
    window._visitorTypeMem = t; /* in case storage is blocked */
    try { localStorage.setItem('shz_visitor_type', t); } catch (e) {}
  }
  window._getVisitorType = getVisitorType;

  function qrButton(label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-qr-btn';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderQuickReplies() {
    if (!quickReply) return;
    quickReply.innerHTML = '';
    var vt = getVisitorType();

    if (!vt) {
      var cap = document.createElement('div');
      cap.className = 'chat-qr-caption';
      cap.textContent = 'What brings you here?';
      quickReply.appendChild(cap);
      VISITOR_TYPES.forEach(function (v) {
        quickReply.appendChild(qrButton(v.label, function () { chooseVisitorType(v.type, v.label); }));
      });
    } else {
      var starters = (STARTERS[vt] || STARTERS.none).slice();
      /* a saved project brief → offer to pick it up where they left off */
      if (briefApi && briefApi.hasDraft()) {
        var cont = ['📝 Continue my brief', '__brief__'], at = -1;
        starters.forEach(function (s, i) { if (s[1] === '__brief__') at = i; });
        if (at > -1) starters[at] = cont; else starters.unshift(cont);
      }
      starters.forEach(function (st) {
        quickReply.appendChild(qrButton(st[0], function () {
          quickReply.style.display = 'none';
          if (st[1] === '__brief__') { if (briefApi) briefApi.start(); }
          else if (st[1] === '__check__') { checkChat.start(); }
          else handleQ(st[1]);
          resetIdleTimer();
        }));
      });
    }
    quickReply.style.display = 'flex';
  }

  function chooseVisitorType(type, label) {
    if (botBusy) return;
    if (window._helpFlowActive && window._helpFlowActive()) return;
    setVisitorType(type);
    quickReply.style.display = 'none';
    setChipsOpen(false);
    playSend && playSend();
    addMsg('user', label);
    if (window._saveChatMessage) window._saveChatMessage('user', label);
    var reply = VISITOR_TYPE_REPLY[type];
    addBotTyping(reply, label);
    /* once the reply has rendered, offer starters that fit — unless the
       visitor has already moved on (typed, tapped a chip, started a flow) */
    setTimeout(function () {
      var last = conversationHistory[conversationHistory.length - 1];
      if (botBusy || !last || last.role !== 'bot' || last.text !== reply) return;
      if (window._helpFlowActive && window._helpFlowActive()) return;
      renderQuickReplies();
      scrollMsgs();
    }, 1900);
  }

  function wireQuickReply() {
    renderQuickReplies();
  }

  function initChat(){
    /* Feature 1 + Smart greeting: personalised using Google login name */
    var _savedVisitor = null;
    try { _savedVisitor = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); } catch(e){}
    var _firstName = (_savedVisitor && _savedVisitor.firstName) ? _savedVisitor.firstName : null;
    var greeting = getWelcomeMsg(_firstName);

    /* ── CHAT HISTORY: Load past messages from Firestore if user is logged in ── */
    /* Show a skeleton placeholder immediately so chat never looks blank */
    var _histSkeleton = null;
    if (_savedVisitor && msgs) {
      _histSkeleton = document.createElement('div');
      _histSkeleton.style.cssText = 'text-align:center;padding:18px 0 6px;';
      _histSkeleton.innerHTML =
        '<span style="font-size:0.75rem;color:rgba(0,255,255,0.35);letter-spacing:0.05em;">⟳ loading history\u2026</span>';
      msgs.appendChild(_histSkeleton);
    }
    function _removeHistSkeleton() {
      if (_histSkeleton && _histSkeleton.parentNode) {
        _histSkeleton.parentNode.removeChild(_histSkeleton);
        _histSkeleton = null;
      }
    }

    /* Retry up to 10 times (3 seconds) to wait for Firebase/Firestore to be ready */
    function tryLoadHistory(attemptsLeft) {
      if (window._loadChatHistory && _savedVisitor) {
        window._loadChatHistory(function(history) {
          _removeHistSkeleton();
          if (history && history.length > 0) {
            /* Restore past messages into UI and conversationHistory */
            history.forEach(function(m) {
              var r = (m.role === 'bot') ? 'bot' : 'user';
              /* Normalise Firestore Timestamp → ISO string so formatTimestamp works */
              var savedTime = m.time || null;
              if (savedTime && typeof savedTime === 'object') {
                if (typeof savedTime.toDate === 'function') {
                  savedTime = savedTime.toDate().toISOString();
                } else if (typeof savedTime.seconds === 'number') {
                  savedTime = new Date(savedTime.seconds * 1000).toISOString();
                }
              }
              addMsg(r, m.content, savedTime);
              conversationHistory.push({ role: r, text: m.content });
            });
            /* Visual separator so user knows this is a new session */
            var sep = document.createElement('div');
            sep.style.cssText = 'text-align:center;font-size:0.68rem;color:rgba(0,255,255,0.3);margin:10px 0 6px;letter-spacing:0.05em;';
            sep.textContent = '── new session ──';
            msgs.appendChild(sep);
            scrollMsgs();
            /* opened by a planner button: the brief replaces the greeting */
            if (startPendingBrief()) return;
            /* Smart AI-powered returning visitor greeting via Groq API */
            var _act = window._visitorActivity;
            var h = new Date().getHours();
            var timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
            var greetingPrompt = 'Generate a warm, unique, personalised returning visitor greeting for a portfolio chatbot. ' +
              'Visitor name: ' + (_firstName || 'friend') + '. ' +
              'Time of day: ' + timeOfDay + '. ' +
              (_act && _act.likedProjects && _act.likedProjects.length > 0 ? 'They previously liked these projects: ' + _act.likedProjects.join(', ') + '. ' : '') +
              (_act && _act.resumeDownloaded ? 'They previously downloaded the resume. ' : '') +
              (_act && _act.reviewSubmitted ? 'They left a ' + _act.reviewSubmitted.stars + ' star review previously. ' : '') +
              (_act && _act.totalChats > 0 ? 'They have sent ' + _act.totalChats + ' messages before. ' : '') +
              'Make it feel genuinely personal, reference their specific activity naturally, use 1-2 emojis, keep it under 3 lines. Be creative and warm each time. No [CAT:] tag needed. No generic phrases.';

            /* Show subtle loading indicator while AI greeting loads */
            var loadingGreet = document.createElement('div');
            loadingGreet.style.cssText = 'color:rgba(0,255,255,0.35);font-size:0.78rem;padding:8px 14px;font-style:italic;';
            loadingGreet.textContent = '✦ personalising...';
            msgs.appendChild(loadingGreet);
            scrollMsgs();

            fetch('https://sahnawaz-portfolio.vercel.app/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: '__GREETING__: ' + greetingPrompt,
                history: [],
                visitorName: _firstName,
                visitorActivity: _act || null,
                clientHour: new Date().getHours()
              })
            })
            .then(function(r){
              /* A busy (429) or error body is not a greeting — use the local one */
              if (!r.ok) throw new Error('greeting status ' + r.status);
              return r.json();
            })
            .then(function(d){
              if (loadingGreet.parentNode) loadingGreet.parentNode.removeChild(loadingGreet);
              /* the planner started while this greeting was loading */
              if (briefApi && briefApi.isActive()) { buildChips(); setChipsOpen(false); return; }
              var aiGreeting = (d && d.reply && d.reply.trim())
                ? d.reply.replace(/^\[CAT:[^\]]*\]\s*/,'').trim()
                : greeting;
              if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
              addMsgTypewriter(aiGreeting);
              buildChips();
              setChipsOpen(false);
              wireQuickReply();
              /* Force scroll after greeting appears — typewriter may not reach bottom */
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 100);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 600);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 1200);
            })
            .catch(function(){
              if (loadingGreet.parentNode) loadingGreet.parentNode.removeChild(loadingGreet);
              if (briefApi && briefApi.isActive()) { buildChips(); setChipsOpen(false); return; }
              if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
              addMsgTypewriter(greeting);
              buildChips();
              setChipsOpen(false);
              wireQuickReply();
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 100);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 600);
              setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 1200);
            });
            return; /* API callback handles rendering — skip below */
          }
          if (startPendingBrief()) return;
          if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
          addMsgTypewriter(greeting);
          buildChips();
          setChipsOpen(false);
          wireQuickReply();
        });
      } else if (_savedVisitor && attemptsLeft > 0) {
        /* Firebase not ready yet — wait 300ms and retry */
        setTimeout(function(){ tryLoadHistory(attemptsLeft - 1); }, 300);
      } else {
        /* Not logged in, or Firebase never became ready — show greeting immediately */
        _removeHistSkeleton();
        if (startPendingBrief()) return;
        if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
        addMsgTypewriter(greeting);
        buildChips();
        setChipsOpen(false);
        wireQuickReply();
      }
    }
    /* Firebase now starts on the visitor's first tap (see visitor-auth.js),
       so give a returning visitor's saved history up to 6 seconds to arrive
       — the "loading history…" line shows meanwhile. */
    if (_savedVisitor && window._startVisitorAuth) window._startVisitorAuth();
    tryLoadHistory(20);
  }

  /* ========== Chips scroll hint ========== */
  var scrollHint = document.getElementById('chipsScrollHint');

  function updateChipsScrollHint(){
    if (!chips || !chipsWrap) return;
    var scrollable = chips.scrollHeight > chips.clientHeight + 4;
    chipsWrap.classList.toggle('has-scroll', scrollable);
    if (!scrollable){
      chipsWrap.classList.remove('scrolled-to-end');
      if (scrollHint) { scrollHint.classList.remove('hint-visible'); }
      return;
    }
    var atBottom = chips.scrollTop + chips.clientHeight >= chips.scrollHeight - 8;
    chipsWrap.classList.toggle('scrolled-to-end', atBottom);
    if (scrollHint) { scrollHint.classList.toggle('hint-visible', !atBottom); }
  }

  if (chips) {
    chips.addEventListener('scroll', updateChipsScrollHint, { passive:true });
  }

  /* ========== Chips toggle ========== */
  function setChipsOpen(open){
    chipsVisible = open;
    chipsWrap.classList.toggle('chips-open', open);
    chipsToggle.classList.toggle('chips-open', open);
    if (open) { setTimeout(updateChipsScrollHint, 40); }
    else {
      chipsWrap.classList.remove('has-scroll','scrolled-to-end');
      if (scrollHint) scrollHint.classList.remove('hint-visible');
    }
  }

  /* ── Shared closeAll helper ── */
  function closeAllPanels() {
    setChipsOpen(false);
    var cp = document.getElementById('cmdPanel');
    var ct = document.getElementById('cmdToggle');
    if (cp) cp.classList.remove('cmd-open');
    if (ct) ct.classList.remove('cmd-open');
    var hp = document.getElementById('helpPanel');
    var ht = document.getElementById('helpToggle');
    if (hp) hp.classList.remove('help-open');
    if (ht) ht.classList.remove('help-open');
  }

  chipsToggle && chipsToggle.addEventListener('click', function(){
    if (window._helpFlowActive && window._helpFlowActive()) return;
    var opening = !chipsVisible;
    closeAllPanels();
    if (opening) setChipsOpen(true);
  });

  /* ========== Site Commands Panel ========== */
  (function(){
    var cmdToggleEl = document.getElementById('cmdToggle');
    var cmdPanelEl  = document.getElementById('cmdPanel');
    var cmdToast    = document.getElementById('cmdCopyToast');
    if (!cmdToggleEl || !cmdPanelEl) return;

    var cmdOpen = false;
    cmdToggleEl.addEventListener('click', function(){
      if (window._helpFlowActive && window._helpFlowActive()) return;
      /* Read the real DOM state, not the local flag — another panel's
         closeAllPanels() call can close this panel without ever touching
         cmdOpen, which used to leave it stale and require a double-click
         to reopen. */
      var opening = !cmdPanelEl.classList.contains('cmd-open');
      closeAllPanels();
      if (opening) {
        cmdOpen = true;
        cmdPanelEl.classList.add('cmd-open');
        cmdToggleEl.classList.add('cmd-open');
      } else {
        cmdOpen = false;
      }
    });

    /* Tap a command button → fill input and send */
    cmdPanelEl.addEventListener('click', function(e){
      var btn = e.target.closest('.cmd-btn');
      if (btn) {
        var cmd = btn.getAttribute('data-cmd');
        if (cmd && input) {
          input.value = cmd;
          /* close panel then send */
          cmdOpen = false;
          cmdPanelEl.classList.remove('cmd-open');
          cmdToggleEl.classList.remove('cmd-open');
          _briefBypassOnce = true;
          sendMessage();
        }
        return;
      }

      /* Copy button */
      var copyBtn = e.target.closest('.cmd-copy');
      if (copyBtn) {
        var text = copyBtn.getAttribute('data-copy');
        if (!text) return;
        try {
          navigator.clipboard.writeText(text).then(function(){
            copyBtn.classList.add('copied');
            copyBtn.textContent = '✓';
            if (cmdToast) { cmdToast.style.display = 'block'; }
            setTimeout(function(){
              copyBtn.classList.remove('copied');
              copyBtn.textContent = '⧉';
              if (cmdToast) { cmdToast.style.display = 'none'; }
            }, 1600);
          });
        } catch(err) {
          /* Fallback for older browsers */
          var ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.classList.add('copied');
          copyBtn.textContent = '✓';
          if (cmdToast) { cmdToast.style.display = 'block'; }
          setTimeout(function(){
            copyBtn.classList.remove('copied');
            copyBtn.textContent = '⧉';
            if (cmdToast) { cmdToast.style.display = 'none'; }
          }, 1600);
        }
      }
    });
  })();
  /* ========== End Site Commands Panel ========== */

  /* ========== Help Panel — Smart Actions ========== */
  (function(){
    var helpToggleEl = document.getElementById('helpToggle');
    var helpPanelEl  = document.getElementById('helpPanel');
    if (!helpToggleEl || !helpPanelEl) return;

    var helpOpen = false;

    /* Toggle help panel */
    helpToggleEl.addEventListener('click', function(){
      /* Read the real DOM state — see matching note in the Commands panel
         toggle above; a stale local flag caused the same double-click bug. */
      var opening = !helpPanelEl.classList.contains('help-open');
      closeAllPanels();
      if (opening) {
        helpOpen = true;
        helpPanelEl.classList.add('help-open');
        helpToggleEl.classList.add('help-open');
      } else {
        helpOpen = false;
      }
    });

    /* ── Conversational flow state ── */
    var _flow   = null;  // 'quickmail' | 'resume' | 'callback'
    var _step   = 0;
    var _data   = {};    // collected: name, email, message, phone, time
    var _apiUrl = 'https://sahnawaz-portfolio.vercel.app/api/';

    /* Inject a bot message that looks native */
    function botSay(text) {
      /* Re-use addBotTyping if available, else fallback */
      if (typeof addBotTyping === 'function') {
        addBotTyping(text, '');
      } else {
        var wrap = document.createElement('div');
        wrap.className = 'chat-msg-wrap bot';
        var bubble = document.createElement('div');
        bubble.className = 'chat-msg bot';
        bubble.textContent = text;
        wrap.appendChild(bubble);
        msgs.appendChild(wrap);
        scrollMsgs();
      }
    }

    /* Add user message to chat visually */
    function userSay(text) {
      if (typeof addMsg === 'function') addMsg('user', text);
      /* Also save help-flow user inputs (name, email, message steps) to Firestore */
      if (window._saveChatMessage) window._saveChatMessage('user', text);
    }

    /* Set input placeholder */
    function setPlaceholder(text) {
      setTimeout(function() {
        var inp = document.getElementById('chatInput');
        if (inp) inp.placeholder = text;
      }, 50);
    }

    /* Show cancel button in chat */
    function showCancelBtn() {
      var existing = document.getElementById('flowCancelWrap');
      if (existing) existing.parentNode.removeChild(existing);
      var chatMsgs = document.getElementById('chatMessages');
      if (!chatMsgs) return;
      var wrap = document.createElement('div');
      wrap.id = 'flowCancelWrap';
      wrap.style.cssText = 'padding:4px 12px;';
      var btn = document.createElement('button');
      btn.textContent = '❌ Cancel';
      btn.style.cssText = 'background:rgba(255,60,60,0.12);border:1px solid rgba(255,80,80,0.35);color:#ff6b6b;padding:6px 18px;border-radius:999px;font-size:0.8rem;cursor:pointer;';
      btn.onclick = function() {
        _flow = null; _step = 0; _data = {};
        setPlaceholder('Ask anything about Sahnawaz…');
        var el = document.getElementById('flowCancelWrap');
        if (el) el.parentNode.removeChild(el);
        botSay("No problem! Feel free to ask me anything 😊");
      };
      wrap.appendChild(btn);
      chatMsgs.appendChild(wrap);
      scrollMsgs();
    }

    /* Remove cancel button */
    function removeCancelBtn() {
      var el = document.getElementById('flowCancelWrap');
      if (el) el.parentNode.removeChild(el);
    }

    /* Reset flow */
    function resetFlow() {
      _flow = null; _step = 0; _data = {}; _errCount = {};
      setPlaceholder('Ask anything about Sahnawaz…');
      removeCancelBtn();
    }

    /* Start a flow */
    function startFlow(type) {
      if (window._briefPause) window._briefPause(); /* one flow at a time; the brief draft is kept */
      if (window._checkChatReset) window._checkChatReset();
      resetFlow();
      _flow = type;
      _step = 1;
      helpOpen = false;
      helpPanelEl.classList.remove('help-open');
      helpToggleEl.classList.remove('help-open');

      /* ── Smart pre-fill: use Google login data if available ── */
      var _loggedIn = null;
      try { _loggedIn = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); } catch(e) {}
      var _knownName  = _loggedIn && _loggedIn.firstName  ? _loggedIn.firstName  : null;
      var _knownEmail = _loggedIn && _loggedIn.email      ? _loggedIn.email      : null;
      var _knownFull  = _loggedIn && _loggedIn.fullName   ? _loggedIn.fullName   : _knownName;

      if (type === 'quickmail') {
        if (_knownName && _knownEmail) {
          /* Both known — skip name + email, jump straight to message */
          _data.name  = _knownFull;
          _data.email = _knownEmail;
          _step = 3;
          botSay("Hey " + _knownName + "! 👋 I already have your details from your Google login.\n\nJust type your message for Sahnawaz below 💬");
          setPlaceholder('Type your message...');
        } else if (_knownName) {
          /* Name known — skip to email step */
          _data.name = _knownFull;
          _step = 2; _errCount.qmEmail = 0;
          botSay("Hey " + _knownName + "! 👋 What's your email address so Sahnawaz can reply to you?");
          setPlaceholder('Type your email...');
        } else {
          botSay("Sure! Let's send Sahnawaz a message 📧\n\nFirst, what's your name?");
          setPlaceholder('Type your name...');
        }

      } else if (type === 'resume') {
        if (_knownName && _knownEmail) {
          /* Both known — send resume immediately, no questions needed */
          _data.name  = _knownFull;
          _data.email = _knownEmail;
          botSay("Sending Sahnawaz's resume to **" + _knownEmail + "**... ⏳");
          var rsName = _data.name, rsEmail = _data.email;
          resetFlow();
          fetch(_apiUrl + 'resume', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: rsName, email: rsEmail })
          })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d.success) botSay("✅ Resume sent to " + rsEmail + "!\n\nCheck your inbox (and spam just in case). Hope it impresses you, " + rsName + "! 😄");
            else botSay("⚠️ Something went wrong. Please try opening the resume from the portfolio page directly.");
          })
          .catch(function() { botSay("⚠️ Network error. Please try the resume button on the portfolio page."); });
          return; /* flow already reset inside, skip showCancelBtn */
        } else if (_knownName) {
          _data.name = _knownFull;
          _step = 2; _errCount.rsEmail = 0;
          botSay("Hey " + _knownName + "! 📧 What email should I send the resume to?");
          setPlaceholder('Type your email...');
        } else {
          botSay("Sure! I'll email Sahnawaz's resume to you 📄\n\nWhat's your name?");
          setPlaceholder('Type your name...');
        }

      } else if (type === 'callback') {
        if (_knownName && _knownEmail) {
          /* Name + email known — skip both, start at phone */
          _data.name  = _knownFull;
          _data.email = _knownEmail;
          _step = 2; _errCount.cbPhone = 0;
          botSay("Hey " + _knownName + "! 📞 I've got your name and email from your Google login.\n\nPlease enter your 10-digit mobile number.\n(India: +91 is assumed — just type the 10 digits)");
          setPlaceholder('e.g. 9876543210');
        } else if (_knownName) {
          _data.name = _knownFull;
          _step = 2; _errCount.cbPhone = 0;
          botSay("Hey " + _knownName + "! 📞 Please enter your 10-digit mobile number.\n(India: +91 is assumed — just type the 10 digits)");
          setPlaceholder('e.g. 9876543210');
        } else {
          botSay("Let's set up a callback with Sahnawaz 📅\n\nWhat's your name?");
          setPlaceholder('Type your name...');
        }
      }

      showCancelBtn();
    }

    /* ── Validation helpers ── */
    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    }
    function isValidPhone(v) {
      var digits = v.trim().replace(/[\s\-().]/g, '');
      return /^\+?\d{10,13}$/.test(digits) && digits.replace(/\D/g,'').length >= 10;
    }
    function isValidContact(v) {
      return isValidEmail(v) || isValidPhone(v);
    }

    /* ── Per-field error counters — reset on every startFlow ── */
    var _errCount = {};
    var _origResetFlow = null; /* patched below */

    /* Smart cancel nudge — varies by attempt so it never feels robotic */
    /* Email-only flows (quickmail, resume) — no phone mention */
    var _cancelNudgesEmail = [
      "Still not quite right 😅 — try something like name@gmail.com\n\nOr if you'd rather ask something else, the ❌ Cancel button above will free you right up!",
      "No worries, typos happen! Double-check and try again 🙂\n\nAnd hey — if you've changed your mind or had another question pop up, just tap ❌ Cancel anytime.",
      "Still having trouble? A valid email looks like: user@mail.com ✍️\n\nNo pressure — hit ❌ Cancel above if you'd like to explore something else first.",
      "One more try! Make sure it has an @ and a domain — like name@gmail.com 📧\n\nOr use ❌ Cancel if you want to chat about something else — I'm not going anywhere! 😊"
    ];
    /* Callback flow — phone only nudges */
    var _cancelNudgesContact = [
      "Still not quite right 😅 — just 10 digits, like 9876543210. No +91 needed!\n\nOr if you'd rather ask something else, the ❌ Cancel button above will free you right up!",
      "No worries, typos happen! Double-check and try again 🙂 — exactly 10 digits.\n\nAnd hey — if you've changed your mind, just tap ❌ Cancel anytime.",
      "Still having trouble? Make sure it's exactly 10 digits 📋 — e.g. 98765 43210.\n\nNo pressure — hit ❌ Cancel above if you'd like to explore something else first.",
      "One more try! Just 10 digits — like 9876543210 ✍️\n\nOr use ❌ Cancel if you want to chat about something else — I'm not going anywhere! 😊"
    ];
    function getCancelNudge(errN, type) {
      var arr = (type === 'contact') ? _cancelNudgesContact : _cancelNudgesEmail;
      var idx = Math.min(errN - 2, arr.length - 1);
      return arr[idx];
    }

    /* Handle each step of the flow — called from sendMessage intercept */
    window._helpFlowActive = function() { return _flow !== null; };
    /* Lets the project brief take over from an unfinished Help flow */
    window._cancelHelpFlow = function() {
      if (_flow === null) return false;
      _flow = null; _step = 0; _data = {}; _errCount = {};
      removeCancelBtn();
      return true;
    };
    /* Lets chat replies start a flow in place (chips like [[go:send-resume|…]]) */
    window._startHelpFlow = function(type) {
      if (type !== 'quickmail' && type !== 'resume' && type !== 'callback') return false;
      startFlow(type);
      return true;
    };

    window._helpFlowStep = function(userInput) {
      if (!_flow) return false;

      userSay(userInput);

      /* ── Quick Mail flow ── */
      if (_flow === 'quickmail') {
        if (_step === 1) {
          _data.name = userInput; _step = 2; _errCount.qmEmail = 0;
          botSay("Nice to meet you, " + userInput + "! 😊\n\nWhat's your email address?");
          setPlaceholder('Type your email...'); return true;
        }
        if (_step === 2) {
          if (!isValidEmail(userInput)) {
            _errCount.qmEmail = (_errCount.qmEmail || 0) + 1;
            if (_errCount.qmEmail === 1) {
              botSay("Hmm, that doesn't look like a valid email. 🤔\n\nPlease enter a proper email — like name@example.com");
            } else {
              botSay(getCancelNudge(_errCount.qmEmail, 'email'));
            }
            return true;
          }
          _errCount.qmEmail = 0;
          _data.email = userInput; _step = 3;
          botSay("Got it! Now type your message for Sahnawaz 💬"); setPlaceholder('Type your message...'); return true;
        }
        if (_step === 3) {
          _data.message = userInput;
          botSay("Sending your message... ⏳");
          var qmName = _data.name, qmEmail = _data.email, qmMsg = _data.message;
          resetFlow();
          fetch(_apiUrl + 'contact', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name: qmName, email: qmEmail, message: qmMsg })
          })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success) botSay("✅ Message delivered to Sahnawaz!\n\nA confirmation has been sent to **" + qmEmail + "** — please check your inbox (and spam, just in case).\n\nHe'll reply to you within **24 hours**. Talk soon, " + qmName + "! 🚀");
            else botSay("⚠️ Something went wrong. Please email directly: shzthedigitalalchemist@gmail.com");
          })
          .catch(function(){ botSay("⚠️ Network error. Please try: shzthedigitalalchemist@gmail.com"); });
          return true;
        }
      }

      /* ── Resume flow ── */
      if (_flow === 'resume') {
        if (_step === 1) {
          _data.name = userInput; _step = 2; _errCount.rsEmail = 0;
          botSay("Nice to meet you, " + userInput + "! 📧\n\nWhat's your email address? I'll send the resume there.");
          setPlaceholder('Type your email...'); return true;
        }
        if (_step === 2) {
          if (!isValidEmail(userInput)) {
            _errCount.rsEmail = (_errCount.rsEmail || 0) + 1;
            if (_errCount.rsEmail === 1) {
              botSay("That doesn't look like a valid email. 🤔\n\nPlease enter a proper email — like name@example.com");
            } else {
              botSay(getCancelNudge(_errCount.rsEmail, 'email'));
            }
            return true;
          }
          _errCount.rsEmail = 0;
          _data.email = userInput;
          botSay("Sending resume to " + _data.email + "... ⏳");
          var rsName = _data.name, rsEmail = _data.email;
          resetFlow();
          fetch(_apiUrl + 'resume', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name: rsName, email: rsEmail })
          })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success) botSay("✅ Resume sent to " + rsEmail + "!\n\nCheck your inbox (and spam just in case). Hope it impresses you, " + rsName + "! 😄");
            else botSay("⚠️ Something went wrong. Please try opening the resume from the portfolio page directly.");
          })
          .catch(function(){ botSay("⚠️ Network error. Please try the resume button on the portfolio page."); });
          return true;
        }
      }

      /* ── Callback flow ── */
      if (_flow === 'callback') {
        /* Step 1 — Name */
        if (_step === 1) {
          _data.name = userInput; _step = 2; _errCount.cbPhone = 0;
          botSay("Hi " + userInput + "! 📞\n\nPlease enter your 10-digit mobile number.\n(India: +91 is assumed — just type the 10 digits)");
          setPlaceholder('e.g. 9876543210'); return true;
        }
        /* Step 2 — Phone (10 digits, +91 auto-prepended) */
        if (_step === 2) {
          var rawPhone = userInput.trim().replace(/[\s\-().]/g, '');
          var digitsOnly = rawPhone.replace(/^\+?91/, '').replace(/\D/g, '');
          if (digitsOnly.length !== 10) {
            _errCount.cbPhone = (_errCount.cbPhone || 0) + 1;
            if (_errCount.cbPhone === 1) {
              botSay("That doesn't look right. 🤔\n\nPlease enter your 10-digit Indian mobile number.\nExample: 9876543210\n(No need to add +91 — I've got that covered!)");
            } else {
              botSay("Still not matching 😅 — a 10-digit number like 98765 43210 is all I need.\n\nHit ❌ Cancel above if you'd like to try something else first.");
            }
            return true;
          }
          _errCount.cbPhone = 0;
          _data.phone = '+91 ' + digitsOnly; _step = 3;
          botSay("Got it! 🇮🇳 Saved as +91 " + digitsOnly + "\n\nBriefly, what's the purpose of your call?\n(e.g. 'Discuss a web project', 'Get a quote', 'Partnership idea')");
          setPlaceholder('e.g. Discuss a project...'); return true;
        }
        /* Step 3 — Purpose */
        if (_step === 3) {
          var purposeTrimmed = userInput.trim();
          if (purposeTrimmed.length < 3) {
            botSay("Just a few words is fine! 😊\n\nWhat would you like to discuss with Sahnawaz?\n(e.g. 'Web project', 'Freelance quote', 'Partnership idea')");
            return true;
          }
          _data.purpose = purposeTrimmed; _step = 4;
          botSay("Great context, thanks! 🙌\n\nWhen's a good time for the call?\n(e.g. 'Tomorrow 3 PM' or 'Weekdays after 6 PM')");
          setPlaceholder('Type preferred time...'); return true;
        }
        /* Step 4 — Preferred time */
        if (_step === 4) {
          _data.time = userInput;
          /* If email pre-filled from Google login — skip step 5, submit directly */
          if (_data.email && isValidEmail(_data.email)) {
            botSay("Sending your callback request... ⏳");
            var cbName4 = _data.name, cbPhone4 = _data.phone, cbEmail4 = _data.email, cbTime4 = _data.time, cbPurpose4 = _data.purpose;
            resetFlow();
            fetch(_apiUrl + 'callback', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cbName4, phone: cbPhone4, email: cbEmail4, purpose: cbPurpose4, time: cbTime4 })
            })
            .then(function(r){ return r.json(); })
            .then(function(d){
              if (d.success && d.confirmed) {
                botSay("✅ All done, " + cbName4 + "!\n\nSahnawaz has been notified and will call you at " + cbPhone4 + " around " + cbTime4 + ".\n\n📧 A confirmation email has been sent to " + cbEmail4 + " — check your inbox (and spam folder just in case).\n\nTalk soon! 🙌");
              } else if (d.success) {
                botSay("✅ Callback request sent to Sahnawaz!\n\nHe'll reach out at " + cbPhone4 + " around " + cbTime4 + ".\n\n⚠️ Confirmation email couldn't be delivered to " + cbEmail4 + " — but your request is safely logged. Talk soon, " + cbName4 + "! 🙌");
              } else {
                botSay("⚠️ Something went wrong. Please email Sahnawaz directly: shzthedigitalalchemist@gmail.com");
              }
            })
            .catch(function(){ botSay("⚠️ Network error. Please email: shzthedigitalalchemist@gmail.com"); });
            return true;
          }
          _step = 5; _errCount.cbEmail = 0;
          botSay("Perfect! Almost there. 🎯\n\nLastly, your email address please.\n\n📌 This lets us send you an instant confirmation so your callback is properly logged and gets priority attention from Sahnawaz.");
          setPlaceholder('Type your email...'); return true;
        }
        /* Step 5 — Email + submit */
        if (_step === 5) {
          if (!isValidEmail(userInput)) {
            _errCount.cbEmail = (_errCount.cbEmail || 0) + 1;
            if (_errCount.cbEmail === 1) {
              botSay("Hmm, that doesn't look like a valid email. 🤔\n\nPlease enter a proper email — like name@example.com");
            } else {
              botSay(getCancelNudge(_errCount.cbEmail, 'email'));
            }
            return true;
          }
          _errCount.cbEmail = 0;
          _data.email = userInput;
          botSay("Sending your callback request... ⏳");
          var cbName = _data.name, cbPhone = _data.phone, cbEmail = _data.email, cbTime = _data.time, cbPurpose = _data.purpose;
          resetFlow();

          fetch(_apiUrl + 'callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cbName,
              phone: cbPhone,
              email: cbEmail,
              purpose: cbPurpose,
              time: cbTime
            })
          })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success && d.confirmed) {
              botSay("✅ All done, " + cbName + "!\n\nSahnawaz has been notified and will call you at " + cbPhone + " around " + cbTime + ".\n\n📧 A confirmation email has been sent to " + cbEmail + " — check your inbox (and spam folder just in case).\n\nTalk soon! 🙌");
            } else if (d.success) {
              botSay("✅ Callback request sent to Sahnawaz!\n\nHe'll reach out at " + cbPhone + " around " + cbTime + ".\n\n⚠️ Confirmation email couldn't be delivered to " + cbEmail + " — but your request is safely logged. Talk soon, " + cbName + "! 🙌");
            } else {
              botSay("⚠️ Something went wrong. Please email Sahnawaz directly: shzthedigitalalchemist@gmail.com");
            }
          })
          .catch(function(){ botSay("⚠️ Network error. Please email: shzthedigitalalchemist@gmail.com"); });
          return true;
        }
      }

      return false;
    };

    /* Help button clicks */
    helpPanelEl.addEventListener('click', function(e){
      var btn = e.target.closest('.help-btn');
      if (!btn) return;
      var type = btn.getAttribute('data-help');
      if (type === 'brief' || type === 'check') {
        helpOpen = false;
        helpPanelEl.classList.remove('help-open');
        helpToggleEl.classList.remove('help-open');
        if (type === 'brief' && window._startBrief) window._startBrief();
        if (type === 'check' && window._startWebsiteCheck) window._startWebsiteCheck();
        return;
      }
      if (type) startFlow(type);
    });

  })();
  /* ========== End Help Panel ========== */

  /* ========== AI Project Brief agent ==========
     The visitor describes their project in their own words. Each message goes
     to api/chat.js (source:'brief' → lib/project-brief.js): the AI picks out
     every detail it contains and asks only for what is still missing, while
     the server decides what counts as complete. The finished brief is shown
     as a card to review, then sent with api/contact.js (mode:'brief') —
     Sahnawaz gets it with a private AI analysis, the visitor gets a copy.

     The draft is kept on this device, so closing the chat, clearing it or
     reloading the page never loses it. While the brief is active, typed
     messages go to the brief; suggestion chips and commands still go to the
     normal assistant (_briefBypassOnce). */
  var _briefBypassOnce = false;
  var briefApi = (function(){
    var API      = 'https://sahnawaz-portfolio.vercel.app/api/';
    var STORE    = 'shz_brief_v1';
    var REQUIRED = ['name', 'email', 'projectType', 'goal', 'budget', 'timeline'];
    var ORDER    = ['name', 'email', 'phone', 'business', 'projectType', 'goal', 'features', 'budget', 'timeline', 'website', 'notes'];
    var LABELS   = { name:'Name', email:'Email', phone:'Phone', business:'Business', projectType:'Project', goal:'Goal',
                     features:'Features', budget:'Budget', timeline:'Timeline', website:'Website', notes:'Notes' };
    var ASK = {
      name:        "What's your name?",
      email:       "What's the best email for Sahnawaz to reply to?",
      projectType: "What would you like built — a business website, an online store, a portfolio, an app, or something else?",
      goal:        "What should it do for you? A line about the main goal is enough.",
      budget:      "Do you have a budget range in mind? It's completely fine to say not sure.",
      timeline:    "When would you like it ready?"
    };
    var HINT = {
      name:        'Your name…',
      email:       'Your email…',
      projectType: 'Describe your project…',
      goal:        'What should it do for you?…',
      budget:      'Budget — e.g. ₹15k, or not sure…',
      timeline:    'When do you need it?…'
    };
    /* Same types and typical ranges as lib/project-brief.js (the server
       confirms them on every reply). Used when a button starts the brief
       with the project type already chosen, e.g. a pricing card. */
    var TYPES = {
      'Business website':         { range: '₹9,999 – ₹14,999',    time: '2–3 weeks',               say: 'business website' },
      'Landing page':             { range: '₹9,999 – ₹14,999',    time: '2–3 weeks',               say: 'landing page' },
      'Portfolio website':        { range: '₹6,999 – ₹9,999',     time: '1–2 weeks',               say: 'portfolio website' },
      'E-commerce store':         { range: '₹14,999 – ₹24,999',   time: '3–5 weeks',               say: 'online store' },
      'UI/UX design':             { range: '₹3,999 per screen',   time: '1–2 weeks',               say: 'UI/UX design' },
      'AI chatbot / integration': { range: '₹2,999 – ₹7,999',     time: '1–3 weeks',               say: 'AI chatbot' },
      'Web ads & promotion':      { range: '₹3,999 per campaign', time: 'Monthly report included', say: 'ad campaign' },
      'Web app / custom build':   { range: 'Custom quote',        time: 'Depends on scope',        say: 'web app' },
      'Website redesign':         { range: 'Custom quote',        time: 'Depends on scope',        say: 'website redesign' }
    };
    var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var st = load() || fresh();
    var active = false;     /* typed messages go to the brief */
    var turnBusy = false;   /* a brief message is being answered */
    var sending = false;    /* the finished brief is being sent */
    var liveCard = null;    /* the review card that can still be sent */
    var barEl = null;
    var sentThisVisit = null; /* a brief sent during this visit (for the assistant) */

    /* ── state ── */
    function fresh(){
      return { brief:{}, history:[], ready:false, estimate:null, missing:REQUIRED.slice(), turns:0, nudged:false, from:'', t:0 };
    }
    function missingOf(b){ return REQUIRED.filter(function(k){ return !b || !b[k]; }); }
    function load(){
      try {
        var s = JSON.parse(localStorage.getItem(STORE) || 'null');
        /* drafts older than 30 days are dropped */
        if (s && s.brief && typeof s.brief === 'object' && Date.now() - (s.t || 0) < 30 * 864e5) {
          s.history = Array.isArray(s.history) ? s.history.slice(-8) : [];
          s.missing = Array.isArray(s.missing) ? s.missing : missingOf(s.brief);
          s.turns = s.turns || 0;
          return s;
        }
      } catch (e) {}
      return null;
    }
    function save(){ st.t = Date.now(); try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) {} }
    function drop(){ try { localStorage.removeItem(STORE); } catch (e) {} }
    function known(){
      var v = null;
      try { v = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); } catch (e) {}
      if (!v) return {};
      return { name: v.fullName || v.firstName || '', email: v.email || '' };
    }
    function valueOf(b, k){ return k === 'features' ? (b.features || []).join(', ') : (b[k] || ''); }
    function clipText(s, n){ s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

    /* ── progress bar above the input ── */
    function ensureBar(){
      if (barEl) return barEl;
      var footer = document.getElementById('chatFooter');
      if (!footer || !footer.parentNode) return null;
      barEl = document.createElement('div');
      barEl.id = 'briefBar';
      barEl.setAttribute('role', 'status');
      barEl.innerHTML =
        '<span class="bb-label">📝 Project brief</span>' +
        '<span class="bb-track" aria-hidden="true"><span class="bb-fill"></span></span>' +
        '<span class="bb-count"></span>' +
        '<button type="button" class="bb-close" aria-label="Pause the project brief" title="Pause — your brief stays saved">✕</button>';
      var typing = document.getElementById('chatUserTyping');
      footer.parentNode.insertBefore(barEl, (typing && typing.parentNode === footer.parentNode) ? typing : footer);
      barEl.querySelector('.bb-close').addEventListener('click', function(){ pause(false); });
      return barEl;
    }
    function updateBar(){
      if (!barEl) return;
      var done = REQUIRED.length - st.missing.length;
      barEl.querySelector('.bb-fill').style.transform = 'scaleX(' + (done / REQUIRED.length).toFixed(3) + ')';
      barEl.querySelector('.bb-count').textContent = st.ready ? 'Ready ✓' : done + '/' + REQUIRED.length;
      barEl.classList.toggle('bb-ready', !!st.ready);
    }
    function showBar(on){
      var b = ensureBar();
      if (!b) return;
      if (on) updateBar();
      b.classList.toggle('bb-on', !!on);
    }

    /* what to ask next: before the visitor has said anything, invite them
       to describe the project rather than asking for a single field */
    function nextAsk(){
      if (!st.turns) return "Tell me about it in your own words — what it's for, what it should do, your budget and when you need it.";
      return ASK[st.missing[0]] || '';
    }
    function placeholder(){
      if (st.ready) return 'Anything to change? Or tap Send ↑';
      if (!st.turns) return 'Describe your project…';
      if (st.missing[0] === 'name' && st.missing[1] === 'email') return 'Your name and email…';
      return HINT[st.missing[0]] || 'Describe your project…';
    }
    function applyInput(){
      if (!input) return;
      input.maxLength = active ? 600 : 300;
      if (botBusy) return; /* setBotBusy puts the right text back when it unlocks */
      if (window._helpFlowActive && window._helpFlowActive()) return;
      input.placeholder = active ? placeholder() : 'Ask anything about Sahnawaz…';
    }

    /* ── messages ── */
    function lock(on){ setBotBusy(on); setTypingStatus(on); }

    /* Reveal a plain-text reply a few words per frame (live-typing feel,
       ~0.6s whatever the length), then swap in the final HTML. */
    function reveal(div, plain, finalHtml, done){
      var parts = plain.split(/(\s+)/);
      if (REDUCED || parts.length < 12) { div.innerHTML = finalHtml; done(); return; }
      var span = document.createElement('span');
      span.className = 'brief-live';
      div.appendChild(span);
      var n = 0, per = Math.max(2, Math.ceil(parts.length / 36));
      (function tick(){
        n = Math.min(parts.length, n + per);
        span.textContent = parts.slice(0, n).join('');
        if (n < parts.length) { requestAnimationFrame(tick); if (n % (per * 6) < per) scrollMsgs(); }
        else { div.innerHTML = finalHtml; done(); }
      })();
    }

    /* A bot message in the brief's voice: no category badge, plain text,
       optional "Noted" tags and action chips. Locks input until shown. */
    function say(text, extraHtml, done, withDots){
      lock(true);
      var wrap = document.createElement('div');
      wrap.className = 'chat-msg-wrap bot';
      var div = document.createElement('div');
      div.className = 'chat-msg bot brief-reply';
      wrap.appendChild(div);
      var tsRow = document.createElement('div');
      tsRow.className = 'chat-ts-row';
      var ts = document.createElement('div');
      ts.className = 'chat-ts';
      var iso = new Date().toISOString();
      ts.textContent = formatTimestamp(iso);
      ts.dataset.iso = iso;
      tsRow.appendChild(ts);
      addSpeakBtn(tsRow, text, div);
      wrap.appendChild(tsRow);

      var linked = extractChatLinks(text);
      var finalHtml = inlineFormat(linked.text).replace(/\n/g, '<br>') + (extraHtml || '') + chipsHtml(linked.chips);

      function show(){
        div.innerHTML = '';
        playReceive();
        addToHistory('bot', text);
        if (window._saveChatMessage) window._saveChatMessage('bot', text);
        reveal(div, linked.text, finalHtml, function(){
          scrollMsgs();
          lock(false);
          setTimeout(function(){ addReactions(wrap); }, 300);
          resetIdleTimer();
          if (done) done();
        });
      }
      msgs.appendChild(wrap);
      if (withDots) {
        div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        scrollMsgs();
        setTimeout(show, 450);
      } else {
        show();
        scrollMsgs();
      }
      return wrap;
    }

    function thinking(){
      var w = document.createElement('div');
      w.className = 'chat-msg-wrap bot';
      var b = document.createElement('div');
      b.className = 'chat-msg bot brief-think';
      b.innerHTML = '<span class="bt-label">Reading your message</span>' +
        '<div class="typing-dots" style="display:inline-flex;"><span></span><span></span><span></span></div>';
      w.appendChild(b);
      msgs.appendChild(w);
      scrollMsgs();
      var labels = ['Picking out the details', 'Updating your brief'], i = 0;
      var label = b.querySelector('.bt-label');
      w._timer = setInterval(function(){ if (i < labels.length) label.textContent = labels[i++]; }, 1300);
      return w;
    }
    function unthink(w){
      if (!w) return;
      clearInterval(w._timer);
      if (w.parentNode) w.parentNode.removeChild(w);
    }

    /* "✓ Noted" tags for what this message added or changed */
    function notedHtml(prev, next){
      var tags = [];
      ORDER.forEach(function(k){
        var b = valueOf(next, k);
        if (b && b !== valueOf(prev, k)) tags.push(LABELS[k] + ' · ' + clipText(b, 30));
      });
      if (!tags.length) return '';
      return '<div class="brief-got"><span class="bg-k">✓ Noted</span>' +
        tags.slice(0, 5).map(function(t){ return '<span class="bg-t">' + escHtml(t) + '</span>'; }).join('') + '</div>';
    }

    /* ── review card ── */
    function cardHtml(){
      var b = st.brief;
      var est = st.estimate || { range: 'Custom quote', time: 'Depends on scope' };
      var rows = ORDER.map(function(k){
        var v = valueOf(b, k);
        return v ? '<div class="bc-row"><span class="bc-k">' + LABELS[k] + '</span><span class="bc-v">' + escHtml(v) + '</span></div>' : '';
      }).join('');
      var title = (b.projectType || 'Your project') + (b.business ? ' — ' + b.business : '');
      return '<div class="bc-head"><span class="bc-kicker">Project brief · ready to send</span>' +
          '<span class="bc-title">' + escHtml(title) + '</span></div>' +
        '<div class="bc-rows">' + rows + '</div>' +
        '<div class="bc-est"><div><span class="bc-est-k">Typical range</span><b>' + escHtml(est.range) + '</b>' +
          '<span class="bc-est-t"> · ' + escHtml(est.time) + '</span></div>' +
          '<small>Final quote from Sahnawaz after a short chat.</small></div>' +
        '<div class="bc-actions">' +
          '<button type="button" class="bc-send">✅ Send to Sahnawaz</button>' +
          '<button type="button" class="bc-edit">✏️ Change something</button>' +
        '</div>' +
        '<div class="bc-status" aria-live="polite"></div>' +
        '<div class="bc-note">🔒 Only Sahnawaz sees this · you get a copy by email</div>';
    }
    function renderCard(){
      staleCard();
      var wrap = document.createElement('div');
      wrap.className = 'chat-msg-wrap bot brief-card-wrap';
      var card = document.createElement('div');
      card.className = 'brief-card';
      card.innerHTML = cardHtml();
      wrap.appendChild(card);
      msgs.appendChild(wrap);
      card.querySelector('.bc-send').addEventListener('click', function(){ send(card); });
      card.querySelector('.bc-edit').addEventListener('click', function(){ edit(); });
      liveCard = card;
      scrollMsgs();
    }
    /* an older card can no longer be sent: its buttons go, a note says why */
    function staleCard(note){
      if (!liveCard) return;
      var a = liveCard.querySelector('.bc-actions');
      if (a && a.parentNode) a.parentNode.removeChild(a);
      liveCard.classList.add('bc-stale');
      var s = liveCard.querySelector('.bc-status');
      if (s) s.textContent = note || 'Updated — the latest version is below ↓';
      liveCard = null;
    }

    function langOf(){
      var txt = st.history.filter(function(h){ return h.role === 'user'; }).map(function(h){ return h.content; }).join(' ');
      if (/[ऀ-ॿ]/.test(txt)) return 'Hindi';
      if (/[ঀ-৿]/.test(txt)) return 'Bengali / Assamese';
      return navigator.language || 'en';
    }

    function post(path, body, ms){
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = ctl ? setTimeout(function(){ ctl.abort(); }, ms) : 0;
      return fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctl ? ctl.signal : undefined
      }).then(function(res){
        clearTimeout(timer);
        return res.json().catch(function(){ return null; }).then(function(j){ return { ok: res.ok, status: res.status, body: j }; });
      }, function(err){ clearTimeout(timer); throw err; });
    }

    /* ── actions ── */
    function activate(){
      active = true;
      closeAllPanels();
      if (quickReply) quickReply.style.display = 'none';
      followUpWrap && (followUpWrap.style.display = 'none');
      showBar(true);
      applyInput();
    }

    /* opts (all optional): type — a project type from TYPES, chosen by the
       button that started the brief; context — words for the intro
       ("clinic website"); from — which button, reported to Sahnawaz */
    function start(opts){
      opts = opts || {};
      if (sending) return true;
      /* wait for a reply that is still arriving, then start */
      if (botBusy || turnBusy) {
        var tries = 0;
        (function later(){
          if ((botBusy || turnBusy) && tries++ < 40) { setTimeout(later, 150); return; }
          start(opts);
        })();
        return true;
      }
      if (window._cancelHelpFlow) window._cancelHelpFlow();
      if (!getVisitorType()) setVisitorType('client');
      if (!st.from) st.from = opts.from || 'chat';   /* the first button counts */
      /* details another feature already knows (the website check hands
         over the site and what to fix); never overwrites the visitor's own */
      if (opts.prefill && typeof opts.prefill === 'object') {
        ['website', 'notes', 'business'].forEach(function(k){
          var v = opts.prefill[k];
          if (v && !st.brief[k]) st.brief[k] = String(v).slice(0, k === 'notes' ? 380 : 180);
        });
      }

      var type = TYPES[opts.type] ? opts.type : '';
      var prevType = st.brief.projectType || '';
      var typeNew = !!(type && type !== prevType);
      if (typeNew) {
        st.brief.projectType = type;
        st.estimate = { range: TYPES[type].range, time: TYPES[type].time };
        st.missing = missingOf(st.brief);
        st.ready = st.turns > 0 && !st.missing.length;
        if (st.turns > 0) save();
      }
      var typeLine = typeNew ? (prevType ? "I've switched your project to " + type + "." : "Got it — " + TYPES[type].say + ".") : '';

      if (active && typeNew) {
        updateBar(); applyInput();
        if (liveCard) staleCard();
        if (st.ready) say(typeLine + " Here's your updated brief 👇", '', renderCard, true);
        else say(typeLine + " " + nextAsk(), '', null, true);
        return true;
      }
      if (active) {
        if (st.ready && !liveCard) say("Your brief is ready — have a look and send it when you're happy.", '', renderCard, true);
        else say(st.ready ? "Your brief is ready just above ↑ — send it, or tell me what to change." : "We're on it 🙂 " + nextAsk(), '', null, true);
        return true;
      }

      activate();
      var k = known();
      if (k.name && !st.brief.name) st.brief.name = k.name;
      if (k.email && !st.brief.email) st.brief.email = k.email;
      st.missing = missingOf(st.brief);
      st.ready = st.ready && !st.missing.length;
      updateBar();
      applyInput();

      if (st.turns > 0) {
        var done = REQUIRED.length - st.missing.length;
        if (st.ready && liveCard && !typeNew) say("Welcome back 👋 Your brief is ready just above ↑ — send it, or tell me what to change.", '', null, true);
        else if (st.ready) say("Welcome back 👋 " + (typeLine ? typeLine + " " : "") + "Your project brief is ready — have a look and send it when you're happy.", '', renderCard, true);
        else say("Welcome back to your project brief 👋 " + (typeLine ? typeLine + " " : "") + done + " of " + REQUIRED.length + " details so far. " + ASK[st.missing[0]], '', null, true);
      } else {
        var first = k.name ? String(k.name).split(' ')[0] : '';
        var what = String(opts.context || (type ? TYPES[type].say : '')).slice(0, 40);
        var intro = "Let's plan your " + (what || "project") + (first ? ", " + first : "") + " 📝\n\n" +
          (what ? "Tell me about it in your own words — what it's for, what it should do, your budget and when you need it. "
                : "Tell me about it in your own words — what you'd like built, who it's for, your budget and when you need it. ") +
          "I'll pick out the details, ask only for what's missing, and prepare a brief for Sahnawaz with a typical price range." +
          (k.name && k.email ? "\n\nI already have your name and email from your Google sign-in ✓" : "") +
          "\n\nHere for something else? Tap ✕ on the bar below to just chat.";
        /* the AI reads this too, so it knows what the visitor tapped */
        st.history = [{ role: 'assistant', content: intro }];
        say(intro, '', null, true);
      }
      return true;
    }

    function step(val){
      if (turnBusy || sending) return;
      turnBusy = true;
      addMsg('user', val);
      if (window._saveChatMessage) window._saveChatMessage('user', val);
      setChipsOpen(false);
      lock(true);
      var think = thinking();
      var prev = JSON.parse(JSON.stringify(st.brief));
      var body = { source: 'brief', message: val, brief: st.brief, known: known(), briefHistory: st.history.slice(-6) };

      var attempt = function(retries){
        return post('chat', body, 25000).then(function(r){
          if (r.status === 429 && retries > 0) {
            return new Promise(function(res){ setTimeout(res, 2500); }).then(function(){ return attempt(retries - 1); });
          }
          return r;
        });
      };

      attempt(1).then(function(r){
        var d = r.body;
        if (!r.ok || !d || d.error || !d.brief || !d.reply) { fail(think, d && d.reply); return; }
        st.brief = d.brief;
        st.missing = Array.isArray(d.missing) ? d.missing : missingOf(d.brief);
        st.ready = !!d.ready && !st.missing.length;
        st.estimate = d.estimate || null;
        st.turns++;
        st.history.push({ role: 'user', content: val }, { role: 'assistant', content: d.reply });
        st.history = st.history.slice(-8);
        save();
        unthink(think);
        updateBar();
        var changed = JSON.stringify(prev) !== JSON.stringify(st.brief);
        if (liveCard && changed) staleCard(st.ready ? null : 'Being updated…');
        say(d.reply, notedHtml(prev, st.brief), function(){
          turnBusy = false;
          if (st.ready && !liveCard) { renderCard(); return; }
          if (!st.ready && st.turns >= 12 && !st.nudged) {
            st.nudged = true; save();
            say("Taking a while? You can also just message Sahnawaz directly — whatever's easier 🙂\n[[go:send-message|📧 Message Sahnawaz]]");
          }
        });
      }).catch(function(){ fail(think); });
    }

    function fail(think, msg){
      unthink(think);
      say(msg || (navigator.onLine === false
        ? "You seem to be offline — your brief is saved. Send that again when you're back online."
        : "I couldn't reach the assistant just now — your brief is saved. Could you send that again?"),
        '', function(){ turnBusy = false; });
    }

    function edit(){
      if (sending || turnBusy) return;
      if (!active) activate();
      say("Sure — what would you like to change? Just tell me, e.g. “make the budget ₹20,000” or “add online booking”.", '', function(){
        try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
      }, true);
    }

    function send(card){
      if (sending || turnBusy || card !== liveCard) return;
      sending = true;
      var btn = card.querySelector('.bc-send'), ed = card.querySelector('.bc-edit'), status = card.querySelector('.bc-status');
      var label = btn.innerHTML;
      btn.disabled = true; ed.disabled = true;
      btn.innerHTML = '<span class="bc-spin" aria-hidden="true"></span>Sending…';
      status.textContent = 'Delivering your brief to Sahnawaz…';
      var brief = st.brief;

      function retryable(msg){
        sending = false;
        btn.disabled = false; ed.disabled = false;
        btn.innerHTML = label;
        status.textContent = msg;
      }
      post('contact', { mode: 'brief', brief: brief, lang: langOf(), from: st.from || 'chat' }, 30000).then(function(r){
        var d = r.body || {};
        if (r.ok && d.success) { sent(card, d.duplicate ? null : d.refId, !!d.duplicate); return; }
        if (r.status === 400 && Array.isArray(d.missing) && d.missing.length) {
          sending = false;
          st.missing = d.missing; st.ready = false; save();
          staleCard('One detail is missing');
          if (!active) activate();
          updateBar(); applyInput();
          say("Almost — one more thing first. " + (ASK[d.missing[0]] || ''));
          return;
        }
        retryable(r.status === 429
          ? "You've sent a few briefs in the last hour — please try again a little later."
          : "That didn't go through — please tap Send again in a moment.");
      }).catch(function(){
        retryable(navigator.onLine === false
          ? "You're offline — tap Send again when you're back online."
          : "Couldn't reach the server — please tap Send again.");
      });
    }

    function sent(card, ref, dup){
      sending = false;
      var a = card.querySelector('.bc-actions');
      if (a && a.parentNode) a.parentNode.removeChild(a);
      card.classList.add('bc-sent');
      var status = card.querySelector('.bc-status');
      status.innerHTML = '✓ Sent to Sahnawaz' + (ref ? ' · Ref <b>' + escHtml(ref) + '</b>' : '');
      var kicker = card.querySelector('.bc-kicker');
      if (kicker) kicker.textContent = 'Project brief · sent';
      liveCard = null;

      var email = st.brief.email || 'your inbox';
      var first = String(st.brief.name || '').split(' ')[0];
      sentThisVisit = { type: st.brief.projectType || '', ref: ref || '' };
      st = fresh();
      drop();
      active = false;
      showBar(false);
      applyInput();
      say(dup
        ? "This brief already reached Sahnawaz earlier, so there's no need to send it again 😊 He'll reply to " + email + "."
        : "Done" + (first ? ", " + first : "") + "! ✅ Your brief is with Sahnawaz" + (ref ? " (ref " + ref + ")" : "") +
          ". A copy is on its way to " + email + " — he usually replies within 24 hours.\n[[go:callback|📅 Also book a call]]");
    }

    /* silent: no message (used when a Help flow starts or the chat is cleared) */
    function pause(silent){
      if (!active) return;
      active = false;
      showBar(false);
      applyInput();
      if (silent || turnBusy || sending || botBusy) return;
      say("Paused ⏸ Your brief is saved on this device — ask me anything, and tap “📝 Continue my brief” whenever you're ready.", '', function(){
        renderQuickReplies();
        scrollMsgs();
      });
    }

    window._startBrief = start;
    window._briefPause = function(){ pause(true); };

    return {
      start: start,
      step: step,
      isActive: function(){ return active; },
      hasDraft: function(){ return !active && st.turns > 0; },
      /* what the assistant may know about the brief (no contact details) */
      summary: function(){
        var b = st.brief || {}, f = {};
        ['projectType', 'business', 'goal', 'budget', 'timeline', 'website'].forEach(function(k){ if (b[k]) f[k] = String(b[k]).slice(0, 140); });
        if (Array.isArray(b.features) && b.features.length) f.features = b.features.slice(0, 8).join(', ').slice(0, 200);
        return { active: active, draft: st.turns > 0, ready: !!st.ready, missing: (st.missing || []).slice(0, 6),
                 fields: f, estimate: st.estimate && st.estimate.range ? st.estimate.range : '', sent: sentThisVisit };
      },
      placeholder: placeholder,
      onClear: function(){ liveCard = null; pause(true); }
    };
  })();
  /* ========== End AI Project Brief ========== */

  /* Open the chat straight into the planner — used by the hero pill, the
     desktop header and menu, the pricing cards, "Ready to Work With Me?",
     the Why-website pop-up and the ?plan link. On the very first open the
     planner replaces the greeting and the "What brings you here?"
     question (initChat → startPendingBrief), so nothing stacks up. */
  var pendingBrief = null, pendingReport = null;
  window.openBrief = function(opts){
    opts = opts || {};
    if (!inited) { pendingBrief = opts; window.openChat(); return true; }
    if (!isOpen) window.openChat();
    briefApi.start(opts);
    return true;
  };
  function startPendingBrief(){
    if (!pendingBrief && !pendingReport) return false;
    var o = pendingBrief, rep = pendingReport;
    pendingBrief = null; pendingReport = null;
    if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited', '1'); } catch (e) {} }
    buildChips();
    setChipsOpen(false);
    if (rep) checkChat.present(rep, true);
    else briefApi.start(o);
    return true;
  }

  /* ========== Free website check, inside the chat ==========
     Help → "🩺 Free website check", the chip [[go:website-check|…]], or a
     message like "check my website abc.in". Asks for the address and the
     kind of business, runs the check (js/website-check.js → api/vitals.js)
     while the visitor can keep chatting, then shows a compact report card.
     A summary goes into the chat's memory, so "why is it slow?" is answered
     with the report in mind. */
  var checkChat = (function(){
    var step = null, url = '', reports = {}, last = null;
    var TYPE_BTNS = [['clinic', '🏥 Clinic'], ['restaurant', '🍽️ Restaurant'], ['shop', '🛍️ Shop'], ['school', '🏫 School'], ['other', '💼 Other']];
    function api(){ return window.shzCheck; }
    function isActive(){ return step !== null; }
    function placeholder(){ return step === 'url' ? 'yourbusiness.com' : 'Clinic, restaurant, shop, school…'; }
    function restInput(){ if (!botBusy) setBotBusy(false); }
    function reset(){ if (step === null) return; step = null; url = ''; if (quickReply) quickReply.style.display = 'none'; restInput(); }
    function whenIdle(fn){ var n = 0; (function w(){ if (botBusy && n++ < 40) { setTimeout(w, 120); return; } fn(); })(); }
    function typeFromText(t){
      t = String(t || '').toLowerCase();
      if (/clinic|doctor|hospital|dental|dentist|health|medical|pharma|diagnostic|physio|nursing/.test(t)) return 'clinic';
      if (/restaurant|cafe|café|food|dhaba|bakery|sweet|kitchen|catering|biryani|pizza|eatery/.test(t)) return 'restaurant';
      if (/shop|store|boutique|retail|e-?commerce|mart|showroom|sell|saree|jewell?ery|fashion|electronics/.test(t)) return 'shop';
      if (/school|college|coaching|institute|academy|tuition|education|classes|university/.test(t)) return 'school';
      if (/other|business|agency|company|office|service|skip|none|not sure/.test(t)) return 'other';
      return null;
    }
    function langOf(){
      var txt = conversationHistory.slice(-6).filter(function(m){ return m.role === 'user'; }).map(function(m){ return m.text; }).join(' ');
      if (/[\u0900-\u097F]/.test(txt)) return 'hi';
      if (/[\u0980-\u09FF]/.test(txt)) return 'bn';
      return 'en';
    }
    function start(opts){
      opts = opts || {};
      if (botBusy) { whenIdle(function(){ start(opts); }); return true; }
      if (window._cancelHelpFlow) window._cancelHelpFlow();
      if (window._briefPause) window._briefPause();
      closeAllPanels();
      if (quickReply) quickReply.style.display = 'none';
      followUpWrap && (followUpWrap.style.display = 'none');
      if (!getVisitorType()) setVisitorType('client');
      if (!api()) { addBotTyping("The website check is still loading — give it a second and try again. 🙂"); return true; }
      if (opts.url && api().looksLikeSite(opts.url)) {
        url = opts.url;
        if (opts.type) { step = null; run(url, opts.type); return true; }
        askType();
        return true;
      }
      step = 'url';
      restInput();
      addBotTyping("Let's check your website 🩺 What's the address? (like yourbusiness.com)\n\nI'll test it on a phone and check what customers see — it takes about 30 seconds.", null);
      return true;
    }
    function askType(){
      step = 'type';
      restInput();
      addBotTyping("Got it — " + api().cleanHost(url) + ". What kind of business is it? I'll check the things that matter for it.", null);
      whenIdle(function(){
        if (step !== 'type' || !quickReply) return;
        quickReply.innerHTML = '';
        var cap = document.createElement('div');
        cap.className = 'chat-qr-caption';
        cap.textContent = 'Type of business';
        quickReply.appendChild(cap);
        TYPE_BTNS.forEach(function(b){ quickReply.appendChild(qrButton(b[1], function(){ pick(b[0], b[1]); })); });
        quickReply.style.display = 'flex';
        scrollMsgs();
      });
    }
    function pick(type, label){
      if (step !== 'type') return;
      if (label) { playSend && playSend(); addMsg('user', label); if (window._saveChatMessage) window._saveChatMessage('user', label); }
      if (quickReply) quickReply.style.display = 'none';
      step = null;
      run(url, type);
    }
    function stepInput(val){
      addMsg('user', val);
      if (window._saveChatMessage) window._saveChatMessage('user', val);
      if (/^(cancel|stop|no|nevermind|never mind|exit|quit)\b/i.test(val.trim())) {
        reset();
        addBotTyping("No problem — ask me anything 😊", val);
        return;
      }
      if (step === 'url') {
        if (!api().looksLikeSite(val)) { addBotTyping("Hmm, that doesn't look like a website address 🤔 Try something like yourbusiness.com — or type cancel to stop.", val); return; }
        url = val.trim();
        var t = typeFromText(val);
        if (t && t !== 'other') { step = null; run(url, t); } else askType();
        return;
      }
      if (step === 'type') pick(typeFromText(val) || 'other');
    }
    function run(u, type, opts){
      opts = opts || {};
      restInput();
      var host = api().cleanHost(u), t0 = Date.now();
      var wrap = document.createElement('div');
      wrap.className = 'chat-msg-wrap bot';
      var b = document.createElement('div');
      b.className = 'chat-msg bot wc-chat-prog';
      b.innerHTML = '<span class="wc-spin" aria-hidden="true"></span> ' + (opts.fresh ? 'Fresh check of' : 'Checking') + ' <b>' + escHtml(host) + '</b> <span class="wc-elapsed">0 s</span>' +
        '<ol class="wc-steps"><li class="is-active">Opening your website</li><li>Reading what customers see</li><li>Testing it on a phone <em>(15–40 s — keep chatting if you like)</em></li></ol>';
      wrap.appendChild(b);
      msgs.appendChild(wrap);
      scrollMsgs();
      var timer = setInterval(function(){ var e = b.querySelector('.wc-elapsed'); if (e) e.textContent = Math.round((Date.now() - t0) / 1000) + ' s'; }, 1000);
      var stepsTo = function(n){ Array.prototype.forEach.call(b.querySelectorAll('.wc-steps li'), function(li, i){ li.classList.toggle('is-done', i < n); li.classList.toggle('is-active', i === n); }); };
      api().run(u, type, opts.lang || langOf(), {
        onBasics: function(){ stepsTo(2); },
        onFull: function(r){ clearInterval(timer); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); present(r, false, opts.prev); },
        onError: function(m){ clearInterval(timer); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); addBotTyping('⚠️ ' + m, null); }
      }, { fresh: !!opts.fresh });
    }
    /* "do a fresh check", "check it again": the last site, new results */
    function recheck(){
      if (!last) return start();
      if (botBusy) { whenIdle(recheck); return true; }
      if (window._cancelHelpFlow) window._cancelHelpFlow();
      if (window._briefPause) window._briefPause();
      if (quickReply) quickReply.style.display = 'none';
      step = null;
      var prev = last;
      run(prev.url || prev.host, prev.type, { fresh: true, prev: prev, lang: prev.lang });
      return true;
    }
    /* what changed since the earlier check of the same site */
    function changes(prev, r){
      if (!prev || prev.host !== r.host) return '';
      if (prev.checkedAt && prev.checkedAt === r.checkedAt) return "That's still the latest result for " + r.host + " — it was checked moments ago, so nothing new to show yet.";
      var P = prev.scores || {}, S = r.scores || {}, out = [];
      [['overall', 'Overall'], ['speed', 'Speed on a phone'], ['google', 'Google basics'], ['easy', 'Easy to use'], ['contact', 'Contact & trust']].forEach(function(k){
        var a = P[k[0]], b2 = S[k[0]];
        if (a == null || b2 == null || a === b2) return;
        out.push(k[1] + ' ' + a + ' → ' + b2 + (b2 > a ? ' ⬆️' : ' ⬇️'));
      });
      if (!out.length) return 'Fresh results are in ✅ The scores are the same as the earlier check — nothing has changed on the site since then.';
      return 'Fresh results are in ✅ Compared with the earlier check:\n- ' + out.join('\n- ') +
        (P.speed != null && S.speed != null && Math.abs(S.speed - P.speed) <= 5 ? '\n\nSmall speed changes are normal: Google\'s phone test varies a little from run to run.' : '');
    }
    /* the compact card + a summary in the chat's memory */
    function present(r, intro, prev){
      reports[r.id] = r;
      last = r;
      if (intro) addBotTyping("Here's the website check for " + r.host + " 🩺 Ask me anything about it — like “why is it slow?” — or tap 📝 to plan the fix with Sahnawaz.", null);
      var show = function(){
        var wrap = document.createElement('div');
        wrap.className = 'chat-msg-wrap bot wc-mini-wrap';
        wrap.innerHTML = api().miniHtml(r);
        msgs.appendChild(wrap);
        playReceive();
        addToHistory('bot', api().summaryText(r));
        if (window._saveChatMessage) window._saveChatMessage('bot', '🩺 Website check for ' + r.host + ': ' + (r.scores.overall == null ? '?' : r.scores.overall) + '/100 (' + (r.verdict && r.verdict.label) + '). ' + ((r.text && r.text.headline) || ''));
        scrollMsgs();
        var diff = changes(prev, r);
        if (diff) addBotTyping(diff, null);
        else if (!intro) addBotTyping("Ask me anything about this report — like “why is it slow?” or “what should I fix first?” 🙂", null);
      };
      if (intro) whenIdle(show); else show();
    }
    msgs.addEventListener('click', function(e){
      var btn = e.target.closest && e.target.closest('[data-wc-mini]');
      if (!btn) return;
      var card = btn.closest('.wc-mini');
      var r = card && reports[card.getAttribute('data-id')];
      if (!r) return;
      if (btn.getAttribute('data-wc-mini') === 'fix') { api().fix(r); return; }
      closeChat();
      setTimeout(function(){ api().showReport(r, true); }, 260);
    });
    /* "check my website abc.in", "audit abc.com", "is my site fast? abc.in" */
    function detect(val){
      var t = String(val || '');
      if (!/\b(check|audit|test|scan|analy[sz]e|review|rate|score|inspect|evaluate)\b|how (good|fast) is|is my (web)?site/i.test(t)) return null;
      if (!/\b(site|website|web ?page|page|seo|speed)\b/i.test(t) && !/is my (web)?site/i.test(t)) return null;
      var m = t.replace(/\S+@\S+/g, ' ').match(/((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:\/[^\s,;!?]*)?)/i);
      return m ? { url: m[1], type: typeFromText(t.replace(m[1], ' ')) } : null;
    }
    window._startWebsiteCheck = function(){ return start(); };
    window._checkChatReset = reset;
    /* from the section's "Ask the AI about this report" */
    window._chatAboutReport = function(r){
      if (!r) return;
      if (!inited) { pendingReport = r; window.openChat(); return; }
      if (!isOpen) window.openChat();
      present(r, true);
    };
    window._recheckWebsite = function(){ return recheck(); };
    return { start: start, isActive: isActive, placeholder: placeholder, reset: reset, stepInput: stepInput, detect: detect, present: present,
             recheck: recheck, last: function(){ return last; },
             openLast: function(){ if (!last) return false; closeChat(); setTimeout(function(){ api().showReport(last, true); }, 260); return true; },
             fixLast: function(){ if (!last) return false; api().fix(last); return true; },
             runTyped: function(d){ if (d.type && d.type !== 'other') { url = d.url; step = null; run(d.url, d.type); } else start({ url: d.url }); } };
  })();

  /* Buttons around the page that start the planner:
       data-brief="<project type, or empty>"
       data-brief-context="clinic website"   (optional, for the intro)
       data-brief-from="card"                (which button, for Sahnawaz) */
  Array.prototype.forEach.call(document.querySelectorAll('[data-brief]'), function(el){
    el.addEventListener('click', function(e){
      var card = el.closest('.wio-card');
      /* on a pricing card the button sits on the back face: while the card
         shows its front, the tap is for flipping it */
      if (card && !card.classList.contains('wio-flipped')) return;
      e.preventDefault();
      if (card) e.stopPropagation();   /* keep the card showing its price */
      var opts = {
        type: el.getAttribute('data-brief') || '',
        context: el.getAttribute('data-brief-context') || '',
        from: el.getAttribute('data-brief-from') || ''
      };
      /* from the pop-up: let it fade out first */
      setTimeout(function(){ window.openBrief(opts); }, el.closest('#wnwOverlay') ? 220 : 0);
    });
  });

  /* Shareable link: sahnawaz-portfolio.vercel.app/?plan opens the site
     straight into the planner (?plan=store | portfolio | business | ads |
     landing | app | redesign | chatbot | design picks the type too).
     The parameter is removed so a reload or a re-share doesn't repeat it. */
  (function planLink(){
    var p;
    try { p = new URLSearchParams(location.search); } catch (e) { return; }
    if (!p.has('plan')) return;
    var v = String(p.get('plan') || '').toLowerCase();
    var MAP = { website: 'Business website', business: 'Business website', landing: 'Landing page',
                portfolio: 'Portfolio website', store: 'E-commerce store', shop: 'E-commerce store',
                ecommerce: 'E-commerce store', 'e-commerce': 'E-commerce store', ads: 'Web ads & promotion',
                app: 'Web app / custom build', redesign: 'Website redesign', chatbot: 'AI chatbot / integration',
                design: 'UI/UX design' };
    p.delete('plan');
    var q = p.toString();
    try { history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) {}
    var fired = false;
    var go = function(){
      if (fired) return;
      fired = true;
      setTimeout(function(){ window.openBrief({ type: MAP[v] || '', from: 'link' }); }, 500);
    };
    if (document.readyState === 'complete') go();
    else { window.addEventListener('load', go, { once: true }); setTimeout(go, 2500); }
  })();

  /* Suggestions — all phrased to the assistant, ABOUT Sahnawaz, so the
     voice matches the header ("Sahnawaz's Assistant"). The AI answers them. */
  var CHIPS = [
    /* ── 🎯 Top CTA questions — shown first ── */
    "What services does Sahnawaz offer?",
    "What's his pricing?",
    "How can I hire Sahnawaz?",
    "Is he available for work right now?",

    /* ── 🚀 Live products & recent work ── */
    "What apps has Sahnawaz built? 🚀",
    "What is StudyLens AI? 📚",
    "Tell me about Yojana Sahay 🇮🇳",
    "What has Sahnawaz shipped recently? 🚀",
    "Is he actively coding right now?",
    "What's his current GitHub streak? 🔥",

    /* ── 🤖 This site & chatbot ── */
    "How was this AI chatbot built?",
    "Is Sahnawaz recognized by AI?",
    "How was this website built?",
    "What's special about this portfolio?",
    "What is the Hacker Mode? 🖥️",
    "Is this portfolio mobile friendly?",
    "Can Sahnawaz build me a website like this?",

    /* ── 👤 About Sahnawaz ── */
    "Who is Sahnawaz?",
    "How old is he?",
    "Where is he from?",
    "What's his educational background?",
    "What's his proudest moment?",
    "What's his dream?",
    "When does he do his best work?",
    "What does his work mean to him?",
    "What languages does he speak?",

    /* ── 💼 Work & services ── */
    "Has he worked with big brands?",
    "What makes him different?",
    "What's his tech stack?",
    "How long does a project take?",
    "Does he offer post-delivery support?",
    "Can I trust him?"
  ];

  function buildChips(){
    chips.innerHTML = '';
    CHIPS.forEach(function(item, idx){
      var btn = document.createElement('button');
      btn.className = 'chat-chip';
      /* First 3 get CTA-style coloring */
      if (idx === 0) btn.style.cssText = 'background:rgba(0,255,120,0.12);border-color:rgba(0,255,120,0.4);color:#00ff88;font-weight:700;';
      if (idx === 1) btn.style.cssText = 'background:rgba(0,180,255,0.12);border-color:rgba(0,180,255,0.4);color:#00ccff;font-weight:700;';
      if (idx === 2) btn.style.cssText = 'background:rgba(255,160,0,0.12);border-color:rgba(255,160,0,0.4);color:#ffaa00;font-weight:700;';
      btn.textContent = item;
      btn.addEventListener('click', function(){
        btn.classList.add('used');
        handleQ(item);
        setChipsOpen(false);
      });
      chips.appendChild(btn);
    });
    /* re-check scroll hint after chips are built */
    setTimeout(updateChipsScrollHint, 20);
  }

  /* ========== Handle Q ========== */
  function handleQ(question){
    followUpWrap && (followUpWrap.style.display = 'none');
    if (quickReply) quickReply.style.display = 'none';
    input.value = question;
    _briefBypassOnce = true; /* a tapped question is for the assistant, not the brief */
    sendMessage();
  }

  /* ========== Web Audio Sound Engine (no files needed) ========== */
  var audioCtx = null;
  var soundOn = true; // default ON

  function getAudioCtx(){
    if (!audioCtx){
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    return audioCtx;
  }

  /* Soft click/pop for user send */
  function playSend(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  /* ── Premium open sound: warm rising two-note chime (C5 → E5 → G5) ── */
  function playOpen(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var now = ctx.currentTime;
    var notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major chord sweep
    notes.forEach(function(freq, i){
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = now + i * 0.10; // stagger each note by 100ms
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /* ── Premium close sound: soft falling two-note swoosh (G5 → E5 → C5) ── */
  function playClose(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var now = ctx.currentTime;
    var notes = [783.99, 659.25, 523.25]; // G5 → E5 → C5 — descending
    notes.forEach(function(freq, i){
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = now + i * 0.085;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /* Gentle notification 'ding' for bot reply */
  function playReceive(){
    if (!soundOn) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523, ctx.currentTime);          // C5
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.07);   // E5
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.30);
  }



  /* =====================================================
     💎 PREMIUM RICH REPLY FORMATTER
     ===================================================== */
  /* ── Deep-link chips ──────────────────────────────────────────────────
     The assistant can end a reply with [[go:studylens|See the case study]].
     Rendered as a chip that uses the page's own functions where they exist,
     so the visitor lands on the right thing without a reload; if a function
     is missing it falls back to the deep link, which url-state.js handles. */
  var CHAT_LINKS = {
    yojanasahay: { url: '/?case=yojanasahay', run: function () { return callIf('openCaseStudy', 'yojanasahay'); } },
    studylens:   { url: '/?case=studylens',   run: function () { return callIf('openCaseStudy', 'studylens'); } },
    portfolio:   { url: '/?case=portfolio',   run: function () { return callIf('openCaseStudy', 'portfolio'); } },
    projects:    { url: '/#my-projects',      run: function () { return scrollTo_('#my-projects'); } },
    experience:  { url: '/#projects',         run: function () { return scrollTo_('#projects'); } },
    stack:       { url: '/#tech-stack',       run: function () { return scrollTo_('section.ts-section'); } },
    services:    { url: '/#what-i-offer',     run: function () { return scrollTo_('#what-i-offer'); } },
    telemetry:   { url: '/#recent-activity',  run: function () { return scrollTo_('#recent-activity'); } },
    contact:     { url: '/#contact',          run: function () { return scrollTo_('#contact'); } },
    resume:      { url: '/#contact',          run: function () { return callIf('openResumeEmailModal'); } },
    performance: { url: '/?report=performance', run: function () { return callIf('openWebVitals'); } },
    /* In-chat actions: start the Help menu flows right here, chat stays open */
    'send-message': { url: '/#contact', inChat: true, run: function () { return callIf('_startHelpFlow', 'quickmail'); } },
    'send-resume':  { url: '/#contact', inChat: true, run: function () { return callIf('_startHelpFlow', 'resume'); } },
    'callback':     { url: '/#contact', inChat: true, run: function () { return callIf('_startHelpFlow', 'callback'); } },
    'brief':        { url: '/#contact', inChat: true, run: function () { return callIf('_startBrief'); } },
    'website-check': { url: '/#website-check', inChat: true, run: function () { return callIf('_startWebsiteCheck'); } },
    /* the website check shown in this chat */
    'recheck': { url: '/#website-check', inChat: true, run: function () { return callIf('_recheckWebsite'); } },
    'report':  { url: '/#website-check', inChat: true, run: function () { return checkChat.openLast(); } },
    'fix':     { url: '/?plan=redesign',  inChat: true, run: function () { return checkChat.fixLast(); } }
  };

  function callIf(name, arg) {
    if (typeof window[name] !== 'function') return false;
    try { window[name](arg); return true; } catch (e) { return false; }
  }
  /* Sections below the target are still rendering while the page scrolls,
     which pushes the target down and leaves the jump short. Aim, then
     correct twice once things settle. */
  function scrollTo_(sel) {
    var el = document.querySelector(sel);
    if (!el) return false;
    /* the same precise landing and arrival scan as the hero pills
       (portfolio-06.js); the old aim below left chips ~110px short on
       phones, where the header scrolls away */
    if (typeof window.shzLandOn === 'function') {
      window.shzLandOn(el);
      if (typeof window.shzPillArrive === 'function') window.shzPillArrive(sel);
      return true;
    }
    var offset = function () {
      var h = document.querySelector('header');
      return h && /fixed|sticky/.test(getComputedStyle(h).position) ? h.getBoundingClientRect().height : 0;
    };
    var aim = function () {
      var top = el.getBoundingClientRect().top + pageYOffset - offset() - 8;
      try { scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } catch (e) { scrollTo(0, Math.max(0, top)); }
    };
    aim();
    [700, 1400].forEach(function (t) {
      setTimeout(function () {
        if (Math.abs(el.getBoundingClientRect().top - offset() - 8) > 28) aim();
      }, t);
    });
    return true;
  }

  /* turn the markers into chips; returns { text, chips } */
  function extractChatLinks(raw) {
    var chips = [];
    var text = String(raw).replace(/\[\[go:([a-z-]+)\|([^\]]{1,60})\]\]/gi, function (_, key, label) {
      var k = String(key).toLowerCase();
      if (CHAT_LINKS[k] && chips.length < 2) chips.push({ key: k, label: label.trim() });
      return '';
    });
    return { text: text.replace(/\n{3,}/g, '\n\n').trim(), chips: chips };
  }

  function chipsHtml(chips) {
    if (!chips.length) return '';
    return '<div class="bot-links">' + chips.map(function (c) {
      return '<button type="button" class="bot-link" data-bot-go="' + c.key + '">' +
        '<span>' + c.label.replace(/</g, '&lt;') + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' +
        '</button>';
    }).join('') + '</div>';
  }

  /* one delegated listener for every chip the chat ever renders */
  if (!window.__botLinksWired) {
    window.__botLinksWired = true;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-bot-go]');
      if (!btn) return;
      var entry = CHAT_LINKS[btn.getAttribute('data-bot-go')];
      if (!entry) return;
      if (entry.inChat) {
        /* keep the chat open — the flow continues in this conversation */
        if (!entry.run()) location.href = entry.url;
        return;
      }
      /* close the chat first so it doesn't cover what we scroll to; the
         pill stays (closeChat brings it back). A short beat lets the close
         animation play before the page scrolls, so it feels smooth. */
      var closer = window.closeChat || window.closeChatWidget;
      if (typeof closer === 'function') { try { closer(); } catch (err) {} }
      setTimeout(function () { if (!entry.run()) location.href = entry.url; }, 260);
    });
  }

  function formatBotReply(raw) {
    var catKey = 'general';
    var catLabels = {
      pricing:'💰 Pricing', skills:'🛠️ Skills', contact:'📬 Contact',
      hiring:'🤝 Hiring', about:'👤 About Sahnawaz', general:'💬 Chat'
    };
    /* Accept [CAT:x] OR [CATEGORY:x] OR KAT:x OR CAT:x — AI uses all forms */
    var catMatch = raw.match(/^\[(?:CAT|CATEGORY|KAT):(\w+)\]\s*/i)
                || raw.match(/^(?:CAT|KAT):(\w+)\s*\n?/i);
    if (catMatch) { catKey = catMatch[1].toLowerCase(); raw = raw.slice(catMatch[0].length); }
    /* Strip ALL remaining CAT tag variants anywhere in text — including bold-wrapped like **CAT:about** */
    raw = raw.replace(/\*{0,2}\[?(?:CAT|KAT|CATEGORY):[\w]+\]?\*{0,2}[\s\n]*/gi, '').trim();
    /* Strip stray lone # / ## / ### lines the AI sometimes outputs as an opener (e.g. "# \n") */
    raw = raw.replace(/^#{1,3}\s*$/gm, '').trim();
    /* Normalise synonym keys AI sometimes invents */
    var catSynonyms = {services:'skills',service:'skills',tech:'skills',experience:'about',work:'about',hire:'hiring',recruitment:'hiring',general_info:'general'};
    if (catSynonyms[catKey]) catKey = catSynonyms[catKey];

    /* pull out any deep-link markers before the text is formatted */
    var linked = extractChatLinks(raw);
    raw = linked.text;
    var chips = chipsHtml(linked.chips);

    var hasStructure = /#{1,3}|---|!!|>>|^\s*[-•]\s|\*\*/m.test(raw);
    var isShort = raw.trim().length < 160;
    if (!hasStructure && isShort) {
      return { html: inlineFormat(raw) + chips, rich: !!chips, cat: catKey };
    }

    var lines = raw.split('\n');
    var html = '';
    var inList = false;
    var badgeLabel = catLabels[catKey] || catLabels['general'];
    html += '<span class="bot-cat-badge cat-' + catKey + '">' + badgeLabel + '</span>';

    var rowDelay = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      /* Match: #Label OR ##Label## OR ## Label## OR ###Label (all AI header variants incl. H1) */
      var secMatch = line.match(/^#{1,3}\s*(.+?)(?:#{1,3})?\s*$/);
      /* Also treat standalone **bold** lines as section headers */
      if (!secMatch) {
        var boldHeadMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
        if (boldHeadMatch) secMatch = boldHeadMatch;
      }
      if (secMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="bot-section-header">' + inlineFormat(secMatch[1].trim()) + '</div>';
        continue;
      }
      if (/^---\s*$/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<hr class="bot-divider">';
        continue;
      }
      var hlMatch = line.match(/^!!(.+?)!!\s*$/);
      if (hlMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="bot-highlight">' + inlineFormat(hlMatch[1]) + '</div>';
        continue;
      }
      var cmpMatch = line.match(/^>>(.+?)\|(.+?)<<\s*$/);
      if (cmpMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        rowDelay += 0.05;
        html += '<div class="bot-compare-row" style="animation-delay:' + rowDelay.toFixed(2) + 's">'
              + '<span class="bot-compare-label">' + escHtml(cmpMatch[1].trim()) + '</span>'
              + '<span class="bot-compare-value">' + escHtml(cmpMatch[2].trim()) + '</span>'
              + '</div>';
        continue;
      }
      /* Numbered list: 1. item */
      var numMatch = line.match(/^\s*\d+.\s+(.+)$/);
      if (numMatch) {
        if (!inList) { html += '<ul class="bot-list">'; inList = true; }
        html += '<li><span class="bot-list-dot"></span><span>' + inlineFormat(numMatch[1]) + '</span></li>';
        continue;
      }
      var bulletMatch = line.match(/^\s*[-•]\s+(.+)$/);
      if (bulletMatch) {
        if (!inList) { html += '<ul class="bot-list">'; inList = true; }
        html += '<li><span class="bot-list-dot"></span><span>' + inlineFormat(bulletMatch[1]) + '</span></li>';
        continue;
      }
      var isCtaLine = /shzthedigitalalchemist@gmail|@sahnawaz\.ui|reach sahnawaz|contact sahnawaz/i.test(line) && line.trim().length < 140;
      if (isCtaLine && line.trim()) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="bot-cta-line">' + inlineFormat(line) + '</div>';
        continue;
      }
      if (line.trim()) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<p class="bot-para">' + inlineFormat(line) + '</p>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
      }
    }
    if (inList) html += '</ul>';
    return { html: html + chips, rich: true, cat: catKey };
  }

  function inlineFormat(text) {
    /* Strip markdown links [label](url) — show just the label */
    text = text.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1');
    /* Strip angle-bracket URLs <https://...> — show just the url */
    text = text.replace(/<(https?:\/\/[^>]+)>/g, '$1');
    /* Strip remaining bare [...] reference brackets */
    text = text.replace(/\[([^\]]+)\]/g, '$1');
    return escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="bot-bold">$1</strong>');
  }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ========== Messages ========== */
  function addMsg(type, text, savedTime){
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap ' + type;

    var div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    if (type === 'bot') {
      var fmt = formatBotReply(text);
      div.innerHTML = fmt.html;
      if (fmt.rich) div.classList.add('rich-reply');
    } else {
      div.innerHTML = text.replace(/\n/g, '<br>');
    }
    wrap.appendChild(div);

    /* Feature 5: timestamp — store ISO so smart labels work across sessions */
    var tsRow = document.createElement('div');
    tsRow.className = 'chat-ts-row';
    var ts = document.createElement('div');
    ts.className = 'chat-ts';
    var _msgIso = savedTime || new Date().toISOString(); /* single ref avoids two Date() calls drifting */
    ts.textContent = formatTimestamp(_msgIso);
    ts.dataset.iso = _msgIso;
    tsRow.appendChild(ts);
    if (type === 'bot') addSpeakBtn(tsRow, text, div);
    wrap.appendChild(tsRow);

    /* 👍 Reactions — only on bot messages */
    if (type === 'bot') {
      setTimeout(function(){ addReactions(wrap); }, 500);
    }

    msgs.appendChild(wrap);
    addToHistory(type, text);
    scrollMsgs();
    return div; /* return the bubble itself for reaction injection */
  }

  /* Instagram / Meta AI style — dots → full message with CSS animation
     isNudge=true → do NOT restart the idle timer after rendering (prevents loop) */
  /* `instant`: the visitor already waited for the AI behind the "thinking"
     bubble, so its answer shows straight away instead of after another
     0.65–1 s of dots. */
  function addBotTyping(answer, questionAsked, isNudge, instant){
    setBotBusy(true);
    setTypingStatus(true);

    /* 1. Show the thinking-dots bubble */
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap bot';

    var dot = document.createElement('div');
    dot.className = 'chat-msg bot';
    dot.style.animation = 'none'; /* suppress enter anim for dots bubble */
    dot.style.opacity   = '1';
    dot.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    wrap.appendChild(dot);

    var tsRow = document.createElement('div');
    tsRow.className = 'chat-ts-row';
    var ts = document.createElement('div');
    ts.className = 'chat-ts';
    var _isoNow = new Date().toISOString();
    ts.textContent = formatTimestamp(_isoNow);
    ts.dataset.iso = _isoNow;
    tsRow.appendChild(ts);
    addSpeakBtn(tsRow, answer, dot);
    wrap.appendChild(tsRow);

    msgs.appendChild(wrap);
    scrollMsgs();

    /* 2. After think-delay: swap dots → full message, replay CSS animation */
    var thinkDelay = instant ? 0 : 650 + Math.random() * 350;
    setTimeout(function(){
      /* Reset so botMsgIn animation fires cleanly */
      dot.style.animation = 'none';
      dot.style.opacity   = '0';
      void dot.offsetWidth; /* reflow */

      var fmtBot = formatBotReply(answer);
      dot.innerHTML = fmtBot.html;
      if (fmtBot.rich) dot.classList.add('rich-reply');
      dot.style.animation = 'botMsgIn 0.38s cubic-bezier(0.18,0.89,0.32,1.08) forwards';

      playReceive();
      addToHistory('bot', answer);
      /* ── Save bot reply to Firestore history (direct call — MutationObserver
         fires too early, before text is swapped in from dots, so we save here
         explicitly once the real answer is rendered) ── */
      if (window._saveChatMessage) window._saveChatMessage('bot', answer);
      scrollMsgs();

      setTimeout(function(){
        setTypingStatus(false);
        setBotBusy(false);
        if (questionAsked) showReaction(questionAsked, dot);
        /* 👍 Add reactions to the wrap */
        setTimeout(function(){ addReactions(wrap); }, 300);
        /* Don't restart idle timer for nudge messages — prevents infinite loop */
        if (!isNudge) resetIdleTimer();
      }, 400);
    }, thinkDelay);
  }

  /* Scroll the conversation to the newest message. Many callers can ask
     in the same frame (typewriter, new bubbles, keyboard); they are merged
     into one scroll per frame. instant=true jumps without animation (used
     for resizes, where a smooth scroll would visibly lag behind). */
  var _scrollFrame = 0, _scrollInstant = false;
  function scrollMsgs(instant){
    if (instant === true) _scrollInstant = true;
    if (_scrollFrame) return;
    _scrollFrame = requestAnimationFrame(function(){
      _scrollFrame = 0;
      var jump = _scrollInstant || (msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight) > msgs.clientHeight * 2;
      _scrollInstant = false;
      if (jump) msgs.scrollTop = msgs.scrollHeight;
      else msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
    });
  }

  /* Option 7 — top shadow while scrolled; toggled only when it changes */
  var _scrolledState = false;
  msgs.addEventListener('scroll', function(){
    var on = msgs.scrollTop > 10;
    if (on !== _scrolledState) { _scrolledState = on; msgs.classList.toggle('scrolled', on); }
  }, { passive: true });

  /* ── Feature 6: Back-to-bottom button ── */
  (function(){
    var scrollBtn = document.getElementById('chatScrollBtn');
    if (!scrollBtn || !msgs) return;

    /* Show the button as soon as the user scrolls UP more than ~500px
       away from the bottom (≈ 6 inches on a phone screen).
       This is purely distance-from-bottom — nothing to do with total
       scroll height or percentage. Also requires at least 3 bubbles
       so it never shows on an empty / just-opened chat. */
    var THRESHOLD = 500; /* px from bottom — adjust up/down if needed */

    /* Batched to one check per frame: the old version re-counted every
       bubble and re-measured the list on every scroll event and on every
       character the typewriter wrote. */
    var _btnFrame = 0, _btnShown = null;
    function updateScrollBtn(){
      if (_btnFrame) return;
      _btnFrame = requestAnimationFrame(function(){
        _btnFrame = 0;
        var show = msgs.childElementCount >= 3 &&
                   (msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight) > THRESHOLD;
        if (show !== _btnShown) { _btnShown = show; scrollBtn.style.display = show ? 'block' : 'none'; }
      });
    }

    msgs.addEventListener('scroll', updateScrollBtn, { passive: true });
    var mo = new MutationObserver(updateScrollBtn);
    mo.observe(msgs, { childList: true });

    scrollBtn.addEventListener('click', function(){
      msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
    });
  })();

  /* ══════════════════════════════════════════════════
     🎙️ VOICE INPUT — Web Speech API
     WhatsApp-style mic next to send button
  ══════════════════════════════════════════════════ */
  (function(){
    var micBtn = document.getElementById('chatMic');
    if (!micBtn) return;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      /* Browser doesn't support — hide mic gracefully */
      micBtn.style.display = 'none';
      return;
    }

    var recog = new SpeechRecognition();
    recog.lang = 'en-IN';           /* Indian English — works for Hindi-accented English too */
    recog.interimResults = true;    /* Show words as they're spoken */
    recog.maxAlternatives = 1;
    var listening = false;

    micBtn.addEventListener('click', function(){
      if (listening) {
        recog.stop();
        return;
      }
      try {
        recog.start();
      } catch(e) {}
    });

    recog.onstart = function(){
      listening = true;
      micBtn.classList.add('mic-listening');
      micBtn.title = 'Listening… tap to stop';
      micBtn.textContent = '🔴';
      input.placeholder = 'Listening…';
    };

    recog.onresult = function(e){
      var transcript = '';
      for (var i = e.resultIndex; i < e.results.length; i++){
        transcript += e.results[i][0].transcript;
      }
      input.value = transcript;
      /* If final result, auto-send after tiny delay */
      if (e.results[e.results.length - 1].isFinal) {
        setTimeout(function(){
          if (input.value.trim()) sendMessage();
        }, 400);
      }
    };

    recog.onerror = function(e){
      var msgs_map = {
        'not-allowed' : '⚠️ Mic permission denied. Please allow mic access.',
        'no-speech'   : 'No speech detected. Try again!',
        'network'     : 'Network error. Check connection.',
      };
      input.placeholder = msgs_map[e.error] || 'Voice error — try typing instead.';
      setTimeout(function(){ input.placeholder = (briefApi && briefApi.isActive()) ? briefApi.placeholder() : 'Tap here to type…'; }, 3000);
    };

    recog.onend = function(){
      listening = false;
      micBtn.classList.remove('mic-listening');
      micBtn.title = 'Voice input';
      micBtn.textContent = '🎙️';
      if (!input.value.trim()) input.placeholder = (briefApi && briefApi.isActive()) ? briefApi.placeholder() : 'Tap here to type…';
    };
  })();

  /* ══════════════════════════════════════════════════
     👍 MESSAGE REACTIONS
     Appears below every bot reply — 👍 ❤️ 🤔
  ══════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════
     👍 LONG-PRESS REACTIONS — WhatsApp style
     Hold any bot message → picker floats above it
  ══════════════════════════════════════════════════ */
  var EMOJIS = ['👍','❤️','😮','😂','🔥','🙏'];

  /* Create picker DOM once, reuse */
  var picker = document.createElement('div');
  picker.id = 'reactionPicker';
  picker.style.display = 'none';
  EMOJIS.forEach(function(em){
    var b = document.createElement('button');
    b.className = 'rp-btn';
    b.textContent = em;
    b.setAttribute('aria-label', em);
    picker.appendChild(b);
  });
  document.body.appendChild(picker);

  var pickerTarget = null; /* the bubble wrap currently targeted */
  var holdTimer    = null;
  var pickerOpen   = false;

  function showPicker(bubbleEl, triggerEl) {
    if (bubbleEl.dataset.reacted) return; /* already reacted */
    pickerTarget = bubbleEl;

    /* Position above the bubble */
    var rect = triggerEl.getBoundingClientRect();
    picker.style.display = 'flex';
    picker.classList.remove('picker-hide');

    /* Let browser measure picker width */
    requestAnimationFrame(function(){
      var pw = picker.offsetWidth;
      var ph = picker.offsetHeight;
      var left = rect.left + (rect.width / 2) - (pw / 2);
      /* Clamp to viewport */
      left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
      var top = rect.top - ph - 10;
      /* If too close to top, show below instead */
      if (top < 8) top = rect.bottom + 10;
      picker.style.left = left + 'px';
      picker.style.top  = top  + 'px';
    });
    pickerOpen = true;
  }

  function hidePicker(){
    if (!pickerOpen) return;
    picker.classList.add('picker-hide');
    setTimeout(function(){
      picker.style.display = 'none';
      picker.classList.remove('picker-hide');
      pickerOpen = false;
      pickerTarget = null;
    }, 150);
  }

  /* Dismiss on outside tap */
  document.addEventListener('pointerdown', function(e){
    if (pickerOpen && !picker.contains(e.target)) hidePicker();
  });

  /* Emoji chosen */
  picker.addEventListener('click', function(e){
    var btn = e.target.closest('.rp-btn');
    if (!btn || !pickerTarget) return;
    var em = btn.textContent;

    /* Add badge on bubble corner */
    var bubble = pickerTarget.querySelector('.chat-msg.bot');
    var badge = document.createElement('div');
    badge.className = 'msg-reaction-badge';
    badge.textContent = em;
    if (bubble) bubble.appendChild(badge);
    pickerTarget.dataset.reacted = '1';

    /* Bounce the chosen emoji button */
    btn.style.transform = 'scale(1.6)';
    setTimeout(function(){ btn.style.transform = ''; hidePicker(); }, 250);
  });

  /* Attach long-press to a bot message wrap */
  function addReactions(bubbleWrap) {
    var bubble = bubbleWrap.querySelector('.chat-msg.bot');
    if (!bubble) return;

    /* ── Touch: long press — attach to bubble directly ── */
    bubble.addEventListener('touchstart', function(e){
      /* Start timer */
      holdTimer = setTimeout(function(){
        showPicker(bubbleWrap, bubble);
        if (navigator.vibrate) navigator.vibrate(40);
      }, 500);
    }, { passive: true });

    bubble.addEventListener('touchend', function(){
      clearTimeout(holdTimer);
    }, { passive: true });

    bubble.addEventListener('touchmove', function(){
      clearTimeout(holdTimer);
    }, { passive: true });

    /* ── Mouse: long press (desktop) ── */
    bubble.addEventListener('mousedown', function(e){
      if (e.button !== 0) return;
      holdTimer = setTimeout(function(){ showPicker(bubbleWrap, bubble); }, 600);
    });
    bubble.addEventListener('mouseup',    function(){ clearTimeout(holdTimer); });
    bubble.addEventListener('mouseleave', function(){ clearTimeout(holdTimer); });
  }

  /* ══════════════════════════════════════════════════
     TEXT-TO-SPEECH — Edge TTS voice replies
     Read Aloud button on every bot bubble → /api/speak
     Includes centered loading state and word-by-word
     highlight synced to REAL WordBoundary timestamps
     returned by the voice engine — not estimated — so
     the highlight tracks the audio precisely.
  ══════════════════════════════════════════════════ */
  var ttsApiUrl        = 'https://sahnawaz-portfolio.vercel.app/api/speak';
  var _ttsAudio         = null;
  var _ttsBtnActive     = null;
  var _ttsStopHighlight = null;   // cancels the highlight animation loop
  var _ttsRestoreBubble = null;   // restores the bubble's original formatted HTML

  var ttsOverlay = document.getElementById('ttsLoadingOverlay');

  var TTS_ICON_SPEAKER =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16.5 12c0-1.77-.77-3.29-2-4.32v8.64c1.23-1.03 2-2.55 2-4.32z"/><path d="M18.5 4.55c2.4 1.85 3.9 4.63 3.9 7.45s-1.5 5.6-3.9 7.45l-.9-1.2c2.1-1.6 3.4-4 3.4-6.25s-1.3-4.65-3.4-6.25l.9-1.2z"/></svg>';
  var TTS_ICON_PAUSE =
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var TTS_ICON_WARN =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';

  function setBtnIdle(btn){
    btn.classList.remove('speak-loading', 'speak-playing', 'speak-error');
    btn.innerHTML = '<span class="tts-icon">' + TTS_ICON_SPEAKER + '</span><span>Listen</span>';
  }

  function showTtsOverlay(){ if (ttsOverlay) ttsOverlay.classList.add('show'); }
  function hideTtsOverlay(){ if (ttsOverlay) ttsOverlay.classList.remove('show'); }

  /* Wraps each word IN PLACE inside the bubble's existing formatted HTML,
     instead of discarding it and rebuilding plain text. Walks every text
     node under `root` (so it reaches text inside <b>, <li>, headers,
     colored spans, links, etc.) and wraps just the word-tokens inside
     each one with <span class="tts-word" data-i="N">, leaving all
     surrounding tags and whitespace exactly where they were. Tokens with
     no letters/digits (stray punctuation, emoji left over from markdown
     rendering) are left unwrapped and don't consume an index, since the
     server's word-timing list only counts spoken words. Indices are
     assigned in document (reading) order, matching the order the server's
     `words` array was generated in — that's what makes the positional
     lookup in startWordHighlight() line up correctly. Never throws even
     if the two counts drift slightly (e.g. an emoji or link the TTS
     cleaner stripped that's still visible on screen) — startWordHighlight
     already guards every span lookup with `if (spans[idx])`. */
  var TTS_WORD_CHAR_RE = /[\p{L}\p{N}]/u;
  function wrapWordsInPlace(root){
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) textNodes.push(n);

    var counter = 0;
    for (var t = 0; t < textNodes.length; t++) {
      var textNode = textNodes[t];
      var text = textNode.nodeValue;
      if (!text) continue;

      var parts = text.split(/(\s+)/); // keeps whitespace runs as their own entries
      var frag = document.createDocumentFragment();
      var changedThisNode = false;

      for (var p = 0; p < parts.length; p++) {
        var part = parts[p];
        if (part === '') continue;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          continue;
        }
        if (TTS_WORD_CHAR_RE.test(part)) {
          var span = document.createElement('span');
          span.className = 'tts-word';
          span.setAttribute('data-i', counter++);
          span.textContent = part;
          frag.appendChild(span);
          changedThisNode = true;
        } else {
          frag.appendChild(document.createTextNode(part)); // punctuation/symbol only — not a spoken word
        }
      }

      if (changedThisNode && textNode.parentNode) {
        textNode.parentNode.replaceChild(frag, textNode);
      }
    }
  }

  /* Drives the word highlight against actual audio.currentTime, using the
     real start/end timestamps (in seconds) the voice engine reported for
     each word — this is what makes the sync accurate rather than guessed.

     HIGHLIGHT_LEAD_SEC compensates for a small, fixed latency between the
     <audio> element's currentTime clock and what's actually audible —
     browsers take a moment to decode/buffer an MP3 blob before sound
     reaches your ears, so without this the highlight consistently trails
     the spoken word by a beat rather than drifting further out of sync
     over time. It's a constant nudge, not a per-word guess. 150ms is a
     reasonable starting point; if it still feels a touch early or late,
     adjust this single number up or down. */
  var HIGHLIGHT_LEAD_SEC = 0.15;

  function startWordHighlight(bubbleEl, words, audio){
    var spans = bubbleEl.querySelectorAll('.tts-word');
    var lastIdx = -1;
    var rafId;

    // Single element that glides between word positions — this is what
    // makes the highlight look like it *moves* rather than jumping.
    var pill = document.createElement('div');
    pill.className = 'tts-highlight-pill';
    bubbleEl.appendChild(pill);

    function movePillTo(span, instant){
      if (!span) { pill.style.opacity = '0'; return; }
      var bubbleRect = bubbleEl.getBoundingClientRect();
      var spanRect   = span.getBoundingClientRect();
      // Subtract clientLeft/Top too, since the containing block for an
      // absolutely-positioned child starts at the padding box (inside
      // the border), while getBoundingClientRect() measures from the
      // border's outer edge.
      var x = spanRect.left - bubbleRect.left - bubbleEl.clientLeft;
      var y = spanRect.top  - bubbleRect.top  - bubbleEl.clientTop;

      if (instant) pill.style.transition = 'none';
      pill.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      pill.style.width  = spanRect.width  + 'px';
      pill.style.height = spanRect.height + 'px';
      pill.style.opacity = '1';
      if (instant) {
        void pill.offsetWidth; // force layout so the 'none' transition actually applies first
        pill.style.transition = '';
      }
    }

    function tick(){
      if (_ttsAudio !== audio) return; /* stopped or replaced */
      var t = audio.currentTime + HIGHLIGHT_LEAD_SEC;
      var idx = lastIdx < 0 ? 0 : lastIdx;
      while (idx + 1 < words.length && t >= words[idx + 1].start) idx++;
      if (idx !== lastIdx) {
        if (spans[lastIdx]) spans[lastIdx].classList.remove('tts-active');
        if (spans[idx]) spans[idx].classList.add('tts-active');
        movePillTo(spans[idx], lastIdx < 0); // instant only for the very first word
        lastIdx = idx;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return function stopHighlight(){
      cancelAnimationFrame(rafId);
      for (var i = 0; i < spans.length; i++) spans[i].classList.remove('tts-active');
      if (pill.parentNode) pill.parentNode.removeChild(pill);
    };
  }

  function stopSpeaking(){
    if (_ttsAudio) {
      _ttsAudio.pause();
      _ttsAudio.src = '';
      _ttsAudio = null;
    }
    if (_ttsStopHighlight) { _ttsStopHighlight(); _ttsStopHighlight = null; }
    if (_ttsRestoreBubble) { _ttsRestoreBubble(); _ttsRestoreBubble = null; }
    hideTtsOverlay();
    if (_ttsBtnActive) {
      setBtnIdle(_ttsBtnActive);
      _ttsBtnActive = null;
    }
  }

  function addSpeakBtn(container, rawText, bubbleEl){
    /* chip markers like [[go:services|See pricing]] are buttons, not speech */
    rawText = String(rawText || '').replace(/\[\[go:[^\]]*\]\]/gi, '').trim();
    if (!rawText) return;
    var btn = document.createElement('button');
    btn.className = 'chat-speak-btn';
    btn.type = 'button';
    btn.title = 'Read this reply aloud';
    btn.setAttribute('aria-label', 'Read reply aloud');
    setBtnIdle(btn);
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      speakText(rawText, btn, bubbleEl);
    });
    container.appendChild(btn);
  }

  function speakText(rawText, btn, bubbleEl){
    /* Tapping the currently-playing/loading message again stops it */
    if (_ttsBtnActive === btn) { stopSpeaking(); return; }
    stopSpeaking();

    btn.classList.add('speak-loading');
    btn.innerHTML = '<span class="tts-spinner-sm"></span><span>Preparing</span>';
    _ttsBtnActive = btn;
    showTtsOverlay();

    // Safety net: give up if the request hangs, instead of leaving
    // "Generating audio..." on screen forever. The timeout scales with
    // message length rather than a fixed 20s — a longer bot reply means
    // a bigger base64 (audio + word-timing) JSON payload to *download*,
    // not necessarily slower generation. A fixed 20s was tight enough that
    // long replies on a slow connection (a few KB/s) got aborted mid-download
    // even though the server had already finished. BASE covers connection
    // setup + short-message generation; MS_PER_CHAR is a generous per-character
    // allowance for slow-link download time; MAX caps it so a runaway request
    // still gives up eventually.
    var TIMEOUT_BASE_MS     = 8000;
    var TIMEOUT_MS_PER_CHAR = 45;
    var TIMEOUT_MAX_MS      = 60000;
    var timeoutMs = Math.min(
      TIMEOUT_MAX_MS,
      TIMEOUT_BASE_MS + (rawText.length * TIMEOUT_MS_PER_CHAR)
    );

    var controller = new AbortController();
    var timeoutId = setTimeout(function(){ controller.abort(); }, timeoutMs);

    fetch(ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
      signal: controller.signal
    })
    .then(function(res){
      clearTimeout(timeoutId);
      if (!res.ok) {
        var err = new Error('TTS request failed (' + res.status + ')');
        err.status = res.status;
        throw err;
      }
      return res.json();
    })
    .then(function(data){
      /* User may have cancelled while we were waiting */
      if (_ttsBtnActive !== btn) return;
      hideTtsOverlay();

      // Decode the base64 MP3 back into a playable blob
      var binary = atob(data.audio);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var blob = new Blob([bytes], { type: 'audio/mpeg' });

      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      _ttsAudio = audio;
      btn.classList.remove('speak-loading');
      btn.classList.add('speak-playing');
      btn.innerHTML = '<span class="tts-icon"><span class="tts-bars"><span></span><span></span><span></span></span></span><span>Playing</span>';

      // Wrap words for highlighting IN PLACE, driven by the real per-word
      // timestamps from the server — this keeps all existing formatting
      // (bold, headers, bullets, colored spans) intact while it speaks.
      // Original HTML is restored the moment playback stops.
      var words = data.words || [];
      if (bubbleEl && words.length) {
        var origHTML = bubbleEl.innerHTML;
        wrapWordsInPlace(bubbleEl);
        _ttsRestoreBubble = function(){ bubbleEl.innerHTML = origHTML; };
        _ttsStopHighlight = startWordHighlight(bubbleEl, words, audio);
      }

      audio.addEventListener('ended', function(){
        URL.revokeObjectURL(url);
        stopSpeaking();
      });
      audio.play().catch(function(){
        URL.revokeObjectURL(url);
        stopSpeaking();
      });
    })
    .catch(function(err){
      clearTimeout(timeoutId);
      if (_ttsBtnActive === btn) _ttsBtnActive = null;
      hideTtsOverlay();
      btn.classList.remove('speak-loading', 'speak-playing');
      btn.classList.add('speak-error');
      var busy = err && err.status === 429;
      var timedOut = err && err.name === 'AbortError';
      var label = timedOut ? 'Timed out — retry' : (busy ? 'Busy — retry' : 'Retry');
      btn.innerHTML = '<span class="tts-icon">' + TTS_ICON_WARN + '</span><span>' + label + '</span>';
      setTimeout(function(){ setBtnIdle(btn); }, (busy || timedOut) ? 4000 : 2500);
    });
  }


  /* ========== Send ========== */
  /* ========== Requests the page can carry out ==========
     The AI can only talk; a few things are real actions on this page. When a
     message clearly asks for one, it is done here instead of being sent to
     the AI (which could only describe it — or worse, invent a result):
       "continue my brief", "plan my project"   → the project planner
       "do a fresh check", "check it again"     → re-runs the last website check
       "check my website" (no address given)    → starts the website check
       "open the full report", "fix it"         → the report's own buttons
     Questions about these features ("how does the check work?") still go to
     the AI, which knows them and offers the right chip. */
  var AGAIN_RE = /\b(fresh|again|re ?check|recheck|re ?run|rerun|re ?test|retest|re ?scan|rescan|redo|refresh|one more time|once more|new|latest|updated|repeat|phir se|fir se|phirse|firse|dobara|dubara|abar|aabar|arekbar|ekbar)\b/;
  function routeIntent(val){
    var raw = String(val || '').trim();
    if (!raw || raw.length > 140) return null;
    var t = raw.toLowerCase().replace(/[“”"'’!?.,:;()\[\]_-]/g, ' ').replace(/\s+/g, ' ').trim();
    var asking = /^(how|what|whats|why|when|where|which|who|explain|tell me|does|do you|did|is it true|should)\b/.test(t);
    if (asking) return null;
    var last = checkChat.last();
    var checkWord = /\b(check|checkup|test|scan|audit|report|score|scores|analysis|speed test)\b/;
    /* the project planner */
    if (/\b(continue|resume|finish|complete|carry on|pick up|go back to|back to|return to|get back to|reopen|open|show me)\b.{0,20}\b(brief|planner|project plan)\b/.test(t) ||
        /\b(my |the )?(brief|planner)\b.{0,12}\b(continue|resume|finish|kholo|kholiye|chalu|shuru|karo|koro)\b/.test(t)) return 'brief';
    if (/\b(start|begin|create|make|prepare|write|fill|do)\b.{0,15}\b(brief|planner)\b/.test(t) || /\bplan (my|our|a|the) (new )?(project|website|site|app|store|shop|business website)\b/.test(t) || /^(my |project |the )?(brief|planner)( please)?$/.test(t)) return 'brief';
    /* the report shown in this chat */
    if (last && /\b(open|show|see|view|expand)\b.{0,20}\breport\b/.test(t) && !AGAIN_RE.test(t)) return 'report';
    if (last && /^(please |ok |okay |yes )?(fix (it|this|that|them|these|my (web ?site|site))|fix it with sahnawaz|let s fix (it|this))\b/.test(t)) return 'fix';
    /* new results for the site already checked */
    if (last && AGAIN_RE.test(t) && (checkWord.test(t) || /\b(check|run|test|scan|do) (it|this|that|my site|my website)\b/.test(t) || /^(re ?check|recheck|re ?test|retest|re ?run|rerun|refresh|again|check again|try again)\b/.test(t))) return 'recheck';
    /* a website check, but no address yet */
    if (/\b(check|audit|test|scan|analy[sz]e|review|inspect)\b.{0,25}\b(my|our|a|the|this|another|other|one more)\s+(business\s+)?(web ?site|site|webpage)\b/.test(t) || /^(free )?(web ?site|site) (check|audit|test)\b/.test(t)) return last && AGAIN_RE.test(t) && !/\b(another|other)\b/.test(t) ? 'recheck' : 'check';
    /* "do a fresh check" with nothing checked yet: start one */
    if (!last && AGAIN_RE.test(t) && /\b(check|audit|scan)\b/.test(t)) return 'check';
    return null;
  }
  function runIntent(kind, val){
    if (kind === 'report' || kind === 'fix') {
      if (!checkChat.last()) return false;
      playSend && playSend();
      addMsg('user', val);
      if (window._saveChatMessage) window._saveChatMessage('user', val);
      if (kind === 'fix') { addBotTyping("Let's fix it 🛠️ I'm opening the planner with your site and its top fixes already filled in.", val); setTimeout(function(){ checkChat.fixLast(); }, 900); }
      else checkChat.openLast();
      return true;
    }
    playSend && playSend();
    addMsg('user', val);
    if (window._saveChatMessage) window._saveChatMessage('user', val);
    setChipsOpen(false);
    if (kind === 'brief') { briefApi.start({ from: 'chat' }); return true; }
    if (kind === 'recheck') { checkChat.recheck(); return true; }
    if (kind === 'check') { checkChat.start(); return true; }
    return false;
  }
  /* What the AI should know about this visitor's page right now: the website
     check shown in this chat, their brief (no contact details), and which
     section is on screen. The server re-checks every field. */
  function chatContext(){
    var c = {};
    try {
      var r = checkChat.last();
      if (r) {
        var sc = r.scores || {}, sp = r.speed || {};
        c.report = {
          host: r.host, type: r.type, checkedAt: r.checkedAt, verdict: r.verdict && r.verdict.label,
          scores: { overall: sc.overall, speed: sc.speed, google: sc.google, easy: sc.easy, contact: sc.contact },
          lcp: sp.lcp ? sp.lcp.value : null, speedUnavailable: !!r.speedUnavailable,
          problems: (r.findings || []).slice(0, 6).map(function(f){ return f.title; }),
          slow: (sp.opportunities || []).slice(0, 5).map(function(o){ return o.label + (o.savingsMs >= 150 ? ' (about ' + Math.round(o.savingsMs / 100) / 10 + ' s)' : o.savingsKb ? ' (about ' + o.savingsKb + ' KB)' : ''); }),
          top3: ((r.text && r.text.top3) || []).slice(0, 3).map(function(x){ return x.title; }),
          headline: r.text && r.text.headline
        };
      }
    } catch (e) {}
    try { var b = briefApi.summary(); if (b.active || b.draft || b.sent) c.brief = b; } catch (e) {}
    try {
      var mid = innerHeight / 2, secs = document.querySelectorAll('main section[id], body > section[id], section[id]');
      for (var i = 0; i < secs.length; i++) {
        var rc = secs[i].getBoundingClientRect();
        if (rc.top <= mid && rc.bottom >= mid && rc.height > 0) {
          var h = secs[i].querySelector('h2, h1');
          var title = (secs[i].getAttribute('aria-label') || (h && h.textContent) || '').replace(/\s+/g, ' ').trim();
          if (title) c.section = { id: secs[i].id, title: title.slice(0, 80) };
          break;
        }
      }
    } catch (e) {}
    return c;
  }

  function sendMessage(){
    var bypassBrief = _briefBypassOnce;
    _briefBypassOnce = false;
    if (botBusy) return;
    var val = input.value.trim();
    if (!val) return;
    input.value = '';
    resetIdleTimer(); /* always restart idle countdown on every user send */
    /* Feature 4: clear typing indicator */
    clearTimeout(userTypingTimeout);
    if (userTypingEl) userTypingEl.textContent = '';
    followUpWrap && (followUpWrap.style.display = 'none');
    if (quickReply) quickReply.style.display = 'none';

    /* ── Help flow intercept — if a flow is active, route reply there ── */
    if (window._helpFlowActive && window._helpFlowActive()) {
      playSend && playSend();
      window._helpFlowStep(val);
      return;
    }
    /* ── End help flow intercept ── */
    /* ── Website check: address / business type answers ── */
    if (bypassBrief) checkChat.reset();
    else if (checkChat.isActive()) {
      playSend && playSend();
      checkChat.stepInput(val);
      return;
    }
    /* "check my website abc.in" runs the check right here */
    var checkReq = (!bypassBrief && !(briefApi && briefApi.isActive())) ? checkChat.detect(val) : null;
    if (checkReq) {
      playSend && playSend();
      addMsg('user', val);
      if (window._saveChatMessage) window._saveChatMessage('user', val);
      checkChat.runTyped(checkReq);
      return;
    }
    /* ── Project brief: typed messages go to the brief agent ── */
    if (!bypassBrief && briefApi && briefApi.isActive()) {
      playSend && playSend();
      briefApi.step(val);
      return;
    }
    /* ── Requests the page carries out itself ("continue my brief",
       "do a fresh check"…): done directly, never described by the AI ── */
    var act = routeIntent(val);
    if (act && runIntent(act, val)) return;
    playSend();
    addMsg('user', val);
    /* Save user message to Firestore — must be here while val is still intact.
       engagement.js click listener fires after input.value is already cleared. */
    if (window._saveChatMessage) window._saveChatMessage('user', val);
    setChipsOpen(false);
    var enriched = resolveContext(val);
    // Try Gemini AI first, fall back to local answers if it fails
    setBotBusy(true);
    setTypingStatus(true);
    // Show "thinking" bubble with label + 3 dots
    var thinkWrap = document.createElement('div');
    thinkWrap.className = 'chat-msg-wrap bot';
    thinkWrap.id = 'geminiThinkBubble';
    var thinkBubble = document.createElement('div');
    thinkBubble.className = 'chat-msg bot';
    thinkBubble.innerHTML = '<span style="font-size:0.72rem;color:rgba(0,255,204,0.7);margin-right:6px;">Sahnawaz\'s Assistant is thinking</span><div class="typing-dots" style="display:inline-flex;"><span></span><span></span><span></span></div>';
    thinkWrap.appendChild(thinkBubble);
    msgs.appendChild(thinkWrap);
    scrollMsgs();

    /* Always use Vercel URL so API works from GitHub Pages AND Vercel */
    var apiUrl = 'https://sahnawaz-portfolio.vercel.app/api/chat';

    /* Build history payload — last 10 messages for context (the message
       just typed is already in it, so leave that one out) */
    var historyPayload = conversationHistory.slice(-11, -1).map(function(m){
      return { role: m.role, content: m.text };
    });

    /* Visitor name — stored if bot learned it during chat */
    var namePayload = window._chatVisitorName || null;

    /* ── Hacker Mode State Interceptor — short-circuit API if state already matches ── */
    var tLowCheck = val.toLowerCase();
    var isHackerOn = document.body.classList.contains('hacker-mode');

    /* Only match EXPLICIT commands: "turn on/off", "enable/disable", "activate/deactivate"
       directly followed by hacker-related words.
       Do NOT match descriptive phrases like "hacker mode is on, please turn it off"
       — those should go to the API which understands natural language context. */
    var wantOn  = /\b(turn\s+on|switch\s+on|enable|activate)\s+(retro\s+)?(hacker|hacker\s*mode|retro)\b/i.test(tLowCheck);
    var wantOff = /\b(turn\s+off|switch\s+off|disable|deactivate)\s+(retro\s+)?(hacker|hacker\s*mode|retro)\b/i.test(tLowCheck);

    if (wantOn && isHackerOn) {
      /* Already ON — give smart feedback without calling API */
      var bubble = document.getElementById('geminiThinkBubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      setTypingStatus(false); setBotBusy(false);
      addBotTyping('Retro Hacker Mode is **already active** 🟢 It\'s on and running — type "turn off hacker mode" to deactivate it. ✨', val);
      return;
    }
    if (wantOff && !isHackerOn) {
      /* Already OFF — give smart feedback without calling API */
      var bubble = document.getElementById('geminiThinkBubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      setTypingStatus(false); setBotBusy(false);
      addBotTyping('Retro Hacker Mode is **already off** 🔴 Nothing to deactivate — type "turn on hacker mode" to activate it. ✨', val);
      return;
    }
    /* ── End Hacker Mode State Interceptor ── */

    /* ── Real-time interceptor — inject device time/date before AI call ── */
    var msgToSend = val;
    var tLow = val.toLowerCase();

    /* Time */
    if (/\b(time|what time|current time|time now|kitna baj|baje hain)\b/i.test(tLow)) {
      var now = new Date();
      var timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
      msgToSend = val + ' [DEVICE_TIME: ' + timeStr + ']';
    }
    /* Date / Day */
    else if (/\b(date|today|what day|current date|aaj|din)\b/i.test(tLow)) {
      var now = new Date();
      var dateStr = now.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      msgToSend = val + ' [DEVICE_DATE: ' + dateStr + ']';
    }
    /* Math — calculate locally, send answer directly */
    else if (/^[\d\s\+\-\*\/\.\(\)\%\^]+$/.test(val.trim()) || /what\s+is\s+[\d].*[\+\-\*\/x]/.test(tLow)) {
      try {
        var expr = val.replace(/x/gi,'*').replace(/[^0-9\+\-\*\/\.\(\)\%]/g,'');
        if (expr) {
          var result = Function('"use strict"; return (' + expr + ')')();
          msgToSend = val + ' [CALC_RESULT: ' + result + ']';
        }
      } catch(e) {}
    }

    /* ── Reload latest visitor activity before every chat call ──
       Ensures likes/ratings/reviews done this session are reflected
       immediately without needing a page refresh.               */
    var _doFetch = function(freshActivity) {
      var payload = JSON.stringify({
        message: msgToSend,
        history: historyPayload,
        visitorName: conversationHistory.length <= 1 ? namePayload : null,
        visitorActivity: freshActivity || window._visitorActivity || null,
        visitorType: getVisitorType(),
        context: chatContext()
      });

      /* The server answers 429 with a friendly JSON { reply } when it is busy.
         Previously any non-OK status was thrown away and shown as
         "trouble connecting". Now: a 429 is retried once, quietly, after a
         short pause; if it is still busy, the server's own friendly reply is
         shown. Other error statuses still count as a connection problem. */
      var postChat = function(retriesLeft){
        return fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload
        }).then(function(res){
          if (res.ok) return res.json();
          if (res.status === 429 && retriesLeft > 0) {
            return new Promise(function(resolve){ setTimeout(resolve, 2500); })
              .then(function(){ return postChat(retriesLeft - 1); });
          }
          return res.json().catch(function(){ return null; }).then(function(body){
            if (res.status === 429 && body && body.reply) return body;
            throw new Error('API returned status ' + res.status);
          });
        });
      };

      postChat(1)
    .then(function(data){
      var bubble = document.getElementById('geminiThinkBubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      setTypingStatus(false);
      setBotBusy(false);
      var aiReply = data && data.reply && data.reply.trim() ? data.reply : null;
      if (aiReply) {
        /* Upgrade 2 — detect if visitor shared their name in this message */
        if (!window._chatVisitorName) {
          var nameMatch = val.match(/^(?:i(?:'m| am)|my name(?:'s| is)?|call me|it'?s)\s+([A-Z][a-z]{1,20})\b/i)
                       || val.match(/^([A-Z][a-z]{1,20})(?:\s+here|$)/);
          if (nameMatch) window._chatVisitorName = nameMatch[1];
        }
        addBotTyping(aiReply, val, false, true);
      } else {
        addBotTyping("⚠️ I didn't get a response. Please try again in a moment.", val, false, true);
      }

      /* ── SITE COMMAND EXECUTOR ──────────────────────────────────────────
         If the API returned a `command` field, execute it client-side.
         Commands are detected in chat.js with zero AI tokens used.
      ──────────────────────────────────────────────────────────────────── */
      if (data && data.command) {
        setTimeout(function() {
          var cmd = data.command;

          /* Hacker / Retro mode — state-aware: only act if state would actually change */
          if (cmd === 'hacker_on') {
            var isAlreadyOn = document.body.classList.contains('hacker-mode');
            if (isAlreadyOn) {
              /* Already ON — replace last bot message with smart feedback */
              var bubbles = msgs.querySelectorAll('.chat-msg.bot');
              var lastBubble = bubbles[bubbles.length - 1];
              if (lastBubble) {
                var fmtMsg = formatBotReply('Retro Hacker Mode is **already active** 🟢 It\'s on and running — try "turn off hacker mode" to deactivate it. ✨');
                lastBubble.innerHTML = fmtMsg.html;
              }
            } else {
              document.body.classList.add('hacker-mode');
              syncHackerToggleIcon();
              scrollToTerminalWithHint();
            }

          } else if (cmd === 'hacker_off') {
            var isAlreadyOff = !document.body.classList.contains('hacker-mode');
            if (isAlreadyOff) {
              /* Already OFF — replace last bot message with smart feedback */
              var bubbles = msgs.querySelectorAll('.chat-msg.bot');
              var lastBubble = bubbles[bubbles.length - 1];
              if (lastBubble) {
                var fmtMsg = formatBotReply('Retro Hacker Mode is **already off** 🔴 Nothing to deactivate — try "turn on hacker mode" to activate it. ✨');
                lastBubble.innerHTML = fmtMsg.html;
              }
            } else {
              document.body.classList.remove('hacker-mode');
              syncHackerToggleIcon();
            }

          } else if (cmd === 'hacker_toggle') {
            document.body.classList.toggle('hacker-mode');
            syncHackerToggleIcon();
            scrollToTerminalWithHint();

          /* Code popup */
          } else if (cmd === 'open_code_popup') {
            if (typeof window._openCodePopup === 'function') {
              window._openCodePopup();
            }

          /* Scroll commands — smooth scroll to section */
          } else if (cmd === 'scroll_about') {
            window.scrollTo({ top: 0, behavior: 'smooth' });

          } else if (cmd === 'scroll_projects') {
            var el = document.getElementById('projects');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_skills') {
            var el = document.querySelector('.tech-stack') || document.querySelector('.ts-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_contact') {
            var el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_certs') {
            var el = document.getElementById('certSection');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          } else if (cmd === 'scroll_blog') {
            var el = document.getElementById('blog');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 600); /* small delay so the chat reply renders first */
      }
      /* ── END SITE COMMAND EXECUTOR ─────────────────────────────────── */

      resetIdleTimer();
      })
      .catch(function(err){
        var bubble = document.getElementById('geminiThinkBubble');
        if (bubble) bubble.parentNode.removeChild(bubble);
        setTypingStatus(false);
        setBotBusy(false);
        var noNet = !navigator.onLine;
        var errMsg = noNet
          ? "⚠️ No internet connection. Please check your network and try again."
          : "⚠️ I'm having trouble connecting right now. Please try again in a moment.";
        addBotTyping(errMsg, val);
      });
    }; /* end _doFetch */

    /* Refresh activity from Firestore then fire the request */
    if (window._loadVisitorActivity) {
      window._loadVisitorActivity(function(fresh) { _doFetch(fresh); });
    } else {
      _doFetch(null);
    }
  }

  sendBtn && sendBtn.addEventListener('click', sendMessage);
  input && input.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); sendMessage(); }
  });

  /* Option 3 — pill click opens chat */
  var pill = document.getElementById('chatPill');
  if (pill) pill.addEventListener('click', function(){ window.openChat && window.openChat(); });

  /* Manual dismiss — small × badge on the pill */
  var pillCloseBtn = document.getElementById('pillClose');
  if (pillCloseBtn && pill) {
    pillCloseBtn.addEventListener('click', function(e){
      e.stopPropagation(); /* don't trigger openChat */
      clearTimeout(pill._hideTimer); /* cancel the 30s auto-hide, we're closing now */
      pill.style.animation = 'pillDismiss 0.3s cubic-bezier(0.4,0,0.2,1) both';
      setTimeout(function(){ pill.style.display = 'none'; }, 300);
    });
  }

  /* Option 7 — haptic flash on send */
  if (sendBtn){
    sendBtn.addEventListener('click', function(){
      sendBtn.classList.remove('haptic');
      void sendBtn.offsetWidth;
      sendBtn.classList.add('haptic');
      setTimeout(function(){ sendBtn.classList.remove('haptic'); }, 400);
    });
  }

})();


/* ==== index.html line 13115 ==== */

/* === Passive touch listeners to fix heavy scroll === */
(function () {
  const opts = { passive: true };
  window.addEventListener('touchstart', function(){}, opts);
  window.addEventListener('touchmove', function(){}, opts);
  window.addEventListener('wheel', function(){}, opts);
})();


/* ==== index.html line 13124 ==== */

/* n8n Contact Form Automation */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });

    /* NOTE: Replace 'YOUR-N8N-WEBHOOK-URL' with your actual n8n webhook endpoint */
    const webhookUrl = "https://YOUR-N8N-WEBHOOK-URL";
    if (webhookUrl.includes("YOUR-N8N")) {
      /* Webhook not configured — skip silently, let ctSendMail handle submission */
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      alert("✅ Message sent successfully. I'll get back to you soon.");
      form.reset();
    } catch (err) {
      showToast("❌ Something went wrong. Please try again.", "error");
    }
  });
});
