const express = require('express');
const multer = require('multer');
const { authMiddleware, requireAnyRole } = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { getAggregatedFeed, globalSearch } = require('../services/feedService');
const { notifyAllUsers } = require('../services/notificationService');
const { uploadFeedMedia } = require('../services/storageService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * GET /api/v2/feed
 * Paginated Community Feed Stream
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, category } = req.query;
    const userId = req.user?.id;

    const result = await getAggregatedFeed({
      userId,
      page,
      limit,
      category
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error fetching feed:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch community feed' });
  }
});

/**
 * POST /api/v2/feed/upload
 * Upload media file (Image/Screenshot) to Cloudinary
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const uploaded = await uploadFeedMedia(req.file);

    return res.json({
      success: true,
      url: uploaded.url,
      publicId: uploaded.publicId
    });
  } catch (err) {
    console.error('Error uploading media to Cloudinary:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload media file' });
  }
});

/**
 * POST /api/v2/feed/posts
 * Create Community Post (Open to Students, Alumni, Coordinators, Admins)
 */
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { postType, title, content, category, mediaUrls, metadata, placementMetadata } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
    }

    const userRole = req.user.role;
    let finalType = postType || 'general';

    // Role restrictions for special post types
    if (finalType === 'announcement' && !['admin', 'coordinator'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only Coordinators and Admins can create announcements' });
    }

    const post = await Post.create({
      author: req.user.id,
      postType: finalType,
      title: title || '',
      content: content.trim(),
      category: category || (finalType === 'placement' ? 'placement' : 'general'),
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      metadata: metadata || {},
      placementMetadata: placementMetadata || {}
    });

    await post.populate('author', 'name role email bio');
    if (post.placementMetadata && post.placementMetadata.taggedStudents) {
      await post.populate('placementMetadata.taggedStudents', 'name email branch currentYear role');
    }

    // Notify all users if it's an official announcement
    if (finalType === 'announcement') {
      notifyAllUsers({
        senderId: req.user.id,
        type: 'announcement',
        title: '📢 New Official Announcement',
        message: `${req.currentUser?.name || 'Coordinator'}: "${title || content.slice(0, 40)}"`,
        targetUrl: `/feed?post=${post._id}`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

/**
 * POST /api/v2/feed/posts/:id/react
 * 5-Type LinkedIn Reaction Handler ('like', 'celebrate', 'support', 'love', 'insightful')
 */
router.post('/posts/:id/react', authMiddleware, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    const validReactions = ['like', 'celebrate', 'support', 'love', 'insightful'];
    const targetType = validReactions.includes(reactionType) ? reactionType : 'like';

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!Array.isArray(post.reactions)) {
      post.reactions = [];
    }

    const existingIdx = post.reactions.findIndex(r => r.user.toString() === userId.toString());
    let userReaction = null;

    if (existingIdx > -1) {
      if (post.reactions[existingIdx].type === targetType) {
        // Toggle off if same reaction clicked
        post.reactions.splice(existingIdx, 1);
        userReaction = null;
      } else {
        // Change reaction type
        post.reactions[existingIdx].type = targetType;
        userReaction = targetType;
      }
    } else {
      // Add new reaction
      post.reactions.push({ user: userId, type: targetType });
      userReaction = targetType;
    }

    // Also update legacy likes array for backward compatibility
    const legacyLikeIdx = post.likes.indexOf(userId);
    if (userReaction && legacyLikeIdx === -1) {
      post.likes.push(userId);
    } else if (!userReaction && legacyLikeIdx > -1) {
      post.likes.splice(legacyLikeIdx, 1);
    }

    await post.save();

    // Calculate reaction counts
    const reactionCounts = { like: 0, celebrate: 0, support: 0, love: 0, insightful: 0 };
    post.reactions.forEach(r => {
      if (r.type && reactionCounts[r.type] !== undefined) {
        reactionCounts[r.type]++;
      }
    });

    return res.json({
      success: true,
      userReaction,
      reactionCounts,
      totalReactions: post.reactions.length
    });
  } catch (err) {
    console.error('Error toggling reaction:', err);
    return res.status(500).json({ success: false, message: 'Failed to process reaction' });
  }
});

/**
 * GET /api/v2/feed/posts/:id/comments
 * Fetch nested comments for a post
 */
router.get('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'name role email bio')
      .lean();

    const formatted = comments.map(c => ({
      id: c._id.toString(),
      postId: c.post.toString(),
      parentCommentId: c.parentComment ? c.parentComment.toString() : null,
      content: c.content,
      author: {
        id: c.author?._id || null,
        name: c.author?.name || 'User',
        role: c.author?.role || 'student',
        bio: c.author?.bio || ''
      },
      likesCount: c.likes ? c.likes.length : 0,
      isLikedByMe: userId && Array.isArray(c.likes) ? c.likes.some(id => id.toString() === userId.toString()) : false,
      createdAt: c.createdAt
    }));

    return res.json({
      success: true,
      comments: formatted
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/v2/feed/posts/:id/comments
 * Add top-level comment or nested reply to a post
 */
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      author: userId,
      parentComment: parentCommentId || null,
      content: content.trim()
    });

    await comment.populate('author', 'name role email bio');

    // Increment post comment count
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    return res.status(201).json({
      success: true,
      comment: {
        id: comment._id.toString(),
        postId: comment.post.toString(),
        parentCommentId: comment.parentComment ? comment.parentComment.toString() : null,
        content: comment.content,
        author: {
          id: comment.author?._id || null,
          name: comment.author?.name || 'User',
          role: comment.author?.role || 'student',
          bio: comment.author?.bio || ''
        },
        likesCount: 0,
        isLikedByMe: false,
        createdAt: comment.createdAt
      }
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    return res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
});

/**
 * POST /api/v2/feed/comments/:id/like
 * Toggle like on a comment
 */
router.post('/comments/:id/like', authMiddleware, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const idx = comment.likes.indexOf(userId);
    let isLiked = false;
    if (idx > -1) {
      comment.likes.splice(idx, 1);
    } else {
      comment.likes.push(userId);
      isLiked = true;
    }

    await comment.save();

    return res.json({
      success: true,
      likesCount: comment.likes.length,
      isLiked
    });
  } catch (err) {
    console.error('Error toggling comment like:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle comment like' });
  }
});

/**
 * POST /api/v2/feed/announcements
 * Alias endpoint for official announcements
 */
router.post('/announcements', authMiddleware, requireAnyRole(['admin', 'coordinator']), async (req, res) => {
  try {
    const { title, content, category, bannerUrl, registrationLink, isPinned } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const mediaUrls = bannerUrl ? [bannerUrl] : [];

    const post = await Post.create({
      author: req.user.id,
      postType: 'announcement',
      title: title || 'Official Announcement',
      content: content.trim(),
      category: category || 'general',
      mediaUrls,
      metadata: { registrationLink: registrationLink || '' },
      isPinned: isPinned || false
    });

    await post.populate('author', 'name role email');

    notifyAllUsers({
      senderId: req.user.id,
      type: 'announcement',
      title: '📢 Official Announcement',
      message: `${req.currentUser?.name || 'Coordinator'}: "${title || 'New Announcement'}"`,
      targetUrl: `/feed?post=${post._id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: post
    });
  } catch (err) {
    console.error('Error publishing announcement:', err);
    return res.status(500).json({ success: false, message: 'Failed to publish announcement' });
  }
});

/**
 * POST /api/v2/feed/like
 * Toggle like on a post
 */
router.post('/like', authMiddleware, async (req, res) => {
  try {
    const { postId, announcementId } = req.body;
    const targetId = postId || announcementId;
    const userId = req.user.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    const post = await Post.findById(targetId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingIndex = post.likes.indexOf(userId);
    let isLiked = false;

    if (existingIndex > -1) {
      post.likes.splice(existingIndex, 1);
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    await post.save();

    return res.json({
      success: true,
      likesCount: post.likes.length,
      isLiked
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

/**
 * GET /api/v2/feed/search
 * Global Search endpoint
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, filter } = req.query;
    const results = await globalSearch(q, filter);

    return res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Error performing global search:', err);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

module.exports = router;
