const mongoose = require('mongoose');

const ReportCacheSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ReportCache', ReportCacheSchema);
