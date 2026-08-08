const mongoose = require('mongoose');

const mentoringRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    mentorName: {
      type: String,
      default: 'Placement Coordinator',
    },
    category: {
      type: String,
      enum: ['Placement Prep', 'Technical Guidance', 'Resume/Portfolio', 'Mental Health / Wellness', 'General Counsel'],
      required: true,
      default: 'Placement Prep',
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
      index: true,
    },
    timeSlot: {
      type: String, // e.g. "14:00-15:00" or "2:00 PM - 3:00 PM"
      required: true,
    },
    notesText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Modified', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true,
    },
    meetingUrl: {
      type: String,
      default: '',
    },
    meetingNotes: {
      type: String,
      default: '',
    },
    docLinks: [
      {
        title: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MentoringRequest', mentoringRequestSchema);
