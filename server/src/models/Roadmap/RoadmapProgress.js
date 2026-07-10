const mongoose = require('mongoose');

const RoadmapProgressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapNode', required: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Done', 'Skip', 'Bookmarked'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

// Ensure a student has only one progress entry per node
RoadmapProgressSchema.index({ studentId: 1, nodeId: 1 }, { unique: true });

module.exports = mongoose.model('RoadmapProgress', RoadmapProgressSchema);
