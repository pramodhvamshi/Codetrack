const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, default: 'Remote / Hybrid' },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Referral Slot', 'Contract'],
      default: 'Referral Slot'
    },
    experienceLevel: { type: String, default: 'Entry-level / Fresher' },
    salaryRange: { type: String, default: '' },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    referralSlots: { type: Number, default: 5 },
    deadline: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    applicationsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

OpportunitySchema.index({ createdAt: -1 });
OpportunitySchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Opportunity', OpportunitySchema);
