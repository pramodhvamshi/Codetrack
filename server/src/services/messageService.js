const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

/**
 * Generate unique composite key for 1:1 chat room
 */
function getConversationId(userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `chat_${ids[0]}_${ids[1]}`;
}

/**
 * Send a message (1:1 chat)
 */
async function sendMessage({ senderId, recipientId, text, mediaUrls = [] }) {
  if (!text || !text.trim()) {
    throw new Error('Message text is required');
  }

  const conversationId = getConversationId(senderId, recipientId);

  // 1. Create message record
  const message = await Message.create({
    conversationId,
    sender: senderId,
    recipient: recipientId,
    text: text.trim(),
    mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : []
  });

  await message.populate('sender', 'name role email');

  // 2. Upsert Conversation record
  let conv = await Conversation.findOne({ conversationId });
  if (!conv) {
    conv = new Conversation({
      conversationId,
      participants: [senderId, recipientId],
      lastMessage: text.trim(),
      lastMessageAt: new Date(),
      unreadCounts: new Map()
    });
  } else {
    conv.lastMessage = text.trim();
    conv.lastMessageAt = new Date();
  }

  // Increment unread count for recipient
  const recipientStr = recipientId.toString();
  const currentUnread = conv.unreadCounts.get(recipientStr) || 0;
  conv.unreadCounts.set(recipientStr, currentUnread + 1);

  await conv.save();

  // 3. Send notification to recipient
  createNotification({
    recipientId,
    senderId,
    type: 'message',
    title: '💬 New Direct Message',
    message: `${message.sender?.name || 'Someone'}: ${text.slice(0, 80)}`,
    targetUrl: `/messages?userId=${senderId}`
  });

  return message;
}

/**
 * Get recent conversations list for user
 */
async function getUserConversations(userId) {
  const convs = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name email role branch batch currentCompany currentCompanyRole')
    .lean();

  return convs.map(c => {
    const otherUser = c.participants.find(p => p._id.toString() !== userId.toString()) || null;
    const unreadCount = (c.unreadCounts && c.unreadCounts[userId.toString()]) || 0;

    return {
      id: c._id,
      conversationId: c.conversationId,
      otherUser,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount
    };
  });
}

/**
 * Get message history between two users
 */
async function getMessageHistory(userId1, userId2, page = 1, limit = 30) {
  const conversationId = getConversationId(userId1, userId2);

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 30;
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name role')
    .lean();

  // Reverse so oldest appears at top in chat UI
  messages.reverse();

  const total = await Message.countDocuments({ conversationId });

  return {
    conversationId,
    messages,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      totalMessages: total
    }
  };
}

/**
 * Mark conversation messages as read
 */
async function markConversationRead(conversationId, userId) {
  await Message.updateMany(
    { conversationId, recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  const conv = await Conversation.findOne({ conversationId });
  if (conv && conv.unreadCounts) {
    conv.unreadCounts.set(userId.toString(), 0);
    await conv.save();
  }

  return { success: true };
}

module.exports = {
  getConversationId,
  sendMessage,
  getUserConversations,
  getMessageHistory,
  markConversationRead
};
