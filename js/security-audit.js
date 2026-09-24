/* ============================================================
   SECURITY SELF-AUDIT  —  ByteWithSahnawaz
   Reads this site's own response headers in the browser and reports
   which protections are actually live. Nothing is hard-coded: if a
   header is removed from vercel.json, this panel says so on the next
   visit. The same idea as System Status, pointed at the site itself.

   Standalone. Injects its own CSS. No dependencies, no network calls
   beyond one HEAD request to this same site.
   ============================================================ */
(function () {
  'use strict';
  if (window.__secAuditLoaded) return;
  window.__secAuditLoaded = true;

  var CHECKS = [
    { key: 'strict-transport-security', label: 'HTTPS enforced',
      why: 'Every visit is forced onto HTTPS, even if someone types http://' },
    { key: 'content-security-policy-report-only', alt: 'content-security-policy',
      label: 'Content Security Policy',
      why: 'Declares which sources may run code here; currently in report-only mode' },
    { key: 'x-content-type-options', label: 'No MIME sniffing',
      why: 'Stops the browser running a file as a type it was not served as' },
    { key: 'referrer-policy', label: 'Referrer limited',
      why: 'Other sites see only the domain a visitor came from, never the full link' },
    { key: 'permissions-policy', label: 'Device permissions',
      why: 'Camera, location and payment are denied to every script on the page' },
    { key: 'x-frame-options', alt: 'content-security-policy', label: 'Framing blocked',
      why: 'Other sites cannot embed this page inside their own' }
  ];

  /* Styles live in index.html next to the markup, so the panel can never
     appear unstyled if this file fails to load. Kept here only as a
     fallback for pages that include the markup without that block. */
  var CSS = '';

  /* ID-scoped and !important so hacker mode cannot flatten the states */
  function important(css) {
    return css.replace(/([a-z-]+\s*:\s*[^;{}]+?)\s*(;|})/g, function (m, d, end) {
      return (/!important$/.test(d) ? d : d + ' !important') + end;
    });
  }

  function inject() {
    if (!CSS || document.getElementById('sec-style')) return;
    var st = document.createElement('style');
    st.id = 'sec-style';
    st.textContent = important(CSS);
    (document.head || document.documentElement).appendChild(st);
  }

  var LAST = { headers: null, ms: null, at: null, protocol: null };

  var TICK = '<path d="M20 6 9 17l-5-5"/>';
  var CROSS = '<path d="M18 6 6 18M6 6l12 12"/>';

  function setRow(row, on, detail, rawValue) {
    row.classList.toggle('is-on', !!on);
    row.classList.toggle('is-off', !on);
    var ic = row.querySelector('.sec-ic');
    if (ic) ic.innerHTML = on ? TICK : CROSS;
    var st = row.querySelector('.sec-state');
    if (st) st.textContent = on ? 'Active' : 'Missing';
    if (detail) {
      var sp = row.querySelector('.sec-k span');
      if (sp) sp.textContent = detail;
    }

    /* the point of the panel: show the header the server really sent,
       so a reviewer can check it against their own developer tools
       instead of taking the row's word for it */
    var val = row.querySelector('.sec-val');
    if (!val) {
      val = document.createElement('div');
      val.className = 'sec-val';
      row.appendChild(val);
    }
    if (on && rawValue) {
      val.innerHTML = '<code>' + esc(rawValue) + '</code>';
      row.classList.add('is-open-able');
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      row.setAttribute('aria-expanded', 'false');
    } else {
      val.innerHTML = '';
      row.classList.remove('is-open-able', 'is-open');
      row.removeAttribute('tabindex');
      row.removeAttribute('role');
      row.removeAttribute('aria-expanded');
    }
  }

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* a Content Security Policy is a long single line; broken into its
     directives it reads as the list of decisions it actually is */
  function cspSummary(v) {
    var parts = String(v).split(';').map(function (x) { return x.trim(); }).filter(Boolean);
    var hosts = {};
    parts.forEach(function (p) {
      p.split(/\s+/).slice(1).forEach(function (src) {
        if (src.indexOf('http') === 0) hosts[src.replace(/^https?:\/\//, '').split('/')[0]] = 1;
      });
    });
    return { directives: parts.length, hosts: Object.keys(hosts).length, list: parts };
  }

  function run(manual) {
    var card = document.getElementById('secCard');
    if (!card) return;
    inject();
    wire(card);

    var score = card.querySelector('.sec-score');
    if (score) score.textContent = manual ? 'rechecking\u2026' : 'checking\u2026';
    card.classList.add('is-busy');

    var t0 = (performance && performance.now) ? performance.now() : Date.now();

    /* no-store, so this reads the live response rather than a stored copy */
    fetch(location.pathname, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) {
        var ms = Math.round(((performance && performance.now) ? performance.now() : Date.now()) - t0);
        var live = 0;
        var collected = {};

        CHECKS.forEach(function (c) {
          var row = card.querySelector('[data-sec="' + c.key + '"]');
          if (!row) return;
          var v = r.headers.get(c.key);
          var shown = v;

          if (!v && c.alt) {
            var altv = r.headers.get(c.alt) || r.headers.get('content-security-policy-report-only');
            if (altv && c.label === 'Framing blocked' && /frame-ancestors/.test(altv)) {
              v = altv; shown = 'frame-ancestors ' + (altv.match(/frame-ancestors ([^;]+)/) || [, ''])[1];
            } else if (altv && c.key.indexOf('content-security-policy') === 0) {
              v = altv; shown = altv;
            }
          }

          if (v) { live++; collected[c.key] = v; }

          var why = c.why;
          if (v && c.key.indexOf('content-security-policy') === 0) {
            var sum = cspSummary(v);
            why = sum.directives + ' directives, ' + sum.hosts + ' external sources allowed \u00b7 report-only';
          }
          setRow(row, !!v, v ? why : 'Not present on the response from this server', shown);
        });

        LAST = { headers: collected, ms: ms, at: new Date(), protocol: location.protocol };
        card.classList.remove('is-busy');
        if (score) score.textContent = live + ' / ' + CHECKS.length + ' active';

        var dot = card.querySelector('.sec-dot');
        if (dot) dot.style.setProperty('background-color', live === CHECKS.length ? '#4fe0a2' : '#ffcf6b', 'important');

        var meta = card.querySelector('.sec-meta');
        if (meta) {
          meta.innerHTML = '<span>checked just now</span><span>' + ms + 'ms</span>' +
            '<span>' + (location.protocol === 'https:' ? 'over HTTPS' : 'over HTTP \u2014 some headers inactive here') + '</span>';
        }

        var note = card.querySelector('.sec-note');
        if (note) {
          note.innerHTML = '<b>Checked live, not claimed.</b> Tap any row to see the exact header this page ' +
            'received \u2014 the same values your browser\u2019s developer tools will show. The Content Security ' +
            'Policy runs in report-only mode: it reports what it would block without breaking anything yet.';
        }
      })
      .catch(function () {
        card.classList.remove('is-busy');
        if (score) score.textContent = 'unavailable';
        [].forEach.call(card.querySelectorAll('.sec-row'), function (row) {
          var st = row.querySelector('.sec-state');
          if (st) st.textContent = 'Unknown';
        });
      });
  }

  /* one-time interaction wiring: expand a row, recheck, copy */
  var wired = false;
  function wire(card) {
    if (wired) return;
    wired = true;

    /* recheck + copy live next to the score, like System Status */
    var head = card.querySelector('.sec-head');
    if (head && !card.querySelector('.sec-actions')) {
      var act = document.createElement('div');
      act.className = 'sec-actions';
      act.innerHTML =
        '<button type="button" class="sec-btn" data-sec-act="recheck">Recheck</button>' +
        '<button type="button" class="sec-btn" data-sec-act="copy">Copy headers</button>';
      head.parentNode.insertBefore(act, head.nextSibling);
    }
    if (!card.querySelector('.sec-meta')) {
      var meta = document.createElement('div');
      meta.className = 'sec-meta';
      var rows = card.querySelector('.sec-rows');
      if (rows) rows.parentNode.insertBefore(meta, rows);
    }

    card.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-sec-act]');
      if (btn) {
        var act = btn.getAttribute('data-sec-act');
        if (act === 'recheck') run(true);
        if (act === 'copy') {
          var text = JSON.stringify(LAST.headers || {}, null, 2);
          try {
            navigator.clipboard.writeText(text);
            btn.textContent = 'Copied';
            setTimeout(function () { btn.textContent = 'Copy headers'; }, 1600);
          } catch (err) {}
        }
        return;
      }
      var row = e.target.closest && e.target.closest('.sec-row.is-open-able');
      if (row) {
        var open = row.classList.toggle('is-open');
        row.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });

    card.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var row = e.target.closest && e.target.closest('.sec-row.is-open-able');
      if (!row) return;
      e.preventDefault();
      var open = row.classList.toggle('is-open');
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* only check when the panel is actually reached */
  function watch() {
    var card = document.getElementById('secCard');
    if (!card) return;
    inject();
    if (typeof IntersectionObserver === 'undefined') { run(); return; }
    new IntersectionObserver(function (en, obs) {
      if (en[0].isIntersecting) { obs.disconnect(); run(); }
    }, { rootMargin: '400px 0px' }).observe(card);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();

  window.securityAudit = { check: run, last: function () { return LAST; } };

  /* command palette entry */
  function registerCmd() {
    if (typeof window.registerPaletteCommands !== 'function') return false;
    window.registerPaletteCommands([{
      t: 'Security Headers',
      s: 'Which protections this site is actually serving',
      g: 'Performance',
      k: 'security headers csp https hsts audit protection',
      i: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      run: function () {
        var c = document.getElementById('secCard');
        if (!c) return false;
        c.scrollIntoView({ behavior: 'smooth', block: 'center' });
        run();
        return true;
      }
    }]);
    return true;
  }
  if (!registerCmd()) {
    var t = 0, iv = setInterval(function () { if (registerCmd() || ++t > 40) clearInterval(iv); }, 150);
  }
})();
