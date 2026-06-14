const axios = require('axios');

// In-memory cache (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchCodeChefProfile(username, force = false) {
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
      const response = await axios.get(
        `https://hades-black.vercel.app/api/codechef/user/${encodeURIComponent(username)}`,
        { timeout: 20000 }
      );

      const data = response.data?.data || {};

      const contestCount = Array.isArray(data.contests) ? data.contests.length : 0;

      const cleanCurrent = String(data.rating?.currentRatingNumber || '').replace(/[^\d]/g, '');
      const cleanHighest = String(data.rating?.highestRating || '').replace(/[^\d]/g, '');
      const cleanGlobal = String(data.rating?.globalRank || '').replace(/[^\d]/g, '');

      const formatted = {
        problemsSolved: Number(data.problemSolved || 0),
        currentRating: cleanCurrent ? Number(cleanCurrent) : 0,
        highestRating: cleanHighest ? Number(cleanHighest) : 0,
        globalRank: cleanGlobal ? Number(cleanGlobal) : 0,
        countryRank: data.rating?.countryRank || 'Inactive',
        contestCount
      };

      cache.set(username, { timestamp: now, data: formatted });
      return formatted;
    } catch (err) {
      retries--;
      console.warn(`CodeChef API sync attempt failed for ${username}. Retries left: ${retries}. Error:`, err.message);
      if (retries === 0) {
        // Cache Failure Strategy fallback
        if (cached) {
          console.log(`Returning stale CodeChef cache data for ${username}`);
          return cached.data;
        }
        return {
          problemsSolved: 0,
          currentRating: 0,
          highestRating: 0,
          globalRank: 0,
          countryRank: 'Inactive',
          contestCount: 0
        };
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

module.exports = {
  fetchCodeChefProfile
};
