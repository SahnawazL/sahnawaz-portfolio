// api/callback.js — Vercel Serverless Function
// TWO emails per callback: confirmation → visitor, notification → Sahnawaz
// Env vars: GMAIL_USER, GMAIL_PASS

const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
}

// ── EMAIL 1: Short confirmation → VISITOR ────────────────────
function visitorEmail({ name, phone, purpose, time }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Callback Confirmed</title></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0"
  style="max-width:480px;background:#111827;border-radius:16px;overflow:hidden;">

  <!-- Accent top -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#00dcff,#0055ff,#00dcff);"></td></tr>

  <!-- Header -->
  <tr>
    <td style="padding:28px 30px 20px;background:#0d1f2e;">
      <div style="font-size:0.7rem;color:#00dcff;letter-spacing:2px;
                  text-transform:uppercase;font-weight:700;margin-bottom:8px;">
        Sahnawaz Ahmed Laskar · Full Stack Developer
      </div>
      <div style="font-size:1.4rem;font-weight:800;color:#fff;line-height:1.2;">
        Callback Confirmed ✓
      </div>
      <div style="font-size:0.85rem;color:#5a8a9f;margin-top:6px;">
        Hi ${name}, your request is logged. Here's your summary:
      </div>
    </td>
  </tr>

  <!-- Summary -->
  <tr>
    <td style="padding:0 30px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid rgba(0,220,255,0.15);border-radius:10px;overflow:hidden;
               margin-top:4px;">
        <tr>
          <td style="padding:11px 16px;font-size:0.8rem;color:#3d6e87;width:38%;
                     border-right:1px solid rgba(255,255,255,0.05);
                     border-bottom:1px solid rgba(255,255,255,0.05);">📞 Phone</td>
          <td style="padding:11px 16px;font-size:0.88rem;color:#e8f6ff;font-weight:700;
                     border-bottom:1px solid rgba(255,255,255,0.05);">${phone}</td>
        </tr>
        <tr style="background:rgba(255,255,255,0.02);">
          <td style="padding:11px 16px;font-size:0.8rem;color:#3d6e87;
                     border-right:1px solid rgba(255,255,255,0.05);
                     border-bottom:1px solid rgba(255,255,255,0.05);">🎯 Purpose</td>
          <td style="padding:11px 16px;font-size:0.88rem;color:#e8f6ff;
                     border-bottom:1px solid rgba(255,255,255,0.05);">${purpose}</td>
        </tr>
        <tr>
          <td style="padding:11px 16px;font-size:0.8rem;color:#3d6e87;
                     border-right:1px solid rgba(255,255,255,0.05);">🕐 Call Time</td>
          <td style="padding:11px 16px;">
            <span style="background:rgba(0,220,255,0.1);border:1px solid rgba(0,220,255,0.25);
                         border-radius:20px;padding:2px 12px;font-size:0.82rem;
                         color:#00dcff;font-weight:700;">${time}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- WhatsApp CTA -->
  <tr>
    <td style="padding:0 30px 28px;" align="center">
      <a href="https://wa.me/918404059231"
         style="display:inline-block;padding:12px 32px;
                background:linear-gradient(135deg,#00dcff,#0066ff);
                color:#fff;font-weight:700;font-size:0.88rem;
                text-decoration:none;border-radius:50px;letter-spacing:0.3px;">
        💬 &nbsp;WhatsApp Sahnawaz · +91 84040 59231
      </a>
      <div style="margin-top:12px;font-size:0.78rem;color:#2a5060;">
        📧 &nbsp;<a href="mailto:shzthedigitalalchemist@gmail.com"
                   style="color:#00dcff44;text-decoration:none;">
          shzthedigitalalchemist@gmail.com
        </a>
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#090e16;padding:14px 30px;border-top:1px solid rgba(0,220,255,0.07);">
      <div style="font-size:0.7rem;color:#1a3040;text-align:center;">
        © 2026 Sahnawaz Ahmed Laskar ·
        <a href="https://sahnawaz-portfolio.vercel.app"
           style="color:#00dcff22;text-decoration:none;">sahnawaz-portfolio.vercel.app</a>
      </div>
    </td>
  </tr>

  <!-- Accent bottom -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#0055ff,#00dcff,#0055ff);"></td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ── EMAIL 2: Short notification → SAHNAWAZ ───────────────────
function sahnawazEmail({ name, phone, email, purpose, time }) {
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
  });
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Callback</title></head>
<body style="margin:0;padding:0;background:#080f17;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080f17;padding:28px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0"
  style="max-width:460px;background:#0e1823;border-radius:14px;overflow:hidden;">

  <!-- Accent top: warm gold = internal alert -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#ff9500,#ffcc00,#ff9500);"></td></tr>

  <!-- Header -->
  <tr>
    <td style="padding:22px 26px 16px;background:#0c1620;">
      <div style="display:inline-block;background:rgba(255,149,0,0.12);
                  border:1px solid rgba(255,149,0,0.3);border-radius:5px;
                  padding:3px 10px;font-size:0.65rem;color:#ff9500;
                  letter-spacing:2px;text-transform:uppercase;font-weight:700;">
        🔔 New Callback
      </div>
      <div style="font-size:1.2rem;font-weight:800;color:#fff;margin-top:8px;">
        ${name} wants a call
      </div>
      <div style="font-size:0.75rem;color:#2e5a6e;margin-top:4px;">${now} IST</div>
    </td>
  </tr>

  <!-- Details -->
  <tr>
    <td style="padding:0 26px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid rgba(0,220,255,0.12);border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;width:34%;
                     border-right:1px solid rgba(255,255,255,0.04);
                     border-bottom:1px solid rgba(255,255,255,0.04);">Name</td>
          <td style="padding:10px 16px;font-size:0.88rem;color:#fff;font-weight:700;
                     border-bottom:1px solid rgba(255,255,255,0.04);">${name}</td>
        </tr>
        <tr style="background:rgba(255,255,255,0.02);">
          <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;
                     border-right:1px solid rgba(255,255,255,0.04);
                     border-bottom:1px solid rgba(255,255,255,0.04);">Phone</td>
          <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04);">
            <a href="tel:${phone.replace(/\s/g,'')}"
               style="font-size:0.88rem;color:#00dcff;font-weight:700;text-decoration:none;">
              ${phone}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;
                     border-right:1px solid rgba(255,255,255,0.04);
                     border-bottom:1px solid rgba(255,255,255,0.04);">Email</td>
          <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04);">
            <a href="mailto:${email}"
               style="font-size:0.82rem;color:#00dcff;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr style="background:rgba(255,255,255,0.02);">
          <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;
                     border-right:1px solid rgba(255,255,255,0.04);
                     border-bottom:1px solid rgba(255,255,255,0.04);">Purpose</td>
          <td style="padding:10px 16px;font-size:0.85rem;color:#c8e8f8;
                     border-bottom:1px solid rgba(255,255,255,0.04);">${purpose}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;
                     border-right:1px solid rgba(255,255,255,0.04);">Call Time</td>
          <td style="padding:10px 16px;">
            <span style="background:rgba(0,220,255,0.1);border:1px solid rgba(0,220,255,0.25);
                         border-radius:20px;padding:2px 12px;font-size:0.8rem;
                         color:#00dcff;font-weight:600;">${time}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Quick actions -->
  <tr>
    <td style="padding:0 26px 24px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:8px;">
            <a href="tel:${phone.replace(/\s/g,'')}"
               style="display:inline-block;padding:10px 20px;
                      background:linear-gradient(135deg,#00dcff,#0066ff);
                      color:#fff;font-size:0.8rem;font-weight:700;
                      text-decoration:none;border-radius:8px;">
              📞 Call
            </a>
          </td>
          <td style="padding-right:8px;">
            <a href="mailto:${email}"
               style="display:inline-block;padding:10px 20px;
                      background:rgba(0,220,255,0.07);border:1px solid rgba(0,220,255,0.2);
                      color:#00dcff;font-size:0.8rem;font-weight:700;
                      text-decoration:none;border-radius:8px;">
              ✉️ Email
            </a>
          </td>
          <td>
            <a href="https://wa.me/${phone.replace(/\D/g,'')}"
               style="display:inline-block;padding:10px 20px;
                      background:rgba(37,211,102,0.08);border:1px solid rgba(37,211,102,0.22);
                      color:#25d366;font-size:0.8rem;font-weight:700;
                      text-decoration:none;border-radius:8px;">
              💬 WhatsApp
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#060c12;padding:12px 26px;border-top:1px solid rgba(0,220,255,0.06);">
      <div style="font-size:0.68rem;color:#12232e;">Portfolio Chatbot · Auto-generated</div>
    </td>
  </tr>

  <!-- Accent bottom -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#ffcc00,#ff9500,#ffcc00);"></td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ── HANDLER ──────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { name, phone, email, purpose, time } = req.body || {};
  if (!name || !phone || !email || !purpose || !time)
    return res.status(400).json({ success: false, error: 'Missing required fields' });

  const transporter = createTransporter();

  const mailToVisitor = {
    from: `"Sahnawaz Ahmed Laskar" <${process.env.GMAIL_USER}>`,
    to: email,
    replyTo: process.env.GMAIL_USER,
    subject: `✅ Callback Confirmed — Sahnawaz will reach out at ${time}`,
    html: visitorEmail({ name, phone, purpose, time }),
  };

  const mailToSahnawaz = {
    from: `"Portfolio Assistant" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `📅 Callback — ${name} · ${time}`,
    html: sahnawazEmail({ name, phone, email, purpose, time }),
  };

  try {
    const [r1, r2] = await Promise.all([
      transporter.sendMail(mailToVisitor),
      transporter.sendMail(mailToSahnawaz),
    ]);
    return res.status(200).json({
      success: true,
      confirmed: !!r1.messageId,
      notified:  !!r2.messageId,
    });
  } catch (err) {
    console.error('Callback email error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
