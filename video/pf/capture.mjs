// Saves what the live site's own APIs return while the page is scrolled top to
// bottom, plus one real assistant answer, so the reel can replay true data.
import { chromium } from 'playwright';
import fs from 'fs';
const SITE = 'https://sahnawaz-portfolio.vercel.app';
const out = {};
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
p.on('response', async r => {
  const u = new URL(r.url());
  if (!/\/api\//.test(u.pathname) || r.request().method() === 'OPTIONS') return;
  try { const body = await r.text(); const key = u.host + u.pathname; if (!out[key] || r.status() === 200) out[key] = { status: r.status(), type: r.headers()['content-type'] || 'application/json', body, method: r.request().method() }; } catch {}
});
await p.goto(SITE, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
for (let y = 0; y < 60; y++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(500); }
await p.waitForTimeout(4000);
const q = 'Can Sahnawaz build a fast website for my small business?';
const chat = await p.evaluate(async q => { const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, history: [], clientHour: 11 }) }); return { status: r.status, body: await r.text() }; }, q);
fs.mkdirSync('video/pf/out', { recursive: true });
fs.writeFileSync('video/pf/out/api.json', JSON.stringify(out, null, 1));
fs.writeFileSync('video/pf/out/chat.json', JSON.stringify({ q, ...chat }, null, 1));
console.log(Object.keys(out), chat.status, chat.body.slice(0, 300));
await b.close();
