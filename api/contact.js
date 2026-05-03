// api/contact.js — Gmail SMTP version (no Resend)

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: '"Portfolio Contact" <' + process.env.GMAIL_USER + '>',
      to: 'shzthedigitalalchemist@gmail.com',
      replyTo: email,
      subject: 'New message from ' + name,
      html:
        '<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0b1a2b;padding:2rem;border-radius:12px;color:#e2f6ff;">' +
        '<h2 style="color:#00ffff;margin-bottom:1rem;">New Portfolio Message</h2>' +
        '<p><strong style="color:#7ec8e3;">Name:</strong> ' + name + '</p>' +
        '<p><strong style="color:#7ec8e3;">Email:</strong> ' + email + '</p>' +
        '<p><strong style="color:#7ec8e3;">Message:</strong><br>' + message.replace(/\n/g, '<br>') + '</p>' +
        '<hr style="border:none;border-top:1px solid rgba(0,255,255,0.2);margin:1.5rem 0;">' +
        '<p style="font-size:0.8rem;color:#4a7a8a;">Sent from sahnawaz-portfolio.vercel.app</p>' +
        '</div>',
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Gmail error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
