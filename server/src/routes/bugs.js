const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const BugReport = require('../models/BugReport');
const { uploadBugScreenshot } = require('../services/storageService');

const router = express.Router();

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG, and WEBP formats are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Bug creation endpoint
router.post('/', authMiddleware, upload.array('screenshots', 5), async (req, res) => {
  try {
    const { title, description, category, severity } = req.body;
    if (!title || !description || !category || !severity) {
      return res.status(400).json({ message: 'Title, description, category, and severity are required' });
    }

    const files = req.files || [];
    
    // Upload files to Cloudinary in parallel
    const uploadPromises = files.map(file => uploadBugScreenshot(file));
    const uploadResults = await Promise.all(uploadPromises);
    
    const screenshotUrls = uploadResults.map(res => res.url);
    const firstResult = uploadResults[0] || null;

    const newBug = await BugReport.create({
      userId: req.currentUser._id,
      reporterName: req.currentUser.name,
      reporterEmail: req.currentUser.email,
      reporterRole: req.currentUser.role,
      title,
      description,
      screenshotUrls,
      screenshotUrl: firstResult ? firstResult.url : undefined,
      screenshotPublicId: firstResult ? firstResult.publicId : undefined,
      category,
      severity,
      status: 'Open'
    });

    return res.status(201).json(newBug);
  } catch (err) {
    console.error('Create bug report error:', err);
    return res.status(500).json({ message: err.message || 'Failed to submit bug report' });
  }
});

module.exports = router;
