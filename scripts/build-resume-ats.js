/* Rebuilds resume-ats.pdf from scripts/resume-ats.html (text-based, one page).
   Run on a computer with Playwright: node scripts/build-resume-ats.js
   Stops if the content no longer fits above the footer. */
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 794, height: 1123 } });
  await p.goto('file://' + path.join(__dirname, 'resume-ats.html'));
  await p.evaluate(() => document.fonts.ready);
  const gap = await p.evaluate(() => document.querySelector('footer').getBoundingClientRect().top - document.querySelector('main').getBoundingClientRect().bottom);
  if (gap < 4) { console.error('Content is ' + Math.round(4 - gap) + 'px too long for one page.'); process.exit(1); }
  await p.pdf({ path: path.join(__dirname, '..', 'resume-ats.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('Built resume-ats.pdf, ' + Math.round(gap) + 'px to spare.');
  await b.close();
})();
