const mongoose = require('mongoose');

const BulkSyncJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  totalStudents: { type: Number, default: 0 },
  completedStudents: { type: Number, default: 0 },
  failedStudents: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Running', 'Completed', 'Failed'],
    default: 'Pending'
  },
  logs: { type: [String], default: [] },
  failedStudentsList: [
    {
      studentName: { type: String },
      email: { type: String },
      reason: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('BulkSyncJob', BulkSyncJobSchema);
