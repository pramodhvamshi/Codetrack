const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    adminEmail: { type: String, required: true },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetEmail: { type: String, required: true },
    action: { type: String, required: true }, // e.g. 'impersonate_start' | 'impersonate_revert'
    timestamp: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
