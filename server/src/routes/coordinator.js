const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware, requireRole('coordinator'));

// Dashboard summary: total students, active vs inactive, platform-wise stats (individual, not summed)
router.get('/dashboard', async (req, res) => {
  try {
    const studentsMatch = { role: 'student', isOnboarded: true };

    const [totalStudents, activeCount, inactiveCount] = await Promise.all([
      User.countDocuments(studentsMatch),
      User.countDocuments({ ...studentsMatch, activityStatus: 'active' }),
      User.countDocuments({ ...studentsMatch, activityStatus: 'inactive' })
    ]);

    const stats = await User.aggregate([
      { $match: studentsMatch },
      {
        $group: {
          _id: null,
          lcTotalProblems: { $sum: { $ifNull: ["$platformStats.leetcode.problemsSolved", 0] } },
          ccTotalProblems: { $sum: { $ifNull: ["$platformStats.codechef.problemsSolved", 0] } },
          ccTotalContests: { $sum: { $ifNull: ["$platformStats.codechef.contestCount", 0] } },
          hrTotalBadges: { $sum: { $ifNull: ["$hackerrank.badgeCount", 0] } }
        }
      }
    ]);

    const aggregated = stats[0] || {
      lcTotalProblems: 0,
      ccTotalProblems: 0,
      ccTotalContests: 0,
      hrTotalBadges: 0
    };

    const readinessStats = await User.aggregate([
      { $match: studentsMatch },
      {
        $project: {
          activityStatus: 1,
          totalSolved: {
            $add: [
              { $ifNull: ["$platformStats.leetcode.problemsSolved", 0] },
              { $ifNull: ["$platformStats.codechef.problemsSolved", 0] },
              { $ifNull: ["$platformStats.geeksforgeeks.problemsSolved", 0] },
              { $ifNull: ["$hackerrank.totalProblemsSolved", 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          readyCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$totalSolved", 300] },
                    { $eq: ["$activityStatus", "active"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          needsImprovementCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$totalSolved", 100] },
                    { $lt: ["$totalSolved", 300] }
                  ]
                },
                1,
                0
              ]
            }
          },
          atRiskCount: {
            $sum: {
              $cond: [
                { $lt: ["$totalSolved", 100] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const readiness = readinessStats[0] || { readyCount: 0, needsImprovementCount: 0, atRiskCount: 0 };

    const platformStats = {
      leetcode: {
        totalProblems: aggregated.lcTotalProblems
      },
      codechef: {
        totalProblems: aggregated.ccTotalProblems,
        totalContests: aggregated.ccTotalContests
      },
      hackerrank: {
        totalBadges: aggregated.hrTotalBadges
      }
    };

    return res.json({
      totalStudents,
      activeCount,
      inactiveCount,
      readyCount: readiness.readyCount,
      needsImprovementCount: readiness.needsImprovementCount,
      atRiskCount: readiness.atRiskCount,
      platformStats
    });
  } catch (err) {
    console.error('Coordinator dashboard error', err);
    return res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// Students list with pagination, filters & search
router.get('/students', async (req, res) => {
  try {
    const {
      status,       // 'active' | 'inactive'
      readiness,    // 'ready' | 'needs_improvement' | 'at_risk'
      branch,
      college,
      year,
      hostel,
      name,
      page = 1,
      limit = 10,
      sortBy = 'scores.totalScore',
      sortOrder = 'desc'
    } = req.query;

    const filter = { role: 'student', isOnboarded: true };

    if (branch) filter.branch = String(branch);
    if (college) filter.college = String(college);
    if (year) filter.year = String(year);
    if (hostel) filter.hostel = String(hostel);

    if (status) {
      filter.activityStatus = String(status);
    }

    if (name) {
      const escapedName = String(name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.name = new RegExp(escapedName, 'i');
    }

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          totalSolved: {
            $add: [
              { $ifNull: ["$platformStats.leetcode.problemsSolved", 0] },
              { $ifNull: ["$platformStats.codechef.problemsSolved", 0] },
              { $ifNull: ["$platformStats.geeksforgeeks.problemsSolved", 0] },
              { $ifNull: ["$hackerrank.totalProblemsSolved", 0] }
            ]
          }
        }
      }
    ];

    if (readiness === 'ready') {
      pipeline.push({
        $match: {
          totalSolved: { $gte: 300 },
          activityStatus: 'active'
        }
      });
    } else if (readiness === 'needs_improvement') {
      pipeline.push({
        $match: {
          totalSolved: { $gte: 100, $lt: 300 }
        }
      });
    } else if (readiness === 'at_risk') {
      pipeline.push({
        $match: {
          totalSolved: { $lt: 100 }
        }
      });
    }

    const countPipeline = [...pipeline, { $count: "count" }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.count || 0;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sort });

    const skip = (Number(page) - 1) * Number(limit);
    pipeline.push({ $skip: skip }, { $limit: Number(limit) });

    const students = await User.aggregate(pipeline);

    const ResumeVersion = require('../models/ResumeVersion');
    const ResumeFile = require('../models/ResumeFile');
    
    const studentIds = students.map(s => s._id);
    const [defaultVersions, defaultFiles] = await Promise.all([
      ResumeVersion.find({ userId: { $in: studentIds }, isDefault: true }),
      ResumeFile.find({ userId: { $in: studentIds }, isDefault: true })
    ]);

    const versionsMap = new Map(defaultVersions.map(v => [String(v.userId), v]));
    const filesMap = new Map(defaultFiles.map(f => [String(f.userId), f]));

    const studentsList = students.map((s) => {
      const dVersion = versionsMap.get(String(s._id));
      const dFile = filesMap.get(String(s._id));
      
      let resumeInfo = { hasResume: false, score: 0, atsScore: 0, type: 'none' };
      if (dFile) {
        resumeInfo = { hasResume: true, score: 100, atsScore: 85, type: 'uploaded', id: dFile._id };
      } else if (dVersion) {
        resumeInfo = { hasResume: true, score: dVersion.completenessScore || 0, atsScore: dVersion.atsScore || 70, type: 'builder', id: dVersion._id };
      }

      return {
        id: s._id,
        name: s.name,
        email: s.email,
        college: s.college,
        hostel: s.hostel,
        branch: s.branch,
        year: s.year,
        score: s.scores?.totalScore || 0,
        scores: s.scores,
        activityStatus: s.activityStatus,
        platforms: {
          leetcode: !!s.leetcodeUsername,
          codechef: !!s.codechefUsername,
          hackerrank: !!(s.hackerrank && s.hackerrank.username)
        },
        resumeInfo
      };
    });

    const allStudents = await User.find({ role: 'student', isOnboarded: true });
    const colleges = [...new Set(allStudents.map((s) => s.college).filter(Boolean))];
    const branches = [...new Set(allStudents.map((s) => s.branch).filter(Boolean))];
    const years = [...new Set(allStudents.map((s) => s.year).filter(Boolean))].sort();

    return res.json({
      students: studentsList,
      total,
      page: Number(page),
      limit: Number(limit),
      filters: { colleges, branches, years }
    });
  } catch (err) {
    console.error('Coordinator students list error', err);
    return res.status(500).json({ message: 'Failed to load students' });
  }
});

// Export student data
router.get('/export-data', async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isOnboarded: true }).sort({ name: 1 });

    const exportData = students.map(s => {
      const lc = s.platformStats?.leetcode || {};
      const cc = s.platformStats?.codechef || {};
      const gfg = s.platformStats?.geeksforgeeks || {};
      const gh = s.platformStats?.github || {};

      const totalSolved = (lc.problemsSolved || 0) + (cc.problemsSolved || 0) + (gfg.problemsSolved || 0) + (s.hackerrank?.totalProblemsSolved || 0);

      return {
        Name: s.name,
        Email: s.email,
        MSSID: s.mssid || '',
        College: s.college || '',
        Hostel: s.hostel || '',
        Branch: s.branch || '',
        Year: s.year || '',
        ActivityStatus: s.activityStatus || 'inactive',
        OverallScore: s.scores?.totalScore || 0,
        ReadinessScore: s.scores?.weightedRankScore || 0,
        TotalSolved: totalSolved,
        LeetCodeUsername: s.leetcodeUsername || '',
        LeetCodeSolved: lc.problemsSolved || 0,
        LeetCodeRating: lc.rating || 0,
        CodeChefUsername: s.codechefUsername || '',
        CodeChefSolved: cc.problemsSolved || 0,
        CodeChefRating: cc.currentRating || cc.rating || 0,
        CodeChefContests: cc.contestCount || 0,
        GFGUsername: s.gfgUsername || '',
        GFGSolved: gfg.problemsSolved || 0,
        GitHubUsername: s.githubUsername || '',
        GitHubRepos: gh.reposCount || 0,
        GitHubContributions: gh.contributions?.length || 0
      };
    });

    return res.json(exportData);
  } catch (err) {
    console.error('Coordinator export data error:', err);
    return res.status(500).json({ message: 'Failed to export student data' });
  }
});

// View a full student profile (read-only)
router.get('/students/:id', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.json(student);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Coordinator student profile error', err);
    return res.status(500).json({ message: 'Failed to load student profile' });
  }
});

// GET student timeline for coordinator
router.get('/students/:id/timeline', async (req, res) => {
  try {
    const Activity = require('../models/Activity');
    const activities = await Activity.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(10);
    return res.json(activities);
  } catch (err) {
    console.error('Coordinator student timeline error:', err);
    return res.status(500).json({ message: 'Failed to fetch timeline' });
  }
});

// GET student heatmap for coordinator
router.get('/students/:id/heatmap', async (req, res) => {
  try {
    const Activity = require('../models/Activity');
    const activities = await Activity.find({ userId: req.params.id })
      .sort({ timestamp: 1 });

    const heatmap = {};
    activities.forEach(act => {
      const dateStr = new Date(act.timestamp).toISOString().split('T')[0];
      if (!heatmap[dateStr]) {
        heatmap[dateStr] = {
          date: dateStr,
          count: 0,
          activities: []
        };
      }
      heatmap[dateStr].count += 1;
      heatmap[dateStr].activities.push({
        platform: act.platform,
        type: act.type,
        title: act.title,
        link: act.link,
        timestamp: act.timestamp
      });
    });

    return res.json(Object.values(heatmap));
  } catch (err) {
    console.error('Coordinator student heatmap error:', err);
    return res.status(500).json({ message: 'Failed to fetch heatmap' });
  }
});

// GET student resume for coordinator
router.get('/students/:id/resume', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const ResumeFile = require('../models/ResumeFile');
    const ResumeVersion = require('../models/ResumeVersion');

    const defaultFile = await ResumeFile.findOne({ userId: studentId, isDefault: true });
    if (defaultFile) {
      if (defaultFile.storagePath.startsWith('http')) {
        return res.redirect(defaultFile.storagePath);
      }
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'uploads', defaultFile.storagePath);
      return res.sendFile(filePath);
    }

    const defaultVersion = await ResumeVersion.findOne({ userId: studentId, isDefault: true });
    if (defaultVersion) {
      const { buildResumePdfBuffer } = require('../services/resumeService');
      const buffer = await buildResumePdfBuffer(student, {
        template: defaultVersion.templateKey,
        sections: defaultVersion.layout?.sectionsOrder,
        hiddenSections: defaultVersion.layout?.hiddenSections || [],
        content: defaultVersion.content
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="codetrack-resume-${studentId}.pdf"`);
      return res.send(buffer);
    }

    // Legacy fallback
    if (student.resume?.mode === 'manual' && student.resume?.manualPath) {
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'uploads', student.resume.manualPath);
      return res.sendFile(filePath);
    }

    return res.status(404).json({ message: 'Default resume not found or hidden by the student' });
  } catch (err) {
    console.error('Coordinator student resume error:', err);
    return res.status(500).json({ message: 'Failed to generate student resume' });
  }
});

// GET /students/:id/resumes - List all resumes of student for coordinator
router.get('/students/:id/resumes', async (req, res) => {
  try {
    const studentId = req.params.id;
    const ResumeVersion = require('../models/ResumeVersion');
    const ResumeFile = require('../models/ResumeFile');

    // Only fetch resumes marked as default
    const [generated, uploaded] = await Promise.all([
      ResumeVersion.find({ userId: studentId, isDefault: true }).sort({ updatedAt: -1 }),
      ResumeFile.find({ userId: studentId, isDefault: true }).sort({ uploadedAt: -1 })
    ]);

    return res.json({ generated, uploaded });
  } catch (err) {
    console.error('Coordinator student resumes list error:', err);
    return res.status(500).json({ message: 'Failed to fetch student resumes list' });
  }
});

// GET /students/:id/resumes/:resumeId/download - Download a specific student resume
router.get('/students/:id/resumes/:resumeId/download', async (req, res) => {
  try {
    const studentId = req.params.id;
    const resumeId = req.params.resumeId;
    const ResumeFile = require('../models/ResumeFile');
    const ResumeVersion = require('../models/ResumeVersion');
    const User = require('../models/User');

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 1. Try finding as uploaded file
    const file = await ResumeFile.findOne({ _id: resumeId, userId: studentId });
    if (file) {
      if (!file.isDefault) {
        return res.status(403).json({ message: 'Unauthorized: This resume is hidden by the student' });
      }
      if (file.storagePath.startsWith('http')) {
        return res.redirect(file.storagePath);
      }
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'uploads', file.storagePath);
      return res.sendFile(filePath);
    }

    // 2. Try finding as builder version
    const version = await ResumeVersion.findOne({ _id: resumeId, userId: studentId });
    if (!version) {
      return res.status(404).json({ message: 'Resume document not found' });
    }

    if (!version.isDefault) {
      return res.status(403).json({ message: 'Unauthorized: This resume is hidden by the student' });
    }

    const { buildResumePdfBuffer } = require('../services/resumeService');
    const buffer = await buildResumePdfBuffer(student, {
      template: version.templateKey,
      sections: version.layout?.sectionsOrder,
      hiddenSections: version.layout?.hiddenSections || [],
      content: version.content
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${version.name.toLowerCase().replace(/\s+/g, '-')}.pdf"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Coordinator student resume download error:', err);
    return res.status(500).json({ message: 'Failed to download resume document' });
  }
});

// GET /students/:id/resume-analytics - Coordinator view of student resume statistics
router.get('/students/:id/resume-analytics', async (req, res) => {
  try {
    const studentId = req.params.id;
    const ResumeVersion = require('../models/ResumeVersion');
    const ResumeFile = require('../models/ResumeFile');

    // Fetch default builder version or default uploaded file
    const [defaultVersion, defaultFile] = await Promise.all([
      ResumeVersion.findOne({ userId: studentId, isDefault: true }),
      ResumeFile.findOne({ userId: studentId, isDefault: true })
    ]);

    if (defaultFile) {
      return res.json({
        type: 'uploaded',
        fileName: defaultFile.originalName,
        uploadedAt: defaultFile.uploadedAt,
        completenessScore: 100,
        atsScore: 85, // placeholder
        missingSections: [],
        lastUpdated: defaultFile.uploadedAt
      });
    }

    const activeVersion = defaultVersion || await ResumeVersion.findOne({ userId: studentId }).sort({ updatedAt: -1 });

    if (!activeVersion) {
      return res.json({
        type: 'none',
        completenessScore: 0,
        atsScore: 0,
        missingSections: ['All sections'],
        lastUpdated: null
      });
    }

    // Calculate missing sections based on visibility/content
    const missing = [];
    const content = activeVersion.content || {};
    if (!content.personalDetails?.summary) missing.push('Summary');
    if (!content.education || content.education.length === 0) missing.push('Education');
    if (!content.skills || content.skills.length === 0) missing.push('Skills');
    if (!content.projects || content.projects.length === 0) missing.push('Projects');
    if (!content.workExperience || content.workExperience.length === 0) missing.push('Experience');

    return res.json({
      type: 'builder',
      name: activeVersion.name,
      completenessScore: activeVersion.completenessScore || 0,
      atsScore: activeVersion.atsScore || 70,
      missingSections: missing,
      lastUpdated: activeVersion.updatedAt
    });
  } catch (err) {
    console.error('Coordinator student resume analytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch resume analytics' });
  }
});

// Sync platforms for a specific student (triggered by coordinator)
router.post('/students/:id/sync', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { syncPlatformsForUser } = require('../services/platformSyncService');
    const result = await syncPlatformsForUser(student._id, true);

    return res.json({ message: 'Sync complete', result });
  } catch (err) {
    console.error('Coordinator student sync error:', err);
    return res.status(500).json({ message: err.message || 'Sync failed' });
  }
});

module.exports = router;

