// api/callback.js  —  Vercel Serverless Function
// Sends TWO premium HTML emails on every callback request:
//   1. Branded confirmation  →  visitor's inbox
//   2. Detailed notification →  Sahnawaz's inbox
//
// Env vars needed (same as your other API files):
//   EMAIL_USER  — shzthedigitalalchemist@gmail.com
//   EMAIL_PASS  — Gmail App Password (16 chars, no spaces)

const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  EMAIL 1 — Premium confirmation to the VISITOR
// ─────────────────────────────────────────────────────────────
function visitorEmail({ name, phone, purpose, time }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Callback Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 16px;">
<tr><td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
       style="max-width:560px;background:#111827;border-radius:20px;overflow:hidden;
              box-shadow:0 0 60px rgba(0,220,255,0.12);">

  <!-- Top accent line -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#00dcff,#0055ff,#00dcff);"></td></tr>

  <!-- HEADER BANNER -->
  <tr>
    <td style="background:linear-gradient(135deg,#0b2a3a 0%,#0a1f35 50%,#0b2a3a 100%);
               padding:36px 36px 30px;">

      <!-- Avatar + brand row -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:14px;">
            <div style="width:50px;height:50px;border-radius:50%;text-align:center;
                        line-height:50px;font-size:22px;
                        background:linear-gradient(135deg,rgba(0,220,255,0.15),rgba(0,85,255,0.15));
                        border:1.5px solid rgba(0,220,255,0.35);">🧑‍💻</div>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:0.72rem;font-weight:700;color:#00dcff;
                        letter-spacing:2px;text-transform:uppercase;">Sahnawaz Ahmed Laskar</div>
            <div style="font-size:0.67rem;color:#3a6a7e;margin-top:3px;">
              Full Stack Developer &amp; UI/UX Designer · Silchar, Assam
            </div>
          </td>
        </tr>
      </table>

      <!-- Headline -->
      <div style="margin-top:26px;">
        <div style="font-size:1.7rem;font-weight:800;color:#ffffff;line-height:1.2;
                    letter-spacing:-0.5px;">
          Your Callback is<br/>
          <span style="color:#00dcff;">Confirmed ✓</span>
        </div>
        <div style="margin-top:10px;font-size:0.9rem;color:#7ab0c8;line-height:1.65;">
          Hi <strong style="color:#e8f6ff;">${name}</strong> — great connecting with you!
          Sahnawaz will personally reach out at your requested time.
          Here's everything you submitted:
        </div>
      </div>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:32px 36px;">

      <!-- Summary table -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid rgba(0,220,255,0.15);border-radius:14px;overflow:hidden;">
        <!-- Table header -->
        <tr style="background:rgba(0,220,255,0.06);">
          <td colspan="2" style="padding:13px 20px;
                                  border-bottom:1px solid rgba(0,220,255,0.1);">
            <span style="font-size:0.68rem;color:#00dcff;letter-spacing:2px;
                         text-transform:uppercase;font-weight:700;">Request Summary</span>
          </td>
        </tr>
        <!-- Phone -->
        <tr>
          <td style="padding:13px 20px;width:38%;
                     border-bottom:1px solid rgba(255,255,255,0.05);
                     border-right:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:0.79rem;color:#3d6e87;font-weight:600;">📞 &nbsp;Phone</span>
          </td>
          <td style="padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:0.9rem;color:#e8f6ff;font-weight:700;">${phone}</span>
          </td>
        </tr>
        <!-- Purpose -->
        <tr style="background:rgba(255,255,255,0.02);">
          <td style="padding:13px 20px;
                     border-bottom:1px solid rgba(255,255,255,0.05);
                     border-right:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:0.79rem;color:#3d6e87;font-weight:600;">🎯 &nbsp;Purpose</span>
          </td>
          <td style="padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:0.88rem;color:#e8f6ff;">${purpose}</span>
          </td>
        </tr>
        <!-- Time -->
        <tr>
          <td style="padding:13px 20px;border-right:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:0.79rem;color:#3d6e87;font-weight:600;">🕐 &nbsp;Preferred Time</span>
          </td>
          <td style="padding:13px 20px;">
            <span style="background:rgba(0,220,255,0.1);border:1px solid rgba(0,220,255,0.25);
                         border-radius:20px;padding:3px 13px;font-size:0.83rem;
                         color:#00dcff;font-weight:700;">${time}</span>
          </td>
        </tr>
      </table>

      <!-- Assurance block -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="margin-top:22px;
                    background:linear-gradient(135deg,rgba(0,220,255,0.05),rgba(0,85,255,0.03));
                    border-left:3px solid #00dcff;border-radius:0 12px 12px 0;">
        <tr>
          <td style="padding:16px 20px;">
            <div style="font-size:0.88rem;color:#a8cfe0;line-height:1.75;">
              Sahnawaz <strong style="color:#e8f6ff;">personally</strong> reviews every callback —
              no assistants, no delays. He'll call <strong style="color:#00dcff;">${phone}</strong>
              around <strong style="color:#00dcff;">${time}</strong>.
              Your conversation is already on his radar. 🎯
            </div>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr>
          <td align="center">
            <a href="https://wa.me/917339203154"
               style="display:inline-block;padding:14px 36px;
                      background:linear-gradient(135deg,#00dcff,#0066ff);
                      color:#ffffff;font-weight:700;font-size:0.9rem;
                      text-decoration:none;border-radius:50px;letter-spacing:0.4px;
                      box-shadow:0 6px 24px rgba(0,180,255,0.4);">
              💬 &nbsp;Message on WhatsApp
            </a>
          </td>
        </tr>
      </table>

      <!-- Divider + contacts -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="margin-top:28px;padding-top:24px;
                    border-top:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td>
            <div style="font-size:0.72rem;color:#2a5060;text-transform:uppercase;
                        letter-spacing:1.5px;font-weight:700;margin-bottom:13px;">
              Need to reach out sooner?
            </div>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;">
                <a href="mailto:shzthedigitalalchemist@gmail.com"
                   style="font-size:0.84rem;color:#00dcff;text-decoration:none;">
                  📧 &nbsp;shzthedigitalalchemist@gmail.com
                </a>
              </td></tr>
              <tr><td style="padding:4px 0;">
                <a href="https://wa.me/917339203154"
                   style="font-size:0.84rem;color:#00dcff;text-decoration:none;">
                  💬 &nbsp;WhatsApp: +91 73392 03154
                </a>
              </td></tr>
              <tr><td style="padding:4px 0;">
                <a href="https://instagram.com/sahnawaz.ui.dev"
                   style="font-size:0.84rem;color:#00dcff;text-decoration:none;">
                  📸 &nbsp;@sahnawaz.ui.dev
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0a1320;padding:18px 36px;border-top:1px solid rgba(0,220,255,0.07);">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:0.7rem;color:#1e3a50;line-height:1.7;">
            Automated confirmation · Sahnawaz's AI Portfolio Assistant<br/>
            © 2026 Sahnawaz Ahmed Laskar &nbsp;·&nbsp;
            <a href="https://sahnawaz-portfolio.vercel.app"
               style="color:#00dcff33;text-decoration:none;">sahnawaz-portfolio.vercel.app</a>
          </td>
          <td align="right" style="font-size:0.68rem;color:#1a3040;
                                    white-space:nowrap;vertical-align:top;">
            Silchar, Assam 🇮🇳
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Bottom accent -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#0055ff,#00dcff,#0055ff);"></td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  EMAIL 2 — Internal notification to SAHNAWAZ
// ─────────────────────────────────────────────────────────────
function sahnawazEmail({ name, phone, email, purpose, time }) {
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Callback Request</title>
</head>
<body style="margin:0;padding:0;background:#080f17;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#080f17;padding:32px 16px;">
<tr><td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
       style="max-width:520px;background:#0e1823;border-radius:16px;overflow:hidden;
              box-shadow:0 0 40px rgba(0,220,255,0.08);">

  <!-- Top accent: warm orange-gold (distinguishes internal from visitor email) -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#ff6b35,#ff9500,#ffcc00);"></td></tr>

  <!-- HEADER -->
  <tr>
    <td style="padding:26px 30px 20px;
               background:linear-gradient(135deg,#0e1823,#12202e);">
      <!-- Badge -->
      <div style="display:inline-block;background:rgba(255,149,0,0.1);
                  border:1px solid rgba(255,149,0,0.3);border-radius:6px;
                  padding:4px 13px;font-size:0.67rem;color:#ff9500;
                  letter-spacing:2px;text-transform:uppercase;font-weight:700;
                  margin-bottom:14px;">
        🔔 &nbsp;Action Required
      </div>
      <div style="font-size:1.35rem;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
        New Callback Request
      </div>
      <div style="font-size:0.8rem;color:#2e5a6e;margin-top:6px;">
        ${now} IST &nbsp;·&nbsp; via Portfolio Chatbot
      </div>
    </td>
  </tr>

  <!-- DETAILS -->
  <tr>
    <td style="padding:4px 30px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid rgba(0,220,255,0.12);border-radius:12px;overflow:hidden;">

        <tr style="background:rgba(0,220,255,0.05);">
          <td colspan="2" style="padding:12px 18px;
                                  border-bottom:1px solid rgba(0,220,255,0.1);">
            <span style="font-size:0.67rem;color:#00dcff;letter-spacing:2px;
                         text-transform:uppercase;font-weight:700;">Lead Details</span>
          </td>
        </tr>

        <tr style="border-top:1px solid rgba(255,255,255,0.04);">
          <td style="padding:12px 18px;width:36%;font-size:0.79rem;color:#2e5a6e;
                     font-weight:600;border-right:1px solid rgba(255,255,255,0.04);">
            Name
          </td>
          <td style="padding:12px 18px;font-size:0.92rem;color:#ffffff;font-weight:700;">
            ${name}
          </td>
        </tr>

        <tr style="border-top:1px solid rgba(255,255,255,0.04);
                   background:rgba(255,255,255,0.02);">
          <td style="padding:12px 18px;font-size:0.79rem;color:#2e5a6e;font-weight:600;
                     border-right:1px solid rgba(255,255,255,0.04);">Phone</td>
          <td style="padding:12px 18px;">
            <a href="tel:${phone.replace(/\s/g,'')}"
               style="font-size:0.92rem;color:#00dcff;font-weight:700;text-decoration:none;">
              ${phone}
            </a>
          </td>
        </tr>

        <tr style="border-top:1px solid rgba(255,255,255,0.04);">
          <td style="padding:12px 18px;font-size:0.79rem;color:#2e5a6e;font-weight:600;
                     border-right:1px solid rgba(255,255,255,0.04);">Email</td>
          <td style="padding:12px 18px;">
            <a href="mailto:${email}"
               style="font-size:0.88rem;color:#00dcff;text-decoration:none;">${email}</a>
          </td>
        </tr>

        <tr style="border-top:1px solid rgba(255,255,255,0.04);
                   background:rgba(255,255,255,0.02);">
          <td style="padding:12px 18px;font-size:0.79rem;color:#2e5a6e;font-weight:600;
                     border-right:1px solid rgba(255,255,255,0.04);">Purpose</td>
          <td style="padding:12px 18px;font-size:0.88rem;color:#c8e8f8;">${purpose}</td>
        </tr>

        <tr style="border-top:1px solid rgba(255,255,255,0.04);">
          <td style="padding:12px 18px;font-size:0.79rem;color:#2e5a6e;font-weight:600;
                     border-right:1px solid rgba(255,255,255,0.04);">Preferred Time</td>
          <td style="padding:12px 18px;">
            <span style="background:rgba(0,220,255,0.1);
                         border:1px solid rgba(0,220,255,0.25);
                         border-radius:20px;padding:3px 12px;
                         font-size:0.82rem;color:#00dcff;font-weight:600;">
              ${time}
            </span>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- QUICK ACTIONS -->
  <tr>
    <td style="padding:0 30px 28px;">
      <div style="font-size:0.7rem;color:#2e5a6e;text-transform:uppercase;
                  letter-spacing:1.5px;font-weight:700;margin-bottom:13px;">
        Quick Actions
      </div>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:10px;">
            <a href="tel:${phone.replace(/\s/g,'')}"
               style="display:inline-block;padding:11px 22px;
                      background:linear-gradient(135deg,#00dcff,#0066ff);
                      color:#fff;font-size:0.82rem;font-weight:700;
                      text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
              📞 &nbsp;Call Now
            </a>
          </td>
          <td style="padding-right:10px;">
            <a href="mailto:${email}"
               style="display:inline-block;padding:11px 22px;
                      background:rgba(0,220,255,0.07);
                      border:1px solid rgba(0,220,255,0.2);
                      color:#00dcff;font-size:0.82rem;font-weight:700;
                      text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
              ✉️ &nbsp;Reply by Email
            </a>
          </td>
          <td>
            <a href="https://wa.me/${phone.replace(/\D/g,'')}"
               style="display:inline-block;padding:11px 22px;
                      background:rgba(37,211,102,0.1);
                      border:1px solid rgba(37,211,102,0.25);
                      color:#25d366;font-size:0.82rem;font-weight:700;
                      text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
              💬 &nbsp;WhatsApp
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#060c12;padding:15px 30px;
               border-top:1px solid rgba(0,220,255,0.06);">
      <div style="font-size:0.7rem;color:#152030;line-height:1.6;">
        Auto-generated by Portfolio Chatbot · Do not reply to this email<br/>
        <a href="https://sahnawaz-portfolio.vercel.app"
           style="color:#00dcff22;text-decoration:none;">sahnawaz-portfolio.vercel.app</a>
      </div>
    </td>
  </tr>

  <!-- Bottom accent -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#ffcc00,#ff9500,#ff6b35);"></td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  HANDLER
// ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, phone, email, purpose, time } = req.body || {};
  if (!name || !phone || !email || !purpose || !time) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

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
    subject: `📅 New Callback — ${name} · ${time}`,
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
