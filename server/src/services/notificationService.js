const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send notification to a specific user
 */
async function createNotification({ recipientId, senderId = null, type, title, message, targetUrl = '' }) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      targetUrl
    });
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

/**
 * Broadcast notification to all active users (e.g. for new announcements)
 */
async function notifyAllUsers({ senderId = null, type, title, message, targetUrl = '' }) {
  try {
    const users = await User.find({ isActive: true }, '_id');
    if (!users || users.length === 0) return 0;

    const notifications = users.map(u => ({
      recipient: u._id,
      sender: senderId,
      type,
      title,
      message,
      targetUrl
    }));

    const result = await Notification.insertMany(notifications);
    return result.length;
  } catch (err) {
    console.error('Failed to notify all users:', err.message);
    return 0;
  }
}

/**
 * Get notifications for a user + unread count
 */
async function getUserNotifications(userId, limit = 20) {
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name role')
    .lean();

  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

  return { notifications, unreadCount };
}

/**
 * Mark notifications as read
 */
async function markAsRead(userId, notificationIds = [], markAll = false) {
  if (markAll) {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    return { success: true, message: 'All notifications marked as read' };
  }

  if (notificationIds.length > 0) {
    await Notification.updateMany(
      { recipient: userId, _id: { $in: notificationIds } },
      { isRead: true }
    );
  }

  return { success: true };
}

module.exports = {
  createNotification,
  notifyAllUsers,
  getUserNotifications,
  markAsRead
};
