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
//
// Env vars (set in Vercel → Settings → Environment Variables):
//   GITHUB_TOKEN   - fine-grained, Metadata: Read-only is enough for the
//                    REST feed; needed at all (any valid token) for the
//                    GraphQL stats to work.
//   GITHUB_USER    - optional override; defaults to 'SahnawazL' below.

const GITHUB_USER = process.env.GITHUB_USER || 'SahnawazL';

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
  const ghRes = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`,
    { headers }
  );
  if (!ghRes.ok) return { activity: [], hourHistogram: null, error: `events:${ghRes.status}` };

  const events = await ghRes.json();
  const activity = events.map(describeEvent).filter(Boolean).slice(0, 15);

  const histogram = new Array(24).fill(0);
  events.forEach((e) => {
    if (!e.created_at) return;
    histogram[toISTHour(e.created_at)] += 1;
  });
  const hasData = histogram.some((c) => c > 0);

  return { activity, hourHistogram: hasData ? histogram : null };
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

async function fetchProjectStats(headers, token) {
  const repos = await fetchContributedRepos(token);
  if (!repos || !repos.length) return null;

  const top = repos.slice(0, 4);
  const results = await Promise.all(top.map((repo) => fetchRepoAllTime(repo, headers)));
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
      heatmap: data.days.slice(-84) // last 12 weeks, for the mini heatmap
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
    const [activityResult, stats, projectStats, pulse, languages] = await Promise.all([
      fetchActivity(headers),
      fetchYearStats(process.env.GITHUB_TOKEN),
      fetchProjectStats(headers, process.env.GITHUB_TOKEN),
      fetchGithubPulse(headers, process.env.GITHUB_TOKEN),
      fetchLanguageBreakdown(headers)
    ]);

    res.status(200).json({
      activity: activityResult.activity,
      stats: stats,
      projectStats: projectStats,
      pulse: pulse,
      languages: languages,
      codingHours: describePeakWindow(activityResult.hourHistogram),
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
};
