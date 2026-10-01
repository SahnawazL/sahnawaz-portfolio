/* ============================================================
   FREE WEBSITE CHECK  —  ByteWithSahnawaz
   The "Free Website Check" section (#website-check) and the shared
   report renderer the chat uses (window.shzCheck).

   Server: api/vitals.js → lib/website-check.js
     POST { mode:'check', part:'basics' }  quick read of the homepage (~2 s)
     POST { mode:'check', part:'full' }    + Google's phone test + AI (~15–40 s; very big
                                           pages up to ~2 min — the server may wait 150 s)
     POST { mode:'check', part:'speed' }   Google's test again, when it didn't finish
                                           (the "↻ Run speed test" button; once by itself)
     POST { mode:'check-email', id, email } emails the report, tells Sahnawaz
   Both check requests start together: the quick one fills the report in
   while Google's test runs, the full one completes it.

   Links: /?check=yourbusiness.com&type=clinic opens a report directly
   (results are kept for 24 h, so a shared link opens instantly).
   Every string from the checked site is escaped before it is shown.
   ============================================================ */
(function () {
  'use strict';
  if (window.shzCheck) return;

  var API = 'https://sahnawaz-portfolio.vercel.app/api/vitals';
  var SITE = 'https://sahnawaz-portfolio.vercel.app';
  var TYPES = {
    clinic:     { label: 'Clinic / Doctor',   emoji: '🏥', ctx: 'clinic website',            say: 'clinic' },
    restaurant: { label: 'Restaurant / Café', emoji: '🍽️', ctx: 'restaurant website',        say: 'restaurant' },
    shop:       { label: 'Shop / Store',      emoji: '🛍️', ctx: 'shop website',              say: 'shop' },
    school:     { label: 'School / Coaching', emoji: '🏫', ctx: 'school or coaching website', say: 'school' },
    other:      { label: 'Business',          emoji: '💼', ctx: 'business website',          say: 'business' }
  };
  var LANGS = { en: 'English', hi: 'हिन्दी', bn: 'বাংলা', as: 'অসমীয়া' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function safeImg(u) { return /^https?:\/\/[^\s"'<>]+$/i.test(String(u || '')) ? String(u) : ''; }
  function safeShot(u) { return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(String(u || '')) ? String(u) : ''; }
  function secs(ms) { return Math.round(ms / 100) / 10; }
  function color(v) { return v == null ? 'na' : v >= 85 ? 'good' : v >= 60 ? 'mid' : 'bad'; }

  /* quick client-side sanity check (the server does the real one) */
  function looksLikeSite(v) {
    v = String(v || '').trim();
    return v.length > 3 && v.length < 200 && !/\s/.test(v) && /[a-z0-9-]\.[a-z]{2,}/i.test(v.replace(/^https?:\/\//i, ''));
  }
  function cleanHost(v) { return String(v || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase(); }

  function post(body, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms) : 0;
    return fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (res) {
      clearTimeout(t);
      return res.json().catch(function () { return null; }).then(function (j) { return { ok: res.ok, status: res.status, body: j || {} }; });
    }, function (e) { clearTimeout(t); throw e; });
  }

  /* Run a check. cb: onBasics(report), onFull(report), onError(message).
     opts.fresh: test again from scratch instead of reusing today's report. */
  function run(url, type, lang, cb, opts) {
    cb = cb || {};
    var done = false;
    var q = { mode: 'check', url: url, type: TYPES[type] ? type : 'other', lang: LANGS[lang] ? lang : 'en' };
    if (opts && opts.fresh) q.fresh = true;
    function finish(r) { if (done) return; done = true; if (cb.onFull) cb.onFull(r); }
    function fail(m) { if (done) return; done = true; if (cb.onError) cb.onError(m || 'Something went wrong — please try again.'); }
    post(Object.assign({ part: 'basics' }, q), 25000).then(function (r) {
      if (done) return;
      var d = r.body;
      if (d.report && d.report.part === 'full') finish(d.report);
      else if (d.report) { if (cb.onBasics) cb.onBasics(d.report); }
      else if (d.error && d.error !== 'server') fail(d.message);   /* the site can't be opened: no need to wait */
    }).catch(function () {});
    post(Object.assign({ part: 'full' }, q), 160000).then(function (r) {
      var d = r.body;
      if (d.report) finish(d.report); else fail(d.message);
    }).catch(function () {
      fail(navigator.onLine === false ? "You seem to be offline — check your connection and try again." : 'The check took too long — please try again in a minute.');
    });
    return { cancel: function () { done = true; } };
  }

  /* ── pieces of the report ─────────────────────────────────────────── */
  function ring(v, size) {
    var r = 26, c = 2 * Math.PI * r, off = v == null ? c : c * (1 - v / 100);
    return '<div class="wc-ring wc-' + color(v) + '" style="--sz:' + (size || 84) + 'px">' +
      '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="wc-ring-bg" cx="32" cy="32" r="' + r + '"/>' +
      '<circle class="wc-ring-fg" cx="32" cy="32" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<span class="wc-ring-n">' + (v == null ? '–' : v) + '</span></div>';
  }
  /* why Google's phone test is missing (the server says which) */
  var SPEED_NOTE = {
    timeout: "Google's test didn't finish in time — big pages can take longer.",
    quota: "Google's test is busy right now.",
    nokey: "Google's test is busy right now.",
    key: "Google's speed test isn't available right now.",
    lighthouse: "Google's test phone couldn't open this page.",
    google: "Google's test didn't respond.",
    network: "Google's test didn't respond.",
    failed: "Google's test didn't respond."
  };
  function speedExtra(r) {
    return '<small>' + esc(SPEED_NOTE[r.speedError] || SPEED_NOTE.failed) + '</small>' +
      '<button type="button" class="wc-retry" data-wc="retry-speed">↻ Run speed test</button>';
  }
  function tiles(r) {
    var s = r.scores || {};
    var T = [['⚡', 'Speed on a phone', s.speed], ['🔎', 'Google basics', s.google], ['👆', 'Easy to use', s.easy], ['📞', 'Contact & trust', s.contact]];
    return '<div class="wc-tiles">' + T.map(function (t, i) {
      var speedGone = i === 0 && t[2] == null && r.speedUnavailable;
      return '<div class="wc-tile wc-' + color(t[2]) + (i === 0 ? ' wc-tile-speed' : '') + '"><div class="wc-tile-top"><span>' + t[0] + ' ' + t[1] + '</span><b>' + (t[2] == null ? '–' : t[2]) + '</b></div>' +
        '<div class="wc-bar"><i style="transform:scaleX(' + ((t[2] || 0) / 100) + ')"></i></div>' +
        (speedGone ? '<div class="wc-speed-extra">' + speedExtra(r) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function checklist(r) {
    var type = TYPES[r.type] || TYPES.other;
    return '<div class="wc-block"><h4>Checklist for a ' + esc(type.say) + '</h4><ul class="wc-checks">' + (r.checklist || []).map(function (c) {
      var st = c.ok === true ? 'ok' : c.ok === null ? 'na' : 'no';
      return '<li class="wc-c-' + st + '"><span aria-hidden="true">' + (st === 'ok' ? '✓' : st === 'na' ? '?' : '✗') + '</span>' + esc(c.label) +
        (st === 'no' ? ' <em>not found</em>' : st === 'na' ? ' <em>couldn\'t tell</em>' : '') + '</li>';
    }).join('') + '</ul></div>';
  }
  function whatsapp(r) {
    var p = r.preview || {}, img = safeImg(p.image);
    return '<figure class="wc-vis wc-wa"><figcaption>💬 How your link looks on WhatsApp</figcaption><div class="wc-wa-chat"><div class="wc-wa-bubble">' +
      (img ? '<img class="wc-wa-img" src="' + esc(img) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<div class=&quot;wc-wa-noimg&quot;>Picture failed to load</div>\'">'
           : '<div class="wc-wa-noimg">No preview picture</div>') +
      '<div class="wc-wa-meta"><b>' + esc(p.title || r.host) + '</b>' + (p.description ? '<span>' + esc(p.description) + '</span>' : '') + '<i>' + esc(r.host) + '</i></div></div>' +
      '<div class="wc-wa-link">' + esc(r.url) + '</div></div>' +
      (p.hasOg ? '<p class="wc-note wc-good-note">✓ Your link shows a picture and title when shared.</p>'
               : '<p class="wc-note">Links with a picture and title get far more taps when shared on WhatsApp and Facebook.</p>') + '</figure>';
  }
  function phone(r) {
    var shot = safeShot(r.screenshot), sp = r.speed || {};
    var cap = sp.lcp ? 'Main content shows after <b>' + esc(sp.lcp.text || secs(sp.lcp.value) + ' s') + '</b>' + (sp.fcp ? ' · first thing after ' + esc(sp.fcp.text || secs(sp.fcp.value) + ' s') : '') : '';
    return '<figure class="wc-vis wc-phone"><figcaption>📱 What customers see on a phone</figcaption><div class="wc-phone-frame">' +
      (shot ? '<img src="' + shot + '" alt="Your homepage on a phone">' : '<div class="wc-phone-empty">' + (r.part === 'basics' ? '<span class="wc-spin"></span>Taking the screenshot…'
        : r.speedUnavailable ? '<span>No screenshot yet — it comes from Google\'s phone test. Tap <b>↻ Run speed test</b> above.</span>' : 'Screenshot unavailable') + '</div>') +
      '</div>' + (cap ? '<p class="wc-note">' + cap + '</p>' : '') + '</figure>';
  }
  function speedWhy(r) {
    var sp = r.speed;
    if (!sp || !sp.opportunities || !sp.opportunities.length) return '';
    return '<div class="wc-block"><h4>Why it\'s slow</h4><ul class="wc-why">' + sp.opportunities.map(function (o) {
      return '<li>' + esc(o.label) + ' <em>' + (o.savingsMs >= 150 ? '≈ ' + secs(o.savingsMs) + ' s' : o.savingsKb ? '≈ ' + esc(o.savingsKb) + ' KB' : '') + '</em></li>';
    }).join('') + '</ul>' +
      (sp.field ? '<p class="wc-note">Real visitors on Chrome: <b>' + esc(sp.field.category === 'FAST' ? 'fast' : sp.field.category === 'SLOW' ? 'slow' : 'average') + '</b>' +
        (sp.field.lcpMs ? ' (main content after ~' + secs(sp.field.lcpMs) + ' s)' : '') + '.</p>' : '') +
      (sp.pageMb ? '<p class="wc-note">The page downloads ' + esc(sp.pageMb) + ' MB on a phone.</p>' : '') + '</div>';
  }
  function fixes(r) {
    var t = r.text;
    if (!t || !t.top3 || !t.top3.length) return '';
    return '<div class="wc-block wc-fixes-block"><h4>Top things to fix</h4><ol class="wc-fixes">' + t.top3.map(function (x) {
      return '<li><b>' + esc(x.title) + '</b><span>' + esc(x.why) + '</span><span class="wc-fix-how">' + esc(x.fix) + '</span></li>';
    }).join('') + '</ol></div>';
  }

  /* the full report (the section, or anywhere else it is shown) */
  function reportHtml(r) {
    var t = r.text || {}, s = r.scores || {};
    var full = r.part === 'full';
    var type = TYPES[r.type] || TYPES.other;
    return '<div class="wc-report' + (full ? '' : ' is-partial') + '" data-id="' + esc(r.id) + '">' +
      '<div class="wc-r-head">' + ring(full ? s.overall : null, 84) +
        '<div class="wc-r-txt"><div class="wc-r-site">' + esc(r.host) + ' · ' + esc(type.label) + ' · tested on a phone</div>' +
        (full ? '<div class="wc-r-verdict wc-' + color(s.overall) + '">' + esc(r.verdict && r.verdict.label) + '</div>' +
                (t.headline ? '<p class="wc-r-headline">' + esc(t.headline) + '</p>' : '') + (t.summary ? '<p class="wc-r-summary">' + esc(t.summary) + '</p>' : '')
              : '<div class="wc-r-verdict">Checking speed on a phone…</div><p class="wc-r-summary">Your homepage is read — Google\'s phone test is running. The full report appears here in a few seconds.</p>') +
        '</div></div>' +
      (full ? tiles(r) : '') +
      '<div class="wc-visuals">' + phone(r) + whatsapp(r) + '</div>' +
      fixes(r) +
      '<div class="wc-cols">' + checklist(r) + speedWhy(r) + '</div>' +
      (full && t.strengths && t.strengths.length ? '<p class="wc-strengths"><b>Already good:</b> ' + t.strengths.map(esc).join(' · ') + '</p>' : '') +
      (full && r.compare ? '<p class="wc-compare">For comparison, this portfolio scores <b>' + esc(r.compare.speed) + '</b> for speed on the same phone test.</p>' : '') +
      (full ? '<div class="wc-cta">' +
          '<button type="button" class="wc-btn wc-btn-fix" data-wc="fix">📝 Fix it with Sahnawaz</button>' +
          '<button type="button" class="wc-btn wc-btn-ask" data-wc="ask">💬 Ask the AI about this report</button>' +
          '<button type="button" class="wc-btn wc-btn-share" data-wc="share">🔗 Share report</button>' +
          '<form class="wc-mail" data-wc="mail" novalidate><input type="email" autocomplete="email" placeholder="your@email.com" aria-label="Your email" maxlength="120">' +
            '<button type="submit" class="wc-btn wc-btn-mail">📧 Email me this report</button><p class="wc-mail-msg" role="status"></p></form>' +
        '</div>' +
        '<p class="wc-foot">A snapshot from Google\'s PageSpeed test on a mid-range phone plus a read of your homepage, checked ' + ago(r.checkedAt) +
          '. Scores vary a little between runs. <button type="button" class="wc-again" data-wc="again">Check another site</button></p>' : '') +
    '</div>';
  }
  function ago(iso) {
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (!(m >= 0)) return 'just now';
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago';
  }

  /* compact card for the chat */
  function miniHtml(r) {
    var s = r.scores || {}, t = r.text || {};
    var T = [['⚡', s.speed], ['🔎', s.google], ['👆', s.easy], ['📞', s.contact]];
    return '<div class="wc-mini" data-id="' + esc(r.id) + '">' +
      '<div class="wc-mini-head">' + ring(s.overall, 54) + '<div><div class="wc-mini-site">🩺 ' + esc(r.host) + '</div>' +
        '<div class="wc-r-verdict wc-' + color(s.overall) + '">' + esc(r.verdict && r.verdict.label) + '</div></div></div>' +
      (t.headline ? '<p class="wc-mini-line">' + esc(t.headline) + '</p>' : '') +
      '<div class="wc-mini-scores">' + T.map(function (x) { return '<span class="wc-' + color(x[1]) + '">' + x[0] + ' ' + (x[1] == null ? '–' : x[1]) + '</span>'; }).join('') + '</div>' +
      (t.top3 && t.top3.length ? '<ol class="wc-mini-fixes">' + t.top3.map(function (x) { return '<li>' + esc(x.title) + '</li>'; }).join('') + '</ol>' : '') +
      '<div class="wc-mini-cta"><button type="button" class="wc-btn wc-btn-sm" data-wc-mini="full">📄 Full report</button>' +
        '<button type="button" class="wc-btn wc-btn-sm wc-btn-fix" data-wc-mini="fix">📝 Fix it with Sahnawaz</button></div></div>';
  }

  /* a plain summary the chat keeps in its memory, so follow-up questions
     ("why is it slow?") are answered with this report in mind */
  function summaryText(r) {
    var s = r.scores || {}, t = r.text || {};
    var parts = ['Website check for ' + r.host + ' (' + (TYPES[r.type] || TYPES.other).label + '): ' + (s.overall == null ? '?' : s.overall) + '/100, ' + (r.verdict && r.verdict.label) + '.',
      'Speed on a phone ' + (s.speed == null ? 'unavailable' : s.speed) + ', Google basics ' + s.google + ', easy to use ' + (s.easy == null ? '–' : s.easy) + ', contact & trust ' + s.contact + '.'];
    if (r.speed && r.speed.lcp) parts.push('Main content shows after ' + secs(r.speed.lcp.value) + ' s on a phone.');
    var probs = (r.findings || []).slice(0, 5).map(function (f) { return f.title; });
    if (probs.length) parts.push('Problems: ' + probs.join('; ') + '.');
    if (r.speed && r.speed.opportunities && r.speed.opportunities.length) parts.push('Why slow: ' + r.speed.opportunities.map(function (o) { return o.label + (o.savingsMs >= 150 ? ' (≈' + secs(o.savingsMs) + ' s)' : o.savingsKb ? ' (≈' + o.savingsKb + ' KB)' : ''); }).join('; ') + '.');
    if (r.builtWith) parts.push('Built with ' + r.builtWith + '.');
    if (t.headline) parts.push(t.headline);
    return parts.join(' ');
  }

  /* ── actions shared by the section and the chat ─────────────────────── */
  function fix(r) {
    var top = (r.text && r.text.top3 || []).map(function (x) { return x.title; }).slice(0, 3).join('; ');
    if (typeof window.openBrief !== 'function') { location.href = SITE + '/?plan=redesign'; return; }
    window.openBrief({
      type: 'Website redesign', context: 'website fix', from: 'check',
      prefill: { website: r.url, notes: ('Free website check: ' + (r.scores.overall == null ? '?' : r.scores.overall) + '/100 (' + (r.verdict && r.verdict.label) + '). To fix: ' + top).slice(0, 380) }
    });
  }
  function shareUrl(r) { return SITE + '/?check=' + encodeURIComponent(r.key || r.host) + '&type=' + r.type + (r.lang && r.lang !== 'en' ? '&lang=' + r.lang : ''); }
  function share(r, btn) {
    var url = shareUrl(r);
    var text = 'Free website check for ' + r.host + ': ' + (r.scores.overall == null ? '' : r.scores.overall + '/100');
    var said = function (m) { if (!btn) return; var o = btn.textContent; btn.textContent = m; setTimeout(function () { btn.textContent = o; }, 1800); };
    if (navigator.share) { navigator.share({ title: 'Website check', text: text, url: url }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { said('✓ Link copied'); }, function () { window.prompt('Copy this link:', url); });
    else window.prompt('Copy this link:', url);
  }
  function knownEmail() {
    try { var v = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null'); return v && v.email ? { email: v.email, name: v.fullName || v.firstName || '' } : null; } catch (e) { return null; }
  }
  function sendMail(r, form) {
    var input = form.querySelector('input'), btn = form.querySelector('button'), msg = form.querySelector('.wc-mail-msg');
    var email = String(input.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'wc-mail-msg is-err'; input.focus(); return; }
    var k = knownEmail();
    btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = ''; msg.className = 'wc-mail-msg';
    post({ mode: 'check-email', id: r.id, email: email, name: k && k.email === email ? k.name : '' }, 30000).then(function (res) {
      if (res.body && res.body.success) {
        form.innerHTML = '<p class="wc-mail-msg is-ok">✓ Sent to ' + esc(email) + ' — check your inbox (and spam, just in case).</p>';
      } else {
        btn.disabled = false; btn.textContent = '📧 Email me this report';
        msg.textContent = (res.body && res.body.message) || "Couldn't send it just now — please try again."; msg.className = 'wc-mail-msg is-err';
      }
    }).catch(function () {
      btn.disabled = false; btn.textContent = '📧 Email me this report';
      msg.textContent = "Couldn't reach the server — please try again."; msg.className = 'wc-mail-msg is-err';
    });
  }
  function askChat(r) {
    if (typeof window._chatAboutReport === 'function') window._chatAboutReport(r);
    else if (window.openChat) window.openChat();
  }

  /* ── the section ──────────────────────────────────────────────────── */
  var sec = document.getElementById('website-check');
  var form, input, out, errEl, goBtn, current = null, job = null, tick = 0;
  var state = { type: 'other', lang: 'en' };
  var gen = 0, lastInput = '', retrying = false;   /* gen: which report is on screen (a new check or report makes older replies stale) */

  /* redraw the report in place, keeping what the visitor typed in the email box
     (or the "✓ Sent" note if they already emailed it) */
  function rerender(r) {
    var old = out.querySelector('.wc-mail'), oldInput = old && old.querySelector('input');
    var sentHtml = old && !oldInput ? old.innerHTML : null, typed = oldInput ? oldInput.value : '';
    out.innerHTML = reportHtml(r);
    var f = out.querySelector('.wc-mail');
    if (!f) return;
    if (sentHtml) { f.innerHTML = sentHtml; return; }
    var mi = f.querySelector('input'), k = knownEmail();
    if (mi) mi.value = typed || (k ? k.email : '');
  }

  /* "↻ Run speed test": only Google's phone test runs again (up to ~2 min) */
  var AUTO_RETRY = { timeout: 1, google: 1, network: 1, failed: 1 };
  function retrySpeed(auto) {
    var r = current;
    if (!r || retrying || !r.speedUnavailable) return;
    retrying = true;
    var mine = gen;
    var box = out.querySelector('.wc-tile-speed .wc-speed-extra');
    if (box) box.innerHTML = '<small class="wc-retrying" role="status"><span class="wc-spin" aria-hidden="true"></span><span>' +
      (auto ? 'Google\'s test needed more time — running it again…' : 'Running Google\'s phone test…') + ' <em>(big pages take up to 2 min)</em></span></small>';
    var shot = out.querySelector('.wc-phone-empty');
    if (shot) shot.innerHTML = '<span class="wc-spin"></span>Taking the screenshot…';
    var url = lastInput && cleanHost(lastInput) === r.host ? lastInput : (r.key || r.host);
    var stale = function () { return mine !== gen || current !== r; };
    post({ mode: 'check', part: 'speed', url: url, type: r.type, lang: r.lang || 'en' }, 160000).then(function (res) {
      retrying = false;
      if (stale()) return;
      var d = res.body || {};
      if (d.report) { current = d.report; rerender(d.report); return; }
      rerender(r);
      var b = out.querySelector('.wc-tile-speed .wc-speed-extra small');
      if (b) b.textContent = d.message || "Couldn't run the test just now — please try again in a minute.";
    }).catch(function () {
      retrying = false;
      if (stale()) return;
      rerender(r);
      var b = out.querySelector('.wc-tile-speed .wc-speed-extra small');
      if (b) b.textContent = navigator.onLine === false ? 'You seem to be offline — check your connection.' : "Google's test took too long again — try once more in a minute.";
    });
  }

  function setChoice(group, attr, val) {
    Array.prototype.forEach.call(sec.querySelectorAll(group), function (b) {
      var on = b.getAttribute(attr) === val;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function showError(m) { errEl.textContent = m; errEl.hidden = !m; }

  function progressHtml(host) {
    return '<div class="wc-progress" role="status"><div class="wc-prog-head"><span class="wc-spin" aria-hidden="true"></span>Checking <b>' + esc(host) + '</b>' +
      '<span class="wc-elapsed">0 s</span></div><ol class="wc-steps">' +
      '<li class="is-active" data-s="open">Opening your website</li><li data-s="read">Reading what customers see</li>' +
      '<li data-s="speed">Testing it on a phone with Google\'s test and writing your report <em>(usually 15–40 s, big pages up to 2 min)</em></li></ol></div>';
  }
  function markSteps(n) {
    var li = out.querySelectorAll('.wc-steps li');
    Array.prototype.forEach.call(li, function (x, i) { x.classList.toggle('is-done', i < n); x.classList.toggle('is-active', i === n); });
  }
  function start(url, type, lang) {
    if (!sec) return;
    if (!looksLikeSite(url)) { showError("That doesn't look like a website address — try something like yourbusiness.com"); input.focus(); return; }
    showError('');
    if (job) job.cancel();
    clearInterval(tick);
    current = null; gen++; retrying = false; lastInput = url;
    var host = cleanHost(url), t0 = Date.now();
    out.hidden = false;
    out.innerHTML = progressHtml(host) + '<div class="wc-slot"></div>';
    goBtn.disabled = true; goBtn.textContent = 'Checking…';
    tick = setInterval(function () { var e = out.querySelector('.wc-elapsed'); if (e) e.textContent = Math.round((Date.now() - t0) / 1000) + ' s'; }, 1000);
    var slot = out.querySelector('.wc-slot');
    var end = function () { clearInterval(tick); goBtn.disabled = false; goBtn.textContent = 'Check my website'; };
    job = run(url, type, lang, {
      onBasics: function (r) { markSteps(2); slot.innerHTML = reportHtml(r); },
      onFull: function (r) {
        end(); current = r;
        out.innerHTML = reportHtml(r);
        var k = knownEmail(), mi = out.querySelector('.wc-mail input');
        if (k && mi) mi.value = k.email;
        requestAnimationFrame(function () { out.classList.add('is-ready'); });
        /* Google ran out of time (not a refusal): try once more by itself */
        if (r.speedUnavailable && AUTO_RETRY[r.speedError || 'failed']) setTimeout(function () { retrySpeed(true); }, 600);
      },
      onError: function (m) { end(); out.innerHTML = ''; out.hidden = true; showError(m); }
    });
  }
  function showReport(r, scroll) {
    if (!sec || !r) return;
    if (job) job.cancel();
    clearInterval(tick);
    current = r; gen++; retrying = false; lastInput = '';
    input.value = r.host;
    state.type = r.type; setChoice('.wc-type', 'data-type', r.type);
    out.hidden = false;
    out.innerHTML = reportHtml(r);
    var k = knownEmail(), mi = out.querySelector('.wc-mail input');
    if (k && mi) mi.value = k.email;
    if (scroll) land(sec);
  }
  function land(el) {
    if (typeof window.shzLandOn === 'function') window.shzLandOn(el);
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (sec) {
    form = document.getElementById('wcForm');
    input = document.getElementById('wcUrl');
    out = document.getElementById('wcOut');
    errEl = document.getElementById('wcErr');
    goBtn = document.getElementById('wcGo');

    sec.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.wc-type, .wc-lang, [data-wc], #wcNoSite');
      if (!t) return;
      if (t.classList.contains('wc-type')) { state.type = t.getAttribute('data-type'); setChoice('.wc-type', 'data-type', state.type); return; }
      if (t.classList.contains('wc-lang')) { state.lang = t.getAttribute('data-lang'); setChoice('.wc-lang', 'data-lang', state.lang); return; }
      if (t.id === 'wcNoSite') {
        if (typeof window.openBrief === 'function') window.openBrief({ type: 'Business website', context: TYPES[state.type].ctx, from: 'check' });
        return;
      }
      var act = t.getAttribute('data-wc');
      if (!current && act !== 'again') return;
      if (act === 'fix') fix(current);
      else if (act === 'share') share(current, t);
      else if (act === 'ask') askChat(current);
      else if (act === 'retry-speed') retrySpeed(false);
      else if (act === 'again') { land(form); setTimeout(function () { try { input.focus({ preventScroll: true }); input.select(); } catch (er) {} }, 500); }
    });
    sec.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target === form) { start(input.value, state.type, state.lang); return; }
      if (e.target.getAttribute('data-wc') === 'mail' && current) sendMail(current, e.target);
    });
    input.addEventListener('input', function () { if (!errEl.hidden) showError(''); });

    /* /?check=yourbusiness.com&type=clinic&lang=hi → run it straight away */
    (function () {
      var p;
      try { p = new URLSearchParams(location.search); } catch (e) { return; }
      var site = p.get('check');
      if (!site || !looksLikeSite(site)) return;
      var ty = TYPES[p.get('type')] ? p.get('type') : 'other', lg = LANGS[p.get('lang')] ? p.get('lang') : 'en';
      state.type = ty; state.lang = lg;
      setChoice('.wc-type', 'data-type', ty); setChoice('.wc-lang', 'data-lang', lg);
      input.value = site;
      /* start the check at once; scroll once the page has settled (on a slow
         phone "load" can come late, so never wait more than 2.5 s) */
      start(site, ty, lg);
      var landed = false;
      var go = function () { if (landed) return; landed = true; land(sec); };
      if (document.readyState === 'complete') setTimeout(go, 300);
      else { window.addEventListener('load', function () { setTimeout(go, 300); }, { once: true }); setTimeout(go, 2500); }
    })();
  }

  window.shzCheck = {
    TYPES: TYPES, run: run, looksLikeSite: looksLikeSite, cleanHost: cleanHost,
    miniHtml: miniHtml, summaryText: summaryText, fix: fix, share: share,
    showReport: showReport,
    hasSection: !!sec
  };
})();
