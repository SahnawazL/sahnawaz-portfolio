// api/share.js — CommonJS, no dependencies
//
// Gives every shared link its own preview card. WhatsApp, LinkedIn,
// Slack, X and Facebook read the tags below without running JavaScript,
// so a link like /share/yojanasahay arrives as a designed card instead
// of the same generic homepage preview.
//
// A real visitor is forwarded straight to the deep link, so the page
// they land on is exactly what the card promised.

const SITE = 'https://sahnawaz-portfolio.vercel.app';

const LINKS = {
  yojanasahay: {
    to: '/?case=yojanasahay',
    title: 'YojanaSahay — AI Government Scheme Finder',
    desc: 'A case study by Sahnawaz Ahmed Laskar: discover Central & State welfare schemes, bilingual, with an AI eligibility checker. Built with React, Vite and Firebase.',
  },
  studylens: {
    to: '/?case=studylens',
    title: 'StudyLens AI — AI Homework Helper',
    desc: 'A case study by Sahnawaz Ahmed Laskar: syllabus-aware answers for SEBA, AHSEC, CBSE and ICSE students. Built with Groq AI, Gemini and Firebase.',
  },
  portfolio: {
    to: '/?case=portfolio',
    title: 'This Portfolio — hand-coded, zero templates',
    desc: '22,000+ lines of HTML, CSS and JavaScript with live engineering telemetry, an AI assistant and a hidden terminal. A case study of the site itself.',
  },
  ui: {
    to: '/?projects=ui',
    title: 'UI / Design work by Sahnawaz Ahmed Laskar',
    desc: 'Product screens, design systems and front-ends shipped for real users — Figma, Adobe XD, Tailwind and hand-written CSS.',
  },
  fullstack: {
    to: '/?projects=fullstack',
    title: 'Full stack projects by Sahnawaz Ahmed Laskar',
    desc: 'Applications built end to end — interface, API, database and deployment. React, Node.js, Firebase and Vercel.',
  },
  performance: {
    to: '/?report=performance',
    title: 'Live performance report — measured on your device',
    desc: 'Core Web Vitals measured live during your visit, shown next to the 75th percentile of real visitors. Open it and see your own numbers.',
  },
  hacker: {
    to: '/?mode=hacker',
    title: 'Retro terminal mode — hidden inside the portfolio',
    desc: 'A working terminal with 60+ commands, a fake filesystem, CRT effects and a hidden access key. Type help to begin.',
  },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

module.exports = function handler(req, res) {
  /* the key can arrive from the rewrite (?key=) or from the path */
  let key = (req.query && (req.query.key || req.query.slug)) || '';
  if (!key) {
    const path = (req.url || '').split('?')[0].replace(/\/+$/, '');
    key = path.slice(path.lastIndexOf('/') + 1);
  }
  key = String(key).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);

  const link = LINKS[key];

  /* an unknown key is not an error for a visitor: send them to the site */
  if (!link) {
    res.statusCode = 302;
    res.setHeader('Location', SITE + '/');
    return res.end();
  }

  const url   = SITE + '/share/' + key;
  const image = SITE + '/og/' + key + '.jpg';
  const dest  = SITE + link.to;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  /* cached at the edge: crawlers hit these often and the content is static */
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=86400');

  res.status(200).send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(link.title)}</title>
<meta name="description" content="${esc(link.desc)}">
<link rel="canonical" href="${dest}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Sahnawaz Ahmed Laskar – Portfolio">
<meta property="og:title" content="${esc(link.title)}">
<meta property="og:description" content="${esc(link.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(link.title)}">
<meta property="og:locale" content="en_IN">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@sahnawazlaskar">
<meta name="twitter:creator" content="@sahnawazlaskar">
<meta name="twitter:title" content="${esc(link.title)}">
<meta name="twitter:description" content="${esc(link.desc)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${esc(link.title)}">

<!-- a visitor is forwarded immediately; a crawler simply reads the tags above -->
<meta http-equiv="refresh" content="0; url=${dest}">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#071320;color:#cfe8fa;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  a{color:#5ac8ff}
</style>
</head><body>
  <p>Opening <a href="${dest}">${esc(link.title)}</a>&nbsp;…</p>
  <script>location.replace(${JSON.stringify(dest)});</script>
</body></html>`);
};
