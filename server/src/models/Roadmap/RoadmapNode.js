const mongoose = require('mongoose');

const RoadmapNodeSchema = new mongoose.Schema(
  {
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapNode', default: null }, // null for root nodes
    title: { type: String, required: true },
    description: { type: String, default: '' },
    statusType: { type: String, default: 'default' }, // Allows custom UI types later (e.g., 'core', 'optional')
    order: { type: Number, default: 0 },
    branch: { type: String, enum: ['left', 'right', 'center'], default: 'center' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    estimatedTime: { type: String, default: '1-2 hours' },
    interviewImportance: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    projectImportance: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoadmapNode', RoadmapNodeSchema);
