/* Shorter page on phones. A few long, detailed parts start folded behind a
   "Show" button: each project's problem and lessons, the live speed numbers
   and the full list of security checks. Nothing is removed; one tap opens
   it again, and on wider screens everything stays open as before. */
(function () {
  'use strict';
  var phone = matchMedia('(max-width: 640px)');
  var FOLDS = [
    { card: '.mpj-card', parts: ['.mpj-problem', '.mpj-hindsight'], label: 'Problem & lessons learned' },
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
        b.addEventListener('click', function () { set(card, b, f.label, card.classList.contains('pf-closed')); });
        parts[0].parentNode.insertBefore(b, parts[0]);
        card.__pf = { b: b, label: f.label };
        set(card, b, f.label, !phone.matches);
      });
    });
  }

  function set(card, b, label, open) {
    card.classList.toggle('pf-closed', !open);
    b.setAttribute('aria-expanded', String(open));
    b.firstChild.textContent = (open ? 'Hide ' : 'Show ') + label.charAt(0).toLowerCase() + label.slice(1);
    b.hidden = !phone.matches;
  }

  function sync() {
    if (!phone.matches && !made) return;
    make();
    FOLDS.forEach(function (f) {
      [].slice.call(document.querySelectorAll(f.card)).forEach(function (card) {
        if (card.__pf) set(card, card.__pf.b, card.__pf.label, !phone.matches);
      });
    });
  }

  if (phone.addEventListener) phone.addEventListener('change', sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
})();
