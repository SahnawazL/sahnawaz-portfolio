// api/system-status.js
//
// A genuine live health check for the three moving pieces behind
// "Recently Shipped" — not a decorative "99.9% uptime" badge. Every
// field here is either a real, timed round-trip made right now, or an
// honestly-labeled fact (like "is this env var set") rather than a
// synthetic pass/fail.
//
//   github    - hits GitHub's own /rate_limit endpoint (cheap, doesn't
//               count against the real rate limit) and times it.
//   firestore - does a real (tiny, limit:1) read against Firestore via
//               the Admin SDK and times it.
//   webhook   - CANNOT be "pinged" the way the other two can — the only
//               proof it works is a real push actually landing. So this
//               reports what's honestly knowable instead: whether the
//               secret is configured, and how long ago the last real
//               ship event was recorded. No push in a while doesn't
//               mean broken, just quiet — the UI should read it that
//               way, not as a red X.
//
// Env vars: same FIREBASE_* trio + GITHUB_TOKEN + GITHUB_WEBHOOK_SECRET
// the other api/ files already use. Missing ones are reported as
// "down"/"not configured" rather than crashing the endpoint.

const admin = require('firebase-admin');

function getDb() {
  if (admin.apps.length) return admin.firestore();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
    return admin.firestore();
  } catch (err) {
    return null;
  }
}

// Wraps a fetch with a hard timeout so one slow upstream can't hang the
// whole status check (and drag every other check down with it).
function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function checkGithub() {
  const started = Date.now();
  try {
    const headers = { 'User-Agent': 'sahnawaz-portfolio-status' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetchWithTimeout('https://api.github.com/rate_limit', { headers }, 3000);
    const latencyMs = Date.now() - started;
    if (!res.ok) return { status: 'down', latencyMs, detail: `HTTP ${res.status}` };
    const json = await res.json();
    const core = json.resources && json.resources.core;
    const status = latencyMs > 1500 ? 'degraded' : 'operational';
    return {
      status,
      latencyMs,
      detail: core ? `${core.remaining}/${core.limit} requests left this hour` : 'ok'
    };
  } catch (err) {
    return { status: 'down', latencyMs: Date.now() - started, detail: err.name === 'AbortError' ? 'timed out' : 'unreachable' };
  }
}

async function checkFirestore(db) {
  const started = Date.now();
  if (!db) return { status: 'down', latencyMs: 0, detail: 'Admin SDK not configured' };
  try {
    await db.collection('shipEvents').limit(1).get();
    const latencyMs = Date.now() - started;
    return { status: latencyMs > 1200 ? 'degraded' : 'operational', latencyMs, detail: 'read ok' };
  } catch (err) {
    return { status: 'down', latencyMs: Date.now() - started, detail: err.message || 'read failed' };
  }
}

async function checkWebhook(db) {
  const configured = !!process.env.GITHUB_WEBHOOK_SECRET;
  if (!db) return { configured, lastEventAt: null, detail: 'Firestore unavailable — cannot check history' };
  try {
    const snap = await db.collection('shipEvents').orderBy('timestamp', 'desc').limit(1).get();
    if (snap.empty) return { configured, lastEventAt: null, detail: 'No push received yet' };
    const doc = snap.docs[0].data();
    const ts = doc.timestamp && doc.timestamp.toDate ? doc.timestamp.toDate().toISOString() : (doc.pushedAt || null);
    return { configured, lastEventAt: ts, detail: doc.repo ? `Last: ${doc.repo}` : null };
  } catch (err) {
    return { configured, lastEventAt: null, detail: 'History unavailable' };
  }
}

/* ══ Owner-only data for admin.html (?admin=1) ══════════════════════════
   Lives in this file because the Hobby plan allows 12 functions and all 12
   are in use. Everything here needs the owner's Firebase ID token (the
   admin page sends it): records the browser can't read directly — job-fit
   reports, every page view (not only signed-in visitors), website checks —
   plus the "done" marks for leads, kept in adminState/handled. */
const OWNER_EMAIL = (process.env.ADMIN_EMAIL || 'balveerdj@gmail.com').toLowerCase();
let trafficCache = null;                      // { at, days, data } — page views cost one read each
const DAY = 864e5;

async function owner(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!m) return null;
  try {
    const t = await admin.auth().verifyIdToken(m[1]);
    return t && t.email_verified && String(t.email || '').toLowerCase() === OWNER_EMAIL ? t : null;
  } catch (e) { return null; }
}
const iso = v => { try { const d = v && v.toDate ? v.toDate() : (v && v._seconds ? new Date(v._seconds * 1000) : new Date(v)); return isNaN(d) ? null : d.toISOString(); } catch (e) { return null; } };
const bump = (o, k) => { k = String(k || '').trim() || 'unknown'; o[k] = (o[k] || 0) + 1; };
const top = (o, n) => Object.keys(o).map(k => [k, o[k]]).sort((a, b) => b[1] - a[1]).slice(0, n);
function refHost(r) {
  if (!r || r === 'direct') return 'Direct / typed';
  try { const h = new URL(r).hostname.replace(/^www\./, ''); return /sahnawaz-portfolio/.test(h) ? 'Direct / typed' : h; } catch (e) { return 'Other'; }
}

async function traffic(db, days) {
  if (trafficCache && trafficCache.days === days && Date.now() - trafficCache.at < 5 * 60e3) return trafficCache.data;
  const since = new Date(Date.now() - days * DAY);
  const snap = await db.collection('analytics').where('ts', '>=', since).orderBy('ts', 'desc').limit(5000).get();
  const byDay = {}, countries = {}, cities = {}, refs = {}, devices = {}, hours = new Array(24).fill(0);
  let views = 0;
  snap.forEach(d => {
    const x = d.data() || {}; if ((x.event || 'pageview') !== 'pageview') return;
    const when = x.ts && x.ts.toDate ? x.ts.toDate() : new Date(x.time || 0);
    if (isNaN(when)) return;
    views++;
    const ist = new Date(when.getTime() + 330 * 60e3);                 // owner's clock
    bump(byDay, ist.toISOString().slice(0, 10));
    hours[ist.getUTCHours()]++;
    bump(countries, x.country); bump(devices, x.device); bump(refs, refHost(x.referrer));
    if (x.city && x.city !== 'unknown') bump(cities, decodeURIComponent(String(x.city)) + (x.country && x.country !== 'unknown' ? ', ' + x.country : ''));
  });
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = new Date(Date.now() + 330 * 60e3 - i * DAY).toISOString().slice(0, 10);
    series.push([k, byDay[k] || 0]);
  }
  const data = { days, views, capped: snap.size >= 5000, series, hours, countries: top(countries, 8), cities: top(cities, 8), referrers: top(refs, 8), devices: top(devices, 4) };
  trafficCache = { at: Date.now(), days, data };
  return data;
}

async function adminData(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'Database not configured' });
  if (!(await owner(req))) return res.status(401).json({ error: 'Owner sign-in required' });
  const state = db.collection('adminState').doc('handled');

  if (req.method === 'POST') {
    const b = req.body || {};
    const keys = Array.isArray(b.keys) ? b.keys.slice(0, 400) : [b.key];
    const KEY = /^[a-z]{2,12}:[A-Za-z0-9_.:@-]{1,160}$/;
    if (!keys.length || !keys.every(k => KEY.test(String(k || '')))) return res.status(400).json({ error: 'Bad key' });
    const when = new Date().toISOString(), patch = {};
    keys.forEach(k => { patch[String(k).replace(/[.]/g, '_')] = b.done ? when : admin.firestore.FieldValue.delete(); });
    await state.set(patch, { merge: true });
    return res.status(200).json({ ok: true, count: keys.length });
  }

  const days = Math.max(7, Math.min(90, parseInt(req.query.days, 10) || 30));
  const safe = p => p.catch(e => ({ __error: (e && e.message) || 'failed' }));
  const [fitSnap, checkSnap, handledSnap, traf] = await Promise.all([
    safe(db.collection('jobFitReports').orderBy('createdAt', 'desc').limit(60).get()),
    safe(db.collection('websiteChecks').orderBy('checkedAt', 'desc').limit(40).get()),
    safe(state.get()),
    safe(traffic(db, days))
  ]);
  const fit = fitSnap.__error ? null : fitSnap.docs.map(d => {
    const x = d.data() || {}, r = x.result || {};
    return { id: d.id, at: iso(x.createdAt), role: r.role || '', fit: r.fit || '', score: typeof r.score === 'number' ? r.score : null,
      matches: (r.matches || []).length, gaps: (r.gaps || []).length, summary: String(r.summary || '').slice(0, 240), who: x.who || null };
  });
  const checks = checkSnap.__error ? null : checkSnap.docs.filter(d => d.id !== '_self').map(d => {
    const x = d.data() || {}, rep = x.report || {};
    return { id: d.id, at: x.checkedAt || null, host: x.host || '', score: x.score == null ? null : x.score, type: (rep.typeLabel || x.type || ''),
      city: x.city || '', country: x.country || '', key: rep.key || '' };
  });
  res.status(200).json({
    fetchedAt: new Date().toISOString(),
    fit, checks,
    handled: handledSnap.__error ? {} : (handledSnap.exists ? handledSnap.data() : {}),
    traffic: traf.__error ? null : traf,
    errors: [fitSnap, checkSnap, traf].filter(x => x && x.__error).map(x => x.__error)
  });
}

module.exports = async (req, res) => {
  if (req.query && req.query.admin) {
    try { return await adminData(req, res); }
    catch (err) { return res.status(500).json({ error: 'Admin data failed' }); }
  }
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  try {
    const db = getDb();
    const [github, firestore, webhook] = await Promise.all([
      checkGithub(),
      checkFirestore(db),
      checkWebhook(db)
    ]);
    res.status(200).json({ checkedAt: new Date().toISOString(), github, firestore, webhook });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed' });
  }
};
