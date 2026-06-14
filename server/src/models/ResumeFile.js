const mongoose = require('mongoose');

const ResumeFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    fileSize: { type: Number, required: true },
    // publicId: Cloudinary public_id (for deletion) or local filename
    storagePath: { type: String, required: true },
    // fileUrl: the publicly accessible URL for previewing/downloading
    fileUrl: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false },
    source: { type: String, enum: ['uploaded'], default: 'uploaded' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeFile', ResumeFileSchema);
