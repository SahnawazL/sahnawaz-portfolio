// api/resume.js — Sends Sahnawaz's resume to visitor + notifies Sahnawaz
// Uses same Resend setup as api/contact.js

const { Resend } = require('resend');

const RESUME_LINK = 'https://drive.google.com/file/d/11fwGR4cjRs-to_tNpAIT1DJc2CeVq2Kg/view?usp=drivesdk';
const OWNER_EMAIL = 'balveerdj@gmail.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email } = req.body || {};

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email address' });

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 1️⃣ Send resume to visitor
    await resend.emails.send({
      from: 'Sahnawaz Ahmed Laskar <onboarding@resend.dev>',
      to: email,
      reply_to: OWNER_EMAIL,
      subject: '📄 Here\'s my Resume — Sahnawaz Ahmed Laskar',
      html:
        '<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0b1a2b;padding:2rem;border-radius:12px;color:#e2f6ff;">' +
        '<h2 style="color:#00ffff;margin-bottom:0.5rem;">Hey ' + name + '! 👋</h2>' +
        '<p style="color:#b0d8f0;margin-bottom:1.5rem;">Thanks for your interest! Here\'s my resume as requested.</p>' +
        '<div style="text-align:center;margin:2rem 0;">' +
        '<a href="' + RESUME_LINK + '" target="_blank" style="background:linear-gradient(135deg,#00e5ff,#0050cc);color:#fff;padding:12px 32px;border-radius:999px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">📄 View / Download Resume</a>' +
        '</div>' +
        '<hr style="border:none;border-top:1px solid rgba(0,255,255,0.2);margin:1.5rem 0;">' +
        '<p style="font-size:0.85rem;color:#7ec8e3;">Let\'s connect:</p>' +
        '<p style="font-size:0.85rem;color:#b0d8f0;">📧 shzthedigitalalchemist@gmail.com</p>' +
        '<p style="font-size:0.85rem;color:#b0d8f0;">📸 Instagram: @sahnawaz.ui.dev</p>' +
        '<hr style="border:none;border-top:1px solid rgba(0,255,255,0.2);margin:1.5rem 0;">' +
        '<p style="font-size:0.75rem;color:#4a7a8a;">Sent via AI chatbot on sahnawaz-portfolio.vercel.app</p>' +
        '</div>',
    });

    // 2️⃣ Notify Sahnawaz about the lead
    await resend.emails.send({
      from: 'Portfolio Bot <onboarding@resend.dev>',
      to: OWNER_EMAIL,
      subject: '🎯 Resume requested by ' + name,
      html:
        '<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0b1a2b;padding:2rem;border-radius:12px;color:#e2f6ff;">' +
        '<h2 style="color:#00ffff;margin-bottom:1rem;">📄 Resume Request — New Lead!</h2>' +
        '<p><strong style="color:#7ec8e3;">Name:</strong> ' + name + '</p>' +
        '<p><strong style="color:#7ec8e3;">Email:</strong> ' + email + '</p>' +
        '<p style="margin-top:1rem;color:#b0d8f0;">They requested your resume via the AI chatbot. Follow up soon! 🚀</p>' +
        '<hr style="border:none;border-top:1px solid rgba(0,255,255,0.2);margin:1.5rem 0;">' +
        '<p style="font-size:0.75rem;color:#4a7a8a;">Via sahnawaz-portfolio.vercel.app chatbot</p>' +
        '</div>',
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
