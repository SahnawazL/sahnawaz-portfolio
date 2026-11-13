// Screenshots of the live products for the ad's floating cards.
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = 'video/pf2/out/shots'; fs.mkdirSync(OUT, { recursive: true });
const SITES = { studylens: 'https://studylens-ai-gamma.vercel.app/', yojanasahay: 'https://yojanasahay.vercel.app/' };
const b = await chromium.launch();
for (const [id, url] of Object.entries(SITES)) {
  for (const [kind, vp, dpr, mobile] of [['desk', { width: 1440, height: 900 }, 1.5, false], ['phone', { width: 390, height: 844 }, 2.5, true]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, colorScheme: 'dark' });
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) { console.log(id, kind, 'load', e.message.slice(0, 80)); }
    await p.waitForTimeout(6000);
    await p.screenshot({ path: `${OUT}/${id}-${kind}.jpg`, type: 'jpeg', quality: 90 });
    console.log('shot', id, kind);
    await ctx.close();
  }
}
await b.close();
