const axios = require('axios');
const config = require('../config/env');
const { computeAggregateScores } = require('../utils/scoring');
const { computeActivityStatus } = require('../utils/activity');

/**
 * Fetch LeetCode metrics for a username using Alfa LeetCode API.
 * API: https://alfa-leetcode-api.onrender.com/
 * Endpoints: /:username/solved, /:username/contest
 */
async function fetchLeetCodeMetrics(username) {
  if (!username) return null;

  const base = config.leetcodeApiBaseUrl.replace(/\/+$/, '');

  try {
    const [solvedRes, contestRes] = await Promise.all([
      axios.get(`${base}/${encodeURIComponent(username)}/solved`, { timeout: 30000 }),
      axios.get(`${base}/${encodeURIComponent(username)}/contest`, { timeout: 30000 })
    ]);

    const solvedData = solvedRes.data?.data || solvedRes.data || {};
    const contestData = contestRes.data?.data || contestRes.data || {};

    return {
      username,
      problemsSolved: Number(solvedData.totalSolved || solvedData.solvedProblem || 0),
      contestCount: Number(contestData.contestAttend || contestData.attendedContestsCount || 0),
      rating: Number(contestData.contestRating || contestData.rating || 0),
      lastSyncAt: new Date()
    };
  } catch (err) {
    console.error(`LeetCode API error for ${username}:`, err.message);
    return null;
  }
}

/**
 * Fetch CodeChef metrics for a username using Hades Black API.
 * API: https://hades-black.vercel.app/api/codechef/user/[username]
 * Returns: { status: 200, data: { problemSolved, rating: { currentRatingNumber }, contests: [...] } }
 */
async function fetchCodeChefMetrics(username) {
  if (!username) return null;

  const base = config.codechefApiBaseUrl.replace(/\/+$/, '');

  try {
    const res = await axios.get(
      `${base}/codechef/user/${encodeURIComponent(username)}`,
      { timeout: 30000 }
    );

    const data = res.data?.data || {};

    return {
      username,
      problemsSolved: Number(data.problemSolved || 0),
      contestCount: Array.isArray(data.contests) ? data.contests.length : 0,
      rating: Number(data.rating?.currentRatingNumber || 0),
      lastSyncAt: new Date()
    };
  } catch (err) {
    console.error(`CodeChef API error for ${username}:`, err.message);
    return null;
  }
}

/**
 * Determine whether we should call external APIs again for this user,
 * based on the last sync timestamp and configured minimum interval.
 */
function shouldSkipSync(user) {
  if (!user.lastPlatformSyncAt) return false;

  const minMinutes = config.platformSyncMinMinutes;
  const minMs = minMinutes * 60 * 1000;
  const last = new Date(user.lastPlatformSyncAt).getTime();

  return Date.now() - last < minMs;
}

/**
 * Sync LeetCode & CodeChef metrics for a user, update scores & activity status.
 * Returns the updated user document.
 */
async function syncPlatformsForUser(user, { force = false } = {}) {
  if (!force && shouldSkipSync(user)) {
    // Recompute scores/activity from existing cached metrics
    const scores = computeAggregateScores({
      platformStats: user.platformStats || {},
      hackerrank: user.hackerrank || {}
    });

    user.scores = scores;
    user.activityStatus = computeActivityStatus(user);
    await user.save();
    return user;
  }

  const [lcMetrics, ccMetrics] = await Promise.allSettled([
    fetchLeetCodeMetrics(user.leetcodeUsername),
    fetchCodeChefMetrics(user.codechefUsername)
  ]);

  const platformStats = user.platformStats || {};

  if (lcMetrics.status === 'fulfilled' && lcMetrics.value) {
    platformStats.leetcode = {
      ...(platformStats.leetcode || {}),
      ...lcMetrics.value
    };
  }

  if (ccMetrics.status === 'fulfilled' && ccMetrics.value) {
    platformStats.codechef = {
      ...(platformStats.codechef || {}),
      ...ccMetrics.value
    };
  }

  user.platformStats = platformStats;
  user.lastPlatformSyncAt = new Date();

  const scores = computeAggregateScores({
    platformStats: user.platformStats,
    hackerrank: user.hackerrank || {}
  });

  user.scores = scores;
  user.activityStatus = computeActivityStatus(user);

  await user.save();

  return user;
}

module.exports = {
  syncPlatformsForUser
};

