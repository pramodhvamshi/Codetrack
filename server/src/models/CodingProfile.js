const mongoose = require('mongoose');

const BadgeStatsSchema = new mongoose.Schema({
  solved: { type: Number, default: 0 },
  stars: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
}, { _id: false });

const CodingProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  github: {
    username: { type: String, default: "" },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    contributions: { type: Number, default: 0 },
    starsCount: { type: Number, default: 0 },
    lastSyncAt: { type: Date }
  },
  leetcode: {
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSyncAt: { type: Date }
  },
  geeksforgeeks: {
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSyncAt: { type: Date }
  },
  codechef: {
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSyncAt: { type: Date }
  },
  hackerrank: {
    username: { type: String, default: "" },
    avatar: { type: String, default: "" },
    country: { type: String, default: "" },
    profileUrl: { type: String, default: "" },
    problemSolving: {
      solved: { type: Number, default: 0 },
      totalChallenges: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      rank: { type: Number, default: 0 },
      points: { type: Number, default: 0 }
    },
    python: BadgeStatsSchema,
    sql: BadgeStatsSchema,
    c: BadgeStatsSchema,
    cpp: BadgeStatsSchema,
    java: BadgeStatsSchema,
    javascript: BadgeStatsSchema,
    ruby: BadgeStatsSchema,
    daysOfCode: BadgeStatsSchema,
    daysOfJS: BadgeStatsSchema,
    daysOfStatistics: BadgeStatsSchema,
    react: BadgeStatsSchema,
    lastSyncAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('CodingProfile', CodingProfileSchema);
