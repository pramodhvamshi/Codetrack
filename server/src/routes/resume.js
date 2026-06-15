const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ResumeTemplate = require('../models/ResumeTemplate');
const ResumeVersion = require('../models/ResumeVersion');
const ResumeFile = require('../models/ResumeFile');
const ResumeSnapshot = require('../models/ResumeSnapshot');
const ResumeScore = require('../models/ResumeScore');
const ResumeLayout = require('../models/ResumeLayout');
const CustomSection = require('../models/CustomSection');
const path = require('path');

const router = express.Router();

// Ensure all endpoints are student-only
router.use(authMiddleware, requireRole('student'));

/* ================= TEMPLATES ================= */

// GET /templates - Fetch all active templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await ResumeTemplate.find({ isActive: true });
    return res.json(templates);
  } catch (err) {
    console.error('Error fetching templates:', err);
    return res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// POST /templates/upload - Admin-upload custom template (placeholder/admin check)
router.post('/templates/upload', upload.single('templateFile'), async (req, res) => {
  try {
    // Basic role check or allow student for testing in development
    const user = req.currentUser;
    if (user.role !== 'student' && user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Template file (PDF/DOCX) is required' });
    }

    const { name, key, description, recommendedUseCase } = req.body;
    if (!name || !key) {
      return res.status(400).json({ message: 'Name and unique key are required' });
    }

    const fileExt = path.extname(req.file.originalname).substring(1).toLowerCase();
    if (fileExt !== 'pdf' && fileExt !== 'docx') {
      return res.status(400).json({ message: 'Only PDF or DOCX templates are supported' });
    }

    const { uploadResumeFile } = require('../services/storageService');
    const storageResult = await uploadResumeFile(req.file);

    const newTemplate = new ResumeTemplate({
      name,
      key,
      filePath: storageResult.url,
      fileType: fileExt,
      structure: {
        description: description || 'Custom template uploaded by administrator.',
        recommendedUseCase: recommendedUseCase || 'General use',
        atsScore: 85
      },
      isActive: true
    });

    await newTemplate.save();
    return res.status(201).json({ message: 'Custom template uploaded successfully', template: newTemplate });
  } catch (err) {
    console.error('Error uploading template:', err);
    return res.status(500).json({ message: 'Failed to upload template' });
  }
});

/* ================= VERSIONS ================= */

// Helper to pre-populate version content from user profile
function buildDefaultContentFromProfile(user) {
  const ps = user.platformStats || {};
  return {
    personalDetails: {
      name: user.name || '',
      email: user.email || '',
      phone: user.mssid || '', // mapping mssid as phone/student ID fallback
      githubUrl: user.githubUrl || (user.githubUsername ? `https://github.com/${user.githubUsername}` : ''),
      linkedinUrl: user.linkedinUrl || '',
      portfolioUrl: '',
      summary: 'Motivated software engineer student eager to apply technical capabilities in building industry-grade platforms.'
    },
    education: [
      {
        institution: user.college || '',
        degree: 'Bachelor of Technology',
        fieldOfStudy: user.branch || '',
        startYear: user.year ? String(2026 - (4 - Number(user.year))) : '2022',
        endYear: '2026',
        gpa: user.overallGpa != null ? String(user.overallGpa) : ''
      }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
    projects: (user.projects || []).map(p => ({
      name: p.name || '',
      description: p.highlights?.join(' ') || '',
      techStack: p.techStack || [],
      githubUrl: p.githubUrl || '',
      liveUrl: p.liveUrl || '',
      highlights: p.highlights || []
    })),
    workExperience: (user.workExperience || []).map(w => ({
      company: w.company || '',
      role: w.role || '',
      location: w.location || '',
      startDate: w.startDate || null,
      endDate: w.endDate || null,
      isCurrent: !w.endDate,
      description: w.description || ''
    })),
    certifications: (user.certifications || []).map(c => ({
      title: c.title || '',
      issuer: c.issuer || '',
      date: c.date || null,
      credentialLink: c.credentialLink || ''
    })),
    achievements: (user.achievements || []).map(a => ({
      title: a.title || '',
      description: a.description || '',
      date: a.date || null
    })),
    codingProfiles: {
      leetcode: { show: true, username: user.leetcodeUsername || '' },
      codechef: { show: true, username: user.codechefUsername || '' },
      gfg: { show: true, username: user.gfgUsername || '' },
      github: { show: true, username: user.githubUsername || '' }
    },
    hackathons: (user.hackathons || []).map(h => ({
      name: h.name || '',
      mode: h.mode || 'online',
      teamType: h.teamType || 'individual',
      role: h.role || '',
      outcome: h.outcome || '',
      date: h.date || null
    })),
    leadership: [],
    publications: [],
    customSections: []
  };
}

// GET /versions - Fetch all versions (generated and uploaded)
router.get('/versions', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const generatedVersions = await ResumeVersion.find({ userId, source: 'generated' }).sort({ updatedAt: -1 });
    const uploadedFiles = await ResumeFile.find({ userId }).sort({ uploadedAt: -1 });
    
    return res.json({
      generated: generatedVersions,
      uploaded: uploadedFiles
    });
  } catch (err) {
    console.error('Error fetching resume versions:', err);
    return res.status(500).json({ message: 'Failed to fetch resume versions' });
  }
});

// POST /versions - Create new version
router.post('/versions', async (req, res) => {
  try {
    const user = req.currentUser;
    const { name, templateKey } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Resume version name is required' });
    }

    const defaultContent = buildDefaultContentFromProfile(user);

    // Disable all other default versions for this user
    await ResumeVersion.updateMany({ userId: user._id }, { $set: { isDefault: false } });

    const newVersion = new ResumeVersion({
      userId: user._id,
      name,
      templateKey: templateKey || 'template_a',
      content: defaultContent,
      isDefault: true,
      source: 'generated'
    });

    await newVersion.save();

    // Create default ResumeLayout
    const newLayout = new ResumeLayout({
      userId: user._id,
      resumeVersionId: newVersion._id,
      sectionsOrder: newVersion.layout.sectionsOrder,
      hiddenSections: []
    });
    await newLayout.save();

    return res.status(201).json(newVersion);
  } catch (err) {
    console.error('Error creating version:', err);
    return res.status(500).json({ message: 'Failed to create resume version' });
  }
});

// PUT /versions/:id - Update resume builder details
router.put('/versions/:id', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;
    const { name, templateKey, layout, content, completenessScore, atsScore } = req.body;

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    if (name) version.name = name;
    if (templateKey) version.templateKey = templateKey;
    if (layout) version.layout = layout;
    if (content) version.content = content;
    if (completenessScore !== undefined) version.completenessScore = completenessScore;
    if (atsScore !== undefined) version.atsScore = atsScore;

    await version.save();

    // Sync or update ResumeLayout model
    if (layout) {
      await ResumeLayout.findOneAndUpdate(
        { resumeVersionId: version._id, userId },
        {
          sectionsOrder: layout.sectionsOrder || [],
          hiddenSections: layout.hiddenSections || []
        },
        { upsert: true }
      );
    }

    return res.json(version);
  } catch (err) {
    console.error('Error updating version:', err);
    return res.status(500).json({ message: 'Failed to update resume version' });
  }
});

// GET /versions/:id/export - Generate and stream PDF for this version
router.get('/versions/:id/export', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    const { buildResumePdfBuffer } = require('../services/resumeService');
    const buffer = await buildResumePdfBuffer(req.currentUser, {
      template: version.templateKey,
      sections: version.layout?.sectionsOrder,
      hiddenSections: version.layout?.hiddenSections || [],
      content: version.content
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${version.name.toLowerCase().replace(/\s+/g, '-')}.pdf"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error exporting resume PDF:', err);
    return res.status(500).json({ message: 'Failed to export PDF' });
  }
});

// DELETE /versions/:id - Delete a resume version
router.delete('/versions/:id', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;

    const version = await ResumeVersion.findOneAndDelete({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    // Clean up layout, score, snapshots
    await Promise.all([
      ResumeLayout.deleteMany({ resumeVersionId: versionId, userId }),
      ResumeScore.deleteMany({ resumeVersionId: versionId, userId }),
      ResumeSnapshot.deleteMany({ resumeVersionId: versionId, userId })
    ]);

    return res.json({ message: 'Resume version deleted successfully' });
  } catch (err) {
    console.error('Error deleting version:', err);
    return res.status(500).json({ message: 'Failed to delete resume version' });
  }
});

// PUT /versions/:id/default - Set as default
router.put('/versions/:id/default', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;

    // Check if it is a version or a file
    const file = await ResumeFile.findOne({ _id: versionId, userId });
    if (file) {
      await Promise.all([
        ResumeFile.updateMany({ userId }, { $set: { isDefault: false } }),
        ResumeVersion.updateMany({ userId }, { $set: { isDefault: false } })
      ]);
      file.isDefault = true;
      await file.save();
      return res.json({ message: 'Default resume updated to uploaded file' });
    }

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume document not found' });
    }

    await Promise.all([
      ResumeFile.updateMany({ userId }, { $set: { isDefault: false } }),
      ResumeVersion.updateMany({ userId }, { $set: { isDefault: false } })
    ]);

    version.isDefault = true;
    await version.save();

    return res.json({ message: 'Default resume updated to builder version' });
  } catch (err) {
    console.error('Error setting default resume:', err);
    return res.status(500).json({ message: 'Failed to update default resume' });
  }
});

/* ================= SNAPSHOTS HISTORY ================= */

// POST /versions/:id/snapshot - Save snapshot history
router.post('/versions/:id/snapshot', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    const snapshot = new ResumeSnapshot({
      userId,
      resumeVersionId: versionId,
      templateKey: version.templateKey,
      layout: {
        sectionsOrder: version.layout?.sectionsOrder || [],
        hiddenSections: version.layout?.hiddenSections || []
      },
      content: version.content
    });

    await snapshot.save();
    return res.status(201).json(snapshot);
  } catch (err) {
    console.error('Error saving snapshot:', err);
    return res.status(500).json({ message: 'Failed to save snapshot history' });
  }
});

// GET /versions/:id/snapshots - List snapshots
router.get('/versions/:id/snapshots', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;

    const snapshots = await ResumeSnapshot.find({ resumeVersionId: versionId, userId }).sort({ timestamp: -1 });
    return res.json(snapshots);
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return res.status(500).json({ message: 'Failed to fetch snapshots' });
  }
});

// POST /versions/:id/restore/:snapshotId - Restore snapshot
router.post('/versions/:id/restore/:snapshotId', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;
    const snapshotId = req.params.snapshotId;

    const snapshot = await ResumeSnapshot.findOne({ _id: snapshotId, resumeVersionId: versionId, userId });
    if (!snapshot) {
      return res.status(404).json({ message: 'Snapshot not found' });
    }

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    // Save current as a snapshot before restoring so we don't lose current work
    const preRestoreSnapshot = new ResumeSnapshot({
      userId,
      resumeVersionId: versionId,
      templateKey: version.templateKey,
      layout: {
        sectionsOrder: version.layout?.sectionsOrder || [],
        hiddenSections: version.layout?.hiddenSections || []
      },
      content: version.content
    });
    await preRestoreSnapshot.save();

    version.templateKey = snapshot.templateKey;
    version.layout = {
      sectionsOrder: snapshot.layout?.sectionsOrder || [],
      hiddenSections: snapshot.layout?.hiddenSections || []
    };
    version.content = snapshot.content;

    await version.save();
    return res.json(version);
  } catch (err) {
    console.error('Error restoring snapshot:', err);
    return res.status(500).json({ message: 'Failed to restore snapshot' });
  }
});

/* ================= ATS CHECKER ================= */

// POST /versions/:id/ats-check - Run ATS analysis
router.post('/versions/:id/ats-check', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;

    // 1. Check if cached score exists and is fresh (within 5 seconds)
    const cachedScore = await ResumeScore.findOne({ resumeVersionId: versionId, userId });
    if (cachedScore && (Date.now() - new Date(cachedScore.lastCalculatedAt).getTime() < 5000)) {
      return res.json(cachedScore);
    }

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    // Run ATS Analyzer
    let atsScore = 70; // Baseline
    const feedback = [];
    const suggestions = [];

    const content = version.content || {};
    const pd = content.personalDetails || {};
    
    // Check links
    if (pd.linkedinUrl && pd.linkedinUrl.includes('linkedin.com')) {
      atsScore += 5;
    } else {
      suggestions.push('Add a valid LinkedIn profile link.');
    }

    if (pd.githubUrl && pd.githubUrl.includes('github.com')) {
      atsScore += 5;
    } else {
      suggestions.push('Add your GitHub developer profile URL.');
    }

    // Check structure
    const layoutDetails = version.layout || {};
    const hasEducation = layoutDetails.sectionsOrder?.includes('academic') && !layoutDetails.hiddenSections?.includes('academic');
    const hasExperience = layoutDetails.sectionsOrder?.includes('experience') && !layoutDetails.hiddenSections?.includes('experience');
    const hasProjects = layoutDetails.sectionsOrder?.includes('projects') && !layoutDetails.hiddenSections?.includes('projects');
    const hasSkills = layoutDetails.sectionsOrder?.includes('skills') && !layoutDetails.hiddenSections?.includes('skills');

    if (hasEducation && hasExperience && hasProjects && hasSkills) {
      atsScore += 10;
    } else {
      suggestions.push('Ensure core sections (Education, Experience, Projects, Skills) are visible for higher ATS rating.');
    }

    // Text analysis: Action verbs & Technical keywords
    const textBlob = JSON.stringify(content).toLowerCase();
    
    const actionVerbs = ['created', 'developed', 'designed', 'implemented', 'optimized', 'led', 'built', 'solved', 'maintained', 'structured'];
    const matchedVerbs = actionVerbs.filter(verb => textBlob.includes(verb));
    if (matchedVerbs.length >= 4) {
      atsScore += 10;
    } else {
      suggestions.push(`Include more active industry verbs in description fields (e.g. Optimized, Developed, Led).`);
    }

    const techKeywords = ['javascript', 'react', 'node', 'python', 'mongodb', 'sql', 'docker', 'git', 'aws', 'rest api', 'cloud', 'typescript', 'java', 'c++'];
    const matchedKeywords = techKeywords.filter(kw => textBlob.includes(kw));
    if (matchedKeywords.length >= 6) {
      atsScore += 10;
    } else {
      suggestions.push('Incorporate standard technical keywords relevant to the SDE job description in your projects.');
    }

    atsScore = Math.min(atsScore, 100);

    // 2. Cache result in database
    const finalScore = await ResumeScore.findOneAndUpdate(
      { resumeVersionId: versionId, userId },
      {
        score: version.completenessScore || 0,
        atsScore,
        feedback,
        atsSuggestions: suggestions,
        lastCalculatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Sync back to version model
    version.atsScore = atsScore;
    await version.save();

    return res.json(finalScore);
  } catch (err) {
    console.error('Error running ATS checker:', err);
    return res.status(500).json({ message: 'Failed to run ATS analysis' });
  }
});

/* ================= RESUME FILE UPLOAD ================= */

// POST /upload - Upload resume PDF or DOCX file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const userId = req.currentUser._id;
    const originalName = req.file.originalname;
    const fileType = path.extname(originalName).substring(1).toLowerCase();

    if (fileType !== 'pdf' && fileType !== 'docx') {
      return res.status(400).json({ message: 'Only PDF and DOCX files are allowed' });
    }

    // Disable all other default selections
    await Promise.all([
      ResumeFile.updateMany({ userId }, { $set: { isDefault: false } }),
      ResumeVersion.updateMany({ userId }, { $set: { isDefault: false } })
    ]);

    const { uploadResumeFile } = require('../services/storageService');
    const storageResult = await uploadResumeFile(req.file);

    const resumeFile = new ResumeFile({
      userId,
      originalFileName: originalName,
      fileType,
      fileSize: req.file.size,
      publicId: storageResult.publicId,
      resumeUrl: storageResult.url,
      isDefault: true,
      source: 'uploaded'
    });

    await resumeFile.save();

    const extractedData = { name: '', email: '', phone: '', skills: [] };

    return res.status(201).json({
      message: 'Resume file uploaded successfully',
      file: resumeFile,
      extractedData
    });
  } catch (err) {
    console.error('Error uploading resume file:', err);
    return res.status(500).json({ message: 'Failed to upload resume file' });
  }
});

// DELETE /files/:id - Delete uploaded resume file
router.delete('/files/:id', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const fileId = req.params.id;

    const file = await ResumeFile.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    const { deleteResumeFile } = require('../services/storageService');
    await deleteResumeFile(file.publicId);

    await ResumeFile.deleteOne({ _id: fileId, userId });
    return res.json({ message: 'Resume file deleted successfully' });
  } catch (err) {
    console.error('Error deleting resume file:', err);
    return res.status(500).json({ message: 'Failed to delete resume file' });
  }
});

/* ================= GENERAL ANALYTICS & TIPS ================= */

// GET /tips - Fetch placement guidance advice
router.get('/tips', async (req, res) => {
  try {
    const user = req.currentUser;
    const tips = [];
    const suggestions = [];

    // Evaluate profile
    if (!user.projects || user.projects.length < 2) {
      suggestions.push('Add at least 2 key engineering projects to your profile.');
    }
    if (!user.leetcodeUsername && !user.codechefUsername && !user.gfgUsername) {
      suggestions.push('Connect at least one coding profile (LeetCode, CodeChef, or GFG) to showcase technical prowess.');
    }
    if (!user.certifications || user.certifications.length === 0) {
      suggestions.push('Add professional industry certifications (e.g. AWS, Google Cloud, Oracle) to validate skills.');
    }
    if (!user.githubUsername) {
      suggestions.push('Add your GitHub profile URL to showcase open-source contributions.');
    }
    if (user.workExperience && user.workExperience.length === 0) {
      suggestions.push('Add internship or research experience blocks to improve SDE placements.');
    }

    // Generic Placement Tips
    tips.push('Action Verbs: Start project descriptions with strong action verbs like Created, Developed, Led, or Optimised.');
    tips.push('Quantify: Quantify outcomes where possible (e.g., "reduced latency by 30%", "solved 250+ DSA problems").');
    tips.push('ATS Spacing: Avoid multi-column text tables for high ATS scores; use a single-column layout.');

    return res.json({
      tips,
      suggestions
    });
  } catch (err) {
    console.error('Error fetching tips:', err);
    return res.status(500).json({ message: 'Failed to fetch resume tips' });
  }
});

// GET /preview - Returns JSON containing the preview URL
router.get('/preview', async (req, res) => {
  try {
    const user = req.currentUser;
    const ResumeFile = require('../models/ResumeFile');
    const ResumeVersion = require('../models/ResumeVersion');

    const rootUrl = `${req.protocol}://${req.get('host')}`;

    // 1. Check manual uploaded default resume
    const defaultFile = await ResumeFile.findOne({ userId: user._id, isDefault: true });
    if (defaultFile) {
      const url = defaultFile.resumeUrl || defaultFile.storagePath;
      if (url && /^https?:\/\//i.test(url)) {
        console.log("Student Preview URL:", url);
        return res.json({ resumeUrl: url });
      }
    }

    // 2. Check manual mode manualUrl fallback
    if (user.resume?.mode === 'manual' && user.resume?.manualUrl) {
      if (/^https?:\/\//i.test(user.resume.manualUrl)) {
        console.log("Student Preview URL:", user.resume.manualUrl);
        return res.json({ resumeUrl: user.resume.manualUrl });
      }
    }

    // 3. Otherwise builder version
    const defaultVersion = await ResumeVersion.findOne({ userId: user._id, isDefault: true });
    const activeVersion = defaultVersion || await ResumeVersion.findOne({ userId: user._id }).sort({ updatedAt: -1 });

    if (activeVersion) {
      const previewUrl = `${rootUrl}/api/student/resume/versions/${activeVersion._id}/preview`;
      console.log("Student Preview URL:", previewUrl);
      return res.json({ resumeUrl: previewUrl });
    }

    return res.status(404).json({ message: 'No default resume found to preview' });
  } catch (err) {
    console.error('Error in student preview endpoint:', err);
    return res.status(500).json({ message: 'Failed to fetch preview URL' });
  }
});

// GET /versions/:id/preview - Serve PDF inline for student preview
router.get('/versions/:id/preview', async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const versionId = req.params.id;
    const ResumeVersion = require('../models/ResumeVersion');

    const version = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    const { buildResumePdfBuffer } = require('../services/resumeService');
    const buffer = await buildResumePdfBuffer(req.currentUser, {
      template: version.templateKey,
      sections: version.layout?.sectionsOrder,
      hiddenSections: version.layout?.hiddenSections || [],
      content: version.content
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume-preview.pdf"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error serving resume preview PDF:', err);
    return res.status(500).json({ message: 'Failed to preview PDF' });
  }
});

module.exports = router;
