/* Shorter page on phones. A few long, detailed parts start folded behind a
   "Show" button that says what is inside: the experience summary, each
   project's problem and lessons, the skill levels, the live speed numbers
   and the full list of security checks. Nothing is removed; one tap opens
   it again, and on wider screens everything stays open as before. */
(function () {
  'use strict';
  var phone = matchMedia('(max-width: 640px)');
  var FOLDS = [
    { card: '.exp-para-wrap', parts: ['.exp-para-text'], label: 'My experience', note: function () { return 'Xiaomi · Flipkart · Rapido'; } },
    { card: '.mpj-card', parts: ['.mpj-problem', '.mpj-hindsight'], label: 'Problem & lessons learned' },
    { card: '#tsBarsSection', parts: ['#tsBars'], label: 'Skill levels', note: function (card) {
        var v = (card.querySelector('#tsBars').textContent.match(/\d{2,3}(?=\s*%)/g) || []).map(Number);
        return v.length ? v.length + ' skills · ' + Math.min.apply(null, v) + '–' + Math.max.apply(null, v) + '%' : '';
      }, onOpen: function () { if (typeof window.tsBarsPlay === 'function') window.tsBarsPlay(); } },
    { card: '#wvCard', parts: ['#wvcBody'], label: 'Live speed numbers' },
    { card: '#secCard', parts: ['.sec-rows'], label: 'All security checks' }
  ];
  var made = false;

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.pf-closed .pf-part{display:none!important}' +
      '.pf-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:42px;margin:8px 0;padding:0 12px;border-radius:11px;' +
      'border:1px dashed rgba(90,224,255,.28);background:rgba(90,224,255,.05);color:#8fd7ef;font:600 .8rem "DM Sans",Inter,system-ui,sans-serif;cursor:pointer}' +
      '.pf-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s}' +
      '.pf-btn[aria-expanded="true"] svg{transform:rotate(180deg)}' +
      '.pf-btn:focus-visible{outline:2px solid #5ae0ff;outline-offset:2px}' +
      '@media print{.pf-btn{display:none!important}}';
    document.head.appendChild(s);
  }

  var n = 0;
  function make() {
    if (made) return;
    made = true;
    css();
    FOLDS.forEach(function (f) {
      [].slice.call(document.querySelectorAll(f.card)).forEach(function (card) {
        var parts = f.parts.map(function (sel) { return card.querySelector(sel); }).filter(Boolean);
        if (!parts.length) return;
        var id = 'pfPart' + (++n);
        parts.forEach(function (p, i) { p.classList.add('pf-part'); if (!i) p.id = p.id || id; });
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pf-btn';
        b.setAttribute('aria-controls', parts[0].id);
        b.innerHTML = '<span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
        b.addEventListener('click', function () {
          var opening = card.classList.contains('pf-closed');
          set(card, b, f.label, opening, f.note);
          if (opening && f.onOpen) requestAnimationFrame(f.onOpen);
        });
        parts[0].parentNode.insertBefore(b, parts[0]);
        card.__pf = { b: b, label: f.label, note: f.note };
        set(card, b, f.label, !phone.matches, f.note);
      });
    });
  }

  /* a closed fold says what is inside it, like the security card's score */
  function set(card, b, label, open, note) {
    card.classList.toggle('pf-closed', !open);
    b.setAttribute('aria-expanded', String(open));
    var extra = '';
    if (!open && note) { try { extra = note(card) || ''; } catch (e) {} }
    b.firstChild.textContent = (open ? 'Hide ' : 'Show ') + label.charAt(0).toLowerCase() + label.slice(1) + (extra ? ' · ' + extra : '');
    b.hidden = !phone.matches;
  }

  function sync() {
    if (!phone.matches && !made) return;
    make();
    FOLDS.forEach(function (f) {
      [].slice.call(document.querySelectorAll(f.card)).forEach(function (card) {
        if (card.__pf) set(card, card.__pf.b, card.__pf.label, !phone.matches, card.__pf.note);
      });
    });
  }

  if (phone.addEventListener) phone.addEventListener('change', sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
  /* the skill bars are drawn after load: refresh the summaries once */
  addEventListener('load', function () {
    setTimeout(function () {
      FOLDS.forEach(function (f) {
        [].slice.call(document.querySelectorAll(f.card)).forEach(function (card) {
          if (card.__pf && card.classList.contains('pf-closed')) set(card, card.__pf.b, card.__pf.label, false, card.__pf.note);
        });
      });
    }, 1500);
  }, { once: true });
})();
