const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postType: {
      type: String,
      enum: [
        'general',          // Student / Alumni / Anyone general post
        'announcement',     // Official Coordinator / Admin notice
        'placement',        // College Placement drive / JD posting / contest link
        'placement_recap',  // Post-drive interview experience & process recap
        'achievement',      // Coding milestone (LC solved, streak, contest rank)
        'showcase',         // Project showcase / research
        'question',         // Tech Q&A / help needed
        'job',              // Job listing / referral
        'event'             // Hackathon, webinar, college event
      ],
      default: 'general'
    },
    title: { type: String, trim: true, default: '' },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'event', 'placement', 'hackathon', 'workshop', 'urgent', 'tech', 'career', 'showcase'],
      default: 'general'
    },
    mediaUrls: [{ type: String }], // Cloudinary image URLs
    metadata: {
      githubUrl: { type: String, default: '' },
      liveUrl: { type: String, default: '' },
      techStack: [{ type: String }],
      company: { type: String, default: '' },
      role: { type: String, default: '' },
      salary: { type: String, default: '' },
      eventDate: { type: Date, default: null },
      registrationLink: { type: String, default: null },
      lcSolved: { type: Number, default: 0 },
      streak: { type: Number, default: 0 }
    },
    // Placement Drive Specific Metadata
    placementMetadata: {
      company: { type: String, default: '' },
      role: { type: String, default: '' },
      jdText: { type: String, default: '' },
      hackerRankUrl: { type: String, default: '' },
      driveDate: { type: Date, default: null },
      taggedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      rounds: [
        {
          name: { type: String, default: '' },        // e.g. "OA", "Technical Round 1", "HR Round"
          description: { type: String, default: '' } // round notes / questions asked
        }
      ],
      feedbackRating: { type: Number, min: 1, max: 5, default: 5 },
      feedbackText: { type: String, default: '' }
    },
    isPinned: { type: Boolean, default: false },
    // Simple likes list for backward compatibility
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // 5-Type LinkedIn Hover Reactions
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
          type: String,
          enum: ['like', 'celebrate', 'support', 'love', 'insightful'],
          default: 'like'
        }
      }
    ],
    commentCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ isPinned: -1, createdAt: -1 });
PostSchema.index({ postType: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
