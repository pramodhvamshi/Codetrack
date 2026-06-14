const mongoose = require('mongoose');

const ResumeLayoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' },
    sectionsOrder: { type: [String], required: true },
    hiddenSections: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeLayout', ResumeLayoutSchema);
