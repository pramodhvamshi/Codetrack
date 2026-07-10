const mongoose = require('mongoose');

const DSAProgressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSAProblem', required: true },
    status: { type: String, enum: ['Completed', 'Pending', 'Revisit'], default: 'Completed' },
  },
  { timestamps: true }
);

// Ensure a student has only one progress entry per problem
DSAProgressSchema.index({ studentId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model('DSAProgress', DSAProgressSchema);
