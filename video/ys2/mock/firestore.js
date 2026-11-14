// Demo data layer for the promo film: same API surface as firebase/firestore,
// answered from a local fixtures file. Used only for the film's demo build.
const FIX = typeof window !== "undefined" ? fetch("/__demo/fixtures.json").then(r => r.json()).catch(() => ({})) : Promise.resolve({});
const log = (...a) => { try { console.log("[demo]", ...a); } catch {} };
export class Timestamp {
  constructor(seconds, nanoseconds = 0) { this.seconds = seconds; this.nanoseconds = nanoseconds; }
  static now() { return Timestamp.fromMillis(Date.now()); }
  static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6); }
  toDate() { return new Date(this.toMillis()); }
  toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
  valueOf() { return this.toMillis(); }
  isEqual(o) { return o && o.toMillis && o.toMillis() === this.toMillis(); }
}
const AGO = { m: 60e3, h: 3600e3, d: 864e5 };
function revive(v) {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === "object") {
    if ("__ts" in v) return Timestamp.fromMillis(new Date(v.__ts).getTime());
    if ("__ago" in v) { const m = /^(\d+(?:\.\d+)?)([mhd])$/.exec(v.__ago); return Timestamp.fromMillis(Date.now() - (m ? +m[1] * AGO[m[2]] : 0)); }
    if ("__agoMs" in v) { const m = /^(\d+(?:\.\d+)?)([mhd])$/.exec(v.__agoMs); return Date.now() - (m ? +m[1] * AGO[m[2]] : 0); }
    if ("__agoIso" in v) { const m = /^(\d+(?:\.\d+)?)([mhd])$/.exec(v.__agoIso); return new Date(Date.now() - (m ? +m[1] * AGO[m[2]] : 0)).toISOString(); }
    const o = {}; for (const k in v) o[k] = revive(v[k]); return o;
  }
  return v;
}
let STORE = null;
async function store() { if (!STORE) { const f = await FIX; STORE = {}; for (const p in (f.docs || {})) STORE[p] = revive(f.docs[p]); for (const c in (f.collections || {})) for (const d of f.collections[c]) { const { id, ...rest } = d; STORE[c + "/" + id] = revive(rest); } } return STORE; }
const join = (...s) => s.filter(x => x != null && x !== "").join("/");
export function getFirestore() { return { type: "db" }; }
export function initializeFirestore() { return { type: "db" }; }
export const persistentLocalCache = () => ({}), persistentMultipleTabManager = () => ({}), memoryLocalCache = () => ({}), persistentSingleTabManager = () => ({});
export function enableIndexedDbPersistence() { return Promise.resolve(); }
export function connectFirestoreEmulator() {}
export function collection(base, ...segs) { const p = base && base.path ? join(base.path, ...segs) : join(...segs); return { type: "collection", path: p, id: p.split("/").pop() }; }
export function collectionGroup(db, id) { return { type: "group", path: id, id }; }
export function doc(base, ...segs) {
  let p = base && base.path ? join(base.path, ...segs) : join(...segs);
  if (p.split("/").length % 2 === 1) p = join(p, "auto" + Math.random().toString(36).slice(2, 10));
  return { type: "document", path: p, id: p.split("/").pop(), parent: { path: p.split("/").slice(0, -1).join("/") } };
}
export const where = (f, op, v) => ({ k: "where", f, op, v }), orderBy = (f, d = "asc") => ({ k: "orderBy", f, d }), limit = n => ({ k: "limit", n }), limitToLast = n => ({ k: "limitToLast", n }),
  startAfter = (...a) => ({ k: "noop" }), startAt = () => ({ k: "noop" }), endBefore = () => ({ k: "noop" }), endAt = () => ({ k: "noop" }), documentId = () => "__id__";
export function query(ref, ...cs) { return { type: "query", path: ref.path, cs: [...(ref.cs || []), ...cs], id: ref.id }; }
const get = (o, f) => f === "__id__" ? o.__id : f.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const cmpv = v => (v && v.toMillis ? v.toMillis() : v);
function snapDoc(path, data) { const id = path.split("/").pop(); return { id, ref: { type: "document", path, id }, exists: () => data !== undefined, data: () => (data === undefined ? undefined : { ...data }), get: f => (data ? get(data, f) : undefined), metadata: { fromCache: false, hasPendingWrites: false } }; }
async function runQuery(q) {
  const S = await store(); const pre = q.path + "/"; let rows = [];
  for (const p in S) { const rest = p.startsWith(pre) ? p.slice(pre.length) : null; if (rest && !rest.includes("/")) rows.push({ p, d: S[p] }); else if (q.type === "group" && p.split("/").slice(-2, -1)[0] === q.path) rows.push({ p, d: S[p] }); }
  for (const c of q.cs || []) {
    if (c.k === "where") rows = rows.filter(({ p, d }) => { const o = { ...d, __id: p.split("/").pop() }; const a = cmpv(get(o, c.f)), b = cmpv(c.v);
      switch (c.op) { case "==": return a === b; case "!=": return a !== b; case ">": return a > b; case ">=": return a >= b; case "<": return a < b; case "<=": return a <= b;
        case "in": return (c.v || []).map(cmpv).includes(a); case "not-in": return !(c.v || []).map(cmpv).includes(a); case "array-contains": return Array.isArray(a) && a.includes(b);
        case "array-contains-any": return Array.isArray(a) && a.some(x => (c.v || []).includes(x)); default: return true; } });
    if (c.k === "orderBy") rows.sort((x, y) => { const a = cmpv(get(x.d, c.f)), b = cmpv(get(y.d, c.f)); const r = a == null ? 1 : b == null ? -1 : a > b ? 1 : a < b ? -1 : 0; return c.d === "desc" ? -r : r; });
    if (c.k === "limit") rows = rows.slice(0, c.n);
    if (c.k === "limitToLast") rows = rows.slice(-c.n);
  }
  const docs = rows.map(r => snapDoc(r.p, r.d));
  log("query", q.path, docs.length);
  return { docs, size: docs.length, empty: !docs.length, forEach: fn => docs.forEach(fn), docChanges: () => docs.map((d, i) => ({ type: "added", doc: d, newIndex: i, oldIndex: -1 })), metadata: { fromCache: false, hasPendingWrites: false } };
}
async function readDoc(ref) { const S = await store(); log("doc", ref.path, S[ref.path] ? "hit" : "miss"); return snapDoc(ref.path, S[ref.path]); }
export const getDoc = readDoc, getDocFromServer = readDoc, getDocFromCache = readDoc;
export const getDocs = q => runQuery(q.type === "collection" ? { ...q, cs: [] } : q), getDocsFromServer = getDocs, getDocsFromCache = getDocs;
export function onSnapshot(ref, a, b, c) {
  const cb = typeof a === "function" ? a : (a && a.next) || b; let live = true;
  (ref.type === "document" ? readDoc(ref) : getDocs(ref)).then(s => { if (live && typeof cb === "function") cb(s); });
  return () => { live = false; };
}
export async function getCountFromServer(q) { const s = await getDocs(q); return { data: () => ({ count: s.size }) }; }
export async function getAggregateFromServer(q) { const s = await getDocs(q); return { data: () => ({ count: s.size }) }; }
const SENT = (t, v) => ({ __sentinel: t, v });
export const serverTimestamp = () => Timestamp.now(), increment = n => SENT("inc", n), arrayUnion = (...v) => SENT("union", v), arrayRemove = (...v) => SENT("remove", v), deleteField = () => SENT("del");
function apply(old = {}, upd) { const o = { ...old }; for (const k in upd) { const v = upd[k]; if (v && v.__sentinel === "inc") o[k] = (o[k] || 0) + v.v; else if (v && v.__sentinel === "union") o[k] = [...new Set([...(o[k] || []), ...v.v])]; else if (v && v.__sentinel === "remove") o[k] = (o[k] || []).filter(x => !v.v.includes(x)); else if (v && v.__sentinel === "del") delete o[k]; else o[k] = v; } return o; }
export async function setDoc(ref, data, opt) { const S = await store(); S[ref.path] = apply(opt && opt.merge ? S[ref.path] : {}, data); log("set", ref.path); }
export async function updateDoc(ref, data) { const S = await store(); S[ref.path] = apply(S[ref.path], data); log("update", ref.path); }
export async function addDoc(col, data) { const r = doc(col); await setDoc(r, data); return r; }
export async function deleteDoc(ref) { const S = await store(); delete S[ref.path]; log("delete", ref.path); }
export function writeBatch() { const ops = []; const b = { set: (r, d, o) => (ops.push(() => setDoc(r, d, o)), b), update: (r, d) => (ops.push(() => updateDoc(r, d)), b), delete: r => (ops.push(() => deleteDoc(r)), b), commit: async () => { for (const f of ops) await f(); } }; return b; }
export async function runTransaction(db, fn) { return fn({ get: readDoc, set: setDoc, update: updateDoc, delete: deleteDoc }); }
export function enableNetwork() { return Promise.resolve(); } export function disableNetwork() { return Promise.resolve(); }
export class FieldValue {} export class FieldPath { constructor(...p) { this.p = p.join("."); } }
export function terminate() { return Promise.resolve(); } export function clearIndexedDbPersistence() { return Promise.resolve(); }
export function waitForPendingWrites() { return Promise.resolve(); }
