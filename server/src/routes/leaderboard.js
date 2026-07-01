const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const WeeklyStats = require('../models/WeeklyStats');

const router = express.Router();

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function mapLegacyYearToEnum(year) {
  if (year === '1') return '1st Year';
  if (year === '2') return '2nd Year';
  if (year === '3') return '3rd Year';
  if (year === '4') return '4th Year';
  return year;
}

// Fetch Weekly Leaderboard
router.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const getWeeklyTopForYear = async (yearStr) => {
      const weekStart = getStartOfWeek();
      const matchStage = {
        "studentInfo.role": "student",
        "studentInfo.isOnboarded": true
      };
      if (yearStr) {
        matchStage["studentInfo.currentYear"] = yearStr;
      }

      const weeklyAggregation = await WeeklyStats.aggregate([
        {
          $match: {
            weekStart: weekStart
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "studentInfo"
          }
        },
        {
          $unwind: "$studentInfo"
        },
        {
          $match: matchStage
        },
        {
          $sort: {
            weeklyScore: -1,
            lcSolvedEnd: -1,
            gfgSolvedEnd: -1,
            "studentInfo.name": 1
          }
        },
        {
          $limit: 10
        },
        {
          $project: {
            _id: 0,
            userId: "$userId",
            name: "$studentInfo.name",
            branch: "$studentInfo.branch",
            year: "$studentInfo.currentYear",
            leetcodeSolved: { $subtract: ["$lcSolvedEnd", "$lcSolvedStart"] },
            gfgSolved: { $subtract: ["$gfgSolvedEnd", "$gfgSolvedStart"] },
            weeklyScore: 1
          }
        }
      ]);

      const activeAggregation = weeklyAggregation.filter(item => (item.weeklyScore || 0) > 0);

      return activeAggregation.map((item, idx) => ({
        rank: idx + 1,
        userId: item.userId,
        name: item.name,
        branch: item.branch || '-',
        year: item.year || '-',
        leetcodeSolved: item.leetcodeSolved || 0,
        gfgSolved: item.gfgSolved || 0,
        weeklyScore: item.weeklyScore || 0
      }));
    };

    return res.json({
      allYears: await getWeeklyTopForYear(null),
      firstYear: await getWeeklyTopForYear("1st Year"),
      secondYear: await getWeeklyTopForYear("2nd Year"),
      thirdYear: await getWeeklyTopForYear("3rd Year"),
      fourthYear: await getWeeklyTopForYear("4th Year")
    });
  } catch (err) {
    console.error('Failed to load weekly leaderboard:', err);
    return res.status(500).json({ message: 'Failed to load weekly leaderboard' });
  }
});

// Fetch Monthly Leaderboard
router.get('/monthly', authMiddleware, async (req, res) => {
  try {
    const Activity = require('../models/Activity');
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const getMonthlyTopForYear = async (yearStr) => {
      const matchStage = {
        "studentInfo.role": "student",
        "studentInfo.isOnboarded": true
      };
      if (yearStr) {
        matchStage["studentInfo.currentYear"] = yearStr;
      }

      const monthlyAggregation = await Activity.aggregate([
        {
          $match: {
            timestamp: { $gte: startOfMonth, $lt: endOfMonth },
            platform: { $in: ['leetcode', 'geeksforgeeks'] },
            type: 'solved'
          }
        },
        {
          $group: {
            _id: "$userId",
            leetcodeSolved: {
              $sum: {
                $cond: [
                  { $eq: ["$platform", "leetcode"] },
                  { $ifNull: ["$meta.increment", 1] },
                  0
                ]
              }
            },
            gfgSolved: {
              $sum: {
                $cond: [
                  { $eq: ["$platform", "geeksforgeeks"] },
                  { $ifNull: ["$meta.increment", 1] },
                  0
                ]
              }
            }
          }
        },
        {
          $addFields: {
            monthlyScore: { $add: ["$leetcodeSolved", "$gfgSolved"] }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "studentInfo"
          }
        },
        {
          $unwind: "$studentInfo"
        },
        {
          $match: matchStage
        },
        {
          $sort: {
            monthlyScore: -1,
            leetcodeSolved: -1,
            gfgSolved: -1,
            "studentInfo.name": 1
          }
        },
        {
          $limit: 10
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$studentInfo.name",
            branch: "$studentInfo.branch",
            year: "$studentInfo.currentYear",
            leetcodeSolved: 1,
            gfgSolved: 1,
            monthlyScore: 1
          }
        }
      ]);

      const activeAggregation = monthlyAggregation.filter(item => (item.leetcodeSolved || 0) > 0 || (item.gfgSolved || 0) > 0);

      return activeAggregation.map((item, idx) => ({
        rank: idx + 1,
        userId: item.userId,
        name: item.name,
        branch: item.branch || '-',
        year: item.year || '-',
        leetcodeSolved: item.leetcodeSolved || 0,
        gfgSolved: item.gfgSolved || 0,
        monthlyScore: item.monthlyScore || 0
      }));
    };

    return res.json({
      allYears: await getMonthlyTopForYear(null),
      firstYear: await getMonthlyTopForYear("1st Year"),
      secondYear: await getMonthlyTopForYear("2nd Year"),
      thirdYear: await getMonthlyTopForYear("3rd Year"),
      fourthYear: await getMonthlyTopForYear("4th Year")
    });
  } catch (err) {
    console.error('Failed to load monthly leaderboard:', err);
    return res.status(500).json({ message: 'Failed to load monthly leaderboard' });
  }
});

// Fetch unique dropdown filter values and global configs
router.get('/filters', authMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isOnboarded: true }).select('college hostel branch currentYear year');
    const colleges = [...new Set(students.map(s => s.college).filter(Boolean))].sort();
    const hostels = [...new Set(students.map(s => s.hostel).filter(Boolean))].sort();
    const branches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort();
    const years = [...new Set(students.map(s => s.currentYear || mapLegacyYearToEnum(s.year)).filter(Boolean))].sort();
    
    const config = require('../config/env');

    return res.json({ 
      colleges, 
      hostels, 
      branches, 
      years,
      COMPETITIVE_INDEX_MAX: config.COMPETITIVE_INDEX_MAX 
    });
  } catch (err) {
    console.error('Failed to fetch leaderboard filters:', err);
    return res.status(500).json({ message: 'Failed to fetch filters' });
  }
});

// Shared leaderboard (students + coordinators can both access via auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      college,
      hostel,
      branch,
      year,
      type, // 'global', 'college', 'branch', 'hostel', 'year'
      sortBy = 'scores.competitiveIndex',
      sortOrder = 'desc',
      name,
      page = 1,
      limit = 50
    } = req.query;

    const filter = { role: 'student', isOnboarded: true };

    // Handle Leaderboard Types (contexts)
    if (type === 'college' && req.currentUser?.college) {
      filter.college = req.currentUser.college;
    } else if (type === 'branch' && req.currentUser?.branch) {
      filter.branch = req.currentUser.branch;
    } else if (type === 'hostel' && req.currentUser?.hostel) {
      filter.hostel = req.currentUser.hostel;
    } else if (type === 'year' && (req.currentUser?.currentYear || req.currentUser?.year)) {
      filter.currentYear = req.currentUser.currentYear || mapLegacyYearToEnum(req.currentUser.year);
    } else {
      // Apply manual dropdown filters
      if (college) filter.college = String(college);
      if (hostel) filter.hostel = String(hostel);
      if (branch) filter.branch = String(branch);
      if (year) {
        if (['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(year)) {
          filter.currentYear = String(year);
        } else {
          filter.currentYear = mapLegacyYearToEnum(year);
        }
      }
    }

    if (name) {
      const escapedQuery = String(name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escapedQuery, 'i');
      filter.$or = [
        { name: searchRegex },
        { mssid: searchRegex },
        { leetcodeUsername: searchRegex },
        { codechefUsername: searchRegex },
        { gfgUsername: searchRegex },
        { hackerrankUsername: searchRegex }
      ];
    }

    const sort = {};
    const validSortKeys = [
      'scores.competitiveIndex', 'name', 'scores.lcScore', 'scores.ccScore', 'scores.gfgScore', 'scores.hrScore',
      'platformStats.leetcode.problemsSolved', 'platformStats.leetcode.rating', 'platformStats.leetcode.contestCount',
      'platformStats.codechef.problemsSolved', 'platformStats.codechef.currentRating', 'platformStats.codechef.contestCount',
      'platformStats.geeksforgeeks.problemsSolved', 'platformStats.geeksforgeeks.codingScore', 'platformStats.geeksforgeeks.streak',
      'hackerrank.badgeCount', 'hackerrank.totalProblemsSolved'
    ];
    const finalSortBy = validSortKeys.includes(sortBy) ? sortBy : 'scores.competitiveIndex';
    sort[finalSortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageInt = Math.max(1, parseInt(page, 10));
    const limitInt = Math.max(1, Math.min(1000, parseInt(limit, 10)));
    const skip = (pageInt - 1) * limitInt;

    const [students, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limitInt),
      User.countDocuments(filter)
    ]);

    const rows = students.map((s, index) => ({
      rank: skip + index + 1,
      id: s._id,
      isCurrentUser: req.user && String(req.user.id) === String(s._id),
      activityStatus: s.activityStatus,
      name: s.name,
      college: s.college,
      hostel: s.hostel,
      branch: s.branch,
      year: s.currentYear || mapLegacyYearToEnum(s.year),
      
      // Legacy backwards-compatibility
      lcScore: s.scores?.lcScore || 0,
      ccScore: s.scores?.ccScore || 0,
      gfgScore: s.scores?.gfgScore || 0,
      hrScore: s.scores?.hrScore || 0,
      
      // V5 Analytics Engine metrics
      competitiveIndex: s.scores?.competitiveIndex || 0,
      competitiveBreakdown: s.scores?.competitiveBreakdown || {},
      platformStats: s.platformStats || {},
      hackerrank: s.hackerrank || {},
      github: s.github || {}
    }));

    return res.json({
      data: rows,
      total,
      page: pageInt,
      limit: limitInt,
      totalPages: Math.ceil(total / limitInt)
    });
  } catch (err) {
    console.error('Leaderboard error', err);
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;
