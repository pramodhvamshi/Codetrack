const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

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
        matchStage["studentInfo.year"] = yearStr;
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
            year: "$studentInfo.year",
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
      firstYear: await getMonthlyTopForYear("1"),
      secondYear: await getMonthlyTopForYear("2"),
      thirdYear: await getMonthlyTopForYear("3"),
      fourthYear: await getMonthlyTopForYear("4")
    });
  } catch (err) {
    console.error('Failed to load monthly leaderboard:', err);
    return res.status(500).json({ message: 'Failed to load monthly leaderboard' });
  }
});

// Fetch unique dropdown filter values
router.get('/filters', authMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isOnboarded: true }).select('college hostel branch year');
    const colleges = [...new Set(students.map(s => s.college).filter(Boolean))].sort();
    const hostels = [...new Set(students.map(s => s.hostel).filter(Boolean))].sort();
    const branches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort();
    const years = [...new Set(students.map(s => s.year).filter(Boolean))].sort();

    return res.json({ colleges, hostels, branches, years });
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
      sortBy = 'scores.weightedRankScore',
      sortOrder = 'desc',
      name
    } = req.query;

    // Only include fully onboarded students on the leaderboard
    const filter = { role: 'student', isOnboarded: true };

    // Handle Leaderboard Types (contexts)
    if (type === 'college' && req.currentUser?.college) {
      filter.college = req.currentUser.college;
    } else if (type === 'branch' && req.currentUser?.branch) {
      filter.branch = req.currentUser.branch;
    } else if (type === 'hostel' && req.currentUser?.hostel) {
      filter.hostel = req.currentUser.hostel;
    } else if (type === 'year' && req.currentUser?.year) {
      filter.year = req.currentUser.year;
    } else {
      // Apply manual dropdown filters if not restricted by type
      if (college) filter.college = String(college);
      if (hostel) filter.hostel = String(hostel);
      if (branch) filter.branch = String(branch);
      if (year) filter.year = String(year);
    }

    if (name) {
      const escapedName = String(name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.name = new RegExp(escapedName, 'i');
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const students = await User.find(filter).sort(sort);

    // Compute rank based on sorted order
    const rows = students.map((s, index) => ({
      rank: index + 1,
      id: s._id,
      isCurrentUser: req.user && String(req.user.id) === String(s._id),
      activityStatus: s.activityStatus,
      name: s.name,
      college: s.college,
      hostel: s.hostel,
      branch: s.branch,
      year: s.year,
      lcScore: s.scores?.lcScore || 0,
      ccScore: s.scores?.ccScore || 0,
      gfgScore: s.scores?.gfgScore || 0,
      hrScore: s.scores?.hrScore || 0,
      activityScore: s.scores?.activityScore || 0,
      consistencyScore: s.scores?.consistencyScore || 0,
      totalScore: s.scores?.totalScore || 0,
      weightedRankScore: s.scores?.weightedRankScore || 0
    }));

    return res.json(rows);
  } catch (err) {
    console.error('Leaderboard error', err);
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;
