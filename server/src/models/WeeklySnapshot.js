const mongoose = require('mongoose');

const WeeklySnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekKey: {
    type: String, // Format: "YYYY-MM-DD" (Monday start of week date string)
    required: true
  },
  leetcode: {
    rating: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 }
  },
  codechef: {
    rating: { type: Number, default: 0 },
    currentRating: { type: Number, default: 0 },
    highestRating: { type: Number, default: 0 },
    stars: { type: String, default: '1★' },
    globalRank: { type: Number, default: 0 },
    countryRank: { type: String, default: 'Inactive' }
  },
  snapshotDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

WeeklySnapshotSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

module.exports = mongoose.model('WeeklySnapshot', WeeklySnapshotSchema);
