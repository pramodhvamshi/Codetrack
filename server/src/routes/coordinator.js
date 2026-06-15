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
      currentYear,
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
    if (hostel) filter.hostel = String(hostel);

    let queryYear = year;
    if (currentYear) {
      if (currentYear === '1st Year') queryYear = '1';
      else if (currentYear === '2nd Year') queryYear = '2';
      else if (currentYear === '3rd Year') queryYear = '3';
      else if (currentYear === '4th Year') queryYear = '4';
      else if (currentYear !== 'All Years') queryYear = currentYear;
    }
    if (queryYear) filter.year = String(queryYear);

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

    // Construct the pipeline stages before sort/skip/limit for summary metrics
    const summaryStatsPipeline = [
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
      summaryStatsPipeline.push({
        $match: {
          totalSolved: { $gte: 300 },
          activityStatus: 'active'
        }
      });
    } else if (readiness === 'needs_improvement') {
      summaryStatsPipeline.push({
        $match: {
          totalSolved: { $gte: 100, $lt: 300 }
        }
      });
    } else if (readiness === 'at_risk') {
      summaryStatsPipeline.push({
        $match: {
          totalSolved: { $lt: 100 }
        }
      });
    }

    summaryStatsPipeline.push({
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        avgCodingScore: { $avg: { $ifNull: ["$scores.weightedRankScore", 0] } },
        totalLeetCodeSolved: { $sum: { $ifNull: ["$platformStats.leetcode.problemsSolved", 0] } },
        totalGFGSolved: { $sum: { $ifNull: ["$platformStats.geeksforgeeks.totalProblemsSolved", "$platformStats.geeksforgeeks.problemsSolved", 0] } },
        totalCodeChefSolved: { $sum: { $ifNull: ["$platformStats.codechef.problemsSolved", 0] } },
        avgLeetCodeSolved: { $avg: { $ifNull: ["$platformStats.leetcode.problemsSolved", 0] } },
        avgGFGSolved: { $avg: { $ifNull: ["$platformStats.geeksforgeeks.totalProblemsSolved", "$platformStats.geeksforgeeks.problemsSolved", 0] } },
        avgCodeChefSolved: { $avg: { $ifNull: ["$platformStats.codechef.problemsSolved", 0] } }
      }
    });

    const summaryResult = await User.aggregate(summaryStatsPipeline);
    const summary = summaryResult[0] || {
      totalStudents: 0,
      avgCodingScore: 0,
      totalLeetCodeSolved: 0,
      totalGFGSolved: 0,
      totalCodeChefSolved: 0,
      avgLeetCodeSolved: 0,
      avgGFGSolved: 0,
      avgCodeChefSolved: 0
    };

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
        mssid: s.mssid || '',
        college: s.college,
        hostel: s.hostel,
        branch: s.branch,
        year: s.year,
        currentYear: s.year === '1' ? '1st Year' : s.year === '2' ? '2nd Year' : s.year === '3' ? '3rd Year' : s.year === '4' ? '4th Year' : `${s.year} Year`,
        score: s.scores?.totalScore || 0,
        scores: s.scores,
        leetcodeSolved: s.platformStats?.leetcode?.problemsSolved || s.platformStats?.leetcode?.totalSolved || 0,
        gfgSolved: s.platformStats?.geeksforgeeks?.totalProblemsSolved || s.platformStats?.geeksforgeeks?.problemsSolved || 0,
        codechefSolved: s.platformStats?.codechef?.problemsSolved || 0,
        githubRepos: s.platformStats?.github?.reposCount || 0,
        codingScore: s.scores?.weightedRankScore || 0,
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
    const currentYears = years.map(y => y === '1' ? '1st Year' : y === '2' ? '2nd Year' : y === '3' ? '3rd Year' : y === '4' ? '4th Year' : `${y} Year`);

    return res.json({
      students: studentsList,
      total,
      page: Number(page),
      limit: Number(limit),
      summary: {
        totalStudents: summary.totalStudents || 0,
        avgCodingScore: Math.round(summary.avgCodingScore || 0),
        totalLeetCodeSolved: summary.totalLeetCodeSolved || 0,
        totalGFGSolved: summary.totalGFGSolved || 0,
        totalCodeChefSolved: summary.totalCodeChefSolved || 0,
        avgLeetCodeSolved: Math.round(summary.avgLeetCodeSolved || 0),
        avgGFGSolved: Math.round(summary.avgGFGSolved || 0),
        avgCodeChefSolved: Math.round(summary.avgCodeChefSolved || 0)
      },
      filters: { colleges, branches, years, currentYears }
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
        GFGSolved: gfg.totalProblemsSolved || gfg.problemsSolved || 0,
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

// GET student heatmap for coordinator (complete activity aggregates)
router.get('/students/:id/heatmap', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

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
    console.error('Coordinator student heatmap error:', err);
    return res.status(500).json({ message: 'Failed to fetch heatmap' });
  }
});

// GET student resume preview details for coordinator
router.get('/students/:id/resume', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const ResumeFile = require('../models/ResumeFile');
    const ResumeVersion = require('../models/ResumeVersion');

    const rootUrl = `${req.protocol}://${req.get('host')}`;
    let resumeUrl = null;

    // 1. Check manual uploaded default resume
    const defaultFile = await ResumeFile.findOne({ userId: studentId, isDefault: true });
    if (defaultFile) {
      const url = defaultFile.resumeUrl || defaultFile.storagePath;
      if (url && /^https?:\/\//i.test(url)) {
        resumeUrl = url;
      }
    }

    // 2. Check manual mode manualUrl fallback
    if (!resumeUrl && student.resume?.mode === 'manual' && student.resume?.manualUrl) {
      if (/^https?:\/\//i.test(student.resume.manualUrl)) {
        resumeUrl = student.resume.manualUrl;
      }
    }

    // 3. Otherwise builder version
    if (!resumeUrl) {
      const defaultVersion = await ResumeVersion.findOne({ userId: studentId, isDefault: true });
      const activeVersion = defaultVersion || await ResumeVersion.findOne({ userId: studentId }).sort({ updatedAt: -1 });

      if (activeVersion) {
        resumeUrl = `${rootUrl}/api/coordinator/students/${studentId}/resumes/${activeVersion._id}/preview`;
      }
    }

    if (!resumeUrl) {
      return res.status(404).json({ message: 'No default resume found for this student' });
    }

    console.log("Coordinator Preview URL:", resumeUrl);
    return res.json({ resumeUrl });
  } catch (err) {
    console.error('Coordinator student resume error:', err);
    return res.status(500).json({ message: 'Failed to generate student resume preview' });
  }
});

// GET /students/:id/resumes/:resumeId/preview - Stream generated builder PDF inline for coordinator
router.get('/students/:id/resumes/:resumeId/preview', async (req, res) => {
  try {
    const studentId = req.params.id;
    const resumeId = req.params.resumeId;
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const ResumeVersion = require('../models/ResumeVersion');
    const version = await ResumeVersion.findOne({ _id: resumeId, userId: studentId });
    if (!version) {
      return res.status(404).json({ message: 'Resume document not found' });
    }

    // Restrict coordinator to default/active resume
    if (!version.isDefault) {
      return res.status(403).json({ message: 'Unauthorized: This resume is not the default version' });
    }

    const { buildResumePdfBuffer } = require('../services/resumeService');
    const buffer = await buildResumePdfBuffer(student, {
      template: version.templateKey,
      sections: version.layout?.sectionsOrder,
      hiddenSections: version.layout?.hiddenSections || [],
      content: version.content
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume-preview.pdf"');
    return res.send(buffer);
  } catch (err) {
    console.error('Coordinator student resume preview error:', err);
    return res.status(500).json({ message: 'Failed to preview student resume' });
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

      // Use resumeUrl if available (Cloudinary / remote URL)
      if (file.resumeUrl && /^https?:\/\//.test(file.resumeUrl)) {
        return res.redirect(file.resumeUrl);
      }

      // Let's also support storagePath if it starts with http
      if (file.storagePath && /^https?:\/\//.test(file.storagePath)) {
        return res.redirect(file.storagePath);
      }

      return res.status(404).json({ message: 'Resume file URL not found or invalid' });
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

    const safeName = encodeURIComponent((version.title || 'resume').toLowerCase().replace(/\s+/g, '-'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + safeName + '.pdf"');
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
