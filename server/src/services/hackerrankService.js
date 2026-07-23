const axios = require('axios');

// In-memory cache for HackerRank profiles (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function parseBadge(badge) {
  return {
    solved: badge.solved !== undefined ? Number(badge.solved) : null,
    stars: badge.stars !== undefined ? Number(badge.stars) : null,
    rank: badge.hacker_rank !== undefined ? Number(badge.hacker_rank) : null,
    points: badge.total_points !== undefined ? Number(badge.total_points) : null
  };
}

const formatData = (profile, badgesData, username) => {
  const model = profile.model || {};
  const badges = badgesData.models || [];

  const result = {
    username,
    avatar: model.avatar || null,
    country: model.country || null,
    profileUrl: `https://www.hackerrank.com/profile/${username}`,
    problemSolving: {
      solved: null,
      totalChallenges: null,
      stars: null,
      rank: null,
      points: null
    },
    python: { solved: null, stars: null, rank: null, points: null },
    sql: { solved: null, stars: null, rank: null, points: null },
    c: { solved: null, stars: null, rank: null, points: null },
    cpp: { solved: null, stars: null, rank: null, points: null },
    java: { solved: null, stars: null, rank: null, points: null },
    javascript: { solved: null, stars: null, rank: null, points: null },
    ruby: { solved: null, stars: null, rank: null, points: null },
    daysOfCode: { solved: null, stars: null, rank: null, points: null },
    daysOfJS: { solved: null, stars: null, rank: null, points: null },
    daysOfStatistics: { solved: null, stars: null, rank: null, points: null },
    react: { solved: null, stars: null, rank: null, points: null },
    totalCertifications: Array.isArray(model.certificates) ? model.certificates.length : null,
    certificates: model.certificates || null,
    skills: model.skills || null,
    lastSynced: new Date()
  };

  for (const b of badges) {
    const type = String(b.badge_type || "").toLowerCase();
    const parsed = parseBadge(b);
    if (type === 'problem-solving') {
      result.problemSolving = {
        solved: parsed.solved,
        totalChallenges: Number(b.total_challenges || 0),
        stars: parsed.stars,
        rank: parsed.rank,
        points: parsed.points
      };
    } else if (type === 'python') {
      result.python = parsed;
    } else if (type === 'sql') {
      result.sql = parsed;
    } else if (type === 'c') {
      result.c = parsed;
    } else if (type === 'cpp') {
      result.cpp = parsed;
    } else if (type === 'java') {
      result.java = parsed;
    } else if (type === 'javascript') {
      result.javascript = parsed;
    } else if (type === 'ruby') {
      result.ruby = parsed;
    } else if (type === '30-days-of-code' || type === 'days-of-code') {
      result.daysOfCode = parsed;
    } else if (type === '10-days-of-javascript' || type === '30-days-of-javascript') {
      result.daysOfJS = parsed;
    } else if (type === '10-days-of-statistics') {
      result.daysOfStatistics = parsed;
    } else if (type === 'react') {
      result.react = parsed;
    }
  }

  return result;
};

async function fetchHackerRankProfile(username, force = false) {
  if (!username) return null;

  const now = Date.now();
  const cached = cache.get(username);
  if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const [profileRes, badgesRes] = await Promise.all([
        axios.get(`https://www.hackerrank.com/rest/hackers/${username}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 20000
        }),
        axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 20000
        })
      ]);

      const formatted = formatData(profileRes.data, badgesRes.data, username);
      cache.set(username, { timestamp: now, data: formatted });
      return formatted;
    } catch (err) {
      retries--;
      console.warn(`HackerRank sync attempt failed for ${username}. Retries left: ${retries}. Error:`, err.message);
      if (retries === 0) {
        if (cached) {
          console.log(`Returning stale HackerRank cache data for ${username}`);
          return cached.data;
        }
        const is404 = err.response && err.response.status === 404;
        const msg = is404 ? 'User does not exist (404 Not Found)' : err.message;
        throw new Error(`HackerRank API failed for ${username} after all retries: ${msg}`);
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

module.exports = {
  fetchHackerRankProfile
};
