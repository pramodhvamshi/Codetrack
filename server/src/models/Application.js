const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alumnus: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resumeUrl: { type: String, default: '' },
    coverLetter: { type: String, default: '' },
    // CodeTrack Live Coding Snapshot attached at application time
    codingMetricsSnapshot: {
      leetcodeSolved: { type: Number, default: 0 },
      leetcodeRating: { type: Number, default: 0 },
      codechefRating: { type: Number, default: 0 },
      gfgScore: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      gpa: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'referred', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

ApplicationSchema.index({ opportunity: 1, applicant: 1 });
ApplicationSchema.index({ applicant: 1, createdAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
