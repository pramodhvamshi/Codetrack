const mongoose = require('mongoose');

const BugReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reporterName: { type: String, required: true },
    reporterEmail: { type: String, required: true },
    reporterRole: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    screenshotUrls: [{ type: String }],
    screenshotUrl: { type: String },
    screenshotPublicId: { type: String },
    category: {
      type: String,
      enum: ['Dashboard', 'Profile', 'Leaderboard', 'Heatmap', 'Resume', 'Authentication', 'Coordinator', 'Other'],
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BugReport', BugReportSchema);
