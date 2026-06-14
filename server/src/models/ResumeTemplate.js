const mongoose = require('mongoose');

const ResumeTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    filePath: { type: String }, // optional uploaded reference PDF or DOCX file path
    fileType: { type: String, enum: ['pdf', 'docx', 'built-in'], default: 'built-in' },
    structure: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        sections: ['summary', 'education', 'profiles', 'experience', 'projects', 'certifications', 'achievements'],
        layout: 'standard'
      }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeTemplate', ResumeTemplateSchema);
