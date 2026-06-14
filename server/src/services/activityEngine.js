const Activity = require('../models/Activity');
const User = require('../models/User');

/**
 * Upsert activity to prevent duplicates
 */
async function upsertActivity({ userId, platform, type, title, link, timestamp, meta = {} }) {
  // Normalize timestamp to start of second or millisecond
  const ts = new Date(timestamp);
  
  // Look for existing activity with same user, platform, type, title, and timestamp
  // Or if GitHub commit, same commit URL/hash in meta
  const query = {
    userId,
    platform,
    type,
    title,
    timestamp: {
      $gte: new Date(ts.getTime() - 1000 * 60), // ±1 minute window to account for small parsing differences
      $lte: new Date(ts.getTime() + 1000 * 60)
    }
  };

  if (meta.sha || meta.url) {
    query.$or = [
      { 'meta.sha': meta.sha },
      { 'meta.url': meta.url }
    ];
  }

  const existing = await Activity.findOne(query);
  if (!existing) {
    await Activity.create({
      userId,
      platform,
      type,
      title,
      link,
      timestamp: ts,
      meta
    });
  }
}

/**
 * Re-calculate streaks, activity score, and consistency metrics for a user
 */
async function recomputeActivityMetrics(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  // 1. Fetch all activities for user, sorted ascending by timestamp
  const activities = await Activity.find({ userId }).sort({ timestamp: 1 });
  if (activities.length === 0) {
    user.currentStreak = 0;
    user.longestStreak = 0;
    user.activeDaysCount = 0;
    user.consistencyPercentage = 0;
    user.monthlyActivityCount = 0;
    user.yearlyActivityCount = 0;
    user.scores.activityScore = 0;
    user.scores.consistencyScore = 0;
    await user.save();
    return user;
  }

  // 2. Group activities by unique dates (YYYY-MM-DD) in local/UTC timezone
  const activeDatesSet = new Set();
  const recent30DaysSet = new Set();
  const currentMonthSet = new Set();
  const currentYearSet = new Set();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const limit30Days = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Set of platforms used in the last 30 days
  const activePlatforms = new Set();

  activities.forEach(act => {
    const ts = new Date(act.timestamp);
    const dateStr = ts.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    activeDatesSet.add(dateStr);

    if (ts >= limit30Days) {
      recent30DaysSet.add(dateStr);
      activePlatforms.add(act.platform);
    }
    if (ts.getFullYear() === currentYear) {
      currentYearSet.add(dateStr);
      if (ts.getMonth() === currentMonth) {
        currentMonthSet.add(dateStr);
      }
    }
  });

  const uniqueDatesSorted = Array.from(activeDatesSet).sort();

  // 3. Compute Current and Longest Streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  // A helper function to check if two ISO string dates are consecutive days
  const isConsecutive = (d1Str, d2Str) => {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    const diff = d2.getTime() - d1.getTime();
    return diff <= 24 * 60 * 60 * 1000 * 1.5; // Up to 36 hours to cover timezone variations safely
  };

  uniqueDatesSorted.forEach(dateStr => {
    if (!prevDate) {
      tempStreak = 1;
    } else if (isConsecutive(prevDate, dateStr)) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
    prevDate = dateStr;
  });
  longestStreak = Math.max(longestStreak, tempStreak);

  // Evaluate Current Streak
  const todayStr = startOfToday.toISOString().split('T')[0];
  const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (activeDatesSet.has(todayStr)) {
    // Last activity was today, trace backwards
    currentStreak = getStreakLengthEndingOn(activeDatesSet, todayStr);
  } else if (activeDatesSet.has(yesterdayStr)) {
    // Last activity was yesterday, streak is still alive
    currentStreak = getStreakLengthEndingOn(activeDatesSet, yesterdayStr);
  } else {
    // Last activity was more than a day ago, streak is broken
    currentStreak = 0;
  }

  // Helper to walk backwards day-by-day and count streak
  function getStreakLengthEndingOn(dateSet, endStr) {
    let count = 0;
    let curr = new Date(endStr);
    while (true) {
      const key = curr.toISOString().split('T')[0];
      if (dateSet.has(key)) {
        count++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }

  // 4. Update consistency and counts
  user.currentStreak = currentStreak;
  user.longestStreak = longestStreak;
  user.activeDaysCount = activeDatesSet.size;
  user.consistencyPercentage = Math.round((recent30DaysSet.size / 30) * 100);
  user.monthlyActivityCount = currentMonthSet.size;
  user.yearlyActivityCount = currentYearSet.size;

  // 5. Activity Score calculation
  // Formula: currentStreak * 10 + (consistencyPercentage * 2) + monthlyActivityCount * 5 + platformDiversity * 20
  const platformDiversity = activePlatforms.size; // 0 to 4
  const calculatedActivityScore = (currentStreak * 10) + (user.consistencyPercentage * 2) + (user.monthlyActivityCount * 5) + (platformDiversity * 20);

  user.scores.activityScore = calculatedActivityScore;
  user.scores.consistencyScore = user.consistencyPercentage;

  await user.save();
  return user;
}

module.exports = {
  upsertActivity,
  recomputeActivityMetrics
};
