import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

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
    eapcetRank: '',
    eamcetRank: '',
    jeeMainsRank: '',
    jeeMainsPercentile: '',
    jeeMainsOverallRank: '',
    jeeMainsCategoryRank: '',
    jeeAdvOverallRank: '',
    jeeAdvCategoryRank: ''
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
              eapcetRank: '',
              eamcetRank: acadData.eamcetRank != null ? acadData.eamcetRank.toString() : (acadData.eapcetRank != null ? acadData.eapcetRank.toString() : ''),
              jeeMainsRank: '',
              jeeMainsPercentile: acadData.jeeMainsPercentile != null ? acadData.jeeMainsPercentile.toString() : '',
              jeeMainsOverallRank: acadData.jeeMainsOverallRank != null ? acadData.jeeMainsOverallRank.toString() : '',
              jeeMainsCategoryRank: acadData.jeeMainsCategoryRank != null ? acadData.jeeMainsCategoryRank.toString() : '',
              jeeAdvOverallRank: acadData.jeeAdvOverallRank != null ? acadData.jeeAdvOverallRank.toString() : '',
              jeeAdvCategoryRank: acadData.jeeAdvCategoryRank != null ? acadData.jeeAdvCategoryRank.toString() : ''
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

      if (tab === 'mandatory') {
        try {
          const mData = await api.getJson('/student/me/profile/mandatory-accomplishments', token);
          if (mData) {
            setProfileData(prev => ({
              ...prev,
              mandatoryAccomplishments: mData
            }));
          }
        } catch (err) {
          console.error('Failed to load mandatory accomplishments:', err);
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
      // Validate mentor phone numbers (frontend check)
      const phoneRegex = /^[0-9]{10}$/;
      const validatePhone = (m, label) => {
        const phone = typeof m?.mobileNumber === 'string' ? m.mobileNumber.trim() : '';
        if (phone && !phoneRegex.test(phone)) {
          throw new Error(`${label} must be a valid 10-digit mobile number.`);
        }
      };

      validatePhone(profileData.collegeMentor, 'College Mentor');
      validatePhone(profileData.academicMentor, 'Academic Mentor');
      validatePhone(profileData.codingMentor, 'Coding Mentor');
      validatePhone(profileData.communicationMentor, 'Communication Skills Mentor');
      validatePhone(profileData.projectMentor, 'Project Mentor');

      const payload = {
        personalDetails: profileData.personalDetails,
        familyDetails: profileData.familyDetails,
        goal: profileData.goal,
        collegeMentor: profileData.collegeMentor,
        academicMentor: profileData.academicMentor,
        codingMentor: profileData.codingMentor,
        communicationMentor: profileData.communicationMentor,
        projectMentor: profileData.projectMentor
      };
      await api.putJson('/student/me/profile/personal', payload, token);
      toast.success('Personal details saved successfully!');
      
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
      toast.error(err.message || 'Failed to save personal details.');
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
      toast.success('Professional details saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save professional details.');
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
      toast.success('Coding handles updated & sync triggered successfully!');
      // Update global context
      if (response.user) {
        login(token, response.user);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save coding handles.');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    try {
      if (pwdForm.newPassword !== pwdForm.confirmPassword) {
        toast.error('New passwords do not match!');
        return;
      }
      setSaving(true);
      const payload = {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      };
      await api.putJson('/student/me/change-password', payload, token);
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const saveMandatoryAccomplishments = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const ma = profileData.mandatoryAccomplishments || {};
      const payload = {
        technicalCourses: ma.technicalCourses || [],
        projects: ma.projects || [],
        hackathons: ma.hackathons || [],
        personalityActivities: ma.personalityActivities || []
      };
      const res = await api.putJson('/student/me/profile/mandatory-accomplishments', payload, token);
      toast.success('Mandatory accomplishments saved successfully!');
      
      // Update with calculated scores returned from backend
      if (res.mandatoryAccomplishments) {
        setProfileData(prev => ({
          ...prev,
          mandatoryAccomplishments: res.mandatoryAccomplishments
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save mandatory accomplishments.');
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
        eapcetRank: null,
        eamcetRank: academicForm.eamcetRank === '' ? null : parseInt(academicForm.eamcetRank, 10),
        jeeMainsRank: null,
        jeeMainsPercentile: academicForm.jeeMainsPercentile === '' ? null : parseFloat(academicForm.jeeMainsPercentile),
        jeeMainsOverallRank: academicForm.jeeMainsOverallRank === '' ? null : parseInt(academicForm.jeeMainsOverallRank, 10),
        jeeMainsCategoryRank: academicForm.jeeMainsCategoryRank === '' ? null : parseInt(academicForm.jeeMainsCategoryRank, 10),
        jeeAdvOverallRank: academicForm.jeeAdvOverallRank === '' ? null : parseInt(academicForm.jeeAdvOverallRank, 10),
        jeeAdvCategoryRank: academicForm.jeeAdvCategoryRank === '' ? null : parseInt(academicForm.jeeAdvCategoryRank, 10)
      };

      if (isNaN(payload.cgpa) || payload.cgpa < 0 || payload.cgpa > 10) {
        throw new Error('CGPA must be a valid number between 0 and 10.');
      }
      if (isNaN(payload.backlogs) || payload.backlogs < 0) {
        throw new Error('Backlogs must be a valid non-negative integer.');
      }
      if (payload.eamcetRank !== null && (isNaN(payload.eamcetRank) || payload.eamcetRank < 0)) {
        throw new Error('EAMCET Rank must be a valid non-negative integer.');
      }
      if (payload.jeeMainsPercentile !== null && (isNaN(payload.jeeMainsPercentile) || payload.jeeMainsPercentile < 0 || payload.jeeMainsPercentile > 100)) {
        throw new Error('JEE Mains Percentile must be a valid number between 0 and 100.');
      }
      if (payload.jeeMainsOverallRank !== null && (isNaN(payload.jeeMainsOverallRank) || payload.jeeMainsOverallRank < 0)) {
        throw new Error('JEE Mains Overall Rank must be a valid non-negative integer.');
      }
      if (payload.jeeMainsCategoryRank !== null && (isNaN(payload.jeeMainsCategoryRank) || payload.jeeMainsCategoryRank < 0)) {
        throw new Error('JEE Mains Category Rank must be a valid non-negative integer.');
      }
      if (payload.jeeAdvOverallRank !== null && (isNaN(payload.jeeAdvOverallRank) || payload.jeeAdvOverallRank < 0)) {
        throw new Error('JEE Advanced Overall Rank must be a valid non-negative integer.');
      }
      if (payload.jeeAdvCategoryRank !== null && (isNaN(payload.jeeAdvCategoryRank) || payload.jeeAdvCategoryRank < 0)) {
        throw new Error('JEE Advanced Category Rank must be a valid non-negative integer.');
      }
      for (let i = 1; i <= 6; i++) {
        const val = payload[`sgpa${i}`];
        if (val !== null && (isNaN(val) || val < 0 || val > 10)) {
          throw new Error(`SGPA ${i} must be a valid number between 0 and 10.`);
        }
      }

      const res = await api.putJson('/student/me/profile/academic', payload, token);
      toast.success('Academic Details Updated Successfully');
      setAcademicForm(prev => ({
        ...prev,
        academicStatus: res.academicStatus || prev.academicStatus
      }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to Update Academic Details');
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
      toast.success('Sync completed successfully!');
      fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error('Sync failed. Please verify platform usernames.');
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
          <button className={activeTabClass('mandatory')} onClick={() => navigate('/profile/mandatory')}>Mandatory Accomplishments</button>
          <button className={activeTabClass('coding')} onClick={() => navigate('/profile/coding')}>Coding Profiles</button>
          <button className={activeTabClass('academic')} onClick={() => navigate('/profile/academic')}>Academic Profile</button>
          <button className={activeTabClass('password')} onClick={() => navigate('/profile/password')}>Change Password</button>
        </div>

        <Toaster position="bottom-right" reverseOrder={false} />

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

              {/* GOAL SECTION */}
              <div className="settings-form-section">
                <div className="settings-section-title">Career Track / Goal Selection</div>
                <div className="settings-form-group">
                  <label>Select Your Career Track (Goal)</label>
                  <select
                    className="settings-select"
                    value={profileData.goal || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, goal: e.target.value || null }))}
                  >
                    <option value="">No Track Selected</option>
                    <option value="Placement & Paid Internship Track">Placement & Paid Internship Track</option>
                    <option value="GATE & Higher Studies Track">GATE & Higher Studies Track</option>
                    <option value="PSU & Government Track">PSU & Government Track</option>
                    <option value="Both Placement and GATE">Both Placement and GATE</option>
                  </select>
                </div>
              </div>

              {/* MENTOR DETAILS SECTION */}
              <div className="settings-form-section">
                <div className="settings-section-title">Mentor Details</div>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.2rem' }}>
                  Please provide the name and a valid 10-digit mobile number for each of your mentors.
                </p>
                <div className="settings-grid-2">
                  {/* College Mentor */}
                  <div className="settings-card-item" style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#60a5fa', fontSize: '0.9rem' }}>College Mentor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div className="settings-form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.collegeMentor?.name || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            collegeMentor: { ...(prev.collegeMentor || {}), name: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.collegeMentor?.mobileNumber || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            collegeMentor: { ...(prev.collegeMentor || {}), mobileNumber: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic Mentor */}
                  <div className="settings-card-item" style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#60a5fa', fontSize: '0.9rem' }}>Academic Mentor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div className="settings-form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.academicMentor?.name || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            academicMentor: { ...(prev.academicMentor || {}), name: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.academicMentor?.mobileNumber || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            academicMentor: { ...(prev.academicMentor || {}), mobileNumber: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coding Mentor */}
                  <div className="settings-card-item" style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#60a5fa', fontSize: '0.9rem' }}>Coding Mentor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div className="settings-form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.codingMentor?.name || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            codingMentor: { ...(prev.codingMentor || {}), name: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.codingMentor?.mobileNumber || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            codingMentor: { ...(prev.codingMentor || {}), mobileNumber: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Communication Skills Mentor */}
                  <div className="settings-card-item" style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#60a5fa', fontSize: '0.9rem' }}>Communication Skills Mentor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div className="settings-form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.communicationMentor?.name || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            communicationMentor: { ...(prev.communicationMentor || {}), name: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.communicationMentor?.mobileNumber || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            communicationMentor: { ...(prev.communicationMentor || {}), mobileNumber: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Mentor */}
                  <div className="settings-card-item" style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#60a5fa', fontSize: '0.9rem' }}>Project Mentor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div className="settings-form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.projectMentor?.name || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            projectMentor: { ...(prev.projectMentor || {}), name: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={profileData.projectMentor?.mobileNumber || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            projectMentor: { ...(prev.projectMentor || {}), mobileNumber: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
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

          {/* TAB 3.5: MANDATORY ACCOMPLISHMENTS */}
          {tab === 'mandatory' && (
            <div>
              <div className="settings-header-banner" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.2) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="settings-header-left">
                  <h2 style={{ fontSize: '1.4rem', color: '#34d399', marginBottom: '0.3rem' }}>Mandatory Accomplishments</h2>
                  <p>Scholarship evaluation metrics.</p>
                </div>
                <div className="settings-metrics-group">
                  <div className="settings-metric-box">
                    <div className="settings-metric-val" style={{ color: '#10b981' }}>
                      {profileData.mandatoryAccomplishments?.calculatedScores?.total || 0} / 70
                    </div>
                    <div className="settings-metric-label">Total Score</div>
                  </div>
                </div>
              </div>

              {/* 1. Academic CGPA */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>1. Academic CGPA (Auto-synced)</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.cgpa || 0} / 10</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Your Overall CGPA: <strong>{profileData.overallGpa || 'N/A'}</strong> (This is automatically pulled from your Academic Details).
                </div>
              </div>

              {/* 2. Technical Courses */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>2. Technical Courses</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newC = { courseName: '', platform: '', status: 'Completed', certificateLink: '' };
                      setProfileData(prev => ({
                        ...prev,
                        mandatoryAccomplishments: {
                          ...(prev.mandatoryAccomplishments || {}),
                          technicalCourses: [...(prev.mandatoryAccomplishments?.technicalCourses || []), newC]
                        }
                      }));
                    }}
                    className="settings-btn-add"
                  >＋ Add Course</button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.technicalCourses || 0} / 10</p>
                {(profileData.mandatoryAccomplishments?.technicalCourses || []).map((course, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button
                      type="button"
                      className="settings-card-remove-btn"
                      onClick={() => {
                        setProfileData(prev => {
                          const courses = [...(prev.mandatoryAccomplishments?.technicalCourses || [])];
                          courses.splice(idx, 1);
                          return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, technicalCourses: courses } };
                        });
                      }}
                    >✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Course Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={course.courseName || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const courses = [...(prev.mandatoryAccomplishments?.technicalCourses || [])];
                              courses[idx] = { ...courses[idx], courseName: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, technicalCourses: courses } };
                            });
                          }}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Platform (e.g. Coursera, Udemy)</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={course.platform || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const courses = [...(prev.mandatoryAccomplishments?.technicalCourses || [])];
                              courses[idx] = { ...courses[idx], platform: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, technicalCourses: courses } };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Status</label>
                        <select
                          className="settings-select"
                          value={course.status || 'Completed'}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const courses = [...(prev.mandatoryAccomplishments?.technicalCourses || [])];
                              courses[idx] = { ...courses[idx], status: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, technicalCourses: courses } };
                            });
                          }}
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                        </select>
                      </div>
                      <div className="settings-form-group">
                        <label>Certificate / Drive Link</label>
                        <input
                          type="url"
                          className="settings-input"
                          value={course.certificateLink || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const courses = [...(prev.mandatoryAccomplishments?.technicalCourses || [])];
                              courses[idx] = { ...courses[idx], certificateLink: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, technicalCourses: courses } };
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3. Coding Consistency (Read-only) */}
              <div className="settings-form-section">
                <div className="settings-section-title">3. Coding Consistency (Auto-synced from LeetCode)</div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.codingConsistency || 0} / 10</p>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>Arrays Solved</label>
                    <input type="text" className="settings-input" disabled value={profileData.mandatoryAccomplishments?.codingConsistency?.arraysSolved || 0} />
                  </div>
                  <div className="settings-form-group">
                    <label>Strings Solved</label>
                    <input type="text" className="settings-input" disabled value={profileData.mandatoryAccomplishments?.codingConsistency?.stringsSolved || 0} />
                  </div>
                </div>
              </div>

              {/* 4. Projects */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>4. Technical Projects</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newP = { projectName: '', description: '', githubLink: '', liveLink: '', driveLink: '' };
                      setProfileData(prev => ({
                        ...prev,
                        mandatoryAccomplishments: {
                          ...(prev.mandatoryAccomplishments || {}),
                          projects: [...(prev.mandatoryAccomplishments?.projects || []), newP]
                        }
                      }));
                    }}
                    className="settings-btn-add"
                  >＋ Add Project</button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.projects || 0} / 10</p>
                {(profileData.mandatoryAccomplishments?.projects || []).map((proj, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button
                      type="button"
                      className="settings-card-remove-btn"
                      onClick={() => {
                        setProfileData(prev => {
                          const projects = [...(prev.mandatoryAccomplishments?.projects || [])];
                          projects.splice(idx, 1);
                          return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, projects } };
                        });
                      }}
                    >✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Project Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={proj.projectName || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const projects = [...(prev.mandatoryAccomplishments?.projects || [])];
                              projects[idx] = { ...projects[idx], projectName: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, projects } };
                            });
                          }}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>GitHub Link</label>
                        <input
                          type="url"
                          className="settings-input"
                          value={proj.githubLink || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const projects = [...(prev.mandatoryAccomplishments?.projects || [])];
                              projects[idx] = { ...projects[idx], githubLink: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, projects } };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="settings-grid-2" style={{ marginTop: '1rem' }}>
                      <div className="settings-form-group">
                        <label>Live Link</label>
                        <input
                          type="url"
                          className="settings-input"
                          value={proj.liveLink || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const projects = [...(prev.mandatoryAccomplishments?.projects || [])];
                              projects[idx] = { ...projects[idx], liveLink: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, projects } };
                            });
                          }}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Drive Link (Demo/Doc)</label>
                        <input
                          type="url"
                          className="settings-input"
                          value={proj.driveLink || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const projects = [...(prev.mandatoryAccomplishments?.projects || [])];
                              projects[idx] = { ...projects[idx], driveLink: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, projects } };
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 5. Contest Performance (Read-only) */}
              <div className="settings-form-section">
                <div className="settings-section-title">5. Contest Performance (Auto-synced)</div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.contestPerformance || 0} / 10</p>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>LeetCode Rating</label>
                    <input type="text" className="settings-input" disabled value={profileData.mandatoryAccomplishments?.contestPerformance?.leetcodeRating || 0} />
                  </div>
                  <div className="settings-form-group">
                    <label>CodeChef Rating</label>
                    <input type="text" className="settings-input" disabled value={profileData.mandatoryAccomplishments?.contestPerformance?.codechefRating || 0} />
                  </div>
                </div>
              </div>

              {/* 6. Hackathons */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>6. Technical Hackathons</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newH = { hackathonName: '', position: '', certificateLink: '' };
                      setProfileData(prev => ({
                        ...prev,
                        mandatoryAccomplishments: {
                          ...(prev.mandatoryAccomplishments || {}),
                          hackathons: [...(prev.mandatoryAccomplishments?.hackathons || []), newH]
                        }
                      }));
                    }}
                    className="settings-btn-add"
                  >＋ Add Hackathon</button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.hackathons || 0} / 10</p>
                {(profileData.mandatoryAccomplishments?.hackathons || []).map((hack, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button
                      type="button"
                      className="settings-card-remove-btn"
                      onClick={() => {
                        setProfileData(prev => {
                          const hackathons = [...(prev.mandatoryAccomplishments?.hackathons || [])];
                          hackathons.splice(idx, 1);
                          return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, hackathons } };
                        });
                      }}
                    >✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Hackathon Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={hack.hackathonName || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const hackathons = [...(prev.mandatoryAccomplishments?.hackathons || [])];
                              hackathons[idx] = { ...hackathons[idx], hackathonName: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, hackathons } };
                            });
                          }}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Position (e.g. Winner, 2nd, Top 10, Participant)</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={hack.position || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const hackathons = [...(prev.mandatoryAccomplishments?.hackathons || [])];
                              hackathons[idx] = { ...hackathons[idx], position: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, hackathons } };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="settings-form-group" style={{ marginTop: '1rem' }}>
                      <label>Certificate / Proof Link</label>
                      <input
                        type="url"
                        className="settings-input"
                        value={hack.certificateLink || ''}
                        onChange={(e) => {
                          setProfileData(prev => {
                            const hackathons = [...(prev.mandatoryAccomplishments?.hackathons || [])];
                            hackathons[idx] = { ...hackathons[idx], certificateLink: e.target.value };
                            return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, hackathons } };
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 7. Personality Development */}
              <div className="settings-form-section">
                <div className="settings-section-title">
                  <span>7. Personality Development Activities</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newA = { activityName: '', certificateLink: '' };
                      setProfileData(prev => ({
                        ...prev,
                        mandatoryAccomplishments: {
                          ...(prev.mandatoryAccomplishments || {}),
                          personalityActivities: [...(prev.mandatoryAccomplishments?.personalityActivities || []), newA]
                        }
                      }));
                    }}
                    className="settings-btn-add"
                  >＋ Add Activity</button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>Score: {profileData.mandatoryAccomplishments?.calculatedScores?.personalityDevelopment || 0} / 10</p>
                {(profileData.mandatoryAccomplishments?.personalityActivities || []).map((act, idx) => (
                  <div className="settings-card-item" key={idx}>
                    <button
                      type="button"
                      className="settings-card-remove-btn"
                      onClick={() => {
                        setProfileData(prev => {
                          const acts = [...(prev.mandatoryAccomplishments?.personalityActivities || [])];
                          acts.splice(idx, 1);
                          return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, personalityActivities: acts } };
                        });
                      }}
                    >✖</button>
                    <div className="settings-grid-2">
                      <div className="settings-form-group">
                        <label>Activity / Event Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={act.activityName || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const acts = [...(prev.mandatoryAccomplishments?.personalityActivities || [])];
                              acts[idx] = { ...acts[idx], activityName: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, personalityActivities: acts } };
                            });
                          }}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Proof Link</label>
                        <input
                          type="url"
                          className="settings-input"
                          value={act.certificateLink || ''}
                          onChange={(e) => {
                            setProfileData(prev => {
                              const acts = [...(prev.mandatoryAccomplishments?.personalityActivities || [])];
                              acts[idx] = { ...acts[idx], certificateLink: e.target.value };
                              return { ...prev, mandatoryAccomplishments: { ...prev.mandatoryAccomplishments, personalityActivities: acts } };
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-actions-bar">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveMandatoryAccomplishments}
                  className="settings-btn settings-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Mandatory Accomplishments'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4 (originally 4, now 5): ACADEMIC PROFILE */}
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
                <div className="settings-grid-2">
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
                </div>
              </div>

              <div className="settings-form-section">
                <div className="settings-section-title">Entrance Exam Details</div>
                <div className="settings-grid-2">
                  <div className="settings-form-group">
                    <label>EAMCET Rank (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 15000"
                      value={academicForm.eamcetRank}
                      onChange={(e) => setAcademicForm(p => ({ ...p, eamcetRank: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>JEE Mains Percentile (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="settings-input"
                      placeholder="e.g. 98.45"
                      value={academicForm.jeeMainsPercentile}
                      onChange={(e) => setAcademicForm(p => ({ ...p, jeeMainsPercentile: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="settings-grid-2" style={{ marginTop: '1.2rem' }}>
                  <div className="settings-form-group">
                    <label>JEE Mains Overall Rank (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 28000"
                      value={academicForm.jeeMainsOverallRank}
                      onChange={(e) => setAcademicForm(p => ({ ...p, jeeMainsOverallRank: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>JEE Mains Category Rank (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 4500"
                      value={academicForm.jeeMainsCategoryRank}
                      onChange={(e) => setAcademicForm(p => ({ ...p, jeeMainsCategoryRank: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="settings-grid-2" style={{ marginTop: '1.2rem' }}>
                  <div className="settings-form-group">
                    <label>JEE Advanced Overall Rank (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 12000"
                      value={academicForm.jeeAdvOverallRank}
                      onChange={(e) => setAcademicForm(p => ({ ...p, jeeAdvOverallRank: e.target.value }))}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>JEE Advanced Category Rank (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      placeholder="e.g. 1800"
                      value={academicForm.jeeAdvCategoryRank}
                      onChange={(e) => setAcademicForm(p => ({ ...p, jeeAdvCategoryRank: e.target.value }))}
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
