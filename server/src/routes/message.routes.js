const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  sendMessage,
  getUserConversations,
  getMessageHistory,
  markConversationRead
} = require('../services/messageService');

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/v2/messages/conversations
 * Get recent conversations list for logged-in user
 */
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await getUserConversations(req.user.id);
    return res.json({
      success: true,
      data: conversations
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/v2/messages/history/:userId
 * Get message history with target user
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { page, limit } = req.query;
    const history = await getMessageHistory(req.user.id, targetUserId, page, limit);

    return res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('Error fetching message history:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch message history' });
  }
});

/**
 * POST /api/v2/messages/send
 * Send direct message
 */
router.post('/send', async (req, res) => {
  try {
    const { recipientId, text, mediaUrls } = req.body;
    if (!recipientId || !text) {
      return res.status(400).json({ success: false, message: 'Recipient ID and text are required' });
    }

    const message = await sendMessage({
      senderId: req.user.id,
      recipientId,
      text,
      mediaUrls
    });

    return res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(400).json({ success: false, message: err.message || 'Failed to send message' });
  }
});

/**
 * POST /api/v2/messages/read/:conversationId
 * Mark conversation messages as read
 */
router.post('/read/:conversationId', async (req, res) => {
  try {
    const result = await markConversationRead(req.params.conversationId, req.user.id);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error marking conversation read:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
});

module.exports = router;
