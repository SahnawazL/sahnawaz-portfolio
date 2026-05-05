// api/resume.js — Gmail SMTP version (no Resend)

const nodemailer = require('nodemailer');

const RESUME_LINK = 'https://drive.google.com/file/d/11fwGR4cjRs-to_tNpAIT1DJc2CeVq2Kg/view?usp=drivesdk';
const OWNER_EMAIL = 'shzthedigitalalchemist@gmail.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email } = req.body || {};

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email address' });

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
  const refId = 'RES-' + Date.now().toString(36).toUpperCase().slice(-6);

  const visitorHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Resume — Sahnawaz Ahmed Laskar</title></head>
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

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:36px 36px 28px;background:linear-gradient(160deg,#0d2540 0%,#0d1d2e 100%);">
            <div style="margin-bottom:18px;">
              <span style="display:inline-block;background:rgba(0,220,255,0.1);border:1px solid rgba(0,220,255,0.3);border-radius:4px;padding:4px 12px;font-size:0.65rem;color:#00dcff;letter-spacing:2px;text-transform:uppercase;font-weight:700;">📄 &nbsp;Resume Attached</span>
            </div>
            <h1 style="margin:0 0 10px;font-size:1.6rem;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.3px;">Here's my Resume, ${name}</h1>
            <p style="margin:0;font-size:0.9rem;color:#6fa8bf;line-height:1.5;">
              Thank you for your interest. You can view or download my latest resume using the button below. Feel free to reach out if you'd like to discuss opportunities.
            </p>
          </td>
        </tr>
      </table>

      <!-- Ref strip -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px 36px;background:rgba(0,0,0,0.25);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:0.72rem;color:#1d4a5e;">Ref ID &nbsp;<span style="color:#00dcff;font-family:monospace;font-weight:700;letter-spacing:1px;">${refId}</span></td>
                <td align="right" style="font-size:0.72rem;color:#1d4a5e;">Sent: ${now} IST</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <!-- Resume details -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">Resume Details</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;width:32%;vertical-align:top;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Requested By</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.9rem;color:#e8f6ff;font-weight:700;">${name}</span></td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>
              <tr>
                <td style="padding:13px 18px;vertical-align:top;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Sent To</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.85rem;color:#00dcff;font-family:monospace;">${email}</span></td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;vertical-align:top;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Document</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="font-size:0.85rem;color:#c8e8ff;">Sahnawaz Ahmed Laskar — Full Stack Developer &amp; UI/UX Designer</span></td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>
              <tr>
                <td style="padding:13px 18px;vertical-align:middle;"><span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Status</span></td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);"><span style="display:inline-block;background:rgba(0,200,100,0.08);border:1px solid rgba(0,200,100,0.25);border-radius:5px;padding:4px 14px;font-size:0.78rem;color:#34d399;font-weight:700;letter-spacing:0.3px;">✓ Ready to View</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 36px 8px;" align="center">
            <a href="${RESUME_LINK}" target="_blank"
               style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#00dcff 0%,#0055ff 100%);color:#ffffff;font-weight:700;font-size:0.95rem;text-decoration:none;border-radius:8px;letter-spacing:0.4px;box-shadow:0 4px 20px rgba(0,85,255,0.35);">
              📄 &nbsp;View / Download Resume
            </a>
          </td>
        </tr>
      </table>

      <!-- What's next -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:24px 36px 28px;">
            <div style="background:rgba(0,220,255,0.04);border:1px solid rgba(0,220,255,0.08);border-radius:10px;padding:18px 20px;">
              <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:12px;">Let's Connect</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;vertical-align:top;width:22px;"><span style="font-size:0.8rem;">🤝</span></td>
                  <td style="padding:5px 0 5px 8px;"><span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">Interested in working together? Reply to this email or reach out directly.</span></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;vertical-align:top;"><span style="font-size:0.8rem;">⚡</span></td>
                  <td style="padding:5px 0 5px 8px;"><span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">Sahnawaz is available for freelance projects, full-time roles, and collaborations.</span></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;vertical-align:top;"><span style="font-size:0.8rem;">⚡</span></td>
                  <td style="padding:5px 0 5px 8px;"><span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">Prefer something faster? <a href="https://sahnawaz-portfolio.vercel.app" style="color:#00dcff;text-decoration:none;font-weight:600;">sahnawaz-portfolio.vercel.app</a></span></td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- Card footer -->
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

  <!-- Legal footer -->
  <tr>
    <td style="padding:20px 36px 0;" align="center">
      <p style="margin:0;font-size:0.65rem;color:#0e2030;line-height:1.6;text-align:center;">
        Sent via AI chatbot on <a href="https://sahnawaz-portfolio.vercel.app" style="color:#0e2030;text-decoration:none;">sahnawaz-portfolio.vercel.app</a>
        · If you did not request this, please disregard this email.
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
      // 1️⃣ Resume + official email → Visitor
      transporter.sendMail({
        from: '"Sahnawaz Ahmed Laskar" <' + process.env.GMAIL_USER + '>',
        to: email,
        replyTo: OWNER_EMAIL,
        subject: "📄 Here's my Resume — Sahnawaz Ahmed Laskar",
        html: visitorHtml,
      }),
      // 2️⃣ Lead notification → Sahnawaz (unchanged)
      transporter.sendMail({
        from: '"Portfolio Bot" <' + process.env.GMAIL_USER + '>',
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
      }),
    ]);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Gmail error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
