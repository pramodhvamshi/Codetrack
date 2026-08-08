const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: [
        'announcement',
        'milestone',
        'like',
        'comment',
        'job_alert',
        'system'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
