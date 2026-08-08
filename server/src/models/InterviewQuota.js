const mongoose = require('mongoose');

const interviewQuotaSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    interviewsCount: {
      type: Number,
      default: 0,
    },
    maxInterviews: {
      type: Number,
      default: 2,
    },
    lastInterviewAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewQuota', interviewQuotaSchema);
