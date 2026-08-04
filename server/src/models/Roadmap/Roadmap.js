const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Map' }, // e.g., lucide icon name
    category: { type: String, default: 'Core Programming' },
    difficulty: { type: String, default: 'Beginner' },
    estimatedDuration: { type: String, default: '8 Weeks' },
    totalTopics: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    source: { type: String, default: 'CodeTrack' },
    sourceVersion: { type: String, default: '2026-08' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', RoadmapSchema);
