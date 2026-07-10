const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true }, // e.g. "Google", "Amazon"
    role: { type: String, required: true }, // e.g. "Frontend Engineer"
    status: { type: String, enum: ['Scheduled', 'InProgress', 'Completed'], default: 'InProgress' },
    round: { type: String, default: 'Technical' },
    difficulty: { type: String, default: 'Medium' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.InterviewSession || mongoose.model('InterviewSession', InterviewSessionSchema);
