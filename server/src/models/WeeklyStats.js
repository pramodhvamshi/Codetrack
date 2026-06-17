const mongoose = require('mongoose');

const WeeklyStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: Date, required: true },
  lcSolvedStart: { type: Number, default: 0 },
  lcSolvedEnd: { type: Number, default: 0 },
  gfgSolvedStart: { type: Number, default: 0 },
  gfgSolvedEnd: { type: Number, default: 0 },
  weeklyScore: { type: Number, default: 0 } // Precalculated: (lcSolvedEnd - lcSolvedStart) + (gfgSolvedEnd - gfgSolvedStart)
}, { timestamps: true });

WeeklyStatsSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyStats', WeeklyStatsSchema);
