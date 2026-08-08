const mongoose = require('mongoose');

const mockTestSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['topic', 'language'],
      default: 'topic',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    totalQuestions: {
      type: Number,
      default: 10,
    },
    questions: [
      {
        id: { type: Number, required: true },
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, required: true },
      },
    ],
    userAnswers: {
      type: [Number], // Array of selected option indices (0-3), -1 for skipped
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MockTestSession', mockTestSessionSchema);
