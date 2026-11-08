/* The page meets each visitor where they came from.
   Someone arriving from LinkedIn, Naukri or another job site, or from a
   recruiter link (?view=recruiter, ?for=hiring), gets a short card with the
   60-second profile, Job Fit and the resume. Someone arriving from
   Instagram, Facebook or WhatsApp, or a client link (?for=client), gets a
   card for planning a project, a free website check and pricing.
   A visitor who already told the chat why they're here (recruiter or
   client) is treated the same way. Google and direct visits get nothing,
   since there's no way to tell. Shown once per visit, a few seconds in;
   the visitor can close it. Nothing on the page moves. */
(function () {
  'use strict';
  var HIRING = /(^|\.)(linkedin\.com|lnkd\.in|naukri\.com|indeed\.|glassdoor\.|wellfound\.com|angel\.co|instahyre\.com|cutshort\.io|hirist\.|internshala\.com|foundit\.in|monsterindia\.com|shine\.com|apna\.co|iimjobs\.com|unstop\.com)$/i;
  var CLIENT = /(^|\.)(instagram\.com|facebook\.com|fb\.com|fb\.me|whatsapp\.com|wa\.me|threads\.net|justdial\.com)$/i;
  var NAMES = [[/linkedin|lnkd/i, 'LinkedIn'], [/naukri/i, 'Naukri'], [/indeed/i, 'Indeed'], [/glassdoor/i, 'Glassdoor'], [/wellfound|angel/i, 'Wellfound'],
    [/instahyre/i, 'Instahyre'], [/internshala/i, 'Internshala'], [/instagram/i, 'Instagram'], [/facebook|fb\./i, 'Facebook'], [/whatsapp|wa\.me/i, 'WhatsApp']];

  var store = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };

  function detect() {
    var p = new URLSearchParams(location.search), host = '', from = '';
    var hint = (p.get('for') || '').toLowerCase(), src = (p.get('utm_source') || p.get('ref') || p.get('source') || '').toLowerCase();
    try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (/sahnawaz-portfolio/.test(host)) host = '';
    var key = src || host;
    NAMES.some(function (n) { if (n[0].test(key)) { from = n[1]; return true; } return false; });
    if (p.get('view') === 'recruiter' || /^(hiring|recruiter|hr|job)$/.test(hint)) return { mode: 'hiring', from: from };
    if (/^(client|project|business)$/.test(hint)) return { mode: 'client', from: from };
    if (HIRING.test(host) || /linkedin|naukri|indeed|glassdoor|wellfound|instahyre|internshala|foundit|cutshort|hirist|iimjobs|unstop/.test(src)) return { mode: 'hiring', from: from };
    if (CLIENT.test(host) || /instagram|facebook|whatsapp|threads/.test(src)) return { mode: 'client', from: from };
    var told = null;
    try { told = localStorage.getItem('shz_visitor_type'); } catch (e) {}
    if (told === 'recruiter') return { mode: 'hiring', from: '', back: true };
    if (told === 'client') return { mode: 'client', from: '', back: true };
    return null;
  }

  var I = {
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    plan: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>'
  };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.vm-card{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9000;max-width:400px;margin:0 auto;padding:14px 14px 12px;border-radius:18px;',
      'background:rgba(8,21,34,.94);border:1px solid rgba(90,224,255,.22);box-shadow:0 14px 40px rgba(0,0,0,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
      'color:#e6f3fb;font-family:"DM Sans",Inter,system-ui,sans-serif;opacity:0;transform:translateY(18px);transition:opacity .35s ease,transform .45s cubic-bezier(.16,1,.3,1)}',
      '.vm-card.on{opacity:1;transform:none}',
      '@media(min-width:900px){.vm-card{left:24px;right:auto;bottom:24px;width:380px;margin:0}}',
      '.vm-card svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
      '.vm-x{position:absolute;top:6px;right:6px;width:40px;height:40px;display:grid;place-items:center;border:0;border-radius:50%;background:none;color:#8fb3c5;cursor:pointer}',
      '.vm-tag{font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5ae0ff}',
      '.vm-t{margin:3px 40px 10px 0;font-size:.98rem;font-weight:700;line-height:1.3;color:#fff}',
      '.vm-acts{display:grid;gap:7px}',
      '.vm-acts button,.vm-acts a{display:flex;align-items:center;gap:9px;min-height:44px;padding:0 12px;border-radius:12px;font:600 .86rem "DM Sans",Inter,sans-serif;',
      'color:#d9eef8;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);cursor:pointer;text-decoration:none;text-align:left}',
      '.vm-acts .main{color:#04121a;background:linear-gradient(135deg,#5ae0ff,#4fe0a2);border-color:transparent}',
      '.vm-card :focus-visible{outline:2px solid #5ae0ff;outline-offset:2px}',
      '@media(prefers-reduced-motion:reduce){.vm-card{transition:none}}',
      '@media print{.vm-card{display:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function go(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (typeof window.shzLandOn === 'function') window.shzLandOn(el); else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function card(info) {
    var hiring = info.mode === 'hiring';
    var greet = info.from ? 'Welcome from ' + info.from : (info.back ? 'Welcome back' : 'Welcome');
    var title = hiring ? 'Hiring? Here’s the short version.' : 'Need a website or an app built?';
    var acts = hiring
      ? '<button type="button" class="main" data-vm="quick">' + svg(I.clock) + 'My profile in 60 seconds</button>'
        + '<button type="button" data-vm="fit">' + svg(I.target) + 'Check my fit for your role</button>'
        + '<a href="/resume-ats.pdf" download="Sahnawaz-Ahmed-Laskar-Resume.pdf" data-vm="cv">' + svg(I.file) + 'Download my resume (PDF)</a>'
      : '<button type="button" class="main" data-vm="brief">' + svg(I.plan) + 'Plan your project with AI</button>'
        + '<button type="button" data-vm="check">' + svg(I.pulse) + 'Check your website for free</button>'
        + '<button type="button" data-vm="price">' + svg(I.tag) + 'See services and pricing</button>';
    var el = document.createElement('div');
    el.className = 'vm-card';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.innerHTML = '<button type="button" class="vm-x" data-vm="close" aria-label="Close">' + svg(I.x) + '</button>'
      + '<div class="vm-tag">' + greet + '</div><p class="vm-t">' + title + '</p><div class="vm-acts">' + acts + '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });

    var close = function () { el.classList.remove('on'); setTimeout(function () { el.remove(); }, 400); };
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vm]');
      if (!b) return;
      var what = b.getAttribute('data-vm');
      try { if (window.gtag) gtag('event', 'arrival_card', { mode: info.mode, action: what, from: info.from || '' }); } catch (x) {}
      if (what === 'cv') { setTimeout(close, 300); return; }
      close();
      if (what === 'quick' && typeof window.openRecruiterView === 'function') window.openRecruiterView();
      if (what === 'fit') go('#job-fit');
      if (what === 'brief' && typeof window.openBrief === 'function') window.openBrief({ from: 'arrival' });
      if (what === 'check') go('#website-check');
      if (what === 'price') go('#what-i-offer');
    });
    /* it steps aside once the visitor is busy reading */
    var startY = scrollY;
    addEventListener('scroll', function onScroll() {
      if (Math.abs(scrollY - startY) > innerHeight * 1.6) { removeEventListener('scroll', onScroll); if (el.isConnected) close(); }
    }, { passive: true });
    try { if (window.gtag) gtag('event', 'arrival_card_shown', { mode: info.mode, from: info.from || '' }); } catch (x) {}
  }

  var info = detect();
  if (!info || store('shz_arrival_shown')) return;
  /* a recruiter link already opens the 60-second view; no card on top of it */
  if (new URLSearchParams(location.search).get('view') === 'recruiter') { store('shz_arrival_shown', '1'); return; }
  var start = function () {
    setTimeout(function () {
      /* not while something else is open on top of the page */
      if (document.querySelector('.rqv.on') || document.documentElement.style.overflow === 'hidden') return;
      store('shz_arrival_shown', '1');
      css();
      card(info);
    }, 3500);
  };
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
})();
