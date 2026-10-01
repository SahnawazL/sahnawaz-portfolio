/* ══ Contact section: "What do you need built?" — AI project estimate ══
   Four quick taps (project → budget → timeline → business, the last one
   optional). The price, delivery time and what's included show at once,
   straight from js/pricing.js — the same list the AI project planner and
   the server use, so a visitor never sees two different prices. The AI
   then adds advice for the visitor's own business (api/chat.js, source
   "wizard"); it never quotes a price, and the card works without it.

   It is honest about the fit: a budget below the usual starting price gets
   a starter option that fits, a bigger one gets real extras, and a timeline
   shorter than the usual delivery gets a note. The result goes on either as
   a full project brief (the planner in the chat, with these answers filled
   in) or as a plain message through the contact form below.
   "Fix my website" runs the free website check instead.

   Motion: each step slides out the way you're going while the box eases
   to the next step's height; chips confirm with a tick before moving on;
   Back stays in one place. Taps during a move are ignored, so a fast
   double tap can't skip a step. Reduced-motion visitors get instant steps. */
(function(){
  var PR = window.SHZ_PRICING;
  if (!PR || !document.getElementById('ctWizard')) return;

  function blank() { return { type: null, fix: false, budget: null, bLo: null, bHi: null, time: null, weeks: null, biz: '', line: '' }; }
  var ans = blank();
  var step = 0, busy = false;
  var STEPS = ['ctWizStep0', 'ctWizStep1', 'ctWizStep2', 'ctWizStep3', 'ctWizFix'];
  var EASE = 'cubic-bezier(.2,.9,.2,1)';
  var BIZ_SAY = { 'Clinic / healthcare': 'clinic', 'Restaurant / café': 'restaurant', 'Shop / retail': 'shop', 'School / coaching': 'school', 'Personal brand': 'personal brand', 'Startup / company': 'startup' };
  var $ = function (id) { return document.getElementById(id); };
  var calm = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  var canHover = function () { try { return window.matchMedia('(hover: hover)').matches; } catch (e) { return false; } };
  function ico(id) { return '<svg class="ct-ico" aria-hidden="true"><use href="#cti-' + id + '"/></svg>'; }

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
  function an(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }
  function P() { return PR.TYPES[ans.type] || null; }

  /* ── motion helpers ── */
  /* one animation, with a callback that always fires once (finish, cancel,
     or a safety timer in case a background tab never finishes it) */
  function anim(el, frames, opts, done) {
    if (!el || !el.animate || calm()) { if (done) done(); return null; }
    var fired = false, a;
    var fin = function () { if (fired) return; fired = true; if (done) done(); };
    try { a = el.animate(frames, opts); } catch (e) { fin(); return null; }
    a.onfinish = fin; a.oncancel = fin;
    setTimeout(fin, (opts.duration || 0) + (opts.delay || 0) + 150);
    return a;
  }
  function stopAnims(el) { try { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); } catch (e) {} }
  /* ease the steps box from its old height to the new one */
  function morph(change, done) {
    var box = $('ctWizSteps');
    if (calm() || !box.animate) { change(); if (done) done(); return; }
    var h0 = box.offsetHeight; change(); var h1 = box.offsetHeight;
    if (Math.abs(h1 - h0) < 2) { if (done) done(); return; }
    anim(box, [{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 280, easing: EASE }, done);
  }
  /* the new step's choices arrive one after another */
  function stagger(stepEl) {
    var items = stepEl.querySelectorAll('.ct-wiz-opt, .ct-wiz-skip, .ct-wiz-field, .ct-wiz-next:not([hidden])');
    [].forEach.call(items, function (el, i) {
      anim(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 50 + Math.min(i, 10) * 24, easing: EASE, fill: 'backwards' });
    });
  }
  /* keep the question in sight when a shorter step leaves it above the screen */
  function keepInView(el) {
    if (!el) return;
    var top = el.getBoundingClientRect().top, room = 78;
    if (top < room - 4) window.scrollBy({ top: top - room, behavior: calm() ? 'auto' : 'smooth' });
  }
  /* the tap's soft flash starts where the finger landed */
  function pressFx(btn, e) {
    var r = btn.getBoundingClientRect();
    var x = e && e.detail && e.clientX ? e.clientX - r.left : r.width / 2, y = e && e.detail && e.clientY ? e.clientY - r.top : r.height / 2;
    btn.style.setProperty('--rx', Math.round(x) + 'px'); btn.style.setProperty('--ry', Math.round(y) + 'px');
    btn.classList.remove('ct-wiz-flash'); void btn.offsetWidth; btn.classList.add('ct-wiz-flash');
    setTimeout(function () { btn.classList.remove('ct-wiz-flash'); }, 600);
  }

  /* ── steps ── */
  function nav() {
    var fix = step === 4, idx = fix ? 0 : step;
    for (var i = 0; i < 4; i++) {
      var d = $('ctWizDot' + i);
      if (d) d.className = 'ct-wiz-dot' + (i < idx ? ' ct-wiz-dot-done' : i === idx ? ' ct-wiz-dot-active' : '');
    }
    var c = $('ctWizCount'); if (c) c.textContent = fix ? 'Free check' : (idx + 1) + ' / 4';
    var b = $('ctWizBack'), off = step === 0;
    if (b) { b.classList.toggle('ct-wiz-back-off', off); b.tabIndex = off ? -1 : 0; b.setAttribute('aria-hidden', off ? 'true' : 'false'); }
  }
  /* jump straight to a step (no motion) — used on reset */
  function show(n) {
    step = n;
    STEPS.forEach(function (id, i) { var s = $(id); if (s) { stopAnims(s); s.classList.toggle('ct-wiz-active', i === n); } });
    nav(); live();
  }
  /* slide to a step: out the way you're going, then in */
  function go(n, dir) {
    if (n === step) { busy = false; return; }
    var from = $(STEPS[step]), to = $(STEPS[n]), box = $('ctWizSteps');
    if (dir == null) dir = n === 4 || n > step ? 1 : -1;
    var hadFocus = from.contains(document.activeElement);
    step = n; busy = true; nav();
    var swap = function () { stopAnims(from); from.classList.remove('ct-wiz-active'); to.classList.add('ct-wiz-active'); live(); };
    var after = function () {
      box.classList.remove('ct-wiz-moving'); busy = false;
      if (n === 4 && canHover()) { try { $('ctWizUrl').focus({ preventScroll: true }); } catch (e) {} }
      else if (hadFocus) { var q = to.querySelector('.ct-wiz-q'); if (q) try { q.focus({ preventScroll: true }); } catch (e) {} }
      keepInView(document.querySelector('#ctWizard .ct-wiz-nav'));
    };
    if (calm() || !from.animate) { swap(); after(); return; }
    box.classList.add('ct-wiz-moving');
    anim(from, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 26) + 'px)' }],
      { duration: 140, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }, function () {
        var left = 2, part = function () { if (--left === 0) after(); };
        morph(swap, part);
        anim(to, [{ opacity: 0, transform: 'translateX(' + (dir * 26) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE }, part);
        stagger(to);
      });
  }
  /* after a choice: let the tick show, then move on */
  function advance(n) { busy = true; setTimeout(function () { go(n); }, calm() ? 120 : 260); }
  function select(btn) {
    var group = btn && btn.parentNode;
    if (!group) return;
    [].forEach.call(group.querySelectorAll('.ct-wiz-opt'), function (b) { b.classList.toggle('ct-wiz-selected', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
  }
  function clearSelection(stepId) { [].forEach.call(document.querySelectorAll('#' + stepId + ' .ct-wiz-opt'), function (b) { b.classList.remove('ct-wiz-selected'); b.setAttribute('aria-pressed', 'false'); }); }

  /* the strip above the steps: what it typically costs, updated every tap */
  function live() {
    var el = $('ctWizLive'), p = P();
    if (!el) return;
    if (!p || step === 4 || ans.fix) { el.hidden = true; return; }
    var fit = fitOf(p), was = el.hidden;
    el.innerHTML = '<b>' + ico(p.ico) + esc(ans.type) + '</b><span>' + (p.custom ? 'custom quote' : 'typically ' + esc(PR.range(p))) + '</span>' +
      (p.custom ? '' : '<span>' + esc(p.time) + '</span>') +
      (fit && ans.budget ? '<span class="ct-live-fit ct-fit-' + fit.kind + '">' + (fit.kind === 'ok' ? ico('check') : '') + fit.tag + '</span>' : '');
    el.hidden = false;
    if (was) anim(el, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
  }

  /* budget choices that make sense for this kind of project */
  function fillBudgets() {
    var p = P(), box = $('ctWizBudgets');
    box.innerHTML = '';
    p.budgets.concat([['Not sure yet', null, null]]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'ct-wiz-opt' + (ans.budget === b[0] ? ' ct-wiz-selected' : '');
      btn.textContent = b[0];
      btn.setAttribute('aria-pressed', ans.budget === b[0] ? 'true' : 'false');
      btn.setAttribute('data-label', b[0]);
      btn.setAttribute('data-lo', b[1] == null ? '' : b[1]);
      btn.setAttribute('data-hi', b[2] == null ? '' : b[2]);
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
    /* "Under ₹15K" for a store that starts at ₹14,999 is at or below the start */
    if (ans.bHi < p.lo || (ans.bLo === 0 && ans.bHi <= p.lo && p.lo !== p.hi)) return { kind: 'short', tag: 'below usual' };
    if (ans.bLo > p.hi && p.lo !== p.hi) return { kind: 'room', tag: 'room for extras' };
    return { kind: 'ok', tag: 'fits' };
  }

  function timeNote(p) {
    if (!p || !ans.weeks || p.custom || !p.weeks) return '';
    if (ans.weeks < p.weeks[0]) {
      return (/^[aeiou]/i.test(p.say) ? 'An ' : 'A ') + p.say + ' usually takes ' + p.time + '. For ' + (ans.time === 'ASAP' ? 'ASAP' : ans.time.toLowerCase()) +
        ', Sahnawaz can start with the most important part first — mention it in your brief.';
    }
    return '';
  }

  /* ── the estimate ── */
  function estimate() {
    var p = P(), fit = fitOf(p), out = [];
    out.push('<div class="ctq-head"><span class="ctq-type">' + ico(p.ico) + esc(ans.type) + '</span>' +
      '<span class="ctq-price">' + esc(PR.range(p)) + '</span>' +
      '<span class="ctq-time">' + ico('clock') + (p.custom ? 'Timeline depends on what you need' : 'Typical delivery: ' + esc(p.time)) + '</span></div>');
    if (!p.custom && p.lo !== p.hi) out.push(bar(p));

    var adv = '', icon = 'info';
    if (!fit || fit.kind === 'unsure') adv = p.custom ? 'Send a brief and Sahnawaz will come back with a clear quote.' : 'Most clients spend ' + PR.range(p) + ' on ' + an(p.say) + '.';
    else if (fit.kind === 'short') adv = 'Your budget is below the usual starting price (' + inr(p.lo) + '). What fits: ' + p.starter + '.';
    else if (fit.kind === 'room') { icon = 'sparkles'; adv = 'Your budget has room for extras: ' + PR.EXTRAS.filter(function (x) { return !(ans.type === 'AI chatbot / integration' && /AI/.test(x[0])) && !(ans.type === 'Web ads & promotion' && /ad campaign/.test(x[0])); })
      .slice(0, 3).map(function (x) { return x[0] + ' (from ' + inr(x[1]) + ')'; }).join(', ') + '.'; }
    else { icon = 'check'; adv = p.custom ? 'Budget noted — it helps Sahnawaz suggest the right approach.' : 'Your budget fits the usual range for ' + an(p.say) + '.'; }
    out.push('<p class="ctq-fit ctq-fit-' + (fit ? fit.kind : 'unsure') + '">' + ico(icon) + '<span>' + esc(adv) + '</span></p>');
    var tn = timeNote(p);
    if (tn) out.push('<p class="ctq-fit ctq-fit-short">' + ico('clock') + '<span>' + esc(tn) + '</span></p>');

    out.push('<div class="ctq-ai" id="ctqAi" aria-busy="true"><div class="ctq-ai-head">' + ico('sparkles') + 'AI advice for your ' + esc(BIZ_SAY[ans.biz] || p.say) + '</div>' +
      '<p class="ctq-ai-text" id="ctqAiText"><i class="ctq-sk"></i><i class="ctq-sk"></i></p></div>');

    out.push('<ul class="ctq-gets">' + p.gets.map(function (g) { return '<li>' + ico('check') + '<span>' + esc(g) + '</span></li>'; }).join('') + '</ul>');
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

  /* ── AI advice for the visitor's own business ──
     The numbers above never wait on it; if the AI is slow or down, the
     advice box quietly disappears. Same answers → same advice, no new call. */
  var aiSeq = 0, aiCache = {};
  function aiAdvice() {
    var seq = ++aiSeq, box = $('ctqAi'), txt = $('ctqAiText');
    if (!box || !txt) return;
    var p = P(), fit = fitOf(p);
    var payload = { type: ans.type, budget: ans.budget || '', time: ans.time || '', biz: ans.biz || '', line: ans.line || '', fit: fit ? fit.kind : '', rushed: !!timeNote(p) };
    var key = JSON.stringify(payload);
    var put = function (a) {
      if (seq !== aiSeq || !document.body.contains(box)) return;
      box.removeAttribute('aria-busy');
      txt.innerHTML = a.split(/\s+/).map(function (w, i) { return '<span class="ctq-w" style="animation-delay:' + Math.min(i * 30, 1100) + 'ms">' + esc(w) + '</span>'; }).join(' ');
    };
    var gone = function () {
      if (seq !== aiSeq || !document.body.contains(box)) return;
      anim(box, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }, function () { if (box.parentNode) box.parentNode.removeChild(box); });
    };
    if (aiCache[key]) { put(aiCache[key]); return; }
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); gone(); }, 15000);
    fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'estimate advice', source: 'wizard', estimate: payload }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        var a = d && typeof d.advice === 'string' ? d.advice.trim() : '';
        if (a) { aiCache[key] = a; put(a); } else gone();
      })
      .catch(function () { clearTimeout(timer); gone(); });
  }

  /* steps → estimate card */
  function finish() {
    if (busy) return;
    busy = true;
    ans.line = ($('ctWizLine').value || '').trim().slice(0, 160);
    chime('done');
    $('ctQuoteText').innerHTML = estimate();
    var wiz = $('ctWizard'), card = $('ctQuoteCard');
    anim(wiz, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }, function () {
      wiz.classList.add('ct-wiz-hidden'); stopAnims(wiz);
      card.classList.add('ct-quote-visible');
      anim(card, [{ opacity: 0, transform: 'translateY(14px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE });
      [].forEach.call($('ctQuoteText').children, function (c, i) {
        anim(c, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 80 + i * 55, easing: EASE, fill: 'backwards' });
      });
      busy = false;
      keepInView(card);
      aiAdvice();
    });
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
      try { fi.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'nearest' }); } catch (e) {}
      if (mf && canHover()) try { mf.focus({ preventScroll: true }); } catch (e) {}
    }, 120);
  }
  function lockForm() {
    var fi = $('ctFormInner'), teaser = $('ctFormTeaser'), mf = $('message');
    if (fi) fi.classList.remove('ct-form-ready');
    if (teaser) teaser.classList.remove('ct-hide');
    if (mf) { mf.value = ''; mf.dispatchEvent(new Event('input')); }
    var sk = $('ctWizSkip'); if (sk) sk.classList.remove('ct-skip-open');
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

  /* ── wiring: one listener for every chip ── */
  $('ctWizSteps').addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.ct-wiz-opt') : null;
    if (!btn) return;
    var stepEl = btn.closest('.ct-wiz-step');
    if (busy || !stepEl || stepEl.id !== STEPS[step]) return;
    pressFx(btn, e);

    if (stepEl.id === 'ctWizStep0') {
      var t = btn.getAttribute('data-type');
      select(btn); chime(0);
      if (t === 'fix') { ans.fix = true; ans.type = 'Website redesign'; ans.budget = ans.bLo = ans.bHi = null; live(); advance(4); return; }
      if (t !== ans.type || ans.fix) { ans.budget = ans.bLo = ans.bHi = null; }
      ans.fix = false; ans.type = t;
      fillBudgets(); live(); advance(1);
    } else if (stepEl.id === 'ctWizStep1') {
      var lo = btn.getAttribute('data-lo'), hi = btn.getAttribute('data-hi');
      ans.budget = btn.getAttribute('data-label'); ans.bLo = lo === '' ? null : +lo; ans.bHi = hi === '' ? null : +hi;
      select(btn); chime(1); live(); advance(2);
    } else if (stepEl.id === 'ctWizStep2') {
      ans.time = btn.getAttribute('data-time');
      ans.weeks = +btn.getAttribute('data-weeks') || null;
      select(btn); chime(1);
      var note = timeNote(P()), hint = $('ctWizTimeHint'), more = $('ctWizTimeNext');
      if (note) {
        /* a rushed timeline: show the note and let them carry on when ready */
        var had = !!hint.textContent;
        morph(function () { hint.textContent = note; more.hidden = false; });
        if (!had) { anim(hint, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }); anim(more, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 80, easing: EASE, fill: 'backwards' }); }
        return;
      }
      if (hint.textContent) { hint.textContent = ''; more.hidden = true; }
      advance(3);
    } else if (stepEl.id === 'ctWizStep3') {
      var on = !btn.classList.contains('ct-wiz-selected');
      if (on) select(btn); else { btn.classList.remove('ct-wiz-selected'); btn.setAttribute('aria-pressed', 'false'); }
      chime(0);
      ans.biz = on ? btn.getAttribute('data-biz') : '';
    }
  });
  $('ctWizTimeNext').addEventListener('click', function () { if (busy) return; chime(1); go(3); });
  $('ctWizSee').addEventListener('click', finish);
  $('ctWizLine').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(); } });
  $('ctWizBack').addEventListener('click', function () {
    if (busy || step === 0) return;
    chime('back');
    if (step === 4) { ans.type = null; ans.fix = false; clearSelection('ctWizStep0'); go(0, -1); return; }
    go(step - 1, -1);
  });
  $('ctWizSkip').addEventListener('click', function () { chime(0); $('ctWizSkip').classList.add('ct-skip-open'); openForm(false); });

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
  /* "Change answers": back to the first question with every answer still
     picked, so changing one thing is a few taps */
  $('ctqEdit').addEventListener('click', function () {
    if (busy) return;
    busy = true; chime('back'); aiSeq++;
    var wiz = $('ctWizard'), card = $('ctQuoteCard');
    lockForm();
    anim(card, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }, function () {
      card.classList.remove('ct-quote-visible'); stopAnims(card);
      wiz.classList.remove('ct-wiz-hidden');
      show(0);
      anim(wiz, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE });
      stagger($('ctWizStep0'));
      busy = false;
      keepInView(document.querySelector('#ctWizard .ct-wiz-nav'));
    });
  });

  /* ── reset (also used after the form is sent) ── */
  window.ctWizReset = function () {
    chime('back'); aiSeq++; busy = false;
    ans = blank();
    var card = $('ctQuoteCard'); stopAnims(card); card.classList.remove('ct-quote-visible');
    lockForm();
    try {
      var sv = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null');
      if (!(sv && sv.uid)) ['name', 'email'].forEach(function (id) { var f = $(id); if (f) { f.value = ''; f.dispatchEvent(new Event('input')); } });
    } catch (e) {}
    $('ctWizLine').value = ''; $('ctWizTimeHint').textContent = ''; $('ctWizTimeNext').hidden = true;
    [].forEach.call(document.querySelectorAll('#ctWizard .ct-wiz-opt'), function (b) { b.classList.remove('ct-wiz-selected'); b.setAttribute('aria-pressed', 'false'); });
    var wiz = $('ctWizard'); stopAnims(wiz); wiz.classList.remove('ct-wiz-hidden');
    show(0);
  };
  /* older names, kept for anything that still calls them */
  window.ctWizBack = function () { $('ctWizBack').click(); };
  window.ctWizPick = function () {};
  var _origCtResetForm = window.ctResetForm;
  window.ctResetForm = function () { if (_origCtResetForm) _origCtResetForm(); window.ctWizReset(); };

  [].forEach.call(document.querySelectorAll('#ctWizard .ct-wiz-opt'), function (b) { b.setAttribute('aria-pressed', 'false'); });
  nav();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
