import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

// Small inline text input used inside the skills tag box
function SkillInput({ skills, onAdd }) {
  const [value, setValue] = useState('');
  const handleKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && value.trim()) {
      e.preventDefault();
      onAdd(value.trim().replace(/,$/, ''));
      setValue('');
    }
  };
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKey}
      onBlur={() => { if (value.trim()) { onAdd(value.trim()); setValue(''); } }}
      placeholder="Type a skill and press Enter"
      style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', minWidth: '160px', padding: '0.1rem 0.2rem', flexGrow: 1 }}
    />
  );
}

export function StudentProfileEdit({ tab }) {
  const { token, user, login } = useAuth();
  const navigate = useNavigate();
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Entire student state loaded from GET /me
  const [profileData, setProfileData] = useState(null);

  // Password fields
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Academic fields
  const [academicForm, setAcademicForm] = useState({
    sgpa1: '',
    sgpa2: '',
    sgpa3: '',
    sgpa4: '',
    sgpa5: '',
    sgpa6: '',
    cgpa: '',
    backlogs: '0',
    academicStatus: '',
    eapcetRank: ''
  });

  // Fetch full details
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getJson('/student/me', token);
      setProfileData(data);
      
      if (tab === 'academic') {
        try {
          const acadData = await api.getJson('/student/me/profile/academic', token);
          if (acadData) {
            setAcademicForm({
              sgpa1: acadData.sgpa1 != null ? acadData.sgpa1.toString() : '',
              sgpa2: acadData.sgpa2 != null ? acadData.sgpa2.toString() : '',
              sgpa3: acadData.sgpa3 != null ? acadData.sgpa3.toString() : '',
              sgpa4: acadData.sgpa4 != null ? acadData.sgpa4.toString() : '',
              sgpa5: acadData.sgpa5 != null ? acadData.sgpa5.toString() : '',
              sgpa6: acadData.sgpa6 != null ? acadData.sgpa6.toString() : '',
              cgpa: acadData.cgpa != null ? acadData.cgpa.toString() : '',
              backlogs: acadData.backlogs != null ? acadData.backlogs.toString() : '0',
              academicStatus: acadData.academicStatus || '-',
              eapcetRank: acadData.eapcetRank != null ? acadData.eapcetRank.toString() : ''
            });
          }
        } catch (err) {
          console.error('Failed to load academic profile:', err);
        }
      }

      if (tab === 'professional') {
        try {
          const profData = await api.getJson('/student/me/profile/professional', token);
          if (profData) {
            setProfileData(prev => ({
              ...prev,
              skills: profData.skills || prev?.skills || [],
              projects: profData.projects || prev?.projects || [],
              workExperience: profData.experiences || prev?.workExperience || [],
              certifications: profData.certifications || prev?.certifications || [],
              hackathons: profData.hackathons || prev?.hackathons || [],
              education: profData.education || prev?.education || []
            }));
          }
        } catch (err) {
          console.error('Failed to load professional profile:', err);
        }
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [tab]);

  // Clean success/error alerts after 4s
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <AppShell active="student-profile">
        <div className="settings-loading">
          <div className="ct-spinner"></div>
          <p>Loading your profile details...</p>
        </div>
      </AppShell>
    );
  }

  if (!profileData) {
    return (
      <AppShell active="student-profile">
        <div className="settings-error-state">
          <p>{error || 'Failed to load profile details.'}</p>
          <button onClick={fetchProfile} className="ct-btn-primary">Retry</button>
        </div>
      </AppShell>
    );
  }

  // Helpers to handle field changes
  const handlePersonalChange = (field, val) => {
    setProfileData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: val
      }
    }));
  };

  const handleSscChange = (field, val) => {
    setProfileData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        ssc: {
          ...(prev.personalDetails.ssc || {}),
          [field]: val
        }
      }
    }));
  };

  const handleInterChange = (field, val) => {
    setProfileData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        intermediate: {
          ...(prev.personalDetails.intermediate || {}),
          [field]: val
        }
      }
    }));
  };

  const handleFamilyChange = (field, val) => {
    setProfileData(prev => ({
      ...prev,
      familyDetails: {
        ...prev.familyDetails,
        [field]: val
      }
    }));
  };

  const handleParentChange = (parentKey, field, val) => {
    setProfileData(prev => ({
      ...prev,
      familyDetails: {
        ...prev.familyDetails,
        [parentKey]: {
          ...(prev.familyDetails[parentKey] || {}),
          [field]: val
        }
      }
    }));
  };

  // Sibling list operations
  const addSibling = () => {
    const newSib = { name: '', relation: 'Brother', educationStatus: '', occupation: '' };
    setProfileData(prev => {
      const family = prev.familyDetails || {};
      const sibs = family.siblings || [];
      return {
        ...prev,
        familyDetails: {
          ...family,
          siblings: [...sibs, newSib]
        }
      };
    });
  };

  const removeSibling = (idx) => {
    setProfileData(prev => {
      const sibs = [...(prev.familyDetails.siblings || [])];
      sibs.splice(idx, 1);
      return {
        ...prev,
        familyDetails: {
          ...prev.familyDetails,
          siblings: sibs
        }
      };
    });
  };

  const handleSiblingChange = (idx, field, val) => {
    setProfileData(prev => {
      const sibs = [...(prev.familyDetails.siblings || [])];
      sibs[idx] = { ...sibs[idx], [field]: val };
      return {
        ...prev,
        familyDetails: {
          ...prev.familyDetails,
          siblings: sibs
        }
      };
    });
  };

  // Education list operations
  const addEducation = () => {
    const newEdu = { institution: '', degree: '', branch: '', cgpa: '', startYear: '', endYear: '' };
    setProfileData(prev => ({
      ...prev,
      education: [...(prev.education || []), newEdu]
    }));
  };

  const removeEducation = (idx) => {
    setProfileData(prev => {
      const edu = [...(prev.education || [])];
      edu.splice(idx, 1);
      return { ...prev, education: edu };
    });
  };

  const handleEducationChange = (idx, field, val) => {
    setProfileData(prev => {
      const edu = [...(prev.education || [])];
      edu[idx] = { ...edu[idx], [field]: val };
      return { ...prev, education: edu };
    });
  };

  // Projects list operations
  const addProject = () => {
    const newProj = { title: '', description: '', technologies: [], githubLink: '', liveLink: '' };
    setProfileData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), newProj]
    }));
  };

  const removeProject = (idx) => {
    setProfileData(prev => {
      const projs = [...(prev.projects || [])];
      projs.splice(idx, 1);
      return { ...prev, projects: projs };
    });
  };

  const handleProjectChange = (idx, field, val) => {
    setProfileData(prev => {
      const projs = [...(prev.projects || [])];
      if (field === 'technologies') {
        const arr = typeof val === 'string' ? val.split(',').map(s => s.trim()) : val;
        projs[idx] = { ...projs[idx], technologies: arr };
      } else {
        projs[idx] = { ...projs[idx], [field]: val };
      }
      return { ...prev, projects: projs };
    });
  };

  // Work experience operations
  const addExperience = () => {
    const newExp = { company: '', role: '', startDate: '', endDate: '', description: '' };
    setProfileData(prev => ({
      ...prev,
      workExperience: [...(prev.workExperience || []), newExp]
    }));
  };

  const removeExperience = (idx) => {
    setProfileData(prev => {
      const exp = [...(prev.workExperience || [])];
      exp.splice(idx, 1);
      return { ...prev, workExperience: exp };
    });
  };

  const handleExperienceChange = (idx, field, val) => {
    setProfileData(prev => {
      const exp = [...(prev.workExperience || [])];
      exp[idx] = { ...exp[idx], [field]: val };
      return { ...prev, workExperience: exp };
    });
  };

  // Certification operations
  const addCert = () => {
    const newCert = { title: '', provider: '', issueDate: '', credentialLink: '' };
    setProfileData(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert]
    }));
  };

  const removeCert = (idx) => {
    setProfileData(prev => {
      const certs = [...(prev.certifications || [])];
      certs.splice(idx, 1);
      return { ...prev, certifications: certs };
    });
  };

  const handleCertChange = (idx, field, val) => {
    setProfileData(prev => {
      const certs = [...(prev.certifications || [])];
      certs[idx] = { ...certs[idx], [field]: val };
      return { ...prev, certifications: certs };
    });
  };

  // Skills change (tag-based — receives array directly)
  const handleSkillsChange = (skills) => {
    setProfileData(prev => ({
      ...prev,
      skills: Array.isArray(skills) ? skills : []
    }));
  };

  // Hackathon operations
  const addHackathon = () => {
    const newH = { name: '', organizer: '', date: '', teamSize: 1, position: '', result: '', description: '', certificateLink: '' };
    setProfileData(prev => ({
      ...prev,
      hackathons: [...(prev.hackathons || []), newH]
    }));
  };

  const removeHackathon = (idx) => {
    setProfileData(prev => {
      const h = [...(prev.hackathons || [])];
      h.splice(idx, 1);
      return { ...prev, hackathons: h };
    });
  };

  const handleHackathonChange = (idx, field, val) => {
    setProfileData(prev => {
      const h = [...(prev.hackathons || [])];
      h[idx] = { ...h[idx], [field]: val };
      return { ...prev, hackathons: h };
    });
  };

  // Coding Username handles change
  const handleCodingUsernameChange = (platform, val) => {
    setProfileData(prev => ({
      ...prev,
      [platform]: val
    }));
  };

  // Save Actions
  const savePersonal = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        personalDetails: profileData.personalDetails,
        familyDetails: profileData.familyDetails
      };
      await api.putJson('/student/me/profile/personal', payload, token);
      setSuccess('Personal details saved successfully!');
      
      // Update context user if fields changed
      const updatedUser = {
        ...user,
        name: profileData.personalDetails?.fullName || user.name,
        college: profileData.personalDetails?.college || user.college,
        branch: profileData.personalDetails?.branch || user.branch,
        currentYear: profileData.personalDetails?.year || user.currentYear
      };
      login(token, updatedUser);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save personal details.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfessional = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        education: profileData.education,
        skills: profileData.skills,
        projects: profileData.projects,
        experiences: profileData.workExperience, // Maps to experiences on backend
        certifications: profileData.certifications,
        hackathons: profileData.hackathons || []
      };
      await api.putJson('/student/me/profile/professional', payload, token);
      setSuccess('Professional details saved successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save professional details.');
    } finally {
      setSaving(false);
    }
  };

  const saveCoding = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        leetcodeUsername: profileData.leetcodeUsername,
        codechefUsername: profileData.codechefUsername,
        gfgUsername: profileData.gfgUsername,
        githubUsername: profileData.githubUsername,
        hackerrankUsername: profileData.hackerrankUsername
      };
      const response = await api.putJson('/student/me/profile/coding', payload, token);
      setSuccess('Coding handles updated & sync triggered successfully!');
      // Update global context
      if (response.user) {
        login(token, response.user);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save coding handles.');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    try {
      if (pwdForm.newPassword !== pwdForm.confirmPassword) {
        setError('New passwords do not match!');
        return;
      }
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      };
      await api.putJson('/student/me/change-password', payload, token);
      setSuccess('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const saveAcademic = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const payload = {
        sgpa1: academicForm.sgpa1 === '' ? null : parseFloat(academicForm.sgpa1),
        sgpa2: academicForm.sgpa2 === '' ? null : parseFloat(academicForm.sgpa2),
        sgpa3: academicForm.sgpa3 === '' ? null : parseFloat(academicForm.sgpa3),
        sgpa4: academicForm.sgpa4 === '' ? null : parseFloat(academicForm.sgpa4),
        sgpa5: academicForm.sgpa5 === '' ? null : parseFloat(academicForm.sgpa5),
        sgpa6: academicForm.sgpa6 === '' ? null : parseFloat(academicForm.sgpa6),
        cgpa: parseFloat(academicForm.cgpa),
        backlogs: parseInt(academicForm.backlogs, 10),
        eapcetRank: academicForm.eapcetRank === '' ? null : parseInt(academicForm.eapcetRank, 10)
      };

      if (isNaN(payload.cgpa) || payload.cgpa < 0 || payload.cgpa > 10) {
        throw new Error('CGPA must be a valid number between 0 and 10.');
      }
      if (isNaN(payload.backlogs) || payload.backlogs < 0) {
        throw new Error('Backlogs must be a valid non-negative integer.');
      }
      if (payload.eapcetRank !== null && (isNaN(payload.eapcetRank) || payload.eapcetRank < 0)) {
        throw new Error('EAPCET Rank must be a valid non-negative integer.');
      }
      for (let i = 1; i <= 6; i++) {
        const val = payload[`sgpa${i}`];
        if (val !== null && (isNaN(val) || val < 0 || val > 10)) {
          throw new Error(`SGPA ${i} must be a valid number between 0 and 10.`);
        }
      }

      const res = await api.putJson('/student/me/profile/academic', payload, token);
      setSuccess('Academic profile saved successfully!');
      setAcademicForm(prev => ({
        ...prev,
        academicStatus: res.academicStatus || prev.academicStatus
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save academic profile.');
    } finally {
      setSaving(false);
    }
  };

  const triggerGlobalSync = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.postJson('/student/me/sync-platforms', { force: true }, token);
      setSuccess('Sync completed successfully!');
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError('Sync failed. Please verify platform usernames.');
    } finally {
      setSaving(false);
    }
  };

  const formatDateField = (d) => {
    if (!d) return '';
    return new Date(d).toISOString().split('T')[0];
  };

  const activeTabClass = (t) => tab === t ? 'settings-tab active' : 'settings-tab';

  return (
    <AppShell active="student-profile">
      <div className="settings-container">
        
        {/* Style definitions for premium visual interface */}
        <style>{`
          .settings-container {
            max-width: 1100px;
            margin: 2rem auto;
            padding: 0 1.5rem;
            color: #f3f4f6;
            font-family: 'Inter', sans-serif;
          }
          .settings-loading, .settings-loading-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            color: #9ca3af;
          }
          .settings-header-banner {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.5rem;
            flex-wrap: wrap;
            backdrop-filter: blur(12px);
          }
          .settings-header-left h1 {
            font-size: 1.6rem;
            font-weight: 800;
            background: linear-gradient(90deg, #60a5fa, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.3rem;
          }
          .settings-header-left p {
            color: #9ca3af;
            font-size: 0.9rem;
          }
          .settings-metrics-group {
            display: flex;
            gap: 2rem;
          }
          .settings-metric-box {
            text-align: center;
          }
          .settings-metric-val {
            font-size: 1.8rem;
            font-weight: 800;
            color: #3b82f6;
          }
          .settings-metric-val.readiness {
            color: #10b981;
          }
          .settings-metric-label {
            font-size: 0.75rem;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .settings-tab-navigation {
            display: flex;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 2rem;
            gap: 0.5rem;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .settings-tab {
            background: transparent;
            border: none;
            color: #9ca3af;
            padding: 0.8rem 1.5rem;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            position: relative;
            transition: color 0.2s;
            white-space: nowrap;
          }
          .settings-tab:hover {
            color: #e5e7eb;
          }
          .settings-tab.active {
            color: #60a5fa;
          }
          .settings-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #60a5fa;
            border-radius: 99px;
          }
          .settings-content-card {
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 2.2rem;
            backdrop-filter: blur(12px);
          }
          .settings-form-section {
            margin-bottom: 2.5rem;
          }
          .settings-section-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: #e5e7eb;
            margin-bottom: 1.2rem;
            border-left: 3px solid #3b82f6;
            padding-left: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .settings-grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .settings-grid-3 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .settings-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .settings-form-group label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #9ca3af;
          }
          .settings-input, .settings-select, .settings-textarea {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 0.7rem 0.9rem;
            color: white;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .settings-input:focus, .settings-select:focus, .settings-textarea:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
          }
          .settings-textarea {
            min-height: 100px;
            resize: vertical;
          }
          .settings-actions-bar {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
          .settings-btn {
            padding: 0.75rem 1.8rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }
          .settings-btn-primary {
            background: linear-gradient(90deg, #3b82f6, #6366f1);
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          .settings-btn-primary:hover {
            opacity: 0.95;
            transform: translateY(-1px);
          }
          .settings-btn-secondary {
            background: rgba(255, 255, 255, 0.06);
            color: #e5e7eb;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .settings-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          .settings-btn-danger {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .settings-btn-danger:hover {
            background: rgba(239, 68, 68, 0.25);
          }
          .settings-card-item {
            background: rgba(30, 41, 59, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.2rem;
            position: relative;
          }
          .settings-card-remove-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: transparent;
            border: none;
            color: #f87171;
            font-size: 1.1rem;
            cursor: pointer;
          }
          .settings-btn-add {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            font-weight: 700;
            color: #60a5fa;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            transition: background 0.2s;
          }
          .settings-btn-add:hover {
            background: rgba(96, 165, 250, 0.1);
          }
          .settings-alert {
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .settings-alert-success {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .settings-alert-error {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .sync-status-box {
            background: rgba(59, 130, 246, 0.06);
            border: 1px solid rgba(59, 130, 246, 0.15);
            border-radius: 12px;
            padding: 1.2rem 1.5rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
          }
          .sync-status-text div {
            font-size: 0.9rem;
            color: #e5e7eb;
          }
          .sync-status-text span {
            font-size: 0.75rem;
            color: #9ca3af;
          }
          .coding-stats-badges {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.2rem;
            margin-top: 1.5rem;
          }
          .platform-stat-card {
            background: rgba(30, 41, 59, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 1rem 1.2rem;
          }
          .platform-stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            font-weight: 700;
            font-size: 0.9rem;
            color: #9ca3af;
          }
          .platform-stat-username {
            font-size: 0.8rem;
            color: #60a5fa;
            word-break: break-all;
          }
          .platform-stat-solved {
            font-size: 1.4rem;
            font-weight: 800;
            color: white;
            margin-top: 0.4rem;
          }
          .platform-stat-solved span {
            font-size: 0.8rem;
            font-weight: 500;
            color: #9ca3af;
          }
        `}</style>

        {/* ─── BANNER HEADER ─── */}
        <div className="settings-header-banner">
          <div className="settings-header-left">
            <h1>Configure Student Profile</h1>
            <p>Customize your personal identity, academic background, achievements and coding platforms.</p>
          </div>
          <div className="settings-metrics-group">
            <div className="settings-metric-box">
              <div className="settings-metric-val">{profileData.profileCompletion || 0}%</div>
              <div className="settings-metric-label">Profile Completed</div>
            </div>
            <div className="settings-metric-box">
              <div className="settings-metric-val readiness">
                {profileData.readinessProfile?.overallReadiness || 0}
              </div>
              <div className="settings-metric-label">Placement Readiness</div>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="settings-tab-navigation">
          <button className={activeTabClass('personal')} onClick={() => navigate('/profile/personal')}>Personal Details</button>
          <button className={activeTabClass('professional')} onClick={() => navigate('/profile/professional')}>Professional Details</button>
          <button className={activeTabClass('coding')} onClick={() => navigate('/profile/coding')}>Coding Profiles</button>
          <button className={activeTabClass('academic')} onClick={() => navigate('/profile/academic')}>Academic Profile</button>
          <button className={activeTabClass('password')} onClick={() => navigate('/profile/password')}>Change Password</button>
        </div>

        {/* Alerts */}
        {success && <div className="settings-alert settings-alert-success">✓ {success}</div>}
        {error && <div className="settings-alert settings-alert-error">⚠ {error}</div>}

        {/* ─── TAB CONTENT ─── */}
        <div className="settings-content-card">
          
          {/* TAB 1: PERSONAL DETAILS */}
          {tab === 'personal' && (
            <div>
              <div className="settings-form-section">
                <div className="settings-section-title">Identity & Contacts</div>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.fullName || ''}
                      onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={profileData.personalDetails?.email || ''}
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="settings-grid-3">
                  <div className="settings-form-group">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.mobile || ''}
                      onChange={(e) => handlePersonalChange('mobile', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Gender</label>
                    <select
                      className="settings-select"
                      value={profileData.personalDetails?.gender || ''}
                      onChange={(e) => handlePersonalChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="settings-input"
                      value={formatDateField(profileData.personalDetails?.dob)}
                      onChange={(e) => handlePersonalChange('dob', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Academic & Campus Info</div>
                <div className="settings-grid-3">
                  <div className="settings-form-group">
                    <label>College</label>
                    <select
                      className="settings-select"
                      value={profileData.personalDetails?.college || ''}
                      onChange={(e) => handlePersonalChange('college', e.target.value)}
                    >
                      <option value="">Select College</option>
                      {['CBIT', 'VASAVI', 'MVSR', 'GRIET', 'VARDHAMAN', 'JNTU', 'GNWC', 'BVRIT', 'OU', 'KMIT', 'HCU', 'NIT', 'IIT', 'Loyola', 'Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label>Branch</label>
                    <select
                      className="settings-select"
                      value={profileData.personalDetails?.branch || ''}
                      onChange={(e) => handlePersonalChange('branch', e.target.value)}
                    >
                      <option value="">Select Branch</option>
                      {['CSE', 'CSB', 'CSD', 'CSM', 'AIML', 'IT', 'AIDS', 'ECE', 'CSE-IoT', 'CSC (Cybersecurity)'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label>Academic Year</label>
                    <select
                      className="settings-select"
                      value={profileData.personalDetails?.year || '1st Year'}
                      onChange={(e) => handlePersonalChange('year', e.target.value)}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>Hostel / PG Name</label>
                    <select
                      className="settings-select"
                      value={profileData.personalDetails?.hostelName || ''}
                      onChange={(e) => handlePersonalChange('hostelName', e.target.value)}
                    >
                      <option value="">Select Hostel</option>
                      {['Mehdipatnam', 'Kukatpally', 'Uppal', 'Nagergul', 'Shamshabad', 'Loyola', 'Other'].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label>Class Section</label>
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="e.g. CSE-A"
                      value={profileData.personalDetails?.section || ''}
                      onChange={(e) => handlePersonalChange('section', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Address</div>
                <div className="settings-form-group" style={{ marginBottom: '1.2rem' }}>
                  <label>Permanent Address</label>
                  <textarea
                    className="settings-textarea"
                    value={profileData.personalDetails?.permanentAddress || ''}
                    onChange={(e) => handlePersonalChange('permanentAddress', e.target.value)}
                  />
                </div>
                <div className="settings-grid-3">
                  <div className="settings-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.city || ''}
                      onChange={(e) => handlePersonalChange('city', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>District</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.district || ''}
                      onChange={(e) => handlePersonalChange('district', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>State & Pincode</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="State"
                        className="settings-input"
                        style={{ width: '60%' }}
                        value={profileData.personalDetails?.state || ''}
                        onChange={(e) => handlePersonalChange('state', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Pin"
                        className="settings-input"
                        style={{ width: '40%' }}
                        value={profileData.personalDetails?.pincode || ''}
                        onChange={(e) => handlePersonalChange('pincode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Secondary Education (SSC / Intermediate)</div>
                <h4 style={{ fontSize: '0.9rem', color: '#60a5fa', margin: '0 0 1rem 0' }}>SSC details</h4>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.ssc?.schoolName || ''}
                      onChange={(e) => handleSscChange('schoolName', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Board</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE / State Board"
                      className="settings-input"
                      value={profileData.personalDetails?.ssc?.board || ''}
                      onChange={(e) => handleSscChange('board', e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-grid-2" style={{ marginBottom: '2rem' }}>
                  <div className="settings-form-group">
                    <label>SSC CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      className="settings-input"
                      value={profileData.personalDetails?.ssc?.percentage || ''}
                      onChange={(e) => handleSscChange('percentage', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Passout Year</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={profileData.personalDetails?.ssc?.passoutYear || ''}
                      onChange={(e) => handleSscChange('passoutYear', e.target.value)}
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', color: '#60a5fa', margin: '0 0 1rem 0' }}>Intermediate / Diploma details</h4>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>College Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.intermediate?.collegeName || ''}
                      onChange={(e) => handleInterChange('collegeName', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Board</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.personalDetails?.intermediate?.board || ''}
                      onChange={(e) => handleInterChange('board', e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>Intermediate / Diploma CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      className="settings-input"
                      value={profileData.personalDetails?.intermediate?.percentage || ''}
                      onChange={(e) => handleInterChange('percentage', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Passout Year</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={profileData.personalDetails?.intermediate?.passoutYear || ''}
                      onChange={(e) => handleInterChange('passoutYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Family Details</div>
                <div className="settings-form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Parent Status</label>
                  <select
                    className="settings-select"
                    value={profileData.familyDetails?.parentStatus || 'Both Parents'}
                    onChange={(e) => handleFamilyChange('parentStatus', e.target.value)}
                  >
                    <option value="Both Parents">Both Parents</option>
                    <option value="Single Parent">Single Parent</option>
                    <option value="Father Only">Father Only</option>
                    <option value="Mother Only">Mother Only</option>
                  </select>
                </div>

                <div className="settings-grid-2">
                  {/* Father block */}
                  <div className="settings-card-item">
                    <h4 style={{ margin: '0 0 1rem 0', color: '#c084fc' }}>Father's Info</h4>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Name</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.father?.name || ''}
                        onChange={(e) => handleParentChange('father', 'name', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Occupation</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.father?.occupation || ''}
                        onChange={(e) => handleParentChange('father', 'occupation', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Education Status</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.father?.education || ''}
                        onChange={(e) => handleParentChange('father', 'education', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group">
                      <label>Contact Mobile</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.father?.mobile || ''}
                        onChange={(e) => handleParentChange('father', 'mobile', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Mother block */}
                  <div className="settings-card-item">
                    <h4 style={{ margin: '0 0 1rem 0', color: '#c084fc' }}>Mother's Info</h4>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Name</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.mother?.name || ''}
                        onChange={(e) => handleParentChange('mother', 'name', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Occupation</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.mother?.occupation || ''}
                        onChange={(e) => handleParentChange('mother', 'occupation', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Education Status</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.mother?.education || ''}
                        onChange={(e) => handleParentChange('mother', 'education', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group">
                      <label>Contact Mobile</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={profileData.familyDetails?.mother?.mobile || ''}
                        onChange={(e) => handleParentChange('mother', 'mobile', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Sibling details */}
                <div style={{ marginTop: '2rem' }}>
                  <div className="settings-section-title">
                    <span>Siblings ({profileData.familyDetails?.siblings?.length || 0})</span>
                    <button type="button" onClick={addSibling} className="settings-btn-add">＋ Add Sibling</button>
                  </div>
                  
                  {(profileData.familyDetails?.siblings || []).map((sib, sIdx) => (
                    <div className="settings-card-item" key={sIdx}>
                      <button type="button" className="settings-card-remove-btn" onClick={() => removeSibling(sIdx)}>✖</button>
                      <div className="settings-grid-2">
                        <div className="settings-form-group">
                          <label>Sibling Name</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={sib.name || ''}
                            onChange={(e) => handleSiblingChange(sIdx, 'name', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label>Relation</label>
                          <select
                            className="settings-select"
                            value={sib.relation || 'Brother'}
                            onChange={(e) => handleSiblingChange(sIdx, 'relation', e.target.value)}
                          >
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                          </select>
                        </div>
                      </div>
                      <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                        <div className="settings-form-group">
                          <label>Education status</label>
                          <input
                            type="text"
                            placeholder="e.g. Studying Class 12"
                            className="settings-input"
                            value={sib.educationStatus || ''}
                            onChange={(e) => handleSiblingChange(sIdx, 'educationStatus', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label>Occupation</label>
                          <input
                            type="text"
                            placeholder="e.g. Unemployed / Software Engineer"
                            className="settings-input"
                            value={sib.occupation || ''}
                            onChange={(e) => handleSiblingChange(sIdx, 'occupation', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-actions-bar">
                <button
                  type="button"
                  disabled={saving}
                  onClick={savePersonal}
                  className="settings-btn settings-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Personal Details'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL DETAILS */}
          {tab === 'professional' && (
            <div>
              {/* Core skills */}
              <div className="settings-form-section">
                <div className="settings-section-title">Core Skills</div>
                <div className="settings-form-group">
                  <label>Skills (type and press Enter, or click a suggestion)</label>
                  {/* Tag display */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', minHeight: '40px' }}>
                    {(profileData.skills || []).map((skill, sIdx) => (
                      <span key={sIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.6rem', background: 'rgba(59,130,246,0.18)', color: '#a3e635', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid rgba(59,130,246,0.35)' }}>
                        {skill}
                        <button type="button" onClick={() => handleSkillsChange((profileData.skills || []).filter((_, i) => i !== sIdx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700, padding: 0, fontSize: '0.85rem', lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                    <SkillInput skills={profileData.skills || []} onAdd={(skill) => { if (skill && !(profileData.skills || []).includes(skill)) handleSkillsChange([...(profileData.skills || []), skill]); }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                    {['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'MongoDB', 'SQL', 'TypeScript', 'HTML/CSS', 'Machine Learning', 'Data Structures', 'Git', 'AWS', 'Docker'].filter(s => !(profileData.skills || []).includes(s)).slice(0, 10).map(s => (
                      <button key={s} type="button" onClick={() => handleSkillsChange([...(profileData.skills || []), s])} style={{ padding: '0.15rem 0.55rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '99px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>+ {s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Education list */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>Academic Qualifications</span>
                  <button type="button" onClick={addEducation} className="settings-btn-add">＋ Add Academy</button>
                </div>
                {(profileData.education || []).map((edu, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button type="button" className="settings-card-remove-btn" onClick={() => removeEducation(idx)}>✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Institution Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={edu.institution || ''}
                          onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Degree / Qualification</label>
                        <input
                          type="text"
                          placeholder="e.g. B.Tech / Class XII"
                          className="settings-input"
                          value={edu.degree || ''}
                          onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Branch / Field</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={edu.branch || ''}
                          onChange={(e) => handleEducationChange(idx, 'branch', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>CGPA / Percentage</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={edu.cgpa || ''}
                          onChange={(e) => handleEducationChange(idx, 'cgpa', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Start Year</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={edu.startYear || ''}
                          onChange={(e) => handleEducationChange(idx, 'startYear', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>End Year (Or Expected)</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={edu.endYear || ''}
                          onChange={(e) => handleEducationChange(idx, 'endYear', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects list */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>Projects</span>
                  <button type="button" onClick={addProject} className="settings-btn-add">＋ Add Project</button>
                </div>
                {(profileData.projects || []).map((proj, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button type="button" className="settings-card-remove-btn" onClick={() => removeProject(idx)}>✖</button>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Project Title</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={proj.title || ''}
                        onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                      />
                    </div>
                    <div className="settings-form-group" style={{ marginBottom: '1rem' }}>
                      <label>Technologies used (comma separated)</label>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder="React, Express, MongoDB"
                        value={(proj.technologies || []).join(', ')}
                        onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)}
                      />
                    </div>
                    <div className="settings-grid-2" style={{ marginBottom: '1rem' }}>
                      <div className="settings-form-group">
                        <label>GitHub Repository Link</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={proj.githubLink || ''}
                          onChange={(e) => handleProjectChange(idx, 'githubLink', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Live Demo Link</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={proj.liveLink || ''}
                          onChange={(e) => handleProjectChange(idx, 'liveLink', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="settings-form-group">
                      <label>Project Description</label>
                      <textarea
                        className="settings-textarea"
                        placeholder="Brief summary of highlights (one per line, max 3)"
                        value={proj.description || ''}
                        onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Work experiences */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>Work Experience</span>
                  <button type="button" onClick={addExperience} className="settings-btn-add">＋ Add Experience</button>
                </div>
                {(profileData.workExperience || []).map((exp, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button type="button" className="settings-card-remove-btn" onClick={() => removeExperience(idx)}>✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Company / Organization</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={exp.company || ''}
                          onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Job Role</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={exp.role || ''}
                          onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          className="settings-input"
                          value={formatDateField(exp.startDate)}
                          onChange={(e) => handleExperienceChange(idx, 'startDate', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>End Date (leave blank if current job)</label>
                        <input
                          type="date"
                          className="settings-input"
                          value={formatDateField(exp.endDate)}
                          onChange={(e) => handleExperienceChange(idx, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="settings-form-group">
                      <label>Job Highlights / Description</label>
                      <textarea
                        className="settings-textarea"
                        value={exp.description || ''}
                        onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Certifications */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>Certifications</span>
                  <button type="button" onClick={addCert} className="settings-btn-add">＋ Add Certification</button>
                </div>
                {(profileData.certifications || []).map((cert, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button type="button" className="settings-card-remove-btn" onClick={() => removeCert(idx)}>✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Certificate Title</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={cert.title || ''}
                          onChange={(e) => handleCertChange(idx, 'title', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Provider / Issuer</label>
                        <input
                          type="text"
                          placeholder="e.g. AWS, Coursera"
                          className="settings-input"
                          value={cert.provider || cert.issuer || ''}
                          onChange={(e) => handleCertChange(idx, 'provider', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Issue Date</label>
                        <input
                          type="date"
                          className="settings-input"
                          value={formatDateField(cert.issueDate || cert.date)}
                          onChange={(e) => handleCertChange(idx, 'issueDate', e.target.value)}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Verification Credential Link</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={cert.credentialLink || ''}
                          onChange={(e) => handleCertChange(idx, 'credentialLink', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hackathons */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>Hackathons ({(profileData.hackathons || []).length})</span>
                  <button type="button" onClick={addHackathon} className="settings-btn-add">＋ Add Hackathon</button>
                </div>
                {(profileData.hackathons || []).map((h, idx) => (
                  <div className="settings-card-item" key={idx} style={{ borderLeft: '3px solid rgba(139, 92, 246, 0.4)' }}>
                    <button type="button" className="settings-card-remove-btn" onClick={() => removeHackathon(idx)}>✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Hackathon Name *</label>
                        <input type="text" className="settings-input" placeholder="e.g. Smart India Hackathon" value={h.name || ''} onChange={(e) => handleHackathonChange(idx, 'name', e.target.value)} />
                      </div>
                      <div className="settings-form-group">
                        <label>Organizer</label>
                        <input type="text" className="settings-input" placeholder="e.g. AICTE, HackerEarth" value={h.organizer || ''} onChange={(e) => handleHackathonChange(idx, 'organizer', e.target.value)} />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Date</label>
                        <input type="date" className="settings-input" value={h.date ? h.date.split('T')[0] : ''} onChange={(e) => handleHackathonChange(idx, 'date', e.target.value)} />
                      </div>
                      <div className="settings-form-group">
                        <label>Team Size</label>
                        <input type="number" min="1" className="settings-input" value={h.teamSize || 1} onChange={(e) => handleHackathonChange(idx, 'teamSize', Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Position / Track</label>
                        <input type="text" className="settings-input" placeholder="e.g. Winner, Top 10, Finalist" value={h.position || ''} onChange={(e) => handleHackathonChange(idx, 'position', e.target.value)} />
                      </div>
                      <div className="settings-form-group">
                        <label>Result</label>
                        <input type="text" className="settings-input" placeholder="e.g. 1st Place, Runner Up, Participant" value={h.result || ''} onChange={(e) => handleHackathonChange(idx, 'result', e.target.value)} />
                      </div>
                    </div>
                    <div className="settings-form-group" style={{ marginTop: '1rem' }}>
                      <label>Description</label>
                      <textarea className="settings-input" rows={2} style={{ resize: 'vertical' }} placeholder="Brief description of the project / problem statement..." value={h.description || ''} onChange={(e) => handleHackathonChange(idx, 'description', e.target.value)} />
                    </div>
                    <div className="settings-form-group" style={{ marginTop: '0.5rem' }}>
                      <label>Certificate Link</label>
                      <input type="text" className="settings-input" placeholder="https://..." value={h.certificateLink || ''} onChange={(e) => handleHackathonChange(idx, 'certificateLink', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-actions-bar">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveProfessional}
                  className="settings-btn settings-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Professional Details'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CODING PROFILES */}
          {tab === 'coding' && (
            <div>
              <div className="sync-status-box">
                <div className="sync-status-text">
                  <div>Sync Coding Activities</div>
                  <span>Force pulling your solved counts and ratings directly from external APIs.</span>
                </div>
                <button
                  type="button"
                  onClick={triggerGlobalSync}
                  disabled={saving}
                  className="settings-btn settings-btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {saving ? 'Syncing...' : '🔄 Sync Platforms Now'}
                </button>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Configure Handles</div>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>LeetCode Username</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.leetcodeUsername || ''}
                      onChange={(e) => handleCodingUsernameChange('leetcodeUsername', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>GeeksforGeeks Handle</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.gfgUsername || ''}
                      onChange={(e) => handleCodingUsernameChange('gfgUsername', e.target.value)}
                    />
                  </div>
                </div>

                <div className="settings-grid-2" style={{ marginTop: '1.2rem' }}>
                  <div className="settings-form-group">
                    <label>CodeChef Username</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.codechefUsername || ''}
                      onChange={(e) => handleCodingUsernameChange('codechefUsername', e.target.value)}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>HackerRank Username</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileData.hackerrankUsername || ''}
                      onChange={(e) => handleCodingUsernameChange('hackerrankUsername', e.target.value)}
                    />
                  </div>
                </div>

                <div className="settings-form-group" style={{ marginTop: '1.2rem' }}>
                  <label>GitHub Developer Username</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={profileData.githubUsername || ''}
                    onChange={(e) => handleCodingUsernameChange('githubUsername', e.target.value)}
                  />
                </div>
              </div>

              {/* Displaying Current Cached statistics */}
              <div className="settings-form-section" style={{ marginTop: '2.5rem' }}>
                <div className="settings-section-title">Current Solved Milestones</div>
                
                <div className="coding-stats-badges">
                  <div className="platform-stat-card">
                    <div className="platform-stat-header">
                      <span>LeetCode</span>
                      <span className="platform-stat-username">@{profileData.leetcodeUsername || 'none'}</span>
                    </div>
                    <div className="platform-stat-solved">
                      {profileData.platformStats?.leetcode?.problemsSolved || 0}
                      <span> Solved</span>
                    </div>
                  </div>

                  <div className="platform-stat-card">
                    <div className="platform-stat-header">
                      <span>GeeksforGeeks</span>
                      <span className="platform-stat-username">@{profileData.gfgUsername || 'none'}</span>
                    </div>
                    <div className="platform-stat-solved">
                      {profileData.platformStats?.geeksforgeeks?.totalProblemsSolved || profileData.platformStats?.geeksforgeeks?.problemsSolved || 0}
                      <span> Solved</span>
                    </div>
                  </div>

                  <div className="platform-stat-card">
                    <div className="platform-stat-header">
                      <span>CodeChef</span>
                      <span className="platform-stat-username">@{profileData.codechefUsername || 'none'}</span>
                    </div>
                    <div className="platform-stat-solved">
                      {profileData.platformStats?.codechef?.problemsSolved || 0}
                      <span> Solved</span>
                    </div>
                  </div>

                  <div className="platform-stat-card">
                    <div className="platform-stat-header">
                      <span>HackerRank</span>
                      <span className="platform-stat-username">@{profileData.hackerrankUsername || 'none'}</span>
                    </div>
                    <div className="platform-stat-solved">
                      {profileData.hackerrank?.totalProblemsSolved || 0}
                      <span> Solved</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-actions-bar">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveCoding}
                  className="settings-btn settings-btn-primary"
                >
                  {saving ? 'Saving handles...' : 'Save Handles & Sync'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: ACADEMIC PROFILE */}
          {tab === 'academic' && (
            <div>
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>Semester-wise GPAs</span>
                  {academicForm.academicStatus && (
                    <span style={{
                      fontSize: '0.8rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: academicForm.academicStatus === 'Excellent' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: academicForm.academicStatus === 'Excellent' ? '#10b981' : '#f59e0b',
                      border: '1px solid currentColor'
                    }}>
                      Status: {academicForm.academicStatus}
                    </span>
                  )}
                </div>
                
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                  Enter your Semester Grade Point Average (SGPA) for completed semesters. Values must be between 0.0 and 10.0. Leave empty if a semester is not yet completed.
                </p>

                <div className="settings-grid-3">
                  <div className="settings-form-group">
                    <label>Semester 1 SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.5"
                      value={academicForm.sgpa1}
                      onChange={(e) => setAcademicForm(p => ({ ...p, sgpa1: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Semester 2 SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.5"
                      value={academicForm.sgpa2}
                      onChange={(e) => setAcademicForm(p => ({ ...p, sgpa2: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Semester 3 SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.5"
                      value={academicForm.sgpa3}
                      onChange={(e) => setAcademicForm(p => ({ ...p, sgpa3: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="settings-grid-3" style={{ marginTop: '1.2rem' }}>
                  <div className="settings-form-group">
                    <label>Semester 4 SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.5"
                      value={academicForm.sgpa4}
                      onChange={(e) => setAcademicForm(p => ({ ...p, sgpa4: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Semester 5 SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.5"
                      value={academicForm.sgpa5}
                      onChange={(e) => setAcademicForm(p => ({ ...p, sgpa5: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Semester 6 SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.5"
                      value={academicForm.sgpa6}
                      onChange={(e) => setAcademicForm(p => ({ ...p, sgpa6: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Cumulative Performance</div>
                <div className="settings-grid-3">
                  <div className="settings-form-group">
                    <label>Overall CGPA (Required)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="settings-input"
                      placeholder="e.g. 8.75"
                      value={academicForm.cgpa}
                      onChange={(e) => setAcademicForm(p => ({ ...p, cgpa: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Active Backlogs (Required)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 0"
                      value={academicForm.backlogs}
                      onChange={(e) => setAcademicForm(p => ({ ...p, backlogs: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>EAPCET Rank (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 15000"
                      value={academicForm.eapcetRank}
                      onChange={(e) => setAcademicForm(p => ({ ...p, eapcetRank: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-actions-bar">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAcademic}
                  className="settings-btn settings-btn-primary"
                >
                  {saving ? 'Saving academic profile...' : 'Save Academic Details'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CHANGE PASSWORD */}
          {tab === 'password' && (
            <div>
              <div className="settings-form-section">
                <div className="settings-section-title">Change Password Form</div>
                
                <div className="settings-form-group" style={{ marginBottom: '1.2rem' }}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="settings-input"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                  />
                </div>

                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={pwdForm.newPassword}
                      onChange={(e) => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={pwdForm.confirmPassword}
                      onChange={(e) => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-actions-bar">
                <button
                  type="button"
                  disabled={saving}
                  onClick={savePassword}
                  className="settings-btn settings-btn-primary"
                >
                  {saving ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </AppShell>
  );
}
