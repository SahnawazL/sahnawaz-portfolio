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
    ['section.sec-wipe',    'Home'],
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
    var ref = document.querySelector('section.sec-wipe') || document.body;
    var side = ref.getBoundingClientRect().left;
    var widest = 0;
    items.forEach(function (it) {
      var l = it.btn.querySelector('.dsk-label');
      widest = Math.max(widest, l.scrollWidth);
    });
    rail.classList.toggle('has-room', side >= 14 + 12 + 10 + 10 + widest + 16);
    updateFill();
  }

  function jump(el) {
    var header = document.querySelector('header');
    var offset = header && getComputedStyle(header).position === 'fixed' ? header.offsetHeight : 0;
    var y = el.getBoundingClientRect().top + scrollY - offset - 12;
    try { scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (e) { scrollTo(0, y); }
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
