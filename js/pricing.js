/* js/pricing.js — the ONE price list.
   Used by the contact section's "What do you need built?" estimate
   (js/portfolio-05.js), the AI project planner in the chat (js/portfolio-09.js)
   and the server (lib/project-brief.js, api/chat.js). Change a price or a
   delivery time here and every place that quotes it follows.

   ico     the SVG icon used for it (#cti-<ico> in index.html)
   lo/hi   typical range in rupees (hi = lo for a fixed price)
   unit    shown after the price ("per screen", "per campaign")
   weeks   typical delivery [fastest, slowest] in weeks
   gets    what's included — the same lines as the pricing cards on the page
   budgets the budget choices offered for this kind of project: [label, lo, hi]
   starter what fits when the budget is below the usual starting price */
(function (root) {
  var WEB_BUDGETS = [['Under ₹10K', 0, 9999], ['₹10K – ₹15K', 10000, 15000], ['₹15K – ₹25K', 15000, 25000], ['₹25K+', 25000, 1e9]];
  var P = {
    'Business website': {
      ico: 'building', say: 'business website', lo: 9999, hi: 14999, time: '2–3 weeks', weeks: [2, 3],
      gets: ['Fully custom animated design', 'Mobile-first, works on every phone', 'SEO + speed optimised', 'Up to 5 pages', 'Domain & hosting setup: ₹1,500'],
      budgets: WEB_BUDGETS,
      starter: 'a 1–2 page starter site now, with more pages added later'
    },
    'Landing page': {
      ico: 'target', say: 'landing page', lo: 9999, hi: 14999, time: '2–3 weeks', weeks: [2, 3],
      gets: ['Custom landing page design', 'Mobile-first, works on every phone', 'SEO + speed optimised', 'Domain & hosting setup: ₹1,500'],
      budgets: WEB_BUDGETS,
      starter: 'a simpler single page first, with the extras added later'
    },
    'Portfolio website': {
      ico: 'palette', say: 'portfolio website', lo: 6999, hi: 9999, time: '1–2 weeks', weeks: [1, 2],
      gets: ['Premium animations & effects', 'Projects & skills showcase', 'Contact form integration', 'GitHub & Vercel deployment', 'Domain & hosting setup: ₹1,500'],
      budgets: [['Under ₹7K', 0, 6999], ['₹7K – ₹10K', 7000, 10000], ['₹10K – ₹15K', 10000, 15000], ['₹15K+', 15000, 1e9]],
      starter: 'a one-page portfolio first, with more sections added later'
    },
    'E-commerce store': {
      ico: 'cart', say: 'online store', lo: 14999, hi: 24999, time: '3–5 weeks', weeks: [3, 5],
      gets: ['Payment gateway integration', 'Product catalogue & filters', 'Admin dashboard panel', 'Checkout optimised for phones', 'Domain & hosting setup: ₹1,500'],
      budgets: [['Under ₹15K', 0, 14999], ['₹15K – ₹25K', 15000, 25000], ['₹25K – ₹50K', 25000, 50000], ['₹50K+', 50000, 1e9]],
      starter: 'a smaller first version (fewer products and pages), with the rest added later'
    },
    'UI/UX design': {
      ico: 'pen', say: 'UI/UX design', lo: 3999, hi: 3999, unit: 'per screen', time: '1–2 weeks', weeks: [1, 2],
      gets: ['Figma / Adobe XD screens', 'Designed for phone and desktop', 'Ready to hand to any developer'],
      budgets: [['1–3 screens', 3999, 11997], ['4–8 screens', 15996, 31992], ['9+ screens', 35991, 1e9]],
      starter: 'the most important screens first'
    },
    'AI chatbot / integration': {
      ico: 'bot', say: 'AI chatbot', lo: 2999, hi: 7999, time: '1–3 weeks', weeks: [1, 3],
      gets: ['An AI assistant built for your business', 'Answers visitors 24/7 inside your website', 'Like the assistant on this site — try it', 'Set up and tuned by Sahnawaz'],
      budgets: [['Under ₹3K', 0, 2999], ['₹3K – ₹8K', 3000, 8000], ['₹8K+', 8000, 1e9]],
      starter: 'one simple AI workflow first'
    },
    'Web ads & promotion': {
      ico: 'megaphone', say: 'ad campaign', lo: 3999, hi: 3999, unit: 'per campaign', time: 'Monthly report included', weeks: [1, 2],
      gets: ['Custom landing page design', 'Google / Meta ads setup', 'Conversion tracking', 'Monthly performance report'],
      budgets: [['1 campaign', 3999, 3999], ['2–3 campaigns a month', 7998, 11997], ['More than that', 12000, 1e9]],
      starter: 'one campaign first, to see what works'
    },
    'Web app / custom build': {
      ico: 'code', say: 'web app', lo: 0, hi: 0, custom: true, time: 'Depends on scope', weeks: [4, 12],
      gets: ['Planned around exactly what you need', 'Built from scratch — no templates', 'Lifetime support after delivery'],
      budgets: [['Under ₹15K', 0, 14999], ['₹15K – ₹30K', 15000, 30000], ['₹30K – ₹60K', 30000, 60000], ['₹60K+', 60000, 1e9]],
      starter: 'a small first version with the core feature'
    },
    'Website redesign': {
      ico: 'wrench', say: 'website redesign', lo: 0, hi: 0, custom: true, time: 'Depends on scope', weeks: [2, 4],
      gets: ['A free check of your current site first', 'Faster on phones, better on Google', 'Fixes for what loses you customers'],
      budgets: WEB_BUDGETS,
      starter: 'the most important fixes first'
    }
  };
  /* extras worth suggesting when the budget has room (real starting prices) */
  var EXTRAS = [['SEO & Google Analytics', 3999], ['An AI assistant', 2999], ['An ad campaign', 3999], ['Custom domain setup', 1500]];

  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  /* "₹9,999 – ₹14,999", "₹3,999 per screen", "Custom quote" */
  function range(p) {
    if (!p) return '';
    if (p.custom) return 'Custom quote';
    return (p.lo === p.hi ? inr(p.lo) : inr(p.lo) + ' – ' + inr(p.hi)) + (p.unit ? ' ' + p.unit : '');
  }

  var api = { TYPES: P, EXTRAS: EXTRAS, inr: inr, range: range };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SHZ_PRICING = api;
})(typeof window !== 'undefined' ? window : null);
