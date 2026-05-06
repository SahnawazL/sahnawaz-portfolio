/* ══════════════════════════════════════════════════════════
   engagement.js — Premium Firestore Features
   Reviews · Chat History · Project Likes
   Works on: .pwork-entry (Work Experience) + .mpj-card (My Projects)
   ══════════════════════════════════════════════════════════ */
(function () {

  var db = null;

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    s.onerror = function () { console.error('Failed:', src); };
    document.head.appendChild(s);
  }

  function initFirestore() {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js', function () {
      db = firebase.firestore();
      window._firestoreDB = db;
      injectStyles();
      injectReviewModal();
      initReviewSection();
      initProjectLikes();
      initMpjLikes();
      initChatHistory();
      initResumeLogger();
    });
  }

  function getVisitor() {
    try { return JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); } catch(e) { return null; }
  }

  /* ══════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════ */
  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = `
    /* ── Review Cards ── */
    @keyframes rvScorePop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .rv-card {
      background: rgba(0,255,255,0.03);
      border: 1px solid rgba(0,255,255,0.08);
      border-radius: 12px;
      padding: 12px 14px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.25s, box-shadow 0.25s;
      cursor: default;
      animation: rvCardIn 0.4s ease both;
    }
    @keyframes rvCardIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .rv-card:hover {
      border-color: rgba(0,255,255,0.2);
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .rv-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .rv-card-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid rgba(0,255,255,0.25);
      background: rgba(0,255,255,0.08);
      flex-shrink: 0;
    }
    .rv-card-name { font-weight: 700; color: #fff; font-size: 0.8rem; }
    .rv-card-date { font-size: 0.65rem; color: rgba(255,255,255,0.28); margin-top: 1px; }
    .rv-card-stars { font-size: 0.75rem; margin-bottom: 5px; letter-spacing: 1px; }
    .rv-card-text { font-size: 0.78rem; color: rgba(255,255,255,0.55); line-height: 1.55; }
    .rv-quote-icon {
      position: absolute;
      top: 8px; right: 10px;
      font-size: 1.4rem;
      color: rgba(0,255,255,0.05);
      line-height: 1;
    }
    .rv-empty {
      color: rgba(255,255,255,0.3);
      font-size: 0.9rem;
      padding: 40px 20px;
      border: 1px dashed rgba(255,255,255,0.08);
      border-radius: 20px;
      grid-column: 1/-1;
      text-align: center;
    }
    .rv-login-hint {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.35);
      margin-bottom: 20px;
    }
    .rv-login-hint span {
      color: #00ffff; cursor: pointer;
      text-decoration: underline;
    }

    /* ── Review Modal ── */
    #reviewModal {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 999999;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(8px);
      animation: rmBgIn 0.3s ease;
    }
    @keyframes rmBgIn { from { opacity: 0; } to { opacity: 1; } }
    #reviewModal.open { display: flex; }
    #reviewCard {
      background: linear-gradient(145deg, #0d2035, #081525);
      border: 1px solid rgba(0,255,255,0.2);
      border-radius: 28px;
      padding: 36px 30px;
      width: 100%; max-width: 480px;
      position: relative;
      box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,255,255,0.05);
      animation: rmCardIn 0.4s cubic-bezier(.34,1.56,.64,1) both;
    }
    @keyframes rmCardIn {
      0% { transform: scale(0.85) translateY(30px); opacity: 0; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    #reviewCard::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent);
      border-radius: 28px 28px 0 0;
    }
    .rm-close {
      position: absolute; top: 18px; right: 18px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      font-size: 1rem; cursor: pointer;
      padding: 6px 10px; border-radius: 50%;
      font-family: inherit;
      transition: all 0.2s;
    }
    .rm-close:hover { color: #fff; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }
    .rm-emoji { font-size: 2.5rem; display: block; margin-bottom: 10px; }
    .rm-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .rm-sub { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-bottom: 28px; }

    /* Star picker */
    .rm-stars {
      display: flex; gap: 10px;
      justify-content: center;
      margin-bottom: 24px;
    }
    .rm-star {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, border-color 0.2s, background 0.2s;
      user-select: none;
    }
    .rm-star:hover, .rm-star.active {
      transform: scale(1.3) translateY(-4px);
      border-color: rgba(0,255,255,0.7);
      background: rgba(0,255,255,0.1);
      box-shadow: 0 0 20px rgba(0,255,255,0.4);
    }
    .rm-star.active { animation: starPop 0.3s cubic-bezier(.34,1.56,.64,1); }
    @keyframes starPop { 0% { transform: scale(0.8); } 60% { transform: scale(1.4) translateY(-4px); } 100% { transform: scale(1.3) translateY(-4px); } }

    /* Textarea */
    .rm-textarea {
      width: 100%; min-height: 110px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(0,255,255,0.12);
      border-radius: 16px;
      color: #fff; font-size: 0.9rem;
      padding: 14px 16px; resize: vertical;
      font-family: inherit; box-sizing: border-box;
      margin-bottom: 20px; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      line-height: 1.6;
    }
    .rm-textarea:focus {
      border-color: rgba(0,255,255,0.4);
      box-shadow: 0 0 0 3px rgba(0,255,255,0.06);
    }
    .rm-textarea::placeholder { color: rgba(255,255,255,0.2); }

    /* Submit */
    .rm-submit {
      width: 100%; padding: 15px;
      border-radius: 50px;
      background: linear-gradient(135deg, #00ffff, #0066ff);
      color: #000; font-weight: 800; font-size: 0.95rem;
      border: none; cursor: pointer; font-family: inherit;
      position: relative; overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
      box-shadow: 0 4px 20px rgba(0,255,255,0.3);
    }
    .rm-submit::before {
      content: '';
      position: absolute; top: 0; left: -75%;
      width: 50%; height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent);
      transform: skewX(-20deg);
    }
    .rm-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,255,255,0.5); }
    .rm-submit:active:not(:disabled) { transform: scale(0.98); }
    .rm-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .rm-msg {
      margin-top: 12px; text-align: center;
      font-size: 0.85rem; border-radius: 10px;
      padding: 10px; display: none;
    }
    .rm-msg.error { background: rgba(255,80,80,0.1); color: #ff6b6b; border: 1px solid rgba(255,80,80,0.2); }
    .rm-msg.success { background: rgba(0,255,200,0.08); color: #00ffc8; border: 1px solid rgba(0,255,200,0.2); }

    /* ── My Projects like wrap ── */
    .mpj-like-wrap {
      display: flex;
      justify-content: center;
      padding-top: 0.9rem;
      margin-top: 0.6rem;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    /* ── Like Button ── */
    /* --like-color is set per card via JS to match brand accent */
    .proj-like-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 30px; padding: 6px 16px;
      color: rgba(255,255,255,0.45);
      font-size: 0.75rem; cursor: pointer;
      transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
      font-family: 'DM Sans', sans-serif;
      margin-top: 14px;
      position: relative; overflow: hidden;
    }
    .proj-like-btn:hover {
      border-color: var(--like-color, rgba(255,100,100,0.5));
      color: var(--like-color, rgba(255,150,150,0.9));
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .proj-like-btn.liked {
      background: rgba(255,255,255,0.06);
      border-color: var(--like-color, #ff6b6b);
      color: var(--like-color, #ff6b6b);
      box-shadow: 0 0 12px rgba(0,0,0,0.2);
    }
    .proj-like-btn .like-icon {
      font-size: 1rem;
      transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
      display: inline-block;
    }
    .proj-like-btn.liked .like-icon { transform: scale(1.3); }
    .proj-like-btn.pop .like-icon { animation: likePopAnim 0.4s cubic-bezier(.34,1.56,.64,1); }
    @keyframes likePopAnim { 0%{transform:scale(1)} 50%{transform:scale(1.8)} 100%{transform:scale(1.3)} }

    /* ── Ripple on click ── */
    .rv-ripple {
      position: absolute; border-radius: 50%;
      background: rgba(0,255,255,0.2);
      transform: scale(0); animation: rippleAnim 0.6s ease-out;
      pointer-events: none;
    }
    @keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════
     REVIEW MODAL
     ══════════════════════════════════════════════════════ */
  function injectReviewModal() {
    if (document.getElementById('reviewModal')) return;
    var m = document.createElement('div');
    m.id = 'reviewModal';
    m.innerHTML = `
      <div id="reviewCard">
        <button class="rm-close" id="rmClose">✕</button>
        <span class="rm-emoji">⭐</span>
        <div class="rm-title">Leave a Review</div>
        <div class="rm-sub">How was your experience? Takes 30 seconds.</div>
        <div class="rm-stars" id="rmStars">
          <div class="rm-star" data-val="1">⭐</div>
          <div class="rm-star" data-val="2">⭐</div>
          <div class="rm-star" data-val="3">⭐</div>
          <div class="rm-star" data-val="4">⭐</div>
          <div class="rm-star" data-val="5">⭐</div>
        </div>
        <textarea class="rm-textarea" id="rmText" placeholder="What did you love? What could be better? (min 10 chars)" maxlength="400"></textarea>
        <button class="rm-submit" id="rmSubmit">✨ Submit Review</button>
        <div class="rm-msg error" id="rmError"></div>
        <div class="rm-msg success" id="rmSuccess"></div>
      </div>
    `;
    document.body.appendChild(m);

    document.getElementById('rmClose').onclick = closeReviewModal;
    m.addEventListener('click', function(e){ if(e.target===m) closeReviewModal(); });

    /* Star picker with ripple */
    var sel = 0;
    var stars = m.querySelectorAll('.rm-star');
    stars.forEach(function(star){
      star.addEventListener('click', function(){
        sel = parseInt(star.getAttribute('data-val'));
        stars.forEach(function(s,i){ s.classList.toggle('active', i < sel); });
        /* Ripple effect */
        addRipple(star, event);
      });
      star.addEventListener('mouseenter', function(){
        var v = parseInt(star.getAttribute('data-val'));
        stars.forEach(function(s,i){ s.classList.toggle('active', i < v); });
      });
      star.addEventListener('mouseleave', function(){
        stars.forEach(function(s,i){ s.classList.toggle('active', i < sel); });
      });
    });

    document.getElementById('rmSubmit').onclick = function(e){
      addRipple(this, e);
      submitReview(sel);
    };
  }

  function addRipple(el, e) {
    var r = document.createElement('span');
    r.className = 'rv-ripple';
    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = ((e ? e.clientX : rect.left+rect.width/2) - rect.left - size/2) + 'px';
    r.style.top  = ((e ? e.clientY : rect.top+rect.height/2) - rect.top  - size/2) + 'px';
    el.style.position = 'relative';
    el.appendChild(r);
    setTimeout(function(){ r.remove(); }, 600);
  }

  function openReviewModal() {
    if (!getVisitor()) { if(window.openLoginModal) window.openLoginModal(); return; }
    document.getElementById('reviewModal').classList.add('open');
    document.getElementById('rmError').style.display = 'none';
    document.getElementById('rmSuccess').style.display = 'none';
    document.getElementById('rmText').value = '';
    document.querySelectorAll('.rm-star').forEach(function(s){ s.classList.remove('active'); });
  }
  window.openReviewModal = openReviewModal;

  function closeReviewModal() {
    var m = document.getElementById('reviewModal');
    if(m) m.classList.remove('open');
  }

  function submitReview(stars) {
    var visitor = getVisitor();
    if (!visitor) { openReviewModal(); return; }
    if (!stars) { showRmMsg('error','Please tap a star rating first ⭐'); return; }
    var text = (document.getElementById('rmText').value||'').trim();
    if (text.length < 10) { showRmMsg('error','Please write at least 10 characters 📝'); return; }
    if (!db) { showRmMsg('error','Database not ready. Try again in a moment.'); return; }

    var btn = document.getElementById('rmSubmit');
    btn.disabled = true; btn.textContent = 'Submitting…';

    db.collection('reviews').where('uid','==',visitor.uid).get()
      .then(function(snap){
        if (!snap.empty) {
          showRmMsg('error','You already submitted a review — thank you! 🙏');
          btn.disabled = false; btn.textContent = '✨ Submit Review';
          return Promise.resolve(null);
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
      .then(function(ref){
        if (!ref) return;
        showRmMsg('success','Thank you! Your review is live 🎉');
        btn.textContent = '✓ Submitted!';
        setTimeout(function(){
          closeReviewModal();
          loadReviews();
        }, 1800);
      })
      .catch(function(err){
        console.error(err);
        showRmMsg('error','Something went wrong. Please try again.');
        btn.disabled = false; btn.textContent = '✨ Submit Review';
      });
  }

  function showRmMsg(type, msg) {
    var el = document.getElementById(type === 'error' ? 'rmError' : 'rmSuccess');
    var hide = document.getElementById(type === 'error' ? 'rmSuccess' : 'rmError');
    if(el){ el.style.display = 'block'; el.textContent = msg; }
    if(hide) hide.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════
     REVIEW SECTION
     ══════════════════════════════════════════════════════ */
  function initReviewSection() {
    loadReviews();
    updateReviewUI();
  }

  function updateReviewUI() {
    var visitor = getVisitor();
    var btn  = document.getElementById('rvWriteBtn');
    var hint = document.getElementById('rvLoginHint');
    if (btn)  btn.style.display  = visitor ? 'inline-flex' : 'none';
    /* Also update login hint visibility */
    if (hint) hint.style.display = visitor ? 'none' : 'block';
  }

  function starsHTML(n) {
    var s = '';
    for (var i=1;i<=5;i++) s += i<=n ? '⭐' : '<span style="opacity:0.2">☆</span>';
    return s;
  }

  function timeAgo(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    var diff = Math.floor((Date.now()-d)/1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60)+'m ago';
    if (diff < 86400) return Math.floor(diff/3600)+'h ago';
    if (diff < 2592000) return Math.floor(diff/86400)+'d ago';
    return d.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
  }

  function escHTML(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function loadReviews() {
    if (!db) return;
    var grid  = document.getElementById('rvGrid');
    var score = document.getElementById('rvAvgScore');
    var stars = document.getElementById('rvAvgStars');
    var count = document.getElementById('rvAvgCount');
    if (!grid) return;

    grid.innerHTML = '<div style="color:rgba(255,255,255,0.25);font-size:0.85rem;padding:30px;grid-column:1/-1;text-align:center;">Loading reviews…</div>';

    db.collection('reviews').orderBy('createdAt','desc').limit(20).get()
      .then(function(snap){
        if (snap.empty) {
          grid.innerHTML = '<div class="rv-empty">✨ No reviews yet — be the first to leave one!</div>';
          if(score) score.textContent = '—';
          if(stars) stars.innerHTML = '<span style="opacity:0.2">☆☆☆☆☆</span>';
          if(count) count.textContent = '0 reviews';
          return;
        }
        var total=0, cnt=0, html='';
        snap.forEach(function(doc,i){
          var r = doc.data();
          total += r.stars; cnt++;
          html += `
            <div class="rv-card" style="animation-delay:${i*0.07}s">
              <div class="rv-quote-icon">"</div>
              <div class="rv-card-header">
                <img class="rv-card-avatar" src="${escHTML(r.avatar||'')}" alt="${escHTML(r.firstName||'V')}"
                  onerror="this.style.background='rgba(0,255,255,0.1)';this.src=''">
                <div>
                  <div class="rv-card-name">${escHTML(r.firstName||'Visitor')}</div>
                  <div class="rv-card-date">${timeAgo(r.createdAt)}</div>
                </div>
              </div>
              <div class="rv-card-stars">${starsHTML(r.stars)}</div>
              <div class="rv-card-text">${escHTML(r.text)}</div>
            </div>`;
        });
        var avg = (total/cnt).toFixed(1);
        if(score) {
          score.textContent = avg;
          score.style.animation = 'none';
          void score.offsetWidth;
          score.style.animation = 'rvScorePop 0.6s cubic-bezier(.34,1.56,.64,1) both';
        }
        if(stars) stars.innerHTML = starsHTML(Math.round(total/cnt));
        if(count) count.textContent = cnt + ' review'+(cnt!==1?'s':'');
        grid.innerHTML = html;
      })
      .catch(function(err){
        console.error(err);
        grid.innerHTML = '<div class="rv-empty">Could not load reviews right now.</div>';
      });
  }

  /* ══════════════════════════════════════════════════════
     PROJECT LIKES
     Targets .pwork-entry (Work Experience timeline cards)
     Flipkart / Xiaomi / Rapido / Freelance
     Button sits at bottom of expanded .pwork-body-inner
     Brand color read from .pwork-node so it matches each card
     e.stopPropagation() prevents pworkToggle() collapsing the card
     ══════════════════════════════════════════════════════ */
  function initProjectLikes() {
    document.querySelectorAll('.pwork-entry').forEach(function(card, idx){
      injectLikeBtn(card, idx);
    });
    var projectSection = document.getElementById('pworkTimeline') ||
                         document.querySelector('.pwork-section') || document.body;
    var observer = new MutationObserver(function(){
      document.querySelectorAll('.pwork-entry').forEach(function(card, idx){
        injectLikeBtn(card, idx);
      });
    });
    observer.observe(projectSection, { childList: true, subtree: true });
  }

  function injectLikeBtn(entry, idx) {
    /* Already injected — skip */
    if (entry.querySelector('.proj-like-btn')) return;

    /* Button lives inside expanded body, not on the card header */
    var bodyInner = entry.querySelector('.pwork-body-inner');
    if (!bodyInner) return;

    /* Use company name as readable Firestore doc ID */
    var nameEl = entry.querySelector('.pwork-company');
    var pname  = nameEl ? nameEl.textContent.trim().slice(0, 40) : ('work_' + idx);
    var pid    = 'work_' + pname.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    /* Read brand color from the node dot so button matches card accent */
    var nodeEl     = entry.querySelector('.pwork-node');
    var brandColor = nodeEl ? (nodeEl.style.color || '#50d2ff') : '#50d2ff';

    var btn = document.createElement('button');
    btn.className = 'proj-like-btn';
    btn.setAttribute('data-pid', pid);
    btn.style.setProperty('--like-color', brandColor);
    btn.innerHTML = '<span class="like-icon">🤍</span><span class="like-count">Like</span>';

    /* stopPropagation prevents pworkToggle() collapsing card on like click */
    btn.onclick = function(e){
      e.stopPropagation();
      addRipple(btn, e);
      handleLike(btn, pid, pname);
    };

    bodyInner.appendChild(btn);
    fetchLikeCount(btn, pid);
  }

  function fetchLikeCount(btn, pid) {
    if (!db) return;
    db.collection('projectLikes').doc(pid).get()
      .then(function(doc){
        var cnt  = doc.exists ? (doc.data().count||0) : 0;
        var countEl = btn.querySelector('.like-count');
        if (countEl) countEl.textContent = cnt > 0 ? cnt : 'Like';
        var visitor = getVisitor();
        if (visitor && doc.exists && (doc.data().likedBy||[]).includes(visitor.uid)) {
          btn.classList.add('liked');
          btn.querySelector('.like-icon').textContent = '❤️';
        }
      }).catch(function(){});
  }

  function handleLike(btn, pid, pname) {
    var visitor = getVisitor();
    if (!visitor) { if(window.openLoginModal) window.openLoginModal(); return; }
    if (!db) return;

    var isLiked = btn.classList.contains('liked');
    var countEl = btn.querySelector('.like-count');
    var iconEl  = btn.querySelector('.like-icon');
    var cur     = parseInt(countEl.textContent) || 0;

    /* Optimistic UI */
    if (isLiked) {
      btn.classList.remove('liked');
      iconEl.textContent = '🤍';
      countEl.textContent = cur > 1 ? cur-1 : 'Like';
    } else {
      btn.classList.add('liked');
      btn.classList.add('pop');
      setTimeout(function(){ btn.classList.remove('pop'); }, 400);
      iconEl.textContent = '❤️';
      countEl.textContent = cur + 1;
    }

    db.collection('projectLikes').doc(pid).get()
      .then(function(doc){
        var data    = doc.exists ? doc.data() : {count:0, likedBy:[], name:pname};
        var likedBy = data.likedBy || [];
        var count   = data.count   || 0;
        if (isLiked) {
          likedBy = likedBy.filter(function(id){ return id!==visitor.uid; });
          count   = Math.max(0, count-1);
        } else {
          if (!likedBy.includes(visitor.uid)) { likedBy.push(visitor.uid); count++; }
        }
        return db.collection('projectLikes').doc(pid).set({count,likedBy,name:pname},{merge:true});
      })
      .catch(function(err){
        console.error(err);
        fetchLikeCount(btn, pid); /* revert */
      });
  }


  /* ══════════════════════════════════════════════════════
     MY PROJECTS LIKES
     Targets .mpj-card (My Projects section)
     Uses same Firestore projectLikes collection, getVisitor(),
     handleLike(), fetchLikeCount() — zero duplication
     ══════════════════════════════════════════════════════ */
  function initMpjLikes() {
    document.querySelectorAll('#my-projects .mpj-card').forEach(function(card, idx){
      injectMpjLikeBtn(card, idx);
    });
    /* MutationObserver: handles filter show/hide re-renders */
    var mpjSection = document.getElementById('my-projects') || document.body;
    var obs = new MutationObserver(function(){
      document.querySelectorAll('#my-projects .mpj-card').forEach(function(card, idx){
        injectMpjLikeBtn(card, idx);
      });
    });
    obs.observe(mpjSection, { childList: true, subtree: true });
  }

  function injectMpjLikeBtn(card, idx) {
    /* Skip if already injected */
    if (card.querySelector('.proj-like-btn')) return;

    /* Derive readable Firestore doc ID from project name */
    var nameEl = card.querySelector('.mpj-card-name');
    var pname  = nameEl ? nameEl.textContent.trim().slice(0, 40) : ('mpj_' + idx);
    var pid    = 'mpj_' + pname.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    /* Accent color — read from the top-bar gradient set via inline CSS var */
    var brandColor = '#00ffe7';

    /* Wrap + button — same class as pwork like btn so styles apply identically */
    var wrap = document.createElement('div');
    wrap.className = 'mpj-like-wrap';

    var btn = document.createElement('button');
    btn.className = 'proj-like-btn';
    btn.setAttribute('data-pid', pid);
    btn.style.setProperty('--like-color', brandColor);
    btn.innerHTML = '<span class="like-icon">\uD83E\uDD0D</span><span class="like-count">Like</span>';

    btn.onclick = function(e) {
      e.stopPropagation();
      addRipple(btn, e);
      handleLike(btn, pid, pname);
    };

    wrap.appendChild(btn);

    /* Insert before .mpj-card-meta (the bottom links row) */
    var meta = card.querySelector('.mpj-card-meta');
    if (meta) {
      card.insertBefore(wrap, meta);
    } else {
      card.appendChild(wrap);
    }

    fetchLikeCount(btn, pid);
  }

  /* ══════════════════════════════════════════════════════
     CHAT HISTORY
     ══════════════════════════════════════════════════════ */
  function initChatHistory() {
    window._saveChatMessage = function(role, content) {
      var visitor = getVisitor();
      if (!visitor || !db) return;
      db.collection('chatHistory').doc(visitor.uid)
        .collection('messages').add({
          role, content: String(content).slice(0,800),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(){});
    };

    window._loadChatHistory = function(cb) {
      var visitor = getVisitor();
      if (!visitor || !db) { if(cb) cb([]); return; }
      db.collection('chatHistory').doc(visitor.uid)
        .collection('messages')
        .orderBy('createdAt','desc').limit(20).get()
        .then(function(snap){
          var msgs = [];
          snap.forEach(function(doc){ msgs.unshift(doc.data()); });
          if(cb) cb(msgs);
        }).catch(function(){ if(cb) cb([]); });
    };

    /* Auto-patch chat send button */
    var tries = 0;
    var iv = setInterval(function(){
      var input = document.getElementById('chatInput') ||
                  document.querySelector('input[placeholder*="message"], textarea[placeholder*="message"]');
      var send  = document.getElementById('chatSend') ||
                  document.getElementById('chatSendBtn') ||
                  document.querySelector('button[id*="send"], button[class*="send"]');
      if (input && send) {
        clearInterval(iv);
        send.addEventListener('click', function(){
          var msg = input.value.trim();
          if (msg && window._saveChatMessage) window._saveChatMessage('user', msg);
        }, true);
        watchBotReplies();
      } else if (++tries > 100) clearInterval(iv);
    }, 300);
  }

  function watchBotReplies() {
    var body = document.getElementById('chatMessages') ||
               document.getElementById('chatBody') ||
               document.querySelector('.chat-messages, .chat-body');
    if (!body) return;
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(node){
          if (node.nodeType!==1) return;
          if (node.classList && node.classList.contains('chat-msg-wrap') && node.classList.contains('bot')) {
            var bubble = node.querySelector('.chat-msg.bot');
            var txt = (bubble ? bubble.textContent : node.textContent || '').trim();
            if (txt && txt.length > 5 && !txt.includes('thinking') && window._saveChatMessage) {
              window._saveChatMessage('bot', txt.slice(0, 500));
            }
          }
          if (node.classList && (node.classList.contains('bot-msg') || node.getAttribute('data-role')==='bot')) {
            var txt = (node.textContent||'').trim();
            if (txt && window._saveChatMessage) window._saveChatMessage('bot', txt.slice(0,500));
          }
        });
      });
    }).observe(body, {childList:true, subtree:true});
  }


  /* ══════════════════════════════════════════════════════
     RESUME DOWNLOAD LOGGER
     ══════════════════════════════════════════════════════ */
  function initResumeLogger() {
    window._logResumeDownload = function() {
      var visitor = getVisitor();
      if (!visitor || !db) return;
      db.collection('resumeDownloads').add({
        uid:          visitor.uid,
        name:         visitor.fullName || visitor.firstName || 'Unknown',
        firstName:    visitor.firstName || '',
        email:        visitor.email    || '',
        avatar:       visitor.avatar   || '',
        downloadedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function(err){ console.error('Resume log error:', err); });
    };

    /* Attach to download button — wait for DOM ready */
    function attachDownloadLog() {
      document.querySelectorAll('a[download], .rp-dl-btn[download], a[href*="export=download"]').forEach(function(el){
        if (el._resumeLogged) return;
        el._resumeLogged = true;
        el.addEventListener('click', function(){
          window._logResumeDownload && window._logResumeDownload();
        });
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachDownloadLog);
    } else {
      attachDownloadLog();
    }
  }

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  function waitForFirebase() {
    if (window.firebase && window._firebaseAuth) {
      initFirestore();
    } else {
      setTimeout(waitForFirebase, 300);
    }
  }

  /* Re-run UI updates when auth state changes */
  var _origApply = null;
  var _patchInterval = setInterval(function(){
    if (window.applyVisitorSession && !window._engagementPatched) {
      window._engagementPatched = true;
      clearInterval(_patchInterval);
      var orig = window.applyVisitorSession;
      window.applyVisitorSession = function(){
        orig.apply(this, arguments);
        setTimeout(updateReviewUI, 100);
        /* Also refresh like button states now that visitor is known */
        setTimeout(function(){
          document.querySelectorAll('.proj-like-btn').forEach(function(btn){
            var pid = btn.getAttribute('data-pid');
            if (pid) fetchLikeCount(btn, pid);
          });
        }, 200);
      };
    }
  }, 200);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForFirebase);
  } else {
    waitForFirebase();
  }

})();
