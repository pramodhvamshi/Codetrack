const mongoose = require('mongoose');

const CodeChefContestSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contestName: { type: String, default: "" },
  contestDate: { type: Date, required: true },
  rating: { type: Number, required: true },
  globalRank: { type: Number, required: true },
  countryRank: { type: String, default: 'Inactive' },
  snapshotType: { type: String, enum: ['contest', 'manual'], default: 'contest' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

CodeChefContestSnapshotSchema.index({ userId: 1, contestDate: 1 });

module.exports = mongoose.model('CodeChefContestSnapshot', CodeChefContestSnapshotSchema);
