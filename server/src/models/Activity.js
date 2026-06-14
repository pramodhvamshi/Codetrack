const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codechef', 'geeksforgeeks', 'github'],
      required: true
    },
    type: {
      type: String,
      enum: ['solved', 'commit', 'contest', 'potd'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    link: {
      type: String
    },
    timestamp: {
      type: Date,
      required: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Indexes for query performance (especially dashboard heatmaps and timelines)
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ userId: 1, platform: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
