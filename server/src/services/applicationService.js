const Application = require('../models/Application');
const Job = require('../models/Job');
const ResumeFile = require('../models/ResumeFile');
const ResumeVersion = require('../models/ResumeVersion');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { uploadResumeFile } = require('./storageService');

/**
 * Fetch all available resumes for a student from Resume Studio & Uploads
 */
async function getStudentResumes(userId) {
  const resumes = [];

  // 1. Fetch uploaded PDF resumes from ResumeFile collection
  const uploadedFiles = await ResumeFile.find({ userId })
    .sort({ uploadedAt: -1 })
    .lean();

  uploadedFiles.forEach(file => {
    resumes.push({
      id: file._id.toString(),
      title: file.originalFileName || 'Uploaded Resume PDF',
      type: 'pdf',
      resumeUrl: file.resumeUrl,
      updatedAt: file.uploadedAt || file.createdAt,
      isDefault: file.isDefault || false,
      source: 'Resume Upload'
    });
  });

  // 2. Fetch built resume versions from ResumeVersion collection
  const builtVersions = await ResumeVersion.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();

  builtVersions.forEach(ver => {
    resumes.push({
      id: ver._id.toString(),
      title: ver.title || 'Resume Studio Version',
      type: 'studio',
      resumeUrl: ver.renderedPdfUrl || ver.pdfUrl || '',
      updatedAt: ver.updatedAt || ver.createdAt,
      isDefault: ver.isDefault || false,
      source: 'Resume Studio'
    });
  });

  // 3. Fallback: User profile manual resume URL if set
  const user = await User.findById(userId).select('resume name').lean();
  if (user?.resume?.manualUrl) {
    const exists = resumes.some(r => r.resumeUrl === user.resume.manualUrl);
    if (!exists) {
      resumes.push({
        id: `profile_manual_${user._id}`,
        title: `${user.name}'s Profile Resume`,
        type: 'pdf',
        resumeUrl: user.resume.manualUrl,
        updatedAt: user.resume.uploadedAt || new Date(),
        isDefault: true,
        source: 'Profile Resume'
      });
    }
  }

  return resumes;
}

/**
 * Upload a new PDF resume directly to Cloudinary & save to ResumeFile collection
 */
async function uploadStudentResumeFile(userId, file) {
  if (!file) {
    throw new Error('No resume file provided');
  }

  const result = await uploadResumeFile(file);

  const newResumeFile = await ResumeFile.create({
    userId,
    resumeUrl: result.url,
    publicId: result.publicId,
    originalFileName: result.fileName || file.originalname,
    fileType: 'pdf',
    fileSize: file.size,
    isDefault: true,
    source: 'uploaded'
  });

  // Set as manual resume in user profile
  await User.findByIdAndUpdate(userId, {
    'resume.manualUrl': result.url,
    'resume.manualPublicId': result.publicId,
    'resume.uploadedAt': new Date()
  });

  return {
    id: newResumeFile._id.toString(),
    title: newResumeFile.originalFileName,
    type: 'pdf',
    resumeUrl: newResumeFile.resumeUrl,
    updatedAt: newResumeFile.uploadedAt,
    isDefault: true,
    source: 'Resume Upload'
  };
}

/**
 * Submit job application
 */
async function submitApplication({ jobId, applicantId, resumeId = null, resumeUrl = null, coverLetter = '' }) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error('Job listing not found');
  }

  if (job.status !== 'active') {
    throw new Error('This job listing is no longer active');
  }

  // Check if applicant already applied
  const existing = await Application.findOne({ job: jobId, applicant: applicantId });
  if (existing) {
    throw new Error('You have already applied to this position');
  }

  let finalResumeUrl = resumeUrl;

  // Resolve resumeUrl from resumeId if provided
  if (resumeId && !finalResumeUrl) {
    const resumeFile = await ResumeFile.findById(resumeId);
    if (resumeFile) {
      finalResumeUrl = resumeFile.resumeUrl;
    } else {
      const resumeVer = await ResumeVersion.findById(resumeId);
      if (resumeVer) {
        finalResumeUrl = resumeVer.renderedPdfUrl || resumeVer.pdfUrl;
      }
    }
  }

  // Fallback to student profile resume URL
  // Fetch student profile for live coding metrics snapshot
  const applicantUser = await User.findById(applicantId)
    .select('platformStats scores currentStreak overallGpa resume')
    .lean();

  const codingMetricsSnapshot = {
    leetcodeSolved: applicantUser?.platformStats?.leetcode?.totalSolved || applicantUser?.platformStats?.leetcode?.problemsSolved || 0,
    leetcodeRating: applicantUser?.platformStats?.leetcode?.rating || 0,
    codechefRating: applicantUser?.platformStats?.codechef?.rating || applicantUser?.platformStats?.codechef?.currentRating || 0,
    gfgScore: applicantUser?.platformStats?.geeksforgeeks?.codingScore || applicantUser?.platformStats?.geeksforgeeks?.totalProblemsSolved || 0,
    totalScore: Math.round(applicantUser?.scores?.totalScore || 0),
    currentStreak: applicantUser?.currentStreak || 0,
    gpa: applicantUser?.overallGpa || 0
  };

  const application = await Application.create({
    job: jobId,
    applicant: applicantId,
    alumnus: job.author,
    resumeUrl: finalResumeUrl,
    coverLetter,
    codingMetricsSnapshot
  });

  // Increment applicant count on job
  await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

  // Notify job author
  createNotification({
    recipientId: job.author,
    senderId: applicantId,
    type: 'job_alert',
    title: '📩 New Job Application Received',
    message: `A student applied for your posting "${job.title}" at ${job.company}`,
    targetUrl: `/jobs?view=applications&jobId=${job._id}`
  });

  return application;
}

/**
 * Get applications submitted by student
 */
async function getStudentApplications(applicantId) {
  return await Application.find({ applicant: applicantId })
    .populate('job')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get applications received for a job listing
 */
async function getJobApplications(jobId, authorId) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  if (job.author.toString() !== authorId.toString()) {
    throw new Error('Unauthorized access to job applications');
  }

  return await Application.find({ job: jobId })
    .populate('applicant', 'name email role branch currentYear scores')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Update application status (Pending, Reviewed, Accepted, Rejected)
 */
async function updateApplicationStatus(applicationId, status, authorId) {
  const application = await Application.findById(applicationId).populate('job');
  if (!application) {
    throw new Error('Application not found');
  }

  if (application.job.author.toString() !== authorId.toString()) {
    throw new Error('Unauthorized');
  }

  application.status = status;
  await application.save();

  // Notify applicant
  createNotification({
    recipientId: application.applicant,
    senderId: authorId,
    type: 'job_alert',
    title: '💼 Application Status Update',
    message: `Your application for "${application.job.title}" is now marked as ${status.toUpperCase()}`,
    targetUrl: `/jobs?view=my-applications`
  });

  return application;
}

module.exports = {
  getStudentResumes,
  uploadStudentResumeFile,
  submitApplication,
  getStudentApplications,
  getJobApplications,
  updateApplicationStatus
};
