const axios = require('axios');
const cheerio = require('cheerio');
const pLimit = require('p-limit');

// In-memory cache (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const limit = pLimit(1);

async function _fetchCodeChefProfile(username, force = false) {
  if (!username) return null;

  const now = Date.now();
  const cached = cache.get(username);
  if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const delays = [3000, 6000, 12000];
  let attempt = 0;

  while (attempt <= delays.length) {
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

      cache.set(username, { timestamp: now, data: formatted });
      return formatted;
    } catch (err) {
      console.warn(`CodeChef API sync attempt failed for ${username}. Attempt: ${attempt + 1}. Error: ${err.message}`);
      if (attempt === delays.length) {
        // Cache Failure Strategy fallback
        if (cached) {
          console.log(`Returning stale CodeChef cache data for ${username}`);
          return cached.data;
        }
        throw new Error(`CodeChef API failed for ${username} after ${attempt} retries: ${err.message}`);
      }
      await new Promise(res => setTimeout(res, delays[attempt]));
      attempt++;
    }
  }
}

function fetchCodeChefProfile(username, force = false) {
  return limit(async () => {
    try {
      const result = await _fetchCodeChefProfile(username, force);
      // Mandatory pacing delay to prevent global Vercel rate limit exhaustion during bulk sync
      await new Promise(res => setTimeout(res, 1500));
      return result;
    } catch (err) {
      await new Promise(res => setTimeout(res, 1500));
      throw err;
    }
  });
}

module.exports = {
  fetchCodeChefProfile
};
