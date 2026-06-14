const mongoose = require('mongoose');

const ResumeVersionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    templateKey: { type: String, default: 'template_a' },
    layout: {
      sectionsOrder: {
        type: [String],
        default: [
          'academic',
          'profiles',
          'experience',
          'projects',
          'certifications',
          'achievements'
        ]
      },
      hiddenSections: { type: [String], default: [] }
    },
    content: {
      personalDetails: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        githubUrl: { type: String },
        linkedinUrl: { type: String },
        portfolioUrl: { type: String },
        summary: { type: String }
      },
      education: [
        {
          institution: String,
          degree: String,
          fieldOfStudy: String,
          startYear: String,
          endYear: String,
          gpa: String
        }
      ],
      skills: [String],
      projects: [
        {
          name: String,
          description: String,
          techStack: [String],
          githubUrl: String,
          liveUrl: String,
          highlights: [String]
        }
      ],
      workExperience: [
        {
          company: String,
          role: String,
          location: String,
          startDate: Date,
          endDate: Date,
          isCurrent: Boolean,
          description: String
        }
      ],
      certifications: [
        {
          title: String,
          issuer: String,
          date: Date,
          credentialLink: String
        }
      ],
      achievements: [
        {
          title: String,
          description: String,
          date: Date
        }
      ],
      codingProfiles: {
        leetcode: { show: { type: Boolean, default: true }, username: String },
        codechef: { show: { type: Boolean, default: true }, username: String },
        gfg: { show: { type: Boolean, default: true }, username: String },
        github: { show: { type: Boolean, default: true }, username: String }
      },
      hackathons: [
        {
          name: String,
          mode: String,
          teamType: String,
          role: String,
          outcome: String,
          date: Date
        }
      ],
      leadership: [
        {
          role: String,
          organization: String,
          description: String,
          startDate: Date,
          endDate: Date
        }
      ],
      publications: [
        {
          title: String,
          publisher: String,
          date: Date,
          link: String,
          description: String
        }
      ],
      customSections: [
        {
          sectionId: String,
          title: String,
          content: String
        }
      ]
    },
    completenessScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeVersion', ResumeVersionSchema);
