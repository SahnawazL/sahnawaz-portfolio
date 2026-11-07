// Saved answers for common first questions ("What are his skills?"), so a
// popular question doesn't use the AI every time. Shared through Firestore
// (the same project the site already uses) with a small in-memory copy.
// Only first questions with nothing personal are saved, and copies expire
// after a few hours so live numbers (GitHub, YojanaSahay) stay fresh.
const crypto = require('crypto');

const COLLECTION = 'chatCache';
const TTL_MS = 6 * 60 * 60 * 1000;
const memory = new Map();

function db() {
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length) return admin.firestore();
    const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, key = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !key) return null;
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') }) });
    return admin.firestore();
  } catch (e) { console.warn('[cache] firestore unavailable:', e && e.message); return null; }
}
const within = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);

// "What are his SKILLS??" and "what are his skills" share one answer
function normalise(q) {
  return String(q || '').toLowerCase().normalize('NFKC')
    .replace(/[\u{1F000}-\u{1FFFF}☀-➿]/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function keyFor(q, variant) {
  return crypto.createHash('sha1').update(normalise(q) + '|' + (variant || '')).digest('hex').slice(0, 32);
}

async function get(q, variant) {
  const id = keyFor(q, variant), now = Date.now();
  const m = memory.get(id);
  if (m && now - m.ts < TTL_MS) return m.reply;
  const store = db();
  if (!store) return null;
  const snap = await within(store.collection(COLLECTION).doc(id).get().catch(() => null), 1200);
  if (!snap || !snap.exists) return null;
  const d = snap.data();
  if (!d || !d.reply || now - (d.ts || 0) > TTL_MS) return null;
  memory.set(id, { reply: d.reply, ts: d.ts });
  return d.reply;
}

function put(q, variant, reply) {
  const id = keyFor(q, variant), ts = Date.now();
  memory.set(id, { reply, ts });
  if (memory.size > 300) memory.delete(memory.keys().next().value);
  const store = db();
  if (!store) return Promise.resolve();
  return within(store.collection(COLLECTION).doc(id).set({ q: normalise(q).slice(0, 200), reply, ts, hits: 0 }).catch(e => console.warn('[cache] save failed:', e && e.message)), 1500);
}

module.exports = { get, put, normalise, keyFor, TTL_MS };
