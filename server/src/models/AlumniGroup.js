const mongoose = require('mongoose');

const AlumniGroupSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  groupType: { type: String, enum: ['public_club', 'custom_group'], default: 'custom_group' },
  targetAudience: { type: String, enum: ['all', 'alumni-only'], default: 'all' },
  meetingUrl: { type: String, trim: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('AlumniGroup', AlumniGroupSchema);
