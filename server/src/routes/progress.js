const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const progressService = require('../services/progress.service');

// GET /api/student/progress
router.get('/', auth, async (req, res) => {
  try {
    const studentId = req.user.id; // Extracted from auth middleware
    const progress = await progressService.getUnifiedProgress(studentId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching unified progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
