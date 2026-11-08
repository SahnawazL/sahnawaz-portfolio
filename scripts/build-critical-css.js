/* Builds css/portfolio-ui-critical.css: the part of portfolio-ui.css that the
   first screens need (header, hero, about), so phones can draw the page
   before the whole 400 KB stylesheet has arrived.

   How it stays safe:
   - The full portfolio-ui.css still loads right after, in the same place,
     so once it arrives the page is styled exactly as before. The critical
     file only lets the first view appear sooner.
   - A rule goes in if it matches anything in the top part of the page
     (about two screens on a phone and on a desktop), including hidden
     things there, fixed bars, html and body. Hover and focus states are
     included too.
   - If portfolio-ui.css is edited later and this isn't re-run, nothing
     breaks: the edit still arrives with the full file.

   Run on a computer with Playwright, from the repository folder:
     python3 -m http.server 8124 &   (any static server on port 8124)
     node scripts/build-critical-css.js */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const URL = process.env.SITE || 'http://127.0.0.1:8124/index.html';

const DYNAMIC = /::?(before|after|first-line|first-letter|placeholder|selection|marker|backdrop|-webkit-[a-z-]+|-moz-[a-z-]+)|:(hover|focus-visible|focus-within|focus|active|visited|checked|disabled|enabled|target|placeholder-shown|invalid|valid|empty|autofill|-webkit-autofill)\b/g;

async function keptRules(browser, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  await page.goto(URL);
  await page.waitForTimeout(2500);
  const kept = await page.evaluate(({ dyn }) => {
    const DYN = new RegExp(dyn, 'g');
    const limit = innerHeight * 2;
    const inFold = new Set();
    const boxTop = el => { const r = el.getBoundingClientRect(); return (r.width || r.height) ? r.top : null; };
    for (const el of document.querySelectorAll('*')) {
      let top = boxTop(el), a = el;
      /* hidden things count where their nearest drawn parent is */
      while (top === null && a.parentElement && a.parentElement !== document.body && a.parentElement !== document.documentElement) { a = a.parentElement; top = boxTop(a); }
      const pos = getComputedStyle(el).position;
      if ((top !== null && top < limit) || ((pos === 'fixed' || pos === 'sticky') && top !== null)) {
        for (let x = el; x; x = x.parentElement) inFold.add(x);
      }
    }
    const sheet = [...document.styleSheets].find(s => s.href && /portfolio-ui\.css/.test(s.href));
    const keep = [];
    const matches = sel => {
      const simple = sel.replace(DYN, '').replace(/:not\(\s*\)/g, '').trim() || '*';
      try { for (const el of document.querySelectorAll(simple)) if (inFold.has(el)) return true; return false; }
      catch (e) { return true; }  /* can't test it: keep it */
    };
    const walk = (rules, at) => [...rules].forEach((r, i) => {
      const id = at + '.' + i;
      if (r.type === 1) { if (r.selectorText.split(/,(?![^(]*\))/).some(matches)) keep.push(id); }
      else if (r.cssRules) walk(r.cssRules, id);
    });
    walk(sheet.cssRules, 'r');
    return keep;
  }, { dyn: DYNAMIC.source });
  await ctx.close();
  return kept;
}

(async () => {
  const browser = await chromium.launch();
  const keep = new Set([
    ...await keptRules(browser, { width: 390, height: 844 }, true),
    ...await keptRules(browser, { width: 412, height: 915 }, true),
    ...await keptRules(browser, { width: 820, height: 1180 }, true),
    ...await keptRules(browser, { width: 1366, height: 860 }, false),
    ...await keptRules(browser, { width: 1920, height: 1080 }, false),
  ]);
  const page = await browser.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  await page.goto(URL);
  const out = await page.evaluate(keepList => {
    const keep = new Set(keepList);
    const sheet = [...document.styleSheets].find(s => s.href && /portfolio-ui\.css/.test(s.href));
    const text = (rules, at) => [...rules].map((r, i) => {
      const id = at + '.' + i;
      if (r.type === 1) return keep.has(id) ? r.cssText : '';
      if (r.type === 5 || r.type === 7 || r.type === 1001) return r.cssText;   /* @font-face, @keyframes, @property */
      if (r.type === 3) return '';                                               /* @import */
      if (r.cssRules) {
        const inner = text(r.cssRules, id);
        if (!inner) return '';
        const head = r.type === 4 ? '@media ' + r.media.mediaText : r.type === 12 ? '@supports ' + r.conditionText : r.cssText.slice(0, r.cssText.indexOf('{')).trim();
        return head + ' {\n' + inner + '\n}';
      }
      return r.cssText;
    }).filter(Boolean).join('\n');
    return { css: text(sheet.cssRules, 'r') };
  }, [...keep]);
  await browser.close();
  /* keep only the @keyframes the kept rules use */
  let css = out.css;
  const blocks = [];
  css = css.replace(/@(-webkit-)?keyframes\s+([\w-]+)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (m, w, name) => { blocks.push([name, m]); return '\u0000KF' + (blocks.length - 1) + '\u0000'; });
  css = css.replace(/\u0000KF(\d+)\u0000/g, (m, i) => {
    const name = blocks[+i][0];
    return new RegExp('animation(-name)?\\s*:[^;}]*\\b' + name.replace(/[-]/g, '\\-') + '\\b').test(css) ? blocks[+i][1] : '';
  });
  out.css = css.replace(/\n{2,}/g, '\n');
  const header = '/* GENERATED by scripts/build-critical-css.js from portfolio-ui.css. Do not edit by hand:\n   change portfolio-ui.css (which still loads in full right after this) and re-run the script. */\n';
  fs.writeFileSync(path.join(__dirname, '..', 'css', 'portfolio-ui-critical.css'), header + out.css + '\n');
  console.log('critical rules:', keep.size, 'bytes:', out.css.length);
})();
