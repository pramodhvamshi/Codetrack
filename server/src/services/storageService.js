const cloudinary = require('cloudinary').v2;

/**
 * Helper to upload a buffer stream to Cloudinary
 */
async function uploadToCloudinary(fileBuffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Saves a file buffer securely to Cloudinary.
 * Returns file details:
 *   - url:        secure URL for viewing (resumeUrl / fileUrl)
 *   - publicId:   Cloudinary public_id (for deletion)
 *   - fileName:   original file name
 */
async function uploadResumeFile(file) {
  const result = await uploadToCloudinary(file.buffer, 'medha-code-track/resumes', 'raw');
  return {
    url: result.url,
    publicId: result.publicId,
    fileName: file.originalname
  };
}

/**
 * Deletes a file from Cloudinary by its publicId.
 */
async function deleteResumeFile(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

/**
 * Uploads a bug report screenshot to Cloudinary
 */
async function uploadBugScreenshot(file) {
  const result = await uploadToCloudinary(file.buffer, 'medha-code-track/bug-reports', 'image');
  return {
    url: result.url,
    publicId: result.publicId,
    fileName: file.originalname
  };
}

/**
 * Deletes a bug report screenshot from Cloudinary
 */
async function deleteBugScreenshot(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

module.exports = {
  uploadResumeFile,
  deleteResumeFile,
  uploadBugScreenshot,
  deleteBugScreenshot
};
