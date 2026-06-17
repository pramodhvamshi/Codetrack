const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CodingProfile = require('../models/CodingProfile');
const ResumeVersion = require('../models/ResumeVersion');
const { calculateProfileCompletion, calculatePlacementReadiness } = require('./profileMetrics');

function mapYear(yearVal, gradYearVal) {
  if (['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(yearVal)) return yearVal;
  
  const y = String(yearVal || "").trim();
  if (y === '1') return '1st Year';
  if (y === '2') return '2nd Year';
  if (y === '3') return '3rd Year';
  if (y === '4') return '4th Year';

  const g = String(gradYearVal || "").trim();
  if (g.includes('2029') || g.includes('2028') || g.includes('2027') || g.includes('2026')) {
    if (g.includes('2029')) return '1st Year';
    if (g.includes('2028')) return '2nd Year';
    if (g.includes('2027')) return '3rd Year';
    if (g.includes('2026')) return '4th Year';
  }
  return '1st Year';
}

async function runMigration() {
  try {
    console.log('Connecting to database...');
    // Connect to MongoDB using URI from environment configuration
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students to migrate.`);

    for (const user of students) {
      console.log(`Migrating student: ${user.name} (${user.email})`);

      // 1. Create or load StudentProfile
      let profile = await StudentProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = new StudentProfile({ userId: user._id });
      }

      // Map year
      const currentYear = mapYear(user.year, user.graduationYear);
      user.currentYear = currentYear;
      user.year = currentYear === '1st Year' ? '1' : currentYear === '2nd Year' ? '2' : currentYear === '3rd Year' ? '3' : '4';

      const pd = profile.personalDetails || {};
      const ssc = {
        schoolName: (pd.ssc && pd.ssc.schoolName) || "",
        board: (pd.ssc && pd.ssc.board) || "",
        percentage: (pd.ssc && pd.ssc.percentage != null) ? pd.ssc.percentage : null,
        passoutYear: (pd.ssc && pd.ssc.passoutYear != null) ? pd.ssc.passoutYear : null
      };
      const intermediate = {
        collegeName: (pd.intermediate && pd.intermediate.collegeName) || "",
        board: (pd.intermediate && pd.intermediate.board) || "",
        percentage: (pd.intermediate && pd.intermediate.percentage != null) ? pd.intermediate.percentage : null,
        passoutYear: (pd.intermediate && pd.intermediate.passoutYear != null) ? pd.intermediate.passoutYear : null
      };

      // Update personalDetails inside StudentProfile
      profile.personalDetails = {
        fullName: user.name || "",
        gender: pd.gender || "",
        dob: pd.dob || null,
        mobile: pd.mobile || "",
        email: user.email || "",
        hostelName: user.hostel || "",
        branch: user.branch || "",
        year: currentYear,
        section: pd.section || "",
        college: user.college || "",
        permanentAddress: pd.permanentAddress || "",
        city: pd.city || "",
        district: pd.district || "",
        state: pd.state || "",
        pincode: pd.pincode || "",
        ssc,
        intermediate
      };

      // Set familyDetails defaults if none
      if (!profile.familyDetails?.parentStatus) {
        profile.familyDetails = {
          parentStatus: 'Both Parents',
          father: { name: "", occupation: "", education: "", mobile: "" },
          mother: { name: "", occupation: "", education: "", mobile: "" },
          siblings: []
        };
      }

      // Migrate projects
      if (Array.isArray(user.projects) && user.projects.length > 0 && profile.projects.length === 0) {
        profile.projects = user.projects.map(p => ({
          title: p.name || "",
          description: p.highlights?.join('\n') || "",
          technologies: p.techStack || [],
          githubLink: p.githubUrl || "",
          liveLink: p.liveUrl || "",
          startDate: null,
          endDate: null
        }));
      }

      // Migrate experiences
      if (Array.isArray(user.workExperience) && user.workExperience.length > 0 && profile.experiences.length === 0) {
        profile.experiences = user.workExperience.map(w => ({
          company: w.company || "",
          role: w.role || "",
          startDate: w.startDate || new Date(),
          endDate: w.endDate || null,
          description: w.description || ""
        }));
      }

      // Migrate certifications
      if (Array.isArray(user.certifications) && user.certifications.length > 0 && profile.certifications.length === 0) {
        profile.certifications = user.certifications.map(c => ({
          title: c.title || "",
          provider: c.issuer || "",
          issueDate: c.date || null,
          credentialLink: c.credentialLink || ""
        }));
      }

      // Migrate skills
      if (user.platformStats?.leetcode?.skills && profile.skills.length === 0) {
        profile.skills = user.platformStats.leetcode.skills;
      } else if (profile.skills.length === 0) {
        profile.skills = ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'];
      }

      // 2. Create or load CodingProfile
      let codingProfile = await CodingProfile.findOne({ userId: user._id });
      if (!codingProfile) {
        codingProfile = new CodingProfile({ userId: user._id });
      }

      // Sync usernames
      codingProfile.github.username = user.githubUsername || "";
      codingProfile.github.stats = user.platformStats?.github || {};
      codingProfile.github.publicRepos = user.platformStats?.github?.reposCount || 0;
      codingProfile.github.followers = user.platformStats?.github?.followersCount || 0;
      codingProfile.github.following = user.platformStats?.github?.followingCount || 0;
      codingProfile.github.contributions = user.platformStats?.github?.contributions?.length || 0;
      codingProfile.github.starsCount = user.platformStats?.github?.starsCount || 0;
      codingProfile.github.lastSyncAt = user.platformStats?.github?.lastSyncAt || null;

      codingProfile.leetcode.username = user.leetcodeUsername || "";
      codingProfile.leetcode.stats = user.platformStats?.leetcode || {};
      codingProfile.leetcode.lastSyncAt = user.platformStats?.leetcode?.lastSyncAt || null;

      codingProfile.geeksforgeeks.username = user.gfgUsername || "";
      codingProfile.geeksforgeeks.stats = user.platformStats?.geeksforgeeks || {};
      codingProfile.geeksforgeeks.lastSyncAt = user.platformStats?.geeksforgeeks?.lastSyncAt || null;

      codingProfile.codechef.username = user.codechefUsername || "";
      codingProfile.codechef.stats = user.platformStats?.codechef || {};
      codingProfile.codechef.lastSyncAt = user.platformStats?.codechef?.lastSyncAt || null;

      // HackerRank username init
      if (user.hackerrank?.username) {
        user.hackerrankUsername = user.hackerrank.username;
        codingProfile.hackerrank.username = user.hackerrank.username;
        codingProfile.hackerrank.problemSolving = {
          solved: user.hackerrank.totalProblemsSolved || 0,
          totalChallenges: 0,
          stars: 0,
          rank: 0,
          points: 0
        };
      }

      // 3. Compute metrics
      profile.profileCompletion = calculateProfileCompletion(user, profile);

      const defaultResume = await ResumeVersion.findOne({ userId: user._id, isDefault: true });
      const readiness = calculatePlacementReadiness(user, profile, codingProfile, defaultResume);
      profile.readinessProfile = readiness;

      // Save StudentProfile and CodingProfile
      await profile.save();
      await codingProfile.save();

      // Clean up User duplicate arrays (clear them so there is no duplicate storage!)
      user.projects = [];
      user.workExperience = [];
      user.certifications = [];

      await user.save();
    }

    console.log('Migration completed successfully.');
    mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the script directly if invoked
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
