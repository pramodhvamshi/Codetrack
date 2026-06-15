const mongoose = require('mongoose');

const ResumeFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Standardized fields
    resumeUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    originalFileName: { type: String, required: true },

    // Fields for backward compatibility and tracking
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false },
    source: { type: String, enum: ['uploaded'], default: 'uploaded' }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field mappings for backward compatibility
ResumeFileSchema.virtual('fileUrl')
  .get(function() { return this.resumeUrl; })
  .set(function(val) { this.resumeUrl = val; });

ResumeFileSchema.virtual('storagePath')
  .get(function() { return this.publicId; })
  .set(function(val) { this.publicId = val; });

ResumeFileSchema.virtual('originalName')
  .get(function() { return this.originalFileName; })
  .set(function(val) { this.originalFileName = val; });

ResumeFileSchema.virtual('fileName')
  .get(function() { return this.originalFileName; })
  .set(function(val) { this.originalFileName = val; });

module.exports = mongoose.model('ResumeFile', ResumeFileSchema);
