const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const roadmapService = require('../services/roadmap.service');

// GET /api/roadmaps (List all roadmaps)
router.get('/', auth, async (req, res) => {
  try {
    const roadmaps = await roadmapService.getAllRoadmaps();
    res.json(roadmaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/roadmaps/:id/nodes (Get exact tree)
router.get('/:id/nodes', auth, async (req, res) => {
  try {
    const data = await roadmapService.getRoadmapDetails(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/roadmaps/progress/:roadmapId
router.get('/progress/:roadmapId', auth, async (req, res) => {
  try {
    const progress = await roadmapService.getStudentProgress(req.user.id, req.params.roadmapId);
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/roadmaps/progress/node/:nodeId
router.put('/progress/node/:nodeId', auth, async (req, res) => {
  try {
    const { roadmapId, status } = req.body;
    const result = await roadmapService.updateProgress(req.user.id, roadmapId, req.params.nodeId, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
