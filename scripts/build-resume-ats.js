/* Rebuilds resume-ats.pdf from resume.html (text-based; one or two pages).
   Run on a computer with Playwright: node scripts/build-resume-ats.js */
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'resume.html'));
  await p.emulateMedia({ media: 'print' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(__dirname, '..', 'resume-ats.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('Built resume-ats.pdf');
  await b.close();
})();
