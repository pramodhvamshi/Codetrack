const axios = require('axios');
const cheerio = require('cheerio');

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

      const currentMatch = String(data.rating?.currentRatingNumber || '').match(/\d+/);
      const highestMatch = String(data.rating?.highestRating || '').match(/\d+/);
      const globalMatch = String(data.rating?.globalRank || '').match(/\d+/);

      const cleanCurrent = currentMatch ? currentMatch[0] : '';
      const cleanHighest = highestMatch ? highestMatch[0] : '';
      const cleanGlobal = globalMatch ? globalMatch[0] : '';

      let currentRating = cleanCurrent ? Number(cleanCurrent) : 0;
      let highestRating = cleanHighest ? Number(cleanHighest) : 0;
      let globalRank = cleanGlobal ? Number(cleanGlobal) : 0;

      if (currentRating > 5000) {
        console.warn(`Invalid CodeChef current rating parsed for ${username}: ${currentRating}. Rejecting as failure.`);
        throw new Error(`Parsed rating ${currentRating} is impossibly high.`);
      }

      let problemsSolved = data.problemSolved ? Number(data.problemSolved) : null;

      if (problemsSolved === null || isNaN(problemsSolved) || problemsSolved === 0) {
        try {
          const scrapeRes = await axios.get(`https://www.codechef.com/users/${encodeURIComponent(username)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
          });
          const html = String(scrapeRes.data);
          const $ = cheerio.load(html);
          
          let extracted = null;
          // Try Cheerio first
          $('section.rating-data-section h3').each(function() {
            const text = $(this).text();
            if (text.includes('Total Problems Solved')) {
              const num = text.match(/\d+/);
              if (num) extracted = Number(num[0]);
            }
          });
          
          // Regex fallback
          if (extracted === null || isNaN(extracted)) {
            const match = html.match(/Total Problems Solved[^0-9]*(\d+)/i);
            if (match && match[1]) {
              extracted = Number(match[1]);
            }
          }
          
          if (extracted !== null && !isNaN(extracted)) {
            problemsSolved = extracted;
          }
        } catch (scrapeErr) {
          console.warn(`CodeChef HTML scrape failed for ${username}: ${scrapeErr.message}`);
        }
      }

      problemsSolved = problemsSolved || 0; // Final safety fallback

      const formatted = {
        problemsSolved,
        currentRating,
        highestRating,
        globalRank,
        countryRank: data.rating?.countryRank || 'Inactive',
        contestCount
      };

      console.log({
        rating: formatted.currentRating,
        highestRating: formatted.highestRating,
        globalRank: formatted.globalRank,
        countryRank: formatted.countryRank,
        contestCount: formatted.contestCount,
        problemsSolved: formatted.problemsSolved
      });

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
