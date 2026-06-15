const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { syncPlatformsForUser } = require('../services/platformSyncService');
const { computeActivityStatus } = require('../utils/activity');
const { buildResumePdfBuffer } = require('../services/resumeService');
// const { isProfileComplete } = require('../utils/profile');

const router = express.Router();

// All /student routes require student role
router.use(authMiddleware, requireRole('student'));

// Get own profile
router.get('/me', async (req, res) => {
  const user = req.currentUser;

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college,
    hostel: user.hostel,
    branch: user.branch,
    year: user.year,
    overallGpa: user.overallGpa,
    leetcodeUsername: user.leetcodeUsername,
    codechefUsername: user.codechefUsername,
    gfgUsername: user.gfgUsername,
    githubUsername: user.githubUsername,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    hackerrank: user.hackerrank,
    platformStats: user.platformStats,
    scores: user.scores,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    activeDaysCount: user.activeDaysCount,
    consistencyPercentage: user.consistencyPercentage,
    monthlyActivityCount: user.monthlyActivityCount,
    yearlyActivityCount: user.yearlyActivityCount,
    activityStatus: user.activityStatus,
    certifications: user.certifications,
    achievements: user.achievements,
    hackathons: user.hackathons,
    projects: user.projects,
    workExperience: user.workExperience,
    resume: user.resume,
    isOnboarded: user.isOnboarded,
    mssid: user.mssid,
    bio: user.bio,
    graduationYear: user.graduationYear
  });
});

// Update academic + coding profile + HackerRank manual data
router.put('/me/profile', async (req, res) => {
  try {
    const user = req.currentUser;
    const {
      name,
      college,
      hostel,
      branch,
      year,
      overallGpa,
      leetcodeUsername,
      codechefUsername,
      gfgUsername,
      githubUsername,
      linkedinUrl,
      hackerrank,
      projects,
      workExperience,
      mssid,
      bio,
      graduationYear
    } = req.body;

    const {
      validateLeetCode,
      validateCodeChef,
      validateGeeksforGeeks,
      validateGitHub
    } = require('../services/validationService');

    const errors = {};

    // 1. Trim & validate name if provided
    let trimmedName = name;
    if (name !== undefined) {
      trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName) {
        errors.name = 'Name is required';
      }
    }

    // 2. Trim, uppercase & validate mssid if provided
    let trimmedMssid = mssid;
    if (mssid !== undefined) {
      trimmedMssid = typeof mssid === 'string' ? mssid.trim().toUpperCase() : '';
      // Only validate format and uniqueness if it changed from the current value
      if (trimmedMssid !== user.mssid) {
        if (!trimmedMssid) {
          errors.mssid = 'MSSID is required';
        } else {
          const mssidRegex = /^MSS\d{7}$/;
          if (!mssidRegex.test(trimmedMssid)) {
            errors.mssid = 'MSSID must be in the format MSS2020012';
          } else {
            // Check uniqueness against other users
            const existingMssid = await User.findOne({ mssid: trimmedMssid, _id: { $ne: user._id } });
            if (existingMssid) {
              errors.mssid = 'MSSID already exists';
            }
          }
        }
      }
    }

    // 3. Return structured error response if validation fails
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // 4. Perform platform username validations if they changed
    const trimmedLeetcode = leetcodeUsername !== undefined && typeof leetcodeUsername === 'string' ? leetcodeUsername.trim() : leetcodeUsername;
    const trimmedCodechef = codechefUsername !== undefined && typeof codechefUsername === 'string' ? codechefUsername.trim() : codechefUsername;
    const trimmedGfg = gfgUsername !== undefined && typeof gfgUsername === 'string' ? gfgUsername.trim() : gfgUsername;
    const trimmedGithub = githubUsername !== undefined && typeof githubUsername === 'string' ? githubUsername.trim() : githubUsername;

    if (trimmedLeetcode !== undefined && trimmedLeetcode !== user.leetcodeUsername) {
      if (trimmedLeetcode) {
        const isValid = await validateLeetCode(trimmedLeetcode);
        if (!isValid) {
          return res.status(400).json({ message: 'Invalid LeetCode username or profile does not exist' });
        }
        user.leetcodeUsername = trimmedLeetcode;
      } else {
        user.leetcodeUsername = undefined;
      }
    }

    if (trimmedCodechef !== undefined && trimmedCodechef !== user.codechefUsername) {
      if (trimmedCodechef) {
        const isValid = await validateCodeChef(trimmedCodechef);
        if (!isValid) {
          return res.status(400).json({ message: 'Invalid CodeChef username or profile does not exist' });
        }
        user.codechefUsername = trimmedCodechef;
      } else {
        user.codechefUsername = undefined;
      }
    }

    if (trimmedGfg !== undefined && trimmedGfg !== user.gfgUsername) {
      if (trimmedGfg) {
        const isValid = await validateGeeksforGeeks(trimmedGfg);
        if (!isValid) {
          return res.status(400).json({ message: 'Invalid GeeksforGeeks username or profile does not exist' });
        }
        user.gfgUsername = trimmedGfg;
      } else {
        user.gfgUsername = undefined;
      }
    }

    if (trimmedGithub !== undefined && trimmedGithub !== user.githubUsername) {
      if (trimmedGithub) {
        const isValid = await validateGitHub(trimmedGithub);
        if (!isValid) {
          return res.status(400).json({ message: 'Invalid GitHub username or profile does not exist' });
        }
        user.githubUsername = trimmedGithub;
        user.githubUrl = `https://github.com/${trimmedGithub}`;
      } else {
        user.githubUsername = undefined;
        user.githubUrl = undefined;
      }
    }

    if (trimmedName != null) user.name = trimmedName;
    if (college != null) user.college = typeof college === 'string' ? college.trim() : college;
    if (hostel != null) user.hostel = typeof hostel === 'string' ? hostel.trim() : hostel;
    if (branch != null) user.branch = typeof branch === 'string' ? branch.trim() : branch;
    if (year != null) user.year = typeof year === 'string' ? year.trim() : year;
    if (overallGpa != null) user.overallGpa = overallGpa;
    if (linkedinUrl != null) user.linkedinUrl = typeof linkedinUrl === 'string' ? linkedinUrl.trim() : linkedinUrl;
    if (trimmedMssid !== undefined) user.mssid = trimmedMssid;
    if (bio !== undefined) user.bio = typeof bio === 'string' ? bio.trim() : bio;
    if (graduationYear !== undefined) {
      const gYear = typeof graduationYear === 'string' ? graduationYear.trim() : graduationYear;
      user.graduationYear = gYear;
      user.year = gYear; // maintain year/graduationYear parity
    }

    if (hackerrank !== undefined) {
      if (hackerrank === null) {
        user.hackerrank = null;
      } else {
        user.hackerrank = {
          ...(user.hackerrank || {}),
          ...hackerrank
        };
      }
    }

    if (Array.isArray(projects)) {
      user.projects = projects;
    }

    if (Array.isArray(workExperience)) {
      user.workExperience = workExperience;
    }

    user.lastProfileUpdateAt = new Date();
    user.activityStatus = computeActivityStatus(user);

    await user.save();

    return res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// GET Student Timeline Event logs (recent 10)
router.get('/me/timeline', async (req, res) => {
  try {
    const Activity = require('../models/Activity');
    const activities = await Activity.find({ userId: req.currentUser._id })
      .sort({ timestamp: -1 })
      .limit(10);
    return res.json(activities);
  } catch (err) {
    console.error('Timeline error:', err);
    return res.status(500).json({ message: 'Failed to fetch timeline' });
  }
});

// GET Student Heatmap data (grouped by date)
router.get('/me/heatmap', async (req, res) => {
  try {
    const student = req.currentUser;
    const heatmap = {};
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 6);
    startDate.setHours(0, 0, 0, 0);

    const curr = new Date(startDate);
    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      heatmap[dateStr] = {
        date: dateStr,
        count: 0,
        platforms: { leetcode: 0, github: 0 },
        activities: []
      };
      curr.setDate(curr.getDate() + 1);
    }

    let lcCalendar = student.platformStats?.leetcode?.submissionCalendar || {};
    if (typeof lcCalendar === 'string') {
      try {
        lcCalendar = JSON.parse(lcCalendar);
      } catch (e) {
        lcCalendar = {};
      }
    }
    Object.entries(lcCalendar || {}).forEach(([timestamp, count]) => {
      try {
        const dateStr = new Date(Number(timestamp) * 1000).toISOString().split('T')[0];
        if (heatmap[dateStr] !== undefined) {
          heatmap[dateStr].count += Number(count);
          heatmap[dateStr].platforms.leetcode += Number(count);
        }
      } catch (e) { }
    });

    const ghContributions = student.platformStats?.github?.contributions || [];
    if (Array.isArray(ghContributions)) {
      ghContributions.forEach(item => {
        if (item && item.date) {
          const dateStr = item.date;
          if (heatmap[dateStr] !== undefined) {
            const c = Number(item.contributionCount || item.count || 0);
            heatmap[dateStr].count += c;
            heatmap[dateStr].platforms.github += c;
          }
        }
      });
    }

    const Activity = require('../models/Activity');
    const dbActivities = await Activity.find({
      userId: student._id,
      timestamp: { $gte: startDate }
    });

    dbActivities.forEach(act => {
      try {
        const dateStr = act.timestamp.toISOString().split('T')[0];
        if (heatmap[dateStr] !== undefined) {
          heatmap[dateStr].activities.push({
            id: act._id,
            platform: act.platform,
            type: act.type,
            title: act.title,
            link: act.link || '',
            timestamp: act.timestamp
          });
        }
      } catch (e) {}
    });

    return res.json(Object.values(heatmap).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (err) {
    console.error('Heatmap error:', err);
    return res.status(500).json({ message: 'Failed to fetch heatmap data' });
  }
});

// Helper to mark manual activity and recalc activity status
async function markManualActivity(user) {
  user.lastManualActivityAt = new Date();
  user.activityStatus = computeActivityStatus(user);
  await user.save();
}

// Add certification with optional file upload
router.post(
  '/me/certifications',
  upload.single('file'),
  async (req, res) => {
    try {
      const user = req.currentUser;
      const { title, issuer, date, credentialLink } = req.body;
      if (!title || !issuer) {
        return res.status(400).json({ message: 'Title and issuer are required' });
      }

      const { uploadResumeFile } = require('../services/storageService');
      const storageResult = req.file ? await uploadResumeFile(req.file) : null;

      const cert = {
        title,
        issuer,
        date: date ? new Date(date) : undefined,
        credentialLink,
        filePath: storageResult ? storageResult.url : undefined
      };

      user.certifications.push(cert);
      await markManualActivity(user);

      return res.status(201).json({ message: 'Certification added', certification: cert });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Add certification error', err);
      return res.status(500).json({ message: 'Failed to add certification' });
    }
  }
);

// Add achievement
router.post('/me/achievements', async (req, res) => {
  try {
    const user = req.currentUser;
    const { title, description, date, proofPath } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const achievement = {
      title,
      description,
      date: date ? new Date(date) : undefined,
      proofPath
    };

    user.achievements.push(achievement);
    await markManualActivity(user);

    return res.status(201).json({ message: 'Achievement added', achievement });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Add achievement error', err);
    return res.status(500).json({ message: 'Failed to add achievement' });
  }
});

// Add hackathon (with optional certificate upload)
router.post(
  '/me/hackathons',
  upload.single('certificate'),
  async (req, res) => {
    try {
      const user = req.currentUser;
      const { name, mode, teamType, role, outcome, date } = req.body;
      if (!name || !mode || !teamType) {
        return res
          .status(400)
          .json({ message: 'Name, mode (online/offline) and teamType (team/individual) are required' });
      }

      const { uploadResumeFile } = require('../services/storageService');
      const storageResult = req.file ? await uploadResumeFile(req.file) : null;

      const hackathon = {
        name,
        mode,
        teamType,
        role,
        outcome,
        date: date ? new Date(date) : undefined,
        certificatePath: storageResult ? storageResult.url : undefined
      };

      user.hackathons.push(hackathon);
      await markManualActivity(user);

      return res.status(201).json({ message: 'Hackathon added', hackathon });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Add hackathon error', err);
      return res.status(500).json({ message: 'Failed to add hackathon' });
    }
  }
);

// Add project (screenshots upload optional, use multiple files)
router.post(
  '/me/projects',
  upload.array('screenshots', 5),
  async (req, res) => {
    try {
      const user = req.currentUser;
      const { name, highlights, techStack, githubUrl, liveUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Project name is required' });
      }

      const { uploadBugScreenshot } = require('../services/storageService');
      const screenshotPaths = req.files && req.files.length > 0
        ? await Promise.all(req.files.map(async (f) => (await uploadBugScreenshot(f)).url))
        : [];

      const project = {
        name,
        highlights: Array.isArray(highlights) ? highlights.slice(0, 3) : [],
        techStack: Array.isArray(techStack)
          ? techStack
          : typeof techStack === 'string'
            ? techStack.split(',').map((s) => s.trim())
            : [],
        githubUrl,
        liveUrl,
        screenshotPaths
      };

      user.projects.push(project);
      await markManualActivity(user);

      return res.status(201).json({ message: 'Project added', project });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Add project error', err);
      return res.status(500).json({ message: 'Failed to add project' });
    }
  }
);

// Sync LeetCode & CodeChef, recompute scores & activity
router.post('/me/sync-platforms', async (req, res) => {
  try {
    const user = req.currentUser;
    const { force } = req.body || {};

    const updated = await syncPlatformsForUser(user, { force: Boolean(force) });

    return res.json({
      message: 'Platforms synced',
      platformStats: updated.platformStats,
      scores: updated.scores,
      activityStatus: updated.activityStatus
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Sync platforms error', err);
    return res.status(500).json({ message: 'Failed to sync platforms' });
  }
});

// Get resume preview JSON details
router.get('/me/resume', async (req, res) => {
  try {
    return res.json({ resumeUrl: '/api/student/me/resume/preview/raw' });
  } catch (err) {
    console.error('Get resume preview error:', err);
    return res.status(500).json({ message: 'Failed to get resume preview info' });
  }
});

// GET /me/resume/preview/raw - Stream default PDF inline (handles both manual and auto)
router.get('/me/resume/preview/raw', async (req, res) => {
  try {
    const user = req.currentUser;
    const mode = req.query.mode || user.resume?.mode || 'auto';

    if (mode === 'manual' && user.resume?.manualUrl) {
      if (/^https?:\/\//.test(user.resume.manualUrl)) {
        const axios = require('axios');
        const response = await axios.get(user.resume.manualUrl, { responseType: 'stream' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="manual-resume.pdf"');
        return response.data.pipe(res);
      }
    }

    // Builder mode preview
    const ResumeVersion = require('../models/ResumeVersion');
    const mongoose = require('mongoose');
    const versionId = req.query.versionId;
    const defaultVer = versionId && mongoose.Types.ObjectId.isValid(versionId)
      ? await ResumeVersion.findOne({ userId: user._id, _id: versionId })
      : await ResumeVersion.findOne({ userId: user._id, isDefault: true });
    const activeVersion = defaultVer || await ResumeVersion.findOne({ userId: user._id }).sort({ updatedAt: -1 });
    
    if (!activeVersion) {
      return res.status(404).json({ message: 'No resume version found' });
    }

    const { buildResumePdfBuffer } = require('../services/resumeService');
    const buffer = await buildResumePdfBuffer(user, {
      template: activeVersion.templateKey,
      sections: activeVersion.layout?.sectionsOrder,
      hiddenSections: activeVersion.layout?.hiddenSections || [],
      content: activeVersion.content
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume-preview.pdf"');
    return res.send(buffer);
  } catch (err) {
    console.error('Preview resume raw error:', err);
    return res.status(500).json({ message: 'Failed to preview resume' });
  }
});

// Upload manual resume (PDF)
router.post(
  '/me/resume/manual',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Resume PDF file is required' });
      }

      const user = req.currentUser;

      // Clean up previous manual resume file from Cloudinary to avoid garbage accumulation
      if (user.resume?.manualPublicId) {
        const { deleteResumeFile } = require('../services/storageService');
        try {
          await deleteResumeFile(user.resume.manualPublicId);
        } catch (delErr) {
          console.error('Failed to delete old manual resume from Cloudinary:', delErr);
        }
      }

      const { uploadResumeFile } = require('../services/storageService');
      const storageResult = await uploadResumeFile(req.file);

      user.resume = {
        ...(user.resume || {}),
        mode: 'manual',
        manualUrl: storageResult.url,
        manualPublicId: storageResult.publicId,
        uploadedAt: new Date()
      };
      await markManualActivity(user);

      return res.status(201).json({ message: 'Manual resume uploaded', resume: user.resume });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload manual resume error', err);
      return res.status(500).json({ message: 'Failed to upload manual resume' });
    }
  }
);

module.exports = router;

