const mongoose = require('mongoose');

const AlumniResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  link: { type: String, required: true, trim: true },
  category: { type: String, enum: ['DSA', 'System Design', 'Web Dev', 'DevOps', 'AI/ML', 'Interview Prep', 'Other'], required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('AlumniResource', AlumniResourceSchema);
