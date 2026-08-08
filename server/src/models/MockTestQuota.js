const mongoose = require('mongoose');

const mockTestQuotaSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateWindow: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    dailyAttemptsCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MockTestQuota', mockTestQuotaSchema);
