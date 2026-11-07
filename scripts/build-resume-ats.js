/* Rebuilds resume-ats.pdf from scripts/resume-ats.html (text-based, one page).
   Run on a computer with Playwright: node scripts/build-resume-ats.js */
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'resume-ats.html'));
  await p.pdf({ path: path.join(__dirname, '..', 'resume-ats.pdf'), format: 'A4', preferCSSPageSize: true });
  await b.close();
})();
