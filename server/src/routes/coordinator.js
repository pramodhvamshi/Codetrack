const express = require('express');
const { authMiddleware, requireAnyRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware, requireAnyRole(['coordinator', 'admin']));

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

    if (currentYear && currentYear !== 'All Years') {
      filter.currentYear = String(currentYear);
    } else if (year) {
      const mapped = year === '1' ? '1st Year' : year === '2' ? '2nd Year' : year === '3' ? '3rd Year' : year === '4' ? '4th Year' : year;
      filter.currentYear = String(mapped);
    }

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

    let skip = 0;
    let parsedLimit = 10;
    if (limit === 'all' || limit === 'All') {
      parsedLimit = 1000000;
    } else {
      parsedLimit = Number(limit) || 10;
      skip = (Number(page) - 1) * parsedLimit;
    }

    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    pipeline.push({ $limit: parsedLimit });

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
        year: s.currentYear || (s.year === '1' ? '1st Year' : s.year === '2' ? '2nd Year' : s.year === '3' ? '3rd Year' : s.year === '4' ? '4th Year' : s.year),
        currentYear: s.currentYear || (s.year === '1' ? '1st Year' : s.year === '2' ? '2nd Year' : s.year === '3' ? '3rd Year' : s.year === '4' ? '4th Year' : s.year),
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
    const years = [...new Set(allStudents.map((s) => s.currentYear || (s.year === '1' ? '1st Year' : s.year === '2' ? '2nd Year' : s.year === '3' ? '3rd Year' : s.year === '4' ? '4th Year' : s.year)).filter(Boolean))].sort();
    const currentYears = years;

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

    const StudentProfile = require('../models/StudentProfile');
    const CodingProfile = require('../models/CodingProfile');
    const AcademicProfile = require('../models/AcademicProfile');
    
    const profile = await StudentProfile.findOne({ userId: student._id });
    const codingProfile = await CodingProfile.findOne({ userId: student._id });
    const academic = await AcademicProfile.findOne({ userId: student._id });
    const resolvedGpa = academic?.cgpa != null ? academic.cgpa : student.overallGpa;

    return res.json({
      student,
      id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      college: student.college,
      hostel: student.hostel,
      branch: student.branch,
      year: student.year,
      currentYear: student.currentYear || '1st Year',
      overallGpa: resolvedGpa,
      academicProfile: academic || {
        sgpa1: null,
        sgpa2: null,
        sgpa3: null,
        sgpa4: null,
        sgpa5: null,
        sgpa6: null,
        cgpa: null,
        backlogs: 0,
        academicStatus: '-'
      },
      leetcodeUsername: student.leetcodeUsername,
      codechefUsername: student.codechefUsername,
      gfgUsername: student.gfgUsername,
      githubUsername: student.githubUsername,
      hackerrankUsername: student.hackerrankUsername,
      githubUrl: student.githubUrl,
      linkedinUrl: student.linkedinUrl,
      hackerrank: student.hackerrank,
      platformStats: student.platformStats,
      scores: student.scores,
      currentStreak: student.currentStreak,
      longestStreak: student.longestStreak,
      activeDaysCount: student.activeDaysCount,
      consistencyPercentage: student.consistencyPercentage,
      activityStatus: student.activityStatus,
      
      // From StudentProfile
      personalDetails: profile?.personalDetails || {},
      familyDetails: profile?.familyDetails || {},
      education: profile?.education || [],
      skills: profile?.skills || [],
      projects: profile?.projects || [],
      experiences: profile?.experiences || [],
      certifications: profile?.certifications || [],
      profileCompletion: profile?.profileCompletion || 0,
      readinessProfile: profile?.readinessProfile || {},
      
      // From CodingProfile
      codingProfile: codingProfile || {}
    });
  } catch (err) {
    console.error('Coordinator student profile error', err);
    return res.status(500).json({ message: 'Failed to load student profile' });
  }
});

// GET /students/:id/report/pdf
router.get('/students/:id/report/pdf', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const StudentProfile = require('../models/StudentProfile');
    const CodingProfile = require('../models/CodingProfile');
    const AcademicProfile = require('../models/AcademicProfile');
    const ResumeVersion = require('../models/ResumeVersion');
    const ResumeFile = require('../models/ResumeFile');

    const profile = await StudentProfile.findOne({ userId: student._id });
    const codingProfile = await CodingProfile.findOne({ userId: student._id });
    const academic = await AcademicProfile.findOne({ userId: student._id });
    
    if (academic && academic.cgpa !== null) {
      student.overallGpa = academic.cgpa;
    }

    const { buildStudentReportPdf } = require('../utils/pdfReport');
    const WeeklySnapshot = require('../models/WeeklySnapshot');
    const ContestSnapshot = require('../models/ContestSnapshot');
    const LeetCodeGrowthSnapshot = require('../models/LeetCodeGrowthSnapshot');

    const weeklySnapshots = await WeeklySnapshot.find({ userId: student._id }).sort({ weekKey: 1 });
    const contestSnapshots = await ContestSnapshot.find({ userId: student._id }).sort({ monthKey: 1 });
    const leetcodeGrowthSnapshots = await LeetCodeGrowthSnapshot.find({ userId: student._id }).sort({ weekKey: 1 });

    const defaultResume = await ResumeVersion.findOne({ userId: student._id, isDefault: true })
      || await ResumeVersion.findOne({ userId: student._id }).sort({ updatedAt: -1 });
    const defaultFile = await ResumeFile.findOne({ userId: student._id, isDefault: true });

    // Download/Resolve Profile Photo Buffer
    let photoUrl = student.profilePhoto || profile?.personalDetails?.profilePhoto || student.avatar;
    if (!photoUrl && student.githubUsername) {
      photoUrl = `https://github.com/${student.githubUsername}.png?size=150`;
    }
    
    let photoBuffer = null;
    if (photoUrl && /^https?:\/\//i.test(photoUrl)) {
      try {
        const axios = require('axios');
        const resPhoto = await axios.get(photoUrl, { responseType: 'arraybuffer', timeout: 5000 });
        photoBuffer = Buffer.from(resPhoto.data);
      } catch (photoErr) {
        console.error('Failed to download student profile photo:', photoErr.message);
      }
    }

    const reportBuffer = await buildStudentReportPdf(student, profile, codingProfile, {
      academic,
      weeklySnapshots,
      contestSnapshots,
      leetcodeGrowthSnapshots,
      defaultResume,
      photoBuffer
    });

    let finalBuffer = reportBuffer;
    const appendResume = req.query.appendResume !== 'false';

    if (appendResume) {
      try {
        let resumeBuffer = null;
        if (defaultResume) {
          const { buildResumePdfBuffer } = require('../services/resumeService');
          try {
            resumeBuffer = await buildResumePdfBuffer(student, {
              template: defaultResume.templateKey,
              sections: defaultResume.layout?.sectionsOrder,
              hiddenSections: defaultResume.layout?.hiddenSections || [],
              content: defaultResume.content
            });
            console.log('Successfully generated resume PDF buffer from Resume Builder content.');
          } catch (builderErr) {
            console.error('Failed to build resume from Resume Builder content:', builderErr.message);
          }
        }

        // Fallback to Cloudinary PDF download if builder fails or doesn't exist
        if (!resumeBuffer && defaultFile && defaultFile.resumeUrl && /^https?:\/\//i.test(defaultFile.resumeUrl)) {
          try {
            const axios = require('axios');
            const resDownload = await axios.get(defaultFile.resumeUrl, { responseType: 'arraybuffer', timeout: 8000 });
            resumeBuffer = Buffer.from(resDownload.data);
            console.log('Successfully downloaded resume PDF buffer from Cloudinary.');
          } catch (downloadErr) {
            console.error('Failed to download resume from Cloudinary:', downloadErr.message);
          }
        }

        if (resumeBuffer) {
          const { PDFDocument } = require('pdf-lib');
          const doc1 = await PDFDocument.load(reportBuffer);
          const doc2 = await PDFDocument.load(resumeBuffer);
          const mergedDoc = await PDFDocument.create();
          
          const pages1 = await mergedDoc.copyPages(doc1, doc1.getPageIndices());
          pages1.forEach(p => mergedDoc.addPage(p));
          const pages2 = await mergedDoc.copyPages(doc2, doc2.getPageIndices());
          pages2.forEach(p => mergedDoc.addPage(p));
          
          finalBuffer = Buffer.from(await mergedDoc.save());
          console.log('Successfully merged report card PDF and student resume.');
        }
      } catch (mergeErr) {
        console.error('Dynamic PDF merge skipped or failed:', mergeErr.message);
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${student.name}.pdf"`);
    return res.send(finalBuffer);
  } catch (err) {
    console.error('Coordinator student report card PDF generation error:', err);
    return res.status(500).json({ message: 'Failed to generate report card PDF' });
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

// Helper to get start of week (Monday)
function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper to get month key
function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7); // "YYYY-MM"
}

// Build pipeline for report filtering
const buildBaseQueryPipeline = (filters) => {
  const { college, branch, currentYear, section, mentorName, gender, search } = filters;
  const match = { role: 'student', isOnboarded: true };
  if (college) match.college = college;
  if (branch) match.branch = branch;
  if (currentYear) match.currentYear = currentYear;

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'studentprofiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'academicprofiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'academic'
      }
    },
    { $unwind: { path: '$academic', preserveNullAndEmptyArrays: true } }
  ];

  // Apply profile sub-document filters
  if (section) {
    pipeline.push({ $match: { 'profile.personalDetails.section': section } });
  }
  if (mentorName) {
    pipeline.push({ $match: { 'profile.personalDetails.mentorName': mentorName } });
  }
  if (gender) {
    pipeline.push({ $match: { 'profile.personalDetails.gender': gender } });
  }

  // Multi-field search
  if (search) {
    const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { mssid: regex },
          { 'profile.personalDetails.rollNumber': regex }
        ]
      }
    });
  }

  return pipeline;
};

// Helper to format values or return a fallback
const formatVal = (val, dec = 2, fallback = 'N/A') => {
  if (val === undefined || val === null || val === '' || isNaN(val)) return fallback;
  return Number(val).toFixed(dec);
};

// Shared student-to-row mapping function for API and Excel exports
const mapStudentToRow = (s, reportType, solved30DaysMap, lastSubDateMap, prevSnapMap, growthMap, w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr) => {
  const pd = s.profile?.personalDetails || {};
  const ac = s.academic || {};
  const lc = s.platformStats?.leetcode || {};
  const cc = s.platformStats?.codechef || {};
  
  const studentIdStr = String(s._id);
  const resolvedCgpa = ac.cgpa != null ? ac.cgpa : s.overallGpa;
  
  let riskStatus = 'Low Risk';
  if (resolvedCgpa != null) {
    if (resolvedCgpa < 8.0) riskStatus = 'High Risk';
    else if (resolvedCgpa <= 8.5) riskStatus = 'Medium Risk';
  }

  const baseInfo = {
    id: studentIdStr,
    mssid: s.mssid || '',
    rollNumber: pd.rollNumber || '',
    name: s.name,
    email: s.email,
    mobile: pd.mobile || '',
    gender: pd.gender || '',
    college: s.college || '',
    branch: s.branch || '',
    year: s.currentYear || (s.year === '1' ? '1st Year' : s.year === '2' ? '2nd Year' : s.year === '3' ? '3rd Year' : s.year === '4' ? '4th Year' : s.year) || '',
    section: pd.section || '',
    mentorName: pd.mentorName || ''
  };

  if (reportType === 'student-master') {
    return {
      ...baseInfo,
      leetcodeUsername: s.leetcodeUsername || '',
      codechefUsername: s.codechefUsername || '',
      gfgUsername: s.gfgUsername || '',
      githubUsername: s.githubUsername || '',
      profileCompletion: s.profile?.profileCompletion || 0,
      placementScore: s.profile?.readinessProfile?.overallReadiness || 0,
      profileStatus: s.activityStatus || 'inactive',
      lastLogin: s.lastLogin || null,
      lastSyncDate: s.lastPlatformSyncAt || null,
      accountStatus: s.isActive === false ? 'Inactive' : 'Active'
    };
  } else if (reportType === 'leetcode-tracking') {
    return {
      ...baseInfo,
      leetcodeUsername: s.leetcodeUsername || '',
      totalSolved: lc.problemsSolved || 0,
      easySolved: lc.easySolved || 0,
      mediumSolved: lc.mediumSolved || 0,
      hardSolved: lc.hardSolved || 0,
      contestRating: lc.rating || 0,
      contestRank: lc.ranking || 0,
      problemsSolvedLast30Days: solved30DaysMap.get(studentIdStr) || 0,
      currentStreak: s.currentStreak || 0,
      longestStreak: s.longestStreak || 0,
      lastSubmissionDate: lastSubDateMap.get(studentIdStr) || null,
      lastSyncDate: lc.lastSyncAt || null,
      acceptanceRate: lc.acceptanceRate || 0,
      contestCount: lc.contestCount || 0
    };
  } else if (reportType === 'contest-tracking') {
    const lcPrevRating = prevSnapMap.get(studentIdStr)?.leetcode?.rating || 0;
    const lcCurrentRating = lc.rating || 0;
    const lcPrevRank = prevSnapMap.get(studentIdStr)?.leetcode?.ranking || 0;
    const lcCurrentRank = lc.ranking || 0;
    
    const ccCurrentRating = cc.currentRating || cc.rating || 0;
    const ccHighestRating = cc.highestRating || 0;
    const ccStars = cc.stars || '1★';
    const ccGlobalRank = cc.globalRank || 0;
    const ccCountryRank = cc.countryRank || 'Inactive';

    return {
      ...baseInfo,
      lcCurrentRating,
      lcPreviousRating,
      lcRatingGrowth: lcCurrentRating - lcPrevRating,
      lcCurrentRank,
      lcPreviousRank,
      lcRankChange: lcPrevRank > 0 && lcCurrentRank > 0 ? lcPrevRank - lcCurrentRank : 0,
      lcContestCount: lc.contestCount || 0,
      lcLastContestDate: lc.lastSyncAt || null,
      ccCurrentRating,
      ccHighestRating,
      ccStars,
      ccGlobalRank,
      ccCountryRank,
      prevSnapshotDate: prevSnapMap.get(studentIdStr)?.snapshotDate || null,
      contestStatus: (lc.contestCount > 0 || (cc.contestCount || 0) > 0) ? 'Active' : 'No Contests'
    };
  } else if (reportType === 'weekly-rank') {
    const lcHistory = lc.contestHistory || [];
    const L = lcHistory.length;

    // Last 4 attended contests, ordered oldest to newest
    const lcW1 = L >= 4 ? lcHistory[L - 4] : (L >= 1 ? lcHistory[0] : null);
    const lcW2 = L >= 4 ? lcHistory[L - 3] : (L >= 2 ? lcHistory[1] : null);
    const lcW3 = L >= 4 ? lcHistory[L - 2] : (L >= 3 ? lcHistory[2] : null);
    const lcW4 = L >= 4 ? lcHistory[L - 1] : null;

    const lcCurrent = lc.rating || 0;
    let oldestRating = null;
    if (L > 0) {
      oldestRating = lcHistory[Math.max(0, L - 4)].rating;
    }
    const lcGrowth = oldestRating !== null ? lcCurrent - oldestRating : 0;

    const ccCurrentRating = cc.currentRating || cc.rating || 0;
    const ccHighestRating = cc.highestRating || 0;
    const ccStars = cc.stars || '1★';
    const ccGlobalRank = cc.globalRank || 0;
    const ccCountryRank = cc.countryRank || 'Inactive';

    return {
      ...baseInfo,
      lcW1, lcW2, lcW3, lcW4, lcCurrent,
      lcGrowth,
      lcCurrentRank: lc.ranking || 0,
      ccCurrentRating,
      ccHighestRating,
      ccStars,
      ccGlobalRank,
      ccCountryRank
    };
  } else if (reportType === 'medium-growth') {
    const w1Count = growthMap.get(`${studentIdStr}-${w1KeyStr}`) || 0;
    const w2Count = growthMap.get(`${studentIdStr}-${w2KeyStr}`) || 0;
    const w3Count = growthMap.get(`${studentIdStr}-${w3KeyStr}`) || 0;
    const w4Count = growthMap.get(`${studentIdStr}-${w4KeyStr}`) || 0;
    const currentCount = lc.mediumSolved || 0;
    const growth = currentCount - w1Count;
    const growthPercentage = w1Count > 0 ? (growth / w1Count) * 100 : (currentCount > 0 ? 100 : 0);

    return {
      ...baseInfo,
      w1Count, w2Count, w3Count, w4Count, currentCount,
      growth,
      growthPercentage
    };
  } else if (reportType === 'codechef-tracking') {
    return {
      ...baseInfo,
      codechefUsername: s.codechefUsername || '',
      currentRating: cc.currentRating || cc.rating || 0,
      highestRating: cc.highestRating || 0,
      stars: cc.stars || '1★',
      globalRank: cc.globalRank || 0,
      countryRank: cc.countryRank || 'Inactive',
      problemsSolved: cc.problemsSolved || 0,
      lastSyncDate: cc.lastSyncAt || null
    };
  } else if (reportType === 'cgpa-tracking') {
    return {
      ...baseInfo,
      sgpa1: ac.sgpa1 ?? null,
      sgpa2: ac.sgpa2 ?? null,
      sgpa3: ac.sgpa3 ?? null,
      sgpa4: ac.sgpa4 ?? null,
      sgpa5: ac.sgpa5 ?? null,
      sgpa6: ac.sgpa6 ?? null,
      cgpa: resolvedCgpa ?? null,
      backlogs: ac.backlogs ?? 0,
      academicStatus: ac.academicStatus || '-'
    };
  } else if (reportType === 'below-9-cgpa') {
    return {
      ...baseInfo,
      cgpa: resolvedCgpa ?? 0,
      leetcodeSolved: lc.problemsSolved || 0,
      leetcodeContestRating: lc.rating || 0,
      codechefRating: cc.currentRating || cc.rating || 0,
      placementScore: s.profile?.readinessProfile?.overallReadiness || 0,
      riskStatus
    };
  }
};

// GET cohort dashboard cards summary
router.get('/tracking-reports/dashboard-cards', async (req, res) => {
  try {
    const { college, branch, currentYear, section, mentorName, gender } = req.query;
    const crypto = require('crypto');
    const filterHash = crypto.createHash('md5').update(JSON.stringify({ college, branch, currentYear, section, mentorName, gender })).digest('hex');
    const cacheKey = `coord-dashboard-cards-${filterHash}`;

    const ReportCache = require('../models/ReportCache');
    const cached = await ReportCache.findOne({ cacheKey });
    if (cached && cached.expiresAt > new Date()) {
      return res.json(cached.data);
    }

    const pipeline = buildBaseQueryPipeline({ college, branch, currentYear, section, mentorName, gender });

    pipeline.push({
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        activeStudents: { $sum: { $cond: [{ $eq: ['$activityStatus', 'active'] }, 1, 0] } },
        inactiveStudents: { $sum: { $cond: [{ $eq: ['$activityStatus', 'inactive'] }, 1, 0] } },
        gpas: { $push: { $ifNull: ['$academic.cgpa', '$overallGpa'] } },
        leetcodeRatings: { $push: { $cond: [{ $gt: ['$platformStats.leetcode.rating', 0] }, '$platformStats.leetcode.rating', null] } },
        codechefRatings: { $push: { $cond: [{ $gt: [{ $ifNull: ['$platformStats.codechef.currentRating', '$platformStats.codechef.rating'] }, 0] }, { $ifNull: ['$platformStats.codechef.currentRating', '$platformStats.codechef.rating'] }, null] } },
        totalProblemsSolvedList: {
          $push: {
            $add: [
              { $ifNull: ['$platformStats.leetcode.problemsSolved', 0] },
              { $ifNull: ['$platformStats.codechef.problemsSolved', 0] },
              { $ifNull: ['$platformStats.geeksforgeeks.totalProblemsSolved', { $ifNull: ['$platformStats.geeksforgeeks.problemsSolved', 0] }] },
              { $ifNull: ['$hackerrank.totalProblemsSolved', 0] }
            ]
          }
        },
        below9CgpaCount: { $sum: { $cond: [{ $lt: [{ $ifNull: ['$academic.cgpa', '$overallGpa'] }, 9.0] }, 1, 0] } },
        noProfileCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $or: [{ $eq: ['$leetcodeUsername', ''] }, { $not: ['$leetcodeUsername'] }] },
                  { $or: [{ $eq: ['$codechefUsername', ''] }, { $not: ['$codechefUsername'] }] },
                  { $or: [{ $eq: ['$gfgUsername', ''] }, { $not: ['$gfgUsername'] }] },
                  { $or: [{ $eq: ['$githubUsername', ''] }, { $not: ['$githubUsername'] }] }
                ]
              },
              1,
              0
            ]
          }
        },
        highRiskCount: { $sum: { $cond: [{ $lt: [{ $ifNull: ['$academic.cgpa', '$overallGpa'] }, 8.0] }, 1, 0] } },
        mediumRiskCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: [{ $ifNull: ['$academic.cgpa', '$overallGpa'] }, 8.0] },
                  { $lte: [{ $ifNull: ['$academic.cgpa', '$overallGpa'] }, 8.5] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    });

    const result = await User.aggregate(pipeline);
    const data = result[0] || {
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      gpas: [],
      leetcodeRatings: [],
      codechefRatings: [],
      totalProblemsSolvedList: [],
      below9CgpaCount: 0,
      noProfileCount: 0,
      highRiskCount: 0,
      mediumRiskCount: 0
    };

    const avg = (arr) => {
      const filtered = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
      if (filtered.length === 0) return 0;
      return filtered.reduce((a, b) => a + b, 0) / filtered.length;
    };

    const stats = {
      totalStudents: data.totalStudents,
      activeStudents: data.activeStudents,
      inactiveStudents: data.inactiveStudents,
      averageCgpa: Math.round(avg(data.gpas) * 100) / 100,
      averageLeetcodeRating: Math.round(avg(data.leetcodeRatings)),
      averageCodechefRating: Math.round(avg(data.codechefRatings)),
      averageProblemsSolved: Math.round(avg(data.totalProblemsSolvedList)),
      below9CgpaCount: data.below9CgpaCount,
      noProfileCount: data.noProfileCount,
      highRiskCount: data.highRiskCount,
      mediumRiskCount: data.mediumRiskCount
    };

    await ReportCache.findOneAndUpdate(
      { cacheKey },
      { data: stats, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }, // 1 hour
      { upsert: true }
    );

    return res.json(stats);
  } catch (err) {
    console.error('Fetch dashboard summary cards statistics error:', err);
    return res.status(500).json({ message: 'Failed to fetch summary statistics' });
  }
});

// GET report tabular data
router.get('/tracking-reports/data', async (req, res) => {
  try {
    const { reportType, college, branch, currentYear, section, mentorName, gender, search, page = 1, limit = 50, sortBy, sortOrder = 'asc' } = req.query;
    
    if (!reportType) {
      return res.status(400).json({ message: 'reportType query parameter is required' });
    }

    const pipeline = buildBaseQueryPipeline({ college, branch, currentYear, section, mentorName, gender, search });
    const students = await User.aggregate(pipeline);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const Activity = require('../models/Activity');
    
    const [solvedCounts, latestSubs] = await Promise.all([
      Activity.aggregate([
        { $match: { platform: 'leetcode', type: 'solved', timestamp: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]),
      Activity.aggregate([
        { $match: { platform: 'leetcode', type: 'solved' } },
        { $sort: { timestamp: -1 } },
        { $group: { _id: '$userId', lastDate: { $first: '$timestamp' } } }
      ])
    ]);
    const solved30DaysMap = new Map(solvedCounts.map(item => [String(item._id), item.count]));
    const lastSubDateMap = new Map(latestSubs.map(item => [String(item._id), item.lastDate]));

    const ContestSnapshot = require('../models/ContestSnapshot');
    const currentMonthKey = getMonthKey();
    const prevMonthKey = getMonthKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const [currentSnaps, prevSnaps] = await Promise.all([
      ContestSnapshot.find({ monthKey: currentMonthKey }),
      ContestSnapshot.find({ monthKey: prevMonthKey })
    ]);
    const currentSnapMap = new Map(currentSnaps.map(s => [String(s.userId), s]));
    const prevSnapMap = new Map(prevSnaps.map(s => [String(s.userId), s]));

    const WeeklySnapshot = require('../models/WeeklySnapshot');
    const w4KeyStr = getStartOfWeek().toISOString().split('T')[0];
    const w3KeyStr = getStartOfWeek(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const w2KeyStr = getStartOfWeek(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const w1KeyStr = getStartOfWeek(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const weeklySnaps = await WeeklySnapshot.find({
      weekKey: { $in: [w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr] }
    });
    const weeklyMap = new Map();
    weeklySnaps.forEach(s => {
      weeklyMap.set(`${String(s.userId)}-${s.weekKey}`, s);
    });

    const LeetCodeGrowthSnapshot = require('../models/LeetCodeGrowthSnapshot');
    const growthSnaps = await LeetCodeGrowthSnapshot.find({
      weekKey: { $in: [w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr] }
    });
    const growthMap = new Map();
    growthSnaps.forEach(s => {
      growthMap.set(`${String(s.userId)}-${s.weekKey}`, s.mediumSolved || 0);
    });

    let rows = students.map(s => mapStudentToRow(s, reportType, solved30DaysMap, lastSubDateMap, prevSnapMap, growthMap, w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr));

    if (reportType === 'below-9-cgpa') {
      rows = rows.filter(r => r.cgpa < 9.0);
    }

    if (sortBy) {
      rows.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') {
          return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        } else {
          valA = valA || 0;
          valB = valB || 0;
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
      });
    }

    const total = rows.length;
    let paginatedRows = [];
    if (limit === 'all' || limit === 'All') {
      paginatedRows = rows;
    } else {
      const skip = (Number(page) - 1) * Number(limit);
      paginatedRows = rows.slice(skip, skip + Number(limit));
    }

    // Dynamic distinct filters for dashboard select boxes
    const allStudents = await User.find({ role: 'student', isOnboarded: true });
    const colleges = [...new Set(allStudents.map(s => s.college).filter(Boolean))].sort();
    const branches = [...new Set(allStudents.map(s => s.branch).filter(Boolean))].sort();
    const years = [...new Set(allStudents.map(s => s.currentYear || (s.year === '1' ? '1st Year' : s.year === '2' ? '2nd Year' : s.year === '3' ? '3rd Year' : s.year === '4' ? '4th Year' : s.year)).filter(Boolean))].sort();

    const StudentProfile = require('../models/StudentProfile');
    const allProfiles = await StudentProfile.find({}, 'personalDetails');
    const sections = [...new Set(allProfiles.map(p => p.personalDetails?.section).filter(Boolean))].sort();
    const mentors = [...new Set(allProfiles.map(p => p.personalDetails?.mentorName).filter(Boolean))].sort();
    const genders = [...new Set(allProfiles.map(p => p.personalDetails?.gender).filter(Boolean))].sort();

    return res.json({
      rows: paginatedRows,
      total,
      page: Number(page),
      limit: limit === 'all' ? 'all' : Number(limit),
      filters: { colleges, branches, years, sections, mentors, genders }
    });
  } catch (err) {
    console.error('Fetch report data error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch report data' });
  }
});

// Helper to populate worksheets for Exceljs
const addWorksheetToWorkbook = (workbook, sheetName, reportType, rows) => {
  const sheet = workbook.addWorksheet(sheetName);
  let columns = [];

  if (reportType === 'student-master') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Roll Number', key: 'rollNumber', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Mobile Number', key: 'mobile', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'Year', key: 'year', width: 12 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Mentor Name', key: 'mentorName', width: 20 },
      { header: 'LeetCode Username', key: 'leetcodeUsername', width: 20 },
      { header: 'CodeChef Username', key: 'codechefUsername', width: 20 },
      { header: 'GFG Username', key: 'gfgUsername', width: 20 },
      { header: 'GitHub Username', key: 'githubUsername', width: 20 },
      { header: 'Profile Completion %', key: 'profileCompletion', width: 20 },
      { header: 'Placement Score', key: 'placementScore', width: 15 },
      { header: 'Profile Status', key: 'profileStatus', width: 15 },
      { header: 'Last Login', key: 'lastLogin', width: 20 },
      { header: 'Last Sync Date', key: 'lastSyncDate', width: 20 },
      { header: 'Account Status', key: 'accountStatus', width: 15 }
    ];
  } else if (reportType === 'leetcode-tracking') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'LeetCode Username', key: 'leetcodeUsername', width: 20 },
      { header: 'Total Solved', key: 'totalSolved', width: 12 },
      { header: 'Easy Solved', key: 'easySolved', width: 12 },
      { header: 'Medium Solved', key: 'mediumSolved', width: 15 },
      { header: 'Hard Solved', key: 'hardSolved', width: 12 },
      { header: 'Contest Rating', key: 'contestRating', width: 15 },
      { header: 'Contest Rank', key: 'contestRank', width: 15 },
      { header: 'Acceptance Rate %', key: 'acceptanceRate', width: 18 },
      { header: 'Contests Attended', key: 'contestCount', width: 18 },
      { header: 'Solved Last 30 Days', key: 'problemsSolvedLast30Days', width: 20 },
      { header: 'Current Streak', key: 'currentStreak', width: 15 },
      { header: 'Longest Streak', key: 'longestStreak', width: 15 },
      { header: 'Last Submission Date', key: 'lastSubmissionDate', width: 20 },
      { header: 'Last Sync Date', key: 'lastSyncDate', width: 20 }
    ];
  } else if (reportType === 'contest-tracking') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'LC Current Rating', key: 'lcCurrentRating', width: 18 },
      { header: 'LC Previous Rating', key: 'lcPreviousRating', width: 18 },
      { header: 'LC Rating Growth', key: 'lcRatingGrowth', width: 18 },
      { header: 'LC Current Rank', key: 'lcCurrentRank', width: 18 },
      { header: 'LC Previous Rank', key: 'lcPreviousRank', width: 18 },
      { header: 'LC Rank Change', key: 'lcRankChange', width: 15 },
      { header: 'LC Contest Count', key: 'lcContestCount', width: 18 },
      { header: 'LC Last Contest Date', key: 'lcLastContestDate', width: 20 },
      { header: 'CC Current Rating', key: 'ccCurrentRating', width: 18 },
      { header: 'CC Highest Rating', key: 'ccHighestRating', width: 18 },
      { header: 'CC Stars', key: 'ccStars', width: 12 },
      { header: 'CC Global Rank', key: 'ccGlobalRank', width: 18 },
      { header: 'CC Country Rank', key: 'ccCountryRank', width: 18 }
    ];
  } else if (reportType === 'weekly-rank') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'LC Contest 1', key: 'lcW1', width: 22 },
      { header: 'LC Contest 2', key: 'lcW2', width: 22 },
      { header: 'LC Contest 3', key: 'lcW3', width: 22 },
      { header: 'LC Contest 4', key: 'lcW4', width: 22 },
      { header: 'LC Current Rating', key: 'lcCurrent', width: 18 },
      { header: 'LC Growth', key: 'lcGrowth', width: 15 },
      { header: 'LC Current Rank', key: 'lcCurrentRank', width: 18 },
      { header: 'CC Current Rating', key: 'ccCurrentRating', width: 18 },
      { header: 'CC Highest Rating', key: 'ccHighestRating', width: 18 },
      { header: 'CC Stars', key: 'ccStars', width: 12 },
      { header: 'CC Global Rank', key: 'ccGlobalRank', width: 18 },
      { header: 'CC Country Rank', key: 'ccCountryRank', width: 18 }
    ];
  } else if (reportType === 'medium-growth') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'Week 1 Medium Count', key: 'w1Count', width: 20 },
      { header: 'Week 2 Medium Count', key: 'w2Count', width: 20 },
      { header: 'Week 3 Medium Count', key: 'w3Count', width: 20 },
      { header: 'Week 4 Medium Count', key: 'w4Count', width: 20 },
      { header: 'Current Medium Count', key: 'currentCount', width: 20 },
      { header: 'Medium Growth', key: 'growth', width: 18 },
      { header: 'Growth Percentage %', key: 'growthPercentage', width: 20 }
    ];
  } else if (reportType === 'codechef-tracking') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'CodeChef Username', key: 'codechefUsername', width: 20 },
      { header: 'Current Rating', key: 'currentRating', width: 15 },
      { header: 'Highest Rating', key: 'highestRating', width: 15 },
      { header: 'Stars', key: 'stars', width: 12 },
      { header: 'Global Rank', key: 'globalRank', width: 15 },
      { header: 'Country Rank', key: 'countryRank', width: 15 },
      { header: 'Problems Solved', key: 'problemsSolved', width: 15 },
      { header: 'Last Sync Date', key: 'lastSyncDate', width: 20 }
    ];
  } else if (reportType === 'cgpa-tracking') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'Semester 1 GPA', key: 'sgpa1', width: 15 },
      { header: 'Semester 2 GPA', key: 'sgpa2', width: 15 },
      { header: 'Semester 3 GPA', key: 'sgpa3', width: 15 },
      { header: 'Semester 4 GPA', key: 'sgpa4', width: 15 },
      { header: 'Semester 5 GPA', key: 'sgpa5', width: 15 },
      { header: 'Semester 6 GPA', key: 'sgpa6', width: 15 },
      { header: 'Current CGPA', key: 'cgpa', width: 15 },
      { header: 'Backlogs', key: 'backlogs', width: 12 },
      { header: 'Academic Status', key: 'academicStatus', width: 18 }
    ];
  } else if (reportType === 'below-9-cgpa') {
    columns = [
      { header: 'MSS ID', key: 'mssid', width: 15 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Branch', key: 'branch', width: 12 },
      { header: 'Mentor Name', key: 'mentorName', width: 20 },
      { header: 'CGPA', key: 'cgpa', width: 12 },
      { header: 'LeetCode Solved', key: 'leetcodeSolved', width: 18 },
      { header: 'LeetCode Contest Rating', key: 'leetcodeContestRating', width: 22 },
      { header: 'CodeChef Rating', key: 'codechefRating', width: 18 },
      { header: 'Placement Score', key: 'placementScore', width: 18 },
      { header: 'Risk Status', key: 'riskStatus', width: 15 }
    ];
  }

  sheet.columns = columns;

  rows.forEach(r => {
    const rowObj = { ...r };
    if (rowObj.lastLogin) rowObj.lastLogin = new Date(rowObj.lastLogin).toLocaleString();
    if (rowObj.lastSyncDate) rowObj.lastSyncDate = new Date(rowObj.lastSyncDate).toLocaleString();
    if (rowObj.lcLastContestDate) rowObj.lcLastContestDate = new Date(rowObj.lcLastContestDate).toLocaleString();
    if (rowObj.ccLastContestDate) rowObj.ccLastContestDate = new Date(rowObj.ccLastContestDate).toLocaleString();
    if (rowObj.lastSubmissionDate) rowObj.lastSubmissionDate = new Date(rowObj.lastSubmissionDate).toLocaleString();
    if (rowObj.prevSnapshotDate) rowObj.prevSnapshotDate = new Date(rowObj.prevSnapshotDate).toLocaleString();

    // Format LC weekly ranking cells (Contest 1 to 4)
    ['lcW1', 'lcW2', 'lcW3', 'lcW4'].forEach(k => {
      const contest = rowObj[k];
      if (contest && typeof contest === 'object' && contest.name) {
        rowObj[k] = `${contest.name}\n${contest.date}\nRating: ${Number(contest.rating).toFixed(2)}`;
      } else {
        rowObj[k] = 'N/A';
      }
    });

    // Formatting decimal statistics to exactly 2 decimals
    const numericFields = [
      'lcCurrent', 'lcGrowth', 'lcCurrentRating', 'lcPreviousRating', 'lcRatingGrowth',
      'ccCurrentRating', 'ccHighestRating', 'cgpa', 'sgpa1', 'sgpa2', 'sgpa3', 'sgpa4', 'sgpa5', 'sgpa6',
      'acceptanceRate', 'placementScore', 'growthPercentage', 'leetcodeContestRating', 'codechefRating'
    ];
    numericFields.forEach(f => {
      if (rowObj[f] !== undefined && rowObj[f] !== null && rowObj[f] !== '' && !isNaN(rowObj[f])) {
        rowObj[f] = Number(rowObj[f]).toFixed(2);
      }
    });

    sheet.addRow(rowObj);
  });

  const headerRow = sheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 25;
};

// GET workbook / sheets exports using active filters
router.get('/tracking-reports/export', async (req, res) => {
  try {
    const { reportType, college, branch, currentYear, section, mentorName, gender, search } = req.query;
    
    if (!reportType) {
      return res.status(400).json({ message: 'reportType query parameter is required' });
    }

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    const getReportRows = async (type) => {
      const pipeline = buildBaseQueryPipeline({ college, branch, currentYear, section, mentorName, gender, search });
      const students = await User.aggregate(pipeline);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const Activity = require('../models/Activity');
      
      const [solvedCounts, latestSubs] = await Promise.all([
        Activity.aggregate([
          { $match: { platform: 'leetcode', type: 'solved', timestamp: { $gte: thirtyDaysAgo } } },
          { $group: { _id: '$userId', count: { $sum: 1 } } }
        ]),
        Activity.aggregate([
          { $match: { platform: 'leetcode', type: 'solved' } },
          { $sort: { timestamp: -1 } },
          { $group: { _id: '$userId', lastDate: { $first: '$timestamp' } } }
        ])
      ]);
      const solved30DaysMap = new Map(solvedCounts.map(item => [String(item._id), item.count]));
      const lastSubDateMap = new Map(latestSubs.map(item => [String(item._id), item.lastDate]));

      const ContestSnapshot = require('../models/ContestSnapshot');
      const currentMonthKey = getMonthKey();
      const prevMonthKey = getMonthKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const [currentSnaps, prevSnaps] = await Promise.all([
        ContestSnapshot.find({ monthKey: currentMonthKey }),
        ContestSnapshot.find({ monthKey: prevMonthKey })
      ]);
      const currentSnapMap = new Map(currentSnaps.map(s => [String(s.userId), s]));
      const prevSnapMap = new Map(prevSnaps.map(s => [String(s.userId), s]));

      const WeeklySnapshot = require('../models/WeeklySnapshot');
      const w4KeyStr = getStartOfWeek().toISOString().split('T')[0];
      const w3KeyStr = getStartOfWeek(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const w2KeyStr = getStartOfWeek(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const w1KeyStr = getStartOfWeek(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const weeklySnaps = await WeeklySnapshot.find({
        weekKey: { $in: [w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr] }
      });
      const weeklyMap = new Map();
      weeklySnaps.forEach(s => {
        weeklyMap.set(`${String(s.userId)}-${s.weekKey}`, s);
      });

      const LeetCodeGrowthSnapshot = require('../models/LeetCodeGrowthSnapshot');
      const growthSnaps = await LeetCodeGrowthSnapshot.find({
        weekKey: { $in: [w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr] }
      });
      const growthMap = new Map();
      growthSnaps.forEach(s => {
        growthMap.set(`${String(s.userId)}-${s.weekKey}`, s.mediumSolved || 0);
      });

      let resRows = students.map(s => mapStudentToRow(s, type, solved30DaysMap, lastSubDateMap, prevSnapMap, growthMap, w1KeyStr, w2KeyStr, w3KeyStr, w4KeyStr));

      if (type === 'below-9-cgpa') {
        resRows = resRows.filter(r => r.cgpa < 9.0);
      }

      return resRows;
    };

    if (reportType === 'complete-workbook') {
      const sheetsList = [
        { name: 'Student Master', type: 'student-master' },
        { name: 'LeetCode Tracking', type: 'leetcode-tracking' },
        { name: 'Contest Tracking', type: 'contest-tracking' },
        { name: 'Weekly Rank Tracking', type: 'weekly-rank' },
        { name: 'Medium Growth', type: 'medium-growth' },
        { name: 'CodeChef Tracking', type: 'codechef-tracking' },
        { name: 'CGPA Tracking', type: 'cgpa-tracking' },
        { name: 'Below 9 CGPA Report', type: 'below-9-cgpa' }
      ];

      for (const sh of sheetsList) {
        const sRows = await getReportRows(sh.type);
        addWorksheetToWorkbook(workbook, sh.name, sh.type, sRows);
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="complete_coordinator_tracking_report.xlsx"');
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      const sheetNameMap = {
        'student-master': 'Student Master',
        'leetcode-tracking': 'LeetCode Tracking',
        'contest-tracking': 'Contest Tracking',
        'weekly-rank': 'Weekly Rank Tracking',
        'medium-growth': 'Medium Growth',
        'codechef-tracking': 'CodeChef Tracking',
        'cgpa-tracking': 'CGPA Tracking',
        'below-9-cgpa': 'Below 9 CGPA Report'
      };

      const name = sheetNameMap[reportType] || 'Report';
      const sRows = await getReportRows(reportType);
      addWorksheetToWorkbook(workbook, name, reportType, sRows);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType.replace(/-/g, '_')}_report.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();
    }
  } catch (err) {
    console.error('Export tracking reports error:', err);
    return res.status(500).json({ message: 'Failed to export Excel spreadsheet' });
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
