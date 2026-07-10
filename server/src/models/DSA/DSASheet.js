const mongoose = require('mongoose');

const DSASheetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., 'Striver A2Z'
    description: { type: String, default: '' },
    version: { type: Number, default: 1 },
    source: { type: String, default: 'striver' },
    sourceVersion: { type: String, default: '2026-07' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DSASheet', DSASheetSchema);
