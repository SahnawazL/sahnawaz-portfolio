/* ==== index.html line 6226 ==== */

  (function(){
    var _wizAnswers = [null, null, null]; // [projectType, budget, timeline]
    var _wizStep    = 0;

    /* Pricing reference (mirrors your meta tags) */
    var _pricing = {
      'Website / Landing Page':   { range: '₹9,999 – ₹14,999', time: '2–3 weeks' },
      'E-Commerce Store':         { range: '₹14,999 – ₹24,999', time: '3–5 weeks' },
      'UI/UX Design (Figma)':     { range: '₹3,999/screen',     time: '1–2 weeks' },
      'Portfolio Website':        { range: '₹6,999 – ₹9,999',   time: '1–2 weeks' },
      'AI Integration':           { range: '₹2,999 – ₹7,999',   time: '1–3 weeks' },
      'Something Else':           { range: 'Custom quote',       time: 'Varies'    }
    };

    function _dot(i, state) {
      var d = document.getElementById('ctWizDot' + i);
      if (!d) return;
      d.className = 'ct-wiz-dot' + (state === 'active' ? ' ct-wiz-dot-active' : state === 'done' ? ' ct-wiz-dot-done' : '');
    }

    function _showStep(n) {
      for (var i = 0; i < 3; i++) {
        var s = document.getElementById('ctWizStep' + i);
        if (s) s.className = 'ct-wiz-step' + (i === n ? ' ct-wiz-active' : '');
        _dot(i, i < n ? 'done' : i === n ? 'active' : '');
      }
      _wizStep = n;
    }

    /* ── Wizard click sound (Web Audio API — no external file needed) ── */
    function _playWizSound(type) {
      try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();

        function note(freq, startT, dur, vol, oscType) {
          var o = ctx.createOscillator();
          var g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = oscType || 'sine';
          o.frequency.setValueAtTime(freq, startT);
          g.gain.setValueAtTime(0.001, startT);
          g.gain.linearRampToValueAtTime(vol, startT + 0.015);
          g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
          o.start(startT); o.stop(startT + dur);
          o.onended = function() { try { ctx.close(); } catch(e) {} };
        }

        var t = ctx.currentTime;

        if (type === 'step0') {
          /* Step 1 — soft bubble pop: quick low-to-high blip */
          note(400, t,        0.06, 0.12, 'sine');
          note(700, t + 0.05, 0.10, 0.10, 'sine');
        } else if (type === 'step1') {
          /* Step 2 — smooth double ding: two clean chime notes */
          note(660, t,        0.22, 0.14, 'sine');
          note(880, t + 0.14, 0.22, 0.12, 'sine');
        } else if (type === 'step2') {
          /* Step 3 — satisfying triple chime: ascending notification */
          note(523, t,        0.20, 0.13, 'sine');
          note(659, t + 0.13, 0.20, 0.12, 'sine');
          note(784, t + 0.26, 0.28, 0.14, 'sine');
        } else {
          /* Back — subtle soft pop: gentle descending bubble */
          note(500, t,        0.08, 0.10, 'sine');
          note(320, t + 0.06, 0.12, 0.08, 'sine');
        }
      } catch(e) {}
    }

    window.ctWizPick = function(step, value) {
      _playWizSound('step' + step);
      /* Highlight selected */
      var stepEl = document.getElementById('ctWizStep' + step);
      if (stepEl) {
        stepEl.querySelectorAll('.ct-wiz-opt').forEach(function(b){
          b.classList.toggle('ct-wiz-selected', b.textContent.trim().indexOf(value.replace(/[^a-zA-Z]/g,'').slice(0,6)) > -1 || b.getAttribute('onclick').indexOf(value) > -1);
        });
      }

      _wizAnswers[step] = value;

      if (step < 2) {
        /* Small delay so selection highlight is visible */
        setTimeout(function(){ _showStep(step + 1); }, 220);
      } else {
        /* All 3 answered — hide wizard, show quote */
        setTimeout(function(){ _allAnswered(); }, 220);
      }
    };

    function _allAnswered() {
      /* Hide wizard */
      var wiz = document.getElementById('ctWizard');
      if (wiz) wiz.classList.add('ct-wiz-hidden');

      /* Show quote card with thinking state */
      var card = document.getElementById('ctQuoteCard');
      var thinking = document.getElementById('ctQuoteThinking');
      var quoteText = document.getElementById('ctQuoteText');
      if (card) card.classList.add('ct-quote-visible');
      if (thinking) thinking.style.display = 'flex';
      if (quoteText) quoteText.style.display = 'none';

      /* Call Groq via your existing /api/chat endpoint */
      var project  = _wizAnswers[0];
      var budget   = _wizAnswers[1];
      var timeline = _wizAnswers[2];
      var pricing  = _pricing[project] || { range: 'Custom quote', time: 'Varies' };

      /* Call Groq via wizard fast-path — source:'wizard' triggers lean prompt + CAT strip */
      var wizPrompt = 'Project: ' + project + ' | Budget: ' + budget + ' | Timeline: ' + timeline
        + ' | Pricing reference: ' + pricing.range + ', delivery ' + pricing.time + '.';

      fetch('https://sahnawaz-portfolio.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: wizPrompt,
          history: [],
          visitorName: null,
          source: 'wizard'
        })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        var reply = (data && data.reply) ? data.reply.trim() : null;
        if (!reply) throw new Error('empty');
        _showQuote(reply, project, budget, timeline);
      })
      .catch(function(){
        /* Fallback — only if network fails entirely */
        var fallback = '**' + pricing.range + '** is the estimated range for a ' + project
          + ', with typical delivery in **' + pricing.time + '**.'
          + ' Fill in the form below and Sahnawaz will send you an exact proposal within 24 hours.';
        _showQuote(fallback, project, budget, timeline);
      });
    }

    function _showQuote(text, project, budget, timeline) {
      var thinking  = document.getElementById('ctQuoteThinking');
      var quoteText = document.getElementById('ctQuoteText');
      if (thinking)  thinking.style.display = 'none';
      if (quoteText) {
        quoteText.style.display = 'block';
        quoteText.innerHTML = text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/₹[\d,]+\s*–?\s*₹?[\d,]*/g, function(m){ return '<strong>' + m + '</strong>'; });
      }

      /* Auto-fill name + email from Firebase visitor session if logged in */
      try {
        var _sv = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null');
        if (_sv && _sv.uid) {
          var nameField  = document.getElementById('name');
          var emailField = document.getElementById('email');
          if (nameField && _sv.firstName && !nameField.value) {
            nameField.value = _sv.firstName;
            nameField.dispatchEvent(new Event('input'));
          }
          if (emailField && _sv.email && !emailField.value) {
            emailField.value = _sv.email;
            emailField.dispatchEvent(new Event('input'));
          }
        }
      } catch(e) {}

      /* Pre-fill the message textarea */
      var msgField = document.getElementById('message');
      if (msgField) {
        msgField.value = 'Project: ' + project + '\nBudget: ' + budget + '\nTimeline: ' + timeline + '\n\nAdditional details: ';
        msgField.dispatchEvent(new Event('input'));
      }

      /* Show the actual form */
      var formInner = document.getElementById('ctFormInner');
      if (formInner) {
        formInner.classList.add('ct-form-ready');
        /* Smooth scroll to form */
        setTimeout(function(){
          formInner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }

      /* Hide the teaser now that the real form is showing */
      var teaser = document.getElementById('ctFormTeaser');
      if (teaser) teaser.classList.add('ct-hide');
    }

    window.ctWizBack = function() {
      _playWizSound('back');
      if (_wizStep === 0) return; // already on first step
      var prevStep = _wizStep - 1;

      /* Clear the answer for current step */
      _wizAnswers[_wizStep] = null;

      /* Unselect all options on current step */
      var curEl = document.getElementById('ctWizStep' + _wizStep);
      if (curEl) curEl.querySelectorAll('.ct-wiz-opt').forEach(function(b){
        b.classList.remove('ct-wiz-selected');
      });

      _showStep(prevStep);
    };

    window.ctWizReset = function() {
      /* Reset all answers */
      _wizAnswers = [null, null, null];

      /* Hide quote card */
      var card = document.getElementById('ctQuoteCard');
      if (card) card.classList.remove('ct-quote-visible');

      /* Hide form */
      var formInner = document.getElementById('ctFormInner');
      if (formInner) formInner.classList.remove('ct-form-ready');

      /* Bring the teaser back */
      var teaser = document.getElementById('ctFormTeaser');
      if (teaser) teaser.classList.remove('ct-hide');

      /* Clear pre-filled fields — but only if not logged in */
      try {
        var _sv = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null');
        if (!(_sv && _sv.uid)) {
          var nf = document.getElementById('name');
          var ef = document.getElementById('email');
          if (nf) { nf.value = ''; nf.dispatchEvent(new Event('input')); }
          if (ef) { ef.value = ''; ef.dispatchEvent(new Event('input')); }
        }
      } catch(e) {}

      /* Clear pre-filled message */
      var msgField = document.getElementById('message');
      if (msgField) { msgField.value = ''; msgField.dispatchEvent(new Event('input')); }

      /* Show wizard from step 0 */
      var wiz = document.getElementById('ctWizard');
      if (wiz) wiz.classList.remove('ct-wiz-hidden');
      _showStep(0);

      /* Unselect all options */
      document.querySelectorAll('.ct-wiz-opt').forEach(function(b){ b.classList.remove('ct-wiz-selected'); });
    };

    /* Also patch ctResetForm to bring wizard back */
    var _origCtResetForm = window.ctResetForm;
    window.ctResetForm = function() {
      if (_origCtResetForm) _origCtResetForm();
      ctWizReset();
    };

  })();
  