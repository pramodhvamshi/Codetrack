const mongoose = require('mongoose');

const InterviewFeedbackSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true },
    categories: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g., { STAR: 8, Communication: 7 }
    overallScore: { type: Number, default: 0 },
    tips: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.InterviewFeedback || mongoose.model('InterviewFeedback', InterviewFeedbackSchema);
