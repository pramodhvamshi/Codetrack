const axios = require('axios');
const pLimit = require('p-limit');

// In-memory cache for GitHub profiles (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const limit = pLimit(2);

async function _fetchGitHubProfile(username, force = false) {
  if (!username) return null;

  const now = Date.now();
  const cached = cache.get(username);
  if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const headers = {
      'User-Agent': 'CodeTrack-V2-App'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Fetch user general profile
    const profileRes = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      { headers, timeout: 15000 }
    );
    const profileData = profileRes.data || {};

    // 2. Fetch public repositories (up to 100)
    const reposRes = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      { headers, timeout: 15000 }
    );
    const reposData = reposRes.data || [];

    // 3. Fetch recent events to extract commit activity
    let recentCommits = [];
    try {
      const eventsRes = await axios.get(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public`,
        { headers, timeout: 10000 }
      );
      const eventsData = eventsRes.data || [];

      // Filter PushEvents and extract commits
      eventsData.forEach(evt => {
        if (evt.type === 'PushEvent' && evt.payload && evt.payload.commits) {
          evt.payload.commits.forEach(c => {
            recentCommits.push({
              repo: evt.repo.name,
              message: c.message,
              timestamp: new Date(evt.created_at),
              url: `https://github.com/${evt.repo.name}/commit/${c.sha}`
            });
          });
        }
      });
    } catch (eventsErr) {
      console.warn(`Could not fetch GitHub events for ${username}:`, eventsErr.message);
    }

    // 4. Fetch contributions calendar (Try-catch fallback)
    let contributions = [];
    try {
      const contribRes = await axios.get(
        `https://github-contributions-api.deno.dev/${encodeURIComponent(username)}.json`,
        { timeout: 10000 }
      );
      if (contribRes.data && contribRes.data.contributions) {
        for (const week of contribRes.data.contributions) {
          if (Array.isArray(week)) {
            for (const day of week) {
              contributions.push({
                date: day.date,
                contributionCount: day.contributionCount || 0
              });
            }
          }
        }
      }
    } catch (contribErr) {
      console.warn(`Could not fetch GitHub contributions for ${username}:`, contribErr.message);
    }

    // Process languages and stars
    let totalStars = 0;
    const languages = {};
    const processedRepos = reposData.map(r => {
      totalStars += r.stargazers_count || 0;
      if (r.language) {
        languages[r.language] = (languages[r.language] || 0) + 1;
      }
      return {
        name: r.name,
        stars: r.stargazers_count || 0,
        language: r.language || 'Unknown',
        url: r.html_url,
        description: r.description || ''
      };
    });

    const result = {
      username: profileData.login || username,
      profileUrl: profileData.html_url,
      publicReposCount: profileData.public_repos || 0,
      starsCount: totalStars,
      followers: profileData.followers || 0,
      following: profileData.following || 0,
      languages,
      repositories: processedRepos.slice(0, 30), // Store top 30 repos
      recentCommits: recentCommits.slice(0, 20),  // Store latest 20 commits
      contributions                               // Store contributions calendar
    };

    cache.set(username, { timestamp: now, data: result });
    return result;
  } catch (err) {
    // Log rate limit headers as requested by user
    if (err.response && err.response.headers) {
      console.warn(`[GitHub 403 Debug for ${username}] Rate Limit Limit: ${err.response.headers['x-ratelimit-limit']}, Remaining: ${err.response.headers['x-ratelimit-remaining']}`);
      console.warn(`[GitHub 403 Debug for ${username}] Authenticated: ${process.env.GITHUB_TOKEN ? 'YES' : 'NO'}`);
      console.warn(`[GitHub 403 Debug for ${username}] Message: ${err.response.data?.message}`);
    } else {
      console.warn(`GitHub API sync failed for ${username}:`, err.message);
    }

    // Cache Failure Strategy fallback
    if (cached) {
      console.log(`Returning stale GitHub cache data for ${username}`);
      return cached.data;
    }
    
    // If it's 403 and x-ratelimit-remaining is high, it's a Secondary Rate Limit (Concurrency).
    const isRateLimit = err.response?.status === 403;
    const isSecondary = isRateLimit && err.response?.headers && Number(err.response.headers['x-ratelimit-remaining']) > 10;
    
    const errorMsg = isSecondary ? '403 Forbidden (Secondary Rate Limit - Concurrency)' 
                   : (isRateLimit ? '403 Forbidden (Rate Limit)' : err.message);
                   
    throw new Error(errorMsg);
  }
}

function fetchGitHubProfile(username, force = false) {
  return limit(() => _fetchGitHubProfile(username, force));
}

module.exports = {
  fetchGitHubProfile
};
