/* ══ Contact section: "What do you need built?" — instant estimate ══
   Four quick taps (project → budget → timeline → business, the last one
   optional) and the estimate appears at once — no waiting on an AI call,
   because the prices are fixed. Everything comes from js/pricing.js, the
   same list the AI project planner and the server use, so a visitor never
   sees two different prices.

   It is honest about the fit: a budget below the usual starting price gets
   a starter option that fits, a bigger one gets real extras, and a timeline
   shorter than the usual delivery gets a note. The result goes on either as
   a full project brief (the planner in the chat, with these answers filled
   in) or as a plain message through the contact form below.
   "Fix my website" runs the free website check instead. */
(function(){
  var PR = window.SHZ_PRICING;
  if (!PR || !document.getElementById('ctWizard')) return;

  var ans = { type: null, budget: null, bLo: null, bHi: null, time: null, weeks: null, biz: '', line: '' };
  var step = 0, flow = [0, 1, 2, 3];
  var $ = function (id) { return document.getElementById(id); };

  /* ── sounds: the page's one shared audio engine (a new one per tap
     used to pile up until the browser refused to make more) ── */
  function chime(kind) {
    try {
      var ctx = window.__shzAudio && window.__shzAudio();
      if (!ctx) return;
      var t = ctx.currentTime;
      var note = function (f, at, dur, vol) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(f, t + at);
        g.gain.setValueAtTime(0.001, t + at);
        g.gain.linearRampToValueAtTime(vol, t + at + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + at + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t + at); o.stop(t + at + dur + 0.02);
      };
      if (kind === 'back') { note(500, 0, 0.08, 0.1); note(320, 0.06, 0.12, 0.08); }
      else if (kind === 'done') { note(523, 0, 0.2, 0.13); note(659, 0.13, 0.2, 0.12); note(784, 0.26, 0.28, 0.14); }
      else if (kind === 1) { note(660, 0, 0.22, 0.14); note(880, 0.14, 0.22, 0.12); }
      else { note(400, 0, 0.06, 0.12); note(700, 0.05, 0.1, 0.1); }
    } catch (e) {}
  }

  function inr(n) { return PR.inr(n); }
  function P() { return PR.TYPES[ans.type] || null; }

  /* ── steps ── */
  function show(n) {
    step = n;
    var ids = ['ctWizStep0', 'ctWizStep1', 'ctWizStep2', 'ctWizStep3', 'ctWizFix'];
    ids.forEach(function (id, i) { var s = $(id); if (s) s.classList.toggle('ct-wiz-active', i === n); });
    for (var i = 0; i < 4; i++) {
      var d = $('ctWizDot' + i);
      if (d) d.className = 'ct-wiz-dot' + (n === 4 ? (i === 0 ? ' ct-wiz-dot-active' : '') : i < n ? ' ct-wiz-dot-done' : i === n ? ' ct-wiz-dot-active' : '');
    }
    live();
  }
  function select(container, btn) {
    container.querySelectorAll('.ct-wiz-opt').forEach(function (b) { b.classList.toggle('ct-wiz-selected', b === btn); });
  }

  /* the strip above the steps: what it typically costs, updated every tap */
  function live() {
    var el = $('ctWizLive'), p = P();
    if (!el) return;
    if (!p || step === 4) { el.hidden = true; return; }
    var fit = fitOf(p);
    el.innerHTML = '<b>' + p.icon + ' ' + esc(ans.type) + '</b><span>' + (p.custom ? 'custom quote' : 'typically ' + PR.range(p)) + '</span>' +
      (p.custom ? '' : '<span>' + esc(p.time) + '</span>') +
      (fit && ans.budget ? '<span class="ct-live-fit ct-fit-' + fit.kind + '">' + fit.tag + '</span>' : '');
    el.hidden = false;
  }

  /* budget choices that make sense for this kind of project */
  function fillBudgets() {
    var p = P(), box = $('ctWizBudgets');
    box.innerHTML = '';
    p.budgets.concat([['Not sure yet', null, null]]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'ct-wiz-opt';
      btn.textContent = b[0];
      btn.addEventListener('click', function () {
        ans.budget = b[0]; ans.bLo = b[1]; ans.bHi = b[2];
        select(box, btn); chime(1); live();
        setTimeout(function () { show(2); }, 220);
      });
      box.appendChild(btn);
    });
    $('ctWizBudgetHint').textContent = p.custom
      ? 'This one is priced after Sahnawaz reads what you need — a rough budget helps him plan.'
      : 'Most ' + p.say + (/s$/.test(p.say) ? '' : 's') + ': ' + PR.range(p) + '.';
  }

  /* how the budget sits against the usual price */
  function fitOf(p) {
    if (!p || !ans.budget) return null;
    if (ans.bLo == null) return { kind: 'unsure', tag: 'budget open' };
    if (p.custom) return { kind: 'ok', tag: 'noted' };
    if (ans.bHi < p.lo) return { kind: 'short', tag: 'below usual' };
    if (ans.bLo > p.hi && p.lo !== p.hi) return { kind: 'room', tag: 'room for extras' };
    return { kind: 'ok', tag: 'fits ✓' };
  }

  function timeNote(p) {
    if (!p || !ans.weeks || p.custom || !p.weeks) return '';
    if (ans.weeks < p.weeks[0]) {
      return 'A ' + p.say + ' usually takes ' + p.time + '. For ' + (ans.time === 'ASAP' ? 'ASAP' : ans.time.toLowerCase()) +
        ', Sahnawaz can start with the most important part first — mention it in your brief.';
    }
    return '';
  }

  /* ── the estimate ── */
  function estimate() {
    var p = P(), fit = fitOf(p), out = [];
    out.push('<div class="ctq-head"><span class="ctq-type">' + p.icon + ' ' + esc(ans.type) + '</span>' +
      '<span class="ctq-price">' + esc(PR.range(p)) + '</span>' +
      '<span class="ctq-time">' + (p.custom ? 'Timeline depends on what you need' : 'Typical delivery: ' + esc(p.time)) + '</span></div>');
    if (!p.custom && p.lo !== p.hi) out.push(bar(p));

    var adv = '';
    if (!fit || fit.kind === 'unsure') adv = p.custom ? 'Send a brief and Sahnawaz will come back with a clear quote.' : 'Most clients spend ' + PR.range(p) + ' on a ' + p.say + '.';
    else if (fit.kind === 'short') adv = 'Your budget is below the usual starting price (' + inr(p.lo) + '). What fits: ' + p.starter + '.';
    else if (fit.kind === 'room') adv = 'Your budget has room for extras: ' + PR.EXTRAS.filter(function (x) { return !(ans.type === 'AI chatbot / integration' && /AI/.test(x[0])) && !(ans.type === 'Web ads & promotion' && /ad campaign/.test(x[0])); })
      .slice(0, 3).map(function (x) { return x[0] + ' (from ' + inr(x[1]) + ')'; }).join(', ') + '.';
    else adv = p.custom ? 'Budget noted — it helps Sahnawaz suggest the right approach.' : '✓ Your budget fits the usual range for a ' + p.say + '.';
    out.push('<p class="ctq-fit ctq-fit-' + (fit ? fit.kind : 'unsure') + '">' + esc(adv) + '</p>');
    var tn = timeNote(p);
    if (tn) out.push('<p class="ctq-fit ctq-fit-short">' + esc(tn) + '</p>');

    out.push('<ul class="ctq-gets">' + p.gets.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul>');
    out.push('<p class="ctq-note">Typical prices. Sahnawaz confirms the exact quote after reading your brief — all prepaid, no hidden costs, lifetime support.</p>');
    return out.join('');
  }
  /* the typical range as a band, with the visitor's budget marked on it */
  function bar(p) {
    var max = Math.max(p.hi * 1.6, (ans.bLo || 0) * 1.15);
    var pct = function (v) { return Math.max(0, Math.min(100, v / max * 100)).toFixed(1) + '%'; };
    var h = '<div class="ctq-bar" role="img" aria-label="Typical range ' + esc(PR.range(p)) + (ans.bLo != null ? ', your budget ' + esc(ans.budget) : '') + '">' +
      '<i class="ctq-band" style="left:' + pct(p.lo) + ';width:calc(' + pct(p.hi) + ' - ' + pct(p.lo) + ')"></i>';
    if (ans.bLo != null) {
      var bHi = Math.min(ans.bHi, max);
      h += '<i class="ctq-you" style="left:' + pct(ans.bLo) + ';width:calc(' + pct(bHi) + ' - ' + pct(ans.bLo) + ')"></i>';
    }
    h += '</div><div class="ctq-legend"><span><i class="ctq-k-band"></i>usual range</span>' + (ans.bLo != null ? '<span><i class="ctq-k-you"></i>your budget</span>' : '') + '</div>';
    return h;
  }

  function finish() {
    chime('done');
    $('ctWizard').classList.add('ct-wiz-hidden');
    $('ctQuoteText').innerHTML = estimate();
    $('ctQuoteCard').classList.add('ct-quote-visible');
    setTimeout(function () { try { $('ctQuoteCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }, 60);
  }

  function summary() {
    var l = [];
    if (ans.type) l.push('Project: ' + ans.type + (P() ? ' (typically ' + PR.range(P()) + ')' : ''));
    if (ans.budget) l.push('Budget: ' + ans.budget);
    if (ans.time) l.push('Timeline: ' + ans.time);
    if (ans.biz) l.push('Business: ' + ans.biz);
    if (ans.line) l.push('About it: ' + ans.line);
    return l.join('\n');
  }

  /* plain message: unlock the contact form below, filled in */
  function openForm(withSummary) {
    try {
      var sv = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null');
      if (sv && sv.uid) {
        var nf = $('name'), ef = $('email');
        if (nf && sv.firstName && !nf.value) { nf.value = sv.firstName; nf.dispatchEvent(new Event('input')); }
        if (ef && sv.email && !ef.value) { ef.value = sv.email; ef.dispatchEvent(new Event('input')); }
      }
    } catch (e) {}
    var mf = $('message');
    if (mf && withSummary) { mf.value = summary() + '\n\nAdditional details: '; mf.dispatchEvent(new Event('input')); }
    var fi = $('ctFormInner'), teaser = $('ctFormTeaser');
    if (fi) fi.classList.add('ct-form-ready');
    if (teaser) teaser.classList.add('ct-hide');
    setTimeout(function () {
      if (!fi) return;
      try { fi.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
      if (mf && window.matchMedia && window.matchMedia('(hover: hover)').matches) try { mf.focus({ preventScroll: true }); } catch (e) {}
    }, 120);
  }

  /* full brief: the AI planner in the chat, with these answers filled in */
  function openBrief() {
    if (typeof window.openBrief !== 'function') { openForm(true); return; }
    var biz = [ans.biz, ans.line].filter(Boolean).join(' — ');
    window.openBrief({
      type: ans.type, from: 'contact',
      prefill: { budget: ans.budget || '', timeline: ans.time || '', business: biz, notes: ans.line || '' }
    });
  }

  /* ── wiring ── */
  document.querySelectorAll('#ctWizStep0 .ct-wiz-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-type');
      select(btn.parentNode, btn); chime(0);
      if (t === 'fix') { ans.type = 'Website redesign'; setTimeout(function () { show(4); try { $('ctWizUrl').focus({ preventScroll: true }); } catch (e) {} }, 200); return; }
      if (t !== ans.type) { ans.budget = ans.bLo = ans.bHi = null; }
      ans.type = t;
      fillBudgets(); live();
      setTimeout(function () { show(1); }, 220);
    });
  });
  document.querySelectorAll('#ctWizStep2 .ct-wiz-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      ans.time = btn.getAttribute('data-time');
      ans.weeks = +btn.getAttribute('data-weeks') || null;
      select(btn.parentNode, btn); chime(1);
      $('ctWizTimeHint').textContent = timeNote(P());
      setTimeout(function () { show(3); }, $('ctWizTimeHint').textContent ? 900 : 220);
    });
  });
  document.querySelectorAll('#ctWizBiz .ct-wiz-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = !btn.classList.contains('ct-wiz-selected');
      select(btn.parentNode, on ? btn : null); chime(0);
      ans.biz = on ? btn.getAttribute('data-biz') : '';
    });
  });
  $('ctWizSee').addEventListener('click', function () { ans.line = ($('ctWizLine').value || '').trim().slice(0, 160); finish(); });
  $('ctWizLine').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('ctWizSee').click(); } });
  document.querySelectorAll('#ctWizard .ct-wiz-back').forEach(function (b) {
    b.addEventListener('click', function () {
      chime('back');
      if (b.getAttribute('data-to') === '0' || step === 4) { ans.type = null; show(0); return; }
      if (step > 0) show(step - 1);
    });
  });
  $('ctWizSkip').addEventListener('click', function () { chime(0); openForm(false); });

  /* "Fix my website": run the free check in its own section */
  $('ctWizCheck').addEventListener('click', function () {
    var url = ($('ctWizUrl').value || '').trim(), hint = $('ctWizUrlHint');
    var ok = window.shzCheck && window.shzCheck.looksLikeSite ? window.shzCheck.looksLikeSite(url) : /\.[a-z]{2,}/i.test(url);
    if (!ok) { hint.textContent = "That doesn't look like a website address — try something like yourbusiness.com"; hint.classList.add('ct-wiz-hint-warn'); return; }
    hint.classList.remove('ct-wiz-hint-warn');
    var input = $('wcUrl'), form = $('wcForm'), sec = $('website-check');
    if (!input || !form || !sec) { if (window._startWebsiteCheck) { window.openChat && window.openChat(); setTimeout(function () { window._startWebsiteCheck({ url: url }); }, 600); } return; }
    input.value = url; input.dispatchEvent(new Event('input'));
    var run = function () { try { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } catch (e) {} };
    if (window.shzLandOn) window.shzLandOn(sec, run); else { sec.scrollIntoView({ behavior: 'smooth' }); setTimeout(run, 700); }
  });
  $('ctWizUrl').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('ctWizCheck').click(); } });

  $('ctqBrief').addEventListener('click', function () { chime(0); openBrief(); });
  $('ctqMsg').addEventListener('click', function () { chime(0); openForm(true); });
  $('ctqEdit').addEventListener('click', function () { window.ctWizReset(); });

  /* ── reset (also used after the form is sent) ── */
  window.ctWizReset = function () {
    chime('back');
    ans = { type: null, budget: null, bLo: null, bHi: null, time: null, weeks: null, biz: '', line: '' };
    $('ctQuoteCard').classList.remove('ct-quote-visible');
    var fi = $('ctFormInner'), teaser = $('ctFormTeaser');
    if (fi) fi.classList.remove('ct-form-ready');
    if (teaser) teaser.classList.remove('ct-hide');
    try {
      var sv = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null');
      if (!(sv && sv.uid)) ['name', 'email'].forEach(function (id) { var f = $(id); if (f) { f.value = ''; f.dispatchEvent(new Event('input')); } });
    } catch (e) {}
    var mf = $('message'); if (mf) { mf.value = ''; mf.dispatchEvent(new Event('input')); }
    $('ctWizLine').value = ''; $('ctWizTimeHint').textContent = '';
    document.querySelectorAll('#ctWizard .ct-wiz-opt').forEach(function (b) { b.classList.remove('ct-wiz-selected'); });
    $('ctWizard').classList.remove('ct-wiz-hidden');
    show(0);
  };
  /* older names, kept for anything that still calls them */
  window.ctWizBack = function () { if (step > 0) show(step === 4 ? 0 : step - 1); };
  window.ctWizPick = function () {};
  var _origCtResetForm = window.ctResetForm;
  window.ctResetForm = function () { if (_origCtResetForm) _origCtResetForm(); window.ctWizReset(); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
