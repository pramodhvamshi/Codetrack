const mongoose = require('mongoose');

const GitHubSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    username: { type: String, required: true },
    profileUrl: { type: String },
    publicReposCount: { type: Number, default: 0 },
    starsCount: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    languages: { type: Map, of: Number, default: {} }, // language name -> byte count or frequency
    repositories: [
      {
        name: { type: String },
        stars: { type: Number, default: 0 },
        language: { type: String },
        url: { type: String },
        description: { type: String }
      }
    ],
    recentCommits: [
      {
        repo: { type: String },
        message: { type: String },
        timestamp: { type: Date },
        url: { type: String }
      }
    ],
    lastSyncAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GitHub', GitHubSchema);
