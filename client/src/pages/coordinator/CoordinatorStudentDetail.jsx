import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { 
  Trophy, Award, Code, Activity, Calendar, FileText, 
  ExternalLink, Download, ArrowLeft, RefreshCw
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
  const [studentResumes, setStudentResumes] = useState({ generated: [], uploaded: [] });
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumeAnalytics, setResumeAnalytics] = useState(null);

  const backendBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

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

  // Securely load PDF Resume blob url for selected resume
  const loadResumeBlob = async (resumeId) => {
    if (!token || !id) return;
    setLoadingResume(true);
    try {
      const urlPath = resumeId 
        ? `${backendBase}/coordinator/students/${id}/resumes/${resumeId}/download`
        : `${backendBase}/coordinator/students/${id}/resume`;

      const res = await fetch(urlPath, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Resume unavailable');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResumeBlobUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });
    } catch (err) {
      console.error('Failed to fetch resume blob:', err);
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
    return [
      { name: 'LeetCode', solved: stats.leetcode?.problemsSolved || 0 },
      { name: 'CodeChef', solved: stats.codechef?.problemsSolved || 0 },
      { name: 'GFG', solved: stats.geeksforgeeks?.problemsSolved || 0 }
    ].filter(d => d.solved > 0);
  }, [student]);

  const defaultVer = useMemo(() => {
    return (studentResumes.generated || []).find(v => v.isDefault) || (studentResumes.uploaded || []).find(u => u.isDefault);
  }, [studentResumes]);

  const COLORS = ['#F59E0B', '#ef4444', '#22C55E'];

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


  const handleDownloadResume = () => {
    if (!resumeBlobUrl) return;
    const a = document.createElement('a');
    a.href = resumeBlobUrl;
    a.download = `resume-${student.name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="ct-chip" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              Weighted Score: <strong>{Math.round(scores.weightedRankScore || 0)}</strong>
            </span>
            <span className="ct-chip" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              Total Solved: <strong>{(lc.problemsSolved || 0) + (cc.problemsSolved || 0) + (gfg.problemsSolved || 0)}</strong>
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
            
            {/* Academic details */}
            <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>Academic Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                <span>🏛️ College: <strong>{student.college || '—'}</strong></span>
                <span>🏨 Hostel / Locality: <strong>{student.hostel || '—'}</strong></span>
                <span>💻 Branch: <strong>{student.branch || '—'}</strong></span>
                <span>📅 Academic Year: <strong>Year {student.year || '—'}</strong></span>
                <span>📈 Overall GPA: <strong>{student.overallGpa || '—'}</strong></span>
                {student.linkedinUrl && (
                  <span>🔗 LinkedIn: <a href={student.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>View Profile <ExternalLink size={12} style={{ display: 'inline' }} /></a></span>
                )}
              </div>
            </div>

            {/* Certifications & Hackathons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>Verified Certifications</h4>
                {student.certifications && student.certifications.length > 0 ? (
                  student.certifications.map((c, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <strong>{c.title}</strong> — {c.issuer}
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No certifications uploaded.</span>
                )}
              </div>

              <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>Hackathon participations</h4>
                {student.hackathons && student.hackathons.length > 0 ? (
                  student.hackathons.map((h, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <strong>{h.name}</strong> ({h.mode}) · Role: {h.role || 'Participant'} ({h.outcome || 'Finalist'})
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hackathon events registered.</span>
                )}
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
                <span>Username: <strong>{student.leetcodeUsername || 'Not connected'}</strong></span>
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
                <span>Username: <strong>{student.codechefUsername || 'Not connected'}</strong></span>
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
                <span>Username: <strong>{student.gfgUsername || 'Not connected'}</strong></span>
                <span>Problems solved: <strong>{gfg.problemsSolved || 0}</strong></span>
                <span>Reputation score: <strong>{gfg.codingScore || 0}</strong></span>
                <span>Global rank: <strong>#{gfg.globalRank || '-'}</strong></span>
                <span>Streak: <strong>{gfg.streak || 0} days</strong></span>
              </div>
            </div>

            {/* GitHub */}
            <div className="ct-card" style={{ borderLeft: '4px solid #8B5CF6', gridColumn: 'span 2' }}>
              <h4 style={{ color: '#8B5CF6', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={20} />
                GitHub Analytics: @{student.githubUsername || 'Not connected'}
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

            {/* RIGHT SIDE: RESUME PDF IFRAME PREVIEW */}
            <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <FileText size={18} color="var(--accent-blue)" /> Secured PDF Resume Preview
                </h3>
                <button 
                  className="ct-button" 
                  onClick={handleDownloadResume}
                  disabled={!resumeBlobUrl}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>

              <div style={{ flex: 1, background: '#0a0f1d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {loadingResume && (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Generating PDF...
                  </div>
                )}
                {!loadingResume && !resumeBlobUrl && (
                  <span style={{ color: 'var(--text-muted)' }}>No active resume available for this student.</span>
                )}
                {!loadingResume && resumeBlobUrl && (
                  <iframe 
                    title="Student Resume Preview" 
                    src={resumeBlobUrl} 
                    style={{ border: 'none', width: '100%', height: '100%' }} 
                  />
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
