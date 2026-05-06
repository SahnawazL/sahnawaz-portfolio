/* ══════════════════════════════════════════════════════════
   engagement.js — Firestore-powered engagement features
   
   FEATURES:
   1. ⭐ Real reviews — replaces fake rating system
   2. 💬 Persistent chat history — per user, saved to Firestore
   3. 👍 Project likes — per project, per user

   REQUIRES:
   - visitor-auth.js loaded first (provides window._firebaseAuth,
     window._chatVisitorName, loadVisitor())
   - Firebase Firestore compat SDK (loaded here dynamically)
   ══════════════════════════════════════════════════════════ */

(function () {

  /* ── Firestore instance (set after SDK loads) ─────────── */
  var db = null;

  /* ── Load Firestore SDK ──────────────────────────────────*/
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function () { console.error('Failed to load:', src); };
    document.head.appendChild(s);
  }

  function initFirestore() {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js', function () {
      db = firebase.firestore();
      window._firestoreDB = db;
      /* Init all features once Firestore is ready */
      initReviews();
      initChatHistory();
      initProjectLikes();
    });
  }

  /* ══════════════════════════════════════════════════════
     HELPER — get current logged-in visitor
     ══════════════════════════════════════════════════════ */
  function getVisitor() {
    try {
      var v = localStorage.getItem('shnz_visitor_v1');
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }

  /* ══════════════════════════════════════════════════════
     1. ⭐ REVIEWS SYSTEM
     ══════════════════════════════════════════════════════ */
  function initReviews() {
    injectReviewStyles();
    injectReviewModal();
    replaceRatingSection();
    loadAndDisplayReviews();
  }

  function injectReviewStyles() {
    var style = document.createElement('style');
    style.textContent = `
      /* ── Review Section ── */
      #reviewSection {
        padding: 60px 20px;
        text-align: center;
        max-width: 900px;
        margin: 0 auto;
      }
      .rv-eyebrow {
        font-size: 0.75rem;
        letter-spacing: 3px;
        color: #00ffff;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .rv-title {
        font-size: clamp(1.6rem, 4vw, 2.2rem);
        font-weight: 800;
        color: #fff;
        margin-bottom: 8px;
      }
      .rv-sub {
        color: rgba(255,255,255,0.5);
        font-size: 0.9rem;
        margin-bottom: 30px;
      }
      /* Average stars */
      .rv-average {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 30px;
      }
      .rv-avg-score {
        font-size: 3rem;
        font-weight: 900;
        color: #00ffff;
        line-height: 1;
      }
      .rv-avg-right {
        text-align: left;
      }
      .rv-avg-stars { font-size: 1.4rem; letter-spacing: 2px; }
      .rv-avg-count { font-size: 0.8rem; color: rgba(255,255,255,0.4); }
      /* Write review button */
      .rv-write-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 28px;
        border-radius: 40px;
        background: linear-gradient(135deg, #00ffff, #0066ff);
        color: #000;
        font-weight: 700;
        font-size: 0.9rem;
        border: none;
        cursor: pointer;
        margin-bottom: 40px;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: inherit;
      }
      .rv-write-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,255,255,0.3); }
      /* Review cards grid */
      .rv-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
        margin-top: 20px;
        text-align: left;
      }
      .rv-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(0,255,255,0.12);
        border-radius: 16px;
        padding: 20px;
        position: relative;
        overflow: hidden;
        transition: transform 0.2s, border-color 0.2s;
      }
      .rv-card:hover { transform: translateY(-3px); border-color: rgba(0,255,255,0.3); }
      .rv-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .rv-card-avatar {
        width: 40px; height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(0,255,255,0.3);
        background: rgba(0,255,255,0.1);
      }
      .rv-card-name { font-weight: 700; color: #fff; font-size: 0.95rem; }
      .rv-card-date { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
      .rv-card-stars { font-size: 1rem; margin-bottom: 8px; letter-spacing: 1px; }
      .rv-card-text { font-size: 0.88rem; color: rgba(255,255,255,0.7); line-height: 1.6; }
      .rv-empty {
        color: rgba(255,255,255,0.35);
        font-size: 0.9rem;
        padding: 30px;
        border: 1px dashed rgba(255,255,255,0.1);
        border-radius: 16px;
      }
      .rv-login-hint {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.4);
        margin-bottom: 20px;
      }
      .rv-login-hint span {
        color: #00ffff;
        cursor: pointer;
        text-decoration: underline;
      }

      /* ── Review Modal ── */
      #reviewModal {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.8);
        z-index: 99999;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      #reviewModal.open { display: flex; }
      #reviewCard {
        background: linear-gradient(145deg, #0d1f2d, #0a1628);
        border: 1px solid rgba(0,255,255,0.2);
        border-radius: 24px;
        padding: 32px 28px;
        width: 100%;
        max-width: 460px;
        position: relative;
      }
      .rm-close {
        position: absolute;
        top: 16px; right: 16px;
        background: none; border: none;
        color: rgba(255,255,255,0.4);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 50%;
        font-family: inherit;
      }
      .rm-close:hover { color: #fff; background: rgba(255,255,255,0.08); }
      .rm-title {
        font-size: 1.3rem;
        font-weight: 800;
        color: #fff;
        margin-bottom: 6px;
      }
      .rm-sub {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.45);
        margin-bottom: 24px;
      }
      /* Star picker */
      .rm-stars {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        justify-content: center;
      }
      .rm-star {
        font-size: 2rem;
        cursor: pointer;
        transition: transform 0.15s;
        filter: grayscale(1) opacity(0.4);
      }
      .rm-star.active, .rm-star:hover { filter: none; transform: scale(1.2); }
      /* Message textarea */
      .rm-textarea {
        width: 100%;
        min-height: 100px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(0,255,255,0.15);
        border-radius: 12px;
        color: #fff;
        font-size: 0.9rem;
        padding: 14px;
        resize: vertical;
        font-family: inherit;
        box-sizing: border-box;
        margin-bottom: 20px;
        outline: none;
        transition: border-color 0.2s;
      }
      .rm-textarea:focus { border-color: rgba(0,255,255,0.4); }
      .rm-textarea::placeholder { color: rgba(255,255,255,0.25); }
      /* Submit button */
      .rm-submit {
        width: 100%;
        padding: 13px;
        border-radius: 40px;
        background: linear-gradient(135deg, #00ffff, #0066ff);
        color: #000;
        font-weight: 700;
        font-size: 0.95rem;
        border: none;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s, transform 0.2s;
      }
      .rm-submit:hover { transform: translateY(-1px); }
      .rm-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .rm-error { color: #ff6b6b; font-size: 0.82rem; margin-top: 10px; text-align: center; }
      .rm-success { color: #00ffff; font-size: 0.9rem; margin-top: 10px; text-align: center; }

      /* ── Like Button ── */
      .proj-like-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 30px;
        padding: 5px 14px;
        color: rgba(255,255,255,0.6);
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        margin-top: 10px;
      }
      .proj-like-btn:hover { border-color: rgba(255,100,100,0.4); color: #fff; }
      .proj-like-btn.liked {
        background: rgba(255,80,80,0.12);
        border-color: rgba(255,80,80,0.4);
        color: #ff6b6b;
      }
      .proj-like-btn .like-icon { font-size: 1rem; transition: transform 0.2s; }
      .proj-like-btn.liked .like-icon { transform: scale(1.2); }

      /* ── Chat history indicator ── */
      #chatHistoryBadge {
        display: none;
        position: absolute;
        top: -4px; right: -4px;
        background: #00ffff;
        color: #000;
        font-size: 0.65rem;
        font-weight: 700;
        border-radius: 10px;
        padding: 1px 6px;
        min-width: 18px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  function injectReviewModal() {
    if (document.getElementById('reviewModal')) return;
    var modal = document.createElement('div');
    modal.id = 'reviewModal';
    modal.innerHTML = `
      <div id="reviewCard">
        <button class="rm-close" id="rmClose">✕</button>
        <div class="rm-title">⭐ Leave a Review</div>
        <div class="rm-sub">Your feedback means a lot. It only takes 30 seconds.</div>
        <div class="rm-stars" id="rmStars">
          <span class="rm-star" data-val="1">⭐</span>
          <span class="rm-star" data-val="2">⭐</span>
          <span class="rm-star" data-val="3">⭐</span>
          <span class="rm-star" data-val="4">⭐</span>
          <span class="rm-star" data-val="5">⭐</span>
        </div>
        <textarea class="rm-textarea" id="rmText" placeholder="Share your experience — what did you like? What could be better?" maxlength="400"></textarea>
        <button class="rm-submit" id="rmSubmit">Submit Review</button>
        <div class="rm-error" id="rmError" style="display:none;"></div>
        <div class="rm-success" id="rmSuccess" style="display:none;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    /* Close */
    document.getElementById('rmClose').onclick = closeReviewModal;
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeReviewModal();
    });

    /* Star picker */
    var selectedStar = 0;
    var stars = modal.querySelectorAll('.rm-star');
    stars.forEach(function (star) {
      star.addEventListener('click', function () {
        selectedStar = parseInt(star.getAttribute('data-val'));
        stars.forEach(function (s, i) {
          s.classList.toggle('active', i < selectedStar);
        });
      });
      star.addEventListener('mouseenter', function () {
        var val = parseInt(star.getAttribute('data-val'));
        stars.forEach(function (s, i) { s.classList.toggle('active', i < val); });
      });
      star.addEventListener('mouseleave', function () {
        stars.forEach(function (s, i) { s.classList.toggle('active', i < selectedStar); });
      });
    });

    /* Submit */
    document.getElementById('rmSubmit').onclick = function () {
      submitReview(selectedStar);
    };

    window._reviewSelectedStar = function () { return selectedStar; };
  }

  function openReviewModal() {
    var visitor = getVisitor();
    if (!visitor) {
      if (window.openLoginModal) window.openLoginModal();
      return;
    }
    document.getElementById('reviewModal').classList.add('open');
    document.getElementById('rmError').style.display = 'none';
    document.getElementById('rmSuccess').style.display = 'none';
    document.getElementById('rmText').value = '';
    /* Reset stars */
    document.querySelectorAll('.rm-star').forEach(function (s) { s.classList.remove('active'); });
  }
  window.openReviewModal = openReviewModal;

  function closeReviewModal() {
    var m = document.getElementById('reviewModal');
    if (m) m.classList.remove('open');
  }

  function submitReview(stars) {
    var visitor = getVisitor();
    if (!visitor) { openReviewModal(); return; }
    if (!stars || stars < 1) {
      showRmError('Please select a star rating first!'); return;
    }
    var text = (document.getElementById('rmText').value || '').trim();
    if (!text || text.length < 10) {
      showRmError('Please write at least 10 characters.'); return;
    }
    if (!db) { showRmError('Database not ready. Try again in a moment.'); return; }

    var btn = document.getElementById('rmSubmit');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    /* Check if user already reviewed */
    db.collection('reviews').where('uid', '==', visitor.uid).get()
      .then(function (snap) {
        if (!snap.empty) {
          showRmError('You have already submitted a review. Thank you! 🙏');
          btn.disabled = false;
          btn.textContent = 'Submit Review';
          return;
        }
        return db.collection('reviews').add({
          uid:       visitor.uid,
          name:      visitor.fullName || visitor.firstName,
          firstName: visitor.firstName,
          avatar:    visitor.avatar || '',
          stars:     stars,
          text:      text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(function (ref) {
        if (!ref) return; /* already reviewed case */
        document.getElementById('rmSuccess').style.display = 'block';
        document.getElementById('rmSuccess').textContent = 'Thank you for your review! 🎉';
        btn.textContent = 'Submitted ✓';
        setTimeout(function () {
          closeReviewModal();
          loadAndDisplayReviews();
        }, 1800);
      })
      .catch(function (err) {
        console.error('Review submit error:', err);
        showRmError('Something went wrong. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Submit Review';
      });
  }

  function showRmError(msg) {
    var el = document.getElementById('rmError');
    if (el) { el.style.display = 'block'; el.textContent = msg; }
  }

  function starsHTML(n) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += i <= n ? '⭐' : '☆';
    return s;
  }

  function timeAgo(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    var diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  function loadAndDisplayReviews() {
    if (!db) return;
    var grid = document.getElementById('rvGrid');
    var avgScore = document.getElementById('rvAvgScore');
    var avgStars = document.getElementById('rvAvgStars');
    var avgCount = document.getElementById('rvAvgCount');
    if (!grid) return;

    grid.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:0.85rem;padding:20px;">Loading reviews…</div>';

    db.collection('reviews').orderBy('createdAt', 'desc').limit(20).get()
      .then(function (snap) {
        if (snap.empty) {
          grid.innerHTML = '<div class="rv-empty">No reviews yet — be the first! 🌟</div>';
          if (avgScore) avgScore.textContent = '—';
          if (avgStars) avgStars.textContent = '☆☆☆☆☆';
          if (avgCount) avgCount.textContent = '0 reviews';
          return;
        }

        var total = 0, count = 0;
        var html = '';
        snap.forEach(function (doc) {
          var r = doc.data();
          total += r.stars;
          count++;
          html += `
            <div class="rv-card">
              <div class="rv-card-header">
                <img class="rv-card-avatar" src="${r.avatar || ''}" alt="${r.firstName}" onerror="this.src='';this.style.background='rgba(0,255,255,0.15)'">
                <div>
                  <div class="rv-card-name">${r.firstName || 'Visitor'}</div>
                  <div class="rv-card-date">${timeAgo(r.createdAt)}</div>
                </div>
              </div>
              <div class="rv-card-stars">${starsHTML(r.stars)}</div>
              <div class="rv-card-text">${escapeHTML(r.text)}</div>
            </div>
          `;
        });

        var avg = count > 0 ? (total / count).toFixed(1) : '—';
        if (avgScore) avgScore.textContent = avg;
        if (avgStars) avgStars.textContent = starsHTML(Math.round(total / count));
        if (avgCount) avgCount.textContent = count + ' review' + (count !== 1 ? 's' : '');
        grid.innerHTML = html;
      })
      .catch(function (err) {
        console.error('Load reviews error:', err);
        grid.innerHTML = '<div class="rv-empty">Could not load reviews.</div>';
      });
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Find existing testimonials/rating section and replace or append */
  function replaceRatingSection() {
    /* Look for existing testimonials section */
    var existing = document.querySelector('.testimonials') ||
                   document.querySelector('#testimonials') ||
                   document.querySelector('[class*="rating"]') ||
                   document.querySelector('[id*="rating"]');

    var section = document.createElement('section');
    section.id = 'reviewSection';
    section.innerHTML = `
      <div class="rv-eyebrow">Visitor Feedback</div>
      <h2 class="rv-title">⭐ What People Say</h2>
      <p class="rv-sub">Real reviews from real visitors — no fakes here.</p>

      <div class="rv-average">
        <div class="rv-avg-score" id="rvAvgScore">—</div>
        <div class="rv-avg-right">
          <div class="rv-avg-stars" id="rvAvgStars">☆☆☆☆☆</div>
          <div class="rv-avg-count" id="rvAvgCount">0 reviews</div>
        </div>
      </div>

      <div id="rvLoginHint" class="rv-login-hint" style="display:none;">
        <span onclick="window.openLoginModal && window.openLoginModal()">Sign in</span> to leave a review
      </div>

      <button class="rv-write-btn" id="rvWriteBtn" onclick="window.openReviewModal()">
        ✍️ Write a Review
      </button>

      <div class="rv-grid" id="rvGrid">
        <div style="color:rgba(255,255,255,0.3);font-size:0.85rem;padding:20px;">Loading…</div>
      </div>
    `;

    if (existing) {
      existing.parentNode.replaceChild(section, existing);
    } else {
      /* Append before footer */
      var footer = document.querySelector('footer');
      if (footer) footer.parentNode.insertBefore(section, footer);
      else document.body.appendChild(section);
    }

    /* Show/hide write button based on login state */
    updateReviewBtn();
  }

  function updateReviewBtn() {
    var btn = document.getElementById('rvWriteBtn');
    var hint = document.getElementById('rvLoginHint');
    var visitor = getVisitor();
    if (btn) btn.style.display = visitor ? 'inline-flex' : 'none';
    if (hint) hint.style.display = visitor ? 'none' : 'block';
  }

  /* Listen for auth changes to update button */
  document.addEventListener('shnz:authChanged', updateReviewBtn);


  /* ══════════════════════════════════════════════════════
     2. 💬 PERSISTENT CHAT HISTORY
     ══════════════════════════════════════════════════════ */
  function initChatHistory() {
    /* Intercept chat send to save messages */
    patchChatForHistory();
  }

  function saveChatMessage(role, content) {
    var visitor = getVisitor();
    if (!visitor || !db) return;

    db.collection('chatHistory')
      .doc(visitor.uid)
      .collection('messages')
      .add({
        role:      role,   /* 'user' or 'bot' */
        content:   String(content).slice(0, 1000),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch(function (err) { console.warn('Chat save error:', err); });
  }
  window._saveChatMessage = saveChatMessage;

  function loadChatHistory(cb) {
    var visitor = getVisitor();
    if (!visitor || !db) { if (cb) cb([]); return; }

    db.collection('chatHistory')
      .doc(visitor.uid)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
      .then(function (snap) {
        var msgs = [];
        snap.forEach(function (doc) { msgs.unshift(doc.data()); });
        if (cb) cb(msgs);
      })
      .catch(function () { if (cb) cb([]); });
  }
  window._loadChatHistory = loadChatHistory;

  /* Patch the existing chat widget to save messages automatically */
  function patchChatForHistory() {
    /* Wait for chat widget to exist */
    var attempts = 0;
    var iv = setInterval(function () {
      var sendBtn = document.getElementById('chatSendBtn') ||
                    document.querySelector('[id*="send"]') ||
                    document.querySelector('.chat-send');
      var input   = document.getElementById('chatInput') ||
                    document.querySelector('[id*="chatInput"]') ||
                    document.querySelector('.chat-input input, .chat-input textarea');

      if (sendBtn && input) {
        clearInterval(iv);
        /* Wrap original onclick */
        var origClick = sendBtn.onclick;
        sendBtn.addEventListener('click', function () {
          var msg = input.value.trim();
          if (msg) saveChatMessage('user', msg);
        }, true);

        /* Also save bot replies — watch for new bot messages */
        observeBotReplies();

      } else if (++attempts > 100) {
        clearInterval(iv);
      }
    }, 300);
  }

  function observeBotReplies() {
    var chatBody = document.getElementById('chatBody') ||
                   document.querySelector('.chat-body, .chat-messages, [id*="chatBody"]');
    if (!chatBody) return;

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          /* Check if it's a bot message */
          if (node.classList && (node.classList.contains('bot-msg') ||
              node.getAttribute('data-role') === 'bot' ||
              node.querySelector && node.querySelector('[data-role="bot"]'))) {
            var text = node.textContent || '';
            saveChatMessage('bot', text.trim().slice(0, 500));
          }
        });
      });
    });

    observer.observe(chatBody, { childList: true, subtree: true });
  }

  /* Show chat history button in chat widget */
  function injectHistoryBtn() {
    var chatHeader = document.querySelector('.chat-header, #chatHeader, [id*="chatHeader"]');
    if (!chatHeader || document.getElementById('chatHistoryBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'chatHistoryBtn';
    btn.title = 'View chat history';
    btn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:1.1rem;padding:4px;position:relative;';
    btn.innerHTML = '🕐<span id="chatHistoryBadge"></span>';
    btn.onclick = showChatHistoryPanel;
    chatHeader.appendChild(btn);
  }

  function showChatHistoryPanel() {
    var visitor = getVisitor();
    if (!visitor) { if (window.openLoginModal) window.openLoginModal(); return; }

    loadChatHistory(function (msgs) {
      var panel = document.getElementById('chatHistoryPanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'chatHistoryPanel';
        panel.style.cssText = `
          position:fixed;bottom:80px;right:20px;
          width:min(360px,calc(100vw-40px));
          max-height:400px;overflow-y:auto;
          background:linear-gradient(145deg,#0d1f2d,#0a1628);
          border:1px solid rgba(0,255,255,0.2);border-radius:16px;
          padding:16px;z-index:99998;
          box-shadow:0 20px 60px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(panel);
      }

      if (!msgs.length) {
        panel.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.85rem;padding:10px 0;">No chat history yet. Start a conversation! 💬</div>';
      } else {
        var html = '<div style="font-weight:700;color:#00ffff;margin-bottom:12px;font-size:0.9rem;">🕐 Recent Conversations</div>';
        msgs.slice(-10).forEach(function (m) {
          var isUser = m.role === 'user';
          html += `
            <div style="margin-bottom:10px;display:flex;gap:8px;align-items:flex-start;${isUser ? 'flex-direction:row-reverse;' : ''}">
              <div style="font-size:1.1rem;">${isUser ? '👤' : '🤖'}</div>
              <div style="
                background:${isUser ? 'rgba(0,255,255,0.1)' : 'rgba(255,255,255,0.05)'};
                border-radius:12px;padding:8px 12px;
                font-size:0.82rem;color:rgba(255,255,255,0.8);
                max-width:80%;line-height:1.5;
              ">${escapeHTML(m.content)}</div>
            </div>
          `;
        });
        panel.innerHTML = html;
      }

      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

      /* Close on outside click */
      setTimeout(function () {
        document.addEventListener('click', function closePnl(e) {
          if (!panel.contains(e.target)) {
            panel.style.display = 'none';
            document.removeEventListener('click', closePnl);
          }
        });
      }, 100);
    });
  }


  /* ══════════════════════════════════════════════════════
     3. 👍 PROJECT LIKES
     ══════════════════════════════════════════════════════ */
  function initProjectLikes() {
    /* Wait for project cards to render */
    var attempts = 0;
    var iv = setInterval(function () {
      var cards = document.querySelectorAll('.project-card, [class*="project-card"], [data-project]');
      if (cards.length > 0) {
        clearInterval(iv);
        injectLikeButtons(cards);
      } else if (++attempts > 50) {
        clearInterval(iv);
      }
    }, 300);
  }

  function injectLikeButtons(cards) {
    cards.forEach(function (card, idx) {
      if (card.querySelector('.proj-like-btn')) return; /* Already has button */

      /* Get project name from card */
      var nameEl = card.querySelector('h3, h4, .project-title, [class*="title"]');
      var projectId = 'project_' + idx;
      var projectName = nameEl ? nameEl.textContent.trim().slice(0, 40) : projectId;

      var btn = document.createElement('button');
      btn.className = 'proj-like-btn';
      btn.setAttribute('data-project', projectId);
      btn.setAttribute('data-project-name', projectName);
      btn.innerHTML = '<span class="like-icon">🤍</span> <span class="like-count">…</span>';
      btn.onclick = function () { handleLike(btn, projectId, projectName); };

      /* Append to card */
      card.appendChild(btn);

      /* Load current like count */
      loadLikeCount(btn, projectId);
    });
  }

  function loadLikeCount(btn, projectId) {
    if (!db) return;
    db.collection('projectLikes').doc(projectId).get()
      .then(function (doc) {
        var count = doc.exists ? (doc.data().count || 0) : 0;
        var countEl = btn.querySelector('.like-count');
        if (countEl) countEl.textContent = count === 0 ? 'Like' : count;

        /* Check if current user liked it */
        var visitor = getVisitor();
        if (visitor && doc.exists && doc.data().likedBy) {
          if (doc.data().likedBy.includes(visitor.uid)) {
            btn.classList.add('liked');
            btn.querySelector('.like-icon').textContent = '❤️';
          }
        }
      })
      .catch(function () {
        var countEl = btn.querySelector('.like-count');
        if (countEl) countEl.textContent = 'Like';
      });
  }

  function handleLike(btn, projectId, projectName) {
    var visitor = getVisitor();
    if (!visitor) {
      if (window.openLoginModal) window.openLoginModal();
      return;
    }
    if (!db) return;

    var isLiked = btn.classList.contains('liked');
    var ref = db.collection('projectLikes').doc(projectId);

    /* Optimistic UI update */
    var countEl = btn.querySelector('.like-count');
    var iconEl  = btn.querySelector('.like-icon');
    var current = parseInt(countEl.textContent) || 0;

    if (isLiked) {
      btn.classList.remove('liked');
      iconEl.textContent = '🤍';
      countEl.textContent = Math.max(0, current - 1) || 'Like';
    } else {
      btn.classList.add('liked');
      iconEl.textContent = '❤️';
      countEl.textContent = current + 1;
    }

    /* Update Firestore */
    ref.get().then(function (doc) {
      var data = doc.exists ? doc.data() : { count: 0, likedBy: [], name: projectName };
      var likedBy = data.likedBy || [];
      var count   = data.count || 0;

      if (isLiked) {
        likedBy = likedBy.filter(function (id) { return id !== visitor.uid; });
        count = Math.max(0, count - 1);
      } else {
        if (!likedBy.includes(visitor.uid)) {
          likedBy.push(visitor.uid);
          count++;
        }
      }

      return ref.set({ count: count, likedBy: likedBy, name: projectName }, { merge: true });
    }).catch(function (err) {
      console.error('Like error:', err);
      /* Revert optimistic update on error */
      loadLikeCount(btn, projectId);
    });
  }


  /* ══════════════════════════════════════════════════════
     INIT — wait for Firebase to be ready
     ══════════════════════════════════════════════════════ */
  function waitForFirebase() {
    if (window.firebase && window._firebaseAuth) {
      initFirestore();
    } else {
      setTimeout(waitForFirebase, 300);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    waitForFirebase();
  });

  /* Also re-run updateReviewBtn when visitor signs in/out */
  var origApply = window.applyVisitorSession;
  Object.defineProperty(window, 'applyVisitorSession', {
    set: function (fn) { origApply = fn; },
    get: function () {
      return function () {
        if (origApply) origApply.apply(this, arguments);
        updateReviewBtn && updateReviewBtn();
        injectHistoryBtn && injectHistoryBtn();
      };
    }
  });

})();
