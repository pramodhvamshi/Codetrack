const mongoose = require('mongoose');

const ContestSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthKey: {
    type: String, // Format: "YYYY-MM"
    required: true
  },
  leetcode: {
    rating: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 },
    contestCount: { type: Number, default: 0 }
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

// Prevent duplicate entries for the same user in the same month
ContestSnapshotSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('ContestSnapshot', ContestSnapshotSchema);
