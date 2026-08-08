const Post = require('../models/Post');
const User = require('../models/User');

/**
 * Fetch unified community feed stream
 */
async function getAggregatedFeed({ userId, page = 1, limit = 10, category = 'all' }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (category !== 'all' && category !== 'main') {
    if (category === 'announcements') {
      query.postType = 'announcement';
    } else if (category === 'placements') {
      query.$or = [
        { postType: { $in: ['placement', 'placement_recap'] } },
        { category: 'placement' }
      ];
    } else if (category === 'showcase') {
      query.$or = [
        { postType: 'showcase' },
        { category: 'showcase' }
      ];
    } else if (category === 'achievements') {
      query.postType = 'achievement';
    } else if (category === 'questions') {
      query.postType = 'question';
    }
  }

  // Query database posts
  const dbPosts = await Post.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name role email bio')
    .populate('placementMetadata.taggedStudents', 'name email branch currentYear role')
    .lean();

  const totalItems = await Post.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Format posts into client feed items
  const formattedPosts = dbPosts.map(post => {
    const isLikedByMe = userId && Array.isArray(post.likes)
      ? post.likes.some(id => id.toString() === userId.toString())
      : false;

    // Reactions breakdown calculation
    const reactionCounts = { like: 0, celebrate: 0, support: 0, love: 0, insightful: 0 };
    let userReaction = null;

    if (Array.isArray(post.reactions)) {
      post.reactions.forEach(r => {
        if (r.type && reactionCounts[r.type] !== undefined) {
          reactionCounts[r.type]++;
        }
        if (userId && r.user && r.user.toString() === userId.toString()) {
          userReaction = r.type;
        }
      });
    }

    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    return {
      id: post._id.toString(),
      dbId: post._id,
      postType: post.postType || 'general',
      author: {
        id: post.author?._id || null,
        name: post.author?.name || 'Community Member',
        role: post.author?.role || 'student',
        bio: post.author?.bio || '',
        avatar: null
      },
      title: post.title || '',
      content: post.content,
      category: post.category || 'general',
      mediaUrls: post.mediaUrls || [],
      metadata: post.metadata || {},
      placementMetadata: post.placementMetadata || {},
      isPinned: post.isPinned || false,
      likesCount: post.likes ? post.likes.length : 0,
      isLikedByMe,
      reactions: post.reactions || [],
      reactionCounts,
      totalReactions,
      userReaction,
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt
    };
  });

  // If first page and database has few posts, generate auto-achievement highlights from coding profiles
  if (page === 1 && formattedPosts.length < 5 && (category === 'all' || category === 'achievements')) {
    const topStudents = await User.find({
      role: 'student',
      isActive: true,
      $or: [
        { 'scores.totalScore': { $gt: 50 } },
        { currentStreak: { $gt: 3 } },
        { 'platformStats.leetcode.totalSolved': { $gt: 10 } }
      ]
    })
      .select('name role platformStats scores currentStreak updatedAt')
      .limit(10)
      .lean();

    topStudents.forEach(student => {
      const lcSolved = student.platformStats?.leetcode?.totalSolved || 0;
      const ccSolved = student.platformStats?.codechef?.problemsSolved || 0;
      const gfgSolved = student.platformStats?.geeksforgeeks?.totalProblemsSolved || 0;
      const totalSolved = lcSolved + ccSolved + gfgSolved;
      const streak = student.currentStreak || 0;

      if (lcSolved >= 10 || streak >= 3) {
        // Prevent duplicate if already formatted
        const exists = formattedPosts.some(p => p.author?.id?.toString() === student._id.toString());
        if (!exists) {
          formattedPosts.push({
            id: `auto_ach_${student._id}`,
            dbId: student._id,
            postType: 'achievement',
            author: {
              id: student._id,
              name: student.name,
              role: 'student',
              avatar: null
            },
            title: `Milestone Unlocked: ${lcSolved} LeetCode Problems Solved!`,
            content: `${student.name} reached ${totalSolved} total problems solved across coding platforms with a ${streak}-day active streak!`,
            metadata: {
              lcSolved,
              ccSolved,
              gfgSolved,
              totalSolved,
              streak,
              totalScore: Math.round(student.scores?.totalScore || 0)
            },
            mediaUrls: [],
            isPinned: false,
            likesCount: 15,
            isLikedByMe: false,
            createdAt: student.updatedAt || new Date()
          });
        }
      }
    });
  }

  return {
    feed: formattedPosts,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: Math.max(totalItems, formattedPosts.length),
      hasMore: page < totalPages
    }
  };
}

/**
 * Global Search across Students & Posts
 */
async function globalSearch(query, filter = 'all') {
  if (!query || query.trim().length === 0) {
    return { students: [], posts: [] };
  }

  const regex = new RegExp(query.trim(), 'i');
  const results = { students: [], posts: [] };

  if (filter === 'all' || filter === 'students') {
    results.students = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { branch: regex },
        { college: regex }
      ]
    })
      .select('name email role branch college currentYear scores leetcodeUsername githubUsername')
      .limit(10)
      .lean();
  }

  if (filter === 'all' || filter === 'posts') {
    results.posts = await Post.find({
      $or: [
        { title: regex },
        { content: regex },
        { category: regex }
      ]
    })
      .populate('author', 'name role')
      .limit(10)
      .lean();
  }

  return results;
}

module.exports = {
  getAggregatedFeed,
  globalSearch
};
