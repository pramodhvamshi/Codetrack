const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authMiddleware, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const BugReport = require('../models/BugReport');
const AuditLog = require('../models/AuditLog');
const BulkSyncJob = require('../models/BulkSyncJob');
const { runBulkSync } = require('../services/bulkSyncService');
const authRouter = require('./auth'); // to get generateTokens and setAuthCookies
const config = require('../config/env');

const router = express.Router();

/**
 * REVERT IMPERSONATION
 * Accessible by anyone currently logged in, provided they have admin backup cookies.
 * This route must be placed BEFORE requireRole('admin') middleware block because
 * while impersonating, req.user.role will be 'student' or 'coordinator'.
 */
router.post('/revert-impersonate', authMiddleware, async (req, res) => {
  try {
    console.log("Revert Impersonate Raw Cookies:", req.cookies);
    console.log("Revert Impersonate Cookies:", {
      accessToken: !!req.cookies?.accessToken,
      refreshToken: !!req.cookies?.refreshToken,
      adminAccessToken: !!req.cookies?.adminAccessToken,
      adminRefreshToken: !!req.cookies?.adminRefreshToken,
    });

    const adminAccessToken = req.cookies?.adminAccessToken;
    const adminRefreshToken = req.cookies?.adminRefreshToken;

    if (!adminAccessToken || !adminRefreshToken) {
      return res.status(400).json({ message: 'No admin session to revert to' });
    }

    const decoded = jwt.verify(adminAccessToken, config.jwtSecret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Invalid admin session' });
    }

    const adminUser = await User.findById(decoded.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Log the revert action
    await AuditLog.create({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      targetId: req.currentUser._id,
      targetEmail: req.currentUser.email,
      action: 'impersonate_stop'
    });

    // Set standard cookies back to Admin
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', adminAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', adminRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Clear backup cookies
    res.clearCookie('adminAccessToken', { path: '/' });
    res.clearCookie('adminRefreshToken', { path: '/' });

    return res.json({
      token: adminAccessToken,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isOnboarded: adminUser.isOnboarded,
        isImpersonating: false
      }
    });
  } catch (err) {
    console.error('Revert impersonation error:', err);
    return res.status(500).json({ message: 'Failed to revert impersonation' });
  }
});

// Enforce admin check for remaining endpoints
router.use(authMiddleware, requireRole('admin'));

/**
 * IMPERSONATE USER
 * POST /api/admin/impersonate/:userId
 */
router.post('/impersonate/:userId', async (req, res) => {
  try {
    const adminUser = req.currentUser;
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'Cannot impersonate another admin' });
    }

    // Capture standard cookies
    const adminAccessToken = req.cookies.accessToken || req.headers.authorization?.slice(7);
    const adminRefreshToken = req.cookies.refreshToken;

    if (!adminAccessToken || !adminRefreshToken) {
      return res.status(400).json({ message: 'Admin session credentials missing' });
    }

    // Log the impersonation start
    await AuditLog.create({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      targetId: targetUser._id,
      targetEmail: targetUser.email,
      action: 'impersonate_start'
    });

    // Generate tokens for target
    const tokens = authRouter.generateTokens(targetUser, true);

    // Set standard cookies to target
    authRouter.setAuthCookies(res, tokens, true);

    // Store admin tokens in backup cookies
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('adminAccessToken', adminAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    res.cookie('adminRefreshToken', adminRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json({
      token: tokens.accessToken,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isOnboarded: targetUser.isOnboarded,
        isImpersonating: true
      }
    });
  } catch (err) {
    console.error('Impersonation error:', err);
    return res.status(500).json({ message: 'Impersonation failed' });
  }
});

/**
 * CREATE COORDINATOR
 * POST /api/admin/coordinators
 */
router.post('/coordinators', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const coord = await User.create({
      name,
      email,
      passwordHash,
      role: 'coordinator',
      college,
      isActive: true,
      isOnboarded: true
    });

    return res.status(201).json(coord);
  } catch (err) {
    console.error('Create coordinator error:', err);
    return res.status(500).json({ message: 'Failed to create coordinator' });
  }
});

/**
 * EDIT COORDINATOR
 * PUT /api/admin/coordinators/:id
 */
router.put('/coordinators/:id', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    const coord = await User.findOne({ _id: req.params.id, role: 'coordinator' });
    if (!coord) {
      return res.status(404).json({ message: 'Coordinator not found' });
    }

    if (name) coord.name = name;
    if (email) coord.email = email.toLowerCase();
    if (college !== undefined) coord.college = college;

    if (password) {
      coord.passwordHash = await bcrypt.hash(password, 10);
    }

    await coord.save();
    return res.json(coord);
  } catch (err) {
    console.error('Edit coordinator error:', err);
    return res.status(500).json({ message: 'Failed to edit coordinator' });
  }
});

/**
 * DISABLE/ENABLE COORDINATOR
 * PATCH /api/admin/coordinators/:id/status
 */
router.patch('/coordinators/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive is required' });
    }

    const coord = await User.findOne({ _id: req.params.id, role: 'coordinator' });
    if (!coord) {
      return res.status(404).json({ message: 'Coordinator not found' });
    }

    coord.isActive = isActive;
    await coord.save();
    return res.json(coord);
  } catch (err) {
    console.error('Toggle coordinator status error:', err);
    return res.status(500).json({ message: 'Failed to toggle status' });
  }
});

/**
 * DELETE COORDINATOR
 * DELETE /api/admin/coordinators/:id
 */
router.delete('/coordinators/:id', async (req, res) => {
  try {
    const coord = await User.findOneAndDelete({ _id: req.params.id, role: 'coordinator' });
    if (!coord) {
      return res.status(404).json({ message: 'Coordinator not found' });
    }
    return res.json({ message: 'Coordinator deleted successfully' });
  } catch (err) {
    console.error('Delete coordinator error:', err);
    return res.status(500).json({ message: 'Failed to delete coordinator' });
  }
});

/**
 * DISABLE/ENABLE STUDENT
 * PATCH /api/admin/students/:id/status
 */
router.patch('/students/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive is required' });
    }

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isActive = isActive;
    await student.save();
    return res.json(student);
  } catch (err) {
    console.error('Toggle student status error:', err);
    return res.status(500).json({ message: 'Failed to toggle status' });
  }
});

/**
 * RESET STUDENT PASSWORD
 * POST /api/admin/students/:id/reset-password
 */
router.post('/students/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.passwordHash = await bcrypt.hash(password, 10);
    await student.save();
    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset student password error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

/**
 * GET ALL COORDINATORS
 * GET /api/admin/coordinators
 */
router.get('/coordinators', async (req, res) => {
  try {
    const coords = await User.find({ role: 'coordinator' }).select('-passwordHash').sort({ name: 1 });
    return res.json(coords);
  } catch (err) {
    console.error('Get coordinators error:', err);
    return res.status(500).json({ message: 'Failed to fetch coordinators' });
  }
});

/**
 * GET ALL STUDENTS
 * GET /api/admin/students
 */
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-passwordHash').sort({ name: 1 });
    return res.json(students);
  } catch (err) {
    console.error('Get students error:', err);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
});

/**
 * GET ALL BUG REPORTS
 * GET /api/admin/bugs
 */
router.get('/bugs', async (req, res) => {
  try {
    const bugs = await BugReport.find({}).sort({ createdAt: -1 });
    return res.json(bugs);
  } catch (err) {
    console.error('Get bug reports error:', err);
    return res.status(500).json({ message: 'Failed to fetch bug reports' });
  }
});

/**
 * UPDATE BUG REPORT STATUS
 * PATCH /api/admin/bugs/:id
 */
router.patch('/bugs/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const bug = await BugReport.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({ message: 'Bug report not found' });
    }

    bug.status = status;
    await bug.save();
    return res.json(bug);
  } catch (err) {
    console.error('Update bug report error:', err);
    return res.status(500).json({ message: 'Failed to update bug report' });
  }
});

/**
 * GET AUDIT LOGS
 * GET /api/admin/audit-logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100);
    return res.json(logs);
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

/**
 * MANUAL SNAPSHOT TRIGGER
 * POST /api/admin/generate-snapshots
 */
router.post('/generate-snapshots', async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !['weekly', 'monthly', 'all'].includes(type)) {
      return res.status(400).json({ message: 'Invalid snapshot type. Must be "weekly", "monthly", or "all".' });
    }

    const { triggerWeeklySnapshots, triggerMonthlySnapshots } = require('../services/cronScheduler');
    const results = {};

    if (type === 'weekly' || type === 'all') {
      console.log('Manually triggering weekly snapshots via admin endpoint...');
      await triggerWeeklySnapshots();
      results.weekly = 'Weekly snapshots generated successfully.';
    }
    if (type === 'monthly' || type === 'all') {
      console.log('Manually triggering monthly snapshots via admin endpoint...');
      await triggerMonthlySnapshots();
      results.monthly = 'Monthly snapshots generated successfully.';
    }

    return res.json({ message: 'Snapshots generated successfully', results });
  } catch (err) {
    console.error('Manual snapshot trigger error:', err);
    return res.status(500).json({ message: 'Failed to generate snapshots manually', error: err.message });
  }
});

/**
 * POST /api/admin/snapshots/weekly/generate
 */
router.post('/snapshots/weekly/generate', async (req, res) => {
  try {
    const { triggerWeeklySnapshots } = require('../services/cronScheduler');
    console.log('Admin triggered manual weekly snapshots...');
    await triggerWeeklySnapshots();
    return res.json({ message: 'Weekly Snapshot Generated Successfully' });
  } catch (err) {
    console.error('Manual weekly snapshot trigger error:', err);
    return res.status(500).json({ message: 'Failed to generate weekly snapshot', error: err.message });
  }
});

/**
 * POST /api/admin/snapshots/monthly/generate
 */
router.post('/snapshots/monthly/generate', async (req, res) => {
  try {
    const { triggerMonthlySnapshots } = require('../services/cronScheduler');
    console.log('Admin triggered manual monthly snapshots...');
    await triggerMonthlySnapshots();
    return res.json({ message: 'Monthly Snapshot Generated Successfully' });
  } catch (err) {
    console.error('Manual monthly snapshot trigger error:', err);
    return res.status(500).json({ message: 'Failed to generate monthly snapshot', error: err.message });
  }
});

/**
 * POST /api/admin/platform-sync/all
 */
router.post('/platform-sync/all', async (req, res) => {
  try {
    // Prevent duplicate runs: check if any job is currently Pending or Running
    const runningJob = await BulkSyncJob.findOne({ status: { $in: ['Pending', 'Running'] } });
    if (runningJob) {
      return res.status(400).json({ message: 'A bulk platform sync job is already running.' });
    }

    const jobId = crypto.randomUUID();
    const job = await BulkSyncJob.create({
      jobId,
      startedBy: req.currentUser._id,
      status: 'Pending',
      logs: ['Job created and queued. Starting sync engine...']
    });

    // Run bulk sync asynchronously in background
    runBulkSync(jobId);

    return res.status(202).json({ message: 'Bulk platform sync job queued successfully.', jobId });
  } catch (err) {
    console.error('Failed to trigger bulk platform sync:', err);
    return res.status(500).json({ message: 'Failed to trigger bulk platform sync', error: err.message });
  }
});

/**
 * GET /api/admin/platform-sync/status/latest
 */
router.get('/platform-sync/status/latest', async (req, res) => {
  try {
    const latest = await BulkSyncJob.findOne().sort({ createdAt: -1 });
    
    // Additional metrics for dashboard
    const lastSuccessJob = await BulkSyncJob.findOne({ status: 'Completed' }).sort({ completedAt: -1 });
    const lastFailedJob = await BulkSyncJob.findOne({ status: 'Failed' }).sort({ completedAt: -1 });
    
    const completedJobs = await BulkSyncJob.find({ status: 'Completed', startedAt: { $exists: true }, completedAt: { $exists: true } });
    let avgDuration = 0;
    if (completedJobs.length > 0) {
      const totalDuration = completedJobs.reduce((sum, j) => sum + (new Date(j.completedAt) - new Date(j.startedAt)), 0);
      avgDuration = Math.round((totalDuration / completedJobs.length) / 1000); // in seconds
    }

    return res.json({
      latest,
      lastSuccessfulSync: lastSuccessJob ? lastSuccessJob.completedAt : null,
      lastFailedSync: lastFailedJob ? lastFailedJob.completedAt : null,
      averageSyncDuration: avgDuration
    });
  } catch (err) {
    console.error('Failed to get latest job status:', err);
    return res.status(500).json({ message: 'Failed to fetch latest job status' });
  }
});

/**
 * GET /api/admin/platform-sync/status/:jobId
 */
router.get('/platform-sync/status/:jobId', async (req, res) => {
  try {
    const job = await BulkSyncJob.findOne({ jobId: req.params.jobId });
    if (!job) return res.status(404).json({ message: 'Sync job not found' });
    return res.json(job);
  } catch (err) {
    console.error('Failed to fetch job details:', err);
    return res.status(500).json({ message: 'Failed to fetch sync job status' });
  }
});

/**
 * GET /api/admin/platform-sync/jobs
 */
router.get('/platform-sync/jobs', async (req, res) => {
  try {
    const list = await BulkSyncJob.find().sort({ createdAt: -1 }).limit(10);
    return res.json(list);
  } catch (err) {
    console.error('Failed to list sync jobs:', err);
    return res.status(500).json({ message: 'Failed to fetch sync jobs logs' });
  }
});

/**
 * GET /api/admin/platform-sync/job/:jobId/failed-csv
 */
router.get('/platform-sync/job/:jobId/failed-csv', async (req, res) => {
  try {
    const job = await BulkSyncJob.findOne({ jobId: req.params.jobId });
    if (!job) {
      return res.status(404).json({ message: 'Sync job not found' });
    }

    let csvContent = 'Student,Email,Reason\n';
    if (job.failedStudentsList && job.failedStudentsList.length > 0) {
      job.failedStudentsList.forEach(s => {
        const name = (s.studentName || '').replace(/"/g, '""');
        const email = (s.email || '').replace(/"/g, '""');
        const reason = (s.reason || '').replace(/"/g, '""');
        csvContent += `"${name}","${email}","${reason}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="failed_students_${req.params.jobId}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('Failed to export failed sync list CSV:', err);
    return res.status(500).json({ message: 'Failed to export failed sync list' });
  }
});

module.exports = router;
