// api/analytics.js — CommonJS version
// Logs pageviews to Vercel console AND Firebase Firestore (permanent storage)

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue }      = require('firebase-admin/firestore');

/* ── Init Firebase Admin once (survives warm restarts) ── */
function getDB() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:    process.env.FIREBASE_PROJECT_ID,
        clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, device, referrer, section, event } = req.body;

  const country = req.headers['x-vercel-ip-country']        || 'unknown';
  const region  = req.headers['x-vercel-ip-country-region'] || 'unknown';
  const city    = req.headers['x-vercel-ip-city']           || 'unknown';

  const record = {
    event:    event    || 'pageview',
    page:     page     || '/',
    section:  section  || null,
    device:   device   || 'unknown',
    referrer: referrer || 'direct',
    country,
    region,
    city,
    time: new Date().toISOString(),
    ts:   FieldValue.serverTimestamp(),   // for Firestore ordering
  };

  /* Always log to console (Vercel logs) */
  console.log(JSON.stringify(record));

  /* Persist to Firestore — fire-and-forget so it never slows the response */
  try {
    const db = getDB();
    await db.collection('analytics').add(record);
  } catch (err) {
    /* Non-fatal — visitor still gets a fast response */
    console.error('Firestore analytics write failed:', err.message);
  }

  return res.status(200).json({ logged: true });
};
