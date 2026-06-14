const mongoose = require('mongoose');

const CustomSectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' },
    title: { type: String, required: true },
    content: { type: String, default: '' } // Can store HTML/Markdown text
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomSection', CustomSectionSchema);
