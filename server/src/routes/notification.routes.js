const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getUserNotifications, markAsRead } = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/v2/notifications
 * Get notifications for logged in user + unread count
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 20;

    const data = await getUserNotifications(userId, limit);

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * PATCH /api/v2/notifications/mark-read
 * Mark notifications as read
 */
router.patch('/mark-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds, markAll } = req.body;

    const result = await markAsRead(userId, notificationIds || [], markAll || false);

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

module.exports = router;
