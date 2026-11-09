/* ============================================================
   3-MINUTE TOUR — a guided, narrated walk through the site.
   Any element with [data-tour] starts it (hero pill, Ctrl+K, chat chip,
   /tour short link). The first stop asks what the visitor came for, and they
   get a path to match (ROUTES). The page flies to each stop, gets a spotlight in its own
   colour, a caption, quick actions, and is read aloud from small pre-made
   clips (audio/tour/, made by .github/workflows/tour-voice.yml from these
   captions); the live voice (/api/speak) is a fallback. While a stop is read
   the page keeps gliding: through a tall section, or to the card the voice
   has just named (beats). A driving electronic track, made live in the browser, runs
   underneath and follows the tour: flights land on the beat, each stop has its
   own energy, the voice enters on a beat, and the music breathes around the
   voice's real loudness. Touching the page hands the scroll back to the visitor. Muted or without sound,
   captions advance on a timer. The clips carry word timings (the
   gliding highlight) and a loudness track (the voice orb and the waveform).
   The last stop ends on a short "That's the tour" card.
   Keys: → / Space next, ← back, Esc close.
   ============================================================ */
(function () {
  'use strict';
  if (window.shzTour) return;

  var SPEAK = 'https://sahnawaz-portfolio.vercel.app/api/speak';
  var WA = 'https://wa.me/917339203154';
  var GH = 'https://github.com/SahnawazL';
  /* Narration made in advance (one small MP3 per stop, scripts/tour-voice):
     a clip is used only when its text matches the caption exactly; otherwise
     the live voice above, and failing that, captions on a timer. */
  var CLIPS = '/audio/tour/', CLIP_LEAD = .25;   // the clips open with this much silence
  var clipList = null;
  /* every network wait has a time limit, so the tour can never hang on one */
  function timed(ms, run) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    return new Promise(function (ok, no) {
      var t = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) {} no(new Error('timeout')); }, ms);
      run(ctl ? ctl.signal : undefined).then(function (v) { clearTimeout(t); ok(v); }, function (e) { clearTimeout(t); no(e); });
    });
  }
  function clips() {
    if (!clipList) clipList = timed(6000, function (sig) {
      return fetch(CLIPS + 'manifest.json', { cache: 'no-cache', signal: sig }).then(function (r) { return r.ok ? r.json() : null; });
    })
      .then(function (m) { return (m && m.clips) || []; })
      .catch(function () { clipList = null; return []; });
    return clipList;
  }
  function clipFor(i) {
    return clips().then(function (list) {
      for (var k = 0; k < list.length; k++) {
        var c = list[k];
        if (c.i === STEPS[i].id && c.text === STEPS[i].say) {
          return { url: CLIPS + c.file, net: CLIPS + c.file, words: c.words || null, seconds: c.seconds || 0,
            env: typeof c.env === 'string' && c.env.length ? c.env : null, fps: c.fps || 25 };
        }
      }
      return null;
    });
  }

  /* acc: the stop's colour (spotlight, card tint, highlight, waveform)
     acts: quick actions; tapping one ends the tour and goes there */
  /* e: the music's energy here (1 calm, 2 full, 3 peak); key: its shift in semitones
     beats: at the word that starts with `at`, the page glides to `sel`, or to
     the card (`find`) containing the text `has`, and the spotlight moves onto it.
     tap: then the tour uses that card the way a visitor would (see DEMO); all
     of it is put back when the stop ends. stay: leave the page and spotlight put. */
  var STEPS = [
    { k: 'hi', sel: '#heroStatsBar', e: 1, key: 0, title: 'Hi, I’m Sahnawaz', acc: [0, 255, 208],
      say: 'Hi, I’m Sahnawaz, a full-stack developer and UI designer. What brings you here today?',
      choose: true,
      acts: [{ id: 'pick_hire', label: 'I’m hiring', sub: '2 min', icon: 'brief', pick: 'hire' },
        { id: 'pick_build', label: 'Need a website', sub: '1 min', icon: 'pen', pick: 'build' },
        { id: 'pick_all', label: 'See everything', sub: '3 min', icon: 'code', pick: 'all' }] },
    { k: 'projects', sel: '#my-projects', e: 2, key: 0, title: 'Built and shipped', acc: [56, 189, 248],
      say: 'These are the products I’ve built and shipped. This very website, StudyLens AI, a homework helper for students, and YojanaSahay, a free government-scheme finder used across India.',
      beats: [{ at: 'website', find: '.mpj-card', has: 'This Portfolio' }, { at: 'StudyLens', find: '.mpj-card', has: 'StudyLens' }, { at: 'YojanaSahay', find: '.mpj-card', has: 'Yojana Sahay' }],
      acts: [{ id: 'yojana', label: 'Open YojanaSahay', icon: 'link', href: 'https://yojanasahay.vercel.app' }] },
    { k: 'live', sel: '#live-products', e: 2, key: 0, title: 'Live numbers', acc: [34, 211, 238],
      say: 'These numbers aren’t screenshots. They’re fetched from each product right now, while you watch.' },
    { k: 'exp', sel: '#projects', e: 1, key: -2, title: 'Where I started', acc: [129, 140, 248],
      say: 'I started in customer support for Xiaomi and Flipkart, then moved into an IT and developer role at Rapido. Support taught me to find what’s really going wrong.',
      beats: [{ at: 'Xiaomi', find: '.pwork-entry', has: 'Xiaomi India', tap: 'pwork' }, { at: 'Rapido', find: '.pwork-entry', has: 'Rapido — Ienergizer', tap: 'pwork' }] },
    { k: 'wins', sel: '#achievements', e: 3, key: 0, title: 'Milestones', acc: [192, 132, 252],
      say: 'Here are the milestones I’m proudest of. Tap any card and the full story opens, like my GitHub contributions here, or my signature Hacker Mode.',
      beats: [{ at: 'GitHub', find: '.kta3-card', has: 'GitHub Contributions', tap: 'story' }, { at: 'Hacker', find: '.kta3-card', has: 'Hacker Mode', tap: 'story' }] },
    { k: 'tools', sel: 'section.ts-section', e: 2, key: 0, title: 'My toolkit', acc: [45, 212, 191],
      say: 'This is my everyday toolkit: React and JavaScript up front, Node and Firebase behind, and Figma for design. One person, from first sketch to production.',
      beats: [{ at: 'React', sel: '.ts-tab[data-cat="frontend"]', tap: 'tab', stay: true }, { at: 'Node', sel: '.ts-tab[data-cat="backend"]', tap: 'tab', stay: true }, { at: 'Figma', sel: '.ts-tab[data-cat="design"]', tap: 'tab', stay: true }] },
    { k: 'ship', sel: '#how-i-ship', e: 3, key: 2, title: 'How I ship', acc: [167, 139, 250],
      say: 'This is how I ship. Every change goes through GitHub, is built automatically, and goes live in about a minute, with one-click rollback.',
      beats: [{ at: 'GitHub', find: '.hs-step', has: 'Commit' }, { at: 'built', find: '.hs-step', has: 'Build check' }, { at: 'live', find: '.hs-step', has: 'Auto-deploy' }],
      acts: [{ id: 'code', label: 'See this site’s code', icon: 'code', href: GH + '/sahnawaz-portfolio' }] },
    { k: 'tele', sel: '#recent-activity .ra-header', fallback: '#recent-activity', e: 2, key: 2, title: 'Live engineering telemetry', acc: [52, 211, 153],
      say: 'And this is live telemetry, pulled straight from GitHub. My contribution map, project stats, build health and release timeline, then dependency freshness, what I shipped recently, system status, and a live security check.',
      beats: [{ at: 'contribution', sel: '#raHeatmap' }, { at: 'project', sel: '#raProjectStats' }, { at: 'build', sel: '#raCIHealth' }, { at: 'release', sel: '#raReleaseTimeline' },
        { at: 'dependency', sel: '#raDepFreshness' }, { at: 'shipped', sel: '#raList' }, { at: 'system', sel: '#raSysStatus' }, { at: 'security', sel: '#secCard' }],
      acts: [{ id: 'github', label: 'Open my GitHub', icon: 'github', href: GH }] },
    { k: 'fit', sel: '#job-fit', e: 1, key: 0, title: 'Hiring? Check my fit', acc: [251, 191, 36],
      say: 'Hiring? Paste your job post here. An AI compares it with my real work and tells you honestly where I match, and where I don’t.',
      beats: [{ at: 'Paste', sel: '#jfText', tap: 'type', text: 'Frontend developer. React, Firebase, strong UI skills.' }],
      acts: [{ id: 'jobfit', label: 'Try it with a job post', icon: 'pen', go: 'jobfit' }] },
    { k: 'offer', sel: '#what-i-offer', e: 2, key: 0, title: 'What I offer', acc: [251, 146, 60],
      say: 'Need something built? Every service flips open to show a clear starting price and exactly what’s included. Here’s website design, and here’s a portfolio site.',
      beats: [{ at: 'flips', find: '.wio-card', has: 'Website Design', tap: 'price' }, { at: 'portfolio', find: '.wio-card', has: 'Portfolio Website', tap: 'price' }] },
    { k: 'check', sel: '#website-check', e: 2, key: 3, title: 'Free website check', acc: [74, 222, 128],
      say: 'Already have a website? Run this free check. In about thirty seconds it shows your speed on a phone, your Google basics, and how your link looks on WhatsApp.',
      beats: [{ at: 'Run', sel: '#wcUrl', tap: 'type', text: 'yourbusiness.com' }],
      acts: [{ id: 'webcheck', label: 'Check my website', icon: 'pen', go: 'webcheck' }] },
    { k: 'quotes', sel: '#testimonials', e: 1, key: 0, title: 'In their words', acc: [250, 204, 21],
      say: 'But don’t just take my word for it. These are real words from the managers and team leads I’ve worked with.',
      beats: [{ at: 'real', find: '.ptesti-card', has: 'Adiba Kirmani', tap: 'quote', hold: 4500 }] },
    { k: 'talk', sel: '#contact', e: 3, key: 2, title: 'Let’s talk', acc: [244, 114, 182],
      say: 'Ready to talk? Message me, WhatsApp me, or request a call. I personally read every message. Thanks for taking the tour!',
      acts: [{ id: 'whatsapp', label: 'Message me on WhatsApp', icon: 'chat', href: WA }] },
    { k: 'byeHire', sel: '#contact', e: 3, key: 2, title: 'Let’s talk', acc: [244, 114, 182],
      say: 'That’s the short version. Get my CV here, or message me and I’ll reply personally. Thanks for watching!',
      acts: [{ id: 'cv', label: 'Get my CV', icon: 'doc', go: 'cv', main: true }, { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', href: WA }] },
    { k: 'byeBuild', sel: '#contact', e: 3, key: 2, title: 'Let’s talk', acc: [244, 114, 182],
      say: 'Tell me about your project, and I’ll personally reply with the next steps. Thanks for watching!',
      acts: [{ id: 'whatsapp', label: 'Message me on WhatsApp', icon: 'chat', href: WA, main: true }] }
  ];
  /* Each visitor gets their own path through the stops. The first stop asks
     what they came for; left unanswered, the full tour carries on by itself.
     Keep each path in page order, so the page only ever flies downwards. */
  var ALL = STEPS, BY = {};
  ALL.forEach(function (s, n) { s.id = n; BY[s.k] = s; });
  var ROUTES = {
    all: ['hi', 'projects', 'live', 'exp', 'wins', 'tools', 'ship', 'tele', 'fit', 'offer', 'check', 'quotes', 'talk'],
    hire: ['hi', 'projects', 'exp', 'wins', 'tools', 'ship', 'fit', 'quotes', 'byeHire'],
    build: ['hi', 'projects', 'offer', 'check', 'quotes', 'byeBuild']
  };
  var route = 'all', choosing = false, choiceWaited = false;
  /* The path to suggest: where this visit came from first (a jobs site means
     someone hiring), then what they chose last time. Nothing else is guessed. */
  var JOB_SITES = /(^|\.)(linkedin|naukri|indeed|glassdoor|wellfound|instahyre|foundit|hirist|cutshort)\./i;
  function lastPath() { try { var p = localStorage.getItem('shz_tour_path'); return ROUTES[p] ? p : null; } catch (e) { return null; } }
  function suggestion() {
    try { if (JOB_SITES.test(new URL(document.referrer).hostname)) return 'hire'; } catch (e) {}
    return lastPath();
  }
  function useRoute(name) {
    route = name;
    STEPS = ROUTES[name].map(function (k) { return BY[k]; });
  }
  useRoute('all');
  var FIN_ACC = [0, 255, 208];
  var FIN = {
    all: { text: 'Live products people use every day, an honest job-fit check, releases in about a minute, and live telemetry from GitHub. All of it hand-coded by me.',
      acts: [{ id: 'fin_hire', label: 'Hire me', icon: 'brief', go: 'contact', main: true }, { id: 'fin_whatsapp', label: 'WhatsApp', icon: 'chat', href: WA }, { id: 'fin_cv', label: 'Get my CV', icon: 'doc', go: 'cv' }] },
    hire: { text: 'Real products, real experience, and an honest job-fit check. All of it hand-coded by me.',
      acts: [{ id: 'fin_cv', label: 'Get my CV', icon: 'doc', go: 'cv', main: true }, { id: 'fin_jobfit', label: 'Check my fit', icon: 'pen', go: 'jobfit' }, { id: 'fin_whatsapp', label: 'WhatsApp', icon: 'chat', href: WA }] },
    build: { text: 'Clear starting prices, a free website check, and real words from people I’ve worked with.',
      acts: [{ id: 'fin_hire', label: 'Start a project', icon: 'brief', go: 'contact', main: true }, { id: 'fin_whatsapp', label: 'WhatsApp', icon: 'chat', href: WA }, { id: 'fin_check', label: 'Check my website', icon: 'pen', go: 'webcheck' }] }
  };
  var GO = { jobfit: '#job-fit', webcheck: '#website-check', contact: '#contact' };
  var ICONS = {
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    link: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
  };
  function icon(n) {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
  }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var muted = false;
  try { muted = localStorage.getItem('shz_tour_muted') === '1'; } catch (e) {}

  var ui = null, idx = -1, active = false, fin = false, audio = null, timer = null, raf = 0, cache = {}, token = 0;
  var accNow = STEPS[0].acc.join(',');
  /* One audio element, unlocked inside the tap that starts the tour: phones
     (iOS Safari, Android Chrome) only allow sound that starts from a tap, so
     every later stop reuses this already-unlocked element. */
  var player = null, unlocked = false;
  var SILENT = 'data:audio/wav;base64,UklGRogAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWQAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  function unlock() {
    if (!player) { player = new Audio(); player.preload = 'auto'; player.setAttribute('playsinline', ''); }
    if (unlocked) return;
    try {
      player.src = SILENT; player.volume = 1;
      var p = player.play();
      if (p && p.then) p.then(function () { unlocked = true; }).catch(function () {});
      else unlocked = true;
    } catch (e) {}
  }

  /* The tour's soundtrack: a driving electronic track at 124 BPM, in A minor
     (Am, F, C, G, one chord a bar). Four-on-the-floor kick, a rolling off-beat
     bassline that pumps with the kick, hats, claps, a pad and a synth arp.
     While the voice speaks the whole mix steps back and the top end closes
     down so the words stay clear; in the gaps it opens up to full energy.
     All of it is made live on the site's one audio context, so there is no
     file to download and no seam between stops. If the context isn't
     available the tour simply goes without. */
  var bed = null, musicOff = false, BED_LEVEL = 0.3, BED_UNDER_VOICE = 0.55, TOP_OPEN = 7000, TOP_UNDER = 1000, TOP_GAIN_UNDER = 0.55, bedVoice = false;
  var STEP = 60 / 124 / 4, BEAT = STEP * 4, HALF_BAR = BEAT * 2;
  try { musicOff = localStorage.getItem('shz_tour_music') === '0'; } catch (e) {}
  var ROOTS = [55, 43.65, 65.41, 49];
  var CHORDS = [[220, 261.63, 329.63, 440], [174.61, 220, 261.63, 349.23], [196, 261.63, 329.63, 392], [196, 246.94, 293.66, 392]];
  var ARP = { 0: 3, 2: 2, 3: 1, 5: 3, 6: 2, 8: 0, 10: 3, 11: 1, 13: 2, 14: 3 };
  function bedGraph(A, dest) {
    var master = A.createDynamicsCompressor(), pump = A.createGain(), drive = A.createWaveShaper(), lowTone = A.createBiquadFilter();
    var top = A.createGain(), topTone = A.createBiquadFilter(), echo = A.createDelay(1), back = A.createGain();
    var curve = new Float32Array(1025);
    /* soft clipping: its overtones are what carry the bass on phone speakers */
    for (var k = 0; k < 1025; k++) { var x = (k - 512) / 512; curve[k] = Math.tanh(x * 3) / Math.tanh(3); }
    drive.curve = curve;
    master.threshold.value = -14; master.ratio.value = 5; master.attack.value = .004; master.release.value = .16;
    master.connect(dest);
    lowTone.type = 'lowpass'; lowTone.frequency.value = 900;
    drive.connect(lowTone); lowTone.connect(master);
    pump.connect(drive);
    topTone.type = 'lowpass'; topTone.frequency.value = TOP_OPEN; topTone.Q.value = .8;
    top.connect(topTone); topTone.connect(master);
    echo.delayTime.value = STEP * 3; back.gain.value = .36;
    top.connect(echo); echo.connect(back); back.connect(echo); echo.connect(topTone);
    var noise = A.createBuffer(1, A.sampleRate, A.sampleRate), c = noise.getChannelData(0);
    for (var n = 0; n < c.length; n++) c[n] = Math.random() * 2 - 1;
    return { low: pump, pump: pump, kick: drive, master: master, top: top, topTone: topTone, noise: noise };
  }
  function burst(A, g, into, t, type, hz, q, peak, secs) {
    var src = A.createBufferSource(), f = A.createBiquadFilter(), e = A.createGain();
    src.buffer = g.noise; f.type = type; f.frequency.value = hz; f.Q.value = q;
    e.gain.setValueAtTime(peak, t); e.gain.exponentialRampToValueAtTime(.0005, t + secs);
    src.connect(f); f.connect(e); e.connect(into);
    src.start(t, Math.random() * .5); src.stop(t + secs + .02);
  }
  function kick(A, g, t) {
    var o = A.createOscillator(), e = A.createGain();
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(46, t + .085);
    e.gain.setValueAtTime(.0001, t);
    e.gain.exponentialRampToValueAtTime(1, t + .004);
    e.gain.exponentialRampToValueAtTime(.001, t + .3);
    o.connect(e); e.connect(g.kick);
    o.start(t); o.stop(t + .32);
    burst(A, g, g.master, t, 'highpass', 2500, .7, .12, .018);
    /* everything else ducks out of the kick's way, then swells back */
    g.pump.gain.setValueAtTime(.2, t);
    g.pump.gain.linearRampToValueAtTime(1, t + STEP * 3.2);
  }
  function bassNote(A, g, t, hz, accent) {
    var saw = A.createOscillator(), sub = A.createOscillator(), f = A.createBiquadFilter(), e = A.createGain(), len = STEP * .92;
    saw.type = 'sawtooth'; saw.frequency.value = hz; sub.frequency.value = hz;
    f.type = 'lowpass'; f.Q.value = 7;
    f.frequency.setValueAtTime(accent ? 1100 : 760, t);
    f.frequency.exponentialRampToValueAtTime(170, t + len);
    var sawG = A.createGain(); sawG.gain.value = .5;
    e.gain.setValueAtTime(.0001, t);
    e.gain.exponentialRampToValueAtTime(accent ? .95 : .78, t + .006);
    e.gain.setValueAtTime(accent ? .95 : .78, t + len * .6);
    e.gain.exponentialRampToValueAtTime(.001, t + len);
    saw.connect(sawG); sawG.connect(f); sub.connect(e); f.connect(e); e.connect(g.low);
    saw.start(t); sub.start(t); saw.stop(t + len + .01); sub.stop(t + len + .01);
  }
  function pluck(A, g, t, hz) {
    var o = A.createOscillator(), f = A.createBiquadFilter(), e = A.createGain();
    o.type = 'sawtooth'; o.frequency.value = hz;
    f.type = 'lowpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(3800, t);
    f.frequency.exponentialRampToValueAtTime(600, t + .13);
    e.gain.setValueAtTime(.0001, t);
    e.gain.exponentialRampToValueAtTime(.21, t + .004);
    e.gain.exponentialRampToValueAtTime(.001, t + .17);
    o.connect(f); f.connect(e); e.connect(g.top);
    o.start(t); o.stop(t + .19);
  }
  function padChord(A, g, t, chord) {
    var len = STEP * 16;
    chord.slice(0, 3).forEach(function (hz) {
      var o = A.createOscillator(), e = A.createGain();
      o.type = 'triangle'; o.frequency.value = hz;
      e.gain.setValueAtTime(.0001, t);
      e.gain.exponentialRampToValueAtTime(.075, t + .06);
      e.gain.setValueAtTime(.075, t + len * .8);
      e.gain.exponentialRampToValueAtTime(.001, t + len);
      o.connect(e); e.connect(g.top);
      o.start(t); o.stop(t + len + .01);
    });
  }
  /* one sixteenth note of the track; `sc` is the current stop's energy and key.
     Calm stops keep the kick, bass and pad; full adds the drums' top end; peak
     adds the arp. A flight (`rush`) always runs at peak. */
  function bedStep(A, g, t, n, sc, rush) {
    var s = n % 16, bar = Math.floor(n / 16) % 4, k = Math.pow(2, sc.key / 12), e = rush ? 3 : sc.e;
    var root = ROOTS[bar] * k, chord = CHORDS[bar].map(function (h) { return h * k; });
    if (s % 4 === 0) kick(A, g, t);
    if (s % 4 >= 2) bassNote(A, g, t, s === 15 ? root * 2 : root, s % 4 === 2);
    if (s % 4 === 2) burst(A, g, g.master, t, 'highpass', 8000, .8, .3, s === 14 ? .17 : .045);
    else if (s % 2 === 1 && e >= 2) burst(A, g, g.master, t, 'highpass', 9500, .8, .1, .025);
    if (e >= 2 && (s === 4 || s === 12 || (bar === 3 && s >= 13))) burst(A, g, g.top, t, 'bandpass', 1700, .9, s < 13 ? .55 : .3, .13);
    if (e >= 3 && ARP[s] != null) pluck(A, g, t, chord[ARP[s]] * 2);
    if (s === 0) padChord(A, g, t, chord);
  }
  /* the hit a flight lands on */
  function crash(A, g, t) {
    burst(A, g, g.master, t, 'highpass', 3200, .7, .34, .85);
    thump(A, g.master, t);
  }
  /* the next point on the music's grid at or after t */
  function onGrid(t, unit) { return bed.t0 + Math.ceil((t - bed.t0) / unit - 1e-6) * unit; }
  function delay() { var A = bed.A; return (A.outputLatency || A.baseLatency || 0); }
  /* the stop's energy and key, taken at the next landing or the next bar */
  function bedScene(e, key) { if (bed) bed.want = { e: e, key: key }; }
  /* seconds until the voice should start so its first word falls on a beat */
  function voiceEntry(lead) {
    if (!bed) return 0;
    var now = bed.A.currentTime, at = onGrid(now + lead + .02, BEAT) - lead;
    return Math.max(0, at - now - delay());
  }
  /* seconds until the next beat, at least `min` */
  function nextBeat(min) {
    if (!bed) return min;
    var now = bed.A.currentTime;
    return onGrid(now + min, BEAT) - now - delay();
  }
  /* the music rises and dips with the voice itself: `v` is the clip's loudness
     a moment ahead, so the dip arrives with the word, not after it */
  var envAt = 0;
  function bedEnv(v) {
    if (!bed || !bedVoice) return;
    var ms = performance.now();
    if (ms - envAt < 80) return;
    envAt = ms;
    try {
      var now = bed.A.currentTime, room = 1 - Math.min(1, v * 1.5);    // 1 in a pause, 0 on a loud word
      bed.out.gain.setTargetAtTime(BED_LEVEL * (BED_UNDER_VOICE + .4 * room), now, .07);
      bed.g.top.gain.setTargetAtTime(TOP_GAIN_UNDER + .45 * room, now, .07);
    } catch (e) {}
  }
  /* a small accent when the spotlight jumps to the card the voice has named */
  function bedHit() {
    if (!bed) return;
    try {
      var A = bed.A, t = onGrid(A.currentTime + .03, STEP), c = CHORDS[Math.floor(bed.n / 16) % 4], k = Math.pow(2, bed.sc.key / 12);
      pluck(A, bed.g, t, c[3] * 2 * k); pluck(A, bed.g, t + STEP, c[3] * 4 * k);
    } catch (e) {}
  }
  function bedTarget() { return document.hidden ? 0 : BED_LEVEL * (bedVoice ? BED_UNDER_VOICE : 1); }
  function bedOn() {
    if (musicOff || bed) return;
    var A = window.__shzAudio && window.__shzAudio();
    if (!A) return;
    try {
      var out = A.createGain();
      out.connect(A.destination);
      out.gain.setValueAtTime(0, A.currentTime);
      out.gain.linearRampToValueAtTime(bedTarget(), A.currentTime + 1.2);
      var g = bedGraph(A, out), at = A.currentTime + .15;
      var b = bed = { A: A, out: out, g: g, t0: at, n: 0, sc: { e: 1, key: 0 }, want: null, land: 0, feed: 0 };
      var feed = function () {                           // always over half a second of the track queued ahead
        var now = A.currentTime;
        if (at < now) { var skip = Math.ceil((now - at) / STEP) + 1; b.n += skip; at += skip * STEP; }   // a stalled page rejoins on the grid
        while (at < now + .6) {
          if (b.land && at >= b.land - STEP / 2) {
            /* a landing is the top of a new bar in the new stop's mood */
            b.land = 0; b.n = (Math.floor(b.n / 16) + 1) * 16;
            if (b.want) { b.sc = b.want; b.want = null; }
            crash(A, g, at);
          } else if (b.n % 16 === 0 && b.want && !b.land) { b.sc = b.want; b.want = null; }
          bedStep(A, g, at, b.n, b.sc, !!b.land);
          /* a snare roll leads into the landing */
          if (b.land && at >= b.land - BEAT - STEP / 2) burst(A, g, g.top, at, 'bandpass', 1900, .9, .22 + .34 * (1 - (b.land - at) / BEAT), .08);
          b.n++; at += STEP;
        }
      };
      feed();
      b.feed = setInterval(feed, 200);
    } catch (e) { bed = null; }
  }
  function bedRamp(level, secs) {
    if (!bed) return;
    try {
      var now = bed.A.currentTime, g = bed.out.gain;
      g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(level, now + secs);
    } catch (e) {}
  }
  function bedOff(fade) {
    if (!bed) return;
    var b = bed;
    bedRamp(0, fade);
    bed = null;
    clearInterval(b.feed);
    setTimeout(function () { try { b.out.disconnect(); } catch (e) {} }, (fade + .8) * 1000);
  }
  /* the end of the tour: one last hit on the beat, and the chord rings out */
  function bedEnd() {
    if (!bed) return;
    var b = bed;
    try {
      var t = onGrid(b.A.currentTime + .1, BEAT), k = Math.pow(2, b.sc.key / 12);
      b.land = 0; crash(b.A, b.g, t);
      padChord(b.A, b.g, t, CHORDS[0].map(function (h) { return h * k; }));
    } catch (e) {}
    bedOff(3.2);
  }
  /* it steps back and darkens while the voice speaks, and opens up in the gaps */
  function bedUnder(on) {
    if (bedVoice === on) return;
    bedVoice = on;
    bedRamp(bedTarget(), .35);
    if (!bed) return;
    try {
      var A = bed.A, g = bed.g, now = A.currentTime;
      g.topTone.frequency.cancelScheduledValues(now);
      g.topTone.frequency.setValueAtTime(g.topTone.frequency.value, now);
      g.topTone.frequency.exponentialRampToValueAtTime(on ? TOP_UNDER : TOP_OPEN, now + .45);
      g.top.gain.cancelScheduledValues(now);
      g.top.gain.setValueAtTime(g.top.gain.value, now);
      g.top.gain.linearRampToValueAtTime(on ? TOP_GAIN_UNDER : 1, now + .35);
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { bedRamp(bedTarget(), .4); });
  function sweepTone(A, into, now, d) {
    var o = A.createOscillator(), band = A.createBiquadFilter(), g = A.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(48, now);
    o.frequency.exponentialRampToValueAtTime(96, now + d * .55);
    o.frequency.exponentialRampToValueAtTime(52, now + d);
    band.type = 'lowpass'; band.Q.value = 7;
    band.frequency.setValueAtTime(130, now);
    band.frequency.exponentialRampToValueAtTime(900, now + d * .55);
    band.frequency.exponentialRampToValueAtTime(150, now + d);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(.2, now + d * .5);
    g.gain.linearRampToValueAtTime(0, now + d);
    o.connect(band); band.connect(g); g.connect(into);
    o.start(now); o.stop(now + d + .05);
  }
  function thump(A, into, now) {
    var o = A.createOscillator(), g = A.createGain(), tick = A.createOscillator(), tg = A.createGain();
    o.frequency.setValueAtTime(92, now);
    o.frequency.exponentialRampToValueAtTime(46, now + .18);
    g.gain.setValueAtTime(.0001, now);
    g.gain.exponentialRampToValueAtTime(.4, now + .012);
    g.gain.exponentialRampToValueAtTime(.0004, now + .42);
    o.connect(g); g.connect(into);
    tick.frequency.value = 2637;
    tg.gain.setValueAtTime(.04, now);
    tg.gain.exponentialRampToValueAtTime(.0003, now + .07);
    tick.connect(tg); tg.connect(into);
    o.start(now); o.stop(now + .45); tick.start(now); tick.stop(now + .08);
  }
  function build() {
    if (ui) return ui;
    var root = document.createElement('div');
    root.className = 'tour-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Guided tour');
    root.innerHTML =
      '<div class="tour-dim t" aria-hidden="true"></div><div class="tour-dim b" aria-hidden="true"></div><div class="tour-dim l" aria-hidden="true"></div><div class="tour-dim r" aria-hidden="true"></div>'
      + '<div class="tour-spot" aria-hidden="true"></div>'
      + '<div class="tour-tap" aria-hidden="true"></div>'
      + '<div class="tour-card">'
      +   '<div class="tour-top"><span class="tour-orb" aria-hidden="true"><i></i></span><span class="tour-step"></span>'
      +     '<span class="tour-voice-tag" aria-hidden="true">AI narrator</span>'
      +     '<button type="button" class="tour-ic tour-music" aria-label="Music"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="3" width="2.4" height="10" rx="1.2"/><rect x="6.8" y="3" width="2.4" height="10" rx="1.2"/><rect x="11.6" y="3" width="2.4" height="10" rx="1.2"/></svg></button>'
      +     '<button type="button" class="tour-ic tour-mute" aria-label="Mute voice"></button>'
      +     '<button type="button" class="tour-ic tour-close" aria-label="Close tour">×</button></div>'
      +   '<div class="tour-body"><h3 class="tour-title"></h3>'
      +   '<p class="tour-text" aria-live="polite"></p>'
      +   '<p class="tour-voice" hidden></p>'
      +   '<div class="tour-acts"></div></div>'
      +   '<div class="tour-meter"><div class="tour-bar"><span></span></div><canvas class="tour-scope" aria-hidden="true"></canvas></div>'
      +   '<div class="tour-nav"><button type="button" class="tour-btn tour-prev">‹ Back</button>'
      +     '<span class="tour-dots"></span>'
      +     '<button type="button" class="tour-btn primary tour-next">Next ›</button></div>'
      +   '<div class="tour-fin" hidden>'
      +     '<div class="tour-fin-mark" aria-hidden="true"><svg viewBox="0 0 48 48" width="44" height="44"><circle cx="24" cy="24" r="20"/><path d="m15.5 24.5 5.8 5.8 11.2-12.3"/></svg></div>'
      +     '<h3 class="tour-fin-title">That’s the tour</h3>'
      +     '<p class="tour-fin-text"></p>'
      +     '<div class="tour-fin-acts"></div>'
      +     '<div class="tour-fin-foot"><button type="button" class="tour-link tour-replay">' + icon('replay') + '<span>Replay tour</span></button>'
      +       '<button type="button" class="tour-link tour-done">Close</button></div>'
      +   '</div>'
      + '</div>'
      + '<div class="tour-dock" role="group" aria-label="Tour paused">'
      +   '<button type="button" class="tour-dock-go"><span class="tour-orb" aria-hidden="true"><i></i></span>'
      +     '<span class="tour-dock-txt"><b>Resume tour</b><small></small></span>'
      +     '<span class="tour-dock-play" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg></span></button>'
      +   '<button type="button" class="tour-dock-x" aria-label="End tour">×</button>'
      +   '<span class="tour-dock-time" aria-hidden="true"><i></i></span>'
      + '</div>';
    document.body.appendChild(root);
    ui = {
      root: root, spot: root.querySelector('.tour-spot'), dims: root.querySelectorAll('.tour-dim'), tap: root.querySelector('.tour-tap'), card: root.querySelector('.tour-card'),
      step: root.querySelector('.tour-step'), title: root.querySelector('.tour-title'), text: root.querySelector('.tour-text'),
      bar: root.querySelector('.tour-bar span'), dots: root.querySelector('.tour-dots'), orb: root.querySelector('.tour-orb'),
      scope: root.querySelector('.tour-scope'), acts: root.querySelector('.tour-acts'),
      voice: root.querySelector('.tour-voice'), body: root.querySelector('.tour-body'),
      prev: root.querySelector('.tour-prev'), next: root.querySelector('.tour-next'), mute: root.querySelector('.tour-mute'), music: root.querySelector('.tour-music'), close: root.querySelector('.tour-close'),
      fin: root.querySelector('.tour-fin'), finText: root.querySelector('.tour-fin-text'), finActs: root.querySelector('.tour-fin-acts'),
      dock: root.querySelector('.tour-dock'), dockGo: root.querySelector('.tour-dock-go'), dockSub: root.querySelector('.tour-dock-txt small'),
      dockTime: root.querySelector('.tour-dock-time i')
    };
    paintDots();
    ui.prev.addEventListener('click', function () { if (idx > 0) show(idx - 1); });
    ui.next.addEventListener('click', function () { if (idx < STEPS.length - 1) show(idx + 1); else finish(); });
    ui.close.addEventListener('click', stop);
    root.querySelector('.tour-done').addEventListener('click', stop);
    root.querySelector('.tour-replay').addEventListener('click', function () {
      if (!muted) unlock();
      bedOn();
      try { if (window.gtag) gtag('event', 'tour_replay'); } catch (e) {}
      statSend(); statNew();
      useRoute('all'); paintDots();
      show(0);
    });
    ui.spot.addEventListener('animationend', function (e) { if (/tourRing/.test(e.animationName)) ui.spot.classList.remove('sweep', 'sweep2'); });
    ui.dockGo.addEventListener('click', resume);
    root.querySelector('.tour-dock-x').addEventListener('click', function () { dockAway(); });
    ui.dock.addEventListener('mouseenter', function () { holdDock('hover', true); });
    ui.dock.addEventListener('mouseleave', function () { holdDock('hover', false); });
    ui.dock.addEventListener('focusin', function () { holdDock('focus', true); });
    ui.dock.addEventListener('focusout', function () { holdDock('focus', false); });
    ui.mute.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem('shz_tour_muted', muted ? '1' : '0'); } catch (e) {}
      paintMute();
      if (fin) return;
      if (muted) { stopAudio(); ui.card.classList.remove('has-env'); voiceNote(''); autoAdvance(STEPS[idx].say); } else { unlock(); show(idx); }
    });
    ui.music.addEventListener('click', function () {
      musicOff = !musicOff;
      try { localStorage.setItem('shz_tour_music', musicOff ? '0' : '1'); } catch (e) {}
      paintMusic();
      if (musicOff) bedOff(.4);
      else if (!fin) { bedOn(); if (bed && idx >= 0) { bed.sc = { e: STEPS[idx].e, key: STEPS[idx].key }; if (run) { bedVoice = false; bedUnder(true); } } }
      try { if (window.gtag) gtag('event', 'tour_music', { on: !musicOff }); } catch (e) {}
    });
    window.addEventListener('resize', function () { wpos = null; if (active && !fin && hlAt >= 0) pill(hlAt, true); });
    paintMute();
    paintMusic();
    return ui;
  }
  function paintDots() {
    ui.dots.textContent = '';
    STEPS.forEach(function (_, i) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'tour-dot'; d.setAttribute('aria-label', 'Go to stop ' + (i + 1));
      d.addEventListener('click', function () { show(i); }); ui.dots.appendChild(d);
    });
  }
  /* the visitor said what they came for (`auto`: nobody answered) */
  function pick(name, auto) {
    if (!active || !ROUTES[name]) return;
    if (!auto) { try { localStorage.setItem('shz_tour_path', name); } catch (e) {} }
    try { if (window.gtag) gtag('event', 'tour_path', { path: name }); } catch (e) {}
    if (stat) { stat.path = name; stat.dirty = true; }
    useRoute(name);
    paintDots();
    show(1);
  }
  /* One anonymous record per tour (api/analytics.js → the admin's Site traffic
     page): which path, how far, which buttons, how long. No name, no account,
     no address, just a random id for this one run. The owner's own browser is
     left out once it has opened the admin page. */
  var stat = null;
  function statNew() {
    stat = { run: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), path: 'none', stops: [], acts: [], t0: Date.now(), secs: 0, done: false, dirty: true };
  }
  function statSend() {
    if (!stat || !stat.dirty) return;
    stat.dirty = false;
    if (!fin && !parked) stat.secs = Math.round((Date.now() - stat.t0) / 1000);
    try {
      if (localStorage.getItem('shz_owner') === '1') return;
    } catch (e) {}
    try {
      var body = JSON.stringify({ event: 'tour', run: stat.run, path: stat.path, stops: stat.stops, acts: stat.acts, secs: Math.min(3600, stat.secs), done: stat.done,
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop', music: !musicOff, voice: !muted });
      var type = { type: 'application/json' };
      if (!(navigator.sendBeacon && navigator.sendBeacon('/api/analytics', new Blob([body], type)))) {
        fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
      }
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) statSend(); });
  window.addEventListener('pagehide', statSend);
  function paintMute() {
    ui.mute.innerHTML = muted
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    ui.mute.setAttribute('aria-label', muted ? 'Turn voice on' : 'Mute voice');
  }

  function paintMusic() {
    ui.music.classList.toggle('on', !musicOff);
    ui.music.setAttribute('aria-pressed', String(!musicOff));
    ui.music.setAttribute('aria-label', musicOff ? 'Turn music on' : 'Turn music off');
  }

  /* the stop's colour: three numbers the stylesheet blends smoothly */
  function setAccent(rgb) {
    accNow = rgb.join(',');
    var st = ui.root.style;
    st.setProperty('--ar', rgb[0]); st.setProperty('--ag', rgb[1]); st.setProperty('--ab', rgb[2]);
  }
  /* The dimmed page is four solid panels around the stop, moved only with
     transforms, so the graphics chip does the work and nothing is repainted.
     (A single giant shadow around the spotlight repainted the whole screen on
     every frame it moved, which is what felt laggy on phones.) */
  function hole(left, top, w, h) {
    var d = ui.dims, vw = window.innerWidth, H = Math.max(window.innerHeight, window.screen ? window.screen.height : 0) + 200;
    d[0].style.height = d[1].style.height = H + 'px';
    d[0].style.transform = 'translate3d(0,' + (top - H) + 'px,0)';
    d[1].style.transform = 'translate3d(0,' + (top + h) + 'px,0)';
    d[2].style.transform = 'translate3d(' + (left - vw) + 'px,' + top + 'px,0) scaleY(' + h + ')';
    d[3].style.transform = 'translate3d(' + (left + w) + 'px,' + top + 'px,0) scaleY(' + h + ')';
  }
  function dimsInstant(on) { ui.root.classList.toggle('tour-snap', on); }
  function sweep() {
    if (reduce || lite) return;
    /* two identical animations, alternated, restart the pulse without forcing a re-layout */
    var a = ui.spot.classList.contains('sweep');
    ui.spot.classList.remove('sweep', 'sweep2');
    ui.spot.classList.add(a ? 'sweep2' : 'sweep');
  }

  /* Quick actions: the card tucks itself into a small "Resume tour" pill at
     the top while the page goes where the action says; tapping the pill
     brings the card back to the same stop and the voice carries on from the
     word it paused on. Left alone, the pill fades away after a while. */
  function renderActs(box, list) {
    box.textContent = '';
    box.classList.toggle('picks', !!(list && list[0] && list[0].pick));
    (list || []).forEach(function (a) {
      var el = document.createElement(a.href ? 'a' : 'button');
      el.className = 'tour-act' + (a.main ? ' main' : '');
      if (a.href) { el.href = a.href; el.target = '_blank'; el.rel = 'noopener'; } else el.type = 'button';
      el.innerHTML = icon(a.icon) + '<span>' + a.label + '</span>' + (a.sub ? '<small>' + a.sub + '</small>' : '');
      el.addEventListener('click', function (e) { act(a, e); });
      if (a.pick) {
        el.setAttribute('data-pick', a.pick);
        if (a.pick === suggestion()) { el.classList.add('main'); el.insertAdjacentHTML('afterbegin', '<em>For you</em>'); }
      }
      box.appendChild(el);
    });
  }
  function act(a, e) {
    if (a.pick) { if (e) e.preventDefault(); pick(a.pick); return; }
    try { if (window.gtag) gtag('event', 'tour_action', { action: a.id }); } catch (x) {}
    if (stat && stat.acts.indexOf(a.id) < 0) { stat.acts.push(a.id); stat.dirty = true; }
    if (!a.href && e) e.preventDefault();
    park();
    if (a.href) return;                                // the link opens in a new tab by itself
    var go = a.go;
    if (go === 'cv') {
      if (typeof window.openResumeEmailModal === 'function') { try { window.openResumeEmailModal(); return; } catch (x) {} }
      go = 'contact';
    }
    var el = document.querySelector(GO[go]);
    if (!el) return;
    if (go === 'jobfit') {
      var box = document.getElementById('jfText');
      if (box) { try { box.focus({ preventScroll: true }); } catch (x) {} }
    }
    if (go === 'webcheck') {
      var url = document.getElementById('wcUrl');
      if (url) { try { url.focus({ preventScroll: true }); } catch (x) {} }
    }
    window.scrollTo({ top: Math.max(0, docTop(el) - headerH() - 14), behavior: reduce ? 'auto' : 'smooth' });
  }

  var parked = null, DOCK_MS = 15000, dockLeft = 0, dockStart = 0, dockTimer = 0, dockHolds = {}, dockAnims = [];
  /* where the voice should pick up: the start of the word it was on */
  function resumePoint() {
    if (!run) return 0;
    var t = run.clock ? run.clock.t0 + (performance.now() - run.clock.c0) / 1000 : (run.a && run.a.currentTime) || 0;
    var w = run.clip && run.clip.words, at = Math.max(0, t - 0.4);
    if (w && w.length) { for (var k = w.length - 1; k >= 0; k--) if (w[k][0] <= t + 0.04) { at = Math.max(0, w[k][0] - 0.12); break; } }
    return at;
  }
  /* the pill sits just under the site header while it shows, at the very top when it hides */
  var dockY = -1, dockRaf = 0;
  function dockTop() {
    var hd = document.querySelector('header'), b = 0;
    if (hd) { var pos = getComputedStyle(hd).position; if (pos === 'fixed' || pos === 'sticky') b = Math.max(0, hd.getBoundingClientRect().bottom); }
    var y = b > 0 && b < window.innerHeight / 3 ? Math.round(b) + 10 : 12;
    if (y !== dockY) { dockY = y; ui.dock.style.setProperty('--dock-top', y + 'px'); }
  }
  function onDockScroll() {
    if (!parked || dockRaf) return;
    dockRaf = requestAnimationFrame(function () { dockRaf = 0; if (parked) dockTop(); });
    clearTimeout(onDockScroll.t);
    onDockScroll.t = setTimeout(function () { if (parked) dockTop(); }, 420);   // after the header finishes sliding
  }
  function endAnims() { dockAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); dockAnims = []; }
  /* move one box onto another's place (card ⇄ pill), as a transform */
  function morph(el, from, to, opa, ms, cb) {
    var base = getComputedStyle(el).transform; base = base && base !== 'none' ? ' ' + base : '';
    var off = function (r) {
      return 'translate(' + ((r.left + r.width / 2) - (to.left + to.width / 2)) + 'px,' + ((r.top + r.height / 2) - (to.top + to.height / 2)) + 'px)'
        + base + ' scale(' + (r.width / to.width) + ',' + (r.height / to.height) + ')';
    };
    if (!el.animate || reduce) { if (cb) cb(); return; }
    var a = el.animate([
      { transform: from === to ? base || 'none' : off(from), opacity: opa[0] },
      { transform: base || 'none', opacity: opa[1] }
    ], { duration: ms, easing: 'cubic-bezier(.32,.72,.24,1)', fill: 'both' });
    dockAnims.push(a);
    a.onfinish = function () { if (cb) cb(); };
  }
  function park() {
    if (!active || !ui) return;
    var at = fin ? 0 : resumePoint();
    parked = { i: idx, fin: fin, at: at };
    token++;
    stopAudio();
    stopMotion();
    demoEnd();
    bedOff(.5);
    cancelAnimationFrame(raf);
    active = false;
    document.removeEventListener('keydown', onKey, true);
    document.documentElement.classList.remove('tour-on');
    document.documentElement.classList.add('tour-docked');
    ui.dockSub.textContent = fin ? 'Back to the summary' : (choosing ? 'Welcome' : idx + ' / ' + (STEPS.length - 1)) + ' · ' + STEPS[idx].title;
    endAnims();
    dockTop();
    var C = ui.card.getBoundingClientRect();
    ui.card.style.pointerEvents = 'none';
    ui.root.classList.add('docked');
    var P = ui.dock.getBoundingClientRect();
    /* the card shrinks into the pill while the pill grows out of the card */
    var base = getComputedStyle(ui.card).transform; base = base && base !== 'none' ? ' ' + base : '';
    if (ui.card.animate && !reduce) {
      var dx = (P.left + P.width / 2) - (C.left + C.width / 2), dy = (P.top + P.height / 2) - (C.top + C.height / 2);
      var a = ui.card.animate([
        { transform: base || 'none', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px)' + base + ' scale(' + (P.width / C.width) + ',' + (P.height / C.height) + ')', opacity: 0 }
      ], { duration: 440, easing: 'cubic-bezier(.32,.72,.24,1)', fill: 'forwards' });
      dockAnims.push(a);
      a.onfinish = function () { if (parked) ui.card.style.visibility = 'hidden'; };
      morph(ui.dock, C, P, [0, 1], 480);
    } else ui.card.style.visibility = 'hidden';
    window.addEventListener('scroll', onDockScroll, { passive: true });
    dockHolds = {}; if (document.hidden) dockHolds.hidden = true;
    dockLeft = DOCK_MS;
    ui.dockTime.style.animation = 'none'; void ui.dockTime.offsetWidth;
    ui.dockTime.style.animation = 'tourDockTime ' + DOCK_MS + 'ms linear forwards';
    runDock();
  }
  function held() { for (var k in dockHolds) if (dockHolds[k]) return true; return false; }
  function runDock() {
    clearTimeout(dockTimer);
    if (!parked) return;
    if (held()) { ui.dockTime.style.animationPlayState = 'paused'; return; }
    ui.dockTime.style.animationPlayState = 'running';
    dockStart = performance.now();
    dockTimer = setTimeout(function () { dockAway(); }, Math.max(0, dockLeft));
  }
  function holdDock(why, on) {
    if (!parked) return;
    var was = held();
    dockHolds[why] = on;
    if (!was && held()) { clearTimeout(dockTimer); dockLeft -= performance.now() - dockStart; ui.dockTime.style.animationPlayState = 'paused'; }
    else if (was && !held()) runDock();
  }
  /* the pill was left alone (or closed): it fades, and the tour ends */
  function dockAway() {
    if (!parked) return;
    parked = null;
    clearTimeout(dockTimer);
    window.removeEventListener('scroll', onDockScroll);
    endAnims();
    document.documentElement.classList.remove('tour-docked');
    var done = function () {
      endAnims();
      ui.root.classList.remove('docked', 'open');
      ui.card.style.visibility = ''; ui.card.style.pointerEvents = '';
      cleanup();
      statSend();
      try { if (window.gtag) gtag('event', 'tour_end', { step: 'paused' }); } catch (e) {}
    };
    if (ui.dock.animate && !reduce) {
      var base = getComputedStyle(ui.dock).transform; base = base && base !== 'none' ? base : '';
      var a = ui.dock.animate([{ opacity: 1, transform: base || 'none' }, { opacity: 0, transform: 'translateY(-10px) ' + base + ' scale(.94)' }],
        { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      dockAnims.push(a); a.onfinish = done;
    } else done();
  }
  /* back to the exact stop: the pill grows back into the card, the page
     returns to the stop, and the voice picks up from the word it paused on */
  function resume() {
    if (!parked || !ui) return;
    var pk = parked; parked = null;
    clearTimeout(dockTimer);
    window.removeEventListener('scroll', onDockScroll);
    endAnims();
    document.documentElement.classList.remove('tour-docked');
    if (!muted) unlock();
    bedOn();
    instantScroll(true);
    /* a dialog the action opened (the CV form) gives way to the tour */
    try { Array.prototype.forEach.call(document.querySelectorAll('#resumeGateModal.rg-open'), function (m) { m.classList.remove('rg-open'); }); } catch (e) {}
    var P = ui.dock.getBoundingClientRect();
    ui.card.style.visibility = ''; ui.card.style.pointerEvents = '';
    active = true;
    document.documentElement.classList.add('tour-on');
    document.addEventListener('keydown', onKey, true);
    track();
    if (pk.fin) { ui.root.classList.remove('docked'); } else show(pk.i, pk.at);
    ui.root.classList.remove('docked');
    var C = ui.card.getBoundingClientRect();
    if (ui.card.animate && !reduce) {
      var base = getComputedStyle(ui.card).transform; base = base && base !== 'none' ? ' ' + base : '';
      var dx = (P.left + P.width / 2) - (C.left + C.width / 2), dy = (P.top + P.height / 2) - (C.top + C.height / 2);
      var a = ui.card.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px)' + base + ' scale(' + (P.width / C.width) + ',' + (P.height / C.height) + ')', opacity: 0 },
        { transform: base || 'none', opacity: 1 }
      ], { duration: 480, easing: 'cubic-bezier(.32,.72,.24,1)' });
      dockAnims.push(a);
    }
    try { if (window.gtag) gtag('event', 'tour_resume'); } catch (e) {}
    setTimeout(function () { try { (pk.fin ? ui.finActs.querySelector('.tour-act.main') : ui.next).focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  document.addEventListener('visibilitychange', function () { if (parked) holdDock('hidden', document.hidden); });

  function target(s) { return document.querySelector(s.sel) || (s.fallback && document.querySelector(s.fallback)); }

  /* keep the spotlight glued to the element while the page settles/scrolls */
  /* The element is measured only when something can have moved it (a scroll,
     a resize, a new stop) plus a light check four times a second for content
     that shifts by itself, and the spotlight is written only when its box
     really changed. Measuring every frame forced the whole page to re-layout
     60 times a second, which is what makes phones stutter. */
  var spotDirty = true, spotSeen = 0, spotKey = '', spotAway = null, spotCx = 0, spotCy = 0;
  function spotMoved() { spotDirty = true; }
  function track() {
    cancelAnimationFrame(raf);
    spotDirty = true; spotKey = ''; spotAway = null;
    var loop = function (now) {
      if (!active) return;
      raf = requestAnimationFrame(loop);
      if (fin || flying) {
        if (spotAway !== true) { spotAway = true; ui.spot.classList.add('away'); hole(spotCx, spotCy, 0, 0); }
        spotKey = '';
        return;
      }
      if (!spotDirty && now - spotSeen < 250) return;
      if (cam && now - spotSeen < 120) return;          // the page is gliding: the spotlight's own easing fills the gaps
      spotDirty = false; spotSeen = now;
      var list = spotEl || [target(STEPS[idx])];
      if (!list[0]) return;
      var r = list[0].getBoundingClientRect();
      if (list[1]) { var r2 = list[1].getBoundingClientRect(); r = { top: Math.min(r.top, r2.top), left: Math.min(r.left, r2.left), right: Math.max(r.right, r2.right), bottom: Math.max(r.bottom, r2.bottom) }; }
      var pad = 10, vh = window.innerHeight, vw = window.innerWidth;
      var top = Math.max(8, r.top - pad), bottom = Math.min(vh - 8, r.bottom + pad);
      var left = Math.max(6, r.left - pad), right = Math.min(vw - 6, r.right + pad);
      var visible = bottom - top > 30 && r.bottom > 0 && r.top < vh;
      if (!visible) { top = vh * 0.3; bottom = top + 60; }
      var w = Math.round(Math.max(40, right - left)), h = Math.round(Math.max(40, bottom - top));
      left = Math.round(left); top = Math.round(top);
      var key = left + ',' + top + ',' + w + ',' + h;
      if (key === spotKey && spotAway === !visible) return;
      var opening = spotAway === true && visible;
      if (spotAway !== !visible) { spotAway = !visible; ui.spot.classList.toggle('away', !visible); }   // off-screen mid-scroll: just dim
      spotKey = key;
      spotCx = left + w / 2; spotCy = top + h / 2;
      var st = ui.spot.style;
      if (opening) {                                       // after a flight: the spotlight opens from the centre of its stop
        dimsInstant(true);
        hole(spotCx, spotCy, 0, 0);
        st.width = w + 'px'; st.height = h + 'px'; st.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
        var L = left, T = top, W = w, H2 = h, k2 = key;
        requestAnimationFrame(function () { requestAnimationFrame(function () { dimsInstant(false); if (spotKey === k2) hole(L, T, W, H2); }); });
        return;
      }
      if (visible) hole(left, top, w, h); else hole(spotCx, spotCy, 0, 0);
      st.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
      st.width = w + 'px';
      st.height = h + 'px';
    };
    raf = requestAnimationFrame(loop);
  }
  window.addEventListener('scroll', spotMoved, { passive: true });
  window.addEventListener('resize', spotMoved, { passive: true });

  function headerH() {
    var h = document.querySelector('header'); if (!h) return 0;
    var pos = getComputedStyle(h).position;
    return (pos === 'fixed' || pos === 'sticky') ? h.getBoundingClientRect().height : 0;
  }
  function docTop(el) { var y = 0; for (var n = el; n; n = n.offsetParent) y += n.offsetTop; return y; }
  function maxY() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  /* the part of the screen the stop can really be seen in: below the header
     and, on phones where the card sits over the page, above the card */
  function roomNow() {
    var top = headerH() + 12, bottom = window.innerHeight - 12;
    if (window.innerWidth < 900 && ui) { var c = ui.card.getBoundingClientRect(); if (c.height) bottom = Math.min(bottom, c.top - 10); }
    return { top: top, bottom: bottom, h: Math.max(120, bottom - top) };
  }
  function aimAt(el) {
    var R = roomNow(), h = el.offsetHeight, y = docTop(el) - R.top;
    if (h < R.h) y -= Math.round((R.h - h) / 2);          // short stops sit in the middle of that space
    return Math.max(0, Math.min(y, maxY()));
  }
  /* the site asks for smooth scrolling in its stylesheet, which would fight a
     page moved frame by frame, so that is switched off for the tour */
  function instantScroll(on) {
    var st = document.documentElement.style;
    if (on) { st.setProperty('scroll-behavior', 'auto', 'important'); st.setProperty('overflow-anchor', 'none', 'important'); }
    else { st.removeProperty('scroll-behavior'); st.removeProperty('overflow-anchor'); }
  }
  function easeFlight(p) { return p * p * p * (p * (p * 6 - 15) + 10); }

  /* The flight between stops: one unbroken motion that starts and ends
     softly, taking longer for longer distances. The destination is re-read
     a few times a second, so a section above that finishes rendering shifts
     the landing point without a visible correction. */
  var flying = false, flight = null, cam = null, spotEl = null, handsOff = false;
  /* Light mode: for in-app browsers (Instagram, Facebook and the like) and any
     device that shows it needs it. Same tour, same sound; the page glides with
     the browser's own scrolling, and the small visual extras step aside. */
  var lite = /Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent);
  function goLite() { lite = true; if (ui) ui.root.classList.add('tour-lite'); document.documentElement.classList.add('tour-lite'); }
  function land(el, done, my) {
    if (flight) flight.drop();
    var over = false, safety = 0, rid = 0;
    var finish = function () {
      if (over) return;
      over = true; clearTimeout(safety); cancelAnimationFrame(rid);
      flight = null; flying = false; spotDirty = true;
      if (my === token && done) done();
    };
    var from = window.pageYOffset, to = aimAt(el), dist = Math.abs(to - from);
    if (dist < 24 || reduce || handsOff) {
      if (dist >= 1 && !handsOff) window.scrollTo(0, to);
      finish();
      return;
    }
    var ms = Math.round(Math.min(2300, Math.max(950, 700 + Math.sqrt(dist) * 24)));
    /* with music on, the flight is stretched a touch to land exactly on its grid */
    if (bed) {
      try {
        var now = bed.A.currentTime, soon = onGrid(now + ms / 1000, HALF_BAR);
        bed.land = soon;
        ms = Math.round((soon - now + delay()) * 1000);
        sweepTone(bed.A, bed.A.destination, now, soon - now);
      } catch (e) {}
    }
    flying = true;
    flight = { land: finish, drop: function () { over = true; clearTimeout(safety); cancelAnimationFrame(rid); flight = null; } };
    /* a hidden tab stops animation frames: never wait on them */
    safety = setTimeout(function () { window.scrollTo(0, aimAt(el)); finish(); }, ms + 900);
    var t0 = performance.now(), checks = [.4, .72], last = t0, slowN = 0, frames = 0;
    if (lite) {
      /* the browser's own smooth scroll runs off the page's busy thread, so it stays fluid on a slow phone */
      window.scrollTo({ top: to, behavior: 'smooth' });
      var again = setTimeout(function () { if (over) return; var t2 = aimAt(el); if (Math.abs(t2 - window.pageYOffset) > 40) window.scrollTo({ top: t2, behavior: 'smooth' }); }, ms * .6);
      demoTimers.push(again);
      rid = 0;
      setTimeout(finish, ms);
      return;
    }
    var frame = function (now) {
      if (over) return;
      var p = Math.min(1, Math.max(0, (now - t0) / ms));
      if (checks.length && p >= checks[0]) { checks.shift(); to = aimAt(el); }   // one look at a time: each look costs a full page layout
      window.scrollTo(0, from + (to - from) * easeFlight(p));
      frames++; if (now - last > 28) slowN++; last = now;
      if (p < 1) rid = requestAnimationFrame(frame);
      else {
        if (frames > 12 && slowN / frames > .3) goLite();      // this device is struggling: lighter from the next stop on
        finish();
      }
    };
    rid = requestAnimationFrame(frame);
  }

  /* several boxes as one: the top of the first to the bottom of the last */
  function aimAll(list) {
    var R = roomNow(), top = Infinity, bottom = 0;
    list.forEach(function (el) { var t = docTop(el); top = Math.min(top, t); bottom = Math.max(bottom, t + el.offsetHeight); });
    var h = bottom - top, y = top - R.top;
    if (h < R.h) y -= Math.round((R.h - h) / 2);
    return Math.max(0, Math.min(y, maxY()));
  }
  /* The tour using the site by itself: each kind clicks the real control, so
     what opens is exactly what a visitor would get, and knows how to put it
     back. Nothing here sends anything anywhere: fields are only typed into. */
  var DEMO = {
    pwork: { on: function (el) { if (!el.classList.contains('pwork-open')) el.click(); },
      off: function (el) { if (el.classList.contains('pwork-open')) el.click(); } },
    story: { on: function (el) { if (!el.classList.contains('kta3-on')) el.click(); },
      also: function (el) { return document.getElementById('kta3-drawer-' + el.getAttribute('data-group')); },
      off: function (el) { if (window.kta3Close) window.kta3Close(el.getAttribute('data-group')); } },
    price: { on: function (el) { if (!el.classList.contains('wio-flipped')) el.click(); },
      off: function (el) { el.classList.remove('wio-flipped'); } },
    quote: { on: function (el) { if (!el.classList.contains('pt-open')) el.click(); },
      off: function (el) { if (el.classList.contains('pt-open')) el.click(); } },
    tab: { keep: true, on: function (el) { el.click(); },
      off: function () { var all = document.querySelector('.ts-tab[data-cat="all"]'); if (all && !all.classList.contains('active')) all.click(); } },
    type: { on: function (el, b, my) {
        if (el.value) return false;                       // never over what a visitor has written
        var n = 0, tick = function () {
          if (my !== token || handsOff || el.value !== b.text.slice(0, n)) return;
          el.value = b.text.slice(0, ++n);
          if (n < b.text.length) later(38, tick);
        };
        tick();
      },
      off: function (el, b) { if (b.text.indexOf(el.value) === 0) el.value = ''; } }
  };
  var demoTimers = [], demoUndo = [], holdUntil = 0;
  function later(ms, fn) { demoTimers.push(setTimeout(fn, ms)); }
  function demoPutBack() {
    demoUndo.splice(0).reverse().forEach(function (f) { try { f(); } catch (e) {} });
  }
  function demoEnd() {
    demoTimers.splice(0).forEach(clearTimeout);
    demoPutBack();
    spotEl = null;
  }
  /* a soft ring pressing on the card, so the eye knows what just happened */
  function tapMark(el) {
    if (!ui.tap.animate) return;
    var r = el.getBoundingClientRect(), T = 'translate(' + Math.round(r.left + r.width / 2) + 'px,' + Math.round(r.top + r.height / 2) + 'px)';
    ui.tap.animate([
      { transform: T + ' scale(1.5)', opacity: 0 },
      { transform: T + ' scale(.72)', opacity: 1, offset: .38 },
      { transform: T + ' scale(1.8)', opacity: 0 }
    ], { duration: 620, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
  function demoTap(beat, c, my) {
    var kind = DEMO[beat.b.tap], el = beat.el, b = beat.b;
    if (!kind) return;
    later(beat.b.stay ? 120 : 640, function () {
      if (my !== token || handsOff || !active) return;
      try {
        tapMark(el);
        if (kind.on(el, b, my) === false) return;
        demoUndo.push(function () { kind.off(el, b); });
        if (!kind.keep) holdUntil = performance.now() + (b.hold || 2600);
      } catch (e) { return; }
      /* whatever opened takes up room: bring it into view */
      later(460, function () {
        if (my !== token || handsOff || b.stay || cam !== c) return;
        var more = kind.also && kind.also(el);
        spotEl = more ? [el, more] : [el]; spotDirty = true;
        c.base = aimAll(more ? [more] : spotEl);             // what opened is what's worth reading
      });
    });
  }

  /* The glide while a stop is read. A spring follows a moving goal, so every
     change of direction or speed is eased, and the page can't jitter with
     the sound clock. The goal creeps through a tall section as the voice
     goes along (capped to a readable pace), or jumps to the card a beat names. */
  var DRIFT_PX_S = 90;
  function voiceTime() {
    var r = run;
    if (r) {
      var d = r.total || (isFinite(r.a.duration) ? r.a.duration : 0);
      var t = r.clock ? r.clock.t0 + (performance.now() - r.clock.c0) / 1000 : r.a.currentTime || 0;
      return d > 0 ? { t: t, d: d, r: r } : null;
    }
    if (autoClock) return { t: (performance.now() - autoClock.t0) / 1000, d: autoClock.ms / 1000, r: null };
    return null;
  }
  function stopCam() { if (cam) { cancelAnimationFrame(cam.rid); cam = null; } }
  function camStart(s, el, my) {
    stopCam();
    spotEl = null;
    if (reduce || handsOff) return;
    var R = roomNow(), y = window.pageYOffset;
    var words = s.say.split(' ');
    var beats = (s.beats || []).map(function (b) {
      var k = -1;
      for (var n = 0; n < words.length; n++) if (words[n].indexOf(b.at) === 0) { k = n; break; }
      var box = b.sel ? document.querySelector(b.sel) : null;
      if (b.find) Array.prototype.forEach.call(document.querySelectorAll(b.find), function (c) { if (!box && c.textContent.indexOf(b.has) >= 0) box = c; });
      /* a card that is hidden or missing right now is simply passed over */
      return k >= 0 && box && box.offsetHeight > 0 ? { k: k, el: box, n: words.length, b: b } : null;
    }).filter(Boolean);
    var drift = beats.length ? 0 : Math.max(0, Math.min(maxY(), docTop(el) + el.offsetHeight - R.bottom) - y);
    var settle = aimAt(el);
    if (Math.abs(settle - y) > 160 || drift) settle = y;       // sections that finished rendering late: ease into the true spot
    var c = cam = { y: y, v: 0, sent: y, goal: settle, base: settle, drift: lite ? 0 : drift, beats: beats, ease: drift ? .9 : .7, last: performance.now(), rid: 0 };
    var step = function (now) {
      if (cam !== c || my !== token) return;
      c.rid = requestAnimationFrame(step);
      var dt = Math.min(.05, Math.max(.001, (now - c.last) / 1000)); c.last = now;
      var v = voiceTime();
      if (v) {
        var when = function (b) {
          var w = v.r && v.r.clip.words;
          return w && w[b.k] ? w[b.k][0] - .25 : v.d * b.k / b.n;
        };
        while (c.beats.length && v.t >= when(c.beats[0])) {
          var b = c.beats.shift(), late = v.t - when(b) > 1.2;   // coming back mid-stop: don't replay what has passed
          if (b.b.tap && DEMO[b.b.tap] && !DEMO[b.b.tap].keep) demoPutBack();
          if (!b.b.stay) { spotEl = [b.el]; spotDirty = true; c.base = aimAll(spotEl); }
          bedHit();
          if (b.b.tap && !late) demoTap(b, c, my);
        }
        if (c.drift) {
          var p = Math.max(0, Math.min(1, (v.t - .6) / Math.max(1, v.d - 1.4)));
          c.goal = c.base + Math.min(c.drift, DRIFT_PX_S * v.d) * (p * p * (3 - 2 * p));
        } else c.goal = c.base;
      } else c.goal = c.base;
      /* critically damped spring */
      var w0 = 2 / c.ease, x = w0 * dt, k = 1 / (1 + x + .48 * x * x + .235 * x * x * x);
      var off = c.y - c.goal, tmp = (c.v + w0 * off) * dt;
      c.v = (c.v - w0 * tmp) * k;
      var ny = c.goal + (off + tmp) * k;
      if (lite) {                                               // one smooth move per change, by the browser
        if (Math.abs(c.goal - c.sent) > 2) { c.sent = c.goal; window.scrollTo({ top: c.goal, behavior: 'smooth' }); }
        return;
      }
      if (Math.abs(ny - c.y) > .02) { c.y = ny; window.scrollTo(0, ny); }
    };
    c.rid = requestAnimationFrame(step);
  }
  function stopMotion() {
    if (flight) flight.drop();
    flying = false;
    stopCam();
    instantScroll(false);
  }
  /* the visitor touched the page: it's theirs until the next stop */
  function takeOver(e) {
    if (!active || fin || handsOff) return;
    if (e && e.target && e.target.closest && e.target.closest('.tour-card')) return;
    if (!flight && !cam) return;
    handsOff = true;
    stopCam();
    if (flight) flight.land();
  }
  window.addEventListener('wheel', takeOver, { passive: true });
  window.addEventListener('touchstart', takeOver, { passive: true });

  /* Caption as words, so each one can light up the moment it is spoken
     (times come with the clip: audio/tour/manifest.json → words). A soft
     pill (with a slower glow trailing it) glides from word to word. */
  var wpos = null, words = [], syncRaf = 0, hl = null, hlTrail = null, hlAt = -1, hlTop = null;
  function renderWords(text) {
    ui.text.textContent = '';
    ui.text.classList.remove('live');
    hlTrail = document.createElement('span'); hlTrail.className = 'tour-hl trail'; hlTrail.setAttribute('aria-hidden', 'true');
    hl = document.createElement('span'); hl.className = 'tour-hl'; hl.setAttribute('aria-hidden', 'true');
    ui.text.appendChild(hlTrail); ui.text.appendChild(hl);
    hlAt = -1; hlTop = null; wpos = null;
    var list = text.split(' ');
    words = list.map(function (w, k) {
      var sp = document.createElement('span');
      sp.className = 'tw'; sp.textContent = w;
      ui.text.appendChild(sp);
      if (k < list.length - 1) ui.text.appendChild(document.createTextNode(' '));
      return sp;
    });
  }
  function pill(k, snap) {
    if (!hl) return;
    if (k < 0 || !words[k]) { hl.classList.remove('on'); hlTrail.classList.remove('on'); hlAt = -1; hlTop = null; return; }
    /* every word's box is measured once, together, then reused: one layout per stop instead of one per word */
    if (!wpos) wpos = words.map(function (w) { return [w.offsetLeft, w.offsetTop, w.offsetWidth, w.offsetHeight]; });
    var b = wpos[k];
    var x = b[0] - 4, y = b[1] - 1, ww = b[2] + 8, hh = b[3] + 2;
    var jump = snap || hlTop === null || Math.abs(y - hlTop) > 2;   // first word or a new line: no diagonal glide
    [hl, hlTrail].forEach(function (p) {
      if (jump) p.classList.add('jump');
      p.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      p.style.width = ww + 'px'; p.style.height = hh + 'px';
      p.classList.add('on');
    });
    if (jump) { var a = hl, t = hlTrail; requestAnimationFrame(function () { a.classList.remove('jump'); t.classList.remove('jump'); }); }
    hlAt = k; hlTop = y;
  }
  function markAll() { pill(-1); words.forEach(function (w) { w.classList.remove('now'); w.classList.add('said'); }); }

  /* the voice orb: loudness at this moment, eased so it swells and settles */
  var amp = 0, ampAt = '';
  function setAmp(v, hard) {
    if (reduce) v = v > 0 ? 0.45 : 0;
    amp = hard ? v : amp + (v - amp) * (v > amp ? 0.5 : 0.16);
    if (amp < 0.004) amp = 0;
    var s = amp.toFixed(2);
    if (s !== ampAt) { ampAt = s; ui.orb.style.setProperty('--amp', s); }
  }
  function digit(env, i) { var c = env.charCodeAt(i) - 48; return c >= 0 && c <= 9 ? c : 0; }
  function loud(env, fps, t) {
    var f = Math.max(0, t * fps), i0 = Math.floor(f), a = digit(env, i0), b = i0 + 1 < env.length ? digit(env, i0 + 1) : a;
    return (a + (b - a) * (f - i0)) / 9;
  }

  /* the waveform: the whole clip as bars, lit up to where the voice is */
  /* drawn only when another bar lights up (a few times a second, not every
     frame), and its size is measured once per stop or resize, not per frame */
  var scope = { env: null, w: 0, bars: null, cw: 0, ch: 0, lit: -1 };
  function clearScope() {
    var c = ui.scope, g = c.getContext && c.getContext('2d');
    if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); }
    scope.env = null; scope.lit = -1;           // the size stays: the card's width only changes on resize
  }
  window.addEventListener('resize', function () { scope.cw = 0; scope.lit = -1; }, { passive: true });
  try { if (document.fonts) document.fonts.addEventListener('loadingdone', function () { wpos = null; scope.cw = 0; scope.lit = -1; }); } catch (e) {}
  function drawScope(env, fps, t, d) {
    var c = ui.scope;
    if (!c.getContext) return;
    if (!scope.cw) { scope.cw = c.clientWidth; scope.ch = c.clientHeight; scope.lit = -1; }
    var w = scope.cw, h = scope.ch;
    if (!w || !h) { scope.cw = 0; return; }
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    if (scope.env !== env || scope.w !== w) {
      scope.lit = -1;
      var n = Math.max(24, Math.min(140, Math.floor(w / 4))), bars = [];
      for (var k = 0; k < n; k++) {
        var from = Math.floor(k * env.length / n), to = Math.max(from + 1, Math.floor((k + 1) * env.length / n)), m = 0;
        for (var j = from; j < to && j < env.length; j++) m = Math.max(m, digit(env, j));
        bars.push(m / 9);
      }
      scope.env = env; scope.w = w; scope.bars = bars;
    }
    var total = isFinite(d) && d > 0 ? d : env.length / fps;
    var p = Math.min(1, Math.max(0, t / total));
    var lit = Math.floor(p * scope.bars.length + 0.5);
    if (lit === scope.lit) return;
    scope.lit = lit;
    var g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    var B = scope.bars, N = B.length, stepW = w / N, bw = Math.max(1.5, stepW * 0.56), round = typeof g.roundRect === 'function';
    for (var pass = 0; pass < 2; pass++) {
      g.beginPath();
      for (var q = 0; q < N; q++) {
        var played = q < lit;
        if (played !== (pass === 1)) continue;
        var bh = Math.max(2, B[q] * (h - 2)), x = q * stepW + (stepW - bw) / 2, y = (h - bh) / 2;
        if (round) g.roundRect(x, y, bw, bh, bw / 2); else g.rect(x, y, bw, bh);
      }
      g.fillStyle = pass === 1 ? 'rgba(' + accNow + ',.95)' : 'rgba(200,225,240,.17)';
      g.fill();
    }
  }

  /* The clip now playing, and a watchdog on it: if the sound stops moving
     (a stalled download, the phone pausing it, a decoding error) it is
     nudged to play again, then reloaded straight from the server; if it
     still won't move, the stop carries on silently on a clock, so the words,
     waveform and next stop keep exactly the same timing. Never stuck. */
  var run = null;
  function guessSeconds(text) { return Math.max(4.5, text.split(/\s+/).length * 0.36); }
  function revive(r, t) {
    r.tries++; r.tryAt = performance.now();
    var a = r.a;
    try {
      if (r.tries >= 2 && r.clip.net && a.src !== r.clip.net) a.src = r.clip.net + '#t=' + Math.max(0, t).toFixed(2);
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function toClock(r, t) {
    if (r.clock) return;
    try { r.a.pause(); } catch (e) {}
    if (!r.total) r.total = isFinite(r.a.duration) && r.a.duration > 0 ? r.a.duration : guessSeconds(STEPS[idx].say);
    r.clock = { t0: Math.min(Math.max(0, t), r.total), c0: performance.now() };
    ui.orb.classList.remove('on');
    voiceNote('The voice paused here, so the captions carry on.');
  }
  function rescue(r) {
    if (!r || r !== run || r.clock) return;
    var t = r.lastT > 0 ? r.lastT : 0;
    if (r.tries < 2 && r.clip.net) { r.tries = 1; revive(r, t); } else toClock(r, t);
  }
  function follow(clip, my, end) {
    cancelAnimationFrame(syncRaf);
    run = null;
    if (!clip || !ui || !audio) { if (ui) { ui.text.classList.remove('live'); pill(-1); setAmp(0, true); } return; }
    var times = clip.words;
    if (!times || times.length !== words.length || reduce) { ui.text.classList.remove('live'); times = null; }
    else ui.text.classList.add('live');
    var env = clip.env, fps = clip.fps || 25;
    var at = -1;
    var r = run = { clip: clip, a: audio, end: end, clock: null, lastT: -1, lastMove: performance.now(), tries: 0, tryAt: 0, total: clip.seconds || 0 };
    words.forEach(function (w) { w.classList.remove('now', 'said'); });
    pill(-1);
    ui.bar.style.transition = 'none';
    (function tick() {
      if (my !== token || run !== r) return;
      var a = r.a, t, d, ms = performance.now();
      if (r.clock) {
        t = r.clock.t0 + (ms - r.clock.c0) / 1000; d = r.total;
        if (t >= d) { r.end(); return; }
      } else {
        if (audio !== a) return;
        if (a.ended) { r.end(); return; }
        t = a.currentTime || 0; d = a.duration;
        if (t > r.lastT + 0.005) { r.lastT = t; r.lastMove = ms; r.tries = 0; }
        else if (!document.hidden && ms - r.lastMove > 2000) {
          if (r.tries < 2 && (r.tries === 0 || ms - r.tryAt > 2000)) revive(r, t);
          else if (ms - r.tryAt > 2000) toClock(r, t);
        }
      }
      if (!env && isFinite(d) && d > 0) {             // the waveform shows progress itself when there is one
        var bx = Math.min(1, t / d).toFixed(3);
        if (bx !== barAt) { barAt = bx; ui.bar.style.transform = 'scaleX(' + bx + ')'; }
      }
      if (times) {
        var cur = -1;
        for (var k = 0; k < times.length; k++) { if (times[k][0] <= t + 0.04) cur = k; else break; }
        if (cur !== at) {
          for (var j = 0; j < words.length; j++) {
            words[j].classList.toggle('said', j < cur);
            words[j].classList.toggle('now', j === cur);
          }
          pill(cur);
          at = cur;
        }
      }
      /* loudness from the clip; the live voice has none, so a gentle stand-in */
      var v = r.clock || a.paused ? 0 : env ? loud(env, fps, t) : 0.32 + 0.28 * Math.abs(Math.sin(t * 8.3) * Math.sin(t * 2.9 + 1.2));
      setAmp(v);
      if (!r.clock && !a.paused) bedEnv(env ? loud(env, fps, t + .12) : .6);
      if (env) drawScope(env, fps, t, d);
      syncRaf = requestAnimationFrame(tick);
    })();
  }

  function voiceNote(t) { if (!ui) return; ui.voice.textContent = t || ''; ui.voice.hidden = !t; }
  function stopAudio() {
    clearTimeout(timer);
    follow(null);
    bedUnder(false);
    if (audio) { try { audio.pause(); } catch (e) {} audio.onended = null; audio.onerror = null; audio.onloadedmetadata = null; audio = null; }
    if (ui) ui.orb.classList.remove('on');
  }
  var barAt = '', autoClock = null;
  function resetBar() { barAt = ''; ui.bar.style.transition = 'none'; ui.bar.style.transform = 'scaleX(0)'; }
  function progress(ms) {
    barAt = '';
    ui.bar.style.transition = 'none'; ui.bar.style.transform = 'scaleX(0)';
    void ui.bar.offsetWidth;
    ui.bar.style.transition = 'transform ' + ms + 'ms linear'; ui.bar.style.transform = 'scaleX(1)';
  }
  function autoAdvance(text) {
    clearTimeout(timer);
    var ms = Math.max(4500, Math.min(11000, text.split(/\s+/).length * 330));
    autoClock = { t0: performance.now(), ms: ms };
    progress(ms);
    timer = setTimeout(next, ms);
  }
  function next() {
    if (!active || fin) return;
    if (choosing) {
      /* the question gets a moment; with no answer the suggested path, or the full tour, carries on */
      var fallback = suggestion() || 'all';
      if (choiceWaited) { pick(fallback, true); return; }
      choiceWaited = true;
      var chip = ui.acts.querySelector('[data-pick="' + fallback + '"]');
      if (chip) chip.classList.add('counting');            // its button fills up, so the wait explains itself
      timer = setTimeout(next, 9000);
      return;
    }
    if (idx < STEPS.length - 1) show(idx + 1); else finish();
  }

  /* the closing card: a short summary and the three things people want next */
  function finish() {
    if (!active || !ui || fin) return;
    token++;
    stopAudio();
    stopCam();
    demoEnd();
    bedEnd();
    resetBar();
    voiceNote('');
    fin = true;
    setAccent(FIN_ACC);
    ui.step.textContent = 'Tour complete';
    ui.finText.textContent = FIN[route].text;
    renderActs(ui.finActs, FIN[route].acts);
    if (stat) { stat.done = true; stat.secs = Math.round((Date.now() - stat.t0) / 1000); stat.dirty = true; statSend(); }
    ui.card.classList.remove('has-env');
    ui.card.classList.add('fin');
    ui.root.classList.add('fin');
    ui.fin.hidden = false;
    ui.fin.classList.remove('play');
    void ui.fin.offsetWidth;
    ui.fin.classList.add('play');
    setTimeout(function () { try { var b = ui.finActs.querySelector('.tour-act.main'); if (b && fin) b.focus({ preventScroll: true }); } catch (e) {} }, 60);
    try { if (window.gtag) gtag('event', 'tour_complete'); } catch (e) {}
  }
  function leaveFin() {
    if (!fin) return false;
    fin = false;
    ui.card.classList.remove('fin');
    ui.root.classList.remove('fin');
    ui.fin.hidden = true;
    ui.fin.classList.remove('play');
    return true;
  }

  /* voice: one request at a time (the voice server allows one); the next
     stop is fetched while this one plays */
  function fetchVoice(i) {
    var key = STEPS[i].id, say = STEPS[i].say;
    if (cache[key]) return cache[key];
    var attempt = function (n) {
      return timed(12000, function (sig) { return fetch(SPEAK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: say }), signal: sig }); })
        .then(function (r) {
          /* the voice server makes one clip at a time: wait and retry when busy */
          if (r.status === 429 && n < 4) return new Promise(function (ok) { setTimeout(ok, 900); }).then(function () { return attempt(n + 1); });
          if (!r.ok) throw new Error('voice ' + r.status);
          return r.json().then(function (d) {
            if (!d || !d.audio) throw new Error('no audio');
            var bin = atob(d.audio), bytes = new Uint8Array(bin.length);
            for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
            return { url: URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })), words: null, env: null, fps: 25 };
          });
        });
    };
    cache[key] = clipFor(i)
      .then(function (clip) {
        if (!clip) return attempt(0);
        /* the whole clip (about 50 KB) is downloaded before it plays, so it
           starts at once and can't stall halfway on a slow connection;
           if that download fails it simply streams from the server */
        return timed(6000, function (sig) {
          return fetch(clip.net, { signal: sig }).then(function (r) { if (!r.ok) throw new Error('clip ' + r.status); return r.blob(); });
        }).then(function (b) {
          if (!b || !b.size) throw new Error('empty clip');
          clip.url = URL.createObjectURL(/^audio\//.test(b.type) ? b : new Blob([b], { type: 'audio/mpeg' }));
          return clip;
        }).catch(function () { clip.url = clip.net; return clip; });
      })
      .catch(function (e) { delete cache[key]; throw e; });
    return cache[key];
  }
  function speak(i, my, at) {
    if (my !== token) return;
    if (muted) { ui.card.classList.remove('has-env'); autoAdvance(STEPS[i].say); return; }
    ui.orb.classList.add('on');
    voiceNote('Loading voice…');
    var settled = false;
    var captionsOnly = function () {
      if (settled || my !== token || !active) return;
      settled = true;
      ui.orb.classList.remove('on');
      ui.card.classList.remove('has-env');
      voiceNote('Voice unavailable right now — showing captions.');
      autoAdvance(STEPS[i].say);
    };
    var guard = setTimeout(captionsOnly, 14000);      // the voice never keeps the tour waiting
    fetchVoice(i).then(function (clip) {
      if (settled) return;
      settled = true; clearTimeout(guard);
      if (my !== token || !active || muted) return;
      if (!player) unlock();
      audio = player;
      audio.onloadedmetadata = null;
      ui.card.classList.toggle('has-env', !!clip.env);
      var done = false;
      var end = function () {
        if (done || my !== token) return;
        done = true;
        ui.orb.classList.remove('on');
        bedUnder(false);
        follow(null); markAll();
        if (clip.env) drawScope(clip.env, clip.fps || 25, 1, 1);
        /* something the tour just opened gets time to be seen before the page moves on */
        timer = setTimeout(next, Math.round(nextBeat(Math.max(.2, (holdUntil - performance.now()) / 1000)) * 1000));
      };
      audio.onended = end;
      audio.onerror = function () { if (my === token) rescue(run); };
      if (at > 0) {
        /* coming back from the pill: carry on from the word it paused on */
        if (!(audio.src === clip.url && audio.readyState >= 1)) audio.src = clip.url + (/^blob:/.test(clip.url) ? '' : '#t=' + at.toFixed(2));
        try { audio.currentTime = at; } catch (e) {}
        audio.onloadedmetadata = function () { try { if (audio && audio.currentTime < at - 0.3) audio.currentTime = at; } catch (e) {} };
      } else audio.src = clip.url;
      /* the music waits for nobody, so the voice joins it: its first word falls on a beat */
      var begin = function () {
        if (my !== token || !active || muted) return;
        follow(clip, my, end);
        bedUnder(true);
        var p = audio.play();
        voiceNote('');
        if (p && p.catch) p.catch(function (err) {
          if (my !== token || done) return;
          if (err && err.name === 'AbortError') return;   // a newer play() took over; the watchdog keeps an eye on it
          if (err && err.name === 'NotAllowedError') {
            /* the browser blocked sound: say how to turn it on, keep the captions moving */
            ui.orb.classList.remove('on');
            ui.card.classList.remove('has-env');
            follow(null);
            voiceNote('Your browser blocked the sound — tap the speaker button to hear the voice.');
            muted = true; paintMute();
            autoAdvance(STEPS[i].say);
            return;
          }
          rescue(run);                                     // try again from the server, else carry on silently
        });
      };
      voiceNote('');
      var wait = at > 0 ? 0 : voiceEntry(CLIP_LEAD);
      if (wait > .02) timer = setTimeout(begin, Math.round(wait * 1000)); else begin();
      if (!STEPS[i].choose && i + 1 < STEPS.length) setTimeout(function () { if (STEPS[i + 1]) fetchVoice(i + 1).catch(function () {}); }, 400);
    }).catch(function () { clearTimeout(guard); captionsOnly(); });
  }
  /* back from another app or tab: pick the voice up where it stopped */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden || !active || !run || run.clock || !audio || !audio.paused || audio.ended) return;
    run.lastMove = performance.now();
    try { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  });

  /* Changing stop: the controls update at once; the caption fades out while
     the page scrolls, and the new caption fades in — and the voice starts —
     only when the page has arrived, so words, spotlight and scroll match. */
  function show(i, at) {
    if (i < 0 || i >= STEPS.length) return;
    var my = ++token;
    stopAudio();
    stopCam();
    demoEnd();
    handsOff = false; autoClock = null;
    bedScene(STEPS[i].e, STEPS[i].key);
    resetBar();
    clearScope();
    voiceNote('');
    var first = leaveFin() || idx < 0 || at != null;
    idx = i;
    var s = STEPS[i], el = target(s);
    /* on phones some long parts start folded: open the ones this stop points into */
    if (window.phoneFold) {
      var need = [el];
      (s.beats || []).forEach(function (b) {
        if (b.sel) need.push(document.querySelector(b.sel));
        if (b.find) Array.prototype.forEach.call(document.querySelectorAll(b.find), function (c) { if (c.textContent.indexOf(b.has) >= 0) need.push(c); });
      });
      try { window.phoneFold.reveal(need); } catch (e) {}
    }
    setAccent(s.acc);
    choosing = !!s.choose; choiceWaited = false;
    ui.card.classList.toggle('choosing', choosing);
    ui.step.textContent = choosing ? (lastPath() ? 'Welcome back' : 'Welcome') : i + ' / ' + (STEPS.length - 1);
    ui.prev.disabled = i === 0;
    ui.next.textContent = i === STEPS.length - 1 ? 'Finish' : 'Next ›';
    if (stat && stat.stops.indexOf(s.k) < 0) { stat.stops.push(s.k); stat.dirty = true; }
    Array.prototype.forEach.call(ui.dots.children, function (d, k) { d.classList.toggle('on', k === i); d.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    if (!muted) fetchVoice(i).catch(function () {});   // fetch the voice while the page scrolls
    if (first) { ui.title.textContent = s.title; renderWords(s.say); renderActs(ui.acts, s.acts); }
    var swapped = false, landed = false, faded = reduce || first;
    var reveal = function () {
      if (my !== token || !active || swapped || !landed || !faded) return;
      swapped = true;
      ui.title.textContent = s.title;
      renderWords(s.say);
      renderActs(ui.acts, s.acts);
      ui.body.classList.remove('out');
      ui.body.classList.add('in');
      setTimeout(function () { ui.body.classList.remove('in'); }, 420);
      sweep();
      speak(i, my, at);
      if (el) camStart(s, el, my);
    };
    if (!faded) {
      ui.body.classList.add('out');
      setTimeout(function () { faded = true; reveal(); }, 200);
    }
    if (el) land(el, function () { landed = true; reveal(); }, my);
    else { landed = true; reveal(); }
    try { if (window.gtag) gtag('event', 'tour_step', { step: i + 1 }); } catch (e) {}
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); stop(); }
    else if (e.key === 'ArrowRight' || (e.key === ' ' && e.target === document.body)) { e.preventDefault(); if (choosing) pick(suggestion() || 'all'); else next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (fin) { bedOn(); show(idx); } else if (idx > 0) show(idx - 1); }
    else if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(e.key)) takeOver();
  }

  function start() {
    if (parked) { parked = null; clearTimeout(dockTimer); window.removeEventListener('scroll', onDockScroll); endAnims();
      ui.root.classList.remove('docked'); ui.card.style.visibility = ''; ui.card.style.pointerEvents = '';
      document.documentElement.classList.remove('tour-docked'); }
    if (active) return;
    useRoute('all');
    build();
    paintDots();
    statNew();
    if (lite) goLite();
    if (!muted) unlock();   // must run inside the tap
    bedOn();
    instantScroll(true);
    /* blocks that are only estimated until seen: give them their real size now, so every landing is exact */
    Array.prototype.forEach.call(document.querySelectorAll('.testimonials, .certifications'), function (b) { b.style.contentVisibility = 'visible'; });
    clips();                 // fetch the narration list now, so the first stop speaks at once
    if (typeof window.closeChat === 'function') { try { window.closeChat(); } catch (e) {} }
    if (typeof window.closeCaseStudy === 'function') { try { window.closeCaseStudy(); } catch (e) {} }
    active = true;
    leaveFin();
    document.documentElement.classList.add('tour-on');
    ui.root.classList.add('open');
    document.addEventListener('keydown', onKey, true);
    track();
    idx = -1;
    show(0);
    setTimeout(function () { try { (ui.acts.querySelector('.tour-act') || ui.next).focus({ preventScroll: true }); } catch (e) {} }, 50);
    try { if (window.gtag) gtag('event', 'tour_start'); } catch (e) {}
  }
  function cleanup() {
    Object.keys(cache).forEach(function (k) { cache[k].then(function (c) { try { if (c && /^blob:/.test(c.url)) URL.revokeObjectURL(c.url); } catch (e) {} }, function () {}); });
    cache = {};
  }
  function stop() {
    if (parked) { dockAway(); return; }
    if (!active) return;
    active = false; token++;
    stopAudio();
    stopMotion();
    demoEnd();
    bedOff(.6);
    cleanup();
    statSend();
    cancelAnimationFrame(raf);
    ui.root.classList.remove('open');
    document.documentElement.classList.remove('tour-on');
    document.removeEventListener('keydown', onKey, true);
    try { if (window.gtag) gtag('event', 'tour_end', { step: fin ? 'complete' : idx + 1 }); } catch (e) {}
  }

  window.shzTour = { start: start, stop: stop, clock: function () { return bed ? { t0: bed.t0, beat: BEAT, e: bed.sc.e } : null; } };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-tour]');
    if (!t) return;
    e.preventDefault();
    start();
  });
  /* ?tour opens the site straight into the tour */
  try {
    var p = new URLSearchParams(location.search);
    if (p.has('tour')) {
      p.delete('tour'); var q = p.toString();
      history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash);
      var go = function () { setTimeout(start, 700); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    }
  } catch (e) {}
})();
