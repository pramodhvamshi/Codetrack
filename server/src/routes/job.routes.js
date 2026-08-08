const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { getJobListings, createJobListing } = require('../services/jobService');
const {
  getStudentResumes,
  uploadStudentResumeFile,
  submitApplication,
  getStudentApplications,
  getJobApplications,
  updateApplicationStatus
} = require('../services/applicationService');
const Application = require('../models/Application');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * GET /api/v2/jobs
 * Fetch active job & referral listings with filters
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, type, keyword, location } = req.query;
    const result = await getJobListings({ page, limit, type, keyword, location });

    // Also attach application status if student
    if (req.user?.id) {
      const studentApps = await Application.find({ applicant: req.user.id }).select('job status').lean();
      const appMap = {};
      studentApps.forEach(app => {
        appMap[app.job.toString()] = app.status;
      });

      result.jobs = result.jobs.map(j => ({
        ...j,
        appliedStatus: appMap[j._id.toString()] || null
      }));
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch job listings' });
  }
});

/**
 * GET /api/v2/jobs/student-resumes
 * Fetch all available resumes for logged-in student (Resume Studio & Uploads)
 */
router.get('/student-resumes', authMiddleware, async (req, res) => {
  try {
    const resumes = await getStudentResumes(req.user.id);
    return res.json({
      success: true,
      data: resumes
    });
  } catch (err) {
    console.error('Error fetching student resumes:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch resumes' });
  }
});

/**
 * POST /api/v2/jobs/upload-resume
 * Upload a new PDF resume directly to Cloudinary & add to student's resumes
 */
router.post('/upload-resume', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }

    const resume = await uploadStudentResumeFile(req.user.id, req.file);

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: resume
    });
  } catch (err) {
    console.error('Error uploading resume file:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload resume' });
  }
});

/**
 * POST /api/v2/jobs
 * Create job listing (Alumni / Admin / Coordinator)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, company, location, employmentType, salary, description, requirements, tags, applicationDeadline } = req.body;

    if (!title || !company || !location || !description) {
      return res.status(400).json({ success: false, message: 'Title, company, location, and description are required' });
    }

    const job = await createJobListing({
      authorId: req.user.id,
      title,
      company,
      location,
      employmentType,
      salary,
      description,
      requirements,
      tags,
      applicationDeadline
    });

    return res.status(201).json({
      success: true,
      message: 'Job listing published successfully',
      data: job
    });
  } catch (err) {
    console.error('Error creating job:', err);
    return res.status(500).json({ success: false, message: 'Failed to publish job listing' });
  }
});

/**
 * POST /api/v2/jobs/:id/apply
 * Apply to job position using selected resume ID or URL
 */
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { resumeId, resumeUrl, coverLetter } = req.body;

    const application = await submitApplication({
      jobId,
      applicantId: req.user.id,
      resumeId,
      resumeUrl,
      coverLetter
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (err) {
    console.error('Error submitting application:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to submit application' });
  }
});

/**
 * GET /api/v2/jobs/applications/me
 * Student's submitted applications
 */
router.get('/applications/me', authMiddleware, async (req, res) => {
  try {
    const applications = await getStudentApplications(req.user.id);
    return res.json({
      success: true,
      data: applications
    });
  } catch (err) {
    console.error('Error fetching my applications:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

/**
 * GET /api/v2/jobs/:id/applications
 * Received applications for job listing author
 */
router.get('/:id/applications', authMiddleware, async (req, res) => {
  try {
    const applications = await getJobApplications(req.params.id, req.user.id);
    return res.json({
      success: true,
      data: applications
    });
  } catch (err) {
    console.error('Error fetching job applications:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to fetch applications' });
  }
});

/**
 * PATCH /api/v2/jobs/applications/:id/status
 * Update application status
 */
router.patch('/applications/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const application = await updateApplicationStatus(req.params.id, status, req.user.id);
    return res.json({
      success: true,
      message: 'Status updated',
      data: application
    });
  } catch (err) {
    console.error('Error updating status:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to update status' });
  }
});

module.exports = router;
