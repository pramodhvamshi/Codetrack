const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['webinar', 'workshop', 'techtalk', 'ama', 'hackathon'], required: true },
  description: { type: String, required: true },
  meetingUrl: { type: String, trim: true }, // Google Meet / Zoom / Teams link
  eventDate: { type: Date, required: true },
  endDate: { type: Date },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Hackathon specific fields
  isHackathon: { type: Boolean, default: false },
  themes: [{ type: String }],
  submissionUrl: { type: String },
  maxTeamSize: { type: Number, default: 4 },
  prizePool: { type: String },

  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
