const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { syncPlatformsForUser } = require('../services/platformSyncService');
const { computeActivityStatus } = require('../utils/activity');
const { buildResumePdfBuffer } = require('../services/resumeService');
const { buildAnalyticsReport } = require('../utils/analyticsBuilder');
// const { isProfileComplete } = require('../utils/profile');

const router = express.Router();

// All /student routes require student role
router.use(authMiddleware, requireRole('student'));

// Get Analytics Report (On-Demand)
router.get('/analytics/:type', async (req, res) => {
  try {
    const reportType = req.params.type;
    const report = await buildAnalyticsReport(req.currentUser._id, reportType);
    res.json(report);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate analytics report' });
  }
});

// Get own profile
router.get('/me', async (req, res) => {
  const user = req.currentUser;
  const StudentProfile = require('../models/StudentProfile');
  const AcademicProfile = require('../models/AcademicProfile');

  try {
    let profile = await StudentProfile.findOne({ userId: user._id });
    let academic = await AcademicProfile.findOne({ userId: user._id });
    const resolvedGpa = academic?.cgpa != null ? academic.cgpa : user.overallGpa;

    if (!profile) {
      profile = {
        personalDetails: {
          fullName: user.name,
          email: user.email,
          college: user.college,
          branch: user.branch,
          year: user.currentYear || '1st Year',
          ssc: { schoolName: "", board: "", percentage: null, passoutYear: null },
          intermediate: { collegeName: "", board: "", percentage: null, passoutYear: null }
        },
        familyDetails: { parentStatus: 'Both Parents', father: {}, mother: {}, siblings: [] },
        education: [],
        skills: [],
        projects: [],
        experiences: [],
        certifications: [],
        profileCompletion: 0,
        readinessProfile: { dsaScore: 0, projectsScore: 0, resumeScore: 0, profileScore: 0, overallReadiness: 0 }
      };
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      hostel: user.hostel,
      branch: user.branch,
      year: user.year, // Keep for backward compatibility
      currentYear: user.currentYear || '1st Year',
      overallGpa: resolvedGpa,
      leetcodeUsername: user.leetcodeUsername,
      codechefUsername: user.codechefUsername,
      gfgUsername: user.gfgUsername,
      githubUsername: user.githubUsername,
      hackerrankUsername: user.hackerrankUsername,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      hackerrank: user.hackerrank, // Keep for backward compatibility
      platformStats: user.platformStats, // Keep for backward compatibility
      scores: user.scores,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      activeDaysCount: user.activeDaysCount,
      consistencyPercentage: user.consistencyPercentage,
      monthlyActivityCount: user.monthlyActivityCount,
      yearlyActivityCount: user.yearlyActivityCount,
      activityStatus: user.activityStatus,
      
      // Values retrieved from normalized StudentProfile
      certifications: profile.certifications || [],
      projects: profile.projects || [],
      workExperience: profile.experiences || [],
      education: profile.education || [],
      skills: profile.skills || [],
      personalDetails: profile.personalDetails || {},
      familyDetails: profile.familyDetails || {},
      academicDetails: profile.academicDetails || {},
      profileCompletion: profile.profileCompletion || 0,
      readinessProfile: profile.readinessProfile || {},
      hackathons: profile.hackathons || [],
      goal: profile.goal || null,
      collegeMentor: profile.collegeMentor || {},
      academicMentor: profile.academicMentor || {},
      codingMentor: profile.codingMentor || {},
      communicationMentor: profile.communicationMentor || {},
      projectMentor: profile.projectMentor || {},
      mandatoryAccomplishments: profile.mandatoryAccomplishments || {},
      
      placementReadiness: user.placementReadiness,
      resume: user.resume,
      isOnboarded: user.isOnboarded,
      mssid: user.mssid,
      bio: user.bio,
      graduationYear: user.graduationYear
    });
  } catch (err) {
    console.error('Error fetching /me profile details:', err);
    return res.status(500).json({ message: 'Failed to fetch own profile details' });
  }
});

// GET /me/profile/personal
router.get('/me/profile/personal', async (req, res) => {
  try {
    const StudentProfile = require('../models/StudentProfile');
    let profile = await StudentProfile.findOne({ userId: req.currentUser._id });
    if (!profile) {
      return res.json({
        personalDetails: {
          fullName: req.currentUser.name,
          email: req.currentUser.email,
          college: req.currentUser.college || "",
          branch: req.currentUser.branch || "",
          year: req.currentUser.currentYear || "1st Year",
          ssc: { schoolName: "", board: "", percentage: null, passoutYear: null },
          intermediate: { collegeName: "", board: "", percentage: null, passoutYear: null }
        },
        familyDetails: { parentStatus: 'Both Parents', father: { name: "", occupation: "", education: "", mobile: "" }, mother: { name: "", occupation: "", education: "", mobile: "" }, siblings: [] },
        goal: null,
        collegeMentor: {},
        academicMentor: {},
        codingMentor: {},
        communicationMentor: {},
        projectMentor: {}
      });
    }
    return res.json({
      personalDetails: profile.personalDetails,
      familyDetails: profile.familyDetails,
      goal: profile.goal || null,
      collegeMentor: profile.collegeMentor || {},
      academicMentor: profile.academicMentor || {},
      codingMentor: profile.codingMentor || {},
      communicationMentor: profile.communicationMentor || {},
      projectMentor: profile.projectMentor || {}
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch personal profile' });
  }
});

// PUT /me/profile/personal
router.put('/me/profile/personal', async (req, res) => {
  try {
    const user = req.currentUser;
    const StudentProfile = require('../models/StudentProfile');
    const {
      personalDetails,
      familyDetails,
      goal,
      collegeMentor,
      academicMentor,
      codingMentor,
      communicationMentor,
      projectMentor
    } = req.body;

    if (!personalDetails) {
      return res.status(400).json({ message: 'personalDetails is required' });
    }

    // Validate mentor phone numbers
    const phoneRegex = /^[0-9]{10}$/;
    const validateMentor = (mentor, label) => {
      const phone = typeof mentor?.mobileNumber === 'string' ? mentor.mobileNumber.trim() : '';
      if (phone && !phoneRegex.test(phone)) {
        throw new Error(`${label} must be a valid 10-digit number.`);
      }
    };

    try {
      validateMentor(collegeMentor, 'College Mentor mobile number');
      validateMentor(academicMentor, 'Academic Mentor mobile number');
      validateMentor(codingMentor, 'Coding Mentor mobile number');
      validateMentor(communicationMentor, 'Communication Skills Mentor mobile number');
      validateMentor(projectMentor, 'Project Mentor mobile number');
    } catch (valErr) {
      return res.status(400).json({ message: valErr.message });
    }

    // Update User model fields
    if (personalDetails.fullName) {
      user.name = personalDetails.fullName;
    }
    if (personalDetails.college) {
      user.college = personalDetails.college;
    }
    if (personalDetails.branch) {
      user.branch = personalDetails.branch;
    }
    if (personalDetails.year) {
      user.currentYear = personalDetails.year;
      user.year = personalDetails.year === '1st Year' ? '1' : personalDetails.year === '2nd Year' ? '2' : personalDetails.year === '3rd Year' ? '3' : '4';
    }
    if (personalDetails.hostelName) {
      user.hostel = personalDetails.hostelName;
    }
    await user.save();

    // Update StudentProfile
    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: user._id });
    }

    profile.personalDetails = {
      ...profile.personalDetails,
      ...personalDetails,
      fullName: user.name, // force sync
      email: user.email,       // force sync
      college: user.college,   // force sync
      branch: user.branch,     // force sync
      year: user.currentYear   // force sync
    };

    if (familyDetails) {
      profile.familyDetails = {
        ...profile.familyDetails,
        ...familyDetails
      };
    }

    if (goal !== undefined) {
      profile.goal = goal;
    }
    if (collegeMentor !== undefined) {
      profile.collegeMentor = collegeMentor;
    }
    if (academicMentor !== undefined) {
      profile.academicMentor = academicMentor;
    }
    if (codingMentor !== undefined) {
      profile.codingMentor = codingMentor;
    }
    if (communicationMentor !== undefined) {
      profile.communicationMentor = communicationMentor;
    }
    if (projectMentor !== undefined) {
      profile.projectMentor = projectMentor;
    }

    const { calculateProfileCompletion } = require('../utils/profileMetrics');
    profile.profileCompletion = calculateProfileCompletion(user, profile);

    await profile.save();
    
    // Recalculate readiness
    await syncPlatformsForUser(user, { force: false });

    return res.json({
      message: 'Personal details updated successfully',
      personalDetails: profile.personalDetails,
      familyDetails: profile.familyDetails,
      goal: profile.goal,
      collegeMentor: profile.collegeMentor,
      academicMentor: profile.academicMentor,
      codingMentor: profile.codingMentor,
      communicationMentor: profile.communicationMentor,
      projectMentor: profile.projectMentor
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update personal details' });
  }
});
// GET /me/profile/professional
router.get('/me/profile/professional', async (req, res) => {
  try {
    const StudentProfile = require('../models/StudentProfile');
    let profile = await StudentProfile.findOne({ userId: req.currentUser._id });
    if (!profile) {
      return res.json({
        education: [],
        skills: [],
        projects: [],
        experiences: [],
        certifications: [],
        hackathons: []
      });
    }
    return res.json({
      education: profile.education || [],
      skills: profile.skills || [],
      projects: profile.projects || [],
      experiences: profile.experiences || [],
      certifications: profile.certifications || [],
      hackathons: profile.hackathons || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch professional profile' });
  }
});

// PUT /me/profile/professional
router.put('/me/profile/professional', async (req, res) => {
  try {
    const user = req.currentUser;
    const StudentProfile = require('../models/StudentProfile');
    const { education, skills, projects, experiences, certifications, hackathons } = req.body;

    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: user._id });
    }

    if (education !== undefined) profile.education = education;
    if (skills !== undefined) profile.skills = skills;
    if (projects !== undefined) profile.projects = projects;
    if (experiences !== undefined) profile.experiences = experiences;
    if (certifications !== undefined) profile.certifications = certifications;
    if (hackathons !== undefined) profile.hackathons = hackathons;

    const { calculateProfileCompletion } = require('../utils/profileMetrics');
    profile.profileCompletion = calculateProfileCompletion(user, profile);

    await profile.save();

    // Recalculate readiness
    await syncPlatformsForUser(user, { force: false });

    return res.json({
      message: 'Professional details updated successfully',
      education: profile.education,
      skills: profile.skills,
      projects: profile.projects,
      experiences: profile.experiences,
      certifications: profile.certifications,
      hackathons: profile.hackathons
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update professional details' });
  }
});

// GET /me/profile/mandatory-accomplishments
router.get('/me/profile/mandatory-accomplishments', async (req, res) => {
  try {
    const StudentProfile = require('../models/StudentProfile');
    let profile = await StudentProfile.findOne({ userId: req.currentUser._id });
    if (!profile) {
      return res.json({});
    }
    return res.json(profile.mandatoryAccomplishments || {});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch mandatory accomplishments' });
  }
});

// PUT /me/profile/mandatory-accomplishments
router.put('/me/profile/mandatory-accomplishments', async (req, res) => {
  try {
    const user = req.currentUser;
    const StudentProfile = require('../models/StudentProfile');
    const {
      technicalCourses,
      projects,
      hackathons,
      personalityActivities
    } = req.body;

    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: user._id });
    }

    if (!profile.mandatoryAccomplishments) {
      profile.mandatoryAccomplishments = {};
    }

    if (technicalCourses !== undefined) profile.mandatoryAccomplishments.technicalCourses = technicalCourses;
    if (projects !== undefined) profile.mandatoryAccomplishments.projects = projects;
    if (hackathons !== undefined) profile.mandatoryAccomplishments.hackathons = hackathons;
    if (personalityActivities !== undefined) profile.mandatoryAccomplishments.personalityActivities = personalityActivities;

    const { calculateMandatoryScores } = require('../utils/mandatoryAccomplishmentsUtils');
    const AcademicProfile = require('../models/AcademicProfile');
    const academic = await AcademicProfile.findOne({ userId: user._id });
    const resolvedGpa = academic?.cgpa != null ? academic.cgpa : (user.overallGpa || 0);
    
    profile.mandatoryAccomplishments.calculatedScores = calculateMandatoryScores(profile, resolvedGpa);

    await profile.save();

    return res.json({
      message: 'Mandatory accomplishments updated successfully',
      mandatoryAccomplishments: profile.mandatoryAccomplishments
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update mandatory accomplishments' });
  }
});

// GET /me/profile/coding
router.get('/me/profile/coding', async (req, res) => {
  try {
    const CodingProfile = require('../models/CodingProfile');
    let cp = await CodingProfile.findOne({ userId: req.currentUser._id });
    if (!cp) {
      cp = new CodingProfile({ userId: req.currentUser._id });
      cp.leetcode.username = req.currentUser.leetcodeUsername || "";
      cp.codechef.username = req.currentUser.codechefUsername || "";
      cp.geeksforgeeks.username = req.currentUser.gfgUsername || "";
      cp.github.username = req.currentUser.githubUsername || "";
      cp.hackerrank.username = req.currentUser.hackerrankUsername || "";
      await cp.save();
    }
    return res.json(cp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch coding profile' });
  }
});

// PUT /me/profile/coding
router.put('/me/profile/coding', async (req, res) => {
  try {
    const user = req.currentUser;
    const CodingProfile = require('../models/CodingProfile');
    const {
      leetcodeUsername,
      codechefUsername,
      gfgUsername,
      githubUsername,
      hackerrankUsername
    } = req.body;

    const {
      validateLeetCode,
      validateCodeChef,
      validateGeeksforGeeks,
      validateGitHub
    } = require('../services/validationService');

    const cleanStr = val => typeof val === 'string' ? val.trim() : "";

    const lUsername = cleanStr(leetcodeUsername);
    const ccUsername = cleanStr(codechefUsername);
    const gfgUser = cleanStr(gfgUsername);
    const ghUsername = cleanStr(githubUsername);
    const hrUsername = cleanStr(hackerrankUsername);

    // Validate
    if (lUsername && lUsername !== user.leetcodeUsername) {
      const isValid = await validateLeetCode(lUsername);
      if (!isValid) return res.status(400).json({ message: 'Invalid LeetCode username' });
    }
    if (ccUsername && ccUsername !== user.codechefUsername) {
      const isValid = await validateCodeChef(ccUsername);
      if (!isValid) return res.status(400).json({ message: 'Invalid CodeChef username' });
    }
    if (gfgUser && gfgUser !== user.gfgUsername) {
      const isValid = await validateGeeksforGeeks(gfgUser);
      if (!isValid) return res.status(400).json({ message: 'Invalid GeeksforGeeks username' });
    }
    if (ghUsername && ghUsername !== user.githubUsername) {
      const isValid = await validateGitHub(ghUsername);
      if (!isValid) return res.status(400).json({ message: 'Invalid GitHub username' });
    }

    user.leetcodeUsername = lUsername || undefined;
    user.codechefUsername = ccUsername || undefined;
    user.gfgUsername = gfgUser || undefined;
    user.githubUsername = ghUsername || undefined;
    user.githubUrl = ghUsername ? `https://github.com/${ghUsername}` : undefined;
    user.hackerrankUsername = hrUsername || "";
    if (!hrUsername) {
      user.hackerrank = null;
    } else {
      user.hackerrank = {
        username: hrUsername,
        totalProblemsSolved: user.hackerrank?.totalProblemsSolved || 0,
        badgeCount: user.hackerrank?.badgeCount || 0,
        skills: user.hackerrank?.skills || [],
        certifications: user.hackerrank?.certifications || []
      };
    }
    await user.save();

    let cp = await CodingProfile.findOne({ userId: user._id });
    if (!cp) cp = new CodingProfile({ userId: user._id });

    cp.leetcode.username = lUsername;
    cp.codechef.username = ccUsername;
    cp.geeksforgeeks.username = gfgUser;
    cp.github.username = ghUsername;
    cp.hackerrank.username = hrUsername;
    await cp.save();

    // Trigger full sync
    const updatedUser = await syncPlatformsForUser(user, { force: true });

    return res.json({ message: 'Coding profiles updated and synced successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update coding profiles' });
  }
});

// PUT /me/change-password
router.put('/me/change-password', async (req, res) => {
  try {
    const user = req.currentUser;
    const bcrypt = require('bcryptjs');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
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

      const StudentProfile = require('../models/StudentProfile');
      let profile = await StudentProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = new StudentProfile({ userId: user._id });
      }
      profile.certifications.push({
        title,
        provider: issuer,
        issueDate: date ? new Date(date) : undefined,
        credentialLink: credentialLink || ""
      });
      await profile.save();

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

      const StudentProfile = require('../models/StudentProfile');
      let profile = await StudentProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = new StudentProfile({ userId: user._id });
      }
      profile.projects.push({
        title: name,
        description: Array.isArray(highlights) ? highlights.join('\n') : highlights || "",
        technologies: Array.isArray(techStack)
          ? techStack
          : typeof techStack === 'string'
            ? techStack.split(',').map((s) => s.trim())
            : [],
        githubLink: githubUrl || "",
        liveLink: liveUrl || "",
        startDate: null,
        endDate: null
      });
      await profile.save();

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

// GET own academic profile
router.get('/me/profile/academic', async (req, res) => {
  try {
    const AcademicProfile = require('../models/AcademicProfile');
    const StudentProfile = require('../models/StudentProfile');
    let ap = await AcademicProfile.findOne({ userId: req.currentUser._id });
    let profile = await StudentProfile.findOne({ userId: req.currentUser._id });
    
    const ad = profile?.academicDetails || {};
    
    const apData = ap ? (ap.toObject ? ap.toObject() : ap) : {
      sgpa1: null,
      sgpa2: null,
      sgpa3: null,
      sgpa4: null,
      sgpa5: null,
      sgpa6: null,
      cgpa: null,
      backlogs: 0,
      academicStatus: '-'
    };
    
    return res.json({
      ...apData,
      eapcetRank: ad.eapcetRank ?? null,
      eamcetRank: ad.eamcetRank ?? null,
      jeeMainsRank: ad.jeeMainsRank ?? null,
      jeeMainsPercentile: ad.jeeMainsPercentile ?? null,
      jeeMainsOverallRank: ad.jeeMainsOverallRank ?? null,
      jeeMainsCategoryRank: ad.jeeMainsCategoryRank ?? null,
      jeeAdvOverallRank: ad.jeeAdvOverallRank ?? null,
      jeeAdvCategoryRank: ad.jeeAdvCategoryRank ?? null
    });
  } catch (err) {
    console.error('Fetch own academic profile error:', err);
    return res.status(500).json({ message: 'Failed to fetch academic profile' });
  }
});

// PUT own academic profile
router.put('/me/profile/academic', async (req, res) => {
  try {
    const AcademicProfile = require('../models/AcademicProfile');
    const AcademicProfileAudit = require('../models/AcademicProfileAudit');
    const { syncPlatformsForUser } = require('../services/platformSyncService');

    const {
      sgpa1,
      sgpa2,
      sgpa3,
      sgpa4,
      sgpa5,
      sgpa6,
      cgpa,
      backlogs,
      eapcetRank,
      eamcetRank,
      jeeMainsRank,
      jeeMainsPercentile,
      jeeMainsOverallRank,
      jeeMainsCategoryRank,
      jeeAdvOverallRank,
      jeeAdvCategoryRank
    } = req.body;

    const valOrNull = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 10) throw new Error('GPAs must be numbers between 0 and 10');
      return num;
    };

    const parsedSgpas = {
      sgpa1: valOrNull(sgpa1),
      sgpa2: valOrNull(sgpa2),
      sgpa3: valOrNull(sgpa3),
      sgpa4: valOrNull(sgpa4),
      sgpa5: valOrNull(sgpa5),
      sgpa6: valOrNull(sgpa6)
    };

    const parsedCgpa = valOrNull(cgpa);
    
    let parsedBacklogs = 0;
    if (backlogs !== undefined && backlogs !== null && backlogs !== '') {
      parsedBacklogs = Number(backlogs);
      if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
        return res.status(400).json({ message: 'Backlogs must be a non-negative number' });
      }
    }

    let academicStatus = '-';
    if (parsedCgpa !== null) {
      if (parsedCgpa >= 9.0) academicStatus = 'Excellent';
      else if (parsedCgpa >= 8.0) academicStatus = 'Good';
      else if (parsedCgpa >= 7.0) academicStatus = 'Average';
      else academicStatus = 'Needs Improvement';
    }

    let ap = await AcademicProfile.findOne({ userId: req.currentUser._id });
    const prevData = ap ? {
      sgpa1: ap.sgpa1,
      sgpa2: ap.sgpa2,
      sgpa3: ap.sgpa3,
      sgpa4: ap.sgpa4,
      sgpa5: ap.sgpa5,
      sgpa6: ap.sgpa6,
      cgpa: ap.cgpa,
      backlogs: ap.backlogs,
      academicStatus: ap.academicStatus
    } : null;

    const newData = {
      ...parsedSgpas,
      cgpa: parsedCgpa,
      backlogs: parsedBacklogs,
      academicStatus
    };

    if (!ap) {
      ap = new AcademicProfile({ userId: req.currentUser._id });
    }

    Object.assign(ap, newData);
    await ap.save();

    await AcademicProfileAudit.create({
      userId: req.currentUser._id,
      previousData: prevData,
      newData
    });

    const StudentProfile = require('../models/StudentProfile');
    let profile = await StudentProfile.findOne({ userId: req.currentUser._id });
    if (!profile) {
      profile = new StudentProfile({ userId: req.currentUser._id });
    }
    if (!profile.academicDetails) {
      profile.academicDetails = {};
    }
    
    const validateRank = (val, label) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      if (isNaN(num) || !Number.isInteger(num) || num < 0) {
        throw new Error(`${label} must be a non-negative integer`);
      }
      return num;
    };
    
    if (eapcetRank !== undefined) profile.academicDetails.eapcetRank = validateRank(eapcetRank, 'EAPCET Rank');
    if (eamcetRank !== undefined) profile.academicDetails.eamcetRank = validateRank(eamcetRank, 'EAMCET Rank');
    if (jeeMainsRank !== undefined) profile.academicDetails.jeeMainsRank = validateRank(jeeMainsRank, 'JEE Mains Rank');
    if (jeeMainsPercentile !== undefined) {
      const rawPct = jeeMainsPercentile === '' || jeeMainsPercentile === null || jeeMainsPercentile === undefined ? null : Number(jeeMainsPercentile);
      if (rawPct !== null && (isNaN(rawPct) || rawPct < 0 || rawPct > 100)) {
        throw new Error('JEE Mains Percentile must be a number between 0 and 100');
      }
      profile.academicDetails.jeeMainsPercentile = rawPct !== null ? Number(rawPct.toFixed(2)) : null;
    }
    if (jeeMainsOverallRank !== undefined) profile.academicDetails.jeeMainsOverallRank = validateRank(jeeMainsOverallRank, 'JEE Mains Overall Rank');
    if (jeeMainsCategoryRank !== undefined) profile.academicDetails.jeeMainsCategoryRank = validateRank(jeeMainsCategoryRank, 'JEE Mains Category Rank');
    if (jeeAdvOverallRank !== undefined) profile.academicDetails.jeeAdvOverallRank = validateRank(jeeAdvOverallRank, 'JEE Advanced Overall Rank');
    if (jeeAdvCategoryRank !== undefined) profile.academicDetails.jeeAdvCategoryRank = validateRank(jeeAdvCategoryRank, 'JEE Advanced Category Rank');
    
    await profile.save();

    // Re-evaluate student's placement readiness score
    await syncPlatformsForUser(req.currentUser, { force: true });

    return res.json({ message: 'Academic profile saved successfully', academicProfile: ap });
  } catch (err) {
    console.error('Update own academic profile error:', err);
    return res.status(400).json({ message: err.message || 'Failed to update academic profile' });
  }
});

module.exports = router;

