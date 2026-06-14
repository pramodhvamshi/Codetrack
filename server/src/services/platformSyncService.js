const config = require('../config/env');
const { computeAggregateScores } = require('../utils/scoring');
const { computeActivityStatus } = require('../utils/activity');

const { fetchLeetCodeProfile } = require('./leetcodeService');
const { fetchCodeChefProfile } = require('./codechefService');
const { fetchGFGProfile } = require('./gfgService');
const { fetchGitHubProfile } = require('./githubService');
const { upsertActivity, recomputeActivityMetrics } = require('./activityEngine');

const GitHubModel = require('../models/GitHub');
const User = require('../models/User');

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
 * Sync LeetCode, CodeChef, GFG & GitHub metrics for a user, update scores & activity status.
 * Returns the updated user document.
 */
async function syncPlatformsForUser(user, { force = false } = {}) {
  if (!force && shouldSkipSync(user)) {
    // Recompute activity metrics and scores from existing cache
    await recomputeActivityMetrics(user._id);
    const updatedUser = await User.findById(user._id);
    const scores = computeAggregateScores({
      platformStats: updatedUser.platformStats || {},
      hackerrank: updatedUser.hackerrank || {},
      currentActivityScore: updatedUser.scores?.activityScore || 0,
      currentConsistencyScore: updatedUser.scores?.consistencyScore || 0
    });

    updatedUser.scores = scores;
    updatedUser.activityStatus = computeActivityStatus(updatedUser);
    await updatedUser.save();
    return updatedUser;
  }

  const [lcRes, ccRes, gfgRes, ghRes] = await Promise.allSettled([
    user.leetcodeUsername ? fetchLeetCodeProfile(user.leetcodeUsername, force) : Promise.resolve(null),
    user.codechefUsername ? fetchCodeChefProfile(user.codechefUsername, force) : Promise.resolve(null),
    user.gfgUsername ? fetchGFGProfile(user.gfgUsername, force) : Promise.resolve(null),
    user.githubUsername ? fetchGitHubProfile(user.githubUsername, force) : Promise.resolve(null)
  ]);

  const platformStats = user.platformStats || {};

  // 1. Process LeetCode
  try {
    if (lcRes.status === 'fulfilled' && lcRes.value) {
      const lcData = lcRes.value;
      platformStats.leetcode = {
        username: user.leetcodeUsername,
        problemsSolved: lcData.totalSolved,
        easySolved: lcData.easySolved,
        mediumSolved: lcData.mediumSolved,
        hardSolved: lcData.hardSolved,
        contestCount: lcData.contestCount,
        rating: lcData.contestRating,
        ranking: lcData.ranking,
        lastSyncAt: new Date(),
        submissionCalendar: lcData.submissionCalendar || {},
        badges: lcData.badges || [],
        badgeCount: lcData.badgeCount || 0,
        recentSubmissions: lcData.recentSubmissions || []
      };

      if (lcData.recentSubmissions) {
        for (const sub of lcData.recentSubmissions) {
          await upsertActivity({
            userId: user._id,
            platform: 'leetcode',
            type: 'solved',
            title: `LeetCode Solved: "${sub.title}"`,
            link: `https://leetcode.com/problems/${sub.titleSlug}/`,
            timestamp: new Date(Number(sub.timestamp) * 1000),
            meta: { titleSlug: sub.titleSlug }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing LeetCode platform stats mapping:', error.message);
  }

  // 2. Process CodeChef
  try {
    if (ccRes.status === 'fulfilled' && ccRes.value) {
      const ccData = ccRes.value;
      const oldSolved = platformStats.codechef?.problemsSolved || 0;
      const newSolved = ccData.problemsSolved || 0;

      platformStats.codechef = {
        username: user.codechefUsername,
        problemsSolved: newSolved,
        currentRating: ccData.currentRating,
        highestRating: ccData.highestRating,
        globalRank: ccData.globalRank,
        countryRank: ccData.countryRank,
        contestCount: ccData.contestCount || 0,
        rating: ccData.currentRating, // Keep for backward compatibility with leaderboard ranking
        lastSyncAt: new Date()
      };

      if (newSolved > oldSolved) {
        const Activity = require('../models/Activity');
        const exists = await Activity.findOne({
          userId: user._id,
          platform: 'codechef',
          'meta.problemsSolvedCount': newSolved
        });
        if (!exists) {
          await upsertActivity({
            userId: user._id,
            platform: 'codechef',
            type: 'solved',
            title: `CodeChef Solved: ${newSolved - oldSolved} problems`,
            timestamp: new Date(),
            meta: { problemsSolvedCount: newSolved, increment: newSolved - oldSolved }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing CodeChef platform stats mapping:', error.message);
  }

  // 3. Process GeeksforGeeks
  try {
    if (gfgRes.status === 'fulfilled' && gfgRes.value) {
      const gfgData = gfgRes.value;
      platformStats.geeksforgeeks = {
        username: user.gfgUsername,
        problemsSolved: gfgData.stats.totalProblemsSolved,
        codingScore: (gfgData.stats.basicProblemsSolved || 0) * 1 + 
                     (gfgData.stats.easyProblemsSolved || 0) * 2 + 
                     (gfgData.stats.mediumProblemsSolved || 0) * 4 + 
                     (gfgData.stats.hardProblemsSolved || 0) * 8,
        instituteRank: gfgData.stats.instituteRank || 0,
        globalRank: gfgData.stats.globalRank || 0,
        monthlyScore: gfgData.stats.monthlyScore || 0,
        streak: gfgData.stats.streakInfo?.currentStreak || 0,
        lastSyncAt: new Date(),
        totalProblemsSolved: gfgData.stats.totalProblemsSolved,
        basicProblemsSolved: gfgData.stats.basicProblemsSolved,
        easyProblemsSolved: gfgData.stats.easyProblemsSolved,
        mediumProblemsSolved: gfgData.stats.mediumProblemsSolved,
        hardProblemsSolved: gfgData.stats.hardProblemsSolved,
        languageStats: gfgData.stats.languageStats || {}
      };

      if (gfgData.practice && gfgData.practice.recentProblems) {
        for (const prob of gfgData.practice.recentProblems) {
          await upsertActivity({
            userId: user._id,
            platform: 'geeksforgeeks',
            type: 'solved',
            title: `GFG Solved: "${prob.title}"`,
            link: prob.questionUrl,
            timestamp: prob.timestamp || new Date(),
            meta: { difficulty: prob.difficulty, language: prob.language, slug: prob.slug }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing GeeksforGeeks platform stats mapping:', error.message);
  }

  // 4. Process GitHub
  try {
    if (ghRes.status === 'fulfilled' && ghRes.value) {
      const ghData = ghRes.value;
      platformStats.github = {
        username: user.githubUsername,
        reposCount: ghData.publicReposCount,
        starsCount: ghData.starsCount,
        followersCount: ghData.followers,
        followingCount: ghData.following,
        contributions: ghData.contributions || [],
        lastSyncAt: new Date()
      };

      // Upsert detailed GitHub data
      await GitHubModel.findOneAndUpdate(
        { userId: user._id },
        {
          username: user.githubUsername,
          profileUrl: ghData.profileUrl,
          publicReposCount: ghData.publicReposCount,
          starsCount: ghData.starsCount,
          followers: ghData.followers,
          following: ghData.following,
          languages: ghData.languages,
          repositories: ghData.repositories,
          recentCommits: ghData.recentCommits,
          lastSyncAt: new Date()
        },
        { upsert: true, new: true }
      );

      if (ghData.recentCommits) {
        for (const commit of ghData.recentCommits) {
          await upsertActivity({
            userId: user._id,
            platform: 'github',
            type: 'commit',
            title: `GitHub Commit: "${commit.message}" to ${commit.repo}`,
            link: commit.url,
            timestamp: new Date(commit.timestamp),
            meta: { repo: commit.repo }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing GitHub platform stats mapping:', error.message);
  }

  user.platformStats = platformStats;
  user.lastPlatformSyncAt = new Date();
  
  // Save platform stats
  await user.save();

  // Recompute activity metrics (streaks, counts, activity score)
  await recomputeActivityMetrics(user._id);

  // Reload user to get latest updated activity scores
  const updatedUser = await User.findById(user._id);

  const scores = computeAggregateScores({
    platformStats: updatedUser.platformStats || {},
    hackerrank: updatedUser.hackerrank || {},
    currentActivityScore: updatedUser.scores?.activityScore || 0,
    currentConsistencyScore: updatedUser.scores?.consistencyScore || 0
  });

  updatedUser.scores = scores;
  updatedUser.activityStatus = computeActivityStatus(updatedUser);
  await updatedUser.save();

  return updatedUser;
}

module.exports = {
  syncPlatformsForUser
};

