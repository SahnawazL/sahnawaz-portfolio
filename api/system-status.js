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

module.exports = async (req, res) => {
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
