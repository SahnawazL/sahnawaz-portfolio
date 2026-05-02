// api/contact.js
// Handles contact form → sends real email via Resend
// Free plan: 3,000 emails/month — enough for a portfolio

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS headers — required so your HTML page can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Browser sends OPTIONS first (preflight check) — just say OK
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Basic email format check
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',   // Resend free sender
      to: 'shzthedigitalalchemist@gmail.com',              // Your Gmail
      reply_to: email,                                     // So you can reply directly
      subject: `📬 New message from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0b1a2b;padding:2rem;border-radius:12px;color:#e2f6ff;">
          <h2 style="color:#00ffff;margin-bottom:1rem;">📬 New Portfolio Message</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#7ec8e3;font-weight:bold;width:80px;">Name</td>
              <td style="padding:8px 0;color:#ffffff;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#7ec8e3;font-weight:bold;">Email</td>
              <td style="padding:8px 0;color:#ffffff;">${email}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#7ec8e3;font-weight:bold;vertical-align:top;">Message</td>
              <td style="padding:8px 0;color:#ffffff;line-height:1.6;">${message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid rgba(0,255,255,0.2);margin:1.5rem 0;">
          <p style="font-size:0.8rem;color:#4a7a8a;">Sent from your portfolio contact form — sahnawaz-portfolio.vercel.app</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
}
