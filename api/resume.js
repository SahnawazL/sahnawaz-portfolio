// api/resume.js
// Dual-purpose resume handler:
//
//   GET  /api/resume?token=<firebaseIdToken>&mode=view|download
//        — Verifies Firebase ID token, logs to Firestore, serves resume.pdf
//
//   POST /api/resume  { name, email, phone?, source?, role? }
//        — role is one of 'developer' | 'recruiter' | 'client' | 'browsing',
//          optional, tapped from chips on the frontend (not free text)
//        — Emails resume.pdf as attachment to the requester
//          (portfolio bio "Get Resume" form + chatbot flow)
//        — Notifies Sahnawaz (flags role if present), logs to Firestore
//        — No auth token needed (public flow)

const path       = require('path');
const fs         = require('fs');
const nodemailer = require('nodemailer');

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth }                       = require('firebase-admin/auth');
const { getFirestore, FieldValue }      = require('firebase-admin/firestore');

/* ─────────────────────────────────────────────────────────
   Firebase Admin — init once, reuse across warm restarts
───────────────────────────────────────────────────────── */
function getAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return { auth: getAuth(), db: getFirestore() };
}

/* ─────────────────────────────────────────────────────────
   Nodemailer transporter — Gmail App Password
   Env vars needed:
     GMAIL_USER  — shzthedigitalalchemist@gmail.com
     GMAIL_PASS  — 16-char Gmail App Password (not your real password)
───────────────────────────────────────────────────────── */
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

function makeRefId() {
  return 'RS-' + Date.now().toString(36).toUpperCase().slice(-6);
}

function sourceLabel(requestSource) {
  return requestSource === 'bio-cta'
    ? 'Portfolio bio — "Get Resume" button'
    : 'Chat assistant';
}

/* Visitor-supplied "what brings you here" tag — optional, so any of
   these (or none) may come through. Unknown values are shown as-is
   rather than dropped, in case the frontend ever adds a new option. */
const ROLE_LABELS = {
  developer: '🧑\u200d💻 Fellow developer',
  recruiter: '🧑\u200d💼 Recruiter / HR',
  client:    '🏢 Hiring / client',
  browsing:  '👀 Just browsing',
};
function roleLabel(role) {
  if (!role) return '';
  return ROLE_LABELS[role] || role;
}

/* ═══════════════════════════════════════════════════════════
   EMAIL 1 — Premium confirmation → VISITOR
═══════════════════════════════════════════════════════════ */
function visitorResumeEmail({ name, refId, now, requestSource }) {
  /* Small helper for the two-column "Core Expertise" list rows */
  const expertiseRow = (left, right) => `
              <tr>
                <td style="padding:10px 20px 10px 0;width:50%;vertical-align:top;
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.82rem;color:#c8e8ff;line-height:1.6;">${left}</span>
                </td>
                <td style="padding:10px 0 10px 20px;width:50%;vertical-align:top;
                           border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.82rem;color:#c8e8ff;line-height:1.6;">${right}</span>
                </td>
              </tr>`;

  /* Small helper for the "Services & Engagement" price rows */
  const serviceRow = (label, price, last) => `
              <tr${last ? '' : ' style="border-bottom:1px solid rgba(255,255,255,0.04);"'}>
                <td style="padding:11px 18px;font-size:0.82rem;color:#9fc4d6;">${label}</td>
                <td align="right" style="padding:11px 18px;font-size:0.82rem;color:#00dcff;font-weight:700;font-family:monospace;">${price}</td>
              </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="color-scheme" content="dark"/>
<meta name="supported-color-schemes" content="dark"/>
<title>Resume &amp; Professional Profile — Sahnawaz Ahmed Laskar</title>
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; }
  a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; }

  /* ── Mobile: kill the side gutters, tighten section padding ── */
  @media only screen and (max-width:600px) {
    .gutter        { padding-left:8px  !important; padding-right:8px  !important; }
    .sec-x         { padding-left:18px !important; padding-right:18px !important; }
    .stack-td      { display:block !important; width:100% !important;
                      padding-right:0 !important; box-sizing:border-box !important; }
    .stack-btn     { display:block !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#07101a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<!-- Preheader (hidden, controls inbox preview text) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Resume attached, plus a full professional profile — background, expertise, selected work and ways to connect. Ref ${refId}.
</div>

<table width="100%" cellpadding="0" cellspacing="0" class="gutter" style="background:#07101a;padding:36px 16px 48px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

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
          <td class="sec-x" style="padding:36px 36px 28px;background:linear-gradient(160deg,#0d2540 0%,#0d1d2e 100%);">
            <div style="margin-bottom:18px;">
              <span style="display:inline-block;background:rgba(0,220,255,0.1);
                           border:1px solid rgba(0,220,255,0.3);border-radius:4px;
                           padding:4px 12px;font-size:0.65rem;color:#00dcff;
                           letter-spacing:2px;text-transform:uppercase;font-weight:700;">
                Resume &amp; Professional Profile
              </span>
            </div>

            <h1 style="margin:0 0 12px;font-size:1.5rem;font-weight:800;
                       color:#ffffff;line-height:1.25;letter-spacing:-0.3px;">
              Dear ${name},
            </h1>
            <p style="margin:0 0 10px;font-size:0.88rem;color:#8fb8cc;line-height:1.65;">
              Thank you for requesting Sahnawaz Ahmed Laskar's resume via
              ${sourceLabel(requestSource)}. It is attached to this email as a PDF.
            </p>
            <p style="margin:0;font-size:0.88rem;color:#8fb8cc;line-height:1.65;">
              To help you evaluate his background more fully, this message also includes
              a summary of his professional experience, technical expertise, selected
              work, and the ways you can connect with him further.
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
          <td class="sec-x" style="padding:14px 36px;background:rgba(0,0,0,0.25);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:0.72rem;color:#2a6070;">
                  <span style="color:#1d4a5e;">Ref ID</span>&nbsp;
                  <span style="color:#00dcff;font-family:monospace;font-weight:700;
                               letter-spacing:1px;">${refId}</span>
                </td>
                <td align="right" style="font-size:0.72rem;color:#1d4a5e;">
                  Issued: ${now} IST
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

      <!-- ── Professional summary ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:28px 36px 24px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Professional Summary
            </div>
            <p style="margin:0;font-size:0.85rem;color:#a8c9da;line-height:1.75;">
              Sahnawaz Ahmed Laskar is a Full Stack Developer and UI/UX Designer based in
              Silchar, Assam, India. He has 5+ years of development experience since 2021,
              including 2.4+ years of hands-on industry experience across
              <strong style="color:#c8e8ff;">Xiaomi India</strong>,
              <strong style="color:#c8e8ff;">Flipkart</strong> and
              <strong style="color:#c8e8ff;">Rapido</strong>, and is currently pursuing an
              MCA at Yenepoya University, Bangalore. He specialises in React.js, Node.js,
              Firebase and AI-integrated applications, and is open to freelance and
              full-time roles worldwide.
            </p>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <!-- ── Core expertise ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:24px 36px 20px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Core Expertise
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:8px;width:50%;">
                  <span style="font-size:0.68rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:700;">Development</span>
                </td>
                <td style="padding-bottom:8px;width:50%;padding-left:20px;">
                  <span style="font-size:0.68rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:700;">Design &amp; AI</span>
                </td>
              </tr>
              ${expertiseRow('React.js &amp; Node.js', 'Figma &amp; Adobe XD')}
              ${expertiseRow('JavaScript &amp; PHP', 'UI/UX Design')}
              ${expertiseRow('Firebase &amp; MySQL', 'Tailwind CSS')}
              ${expertiseRow('REST API Integration', 'ChatGPT &amp; Groq AI Integration')}
            </table>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <!-- ── Selected work ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:24px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Selected Work
            </div>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.04);">
                  <div style="font-size:0.85rem;color:#c8e8ff;font-weight:700;margin-bottom:4px;">YojanaSahay</div>
                  <div style="font-size:0.78rem;color:#7ea5b8;line-height:1.6;">
                    Bilingual (Hindi &amp; English) civic-tech platform helping Indian
                    citizens discover government welfare schemes, with an AI eligibility checker.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.04);">
                  <div style="font-size:0.85rem;color:#c8e8ff;font-weight:700;margin-bottom:4px;">StudyLens AI</div>
                  <div style="font-size:0.78rem;color:#7ea5b8;line-height:1.6;">
                    AI study assistant for KG&ndash;12 students covering SEBA, AHSEC, CBSE
                    &amp; ICSE syllabi, answering in English, Bengali, Hindi and Assamese.
                  </div>
                </td>
              </tr>
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.04);">
                  <div style="font-size:0.85rem;color:#c8e8ff;font-weight:700;margin-bottom:4px;">Portfolio &amp; AI Assistant</div>
                  <div style="font-size:0.78rem;color:#7ea5b8;line-height:1.6;">
                    This site itself &mdash; 22,000+ lines of hand-coded HTML/CSS/JS with an
                    embedded, context-aware AI chat assistant.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;">
                  <div style="font-size:0.85rem;color:#c8e8ff;font-weight:700;margin-bottom:4px;">Client Websites</div>
                  <div style="font-size:0.78rem;color:#7ea5b8;line-height:1.6;">
                    10+ client websites delivered from scratch &mdash; responsive,
                    pixel-perfect and production-ready.
                  </div>
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

      <!-- ── Professional experience ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:24px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Professional Experience
            </div>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:11px 18px;font-size:0.82rem;color:#c8e8ff;font-weight:700;width:38%;
                           border-bottom:1px solid rgba(255,255,255,0.04);">Rapido</td>
                <td style="padding:11px 18px;font-size:0.8rem;color:#8fb8cc;
                           border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  IT / Developer &mdash; internal tooling, agent training &amp; live chat support
                </td>
              </tr>
              <tr>
                <td style="padding:11px 18px;font-size:0.82rem;color:#c8e8ff;font-weight:700;
                           border-bottom:1px solid rgba(255,255,255,0.04);">Flipkart</td>
                <td style="padding:11px 18px;font-size:0.8rem;color:#8fb8cc;
                           border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  L2 Support &mdash; returns &amp; refunds
                </td>
              </tr>
              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:11px 18px;font-size:0.82rem;color:#c8e8ff;font-weight:700;">Xiaomi India</td>
                <td style="padding:11px 18px;font-size:0.8rem;color:#8fb8cc;
                           border-left:1px solid rgba(255,255,255,0.04);">
                  L1 Inbound Support &mdash; MSM troubleshooting
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:0.76rem;color:#3a6a7f;line-height:1.6;">
              2.4+ years combined across all three, part of 5+ years total as a developer
              counting freelance &amp; personal work since 2021.
            </p>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:1px;background:rgba(255,255,255,0.04);"></td></tr>
      </table>

      <!-- ── Services & engagement ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:24px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Services &amp; Engagement
            </div>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">
              ${serviceRow('Website Design', '&#8377;9,999+')}
              ${serviceRow('Portfolio Website', '&#8377;6,999+')}
              ${serviceRow('E-Commerce Setup', '&#8377;14,999+')}
              ${serviceRow('UI/UX Design', '&#8377;3,999+/screen')}
              ${serviceRow('Backend Development', '&#8377;5,999+/module')}
              ${serviceRow('AI Integration', '&#8377;2,999+/workflow', true)}
            </table>
            <p style="margin:10px 0 0;font-size:0.74rem;color:#3a6a7f;line-height:1.6;">
              Shared for reference only &mdash; full scope and inclusions are listed on the
              portfolio's Services section.
            </p>
          </td>
        </tr>
      </table>

      <!-- ── Availability ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:22px 36px 8px;">
            <span style="display:inline-block;background:rgba(52,211,153,0.1);
                         border:1px solid rgba(52,211,153,0.3);border-radius:4px;
                         padding:5px 12px;font-size:0.68rem;color:#34d399;
                         letter-spacing:1px;text-transform:uppercase;font-weight:700;">
              Open to Freelance &amp; Full-Time Roles &mdash; Worldwide
            </span>
          </td>
        </tr>
      </table>

      <!-- ── CTA buttons ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:18px 36px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="stack-td" style="padding-right:10px;padding-bottom:10px;">
                  <a href="https://sahnawaz-portfolio.vercel.app" class="stack-btn"
                     style="display:inline-block;padding:12px 22px;
                            background:linear-gradient(135deg,#00dcff,#0066ff);
                            color:#031018;font-size:0.78rem;font-weight:800;
                            letter-spacing:0.5px;text-decoration:none;border-radius:8px;">
                    View Portfolio
                  </a>
                </td>
                <td class="stack-td" style="padding-bottom:10px;">
                  <a href="mailto:shzthedigitalalchemist@gmail.com" class="stack-btn"
                     style="display:inline-block;padding:12px 22px;
                            background:rgba(0,220,255,0.07);border:1px solid rgba(0,220,255,0.25);
                            color:#00dcff;font-size:0.78rem;font-weight:800;
                            letter-spacing:0.5px;text-decoration:none;border-radius:8px;">
                    Get in Touch
                  </a>
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

      <!-- ── Reach out directly ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:24px 36px 8px;">
            <div style="font-size:0.65rem;color:#1d4a5e;letter-spacing:2px;
                        text-transform:uppercase;font-weight:700;margin-bottom:14px;">
              Reach Out Directly
            </div>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid rgba(0,220,255,0.1);border-radius:10px;overflow:hidden;">

              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;width:32%;vertical-align:top;
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Email</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <a href="mailto:shzthedigitalalchemist@gmail.com"
                     style="font-size:0.85rem;color:#00dcff;font-weight:700;text-decoration:none;">
                    shzthedigitalalchemist@gmail.com
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:13px 18px;vertical-align:top;
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Portfolio</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <a href="https://sahnawaz-portfolio.vercel.app"
                     style="font-size:0.85rem;color:#00dcff;font-weight:700;text-decoration:none;">
                    sahnawaz-portfolio.vercel.app
                  </a>
                </td>
              </tr>

              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;vertical-align:top;
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">LinkedIn</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <a href="https://linkedin.com/in/sahnawaz-ahmed-laskar-021608168"
                     style="font-size:0.85rem;color:#00dcff;font-weight:700;text-decoration:none;">
                    sahnawaz-ahmed-laskar
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:13px 18px;vertical-align:top;
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">GitHub</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);
                           border-bottom:1px solid rgba(255,255,255,0.04);">
                  <a href="https://github.com/sahnawazl"
                     style="font-size:0.85rem;color:#00dcff;font-weight:700;text-decoration:none;">
                    github.com/sahnawazl
                  </a>
                </td>
              </tr>

              <tr style="background:rgba(255,255,255,0.015);">
                <td style="padding:13px 18px;vertical-align:top;">
                  <span style="font-size:0.72rem;color:#2a6070;text-transform:uppercase;
                               letter-spacing:1px;font-weight:600;">Instagram</span>
                </td>
                <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.04);">
                  <a href="https://instagram.com/sahnawaz.ui.dev"
                     style="font-size:0.85rem;color:#00dcff;font-weight:700;text-decoration:none;">
                    @sahnawaz.ui.dev
                  </a>
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

      <!-- ── Footer note ── -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sec-x" style="padding:18px 36px;background:rgba(0,0,0,0.2);">
            <p style="margin:0;font-size:0.78rem;color:#3a6a7f;line-height:1.6;">
              Every message is read personally, with replies typically sent within 24&ndash;48 hours.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ── Official footer ── -->
  <tr>
    <td style="padding-top:26px;" align="center">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 10px;">
            <a href="https://sahnawaz-portfolio.vercel.app" style="font-size:0.7rem;color:#4a95ad;text-decoration:none;font-weight:600;letter-spacing:0.3px;">Portfolio</a>
          </td>
          <td style="color:#1d4a5e;font-size:0.7rem;">·</td>
          <td style="padding:0 10px;">
            <a href="https://linkedin.com/in/sahnawaz-ahmed-laskar-021608168" style="font-size:0.7rem;color:#4a95ad;text-decoration:none;font-weight:600;letter-spacing:0.3px;">LinkedIn</a>
          </td>
          <td style="color:#1d4a5e;font-size:0.7rem;">·</td>
          <td style="padding:0 10px;">
            <a href="https://github.com/sahnawazl" style="font-size:0.7rem;color:#4a95ad;text-decoration:none;font-weight:600;letter-spacing:0.3px;">GitHub</a>
          </td>
          <td style="color:#1d4a5e;font-size:0.7rem;">·</td>
          <td style="padding:0 10px;">
            <a href="https://instagram.com/sahnawaz.ui.dev" style="font-size:0.7rem;color:#4a95ad;text-decoration:none;font-weight:600;letter-spacing:0.3px;">Instagram</a>
          </td>
        </tr>
      </table>

      <p style="margin:16px 0 0;font-size:0.7rem;color:#2a6070;font-weight:700;letter-spacing:0.3px;">
        Sahnawaz Ahmed Laskar
      </p>
      <p style="margin:2px 0 0;font-size:0.68rem;color:#1d4a5e;line-height:1.6;">
        Full Stack Developer &amp; UI/UX Designer &nbsp;·&nbsp; Silchar, Assam, India
      </p>

      <p style="margin:16px auto 0;max-width:440px;font-size:0.66rem;color:#163a48;line-height:1.7;">
        This is a system-generated message from sahnawaz-portfolio.vercel.app &mdash; replies go
        straight to shzthedigitalalchemist@gmail.com.<br>
        You are receiving it because you requested this resume via ${sourceLabel(requestSource)}.
      </p>

      <p style="margin:14px 0 0;font-size:0.62rem;color:#122a34;">
        &copy; ${new Date().getFullYear()} Sahnawaz Ahmed Laskar. All rights reserved.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════
   EMAIL 2 — Internal notification → SAHNAWAZ
═══════════════════════════════════════════════════════════ */
function adminResumeEmail({ name, email, phone, role, refId, now, requestSource }) {
  const roleRow = role
    ? `<tr style="background:rgba(255,149,0,0.05);">
         <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;width:34%;
                    border-right:1px solid rgba(255,255,255,0.04);
                    border-bottom:1px solid rgba(255,255,255,0.04);">Who they are</td>
         <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04);">
           <span style="font-size:0.85rem;color:#ffcc00;font-weight:700;">${roleLabel(role)}</span>
         </td>
       </tr>`
    : '';

  const phoneRow = phone
    ? `<tr>
         <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;width:34%;
                    border-right:1px solid rgba(255,255,255,0.04);
                    border-bottom:1px solid rgba(255,255,255,0.04);">Phone</td>
         <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04);">
           <a href="tel:${phone.replace(/\s/g,'')}"
              style="font-size:0.88rem;color:#00dcff;font-weight:700;text-decoration:none;">
             ${phone}
           </a>
         </td>
       </tr>`
    : '';

  const whatsappBtn = phone
    ? `<td>
         <a href="https://wa.me/${phone.replace(/\D/g,'')}"
            style="display:inline-block;padding:10px 20px;
                   background:rgba(37,211,102,0.08);border:1px solid rgba(37,211,102,0.22);
                   color:#25d366;font-size:0.8rem;font-weight:700;
                   text-decoration:none;border-radius:8px;">
           💬 WhatsApp
         </a>
       </td>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Resume Requested</title></head>
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
        📄 Resume Requested
      </div>
      <div style="font-size:1.2rem;font-weight:800;color:#fff;margin-top:8px;">
        ${name} just got your resume
      </div>
      <div style="font-size:0.75rem;color:#2e5a6e;margin-top:4px;">${now} IST &nbsp;·&nbsp; Ref ${refId}</div>
      ${role ? `<div style="display:inline-block;margin-top:10px;padding:4px 12px;
                  background:rgba(255,204,0,0.1);border:1px solid rgba(255,204,0,0.3);
                  border-radius:20px;font-size:0.75rem;color:#ffcc00;font-weight:700;">
                  ${roleLabel(role)}
                </div>` : ''}
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
                     border-bottom:1px solid rgba(255,255,255,0.04);">Email</td>
          <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04);">
            <a href="mailto:${email}"
               style="font-size:0.85rem;color:#00dcff;text-decoration:none;">${email}</a>
          </td>
        </tr>
        ${roleRow}
        ${phoneRow}
        <tr style="background:rgba(255,255,255,0.02);">
          <td style="padding:10px 16px;font-size:0.78rem;color:#2e5a6e;">Source</td>
          <td style="padding:10px 16px;font-size:0.85rem;color:#c8e8f8;">${sourceLabel(requestSource)}</td>
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
            <a href="mailto:${email}"
               style="display:inline-block;padding:10px 20px;
                      background:linear-gradient(135deg,#00dcff,#0066ff);
                      color:#fff;font-size:0.8rem;font-weight:700;
                      text-decoration:none;border-radius:8px;">
              ✉️ Email
            </a>
          </td>
          ${whatsappBtn}
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#060c12;padding:12px 26px;border-top:1px solid rgba(0,220,255,0.06);">
      <div style="font-size:0.68rem;color:#12232e;">Portfolio Resume Pipeline · Auto-generated</div>
    </td>
  </tr>

  <!-- Accent bottom -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#ffcc00,#ff9500,#ffcc00);"></td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

/* ─────────────────────────────────────────────────────────
   Main handler
───────────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {

  /* ── CORS ── */
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ── Route by method ── */
  if (req.method === 'GET')  return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);

  return res.status(405).json({ error: 'Method not allowed' });
};

/* ═══════════════════════════════════════════════════════════
   GET — Auth-gated PDF viewer / downloader
   Requires: ?token=<firebaseIdToken>&mode=view|download
═══════════════════════════════════════════════════════════ */
async function handleGet(req, res) {
  const { token, mode } = req.query;
  const isDownload = mode === 'download';

  /* 1. Require token */
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to access the resume.',
    });
  }

  /* 2. Verify Firebase ID token */
  let decoded;
  try {
    const { auth } = getAdmin();
    decoded = await auth.verifyIdToken(token);
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({
      error: 'Invalid or expired session. Please sign in again.',
    });
  }

  /* 3. Log to Firestore — fire-and-forget, never blocks the download */
  try {
    const { db } = getAdmin();
    await db.collection('resumeDownloads').add({
      uid:        decoded.uid,
      email:      decoded.email   || 'unknown',
      name:       decoded.name    || 'Unknown',
      picture:    decoded.picture || '',
      mode:       isDownload ? 'download' : 'view',
      source:     'direct',                                   // vs 'email' from POST
      country:    req.headers['x-vercel-ip-country'] || 'unknown',
      city:       req.headers['x-vercel-ip-city']    || 'unknown',
      accessedAt: FieldValue.serverTimestamp(),
      time:       new Date().toISOString(),
    });
  } catch (err) {
    /* Non-fatal — still serve the PDF even if logging fails */
    console.error('Firestore log failed:', err.message);
  }

  /* 4. Serve the PDF */
  return servePdf(res, isDownload ? 'download' : 'inline');
}

/* ═══════════════════════════════════════════════════════════
   POST — Email resume to a visitor (bio form or chatbot)
   Body: { name: string, email: string, phone?: string, source?: string }
═══════════════════════════════════════════════════════════ */
async function handlePost(req, res) {
  const { name, email, phone, source, role } = req.body || {};

  /* 1. Basic validation — unchanged, so the chatbot's existing
        { name, email } calls keep working exactly as before. */
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }
  /* phone is optional everywhere; only validate shape if provided */
  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
  if (cleanPhone && !/^[0-9+\-\s()]{7,20}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number.' });
  }
  /* source distinguishes where the request came from in Firestore/notification
     emails. Defaults to 'chatbot' so existing chat-assistant calls (which never
     send `source`) are logged exactly the way they were before this change. */
  const requestSource = typeof source === 'string' && source.trim() ? source.trim() : 'chatbot';
  /* role is optional and visitor-supplied via tappable chips (not free text),
     so only accept the known set — anything else is silently dropped. */
  const KNOWN_ROLES = ['developer', 'recruiter', 'client', 'browsing'];
  const cleanRole = typeof role === 'string' && KNOWN_ROLES.includes(role.trim()) ? role.trim() : null;

  /* 2. Load PDF from disk */
  const pdfPath = path.join(process.cwd(), 'resume.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('resume.pdf not found for email at:', pdfPath);
    return res.status(500).json({ success: false, error: 'Resume file not found on server.' });
  }
  const pdfBuffer = fs.readFileSync(pdfPath);

  const refId = makeRefId();
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short',
  });

  /* 3. Send email via Gmail / Nodemailer */
  try {
    const transporter = getTransporter();

    /* ── Email TO the visitor — resume attached, premium branded template ── */
    await transporter.sendMail({
      from:    `"Sahnawaz Ahmed Laskar" <${process.env.GMAIL_USER}>`,
      to:      email,
      replyTo: process.env.GMAIL_USER,
      subject: `Your Requested Resume & Professional Profile — Sahnawaz Ahmed Laskar [Ref: ${refId}]`,
      html: visitorResumeEmail({ name, refId, now, requestSource }),
      attachments: [{
        filename:    'Sahnawaz_Resume.pdf',
        content:     pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    /* ── Notification TO Sahnawaz — premium branded template ── */
    await transporter.sendMail({
      from:    `"Portfolio Bot" <${process.env.GMAIL_USER}>`,
      to:      process.env.GMAIL_USER,   // notify himself
      subject: `📄 Resume requested by ${name}`,
      html: adminResumeEmail({ name, email, phone: cleanPhone, role: cleanRole, refId, now, requestSource }),
    });

  } catch (err) {
    console.error('Nodemailer error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send email. Please try again.' });
  }

  /* 4. Log to Firestore — same collection as GET, mode = 'email' */
  try {
    const { db } = getAdmin();
    await db.collection('resumeDownloads').add({
      uid:          null,               // no Firebase auth in the email flow
      name:         name,
      email:        email,
      phone:        cleanPhone || null,
      role:         cleanRole || null,
      picture:      '',
      mode:         'email',            // distinguishes from 'view' / 'download'
      source:       requestSource,      // 'chatbot' or 'bio-cta'
      refId:        refId,
      country:      req.headers['x-vercel-ip-country'] || 'unknown',
      city:         req.headers['x-vercel-ip-city']    || 'unknown',
      accessedAt:   FieldValue.serverTimestamp(),
      time:         new Date().toISOString(),
    });
  } catch (err) {
    /* Non-fatal — email already sent, just log the failure */
    console.error('Firestore log failed:', err.message);
  }

  return res.status(200).json({ success: true });
}

/* ─────────────────────────────────────────────────────────
   Shared helper — read and serve resume.pdf
   disposition: 'inline' (view in browser) | 'download' (force save)
───────────────────────────────────────────────────────── */
function servePdf(res, disposition) {
  const pdfPath = path.join(process.cwd(), 'resume.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error('resume.pdf not found at:', pdfPath);
    return res.status(404).json({ error: 'Resume file not found.' });
  }

  const pdfBuffer  = fs.readFileSync(pdfPath);
  const headerDisp = disposition === 'download'
    ? 'attachment; filename="Sahnawaz_Resume.pdf"'
    : 'inline;     filename="Sahnawaz_Resume.pdf"';

  res.setHeader('Content-Type',        'application/pdf');
  res.setHeader('Content-Disposition', headerDisp);
  res.setHeader('Content-Length',      pdfBuffer.length);
  res.setHeader('Cache-Control',       'private, no-store'); // always re-auth, never cache
  return res.status(200).end(pdfBuffer);
}
