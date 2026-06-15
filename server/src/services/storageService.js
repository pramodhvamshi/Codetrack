const cloudinary = require('cloudinary').v2;

/**
 * Helper to upload a buffer stream to Cloudinary
 */
async function uploadToCloudinary(fileBuffer, folder, resourceType = 'auto', publicId = undefined) {
  return new Promise((resolve, reject) => {
    const options = { folder, resource_type: resourceType };
    if (publicId) options.public_id = publicId;
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          ...result
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
  console.log("Resume Upload Audit", {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    bufferSize: file.buffer?.length
  });

  const crypto = require('crypto');
  const uniqueName = crypto.randomBytes(16).toString('hex');
  const generatedPublicId = `${uniqueName}.pdf`;

  const result = await uploadToCloudinary(file.buffer, 'medha-code-track/resumes', 'raw', generatedPublicId);

  console.log("Cloudinary Upload Result:", {
    secure_url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
    format: result.format,
    bytes: result.bytes,
    original_filename: result.original_filename
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  if (result.bytes < 1000) {
    throw new Error("Uploaded PDF appears corrupted");
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
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
