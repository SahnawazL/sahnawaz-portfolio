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

  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short',
  });
  const refId = 'MSG-' + Date.now().toString(36).toUpperCase().slice(-6);
  const msgPreview = message.length > 120 ? message.slice(0, 120) + '…' : message;

  const visitorHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Message Received</title></head>
<body style="margin:0;padding:0;background:#07101a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07101a;padding:36px 16px 48px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <tr>
    <td style="padding-bottom:18px;" align="center">
      <span style="font-size:0.65rem;color:#00dcff;letter-spacing:3px;text-transform:uppercase;font-weight:700;">SAHNAWAZ AHMED LASKAR</span>
      <span style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;text-transform:uppercase;font-weight:600;">&nbsp;·&nbsp;FULL STACK DEVELOPER &amp; UI/UX DESIGNER</span>
    </td>
  </tr>

  <tr>
    <td style="background:#0d1d2e;border-radius:16px;overflow:hidden;border:1px solid rgba(0,220,255,0.12);box-shadow:0 20px 60px rgba(0,0,0,0.6);">

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;background:linear-gradient(90deg,#00dcff,#0055ff,#00dcff);"></td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:36px 36px 28px;background:linear-gradient(160deg,#0d2540 0%,#0d1d2e 100%);">
            <div style="margin-bottom:18px;">
              <span style="display:inline-block;background:rgba(0,220,255,0.1);border:1px solid rgba(0,220,255,0.3);border-radius:4px;padding:4px 12px;font-size:0.65rem;color:#00dcff;letter-spacing:2px;text-transform:uppercase;font-weight:700;">✓ &nbsp;Message Received</span>
            </div>
            <h1 style="margin:0 0 10px;font-size:1.6rem;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.3px;">Your message is on its way</h1>
            <p style="margin:0;font-size:0.9rem;color:#6fa8bf;line-height:1.5;">
              Hi <strong style="color:#c8e8ff;">${name}</strong>, thank you for reaching out. Sahnawaz has been notified and will reply to <strong style="color:#c8e8ff;">${email}</strong> within <strong style="color:#00dcff;">24 hours</strong>.
            </p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px 36px;background:rgba(0,0,0,0.25);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:0.72rem;color:#1d4a5e;">Ref ID &nbsp;<span style="color:#00dcff;font-family:monospace;font-weight:700;letter-spacing:1px;">${refId}</span></td>
                <td align="right" style="font-size:0.72rem;color:#1d4a5e;">Received: ${now} IST</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">Your Message</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;width:32%;vertical-align:top;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">From</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.9rem;color:#e8f6ff;font-weight:700;">${name}</span></td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>
              <tr>
                <td style="padding:13px 18px;vertical-align:top;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Reply To</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.85rem;color:#00dcff;font-family:monospace;">${email}</span></td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;vertical-align:top;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Message</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.85rem;color:#c8e8ff;line-height:1.6;font-style:italic;">"${msgPreview}"</span></td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>
              <tr>
                <td style="padding:13px 18px;vertical-align:middle;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Status</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="display:inline-block;background:rgba(0,200,100,0.08);border:1px solid rgba(0,200,100,0.25);border-radius:5px;padding:4px 14px;font-size:0.78rem;color:#34d399;font-weight:700;letter-spacing:0.3px;">✓ Delivered to Sahnawaz</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:24px 36px 28px;">
            <div style="background:rgba(0,220,255,0.04);border:1px solid rgba(0,220,255,0.08);border-radius:10px;padding:18px 20px;">
              <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:12px;">What Happens Next</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;vertical-align:top;width:22px;"><span style="font-size:0.8rem;">📨</span></td>
                  <td style="padding:5px 0 5px 8px;"><span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">Your message has been delivered and Sahnawaz has been notified instantly.</span></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;vertical-align:top;"><span style="font-size:0.8rem;">⏱️</span></td>
                  <td style="padding:5px 0 5px 8px;"><span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">He typically replies within <strong style="color:#c8e8ff;">24 hours</strong>, often much sooner. Keep an eye on <strong style="color:#c8e8ff;">${email}</strong>.</span></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;vertical-align:top;"><span style="font-size:0.8rem;">💬</span></td>
                  <td style="padding:5px 0 5px 8px;"><span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">Need a faster response? You can also message him directly on WhatsApp.</span></td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 36px 32px;" align="center">
            <a href="https://wa.me/918404059231" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#00dcff 0%,#0055ff 100%);color:#ffffff;font-weight:700;font-size:0.88rem;text-decoration:none;border-radius:8px;letter-spacing:0.4px;box-shadow:0 4px 20px rgba(0,85,255,0.35);">💬 &nbsp;Message Sahnawaz on WhatsApp</a>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px 36px;background:rgba(0,0,0,0.3);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;">
                  <div style="font-size:0.75rem;color:#2a6070;font-weight:700;margin-bottom:4px;">Sahnawaz Ahmed Laskar</div>
                  <div style="font-size:0.68rem;color:#1d3d4a;">Full Stack Developer &amp; UI/UX Designer · Silchar, Assam, India</div>
                  <div style="margin-top:6px;"><a href="mailto:shzthedigitalalchemist@gmail.com" style="font-size:0.68rem;color:#1d4a5e;text-decoration:none;">shzthedigitalalchemist@gmail.com</a></div>
                  <div style="margin-top:4px;"><a href="https://instagram.com/sahnawaz.ui.dev" style="font-size:0.68rem;color:#1d4a5e;text-decoration:none;">Instagram: @sahnawaz.ui.dev</a></div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="font-size:0.65rem;color:#0e2a35;text-align:right;">Ref: <span style="font-family:monospace;">${refId}</span></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;background:linear-gradient(90deg,#0055ff,#00dcff,#0055ff);"></td></tr>
      </table>

    </td>
  </tr>

  <tr>
    <td style="padding:20px 36px 0;" align="center">
      <p style="margin:0;font-size:0.65rem;color:#0e2030;line-height:1.6;text-align:center;">
        Sent via AI chatbot on <a href="https://sahnawaz-portfolio.vercel.app" style="color:#0e2030;text-decoration:none;">sahnawaz-portfolio.vercel.app</a>
        · If you did not send this message, please disregard this email.
        <br/>© 2026 Sahnawaz Ahmed Laskar. All rights reserved.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`;

  try {
    await Promise.all([
      // ── Existing notification → Sahnawaz (unchanged) ──
      transporter.sendMail({
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
      }),
      // ── New confirmation → Visitor ──
      transporter.sendMail({
        from: '"Sahnawaz Ahmed Laskar" <' + process.env.GMAIL_USER + '>',
        to: email,
        replyTo: process.env.GMAIL_USER,
        subject: '✅ Message received — Sahnawaz will reply within 24 hrs',
        html: visitorHtml,
      }),
    ]);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Gmail error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
