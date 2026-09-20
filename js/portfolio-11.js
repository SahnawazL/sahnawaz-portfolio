/* ==== index.html line 14217 ==== */

(function(){
  var RESUME_API = 'https://sahnawaz-portfolio.vercel.app/api/resume';

  var modal        = document.getElementById('resumeGateModal');
  var closeBtn     = document.getElementById('resumeGateClose');
  var skipBtn      = document.getElementById('resumeGateSkip');
  var form         = document.getElementById('resumeGateForm');
  var successEl    = document.getElementById('rgSuccess');
  var sentToEl     = document.getElementById('rgSentTo');
  var successMeta  = document.getElementById('rgSuccessMeta');
  var doneBtn      = document.getElementById('rgDoneBtn');
  var againBtn     = document.getElementById('rgAgainBtn');
  var nameEl       = document.getElementById('rgName');
  var emailEl      = document.getElementById('rgEmail');
  var phoneEl      = document.getElementById('rgPhone');
  var honeypotEl   = document.getElementById('rgHoneypot');
  var statusEl     = document.getElementById('rgStatus');
  var submitBtn    = document.getElementById('rgSubmitBtn');
  var submitLabel  = document.getElementById('rgSubmitLabel');
  var roleGroup    = document.getElementById('rgRoleGroup');
  var roleInput    = document.getElementById('rgRole');
  var nameErrorEl  = document.getElementById('rgNameError');
  var emailErrorEl = document.getElementById('rgEmailError');

  /* Strict email check — not just "@ + dot + letters".
     1) The shape must match a real address: no spaces, no leading/
        trailing/double dots, valid local-part characters, valid
        domain labels.
     2) The TLD (the part after the last dot, or the last two labels
        for things like "co.in"/"com.au") must be a TLD that actually
        exists — this is what catches nonsense like
        "name@domain.codhtroriritif" that a plain regex would accept. */
  var ONE_PART_TLDS = ['com','net','org','edu','gov','mil','int','co','io','ai',
    'app','dev','tech','xyz','online','site','store','blog','info','biz','me',
    'tv','cc','name','pro','mobi','asia','cloud','live','news','agency','digital',
    'email','expert','works','world','life','today','solutions','systems','network',
    'services','software','studio','team','tools','zone','shop','club','fun','vip',
    'top','link','click','run','page','wiki','games','media','group','company',
    'center','city','education','institute','academy','training',
    'in','us','uk','ca','au','de','fr','jp','cn','ru','br','mx','es','it','nl',
    'se','no','fi','dk','pl','ch','at','be','pt','gr','ie','nz','sg','hk','tw',
    'kr','id','my','ph','th','vn','ae','sa','za','ng','ke','eg','tr','il','pk',
    'bd','lk','np'];
  var TWO_PART_TLDS = ['co.in','co.uk','co.jp','co.nz','co.za','com.au','com.br',
    'com.sg','com.hk','com.mx','com.tr','org.in','net.in','gov.in','edu.in','ac.in',
    'ac.uk','gov.uk','org.uk'];

  var EMAIL_SHAPE_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  function isValidEmail(v) {
    if (!v || /\s/.test(v)) return false;
    if (v.indexOf('..') !== -1) return false;
    if (!EMAIL_SHAPE_RE.test(v)) return false;

    var domain = v.slice(v.lastIndexOf('@') + 1).toLowerCase();
    var labels = domain.split('.');
    if (labels.length < 2) return false;

    var last2 = labels.slice(-2).join('.');
    var last1 = labels[labels.length - 1];
    if (TWO_PART_TLDS.indexOf(last2) !== -1) return true;
    if (ONE_PART_TLDS.indexOf(last1) !== -1) return true;
    return false;
  }

  /* Re-checks name + email on every keystroke, paints inline errors
     directly under the offending field, and keeps the submit button
     disabled until both are valid — this runs the same way whether
     the fields were typed fresh or came pre-filled from a signed-in
     session, so being logged in never bypasses validation. */
  function validateForm() {
    var name  = (nameEl.value  || '').trim();
    var email = (emailEl.value || '').trim();

    var nameTouched  = name.length > 0;
    var emailTouched = email.length > 0;
    var nameOk  = nameTouched;
    var emailOk = emailTouched && isValidEmail(email);

    nameEl.classList.toggle('rg-invalid', nameTouched && !nameOk);
    if (nameErrorEl) nameErrorEl.classList.toggle('rg-show', nameTouched && !nameOk);

    emailEl.classList.toggle('rg-invalid', emailTouched && !emailOk);
    if (emailErrorEl) emailErrorEl.classList.toggle('rg-show', emailTouched && !emailOk);

    var formValid = nameOk && emailOk;
    if (submitBtn) submitBtn.disabled = !formValid;
    return formValid;
  }

  if (nameEl)  nameEl.addEventListener('input', validateForm);
  if (emailEl) emailEl.addEventListener('input', validateForm);
  if (emailEl) emailEl.addEventListener('blur', validateForm);

  /* Tap a chip to pick it, tap again to clear — stays fully optional */
  if (roleGroup) {
    roleGroup.addEventListener('click', function (e) {
      var chip = e.target.closest('.rg-role-chip');
      if (!chip) return;
      var already = chip.classList.contains('rg-role-selected');
      var chips = roleGroup.querySelectorAll('.rg-role-chip');
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove('rg-role-selected');
      if (already) {
        roleInput.value = '';
      } else {
        chip.classList.add('rg-role-selected');
        roleInput.value = chip.getAttribute('data-role');
      }
    });
  }

  function showStatus(msg, isError) {
    statusEl.style.display = msg ? 'block' : 'none';
    statusEl.textContent   = msg || '';
    statusEl.style.color   = isError ? '#ff8b8b' : '#8ef0d0';
  }

  function resetModalUI() {
    form.style.display = '';
    form.reset();
    showStatus('');
    if (successEl) successEl.hidden = true;
    submitBtn.classList.remove('rg-sending');
    submitLabel.textContent = 'Send Me the Resume';
    nameEl.classList.remove('rg-invalid');
    emailEl.classList.remove('rg-invalid');
    if (nameErrorEl)  nameErrorEl.classList.remove('rg-show');
    if (emailErrorEl) emailErrorEl.classList.remove('rg-show');
    if (roleGroup) {
      var chips = roleGroup.querySelectorAll('.rg-role-chip');
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove('rg-role-selected');
    }
    if (roleInput) roleInput.value = '';
    /* Button starts disabled — an empty form is never "valid" whether
       or not the visitor happens to be signed in. */
    submitBtn.disabled = true;
  }

  function openGateModal() {
    resetModalUI();
    /* Pre-fill from an existing chat-assistant visitor record, if any,
       so returning visitors don't have to retype their details. */
    try {
      var sv = JSON.parse(localStorage.getItem('shnz_visitor_v1') || 'null');
      if (sv) {
        if (sv.fullName)  nameEl.value  = sv.fullName;
        else if (sv.firstName) nameEl.value = sv.firstName;
        if (sv.email) emailEl.value = sv.email;
      }
    } catch (e) {}
    /* Whether that pre-fill came from a logged-in session or the form
       is empty for a first-time visitor, run the same check so the
       button only ever unlocks for a real name + a valid email. */
    validateForm();
    modal.classList.add('rg-open');
  }
  function closeGateModal() { modal.classList.remove('rg-open'); }

  /* Public entry point — called by the "Get Resume" button in the bio section */
  window.openResumeEmailModal = openGateModal;

  if (doneBtn) doneBtn.addEventListener('click', closeGateModal);
  if (againBtn) againBtn.addEventListener('click', function(){
    if (successEl) successEl.hidden = true;
    if (form) form.style.display = '';
    submitBtn.classList.remove('rg-sending');
    submitBtn.disabled = true;               /* force re-validation */
    submitLabel.textContent = 'Send Me the Resume';
    if (emailEl) { emailEl.value = ''; try { emailEl.focus(); } catch(e){} }
    showStatus('');
  });

  if (closeBtn) closeBtn.addEventListener('click', closeGateModal);
  if (skipBtn)  skipBtn.addEventListener('click', closeGateModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeGateModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('rg-open')) closeGateModal();
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Bot check — real visitors never fill this hidden field */
      if (honeypotEl && honeypotEl.value) { closeGateModal(); return; }

      /* Final guard — mirrors the live per-keystroke check so a
         disabled button can never be forced past via Enter or a
         programmatic submit. */
      if (!validateForm()) { return; }

      var name  = (nameEl.value  || '').trim();
      var email = (emailEl.value || '').trim();
      var phone = (phoneEl.value || '').trim();

      submitBtn.disabled = true;
      submitBtn.classList.add('rg-sending');
      submitLabel.innerHTML = 'Sending<span class="rg-dots"></span>';
      showStatus('');
      var sendStarted = Date.now();

      var payload = { name: name, email: email, source: 'bio-cta' };
      if (phone) payload.phone = phone;
      if (roleInput && roleInput.value) payload.role = roleInput.value;

      fetch(RESUME_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (res.ok && res.data && res.data.success) {
          /* Hold the sending animation briefly if the API replied almost
             instantly: a flash of 'Sending' followed by an immediate jump
             reads as a glitch rather than as work being done. */
          var elapsed = Date.now() - sendStarted;
          setTimeout(function(){
            submitBtn.classList.remove('rg-sending');
            form.style.display = 'none';
            showStatus('');
            if (sentToEl)    sentToEl.textContent = email;
            if (successMeta) successMeta.textContent =
              'Delivered ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            if (successEl) {
              successEl.hidden = false;
              if (doneBtn) { try { doneBtn.focus(); } catch(e){} }
            }
            /* No auto-close: the visitor dismisses it themselves. */
          }, Math.max(0, 900 - elapsed));
        } else {
          submitBtn.classList.remove('rg-sending');
          submitBtn.disabled = false;
          submitLabel.textContent = 'Send Me the Resume';
          showStatus((res.data && res.data.error) || 'Something went wrong. Please try again or email shzthedigitalalchemist@gmail.com directly.', true);
        }
      })
      .catch(function () {
        submitBtn.classList.remove('rg-sending');
        submitBtn.disabled = false;
        submitLabel.textContent = 'Send Me the Resume';
        showStatus('Network error. Please try again or email shzthedigitalalchemist@gmail.com directly.', true);
      });
    });
  }
})();


/* ==== index.html line 14466 ==== */

/* ── Pause off-screen infinite animations ──────────────────────────────
   This page has ~140 small decorative animations (shimmer/glow/pulse
   effects on headers, badges, cards, icons) declared to run "infinite" —
   forever, continuously, whether or not the element is even visible.
   At any given scroll position only a small fraction of them are on
   screen, so the rest are pure wasted work: repainting elements nobody
   can see, competing with scrolling and click interactions for the main
   thread. This pauses each one the moment it scrolls out of view and
   resumes it (with a little buffer, so it's already running again just
   before it re-enters the viewport) rather than touching any of the 140
   individual animations directly — safer than rewriting each one, and
   covers new ones automatically without needing to be listed by name.
   One-shot entrance animations (word reveals, pop-ins, etc.) aren't
   "infinite", so they're untouched — this only ever affects things that
   would otherwise run forever regardless of visibility. */
(function(){
  function isInfinite(cs){
    return cs.animationName !== 'none' && cs.animationIterationCount.indexOf('infinite') !== -1;
  }

  function start(){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { rootMargin: '150px 0px 150px 0px', threshold: 0 });

    function considerAndObserve(el){
      var cs = getComputedStyle(el);
      if (isInfinite(cs)) io.observe(el);
    }

    /* Initial sweep of everything already on the page */
    document.querySelectorAll('*').forEach(considerAndObserve);

    /* Cover elements added later — chat replies, dynamically built cards,
       anything rendered after this initial sweep runs */
    var mo = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(node){
          if (node.nodeType !== 1) return;
          considerAndObserve(node);
          if (node.querySelectorAll) node.querySelectorAll('*').forEach(considerAndObserve);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* Defer the initial full-page scan to idle time so it never competes
     with the critical first render/paint. */
  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 3000 });
  } else {
    setTimeout(start, 1500);
  }
})();
