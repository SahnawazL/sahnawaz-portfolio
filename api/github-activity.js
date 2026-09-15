// api/github-activity.js
//
// Returns two things for the portfolio's "Recently Shipped" section:
//   1. `activity`  - recent public events (pushes, PRs, issues, releases),
//                    same as before, from the REST events endpoint.
//   2. `stats`     - real year-to-date totals (total commits, PRs, issues,
//                    repos contributed to) pulled from GitHub's GraphQL
//                    contributionsCollection — the same numbers behind
//                    the green contribution graph on a GitHub profile.
//                    This needs GITHUB_TOKEN to be set; GraphQL rejects
//                    unauthenticated requests even for public data. If
//                    the token is missing or the GraphQL call fails,
//                    `stats` comes back null and the front-end just
//                    hides the stats strip — the activity feed still
//                    works either way.
//   3. `pulse.heatmapFull` - the same daily contribution data as
//                    `pulse.heatmap`, just extended to ~1 year instead of
//                    truncated to 12 weeks, so the front-end's 7d/30d/
//                    90d/1y time-range toggle can recompute score,
//                    streak, and contribution totals for any window
//                    client-side, with no extra request.
//   4. `ci`        - latest GitHub Actions run + rolling pass rate for
//                    each top contributed repo that has workflows.
//                    Requires GITHUB_TOKEN to additionally have
//                    "Actions: Read-only" on a fine-grained PAT; without
//                    it (or on repos with no workflows) this just comes
//                    back null for that repo and gets filtered out.
//   5. `repos`     - trimmed {name, url} list of top contributed repos,
//                    for the "Repo Ecosystem" view. Ownership role (own
//                    product / client work / OSS) is not derivable from
//                    the GitHub API and is tagged client-side instead.
//   6. `depFreshness` - % of `dependencies` (from each top repo's
//                    package.json) on the SAME MAJOR VERSION as npm's
//                    current "latest" — not an exact-version match, so a
//                    few patches/minors behind doesn't count against it,
//                    only a real major-version gap does — plus a few
//                    concrete outdated examples. Repos with no
//                    package.json, or zero comparable deps, are filtered
//                    out — same graceful null pattern as `ci` above.
//
// Env vars (set in Vercel → Settings → Environment Variables):
//   GITHUB_TOKEN   - fine-grained, Metadata: Read-only is enough for the
//                    REST feed; needed at all (any valid token) for the
//                    GraphQL stats to work. Add Actions: Read-only too
//                    if you want the `ci` field populated.
//   GITHUB_USER    - optional override; defaults to 'SahnawazL' below.

const GITHUB_USER = process.env.GITHUB_USER || 'SahnawazL';

// ── Language drift snapshotting (Firestore) ──
// fetchLanguageBreakdown() below only ever returns a live snapshot — no
// dates attached. To draw a real "language drift over the last few
// months" sparkline on the front end, something has to persist that
// snapshot over time. This does the smallest version of that: once a
// day (per UTC date), write the current breakdown to Firestore; on
// every request, read back whatever history exists so far.
//
// Deliberately NOT backfilled or seeded — there is no historical data
// to backfill from (GitHub doesn't expose past language-byte snapshots),
// so this starts genuinely empty and fills in for real as days pass.
// That's slower than faking a few months of history, but it means the
// sparkline is never showing invented numbers.
//
// Env vars (Vercel → Settings → Environment Variables), same trio the
// project's other Firebase Admin usage should already need:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (with literal \n escapes — replaced below)
// If these aren't set, snapshotting/history are silently skipped and
// `languageHistory` comes back null — the Languages ring still works
// exactly as before, it just has no drift sparkline under it yet.
const admin = require('firebase-admin');
const LANGUAGE_HISTORY_COLLECTION = 'languageSnapshots';
const LANGUAGE_HISTORY_RETENTION_DAYS = 200; // ~6-7 months of daily docs, then pruned

function getDb() {
  if (admin.apps.length) return admin.firestore();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
    return admin.firestore();
  } catch (err) {
    console.warn('[github-activity] Firebase Admin init failed:', err && err.message);
    return null;
  }
}

// Writes today's breakdown (merge:true, so re-runs the same UTC day
// overwrite instead of piling up duplicates), then prunes anything past
// the retention window. Both steps are best-effort — a failure here
// never affects the rest of the response.
async function snapshotLanguages(db, languages, todayStr) {
  if (!db || !languages || !languages.length) return;
  try {
    await db.collection(LANGUAGE_HISTORY_COLLECTION).doc(todayStr).set({
      date: todayStr,
      languages,
      capturedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - LANGUAGE_HISTORY_RETENTION_DAYS);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const stale = await db.collection(LANGUAGE_HISTORY_COLLECTION)
      .where('date', '<', cutoffStr)
      .limit(10)
      .get();
    if (!stale.empty) {
      const batch = db.batch();
      stale.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('[github-activity] language snapshot failed:', err && err.message);
  }
}

async function fetchLanguageHistory(db) {
  if (!db) return null;
  try {
    const snap = await db.collection(LANGUAGE_HISTORY_COLLECTION)
      .orderBy('date', 'asc')
      .limit(200)
      .get();
    if (snap.empty) return null;
    return snap.docs.map((doc) => {
      const d = doc.data();
      return { date: d.date, languages: d.languages };
    });
  } catch (err) {
    console.warn('[github-activity] language history fetch failed:', err && err.message);
    return null;
  }
}

function describeEvent(event) {
  const repo = event.repo && event.repo.name ? event.repo.name.split('/')[1] : 'a repo';
  const repoUrl = event.repo ? `https://github.com/${event.repo.name}` : null;

  switch (event.type) {
    case 'PushEvent': {
      const count = (event.payload && event.payload.commits && event.payload.commits.length) || 1;
      return {
        type: 'push',
        repo,
        message: `Pushed ${count} commit${count === 1 ? '' : 's'} to ${repo}`,
        url: repoUrl,
        time: event.created_at
      };
    }
    case 'PullRequestEvent': {
      const action = event.payload && event.payload.action;
      const prUrl = event.payload && event.payload.pull_request && event.payload.pull_request.html_url;
      const verb = action === 'opened' ? 'Opened' : action === 'closed' ? 'Closed' : 'Updated';
      return {
        type: 'pull_request',
        repo,
        message: `${verb} a pull request in ${repo}`,
        url: prUrl || repoUrl,
        time: event.created_at
      };
    }
    case 'CreateEvent': {
      const refType = event.payload && event.payload.ref_type;
      if (refType === 'repository') {
        return {
          type: 'create_repo',
          repo,
          message: `Created new repository ${repo}`,
          url: repoUrl,
          time: event.created_at
        };
      }
      return null;
    }
    case 'IssuesEvent': {
      const action = event.payload && event.payload.action;
      if (action !== 'opened' && action !== 'closed') return null;
      return {
        type: 'issue',
        repo,
        message: `${action === 'opened' ? 'Opened' : 'Closed'} an issue in ${repo}`,
        url: repoUrl,
        time: event.created_at
      };
    }
    case 'ReleaseEvent': {
      const tag = event.payload && event.payload.release && event.payload.release.tag_name;
      return {
        type: 'release',
        repo,
        // `tag` kept as its own field (not just baked into `message`) so
        // the Release Timeline strip can render it as a standalone chip
        // without having to regex it back out of the sentence.
        tag: tag || null,
        message: `Released ${tag || 'a new version'} of ${repo}`,
        url: repoUrl,
        time: event.created_at
      };
    }
    default:
      return null;
  }
}

// Converts a UTC ISO timestamp to an hour-of-day (0-23) in IST (UTC+5:30),
// since that's the timezone the portfolio's owner actually codes in.
function toISTHour(iso) {
  const d = new Date(iso);
  const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  const istMinutes = (utcMinutes + 330) % 1440;
  return Math.floor(istMinutes / 60);
}

async function fetchActivity(headers) {
  try {
    const ghRes = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`,
      { headers }
    );
    if (!ghRes.ok) return { activity: [], hourHistogram: null, error: `events:${ghRes.status}` };

    const events = await ghRes.json();
    // GitHub can return a 200 with a non-array body in edge cases (e.g. a
    // rate-limit/abuse-detection message object instead of the expected
    // events list) — same defensive check fetchLanguageBreakdown already
    // does below. Without this, a single unexpected reply here used to
    // throw uncaught and take the ENTIRE endpoint down with it (every
    // other field too, not just activity), since this ran inside the same
    // Promise.all as everything else with no isolation of its own.
    if (!Array.isArray(events)) {
      return { activity: [], hourHistogram: null, error: 'events:non-array-response' };
    }

    const activity = events.map(describeEvent).filter(Boolean).slice(0, 15);

    const histogram = new Array(24).fill(0);
    events.forEach((e) => {
      if (!e.created_at) return;
      histogram[toISTHour(e.created_at)] += 1;
    });
    const hasData = histogram.some((c) => c > 0);

    return { activity, hourHistogram: hasData ? histogram : null };
  } catch (err) {
    // Same graceful-degradation pattern as every other fetch* function in
    // this file — a hiccup here should only cost the activity feed, never
    // the whole response.
    return { activity: [], hourHistogram: null, error: 'events:exception' };
  }
}

// Finds the 3-hour rolling window with the most events, and describes it
// like "1–4 AM IST". Based on the last ~100 public events (up to 90 days),
// so this is a "recent" signal, not an all-time one.
function describePeakWindow(histogram) {
  if (!histogram) return null;
  const windowSize = 3;
  let bestStart = 0;
  let bestSum = -1;
  for (let h = 0; h < 24; h++) {
    let sum = 0;
    for (let k = 0; k < windowSize; k++) sum += histogram[(h + k) % 24];
    if (sum > bestSum) { bestSum = sum; bestStart = h; }
  }
  if (bestSum <= 0) return null;

  const fmt = (h) => {
    const period = h < 12 ? 'AM' : 'PM';
    let hh = h % 12;
    if (hh === 0) hh = 12;
    return hh + period;
  };
  const endHour = (bestStart + windowSize) % 24;
  const peakHours = [];
  for (let k = 0; k < windowSize; k++) peakHours.push((bestStart + k) % 24);

  return {
    label: `${fmt(bestStart)}–${fmt(endHour)} IST`,
    peakHours,
    histogram
  };
}

async function fetchYearStats(token) {
  if (!token) return null; // GraphQL needs auth even for public data

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  const to = now.toISOString();

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoriesWithContributedCommits
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': `${GITHUB_USER}-portfolio`
      },
      body: JSON.stringify({ query, variables: { login: GITHUB_USER, from, to } })
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors || !json.data || !json.data.user) return null;

    const c = json.data.user.contributionsCollection;
    return {
      commits: c.totalCommitContributions,
      pullRequests: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      repos: c.totalRepositoriesWithContributedCommits,
      since: from
    };
  } catch (err) {
    return null;
  }
}

// Discover which repos have recent commit contributions (GraphQL only
// allows a <=1yr window, so this is just for finding repo names/URLs —
// not for the all-time count itself).
async function fetchContributedRepos(token) {
  if (!token) return null;

  const now = new Date();
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  from.setUTCDate(from.getUTCDate() + 1);

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          commitContributionsByRepository(maxRepositories: 10) {
            repository { name nameWithOwner url createdAt isFork }
            contributions { totalCount }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': `${GITHUB_USER}-portfolio`
      },
      body: JSON.stringify({ query, variables: { login: GITHUB_USER, from: from.toISOString(), to: now.toISOString() } })
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors || !json.data || !json.data.user) return null;

    return json.data.user.contributionsCollection.commitContributionsByRepository
      .map((c) => c.repository)
      .filter((r) => r && !r.isFork);
  } catch (err) {
    return null;
  }
}

// True all-time authored-commit count + first-commit date for one repo,
// via the Search Commits API (repo:owner/name author:user) — this is
// not limited to a rolling window the way contributionsCollection is,
// so it matches "since the beginning" the way a README stats badge would.
async function fetchRepoAllTime(repo, headers) {
  try {
    const q = encodeURIComponent(`repo:${repo.nameWithOwner} author:${GITHUB_USER}`);

    const countRes = await fetch(`https://api.github.com/search/commits?q=${q}&per_page=1`, { headers });
    if (!countRes.ok) return null;
    const countJson = await countRes.json();
    const commits = typeof countJson.total_count === 'number' ? countJson.total_count : 0;
    if (commits === 0) return null;

    let since = repo.createdAt;
    const firstRes = await fetch(`https://api.github.com/search/commits?q=${q}&sort=author-date&order=asc&per_page=1`, { headers });
    if (firstRes.ok) {
      const firstJson = await firstRes.json();
      if (firstJson.items && firstJson.items[0] && firstJson.items[0].commit) {
        since = firstJson.items[0].commit.author.date;
      }
    }

    return { name: repo.name, url: repo.url, commits, since };
  } catch (err) {
    return null;
  }
}

async function fetchProjectStats(headers, repos) {
  if (!repos || !repos.length) return null;

  const top = repos.slice(0, 4);
  const results = await Promise.all(top.map((repo) => fetchRepoAllTime(repo, headers)));
  const cleaned = results.filter(Boolean);
  return cleaned.length ? cleaned : null;
}

// ── CI / build health ──
// For each of the same top contributed repos already discovered for
// Project Stats, checks whether that repo runs GitHub Actions and, if
// so, reports its most recent run plus a rolling pass rate over the
// last 15 completed runs. This is a real trust signal for a technical
// reviewer ("tested", not just "committed") but it's genuinely optional:
// a repo with no workflows, a token without Actions permission, or a
// private Actions log all just resolve to `null` for that repo and get
// filtered out — same graceful degradation as everything else here.
//
// Needs GITHUB_TOKEN to additionally have "Actions: Read-only" on a
// fine-grained PAT (the "Metadata: Read-only" scope used for the REST
// feed elsewhere in this file is not enough on its own) — without it,
// GitHub returns 403/404 and `ci` comes back null, same as a missing
// token entirely.
async function fetchRepoCIHealth(repo, headers) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo.nameWithOwner}/actions/runs?per_page=15`,
      { headers }
    );
    if (!res.ok) return null; // no workflows, no Actions permission, or Actions disabled
    const json = await res.json();
    const runs = json.workflow_runs;
    if (!Array.isArray(runs) || !runs.length) return null;

    const finished = runs.filter((r) => r.status === 'completed');
    const passed = finished.filter((r) => r.conclusion === 'success').length;
    const passRate = finished.length ? Math.round((passed / finished.length) * 100) : null;

    const latest = runs[0];
    return {
      repo: repo.name,
      url: latest.html_url,
      status: latest.status,          // queued | in_progress | completed
      conclusion: latest.conclusion,  // success | failure | cancelled | null
      ranAt: latest.created_at,
      passRate,                       // 0-100, or null if no runs have finished yet
      sampleSize: finished.length
    };
  } catch (err) {
    return null;
  }
}

async function fetchCIHealth(headers, repos) {
  if (!repos || !repos.length) return null;
  const top = repos.slice(0, 4);
  const results = await Promise.all(top.map((repo) => fetchRepoCIHealth(repo, headers)));
  const cleaned = results.filter(Boolean);
  return cleaned.length ? cleaned : null;
}

// ── Dependency freshness ──
// For each of the same top contributed repos already discovered above,
// reads package.json via the Contents API and checks each pinned
// "dependencies" entry against npm's current "latest" — specifically
// whether it's on the same MAJOR version, not an exact-version match
// (see majorVersion() below for why). A repo with no package.json (not
// a Node project), an unparsable one, or zero comparable deps just
// resolves to null and gets filtered out — same graceful-degradation
// pattern as CI Health and Project Stats.
//
// Capped deliberately to keep this fast and polite to the npm registry:
// at most DEP_FRESHNESS_MAX_REPOS repos, at most
// DEP_FRESHNESS_MAX_DEPS_PER_REPO dependencies checked per repo (only
// `dependencies`, not `devDependencies` — that's the set a technical
// reviewer actually cares about for a shipped project).
const DEP_FRESHNESS_MAX_REPOS = 3;
const DEP_FRESHNESS_MAX_DEPS_PER_REPO = 12;

// Reduces a semver range spec ("^5.2.1", "~2.0.0", ">=1.0.0 <2.0.0") down
// to the version actually pinned, so it can be compared against npm's
// "latest". Anything that isn't a plain version (git URLs, "workspace:*",
// "latest", file: links, etc.) returns null and gets skipped rather than
// mis-reported as outdated.
function stripVersionRange(spec) {
  if (!spec || typeof spec !== 'string') return null;
  const first = spec.split('||')[0].trim().split(' ')[0];
  const cleaned = first.replace(/^[\^~>=<]+/, '').trim();
  return /^\d/.test(cleaned) ? cleaned : null;
}

// First numeric segment of a version string ("12.19.0" -> "12"). Used to
// compare "freshness" by major version rather than exact string equality
// — a package pinned a few patch/minor releases behind its npm "latest"
// is normal and not meaningfully outdated; a whole major version behind
// (React 17 vs React 18) is the bar reviewers actually care about.
function majorVersion(v) {
  if (!v) return null;
  const m = v.match(/^(\d+)/);
  return m ? m[1] : null;
}

async function fetchLatestNpmVersion(pkgName) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`, {
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json && json.version ? json.version : null;
  } catch (err) {
    return null;
  }
}

async function fetchRepoDependencyFreshness(repo, headers) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo.nameWithOwner}/contents/package.json`,
      { headers }
    );
    if (!res.ok) return null; // not a Node project, or file not at repo root
    const json = await res.json();
    if (!json.content) return null;
    let pkg;
    try {
      pkg = JSON.parse(Buffer.from(json.content, 'base64').toString('utf8'));
    } catch (err) {
      return null;
    }

    const deps = pkg.dependencies || {};
    const names = Object.keys(deps).slice(0, DEP_FRESHNESS_MAX_DEPS_PER_REPO);
    if (!names.length) return null;

    const latestVersions = await Promise.all(names.map((n) => fetchLatestNpmVersion(n)));

    // "Fresh" = same major version as npm's current latest — not an
    // exact-string match. A patch or minor version behind is completely
    // normal and isn't counted against the score; only a full major
    // version gap (a real breaking-change gap) counts as outdated.
    let upToDate = 0;
    const outdated = [];
    names.forEach((name, i) => {
      const pinned = stripVersionRange(deps[name]);
      const latest = latestVersions[i];
      if (!pinned || !latest) return; // can't compare — skip rather than guess
      if (majorVersion(pinned) === majorVersion(latest)) {
        upToDate += 1;
      } else {
        outdated.push({ name, pinned, latest });
      }
    });

    const comparable = upToDate + outdated.length;
    if (!comparable) return null;

    return {
      repo: repo.name,
      url: repo.url,
      freshPercent: Math.round((upToDate / comparable) * 100),
      upToDate,
      total: comparable,
      // A few concrete examples for the card's detail line — not the
      // full outdated list, just enough to substantiate the percentage.
      outdated: outdated.slice(0, 4)
    };
  } catch (err) {
    return null;
  }
}

async function fetchDependencyFreshness(headers, repos) {
  if (!repos || !repos.length) return null;
  const top = repos.slice(0, DEP_FRESHNESS_MAX_REPOS);
  const results = await Promise.all(top.map((repo) => fetchRepoDependencyFreshness(repo, headers)));
  const cleaned = results.filter(Boolean);
  return cleaned.length ? cleaned : null;
}

// Aggregate bytes-per-language across all owned (non-fork) repos, using
// GitHub's per-repo languages endpoint, then reduce to a top-5 + "Other"
// breakdown by percentage. Colors are assigned client-side.
async function fetchLanguageBreakdown(headers) {
  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?type=owner&per_page=100&sort=pushed`,
      { headers }
    );
    if (!reposRes.ok) return null;
    const repos = await reposRes.json();
    if (!Array.isArray(repos)) return null;
    const owned = repos.filter((r) => !r.fork);
    if (!owned.length) return null;

    const langResults = await Promise.all(owned.map((r) =>
      fetch(r.languages_url, { headers })
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))
    ));

    const totals = {};
    langResults.forEach((langs) => {
      Object.entries(langs).forEach(([lang, bytes]) => {
        totals[lang] = (totals[lang] || 0) + bytes;
      });
    });

    const totalBytes = Object.values(totals).reduce((a, b) => a + b, 0);
    if (!totalBytes) return null;

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5).map(([name, bytes]) => ({
      name,
      percent: Math.round((bytes / totalBytes) * 1000) / 10
    }));

    const topSum = top.reduce((a, l) => a + l.percent, 0);
    const otherPercent = Math.round((100 - topSum) * 10) / 10;
    if (sorted.length > 5 && otherPercent > 0.4) {
      top.push({ name: 'Other', percent: otherPercent });
    }

    return top;
  } catch (err) {
    return null;
  }
}


// the real daily contribution calendar (the same data behind the green
// squares on a profile) — not an estimate. GraphQL's contributionsCollection
// only allows <=1yr windows, so this walks backward in yearly chunks from
// now to (at most) 3 years back or the account's creation date, whichever
// is more recent, to keep the function fast.
async function fetchContributionDays(token, sinceIso) {
  if (!token) return null;
  const cap = new Date();
  cap.setUTCFullYear(cap.getUTCFullYear() - 3);
  const since = new Date(Math.max(new Date(sinceIso).getTime(), cap.getTime()));
  const now = new Date();

  const windows = [];
  let windowEnd = now;
  while (windowEnd > since) {
    let windowStart = new Date(windowEnd);
    windowStart.setUTCFullYear(windowStart.getUTCFullYear() - 1);
    windowStart.setUTCDate(windowStart.getUTCDate() + 1);
    if (windowStart < since) windowStart = since;
    windows.push([windowStart, windowEnd]);
    windowEnd = new Date(windowStart);
    windowEnd.setUTCDate(windowEnd.getUTCDate() - 1);
  }

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }
  `;

  try {
    const results = await Promise.all(windows.map(([from, to]) =>
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': `${GITHUB_USER}-portfolio`
        },
        body: JSON.stringify({ query, variables: { login: GITHUB_USER, from: from.toISOString(), to: to.toISOString() } })
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ));

    const dayMap = new Map();
    let totalContributions = 0;
    results.forEach((json) => {
      if (!json || json.errors || !json.data || !json.data.user) return;
      const cal = json.data.user.contributionsCollection.contributionCalendar;
      totalContributions += cal.totalContributions;
      cal.weeks.forEach((w) => w.contributionDays.forEach((d) => {
        dayMap.set(d.date, d.contributionCount);
      }));
    });

    const days = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    return { days, totalContributions, since: since.toISOString() };
  } catch (err) {
    return null;
  }
}

function computeStreaks(days) {
  if (!days.length) return null;

  let longest = { length: 0, start: null, end: null };
  let run = { length: 0, start: null };
  days.forEach((d) => {
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

  // Current streak: walk back from the most recent day. If the very last
  // day has no contributions yet (it may just not be over), skip it once
  // rather than treating it as a broken streak.
  let i = days.length - 1;
  if (days[i].count === 0) i -= 1;
  const currentEnd = i >= 0 ? days[i].date : null;
  let currentLength = 0;
  let currentStart = null;
  while (i >= 0 && days[i].count > 0) {
    currentLength += 1;
    currentStart = days[i].date;
    i -= 1;
  }

  return {
    currentStreak: currentLength,
    currentStart,
    currentEnd: currentLength ? currentEnd : null,
    longestStreak: longest.length,
    longestStart: longest.start,
    longestEnd: longest.end
  };
}

async function fetchGithubPulse(headers, token) {
  if (!token) return null;
  try {
    const userRes = await fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers });
    if (!userRes.ok) return null;
    const userJson = await userRes.json();

    const data = await fetchContributionDays(token, userJson.created_at);
    if (!data) return null;
    const streaks = computeStreaks(data.days);
    if (!streaks) return null;

    return {
      totalContributions: data.totalContributions,
      since: data.since,
      currentStreak: streaks.currentStreak,
      currentRange: streaks.currentStreak ? [streaks.currentStart, streaks.currentEnd] : null,
      longestStreak: streaks.longestStreak,
      longestRange: streaks.longestStreak ? [streaks.longestStart, streaks.longestEnd] : null,
      heatmap: data.days.slice(-84), // last 12 weeks, for the mini heatmap
      // Same daily data fetchContributionDays already pulled (up to 3 years
      // back), just not truncated to 84 days — this is what lets the
      // front-end's 7d/30d/90d/1y time-range toggle recompute score,
      // streak-as-of, and contribution totals for any window without a
      // second API call. Capped at ~1 year here (rather than sending the
      // full 3-year set) to keep the response size sane.
      heatmapFull: data.days.slice(-366)
    };
  } catch (err) {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${GITHUB_USER}-portfolio`
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const [activityResult, stats, contributedRepos, pulse, languages] = await Promise.all([
      fetchActivity(headers),
      fetchYearStats(process.env.GITHUB_TOKEN),
      fetchContributedRepos(process.env.GITHUB_TOKEN),
      fetchGithubPulse(headers, process.env.GITHUB_TOKEN),
      fetchLanguageBreakdown(headers)
    ]);

    // All three depend on the same repo list above, so they run together
    // here rather than each re-fetching it via their own
    // fetchContributedRepos call — cuts down the GraphQL/REST round trips
    // this endpoint makes.
    const [projectStats, ci, depFreshness] = await Promise.all([
      fetchProjectStats(headers, contributedRepos),
      fetchCIHealth(headers, contributedRepos),
      fetchDependencyFreshness(headers, contributedRepos)
    ]);

    // Trimmed repo list for the Repo Ecosystem view — just enough to
    // render a name + link + role tag, not the full GraphQL shape.
    // Ownership (own product / client work / OSS contribution) isn't
    // something GitHub's API can tell us, so it isn't computed here —
    // the front-end defaults every repo to "Own product" and a small
    // client-side map can override specific ones by name.
    const repos = (contributedRepos || []).slice(0, 8).map((r) => ({
      name: r.name,
      url: r.url
    }));

    // Sequential (not Promise.all'd with the above) so a same-day first
    // request writes today's snapshot BEFORE reading history back — the
    // freshest point is then always present in the same response instead
    // of lagging one request behind.
    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10);
    await snapshotLanguages(db, languages, todayStr);
    const languageHistory = await fetchLanguageHistory(db);

    res.status(200).json({
      activity: activityResult.activity,
      stats: stats,
      projectStats: projectStats,
      repos: repos,
      pulse: pulse,
      languages: languages,
      languageHistory: languageHistory,
      codingHours: describePeakWindow(activityResult.hourHistogram),
      ci: ci,
      depFreshness: depFreshness,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
};
