import React, { useEffect, useState, useRef, useTransition } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { ResumePreviewHTML } from '../../components/ResumePreviewHTML';
import { 
  ArrowUp, ArrowDown, Eye, EyeOff, Download, 
  Layout, Upload, CheckCircle, RefreshCw, AlertCircle,
  Plus, Trash2, ShieldCheck, Compass, Sparkles, BookOpen, 
  User, History, FileText, Settings, Award, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';

export function StudentResume() {
  const { token } = useAuth();
  
  // Versions and Uploads list
  const [versions, setVersions] = useState([]);
  const [uploads, setUploads] = useState([]);
  
  // Current active builder version
  const [currentVersion, setCurrentVersion] = useState(null);
  
  // UI Panels state
  const [selectedTemplate, setSelectedTemplate] = useState('single_column');
  const [templatesList, setTemplatesList] = useState([]);
  const [editorMode, setEditorMode] = useState('builder'); // builder, uploads
  const [previewTemplateModal, setPreviewTemplateModal] = useState(null);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  // Canonical template metadata
  const templateMappings = {
    single_column: {
      category: 'single',
      title: 'Single Column',
      subtitle: 'ATS Professional',
      description: 'Clean, single-column ATS-optimized layout. White background, dark text, no colors. Perfect for all placement and job applications.',
      atsScore: 96,
      tag: 'Recommended',
      preview: '/single_column_preview.png'
    },
    double_column: {
      category: 'double',
      title: 'Double Column',
      subtitle: 'Professional Layout',
      description: 'Balanced two-column layout with skills/education on the left and experience/projects on the right. Corporate-grade, no colors.',
      atsScore: 91,
      tag: 'Professional',
      preview: '/double_column_preview.png'
    }
  };

  // Legacy key mapping (so old saved versions render correctly)
  const LEGACY_KEY_MAP = {
    template_a: 'single_column', template_c: 'single_column',
    template_d: 'single_column', template_f: 'single_column',
    template_b: 'double_column', template_e: 'double_column'
  };

  const resolveTemplateKey = (k) => LEGACY_KEY_MAP[k] || k || 'single_column';
  const [activeAccordion, setActiveAccordion] = useState('personal'); // personal, education, skills, projects, experience, achievements, profiles, custom
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Snapshot states
  const [snapshots, setSnapshots] = useState([]);
  const [showingSnapshots, setShowingSnapshots] = useState(false);

  // Tips and Extracted data states
  const [tips, setTips] = useState({ tips: [], suggestions: [] });
  const [parserModal, setParserModal] = useState(null); // stores { extractedData, fileId }
  const [isParsing, setIsParsing] = useState(false);

  // ATS Checker States
  const [atsDetails, setAtsDetails] = useState({ score: 70, suggestions: [] });
  const [calculatingAts, setCalculatingAts] = useState(false);

  // Local Form state for editing (will be synced to currentVersion and live preview)
  const [formData, setFormData] = useState({
    personalDetails: { name: '', email: '', phone: '', githubUrl: '', linkedinUrl: '', portfolioUrl: '', summary: '' },
    education: [],
    skills: [],
    projects: [],
    workExperience: [],
    certifications: [],
    achievements: [],
    codingProfiles: { leetcode: { show: true, username: '' }, codechef: { show: true, username: '' }, gfg: { show: true, username: '' }, github: { show: true, username: '' } },
    hackathons: [],
    leadership: [],
    publications: [],
    customSections: []
  });

  const [layout, setLayout] = useState({
    sectionsOrder: ['academic', 'profiles', 'experience', 'projects', 'certifications', 'achievements'],
    hiddenSections: []
  });

  const backendBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

  // Load all initial data (versions, uploads, active templates)
  const loadInitialData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch versions & uploads
      const data = await api.getJson('/student/resume/versions', token);
      setVersions(data.generated || []);
      setUploads(data.uploaded || []);

      // Seed templates metadata
      const templates = await api.getJson('/student/resume/templates', token);
      setTemplatesList(templates || []);

      // Fetch dynamic placement tips
      const tipsData = await api.getJson('/student/resume/tips', token);
      setTips(tipsData);

      // Select default version if available
      const defaultVer = (data.generated || []).find(v => v.isDefault) || data.generated?.[0];
      if (defaultVer) {
        selectVersion(defaultVer);
      } else {
        // Create an initial version if none exists
        handleCreateVersion("My Master Resume");
      }
    } catch (err) {
      console.error('Failed to load resume data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [token]);

  // Load snapshots for the current version
  const loadSnapshots = async (vId) => {
    if (!token || !vId) return;
    try {
      const list = await api.getJson(`/student/resume/versions/${vId}/snapshots`, token);
      setSnapshots(list || []);
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    }
  };

  // Switch to select a specific version
  const selectVersion = (version) => {
    setCurrentVersion(version);
    setSelectedTemplate(resolveTemplateKey(version.templateKey) || 'single_column');
    setFormData(version.content || {});
    setLayout(version.layout || {
      sectionsOrder: ['academic', 'profiles', 'experience', 'projects', 'certifications', 'achievements'],
      hiddenSections: []
    });
    setShowingSnapshots(false);
    loadSnapshots(version._id);
    
    // Set initial ATS details from version cache
    setAtsDetails({
      score: version.atsScore || 70,
      suggestions: []
    });
  };

  // Run ATS Checker
  const runAtsCheck = async () => {
    if (!token || !currentVersion) return;
    setCalculatingAts(true);
    try {
      // First save draft
      const completeness = calculateCompleteness();
      await api.putJson(`/student/resume/versions/${currentVersion._id}`, {
        templateKey: selectedTemplate,
        layout,
        content: formData,
        completenessScore: completeness
      }, token);

      // Call ATS checker
      const res = await api.postJson(`/student/resume/versions/${currentVersion._id}/ats-check`, {}, token);
      setAtsDetails({
        score: res.atsScore || 70,
        suggestions: res.atsSuggestions || []
      });
    } catch (err) {
      console.error('ATS check failed:', err);
    } finally {
      setCalculatingAts(false);
    }
  };

  // Create a new version
  const handleCreateVersion = async (name) => {
    if (!token || !name) return;
    try {
      const response = await api.postJson('/student/resume/versions', { name, templateKey: selectedTemplate }, token);
      setVersions([response, ...versions]);
      selectVersion(response);
    } catch (err) {
      alert('Failed to create version: ' + err.message);
    }
  };

  // Save current version state (debounce or manual trigger)
  const handleSave = async () => {
    if (!token || !currentVersion) return;
    try {
      const completeness = calculateCompleteness();
      const updated = await api.putJson(`/student/resume/versions/${currentVersion._id}`, {
        templateKey: selectedTemplate,
        layout,
        content: formData,
        completenessScore: completeness,
        atsScore: currentVersion.atsScore || 85 // placeholder until calculated
      }, token);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      // Refresh local version list state
      setVersions(versions.map(v => v._id === updated._id ? updated : v));
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  // Save Snapshot
  const handleCreateSnapshot = async () => {
    if (!token || !currentVersion) return;
    try {
      await api.postJson(`/student/resume/versions/${currentVersion._id}/snapshot`, {}, token);
      loadSnapshots(currentVersion._id);
      alert('Snapshot created successfully!');
    } catch (err) {
      alert('Failed to save snapshot: ' + err.message);
    }
  };

  // Restore Snapshot
  const handleRestoreSnapshot = async (snapId) => {
    if (!token || !currentVersion || !snapId) return;
    if (!window.confirm("Are you sure you want to restore this snapshot? Current draft will be backed up as a new snapshot.")) return;
    try {
      const restored = await api.postJson(`/student/resume/versions/${currentVersion._id}/restore/${snapId}`, {}, token);
      selectVersion(restored);
      alert('Snapshot restored successfully!');
    } catch (err) {
      alert('Failed to restore snapshot: ' + err.message);
    }
  };

  // Delete Version
  const handleDeleteVersion = async (vId) => {
    if (!token || !vId) return;
    if (!window.confirm("Delete this resume version forever?")) return;
    try {
      await api.deleteJson(`/student/resume/versions/${vId}`, token);
      const remaining = versions.filter(v => v._id !== vId);
      setVersions(remaining);
      if (currentVersion?._id === vId && remaining.length > 0) {
        selectVersion(remaining[0]);
      } else if (remaining.length === 0) {
        handleCreateVersion("My Master Resume");
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Set default resume
  const handleSetDefault = async (rId) => {
    if (!token || !rId) return;
    try {
      await api.putJson(`/student/resume/versions/${rId}/default`, {}, token);
      // Refresh list to update badge states
      const data = await api.getJson('/student/resume/versions', token);
      setVersions(data.generated || []);
      setUploads(data.uploaded || []);
      alert('Default resume updated successfully!');
    } catch (err) {
      alert('Failed to set default: ' + err.message);
    }
  };

  // Export/Download PDF from Backend
  const handleDownloadPDF = async () => {
    if (!token || !currentVersion) return;
    try {
      // First save current edits
      await handleSave();
      
      const downloadUrl = `${backendBase}/student/resume/versions/${currentVersion._id}/export`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('PDF generation failed');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${currentVersion.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Failed to download PDF: ' + err.message);
    }
  };

  /* ================= DRAG AND DROP / SECTION ORDERING ================= */
  const moveSection = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layout.sectionsOrder.length) return;

    const updatedOrder = [...layout.sectionsOrder];
    const temp = updatedOrder[index];
    updatedOrder[index] = updatedOrder[newIndex];
    updatedOrder[newIndex] = temp;

    setLayout({
      ...layout,
      sectionsOrder: updatedOrder
    });
  };

  const toggleSectionVisibility = (key) => {
    const isHidden = layout.hiddenSections.includes(key);
    const updatedHidden = isHidden
      ? layout.hiddenSections.filter(k => k !== key)
      : [...layout.hiddenSections, key];

    setLayout({
      ...layout,
      hiddenSections: updatedHidden
    });
  };

  /* ================= SCORING ENGINE ================= */
  const calculateCompleteness = () => {
    let score = 0;
    const pd = formData.personalDetails || {};
    if (pd.name && pd.email && pd.phone) score += 20;
    if (pd.summary) score += 10;
    if (formData.education && formData.education.length > 0) score += 15;
    if (formData.skills && formData.skills.length >= 5) score += 15;
    if (formData.projects && formData.projects.length >= 2) score += 20;
    if (formData.workExperience && formData.workExperience.length > 0) score += 10;
    
    const lc = formData.codingProfiles?.leetcode || {};
    const cc = formData.codingProfiles?.codechef || {};
    if (lc.username || cc.username) score += 10;

    return Math.min(score, 100);
  };

  const completenessScore = calculateCompleteness();

  const getMissingRecommendations = () => {
    const list = [];
    const pd = formData.personalDetails || {};
    if (!pd.name || !pd.email || !pd.phone) list.push("Personal contact details are incomplete.");
    if (!pd.summary) list.push("Add a short Professional Summary profile statement.");
    if (!formData.education || formData.education.length === 0) list.push("Add your college/academic institution.");
    if (!formData.skills || formData.skills.length < 5) list.push("Add at least 5 tech skills.");
    if (!formData.projects || formData.projects.length < 2) list.push("Add 2 or more projects showcasing links.");
    if (!formData.workExperience || formData.workExperience.length === 0) list.push("Add internship/work experience.");
    
    const lc = formData.codingProfiles?.leetcode || {};
    const cc = formData.codingProfiles?.codechef || {};
    if (!lc.username && !cc.username) list.push("Link your LeetCode or CodeChef usernames.");

    return list;
  };

  /* ================= FILE UPLOADS PORTAL ================= */
  const handleUploadResumeFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !token) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum file size is 10 MB");
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    setUploading(true);
    try {
      const response = await api.postForm('/student/resume/upload', formDataObj, token);
      setUploads([response.file, ...uploads]);
      alert("Resume uploaded successfully!");

      // If text parser returned data, prompt confirmation import modal
      if (response.extractedData && (response.extractedData.name || response.extractedData.email || response.extractedData.skills?.length > 0)) {
        setParserModal({
          extractedData: response.extractedData,
          fileId: response.file._id
        });
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUploadFile = async (fId) => {
    if (!token || !fId) return;
    if (!window.confirm("Delete this uploaded resume file forever?")) return;
    try {
      await api.deleteJson(`/student/resume/files/${fId}`, token);
      setUploads(uploads.filter(u => u._id !== fId));
      alert("File deleted.");
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleConfirmImport = async () => {
    if (!parserModal || !token) return;
    setIsParsing(true);
    try {
      // Send confirm import API
      await api.putJson('/student/me/profile', parserModal.extractedData, token);
      alert("Profile updated with extracted details successfully!");
      setParserModal(null);
      loadInitialData(); // reload
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  /* ================= LIST HELPERS ================= */
  const handleAddEducation = () => {
    const newEdu = { institution: '', degree: 'B.Tech', fieldOfStudy: '', startYear: '2022', endYear: '2026', gpa: '' };
    setFormData({ ...formData, education: [...(formData.education || []), newEdu] });
  };

  const handleRemoveEducation = (idx) => {
    setFormData({ ...formData, education: formData.education.filter((_, i) => i !== idx) });
  };

  const handleAddExperience = () => {
    const newExp = { company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: true, description: '' };
    setFormData({ ...formData, workExperience: [...(formData.workExperience || []), newExp] });
  };

  const handleRemoveExperience = (idx) => {
    setFormData({ ...formData, workExperience: formData.workExperience.filter((_, i) => i !== idx) });
  };

  const handleAddProject = () => {
    const newProj = { name: '', description: '', techStack: [], githubUrl: '', liveUrl: '', highlights: ['', '', ''] };
    setFormData({ ...formData, projects: [...(formData.projects || []), newProj] });
  };

  const handleRemoveProject = (idx) => {
    setFormData({ ...formData, projects: formData.projects.filter((_, i) => i !== idx) });
  };

  const handleAddCustomSection = () => {
    const id = 'custom_' + Date.now();
    const newSec = { sectionId: id, title: 'New Custom Section', content: '' };
    setFormData({ ...formData, customSections: [...(formData.customSections || []), newSec] });
    
    // Add to layout if not already there
    if (!layout.sectionsOrder.includes(id)) {
      setLayout({
        ...layout,
        sectionsOrder: [...layout.sectionsOrder, id]
      });
    }
  };

  const handleRemoveCustomSection = (id) => {
    setFormData({
      ...formData,
      customSections: formData.customSections.filter(s => s.sectionId !== id)
    });
    setLayout({
      ...layout,
      sectionsOrder: layout.sectionsOrder.filter(k => k !== id)
    });
  };

  if (loading || !currentVersion) {
    return (
      <AppShell active="student-resume">
        <div className="ct-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <RefreshCw className="animate-spin" size={24} style={{ marginRight: '8px' }} /> Loading CodeTrack Resume Studio...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="student-resume">
      <style>{`
        .resume-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          height: calc(100vh - 120px);
          overflow: hidden;
        }
        .left-editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .right-preview {
          overflow-y: auto;
          background: #ffffff;
          border-radius: var(--radius);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          position: sticky;
          top: 0;
          height: 100%;
        }
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1.2rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background 0.2s;
        }
        .accordion-header:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .accordion-body {
          padding: 1.2rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-top: none;
          background: rgba(17, 24, 39, 0.4);
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .score-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 4px solid var(--accent-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .template-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.8rem;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.01);
          transition: transform 0.15s, border-color 0.15s;
        }
        .template-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-purple);
        }
        .template-card.active {
          border-color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.08);
        }
      `}</style>

      {/* PARSER IMPORT MODAL */}
      {parserModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="ct-card" style={{ maxWidth: '550px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)' }}>
              <ShieldCheck size={20} /> Resume Extraction Results
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              We parsed your uploaded resume and successfully extracted the following details. Confirm below to import them into your CodeTrack profile:
            </p>
            <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: '8px' }}><strong>Name:</strong> {parserModal.extractedData.name || 'Not found'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {parserModal.extractedData.email || 'Not found'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Phone:</strong> {parserModal.extractedData.phone || 'Not found'}</div>
              <div><strong>Skills matched:</strong> {parserModal.extractedData.skills?.join(', ') || 'None'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="ct-button-secondary" onClick={() => setParserModal(null)}>Cancel</button>
              <button className="ct-button" onClick={handleConfirmImport} disabled={isParsing}>
                {isParsing ? 'Importing...' : 'Confirm & Save to Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE LAYOUT */}
      <div className="resume-container">
        
        {/* LEFT COLUMN: EDITORS AND SELECTION */}
        <div className="left-editor">
          
          {/* HEADER MANAGER */}
          <div className="ct-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Compass size={24} color="var(--accent-blue)" />
              <div>
                <select 
                  className="ct-input" 
                  value={currentVersion._id} 
                  onChange={e => {
                    const found = versions.find(v => v._id === e.target.value);
                    if (found) selectVersion(found);
                  }}
                  style={{ width: '180px', fontWeight: 'bold' }}
                >
                  {versions.map(v => (
                    <option key={v._id} value={v._id}>{v.name} {v.isDefault ? '⭐' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                className="ct-button-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => {
                  const name = prompt("Enter version name (e.g. AI/ML Resume):");
                  if (name) handleCreateVersion(name);
                }}
              >
                + New Version
              </button>
              <button 
                className="ct-button" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={handleSave}
              >
                Save Draft
              </button>
            </div>
          </div>

          {/* MODE SWITCHER */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`ct-button-secondary`} 
              style={{ flex: 1, border: editorMode === 'builder' ? '1px solid var(--accent-blue)' : undefined, background: editorMode === 'builder' ? 'rgba(59, 130, 246, 0.1)' : undefined }}
              onClick={() => setEditorMode('builder')}
            >
              Resume Builder
            </button>
            <button 
              className={`ct-button-secondary`}
              style={{ flex: 1, border: editorMode === 'uploads' ? '1px solid var(--accent-blue)' : undefined, background: editorMode === 'uploads' ? 'rgba(59, 130, 246, 0.1)' : undefined }}
              onClick={() => setEditorMode('uploads')}
            >
              Uploaded Resumes ({uploads.length})
            </button>
          </div>

          {/* BUILDER EDITOR MODE */}
          {editorMode === 'builder' && (
            <>
                {/* TEMPLATE SELECTION GALLERY */}
                <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layout size={18} color="var(--accent-purple)" /> Resume Template
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Active: <strong style={{ color: '#fff' }}>{templateMappings[selectedTemplate]?.title || selectedTemplate}</strong>
                      </span>
                      <button
                        type="button"
                        className="ct-button"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => setTemplateSelectorOpen(true)}
                      >
                        <Layout size={14} /> Change Template
                      </button>
                    </div>
                  </div>

                  {/* Two-card preview strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {Object.entries(templateMappings).map(([key, mapping]) => {
                      const isActive = selectedTemplate === key;
                      return (
                        <div
                          key={key}
                          style={{
                            border: isActive ? '2px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: isActive ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.01)',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s'
                          }}
                          onClick={() => setSelectedTemplate(key)}
                        >
                          {/* Preview thumbnail */}
                          <div style={{ position: 'relative', height: '130px', overflow: 'hidden', background: '#f1f5f9' }}>
                            <img
                              src={mapping.preview}
                              alt={mapping.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            />
                            {isActive && (
                              <div style={{
                                position: 'absolute', top: '6px', right: '6px',
                                background: 'var(--accent-blue)', color: '#0b1120',
                                fontSize: '0.65rem', fontWeight: '800',
                                padding: '2px 7px', borderRadius: '3px'
                              }}>✓ Selected</div>
                            )}
                          </div>
                          {/* Info footer */}
                          <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{mapping.title}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mapping.subtitle}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>🎯 {mapping.atsScore}%</span>
                              <button
                                type="button"
                                className="ct-button-secondary"
                                style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                                onClick={e => { e.stopPropagation(); setPreviewTemplateModal(key); }}
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* ACCORDION 2: SECTION REORDERER & VISIBILITY */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'layout' ? '' : 'layout')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Settings size={16} color="var(--accent-orange)" /> Drag-and-Drop Layout Builder
                  </span>
                  {activeAccordion === 'layout' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'layout' && (
                  <div className="accordion-body">
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Reorder sections dynamically to control placement layouts. Toggle visibility to hide sections.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {layout.sectionsOrder.map((secKey, idx) => {
                        const isHidden = layout.hiddenSections.includes(secKey);
                        const label = secKey.charAt(0).toUpperCase() + secKey.slice(1);
                        return (
                          <div key={secKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button type="button" onClick={() => toggleSectionVisibility(secKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isHidden ? 'var(--text-muted)' : 'var(--accent-blue)' }}>
                                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <span style={{ fontSize: '0.8rem', textDecoration: isHidden ? 'line-through' : 'none' }}>{label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              <button disabled={idx === 0} onClick={() => moveSection(idx, 'up')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ArrowUp size={12} /></button>
                              <button disabled={idx === layout.sectionsOrder.length - 1} onClick={() => moveSection(idx, 'down')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ArrowDown size={12} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 3: PERSONAL DETAILS */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'personal' ? '' : 'personal')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={16} color="var(--accent-blue)" /> Personal Information
                  </span>
                  {activeAccordion === 'personal' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'personal' && (
                  <div className="accordion-body">
                    <div className="ct-grid-2">
                      <div>
                        <label className="ct-label">Full Name</label>
                        <input className="ct-input" value={formData.personalDetails?.name || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), name: e.target.value } })} />
                      </div>
                      <div>
                        <label className="ct-label">Email Address</label>
                        <input className="ct-input" value={formData.personalDetails?.email || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), email: e.target.value } })} />
                      </div>
                    </div>
                    <div className="ct-grid-2">
                      <div>
                        <label className="ct-label">Phone / Student ID</label>
                        <input className="ct-input" value={formData.personalDetails?.phone || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), phone: e.target.value } })} />
                      </div>
                      <div>
                        <label className="ct-label">LinkedIn URL</label>
                        <input className="ct-input" value={formData.personalDetails?.linkedinUrl || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), linkedinUrl: e.target.value } })} />
                      </div>
                    </div>
                    <div className="ct-grid-2">
                      <div>
                        <label className="ct-label">GitHub Link</label>
                        <input className="ct-input" value={formData.personalDetails?.githubUrl || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), githubUrl: e.target.value } })} />
                      </div>
                      <div>
                        <label className="ct-label">Portfolio URL</label>
                        <input className="ct-input" value={formData.personalDetails?.portfolioUrl || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), portfolioUrl: e.target.value } })} />
                      </div>
                    </div>
                    <div>
                      <label className="ct-label">Professional Summary</label>
                      <textarea className="ct-input" rows="3" value={formData.personalDetails?.summary || ''} onChange={e => setFormData({ ...formData, personalDetails: { ...(formData.personalDetails || {}), summary: e.target.value } })} />
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 4: EDUCATION */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'education' ? '' : 'education')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} color="var(--accent-green)" /> Academic Details
                  </span>
                  {activeAccordion === 'education' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'education' && (
                  <div className="accordion-body">
                    {formData.education?.map((edu, idx) => (
                      <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', position: 'relative' }}>
                        <button type="button" onClick={() => handleRemoveEducation(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                        <div className="ct-grid-2" style={{ marginBottom: '0.5rem' }}>
                          <div>
                            <label className="ct-label">Institution Name</label>
                            <input className="ct-input" value={edu.institution || ''} onChange={e => {
                              const updated = [...formData.education]; updated[idx].institution = e.target.value; setFormData({ ...formData, education: updated });
                            }} />
                          </div>
                          <div>
                            <label className="ct-label">Degree</label>
                            <input className="ct-input" value={edu.degree || ''} onChange={e => {
                              const updated = [...formData.education]; updated[idx].degree = e.target.value; setFormData({ ...formData, education: updated });
                            }} />
                          </div>
                        </div>
                        <div className="ct-grid-2">
                          <div>
                            <label className="ct-label">Graduation Year</label>
                            <input className="ct-input" value={edu.endYear || ''} onChange={e => {
                              const updated = [...formData.education]; updated[idx].endYear = e.target.value; setFormData({ ...formData, education: updated });
                            }} />
                          </div>
                          <div>
                            <label className="ct-label">GPA / CGPA</label>
                            <input className="ct-input" value={edu.gpa || ''} onChange={e => {
                              const updated = [...formData.education]; updated[idx].gpa = e.target.value; setFormData({ ...formData, education: updated });
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="ct-button-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'fit-content' }} onClick={handleAddEducation}>
                      + Add Education
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 5: SKILLS */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'skills' ? '' : 'skills')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="var(--accent-purple)" /> Technical Skills
                  </span>
                  {activeAccordion === 'skills' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'skills' && (
                  <div className="accordion-body">
                    <label className="ct-label">Skills (comma separated)</label>
                    <input 
                      className="ct-input" 
                      value={formData.skills?.join(', ') || ''} 
                      onChange={e => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                    />
                  </div>
                )}
              </div>

              {/* ACCORDION 6: PROJECTS */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'projects' ? '' : 'projects')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={16} color="var(--accent-blue)" /> Projects
                  </span>
                  {activeAccordion === 'projects' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'projects' && (
                  <div className="accordion-body">
                    {formData.projects?.map((proj, idx) => (
                      <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', position: 'relative' }}>
                        <button type="button" onClick={() => handleRemoveProject(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                        <div className="ct-grid-2" style={{ marginBottom: '0.5rem' }}>
                          <div>
                            <label className="ct-label">Project Name</label>
                            <input className="ct-input" value={proj.name || ''} onChange={e => {
                              const updated = [...formData.projects]; updated[idx].name = e.target.value; setFormData({ ...formData, projects: updated });
                            }} />
                          </div>
                          <div>
                            <label className="ct-label">Tech Stack (comma separated)</label>
                            <input className="ct-input" value={proj.techStack?.join(', ') || ''} onChange={e => {
                              const updated = [...formData.projects]; updated[idx].techStack = e.target.value.split(',').map(s => s.trim()); setFormData({ ...formData, projects: updated });
                            }} />
                          </div>
                        </div>
                        <div className="ct-grid-2" style={{ marginBottom: '0.5rem' }}>
                          <div>
                            <label className="ct-label">GitHub Code Link</label>
                            <input className="ct-input" value={proj.githubUrl || ''} onChange={e => {
                              const updated = [...formData.projects]; updated[idx].githubUrl = e.target.value; setFormData({ ...formData, projects: updated });
                            }} />
                          </div>
                          <div>
                            <label className="ct-label">Live Deployment Link</label>
                            <input className="ct-input" value={proj.liveUrl || ''} onChange={e => {
                              const updated = [...formData.projects]; updated[idx].liveUrl = e.target.value; setFormData({ ...formData, projects: updated });
                            }} />
                          </div>
                        </div>
                        <div>
                          <label className="ct-label">Description / Highlight Bullet Points (Max 3)</label>
                          {[0, 1, 2].map(num => (
                            <input key={num} className="ct-input" style={{ marginBottom: '0.2rem' }} placeholder={`Highlight ${num + 1}`} value={proj.highlights?.[num] || ''} onChange={e => {
                              const updated = [...formData.projects];
                              if (!updated[idx].highlights) updated[idx].highlights = [];
                              updated[idx].highlights[num] = e.target.value;
                              setFormData({ ...formData, projects: updated });
                            }} />
                          ))}
                        </div>
                      </div>
                    ))}
                    <button type="button" className="ct-button-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'fit-content' }} onClick={handleAddProject}>
                      + Add Project
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 7: WORK EXPERIENCE */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'experience' ? '' : 'experience')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={16} color="var(--accent-orange)" /> Work / Internship Experience
                  </span>
                  {activeAccordion === 'experience' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'experience' && (
                  <div className="accordion-body">
                    {formData.workExperience?.map((exp, idx) => (
                      <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', position: 'relative' }}>
                        <button type="button" onClick={() => handleRemoveExperience(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                        <div className="ct-grid-2" style={{ marginBottom: '0.5rem' }}>
                          <div>
                            <label className="ct-label">Company Name</label>
                            <input className="ct-input" value={exp.company || ''} onChange={e => {
                              const updated = [...formData.workExperience]; updated[idx].company = e.target.value; setFormData({ ...formData, workExperience: updated });
                            }} />
                          </div>
                          <div>
                            <label className="ct-label">Job Title / Role</label>
                            <input className="ct-input" value={exp.role || ''} onChange={e => {
                              const updated = [...formData.workExperience]; updated[idx].role = e.target.value; setFormData({ ...formData, workExperience: updated });
                            }} />
                          </div>
                        </div>
                        <div className="row-item" style={{ marginBottom: '0.5rem' }}>
                          <label className="ct-label">Responsibilities / Description</label>
                          <textarea className="ct-input" rows="3" value={exp.description || ''} onChange={e => {
                            const updated = [...formData.workExperience]; updated[idx].description = e.target.value; setFormData({ ...formData, workExperience: updated });
                          }} />
                        </div>
                      </div>
                    ))}
                    <button type="button" className="ct-button-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'fit-content' }} onClick={handleAddExperience}>
                      + Add Experience
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 8: CODING PROFILE STATS */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'profiles' ? '' : 'profiles')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} color="var(--accent-purple)" /> Coding Profile Configurations
                  </span>
                  {activeAccordion === 'profiles' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'profiles' && (
                  <div className="accordion-body">
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Configure visibility of coding profiles imported from platforms.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {['leetcode', 'codechef', 'gfg', 'github'].map(pName => {
                        const prof = formData.codingProfiles?.[pName] || { show: true, username: '' };
                        return (
                          <div key={pName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                            <div>
                              <strong style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{pName} Handle:</strong>
                              <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prof.username || 'Not set'}</span>
                            </div>
                            <button 
                              type="button" 
                              className="ct-button-secondary" 
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: prof.show ? 'rgba(59, 130, 246, 0.1)' : undefined }}
                              onClick={() => {
                                const updatedProfiles = { ...formData.codingProfiles };
                                updatedProfiles[pName] = { ...prof, show: !prof.show };
                                setFormData({ ...formData, codingProfiles: updatedProfiles });
                              }}
                            >
                              {prof.show ? 'Visible' : 'Hidden'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 9: CUSTOM SECTIONS */}
              <div>
                <div className="accordion-header" onClick={() => setActiveAccordion(activeAccordion === 'custom' ? '' : 'custom')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} color="var(--accent-green)" /> Custom Sections
                  </span>
                  {activeAccordion === 'custom' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {activeAccordion === 'custom' && (
                  <div className="accordion-body">
                    {formData.customSections?.map((sec, idx) => (
                      <div key={sec.sectionId} style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', position: 'relative' }}>
                        <button type="button" onClick={() => handleRemoveCustomSection(sec.sectionId)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label className="ct-label">Section Title</label>
                          <input className="ct-input" value={sec.title || ''} onChange={e => {
                            const updated = [...formData.customSections]; updated[idx].title = e.target.value; setFormData({ ...formData, customSections: updated });
                          }} />
                        </div>
                        <div>
                          <label className="ct-label">Content (Supports text description)</label>
                          <textarea className="ct-input" rows="3" value={sec.content || ''} onChange={e => {
                            const updated = [...formData.customSections]; updated[idx].content = e.target.value; setFormData({ ...formData, customSections: updated });
                          }} />
                        </div>
                      </div>
                    ))}
                    <button type="button" className="ct-button-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'fit-content' }} onClick={handleAddCustomSection}>
                      + Add Custom Section
                    </button>
                  </div>
                )}
              </div>

              {/* SNAPSHOTS HISTORY LIST */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowingSnapshots(!showingSnapshots)}
                >
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <History size={16} color="var(--accent-purple)" /> Resume Snapshot Checkpoints ({snapshots.length})
                  </h3>
                  {showingSnapshots ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {showingSnapshots && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <button className="ct-button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem' }} onClick={handleCreateSnapshot}>
                      📸 Capture New Snapshot
                    </button>
                    {snapshots.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>No snapshots saved yet.</div>
                    ) : (
                      snapshots.map((snap, idx) => (
                        <div key={snap._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(snap.timestamp).toLocaleString()}
                          </span>
                          <button 
                            className="ct-button-secondary" 
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                            onClick={() => handleRestoreSnapshot(snap._id)}
                          >
                            Restore
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* RESUME COMPLETENESS SCORING */}
              <div className="ct-card" style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <div className="score-circle" style={{ borderColor: completenessScore >= 80 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                  {completenessScore}%
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Resume Completeness Score</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Fill out key sections to make your resume placement-ready.
                  </p>
                  {getMissingRecommendations().length > 0 && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--accent-red)' }}>
                      ⚠️ Suggestion: {getMissingRecommendations()[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* ATS COMPATIBILITY CHECKER */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                  <div className="score-circle" style={{ borderColor: atsDetails.score >= 80 ? 'var(--accent-green)' : 'var(--accent-purple)' }}>
                    {atsDetails.score}%
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={16} color="var(--accent-green)" /> ATS Compatibility Check
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Evaluate keywords, verbs, structures, and formatting details.
                    </p>
                  </div>
                  <button 
                    className="ct-button" 
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                    onClick={runAtsCheck} 
                    disabled={calculatingAts}
                  >
                    {calculatingAts ? <RefreshCw size={12} className="animate-spin" /> : 'Run Check'}
                  </button>
                </div>
                {atsDetails.suggestions && atsDetails.suggestions.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <h5 style={{ margin: '0 0 0.4rem 0', fontSize: '0.75rem', color: 'var(--accent-orange)' }}>ATS Suggestions:</h5>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {atsDetails.suggestions.map((sug, idx) => (
                        <li key={idx}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* RESUME TIPS GUIDANCE */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-green)' }}>💡 Professional Placement Tips</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {tips.tips?.slice(0, 3).map((tip, idx) => <li key={idx}>{tip}</li>)}
                </ul>
              </div>
            </>
          )}

          {/* UPLOAD OVERRIDES MODE */}
          {editorMode === 'uploads' && (
            <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.4rem 0' }}>Upload Existing Resume</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upload custom layouts (PDF/DOCX, max 10MB) to serve as your placement credentials.
                </p>
              </div>

              <div style={{ border: '2px dashed rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  id="resume-file-uploader"
                  style={{ display: 'none' }}
                  onChange={handleUploadResumeFile}
                />
                <label htmlFor="resume-file-uploader" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <Upload size={28} className={uploading ? 'animate-spin' : ''} color="var(--accent-blue)" />
                  <span style={{ fontSize: '0.85rem' }}>{uploading ? 'Uploading...' : 'Click to select file (PDF or DOCX)'}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max size 10MB</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <h4 style={{ margin: '0 0 0.2rem 0' }}>Uploaded Credentials List</h4>
                {uploads.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No resumes uploaded yet.</div>
                ) : (
                  uploads.map(file => (
                    <div key={file._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="var(--accent-blue)" />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{file.originalName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB | Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button 
                          className="ct-button-secondary" 
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', border: file.isDefault ? '1px solid var(--accent-green)' : undefined, color: file.isDefault ? 'var(--accent-green)' : undefined }}
                          onClick={() => handleSetDefault(file._id)}
                        >
                          {file.isDefault ? '★ Default' : 'Set Default'}
                        </button>
                        <a 
                          href={
                            // fileUrl is the Cloudinary URL or local /uploads path; storagePath is the publicId for deletion
                            file.fileUrl 
                              ? (file.fileUrl.startsWith('http') ? file.fileUrl : `${backendBase.replace('/api', '')}${file.fileUrl}`)
                              : (file.storagePath && file.storagePath.startsWith('http') 
                                  ? file.storagePath 
                                  : `${backendBase.replace('/api', '')}/uploads/${file.storagePath}`)
                          } 
                          target="_blank" 
                          rel="noreferrer"
                          className="ct-button-secondary" 
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        >
                          View
                        </a>
                        <button 
                          className="ct-button-secondary" 
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', color: 'var(--accent-red)' }}
                          onClick={() => handleDeleteUploadFile(file._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: REAL-TIME RENDER PREVIEW */}
        <div className="right-preview">
          <div style={{ position: 'sticky', top: 0, background: '#111827', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={14} color="var(--accent-purple)" /> Real-time Resume Canvas
            </span>
            <button className="ct-button" style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={handleDownloadPDF}>
              <Download size={12} /> Download PDF
            </button>
          </div>

          <div style={{ padding: '1rem', background: '#e2e8f0', minHeight: 'calc(100% - 50px)', overflowY: 'auto' }}>
            <ResumePreviewHTML 
              templateKey={selectedTemplate}
              layout={layout}
              content={formData}
            />
          </div>
        </div>

      </div>

      {/* TEMPLATE PREVIEW MODAL */}
      {previewTemplateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="ct-card" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff' }}>
                <Eye size={20} color="var(--accent-purple)" /> Template Preview: {templateMappings[previewTemplateModal]?.title || previewTemplateModal}
              </h3>
              <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--accent-blue)', color: '#0b1120', fontWeight: 'bold' }}>
                {templateMappings[previewTemplateModal]?.atsScore || 85}% ATS Compatible
              </span>
            </div>

            {/* Live Populated Resume Canvas Preview */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#e2e8f0', borderRadius: '6px', padding: '1rem', maxHeight: '60vh' }}>
              <ResumePreviewHTML 
                templateKey={previewTemplateModal}
                layout={layout}
                content={formData}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
              <button className="ct-button-secondary" onClick={() => setPreviewTemplateModal(null)}>Close</button>
              <button 
                className="ct-button" 
                disabled={selectedTemplate === previewTemplateModal}
                onClick={() => {
                  setSelectedTemplate(previewTemplateModal);
                  setPreviewTemplateModal(null);
                }}
              >
                {selectedTemplate === previewTemplateModal ? 'Selected' : 'Use Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
