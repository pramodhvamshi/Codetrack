const axios = require('axios');

// In-memory cache for HackerRank profiles (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function parseBadge(badge) {
  return {
    solved: Number(badge.solved || 0),
    stars: Number(badge.stars || 0),
    rank: Number(badge.hacker_rank || 0),
    points: Number(badge.total_points || 0)
  };
}

const formatData = (profile, badgesData, username) => {
  const model = profile.model || {};
  const badges = badgesData.models || [];

  const result = {
    username,
    avatar: model.avatar || "",
    country: model.country || "",
    profileUrl: `https://www.hackerrank.com/profile/${username}`,
    problemSolving: {
      solved: 0,
      totalChallenges: 0,
      stars: 0,
      rank: 0,
      points: 0
    },
    python: { solved: 0, stars: 0, rank: 0, points: 0 },
    sql: { solved: 0, stars: 0, rank: 0, points: 0 },
    c: { solved: 0, stars: 0, rank: 0, points: 0 },
    cpp: { solved: 0, stars: 0, rank: 0, points: 0 },
    java: { solved: 0, stars: 0, rank: 0, points: 0 },
    javascript: { solved: 0, stars: 0, rank: 0, points: 0 },
    ruby: { solved: 0, stars: 0, rank: 0, points: 0 },
    daysOfCode: { solved: 0, stars: 0, rank: 0, points: 0 },
    daysOfJS: { solved: 0, stars: 0, rank: 0, points: 0 },
    daysOfStatistics: { solved: 0, stars: 0, rank: 0, points: 0 },
    react: { solved: 0, stars: 0, rank: 0, points: 0 }
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
        // Return fallback
        return {
          username,
          avatar: "",
          country: "",
          profileUrl: `https://www.hackerrank.com/profile/${username}`,
          problemSolving: { solved: 0, totalChallenges: 0, stars: 0, rank: 0, points: 0 },
          python: { solved: 0, stars: 0, rank: 0, points: 0 },
          sql: { solved: 0, stars: 0, rank: 0, points: 0 },
          c: { solved: 0, stars: 0, rank: 0, points: 0 },
          cpp: { solved: 0, stars: 0, rank: 0, points: 0 },
          java: { solved: 0, stars: 0, rank: 0, points: 0 },
          javascript: { solved: 0, stars: 0, rank: 0, points: 0 },
          ruby: { solved: 0, stars: 0, rank: 0, points: 0 },
          daysOfCode: { solved: 0, stars: 0, rank: 0, points: 0 },
          daysOfJS: { solved: 0, stars: 0, rank: 0, points: 0 },
          daysOfStatistics: { solved: 0, stars: 0, rank: 0, points: 0 },
          react: { solved: 0, stars: 0, rank: 0, points: 0 }
        };
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

module.exports = {
  fetchHackerRankProfile
};
