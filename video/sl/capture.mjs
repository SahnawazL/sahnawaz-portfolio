// Saves every outside file the live app loads (fonts, maths renderer, sign-in
// library) so a local copy of the app can run without the internet. Optional
// second part: replays saved question payloads against the live answer API.
import { chromium } from 'playwright';
import fs from 'fs';
const SITE = 'https://studylens-ai-gamma.vercel.app';
fs.mkdirSync('video/sl/out', { recursive: true });
const out = {};
const b = await chromium.launch();
const ctx = await b.newContext({ ...(await import('playwright')).devices['Pixel 7'] });
const p = await ctx.newPage();
p.on('response', async r => {
  const u = r.url();
  if (u.startsWith(SITE) || !/^https:/.test(u)) return;
  try { const body = await r.body(); out[u] = { status: r.status(), type: r.headers()['content-type'] || '', b64: body.toString('base64') }; } catch {}
});
await p.goto(SITE, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(6000);
for (let y = 0; y < 12; y++) { await p.mouse.wheel(0, 600); await p.waitForTimeout(300); }
await p.waitForTimeout(3000);
fs.writeFileSync('video/sl/out/ext.json', JSON.stringify(out));
console.log('saved', Object.keys(out).length, Object.keys(out).map(u => u.slice(0, 90)).join('\n'));
// replay questions, if any were prepared
if (fs.existsSync('video/sl/asks.json')) {
  const asks = JSON.parse(fs.readFileSync('video/sl/asks.json', 'utf8')), res = [];
  for (const a of asks) {
    const r = await p.evaluate(async a => { const r = await fetch(a.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: a.body }); return { status: r.status, type: r.headers.get('content-type'), text: await r.text() }; }, a);
    console.log(a.url, r.status, r.text.slice(0, 200)); res.push({ ...a, ...r });
    await p.waitForTimeout(9000);
  }
  fs.writeFileSync('video/sl/out/answers.json', JSON.stringify(res));
}
await b.close();
