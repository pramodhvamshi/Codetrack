const mongoose = require('mongoose');

const AcademicProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  sgpa1: { type: Number, min: 0, max: 10, default: null },
  sgpa2: { type: Number, min: 0, max: 10, default: null },
  sgpa3: { type: Number, min: 0, max: 10, default: null },
  sgpa4: { type: Number, min: 0, max: 10, default: null },
  sgpa5: { type: Number, min: 0, max: 10, default: null },
  sgpa6: { type: Number, min: 0, max: 10, default: null },
  cgpa: { type: Number, min: 0, max: 10, default: null },
  backlogs: { type: Number, min: 0, default: 0 },
  academicStatus: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Needs Improvement', '-'],
    default: '-'
  }
}, { timestamps: true });

module.exports = mongoose.model('AcademicProfile', AcademicProfileSchema);
