/* ==== index.html line 3923 ==== */

(function () {
  var GOTO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M9 7h8v8"/></svg>';

  var LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219', 'C++': '#f34b7d',
    C: '#555555', Shell: '#89e051', Dart: '#00B4AB', Kotlin: '#A97BFF',
    Swift: '#F05138', Go: '#00ADD8', Ruby: '#701516', PHP: '#4F5D95',
    Vue: '#41b883', 'Jupyter Notebook': '#DA5B0B', Dockerfile: '#384d54',
    JSON: '#7dc4ff', EJS: '#a91e50', SCSS: '#c6538c', Other: 'rgba(200,220,215,0.35)'
  };
  function langColor(name) {
    if (LANG_COLORS[name]) return LANG_COLORS[name];
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return 'hsl(' + (hash % 360) + ', 55%, 60%)';
  }

  // ── Repo Ecosystem role tags ──
  // GitHub's API has no concept of "own product" vs "client work" vs
  // "OSS contribution" — that's a judgment call, not data. Every repo
  // defaults to "Own product" unless listed here by name. To reclassify
  // one, just add its repo name (the short name, e.g. "yojanasahay",
  // not the full owner/name) to CLIENT_REPOS or OSS_REPOS below.
  var CLIENT_REPOS = [];
  var OSS_REPOS = [];
  function repoOwnership(name) {
    if (CLIENT_REPOS.indexOf(name) !== -1) return { label: 'Client work', dot: 're-dot-client' };
    if (OSS_REPOS.indexOf(name) !== -1) return { label: 'OSS contribution', dot: 're-dot-oss' };
    return { label: 'Own product', dot: 're-dot-own' };
  }

  function timeAgo(iso) {
    var diffMs = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    var months = Math.floor(days / 30);
    return months + 'mo ago';
  }

  function monthYear(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function shortDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function animateCount(el, duration) {
    var target = parseInt((el.textContent || '0').replace(/[^0-9]/g, ''), 10);
    if (!target || isNaN(target)) return;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / (duration || 900), 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }

  function groupConsecutive(items) {
    var grouped = [];
    items.forEach(function (item) {
      var last = grouped[grouped.length - 1];
      if (last && last.type === item.type && last.repo === item.repo) {
        last.count += 1;
      } else {
        grouped.push({ type: item.type, repo: item.repo, url: item.url, time: item.time, count: 1 });
      }
    });
    return grouped;
  }

  function detailLine(g) {
    if (g.type === 'push') return g.count > 1 ? g.count + ' pushes' : '1 commit';
    if (g.type === 'pull_request') return g.count > 1 ? g.count + ' updates' : 'pull request';
    if (g.type === 'issue') return g.count > 1 ? g.count + ' updates' : 'issue activity';
    if (g.type === 'release') return 'new release';
    if (g.type === 'create_repo') return 'repository created';
    return '';
  }

  function renderFreshness(items) {
    var el = document.getElementById('raFreshness');
    if (!items || !items.length) return;
    el.textContent = 'Last shipped ' + timeAgo(items[0].time);
  }

  // Shipping Score — a derived 0–100 "momentum" number blending three
  // ingredients already available from /api/github-activity. Nothing here
  // is a real GitHub metric; it's a transparent, client-side-only blend
  // so the badge can be tapped open to show exactly what it's made of
  // instead of landing as an unexplained vanity number.
  //   • Streak    (40%) — current streak against a 14-day full-score cap.
  //   • Frequency (35%) — recent event volume against a 20-event cap.
  //   • Spread    (25%) — distinct repos touched recently, capped at 4.
  function computeShippingScore(pulse, activity) {
    var streakPct = pulse ? Math.round(Math.min((pulse.currentStreak || 0) / 14, 1) * 100) : 0;

    var list = activity || [];
    var freqPct = Math.round(Math.min(list.length / 20, 1) * 100);

    var repos = new Set();
    list.forEach(function (a) { if (a && a.repo) repos.add(a.repo); });
    var spreadPct = Math.round(Math.min(repos.size / 4, 1) * 100);

    var score = Math.round(streakPct * 0.4 + freqPct * 0.35 + spreadPct * 0.25);
    return { score: score, streakPct: streakPct, freqPct: freqPct, spreadPct: spreadPct };
  }

  // Trend delta — reconstructs what the score would have read exactly 7
  // days ago from data already on hand: the heatmap's daily counts give
  // us the streak as it stood then, and each activity item's own
  // timestamp lets us refilter frequency/spread to that same cutoff. No
  // stored history, no backend change — just the same data, read twice.
  // Windowed sum — total contributions across `days` days ending at
  // endDateStr (inclusive), read from the same heatmap already on hand.
  function sumWindow(heatmap, endDateStr, days) {
    var byDate = {};
    heatmap.forEach(function (d) { byDate[d.date] = d.count; });
    var total = 0;
    var cursor = new Date(endDateStr + 'T00:00:00Z');
    for (var i = 0; i < days; i++) {
      total += byDate[cursor.toISOString().slice(0, 10)] || 0;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return total;
  }

  // This-week-vs-last-week contribution trend — two adjacent 7-day
  // windows read from the heatmap, so it needs 14+ days of history to
  // be a fair comparison. Returns null (badge omitted) until then.
  function contributionsTrend(pulse) {
    var heatmap = pulse && pulse.heatmap;
    if (!heatmap || !heatmap.length) return null;
    var todayStr = heatmap[heatmap.length - 1].date;
    var priorEnd = new Date(todayStr + 'T00:00:00Z');
    priorEnd.setUTCDate(priorEnd.getUTCDate() - 7);
    var priorEndStr = priorEnd.toISOString().slice(0, 10);
    if (priorEndStr < heatmap[0].date) return null;
    var thisWeek = sumWindow(heatmap, todayStr, 7);
    var lastWeek = sumWindow(heatmap, priorEndStr, 7);
    return thisWeek - lastWeek;
  }

  // Current streak vs. what the streak stood at exactly 7 days ago —
  // reuses streakEndingOn() below, same trick as the score trend.
  function streakTrend(pulse) {
    var heatmap = pulse && pulse.heatmap;
    if (!heatmap || !heatmap.length) return null;
    var cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 7);
    var cutoffStr = cutoff.toISOString().slice(0, 10);
    if (cutoffStr < heatmap[0].date) return null;
    return pulse.currentStreak - streakEndingOn(heatmap, cutoffStr);
  }

  // Renders a small mono trend line reusing the score badge's existing
  // up/down color language, so all three trend indicators in this panel
  // (score, contributions, streak) read as one consistent system.
  function trendLineHtml(delta, label) {
    if (delta === null) return '';
    if (delta === 0) return '<div class="gp-trend-line">// steady ' + label + '</div>';
    var up = delta > 0;
    return '<div class="gp-trend-line ' + (up ? 'gp-trend-up' : 'gp-trend-down') + '">'
      + (up ? '\u25b2' : '\u25bc') + Math.abs(delta) + ' ' + label + '</div>';
  }

  function streakEndingOn(heatmap, dateStr) {
    var byDate = {};
    heatmap.forEach(function (d) { byDate[d.date] = d.count; });
    var streak = 0;
    var cursor = new Date(dateStr + 'T00:00:00Z');
    while (byDate[cursor.toISOString().slice(0, 10)] > 0) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
  }

  function scoreAsOfLastWeek(pulse, activity) {
    var heatmap = pulse && pulse.heatmap;
    if (!heatmap || !heatmap.length) return null;

    var cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 7);
    var cutoffStr = cutoff.toISOString().slice(0, 10);
    if (cutoffStr < heatmap[0].date) return null; // not enough history yet

    var cutoffEnd = new Date(cutoffStr + 'T23:59:59Z');
    var list = (activity || []).filter(function (a) {
      return a && a.time && new Date(a.time) <= cutoffEnd;
    });

    var pastStreakPct = Math.round(Math.min(streakEndingOn(heatmap, cutoffStr) / 14, 1) * 100);
    var pastFreqPct = Math.round(Math.min(list.length / 20, 1) * 100);
    var pastRepos = new Set();
    list.forEach(function (a) { if (a.repo) pastRepos.add(a.repo); });
    var pastSpreadPct = Math.round(Math.min(pastRepos.size / 4, 1) * 100);

    return Math.round(pastStreakPct * 0.4 + pastFreqPct * 0.35 + pastSpreadPct * 0.25);
  }

  function scoreDetailHtml(shipScore, delta) {
    function row(label, pct) {
      return '<div class="gp-score-row">'
        + '<span class="gp-score-label">' + label + '</span>'
        + '<span class="gp-score-track"><span class="gp-score-fill" data-fill="' + pct + '"></span></span>'
        + '<span class="gp-score-pct">' + pct + '%</span>'
        + '</div>';
    }
    var trendNote = '';
    if (delta !== null) {
      trendNote = '<div class="gp-score-note">// ' + (delta > 0 ? '+' + delta : delta) + ' vs 7 days ago</div>';
    }
    return row('Streak', shipScore.streakPct)
      + row('Frequency', shipScore.freqPct)
      + row('Repo spread', shipScore.spreadPct)
      + '<div class="gp-score-note">// weighted 40 \u00b7 35 \u00b7 25 across streak, frequency, spread</div>'
      + trendNote;
  }

  function wireScoreToggle(el) {
    var badge = el.querySelector('.gp-score-badge');
    var detail = el.querySelector('.gp-score-detail');
    if (!badge || !detail) return;
    var filled = false;
    badge.addEventListener('click', function () {
      var open = detail.classList.toggle('gp-open');
      badge.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && !filled) {
        filled = true;
        requestAnimationFrame(function () {
          detail.querySelectorAll('.gp-score-fill').forEach(function (fill) {
            fill.style.width = fill.getAttribute('data-fill') + '%';
          });
        });
      }
      var ping = badge.querySelector('.gp-score-ping');
      if (ping) ping.remove();
      try { localStorage.setItem('gpScoreSeen', '1'); } catch (e) {}
    });
  }

  // True from 6 PM IST onward — same UTC+5:30 conversion the API uses for
  // coding-hours, done client-side so it reflects whoever's looking right
  // now rather than needing a round trip.
  function isEveningIST() {
    var d = new Date();
    var istMinutes = (d.getUTCHours() * 60 + d.getUTCMinutes() + 330) % 1440;
    return Math.floor(istMinutes / 60) >= 18;
  }

  // True only if there's an actual streak worth protecting, and today (UTC,
  // matching how the API stamps heatmap dates) is the most recent heatmap
  // entry with zero contributions logged so far.
  function streakAtRisk(pulse) {
    if (!pulse || !pulse.currentStreak || !pulse.heatmap || !pulse.heatmap.length) return false;
    var last = pulse.heatmap[pulse.heatmap.length - 1];
    var todayStr = new Date().toISOString().slice(0, 10);
    return last.date === todayStr && last.count === 0 && isEveningIST();
  }

  function renderPulse(pulse, stats, activity, rangeLabel) {
    var el = document.getElementById('raPulse');
    if (!pulse) { el.innerHTML = ''; return; }
    rangeLabel = rangeLabel || 'last 90 days';

    var ratio = pulse.longestStreak > 0
      ? Math.min(pulse.currentStreak / pulse.longestStreak, 1)
      : (pulse.currentStreak > 0 ? 1 : 0);
    var r = 35, c = 2 * Math.PI * r;
    var offset = c * (1 - ratio);
    var atRisk = streakAtRisk(pulse);

    var ytd = stats
      ? '<div class="gp-ytd">// ' + new Date().getFullYear() + ' → <b>' + stats.commits + '</b> commits · <b>' + stats.pullRequests + '</b> PRs · <b>' + stats.issues + '</b> issues · <b>' + stats.repos + '</b> repos</div>'
      : '';

    var shipScore = computeShippingScore(pulse, activity);
    var pastScore = scoreAsOfLastWeek(pulse, activity);
    var delta = pastScore === null ? null : shipScore.score - pastScore;
    var contribDelta = contributionsTrend(pulse);
    var streakDelta = streakTrend(pulse);

    var trendHtml = '';
    var trendAria = '';
    if (delta !== null && delta !== 0) {
      var up = delta > 0;
      trendHtml = '<span class="gp-score-trend ' + (up ? 'gp-trend-up' : 'gp-trend-down') + '" aria-hidden="true">'
        + (up ? '\u25b2' : '\u25bc') + Math.abs(delta) + '</span>';
      trendAria = ', ' + (up ? 'up ' : 'down ') + Math.abs(delta) + ' from last week';
    } else if (delta === 0) {
      trendAria = ', unchanged from last week';
    }

    var scoreSeen = false;
    try { scoreSeen = localStorage.getItem('gpScoreSeen') === '1'; } catch (e) {}
    var scoreBadge =
        '<button type="button" class="gp-score-badge" id="gpScoreBadge" aria-expanded="false" aria-controls="gpScoreDetail" aria-label="Shipping score ' + shipScore.score + ' out of 100' + trendAria + ' — tap for breakdown">'
      +   (scoreSeen ? '' : '<span class="gp-score-ping" aria-hidden="true"></span>')
      +   '<span class="gp-score-num">' + shipScore.score + '</span><span>score</span>'
      +   trendHtml
      +   '<svg class="gp-score-caret" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>'
      + '</button>';
    var scoreDetail = '<div class="gp-score-detail" id="gpScoreDetail">' + scoreDetailHtml(shipScore, delta) + '</div>';

    el.innerHTML =
        '<div class="ra-label-row"><span class="ra-label">GitHub Pulse</span><span class="ra-label-sub">// ' + rangeLabel + '</span></div>'
      + '<div class="gp-panel">'
      +   scoreBadge
      +   '<div class="gp-grid">'
      +   '<div class="gp-block">'
      +     '<span class="gp-num ra-accent" id="gpTotal">' + pulse.totalContributions + '</span>'
      +     '<div class="gp-caption">Contributions</div>'
      +     trendLineHtml(contribDelta, 'vs last week')
      +   '</div>'
      +   '<div class="gp-block">'
      +     '<div class="gp-ring-wrap' + (atRisk ? ' gp-ring-risk' : '') + '">'
      +       '<svg viewBox="0 0 82 82" width="82" height="82">'
      +         '<circle class="gp-ring-bg" cx="41" cy="41" r="' + r + '"></circle>'
      +         '<circle class="gp-ring-fg" cx="41" cy="41" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-offset="' + offset.toFixed(1) + '"></circle>'
      +       '</svg>'
      +       '<div class="gp-ring-center"><span class="gp-ring-num">' + pulse.currentStreak + '</span><span class="gp-ring-flame">🔥 streak</span></div>'
      +     '</div>'
      +     (pulse.currentRange ? '<div class="gp-range">' + shortDate(pulse.currentRange[0]) + ' – ' + shortDate(pulse.currentRange[1]) + '</div>' : '')
      +     trendLineHtml(streakDelta, 'vs 7 days ago')
      +   '</div>'
      +   '<div class="gp-block">'
      +     '<span class="gp-num">' + pulse.longestStreak + '</span>'
      +     '<div class="gp-caption">Longest streak</div>'
      +     (pulse.longestRange ? '<div class="gp-range">' + shortDate(pulse.longestRange[0]) + ' – ' + shortDate(pulse.longestRange[1]) + '</div>' : '')
      +   '</div>'
      + '</div>'
      + ytd
      + scoreDetail
      + '</div>';

    animateCount(document.getElementById('gpTotal'), 1000);
    requestAnimationFrame(function () {
      var ring = el.querySelector('.gp-ring-fg');
      if (ring) ring.style.strokeDashoffset = ring.getAttribute('data-offset');
    });
    wireScoreToggle(el);
  }

  function formatFriendlyDate(dateStr) {
    var p = dateStr.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // Groups raw activity events by the UTC calendar day they happened on,
  // so a tapped heatmap cell can show what was actually touched that
  // day instead of just the count already visible in its color.
  function buildDayBreakdown(activity) {
    var byDate = {};
    (activity || []).forEach(function (a) {
      if (!a || !a.time || !a.repo) return;
      var d = new Date(a.time);
      if (isNaN(d)) return;
      var key = d.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = {};
      byDate[key][a.repo] = (byDate[key][a.repo] || 0) + 1;
    });
    var out = {};
    Object.keys(byDate).forEach(function (key) {
      out[key] = Object.keys(byDate[key])
        .map(function (repo) { return { repo: repo, count: byDate[key][repo] }; })
        .sort(function (a, b) { return b.count - a.count; });
    });
    return out;
  }

  function wireHeatmapPopover(el, dayBreakdown) {
    var scrollBox = el.querySelector('.hm-scroll');
    var pop = document.createElement('div');
    pop.className = 'hm-day-pop';
    pop.setAttribute('role', 'status');
    el.appendChild(pop);
    var openBtn = null;

    function closePop() {
      pop.classList.remove('hm-open');
      if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); openBtn = null; }
    }

    el.querySelectorAll('button.hm-cell').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (openBtn === btn) { closePop(); return; }

        var date = btn.getAttribute('data-date');
        var count = parseInt(btn.getAttribute('data-count'), 10) || 0;
        var breakdown = dayBreakdown[date] || [];

        var html = '<div class="hm-day-pop-date">' + formatFriendlyDate(date) + '</div>'
          + '<div class="hm-day-pop-count">' + count + (count === 1 ? ' contribution' : ' contributions') + '</div>';
        if (breakdown.length) {
          html += breakdown.slice(0, 5).map(function (r) {
            return '<div class="hm-day-pop-repo"><span>' + escapeHtml(r.repo) + '</span><b>' + r.count + '</b></div>';
          }).join('');
        } else if (count > 0) {
          html += '<div class="hm-day-pop-empty">Repo breakdown unavailable for this day.</div>';
        } else {
          html += '<div class="hm-day-pop-empty">No public activity.</div>';
        }
        pop.innerHTML = html;
        pop.classList.add('hm-open');

        var cRect = el.getBoundingClientRect();
        var bRect = btn.getBoundingClientRect();
        var popW = pop.offsetWidth, popH = pop.offsetHeight;

        // Room ABOVE the cell within the panel itself (not the viewport) —
        // a cell in the grid's top row has almost no panel space above it
        // even when the panel sits mid-page, so checking viewport room
        // alone let the popup overflow past the panel into whatever card
        // sits above it. Flip below whenever it wouldn't actually fit.
        var spaceAbove = bRect.top - cRect.top;
        var below = spaceAbove < (popH + 14);
        var top = below
          ? (bRect.bottom - cRect.top) + 10
          : (bRect.top - cRect.top) - popH - 10;

        var left = (bRect.left - cRect.left) + (bRect.width / 2) - (popW / 2);
        var maxLeft = el.clientWidth - popW - 6;
        left = Math.max(6, Math.min(left, maxLeft));

        pop.style.top = top + 'px';
        pop.style.left = left + 'px';

        if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
        openBtn = btn;
        btn.setAttribute('aria-expanded', 'true');
      });
    });

    document.addEventListener('click', function (e) {
      if (openBtn && !pop.contains(e.target) && e.target !== openBtn) closePop();
    });
    if (scrollBox) scrollBox.addEventListener('scroll', closePop);
    window.addEventListener('resize', closePop);
  }

  function renderHeatmap(pulse, activity, rangeLabel) {
    var el = document.getElementById('raHeatmap');
    var days = pulse && pulse.heatmap;
    rangeLabel = rangeLabel || 'last 90 days';
    if (!days || !days.length) { el.innerHTML = ''; return; }

    var first = new Date(days[0].date + 'T00:00:00Z');
    var pad = first.getUTCDay();
    var cells = [];
    for (var p = 0; p < pad; p++) cells.push(null);
    days.forEach(function (d) { cells.push(d); });
    while (cells.length % 7 !== 0) cells.push(null);

    var max = 0;
    days.forEach(function (d) { if (d.count > max) max = d.count; });

    function levelClass(count) {
      if (!count) return '';
      var ratio = max > 0 ? count / max : 0;
      if (ratio > 0.75) return ' hm-l4';
      if (ratio > 0.45) return ' hm-l3';
      if (ratio > 0.15) return ' hm-l2';
      return ' hm-l1';
    }

    var activeDays = 0, windowTotal = 0, peakDay = null;
    days.forEach(function (d) {
      if (d.count > 0) activeDays++;
      windowTotal += d.count;
      if (!peakDay || d.count > peakDay.count) peakDay = d;
    });
    var avgPerActiveDay = activeDays ? Math.round((windowTotal / activeDays) * 10) / 10 : 0;

    var sideHtml = '<div class="hm-side">'
      + '<div class="hm-side-row"><span class="hm-side-num">' + activeDays + ' <small>/' + days.length + '</small></span><span class="hm-side-label">active days</span></div>'
      + (peakDay && peakDay.count > 0
          ? '<div class="hm-side-row"><span class="hm-side-num">' + peakDay.count + '</span><span class="hm-side-label">peak \u00b7 ' + shortDate(peakDay.date) + '</span></div>'
          : '')
      + '<div class="hm-side-row"><span class="hm-side-num">' + avgPerActiveDay + '</span><span class="hm-side-label">avg / active day</span></div>'
      + '</div>';

    var gridHtml = cells.map(function (d) {
      if (!d) return '<div class="hm-cell"></div>';
      var title = d.date + ' · ' + d.count + (d.count === 1 ? ' contribution' : ' contributions');
      var aria = title + ' — tap for details';
      return '<button type="button" class="hm-cell' + levelClass(d.count) + '" data-date="' + d.date + '" data-count="' + d.count
        + '" title="' + title + '" aria-label="' + aria + '" aria-haspopup="true" aria-expanded="false"></button>';
    }).join('');

    el.innerHTML =
        '<div class="ra-label-row"><span class="ra-label">Contribution Map</span><span class="ra-label-sub">// ' + rangeLabel + '</span></div>'
      + '<div class="hm-body">'
      +   '<div class="hm-scroll"><div class="hm-grid">' + gridHtml + '</div></div>'
      +   sideHtml
      + '</div>'
      + '<div class="hm-legend">Less'
      +   '<span class="hm-cell"></span><span class="hm-cell hm-l1"></span><span class="hm-cell hm-l2"></span><span class="hm-cell hm-l3"></span><span class="hm-cell hm-l4"></span>'
      +   'More</div>';

    wireHeatmapPopover(el, buildDayBreakdown(activity));
  }

  // Commit Punchcard — buckets every activity event into a 7×24
  // (weekday × hour) matrix, entirely from the same `activity` array
  // already loaded for the feed. Hour bucketing is shifted to IST
  // (UTC+5:30) to line up with the existing Coding Hours histogram, by
  // simply adding the offset to each timestamp before reading its UTC
  // day/hour — that naturally handles the midnight day-rollover too.
  var PC_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var PC_HOUR_LABEL_AT = { 0: '12a', 6: '6a', 12: '12p', 18: '6p' };

  function formatHour12(h) {
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (h < 12 ? 'am' : 'pm');
  }

  // Per-cell repo breakdown for the punchcard popover — mirrors
  // buildDayBreakdown() above but keyed by "weekday-hour" (IST) instead
  // of calendar date, since a punchcard cell can span many different days.
  function buildPunchcardBreakdown(activity) {
    var byCell = {};
    (activity || []).forEach(function (a) {
      if (!a || !a.time) return;
      var t = new Date(a.time);
      if (isNaN(t)) return;
      var ist = new Date(t.getTime() + 330 * 60000);
      var key = ist.getUTCDay() + '-' + ist.getUTCHours();
      var repoKey = a.repo || 'unknown';
      if (!byCell[key]) byCell[key] = {};
      byCell[key][repoKey] = (byCell[key][repoKey] || 0) + 1;
    });
    var out = {};
    Object.keys(byCell).forEach(function (key) {
      out[key] = Object.keys(byCell[key])
        .map(function (repo) { return { repo: repo, count: byCell[key][repo] }; })
        .sort(function (a, b) { return b.count - a.count; });
    });
    return out;
  }

  // Reads the actual hour-of-day distribution and tags a short, honest
  // "coding persona" — purely descriptive, computed straight from the
  // same matrix already on screen (no separate request, no guesswork).
  function describePunchcardPersona(matrix, totalEvents) {
    if (totalEvents < 10) return null; // not enough signal yet to label a pattern
    var hourTotals = new Array(24).fill(0);
    matrix.forEach(function (row) { row.forEach(function (v, h) { hourTotals[h] += v; }); });

    var buckets = {
      'Night Owl \ud83c\udf19': [22, 23, 0, 1, 2, 3, 4],
      'Early Bird \ud83c\udf05': [5, 6, 7, 8, 9],
      'Afternoon Grinder \u2600\ufe0f': [10, 11, 12, 13, 14, 15, 16],
      'Evening Coder \ud83c\udf07': [17, 18, 19, 20, 21]
    };
    var best = null, bestSum = -1;
    Object.keys(buckets).forEach(function (label) {
      var sum = buckets[label].reduce(function (acc, h) { return acc + hourTotals[h]; }, 0);
      if (sum > bestSum) { bestSum = sum; best = label; }
    });

    var weekend = matrix[0].reduce(function (a, v) { return a + v; }, 0) + matrix[6].reduce(function (a, v) { return a + v; }, 0);
    var weekday = 0;
    for (var d = 1; d <= 5; d++) weekday += matrix[d].reduce(function (a, v) { return a + v; }, 0);
    var weekendAvg = weekend / 2, weekdayAvg = weekday / 5;
    var tags = [best];
    if (weekendAvg > weekdayAvg * 1.15) tags.push('Weekend Warrior \ud83d\udee0\ufe0f');
    else if (weekdayAvg > weekendAvg * 1.15 && weekday > 0) tags.push('Weekday Regular \ud83d\udcbc');
    return tags;
  }

  // Popover is appended to `card` (the .pc-card element itself) and all
  // rect math is measured against that same element, since .pc-card is
  // both the positioned ancestor AND the horizontally-scrolling box here
  // (unlike the heatmap, which splits those two roles across separate
  // elements) — keeping both in one element avoids a mismatched frame of
  // reference between where the popover is anchored and where its
  // top/left are calculated from.
  function wirePunchcardPopover(card, breakdown) {
    var pop = document.createElement('div');
    pop.className = 'pc-pop';
    pop.setAttribute('role', 'status');
    card.appendChild(pop);
    var openBtn = null;

    function closePop() {
      pop.classList.remove('pc-open');
      if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); openBtn = null; }
    }

    card.querySelectorAll('button.pc-cell').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (openBtn === btn) { closePop(); return; }

        var d = parseInt(btn.getAttribute('data-day'), 10);
        var h = parseInt(btn.getAttribute('data-hour'), 10);
        var count = parseInt(btn.getAttribute('data-count'), 10) || 0;
        var breakdown_ = breakdown[d + '-' + h] || [];

        var html = '<div class="pc-pop-date">' + PC_DAY_LABELS[d] + ' \u00b7 ' + formatHour12(h) + ' IST</div>'
          + '<div class="pc-pop-count">' + count + (count === 1 ? ' event' : ' events') + '</div>';
        if (breakdown_.length) {
          html += breakdown_.slice(0, 5).map(function (r) {
            return '<div class="pc-pop-repo"><span>' + escapeHtml(r.repo) + '</span><b>' + r.count + '</b></div>';
          }).join('');
        } else {
          html += '<div class="pc-pop-empty">No public activity in this window.</div>';
        }
        pop.innerHTML = html;
        pop.classList.add('pc-open');

        var cRect = card.getBoundingClientRect();
        var bRect = btn.getBoundingClientRect();
        var popW = pop.offsetWidth, popH = pop.offsetHeight;

        var spaceAbove = bRect.top - cRect.top;
        var below = spaceAbove < (popH + 14);
        var top = below
          ? (bRect.bottom - cRect.top) + card.scrollTop + 10
          : (bRect.top - cRect.top) + card.scrollTop - popH - 10;

        var left = (bRect.left - cRect.left) + card.scrollLeft + (bRect.width / 2) - (popW / 2);
        var maxLeft = card.scrollLeft + card.clientWidth - popW - 6;
        left = Math.max(card.scrollLeft + 6, Math.min(left, maxLeft));

        pop.style.top = top + 'px';
        pop.style.left = left + 'px';

        if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
        openBtn = btn;
        btn.setAttribute('aria-expanded', 'true');
      });
    });

    document.addEventListener('click', function (e) {
      if (openBtn && !pop.contains(e.target) && e.target !== openBtn) closePop();
    });
    card.addEventListener('scroll', closePop);
    window.addEventListener('resize', closePop);
  }

  // ── Time-range filter ──
  // The raw `activity` array is whatever GitHub's public events API
  // returned (recent events only, capped at ~90 days / 300 events by
  // GitHub itself — this endpoint can't go back further than that, so
  // "All" below really means "everything GitHub gives us", not forever).
  // Filtering client-side against that same array means no extra
  // request per tap. Defaults to "All" so a quiet week doesn't render an
  // empty card by default — narrowing to 7D/30D is opt-in.
  var PC_RANGES = [
    { key: '7', label: '7D', days: 7 },
    { key: '30', label: '30D', days: 30 },
    { key: '90', label: '90D', days: 90 },
    { key: 'all', label: 'All', days: null }
  ];
  var pcState = { rawActivity: [], pulse: null, range: 'all' };

  function filterActivityByRange(list, days) {
    if (!days) return list;
    var cutoff = Date.now() - days * 86400000;
    return list.filter(function (a) {
      var t = new Date(a.time).getTime();
      return !isNaN(t) && t >= cutoff;
    });
  }

  // Falls back to the daily contribution calendar (pulse.heatmapFull,
  // already fetched up to ~1 year deep for the Contribution Map) to find
  // the most recent day with any activity at all. That calendar has no
  // hour-of-day detail, so it can't fill in the punchcard itself — but
  // it's enough to tell a visitor "here's when they were last active"
  // instead of just a blank card when the hourly feed has nothing.
  function findLastActiveDate(pulse) {
    if (!pulse || !pulse.heatmapFull) return null;
    var days = pulse.heatmapFull;
    for (var i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) return days[i].date;
    }
    return null;
  }

  function renderPunchcardEmptyState(hasAnyRawActivity) {
    if (hasAnyRawActivity) {
      return '<div class="pc-empty">No public activity in this window \u2014 try a wider range above.</div>';
    }
    var lastActive = findLastActiveDate(pcState.pulse);
    if (lastActive) {
      return '<div class="pc-empty">No hourly activity data available right now (GitHub\u2019s public events feed only keeps recent history). Last recorded contribution: <b>' + formatFriendlyDate(lastActive) + '</b>.</div>';
    }
    return '<div class="pc-empty">No public activity tracked yet \u2014 check back after the next push.</div>';
  }

  function renderPunchcardBody(bodyEl) {
    var rangeDef = PC_RANGES.filter(function (r) { return r.key === pcState.range; })[0] || PC_RANGES[3];
    var list = filterActivityByRange(pcState.rawActivity, rangeDef.days);

    if (!list.length) {
      bodyEl.innerHTML = '<div class="pc-card">' + renderPunchcardEmptyState(pcState.rawActivity.length > 0) + '</div>';
      return;
    }

    var matrix = [];
    for (var d = 0; d < 7; d++) matrix.push(new Array(24).fill(0));

    var minTime = null, maxTime = null;
    list.forEach(function (a) {
      var t = new Date(a.time);
      if (isNaN(t)) return;
      if (!minTime || t < minTime) minTime = t;
      if (!maxTime || t > maxTime) maxTime = t;
      var ist = new Date(t.getTime() + 330 * 60000); // shift to IST, then read as UTC
      matrix[ist.getUTCDay()][ist.getUTCHours()]++;
    });

    var max = 0, totalEvents = 0, activeHoursSet = {};
    matrix.forEach(function (row) {
      row.forEach(function (v, h) {
        if (v > max) max = v;
        totalEvents += v;
        if (v > 0) activeHoursSet[h] = true;
      });
    });
    if (max === 0) {
      bodyEl.innerHTML = '<div class="pc-card">' + renderPunchcardEmptyState(pcState.rawActivity.length > 0) + '</div>';
      return;
    }
    var activeHours = Object.keys(activeHoursSet).length;

    var peak = { day: 0, hour: 0, count: 0 };
    matrix.forEach(function (row, d) {
      row.forEach(function (v, h) { if (v > peak.count) peak = { day: d, hour: h, count: v }; });
    });

    var dayTotals = matrix.map(function (row) { return row.reduce(function (a, v) { return a + v; }, 0); });

    var headHtml = '<div class="pc-row pc-head-row"><span class="pc-day-label"></span>';
    for (var h0 = 0; h0 < 24; h0++) {
      headHtml += '<span class="pc-hour-label">' + (PC_HOUR_LABEL_AT[h0] || '') + '</span>';
    }
    headHtml += '<span class="pc-day-total">\u03a3</span></div>';

    var bodyHtml = matrix.map(function (row, d) {
      var cells = row.map(function (count, h) {
        var isPeak = (d === peak.day && h === peak.hour);
        var label = PC_DAY_LABELS[d] + ' ' + formatHour12(h) + ' IST \u00b7 ' + count + (count === 1 ? ' event' : ' events');
        var size = (4.5 + Math.sqrt(count / max) * 8.5).toFixed(1);
        var dot = count
          ? '<span class="pc-dot" style="width:' + size + 'px;height:' + size + 'px;"></span>'
          : '<span class="pc-dot-ghost"></span>';
        return '<button type="button" class="pc-cell' + (isPeak ? ' pc-peak' : '') + '" data-day="' + d + '" data-hour="' + h + '" data-count="' + count
          + '" aria-expanded="false" aria-label="' + label + '">' + dot + '</button>';
      }).join('');
      return '<div class="pc-row"><span class="pc-day-label">' + PC_DAY_LABELS[d] + '</span>' + cells
        + '<span class="pc-day-total">' + (dayTotals[d] || '') + '</span></div>';
    }).join('');

    var days = minTime ? Math.max(1, Math.round((maxTime - minTime) / 86400000)) : null;
    var coverage = days ? '<div class="pc-coverage">// based on the last ' + days + ' day' + (days === 1 ? '' : 's') + ' of public activity in this range</div>' : '';
    var peakNote = '<div class="pc-peak-note">Busiest window: <b>' + PC_DAY_LABELS[peak.day] + '</b> around <b>' + formatHour12(peak.hour) + ' IST</b></div>';

    var personaTags = describePunchcardPersona(matrix, totalEvents);
    var metaRow = '<div class="pc-meta-row">'
      + (personaTags ? personaTags.map(function (t) { return '<span class="pc-tag">' + t + '</span>'; }).join('') : '')
      + '<span class="pc-meta-stat">' + totalEvents + (totalEvents === 1 ? ' event' : ' events') + ' \u00b7 ' + activeHours + ' active hr' + (activeHours === 1 ? '' : 's') + ' of 24</span>'
      + '</div>';

    var legend = '<div class="pc-legend">Less'
      + '<span class="pc-legend-dots">'
      +   [0.15, 0.4, 0.7, 1].map(function (ratio) {
            var size = (4.5 + Math.sqrt(ratio) * 8.5).toFixed(1);
            return '<span class="pc-dot" style="width:' + size + 'px;height:' + size + 'px;"></span>';
          }).join('')
      + '</span>More</div>';

    bodyEl.innerHTML =
      '<div class="pc-card">' + metaRow + '<div class="pc-scroll">' + headHtml + bodyHtml + '</div>' + legend + peakNote + coverage + '</div>';

    wirePunchcardPopover(bodyEl.querySelector('.pc-card'), buildPunchcardBreakdown(list));
  }

  function renderPunchcard(activity, pulse) {
    var el = document.getElementById('raPunchcard');
    if (!el) return;
    pcState.rawActivity = (activity || []).filter(function (a) { return a && a.time; });
    pcState.pulse = pulse || null;

    var pillsHtml = PC_RANGES.map(function (r) {
      return '<button type="button" class="pc-range-pill' + (r.key === pcState.range ? ' active' : '') + '" data-range="' + r.key + '" aria-pressed="' + (r.key === pcState.range) + '">' + r.label + '</button>';
    }).join('');

    el.innerHTML =
        '<div class="ra-label-row"><span class="ra-label">Commit Punchcard</span><span class="ra-label-sub">// day \u00d7 hour, IST</span></div>'
      + '<div class="pc-range-row">' + pillsHtml + '</div>'
      + '<div class="pc-body"></div>';

    var bodyEl = el.querySelector('.pc-body');

    el.querySelectorAll('.pc-range-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('active')) return;
        pcState.range = btn.getAttribute('data-range');
        el.querySelectorAll('.pc-range-pill').forEach(function (b) {
          var isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-pressed', isActive);
        });
        renderPunchcardBody(bodyEl);
      });
    });

    renderPunchcardBody(bodyEl);
  }

  // Thin multi-line sparkline for up to 3 languages' share over time,
  // drawn from real daily snapshots (data.languageHistory). Returns null
  // if there isn't a real value to plot yet — callers show an honest
  // "still collecting" message instead in that case.
  function buildLanguageDriftSvg(history, topLanguages) {
    var names = topLanguages.slice(0, 3).map(function (l) { return l.name; });
    var w = 200, h = 30, padX = 2, padY = 3, n = history.length;
    var maxVal = 0;
    var series = names.map(function (name) {
      return history.map(function (entry) {
        var found = (entry.languages || []).filter(function (l) { return l.name === name; })[0];
        var v = found ? found.percent : 0;
        if (v > maxVal) maxVal = v;
        return v;
      });
    });
    if (maxVal <= 0) return null;
    maxVal *= 1.15;

    function xAt(i) { return n > 1 ? padX + (i / (n - 1)) * (w - padX * 2) : w / 2; }
    function yAt(v) { return h - padY - (v / maxVal) * (h - padY * 2); }

    var paths = series.map(function (vals, idx) {
      var d = vals.map(function (v, i) { return (i === 0 ? 'M' : 'L') + xAt(i).toFixed(1) + ',' + yAt(v).toFixed(1); }).join(' ');
      return '<path d="' + d + '" fill="none" stroke="' + langColor(names[idx]) + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="' + (idx === 0 ? '0.95' : '0.55') + '"></path>';
    }).join('');

    return '<svg class="lang-drift-svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + paths + '</svg>';
  }

  // Splits the 24-hour IST histogram into 4 dayparts. Returns null (no
  // buckets shown) if the histogram is empty rather than dividing by zero.
  function timeOfDayBuckets(hist) {
    var total = hist.reduce(function (a, b) { return a + b; }, 0);
    if (!total) return null;
    var defs = [
      { name: 'Night', icon: '\ud83c\udf19', from: 0, to: 5 },
      { name: 'Morning', icon: '\ud83c\udf05', from: 6, to: 11 },
      { name: 'Afternoon', icon: '\u2600\ufe0f', from: 12, to: 17 },
      { name: 'Evening', icon: '\ud83c\udf06', from: 18, to: 23 }
    ];
    return defs.map(function (b) {
      var sum = 0;
      for (var h = b.from; h <= b.to; h++) sum += hist[h];
      return { name: b.name, icon: b.icon, pct: Math.round((sum / total) * 100) };
    });
  }

  function renderLanguagesAndHours(languages, codingHours, languageHistory) {
    var el = document.getElementById('raLangHours');
    var langHtml = '';
    var hoursHtml = '';

    if (languages && languages.length) {
      /* The ring: a track behind the segments, rounded caps and a small
         gap between languages, so it reads as a designed chart rather
         than three arcs touching. The whole thing is interactive — tap a
         language and the ring isolates it. */
      var r = 30, c = 2 * Math.PI * r, cumulative = 0;
      var GAP = 1.6;                                   // px of arc between segments
      var segs = languages.map(function (l, i) {
        var arcLen = Math.max(c * (l.percent / 100) - GAP, 1.2);
        var seg = '<circle class="lang-seg" data-lang="' + i + '" cx="38" cy="38" r="' + r + '"'
          + ' fill="none" stroke="' + langColor(l.name) + '" stroke-width="9" stroke-linecap="round"'
          + ' stroke-dasharray="' + arcLen.toFixed(1) + ' ' + (c - arcLen).toFixed(1) + '"'
          + ' stroke-dashoffset="' + (-cumulative).toFixed(1) + '"></circle>';
        cumulative += c * (l.percent / 100);
        return seg;
      }).join('');
      var track = '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="rgba(150,190,220,.12)" stroke-width="9"></circle>';

      var top = languages[0];
      var legend = languages.slice(0, 5).map(function (l, i) {
        return '<button type="button" class="lang-legend-row" data-lang="' + i + '"'
          + ' data-pct="' + l.percent + '" data-name="' + escapeHtml(l.name) + '">'
          + '<span class="lang-dot" style="background:' + langColor(l.name) + '"></span>'
          + '<span class="lang-legend-name">' + escapeHtml(l.name) + '</span>'
          + '<span class="lang-legend-pct">' + l.percent + '%</span></button>';
      }).join('');

      /* A sparkline with no numbers says nothing. This states the change
         in the leading language over the tracked window. */
      var driftHtml = '';
      var driftSvg = (languageHistory && languageHistory.length >= 2)
        ? buildLanguageDriftSvg(languageHistory, languages)
        : null;
      if (driftSvg) {
        var days = languageHistory.length;
        var shareAt = function (entry) {
          var f = (entry.languages || []).filter(function (l) { return l.name === top.name; })[0];
          return f ? f.percent : null;
        };
        var first = shareAt(languageHistory[0]);
        var last = shareAt(languageHistory[languageHistory.length - 1]);
        var deltaHtml = '';
        if (first !== null && last !== null) {
          var d = Math.round((last - first) * 10) / 10;
          var dir = d > 0.05 ? 'up' : (d < -0.05 ? 'down' : 'flat');
          var arrow = dir === 'up' ? '\u25b2' : (dir === 'down' ? '\u25bc' : '\u2014');
          var word = dir === 'flat' ? 'steady' : (d > 0 ? '+' + d + ' pts' : d + ' pts');
          deltaHtml = '<span class="lang-delta lang-delta-' + dir + '">' + arrow + ' ' + word + '</span>';
        }
        driftHtml = '<div class="lang-drift">'
          + '<div class="lang-drift-head"><span>' + escapeHtml(top.name) + ' share</span>' + deltaHtml + '</div>'
          + driftSvg
          + '<div class="lang-drift-caption">across ' + days + (days === 1 ? ' day' : ' days') + ' of tracked commits</div>'
          + '</div>';
      } else {
        driftHtml = '<div class="lang-drift"><div class="lang-drift-empty">Tracking started \u2014 drift trend fills in over the next few weeks.</div></div>';
      }

      langHtml =
          '<div class="ra-label-row"><span class="ra-label">Languages</span>'
        +   '<span class="ra-label-sub">// ' + languages.length + ' tracked</span></div>'
        + '<div class="lang-ring-wrap"><svg viewBox="0 0 76 76" width="76" height="76" style="transform:rotate(-90deg)">'
        +   track + segs + '</svg>'
        + '<div class="lang-ring-center"><span class="lang-ring-pct">' + top.percent + '%</span>'
        +   '<span class="lang-ring-name">' + escapeHtml(top.name) + '</span></div></div>'
        + '<div class="lang-legend">' + legend + '</div>'
        + driftHtml;
        } else {
      langHtml = '<div class="ra-label-row"><span class="ra-label">Languages</span></div><div class="ra-empty" style="padding:0.4rem 0;">Not enough data yet.</div>';
    }

    /* tap a language to isolate it: the ring dims the rest and the centre
       switches to that language. Tapping it again returns to the overview. */
    setTimeout(function () {
      var wrap = document.getElementById('raLangHours');
      if (!wrap || wrap.__langWired) return;
      wrap.__langWired = true;
      wrap.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.lang-legend-row');
        if (!btn) return;
        var idx = btn.getAttribute('data-lang');
        var active = btn.classList.contains('is-active');
        [].forEach.call(wrap.querySelectorAll('.lang-legend-row'), function (b) { b.classList.remove('is-active'); });
        [].forEach.call(wrap.querySelectorAll('.lang-seg'), function (sg) { sg.classList.remove('is-dim', 'is-lit'); });
        var pctEl = wrap.querySelector('.lang-ring-pct');
        var nameEl = wrap.querySelector('.lang-ring-name');
        if (active || !pctEl || !nameEl) {
          if (pctEl && wrap.__langTop) { pctEl.textContent = wrap.__langTop.pct; nameEl.textContent = wrap.__langTop.name; }
          return;
        }
        if (!wrap.__langTop) wrap.__langTop = { pct: pctEl.textContent, name: nameEl.textContent };
        btn.classList.add('is-active');
        [].forEach.call(wrap.querySelectorAll('.lang-seg'), function (sg) {
          sg.classList.add(sg.getAttribute('data-lang') === idx ? 'is-lit' : 'is-dim');
        });
        pctEl.textContent = btn.getAttribute('data-pct') + '%';
        nameEl.textContent = btn.getAttribute('data-name');
      });
    }, 0);

    if (codingHours && codingHours.histogram) {
      var hist = codingHours.histogram;
      var maxH = Math.max.apply(null, hist);
      var bars = hist.map(function (v, h) {
        var pct = maxH > 0 ? Math.round((v / maxH) * 100) : 0;
        var isPeak = codingHours.peakHours && codingHours.peakHours.indexOf(h) !== -1;
        return '<div class="hrs-bar' + (isPeak ? ' hrs-peak' : '') + '" style="height:' + Math.max(pct, 4) + '%" title="' + h + ':00 IST · ' + v + '"></div>';
      }).join('');

      var buckets = timeOfDayBuckets(hist);
      var bucketsHtml = buckets
        ? '<div class="hrs-buckets">' + buckets.map(function (b) {
            return '<div class="hrs-bucket-row"><span class="hrs-bucket-icon">' + b.icon + '</span><span class="hrs-bucket-name">' + b.name + '</span>'
              + '<span class="hrs-bucket-track"><span class="hrs-bucket-fill" style="width:' + b.pct + '%"></span></span>'
              + '<span class="hrs-bucket-pct">' + b.pct + '%</span></div>';
          }).join('') + '</div>'
        : '';

      hoursHtml =
          '<div class="ra-label-row"><span class="ra-label">Coding Hours</span></div>'
        + '<div class="hrs-bars">' + bars + '</div>'
        + '<div class="hrs-caption">Most active <b>' + codingHours.label + '</b></div>'
        + '<div class="hrs-sub">// based on recent activity</div>'
        + bucketsHtml;
    } else {
      hoursHtml = '<div class="ra-label-row"><span class="ra-label">Coding Hours</span></div><div class="ra-empty" style="padding:0.4rem 0;">Not enough data yet.</div>';
    }

    el.innerHTML =
        '<div class="lh-card">' + langHtml + '</div>'
      + '<div class="lh-card">' + hoursHtml + '</div>';
  }

  function renderProjectStats(list) {
    var el = document.getElementById('raProjectStats');
    if (!list || !list.length) { el.innerHTML = ''; return; }
    var html = '<div class="ra-label-row"><span class="ra-label">Project Stats</span><span class="ra-label-sub">// per repo, all-time</span></div><div class="rp-grid">';
    html += list.map(function (p, i) {
      var href = p.url || 'https://github.com/SahnawazL';
      return '<div class="rp-card">'
        + '<a class="ra-goto rp-goto" href="' + href + '" target="_blank" rel="noopener" aria-label="Open ' + escapeHtml(p.name) + ' on GitHub">' + GOTO_ICON + '</a>'
        + '<div class="rp-top"><span class="rp-name">' + escapeHtml(p.name) + '</span></div>'
        + '<span class="rp-num" id="rpNum' + i + '">' + p.commits + '</span>'
        + '<div class="rp-since">commits · since ' + monthYear(p.since) + '</div>'
        + '</div>';
    }).join('');
    html += '</div>';
    el.innerHTML = html;
    list.forEach(function (_, i) {
      var numEl = document.getElementById('rpNum' + i);
      if (numEl) animateCount(numEl, 800);
    });
  }

  function render(items) {
    var list = document.getElementById('raList');
    if (!items.length) {
      list.innerHTML = '<div class="ra-empty">No recent public activity in the last 90 days.</div>';
      return;
    }
    var grouped = groupConsecutive(items).slice(0, 8);
    list.innerHTML = grouped.map(function (g, i) {
      var dotClass = 'ra-dot-' + g.type;
      var href = g.url || 'https://github.com/SahnawazL';
      return '<div class="ra-row" style="animation-delay:' + (i * 0.05) + 's">'
        + '<span class="ra-dot ' + dotClass + '" aria-hidden="true"></span>'
        + '<span class="ra-row-main">'
        + '<span class="ra-repo">' + escapeHtml(g.repo) + '</span>'
        + '<span class="ra-sep">·</span>'
        + '<span class="ra-detail">' + detailLine(g) + '</span>'
        + '</span>'
        + '<span class="ra-time">' + timeAgo(g.time) + '</span>'
        + '<a class="ra-goto" href="' + href + '" target="_blank" rel="noopener" aria-label="Open on GitHub">' + GOTO_ICON + '</a>'
        + '</div>';
    }).join('');
  }

  // ══ Build Health (CI) ══
  // Renders the `ci` array from the API — one entry per top contributed
  // repo that has GitHub Actions workflows and a token with permission
  // to read them. Anything else (no workflows, no permission, private
  // Actions log) already resolved to null server-side and was filtered
  // out, so every entry here is real, renderable data.
  function ciDotClass(entry) {
    if (entry.status !== 'completed') return 'ci-dot-pending';
    if (entry.conclusion === 'success') return 'ci-dot-success';
    if (entry.conclusion === 'failure') return 'ci-dot-failure';
    return 'ci-dot-neutral';
  }

  function ciTextClass(entry) {
    if (entry.status !== 'completed') return 'ci-text-pending';
    if (entry.conclusion === 'success') return 'ci-text-success';
    if (entry.conclusion === 'failure') return 'ci-text-failure';
    return '';
  }

  var CI_CONCLUSION_LABELS = {
    success: 'Passed', failure: 'Failed', cancelled: 'Cancelled',
    timed_out: 'Timed out', action_required: 'Action required',
    neutral: 'Neutral', skipped: 'Skipped', stale: 'Stale'
  };

  function ciStatusLabel(entry) {
    if (entry.status === 'in_progress') return 'Running now';
    if (entry.status === 'queued') return 'Queued';
    if (entry.status !== 'completed') return entry.status || 'Unknown';
    return CI_CONCLUSION_LABELS[entry.conclusion] || (entry.conclusion || 'Unknown');
  }

  /* Deployment Health
     ------------------------------------------------------------------
     This used to show a pass-rate bar, which graded the repo's whole
     recent history and turned red whenever a run was cancelled — and
     GitHub cancels a Pages deploy every time a newer push supersedes it.
     Shipping twice in a minute therefore looked like a broken build.

     What a visitor actually wants to know is: is it working right now,
     and does this person ship? So the current run is the colour anchor,
     the history strip shows the shape over time (a failure that was
     fixed reads as recovery), and the numbers underneath are facts about
     shipping rather than a grade. */

  var CI_VIEW_ARROW = '<svg class="ci-view-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  var CI_MARK_CLASS = {
    success: 'ci-mk-ok',
    failure: 'ci-mk-bad',
    timed_out: 'ci-mk-bad',
    startup_failure: 'ci-mk-bad',
    cancelled: 'ci-mk-skip',
    skipped: 'ci-mk-skip',
    in_progress: 'ci-mk-run',
    queued: 'ci-mk-run'
  };
  var CI_MARK_TITLE = {
    success: 'Passed',
    failure: 'Failed',
    timed_out: 'Timed out',
    startup_failure: 'Failed to start',
    cancelled: 'Superseded by a newer push',
    skipped: 'Skipped',
    in_progress: 'Running now',
    queued: 'Queued'
  };

  function ciHeadline(entry) {
    if (entry.status === 'in_progress') return { text: 'Deploying', cls: 'ci-state-run' };
    if (entry.status === 'queued')      return { text: 'Queued',    cls: 'ci-state-run' };
    if (entry.conclusion === 'success') return { text: 'Passing',   cls: 'ci-state-ok' };
    if (entry.conclusion === 'cancelled' || entry.conclusion === 'skipped')
      return { text: 'Superseded', cls: 'ci-state-skip' };
    if (!entry.conclusion) return { text: 'Unknown', cls: 'ci-state-skip' };
    return { text: 'Failing', cls: 'ci-state-bad' };
  }

  function ciDuration(sec) {
    if (!sec && sec !== 0) return '';
    return sec < 90 ? sec + 's' : Math.round(sec / 60) + 'm';
  }

  function ciStrip(history) {
    if (!history || !history.length) return '';
    /* oldest on the left, so it reads as a timeline */
    var marks = history.slice().reverse().map(function (h) {
      var cls = CI_MARK_CLASS[h.c] || 'ci-mk-skip';
      var title = CI_MARK_TITLE[h.c] || h.c;
      var when = h.at ? ' \u00b7 ' + timeAgo(h.at) : '';
      return '<i class="ci-mk ' + cls + '" title="' + escapeHtml(title + when) + '"></i>';
    }).join('');
    return '<div class="ci-strip" aria-hidden="true">' + marks + '</div>';
  }

  function ciFacts(entry) {
    var bits = [];
    if (typeof entry.deploys7d === 'number' && entry.deploys7d > 0)
      bits.push('<b>' + entry.deploys7d + '</b> deploy' + (entry.deploys7d === 1 ? '' : 's') + ' this week');
    if (entry.avgSeconds) bits.push('~' + ciDuration(entry.avgSeconds) + ' per run');
    /* mention real failures plainly, but only when there are some */
    if (typeof entry.passRate === 'number' && entry.passRate < 100 && entry.sampleSize)
      bits.push(Math.round(entry.passRate * entry.sampleSize / 100) + ' of last ' + entry.sampleSize + ' passed');
    if (!bits.length) return '';
    return '<div class="ci-facts">' + bits.join(' <span>\u00b7</span> ') + '</div>';
  }

  function renderCIHealth(ci) {
    var el = document.getElementById('raCIHealth');
    if (!el) return;
    if (!ci || !ci.length) { el.innerHTML = ''; return; }

    var cardsHtml = ci.map(function (entry) {
      var head = ciHeadline(entry);
      var ago = entry.ranAt ? timeAgo(entry.ranAt) : '';
      var line = (entry.conclusion === 'success' ? 'Last deploy' : 'Last run') + (ago ? ' ' + ago : '');
      var href = entry.url || 'https://github.com/SahnawazL';
      return '<a class="ci-card" href="' + href + '" target="_blank" rel="noopener" aria-label="Open the latest GitHub Actions run for ' + escapeHtml(entry.repo) + '">'
        + '<div class="ci-top">'
        +   '<span class="ci-dot ' + ciDotClass(entry) + '"></span>'
        +   '<span class="ci-name">' + escapeHtml(entry.repo) + '</span>'
        +   '<span class="ci-state ' + head.cls + '">' + head.text + '</span>'
        + '</div>'
        + '<div class="ci-status-line">' + escapeHtml(line) + '</div>'
        + ciStrip(entry.history)
        + ciFacts(entry)
        + '<div class="ci-view-run"><span>View full run</span>' + CI_VIEW_ARROW + '</div>'
        + '</a>';
    }).join('');

    el.innerHTML =
        '<div class="ra-label-row"><span class="ra-label">Deployment Health</span><span class="ra-label-sub">// GitHub Actions</span></div>'
      + '<div class="ci-grid">' + cardsHtml + '</div>';
  }

  // ══ Release Timeline ══
  // Built entirely from `activity` entries already fetched for the main
  // feed above (ReleaseEvent → type 'release') — no separate API call.
  // Since the public events feed only covers ~90 days, this reads as
  // "recent releases," not full version history.
  function renderReleaseTimeline(activity) {
    var el = document.getElementById('raReleaseTimeline');
    if (!el) return;
    var releases = (activity || []).filter(function (a) { return a.type === 'release'; });
    if (!releases.length) {
      el.innerHTML = '<div class="ra-label-row"><span class="ra-label">Release Timeline</span><span class="ra-label-sub">// tagged versions, most recent first</span></div>'
        + '<div class="rt-empty">No tagged releases in the last 90 days of public activity.</div>';
      return;
    }
    var chips = releases.map(function (r) {
      var href = r.url || 'https://github.com/SahnawazL';
      var tag = r.tag || 'release';
      return '<a class="rt-chip" href="' + href + '" target="_blank" rel="noopener" aria-label="' + escapeHtml(tag) + ' of ' + escapeHtml(r.repo) + '">'
        + '<span class="rt-chip-tag">' + escapeHtml(tag) + '</span>'
        + '<span class="rt-chip-repo">' + escapeHtml(r.repo) + '</span>'
        + '<span class="rt-chip-time">' + timeAgo(r.time) + '</span>'
        + '</a>';
    }).join('');
    el.innerHTML = '<div class="ra-label-row"><span class="ra-label">Release Timeline</span><span class="ra-label-sub">// tagged versions, most recent first</span></div>'
      + '<div class="rt-strip">' + chips + '</div>';
  }

  // ══ Repo Ecosystem ══
  // Renders the `repos` list from the API with a role tag resolved
  // client-side via repoOwnership() (defaults to "Own product").
  function renderRepoEcosystem(repos) {
    var el = document.getElementById('raRepoEcosystem');
    if (!el) return;
    if (!repos || !repos.length) { el.innerHTML = ''; return; }
    var chips = repos.map(function (r) {
      var role = repoOwnership(r.name);
      var href = r.url || 'https://github.com/SahnawazL';
      return '<a class="re-chip" href="' + href + '" target="_blank" rel="noopener" aria-label="' + escapeHtml(r.name) + ' \u2014 ' + role.label + '">'
        + '<span class="re-dot ' + role.dot + '"></span>'
        + '<span class="re-name">' + escapeHtml(r.name) + '</span>'
        + '<span class="re-role">' + role.label + '</span>'
        + '</a>';
    }).join('');
    el.innerHTML = '<div class="ra-label-row"><span class="ra-label">Repo Ecosystem</span><span class="ra-label-sub">// role across active repos</span></div>'
      + '<div class="re-grid">' + chips + '</div>';
  }

  // ══ Dependency Freshness ══
  // Renders the `depFreshness` array from the API — one card per repo
  // with a readable package.json, showing % of `dependencies` pinned at
  // npm's current "latest" plus one concrete outdated example.
  function dfPctClass(pct) {
    if (pct >= 80) return 'df-pct-good';
    if (pct >= 50) return 'df-pct-warn';
    return 'df-pct-bad';
  }
  function dfFillClass(pct) {
    if (pct >= 80) return 'df-fill-good';
    if (pct >= 50) return 'df-fill-warn';
    return 'df-fill-bad';
  }

  /* Dependencies
     ------------------------------------------------------------------
     This was a percentage with a red bar. With three dependencies in a
     repo, one package a major behind reads as 33% — a number that looks
     like neglect while describing something routine. Worse, the colour
     treated "a newer major exists" as a failure, when deferring a major
     upgrade is usually a decision rather than an oversight.

     So: counts instead of a percentage, and the colour tracks how far
     behind the worst package is. One major behind is normal and stays
     neutral; several majors is real drift and is worth flagging. */

  function depState(entry) {
    var gap = entry.worstGap || 0;
    if (!entry.outdated || !entry.outdated.length) return { text: 'All current', cls: 'df-state-ok' };
    if (gap >= 2) return { text: gap + ' majors', cls: 'df-state-old' };
    return { text: 'Minor drift', cls: 'df-state-mid' };
  }

  function renderDepFreshness(list) {
    var el = document.getElementById('raDepFreshness');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = ''; return; }

    var cardsHtml = list.map(function (entry) {
      var state = depState(entry);
      var behind = entry.total - entry.upToDate;

      /* one pip per dependency: solid when on the current major */
      var pips = '';
      for (var i = 0; i < entry.total; i++) {
        pips += '<i class="df-pip' + (i < entry.upToDate ? ' df-pip-ok' : '') + '"></i>';
      }

      var lines = (entry.outdated || []).slice(0, 3).map(function (d) {
        var gap = (typeof d.majorsBehind === 'number' && d.majorsBehind > 0)
          ? '<span class="df-gap">' + d.majorsBehind + ' major' + (d.majorsBehind === 1 ? '' : 's') + '</span>' : '';
        return '<div class="df-row"><span class="df-pkg">' + escapeHtml(d.name) + '</span>'
             + '<span class="df-ver">' + escapeHtml(d.pinned) + ' \u2192 ' + escapeHtml(d.latest) + '</span>' + gap + '</div>';
      }).join('');

      var summary = entry.outdated && entry.outdated.length
        ? '<b>' + entry.upToDate + '</b> of <b>' + entry.total + '</b> on the current major'
        : '<b>' + entry.total + '</b> dependenc' + (entry.total === 1 ? 'y' : 'ies') + ', all on the current major';

      return '<div class="df-card">'
        + '<div class="df-top"><span class="df-name">' + escapeHtml(entry.repo) + '</span>'
        +   '<span class="df-state ' + state.cls + '">' + state.text + '</span></div>'
        + '<div class="df-pips">' + pips + '</div>'
        + '<div class="df-detail">' + summary + '</div>'
        + (lines ? '<div class="df-list">' + lines + '</div>' : '')
        + '</div>';
    }).join('');

    el.innerHTML = '<div class="ra-label-row"><span class="ra-label">Dependencies</span>'
      + '<span class="ra-label-sub">// tracked against npm latest</span></div>'
      + '<div class="df-grid">' + cardsHtml + '</div>';
  }

  // ══ Time-range toggle (7d / 30d / 90d / 1y) ══
  // Everything below is client-side only, built from pulse.heatmapFull
  // (already fetched, ~1 year of daily counts) plus the activity list
  // already loaded for the feed — switching pills never re-hits the API.
  var lastActivityData = null;
  var currentRangeDays = 90;

  var RANGE_META = {
    7:   { pulseLabel: 'last 7 days',   heatmapLabel: 'last 7 days' },
    30:  { pulseLabel: 'last 30 days',  heatmapLabel: 'last 30 days' },
    90:  { pulseLabel: 'last 90 days',  heatmapLabel: 'last 90 days' },
    365: { pulseLabel: 'last 12 months', heatmapLabel: 'last 12 months' }
  };

  // Mirrors computeStreaks() in api/github-activity.js exactly, just run
  // client-side against whatever slice of heatmapFull the selected
  // window covers, so streak/longest-streak are real for that window
  // rather than always showing the all-time figures.
  function computeStreaksClient(days) {
    if (!days || !days.length) return null;
    var longest = { length: 0, start: null, end: null };
    var run = { length: 0, start: null };
    days.forEach(function (d) {
      if (d.count > 0) {
        if (run.length === 0) run.start = d.date;
        run.length += 1;
        if (run.length > longest.length) {
          longest = { length: run.length, start: run.start, end: d.date };
        }
      } else {
        run = { length: 0, start: null };
      }
    });
    var i = days.length - 1;
    if (days[i].count === 0) i -= 1;
    var currentEnd = i >= 0 ? days[i].date : null;
    var currentLength = 0;
    var currentStart = null;
    while (i >= 0 && days[i].count > 0) {
      currentLength += 1;
      currentStart = days[i].date;
      i -= 1;
    }
    return {
      currentStreak: currentLength,
      currentStart: currentStart,
      currentEnd: currentLength ? currentEnd : null,
      longestStreak: longest.length,
      longestStart: longest.start,
      longestEnd: longest.end
    };
  }

  // Builds a pulse-shaped object scoped to the last `windowDays` days of
  // heatmapFull, so it can be handed straight to the existing
  // renderPulse/renderHeatmap functions unchanged.
  function buildWindowedPulse(fullDays, windowDays) {
    if (!fullDays || !fullDays.length) return null;
    var sliced = fullDays.slice(-windowDays);
    var streaks = computeStreaksClient(sliced);
    if (!streaks) return null;
    var total = 0;
    sliced.forEach(function (d) { total += d.count; });
    return {
      totalContributions: total,
      currentStreak: streaks.currentStreak,
      currentRange: streaks.currentStreak ? [streaks.currentStart, streaks.currentEnd] : null,
      longestStreak: streaks.longestStreak,
      longestRange: streaks.longestStreak ? [streaks.longestStart, streaks.longestEnd] : null,
      heatmap: sliced
    };
  }

  function filterActivityToWindow(activity, windowDays) {
    var cutoff = Date.now() - windowDays * 86400000;
    return (activity || []).filter(function (a) {
      return a && a.time && new Date(a.time).getTime() >= cutoff;
    });
  }

  function applyRange(windowDays) {
    if (!lastActivityData) return;
    currentRangeDays = windowDays;

    document.querySelectorAll('#raRangeToggle .rt-pill').forEach(function (btn) {
      var active = parseInt(btn.getAttribute('data-range'), 10) === windowDays;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    var basePulse = lastActivityData.pulse;
    var fullDays = basePulse ? (basePulse.heatmapFull || basePulse.heatmap) : null;
    var windowedPulse = buildWindowedPulse(fullDays, windowDays);
    var windowedActivity = filterActivityToWindow(lastActivityData.activity, windowDays);
    var meta = RANGE_META[windowDays] || RANGE_META[90];

    renderPulse(windowedPulse, lastActivityData.stats || null, windowedActivity, meta.pulseLabel);
    renderHeatmap(windowedPulse, windowedActivity, meta.heatmapLabel);
  }

  document.querySelectorAll('#raRangeToggle .rt-pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var w = parseInt(btn.getAttribute('data-range'), 10);
      if (w === currentRangeDays) return;
      applyRange(w);
    });
  });

  fetch('/api/github-activity')
    .then(function (res) {
      if (!res.ok) throw new Error('bad response');
      return res.json();
    })
    .then(function (data) {
      var items = data.activity || [];
      lastActivityData = data;
      render(items);
      renderFreshness(items);
      renderProjectStats(data.projectStats || null);
      renderCIHealth(data.ci || null);
      renderReleaseTimeline(data.activity || []);
      renderRepoEcosystem(data.repos || null);
      renderDepFreshness(data.depFreshness || null);
      applyRange(90);
      renderPunchcard(data.activity || [], data.pulse || null);
      renderLanguagesAndHours(data.languages || null, data.codingHours || null, data.languageHistory || null);

      var hasHeatmapData = !!(data.pulse && (data.pulse.heatmapFull || data.pulse.heatmap));
      var toggleEl = document.getElementById('raRangeToggle');
      if (!hasHeatmapData && toggleEl) toggleEl.style.display = 'none';
    })
    .catch(function () {
      document.getElementById('raList').innerHTML = '<div class="ra-error">Couldn\u2019t load activity right now \u2014 <a href="https://github.com/SahnawazL" target="_blank" rel="noopener" style="color:rgba(0,255,180,0.7);">view on GitHub</a> instead.</div>';
      document.getElementById('raProjectStats').innerHTML = '';
      document.getElementById('raCIHealth').innerHTML = '';
      document.getElementById('raReleaseTimeline').innerHTML = '';
      document.getElementById('raRepoEcosystem').innerHTML = '';
      document.getElementById('raDepFreshness').innerHTML = '';
      document.getElementById('raPulse').innerHTML = '';
      document.getElementById('raHeatmap').innerHTML = '';
      document.getElementById('raPunchcard').innerHTML = '';
      document.getElementById('raLangHours').innerHTML = '';
      var toggleEl = document.getElementById('raRangeToggle');
      if (toggleEl) toggleEl.style.display = 'none';
    });
})();


/* ==== index.html line 5245 ==== */

/* ── SYSTEM STATUS — live health check for GitHub API, Firestore, and
   the webhook (see api/system-status.js). Completely independent fetch
   from the main activity load above — a slow or failed status check
   never blocks or affects the rest of the "Recently Shipped" panel. */
(function () {
  var rowsEl = document.getElementById('sysRows');
  var checkedEl = document.getElementById('sysCheckedAt');
  var btn = document.getElementById('sysRecheckBtn');
  if (!rowsEl) return;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function timeAgo(iso) {
    if (!iso) return null;
    var diffMs = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function dotClassFor(status) {
    if (status === 'operational') return 'sys-dot-operational';
    if (status === 'degraded') return 'sys-dot-degraded';
    if (status === 'down') return 'sys-dot-down';
    return 'sys-dot-unknown';
  }

  function row(name, dotClass, detail, ms) {
    return '<div class="sys-row">'
      + '<span class="sys-dot ' + dotClass + '"></span>'
      + '<span class="sys-name">' + name + '</span>'
      + '<span class="sys-detail">' + escapeHtml(detail || '') + '</span>'
      + (typeof ms === 'number' ? '<span class="sys-ms">' + ms + 'ms</span>' : '')
      + '</div>';
  }

  function render(data) {
    var gh = data.github || {};
    var fs = data.firestore || {};
    var wh = data.webhook || {};

    var webhookDetail = !wh.configured
      ? 'Secret not configured'
      : (wh.lastEventAt ? 'Last push ' + timeAgo(wh.lastEventAt) : 'Configured \u2014 awaiting first push');
    var webhookDot = !wh.configured ? 'sys-dot-down' : (wh.lastEventAt ? 'sys-dot-operational' : 'sys-dot-unknown');

    rowsEl.innerHTML =
      row('GitHub API', dotClassFor(gh.status), gh.detail, gh.latencyMs)
      + row('Firestore', dotClassFor(fs.status), fs.detail, fs.latencyMs)
      + row('Webhook', webhookDot, webhookDetail);

    checkedEl.textContent = 'checked ' + (timeAgo(data.checkedAt) || 'just now');
  }

  function renderError() {
    rowsEl.innerHTML = '<div class="ra-error">Status check unavailable right now.</div>';
    checkedEl.textContent = '';
  }

  var lastRunAt = 0;

  function runCheck() {
    lastRunAt = Date.now();
    if (btn) btn.classList.add('sys-spin');
    fetch('/api/system-status')
      .then(function (res) {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then(render)
      .catch(renderError)
      .finally(function () { if (btn) btn.classList.remove('sys-spin'); });
  }

  if (btn) btn.addEventListener('click', runCheck);
  runCheck();

  // Auto-refresh every 30s — matches the endpoint's own 30s cache window,
  // so this never fires faster than a "new" check could actually exist.
  // Pauses while the tab is hidden (Page Visibility API) rather than
  // silently burning GitHub/Firestore quota in a forgotten background
  // tab, then immediately re-checks the moment it's visible again if
  // enough time has passed since the last run (manual or automatic) —
  // the same pattern real status dashboards use.
  var POLL_MS = 30000;
  var pollTimer = null;

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(runCheck, POLL_MS);
  }
  function stopPolling() {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopPolling();
    } else {
      if (Date.now() - lastRunAt > POLL_MS) runCheck();
      startPolling();
    }
  });

  if (!document.hidden) startPolling();
})();


/* ==== index.html line 5363 ==== */

/* ── AI WEEKLY RECAP — "Recently Shipped" digest ──
   Fetches a short AI-generated summary of recent GitHub activity from
   /api/github-digest (a separate serverless function from
   /api/github-activity — see that file's own header comment for why it's
   kept separate: different lifecycle, different lock, different job).

   This fetch is completely independent from the main activity/pulse/
   heatmap fetch above — if this fails, the rest of the Recently Shipped
   section is entirely unaffected, and vice versa. */
(function () {
  var card = document.getElementById('raDigestCard');
  if (!card) return;

  var SPARK_ICON = '<svg class="rd-badge-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>';
  var ARROW_ICON = '<svg class="rd-cta-arrow" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function badgeHtml() {
    return '<div class="rd-badge">' + SPARK_ICON + '<span class="rd-badge-dot" aria-hidden="true"></span>AI Weekly Recap</div>';
  }

  // Reveals the recap a word at a time with a soft blur/fade-up motion —
  // reads as a considered, premium reveal rather than a terminal typing
  // effect. A thin breathing caret trails the last word while it settles,
  // then disappears once the reveal is done.
  function revealWords(el, text) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { el.textContent = text; return; }

    var words = text.split(' ');
    var perWordDelay = Math.max(0.028, Math.min(0.065, 1.1 / words.length));

    el.innerHTML = words.map(function (w, i) {
      return '<span class="rd-word" style="animation-delay:' + (i * perWordDelay).toFixed(3) + 's">' + escapeHtml(w) + '</span>';
    }).join(' ');

    var caret = document.createElement('span');
    caret.className = 'rd-caret';
    el.appendChild(caret);
    var totalMs = (words.length * perWordDelay + 0.6) * 1000;
    setTimeout(function () { caret.remove(); }, totalMs);
  }

  function renderLoading() {
    card.innerHTML =
      '<div class="rd-surface rd-skel-surface">'
      + badgeHtml()
      + '<div class="rd-loading-label">Generating recap\u2026</div>'
      + '<div class="rd-skel rd-skel-line"></div>'
      + '<div class="rd-skel rd-skel-line" style="width:70%"></div>'
      + '</div>';
  }

  function renderResult(text) {
    card.innerHTML = '<div class="rd-surface">' + badgeHtml() + '<div class="rd-text" id="raDigestText"></div></div>';
    revealWords(document.getElementById('raDigestText'), text);
  }

  // Error state doubles as a retry affordance — tapping it tries again,
  // it doesn't leave the visitor stuck on a dead end.
  function renderError() {
    card.innerHTML =
      '<div class="rd-surface rd-cta-surface">'
      + badgeHtml()
      + '<button type="button" class="rd-cta-btn" id="raDigestRetry" aria-label="Retry generating the AI recap">'
      + '<span class="rd-cta-text">Recap didn\u2019t load \u2014 tap to retry</span>'
      + ARROW_ICON
      + '</button>'
      + '</div>';
    var retryBtn = document.getElementById('raDigestRetry');
    if (retryBtn) retryBtn.addEventListener('click', requestDigest, { once: true });
  }

  // The whole point: nothing below ever runs on page load or on scrolling
  // this section into view. /api/github-digest (and the Groq call behind
  // it) only fires once the visitor deliberately taps the CTA button —
  // `requestDigest` is wired up purely to click events, never to an
  // IntersectionObserver, a timer, or the initial page-load flow above.
  var requested = false; // guards against a double-fire from a fast double-click/double-Enter

  function requestDigest() {
    if (requested) return;
    requested = true;
    renderLoading();

    fetch('/api/github-digest')
      .then(function (res) {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then(function (data) {
        var text = (data && data.digest) ? data.digest.trim() : '';
        if (!text) throw new Error('empty digest');
        renderResult(text);
      })
      .catch(function () {
        requested = false; // allow a genuine retry tap to try again
        renderError();
      });
  }

  var ctaBtn = document.getElementById('raDigestCta');
  if (ctaBtn) ctaBtn.addEventListener('click', requestDigest, { once: true });
})();


/* ==== index.html line 5475 ==== */

/* ── MPJ FILTER ── */
function mpjFilter(cat, btn) {
  /* update active pill */
  document.querySelectorAll('.mpj-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');


  /* show/hide cards */
  var cards = document.querySelectorAll('.mpj-card');
  cards.forEach(function(card) {
    var cats = (card.getAttribute('data-cat') || '').split(' ');
    if (cat === 'all' || cats.indexOf(cat) !== -1) {
      card.classList.remove('mpj-hidden');
      /* re-trigger visible class after unhide for animation */
      card.classList.remove('mpj-visible');
      setTimeout(function() { card.classList.add('mpj-visible'); }, 30);
    } else {
      card.classList.add('mpj-hidden');
    }
  });
}

/* ── MPJ ENTRANCE ── */
(function() {
  var sec = document.getElementById('my-projects');
  var cards = sec.querySelectorAll('.mpj-card');
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        cards.forEach(function(card, i) {
          setTimeout(function() { card.classList.add('mpj-visible'); }, i * 90);
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.08 });
  obs.observe(sec);
})();



/* ==== index.html line 5517 ==== */

/* ── YOJANASAHAY LIVE STAT ──
   Pulls a real number from YojanaSahay's /api/stats endpoint (its own
   Firestore + GitHub data, proxied through a public serverless function)
   and swaps it into the metric line on that project card. If the fetch
   fails for any reason (network, CORS, endpoint down), the original
   static text already in the HTML stays exactly as-is — no broken UI. */
(function() {
  var el = document.getElementById('yojanasahay-live-metric');
  if (!el) return;

  var countEl    = document.getElementById('ys-live-count');
  var subEl      = document.getElementById('ys-console-sub');
  var ringFillEl = document.getElementById('ys-ring-fill');
  var ringPctEl  = document.getElementById('ys-ring-pct');
  var revealEl   = document.getElementById('ys-console-reveal-text');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RING_CIRC = 100.5; // 2π × r(16), matches stroke-dasharray in CSS
  var lastVerifiedAt = null;

  /* Counts up from whatever number is currently shown to `target`, using
     an ease-out curve so it settles rather than stopping abruptly — a
     ticking-dashboard feel instead of a flat text swap. Skips straight to
     the target if the visitor has reduced motion on. */
  function animateCount(target) {
    if (!countEl) return;
    var start = parseInt((countEl.textContent || '0').replace(/,/g, ''), 10) || 0;
    if (reduceMotion || start === target) { countEl.textContent = target.toLocaleString('en-IN'); return; }
    var duration = 1000, startTime = null;
    function tick(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      var val = Math.round(start + (target - start) * eased);
      countEl.textContent = val.toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* Draws the health ring in via stroke-dashoffset (CSS transition does
     the easing) and hue-shifts it — amber under ~60%, green above — so
     the ring itself communicates "healthy" vs "needs attention" at a
     glance, not just a number. */
  function setRing(pct) {
    if (!ringFillEl) return;
    var offset = RING_CIRC - (RING_CIRC * Math.max(0, Math.min(100, pct)) / 100);
    ringFillEl.style.strokeDashoffset = offset;
    ringFillEl.style.stroke = pct >= 60 ? '#00ffb4' : '#ffb454';
    if (ringPctEl) ringPctEl.textContent = pct + '%';
  }

  /* Relative-time string ("just now", "12m ago", "3h ago") — recomputed
     on an interval so the status line keeps ticking forward on its own
     rather than freezing at whatever it said when the page loaded. */
  function relativeTime(date) {
    var diffMin = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return diffMin + 'm ago';
    var diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h ago';
    return Math.round(diffHr / 24) + 'd ago';
  }

  function tickStatusLine() {
    if (!subEl || !lastVerifiedAt) return;
    subEl.textContent = 'verified ' + relativeTime(lastVerifiedAt);
  }

  fetch('https://yojanasahay.vercel.app/api/stats', { cache: 'no-store' })
    .then(function(r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
    .then(function(data) {
      if (typeof data.schemeCount === 'number' && typeof data.linkHealthPercent === 'number') {
        animateCount(data.schemeCount);
        setRing(data.linkHealthPercent);
        el.setAttribute('data-state', 'live');

        if (data.lastVerifiedAt) {
          var d = new Date(data.lastVerifiedAt);
          if (!isNaN(d.getTime())) {
            lastVerifiedAt = d;
            tickStatusLine();
            if (!reduceMotion) setInterval(tickStatusLine, 30000);
          }
        }
        if (!lastVerifiedAt && subEl) subEl.textContent = 'synced from live data';

        /* Hover/focus reveal — the % ring only shows a bare number, so
           the reveal spells out what it actually measures (checked
           links, not the whole catalog) rather than leaving it ambiguous. */
        if (revealEl) {
          revealEl.textContent = data.linkHealthPercent + '% of checked links are live · rest offline-only (bank/CSC/in-person)';
        }

        /* Also refresh the case study's stats grid so both places agree.
           The modal (CASE_STUDIES → renderCaseStudy) rebuilds its HTML
           fresh from this object every time it's opened, so updating the
           two matching values here — without touching their labels — is
           enough to keep it in sync, whether the modal was opened before
           or after this fetch resolves. */
        if (window.CASE_STUDIES && window.CASE_STUDIES.yojanasahay && window.CASE_STUDIES.yojanasahay.stats) {
          var ys = window.CASE_STUDIES.yojanasahay;
          var liveCount = data.schemeCount.toLocaleString('en-IN');
          var s = ys.stats;
          if (s[0]) s[0].value = liveCount;
          if (s[1]) s[1].value = data.linkHealthPercent + '%';
          /* These three fields each state the total scheme count once in
             plain prose/labels — replacing that one substring keeps them
             in sync with the live number without touching anything else
             in the surrounding sentence (e.g. the separate "569 verifiable
             / 544 offline-only" breakdown, which isn't derived from this
             API and is left untouched). */
          if (ys.lede) ys.lede = ys.lede.replace('1,116', liveCount);
          if (ys.diagram) ys.diagram = ys.diagram.replace('1,116 schemes', liveCount + ' schemes');
          if (ys.metrics && ys.metrics[0]) ys.metrics[0] = ys.metrics[0].replace('1,116', liveCount);
        }
      } else {
        el.setAttribute('data-state', 'cached'); // fields missing/null — badge goes quiet amber
        if (subEl) subEl.textContent = 'showing cached data';
      }
    })
    .catch(function() {
      el.setAttribute('data-state', 'cached'); // fetch failed — static fallback numbers stay, badge signals it's not live
      if (subEl) subEl.textContent = 'showing cached data';
    });
})();
