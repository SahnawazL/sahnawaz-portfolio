/* Shorter page on phones. A few long, detailed parts start folded behind a
   "Show" button that says what is inside: the experience summary, each
   project's problem and lessons, the skill levels, the live speed numbers
   and the full list of security checks. Nothing is removed; one tap opens
   it again, and on wider screens everything stays open as before. */
(function () {
  'use strict';
  var phone = matchMedia('(max-width: 640px)');
  var FOLDS = [
    { card: '.exp-para-wrap', parts: ['.exp-para-text'], label: 'My experience', unroll: true, note: function () { return 'Xiaomi · Flipkart · Rapido'; } },
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
      '.pf-sweep{position:absolute;left:-6%;right:-6%;top:0;height:46px;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(90,224,255,.16),transparent);filter:blur(2px)}' +
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
          if (opening) {
            set(card, b, f.label, true, f.note);
            reveal(parts, f);
            if (f.onOpen) requestAnimationFrame(f.onOpen);
          } else {
            hide(parts, function () { set(card, b, f.label, false, f.note); });
            b.firstChild.textContent = 'Show ' + f.label.charAt(0).toLowerCase() + f.label.slice(1);
          }
        });
        parts[0].parentNode.insertBefore(b, parts[0]);
        card.__pf = { b: b, label: f.label, note: f.note };
        set(card, b, f.label, !phone.matches, f.note);
      });
    });
  }

  /* ── Opening and closing smoothly ──
     The part grows open quickly while its content rises into place; the
     experience text unrolls from the top in one sweep with a soft light
     passing over it. Closing folds it away again.
     With "reduce motion" on, it simply opens and closes. */
  var EASE = 'cubic-bezier(0.16,1,0.3,1)';
  var still = function () { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || !Element.prototype.animate; };

  function grow(part, from, to, ms, done) {
    part.style.overflow = 'hidden';
    var a = part.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: ms, easing: EASE });
    var once = false;
    a.onfinish = a.oncancel = function () { if (once) return; once = true; part.style.overflow = ''; if (done) done(); };
  }

  function reveal(parts, f) {
    if (still()) return;
    parts.forEach(function (part, pi) {
      var h = part.scrollHeight;
      grow(part, 0, h, 340);
      if (f.unroll) {
        /* the experience text unrolls from the top in one quick, even sweep,
           with a soft light passing down over it */
        part.animate([
          { clipPath: 'inset(0 0 100% 0)', opacity: .4, transform: 'translateY(-4px)' },
          { clipPath: 'inset(0 0 0 0)', opacity: 1, transform: 'none' }
        ], { duration: 360, easing: EASE });
        var sweep = document.createElement('span');
        sweep.className = 'pf-sweep';
        part.style.position = part.style.position || 'relative';
        part.appendChild(sweep);
        sweep.animate([{ transform: 'translateY(-100%)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translateY(' + h + 'px)', opacity: 0 }],
          { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = function () { sweep.remove(); };
      } else {
        part.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 300, delay: pi * 50, easing: EASE, fill: 'backwards' });
      }
    });
  }

  function hide(parts, done) {
    if (still()) return done();
    var left = parts.length;
    parts.forEach(function (part) {
      part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
      grow(part, part.offsetHeight, 0, 280, function () {
        (part.getAnimations ? part.getAnimations() : []).forEach(function (a) { a.cancel(); });
        if (--left === 0) done();
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
