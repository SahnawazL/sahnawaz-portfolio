/* ══════════════════════════════════════════════════════════
   visitor-auth.js — Google One Tap + Firebase Auth
   
   STRATEGY:
   - Google One Tap (GSI) for sign-in UI — works on ALL browsers
     including Chrome Android M115+, iOS Safari, desktop Chrome.
     No popups. No redirects. Native Google prompt on the page.
   - Firebase Auth used only to exchange the One Tap credential
     for a Firebase user session (googleCredential → signInWith)
   - Falls back to signInWithPopup on desktop if One Tap is
     dismissed or unavailable.
   ══════════════════════════════════════════════════════════ */

var GOOGLE_CLIENT_ID = '934946303611-fg64ivrlc0n2vj7gt1ccff7qpktidpnf.apps.googleusercontent.com';

var firebaseConfig = {
  apiKey:            "AIzaSyD_W0B6nINiyJf65r2N18kS7rrCrbzzfYM",
  authDomain:        "sahnawaz-portfolio.firebaseapp.com",
  projectId:         "sahnawaz-portfolio",
  storageBucket:     "sahnawaz-portfolio.firebasestorage.app",
  messagingSenderId: "934946303611",
  appId:             "1:934946303611:web:b3dbcf9199b8aa15c13cde"
};

var VISITOR_KEY = 'shnz_visitor_v1';

/* ── Detect Chrome on Android ───────────────────────────── */
function isChromeAndroid() {
  var ua = navigator.userAgent || '';
  return /Android/.test(ua) && /Chrome\//.test(ua) && !/Instagram|FBAN|FBAV|Twitter/.test(ua);
}

function saveVisitor(data) {
  try { localStorage.setItem(VISITOR_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadVisitor() {
  try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); } catch(e) { return null; }
}
function clearVisitor() {
  try { localStorage.removeItem(VISITOR_KEY); } catch(e) {}
}

function openLoginModal() {
  var m = document.getElementById('loginModal');
  if (m) m.classList.add('open');
  var dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.remove('open');
  /* Trigger One Tap prompt when modal opens */
  if (window._oneTapReady) promptOneTap();
}
function closeLoginModal() {
  var m = document.getElementById('loginModal');
  if (m) m.classList.remove('open');
}
function toggleProfileDropdown() {
  var dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.toggle('open');
}

function applyVisitorSession(visitor, showBanner) {
  if (!visitor) return;
  var btn = document.getElementById('visitorLoginBtn');
  if (btn) {
    btn.classList.add('logged-in');
    btn.querySelector('.vl-label').textContent = visitor.firstName;
    var av = btn.querySelector('.vl-avatar');
    if (av && visitor.avatar) { av.src = visitor.avatar; av.style.display = 'inline-block'; }
    var icon = btn.querySelector('.vl-icon');
    if (icon) icon.style.display = 'none';
    var chev = btn.querySelector('.vl-chevron');
    if (chev) chev.style.display = 'inline';
    /* Mobile fix: use touchend for instant response — prevents race with
       document click listener that was closing the dropdown immediately. */
    btn.onclick = null;
    btn.ontouchend = function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleProfileDropdown();
    };
    btn.onclick = function(e) {
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      toggleProfileDropdown();
    };
  }
  var dd = document.getElementById('profileDropdown');
  if (dd) {
    var ddAv    = dd.querySelector('.pd-avatar');
    var ddName  = dd.querySelector('.pd-name');
    var ddEmail = dd.querySelector('.pd-email');
    if (ddAv && visitor.avatar) ddAv.src = visitor.avatar;
    if (ddName)  ddName.textContent  = visitor.fullName || visitor.firstName;
    if (ddEmail) ddEmail.textContent = visitor.email || '';
  }
  window._pendingVisitorName = visitor.firstName;
  window._chatVisitorName    = visitor.firstName;
  if (window.setVisitorName) window.setVisitorName(visitor.firstName);
  if (showBanner) showWelcomeBanner(visitor);
}

function showWelcomeBanner(visitor) {
  var banner = document.getElementById('loginWelcomeBanner');
  if (!banner) return;
  var nameEl = banner.querySelector('.wb-name');
  var avEl   = banner.querySelector('.wb-avatar');
  if (nameEl) nameEl.textContent = 'Hey ' + visitor.firstName + '! 👋';
  if (avEl && visitor.avatar) avEl.src = visitor.avatar;
  banner.style.display    = 'block';
  banner.style.opacity    = '1';
  banner.style.transition = '';
  setTimeout(function() {
    banner.style.transition = 'opacity 0.6s ease';
    banner.style.opacity    = '0';
    setTimeout(function() { banner.style.display = 'none'; }, 600);
  }, 4000);
}

function signOut() {
  clearVisitor();
  if (window._firebaseAuth) window._firebaseAuth.signOut().catch(function(){});
  /* Cancel One Tap and revoke token so it never gets stuck post-logout */
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
    /* Revoke the Google token — prevents the gsi/tr blank page bug */
    if (window.google.accounts.oauth2) {
      try { window.google.accounts.oauth2.revoke('', function(){}); } catch(e) {}
    }
  }
  /* Clear any stuck GSI iframe cookies via a quick fetch */
  try { fetch('https://accounts.google.com/o/oauth2/revoke?token=', { mode: 'no-cors' }); } catch(e) {}
  var btn = document.getElementById('visitorLoginBtn');
  if (btn) {
    btn.classList.remove('logged-in');
    btn.querySelector('.vl-label').textContent = 'Sign In';
    var av = btn.querySelector('.vl-avatar');
    if (av) { av.src = ''; av.style.display = 'none'; }
    var icon = btn.querySelector('.vl-icon');
    if (icon) icon.style.display = 'inline';
    var chev = btn.querySelector('.vl-chevron');
    if (chev) chev.style.display = 'none';
    btn.onclick = openLoginModal;
  }
  var dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.remove('open');
  window._pendingVisitorName = null;
  window._chatVisitorName    = null;
}

function visitorFromUser(u) {
  return {
    firstName: u.displayName ? u.displayName.split(' ')[0] : 'Friend',
    fullName:  u.displayName || '',
    email:     u.email || '',
    avatar:    u.photoURL || '',
    uid:       u.uid,
    loginAt:   Date.now()
  };
}

/* ── Called after Firebase signs in (any method) ───────── */
function onSignInSuccess(firebaseUser, showBanner) {
  var visitor = visitorFromUser(firebaseUser);
  saveVisitor(visitor);
  closeLoginModal();
  applyVisitorSession(visitor, showBanner !== false);
}

/* ── One Tap credential callback ────────────────────────── */
function handleOneTapCredential(response) {
  if (!response || !response.credential) return;
  var auth = window._firebaseAuth;
  if (!auth) return;

  /* Exchange Google JWT for Firebase session */
  var credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
  auth.signInWithCredential(credential)
    .then(function(result) {
      onSignInSuccess(result.user, true);
    })
    .catch(function(err) {
      console.error('One Tap Firebase error:', err.code, err.message);
    });
}
window._handleOneTapCredential = handleOneTapCredential;

/* ── Prompt One Tap ─────────────────────────────────────── */
function promptOneTap() {
  if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
  window.google.accounts.id.prompt(function(notification) {
    /* If One Tap is suppressed/skipped on Chrome Android,
       the modal button fallback handles it */
    if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
      console.log('One Tap dismissed:', notification.getDismissedReason
        ? notification.getDismissedReason() : '');
    }
  });
}

function injectHTML() {
  /* ── Inject pill styles ─────────────────────────────────── */
  if (!document.getElementById('vlStyles')) {
    var st = document.createElement('style');
    st.id = 'vlStyles';
    st.textContent = `
      /* ── Visitor pill wrapper — fixed top-right ── */
      #vlPillWrap {
        position: fixed;
        top: 14px;
        right: 16px;
        z-index: 99999;
      }

      /* ── The pill button ── */
      #visitorLoginBtn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px 8px 10px;
        border-radius: 50px;
        background: rgba(0, 10, 20, 0.75);
        border: 1.5px solid rgba(0, 255, 255, 0.45);
        color: #00ffff;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        letter-spacing: 0.3px;
        box-shadow: 0 0 12px rgba(0,255,255,0.12), 0 2px 12px rgba(0,0,0,0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        min-height: 42px;
        min-width: 42px;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      #visitorLoginBtn:hover {
        border-color: rgba(0,255,255,0.8);
        box-shadow: 0 0 20px rgba(0,255,255,0.25), 0 4px 16px rgba(0,0,0,0.5);
        background: rgba(0,255,255,0.06);
      }
      #visitorLoginBtn.logged-in {
        padding: 6px 14px 6px 6px;
        border-color: rgba(0,255,255,0.5);
      }

      /* Avatar inside pill */
      #visitorLoginBtn .vl-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        border: 1.5px solid rgba(0,255,255,0.5);
        display: none;
        flex-shrink: 0;
      }

      /* Key icon */
      #visitorLoginBtn .vl-icon {
        font-size: 0.95rem;
        line-height: 1;
      }

      /* Name label */
      #visitorLoginBtn .vl-label {
        max-width: 90px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Chevron shown when logged in */
      #visitorLoginBtn .vl-chevron {
        font-size: 0.6rem;
        opacity: 0.6;
        margin-left: 2px;
        transition: transform 0.2s;
        display: none;
      }
      #visitorLoginBtn.logged-in .vl-chevron { display: inline; }

      /* ── Profile dropdown ── */
      #profileDropdown {
        position: fixed;
        top: 64px;
        right: 16px;
        z-index: 99998;
        background: linear-gradient(145deg, #0a1f35, #061020);
        border: 1px solid rgba(0,255,255,0.2);
        border-radius: 18px;
        min-width: 220px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,255,255,0.06);
        overflow: hidden;
        opacity: 0;
        transform: translateY(-8px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      #profileDropdown.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }
      #profileDropdown::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,255,255,0.4), transparent);
      }
      .pd-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px 16px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .pd-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(0,255,255,0.35);
        flex-shrink: 0;
      }
      .pd-name {
        font-size: 0.88rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 2px;
      }
      .pd-email {
        font-size: 0.72rem;
        color: rgba(255,255,255,0.35);
        word-break: break-all;
      }
      .pd-signout {
        width: 100%;
        padding: 13px 16px;
        background: transparent;
        border: none;
        color: rgba(255,80,80,0.85);
        font-size: 0.83rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s, color 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      .pd-signout::before { content: "⏻"; font-size: 0.9rem; }
      .pd-signout:hover, .pd-signout:active {
        background: rgba(255,60,60,0.08);
        color: #ff6b6b;
      }
    `;
    document.head.appendChild(st);
  }

  /* ── Inject the pill into a fixed wrapper ───────────────── */
  if (!document.getElementById('visitorLoginBtn')) {
    var wrap = document.createElement('div');
    wrap.id  = 'vlPillWrap';
    wrap.innerHTML =
      '<button id="visitorLoginBtn">' +
        '<img class="vl-avatar" src="" alt="">' +
        '<span class="vl-icon">🔑</span>' +
        '<span class="vl-label">Sign In</span>' +
        '<span class="vl-chevron">▼</span>' +
      '</button>';
    document.body.appendChild(wrap);
    document.getElementById('visitorLoginBtn').onclick = openLoginModal;
  }

  if (!document.getElementById('loginModal')) {
    var modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div id="loginCard">' +
        '<button id="loginModalClose" aria-label="Close">✕</button>' +
        '<span class="lm-emoji">🧑\u200d💻</span>' +
        '<div class="lm-title">Welcome to Sahnawaz\'s Portfolio</div>' +
        '<div class="lm-subtitle">Sign in to get a personalised experience,<br>leave a review, and chat by name.</div>' +

        /* Google One Tap renders its own button here on Chrome Android */
        '<div id="oneTapBtnWrap" style="display:flex;justify-content:center;margin-bottom:20px;">' +
          '<div id="g_id_signin"></div>' +
        '</div>' +

        /* Fallback standard button — used on desktop / iOS */
        '<div id="googleBtnWrap" style="display:flex;justify-content:center;margin-bottom:20px;">' +
          '<button id="googleSignInBtn" style="' +
            'display:inline-flex;align-items:center;gap:10px;padding:11px 24px;border-radius:40px;' +
            'background:#fff;color:#3c4043;border:1px solid #dadce0;' +
            'font-size:0.9rem;font-weight:600;cursor:pointer;font-family:inherit;' +
            'box-shadow:0 1px 4px rgba(0,0,0,0.2);">' +
            '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
            'Continue with Google' +
          '</button>' +
        '</div>' +

        '<div class="lm-divider">OR</div>' +
        '<button class="lm-skip">Continue without signing in →</button>' +
        '<div class="lm-privacy">Your Google profile is stored only on this device.<br>' +
          '<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('loginModalClose').onclick = closeLoginModal;
    document.querySelector('.lm-skip').onclick = closeLoginModal;
    modal.addEventListener('click', function(e) { if (e.target === modal) closeLoginModal(); });
  }

  if (!document.getElementById('loginWelcomeBanner')) {
    var banner = document.createElement('div');
    banner.id = 'loginWelcomeBanner';
    banner.innerHTML = '<div class="wb-row"><img class="wb-avatar" src="" alt=""><div><span class="wb-name">Hey there! 👋</span><span class="wb-sub">Welcome to the portfolio 🎉</span></div></div>';
    document.body.appendChild(banner);
  }

  if (!document.getElementById('profileDropdown')) {
    var dd = document.createElement('div');
    dd.id = 'profileDropdown';
    dd.innerHTML =
      '<div class="pd-header"><img class="pd-avatar" src="" alt=""><div><div class="pd-name">Visitor</div><div class="pd-email"></div></div></div>' +
      '<button class="pd-signout">Sign Out</button>';
    document.body.appendChild(dd);
    dd.querySelector('.pd-signout').onclick = signOut;
  }

  /* Fix: b.contains() catches taps on avatar/label inside the pill.
     touchstart closes dropdown on outside tap without racing the button. */
  function _outsideHandler(e) {
    var d = document.getElementById('profileDropdown');
    var b = document.getElementById('visitorLoginBtn');
    if (d && d.classList.contains('open') && !d.contains(e.target) && !b.contains(e.target)) {
      d.classList.remove('open');
    }
  }
  document.addEventListener('touchstart', _outsideHandler, { passive: true });
  document.addEventListener('click', _outsideHandler);
}

function loadScript(src, cb) {
  var s = document.createElement('script');
  s.src = src;
  s.onload = cb;
  s.onerror = function() { console.error('Failed to load: ' + src); };
  document.head.appendChild(s);
}

function initOneTap() {
  /* Load Google Identity Services script */
  loadScript('https://accounts.google.com/gsi/client', function() {
    window.google.accounts.id.initialize({
      client_id:         GOOGLE_CLIENT_ID,
      callback:          window._handleOneTapCredential,
      auto_select:       true,   /* Auto-sign in returning users */
      cancel_on_tap_outside: false
    });

    /* Render a standard Google Sign-In button inside the modal
       as the primary CTA on Chrome Android */
    var signinDiv = document.getElementById('g_id_signin');
    if (signinDiv) {
      window.google.accounts.id.renderButton(signinDiv, {
        type:  'standard',
        shape: 'pill',
        theme: 'outline',
        text:  'continue_with',
        size:  'large',
        logo_alignment: 'left'
      });
    }

    window._oneTapReady = true;

    /* Show One Tap prompt automatically (floating card from Google) */
    promptOneTap();
  });
}

function initFirebase() {
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', function() {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js', function() {

      firebase.initializeApp(firebaseConfig);
      var auth     = firebase.auth();
      var provider = new firebase.auth.GoogleAuthProvider();
      window._firebaseAuth = auth;

      /* ── Fallback button (desktop / iOS popup) ─────────────── */
      var googleBtn = document.getElementById('googleSignInBtn');
      if (googleBtn) {
        googleBtn.onclick = function() {
          googleBtn.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Connecting…';
          googleBtn.disabled = true;

          if (isChromeAndroid()) {
            /* On Android: use redirect — avoids the gsi/tr blank page bug entirely.
               signInWithRedirect navigates away then comes back with the session. */
            auth.signInWithRedirect(provider).catch(function(err) {
              console.error('Redirect error:', err.code);
              googleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Try Again';
              googleBtn.disabled = false;
            });
          } else {
            /* Desktop / iOS: popup works fine */
            auth.signInWithPopup(provider)
              .then(function(result) {
                onSignInSuccess(result.user, true);
              })
              .catch(function(err) {
                console.error('Popup error:', err.code);
                googleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google';
                googleBtn.disabled = false;
              });
          }
        };
      }

      /* ── Handle redirect result (Android signInWithRedirect) ── */
      auth.getRedirectResult().then(function(result) {
        if (result && result.user) {
          onSignInSuccess(result.user, true);
        }
      }).catch(function(err) {
        if (err.code !== 'auth/no-auth-event') {
          console.error('Redirect result error:', err.code);
        }
      });

      /* ── Restore session on every page load ────────────────── */
      auth.onAuthStateChanged(function(user) {
        if (user) {
          var saved = loadVisitor();
          if (!saved) {
            var visitor = visitorFromUser(user);
            saveVisitor(visitor);
            applyVisitorSession(visitor, false);
          } else {
            applyVisitorSession(saved, false);
          }
        }
      });

      /* ── Init One Tap after Firebase is ready ──────────────── */
      initOneTap();

    });
  });
}

window.setVisitorName  = window.setVisitorName || function(name) {
  window._pendingVisitorName = name;
  window._chatVisitorName    = name;
};
window.openLoginModal  = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.signOut         = signOut;

document.addEventListener('DOMContentLoaded', function() {
  injectHTML();
  var saved = loadVisitor();
  if (saved) applyVisitorSession(saved, false);
  initFirebase();
});
