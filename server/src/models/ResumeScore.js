const mongoose = require('mongoose');

const ResumeScoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' },
    score: { type: Number, default: 0 }, // Completeness Score
    atsScore: { type: Number, default: 0 }, // ATS Score
    feedback: { type: [String], default: [] },
    atsSuggestions: { type: [String], default: [] },
    lastCalculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeScore', ResumeScoreSchema);
