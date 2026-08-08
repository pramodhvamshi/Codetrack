const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'event', 'placement', 'hackathon', 'workshop', 'urgent'],
      default: 'general'
    },
    bannerUrl: { type: String, default: null },
    eventDate: { type: Date, default: null },
    registrationLink: { type: String, default: null },
    isPinned: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
