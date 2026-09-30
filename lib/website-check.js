// lib/website-check.js
//
// The free "Website check" for business owners. Runs inside api/vitals.js
// (POST { mode: 'check' | 'check-email' }), so it needs no function of its
// own — files in /lib don't count against Vercel's function limit.
//
// What it does
//   1. Reads the visitor's homepage the way a phone would (safely — only
//      public web addresses, see "Safety" below).
//   2. Runs Google's PageSpeed Insights test on a mobile phone: speed,
//      Google basics (SEO), ease of use (accessibility), a real screenshot.
//   3. Turns both into plain findings, four scores and a checklist that
//      fits the kind of business (clinic, restaurant, shop, school…).
//   4. The AI explains the findings in plain words (any of 4 languages).
//      Code decides every fact and number; the AI only explains them, and
//      if the AI is unavailable a written fallback is used.
//
// Safety
//   The server fetches an address a stranger typed, so it only ever opens
//   public http(s) sites: raw IP addresses, local names and any host that
//   resolves to a private / internal address are refused, redirects are
//   followed by hand and re-checked at every hop, and every read has a
//   time and size limit. Checks are rate-limited per visitor and results
//   are cached for 24 hours.
//
// Env
//   PAGESPEED_KEY  free Google API key (recommended; without it Google's
//                  shared quota often refuses, and the report is built
//                  without the speed test)
//   GROQ_API_KEY, GMAIL_USER, GMAIL_PASS, FIREBASE_*  (already set)

'use strict';

const dnsP = require('dns').promises;
const net = require('net');
const crypto = require('crypto');
const projectBrief = require('./project-brief');

const SITE = 'https://sahnawaz-portfolio.vercel.app';
const OWNER_EMAIL = 'shzthedigitalalchemist@gmail.com';
const CACHE_MS = 24 * 3600 * 1000;
const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
           'Chrome/126.0 Mobile Safari/537.36 SHZ-WebsiteCheck/1.0 (+' + SITE + ')';

const TYPES = {
  clinic:     { label: 'Clinic / Doctor',     say: 'clinic' },
  restaurant: { label: 'Restaurant / Café',   say: 'restaurant' },
  shop:       { label: 'Shop / Store',        say: 'shop' },
  school:     { label: 'School / Coaching',   say: 'school or coaching centre' },
  other:      { label: 'Business',            say: 'business' }
};
const LANGS = { en: 'English', hi: 'Hindi', bn: 'Bengali', as: 'Assamese' };

/* ── small helpers ─────────────────────────────────────────────────────── */
function clip(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n); }
function esc(s) { return projectBrief.esc(s); }
function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'").replace(/&copy;/gi, '©')
    .replace(/&#(\d{1,6});/g, function (_, n) { try { return String.fromCodePoint(+n); } catch (e) { return ''; } })
    .replace(/&#x([0-9a-f]{1,6});/gi, function (_, n) { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return ''; } });
}
function pickType(t) { return TYPES[t] ? t : 'other'; }
function pickLang(l) { return LANGS[l] ? l : 'en'; }

/* ── address handling + safety ─────────────────────────────────────────── */
/* What the visitor typed → { url, host, key } or null */
function normalizeInput(raw) {
  let s = String(raw || '').trim().slice(0, 300);
  if (!s) return null;
  s = s.replace(/^[a-z]+:\/\//i, function (m) { return m.toLowerCase(); });
  if (!/^https?:\/\//.test(s)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^[^:/]+\.[^:/]+:\d/.test(s)) return null; /* mailto:, javascript:, ftp: … */
    s = 'https://' + s;
  }
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null;
  if (u.port && u.port !== '80' && u.port !== '443') return null;
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || net.isIP(host) || host.indexOf('[') > -1) return null;          /* no raw IP addresses */
  if (!/^[a-z0-9.-]+$/.test(host) || host.indexOf('.') < 0 || host.length > 253) return null;
  if (/(^|\.)(localhost|local|localdomain|internal|intranet|lan|home|corp|test|example|invalid|onion)$/.test(host)) return null;
  const tld = host.split('.').pop();
  if (!/^[a-z]{2,24}$|^xn--[a-z0-9-]{2,59}$/.test(tld)) return null;
  u.hash = '';
  const path = (u.pathname || '/').replace(/\/+$/, '');
  return {
    url: u.protocol + '//' + host + (u.pathname || '/') + u.search,
    host: host,
    key: (host.replace(/^www\./, '') + path + u.search).toLowerCase().slice(0, 200)
  };
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number), a = p[0], b = p[1];
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    if (x === '::' || x === '::1') return true;
    if (/^(fc|fd|fe8|fe9|fea|feb|ff)/.test(x)) return true;
    const m = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (m) return isPrivateIp(m[1]);
    return false;
  }
  return true;
}

async function assertPublicHost(hostname, deps) {
  const host = String(hostname || '').toLowerCase();
  if (!host || net.isIP(host) || host.indexOf('.') < 0) throw codeError('blocked');
  if (/(^|\.)(localhost|local|localdomain|internal|intranet|lan|home|corp)$/.test(host)) throw codeError('blocked');
  let addrs;
  try { addrs = await deps.lookup(host, { all: true }); }
  catch (e) { throw codeError('notfound'); }
  if (!addrs || !addrs.length) throw codeError('notfound');
  if (addrs.some(function (a) { return isPrivateIp(a.address); })) throw codeError('blocked');
}

function codeError(code, extra) { const e = new Error(code); e.code = code; if (extra) Object.assign(e, extra); return e; }

async function readCapped(res, max) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const t = await res.text();
    return t.slice(0, max);
  }
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    chunks.push(Buffer.from(r.value));
    size += r.value.length;
    if (size >= max) { try { await reader.cancel(); } catch (e) {} break; }
  }
  return Buffer.concat(chunks).toString('utf8');
}

/* GET with redirects followed by hand (each hop re-checked), time + size limits */
async function safeFetch(startUrl, deps, opts) {
  opts = opts || {};
  const t0 = Date.now();
  const budget = opts.timeoutMs || 9000;
  const chain = [];
  let url = startUrl;
  for (let hop = 0; hop < 6; hop++) {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw codeError('blocked');
    if (u.port && u.port !== '80' && u.port !== '443') throw codeError('blocked');
    await assertPublicHost(u.hostname, deps);
    const left = budget - (Date.now() - t0);
    if (left < 400) throw codeError('timeout');
    let res;
    try {
      res = await deps.fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'Accept-Language': 'en-IN,en;q=0.9' },
        signal: AbortSignal.timeout(left)
      });
    } catch (e) {
      const msg = String(e && (e.cause && e.cause.code || e.name || e.message) || '');
      if (/Timeout|Abort/i.test(msg)) throw codeError('timeout');
      if (/CERT|SSL|TLS|self.signed|UNABLE_TO_VERIFY/i.test(msg)) throw codeError('ssl');
      throw codeError('unreachable');
    }
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      chain.push({ url: url, status: res.status });
      try { if (res.body && res.body.cancel) await res.body.cancel(); } catch (e) {}
      url = new URL(loc, url).toString();
      continue;
    }
    const ttfb = Date.now() - t0;
    const type = String(res.headers.get('content-type') || '');
    const text = /html|xml|text\/plain/i.test(type) || !type ? await readCapped(res, opts.maxBytes || 1500000) : '';
    return { url: url, status: res.status, headers: res.headers, contentType: type, text: text, chain: chain, ttfb: ttfb, ms: Date.now() - t0 };
  }
  throw codeError('redirects');
}

/* ── reading the homepage ──────────────────────────────────────────────── */
function parseAttrs(tag) {
  const out = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = decodeEntities(m[3] != null ? m[3] : m[4] != null ? m[4] : m[5] || '');
  return out;
}
function absUrl(href, base) {
  if (!href || !String(href).trim()) return '';
  try { const u = new URL(href, base); return /^https?:$/.test(u.protocol) ? u.toString() : ''; } catch (e) { return ''; }
}

function analyzeHtml(html, finalUrl) {
  const raw = String(html || '');
  const head = raw.slice(0, 400000);
  const metas = {};
  (head.match(/<meta\b[^>]*>/gi) || []).forEach(function (t) {
    const a = parseAttrs(t);
    const k = (a.property || a.name || a['http-equiv'] || '').toLowerCase();
    if (k && a.content != null && metas[k] == null) metas[k] = clip(a.content, 400);
  });
  const titleM = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? clip(decodeEntities(titleM[1]), 200) : '';
  const htmlTag = (raw.match(/<html\b[^>]*>/i) || [''])[0];
  const lang = parseAttrs(htmlTag).lang || '';

  const hrefs = [];
  (raw.match(/<a\b[^>]*>/gi) || []).forEach(function (t) { const a = parseAttrs(t); if (a.href) hrefs.push(a.href.trim()); });
  const iframes = (raw.match(/<iframe\b[^>]*>/gi) || []).map(function (t) { return parseAttrs(t).src || ''; });
  const links = [];
  (raw.match(/<link\b[^>]*>/gi) || []).forEach(function (t) { links.push(parseAttrs(t)); });
  const imgs = raw.match(/<img\b[^>]*>/gi) || [];
  const imgsNoAlt = imgs.filter(function (t) { return !/\balt\s*=/i.test(t); }).length;

  /* structured data (schema.org) */
  const ldTypes = [];
  (raw.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || []).forEach(function (s) {
    const body = s.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const j = JSON.parse(body);
      (Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j]).forEach(function (o) {
        const t = o && o['@type'];
        (Array.isArray(t) ? t : [t]).forEach(function (x) { if (x && ldTypes.indexOf(String(x)) < 0) ldTypes.push(String(x).slice(0, 40)); });
      });
    } catch (e) {}
  });

  /* visible text */
  const text = decodeEntities(raw
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const lower = (text + ' ' + hrefs.join(' ')).toLowerCase();

  const any = function (re) { return hrefs.some(function (h) { return re.test(h); }) || iframes.some(function (h) { return re.test(h); }); };
  const years = [];
  const yre = /(?:©|\(c\)|copyright)\s*(?:[a-z .,&-]{0,30})?(?:(?:19|20)\d{2}\s*[-–—]\s*)?((?:19|20)\d{2})/gi;
  let ym;
  while ((ym = yre.exec(text))) years.push(+ym[1]);

  const og = {
    title: clip(metas['og:title'] || '', 140),
    description: clip(metas['og:description'] || '', 220),
    image: absUrl(metas['og:image'] || metas['og:image:url'] || metas['twitter:image'] || '', finalUrl),
    siteName: clip(metas['og:site_name'] || '', 80)
  };
  const iconLink = links.find(function (l) { return /(^|\s)(shortcut )?icon(\s|$)|apple-touch-icon/i.test(l.rel || ''); });
  const canonical = links.find(function (l) { return /(^|\s)canonical(\s|$)/i.test(l.rel || ''); });

  const gen = (metas.generator || '').toLowerCase();
  const builtWith =
    /wordpress/.test(gen) || /wp-content|wp-includes/.test(raw) ? 'WordPress' :
    /wix/.test(gen) || /static\.wixstatic\.com|wix\.com/.test(raw) ? 'Wix' :
    /cdn\.shopify\.com|shopify/.test(raw) ? 'Shopify' :
    /blogger/.test(gen) || /blogger\.com|blogspot\.com/.test(raw) ? 'Blogger' :
    /squarespace/.test(raw) ? 'Squarespace' :
    /webflow/.test(gen) || /webflow\.com/.test(raw) ? 'Webflow' :
    /img1\.wsimg\.com|godaddy/.test(raw) ? 'GoDaddy Website Builder' :
    /sites\.google\.com|gstatic\.com\/atari/.test(raw) ? 'Google Sites' : '';

  return {
    title: title,
    description: clip(metas.description || '', 300),
    viewport: !!metas.viewport && /width\s*=\s*device-width/i.test(metas.viewport),
    lang: clip(lang, 20),
    h1: (raw.match(/<h1\b/gi) || []).length,
    noindex: /noindex/i.test(metas.robots || '') || /noindex/i.test(metas.googlebot || ''),
    og: og,
    favicon: !!iconLink,
    canonical: !!canonical,
    structured: ldTypes.slice(0, 8),
    tel: any(/^tel:/i),
    whatsapp: any(/wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com|wa\.link\//i),
    email: any(/^mailto:/i),
    form: /<form\b/i.test(raw),
    map: any(/google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|g\.page\//i),
    instagram: any(/instagram\.com\//i),
    facebook: any(/facebook\.com\/|fb\.com\//i),
    youtube: any(/youtube\.com\/|youtu\.be\//i),
    delivery: any(/zomato\.com|swiggy\.com/i),
    address: /\b(address|location|find us|visit us|reach us)\b/i.test(text) && /\b[1-9]\d{2}\s?\d{3}\b/.test(text),
    images: imgs.length,
    imagesNoAlt: imgsNoAlt,
    mixed: /^https:/i.test(finalUrl) ? ((raw.match(/\ssrc\s*=\s*["']http:\/\//gi) || []).length) : 0,
    year: years.length ? Math.max.apply(null, years) : null,
    words: words,
    jsOnly: words < 40 && (raw.match(/<script\b/gi) || []).length > 2,
    builtWith: builtWith,
    lower: lower,
    excerpt: text.slice(0, 1600)
  };
}

/* the homepage, over https first, http only if https can't connect */
async function readHomepage(target, deps) {
  const tries = [target.url];
  if (/^https:/.test(target.url)) tries.push(target.url.replace(/^https:/, 'http:'));
  let lastErr = null;
  for (let i = 0; i < tries.length; i++) {
    try {
      const r = await safeFetch(tries[i], deps, { timeoutMs: 9000, maxBytes: 1500000 });
      return r;
    } catch (e) {
      lastErr = e;
      if (e.code === 'blocked' || e.code === 'notfound') break;   /* http won't help */
    }
  }
  throw lastErr || codeError('unreachable');
}

/* does the plain http:// address move visitors to the secure one? */
async function checkHttpsRedirect(host, deps) {
  try {
    const r = await safeFetch('http://' + host + '/', deps, { timeoutMs: 4000, maxBytes: 2000 });
    return /^https:/i.test(r.url) || r.chain.some(function (c) { return /^https:/i.test(c.url); });
  } catch (e) { return null; }
}

async function basicsFor(target, deps) {
  const results = await Promise.all([readHomepage(target, deps), checkHttpsRedirect(target.host, deps)]);
  const page = results[0];
  const a = analyzeHtml(page.text, page.url);
  a.finalUrl = page.url;
  a.status = page.status;
  a.https = /^https:/i.test(page.url);
  a.httpRedirects = results[1];
  a.ttfb = page.ttfb;
  a.redirects = page.chain.length;
  a.htmlKb = Math.round(Buffer.byteLength(page.text || '', 'utf8') / 1024);
  a.noindex = a.noindex || /noindex/i.test(String(page.headers.get('x-robots-tag') || ''));
  return a;
}

/* ── Google PageSpeed Insights (mobile) ───────────────────────────────── */
const SPEED_GROUPS = {
  'render-blocking-resources': 'Files that stop the page from showing until they load',
  'uses-optimized-images': 'Images are much heavier than they need to be',
  'modern-image-formats': 'Images are much heavier than they need to be',
  'uses-responsive-images': 'Images are much heavier than they need to be',
  'offscreen-images': 'Images below the screen load before they are needed',
  'efficient-animated-content': 'Animations (GIFs) are very heavy',
  'unused-javascript': 'Code that is loaded but never used',
  'unused-css-rules': 'Code that is loaded but never used',
  'unminified-javascript': 'Code files are not compressed',
  'unminified-css': 'Code files are not compressed',
  'uses-text-compression': 'Files are sent without compression',
  'server-response-time': 'The server is slow to answer',
  'redirects': 'Extra redirects before the page starts loading',
  'uses-rel-preconnect': 'Connections to other servers start late',
  'prioritize-lcp-image': 'The main image is found late'
};

function parsePsi(j) {
  const lr = (j && j.lighthouseResult) || {};
  const cats = lr.categories || {};
  const au = lr.audits || {};
  const sc = function (k) { return cats[k] && typeof cats[k].score === 'number' ? Math.round(cats[k].score * 100) : null; };
  const metric = function (id) {
    const x = au[id];
    return x && typeof x.numericValue === 'number' ? { value: Math.round(x.numericValue * 1000) / 1000, text: clip(x.displayValue || '', 20) } : null;
  };
  const groups = {};
  Object.keys(au).forEach(function (id) {
    const x = au[id];
    if (!x || typeof x.score !== 'number' || x.score >= 0.9) return;
    const label = SPEED_GROUPS[id];
    if (!label) return;
    const save = (x.details && typeof x.details.overallSavingsMs === 'number') ? x.details.overallSavingsMs
               : id === 'server-response-time' && typeof x.numericValue === 'number' ? Math.max(0, x.numericValue - 600) : 0;
    if (save < 150) return;
    groups[label] = (groups[label] || 0) + save;
  });
  const opportunities = Object.keys(groups).map(function (k) { return { label: k, savingsMs: Math.round(groups[k]) }; })
    .sort(function (a, b) { return b.savingsMs - a.savingsMs; }).slice(0, 4);
  const failed = ['font-size', 'image-alt', 'color-contrast', 'link-text', 'meta-description', 'document-title',
    'is-crawlable', 'viewport', 'target-size', 'tap-targets', 'button-name', 'is-on-https', 'errors-in-console']
    .filter(function (id) { return au[id] && au[id].score === 0; });
  const shot = au['final-screenshot'] && au['final-screenshot'].details && au['final-screenshot'].details.data;
  const le = j && j.loadingExperience;
  const lcpField = le && le.metrics && le.metrics.LARGEST_CONTENTFUL_PAINT_MS;
  const bytes = au['total-byte-weight'] && au['total-byte-weight'].numericValue;
  return {
    scores: { performance: sc('performance'), seo: sc('seo'), accessibility: sc('accessibility'), bestPractices: sc('best-practices') },
    metrics: { fcp: metric('first-contentful-paint'), lcp: metric('largest-contentful-paint'), tbt: metric('total-blocking-time'),
               cls: metric('cumulative-layout-shift'), si: metric('speed-index') },
    field: le && le.overall_category ? { category: String(le.overall_category), lcpMs: lcpField && lcpField.percentile || null, origin: !!le.origin_fallback } : null,
    opportunities: opportunities,
    failed: failed,
    pageMb: typeof bytes === 'number' ? Math.round(bytes / 104857.6) / 10 : null,
    screenshot: typeof shot === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(shot) && shot.length < 300000 ? shot : null
  };
}

async function pageSpeed(url, deps, timeoutMs) {
  const q = new URLSearchParams({ url: url, strategy: 'mobile' });
  ['performance', 'seo', 'accessibility', 'best-practices'].forEach(function (c) { q.append('category', c); });
  if (deps.psiKey) q.set('key', deps.psiKey);
  const r = await deps.fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q.toString(), {
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!r.ok) throw codeError('psi', { status: r.status });
  return parsePsi(await r.json());
}

/* ── findings, checklist, scores ──────────────────────────────────────── */
const KEYWORDS = {
  hours: /\b(timings?|opening hours|open hours|business hours|working hours|hours of operation|open (daily|all days|mon|from)|mon(day)?\s*(-|–|to)\s*(sat|sun|fri)|\d{1,2}(:\d{2})?\s*(am|pm)\s*(-|–|to)\s*\d{1,2}(:\d{2})?\s*(am|pm))\b/i,
  appointment: /\b(appointment|book (a |an |your )?(visit|slot|consultation|appointment)|consult(ation)?|opd)\b/i,
  doctors: /\b(doctor|dr\.|specialist|treatment|surgeon|physician|dentist|clinic services|our services)\b/i,
  menu: /\bmenu\b/i,
  order: /\b(order (online|now)|zomato|swiggy|home delivery|order on whatsapp|takeaway|take away)\b/i,
  products: /\b(products?|catalog(ue)?|collection|shop now|buy now|add to cart|price|₹\s?\d|rs\.?\s?\d)\b/i,
  buy: /\b(buy now|add to cart|order (online|now)|order on whatsapp|checkout|cart)\b/i,
  admission: /\badmissions?\b/i,
  courses: /\b(courses?|classes|class \d|syllabus|curriculum|batch(es)?|programmes?|programs?)\b/i,
  fees: /\bfees?\b/i,
  services: /\b(services?|what we do|our work|solutions|about us)\b/i
};

function checklistFor(a, type) {
  const unknownText = a.jsOnly;                     /* page text is built by JavaScript: we can't read it */
  const kw = function (re) { return unknownText ? null : re.test(a.lower); };
  const nowYear = new Date().getFullYear();
  const items = [
    { id: 'https', label: 'Opens securely (https)', ok: !!a.https && a.httpRedirects !== false },
    { id: 'mobile', label: 'Made for phones (mobile layout)', ok: !!a.viewport },
    { id: 'call', label: 'Tap-to-call button', ok: !!a.tel },
    { id: 'whatsapp', label: 'WhatsApp button', ok: !!a.whatsapp },
    { id: 'map', label: 'Location or Google Maps link', ok: !!(a.map || a.address) },
    { id: 'preview', label: 'WhatsApp / Facebook link preview', ok: !!(a.og.title && a.og.image) },
    { id: 'google', label: 'Title and description for Google', ok: !!(a.title && a.description) && !a.noindex }
  ];
  if (a.year) items.push({ id: 'fresh', label: 'Looks up to date (© ' + a.year + ')', ok: a.year >= nowYear - 1 });
  const extra = {
    clinic: [['hours', 'Timings / opening hours', KEYWORDS.hours], ['appointment', 'Book an appointment', KEYWORDS.appointment], ['doctors', 'Doctors or treatments listed', KEYWORDS.doctors]],
    restaurant: [['menu', 'Menu on the website', KEYWORDS.menu], ['order', 'Order online (Zomato, Swiggy or WhatsApp)', null], ['hours', 'Opening hours', KEYWORDS.hours]],
    shop: [['products', 'Products or catalogue with prices', KEYWORDS.products], ['buy', 'Order on WhatsApp or online', null], ['hours', 'Opening hours', KEYWORDS.hours]],
    school: [['admission', 'Admissions information', KEYWORDS.admission], ['courses', 'Courses or classes listed', KEYWORDS.courses], ['fees', 'Fees or how to ask about fees', KEYWORDS.fees]],
    other: [['services', 'Clear list of services', KEYWORDS.services], ['contact', 'Contact form or email', null]]
  }[type] || [];
  extra.forEach(function (e) {
    let ok;
    if (e[0] === 'order') ok = a.delivery || a.whatsapp || kw(KEYWORDS.order);
    else if (e[0] === 'buy') ok = a.whatsapp || kw(KEYWORDS.buy);
    else if (e[0] === 'contact') ok = a.form || a.email;
    else ok = kw(e[2]);
    items.push({ id: e[0], label: e[1], ok: ok === null ? null : !!ok, forType: true });
  });
  return items;
}

function secs(ms) { return Math.round(ms / 100) / 10; }

function findingsFor(a, psi, type) {
  const f = [];
  const add = function (id, area, sev, title, detail) { f.push({ id: id, area: area, severity: sev, title: title, detail: detail || '' }); };
  const t = TYPES[type] || TYPES.other;
  if (!a.https) add('https', 'trust', 3, 'The site is not secure (no https)', 'Browsers show "Not secure" next to the address.');
  else if (a.httpRedirects === false) add('http', 'trust', 2, 'The plain http:// address does not switch to the secure one', 'Anyone typing the address without https sees a "Not secure" page.');
  if (a.noindex) add('noindex', 'google', 3, 'The site tells Google not to list it', 'A "noindex" setting hides it from Google search.');
  if (!a.viewport) add('viewport', 'mobile', 3, 'Not set up for phones', 'On a phone the page shows zoomed-out, desktop-sized text.');
  if (psi && psi.metrics.lcp && psi.metrics.lcp.value > 4000) add('lcp', 'speed', 3, 'Main content takes ' + secs(psi.metrics.lcp.value) + ' s to show on a phone', 'Google counts under 2.5 s as good.');
  else if (psi && psi.metrics.lcp && psi.metrics.lcp.value > 2500) add('lcp', 'speed', 2, 'Main content takes ' + secs(psi.metrics.lcp.value) + ' s to show on a phone', 'Google counts under 2.5 s as good.');
  if (psi && psi.metrics.tbt && psi.metrics.tbt.value > 600) add('tbt', 'speed', 2, 'The page freezes for ' + secs(psi.metrics.tbt.value) + ' s while it loads', 'Taps and scrolling don\'t respond during that time.');
  if (psi && psi.metrics.cls && psi.metrics.cls.value > 0.25) add('cls', 'speed', 2, 'Things jump around while the page loads', 'Visitors tap the wrong thing when the layout shifts.');
  if (psi && psi.pageMb && psi.pageMb > 4) add('weight', 'speed', 2, 'The page downloads ' + psi.pageMb + ' MB', 'Heavy on mobile data; most fast pages are under 2 MB.');
  if (psi && psi.field && psi.field.category === 'SLOW') add('field', 'speed', 3, 'Real visitors on Chrome find it slow', 'Google\'s data from actual visits rates this site as slow.');
  if (!a.tel) add('call', 'contact', 2, 'No tap-to-call button', 'On a phone, one tap should start a call to the ' + t.say + '.');
  if (!a.whatsapp) add('whatsapp', 'contact', 2, 'No WhatsApp button', 'Most customers in India prefer to message on WhatsApp first.');
  if (!(a.map || a.address)) add('map', 'contact', type === 'other' ? 1 : 2, 'No location or Google Maps link', 'Customers can\'t easily find or navigate to you.');
  if (!(a.og.title && a.og.image)) add('preview', 'trust', 2, a.og.image ? 'The WhatsApp link preview has no title' : 'Shared on WhatsApp, the link shows no picture', 'A link with a picture and title gets far more taps.');
  if (!a.title) add('title', 'google', 3, 'The page has no title', 'Google shows the title as the blue link in search results.');
  if (!a.description) add('description', 'google', 2, 'No description for Google', 'Google writes its own snippet, often from random page text.');
  if (a.h1 === 0 && !a.jsOnly) add('h1', 'google', 1, 'No main heading on the page', 'A clear heading helps Google understand what you do.');
  if (a.year && a.year < new Date().getFullYear() - 1) add('year', 'trust', 1, 'Shows © ' + a.year + ', so it looks outdated', 'Visitors wonder if the business is still open.');
  if (a.mixed > 0) add('mixed', 'trust', 1, 'Some images or files load insecurely', 'Browsers may block them or warn visitors.');
  if (a.images >= 4 && a.imagesNoAlt / a.images > 0.5) add('alt', 'google', 1, 'Most images have no description (alt text)', 'Google and screen readers can\'t tell what the images show.');
  if (a.structured.length === 0 && type !== 'other') add('schema', 'google', 1, 'No business details for Google (structured data)', 'Helps Google show your hours, address and rating.');
  if (a.jsOnly) add('jsonly', 'google', 1, 'The page text only appears after JavaScript runs', 'Some checks below may be incomplete; Google can also miss content like this.');
  if (psi) psi.opportunities.slice(0, 3).forEach(function (o, i) {
    add('opp' + i, 'speed', o.savingsMs >= 1500 ? 2 : 1, o.label, 'Fixing it could save about ' + secs(o.savingsMs) + ' s.');
  });
  return f.sort(function (x, y) { return y.severity - x.severity; });
}

function scoresFor(a, psi, checklist) {
  const known = checklist.filter(function (c) { return c.ok !== null; });
  const contact = known.length ? Math.round(100 * known.filter(function (c) { return c.ok; }).length / known.length) : null;
  let seoOwn = 100;
  if (!a.title) seoOwn -= 30;
  if (!a.description) seoOwn -= 15;
  if (a.noindex) seoOwn -= 50;
  if (!a.viewport) seoOwn -= 15;
  if (a.h1 === 0) seoOwn -= 5;
  if (!a.https) seoOwn -= 10;
  const s = {
    speed: psi ? psi.scores.performance : null,
    google: psi && psi.scores.seo != null ? psi.scores.seo : Math.max(0, seoOwn),
    easy: psi && psi.scores.accessibility != null ? psi.scores.accessibility : (a.viewport ? null : 30),
    contact: contact
  };
  const W = { speed: 0.35, google: 0.2, easy: 0.15, contact: 0.3 };
  let sum = 0, wsum = 0;
  Object.keys(W).forEach(function (k) { if (typeof s[k] === 'number') { sum += s[k] * W[k]; wsum += W[k]; } });
  s.overall = wsum ? Math.round(sum / wsum) : null;
  return s;
}

function verdictFor(overall) {
  if (overall == null) return { key: 'unknown', label: 'Checked' };
  if (overall >= 85) return { key: 'great', label: 'Looking good' };
  if (overall >= 65) return { key: 'fixes', label: 'Needs a few fixes' };
  if (overall >= 45) return { key: 'work', label: 'Needs work' };
  return { key: 'rebuild', label: 'Needs a rebuild' };
}

/* ── the AI explanation (facts in, plain words out) ───────────────────── */
const AI_SCHEMA = {
  name: 'website_check_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['headline', 'summary', 'top3', 'strengths'],
    properties: {
      headline: { type: 'string' },
      summary: { type: 'string' },
      top3: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'why', 'fix'],
          properties: { title: { type: 'string' }, why: { type: 'string' }, fix: { type: 'string' } }
        }
      },
      strengths: { type: 'array', items: { type: 'string' } }
    }
  }
};

function aiPrompt(r, a) {
  const facts = {
    site: r.host, businessType: TYPES[r.type].label, builtWith: a.builtWith || 'unknown',
    scores: r.scores, verdict: r.verdict.label,
    speed: r.speed ? { mainContentSeconds: r.speed.lcp && secs(r.speed.lcp.value), firstContentSeconds: r.speed.fcp && secs(r.speed.fcp.value),
      freezeSeconds: r.speed.tbt && secs(r.speed.tbt.value), pageMb: r.speed.pageMb, realVisitors: r.speed.field && r.speed.field.category } : 'speed test unavailable',
    problems: r.findings.slice(0, 10).map(function (f) { return f.title + (f.detail ? ' — ' + f.detail : ''); }),
    checklist: r.checklist.map(function (c) { return c.label + ': ' + (c.ok === null ? 'could not tell' : c.ok ? 'yes' : 'not found'); }),
    pageTitle: a.title, pageDescription: a.description, pageTextStart: a.excerpt.slice(0, 900)
  };
  return [
    'You explain a website check to a small-business owner in India (not a developer). The site is a ' + TYPES[r.type].say + '.',
    'Use ONLY the facts below. Never invent numbers, statistics, percentages of lost customers, or problems that are not listed.',
    'No jargon: say "main content shows up" not LCP, "Google search" not SEO. No markdown.',
    'headline: one short sentence (max 14 words) with the single most important takeaway.',
    'summary: 2 short sentences, honest and encouraging.',
    'top3: the three most important problems to fix, most important first (fewer if there are fewer). title: max 8 words. why: one sentence on what it costs this kind of business. fix: one sentence on what to do.',
    'strengths: up to 3 short things the site already does well (only if true from the facts).',
    'Write every field in ' + LANGS[r.lang] + '. Keep the site name and numbers as they are. Do not mention any prices or any person.',
    'Facts: ' + JSON.stringify(facts)
  ].join('\n');
}

function fallbackText(r) {
  const top = r.findings.slice(0, 3).map(function (f) {
    return { title: f.title, why: f.detail || 'This makes the site harder to use for customers.', fix: 'This can be fixed without changing the rest of the site.' };
  });
  const strengths = r.checklist.filter(function (c) { return c.ok; }).slice(0, 3).map(function (c) { return c.label; });
  const headline = r.verdict.key === 'great' ? 'Your website is in good shape.'
    : top.length ? 'Biggest issue: ' + top[0].title.charAt(0).toLowerCase() + top[0].title.slice(1) + '.'
    : 'Here is how your website did.';
  return {
    headline: headline,
    summary: 'We tested ' + r.host + ' on a phone and checked what customers see. ' +
      (top.length ? 'Fixing the ' + top.length + ' issues below would make the biggest difference.' : 'No major problems were found.'),
    top3: top,
    strengths: strengths,
    ai: false
  };
}

async function explain(r, a, deps, totalMs) {
  if (!deps.groqKey || totalMs < 2500) return fallbackText(r);
  const out = await projectBrief.groqJSON(deps.groqKey,
    [{ role: 'system', content: aiPrompt(r, a) }, { role: 'user', content: 'Write the report.' }],
    AI_SCHEMA, { temperature: 0.3, maxTokens: 900, timeoutMs: Math.min(8000, totalMs), totalMs: totalMs });
  if (!out || typeof out.headline !== 'string' || !Array.isArray(out.top3)) return fallbackText(r);
  const strip = function (s, n) { return clip(String(s || '').replace(/[*#>]{2,}|!!/g, ''), n); };
  const top3 = out.top3.slice(0, 3).map(function (x) { return { title: strip(x.title, 90), why: strip(x.why, 240), fix: strip(x.fix, 240) }; })
    .filter(function (x) { return x.title; });
  return {
    headline: strip(out.headline, 140) || fallbackText(r).headline,
    summary: strip(out.summary, 420),
    top3: top3.length ? top3 : fallbackText(r).top3,
    strengths: (Array.isArray(out.strengths) ? out.strengths : []).slice(0, 3).map(function (s) { return strip(s, 120); }).filter(Boolean),
    ai: true
  };
}

/* ── report assembly ──────────────────────────────────────────────────── */
function reportId(key, type, lang) {
  return crypto.createHash('sha1').update(key + '|' + type + '|' + lang).digest('hex').slice(0, 24);
}

function assemble(target, type, lang, a, psi, part) {
  const checklist = checklistFor(a, type);
  const scores = scoresFor(a, psi, checklist);
  const r = {
    id: reportId(target.key, type, lang),
    part: part,
    url: a.finalUrl || target.url,
    host: target.host.replace(/^www\./, ''),
    key: target.key,
    type: type,
    typeLabel: TYPES[type].label,
    lang: lang,
    checkedAt: new Date().toISOString(),
    status: a.status,
    builtWith: a.builtWith,
    page: { title: a.title, description: a.description, words: a.words, htmlKb: a.htmlKb, ttfbMs: a.ttfb, redirects: a.redirects },
    preview: { title: a.og.title || a.title, description: a.og.description || a.description, image: a.og.image, siteName: a.og.siteName, hasOg: !!(a.og.title && a.og.image) },
    checklist: checklist,
    speed: psi ? { scores: psi.scores, fcp: psi.metrics.fcp, lcp: psi.metrics.lcp, tbt: psi.metrics.tbt, cls: psi.metrics.cls, si: psi.metrics.si,
                   field: psi.field, pageMb: psi.pageMb, opportunities: psi.opportunities } : null,
    screenshot: psi ? psi.screenshot : null,
    scores: scores
  };
  r.verdict = verdictFor(scores.overall);
  r.findings = findingsFor(a, psi, type);
  return r;
}

/* ── caches, limits, storage ──────────────────────────────────────────── */
const memReports = new Map();   // id -> { at, report }
const memPsi = new Map();       // key -> { at, psi }
const memBasics = new Map();    // key -> { at, a } (short-lived, shared by the two parallel requests)
const ipLog = new Map();        // ip -> [times]
let selfPsi = { at: 0, score: null };

function remember(map, k, v, max) {
  map.set(k, v);
  if (map.size > (max || 200)) map.delete(map.keys().next().value);
}
function allowed(ip, limit) {
  const now = Date.now();
  const list = (ipLog.get(ip) || []).filter(function (t) { return now - t < 3600000; });
  if (list.length >= limit) { ipLog.set(ip, list); return false; }
  list.push(now);
  ipLog.set(ip, list);
  if (ipLog.size > 2000) ipLog.clear();
  return true;
}

async function loadStored(getDB, id) {
  try {
    const d = await getDB().collection('websiteChecks').doc(id).get();
    if (!d.exists) return null;
    const x = d.data();
    return x && x.report ? x.report : null;
  } catch (e) { return null; }
}
async function store(getDB, r, meta) {
  try {
    /* Firestore refuses undefined values; a JSON round trip drops them */
    await getDB().collection('websiteChecks').doc(r.id).set({
      report: JSON.parse(JSON.stringify(r)), host: r.host, score: r.scores.overall, type: r.type, lang: r.lang,
      country: meta.country || '', city: meta.city || '', checkedAt: r.checkedAt
    });
  } catch (e) { console.warn('[check] store failed:', e && e.message); }
}
async function logForOwner(getDB, fv, r, meta) {
  try {
    const s = r.scores;
    await getDB().collection('messages').add({
      name: '🩺 Website checks', email: '',
      message: r.host + ' — ' + (s.overall == null ? '?' : s.overall) + '/100 (' + r.verdict.label + ') · ' + r.typeLabel +
        (meta.city ? ' · visitor near ' + meta.city + (meta.country ? ', ' + meta.country : '') : '') + '\n' +
        'Speed ' + nz(s.speed) + ' · Google ' + nz(s.google) + ' · Easy to use ' + nz(s.easy) + ' · Contact & trust ' + nz(s.contact) + '\n' +
        'Top: ' + r.findings.slice(0, 3).map(function (f) { return f.title; }).join(' · ') + '\n' +
        SITE + '/?check=' + encodeURIComponent(r.key) + '&type=' + r.type,
      source: 'website-check', url: r.url, reportId: r.id,
      country: meta.country || 'unknown', city: meta.city || 'unknown',
      createdAt: fv.serverTimestamp(), time: new Date().toISOString()
    });
  } catch (e) { console.warn('[check] log failed:', e && e.message); }
}
function nz(v) { return v == null ? '–' : v; }

function metaOf(req) {
  let city = '';
  try { city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : ''; } catch (e) {}
  return { city: clip(city, 60), country: clip(req.headers['x-vercel-ip-country'] || '', 4) };
}
function ipOf(req) { return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'; }

const ERR_TEXT = {
  invalid: "That doesn't look like a website address — try something like yourbusiness.com",
  blocked: "That address can't be checked. Please enter a public website address.",
  notfound: "We couldn't find a website at that address — could you check the spelling?",
  timeout: 'The website took too long to answer. It may be down or very slow — try again in a minute.',
  ssl: "The website's security certificate has a problem, so browsers will warn visitors before opening it.",
  unreachable: "We couldn't connect to that website. It may be down right now.",
  redirects: 'The website keeps redirecting in a loop, so it never finishes opening.',
  limit: "You've run a lot of checks in the last hour — please try again a little later.",
  server: 'Something went wrong on our side — please try again.'
};

function defaultDeps() {
  return {
    fetch: globalThis.fetch,
    lookup: function (h, o) { return dnsP.lookup(h, o); },
    psiKey: process.env.PAGESPEED_KEY || '',
    groqKey: process.env.GROQ_API_KEY || ''
  };
}

/* self score: this portfolio on the same test, kept for 24 h */
async function selfScore(getDB, deps, timeoutMs) {
  const now = Date.now();
  if (selfPsi.at && now - selfPsi.at < CACHE_MS) return selfPsi.score;
  try {
    const d = await getDB().collection('websiteChecks').doc('_self').get();
    if (d.exists && now - new Date(d.data().at).getTime() < CACHE_MS) { selfPsi = { at: now, score: d.data().score }; return selfPsi.score; }
  } catch (e) {}
  try {
    const p = await pageSpeed(SITE + '/', deps, timeoutMs);
    selfPsi = { at: now, score: p.scores.performance };
    try { await getDB().collection('websiteChecks').doc('_self').set({ score: selfPsi.score, at: new Date().toISOString() }); } catch (e) {}
    return selfPsi.score;
  } catch (e) { return null; }
}

/* ── POST { mode: 'check' } ───────────────────────────────────────────── */
async function runCheck(req, res, ctx) {
  const b = ctx.body, deps = ctx.deps, getDB = ctx.getDB;
  const target = normalizeInput(b.url);
  if (!target) return res.status(400).json({ error: 'invalid', message: ERR_TEXT.invalid });
  const type = pickType(b.type), lang = pickLang(b.lang);
  const id = reportId(target.key, type, lang);
  const part = b.part === 'basics' ? 'basics' : 'full';
  const t0 = Date.now();

  /* a fresh full report answers both kinds of request */
  const mem = memReports.get(id);
  if (mem && Date.now() - mem.at < CACHE_MS) return res.status(200).json({ report: mem.report, cached: true });
  if (part === 'full' && getDB) {
    const st = await loadStored(getDB, id);
    if (st && Date.now() - new Date(st.checkedAt).getTime() < CACHE_MS) {
      remember(memReports, id, { at: new Date(st.checkedAt).getTime(), report: st });
      return res.status(200).json({ report: st, cached: true });
    }
  }

  if (part === 'basics') {
    try {
      const a = await basicsFor(target, deps);
      remember(memBasics, target.key, { at: Date.now(), a: a }, 100);
      const r = assemble(target, type, lang, a, null, 'basics');
      return res.status(200).json({ report: r });
    } catch (e) {
      return res.status(200).json({ error: e.code || 'unreachable', message: ERR_TEXT[e.code] || ERR_TEXT.unreachable });
    }
  }

  if (!allowed(ctx.ip, 8)) return res.status(429).json({ error: 'limit', message: ERR_TEXT.limit });

  /* homepage + Google's phone test (+ this portfolio's score) in parallel */
  const psiMem = memPsi.get(target.key);
  const psiP = psiMem && Date.now() - psiMem.at < CACHE_MS ? Promise.resolve(psiMem.psi)
    : pageSpeed(target.url, deps, 42000).then(function (p) { remember(memPsi, target.key, { at: Date.now(), psi: p }); return p; })
      .catch(function (e) { console.warn('[check] psi failed:', e && (e.status || e.message)); return null; });
  const selfP = getDB && deps.psiKey ? selfScore(getDB, deps, 42000) : Promise.resolve(null);
  const bm = memBasics.get(target.key);
  const basicsP = bm && Date.now() - bm.at < 120000 ? Promise.resolve(bm.a) : basicsFor(target, deps);

  let a;
  try { a = await basicsP; }
  catch (e) { return res.status(200).json({ error: e.code || 'unreachable', message: ERR_TEXT[e.code] || ERR_TEXT.unreachable }); }
  const results = await Promise.all([psiP, selfP]);
  const psi = results[0];
  const r = assemble(target, type, lang, a, psi, 'full');
  r.speedUnavailable = !psi;
  const self = results[1];
  if (typeof self === 'number' && self >= 80 && (r.scores.speed == null || self > r.scores.speed)) r.compare = { site: 'sahnawaz-portfolio.vercel.app', speed: self };
  r.text = await explain(r, a, deps, Math.max(0, 54000 - (Date.now() - t0)));

  remember(memReports, id, { at: Date.now(), report: r });
  if (getDB) {
    const meta = metaOf(req);
    const own = target.host.replace(/^www\./, '') === 'sahnawaz-portfolio.vercel.app';
    await Promise.all([store(getDB, r, meta), own ? null : logForOwner(getDB, ctx.FieldValue, r, meta)]);
  }
  return res.status(200).json({ report: r });
}

/* ── POST { mode: 'check-email' }: send the report, tell Sahnawaz ────── */
function scoreColor(v) { return v == null ? '#8fb3c7' : v >= 85 ? '#4fe0a2' : v >= 60 ? '#ffc53d' : '#ff7a6b'; }

function reportEmailHtml(r, forOwner, visitor) {
  const s = r.scores;
  const tile = function (label, v) {
    return '<td style="padding:6px;text-align:center;"><div style="font-size:22px;font-weight:800;color:' + scoreColor(v) + ';">' + (v == null ? '–' : v) +
      '</div><div style="font-size:11px;color:#8fb3c7;">' + esc(label) + '</div></td>';
  };
  const t = r.text || fallbackText(r);
  const top = (t.top3 || []).map(function (x, i) {
    return '<li style="margin:0 0 10px;"><b style="color:#fff;">' + esc(x.title) + '</b><br><span style="color:#cfe6f5;">' + esc(x.why) + '</span><br>' +
      '<span style="color:#8fe9c4;">Fix: ' + esc(x.fix) + '</span></li>';
  }).join('');
  const checks = r.checklist.map(function (c) {
    return '<tr><td style="padding:3px 8px 3px 0;color:' + (c.ok ? '#4fe0a2' : c.ok === null ? '#8fb3c7' : '#ff7a6b') + ';">' + (c.ok ? '✓' : c.ok === null ? '?' : '✗') +
      '</td><td style="padding:3px 0;color:#e2f6ff;font-size:13px;">' + esc(c.label) + '</td></tr>';
  }).join('');
  const link = SITE + '/?check=' + encodeURIComponent(r.key) + '&type=' + r.type + (r.lang !== 'en' ? '&lang=' + r.lang : '');
  return '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:auto;background:#0b1a2b;padding:24px;border-radius:14px;color:#e2f6ff;">' +
    '<div style="font-size:12px;letter-spacing:2px;color:#00dcff;font-weight:700;text-transform:uppercase;">' +
      (forOwner ? '🩺 Website check lead' : 'Free website check') + ' · ' + esc(r.host) + '</div>' +
    (forOwner && visitor ? '<p style="margin:8px 0 0;color:#cfe6f5;font-size:14px;">' + esc(visitor.name || 'A visitor') + ' (' + esc(visitor.email) + ') asked for this report' +
      (visitor.city ? ' · near ' + esc(visitor.city) : '') + '. Reply to this email to reach them.</p>' : '') +
    '<h2 style="margin:10px 0 4px;color:#fff;font-size:20px;">' + esc(r.verdict.label) + ' — ' + (s.overall == null ? '–' : s.overall) + '/100</h2>' +
    '<p style="margin:0 0 12px;color:#cfe6f5;font-size:14px;line-height:1.6;">' + esc(t.headline) + ' ' + esc(t.summary || '') + '</p>' +
    '<table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid rgba(0,255,255,.15);border-bottom:1px solid rgba(0,255,255,.15);"><tr>' +
      tile('Speed on a phone', s.speed) + tile('Google basics', s.google) + tile('Easy to use', s.easy) + tile('Contact & trust', s.contact) +
    '</tr></table>' +
    (r.speed && r.speed.lcp ? '<p style="margin:12px 0 0;color:#8fb3c7;font-size:13px;">On a phone, the main content shows after <b style="color:#fff;">' + esc(r.speed.lcp.text || secs(r.speed.lcp.value) + ' s') + '</b>.</p>' : '') +
    (top ? '<p style="margin:16px 0 8px;color:#7ec8e3;font-size:13px;font-weight:700;">Top things to fix</p><ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.55;">' + top + '</ol>' : '') +
    '<p style="margin:14px 0 6px;color:#7ec8e3;font-size:13px;font-weight:700;">Checklist for a ' + esc(TYPES[r.type].say) + '</p><table cellpadding="0" cellspacing="0">' + checks + '</table>' +
    '<div style="margin-top:20px;">' +
      '<a href="' + esc(link) + '" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:10px;background:#00dcff;color:#021018;font-weight:700;text-decoration:none;font-size:14px;">View the full report</a>' +
      (forOwner ? '' : '<a href="' + SITE + '/?plan=redesign" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:10px;background:#4fe0a2;color:#04210f;font-weight:700;text-decoration:none;font-size:14px;">Plan the fix with Sahnawaz</a>') +
    '</div>' +
    '<p style="margin:18px 0 0;font-size:12px;color:#4a7a8a;">A snapshot from Google\'s PageSpeed test on a mid-range phone, plus a read of the homepage. Scores vary a little between runs. ' +
      (forOwner ? '' : 'Sahnawaz Ahmed Laskar · Web Developer &amp; UI/UX Designer · ' + SITE.replace('https://', '')) + '</p>' +
  '</div>';
}

async function emailReport(req, res, ctx) {
  const b = ctx.body, getDB = ctx.getDB;
  const email = clip(b.email, 120).toLowerCase();
  const name = clip(b.name, 60);
  if (!/^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ error: 'email', message: 'Please enter a valid email address.' });
  const id = String(b.id || '').replace(/[^a-f0-9]/g, '').slice(0, 24);
  if (id.length !== 24) return res.status(400).json({ error: 'report', message: 'Run the check first.' });
  if (!allowed('mail:' + ctx.ip, 4)) return res.status(429).json({ error: 'limit', message: 'Too many emails — please try again later.' });
  let r = memReports.get(id) && memReports.get(id).report;
  if (!r && getDB) r = await loadStored(getDB, id);
  if (!r) return res.status(404).json({ error: 'report', message: 'That report has expired — please run the check again.' });

  const meta = metaOf(req);
  const nodemailer = ctx.nodemailer || require('nodemailer');
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } });
  const visitor = { email: email, name: name, city: meta.city };
  try {
    await Promise.all([
      transporter.sendMail({
        from: '"Sahnawaz Ahmed Laskar" <' + process.env.GMAIL_USER + '>',
        to: email, replyTo: OWNER_EMAIL,
        subject: '🩺 Your website check: ' + r.host + ' — ' + (r.scores.overall == null ? '' : r.scores.overall + '/100'),
        html: reportEmailHtml(r, false)
      }),
      transporter.sendMail({
        from: '"Website Check" <' + process.env.GMAIL_USER + '>',
        to: OWNER_EMAIL, replyTo: email,
        subject: '🩺 Website check lead: ' + r.host + ' — ' + (r.scores.overall == null ? '?' : r.scores.overall) + '/100 · ' + r.typeLabel + ' — ' + (name || email),
        html: reportEmailHtml(r, true, visitor)
      })
    ]);
  } catch (e) {
    console.error('[check] mail error:', e && e.message);
    return res.status(500).json({ error: 'mail', message: "The email couldn't be sent just now — please try again." });
  }
  if (getDB) {
    try {
      await getDB().collection('messages').add({
        name: name || email.split('@')[0], email: email,
        message: '🩺 Asked for their website check report: ' + r.host + ' — ' + nz(r.scores.overall) + '/100 (' + r.verdict.label + ') · ' + r.typeLabel + '\n' +
          'Top: ' + r.findings.slice(0, 3).map(function (f) { return f.title; }).join(' · ') + '\n' + SITE + '/?check=' + encodeURIComponent(r.key) + '&type=' + r.type,
        source: 'website-check-lead', url: r.url, reportId: r.id,
        country: meta.country || 'unknown', city: meta.city || 'unknown',
        createdAt: ctx.FieldValue.serverTimestamp(), time: new Date().toISOString()
      });
    } catch (e) { console.warn('[check] lead log failed:', e && e.message); }
  }
  return res.status(200).json({ success: true });
}

/* entry point used by api/vitals.js */
async function handle(req, res, opts) {
  opts = opts || {};
  res.setHeader('Cache-Control', 'no-store');
  const body = (typeof req.body === 'string' ? (function () { try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } })() : req.body) || {};
  const ctx = { body: body, deps: Object.assign(defaultDeps(), opts.deps || {}), getDB: opts.getDB || null,
                FieldValue: opts.FieldValue, nodemailer: opts.nodemailer, ip: ipOf(req) };
  try {
    if (body.mode === 'check-email') return await emailReport(req, res, ctx);
    return await runCheck(req, res, ctx);
  } catch (e) {
    console.error('[check] failed:', e && e.stack || e);
    if (!res.headersSent) return res.status(200).json({ error: 'server', message: ERR_TEXT.server });
  }
}

module.exports = {
  handle, normalizeInput, isPrivateIp, analyzeHtml, parsePsi, checklistFor, findingsFor, scoresFor,
  verdictFor, fallbackText, reportEmailHtml, TYPES, LANGS,
  _reset: function () { memReports.clear(); memPsi.clear(); memBasics.clear(); ipLog.clear(); selfPsi = { at: 0, score: null }; }
};
