const mongoose = require('mongoose');

const InterviewMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    role: { type: String, enum: ['system', 'ai', 'user'], required: true },
    content: { type: String, required: true },
    audioUrl: { type: String }, // For future voice support
    timestamp: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.models.InterviewMessage || mongoose.model('InterviewMessage', InterviewMessageSchema);
