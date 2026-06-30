import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api, API_BASE_URL } from '../../api/client';
import { 
  Trophy, Award, Code, Activity, Calendar, FileText, 
  ExternalLink, Download, ArrowLeft, RefreshCw, Eye
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HeatmapWidget } from '../../components/HeatmapWidget';

export function CoordinatorStudentDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, platforms, heatmap, analytics, timeline, resume

  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);

  useEffect(() => {
    if (resumeBlobUrl) {
      console.log("CoordinatorStudentDetail iframe src:", resumeBlobUrl);
    }
  }, [resumeBlobUrl]);
  const [studentResumes, setStudentResumes] = useState({ generated: [], uploaded: [] });
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumeAnalytics, setResumeAnalytics] = useState(null);
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const [appendResume, setAppendResume] = useState(true);

  const backendBase = `${API_BASE_URL}/api`;

  const loadAllStudentData = async () => {
    if (!token || !id) return;
    try {
      const studentData = await api.getJson(`/coordinator/students/${id}`, token);
      setStudent(studentData);

      const timelineData = await api.getJson(`/coordinator/students/${id}/timeline`, token);
      setTimeline(timelineData);

      const heatmapData = await api.getJson(`/coordinator/students/${id}/heatmap`, token);
      setHeatmap(heatmapData);
    } catch (err) {
      console.error('Failed to load student details:', err);
      navigate('/coordinator/students', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStudentData();
  }, [token, id]);

  // Securely load PDF Resume url for selected resume
  const loadResumeBlob = async (resumeId) => {
    if (!token || !id) return;
    setLoadingResume(true);
    try {
      // Fetch JSON previewUrl from backend preview endpoint
      const previewRes = await api.getJson(`/coordinator/students/${id}/resume`, token);
      if (!previewRes || !previewRes.resumeUrl) throw new Error('Resume URL unavailable');
      
      const targetUrl = /^https?:\/\//i.test(previewRes.resumeUrl)
        ? previewRes.resumeUrl
        : `${backendBase.replace('/api', '')}${previewRes.resumeUrl}`;
        
      setResumeBlobUrl(targetUrl);
    } catch (err) {
      console.error('Failed to fetch resume preview URL:', err);
      setResumeBlobUrl(null);
    } finally {
      setLoadingResume(false);
    }
  };

  const loadResumeData = async () => {
    if (!token || !id) return;
    try {
      // 1. Fetch resumes list
      const data = await api.getJson(`/coordinator/students/${id}/resumes`, token);
      setStudentResumes(data || { generated: [], uploaded: [] });

      // 2. Fetch resume analytics
      const analytics = await api.getJson(`/coordinator/students/${id}/resume-analytics`, token);
      setResumeAnalytics(analytics);

      // Select default resume
      const defaultVer = (data.generated || []).find(v => v.isDefault) || (data.uploaded || []).find(u => u.isDefault);
      const defaultId = defaultVer ? defaultVer._id : (data.generated?.[0]?._id || data.uploaded?.[0]?._id);
      
      setSelectedResumeId(defaultId);
      if (defaultId) {
        loadResumeBlob(defaultId);
      }
    } catch (err) {
      console.error('Failed to load coordinator student resume info:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'resume') {
      loadResumeData();
    }
  }, [activeTab]);

  // Recharts configurations
  const chartData = useMemo(() => {
    if (!student) return [];
    const stats = student.platformStats || {};
    const hrSolved = student.codingProfile?.hackerrank?.problemSolving?.solved || student.hackerrank?.totalProblemsSolved || 0;
    return [
      { name: 'LeetCode', solved: stats.leetcode?.problemsSolved || 0 },
      { name: 'CodeChef', solved: stats.codechef?.problemsSolved || 0 },
      { name: 'GFG', solved: stats.geeksforgeeks?.problemsSolved || 0 },
      { name: 'HackerRank', solved: hrSolved }
    ].filter(d => d.solved > 0);
  }, [student]);

  const defaultVer = useMemo(() => {
    return (studentResumes.generated || []).find(v => v.isDefault) || (studentResumes.uploaded || []).find(u => u.isDefault);
  }, [studentResumes]);

  const COLORS = ['#F59E0B', '#ef4444', '#22C55E', '#00EA64'];

  if (loading || !student) {
    return (
      <AppShell active="coord-students">
        <div className="ct-card">Loading student insights…</div>
      </AppShell>
    );
  }

  const scores = student.scores || {};
  const stats = student.platformStats || {};
  const lc = stats.leetcode || {};
  const cc = stats.codechef || {};
  const gfg = stats.geeksforgeeks || {};
  const gh = stats.github || {};

  // Safe GitHub Fallbacks
  const githubRepos = gh.reposCount || 0;
  const githubFollowers = gh.followersCount || 0;
  const githubFollowing = gh.followingCount || 0;
  const githubStars = gh.starsCount || 0;
  const githubContributions = Array.isArray(gh.contributions)
    ? gh.contributions.reduce((sum, d) => sum + (d.contributionCount || 0), 0)
    : 0;
  const activeContributionDays = Array.isArray(gh.contributions)
    ? gh.contributions.filter(d => (d.contributionCount || 0) > 0).length
    : 0;


  const handleDownloadResume = async () => {
    if (!selectedResumeId) return;
    try {
      const downloadUrl = `${backendBase}/coordinator/students/${id}/resumes/${selectedResumeId}/download`;
      // Fetch as blob to force browser download dialog with correct filename
      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${student.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download resume: ' + err.message);
    }
  };

  const handleDownloadReportPdf = async () => {
    try {
      const downloadUrl = `${backendBase}/coordinator/students/${id}/report/pdf?appendResume=${appendResume}`;
      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${student.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report card: ' + err.message);
    }
  };

  return (
    <AppShell active="coord-students">
      <style>{`
        .active-tab {
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)) !important;
          color: #0b1120 !important;
          font-weight: 700;
        }
      `}</style>

      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* BACK LINK */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/coordinator/students" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Students List
          </Link>
        </div>

        {/* STUDENT METRICS GENERAL HEADER */}
        <div className="ct-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(17, 24, 39, 0.75))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="ct-avatar-circle" style={{ width: 52, height: 52, fontSize: '1.3rem' }}>
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{student.name}</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {student.email} | MSSID: <strong>{student.mssid || '-'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={handleDownloadReportPdf}
                className="ct-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.8rem',
                  background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
                  color: '#0b1120',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Report Card PDF
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={appendResume}
                  onChange={(e) => setAppendResume(e.target.checked)}
                  style={{ width: 14, height: 14, cursor: 'pointer' }}
                />
                Append Resume
              </label>
            </div>

            <span className="ct-chip" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              Weighted Score: <strong>{Math.round(scores.weightedRankScore || 0)}</strong>
            </span>
            <span className="ct-chip" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              Total Solved: <strong>{(lc.problemsSolved || 0) + (cc.problemsSolved || 0) + (gfg.problemsSolved || 0) + (student.codingProfile?.hackerrank?.problemSolving?.solved || student.hackerrank?.totalProblemsSolved || 0)}</strong>
            </span>
            <span className="ct-pill" style={{ color: student.activityStatus === 'active' ? '#22C55E' : '#9ca3af', borderColor: student.activityStatus === 'active' ? '#22C55E' : '#9ca3af', background: 'rgba(255,255,255,0.02)' }}>
              {student.activityStatus === 'active' ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        {/* 6 CP/GITHUB ANALYTICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.2rem' }}>
          <div className="ct-card" style={{ borderLeft: '4px solid #F59E0B', background: 'var(--grad-score)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>LeetCode Solved</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{lc.problemsSolved || 0}</h2>
          </div>
          <div className="ct-card" style={{ borderLeft: '4px solid #22C55E', background: 'var(--grad-gfg)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>GFG Solved</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{gfg.totalProblemsSolved || gfg.problemsSolved || 0}</h2>
          </div>
          <div className="ct-card" style={{ borderLeft: '4px solid #ef4444', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(17, 24, 39, 0.95))' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CodeChef Solved</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{cc.problemsSolved || 0}</h2>
          </div>
          <div className="ct-card" style={{ borderLeft: '4px solid #8B5CF6', background: 'var(--grad-gh)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>GitHub Repos</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{githubRepos}</h2>
          </div>
          <div className="ct-card" style={{ borderLeft: '4px solid #a855f7', background: 'var(--grad-consistency)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>GitHub Followers</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{githubFollowers}</h2>
          </div>
          <div className="ct-card" style={{ borderLeft: '4px solid var(--accent-blue)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(17, 24, 39, 0.95))' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Coding Score</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{Math.round(scores.weightedRankScore || 0)}</h2>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="ct-card" style={{ padding: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '👤 Profile Overview' },
            { id: 'mandatory', label: '🎓 Mandatory Accomplishments' },
            { id: 'platforms', label: '🔗 Coding Profiles' },
            { id: 'heatmap', label: '📅 Streaks Heatmap' },
            { id: 'analytics', label: '📊 Solve Analytics' },
            { id: 'timeline', label: '⏳ Activity Timeline' },
            { id: 'resume', label: '📜 PDF Resume' }
          ].map(t => (
            <button
              key={t.id}
              className={`ct-nav-item ${activeTab === t.id ? 'active-tab' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ================= TAB CONTENTS ================= */}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="ct-grid-responsive" style={{ gridTemplateColumns: '1fr 1fr' }}>
            
            {/* Placement Readiness Scorecard */}
            <div className="ct-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} color="var(--accent-orange)" /> Placement Readiness Profile
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.2rem', marginTop: '1rem' }}>
                {/* Overall Readiness */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Overall Readiness</span>
                  <h2 style={{ margin: '0.5rem 0', color: 'var(--accent-orange)', fontSize: '2rem', fontWeight: '800' }}>
                    {student.readinessProfile?.overallReadiness ?? 0}%
                  </h2>
                  <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${student.readinessProfile?.overallReadiness ?? 0}%`, background: 'var(--accent-orange)', height: '100%' }} />
                  </div>
                </div>
                {/* DSA Score */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>DSA Score</span>
                  <h2 style={{ margin: '0.5rem 0', color: 'var(--accent-blue)', fontSize: '2rem', fontWeight: '800' }}>
                    {student.readinessProfile?.dsaScore ?? 0}%
                  </h2>
                  <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${student.readinessProfile?.dsaScore ?? 0}%`, background: 'var(--accent-blue)', height: '100%' }} />
                  </div>
                </div>
                {/* Projects Score */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Projects Score</span>
                  <h2 style={{ margin: '0.5rem 0', color: 'var(--accent-green)', fontSize: '2rem', fontWeight: '800' }}>
                    {student.readinessProfile?.projectsScore ?? 0}%
                  </h2>
                  <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${student.readinessProfile?.projectsScore ?? 0}%`, background: 'var(--accent-green)', height: '100%' }} />
                  </div>
                </div>
                {/* Resume Score */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Resume Score</span>
                  <h2 style={{ margin: '0.5rem 0', color: 'var(--accent-purple)', fontSize: '2rem', fontWeight: '800' }}>
                    {student.readinessProfile?.resumeScore ?? 0}%
                  </h2>
                  <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${student.readinessProfile?.resumeScore ?? 0}%`, background: 'var(--accent-purple)', height: '100%' }} />
                  </div>
                </div>
                {/* Profile Completeness */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Profile Score</span>
                  <h2 style={{ margin: '0.5rem 0', color: '#10b981', fontSize: '2rem', fontWeight: '800' }}>
                    {student.readinessProfile?.profileScore ?? student.profileCompletion ?? 0}%
                  </h2>
                  <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${student.readinessProfile?.profileScore ?? student.profileCompletion ?? 0}%`, background: '#10b981', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column Wrapper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Personal & Contact Details */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>Personal & Contact Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <span>👤 Full Name: <strong>{student.personalDetails?.fullName || student.name || '—'}</strong></span>
                  <span>🚻 Gender: <strong>{student.personalDetails?.gender || '—'}</strong></span>
                  <span>📅 Date of Birth: <strong>{student.personalDetails?.dob ? new Date(student.personalDetails.dob).toLocaleDateString() : '—'}</strong></span>
                  <span>📱 Mobile: <strong>{student.personalDetails?.mobile || '—'}</strong></span>
                  <span>📧 Email: <strong>{student.personalDetails?.email || student.email || '—'}</strong></span>
                  <span>🏨 Hostel / Room: <strong>{student.personalDetails?.hostelName || student.hostel || '—'}</strong></span>
                  <span>🏛️ Section: <strong>{student.personalDetails?.section || '—'}</strong></span>
                </div>
                
                <h4 style={{ margin: '1rem 0 0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Address Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <span>📍 Permanent Address: <strong>{student.personalDetails?.permanentAddress || '—'}</strong></span>
                  <span>🏙️ City: <strong>{student.personalDetails?.city || '—'}</strong></span>
                  <span>🏢 District: <strong>{student.personalDetails?.district || '—'}</strong></span>
                  <span>🗺️ State / Pincode: <strong>{student.personalDetails?.state || '—'} - {student.personalDetails?.pincode || '—'}</strong></span>
                </div>
              </div>

              {/* Family & Sibling Details */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>Family Information</h3>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span>Status: <strong>{student.familyDetails?.parentStatus || '—'}</strong></span>
                </div>

                {/* Father info */}
                {(student.familyDetails?.parentStatus === 'Both Parents' || student.familyDetails?.parentStatus === 'Father Only' || student.familyDetails?.father?.name) && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>Father's Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                      <span>Name: <strong>{student.familyDetails?.father?.name || '—'}</strong></span>
                      <span>Occupation: <strong>{student.familyDetails?.father?.occupation || '—'}</strong></span>
                      <span>Education: <strong>{student.familyDetails?.father?.education || '—'}</strong></span>
                      <span>Mobile: <strong>{student.familyDetails?.father?.mobile || '—'}</strong></span>
                    </div>
                  </div>
                )}

                {/* Mother info */}
                {(student.familyDetails?.parentStatus === 'Both Parents' || student.familyDetails?.parentStatus === 'Mother Only' || student.familyDetails?.mother?.name) && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>Mother's Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                      <span>Name: <strong>{student.familyDetails?.mother?.name || '—'}</strong></span>
                      <span>Occupation: <strong>{student.familyDetails?.mother?.occupation || '—'}</strong></span>
                      <span>Education: <strong>{student.familyDetails?.mother?.education || '—'}</strong></span>
                      <span>Mobile: <strong>{student.familyDetails?.mother?.mobile || '—'}</strong></span>
                    </div>
                  </div>
                )}

                {/* Siblings */}
                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Siblings</h4>
                {student.familyDetails?.siblings && student.familyDetails.siblings.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {student.familyDetails.siblings.map((sib, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', padding: '0.6rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        <span>Name: <strong>{sib.name || '—'}</strong></span>
                        <span>Relation: <strong>{sib.relation || '—'}</strong></span>
                        <span>Education: <strong>{sib.educationStatus || '—'}</strong></span>
                        <span>Occupation: <strong>{sib.occupation || '—'}</strong></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No siblings listed.</span>
                )}
              </div>

              {/* Professional Details */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>Professional Details</h3>
                
                {/* Skills */}
                <h4 style={{ margin: 0 }}>Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {student.skills && student.skills.length > 0 ? (
                    student.skills.map((skill, idx) => (
                      <span key={idx} className="ct-chip" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#a3e635', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No skills listed.</span>
                  )}
                </div>

                {/* Projects */}
                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Projects</h4>
                {student.projects && student.projects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {student.projects.map((proj, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', padding: '0.6rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{proj.title}</strong>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {proj.githubLink && <a href={proj.githubLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}><Code size={14} /></a>}
                            {proj.liveLink && <a href={proj.liveLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-green)' }}><ExternalLink size={14} /></a>}
                          </div>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{proj.description}</div>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.4rem' }}>
                            {proj.technologies.map((t, tid) => (
                              <span key={tid} style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No projects listed.</span>
                )}

                {/* Work Experience */}
                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Experience</h4>
                {student.experiences && student.experiences.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {student.experiences.map((exp, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', padding: '0.6rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div><strong>{exp.role}</strong> at <strong>{exp.company}</strong></div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{exp.description}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                          {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No work experiences listed.</span>
                )}

                {/* Certifications */}
                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Certifications</h4>
                {student.certifications && student.certifications.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {student.certifications.map((cert, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', padding: '0.6rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{cert.title}</strong>
                          {cert.credentialLink && <a href={cert.credentialLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}><ExternalLink size={14} /></a>}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Provider: {cert.provider}</div>
                        {cert.issueDate && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Issued: {new Date(cert.issueDate).toLocaleDateString()}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No certifications listed.</span>
                )}

                {/* Hackathons */}
                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Hackathons</h4>
                {student.hackathons && student.hackathons.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {student.hackathons.map((h, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', padding: '0.6rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#a78bfa' }}>{h.name}</strong>
                          {h.certificateLink && <a href={h.certificateLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}><ExternalLink size={14} /></a>}
                        </div>
                        {h.organizer && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Organizer: {h.organizer}</div>}
                        {h.result && <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Result: <strong style={{ color: '#10b981' }}>{h.result}</strong>{h.position && ` — ${h.position}`}</div>}
                        {h.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{h.description}</div>}
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'flex', gap: '1rem' }}>
                          {h.date && <span>Date: {new Date(h.date).toLocaleDateString()}</span>}
                          {h.teamSize && <span>Team Size: {h.teamSize}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hackathons listed.</span>
                )}
              </div>
            </div>

            {/* Right Column Wrapper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Academic Profile */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>Academic Profile</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                  {student.goal && (
                    <span style={{ color: '#60a5fa' }}>🎯 Selected Goal / Track: <strong>{student.goal}</strong></span>
                  )}
                  <span>🏫 College: <strong>{student.personalDetails?.college || student.college || '—'}</strong></span>
                  <span>💻 Branch: <strong>{student.personalDetails?.branch || student.branch || '—'}</strong></span>
                  <span>📅 Academic Year: <strong>{student.personalDetails?.year || student.currentYear || '—'}</strong></span>
                </div>

                {/* Entrance Exam Ranks */}
                <h4 style={{ margin: '1rem 0 0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Entrance Exam Ranks</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <span>EAMCET Rank: <strong>{student.academicDetails?.eamcetRank || student.academicDetails?.eapcetRank || '—'}</strong></span>
                  <span>JEE Mains Percentile: <strong>{student.academicDetails?.jeeMainsPercentile != null ? `${student.academicDetails.jeeMainsPercentile}%` : '—'}</strong></span>
                  <span>JEE Mains Overall Rank: <strong>{student.academicDetails?.jeeMainsOverallRank || '—'}</strong></span>
                  <span>JEE Mains Category Rank: <strong>{student.academicDetails?.jeeMainsCategoryRank || '—'}</strong></span>
                  <span>JEE Advanced Overall Rank: <strong>{student.academicDetails?.jeeAdvOverallRank || '—'}</strong></span>
                  <span>JEE Advanced Category Rank: <strong>{student.academicDetails?.jeeAdvCategoryRank || '—'}</strong></span>
                </div>

                {/* SGPA & CGPA Scorecard */}
                <h4 style={{ margin: '1rem 0 0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Semester GPAs & Cumulative Scores</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem 1</div>
                      <strong>{student.academicProfile?.sgpa1 ?? '—'}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem 2</div>
                      <strong>{student.academicProfile?.sgpa2 ?? '—'}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem 3</div>
                      <strong>{student.academicProfile?.sgpa3 ?? '—'}</strong>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem 4</div>
                      <strong>{student.academicProfile?.sgpa4 ?? '—'}</strong>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem 5</div>
                      <strong>{student.academicProfile?.sgpa5 ?? '—'}</strong>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem 6</div>
                      <strong>{student.academicProfile?.sgpa6 ?? '—'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginTop: '0.4rem', background: 'rgba(59,130,246,0.05)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>CGPA</div>
                      <strong style={{ fontSize: '1.05rem', color: '#60a5fa' }}>{student.academicProfile?.cgpa ?? student.overallGpa ?? '—'}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Backlogs</div>
                      <strong style={{ fontSize: '1.05rem', color: '#ef4444' }}>{student.academicProfile?.backlogs ?? 0}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Status</div>
                      <strong style={{ fontSize: '1.05rem', color: '#10b981' }}>{student.academicProfile?.academicStatus || '—'}</strong>
                    </div>
                  </div>
                </div>

                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>SSC Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <span>School: <strong>{student.personalDetails?.ssc?.schoolName || '—'}</strong></span>
                  <span>Board: <strong>{student.personalDetails?.ssc?.board || '—'}</strong></span>
                  <span>CGPA: <strong>{student.personalDetails?.ssc?.percentage ?? '—'}</strong></span>
                  <span>Year: <strong>{student.personalDetails?.ssc?.passoutYear || '—'}</strong></span>
                </div>

                <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Intermediate / Diploma Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <span>College: <strong>{student.personalDetails?.intermediate?.collegeName || '—'}</strong></span>
                  <span>Board: <strong>{student.personalDetails?.intermediate?.board || '—'}</strong></span>
                  <span>CGPA: <strong>{student.personalDetails?.intermediate?.percentage ?? '—'}</strong></span>
                  <span>Year: <strong>{student.personalDetails?.intermediate?.passoutYear || '—'}</strong></span>
                </div>

                {student.education && student.education.length > 0 && (
                  <>
                    <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>Other Higher Education</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {student.education.map((edu, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <div><strong>{edu.degree} {edu.branch && `in ${edu.branch}`}</strong></div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{edu.institution} | CGPA: {edu.cgpa || '—'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{edu.startYear} - {edu.endYear}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Mentor Details */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>Mentor Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>College Mentor</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <strong>{student.collegeMentor?.name || '—'}</strong>
                      <span style={{ color: '#60a5fa' }}>{student.collegeMentor?.mobileNumber || '—'}</span>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Mentor</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <strong>{student.academicMentor?.name || '—'}</strong>
                      <span style={{ color: '#60a5fa' }}>{student.academicMentor?.mobileNumber || '—'}</span>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coding Mentor</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <strong>{student.codingMentor?.name || '—'}</strong>
                      <span style={{ color: '#60a5fa' }}>{student.codingMentor?.mobileNumber || '—'}</span>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Communication Skills Mentor</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <strong>{student.communicationMentor?.name || '—'}</strong>
                      <span style={{ color: '#60a5fa' }}>{student.communicationMentor?.mobileNumber || '—'}</span>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Project Mentor</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <strong>{student.projectMentor?.name || '—'}</strong>
                      <span style={{ color: '#60a5fa' }}>{student.projectMentor?.mobileNumber || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MANDATORY ACCOMPLISHMENTS TAB */}
        {activeTab === 'mandatory' && (
          <div className="tab-panel">
            <div className="ct-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>Mandatory Accomplishments</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Raw Evidence & Detailed Scoring.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                    {student.mandatoryAccomplishments?.calculatedScores?.total || 0}
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}> / 70</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>Total Score</div>
                </div>
              </div>

              <div className="overview-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                
                {/* 1. Academic CGPA */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #6366f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#6366f1' }}>1. Academic CGPA (Auto-synced)</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.cgpa || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0' }}>Overall CGPA</td>
                        <td>{student.overallGpa || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Technical Courses */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#3b82f6' }}>2. Technical Courses</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.technicalCourses || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Course Name</th>
                        <th>Platform</th>
                        <th>Status</th>
                        <th>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.mandatoryAccomplishments?.technicalCourses || []).length > 0 ? (
                        student.mandatoryAccomplishments.technicalCourses.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem 0' }}>{c.courseName}</td>
                            <td>{c.platform}</td>
                            <td>{c.status}</td>
                            <td>{c.certificateLink ? <a href={c.certificateLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Link ↗</a> : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>No courses added.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Coding Consistency */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#f59e0b' }}>3. Coding Consistency (Auto-synced)</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.codingConsistency || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0' }}>Arrays Solved (LeetCode)</td>
                        <td>{student.mandatoryAccomplishments?.codingConsistency?.arraysSolved || 0}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0' }}>Strings Solved (LeetCode)</td>
                        <td>{student.mandatoryAccomplishments?.codingConsistency?.stringsSolved || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Technical Projects */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #8b5cf6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#8b5cf6' }}>4. Technical Projects</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.projects || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Project Name</th>
                        <th>GitHub</th>
                        <th>Live Link</th>
                        <th>Demo/Doc Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.mandatoryAccomplishments?.projects || []).length > 0 ? (
                        student.mandatoryAccomplishments.projects.map((p, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem 0' }}>{p.projectName}</td>
                            <td>{p.githubLink ? <a href={p.githubLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Link ↗</a> : '-'}</td>
                            <td>{p.liveLink ? <a href={p.liveLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-green)' }}>Link ↗</a> : '-'}</td>
                            <td>{p.driveLink ? <a href={p.driveLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-purple)' }}>Link ↗</a> : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>No projects added.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. Contest Performance */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #ec4899' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#ec4899' }}>5. Contest Performance (Auto-synced)</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.contestPerformance || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Platform</th>
                        <th>Max Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0' }}>LeetCode</td>
                        <td>{student.mandatoryAccomplishments?.contestPerformance?.leetcodeRating || 0}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0' }}>CodeChef</td>
                        <td>{student.mandatoryAccomplishments?.contestPerformance?.codechefRating || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. Technical Hackathons */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #14b8a6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#14b8a6' }}>6. Technical Hackathons</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.hackathons || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Hackathon Name</th>
                        <th>Position</th>
                        <th>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.mandatoryAccomplishments?.hackathons || []).length > 0 ? (
                        student.mandatoryAccomplishments.hackathons.map((h, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem 0' }}>{h.hackathonName}</td>
                            <td>{h.position}</td>
                            <td>{h.certificateLink ? <a href={h.certificateLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Link ↗</a> : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>No hackathons added.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 7. Personality Dev */}
                <div className="ct-card" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #eab308' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#eab308' }}>7. Personality Development Activities</h4>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{student.mandatoryAccomplishments?.calculatedScores?.personalityDevelopment || 0} / 10</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0' }}>Activity / Event</th>
                        <th>Proof Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.mandatoryAccomplishments?.personalityActivities || []).length > 0 ? (
                        student.mandatoryAccomplishments.personalityActivities.map((a, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem 0' }}>{a.activityName}</td>
                            <td>{a.certificateLink ? <a href={a.certificateLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Link ↗</a> : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>No activities added.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PLATFORMS TAB */}
        {activeTab === 'platforms' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
            
            {/* LeetCode */}
            <div className="ct-card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <h4 style={{ color: '#F59E0B', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/LeetCode_logo_black.png" alt="LeetCode" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }} />
                LeetCode
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span>Username: {student.leetcodeUsername ? (
                  <a href={`https://leetcode.com/${student.leetcodeUsername}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                    <strong>{student.leetcodeUsername}</strong>
                  </a>
                ) : (
                  <strong>Not connected</strong>
                )}</span>
                <span>Solved: <strong>{lc.problemsSolved || 0}</strong></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Easy: {lc.easySolved || 0} | Med: {lc.mediumSolved || 0} | Hard: {lc.hardSolved || 0}</span>
                <span>Rating: <strong>{Math.round(lc.rating || 0)}</strong></span>
                <span>Contest participation: <strong>{lc.contestCount || 0}</strong></span>
              </div>
            </div>
 
            {/* CodeChef */}
            <div className="ct-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h4 style={{ color: '#ef4444', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/codechef.svg" alt="CodeChef" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }} />
                CodeChef
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span>Username: {student.codechefUsername ? (
                  <a href={`https://www.codechef.com/users/${student.codechefUsername}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                    <strong>{student.codechefUsername}</strong>
                  </a>
                ) : (
                  <strong>Not connected</strong>
                )}</span>
                <span>Rating: <strong>{cc.rating || 0}</strong> ({cc.stars || '1★'})</span>
                <span>Max Rating: <strong>{cc.highestRating || 0}</strong></span>
                <span>Contest participation: <strong>{cc.contestCount || 0}</strong></span>
                <span>Solved: <strong>{cc.problemsSolved || 0}</strong></span>
              </div>
            </div>
 
            {/* GeeksforGeeks */}
            <div className="ct-card" style={{ borderLeft: '4px solid #22C55E' }}>
              <h4 style={{ color: '#22C55E', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/gfg.svg" alt="GeeksforGeeks" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }} />
                GeeksforGeeks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span>Username: {student.gfgUsername ? (
                  <a href={`https://www.geeksforgeeks.org/user/${student.gfgUsername}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                    <strong>{student.gfgUsername}</strong>
                  </a>
                ) : (
                  <strong>Not connected</strong>
                )}</span>
                <span>Problems solved: <strong>{gfg.problemsSolved || 0}</strong></span>
                <span>Reputation score: <strong>{gfg.codingScore || 0}</strong></span>
                <span>Global rank: <strong>#{gfg.globalRank || '-'}</strong></span>
                <span>Streak: <strong>{gfg.streak || 0} days</strong></span>
              </div>
            </div>
 
            {/* HackerRank */}
            <div className="ct-card" style={{ borderLeft: '4px solid #00EA64' }}>
              <h4 style={{ color: '#00EA64', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/HackerRank.svg" alt="HackerRank" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }} />
                HackerRank
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span>Username: {(student.hackerrankUsername || student.codingProfile?.hackerrank?.username) ? (
                  <a href={`https://www.hackerrank.com/profile/${student.hackerrankUsername || student.codingProfile?.hackerrank?.username}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                    <strong>{student.hackerrankUsername || student.codingProfile?.hackerrank?.username}</strong>
                  </a>
                ) : (
                  <strong>Not connected</strong>
                )}</span>
                <span>Problem Solving Solved: <strong>{student.codingProfile?.hackerrank?.problemSolving?.solved || student.hackerrank?.totalProblemsSolved || 0}</strong></span>
                <span>Stars: <strong className="ct-star-active">{'★'.repeat(student.codingProfile?.hackerrank?.problemSolving?.stars || student.hackerrank?.stars || 0)}</strong></span>
                <span>SQL Solved: <strong>{student.codingProfile?.hackerrank?.sql?.solved || 0}</strong></span>
                <span>Python Solved: <strong>{student.codingProfile?.hackerrank?.python?.solved || 0}</strong></span>
              </div>
            </div>
 
            {/* GitHub */}
            <div className="ct-card" style={{ borderLeft: '4px solid #8B5CF6', gridColumn: 'span 2' }}>
              <h4 style={{ color: '#8B5CF6', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={20} />
                GitHub Analytics: {student.githubUsername ? (
                  <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                    @{student.githubUsername}
                  </a>
                ) : (
                  '@Not connected'
                )}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.8rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Repositories</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{githubRepos}</h3>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Followers</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{githubFollowers}</h3>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Following</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{githubFollowing}</h3>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Stars</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{githubStars}</h3>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Contributions</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{githubContributions}</h3>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Contribution Days</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{activeContributionDays}</h3>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* HEATMAP TAB */}
        {activeTab === 'heatmap' && (
          <div className="ct-card">
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--accent-blue)" /> Unified Activity Streak Heatmap
            </h3>
            <HeatmapWidget data={heatmap} showDetails={true} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginTop: '0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Less</span>
              <div className="heatmap-cell level-0" style={{ width: 10, height: 10 }} />
              <div className="heatmap-cell level-1" style={{ width: 10, height: 10 }} />
              <div className="heatmap-cell level-2" style={{ width: 10, height: 10 }} />
              <div className="heatmap-cell level-3" style={{ width: 10, height: 10 }} />
              <div className="heatmap-cell level-4" style={{ width: 10, height: 10 }} />
              <span>More</span>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="ct-card">
            <h3 style={{ margin: '0 0 1.2rem 0' }}>Problem Solving Trends</h3>
            {chartData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No platform metrics synced for this student.
              </div>
            ) : (
              <div className="ct-grid-responsive" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
                <div className="ct-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Platform distribution</h4>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="solved"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111827', borderColor: 'rgba(255,255,255,0.08)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="ct-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Total Solved counts</h4>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} />
                        <Tooltip contentStyle={{ background: '#111827', borderColor: 'rgba(255,255,255,0.08)' }} />
                        <Bar dataKey="solved" fill="var(--accent-blue)">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="ct-card">
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-purple)" /> Student Activity Timeline
            </h3>
            {timeline.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No activities recorded for this student yet.
              </div>
            ) : (
              <div className="timeline-feed">
                {timeline.map((act) => {
                  const getPlatformColor = (pf) => {
                    if (pf === 'leetcode') return '#F59E0B';
                    if (pf === 'codechef') return '#ef4444';
                    if (pf === 'geeksforgeeks') return '#22C55E';
                    return '#8B5CF6';
                  };

                  return (
                    <div key={act._id} className="timeline-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="timeline-platform-badge" style={{ color: getPlatformColor(act.platform) }}>
                          {act.platform.toUpperCase()}
                        </span>
                        <span className="timeline-text" style={{ fontSize: '0.85rem' }}>
                          {act.link ? (
                            <a href={act.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f3f4f6', textDecoration: 'underline' }}>
                              {act.title} <ExternalLink size={12} />
                            </a>
                          ) : (
                            act.title
                          )}
                        </span>
                      </div>
                      <span className="timeline-date">{new Date(act.timestamp).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RESUME PREVIEW TAB */}
        {activeTab === 'resume' && (
          <div className="ct-grid-responsive" style={{ gridTemplateColumns: '1fr 2.2fr', minHeight: '520px' }}>
            
            {/* LEFT SIDE: SELECTION AND ANALYTICS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* ANALYTICS SUMMARY CARD */}
              {resumeAnalytics && (
                <div className="ct-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-green)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Resume Analytics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <div>Completeness Score: <strong style={{ color: '#22c55e' }}>{resumeAnalytics.completenessScore}%</strong></div>
                    <div>ATS Score Estimate: <strong style={{ color: '#a855f7' }}>{resumeAnalytics.atsScore}%</strong></div>
                    {resumeAnalytics.missingSections && resumeAnalytics.missingSections.length > 0 && (
                      <div style={{ color: 'var(--accent-red)' }}>
                        ⚠️ Missing: {resumeAnalytics.missingSections.join(', ')}
                      </div>
                    )}
                    {resumeAnalytics.lastUpdated && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Last updated: {new Date(resumeAnalytics.lastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTIVE RESUME CARD */}
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f3f4f6' }}>Active Resume</h4>
                {defaultVer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Title: </span>
                      <strong>{defaultVer.name || defaultVer.originalName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Template / Type: </span>
                      <span className="ct-chip" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', textTransform: 'capitalize' }}>
                        {defaultVer.templateKey ? defaultVer.templateKey.replace('_', ' ') : defaultVer.fileType?.toUpperCase() || 'Uploaded PDF'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Last Updated: </span>
                      <strong>{new Date(defaultVer.updatedAt || defaultVer.uploadedAt).toLocaleDateString()}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No active/default resume set by the student.
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT SIDE: PREVIEW/DOWNLOAD PORTAL */}
            <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flex: 1, minHeight: '420px', background: '#0a0f1d' }}>
              <FileText size={48} color="var(--accent-blue)" style={{ opacity: 0.7 }} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Student PDF Resume</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {defaultVer ? `Active Resume: ${defaultVer.name || defaultVer.originalName}` : 'No active resume set by student.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="ct-button"
                  disabled={!defaultVer}
                  onClick={() => setIsResumePreviewOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem' }}
                >
                  <Eye size={16} /> Preview Resume
                </button>
                <button
                  className="ct-button-secondary"
                  disabled={!defaultVer}
                  onClick={handleDownloadResume}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem' }}
                >
                  <Download size={16} /> Download Resume
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
      {/* COORDINATOR RESUME PREVIEW MODAL */}
      {isResumePreviewOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="ct-card" style={{ maxWidth: '850px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff' }}>
                <FileText size={20} color="var(--accent-blue)" /> Resume PDF Preview
              </h3>
              <button
                onClick={() => setIsResumePreviewOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, background: '#0a0f1d', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingResume && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                  Loading Preview...
                </div>
              )}
              {!loadingResume && !resumeBlobUrl && (
                <span style={{ color: 'var(--text-muted)' }}>Resume preview failed to load.</span>
              )}
              {!loadingResume && resumeBlobUrl && (
                <iframe 
                  title="Student Resume Preview" 
                  src={resumeBlobUrl} 
                  style={{ border: 'none', width: '100%', height: '100%' }} 
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
              <button className="ct-button-secondary" onClick={() => setIsResumePreviewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
