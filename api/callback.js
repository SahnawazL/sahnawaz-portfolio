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

// ── EMAIL 1: Official confirmation → VISITOR ─────────────────
function visitorEmail({ name, phone, purpose, time }) {
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short',
  });
  const refId = 'CB-' + Date.now().toString(36).toUpperCase().slice(-6);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Callback Request Confirmed</title></head>
<body style="margin:0;padding:0;background:#07101a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07101a;padding:36px 16px 48px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- ── Brand bar ── -->
  <tr>
    <td style="padding-bottom:18px;" align="center">
      <div style="display:inline-block;">
        <span style="font-size:0.65rem;color:#00dcff;letter-spacing:3px;
                     text-transform:uppercase;font-weight:700;">
          SAHNAWAZ AHMED LASKAR
        </span>
        <span style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                     text-transform:uppercase;font-weight:600;">
          &nbsp;·&nbsp; FULL STACK DEVELOPER &amp; UI/UX DESIGNER
        </span>
      </div>
    </td>
  </tr>

  <!-- ── Main card ── -->
  <tr>
    <td style="background:#0d1d2e;border-radius:16px;overflow:hidden;
               border:1px solid rgba(0,220,255,0.12);
               box-shadow:0 20px 60px rgba(0,0,0,0.6);">

      <!-- Top accent -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;background:linear-gradient(90deg,#00dcff,#0055ff,#00dcff);"></td></tr>
      </table>

      <!-- ── Header ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:36px 36px 28px;background:linear-gradient(160deg,#0d2540 0%,#0d1d2e 100%);">
            <!-- Status badge -->
            <div style="margin-bottom:18px;">
              <span style="display:inline-block;background:rgba(0,220,255,0.1);
                           border:1px solid rgba(0,220,255,0.3);border-radius:4px;
                           padding:4px 12px;font-size:0.65rem;color:#00dcff;
                           letter-spacing:2px;text-transform:uppercase;font-weight:700;">
                ✓ &nbsp;Request Confirmed
              </span>
            </div>

            <h1 style="margin:0 0 10px;font-size:1.6rem;font-weight:800;
                       color:#ffffff;line-height:1.15;letter-spacing:-0.3px;">
              Your Callback is Scheduled
            </h1>
            <p style="margin:0;font-size:0.9rem;color:#6fa8bf;line-height:1.5;">
              Dear <strong style="color:#c8e8ff;">${name}</strong>, thank you for reaching out.
              Your callback request has been received and logged. Sahnawaz has been notified
              and will contact you at the time specified below.
            </p>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,220,255,0.15),transparent);"></td></tr>
      </table>

      <!-- ── Reference & timestamp strip ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px 36px;background:rgba(0,0,0,0.25);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:0.72rem;color:#2a6070;">
                  <span style="color:#1d4a5e;">Ref ID</span>&nbsp;
                  <span style="color:#00dcff;font-family:monospace;font-weight:700;
                               letter-spacing:1px;">${refId}</span>
                </td>
                <td align="right" style="font-size:0.72rem;color:#1d4a5e;">
                  Submitted: ${now} IST
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <!-- ── Request summary ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Request Summary
            </div>

            <!-- Summary table -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">

              <!-- Name row -->
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;width:36%;vertical-align:top;">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Full Name</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.9rem;color:#e8f6ff;font-weight:700;">${name}</span>
                </td>
              </tr>

              <!-- Divider -->
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>

              <!-- Phone row -->
              <tr>
                <td style="padding:13px 18px;vertical-align:top;">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Contact Number</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.9rem;color:#e8f6ff;font-weight:700;
                               font-family:monospace;letter-spacing:0.5px;">${phone}</span>
                </td>
              </tr>

              <!-- Divider -->
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>

              <!-- Purpose row -->
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;vertical-align:top;">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Purpose</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.88rem;color:#c8e8ff;line-height:1.5;">${purpose}</span>
                </td>
              </tr>

              <!-- Divider -->
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>

              <!-- Call time row -->
              <tr>
                <td style="padding:13px 18px;vertical-align:middle;">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Preferred Time</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);">
                  <span style="display:inline-block;background:rgba(0,220,255,0.08);
                               border:1px solid rgba(0,220,255,0.25);border-radius:5px;
                               padding:4px 14px;font-size:0.82rem;color:#00dcff;
                               font-weight:700;letter-spacing:0.3px;">${time}</span>
                </td>
              </tr>

              <!-- Divider -->
              <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.04);padding:0;"></td></tr>

              <!-- Status row -->
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;vertical-align:middle;">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Status</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);">
                  <span style="display:inline-block;background:rgba(0,200,100,0.08);
                               border:1px solid rgba(0,200,100,0.25);border-radius:5px;
                               padding:4px 14px;font-size:0.78rem;color:#34d399;
                               font-weight:700;letter-spacing:0.3px;">✓ Logged &amp; Notified</span>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

      <!-- ── What happens next ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:24px 36px 28px;">
            <div style="background:rgba(0,220,255,0.04);border:1px solid rgba(0,220,255,0.08);
                        border-radius:10px;padding:18px 20px;">
              <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                          text-transform:uppercase;font-weight:700;margin-bottom:12px;">
                What Happens Next
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;vertical-align:top;width:22px;">
                    <span style="font-size:0.8rem;">📋</span>
                  </td>
                  <td style="padding:5px 0 5px 8px;">
                    <span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">
                      Your request has been logged and Sahnawaz has received an instant notification.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0;vertical-align:top;">
                    <span style="font-size:0.8rem;">📞</span>
                  </td>
                  <td style="padding:5px 0 5px 8px;">
                    <span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">
                      He will call you at <strong style="color:#c8e8ff;">${phone}</strong>
                      around <strong style="color:#00dcff;">${time}</strong>.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0;vertical-align:top;">
                    <span style="font-size:0.8rem;">💬</span>
                  </td>
                  <td style="padding:5px 0 5px 8px;">
                    <span style="font-size:0.82rem;color:#7ab8cf;line-height:1.4;">
                      If you need to reach Sahnawaz before the call, you can message him directly on WhatsApp.
                    </span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- ── WhatsApp CTA (number hidden — click only) ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 36px 32px;" align="center">
            <a href="https://wa.me/918404059231"
               style="display:inline-block;padding:14px 36px;
                      background:linear-gradient(135deg,#00dcff 0%,#0055ff 100%);
                      color:#ffffff;font-weight:700;font-size:0.88rem;
                      text-decoration:none;border-radius:8px;letter-spacing:0.4px;
                      box-shadow:0 4px 20px rgba(0,85,255,0.35);">
              💬 &nbsp;Message Sahnawaz on WhatsApp
            </a>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <!-- ── Footer ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px 36px;background:rgba(0,0,0,0.3);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;">
                  <div style="font-size:0.75rem;color:#2a6070;font-weight:700;
                              margin-bottom:4px;">Sahnawaz Ahmed Laskar</div>
                  <div style="font-size:0.68rem;color:#1d3d4a;">
                    Full Stack Developer &amp; UI/UX Designer · Silchar, Assam, India
                  </div>
                  <div style="margin-top:6px;">
                    <a href="mailto:shzthedigitalalchemist@gmail.com"
                       style="font-size:0.68rem;color:#1d4a5e;text-decoration:none;">
                      shzthedigitalalchemist@gmail.com
                    </a>
                  </div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="font-size:0.65rem;color:#0e2a35;text-align:right;">
                    Ref: <span style="font-family:monospace;">${refId}</span>
                  </div>
                  <div style="margin-top:4px;">
                    <a href="https://sahnawaz-portfolio.vercel.app"
                       style="font-size:0.65rem;color:#0e2a35;text-decoration:none;">
                      sahnawaz-portfolio.vercel.app
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Bottom accent -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;background:linear-gradient(90deg,#0055ff,#00dcff,#0055ff);"></td></tr>
      </table>

    </td>
  </tr>

  <!-- ── Legal footer ── -->
  <tr>
    <td style="padding:20px 36px 0;" align="center">
      <p style="margin:0;font-size:0.65rem;color:#0e2030;line-height:1.6;text-align:center;">
        This is an automated confirmation email sent because you submitted a callback request
        on <a href="https://sahnawaz-portfolio.vercel.app" style="color:#0e2030;text-decoration:none;">sahnawaz-portfolio.vercel.app</a>.
        If you did not make this request, please disregard this email.
        <br/>© 2026 Sahnawaz Ahmed Laskar. All rights reserved.
      </p>
    </td>
  </tr>

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
