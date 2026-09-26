/* ══════════════════════════════════════════════════════════
   visitor-auth.js — FINAL FIX
   
   ROOT CAUSE: On Android Chrome, Firebase signInWithPopup
   silently falls back to a redirect, navigating to 
   firebaseapp.com/__/auth/handler which gets stuck blank.
   
   SOLUTION: Use GSI OAuth2 flow with ux_mode:"popup" directly.
   GSI popup is a TRUE browser popup — never navigates away.
   Then exchange the auth_code for a Firebase credential.
   Works on Android Chrome, iOS Safari, desktop — all browsers.
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

/* ── Storage ────────────────────────────────────────────── */
function saveVisitor(data) {
  try { localStorage.setItem(VISITOR_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadVisitor() {
  try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); } catch(e) { return null; }
}
function clearVisitor() {
  try { localStorage.removeItem(VISITOR_KEY); } catch(e) {}
}

/* ── Modal ──────────────────────────────────────────────── */
function openLoginModal() {
  var m = document.getElementById('loginModal');
  if (m) m.classList.add('open');
  var dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.remove('open');
}
function closeLoginModal() {
  var m = document.getElementById('loginModal');
  if (m) m.classList.remove('open');
}
function toggleProfileDropdown() {
  var dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.toggle('open');
}
function showLoginError(msg) {
  var el = document.getElementById('loginErrorMsg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function hideLoginError() {
  var el = document.getElementById('loginErrorMsg');
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

/* ── Apply session to UI ────────────────────────────────── */
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
    btn.ontouchend = function(e) { e.preventDefault(); e.stopPropagation(); toggleProfileDropdown(); };
    btn.onclick    = function(e) { if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return; toggleProfileDropdown(); };
  }
  var dd = document.getElementById('profileDropdown');
  if (dd) {
    var ddAv = dd.querySelector('.pd-avatar'), ddName = dd.querySelector('.pd-name'), ddEmail = dd.querySelector('.pd-email');
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
  var nameEl = banner.querySelector('.wb-name'), avEl = banner.querySelector('.wb-avatar');
  if (nameEl) nameEl.textContent = 'Hey ' + visitor.firstName + '! 👋';
  if (avEl && visitor.avatar) avEl.src = visitor.avatar;
  banner.style.display = 'block'; banner.style.opacity = '1'; banner.style.transition = '';
  setTimeout(function() {
    banner.style.transition = 'opacity 0.6s ease'; banner.style.opacity = '0';
    setTimeout(function() { banner.style.display = 'none'; }, 600);
  }, 4000);
}

/* ── Sign out ───────────────────────────────────────────── */
function signOut() {
  clearVisitor();
  if (window._firebaseAuth) window._firebaseAuth.signOut().catch(function(){});
  if (window.google && window.google.accounts && window.google.accounts.id)
    window.google.accounts.id.disableAutoSelect();
  var btn = document.getElementById('visitorLoginBtn');
  if (btn) {
    btn.classList.remove('logged-in');
    btn.querySelector('.vl-label').textContent = 'Sign In';
    var av = btn.querySelector('.vl-avatar');
    if (av) { av.src = ''; av.style.display = 'none'; }
    var icon = btn.querySelector('.vl-icon');
    if (icon) icon.style.display = 'inline';
    btn.ontouchend = null;
    btn.onclick    = openLoginModal;
  }
  var dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.remove('open');
  window._pendingVisitorName = null;
  window._chatVisitorName    = null;
  if (window.setVisitorName) window.setVisitorName(null);
}

function visitorFromUser(u) {
  return { type: 'google', firstName: u.displayName ? u.displayName.split(' ')[0] : 'Friend', fullName: u.displayName || '', email: u.email || '', avatar: u.photoURL || '', uid: u.uid, loginAt: Date.now() };
}

/* A "guest" visitor object for anonymous (not-signed-in) people.
   Same shape engagement.js expects (needs a .uid), but no identity.
   firstName is left blank so the chatbot doesn't greet a fake name;
   fullName is 'Guest' so the admin dashboard labels them clearly. */
function guestVisitor(u) {
  return { type: 'guest', firstName: '', fullName: 'Guest', email: '', avatar: '', uid: u.uid, loginAt: Date.now() };
}

/* ══════════════════════════════════════════════════════════
   VISITOR METADATA — everything readable in the browser
   without asking the visitor for any permission.
   ══════════════════════════════════════════════════════════ */
function parseUA() {
  var ua = navigator.userAgent || '';
  var os = 'Unknown', browser = 'Unknown', device = 'desktop';

  if (/Android/i.test(ua))               os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua))          os = 'Windows';
  else if (/Mac OS X/i.test(ua))         os = 'macOS';
  else if (/Linux/i.test(ua))            os = 'Linux';

  if (/Edg\//i.test(ua))               browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua))    browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Chrome\//i.test(ua))       browser = 'Chrome';
  else if (/Firefox\//i.test(ua))      browser = 'Firefox';
  else if (/Safari\//i.test(ua))       browser = 'Safari';

  if (/iPad|Tablet/i.test(ua))                   device = 'tablet';
  else if (/Mobi|Android|iPhone|iPod/i.test(ua)) device = 'mobile';

  /* Device model — Android UAs carry the model code, e.g.
     "(Linux; Android 13; SM-G991B Build/...)" -> "SM-G991B".
     iOS hides the exact model (all report "iPhone"/"iPad"). */
  var model = '';
  var am = ua.match(/Android[\s\d.]*;\s*([^;)]+?)(?:\s+Build\/|[;)])/i);
  if (am && am[1]) {
    model = am[1].replace(/\s*Build.*$/i, '').trim();
    if (/^[A-Za-z ]*(Chrome|wv|Version)/i.test(model) || model.length > 60) model = '';
  } else if (/iPhone/i.test(ua)) { model = 'iPhone'; }
  else if (/iPad/i.test(ua))     { model = 'iPad'; }

  return { os: os, browser: browser, device: device, model: model, ua: ua.slice(0, 400) };
}

function collectMeta() {
  var uaInfo = parseUA();
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

  var network = '';
  try {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c && c.effectiveType) network = c.effectiveType;   /* '4g', '3g', 'slow-2g'… */
  } catch (e) {}

  return {
    device:   uaInfo.device,
    os:       uaInfo.os,
    browser:  uaInfo.browser,
    model:    uaInfo.model,
    ua:       uaInfo.ua,
    screen:   (screen.width || 0) + 'x' + (screen.height || 0),
    viewport: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0),
    dpr:      window.devicePixelRatio || 1,
    cores:    (typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 0),
    memory:   (typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 0),  /* GB, coarse */
    network:  network,
    language: (navigator.language || navigator.userLanguage || '').slice(0, 20),
    timezone: tz.slice(0, 60),
    referrer: (document.referrer || '(direct)').slice(0, 300),
    landing:  (location.pathname + location.search).slice(0, 300)
  };
}

/* Async signals that need a promise or aren't ready synchronously:
   battery %, charging state, and the precise model via UA-Client-Hints
   (Chromium on Android returns the real model here). Best-effort with a
   short timeout so a slow/absent API never blocks the profile write. */
function collectAsyncExtras(cb) {
  var out = {};
  var pending = 0, finished = false;
  var timer = setTimeout(function () { if (!finished) { finished = true; cb(out); } }, 2500);
  function maybeDone() { if (!finished && pending <= 0) { finished = true; clearTimeout(timer); cb(out); } }

  /* Battery */
  try {
    if (navigator.getBattery) {
      pending++;
      navigator.getBattery().then(function (b) {
        out.batteryLevel = Math.round((b.level || 0) * 100);
        out.charging = !!b.charging;
        pending--; maybeDone();
      }).catch(function () { pending--; maybeDone(); });
    }
  } catch (e) {}

  /* Precise model / platform via high-entropy client hints (Chromium) */
  try {
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      pending++;
      navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion'])
        .then(function (h) {
          if (h.model) out.model = String(h.model).slice(0, 120);
          if (h.platform) out.platform = (String(h.platform) + ' ' + (h.platformVersion || '')).trim().slice(0, 80);
          pending--; maybeDone();
        }).catch(function () { pending--; maybeDone(); });
    }
  } catch (e) {}

  if (pending === 0) { finished = true; clearTimeout(timer); cb(out); }
}

/* Approximate location from IP — free, no API key, CORS-enabled.
   Called at most once per browser (cached), non-blocking, best-effort. */
var GEO_KEY = 'shnz_geo_v1';
function fetchGeoOnce(cb) {
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(GEO_KEY) || 'null'); } catch (e) {}
  if (cached) { cb(cached); return; }
  var done = false;
  var timer = setTimeout(function () { if (!done) { done = true; cb(null); } }, 3500);
  try {
    fetch('https://ipwho.is/', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (done) return; done = true; clearTimeout(timer);
        if (!d || d.success === false) { cb(null); return; }
        var geo = {
          ip:      d.ip || '',
          country: d.country || '',
          region:  d.region || '',
          city:    d.city || '',
          org:     (d.connection && d.connection.org) || d.org || ''
        };
        try { localStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch (e) {}
        cb(geo);
      })
      .catch(function () { if (!done) { done = true; clearTimeout(timer); cb(null); } });
  } catch (e) { if (!done) { done = true; clearTimeout(timer); cb(null); } }
}

/* Write / update the visitor profile doc: visitors/{uid}.
   Runs for BOTH guests and signed-in users, keyed by uid.
   visits counts sessions (not reloads); firstSeen is set once. */
function recordVisitorProfile(visitor) {
  var db = window._vaDb;
  if (!db || !visitor || !visitor.uid) return;
  var uid = visitor.uid;
  var ref = db.collection('visitors').doc(uid);
  var meta = collectMeta();
  var FV = firebase.firestore.FieldValue;

  /* count one visit per browser session */
  var newSession = false;
  try { if (!sessionStorage.getItem('shnz_session')) { sessionStorage.setItem('shnz_session', '1'); newSession = true; } }
  catch (e) { newSession = true; }

  var payload = {
    uid:      uid,
    type:     visitor.type || 'guest',
    name:     visitor.fullName || visitor.firstName || 'Guest',
    email:    visitor.email  || '',
    avatar:   visitor.avatar || '',
    device:   meta.device,
    os:       meta.os,
    browser:  meta.browser,
    model:    meta.model,
    ua:       meta.ua,
    screen:   meta.screen,
    viewport: meta.viewport,
    dpr:      meta.dpr,
    cores:    meta.cores,
    memory:   meta.memory,
    network:  meta.network,
    language: meta.language,
    timezone: meta.timezone,
    referrer: meta.referrer,
    landing:  meta.landing,
    lastSeen: FV.serverTimestamp(),
    updatedAt: FV.serverTimestamp()
  };
  if (newSession) payload.visits = FV.increment(1);

  /* set firstSeen only once per browser */
  var firstFlag = false;
  try { firstFlag = !localStorage.getItem('shnz_first_seen'); } catch (e) {}
  if (firstFlag) {
    payload.firstSeen = FV.serverTimestamp();
    try { localStorage.setItem('shnz_first_seen', '1'); } catch (e) {}
  }

  ref.set(payload, { merge: true }).catch(function (err) {
    console.error('visitor profile save error:', err && err.code);
  });

  /* enrich with approximate location (once per browser), merged in after */
  fetchGeoOnce(function (geo) {
    if (!geo) return;
    ref.set({
      uid:     uid,   /* keep uid present so the security rule passes on any write order */
      ip:      geo.ip || '',
      country: geo.country || '',
      region:  geo.region || '',
      city:    geo.city || '',
      org:     geo.org || ''
    }, { merge: true }).catch(function () {});
  });

  /* enrich with battery % + precise model (async APIs), merged in after */
  collectAsyncExtras(function (extra) {
    if (!extra || (extra.batteryLevel === undefined && !extra.model && !extra.platform)) return;
    var patch = { uid: uid, updatedAt: FV.serverTimestamp() };
    if (extra.batteryLevel !== undefined) { patch.batteryLevel = extra.batteryLevel; patch.charging = !!extra.charging; }
    if (extra.model)    patch.model = extra.model;
    if (extra.platform) patch.platform = extra.platform;
    ref.set(patch, { merge: true }).catch(function () {});
  });
}

/* Sign in with Google, upgrading the current anonymous account when possible
   so the guest's earlier activity keeps the same uid. Falls back to a normal
   sign-in for returning users whose Google account already exists. */
function signInOrLink(credential, onDone, onErr) {
  var auth = window._firebaseAuth;
  if (!auth) { if (onErr) onErr({ code: 'auth/not-ready' }); return; }
  var cur = auth.currentUser;
  if (cur && cur.isAnonymous) {
    cur.linkWithCredential(credential)
      .then(function (result) { onDone(result.user); })
      .catch(function (err) {
        if (err && (err.code === 'auth/credential-already-in-use' ||
                    err.code === 'auth/email-already-in-use')) {
          /* returning visitor — a Google account already exists, just sign in */
          auth.signInWithCredential(credential)
            .then(function (r) { onDone(r.user); })
            .catch(function (e) { if (onErr) onErr(e); });
        } else if (onErr) { onErr(err); }
      });
  } else {
    auth.signInWithCredential(credential)
      .then(function (r) { onDone(r.user); })
      .catch(function (e) { if (onErr) onErr(e); });
  }
}

function onSignInSuccess(firebaseUser, showBanner) {
  var visitor = visitorFromUser(firebaseUser);
  saveVisitor(visitor); closeLoginModal();
  applyVisitorSession(visitor, showBanner !== false);
  recordVisitorProfile(visitor);
}

/* ══════════════════════════════════════════════════════════
   CORE: GSI OAuth2 popup — ux_mode:"popup" is a TRUE popup.
   It NEVER navigates the page. Works on Android Chrome.
   Callback receives an auth_code we exchange with Firebase.
   ══════════════════════════════════════════════════════════ */
function triggerGoogleSignIn() {
  hideLoginError();
  if (!window._gsiReady) {
    showLoginError('Still loading, please try again in a second.');
    return;
  }

  var btn = document.getElementById('customGoogleBtn');
  if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Opening…'; }

  /* Request id_token (JWT) via popup — never redirects the page */
  window.google.accounts.id.prompt(function(notification) {
    /* One Tap prompt result — ignored here, we use oauth2 below */
  });

  /* Use OAuth2 flow with ux_mode popup to get id_token */
  var client = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
    ux_mode: 'popup',
    callback: function(tokenResponse) {
      if (tokenResponse.error) {
        console.error('GSI token error:', tokenResponse.error);
        if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Continue with Google'; }
        if (tokenResponse.error !== 'access_denied') {
          showLoginError('Sign-in failed: ' + tokenResponse.error + '. Please try again.');
        }
        return;
      }
      /* Exchange access_token for Firebase credential */
      var auth = window._firebaseAuth;
      if (!auth) { showLoginError('Auth not ready. Please refresh and try again.'); return; }
      var credential = firebase.auth.GoogleAuthProvider.credential(null, tokenResponse.access_token);
      signInOrLink(credential,
        function(user) {
          onSignInSuccess(user, true);
          if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Continue with Google'; }
        },
        function(err) {
          console.error('Firebase credential error:', err && err.code, err && err.message);
          if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Continue with Google'; }
          showLoginError('Sign-in failed (' + (err && err.code) + '). Please try again.');
        });
    }
  });

  client.requestAccessToken();
}

/* ── One Tap callback (floating prompt bonus) ───────────── */
function handleOneTapCredential(response) {
  if (!response || !response.credential) return;
  var auth = window._firebaseAuth;
  if (!auth) { window._pendingOneTapCredential = response.credential; return; }
  var cred = firebase.auth.GoogleAuthProvider.credential(response.credential);
  signInOrLink(cred,
    function(user) { onSignInSuccess(user, true); },
    function(e) { console.error('One Tap error:', e && e.code); });
}
window._handleOneTapCredential = handleOneTapCredential;

/* ── Inject HTML ────────────────────────────────────────── */
function injectHTML() {
  var header = document.querySelector('header .hdr-inner') || document.querySelector('header');
  if (header && !document.getElementById('visitorLoginBtn')) {
    var w = document.createElement('div');
    w.style.cssText = 'display:flex;justify-content:center;margin-top:8px;';
    w.innerHTML = '<button id="visitorLoginBtn" style="display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:30px;background:transparent;border:1.5px solid #00ffff;color:#00ffff;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:inherit;"><img class="vl-avatar" src="" alt="" style="width:24px;height:24px;border-radius:50%;display:none;object-fit:cover;"><span class="vl-icon">🔑</span><span class="vl-label">Sign In</span></button>';
    header.appendChild(w);
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
        '<div style="display:flex;justify-content:center;margin:24px 0 12px;">' +
          '<button id="customGoogleBtn" style="display:inline-flex;align-items:center;gap:10px;padding:11px 24px;border-radius:40px;background:#fff;color:#3c4043;border:1px solid #dadce0;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 4px rgba(0,0,0,0.2);min-width:220px;justify-content:center;">' +
            '<svg width="18" height="18" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
            '<span>Continue with Google</span>' +
          '</button>' +
        '</div>' +
        '<div id="loginErrorMsg" style="display:none;margin:0 auto 12px;max-width:300px;padding:10px 14px;border-radius:10px;background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);color:#ff9090;font-size:0.78rem;text-align:center;line-height:1.5;"></div>' +
        '<div class="lm-divider">OR</div>' +
        '<button class="lm-skip">Continue without signing in →</button>' +
        '<div class="lm-privacy">Your Google profile is stored only on this device.<br><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a></div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('loginModalClose').onclick = closeLoginModal;
    document.querySelector('.lm-skip').onclick         = closeLoginModal;
    document.getElementById('customGoogleBtn').onclick = triggerGoogleSignIn;
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
    dd.innerHTML = '<div class="pd-header"><img class="pd-avatar" src="" alt=""><div><div class="pd-name">Visitor</div><div class="pd-email"></div></div></div><button class="pd-signout">Sign Out</button>';
    document.body.appendChild(dd);
    dd.querySelector('.pd-signout').onclick = signOut;
  }

  function _outside(e) {
    var d = document.getElementById('profileDropdown'), b = document.getElementById('visitorLoginBtn');
    if (d && d.classList.contains('open') && !d.contains(e.target) && b && !b.contains(e.target))
      d.classList.remove('open');
  }
  document.addEventListener('touchstart', _outside, { passive: true });
  document.addEventListener('click', _outside);
}

/* ── Load script ────────────────────────────────────────── */
function loadScript(src, cb) {
  var s = document.createElement('script');
  s.src = src; s.onload = cb;
  s.onerror = function() { console.error('Failed:', src); if (cb) cb(); };
  document.head.appendChild(s);
}

/* ── Init ───────────────────────────────────────────────── */
function init() {
  /* Load Firebase (app → auth → firestore) */
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', function() {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js', function() {
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js', function() {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
      var auth = firebase.auth();
      window._firebaseAuth = auth;
      try { window._vaDb = firebase.firestore(); } catch (e) { window._vaDb = null; }

      /* Flush any pending One Tap credential */
      if (window._pendingOneTapCredential) {
        var cred = firebase.auth.GoogleAuthProvider.credential(window._pendingOneTapCredential);
        signInOrLink(cred, function(user) { onSignInSuccess(user, true); }, function(){});
        window._pendingOneTapCredential = null;
      }

      /* Restore session, OR sign in anonymously so EVERY visitor gets a uid.
         onAuthStateChanged fires again after the anonymous sign-in resolves. */
      auth.onAuthStateChanged(function(user) {
        if (!user) {
          auth.signInAnonymously().catch(function(err) {
            /* If the Anonymous provider isn't enabled in Firebase, this fails
               — guests simply won't be tracked until it's turned on. */
            console.error('Anonymous sign-in failed:', err && err.code);
          });
          return;
        }

        if (user.isAnonymous) {
          /* GUEST: save uid so engagement.js records them, but keep the
             "Sign In" button as-is (don't flip the UI to a logged-in state). */
          var g = guestVisitor(user);
          saveVisitor(g);
          if (window.setVisitorName) window.setVisitorName(null);
          recordVisitorProfile(g);
        } else {
          /* SIGNED-IN GOOGLE USER */
          var saved = loadVisitor();
          var v = (saved && saved.type === 'google' && saved.uid === user.uid)
                    ? saved : visitorFromUser(user);
          v.type = 'google';
          saveVisitor(v);
          applyVisitorSession(v, false);
          recordVisitorProfile(v);
        }
      });
      });
    });
  });

  /* Load GSI — handles both One Tap floating prompt AND oauth2 popup button */
  loadScript('https://accounts.google.com/gsi/client', function() {
    window.google.accounts.id.initialize({
      client_id:             GOOGLE_CLIENT_ID,
      callback:              window._handleOneTapCredential,
      auto_select:           false,
      cancel_on_tap_outside: false
    });
    window._gsiReady = true;

    /* Show floating One Tap prompt (bonus — non-intrusive) */
    window.google.accounts.id.prompt(function(n) {
      if (n.isSkippedMoment && (n.isSkippedMoment() || n.isDismissedMoment()))
        console.log('One Tap dismissed');
    });
  });
}

/* ── Public API ─────────────────────────────────────────── */
window.setVisitorName  = window.setVisitorName || function(n) { window._pendingVisitorName = n; window._chatVisitorName = n; };
window.openLoginModal  = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.signOut         = signOut;

document.addEventListener('DOMContentLoaded', function() {
  injectHTML();
  var saved = loadVisitor();
  /* only restore the logged-in UI for a real Google session; a saved
     "guest" keeps the Sign In button visible so they can still sign in */
  if (saved && saved.type === 'google' && saved.email) applyVisitorSession(saved, false);
  init();
});
