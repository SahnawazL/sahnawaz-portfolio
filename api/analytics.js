// api/analytics.js — CommonJS version

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, device, referrer, section, event } = req.body;

  const country = req.headers['x-vercel-ip-country']        || 'unknown';
  const region  = req.headers['x-vercel-ip-country-region'] || 'unknown';
  const city    = req.headers['x-vercel-ip-city']           || 'unknown';

  console.log(JSON.stringify({
    event:    event   || 'pageview',
    page:     page    || '/',
    section:  section || null,
    device:   device  || 'unknown',
    referrer: referrer || 'direct',
    country,
    region,
    city,
    time: new Date().toISOString(),
  }));

  return res.status(200).json({ logged: true });
};
