const cron = require('node-cron');
const User = require('../models/User');
const WeeklySnapshot = require('../models/WeeklySnapshot');
const LeetCodeGrowthSnapshot = require('../models/LeetCodeGrowthSnapshot');
const ContestSnapshot = require('../models/ContestSnapshot');

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7); // "YYYY-MM"
}

function isLastDayOfMonth(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
}

/**
 * Capture weekly snapshots for all active, onboarded students.
 */
async function triggerWeeklySnapshots() {
  console.log('Triggering weekly snapshots...');
  const students = await User.find({ role: 'student', isOnboarded: true });
  const weekStart = getStartOfWeek();
  const weekKey = weekStart.toISOString().split('T')[0]; // "YYYY-MM-DD"

  let successCount = 0;
  for (const student of students) {
    try {
      const leetcode = student.platformStats?.leetcode || {};
      const codechef = student.platformStats?.codechef || {};

      // 1. Save Weekly Snapshot
      await WeeklySnapshot.findOneAndUpdate(
        { userId: student._id, weekKey },
        {
          leetcode: {
            rating: leetcode.rating || 0,
            ranking: leetcode.ranking || 0
          },
          codechef: {
            rating: codechef.currentRating || codechef.rating || 0,
            currentRating: codechef.currentRating || codechef.rating || 0,
            highestRating: codechef.highestRating || 0,
            stars: codechef.stars || '1★',
            globalRank: codechef.globalRank || 0,
            countryRank: codechef.countryRank || 'Inactive'
          },
          snapshotDate: new Date()
        },
        { upsert: true, new: true }
      );

      // 2. Save LeetCode Growth Snapshot (Weekly Medium Solved)
      await LeetCodeGrowthSnapshot.findOneAndUpdate(
        { userId: student._id, weekKey },
        {
          mediumSolved: leetcode.mediumSolved || 0,
          snapshotDate: new Date()
        },
        { upsert: true, new: true }
      );

      successCount++;
    } catch (err) {
      console.error(`Failed to capture weekly snapshot for student ${student.email}:`, err.message);
    }
  }

  console.log(`Weekly snapshots complete: ${successCount}/${students.length} students.`);
  await pruneWeeklySnapshots();
}

/**
 * Capture monthly snapshots for all active, onboarded students.
 */
async function triggerMonthlySnapshots() {
  console.log('Triggering monthly snapshots...');
  const students = await User.find({ role: 'student', isOnboarded: true });
  const monthKey = getMonthKey();

  let successCount = 0;
  for (const student of students) {
    try {
      const leetcode = student.platformStats?.leetcode || {};
      const codechef = student.platformStats?.codechef || {};

      await ContestSnapshot.findOneAndUpdate(
        { userId: student._id, monthKey },
        {
          leetcode: {
            rating: leetcode.rating || 0,
            ranking: leetcode.ranking || 0,
            contestCount: leetcode.contestCount || 0
          },
          codechef: {
            rating: codechef.currentRating || codechef.rating || 0,
            currentRating: codechef.currentRating || codechef.rating || 0,
            highestRating: codechef.highestRating || 0,
            stars: codechef.stars || '1★',
            globalRank: codechef.globalRank || 0,
            countryRank: codechef.countryRank || 'Inactive'
          },
          snapshotDate: new Date()
        },
        { upsert: true, new: true }
      );

      successCount++;
    } catch (err) {
      console.error(`Failed to capture monthly snapshot for student ${student.email}:`, err.message);
    }
  }

  console.log(`Monthly snapshots complete: ${successCount}/${students.length} students.`);
  await pruneMonthlySnapshots();
}

/**
 * Prune weekly snapshots older than 52 weeks.
 */
async function pruneWeeklySnapshots() {
  const fiftyTwoWeeksAgo = new Date();
  fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - 52 * 7);

  const resWeekly = await WeeklySnapshot.deleteMany({ snapshotDate: { $lt: fiftyTwoWeeksAgo } });
  const resGrowth = await LeetCodeGrowthSnapshot.deleteMany({ snapshotDate: { $lt: fiftyTwoWeeksAgo } });
  
  console.log(`Pruned weekly snapshots: ${resWeekly.deletedCount} removed. Growth snapshots: ${resGrowth.deletedCount} removed.`);
}

/**
 * Prune monthly snapshots older than 24 months.
 */
async function pruneMonthlySnapshots() {
  const twentyFourMonthsAgo = new Date();
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

  const resContest = await ContestSnapshot.deleteMany({ snapshotDate: { $lt: twentyFourMonthsAgo } });
  console.log(`Pruned monthly contest snapshots: ${resContest.deletedCount} removed.`);
}

/**
 * Initialize all cron jobs.
 */
function initScheduler() {
  console.log('Initializing snapshot cron scheduler...');

  // Weekly snapshot runs every Sunday at 11:59 PM
  cron.schedule('59 23 * * 0', async () => {
    console.log('Running scheduled Sunday weekly snapshots...');
    await triggerWeeklySnapshots();
  });

  // Daily check at 11:59 PM for monthly contest snapshots
  cron.schedule('59 23 * * *', async () => {
    const now = new Date();
    if (isLastDayOfMonth(now)) {
      console.log('Scheduled monthly snapshots run triggered (last day of month)...');
      await triggerMonthlySnapshots();
    }
  });

  console.log('Cron scheduler successfully initialized.');
}

module.exports = {
  initScheduler,
  triggerWeeklySnapshots,
  triggerMonthlySnapshots
};
