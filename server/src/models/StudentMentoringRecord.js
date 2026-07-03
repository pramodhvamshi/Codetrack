const mongoose = require('mongoose');

const ActionItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: String, default: 'Student' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  remarks: { type: String }
});

const AttachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

const StudentMentoringRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByRole: {
      type: String,
      required: true
    },
    meetingNumber: {
      type: Number,
      required: true
    },
    meetingType: {
      type: String,
      required: true
    },
    meetingDate: {
      type: Date
    },
    meetingMode: {
      type: String,
      enum: ['Offline', 'Online', 'Phone', 'Other'],
      default: 'Offline'
    },
    meetingDuration: {
      type: String
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed', 'Closed'],
      default: 'Open'
    },
    outcome: {
      type: String,
      enum: ['Excellent', 'Good', 'Needs Attention', 'Critical'],
      default: 'Good'
    },
    tags: [{ type: String }],
    observation: {
      type: String,
      required: true
    },
    overallRecommendation: {
      type: String
    },
    studentProgress: {
      previousGoal: String,
      currentStatus: String,
      nextGoal: String
    },
    actionItems: [ActionItemSchema],
    targetDate: {
      type: Date
    },
    nextReviewDate: {
      type: Date
    },
    remarks: {
      type: String
    },
    attachments: [AttachmentSchema],
    visibility: {
      type: String,
      enum: ['COORDINATOR_ONLY', 'ADMIN_ONLY', 'STUDENT_READONLY'],
      default: 'COORDINATOR_ONLY'
    },
    studentAcknowledged: {
      type: Boolean,
      default: false
    },
    studentAcknowledgedAt: {
      type: Date
    },
    versions: [{
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date },
      changes: { type: mongoose.Schema.Types.Mixed }
    }],
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date
    },
    aiSummary: { type: String },
    aiSentiment: { type: String },
    aiRiskLevel: { type: String }
  },
  { timestamps: true }
);

StudentMentoringRecordSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('StudentMentoringRecord', StudentMentoringRecordSchema);
