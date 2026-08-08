const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const ForumPost = require('../models/ForumPost');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v2/forums - Fetch discussion threads
router.get('/', async (req, res) => {
  try {
    const { category, query } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ];
    }

    const posts = await ForumPost.find(filter)
      .populate('author', 'name role currentCompany currentCompanyRole college branch batch')
      .populate('replies.author', 'name role currentCompany currentCompanyRole college branch')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: posts });
  } catch (err) {
    console.error('Error fetching forum posts:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch forum posts' });
  }
});

// POST /api/v2/forums - Create new discussion post
router.post('/', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const post = await ForumPost.create({
      title,
      content,
      category: category || 'General',
      author: req.user.id
    });

    const populated = await ForumPost.findById(post._id).populate('author', 'name role currentCompany currentCompanyRole college branch batch');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating forum post:', err);
    return res.status(500).json({ success: false, message: 'Failed to create forum post' });
  }
});

// POST /api/v2/forums/:id/reply - Post reply to thread
router.post('/:id/reply', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Thread not found' });

    post.replies.push({ author: req.user.id, content });
    await post.save();

    const updated = await ForumPost.findById(post._id)
      .populate('author', 'name role currentCompany currentCompanyRole college branch batch')
      .populate('replies.author', 'name role currentCompany currentCompanyRole college branch');

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error adding reply:', err);
    return res.status(500).json({ success: false, message: 'Failed to post reply' });
  }
});

// POST /api/v2/forums/:id/upvote - Upvote/un-upvote thread
router.post('/:id/upvote', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Thread not found' });

    const userIdStr = String(req.user.id);
    const hasUpvoted = post.upvotes.some(u => String(u) === userIdStr);

    if (hasUpvoted) {
      post.upvotes = post.upvotes.filter(u => String(u) !== userIdStr);
    } else {
      post.upvotes.push(req.user.id);
    }

    await post.save();
    return res.json({ success: true, data: { upvoted: !hasUpvoted, upvoteCount: post.upvotes.length } });
  } catch (err) {
    console.error('Error upvoting post:', err);
    return res.status(500).json({ success: false, message: 'Failed to upvote' });
  }
});

module.exports = router;
