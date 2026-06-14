const fs = require('fs');
const path = require('path');

// Simple Cloudinary setup placeholder (can be configured in production via env)
let cloudinary;
try {
  if (process.env.CLOUDINARY_URL) {
    cloudinary = require('cloudinary').v2;
  }
} catch (e) {
  // Cloudinary module not installed yet, fall back to local disk
}

/**
 * Saves a file buffer/temp file securely.
 * Returns file details:
 *   - url:        publicly accessible URL for viewing
 *   - publicId:   Cloudinary public_id (for deletion) or local filename
 *   - fileName:   the sanitised file name stored on disk / Cloudinary
 */
async function uploadResumeFile(file) {
  if (cloudinary && process.env.CLOUDINARY_URL) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file.path,
        { resource_type: 'raw', folder: 'resumes' },
        (error, result) => {
          if (error) return reject(error);

          // Clean up temporary local file
          try {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          } catch (_) {}

          resolve({
            url: result.secure_url,       // full https Cloudinary URL
            publicId: result.public_id,   // e.g. "resumes/myfile-1234"
            fileName: file.originalname || file.filename
          });
        }
      );
    });
  }

  // Local development storage fallback
  return {
    url: `/uploads/${path.basename(file.path)}`,
    publicId: path.basename(file.path),
    fileName: file.originalname || file.filename
  };
}

/**
 * Deletes a file from storage by its publicId.
 */
async function deleteResumeFile(publicId) {
  if (cloudinary && process.env.CLOUDINARY_URL) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  // Local dev cleanup
  const localPath = path.join(__dirname, '..', 'uploads', publicId);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
  return { status: 'deleted' };
}

module.exports = {
  uploadResumeFile,
  deleteResumeFile
};
