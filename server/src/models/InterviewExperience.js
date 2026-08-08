const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
  roundName: { type: String, required: true },
  details: { type: String, required: true }
}, { _id: false });

const InterviewExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  outcome: { type: String, enum: ['Selected', 'Rejected', 'Pending'], default: 'Selected' },
  overview: { type: String, required: true },
  rounds: [RoundSchema],
  tips: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InterviewExperience', InterviewExperienceSchema);
