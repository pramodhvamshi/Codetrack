const path = require('path');
const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const BugReport = require('../models/BugReport');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const unique = Date.now();
    cb(null, `bug-${base}-${unique}${ext}`);
  }
});

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
    const screenshotUrls = files.map(file => `/uploads/${file.filename}`);

    const newBug = await BugReport.create({
      userId: req.currentUser._id,
      reporterName: req.currentUser.name,
      reporterEmail: req.currentUser.email,
      reporterRole: req.currentUser.role,
      title,
      description,
      screenshotUrls,
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
