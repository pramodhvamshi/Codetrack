const mongoose = require('mongoose');

const LeetCodeContestSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contestName: { type: String, required: true },
  contestDate: { type: Date, required: true },
  rating: { type: Number, required: true },
  rank: { type: Number, required: true },
  attended: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

LeetCodeContestSnapshotSchema.index({ userId: 1, contestName: 1 }, { unique: true });
LeetCodeContestSnapshotSchema.index({ userId: 1, contestDate: 1 });

module.exports = mongoose.model('LeetCodeContestSnapshot', LeetCodeContestSnapshotSchema);
