const RoadmapProgress = require('../models/Roadmap/RoadmapProgress');
const DSAProgress = require('../models/DSA/DSAProgress');
const ResumeAnalysis = require('../models/Resume/ResumeAnalysis');
const InterviewSession = require('../models/Interview/InterviewSession');

exports.getUnifiedProgress = async (studentId) => {
  try {
    // Execute all DB queries concurrently
    const [roadmapProgress, dsaProgress, recentInterviews] = await Promise.all([
      RoadmapProgress.find({ studentId }).lean(),
      DSAProgress.find({ studentId }).lean(),
      InterviewSession.find({ studentId }).sort({ createdAt: -1 }).limit(5).lean(),
      // We will add Resume queries later when we finish extracting Resume logic
    ]);

    // Format the progress into a single unified object
    return {
      roadmaps: {
        totalNodesCompleted: roadmapProgress.filter((p) => p.status === 'Done').length,
        nodes: roadmapProgress,
      },
      dsa: {
        totalProblemsCompleted: dsaProgress.filter((p) => p.status === 'Completed').length,
        problems: dsaProgress,
      },
      interviews: {
        totalSessions: recentInterviews.length,
        recent: recentInterviews,
      },
      // resumes: {} // Placeholder
    };
  } catch (error) {
    throw error;
  }
};
