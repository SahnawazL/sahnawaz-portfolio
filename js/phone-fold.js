/* Shorter page on phones. A few long, detailed parts start folded behind a
   button that says what is inside: the experience summary, each project's
   problem and lessons, the skill levels, the live speed numbers and the
   full list of security checks, the How I ship steps and the deeper GitHub
   telemetry panels. On wider screens everything stays open.

   How it moves (the same idea as the certification cards, made smoother):
   - The part sits in a wrapper whose height eases from 0 to its natural
     height with a CSS grid transition, so nothing is measured in script
     and the browser animates it in one smooth pass.
   - The content fades in and settles a few pixels as the space opens.
   - The button keeps the same size in both states: "Show" and "Hide"
     swap in place with a short vertical slide, the summary line under it
     stays put, and the chevron turns. No glow or zoom on tap. */
(function () {
  'use strict';
  var phone = matchMedia('(max-width: 640px)');
  var FOLDS = [
    { card: '.exp-para-wrap', parts: ['.exp-para-text'], label: 'my experience', note: function () { return 'Xiaomi · Flipkart · Rapido'; } },
    { card: '.mpj-card', parts: ['.mpj-problem', '.mpj-hindsight'], label: 'problem & lessons learned' },
    { card: '#tsBarsSection', parts: ['#tsBars'], label: 'skill levels', note: function (card) {
        var v = (card.querySelector('#tsBars').textContent.match(/\d{2,3}(?=\s*%)/g) || []).map(Number);
        return v.length ? v.length + ' skills · ' + Math.min.apply(null, v) + '–' + Math.max.apply(null, v) + '%' : '';
      }, onOpen: function () { if (typeof window.tsBarsPlay === 'function') window.tsBarsPlay(); } },
    { card: '#wvCard', parts: ['#wvcBody'], label: 'live speed numbers' },
    { card: '#secCard', parts: ['.sec-rows'], label: 'all security checks' },
    { card: '#how-i-ship', parts: ['.hs-body'], label: 'how I ship', note: function (card) {
        var n = card.querySelectorAll('.hs-flow > li').length;
        return n ? n + ' steps · from idea to live' : '';
      } },
    { card: '#recent-activity', parts: ['#raRangeToggle', '#raPulse', '#raHeatmap', '#raPunchcard', '#raLangHours', '#raProjectStats',
        '#raCIHealth', '#raReleaseTimeline', '#raRepoEcosystem', '#raDepFreshness'], label: 'full GitHub telemetry',
      note: function () { return '9 live panels · commits, CI, releases'; } }
  ];
  var made = false, all = [];
  var EASE = 'cubic-bezier(.22,1,.36,1)';

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      /* the folding wrapper: 0fr -> 1fr rows animate the real height */
      '.pf-wrap{display:grid;grid-template-rows:1fr;opacity:1;transition:grid-template-rows .5s ' + EASE + ',opacity .38s ease .06s}',
      '.pf-wrap>.pf-inner{min-height:0;overflow:hidden}',
      '.pf-wrap>.pf-inner>*{transition:transform .5s ' + EASE + '}',
      '.pf-wrap.pf-shut{grid-template-rows:0fr;opacity:0;transition:grid-template-rows .42s ' + EASE + ',opacity .2s ease}',
      '.pf-wrap.pf-shut>.pf-inner>*{transform:translateY(-10px)}',
      'html:not(.pf-ready) .pf-wrap,html:not(.pf-ready) .pf-wrap>.pf-inner>*{transition:none!important}',
      /* the button */
      '.pf-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin:8px 0;padding:9px 14px;border-radius:12px;box-sizing:border-box;',
      '  border:1px solid rgba(90,224,255,.2);background:rgba(90,224,255,.045);color:#9be3f6;font:600 .82rem/1.2 "DM Sans",Inter,system-ui,sans-serif;cursor:pointer;',
      '  -webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-user-select:none;user-select:none}',
      '.pf-btn,.pf-btn:hover,.pf-btn:focus{box-shadow:none!important;transform:none!important;transition:background .2s ease,border-color .2s ease!important}',
      '.pf-btn:active{background:rgba(90,224,255,.1)}',
      '.pf-btn[aria-expanded="true"]{border-color:rgba(90,224,255,.12);background:rgba(90,224,255,.03)}',
      '.pf-btn:focus-visible{outline:2px solid #5ae0ff;outline-offset:2px}',
      '.pf-txt{display:flex;flex-direction:column;align-items:center;min-width:0}',
      '.pf-lbl{display:grid;overflow:hidden}',
      '.pf-lbl>span{grid-area:1/1;white-space:nowrap;transition:transform .34s ' + EASE + ',opacity .26s ease}',
      '.pf-lbl .pf-hide{transform:translateY(100%);opacity:0}',
      '.pf-btn[aria-expanded="true"] .pf-show{transform:translateY(-100%);opacity:0}',
      '.pf-btn[aria-expanded="true"] .pf-hide{transform:none;opacity:1}',
      '.pf-note{margin-top:3px;font-size:.7rem;font-weight:500;letter-spacing:.02em;color:rgba(160,215,235,.6)}',
      '.pf-note:empty{display:none}',
      '.pf-chev{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(90,224,255,.22);',
      '  transition:transform .45s cubic-bezier(.34,1.56,.64,1),background .25s,border-color .25s}',
      '.pf-btn[aria-expanded="true"] .pf-chev{transform:rotate(180deg);background:rgba(90,224,255,.1);border-color:rgba(90,224,255,.4)}',
      '.pf-chev svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}',
      '@media (prefers-reduced-motion: reduce){.pf-wrap,.pf-wrap>.pf-inner>*,.pf-lbl>span,.pf-chev{transition:none!important}}',
      '@media print{.pf-btn{display:none!important}.pf-wrap{grid-template-rows:1fr!important;opacity:1!important}}'
    ].join('\n');
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
        /* each part gets its own wrapper, so the card's order is untouched */
        parts.forEach(function (p) {
          var wrap = document.createElement('div'), inner = document.createElement('div');
          wrap.className = 'pf-wrap'; inner.className = 'pf-inner';
          wrap.id = 'pfPart' + (++n);
          p.parentNode.insertBefore(wrap, p);
          inner.appendChild(p); wrap.appendChild(inner);
        });
        var first = parts[0].parentNode.parentNode;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pf-btn';
        b.setAttribute('aria-controls', parts.map(function (p) { return p.parentNode.parentNode.id; }).join(' '));
        b.innerHTML = '<span class="pf-txt"><span class="pf-lbl"><span class="pf-show">Show ' + f.label + '</span><span class="pf-hide" aria-hidden="true">Hide ' + f.label + '</span></span>'
          + '<span class="pf-note"></span></span><span class="pf-chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span>';
        first.parentNode.insertBefore(b, first);
        var item = { card: card, b: b, f: f, wraps: parts.map(function (p) { return p.parentNode.parentNode; }), open: true };
        all.push(item);
        b.addEventListener('click', function () {
          var open = !item.open;
          set(item, open);
          if (open && f.onOpen) setTimeout(f.onOpen, 120);
        });
      });
    });
    /* transitions only after the first state is drawn, so nothing animates on load */
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.add('pf-ready'); }); });
  }

  function set(item, open) {
    item.open = open;
    item.card.classList.toggle('pf-closed', !open);
    item.wraps.forEach(function (w) { w.classList.toggle('pf-shut', !open); });
    item.b.setAttribute('aria-expanded', String(open));
    item.b.querySelector('.pf-show').setAttribute('aria-hidden', String(open));
    item.b.querySelector('.pf-hide').setAttribute('aria-hidden', String(!open));
    note(item);
    item.b.hidden = !phone.matches;
  }
  function note(item) {
    var t = '';
    if (item.f.note) { try { t = item.f.note(item.card) || ''; } catch (e) {} }
    item.b.querySelector('.pf-note').textContent = t;
  }

  function sync() {
    if (!phone.matches && !made) return;
    make();
    all.forEach(function (item) { set(item, !phone.matches); });
  }

  if (phone.addEventListener) phone.addEventListener('change', sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
  /* the skill bars are drawn after load: fill in their summary once */
  addEventListener('load', function () { setTimeout(function () { all.forEach(note); }, 1500); }, { once: true });
})();
