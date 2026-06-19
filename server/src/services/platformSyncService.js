const config = require('../config/env');
const { computeAggregateScores } = require('../utils/scoring');
const { computeActivityStatus } = require('../utils/activity');

const { fetchLeetCodeProfile } = require('./leetcodeService');
const { fetchCodeChefProfile } = require('./codechefService');
const { fetchGFGProfile } = require('./gfgService');
const { fetchGitHubProfile } = require('./githubService');
const { fetchHackerRankProfile } = require('./hackerrankService');
const { upsertActivity, recomputeActivityMetrics } = require('./activityEngine');

const GitHubModel = require('../models/GitHub');
const User = require('../models/User');
const CodingProfile = require('../models/CodingProfile');
const StudentProfile = require('../models/StudentProfile');
const WeeklyStats = require('../models/WeeklyStats');
const ResumeVersion = require('../models/ResumeVersion');
const { calculateProfileCompletion, calculatePlacementReadiness } = require('../utils/profileMetrics');

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is start of the week
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function updateWeeklyStats(userId, newLcSolved, newGfgSolved, prevLcSolved, prevGfgSolved) {
  const weekStart = getStartOfWeek();
  let stats = await WeeklyStats.findOne({ userId, weekStart });
  if (!stats) {
    stats = new WeeklyStats({
      userId,
      weekStart,
      lcSolvedStart: prevLcSolved,
      lcSolvedEnd: prevLcSolved,
      gfgSolvedStart: prevGfgSolved,
      gfgSolvedEnd: prevGfgSolved
    });
  }
  stats.lcSolvedEnd = newLcSolved;
  stats.gfgSolvedEnd = newGfgSolved;

  if (stats.lcSolvedEnd < stats.lcSolvedStart) {
    stats.lcSolvedStart = stats.lcSolvedEnd;
  }
  if (stats.gfgSolvedEnd < stats.gfgSolvedStart) {
    stats.gfgSolvedStart = stats.gfgSolvedEnd;
  }

  stats.weeklyScore = (stats.lcSolvedEnd - stats.lcSolvedStart) + (stats.gfgSolvedEnd - stats.gfgSolvedStart);
  if (stats.weeklyScore < 0) stats.weeklyScore = 0;

  await stats.save();
}

async function syncNormalizedProfiles(user, { lcData, ccData, gfgData, ghData, hrData }) {
  // Update/Create CodingProfile
  let codingProfile = await CodingProfile.findOne({ userId: user._id });
  if (!codingProfile) {
    codingProfile = new CodingProfile({ userId: user._id });
  }

  if (ghData) {
    codingProfile.github = {
      username: user.githubUsername || "",
      publicRepos: ghData.publicReposCount || ghData.publicRepos || 0,
      followers: ghData.followers || 0,
      following: ghData.following || 0,
      contributions: ghData.contributions?.length || 0,
      starsCount: ghData.starsCount || 0,
      lastSyncAt: new Date()
    };
  } else if (user.githubUsername) {
    codingProfile.github.username = user.githubUsername;
  }

  if (lcData) {
    codingProfile.leetcode = {
      username: user.leetcodeUsername || "",
      stats: lcData,
      lastSyncAt: new Date()
    };
  } else if (user.leetcodeUsername) {
    codingProfile.leetcode.username = user.leetcodeUsername;
  }

  if (gfgData) {
    codingProfile.geeksforgeeks = {
      username: user.gfgUsername || "",
      stats: gfgData.stats || gfgData,
      lastSyncAt: new Date()
    };
  } else if (user.gfgUsername) {
    codingProfile.geeksforgeeks.username = user.gfgUsername;
  }

  if (ccData) {
    codingProfile.codechef = {
      username: user.codechefUsername || "",
      stats: ccData,
      lastSyncAt: new Date()
    };
  } else if (user.codechefUsername) {
    codingProfile.codechef.username = user.codechefUsername;
  }

  if (hrData) {
    codingProfile.hackerrank = {
      username: user.hackerrankUsername || "",
      avatar: hrData.avatar || "",
      country: hrData.country || "",
      profileUrl: hrData.profileUrl || "",
      problemSolving: hrData.problemSolving || { solved: 0, totalChallenges: 0, stars: 0, rank: 0, points: 0 },
      python: hrData.python || { solved: 0, stars: 0, rank: 0, points: 0 },
      sql: hrData.sql || { solved: 0, stars: 0, rank: 0, points: 0 },
      c: hrData.c || { solved: 0, stars: 0, rank: 0, points: 0 },
      cpp: hrData.cpp || { solved: 0, stars: 0, rank: 0, points: 0 },
      java: hrData.java || { solved: 0, stars: 0, rank: 0, points: 0 },
      javascript: hrData.javascript || { solved: 0, stars: 0, rank: 0, points: 0 },
      ruby: hrData.ruby || { solved: 0, stars: 0, rank: 0, points: 0 },
      daysOfCode: hrData.daysOfCode || { solved: 0, stars: 0, rank: 0, points: 0 },
      daysOfJS: hrData.daysOfJS || { solved: 0, stars: 0, rank: 0, points: 0 },
      daysOfStatistics: hrData.daysOfStatistics || { solved: 0, stars: 0, rank: 0, points: 0 },
      react: hrData.react || { solved: 0, stars: 0, rank: 0, points: 0 },
      lastSyncAt: new Date()
    };
  } else if (user.hackerrankUsername) {
    codingProfile.hackerrank.username = user.hackerrankUsername;
  }

  await codingProfile.save();

  // Update/Create StudentProfile (specifically the readiness cache and completion score)
  let studentProfile = await StudentProfile.findOne({ userId: user._id });
  if (!studentProfile) {
    studentProfile = new StudentProfile({ userId: user._id });
    studentProfile.personalDetails = {
      fullName: user.name || "",
      email: user.email || "",
      branch: user.branch || "",
      year: user.currentYear || "1st Year",
      college: user.college || "",
      ssc: { schoolName: "", board: "", percentage: null, passoutYear: null },
      intermediate: { collegeName: "", board: "", percentage: null, passoutYear: null }
    };
    studentProfile.familyDetails = {
      parentStatus: 'Both Parents',
      father: { name: "", occupation: "", education: "", mobile: "" },
      mother: { name: "", occupation: "", education: "", mobile: "" },
      siblings: []
    };
  }

  // Ensure currentYear and college/branch sync from user to studentProfile personalDetails
  studentProfile.personalDetails.fullName = user.name || studentProfile.personalDetails.fullName || "";
  studentProfile.personalDetails.email = user.email || studentProfile.personalDetails.email || "";
  studentProfile.personalDetails.branch = user.branch || studentProfile.personalDetails.branch || "";
  studentProfile.personalDetails.year = user.currentYear || studentProfile.personalDetails.year || "1st Year";
  studentProfile.personalDetails.college = user.college || studentProfile.personalDetails.college || "";

  studentProfile.profileCompletion = calculateProfileCompletion(user, studentProfile);

  const defaultResume = await ResumeVersion.findOne({ userId: user._id, isDefault: true });
  const readiness = calculatePlacementReadiness(user, studentProfile, codingProfile, defaultResume);
  studentProfile.readinessProfile = readiness;

  await studentProfile.save();
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
 * Sync LeetCode, CodeChef, GFG, GitHub & HackerRank metrics for a user, update scores & activity status.
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

    // Ensure normalized models sync readiness
    await syncNormalizedProfiles(updatedUser, {});

    return updatedUser;
  }

  const prevLcSolved = Number(user.platformStats?.leetcode?.problemsSolved || user.platformStats?.leetcode?.totalSolved || 0);
  const prevGfgSolved = Number(user.platformStats?.geeksforgeeks?.totalProblemsSolved || user.platformStats?.geeksforgeeks?.problemsSolved || 0);

  const [lcRes, ccRes, gfgRes, ghRes, hrRes] = await Promise.allSettled([
    user.leetcodeUsername ? fetchLeetCodeProfile(user.leetcodeUsername, force) : Promise.resolve(null),
    user.codechefUsername ? fetchCodeChefProfile(user.codechefUsername, force) : Promise.resolve(null),
    user.gfgUsername ? fetchGFGProfile(user.gfgUsername, force) : Promise.resolve(null),
    user.githubUsername ? fetchGitHubProfile(user.githubUsername, force) : Promise.resolve(null),
    user.hackerrankUsername ? fetchHackerRankProfile(user.hackerrankUsername, force) : Promise.resolve(null)
  ]);

  const platformStats = user.platformStats || {};
  let hackerrankData = user.hackerrank || {};

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
        recentSubmissions: lcData.recentSubmissions || [],
        acceptanceRate: lcData.acceptanceRate || 0,
        contestHistory: lcData.contestHistory || []
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
        rating: ccData.currentRating, // Keep for backward compatibility
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

  // 5. Process HackerRank
  try {
    if (hrRes.status === 'fulfilled' && hrRes.value) {
      const hrData = hrRes.value;
      let badgeCount = 0;
      if (hrData.problemSolving?.solved > 0) badgeCount++;
      if (hrData.python?.solved > 0) badgeCount++;
      if (hrData.sql?.solved > 0) badgeCount++;
      if (hrData.c?.solved > 0) badgeCount++;
      if (hrData.cpp?.solved > 0) badgeCount++;
      if (hrData.java?.solved > 0) badgeCount++;
      if (hrData.javascript?.solved > 0) badgeCount++;
      if (hrData.ruby?.solved > 0) badgeCount++;
      if (hrData.daysOfCode?.solved > 0) badgeCount++;
      if (hrData.daysOfJS?.solved > 0) badgeCount++;
      if (hrData.daysOfStatistics?.solved > 0) badgeCount++;
      if (hrData.react?.solved > 0) badgeCount++;

      const skills = [];
      if (hrData.problemSolving?.solved > 0) skills.push(`Problem Solving (${hrData.problemSolving.stars}★)`);
      if (hrData.python?.solved > 0) skills.push(`Python (${hrData.python.stars}★)`);
      if (hrData.sql?.solved > 0) skills.push(`SQL (${hrData.sql.stars}★)`);
      if (hrData.c?.solved > 0) skills.push(`C (${hrData.c.stars}★)`);
      if (hrData.cpp?.solved > 0) skills.push(`C++ (${hrData.cpp.stars}★)`);
      if (hrData.java?.solved > 0) skills.push(`Java (${hrData.java.stars}★)`);
      if (hrData.javascript?.solved > 0) skills.push(`JavaScript (${hrData.javascript.stars}★)`);
      if (hrData.ruby?.solved > 0) skills.push(`Ruby (${hrData.ruby.stars}★)`);
      if (hrData.daysOfCode?.solved > 0) skills.push(`30 Days of Code (${hrData.daysOfCode.stars}★)`);
      if (hrData.daysOfJS?.solved > 0) skills.push(`10 Days of JavaScript (${hrData.daysOfJS.stars}★)`);
      if (hrData.daysOfStatistics?.solved > 0) skills.push(`10 Days of Statistics (${hrData.daysOfStatistics.stars}★)`);
      if (hrData.react?.solved > 0) skills.push(`React (${hrData.react.stars}★)`);

      hackerrankData = {
        username: user.hackerrankUsername,
        totalProblemsSolved: hrData.problemSolving?.solved || 0,
        badgeCount: badgeCount,
        skills: skills,
        certifications: [],
        ruby: hrData.ruby,
        daysOfCode: hrData.daysOfCode,
        daysOfJS: hrData.daysOfJS,
        daysOfStatistics: hrData.daysOfStatistics,
        react: hrData.react
      };

      const oldSolved = user.hackerrank?.totalProblemsSolved || 0;
      const newSolved = hrData.problemSolving?.solved || 0;
      if (newSolved > oldSolved) {
        await upsertActivity({
          userId: user._id,
          platform: 'hackerrank',
          type: 'solved',
          title: `HackerRank Solved: ${newSolved - oldSolved} problems`,
          timestamp: new Date(),
          meta: { problemsSolvedCount: newSolved, increment: newSolved - oldSolved }
        });
      }
    }
  } catch (error) {
    console.error('Error processing HackerRank platform stats mapping:', error.message);
  }

  user.platformStats = platformStats;
  user.hackerrank = hackerrankData;
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

  // Perform sync to normalized profiles
  await syncNormalizedProfiles(updatedUser, {
    lcData: lcRes.status === 'fulfilled' ? lcRes.value : null,
    ccData: ccRes.status === 'fulfilled' ? ccRes.value : null,
    gfgData: gfgRes.status === 'fulfilled' ? gfgRes.value : null,
    ghData: ghRes.status === 'fulfilled' ? ghRes.value : null,
    hrData: hrRes.status === 'fulfilled' ? hrRes.value : null
  });

  // Perform weekly stats snapshot update
  const newLcSolved = Number(updatedUser.platformStats?.leetcode?.problemsSolved || updatedUser.platformStats?.leetcode?.totalSolved || 0);
  const newGfgSolved = Number(updatedUser.platformStats?.geeksforgeeks?.totalProblemsSolved || updatedUser.platformStats?.geeksforgeeks?.problemsSolved || 0);
  await updateWeeklyStats(user._id, newLcSolved, newGfgSolved, prevLcSolved, prevGfgSolved);

  return updatedUser;
}

module.exports = {
  syncPlatformsForUser,
  syncNormalizedProfiles
};
