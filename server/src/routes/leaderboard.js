const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Shared leaderboard (students + coordinators can both access via auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      college,
      hostel,
      branch,
      year,
      sortBy = 'scores.totalScore',
      sortOrder = 'desc',
      name
    } = req.query;

    // Only include fully onboarded students on the leaderboard
    const filter = { role: 'student', isOnboarded: true };
    if (college) filter.college = college;
    if (hostel) filter.hostel = hostel;
    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (name) filter.name = new RegExp(name, 'i');

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
      hrScore: s.scores?.hrScore || 0,
      totalScore: s.scores?.totalScore || 0
    }));

    return res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Leaderboard error', err);
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;

