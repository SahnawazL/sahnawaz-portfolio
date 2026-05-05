/* ══════════════════════════════════════════════════════════
   visitor-auth.js — Google Sign-In via Firebase
   Sahnawaz Ahmed Laskar Portfolio
   ══════════════════════════════════════════════════════════
   WHAT THIS FILE DOES:
   1. Loads Firebase & Google Auth
   2. Injects "Sign In" button into header
   3. Shows login modal with Google button
   4. Saves visitor session to localStorage
   5. Greets visitor by name in chat
   6. Shows welcome banner after login
   7. Shows profile dropdown on button click
   ══════════════════════════════════════════════════════════ */

// ── Firebase config (already saved in Vercel env vars) ──────
// For frontend use, these are safe to be public
const firebaseConfig = {
  apiKey:            "AIzaSyD_W0B6nINiyJf65r2N18kS7rrCrbzzfYM",
  authDomain:        "sahnawaz-portfolio.firebaseapp.com",
  projectId:         "sahnawaz-portfolio",
  storageBucket:     "sahnawaz-portfolio.firebasestorage.app",
  messagingSenderId: "934946303611",
  appId:             "1:934946303611:web:b3dbcf9199b8aa15c13cde"
};

// ── Storage key ──────────────────────────────────────────────
const VISITOR_KEY = 'shnz_visitor_v1';

// ── Helpers ──────────────────────────────────────────────────
function saveVisitor(data) {
  try { localStorage.setItem(VISITOR_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadVisitor() {
  try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); } catch(e) { return null; }
}
function clearVisitor() {
  try { localStorage.removeItem(VISITOR_KEY); } catch(e) {}
}

// ── Open / Close Modal ───────────────────────────────────────
function openLoginModal() {
  document.getElementById('loginModal').classList.add('open');
  document.getElementById('profileDropdown').classList.remove('open');
}
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('open');
}

// ── Toggle profile dropdown ──────────────────────────────────
function toggleProfileDropdown() {
  const dd = document.getElementById('profileDropdown');
  dd.classList.toggle('open');
}

// ── Apply session to UI ──────────────────────────────────────
function applyVisitorSession(visitor, showBanner) {
  if (!visitor) return;

  // ① Update nav button
  const btn = document.getElementById('visitorLoginBtn');
  if (btn) {
    btn.classList.add('logged-in');
    btn.querySelector('.vl-label').textContent = visitor.firstName;
    const av = btn.querySelector('.vl-avatar');
    if (av && visitor.avatar) av.src = visitor.avatar;
    btn.onclick = toggleProfileDropdown;
  }

  // ② Update profile dropdown
  const dd = document.getElementById('profileDropdown');
  if (dd) {
    const ddAv = dd.querySelector('.pd-avatar');
    const ddName = dd.querySelector('.pd-name');
    const ddEmail = dd.querySelector('.pd-email');
    if (ddAv && visitor.avatar) ddAv.src = visitor.avatar;
    if (ddName) ddName.textContent = visitor.fullName || visitor.firstName;
    if (ddEmail) ddEmail.textContent = visitor.email || '';
  }

  // ③ Personalise chat greeting
  window._pendingVisitorName = visitor.firstName;
  if (window.setVisitorName) window.setVisitorName(visitor.firstName);

  // ④ Welcome banner
  if (showBanner) showWelcomeBanner(visitor);
}

// ── Welcome banner ───────────────────────────────────────────
function showWelcomeBanner(visitor) {
  const banner = document.getElementById('loginWelcomeBanner');
  if (!banner) return;
  const nameEl = banner.querySelector('.wb-name');
  const avEl   = banner.querySelector('.wb-avatar');
  if (nameEl) nameEl.textContent = 'Hey ' + visitor.firstName + '! 👋';
  if (avEl && visitor.avatar) avEl.src = visitor.avatar;
  banner.style.display = 'block';
  banner.style.opacity = '1';
  banner.style.transition = '';
  // Auto-hide after 4s
  setTimeout(function () {
    banner.style.transition = 'opacity 0.6s ease';
    banner.style.opacity = '0';
    setTimeout(function () { banner.style.display = 'none'; }, 600);
  }, 4000);
}

// ── Sign out ─────────────────────────────────────────────────
function signOut() {
  clearVisitor();
  // Sign out from Firebase too
  if (window._firebaseAuth) {
    window._firebaseAuth.signOut().catch(function(){});
  }
  // Reset nav button
  const btn = document.getElementById('visitorLoginBtn');
  if (btn) {
    btn.classList.remove('logged-in');
    btn.querySelector('.vl-label').textContent = 'Sign In';
    const av = btn.querySelector('.vl-avatar');
    if (av) av.src = '';
    btn.onclick = openLoginModal;
  }
  document.getElementById('profileDropdown').classList.remove('open');
  window._pendingVisitorName = null;
}

// ── Inject HTML into page ────────────────────────────────────
function injectHTML() {
  // ① Nav Sign In button — inject into header
  const header = document.querySelector('header .hdr-inner, header nav, header');
  if (header) {
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;justify-content:center;';
    btnWrap.innerHTML =
      '<button id="visitorLoginBtn" onclick="openLoginModal()">' +
        '<img class="vl-avatar" src="" alt="avatar">' +
        '<span class="vl-icon">🔑</span>' +
        '<span class="vl-label">Sign In</span>' +
      '</button>';
    header.appendChild(btnWrap);
  }

  // ② Login Modal
  const modal = document.createElement('div');
  modal.id = 'loginModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML =
    '<div id="loginCard">' +
      '<button id="loginModalClose" onclick="closeLoginModal()" aria-label="Close">✕</button>' +
      '<span class="lm-emoji">🧑‍💻</span>' +
      '<div class="lm-title">Welcome to Sahnawaz\'s Portfolio</div>' +
      '<div class="lm-subtitle">Sign in to get a personalised experience,<br>leave a review, and chat by name.</div>' +
      '<div id="googleBtnWrap">' +
        '<div id="g_id_onload"' +
          ' data-client_id="934946303611-placeholder.apps.googleusercontent.com"' +
          ' data-callback="handleFirebaseGoogleLogin"' +
          ' data-auto_prompt="false">' +
        '</div>' +
        '<div class="g_id_signin"' +
          ' data-type="standard"' +
          ' data-shape="pill"' +
          ' data-theme="filled_blue"' +
          ' data-text="continue_with"' +
          ' data-size="large"' +
          ' data-logo_alignment="left">' +
        '</div>' +
      '</div>' +
      '<div class="lm-divider">OR</div>' +
      '<button class="lm-skip" onclick="closeLoginModal()">Continue without signing in →</button>' +
      '<div class="lm-privacy">Your Google profile is stored only on this device.<br>' +
        '<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  // ③ Welcome Banner
  const banner = document.createElement('div');
  banner.id = 'loginWelcomeBanner';
  banner.innerHTML =
    '<div class="wb-row">' +
      '<img class="wb-avatar" src="" alt="avatar">' +
      '<div>' +
        '<span class="wb-name">Hey there! 👋</span>' +
        '<span class="wb-sub">Welcome to the portfolio 🎉</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  // ④ Profile Dropdown
  const dd = document.createElement('div');
  dd.id = 'profileDropdown';
  dd.innerHTML =
    '<div class="pd-header">' +
      '<img class="pd-avatar" src="" alt="avatar">' +
      '<div>' +
        '<div class="pd-name">Visitor</div>' +
        '<div class="pd-email"></div>' +
      '</div>' +
    '</div>' +
    '<button class="pd-signout" onclick="signOut()">Sign Out</button>';
  document.body.appendChild(dd);

  // Close modal on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeLoginModal();
  });

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    const dd = document.getElementById('profileDropdown');
    const btn = document.getElementById('visitorLoginBtn');
    if (dd && dd.classList.contains('open') && !dd.contains(e.target) && e.target !== btn) {
      dd.classList.remove('open');
    }
  });
}

// ── Firebase initialisation ──────────────────────────────────
function initFirebase() {
  // Dynamically import Firebase (CDN modules)
  Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js')
  ]).then(function(modules) {
    const { initializeApp }                          = modules[0];
    const { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } = modules[1];

    const app      = initializeApp(firebaseConfig);
    const auth     = getAuth(app);
    const provider = new GoogleAuthProvider();

    // Store auth reference for sign-out
    window._firebaseAuth = auth;

    // ── Replace Google One Tap button with real Firebase popup button ──
    const btnWrap = document.getElementById('googleBtnWrap');
    if (btnWrap) {
      btnWrap.innerHTML =
        '<button id="googleSignInBtn" onclick="firebaseGoogleSignIn()" style="' +
          'display:inline-flex;align-items:center;gap:10px;' +
          'padding:10px 22px;border-radius:40px;' +
          'background:#fff;color:#3c4043;' +
          'border:1px solid #dadce0;' +
          'font-size:0.88rem;font-weight:600;cursor:pointer;' +
          'font-family:inherit;transition:box-shadow 0.2s;' +
          'box-shadow:0 1px 4px rgba(0,0,0,0.2);"' +
          ' onmouseover="this.style.boxShadow=\'0 2px 10px rgba(0,0,0,0.3)\'"' +
          ' onmouseout="this.style.boxShadow=\'0 1px 4px rgba(0,0,0,0.2)\'">' +
          '<svg width="18" height="18" viewBox="0 0 48 48">' +
            '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
            '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
            '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
            '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
          '</svg>' +
          'Continue with Google' +
        '</button>';
    }

    // ── Global sign-in function ──
    window.firebaseGoogleSignIn = function() {
      const btn = document.getElementById('googleSignInBtn');
      if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }

      signInWithPopup(auth, provider)
        .then(function(result) {
          const user = result.user;
          const visitor = {
            firstName: user.displayName ? user.displayName.split(' ')[0] : 'Friend',
            fullName:  user.displayName || '',
            email:     user.email || '',
            avatar:    user.photoURL || '',
            uid:       user.uid,
            loginAt:   Date.now()
          };
          saveVisitor(visitor);
          closeLoginModal();
          applyVisitorSession(visitor, true);
        })
        .catch(function(error) {
          console.error('Login error:', error.message);
          if (btn) { btn.textContent = 'Try again'; btn.disabled = false; }
        });
    };

    // ── Restore session on page load ──
    onAuthStateChanged(auth, function(user) {
      if (user) {
        const saved = loadVisitor();
        // If Firebase still has session but localStorage was cleared, re-save
        if (!saved) {
          const visitor = {
            firstName: user.displayName ? user.displayName.split(' ')[0] : 'Friend',
            fullName:  user.displayName || '',
            email:     user.email || '',
            avatar:    user.photoURL || '',
            uid:       user.uid,
            loginAt:   Date.now()
          };
          saveVisitor(visitor);
          applyVisitorSession(visitor, false);
        } else {
          applyVisitorSession(saved, false);
        }
      }
    });

  }).catch(function(err) {
    console.error('Firebase load error:', err);
  });
}

// ── Chat integration ─────────────────────────────────────────
// Your existing chat.js sends visitorName to Groq API.
// This hook makes sure the name is always available.
window.setVisitorName = window.setVisitorName || function(name) {
  window._pendingVisitorName = name;
};

// ── Make functions global ────────────────────────────────────
window.openLoginModal   = openLoginModal;
window.closeLoginModal  = closeLoginModal;
window.signOut          = signOut;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  injectHTML();    // Inject modal + button HTML
  initFirebase();  // Load Firebase + restore session

  // If visitor already exists in localStorage, apply immediately
  const saved = loadVisitor();
  if (saved) applyVisitorSession(saved, false);
});
