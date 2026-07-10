const mongoose = require('mongoose');

const ResumeVersionSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    versionNumber: { type: Number, required: true },
    pdfUrl: { type: String, required: true },
    parsedJson: { type: mongoose.Schema.Types.Mixed, default: {} }, // From unpdf / ATS parser
  },
  { timestamps: true }
);

// Ensure a resume has unique version numbers
ResumeVersionSchema.index({ resumeId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.models.ResumeVersion || mongoose.model('ResumeVersion', ResumeVersionSchema);
