const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const InterviewExperience = require('../models/InterviewExperience');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v2/interview-experiences - Search and list interview experiences
router.get('/', async (req, res) => {
  try {
    const { company, role, difficulty, query } = req.query;
    const filter = {};
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (role) filter.role = { $regex: role, $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;
    if (query) {
      filter.$or = [
        { company: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } },
        { overview: { $regex: query, $options: 'i' } }
      ];
    }

    const list = await InterviewExperience.find(filter)
      .populate('author', 'name role currentCompany currentCompanyRole college branch batch')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error fetching interview experiences:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch interview experiences' });
  }
});

// POST /api/v2/interview-experiences - Publish new experience
router.post('/', async (req, res) => {
  try {
    const { company, role, difficulty, outcome, overview, rounds, tips } = req.body;
    if (!company || !role || !overview) {
      return res.status(400).json({ success: false, message: 'Company, role, and overview are required' });
    }

    const exp = await InterviewExperience.create({
      company,
      role,
      difficulty: difficulty || 'Medium',
      outcome: outcome || 'Selected',
      overview,
      rounds: Array.isArray(rounds) ? rounds : [],
      tips: tips || '',
      author: req.user.id
    });

    const populated = await InterviewExperience.findById(exp._id).populate('author', 'name role currentCompany currentCompanyRole college branch batch');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error publishing interview experience:', err);
    return res.status(500).json({ success: false, message: 'Failed to publish interview experience' });
  }
});

module.exports = router;
