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
        addBotTyping(IDLE_MSG, null, true); /* isNudge=true — won't restart timer */

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
        input.placeholder = 'Ask anything about Sahnawaz…';
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


  /* ========== Keyboard / viewport fix ========== */
  function handleViewport(){
    if (!window.visualViewport || !widget || !isOpen) return;
    var vv = window.visualViewport;
    var winH = window.innerHeight;
    var keyboardH = winH - vv.height - vv.offsetTop;
    if (keyboardH > 100) {
      // keyboard is open — pin widget above keyboard
      widget.style.bottom = (keyboardH + 8) + 'px';
      widget.style.maxHeight = (vv.height - 16) + 'px';
    } else {
      widget.style.bottom = '80px';
      widget.style.maxHeight = '';
    }
    scrollMsgs();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', handleViewport, { passive: true });
  }

  /* Focus input → trigger viewport handler */
  input && input.addEventListener('focus', function(){
    setTimeout(handleViewport, 300);
  });
  input && input.addEventListener('blur', function(){
    setTimeout(handleViewport, 300);
  });

  /* ========== Open / Close ========== */
  window.openChat = function(){
    if (!widget) return;
    widget.classList.add('chat-open');
    isOpen = true;
    idleCount = 0; /* reset so nudges fire fresh every time chat is opened */
    if (!inited){ inited = true; initChat(); }
    setTimeout(handleViewport, 350);
    resetIdleTimer();
    playOpen();

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
    widget.classList.remove('chat-open');
    isOpen = false;
    playClose();
    clearTimeout(idleTimer);
    clearTimeout(idleTimer2);
    clearTimeout(idleTimer3);
    idleCount = 0;
    setChipsOpen(false);
    widget.style.bottom = '80px';
    widget.style.maxHeight = '';

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

  /* Expand / shrink toggle — Windows-style resize */
  var isExpanded = false;
  expandBtn && expandBtn.addEventListener('click', function(){
    isExpanded = !isExpanded;
    widget.classList.toggle('chat-expanded', isExpanded);
    /* Swap icon: restore icon when expanded, maximise icon when normal */
    var restoreMask = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='15 3 21 3 21 9'/%3E%3Cpolyline points='9 21 3 21 3 15'/%3E%3Cline x1='21' y1='3' x2='14' y2='10'/%3E%3Cline x1='3' y1='21' x2='10' y2='14'/%3E%3C/svg%3E\") center/contain no-repeat";
    var expandMask = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Crect x='8' y='8' width='13' height='13' rx='1.5'/%3E%3C/svg%3E\") center/contain no-repeat";
    var pseudo = expandBtn.querySelector('::before');
    /* Update via a small injected style rule */
    var styleId = 'chatExpandIconStyle';
    var existing = document.getElementById(styleId);
    if (existing) existing.remove();
    var s = document.createElement('style');
    s.id = styleId;
    s.textContent = isExpanded
      ? '#chatExpand::before { -webkit-mask: ' + restoreMask + '; mask: ' + restoreMask + '; }'
      : '#chatExpand::before { -webkit-mask: ' + expandMask  + '; mask: ' + expandMask  + '; }';
    document.head.appendChild(s);
    expandBtn.title = isExpanded ? 'Shrink chat' : 'Expand chat';
    expandBtn.setAttribute('aria-label', isExpanded ? 'Shrink chat' : 'Expand chat');
    /* Scroll to bottom after resize so messages stay visible */
    setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 320);
  });

  /* Clear conversation */
  clearBtn && clearBtn.addEventListener('click', function(){
    msgs.innerHTML = '';
    conversationHistory = [];
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
    client:    "Great, let's get your project moving! 🚀 Tell me what you're building and I'll share pricing and timelines, " +
               "or message Sahnawaz directly.\n[[go:send-message|📧 Message Sahnawaz]]\n[[go:services|See services & pricing]]",
    browsing:  "Welcome! 😊 Have a look around. Ask me anything, or try one of these below."
  };
  var STARTERS = {
    none:      [['💼 See his best work', 'What apps has Sahnawaz built? 🚀'], ['💰 Pricing', "What's his pricing?"],
                ['🤝 Hire Sahnawaz', 'How can I hire Sahnawaz?'], ['✅ Is he available?', 'Is he available for work right now?']],
    recruiter: [['🧑‍💼 His experience', 'Has he worked with big brands?'], ['🛠️ Tech stack', "What's his tech stack?"],
                ['🚀 What he built', 'What apps has Sahnawaz built? 🚀']],
    client:    [['💰 Pricing', "What's his pricing?"], ['⏱️ Timelines', 'How long does a project take?'],
                ['✨ A site like this', 'Can Sahnawaz build me a website like this?']],
    browsing:  [['🚀 His apps', 'What apps has Sahnawaz built? 🚀'], ['🖥️ Hacker Mode', 'What is the Hacker Mode? 🖥️'],
                ['✨ This portfolio', "What's special about this portfolio?"]]
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
      (STARTERS[vt] || STARTERS.none).forEach(function (st) {
        quickReply.appendChild(qrButton(st[0], function () {
          quickReply.style.display = 'none';
          handleQ(st[1]);
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
        if (!hasVisitedBefore) { try { localStorage.setItem('chatVisited','1'); } catch(e){} }
        addMsgTypewriter(greeting);
        buildChips();
        setChipsOpen(false);
        wireQuickReply();
      }
    }
    tryLoadHistory(10);
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
      if (type) startFlow(type);
    });

  })();
  /* ========== End Help Panel ========== */

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
    'callback':     { url: '/#contact', inChat: true, run: function () { return callIf('_startHelpFlow', 'callback'); } }
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
  function addBotTyping(answer, questionAsked, isNudge){
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
    var thinkDelay = 650 + Math.random() * 350;
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

  function scrollMsgs(){
    msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
    /* Option 7 — toggle scroll shadow class */
    setTimeout(function(){
      if (msgs.scrollTop > 10) msgs.classList.add('scrolled');
      else msgs.classList.remove('scrolled');
    }, 320);
  }

  /* Option 7 — also update shadow on manual scroll */
  msgs.addEventListener('scroll', function(){
    if (msgs.scrollTop > 10) msgs.classList.add('scrolled');
    else msgs.classList.remove('scrolled');
  });

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

    function updateScrollBtn(){
      var totalMsgs = msgs.querySelectorAll('.chat-msg-wrap').length;
      if (totalMsgs < 3) { scrollBtn.style.display = 'none'; return; }

      var distFromBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight;
      scrollBtn.style.display = distFromBottom > THRESHOLD ? 'block' : 'none';
    }

    msgs.addEventListener('scroll', updateScrollBtn, { passive: true });
    var mo = new MutationObserver(updateScrollBtn);
    mo.observe(msgs, { childList: true, subtree: true });

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
      setTimeout(function(){ input.placeholder = 'Tap here to type…'; }, 3000);
    };

    recog.onend = function(){
      listening = false;
      micBtn.classList.remove('mic-listening');
      micBtn.title = 'Voice input';
      micBtn.textContent = '🎙️';
      if (!input.value.trim()) input.placeholder = 'Tap here to type…';
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
  function sendMessage(){
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

    /* Build history payload — last 8 messages for context */
    var historyPayload = conversationHistory.slice(-8).map(function(m){
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
        visitorType: getVisitorType()
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
        addBotTyping(aiReply, val);
      } else {
        addBotTyping("⚠️ I didn't get a response. Please try again in a moment.", val);
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
