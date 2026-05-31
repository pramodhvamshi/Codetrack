const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware, requireRole('coordinator'));

// Dashboard summary: total students, active vs inactive, platform-wise stats (individual, not summed)
router.get('/dashboard', async (req, res) => {
  try {
    const studentsMatch = { role: 'student', isOnboarded: true };

    const [totalStudents, activeCount, inactiveCount, allStudents] = await Promise.all([
      User.countDocuments(studentsMatch),
      User.countDocuments({ ...studentsMatch, activityStatus: 'active' }),
      User.countDocuments({ ...studentsMatch, activityStatus: 'inactive' }),
      User.find(studentsMatch).select('platformStats hackerrank')
    ]);

    // Calculate platform-wise stats individually (not summed)
    let lcTotalProblems = 0;
    let lcTotalRating = 0;
    let ccTotalProblems = 0;
    let ccTotalRating = 0;
    let hrTotalBadges = 0;
    let lcCount = 0;
    let ccCount = 0;
    let hrCount = 0;

    allStudents.forEach((s) => {
      const ps = s.platformStats || {};
      const lc = ps.leetcode || {};
      const cc = ps.codechef || {};
      const hr = s.hackerrank || {};

      if (lc.problemsSolved > 0 || lc.rating > 0) {
        lcTotalProblems += lc.problemsSolved || 0;
        lcTotalRating += lc.rating || 0;
        lcCount++;
      }

      if (cc.problemsSolved > 0 || cc.rating > 0) {
        ccTotalProblems += cc.problemsSolved || 0;
        ccTotalRating += cc.rating || 0;
        ccCount++;
      }

      if (hr.badgeCount > 0) {
        hrTotalBadges += hr.badgeCount || 0;
        hrCount++;
      }
    });

    const platformStats = {
      leetcode: {
        totalProblems: lcTotalProblems,
        avgRating: lcCount > 0 ? Math.round(lcTotalRating / lcCount) : 0
      },
      codechef: {
        totalProblems: ccTotalProblems,
        avgRating: ccCount > 0 ? Math.round(ccTotalRating / ccCount) : 0
      },
      hackerrank: {
        totalBadges: hrTotalBadges
      }
    };

    return res.json({
      totalStudents,
      activeCount,
      inactiveCount,
      platformStats
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Coordinator dashboard error', err);
    return res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// Students list with filters & search
router.get('/students', async (req, res) => {
  try {
    const {
      college,
      hostel,
      branch,
      year,
      name,
      activityStatus,
      scoreMin,
      scoreMax,
      sortBy = 'scores.totalScore',
      sortOrder = 'desc'
    } = req.query;

    const filter = { role: 'student', isOnboarded: true };
    if (college) filter.college = college;
    if (hostel) filter.hostel = hostel;
    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (activityStatus) filter.activityStatus = activityStatus;
    if (name) filter.name = new RegExp(name, 'i');

    let students = await User.find(filter);

    // Score range filter (client-side since MongoDB doesn't support nested field range easily)
    if (scoreMin !== undefined && scoreMin !== '') {
      students = students.filter((s) => (s.scores?.totalScore || 0) >= Number(scoreMin));
    }
    if (scoreMax !== undefined && scoreMax !== '') {
      students = students.filter((s) => (s.scores?.totalScore || 0) <= Number(scoreMax));
    }

    // Sorting
    const [field, order] = sortBy.includes('.') ? sortBy.split('.') : [sortBy, ''];
    students.sort((a, b) => {
      let va, vb;
      if (field === 'scores' && order === 'totalScore') {
        va = a.scores?.totalScore || 0;
        vb = b.scores?.totalScore || 0;
      } else if (field === 'name') {
        va = (a.name || '').toLowerCase();
        vb = (b.name || '').toLowerCase();
        return sortOrder === 'asc' ? (va < vb ? -1 : 1) : (vb < va ? -1 : 1);
      } else if (field === 'year') {
        va = Number(a.year || 0);
        vb = Number(b.year || 0);
      } else {
        va = a[field] || 0;
        vb = b[field] || 0;
      }
      return sortOrder === 'asc' ? va - vb : vb - va;
    });

    // Get unique values for filters
    const allStudents = await User.find({ role: 'student', isOnboarded: true });
    const colleges = [...new Set(allStudents.map((s) => s.college).filter(Boolean))];
    const branches = [...new Set(allStudents.map((s) => s.branch).filter(Boolean))];
    const years = [...new Set(allStudents.map((s) => s.year).filter(Boolean))].sort();

    return res.json({
      students: students.map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        college: s.college,
        hostel: s.hostel,
        branch: s.branch,
        year: s.year,
        score: s.scores?.totalScore || 0,
        scores: s.scores,
        activityStatus: s.activityStatus,
        platforms: {
          leetcode: !!s.leetcodeUsername,
          codechef: !!s.codechefUsername,
          hackerrank: !!(s.hackerrank && s.hackerrank.username)
        }
      })),
      filters: { colleges, branches, years }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Coordinator students list error', err);
    return res.status(500).json({ message: 'Failed to load students' });
  }
});

// View a full student profile (read-only)
router.get('/students/:id', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.json(student);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Coordinator student profile error', err);
    return res.status(500).json({ message: 'Failed to load student profile' });
  }
});

module.exports = router;

