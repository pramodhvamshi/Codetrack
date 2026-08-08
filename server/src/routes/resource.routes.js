const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const AlumniResource = require('../models/AlumniResource');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v2/resources - Fetch learning resources
router.get('/', async (req, res) => {
  try {
    const { category, query } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const resources = await AlumniResource.find(filter)
      .populate('author', 'name role currentCompany currentCompanyRole college branch batch')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: resources });
  } catch (err) {
    console.error('Error fetching resources:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
});

// POST /api/v2/resources - Share new resource
router.post('/', async (req, res) => {
  try {
    const { title, description, link, category } = req.body;
    if (!title || !link || !category) {
      return res.status(400).json({ success: false, message: 'Title, link, and category are required' });
    }

    const resource = await AlumniResource.create({
      title,
      description: description || '',
      link,
      category,
      author: req.user.id
    });

    const populated = await AlumniResource.findById(resource._id).populate('author', 'name role currentCompany currentCompanyRole college branch batch');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error sharing resource:', err);
    return res.status(500).json({ success: false, message: 'Failed to share resource' });
  }
});

// POST /api/v2/resources/:id/like - Toggle like on resource
router.post('/:id/like', async (req, res) => {
  try {
    const resource = await AlumniResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const userIdStr = String(req.user.id);
    const hasLiked = resource.likes.some(l => String(l) === userIdStr);

    if (hasLiked) {
      resource.likes = resource.likes.filter(l => String(l) !== userIdStr);
    } else {
      resource.likes.push(req.user.id);
    }

    await resource.save();
    return res.json({ success: true, data: { liked: !hasLiked, likeCount: resource.likes.length } });
  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ success: false, message: 'Failed to update like' });
  }
});

module.exports = router;
