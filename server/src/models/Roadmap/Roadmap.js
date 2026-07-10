const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Map' }, // e.g., lucide icon name
    version: { type: Number, default: 1 },
    source: { type: String, default: 'roadmap.sh' },
    sourceVersion: { type: String, default: '2026-07' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', RoadmapSchema);
