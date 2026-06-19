const mongoose = require('mongoose');

const LeetCodeGrowthSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekKey: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  mediumSolved: {
    type: Number,
    default: 0
  },
  snapshotDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

LeetCodeGrowthSnapshotSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

module.exports = mongoose.model('LeetCodeGrowthSnapshot', LeetCodeGrowthSnapshotSchema);
