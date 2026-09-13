/* ══════════════════════════════════════════════════════════
   ship-toast.js — Live "Just Shipped" notifications

   Listens to the `shipEvents` Firestore collection (written server-side
   by api/github-webhook.js the moment a push lands on the default
   branch) and shows a toast if a NEW push happens while someone is
   already on the page.

   Deliberately reuses the Firestore instance engagement.js already sets
   up (window._firestoreDB) instead of loading the SDK or calling
   firebase.initializeApp() again — a second initializeApp() call throws,
   since visitor-auth.js already owns the default app on this page.
   That's also why this waits for window._firestoreDB specifically
   (set once engagement.js's initFirestore() finishes) rather than just
   window.firebase — the firestore-compat script needs to actually be
   loaded, not just the core SDK.
   ══════════════════════════════════════════════════════════ */
(function () {
  var SHIP_COLLECTION = 'shipEvents';
  var AUTO_DISMISS_MS = 7000;

  var seenLatestId = null;
  var initialSnapshotHandled = false;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toastHtml(data) {
    var repo = escapeHtml(data.repo || 'a repo');
    var count = data.commitCount || 1;
    var sub = data.headMessage
      ? escapeHtml(data.headMessage)
      : count + (count === 1 ? ' commit' : ' commits');
    return '<div class="ship-toast-row">'
      + '<span class="ship-toast-dot" aria-hidden="true"></span>'
      + '<div class="ship-toast-main">'
      + '<div class="ship-toast-title">Just pushed to <b>' + repo + '</b></div>'
      + '<div class="ship-toast-msg">' + sub + '</div>'
      + '</div>'
      + '</div>';
  }

  function ensureToastRoot() {
    var root = document.getElementById('shipToastRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'shipToastRoot';
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
    return root;
  }

  function showToast(data) {
    var root = ensureToastRoot();
    var el = document.createElement('div');
    el.className = 'ship-toast';
    el.innerHTML = toastHtml(data);
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('ship-toast-in'); });

    var timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    el.addEventListener('click', dismiss);

    function dismiss() {
      clearTimeout(timer);
      el.classList.remove('ship-toast-in');
      el.classList.add('ship-toast-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }
  }

  function attachListener(db) {
    db.collection(SHIP_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .onSnapshot(function (snap) {
        if (snap.empty) return;
        var doc = snap.docs[0];

        // The very first snapshot fired on page load reflects whatever
        // was already the latest push before this visitor arrived — only
        // toast for a push that lands strictly AFTER that baseline.
        if (!initialSnapshotHandled) {
          initialSnapshotHandled = true;
          seenLatestId = doc.id;
          return;
        }
        if (doc.id === seenLatestId) return;
        seenLatestId = doc.id;

        showToast(doc.data());
      }, function (err) {
        console.warn('[ship-toast] listener error:', err && err.message);
      });
  }

  /* Same "poll every 300ms" pattern engagement.js itself uses to wait
     for Firebase Auth — here waiting one layer further down the chain
     for Firestore specifically. Gives up quietly after ~10s rather than
     retrying forever if Firestore never loads for some reason. */
  function waitForFirestore(attemptsLeft) {
    if (window._firestoreDB) {
      attachListener(window._firestoreDB);
      return;
    }
    if (attemptsLeft <= 0) return;
    setTimeout(function () { waitForFirestore(attemptsLeft - 1); }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { waitForFirestore(32); });
  } else {
    waitForFirestore(32);
  }
})();
