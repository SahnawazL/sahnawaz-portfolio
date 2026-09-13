// api/github-webhook.js
//
// Receives GitHub's `push` webhook and records a "ship event" to Firestore
// in real time, so the portfolio's "just shipped" toast can react to a
// commit landing while a visitor is actually on the page — instead of the
// several-minute polling window /api/github-activity works on.
//
// GitHub setup — per repo (or org-wide), Settings → Webhooks → Add webhook:
//   Payload URL:  https://<your-domain>/api/github-webhook
//   Content type: application/json
//   Secret:       matches GITHUB_WEBHOOK_SECRET below
//   Events:       just "push" — nothing else needs to reach this endpoint
//
// Env vars (Vercel → Settings → Environment Variables):
//   GITHUB_WEBHOOK_SECRET  - the secret set on the GitHub webhook itself.
//                            Used to verify the X-Hub-Signature-256 header
//                            so nobody can spoof a fake ship event by
//                            POSTing here directly.
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
//                          - same Admin SDK trio github-activity.js uses.
//                            If missing, this still returns 200 to GitHub
//                            (so the webhook doesn't get auto-disabled for
//                            repeated failures) but silently records
//                            nothing.
//
// IMPORTANT: signature verification needs the exact raw bytes GitHub
// signed. Vercel's default body parser would JSON-parse the request
// before this function ever sees it, which changes those bytes (key
// order, whitespace) and breaks verification. bodyParser is disabled
// below; the body is read and verified as a raw buffer, THEN parsed.

const crypto = require('crypto');
const admin = require('firebase-admin');

const SHIP_EVENTS_COLLECTION = 'shipEvents';
const SHIP_EVENTS_RETENTION_DAYS = 90; // keep ~3 months of raw push history

module.exports.config = { api: { bodyParser: false } };

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
    console.warn('[github-webhook] Firebase Admin init failed:', err && err.message);
    return null;
  }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Constant-time comparison of GitHub's signature against one computed
// locally from the raw body + shared secret. An unconfigured secret or a
// missing header is treated as untrusted (rejected), never as a pass-through.
function isValidSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Best-effort, fire-and-forget — never blocks or fails the webhook response.
async function pruneOldEvents(db) {
  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - SHIP_EVENTS_RETENTION_DAYS);
    const stale = await db.collection(SHIP_EVENTS_COLLECTION)
      .where('pushedAt', '<', cutoff.toISOString())
      .limit(20)
      .get();
    if (stale.empty) return;
    const batch = db.batch();
    stale.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  } catch (err) {
    console.warn('[github-webhook] prune failed:', err && err.message);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!isValidSignature(rawBody, signature, secret)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const eventType = req.headers['x-github-event'];

  // GitHub sends a "ping" the moment a webhook is first created — just
  // confirm receipt, there's nothing to record yet.
  if (eventType === 'ping') {
    res.status(200).json({ ok: true, ping: true });
    return;
  }
  if (eventType !== 'push') {
    res.status(200).json({ ok: true, ignored: eventType });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  // Branch deletes, tag pushes, and other zero-commit pushes aren't a
  // "ship" — skip quietly rather than recording a hollow event.
  const commits = Array.isArray(payload.commits) ? payload.commits : [];
  if (!commits.length) {
    res.status(200).json({ ok: true, skipped: 'no commits' });
    return;
  }

  // Only the default branch counts as "shipped" — pushes to feature
  // branches are normal dev noise, not something a visitor should see
  // announced as a toast.
  const defaultBranch = payload.repository && payload.repository.default_branch;
  const pushedBranch = payload.ref ? payload.ref.replace('refs/heads/', '') : null;
  if (defaultBranch && pushedBranch !== defaultBranch) {
    res.status(200).json({ ok: true, skipped: 'non-default branch' });
    return;
  }

  const repoName = payload.repository && payload.repository.name;
  const headCommit = payload.head_commit || commits[commits.length - 1];
  const headMessage = headCommit && headCommit.message
    ? headCommit.message.split('\n')[0].slice(0, 120)
    : null;
  const pusher = payload.pusher && payload.pusher.name;
  const pushedAt = (headCommit && headCommit.timestamp) || new Date().toISOString();

  const db = getDb();
  if (!db) {
    // Not GitHub's problem — still 200 so the webhook isn't auto-disabled
    // for repeated failures. Nothing gets recorded until Firebase Admin
    // env vars are set.
    res.status(200).json({ ok: true, skipped: 'no db' });
    return;
  }

  try {
    await db.collection(SHIP_EVENTS_COLLECTION).add({
      repo: repoName || 'unknown',
      commitCount: commits.length,
      headMessage,
      pusher: pusher || null,
      pushedAt,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    pruneOldEvents(db);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.warn('[github-webhook] write failed:', err && err.message);
    // GitHub retries on non-2xx — a transient Firestore hiccup is worth
    // retrying, unlike the earlier skip cases above.
    res.status(500).json({ error: 'Failed to record event' });
  }
};
