/* scripts/minify-css.js — run by Vercel while deploying (package.json "build").

   Makes the stylesheets smaller for visitors without changing what they do:
   it only removes comments and extra spaces. The files in the repository stay
   exactly as written (readable, with comments) — only the copies Vercel
   serves are shrunk. Google's PageSpeed counted ~31 KB that could be saved,
   all of it on the files the page waits for before it can first appear.

   Safety:
   - Runs only inside a Vercel build (VERCEL=1), so running "npm run build"
     on a computer never rewrites the source files.
   - Text inside quotes and url(...) is copied untouched.
   - If anything about a file looks wrong, that file is left as it was, and
     the script never fails the deploy. */
'use strict';
const fs = require('fs');
const path = require('path');

function minify(css) {
  let out = '', i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    /* quoted strings: copy as-is (with escapes) */
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) { if (css[j] === '\\') j++; if (css[j] === '\n') break; j++; }
      out += css.slice(i, j + 1); i = j + 1; continue;
    }
    /* url( ... ) without quotes: copy as-is up to the closing ) */
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      let j = i + 4;
      while (j < n && /\s/.test(css[j])) j++;
      if (css[j] !== '"' && css[j] !== "'") {
        const k = css.indexOf(')', j);
        if (k < 0) throw new Error('unclosed url(');
        out += css.slice(i, k + 1); i = k + 1; continue;
      }
    }
    /* comments are dropped; a space is kept only where removing the
       comment would glue two words or numbers into one, as in "0 auto" */
    if (c === '/' && css[i + 1] === '*') {
      const k = css.indexOf('*/', i + 2);
      if (k < 0) throw new Error('unclosed comment');
      const prev = out[out.length - 1] || '', next = css[k + 2] || '';
      if (/[A-Za-z0-9_-]/.test(prev) && /[A-Za-z0-9_-]/.test(next)) out += ' ';
      i = k + 2; continue;
    }
    /* runs of whitespace → one space */
    if (/\s/.test(c)) {
      let j = i; while (j < n && /\s/.test(css[j])) j++;
      out += ' '; i = j; continue;
    }
    out += c; i++;
  }
  /* no space next to { } ; — outside strings/urls only: do it on tokens we produced */
  return tidy(out).trim();
}
/* remove spaces around { } ; but never inside strings or url() */
function tidy(s) {
  let out = '', i = 0;
  const n = s.length;
  const drop = (ch) => ch === '{' || ch === '}' || ch === ';';
  while (i < n) {
    const c = s[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && s[j] !== c) { if (s[j] === '\\') j++; j++; }
      out += s.slice(i, j + 1); i = j + 1; continue;
    }
    if ((c === 'u' || c === 'U') && /^url\(/i.test(s.slice(i, i + 4))) {
      const k = s.indexOf(')', i); out += s.slice(i, k + 1); i = k + 1; continue;
    }
    if (c === ' ') {
      const prev = out[out.length - 1], next = s[i + 1];
      if (prev === undefined || drop(prev) || drop(next)) { i++; continue; }
    }
    out += c; i++;
  }
  return out;
}

/* count { and } that are real CSS (not inside comments or quotes) */
function braces(css) {
  let open = 0, close = 0, i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') { const k = css.indexOf('*/', i + 2); i = k < 0 ? n : k + 2; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && css[j] !== c) { if (css[j] === '\\') j++; j++; } i = j + 1; continue; }
    if (c === '{') open++; else if (c === '}') close++;
    i++;
  }
  return { open: open, close: close };
}

function run() {
  if (process.env.VERCEL !== '1' && !process.env.FORCE_MINIFY_DIR) {
    console.log('[minify-css] not a Vercel build — leaving the CSS files alone');
    return;
  }
  const dir = process.env.FORCE_MINIFY_DIR || path.join(__dirname, '..', 'css');
  let saved = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.css')) continue;
    const p = path.join(dir, f);
    try {
      const src = fs.readFileSync(p, 'utf8');
      const min = minify(src);
      /* sanity: exactly the same { and } as the original (outside comments
         and quotes), and not suspiciously small */
      const a = braces(src), b = braces(min);
      if (a.open !== b.open || a.close !== b.close || min.length < src.length * 0.3) throw new Error('sanity check failed');
      fs.writeFileSync(p, min);
      saved += src.length - min.length;
      console.log('[minify-css] ' + f + ': ' + src.length + ' → ' + min.length + ' bytes');
    } catch (e) {
      console.log('[minify-css] ' + f + ' left as it was: ' + (e && e.message));
    }
  }
  console.log('[minify-css] saved ' + Math.round(saved / 1024) + ' KB before compression');
}

try { run(); } catch (e) { console.log('[minify-css] skipped: ' + (e && e.message)); }
module.exports = { minify };
