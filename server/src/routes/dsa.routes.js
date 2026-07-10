const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const dsaService = require('../services/dsa.service');

// GET /api/dsa (List all sheets)
router.get('/', auth, async (req, res) => {
  try {
    const sheets = await dsaService.getAllSheets();
    res.json(sheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dsa/:id/categories (Get sheet categories and problems)
router.get('/:id/categories', auth, async (req, res) => {
  try {
    const categories = await dsaService.getSheetDetails(req.params.id);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dsa/progress/:sheetId
router.get('/progress/:sheetId', auth, async (req, res) => {
  try {
    const progress = await dsaService.getStudentProgress(req.user.id, req.params.sheetId);
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dsa/progress/problem/:problemId
router.put('/progress/problem/:problemId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await dsaService.updateProgress(req.user.id, req.params.problemId, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
