// api/resume.js
// Dual-purpose resume handler:
//
//   GET  /api/resume?token=<firebaseIdToken>&mode=view|download
//        — Verifies Firebase ID token, logs to Firestore, serves resume.pdf
//
//   POST /api/resume  { name, email }
//        — Emails resume.pdf as attachment to the requester (chatbot flow)
//        — Notifies Sahnawaz, logs to Firestore
//        — No auth token needed (public chatbot flow)

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
   POST — Email resume to chatbot visitor
   Body: { name: string, email: string }
═══════════════════════════════════════════════════════════ */
async function handlePost(req, res) {
  const { name, email } = req.body || {};

  /* 1. Basic validation */
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  /* 2. Load PDF from disk */
  const pdfPath = path.join(process.cwd(), 'resume.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('resume.pdf not found for email at:', pdfPath);
    return res.status(500).json({ success: false, error: 'Resume file not found on server.' });
  }
  const pdfBuffer = fs.readFileSync(pdfPath);

  /* 3. Send email via Gmail / Nodemailer */
  try {
    const transporter = getTransporter();

    /* ── Email TO the visitor — resume attached ── */
    await transporter.sendMail({
      from:    `"Sahnawaz Ahmed" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: `Here's Sahnawaz's Resume, ${name}! 📄`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#222;">
          <h2 style="color:#0077cc;">Hi ${name}! 👋</h2>
          <p>Thanks for your interest — Sahnawaz's resume is attached to this email.</p>
          <p>Feel free to reach out directly:</p>
          <ul>
            <li>📧 <a href="mailto:shzthedigitalalchemist@gmail.com">shzthedigitalalchemist@gmail.com</a></li>
            <li>🌐 <a href="https://sahnawaz-portfolio.vercel.app">sahnawaz-portfolio.vercel.app</a></li>
          </ul>
          <p style="color:#555;font-size:0.9rem;">He personally reads every message and replies fast. 🚀</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="font-size:0.8rem;color:#aaa;">
            You received this because you requested it via the portfolio chatbot.
          </p>
        </div>
      `,
      attachments: [{
        filename:    'Sahnawaz_Resume.pdf',
        content:     pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    /* ── Notification TO Sahnawaz — who just requested the resume ── */
    await transporter.sendMail({
      from:    `"Portfolio Bot" <${process.env.GMAIL_USER}>`,
      to:      process.env.GMAIL_USER,   // notify himself
      subject: `📄 Resume requested by ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#222;">
          <h2 style="color:#0077cc;">Someone just requested your resume 👀</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Name</td>
                <td style="padding:6px 12px;">${name}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Email</td>
                <td style="padding:6px 12px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Time</td>
                <td style="padding:6px 12px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Source</td>
                <td style="padding:6px 12px;">Chatbot — email flow</td></tr>
          </table>
          <p style="margin-top:20px;">Their resume has been auto-sent. You can follow up directly. 🚀</p>
        </div>
      `,
    });

  } catch (err) {
    console.error('Nodemailer error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send email. Please try again.' });
  }

  /* 4. Log to Firestore — same collection as GET, mode = 'email' */
  try {
    const { db } = getAdmin();
    await db.collection('resumeDownloads').add({
      uid:          null,               // no Firebase auth in chatbot flow
      name:         name,
      email:        email,
      picture:      '',
      mode:         'email',            // distinguishes from 'view' / 'download'
      source:       'chatbot',
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
