const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Internship', 'Referral', 'Contract'],
      default: 'Full-Time'
    },
    salary: { type: String, default: '' },
    description: { type: String, required: true },
    requirements: { type: String, default: '' },
    tags: [{ type: String }],
    applicationDeadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'filled', 'expired'],
      default: 'active'
    },
    applicantCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

JobSchema.index({ createdAt: -1 });
JobSchema.index({ author: 1, createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', JobSchema);
