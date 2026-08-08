const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { sendMessage, markConversationRead } = require('./messageService');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    }
  });

  // JWT Middleware for Socket Connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket Connected: User ${socket.userId} (socketId: ${socket.id})`);

    // Join personal user room for direct messaging notifications
    socket.join(`user_${socket.userId}`);

    // Join specific conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
    });

    // Join & Leave Group Chat Rooms
    socket.on('join_group', ({ groupId }) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('leave_group', ({ groupId }) => {
      socket.leave(`group_${groupId}`);
    });

    // Real-time Send Message event
    socket.on('send_message', async (data, callback) => {
      try {
        const { recipientId, text, mediaUrls } = data;
        const message = await sendMessage({
          senderId: socket.userId,
          recipientId,
          text,
          mediaUrls
        });

        // Broadcast to recipient room
        io.to(`user_${recipientId}`).emit('new_message', message);
        // Also broadcast to conversation room
        io.to(message.conversationId).emit('conversation_updated', message);

        if (typeof callback === 'function') {
          callback({ success: true, message });
        }
      } catch (err) {
        console.error('Socket send_message error:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Typing Indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', { userId: socket.userId, isTyping: true });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', { userId: socket.userId, isTyping: false });
    });

    // Read status update
    socket.on('mark_read', async ({ conversationId }) => {
      await markConversationRead(conversationId, socket.userId);
      io.to(conversationId).emit('messages_read', { conversationId, userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket Disconnected: User ${socket.userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
}

module.exports = {
  initSocket,
  getIO
};
