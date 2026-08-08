const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCounts: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
