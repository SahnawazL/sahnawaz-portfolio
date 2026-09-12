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

async function fetchActivity(headers) {
  const ghRes = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`,
    { headers }
  );
  if (!ghRes.ok) return { activity: [], error: `events:${ghRes.status}` };

  const events = await ghRes.json();
  const activity = events.map(describeEvent).filter(Boolean).slice(0, 15);
  return { activity };
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
    const [activityResult, stats, projectStats] = await Promise.all([
      fetchActivity(headers),
      fetchYearStats(process.env.GITHUB_TOKEN),
      fetchProjectStats(headers, process.env.GITHUB_TOKEN)
    ]);

    res.status(200).json({
      activity: activityResult.activity,
      stats: stats,
      projectStats: projectStats,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
};
