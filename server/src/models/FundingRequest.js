const mongoose = require('mongoose');

const FundingRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['AI/ML Prototype', 'Robotics / IoT', 'Hackathon Trip', 'Research Paper', 'Startup Prototype', 'Other'],
      default: 'AI/ML Prototype'
    },
    targetAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    description: { type: String, required: true },
    githubUrl: { type: String, default: '' },
    demoVideoUrl: { type: String, default: '' },
    pledges: [
      {
        donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        note: { type: String, default: '' },
        date: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'funded', 'closed'],
      default: 'active'
    }
  },
  { timestamps: true }
);

FundingRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FundingRequest', FundingRequestSchema);
