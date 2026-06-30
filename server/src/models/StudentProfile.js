const mongoose = require('mongoose');

const AcademicEntrySchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, default: "" },
  branch: { type: String, default: "" },
  cgpa: { type: String, default: "" },
  startYear: { type: String, default: "" },
  endYear: { type: String, default: "" }
}, { _id: false });

const ProjectEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  technologies: [{ type: String }],
  githubLink: { type: String, default: "" },
  liveLink: { type: String, default: "" },
  startDate: { type: Date },
  endDate: { type: Date }
}, { _id: false });

const ExperienceEntrySchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String, default: "" }
}, { _id: false });

const CertificationEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, required: true },
  issueDate: { type: Date },
  credentialLink: { type: String, default: "" }
}, { _id: false });

const HackathonEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizer: { type: String, default: "" },
  date: { type: Date },
  teamSize: { type: Number, default: 1 },
  position: { type: String, default: "" },
  result: { type: String, default: "" },
  description: { type: String, default: "" },
  certificateLink: { type: String, default: "" }
}, { _id: false });

const SiblingEntrySchema = new mongoose.Schema({
  name: { type: String, default: "" },
  relation: { type: String, default: "" },
  educationStatus: { type: String, default: "" },
  occupation: { type: String, default: "" }
}, { _id: false });

const ParentEntrySchema = new mongoose.Schema({
  name: { type: String, default: "" },
  occupation: { type: String, default: "" },
  education: { type: String, default: "" },
  mobile: { type: String, default: "" }
}, { _id: false });

const MentorSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  mobileNumber: { type: String, default: "" }
}, { _id: false });

const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  goal: {
    type: String,
    enum: [
      'Placement & Paid Internship Track',
      'GATE & Higher Studies Track',
      'PSU & Government Track',
      'Both Placement and GATE'
    ],
    default: null
  },

  collegeMentor: { type: MentorSchema, default: () => ({}) },
  academicMentor: { type: MentorSchema, default: () => ({}) },
  codingMentor: { type: MentorSchema, default: () => ({}) },
  communicationMentor: { type: MentorSchema, default: () => ({}) },
  projectMentor: { type: MentorSchema, default: () => ({}) },

  academicDetails: {
    eapcetRank: { type: Number, default: null },
    eamcetRank: { type: Number, default: null },
    jeeMainsRank: { type: Number, default: null },
    jeeMainsPercentile: { type: Number, default: null },
    jeeMainsOverallRank: { type: Number, default: null },
    jeeMainsCategoryRank: { type: Number, default: null },
    jeeAdvOverallRank: { type: Number, default: null },
    jeeAdvCategoryRank: { type: Number, default: null }
  },
  
  personalDetails: {
    fullName: { type: String, default: "" },
    gender: { type: String, default: "" },
    dob: { type: Date },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    hostelName: { type: String, default: "" },
    branch: { type: String, default: "" },
    year: { type: String, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'], default: '1st Year' },
    section: { type: String, default: "" },
    college: { type: String, default: "" },
    rollNumber: { type: String, default: "" },
    mentorName: { type: String, default: "" },
    
    // Address fields
    permanentAddress: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    
    // SSC details
    ssc: {
      schoolName: { type: String, default: "" },
      board: { type: String, default: "" },
      percentage: { type: Number },
      passoutYear: { type: Number }
    },
    // Intermediate / Diploma details
    intermediate: {
      collegeName: { type: String, default: "" },
      board: { type: String, default: "" },
      percentage: { type: Number },
      passoutYear: { type: Number }
    }
  },

  familyDetails: {
    parentStatus: { type: String, enum: ['Single Parent', 'Father Only', 'Mother Only', 'Both Parents'], default: 'Both Parents' },
    father: ParentEntrySchema,
    mother: ParentEntrySchema,
    siblings: [SiblingEntrySchema]
  },

  education: [AcademicEntrySchema],
  skills: [{ type: String }],
  projects: [ProjectEntrySchema],
  experiences: [ExperienceEntrySchema],
  certifications: [CertificationEntrySchema],
  hackathons: [HackathonEntrySchema],
  
  // Phase 2: Extensible Mandatory Accomplishment Module
  mandatoryAccomplishments: {
    technicalCourses: [{
      courseName: { type: String, required: true },
      platform: { type: String, required: true },
      completionDate: { type: Date },
      status: { type: String, enum: ['Completed', 'In Progress'], default: 'Completed' },
      certificateLink: { type: String, default: "" }
    }],
    codingConsistency: {
      arraysSolved: { type: Number, default: 0 },
      stringsSolved: { type: Number, default: 0 },
      lastSyncedAt: { type: Date, default: null }
    },
    projects: [{
      projectName: { type: String, required: true },
      description: { type: String, default: "" },
      technologies: [{ type: String }],
      githubLink: { type: String, default: "" },
      liveLink: { type: String, default: "" },
      driveLink: { type: String, default: "" }
    }],
    contestPerformance: {
      leetcodeRating: { type: Number, default: 0 },
      codechefRating: { type: Number, default: 0 },
      selectedPlatform: { type: String, default: "" }
    },
    hackathons: [{
      hackathonName: { type: String, required: true },
      organizer: { type: String, default: "" },
      date: { type: Date },
      position: { type: String, default: "" },
      description: { type: String, default: "" },
      certificateLink: { type: String, default: "" }
    }],
    personalityActivities: [{
      activityName: { type: String, required: true },
      organizer: { type: String, default: "" },
      date: { type: Date },
      description: { type: String, default: "" },
      certificateLink: { type: String, default: "" }
    }],
    // Extensible generic calculated scores store
    calculatedScores: {
      type: Map,
      of: Number,
      default: {
        cgpa: 0,
        technicalCourses: 0,
        codingConsistency: 0,
        projects: 0,
        contestPerformance: 0,
        hackathons: 0,
        personalityDevelopment: 0,
        total: 0
      }
    }
  },
  
  // Profile Completeness metric
  profileCompletion: { type: Number, default: 0 },
  
  // Placement Readiness Cache
  readinessProfile: {
    dsaScore: { type: Number, default: 0 },
    projectsScore: { type: Number, default: 0 },
    resumeScore: { type: Number, default: 0 },
    profileScore: { type: Number, default: 0 },
    overallReadiness: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
