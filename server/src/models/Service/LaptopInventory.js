const mongoose = require('mongoose');

const laptopInventorySchema = new mongoose.Schema(
  {
    sNo: {
      type: Number,
      index: true,
    },
    laptopNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    serviceTag: {
      type: String,
      default: '',
    },
    mssId: {
      type: String,
      default: '',
      index: true,
    },
    studentName: {
      type: String,
      default: 'Office',
    },
    college: {
      type: String,
      default: '',
    },
    hostel: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Verified', 'At Office - Need to send to R&D', 'At Office - No Issues'],
      default: 'Verified',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LaptopInventory', laptopInventorySchema);
