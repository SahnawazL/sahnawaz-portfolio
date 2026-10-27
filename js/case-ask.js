/* ============================================================
   ASK THIS PROJECT — the question box inside each case study
   (rendered by js/portfolio-04.js → askHtml). Answers come only from that
   case study's own facts; when they don't cover a question, the answer
   says so instead of guessing.

   Server: POST /api/chat { source:'case-ask', caseKey, message, caseHistory }
           → { ok, answer, covered, followUps[] }
   Everything from the server is inserted as text, never as HTML.
   ============================================================ */
(function () {
  'use strict';
  var API = 'https://sahnawaz-portfolio.vercel.app/api/chat';
  var histories = {};   // caseKey → last few { q, a } for follow-up questions
  var busy = false;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function ask(box, question) {
    var q = String(question || '').trim();
    if (!q || busy) return;
    var key = box.getAttribute('data-ca-key');
    var thread = box.querySelector('.ca-thread');
    var input = box.querySelector('.ca-input');
    var send = box.querySelector('.ca-send');
    busy = true; send.disabled = true; input.value = '';

    thread.appendChild(el('div', 'ca-q', q));
    var a = el('div', 'ca-a');
    var dots = el('span', 'ca-typing'); dots.appendChild(el('i')); dots.appendChild(el('i')); dots.appendChild(el('i'));
    a.appendChild(dots);
    thread.appendChild(a);
    a.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'case-ask', caseKey: key, message: q.slice(0, 300), caseHistory: (histories[key] || []).slice(-2), history: [] }),
      signal: ctl ? ctl.signal : undefined
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false, reason: r.status === 429 ? 'busy' : 'ai' }; }); })
      .then(function (d) {
        a.textContent = '';
        if (!d || !d.ok) {
          a.classList.add('ca-miss');
          a.appendChild(el('span', 'ca-tag', 'Not available'));
          a.appendChild(document.createTextNode(d && (d.busy || d.reason === 'busy')
            ? 'The AI is busy right now — please try again in a moment.'
            : 'I couldn’t answer that just now. Please try again.'));
          return;
        }
        if (!d.covered) a.classList.add('ca-miss');
        a.appendChild(el('span', 'ca-tag', d.covered ? 'From this case study' : 'Not covered here'));
        a.appendChild(document.createTextNode(d.answer));
        if (!d.covered) {
          var more = el('span', 'ca-more');
          var link = el('a', null, 'Ask Sahnawaz directly →'); link.href = '#contact';
          link.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof window.closeCaseStudy === 'function') window.closeCaseStudy();
            setTimeout(function () { var c = document.getElementById('contact'); if (c) c.scrollIntoView({ behavior: 'smooth' }); }, 250);
          });
          more.appendChild(link); a.appendChild(more);
        } else {
          (histories[key] = histories[key] || []).push({ q: q, a: d.answer });
          if (histories[key].length > 4) histories[key].shift();
        }
        var chips = box.querySelector('.ca-chips');
        if (chips && d.followUps && d.followUps.length) {
          chips.textContent = '';
          d.followUps.forEach(function (f) { var c = el('button', 'ca-chip', f); c.type = 'button'; c.setAttribute('data-ca-q', f); chips.appendChild(c); });
        }
        try { if (window.gtag) gtag('event', 'case_ask', { case_key: key, covered: !!d.covered }); } catch (e) {}
      })
      .catch(function () {
        a.textContent = '';
        a.classList.add('ca-miss');
        a.appendChild(el('span', 'ca-tag', 'Not available'));
        a.appendChild(document.createTextNode('That took too long or the connection dropped. Please try again.'));
      })
      .then(function () { clearTimeout(timer); busy = false; send.disabled = false; });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target.closest && e.target.closest('.ca-form');
    if (!form) return;
    e.preventDefault();
    var box = form.closest('.ca-box');
    ask(box, form.querySelector('.ca-input').value);
  });
  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('.ca-chip');
    if (!chip) return;
    ask(chip.closest('.ca-box'), chip.getAttribute('data-ca-q'));
  });
})();
