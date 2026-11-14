// Runs the real app with the demo person, asks the live assistant the film's
// questions in one conversation, and saves every reply so the film can replay them.
import fs from "fs"; import http from "http"; import path from "path";
import { chromium } from "playwright";
const DIST = process.argv[2], OUT = "video/ys2/out/ai2.json", PROD = "https://yojanasahay.vercel.app";
const STEPS = JSON.parse(fs.readFileSync("video/ys2/ai_script.json", "utf8"));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(DIST, decodeURIComponent(q.url.split("?")[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, "index.html");
  r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }).listen(8131);
const BASE = "http://127.0.0.1:8131";
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
const rec = []; let pending = 0;
await ctx.route("**/*", async r => {
  const u = new URL(r.request().url());
  if (u.host === "127.0.0.1:8131" && u.pathname.startsWith("/api/")) {
    pending++;
    try {
      const body = r.request().postData() || "";
      const resp = await r.fetch({ url: PROD + u.pathname + u.search, headers: { ...r.request().headers(), origin: PROD, referer: PROD + "/" } });
      const txt = await resp.text();
      let key = null; try { const j = JSON.parse(body); const users = (j.messages || []).filter(m => m.role === "user"); key = { last: (users.pop() || {}).content, n: (j.messages || []).length }; } catch {}
      rec.push({ path: u.pathname, key, status: resp.status(), type: resp.headers()["content-type"], body: txt });
      console.log(u.pathname, resp.status(), key && key.n, String(key && key.last).slice(0, 60), txt.length);
      await r.fulfill({ status: resp.status(), headers: { "content-type": resp.headers()["content-type"] || "application/json" }, body: txt });
    } catch (e) { console.log("fail", e.message); await r.abort(); } finally { pending--; }
    return;
  }
  if (u.host === "127.0.0.1:8131") return r.continue();
  return r.abort();
});
const p = await ctx.newPage();
await p.goto(BASE + "/");
await p.evaluate(async () => {
  const apiKey = "AIzaSyB4NoFNKDpH52eU2ZrqIeZHo1lacHu48vk", now = Date.now();
  const user = { uid: "demoUser000000000000000001", email: "riya.demo@example.com", emailVerified: true, isAnonymous: false, displayName: "Riya Das", photoURL: null,
    providerData: [{ providerId: "google.com", uid: "100000000000000000001", displayName: "Riya Das", email: "riya.demo@example.com", phoneNumber: null, photoURL: null }],
    stsTokenManager: { refreshToken: "demo", accessToken: "demo.access.token", expirationTime: now + 3600e3 * 6 }, createdAt: String(now - 2592e6), lastLoginAt: String(now), apiKey, appName: "[DEFAULT]" };
  await new Promise((ok, bad) => { const r = indexedDB.open("firebaseLocalStorageDb", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
    r.onsuccess = () => { const tx = r.result.transaction("firebaseLocalStorage", "readwrite"); tx.objectStore("firebaseLocalStorage").put({ fbase_key: "firebase:authUser:" + apiKey + ":[DEFAULT]", value: user }); tx.oncomplete = ok; tx.onerror = bad; }; r.onerror = bad; });
  localStorage.setItem("yojana_profile", JSON.stringify({ name: "Riya Das", phone: "", gender: "female", state: "Assam", occupation: "farmer", caste: "obc", income: "below1", house: "kutcha", age: "35to60", area: "rural", ration: "bpl", disability: "none", marital: "married", numChildren: "2", hasGirls: "yes", email: "riya.demo@example.com" }));
});
await p.reload(); await p.waitForTimeout(6000);
const tap = t => p.evaluate(t => { const e = [...document.querySelectorAll("*")].filter(e => e.children.length < 4 && !["HTML", "BODY"].includes(e.tagName) && (e.innerText || "").trim() === t).sort((a, b) => a.innerText.length - b.innerText.length)[0];
  if (!e) return false; let c = e; while (c && c.tagName !== "BUTTON" && getComputedStyle(c).cursor !== "pointer") c = c.parentElement; (c || e).click(); return true; }, t);
const typeNow = () => p.evaluate(() => { const e = [...document.querySelectorAll("span")].find(e => /^Type now/.test((e.innerText || "").trim())); if (e) e.click(); return !!e; });
const idle = async () => { let quiet = 0; for (let k = 0; k < 240 && quiet < 8; k++) { await p.waitForTimeout(500); quiet = pending ? 0 : quiet + 1; } };
console.log("ai tab", await tap("AI Help")); await p.waitForTimeout(2500);
for (const s of STEPS) {
  if (s.do === "quiz") { console.log("quiz", await tap("Find schemes for me")); await p.waitForTimeout(1500); for (const x of s.picks) { console.log(x, await tap(x)); await p.waitForTimeout(900); } console.log("next", await tap("Next ›")); await idle(); continue; }
  await typeNow(); await p.waitForTimeout(600);
  const ok = await p.evaluate(t => { const i = document.querySelector("textarea"); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(i, t); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, s.text);
  await p.waitForTimeout(400);
  await p.evaluate(() => { const i = document.querySelector("textarea"); i && i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true })); });
  console.log("asked", s.id, ok); await p.waitForTimeout(1500); await idle(); await p.waitForTimeout(2500);
}
fs.mkdirSync("video/ys2/out", { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(rec, null, 1));
await p.screenshot({ path: "video/ys2/out/ai2-last.png" });
console.log("saved", rec.length); await b.close(); srv.close();
