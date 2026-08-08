const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reasonType: {
      type: String,
      enum: ['General', 'Academic', 'Medical', 'Personal', 'Placement Drive', 'Exam'],
      required: true,
      default: 'General',
    },
    duration: {
      type: String,
      enum: ['1 Day', '2 Days', '3 Days', '1 Week', '2 Weeks', 'Custom'],
      required: true,
      default: '1 Day',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    driveDocUrl: {
      type: String,
      default: 'https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing',
    },
    statement: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Changes Requested'],
      default: 'Pending',
      index: true,
    },
    coordinatorRemarks: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
