/* ============================================================
   JOB FIT CHECK — #job-fit
   A recruiter pastes a job description; the AI compares it with the facts
   on this site and returns an honest report: fit level, score, where he
   matches (with evidence), the gaps, and questions to ask in an interview.

   Server: POST /api/chat  { source:'fit', message:<job description> }
           → { ok:true, result:{ role, fit, score, summary, matches[], gaps[], interview[] } }
   Every string from the server is escaped before it is shown.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('job-fit');
  if (!root) return;

  var API = 'https://sahnawaz-portfolio.vercel.app/api/chat';
  var MAX = 6000, MIN = 80;
  var $ = function (id) { return document.getElementById(id); };
  var text = $('jfText'), count = $('jfCount'), go = $('jfGo'), sample = $('jfSample'),
      loading = $('jfLoading'), loadMsg = $('jfLoadMsg'), err = $('jfError'), out = $('jfResult');
  if (!text || !go) return;
  var nameEl = $('jfName'), compEl = $('jfCompany'), whoBox = $('jfWho'), signedBox = $('jfSigned');

  /* Who is checking: a signed-in visitor's Google name and e-mail, otherwise the
     name typed here (required) and an optional company. Sent to Sahnawaz with
     the report only — never shown on a shared report. */
  function profile() { var v = window._visitorProfile; return v && v.name ? v : null; }
  function syncWho() {
    var v = profile();
    if (v) {
      whoBox.hidden = true;
      signedBox.hidden = false;
      signedBox.innerHTML = '✓ Checking as <b>' + esc(v.name) + '</b>' + (v.email ? ' (' + esc(v.email) + ')' : '');
    } else { whoBox.hidden = false; signedBox.hidden = true; }
    updateCount();
  }
  function who() {
    var v = profile();
    if (v) return { name: v.name, email: v.email || '', company: '', signedIn: true };
    return { name: (nameEl.value || '').trim(), email: '', company: (compEl.value || '').trim(), signedIn: false };
  }
  function nameOk() { return !!profile() || (nameEl.value || '').trim().length >= 2; }

  var COLORS = { strong: '#4ade80', good: '#38bdf8', partial: '#fbbf24', low: '#f87171' };
  var LABELS = { strong: 'Strong fit', good: 'Good fit', partial: 'Partial fit', low: 'Low fit' };
  var SAMPLE = 'Frontend Developer (React) — Remote, India\n\n'
    + 'We are looking for a frontend developer to build fast, accessible web apps.\n\n'
    + 'Requirements:\n- Strong JavaScript, HTML and CSS\n- 2+ years building with React\n- Experience with REST APIs and Firebase or a similar backend\n'
    + '- Responsive, mobile-first UI and attention to design detail\n- Familiarity with Git and CI/CD\n- Good written communication in English\n\n'
    + 'Nice to have:\n- TypeScript and Next.js\n- Experience integrating AI/LLM APIs\n- Hindi language skills';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function updateCount() {
    var n = text.value.length;
    count.textContent = n.toLocaleString('en-IN') + ' / ' + MAX.toLocaleString('en-IN');
    go.disabled = n < MIN || busy;
    go.title = nameOk() ? '' : 'Please enter your name first';
  }
  var busy = false, last = null, msgTimer = null;

  var STEPS = ['Reading the job description…', 'Comparing it with my projects and experience…', 'Checking each requirement against real evidence…', 'Writing an honest summary…'];
  function startLoading() {
    var i = 0;
    loadMsg.textContent = STEPS[0];
    loading.classList.add('on');
    clearInterval(msgTimer);
    msgTimer = setInterval(function () { i = Math.min(i + 1, STEPS.length - 1); loadMsg.textContent = STEPS[i]; }, 3200);
  }
  function stopLoading() { clearInterval(msgTimer); loading.classList.remove('on'); }

  function list(items, kind) {
    if (!items || !items.length) {
      return '<p class="jf-empty">' + (kind === 'gap' ? 'No clear gaps found for this role.' : 'Nothing clearly matched.') + '</p>';
    }
    return '<ul>' + items.map(function (it) {
      if (kind === 'ask') return '<li><span class="jf-ic">?</span><span>' + esc(it) + '</span></li>';
      return '<li><span class="jf-ic">' + (kind === 'ok' ? '✓' : '!') + '</span><span><b>' + esc(it.requirement) + '</b>'
        + esc(kind === 'ok' ? it.evidence : it.note) + '</span></li>';
    }).join('') + '</ul>';
  }

  var sharedId = null;
  function render(r, opts) {
    opts = opts || {};
    var col = COLORS[r.fit] || '#38bdf8';
    var C = 2 * Math.PI * 38;
    out.style.setProperty('--jf', col);
    out.innerHTML =
      '<div class="jf-top">'
      + '<div class="jf-ring" role="img" aria-label="Fit score ' + r.score + ' out of 100">'
      +   '<svg viewBox="0 0 92 92"><circle class="jf-ring-track" cx="46" cy="46" r="38"/>'
      +   '<circle class="jf-ring-fill" cx="46" cy="46" r="38" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>'
      +   '<div class="jf-ring-num">' + r.score + '<small>of 100</small></div>'
      + '</div>'
      + '<div><span class="jf-level">' + esc(LABELS[r.fit] || r.fit) + '</span>'
      +   '<p class="jf-role">' + esc(r.role) + '</p><p class="jf-summary">' + esc(r.summary) + '</p></div>'
      + '</div>'
      + '<div class="jf-cols">'
      +   '<div class="jf-col ok"><h4>✓ Where he matches</h4>' + list(r.matches, 'ok') + '</div>'
      +   '<div class="jf-col gap"><h4>! Honest gaps</h4>' + list(r.gaps, 'gap') + '</div>'
      +   (r.interview && r.interview.length ? '<div class="jf-col ask"><h4>? Worth asking in an interview</h4>' + list(r.interview, 'ask') + '</div>' : '')
      + '</div>'
      + '<div class="jf-actions">'
      +   '<button type="button" class="jf-act primary" data-jf="resume">📄 Get my resume</button>'
      +   '<button type="button" class="jf-act" data-jf="contact">✉️ Contact me</button>'
      +   '<button type="button" class="jf-act" data-jf="ask">💬 Ask my assistant</button>'
      +   '<button type="button" class="jf-act" data-jf="copy">📋 Copy report</button>'
      +   (sharedId ? '<button type="button" class="jf-act" data-jf="share">🔗 Share report</button>' : '')
      + '</div>'
      + '<p class="jf-disclaimer">AI-generated from the facts on this website only — nothing is added or guessed. Please confirm anything important in a conversation with me.</p>';
    if (opts.shared) {
      var when = opts.createdAt ? new Date(opts.createdAt) : null;
      out.insertAdjacentHTML('afterbegin', '<div class="jf-shared">Shared report' + (when && !isNaN(when) ? ' · created ' + esc(when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : '')
        + ' · paste your own job post above to run a new check</div>');
    }
    out.classList.add('on');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var f = out.querySelector('.jf-ring-fill');
        if (f) f.style.strokeDashoffset = (C * (1 - r.score / 100)).toFixed(1);
      });
    });
    var top = out.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.7 || top < 0) out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function plain(r) {
    var lines = ['Job fit — Sahnawaz Ahmed Laskar', 'Role: ' + r.role, 'Fit: ' + (LABELS[r.fit] || r.fit) + ' (' + r.score + '/100)', '', r.summary, '', 'Where he matches:'];
    r.matches.forEach(function (m) { lines.push('- ' + m.requirement + ': ' + m.evidence); });
    if (r.gaps.length) { lines.push('', 'Gaps:'); r.gaps.forEach(function (g) { lines.push('- ' + g.requirement + (g.note ? ': ' + g.note : '')); }); }
    if (r.interview.length) { lines.push('', 'Worth asking:'); r.interview.forEach(function (q) { lines.push('- ' + q); }); }
    lines.push('', 'Portfolio: https://sahnawaz-portfolio.vercel.app', 'Resume: https://sahnawaz-portfolio.vercel.app/resume.pdf',
      '(AI-generated from the facts on his website.)');
    return lines.join('\n');
  }

  function fail(msg) {
    stopLoading();
    err.textContent = msg;
    err.classList.add('on');
  }

  function run() {
    var jd = text.value.trim();
    if (busy || jd.length < MIN) return;
    if (!nameOk()) {
      nameEl.classList.add('jf-bad'); nameEl.focus();
      err.textContent = 'Please enter your name so I know who ran the check.';
      err.classList.add('on');
      return;
    }
    busy = true; updateCount();
    err.classList.remove('on'); out.classList.remove('on');
    startLoading();
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 40000);
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'fit', message: jd.slice(0, MAX), who: who(), history: [] }),
      signal: ctl ? ctl.signal : undefined
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false, reason: r.status === 429 ? 'busy' : 'ai' }; }); })
      .then(function (d) {
        stopLoading();
        if (d && d.ok && d.result) { last = d.result; sharedId = d.id || null; render(d.result); try { if (window.gtag) gtag('event', 'job_fit_check', { fit: d.result.fit }); } catch (e) {} return; }
        var reason = d && (d.busy ? 'busy' : d.reason);
        fail(reason === 'name' ? 'Please enter your name so I know who ran the check.' : reason === 'short'
          ? 'That looks too short to judge — paste the full job description, including the requirements.'
          : reason === 'busy'
            ? 'The AI is busy right now. Please try again in a minute.'
            : 'I couldn’t finish the check this time. Please try again — or ask my assistant directly.');
      })
      .catch(function () { fail('The check took too long or the connection dropped. Please try again.'); })
      .then(function () { clearTimeout(timer); busy = false; updateCount(); });
  }

  text.addEventListener('input', function () { err.classList.remove('on'); updateCount(); });
  nameEl.addEventListener('input', function () { nameEl.classList.remove('jf-bad'); err.classList.remove('on'); updateCount(); });
  document.addEventListener('shz:visitor', syncWho);
  text.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
  go.addEventListener('click', run);
  if (sample) sample.addEventListener('click', function () { text.value = SAMPLE; updateCount(); text.focus(); });

  out.addEventListener('click', function (e) {
    var b = e.target.closest('[data-jf]');
    if (!b || !last) return;
    var what = b.getAttribute('data-jf');
    if (what === 'resume') {
      /* the same "Get Resume" pop-up as the bio card (emails the resume) */
      if (typeof window.openResumeEmailModal === 'function') window.openResumeEmailModal();
      else { var rb = document.querySelector('[onclick*="openResumeEmailModal"]'); if (rb) rb.click(); }
    } else if (what === 'contact') {
      var c = document.getElementById('contact');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (what === 'ask') {
      if (typeof window.openChat === 'function') window.openChat();
    } else if (what === 'share') {
      if (!sharedId) return;
      var link = 'https://sahnawaz-portfolio.vercel.app/?fit=' + sharedId;
      var flash = function () { b.textContent = '✓ Link copied'; setTimeout(function () { b.textContent = '🔗 Share report'; }, 1800); };
      if (navigator.share) {
        navigator.share({ title: 'Job fit — Sahnawaz Ahmed Laskar', text: last.role + ': ' + (LABELS[last.fit] || last.fit) + ' (' + last.score + '/100)', url: link }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(flash, function () {});
      else window.prompt('Copy this link:', link);
    } else if (what === 'copy') {
      var t = plain(last), done = function () { b.textContent = '✓ Copied'; setTimeout(function () { b.textContent = '📋 Copy report'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {});
      else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (x) {} ta.remove(); }
    }
  });

  /* ?fit=<id> opens a saved report (shared by a recruiter), kept for 30 days */
  (function openShared() {
    var id = null;
    try { id = new URLSearchParams(location.search).get('fit'); } catch (e) {}
    if (!id || !/^[a-z0-9]{10}$/.test(id)) return;
    setTimeout(function () { root.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 300);
    loadMsg.textContent = 'Opening the shared report…';
    loading.classList.add('on');
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'fit-get', message: 'get', id: id, history: [] }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        stopLoading();
        if (d && d.ok && d.result) { last = d.result; sharedId = id; render(d.result, { shared: true, createdAt: d.createdAt }); }
        else fail('This shared report has expired or doesn’t exist. Reports are kept for 30 days — paste the job post to run a new check.');
      })
      .catch(function () { fail('Couldn’t open the shared report right now. Please try again.'); });
  })();

  syncWho();
})();
