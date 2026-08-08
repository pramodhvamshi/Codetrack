const mongoose = require('mongoose');

const laptopRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taggedCoordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    laptopNumber: {
      type: String,
      default: '',
    },
    issueCategory: {
      type: String,
      enum: ['Hardware Issue', 'Battery/Charger Replacement', 'Screen/Keyboard Repair', 'Send to R&D', 'Return Laptop', 'Other'],
      required: true,
      default: 'Hardware Issue',
    },
    driveDocUrl: {
      type: String,
      default: 'https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing',
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
      default: 'Pending',
      index: true,
    },
    coordinatorResponse: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LaptopRequest', laptopRequestSchema);
