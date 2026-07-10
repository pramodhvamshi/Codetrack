const mongoose = require('mongoose');

const DSACategorySchema = new mongoose.Schema(
  {
    sheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSASheet', required: true },
    title: { type: String, required: true }, // e.g., 'Arrays', 'Linked List'
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DSACategory', DSACategorySchema);
