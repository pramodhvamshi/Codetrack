const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
