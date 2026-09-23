// api/vitals.js — CommonJS, same shape as api/analytics.js
// Collects anonymous Core Web Vitals from real visits and reports the
// 75th percentile, which is how Google judges a site in the field.
//
// POST  { lcp, cls, inp, fcp, ttfb, conn, cores, device }  -> stores one sample
// GET                                                      -> { samples, p75, ... }
//
// No identifiers are stored: no IP, no user agent string, no cookie, no
// session id. Only the timings, a coarse connection class, a CPU-core
// count and a country code, none of which identify a person.

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue }      = require('firebase-admin/firestore');

/* ── Init Firebase Admin once (survives warm restarts) ── */
function getDB() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

const COLLECTION  = 'vitals';
const WINDOW_DAYS = 30;
const MAX_DOCS    = 1000;          // caps Firestore reads per cold aggregate
const CACHE_MS    = 10 * 60 * 1000; // serve the same numbers for 10 minutes

/* in-memory cache, per warm lambda instance */
let cache = { at: 0, body: null };

/* a metric is kept only if it is a sane, finite number */
function num(v, max) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 1000) / 1000 : null;
}
function str(v, max, allowed) {
  if (typeof v !== 'string') return null;
  const s = v.slice(0, max);
  return !allowed || allowed.includes(s) ? s : null;
}

/* 75th percentile: the value 75% of visits are at or below */
function p75(values) {
  const v = values.filter(x => typeof x === 'number').sort((a, b) => a - b);
  if (!v.length) return null;
  const i = Math.min(v.length - 1, Math.ceil(v.length * 0.75) - 1);
  return Math.round(v[i] * 1000) / 1000;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ---------------- read: the field numbers ---------------- */
  if (req.method === 'GET') {
    if (cache.body && Date.now() - cache.at < CACHE_MS) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).json({ ...cache.body, cached: true });
    }
    try {
      const since = new Date(Date.now() - WINDOW_DAYS * 86400000);
      const snap = await getDB().collection(COLLECTION)
        .where('ts', '>=', since).orderBy('ts', 'desc').limit(MAX_DOCS).get();

      const rows = snap.docs.map(d => d.data());
      const body = {
        samples: rows.length,
        days: WINDOW_DAYS,
        updated: new Date().toISOString(),
        p75: {
          lcp:  p75(rows.map(r => r.lcp)),
          cls:  p75(rows.map(r => r.cls)),
          inp:  p75(rows.map(r => r.inp)),
          fcp:  p75(rows.map(r => r.fcp)),
          ttfb: p75(rows.map(r => r.ttfb)),
        },
      };
      cache = { at: Date.now(), body };
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).json(body);
    } catch (err) {
      console.error('vitals read failed:', err.message);
      return res.status(200).json({ samples: 0, p75: null, error: 'unavailable' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* ---------------- write: one sample per visit ---------------- */
  /* only accept posts that came from this site's own pages */
  const host = req.headers.host || '';
  const from = req.headers.origin || req.headers.referer || '';
  if (host && from && !from.includes(host)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  const sample = {
    lcp:  num(b.lcp, 120000),
    cls:  num(b.cls, 10),
    inp:  num(b.inp, 120000),
    fcp:  num(b.fcp, 120000),
    ttfb: num(b.ttfb, 120000),
    conn:   str(b.conn, 8, ['slow-2g', '2g', '3g', '4g', '5g']),
    cores:  Number.isInteger(b.cores) && b.cores > 0 && b.cores <= 64 ? b.cores : null,
    device: str(b.device, 10, ['mobile', 'tablet', 'desktop']),
    country: req.headers['x-vercel-ip-country'] || 'unknown',
    ts: FieldValue.serverTimestamp(),
  };

  /* a sample with no timings at all is not worth a write */
  if (sample.lcp === null && sample.cls === null && sample.inp === null) {
    return res.status(200).json({ stored: false, reason: 'no metrics' });
  }

  try {
    await getDB().collection(COLLECTION).add(sample);
    return res.status(200).json({ stored: true });
  } catch (err) {
    console.error('vitals write failed:', err.message);
    return res.status(200).json({ stored: false });
  }
};
