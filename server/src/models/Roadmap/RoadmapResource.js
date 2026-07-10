const mongoose = require('mongoose');

const RoadmapResourceSchema = new mongoose.Schema(
  {
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapNode', required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['documentation', 'youtube', 'article', 'practice_website', 'interview_questions', 'mini_project', 'other'], 
      default: 'documentation' 
    },
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoadmapResource', RoadmapResourceSchema);
