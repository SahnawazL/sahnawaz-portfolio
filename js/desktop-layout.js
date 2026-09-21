/* ============================================================
   DESKTOP SECTION RAIL  —  ByteWithSahnawaz
   A slim, sticky list of sections beside the content on wide screens,
   highlighting the one you're reading, with one click to jump.

   Only ever built on screens 1280px and wider; on anything smaller it
   does nothing at all. Styles live in css/desktop.css.
   ============================================================ */
(function () {
  'use strict';
  if (window.__dskRailLoaded) return;
  window.__dskRailLoaded = true;

  var WIDE = '(min-width: 1280px)';
  var SECTIONS = [
    ['section:has(> #pfpStage)', 'Home'],
    ['section.ts-section',  'Tech Stack'],
    ['#blog',               'Blog'],
    ['#testimonials',       'Testimonials'],
    ['#certSection',        'Certifications'],
    ['#projects',           'Experience'],
    ['#achievements',       'Achievements'],
    ['#what-i-offer',       'Services'],
    ['#why-website',        'Why a Website'],
    ['#tools-services',     'Book a Service'],
    ['#my-projects',        'Projects'],
    ['#recent-activity',    'Telemetry'],
    ['#contact',            'Contact']
  ];

  var rail = null, items = [], io = null, active = -1, raf = 0;

  function build() {
    if (rail) return;
    var found = SECTIONS.map(function (s) { return { el: document.querySelector(s[0]), label: s[1] }; })
                        .filter(function (s) { return s.el; });
    if (found.length < 3) return;

    rail = document.createElement('nav');
    rail.id = 'dsk-rail';
    rail.setAttribute('aria-label', 'Page sections');
    var fill = document.createElement('i');
    fill.className = 'dsk-fill';
    rail.appendChild(fill);

    items = found.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dsk-item';
      b.setAttribute('aria-label', 'Go to ' + s.label);
      b.innerHTML = '<span class="dsk-dot" aria-hidden="true"></span><span class="dsk-label"></span>';
      b.querySelector('.dsk-label').textContent = s.label;
      b.addEventListener('click', function () { jump(s.el); });
      rail.appendChild(b);
      return { btn: b, el: s.el, i: i };
    });
    document.body.appendChild(rail);

    /* the section crossing a band just above the middle of the screen
       is the one being read */
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          for (var k = 0; k < items.length; k++) if (items[k].el === en.target) { setActive(k); break; }
        }
      });
    }, { rootMargin: '-38% 0px -58% 0px', threshold: 0 });
    items.forEach(function (it) { io.observe(it.el); });

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', fitLabels, { passive: true });
    fitLabels();
    onScroll();
    requestAnimationFrame(function () { rail.classList.add('is-ready'); });
  }

  function destroy() {
    if (!rail) return;
    if (io) io.disconnect();
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', fitLabels);
    rail.remove();
    rail = null; items = []; io = null; active = -1;
  }

  function setActive(k) {
    if (k === active) return;
    active = k;
    items.forEach(function (it, n) {
      it.btn.classList.toggle('is-active', n === k);
      it.btn.classList.toggle('is-past', n < k);
      if (n === k) it.btn.setAttribute('aria-current', 'true'); else it.btn.removeAttribute('aria-current');
    });
    updateFill();
  }

  /* the progress line grows to the active dot */
  function updateFill() {
    if (!rail || active < 0) return;
    var fill = rail.querySelector('.dsk-fill');
    var dot = items[active].btn.querySelector('.dsk-dot');
    var top = rail.getBoundingClientRect().top;
    var d = dot.getBoundingClientRect();
    fill.style.height = Math.max(0, d.top + d.height / 2 - top - 18) + 'px';
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      /* above the first section's midpoint, Home is the active one */
      if (scrollY < 120 && items.length) setActive(0);
    });
  }

  /* show labels only when the space beside the content can hold them */
  function fitLabels() {
    if (!rail) return;
    var ref = document.querySelector('section:has(> #pfpStage)') || document.body;
    var side = ref.getBoundingClientRect().left;
    var widest = 0;
    items.forEach(function (it) {
      var l = it.btn.querySelector('.dsk-label');
      widest = Math.max(widest, l.scrollWidth);
    });
    rail.classList.toggle('has-room', side >= 14 + 12 + 10 + 10 + widest + 16);
    updateFill();
  }

  /* Smooth-scroll to a section, then correct. Sections above the target
     can still be rendering and grow during the scroll, which would leave
     the page short of where it was aiming; re-measure once it settles. */
  function headerOffset() {
    var h = document.querySelector('header');
    if (!h) return 0;
    var pos = getComputedStyle(h).position;
    return (pos === 'fixed' || pos === 'sticky') ? h.getBoundingClientRect().height : 0;
  }
  function settleTo(el) {
    if (!el) return;
    var aim = function () { return el.getBoundingClientRect().top + scrollY - headerOffset() - 8; };
    try { scrollTo({ top: Math.max(0, aim()), behavior: 'smooth' }); } catch (e) { scrollTo(0, aim()); }
    [700, 1400].forEach(function (t) {
      setTimeout(function () {
        var off = el.getBoundingClientRect().top - headerOffset() - 8;
        if (Math.abs(off) > 24) { try { scrollTo({ top: Math.max(0, aim()), behavior: 'smooth' }); } catch (e) { scrollTo(0, aim()); } }
      }, t);
    });
  }
  function jump(el) { settleTo(el); }

  /* ============================================================
     HEADER BAR + SITE FOOTER (960px and wider)
     Built only at desktop widths and fully undone below them. Page
     elements that get moved (the sign-in pill) are put back exactly
     where they came from.
     ============================================================ */
  var CHROME = '(min-width: 960px)';
  /* in page order, so the highlight moves left to right as you scroll */
  var NAV = [
    ['section.ts-section', 'Stack', false],
    ['#blog', 'Blog', true],
    ['#what-i-offer', 'Services', false],
    ['#my-projects', 'Projects', false],
    ['#recent-activity', 'Telemetry', true],
    ['#contact', 'Contact', false]
  ];
  var KNOWN = ['hdr-logo-row', 'hdr-tagline', 'hdr-badge-row'];
  var hdrNav = null, hdrActs = null, footEl = null, navScroll = null, clockT = 0, hdrMO = null;
  var moved = [];                               /* [{el, parent, next}] */

  function svg(d, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) +
           '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  function goTo(sel) { settleTo(document.querySelector(sel)); }
  function fn(name) { return typeof window[name] === 'function' ? window[name] : null; }

  /* ---------- header ---------- */
  function adoptExtras() {
    var inner = document.querySelector('header .hdr-inner');
    if (!inner || !hdrActs) return;
    /* anything another script added to the header (the sign-in pill) joins
       the actions on the right; remember where it was so it can go back */
    var candidates = [].slice.call(inner.children).concat(
      [].slice.call(document.querySelector('header').children).filter(function (c) { return c !== inner; }));
    candidates.forEach(function (el) {
      if (el === hdrNav || el === hdrActs || el.id === 'dsk-drawer') return;
      if (KNOWN.some(function (k) { return el.classList && el.classList.contains(k); })) return;
      if (/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName)) return;
      moved.push({ el: el, parent: el.parentNode, next: el.nextSibling });
      (document.getElementById('dsk-acct') || hdrActs).appendChild(el);
    });
    /* show the Account part of the menu only when there is something in it */
    var acct = document.getElementById('dsk-acct'), wrap = document.getElementById('dsk-acct-wrap');
    if (acct && wrap) wrap.style.display = acct.children.length ? '' : 'none';
    fitNav();
  }

  function buildHeader() {
    var inner = document.querySelector('header .hdr-inner');
    if (!inner || hdrNav) return;
    hdrNav = document.createElement('nav');
    hdrNav.id = 'dsk-nav';
    hdrNav.setAttribute('aria-label', 'Main');
    NAV.forEach(function (n) {
      if (!document.querySelector(n[0])) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dsk-link';
      b.textContent = n[1];
      b.setAttribute('data-target', n[0]);
      b.addEventListener('click', function () { goTo(n[0]); });
      hdrNav.appendChild(b);
    });

    hdrActs = document.createElement('div');
    hdrActs.id = 'dsk-actions';
    hdrActs.innerHTML =
      '<span class="dsk-time" title="Local time in Silchar, India"><i aria-hidden="true"></i>Silchar <b></b></span>' +
      (fn('openCommandPalette')
        ? '<button type="button" class="dsk-btn" data-act="search" aria-label="Quick search">' +
            svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') +
            '<span class="dsk-btn-t">Search</span><kbd>\u2318K</kbd></button>' : '') +
      '<button type="button" class="dsk-btn is-cta" data-act="talk">' +
        svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') +
        '<span class="dsk-btn-t">Let\u2019s talk</span></button>' +
      '<button type="button" class="dsk-burger" data-act="menu" aria-label="Menu" aria-haspopup="true" ' +
        'aria-expanded="false" aria-controls="dsk-drawer"><i></i><i></i><i></i></button>';
    drawerEl = document.createElement('div');
    drawerEl.id = 'dsk-drawer';
    drawerEl.setAttribute('role', 'menu');
    drawerEl.setAttribute('aria-label', 'Menu');
    drawerEl.innerHTML =
      '<div id="dsk-acct-wrap" style="display:none"><div class="dsk-dr-h">Account</div>' +
        '<div id="dsk-acct"></div><div class="dsk-dr-sep"></div></div>' +
      '<div class="dsk-dr-h">Quick actions</div>' + drawerItems();
    document.body.appendChild(drawerEl);
    drawerEl.addEventListener('click', function (e) {
      var it = e.target.closest && e.target.closest('[data-dr]');
      if (it) { setDrawer(false); runDrawer(it.getAttribute('data-dr')); }
    });
    hdrActs.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act], [data-dr]');
      if (!b) return;
      var act = b.getAttribute('data-act'), dr = b.getAttribute('data-dr');
      if (act === 'search' && fn('openCommandPalette')) window.openCommandPalette();
      if (act === 'talk') goTo('#contact');
      if (act === 'menu') { setDrawer(!drawerOpen()); return; }
    });
    /* close on a click elsewhere or on Escape */
    docClick = function (e) {
      if (drawerOpen() && !(e.target.closest && e.target.closest('#dsk-actions, #dsk-drawer'))) setDrawer(false);
    };
    docKey = function (e) {
      if (e.key === 'Escape' && drawerOpen()) { setDrawer(false); var bu = hdrActs.querySelector('.dsk-burger'); if (bu) bu.focus(); }
    };
    document.addEventListener('click', docClick, true);
    document.addEventListener('keydown', docKey);
    inner.appendChild(hdrNav);
    inner.appendChild(hdrActs);

    /* keep the header in view: a spacer takes its place in the page */
    var head = document.querySelector('header');
    hdrSpacer = document.createElement('div');
    hdrSpacer.id = 'dsk-hdr-spacer';
    head.parentNode.insertBefore(hdrSpacer, head);
    var fitSpacer = function () { if (hdrSpacer) hdrSpacer.style.height = head.offsetHeight + 'px'; };
    fitSpacer();
    head.classList.add('dsk-fixed');
    if (typeof ResizeObserver !== 'undefined') { hdrRO = new ResizeObserver(fitSpacer); hdrRO.observe(head); }
    adoptExtras();

    /* the sign-in pill may arrive after this runs: watch for it */
    hdrMO = new MutationObserver(function () { adoptExtras(); });
    hdrMO.observe(document.querySelector('header'), { childList: true, subtree: false });
    hdrMO.observe(inner, { childList: true });

    /* local time in Silchar, updated each minute boundary */
    var tEl = hdrActs.querySelector('.dsk-time b');
    var tick = function () {
      try {
        tEl.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
          .format(new Date()) + ' IST';
      } catch (e) { tEl.parentNode.style.display = 'none'; }
    };
    tick();
    clockT = setInterval(tick, 20000);

    /* highlight the last nav section whose top has passed 40% of the
       screen: accurate even while reading a section that has no link */
    var links = [].slice.call(hdrNav.querySelectorAll('.dsk-link'));
    var navRaf = 0;
    navScroll = function () {
      if (navRaf) return;
      navRaf = requestAnimationFrame(function () {
        navRaf = 0;
        /* the passed section nearest the reading line wins, whatever
           order the links happen to be in */
        var line = innerHeight * 0.4, current = null, best = -Infinity;
        links.forEach(function (l) {
          var t = document.querySelector(l.getAttribute('data-target'));
          if (!t) return;
          var top = t.getBoundingClientRect().top;
          if (top <= line && top > best) { best = top; current = l; }
        });
        links.forEach(function (l) { l.classList.toggle('is-active', l === current); });
      });
    };
    addEventListener('scroll', navScroll, { passive: true });
    navScroll();

    /* show as many links as actually fit, dropping the least important
       first; measured, because the sign-in pill's width is not known */
    addEventListener('resize', fitNav, { passive: true });
    fitNav();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
  }

  var DROP_ORDER = ['Blog', 'Telemetry', 'Stack', 'Services'];
  function fitNav() {
    if (!hdrNav) return;
    var links = [].slice.call(hdrNav.querySelectorAll('.dsk-link'));
    links.forEach(function (l) { l.style.display = ''; });
    for (var i = 0; i < DROP_ORDER.length && hdrNav.scrollWidth > hdrNav.clientWidth + 1; i++) {
      links.forEach(function (l) { if (l.textContent === DROP_ORDER[i]) l.style.display = 'none'; });
    }
  }

  /* ---------- menu drawer ---------- */
  var docClick = null, docKey = null, drawerEl = null, hdrSpacer = null, hdrRO = null;
  function drawerItems() {
    var pills = [].slice.call(document.querySelectorAll('.hero-cta-group .hero-cta-btn'));
    return pills.map(function (p, i) {
      var c = p.cloneNode(true);
      [].slice.call(c.querySelectorAll('kbd, svg')).forEach(function (k) { k.remove(); });
      var label = c.textContent.replace(/\s+/g, ' ').trim();
      var icon = p.querySelector('svg');
      var isSearch = p.classList.contains('hero-cta-search') || p.hasAttribute('data-command-palette');
      var target = isSearch ? 'search' : (p.getAttribute('href') || '');
      if (!label || !target) return '';
      return '<button type="button" class="dsk-dr-item" role="menuitem" style="--d:' + i + '" data-dr="' + target + '">' +
               '<span class="dsk-dr-ic">' + (icon ? icon.outerHTML : '') + '</span>' +
               '<span class="dsk-dr-t">' + label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>' +
               (isSearch ? '<kbd>\u2318K</kbd>' : '') +
             '</button>';
    }).join('');
  }
  function drawerOpen() { var d = drawerEl; return !!(d && d.classList.contains('is-open')); }
  function setDrawer(on) {
    var d = drawerEl, b = hdrActs && hdrActs.querySelector('.dsk-burger');
    if (!d || !b) return;
    if (on) {
      var r = b.getBoundingClientRect();
      d.style.top = Math.round(r.bottom + 12) + 'px';
      d.style.right = Math.max(8, Math.round(innerWidth - r.right)) + 'px';
    }
    d.classList.toggle('is-open', on);
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
    /* preventScroll: focusing inside a clipped container would otherwise
       scroll that container and push the header's contents out of view */
    if (on) { var first = d.querySelector('.dsk-dr-item'); if (first && document.activeElement === b) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 60); }
  }
  function runDrawer(target) {
    if (target === 'search') { if (fn('openCommandPalette')) window.openCommandPalette(); return; }
    if (target.charAt(0) !== '#') return;
    goTo(target);
    /* arriving at telemetry plays the same scan-line sweep as the hero pill */
    if (target === '#recent-activity') {
      setTimeout(function () {
        var sec = document.querySelector('#recent-activity');
        if (!sec) return;
        sec.style.setProperty('--tele-h', Math.min(sec.offsetHeight, 900) + 'px');
        sec.classList.remove('tele-arrived'); void sec.offsetWidth; sec.classList.add('tele-arrived');
        setTimeout(function () { sec.classList.remove('tele-arrived'); }, 1700);
      }, 1500);
    }
  }

  function destroyHeader() {
    if (!hdrNav) return;
    if (hdrMO) hdrMO.disconnect();
    if (docClick) document.removeEventListener('click', docClick, true);
    if (docKey) document.removeEventListener('keydown', docKey);
    docClick = docKey = null;
    if (navScroll) removeEventListener('scroll', navScroll);
    removeEventListener('resize', fitNav);
    clearInterval(clockT);
    /* put moved elements back, in reverse order, where they came from */
    moved.reverse().forEach(function (m) {
      try { m.parent.insertBefore(m.el, m.next && m.next.parentNode === m.parent ? m.next : null); } catch (e) {}
    });
    moved = [];
    hdrNav.remove(); hdrActs.remove();
    if (drawerEl) { drawerEl.remove(); drawerEl = null; }
    if (hdrRO) { hdrRO.disconnect(); hdrRO = null; }
    if (hdrSpacer) { hdrSpacer.remove(); hdrSpacer = null; }
    var hd = document.querySelector('header'); if (hd) hd.classList.remove('dsk-fixed');
    hdrNav = hdrActs = hdrMO = navScroll = null;
  }

  /* ---------- footer ---------- */
  function buildFooter() {
    var foot = document.querySelector('footer'), body = document.getElementById('shz-footer-inner');
    if (!foot || footEl) return;
    var hex = document.querySelector('header .hdr-hex svg');
    var brand = document.querySelector('header .hdr-brand-text');
    var tag = document.querySelector('header .hdr-tagline');
    var soc = [].slice.call(document.querySelectorAll('#socRow a'));

    var item = function (label, act, kbd) {
      return '<button type="button" class="dsk-f-a" data-f="' + act + '">' + label + (kbd ? '<kbd>' + kbd + '</kbd>' : '') + '</button>';
    };
    var col = function (title, items) {
      items = items.filter(Boolean);
      return items.length ? '<div><div class="dsk-f-h">' + title + '</div><div class="dsk-f-list">' + items.join('') + '</div></div>' : '';
    };
    footEl = document.createElement('div');
    footEl.id = 'dsk-foot';
    footEl.innerHTML =
      '<div>' +
        '<div class="dsk-f-brand">' + (hex ? hex.outerHTML : '') + '<span>' + (brand ? brand.textContent.trim() : 'ByteWithSahnawaz') + '</span></div>' +
        '<div class="dsk-f-tag">' + (tag ? tag.textContent.trim() : '') + '</div>' +
        '<p class="dsk-f-loc">Websites, UI/UX and AI-powered products, built by hand in Silchar, Assam, India.</p>' +
        '<div class="dsk-f-soc">' + soc.map(function (a) {
          return '<a href="' + a.getAttribute('href') + '" target="_blank" rel="noopener" aria-label="' +
                 (a.getAttribute('aria-label') || a.getAttribute('title') || 'Social link') + '">' + a.innerHTML + '</a>';
        }).join('') + '</div>' +
      '</div>' +
      col('Explore', [
        document.querySelector('#my-projects') && item('Projects', 'go:#my-projects'),
        document.querySelector('section.ts-section') && item('Tech Stack', 'go:section.ts-section'),
        document.querySelector('#projects') && item('Experience', 'go:#projects'),
        document.querySelector('#what-i-offer') && item('Services', 'go:#what-i-offer'),
        document.querySelector('#blog') && item('Blog', 'go:#blog'),
        document.querySelector('#testimonials') && item('Testimonials', 'go:#testimonials')
      ]) +
      col('Work with me', [
        fn('openResumeEmailModal') && item('Get the Resume', 'resume'),
        document.querySelector('#tools-services') && item('Book a Service', 'go:#tools-services'),
        document.querySelector('#contact') && item('Contact', 'go:#contact'),
        fn('openSharePopup') && item('Share This View', 'share')
      ]) +
      col('Under the hood', [
        fn('openWebVitals') && item('Performance Report', 'vitals'),
        window.perfGovernor && item('Performance Mode', 'mode'),
        fn('openCommandPalette') && item('Quick Search', 'search', '\u2318K'),
        item('Hacker Mode', 'hacker'),
        fn('_openCodePopup') && item('Code Editor', 'code')
      ]);
    footEl.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-f]');
      if (!b) return;
      var a = b.getAttribute('data-f');
      if (a.indexOf('go:') === 0) return goTo(a.slice(3));
      if (a === 'resume') window.openResumeEmailModal();
      if (a === 'share') window.openSharePopup();
      if (a === 'vitals') window.openWebVitals();
      if (a === 'mode') window.perfGovernor.openPopup();
      if (a === 'search') window.openCommandPalette();
      if (a === 'code') window._openCodePopup();
      if (a === 'hacker') {
        var t = document.getElementById('hacker-toggle');
        if (t) t.click();
        else { document.body.classList.toggle('hacker-mode'); if (fn('syncHackerToggleIcon')) window.syncHackerToggleIcon(); }
      }
    });
    foot.insertBefore(footEl, body || null);
  }
  function destroyFooter() { if (footEl) { footEl.remove(); footEl = null; } }

  function syncChrome() {
    var wide = false;
    try { wide = matchMedia(CHROME).matches; } catch (e) {}
    if (wide) { buildHeader(); buildFooter(); } else { destroyHeader(); destroyFooter(); }
  }

  /* build on wide screens only, and follow the window across the line */
  function sync() {
    var wide = false;
    try { wide = matchMedia(WIDE).matches; } catch (e) {}
    if (wide) build(); else destroy();
  }
  function start() {
    sync();
    try { matchMedia(WIDE).addEventListener('change', sync); } catch (e) {}
    /* after every other script has had a turn, so the functions the
       footer links to exist */
    setTimeout(function () {
      syncChrome();
      try { matchMedia(CHROME).addEventListener('change', syncChrome); } catch (e) {}
    }, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
