const mongoose = require('mongoose');

/* ================= SUB-SCHEMAS ================= */

const CertificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    date: { type: Date },
    credentialLink: { type: String },
    filePath: { type: String } // uploaded PDF / image
  },
  { _id: false }
);

const AchievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date },
    proofPath: { type: String }
  },
  { _id: false }
);

const HackathonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mode: { type: String, enum: ['online', 'offline'], required: true },
    teamType: { type: String, enum: ['team', 'individual'], required: true },
    role: { type: String },
    outcome: { type: String }, // Winner / Finalist / Participant
    date: { type: Date },
    certificatePath: { type: String }
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // 🔥 Three resume bullet points (max 3)
    highlights: {
      type: [String],
      validate: [
        {
          validator: function (v) {
            return v.length <= 3;
          },
          message: 'Maximum 3 project highlights allowed'
        }
      ],
      default: []
    },

    techStack: [{ type: String }],

    // 🔥 GitHub link (used in resume)
    githubUrl: { type: String },

    // optional live demo
    liveUrl: { type: String },

    screenshotPaths: [{ type: String }]
  },
  { _id: false }
);

/* 🔥 NEW — Work Experience */
const WorkExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date }, // null = Present
    description: { type: String },
    skills: [{ type: String }]
  },
  { _id: false }
);

const HackerRankSchema = new mongoose.Schema(
  {
    username: { type: String },
    totalProblemsSolved: { type: Number, default: 0 },
    badgeCount: { type: Number, default: 0 },
    skills: [{ type: String }],
    certifications: [{ type: String }]
  },
  { _id: false }
);

const PlatformStatsSchema = new mongoose.Schema(
  {
    leetcode: {
      username: { type: String },
      problemsSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      contestCount: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      lastSyncAt: { type: Date },
      submissionCalendar: { type: mongoose.Schema.Types.Mixed, default: {} },
      badges: { type: Array, default: [] },
      badgeCount: { type: Number, default: 0 },
      recentSubmissions: { type: Array, default: [] },
      acceptanceRate: { type: Number, default: 0 },
      contestHistory: { type: Array, default: [] }
    },
    codechef: {
      username: { type: String },
      problemsSolved: { type: Number, default: 0 },
      contestCount: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      currentRating: { type: Number, default: 0 },
      highestRating: { type: Number, default: 0 },
      stars: { type: String, default: '1★' },
      globalRank: { type: Number, default: 0 },
      countryRank: { type: String, default: 'Inactive' },
      lastSyncAt: { type: Date }
    },
    geeksforgeeks: {
      username: { type: String },
      problemsSolved: { type: Number, default: 0 },
      codingScore: { type: Number, default: 0 },
      instituteRank: { type: Number, default: 0 },
      globalRank: { type: Number, default: 0 },
      monthlyScore: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastSyncAt: { type: Date },
      totalProblemsSolved: { type: Number, default: 0 },
      basicProblemsSolved: { type: Number, default: 0 },
      easyProblemsSolved: { type: Number, default: 0 },
      mediumProblemsSolved: { type: Number, default: 0 },
      hardProblemsSolved: { type: Number, default: 0 },
      languageStats: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    github: {
      username: { type: String },
      reposCount: { type: Number, default: 0 },
      starsCount: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      contributions: { type: Array, default: [] },
      lastSyncAt: { type: Date }
    }
  },
  { _id: false }
);

const ScoreSchema = new mongoose.Schema(
  {
    lcScore: { type: Number, default: 0 },
    ccScore: { type: Number, default: 0 },
    gfgScore: { type: Number, default: 0 },
    ghScore: { type: Number, default: 0 },
    hrScore: { type: Number, default: 0 },
    activityScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    weightedRankScore: { type: Number, default: 0 }
  },
  { _id: false }
);

const ResumeSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    manualUrl: { type: String },
    manualPublicId: { type: String },
    lastGeneratedAt: { type: Date },
    uploadedAt: { type: Date }
  },
  { 
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ResumeSchema.virtual('manualPath')
  .get(function() { return this.manualUrl; })
  .set(function(val) { this.manualUrl = val; });

/* ================= USER SCHEMA ================= */

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'coordinator', 'admin'], required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    mssid: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true,
      set: function(val) {
        if (typeof val === 'string' && val.trim() === '') {
          return undefined;
        }
        return val;
      }
    },
    bio: {
      type: String,
      default: ""
    },
    graduationYear: {
      type: String,
      default: ""
    },

    /* Academic */
    college: { type: String },
    hostel: { type: String },
    branch: { type: String },
    year: { type: String },
    currentYear: { type: String, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'], default: '1st Year' },
    overallGpa: { type: Number },

    /* Coding Profiles */
    leetcodeUsername: { type: String },
    codechefUsername: { type: String },
    gfgUsername: { type: String },
    githubUsername: { type: String },
    hackerrankUsername: { type: String, default: "" },
    githubUrl: { type: String },
    linkedinUrl: { type: String },

    /* Manual Coding Platform */
    hackerrank: { type: HackerRankSchema, default: null }, // Optional, can be null

    /* Platform Analytics */
    platformStats: { type: PlatformStatsSchema, default: () => ({}) },
    scores: { type: ScoreSchema, default: () => ({}) },

    /* Unified Activity Streak Metrics */
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    activeDaysCount: { type: Number, default: 0 },
    consistencyPercentage: { type: Number, default: 0 },
    monthlyActivityCount: { type: Number, default: 0 },
    yearlyActivityCount: { type: Number, default: 0 },

    /* Activity Status */
    activityStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    lastPlatformSyncAt: { type: Date },
    lastProfileUpdateAt: { type: Date },
    lastManualActivityAt: { type: Date },

    /* Onboarding */
    isOnboarded: { type: Boolean, default: false },
    profileCompletedAt: { type: Date },

    /* Resume Sections */
    workExperience: { type: [WorkExperienceSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    achievements: { type: [AchievementSchema], default: [] },
    hackathons: { type: [HackathonSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },

    resume: { type: ResumeSchema, default: () => ({}) }
  },
  { timestamps: true }
);

/* 🔎 Indexes for long-term stability */
UserSchema.index({ email: 1 });
UserSchema.index({ 'scores.totalScore': -1 });
UserSchema.index({ 'scores.weightedRankScore': -1 });

module.exports = mongoose.model('User', UserSchema);
