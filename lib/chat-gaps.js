// Questions the chat could not answer, and the answers Sahnawaz adds for them.
// When the AI has no fact for a question about him, the question is saved in
// Firestore (chatGaps). The admin page lists them with a box to write the
// answer; written answers are given to the chat from then on.
const answerCache = require('./chat-cache');

const COLLECTION = 'chatGaps';
let factsCache = null;                 // { at, text }
const within = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);

function db() {
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length) return admin.firestore();
    const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, key = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !key) return null;
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') }) });
    return admin.firestore();
  } catch (e) { return null; }
}

// Phrases the chat uses when it doesn't have a detail, in case it forgets the tag
const NO_FACT = /\b(i don'?t have (that|this|any|the|specific|exact|details?|information|info)|i'?m not sure (about|of|what|whether|if)|(that|this) (detail|information|info) (isn'?t|is not) (something|available|shared|in)|hasn'?t shared (that|this)|not something i (know|have))\b/i;

// Takes the reply, returns { reply, gap }: the [[gap]] tag is removed
function readGap(reply) {
  const tagged = /\[\[\s*gap\s*\]\]/i.test(reply);
  const clean = String(reply || '').replace(/\s*\*{0,2}\[\[\s*gap\s*\]\]\*{0,2}\s*/gi, '\n').trim();
  return { reply: clean, gap: tagged || NO_FACT.test(clean) };
}

async function log(question) {
  const store = db();
  if (!store) return;
  const admin = require('firebase-admin');
  const id = answerCache.keyFor(question, 'gap');
  const now = new Date();
  await within(store.collection(COLLECTION).doc(id).set({
    q: String(question).slice(0, 300), lastAt: now, count: admin.firestore.FieldValue.increment(1)
  }, { merge: true }).then(() => store.collection(COLLECTION).doc(id).get())
    .then(d => { const x = d && d.data(); if (x && !x.firstAt) return d.ref.set({ firstAt: now, status: 'open' }, { merge: true }); })
    .catch(e => console.warn('[gaps] save failed:', e && e.message)), 1500);
}

// The answers he wrote, as a block for the chat's knowledge (cached 5 min)
async function facts() {
  if (factsCache && Date.now() - factsCache.at < 5 * 60e3) return factsCache.text;
  const store = db();
  if (!store) return '';
  const snap = await within(store.collection(COLLECTION).where('status', '==', 'answered').limit(80).get().catch(() => null), 1500);
  if (!snap) return factsCache ? factsCache.text : '';
  const lines = [];
  snap.forEach(d => { const x = d.data() || {}; if (x.answer) lines.push('Q: ' + String(x.q).slice(0, 200) + '\nA: ' + String(x.answer).slice(0, 600)); });
  const text = lines.length ? 'ANSWERS SAHNAWAZ ADDED HIMSELF (true; use them when the question matches):\n' + lines.join('\n\n') : '';
  factsCache = { at: Date.now(), text };
  return text;
}

const RULE = `MISSING FACTS: If the visitor asks for a specific fact about Sahnawaz (his life, work, prices, plans, preferences, availability or anything personal) and it is not in the information above, never guess. Say plainly that you don't have that detail and offer to pass the question on or the contact options. Then put [[gap]] alone on the last line. Never add [[gap]] to a greeting, a general question or a question you did answer.`;

module.exports = { readGap, log, facts, RULE, COLLECTION };
