const mongoose = require('mongoose');

const ResumeSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion', required: true },
    timestamp: { type: Date, default: Date.now },
    templateKey: { type: String, required: true },
    layout: {
      sectionsOrder: [String],
      hiddenSections: [String]
    },
    content: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeSnapshot', ResumeSnapshotSchema);
