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

  var CSS = [
'#secCard{margin:18px 0 6px;padding:16px 17px 15px;border-radius:15px;text-align:left;',
'  background:linear-gradient(180deg,rgba(16,27,44,.72),rgba(10,17,29,.72));',
'  border:1px solid rgba(120,205,255,.16)}',
'#secCard .sec-head{display:flex;align-items:center;gap:11px;margin-bottom:4px}',
'#secCard .sec-title{flex:1;min-width:0;display:flex;align-items:center;gap:9px;',
'  font-size:.92rem;font-weight:700;color:#e8f4ff;letter-spacing:.2px}',
'#secCard .sec-dot{width:7px;height:7px;border-radius:50%;flex:none;background-color:#4fe0a2}',
'#secCard .sec-score{flex:none;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:.68rem;',
'  font-weight:600;padding:4px 10px;border-radius:20px;color:rgba(190,225,245,.75);',
'  background-color:rgba(120,200,255,.09);border:1px solid rgba(120,200,255,.18)}',
'#secCard .sec-sub{margin:0 0 12px;font-size:.76rem;line-height:1.55;color:rgba(172,208,233,.58)}',
'#secCard .sec-row{display:flex;align-items:flex-start;gap:11px;padding:9px 0;',
'  border-bottom:1px solid rgba(120,200,255,.07)}',
'#secCard .sec-row:last-child{border-bottom:none}',
'#secCard .sec-ic{flex:none;width:18px;height:18px;margin-top:1px;color:rgba(150,200,230,.4)}',
'#secCard .sec-k{flex:1;min-width:0}',
'#secCard .sec-k b{display:block;font-size:.84rem;font-weight:600;color:#dceaf7}',
'#secCard .sec-k span{display:block;font-size:.71rem;line-height:1.45;margin-top:2px;color:rgba(172,208,233,.55)}',
'#secCard .sec-state{flex:none;min-width:74px;text-align:center;font-size:.55rem;font-weight:700;',
'  letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:5px;',
'  color:rgba(175,210,235,.6);background-color:rgba(150,190,220,.1)}',
'#secCard .sec-row.is-on .sec-ic{color:#4fe0a2}',
'#secCard .sec-row.is-on .sec-state{color:#6ff0bb;background-color:rgba(79,224,162,.14)}',
'#secCard .sec-row.is-off .sec-ic{color:#ff9a9a}',
'#secCard .sec-row.is-off .sec-state{color:#ff9a9a;background-color:rgba(255,122,122,.14)}',
'#secCard .sec-note{margin-top:12px;padding:10px 12px;border-radius:10px;font-size:.71rem;line-height:1.55;',
'  color:rgba(178,212,236,.62);background-color:rgba(120,200,255,.05);border:1px solid rgba(120,200,255,.12)}',
'#secCard .sec-note b{color:#dcefff;font-weight:600}',
'@media (max-width:560px){#secCard{padding:14px}#secCard .sec-state{min-width:64px}}'
  ].join('\n');

  /* ID-scoped and !important so hacker mode cannot flatten the states */
  function important(css) {
    return css.replace(/([a-z-]+\s*:\s*[^;{}]+?)\s*(;|})/g, function (m, d, end) {
      return (/!important$/.test(d) ? d : d + ' !important') + end;
    });
  }

  function inject() {
    if (document.getElementById('sec-style')) return;
    var st = document.createElement('style');
    st.id = 'sec-style';
    st.textContent = important(CSS);
    (document.head || document.documentElement).appendChild(st);
  }

  var TICK = '<path d="M20 6 9 17l-5-5"/>';
  var CROSS = '<path d="M18 6 6 18M6 6l12 12"/>';

  function setRow(row, on, detail) {
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
  }

  function run() {
    var card = document.getElementById('secCard');
    if (!card) return;
    inject();

    /* ask this same site for its headers */
    fetch(location.pathname, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) {
        var live = 0;
        CHECKS.forEach(function (c) {
          var row = card.querySelector('[data-sec="' + c.key + '"]');
          if (!row) return;
          var v = r.headers.get(c.key);
          /* framing can be covered by CSP instead of the older header */
          if (!v && c.alt) {
            var altv = r.headers.get(c.alt) || r.headers.get('content-security-policy-report-only');
            if (altv && c.label === 'Framing blocked' && /frame-ancestors/.test(altv)) v = 'via CSP frame-ancestors';
            else if (altv && c.key.indexOf('content-security-policy') === 0) v = altv;
          }
          if (v) live++;
          setRow(row, !!v, v ? c.why : 'Not present on the response from this server');
        });
        var score = card.querySelector('.sec-score');
        if (score) score.textContent = live + ' / ' + CHECKS.length + ' active';
        var dot = card.querySelector('.sec-dot');
        if (dot) dot.style.setProperty('background-color', live === CHECKS.length ? '#4fe0a2' : '#ffcf6b', 'important');
        var note = card.querySelector('.sec-note');
        if (note) {
          note.innerHTML = '<b>Checked live, not claimed.</b> These are read from this page\u2019s own ' +
            'response headers in your browser just now \u2014 open developer tools and you will see the same values. ' +
            'The Content Security Policy runs in report-only mode: it reports what it would block without ' +
            'breaking anything yet.' + (location.protocol === 'https:' ? '' :
            ' This page is not on HTTPS, so some headers are inactive here.');
        }
      })
      .catch(function () {
        var score = card.querySelector('.sec-score');
        if (score) score.textContent = 'unavailable';
        [].forEach.call(card.querySelectorAll('.sec-row'), function (row) {
          var st = row.querySelector('.sec-state');
          if (st) st.textContent = 'Unknown';
        });
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

  window.securityAudit = { check: run };

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
