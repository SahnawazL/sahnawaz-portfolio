// api/github-activity.js
//
// Returns recent public GitHub activity for GITHUB_USER, normalized into a
// small, display-friendly shape. Used to power a "Recently Shipped" section
// on the portfolio so it doesn't look like a site that was built once and
// abandoned.
//
// Env vars (set in Vercel → Settings → Environment Variables):
//   GITHUB_TOKEN   - a token with NO scopes / fine-grained with only
//                    "Metadata: Read-only". Only used to raise the rate
//                    limit from 60/hour (unauthenticated) to 5,000/hour.
//                    Works fine even if this var is missing entirely —
//                    the endpoint is public data either way — you'll just
//                    hit the lower rate limit sooner under real traffic.
//   GITHUB_USER    - optional override; defaults to 'SahnawazL' below.

const GITHUB_USER = process.env.GITHUB_USER || 'SahnawazL';

// Which event types are worth showing, and how to turn each into one line
// of human-readable text. GitHub's events API returns dozens of event
// types; most (WatchEvent, ForkEvent, etc.) aren't interesting here.
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
      return null; // skip branch/tag creation noise
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

module.exports = async (req, res) => {
  // Cache at the CDN edge for 10 minutes, serve stale for a bit longer
  // while revalidating in the background. This is what keeps you well
  // under GitHub's rate limit regardless of site traffic.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${GITHUB_USER}-portfolio`
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`,
      { headers }
    );

    if (!ghRes.ok) {
      res.status(ghRes.status).json({
        error: 'GitHub API request failed',
        status: ghRes.status
      });
      return;
    }

    const events = await ghRes.json();

    const activity = events
      .map(describeEvent)
      .filter(Boolean)
      .slice(0, 8); // cap what the front-end needs to render

    res.status(200).json({ activity, fetchedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
};
