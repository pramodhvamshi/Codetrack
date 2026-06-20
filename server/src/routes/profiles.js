const express = require('express');
const User = require('../models/User');
const Activity = require('../models/Activity');

const router = express.Router();

/**
 * PUBLIC PROFILES
 * No authentication required
 */

/* -----------------------------------------
   LIST STUDENTS (OPTIONAL – BASIC CARDS)
   GET /api/profiles?search=abc
----------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    const filter = { role: 'student' };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { college: regex }
      ];
    }

    const students = await User.find(filter).select(
      'name college hostel branch year scores activityStatus'
    );

    return res.json(
      students.map((s) => ({
        id: s._id,
        name: s.name,
        college: s.college,
        hostel: s.hostel,
        branch: s.branch,
        year: s.year,
        scores: s.scores,
        activityStatus: s.activityStatus
      }))
    );
  } catch (err) {
    console.error('Profiles list error:', err);
    return res.status(500).json({ message: 'Failed to load students' });
  }
});

/* -----------------------------------------
   SINGLE PUBLIC STUDENT PROFILE
   GET /api/profiles/:id
 ----------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: 'student'
    }).select(
      'name email role college hostel branch year overallGpa bio graduationYear mssid ' +
      'leetcodeUsername codechefUsername gfgUsername githubUsername githubUrl linkedinUrl ' +
      'hackerrank platformStats scores activityStatus ' +
      'certifications achievements hackathons projects workExperience ' +
      'currentStreak longestStreak activeDaysCount consistencyPercentage ' +
      'monthlyActivityCount yearlyActivityCount lastPlatformSyncAt'
    );

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const StudentProfile = require('../models/StudentProfile');
    const profileDoc = await StudentProfile.findOne({ userId: student._id });

    // Generate combined 6-month heatmap data
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

    // 1. Process LeetCode submissionCalendar
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
      } catch (e) {
        // ignore
      }
    });

    // 2. Process GitHub contributions
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

    // 3. Process Activities
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

    const heatmapArray = Object.values(heatmap).sort((a, b) => a.date.localeCompare(b.date));

    // Return restructured response
    return res.json({
      profile: {
        id: student._id,
        username: student.email,
        name: student.name,
        bio: student.bio || '',
        college: student.college || '',
        branch: student.branch || '',
        graduationYear: student.graduationYear || student.year || '',
        mssid: student.mssid || '',
        email: student.email,
        role: student.role,
        hostel: student.hostel || '',
        overallGpa: student.overallGpa || 0,
        eapcetRank: profileDoc?.academicDetails?.eapcetRank || null,
        leetcodeUsername: student.leetcodeUsername || '',
        codechefUsername: student.codechefUsername || '',
        gfgUsername: student.gfgUsername || '',
        githubUsername: student.githubUsername || '',
        githubUrl: student.githubUrl || '',
        linkedinUrl: student.linkedinUrl || '',
        hackerrank: student.hackerrank,
        scores: student.scores || {},
        activityStatus: student.activityStatus || 'inactive',
        certifications: profileDoc?.certifications?.length ? profileDoc.certifications : (student.certifications || []),
        achievements: student.achievements || [],
        hackathons: profileDoc?.hackathons?.length ? profileDoc.hackathons : (student.hackathons || []),
        projects: profileDoc?.projects?.length ? profileDoc.projects.map(p => ({ name: p.title, description: p.description, techStack: p.technologies, githubUrl: p.githubLink, liveUrl: p.liveLink })) : (student.projects || []),
        workExperience: profileDoc?.experiences?.length ? profileDoc.experiences.map(e => ({ company: e.company, role: e.role, startDate: e.startDate, endDate: e.endDate, description: e.description })) : (student.workExperience || []),
        currentStreak: student.currentStreak || 0,
        longestStreak: student.longestStreak || 0,
        activeDaysCount: student.activeDaysCount || 0,
        consistencyPercentage: student.consistencyPercentage || 0,
        monthlyActivityCount: student.monthlyActivityCount || 0,
        yearlyActivityCount: student.yearlyActivityCount || 0,
        lastPlatformSyncAt: student.lastPlatformSyncAt
      },
      leetcode: {
        totalSolved: student.platformStats?.leetcode?.problemsSolved || 0,
        ranking: student.platformStats?.leetcode?.ranking || 0,
        contestRating: student.platformStats?.leetcode?.rating || 0,
        badgeCount: student.platformStats?.leetcode?.badgeCount || 0,
        badges: student.platformStats?.leetcode?.badges || [],
        recentSubmissions: student.platformStats?.leetcode?.recentSubmissions || []
      },
      codechef: {
        problemsSolved: student.platformStats?.codechef?.problemsSolved || 0,
        currentRating: student.platformStats?.codechef?.problemsSolved ? (student.platformStats?.codechef?.currentRating || student.platformStats?.codechef?.rating || 0) : 0,
        highestRating: student.platformStats?.codechef?.highestRating || 0,
        globalRank: student.platformStats?.codechef?.globalRank || 0,
        countryRank: student.platformStats?.codechef?.countryRank || 'Inactive'
      },
      gfg: {
        totalProblemsSolved: student.platformStats?.geeksforgeeks?.totalProblemsSolved || student.platformStats?.geeksforgeeks?.problemsSolved || 0,
        basicProblemsSolved: student.platformStats?.geeksforgeeks?.basicProblemsSolved || 0,
        easyProblemsSolved: student.platformStats?.geeksforgeeks?.easyProblemsSolved || 0,
        mediumProblemsSolved: student.platformStats?.geeksforgeeks?.mediumProblemsSolved || 0,
        hardProblemsSolved: student.platformStats?.geeksforgeeks?.hardProblemsSolved || 0,
        languageStats: student.platformStats?.geeksforgeeks?.languageStats || {}
      },
      github: {
        username: student.platformStats?.github?.username || '',
        reposCount: student.platformStats?.github?.reposCount || 0,
        starsCount: student.platformStats?.github?.starsCount || 0,
        followersCount: student.platformStats?.github?.followersCount || 0,
        followingCount: student.platformStats?.github?.followingCount || 0,
        contributions: student.platformStats?.github?.contributions || [],
        publicReposCount: student.platformStats?.github?.reposCount || 0
      },
      heatmap: heatmapArray
    });
  } catch (err) {
    console.error('Public profile error:', err);
    return res.status(400).json({ message: 'Invalid profile id' });
  }
});

/* -----------------------------------------
   PUBLIC HEATMAP (aggregated — no private details)
   GET /api/profiles/:id/heatmap
   Returns: [{ date, count, platforms: { leetcode, github } }]
 ----------------------------------------- */
router.get('/:id/heatmap', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('platformStats');
    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
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
    console.error('Public heatmap error:', err);
    return res.status(500).json({ message: 'Failed to fetch heatmap' });
  }
});

/* -----------------------------------------
   PUBLIC TIMELINE (platform-level only — no private problem names)
   GET /api/profiles/:id/timeline
   Returns: [{ platform, type, timestamp }] — NO title, NO link
----------------------------------------- */
router.get('/:id/timeline', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('_id');
    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const activities = await Activity.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('platform type timestamp'); // explicitly exclude title and link

    return res.json(activities);
  } catch (err) {
    console.error('Public timeline error:', err);
    return res.status(500).json({ message: 'Failed to fetch timeline' });
  }
});

module.exports = router;
