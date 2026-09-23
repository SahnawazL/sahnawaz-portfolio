/* ============================================================
   SERVICE WORKER  —  sahnawaz-portfolio
   v4

   What changed from v3, and why:

   1. The old list held 9 files, from before the site was split into
      modules. A returning visitor without a signal got index.html from
      the cache and nothing else — an unstyled, dead page. All 25 local
      files are now pre-cached.

   2. The old worker tried to cache every request, including POSTs.
      cache.put() rejects on a POST, so every contact form submission and
      chat message threw inside the worker. Only GET is handled now.

   3. The old worker cached /api/ responses. Offline, a visitor could be
      shown stale chat replies or GitHub data as if they were live. API
      calls now go to the network only.

   4. If a file was missing from the cache, the old worker returned
      nothing, which the browser reports as a network error. There is now
      an offline page for navigations.

   Strategy per request type:
     navigation (HTML)  network first → cache → offline.html
     CSS / JS / images  network first (3s timeout) → cache
     /api/ and others   network only

   Nothing stale is ever shown while a connection exists: a deploy takes
   effect on the very next load, with no second refresh needed.
   ============================================================ */

const VERSION     = 'v4';
const PRECACHE    = 'shz-precache-' + VERSION;
const RUNTIME     = 'shz-runtime-' + VERSION;
const OFFLINE_URL = './offline.html';

/* The app shell: everything needed to render the site with no network. */
const PRECACHE_URLS = [
  './',
  './index.html',
  OFFLINE_URL,
  './site.webmanifest',

  './css/portfolio-core.css',
  './css/login-modal.css',
  './css/portfolio-ui.css',
  './css/desktop.css',
  './css/print.css',

  './js/web-vitals.js',
  './js/perf-governor.js',
  './js/portfolio-01.js',
  './js/portfolio-02.js',
  './js/portfolio-03.js',
  './js/portfolio-04.js',
  './js/portfolio-05.js',
  './js/portfolio-06.js',
  './js/portfolio-07.js',
  './js/portfolio-08.js',
  './js/portfolio-09.js',
  './js/portfolio-10.js',
  './js/portfolio-11.js',
  './js/visitor-auth.js',
  './js/engagement.js',
  './js/ship-toast.js',
  './js/command-palette.js',
  './js/url-state.js',
  './js/security-audit.js',
  './js/desktop-layout.js',

  './profile.jpg',
  './favicon.ico',
  './favicon-32x32.png',
  './favicon-192x192.png',
  './favicon-512x512.png',
  './apple-touch-icon.png'
];

/* ---------------- install ---------------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE).then(cache =>
      /* one missing file must not fail the whole install, which is what
         cache.addAll() would do */
      Promise.all(PRECACHE_URLS.map(url =>
        cache.add(new Request(url, { cache: 'reload' }))
             .catch(err => console.warn('[sw] skipped', url, err && err.message))
      ))
    ).then(() => self.skipWaiting())
  );
});

/* ---------------- activate ---------------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        /* every cache from an older version goes, so nothing survives a deploy */
        keys.filter(k => k !== PRECACHE && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* a page can ask this worker to step aside if anything ever goes wrong:
   navigator.serviceWorker.controller.postMessage('SHZ_RESET') */
self.addEventListener('message', event => {
  if (event.data === 'SHZ_RESET') {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(c => c.navigate(c.url)));
  }
});

/* ---------------- helpers ---------------- */
function isAsset(req) {
  return ['style', 'script', 'font', 'image'].indexOf(req.destination) !== -1;
}

/* Look in the runtime cache before the precache.

   The precache holds the copies stored when the worker installed; the
   runtime cache holds whatever was fetched since, which is newer. A plain
   caches.match() searches in creation order and would hand back the older
   precached file, so an offline visitor could see a version older than the
   one they loaded a minute earlier. */
function fromCache(req) {
  return caches.open(RUNTIME)
    .then(cache => cache.match(req))
    .then(hit => hit || caches.match(req));
}

/* Network first, with the cache as a safety net.

   A cache-first strategy would be faster on repeat visits, but it serves
   the previous copy of a file and only fetches the new one afterwards —
   so a freshly deployed change needs two loads before it appears. That is
   unacceptable while the site is being worked on, so whenever there is a
   usable connection the network wins and the cache is only a fallback.

   The timeout keeps a slow or half-connected network (a hotel portal, a
   dead spot with bars showing) from hanging the page: after 3 seconds the
   cached copy is used instead. */
const NET_TIMEOUT = 3000;

function networkFirst(req) {
  return new Promise(resolve => {
    let settled = false;
    const done = res => { if (!settled) { settled = true; resolve(res); } };

    const fallback = () => fromCache(req).then(hit => { if (hit) done(hit); });

    const timer = setTimeout(fallback, NET_TIMEOUT);

    /* 'no-cache' asks the server whether this file changed instead of
       silently reusing the browser's own stored copy. Without it a deploy
       can stay invisible even though the worker went to the network. The
       server answers 304 when nothing changed, so the cost is tiny. */
    fetch(new Request(req, { cache: 'no-cache' })).then(res => {
      clearTimeout(timer);
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(RUNTIME).then(cache => cache.put(req, copy));
      }
      done(res);
    }).catch(() => {
      clearTimeout(timer);
      fromCache(req).then(hit => done(hit || Response.error()));
    });
  });
}

/* ---------------- fetch ---------------- */
self.addEventListener('fetch', event => {
  const req = event.request;

  /* only GET can be cached; a POST would reject inside cache.put() */
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* the API must always be live: stale chat replies or GitHub data would
     be worse than an honest failure */
  if (url.pathname.indexOf('/api/') === 0 || url.pathname.indexOf('/_vercel/') === 0) return;

  /* pages: fresh when possible, cached when not, offline page as the last
     resort — never a browser error screen */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(req, { cache: 'no-cache' }))
        .then(res => {
          /* never store an error page: a cached 404 or 500 would be served
             back to the visitor later as if it were the site */
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          fromCache(req)
            .then(hit => hit || fromCache(new Request('./index.html')))
            .then(hit => hit || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  /* same-origin assets: always the newest version when online, the cached
     copy only when the network cannot answer */
  if (url.origin === self.location.origin && isAsset(req)) {
    event.respondWith(networkFirst(req));
    return;
  }

  /* everything else (other sites, analytics) is left alone */
});
