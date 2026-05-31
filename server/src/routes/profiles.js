const express = require('express');
const User = require('../models/User');

const router = express.Router();

/**
 * PUBLIC PROFILES
 * No authentication required
 */

/* -----------------------------------------
   LIST STUDENTS (OPTIONAL – BASIC CARDS)
   GET /api/profiles?search=abc
----------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    const filter = { role: 'student' };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { college: regex }
      ];
    }

    const students = await User.find(filter).select(
      'name college hostel branch year scores activityStatus'
    );

    return res.json(
      students.map((s) => ({
        id: s._id,
        name: s.name,
        college: s.college,
        hostel: s.hostel,
        branch: s.branch,
        year: s.year,
        scores: s.scores,
        activityStatus: s.activityStatus
      }))
    );
  } catch (err) {
    console.error('Profiles list error:', err);
    return res.status(500).json({ message: 'Failed to load students' });
  }
});

/* -----------------------------------------
   SINGLE PUBLIC STUDENT PROFILE
   GET /api/profiles/:id
----------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: 'student'
    }).select(
      'name email college hostel branch year overallGpa ' +
      'leetcodeUsername codechefUsername githubUrl linkedinUrl ' +
      'hackerrank platformStats scores activityStatus ' +
      'certifications achievements hackathons projects'
    );

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json(student);
  } catch (err) {
    console.error('Public profile error:', err);
    return res.status(400).json({ message: 'Invalid profile id' });
  }
});

module.exports = router;
