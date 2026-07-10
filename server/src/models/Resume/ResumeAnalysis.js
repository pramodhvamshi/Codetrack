const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' }, // Either version
    resumeFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeFile' }, // Or file
    atsScore: { type: Number, default: 0 },
    suggestions: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    fullAnalysis: { type: mongoose.Schema.Types.Mixed }, // Stores the rich JSON
  },
  { timestamps: true }
);

module.exports = mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
