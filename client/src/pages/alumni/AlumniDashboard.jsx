import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AppShell } from '../../components/AppShell';
import { FeedContainer } from '../../components/feed/FeedContainer';
import { CreateAnnouncementModal } from '../../components/feed/CreateAnnouncementModal';
import { api } from '../../api/client';

export function AlumniDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'referrals' | 'messages' | 'funding' | 'profile'
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  // Referrals & Job Postings State
  const [postings, setPostings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);

  // New Referral Post Form
  const [jobForm, setJobForm] = useState({
    title: '',
    company: user?.currentCompany || '',
    role: user?.currentCompanyRole || 'Software Engineer',
    location: 'Remote / Hybrid',
    employmentType: 'Referral Slot',
    salary: '',
    description: '',
    requirements: ''
  });

  // Funding / Crowdfunding State
  const [fundingRequests, setFundingRequests] = useState([]);
  const [pledgeAmounts, setPledgeAmounts] = useState({});

  useEffect(() => {
    fetchMyPostings();
    fetchFundingRequests();
  }, []);

  const fetchMyPostings = async () => {
    try {
      const res = await api.getJson('/v2/jobs');
      if (res.success && res.data) {
        // Filter jobs authored by current user
        const myJobs = (res.data.jobs || []).filter(j => j.author?._id === user?.id || j.author === user?.id);
        setPostings(myJobs);
        if (myJobs.length > 0 && !selectedJob) {
          fetchJobApplicants(myJobs[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load alumni job postings:', err);
    }
  };

  const fetchJobApplicants = async (jobId) => {
    try {
      setLoadingApplicants(true);
      const res = await api.getJson(`/v2/jobs/${jobId}/applications`);
      if (res.success && res.data) {
        setApplicants(res.data);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const fetchFundingRequests = async () => {
    try {
      const res = await api.getJson('/v2/funding');
      if (res.success && res.data) {
        setFundingRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load funding requests:', err);
    }
  };

  const handleCreatePosting = async (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.company || !jobForm.description) return;

    try {
      const res = await api.postJson('/v2/jobs', {
        ...jobForm,
        requirements: jobForm.requirements ? jobForm.requirements.split(',').map(s => s.trim()) : []
      });

      if (res.success) {
        setIsPostingModalOpen(false);
        setJobForm({
          title: '',
          company: user?.currentCompany || '',
          role: user?.currentCompanyRole || 'Software Engineer',
          location: 'Remote / Hybrid',
          employmentType: 'Referral Slot',
          salary: '',
          description: '',
          requirements: ''
        });
        fetchMyPostings();
      }
    } catch (err) {
      console.error('Failed to create referral posting:', err);
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      const res = await api.patchJson(`/v2/jobs/applications/${appId}/status`, { status });
      if (res.success && selectedJob) {
        fetchJobApplicants(selectedJob._id);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePledgeSupport = async (fundingId) => {
    const amount = pledgeAmounts[fundingId];
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      const res = await api.postJson(`/v2/funding/${fundingId}/pledge`, { amount: parseFloat(amount) });
      if (res.success) {
        setPledgeAmounts(prev => ({ ...prev, [fundingId]: '' }));
        fetchFundingRequests();
      }
    } catch (err) {
      console.error('Failed to pledge support:', err);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <AppShell active="alumni-dashboard">
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Welcome Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '20px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
                Welcome back, {user?.name || 'Alumnus'}! 🎓
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600, marginTop: '0.2rem' }}>
                {user?.currentCompanyRole || 'Software Engineer'} {user?.currentCompany ? `at ${user.currentCompany}` : ''} • {user?.college || 'CBIT'} ({user?.batch ? `Batch ${user.batch}` : 'Alumni'})
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsPostingModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '0.65rem 1.4rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
            }}
          >
            💼 Post New Referral Slot
          </button>
        </div>

        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '14px', padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Active Referral Postings</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>{postings.length}</div>
          </div>

          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '14px', padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Student Applicants</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{applicants.length}</div>
          </div>

          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '14px', padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Active Innovation Grants</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.2rem' }}>{fundingRequests.length}</div>
          </div>

          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '14px', padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Direct Mentorship Chats</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>Active</div>
          </div>
        </div>

        {/* Dashboard Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border, #334155)',
          paddingBottom: '0.75rem',
          overflowX: 'auto'
        }}>
          {[
            { key: 'feed', label: '🌟 Community Feed', path: null },
            { key: 'referrals', label: '💼 My Referrals & Applicants', path: null },
            { key: 'funding', label: '🚀 Student Innovation Grants', path: null },
            { key: 'events', label: '📅 Schedule Events & Hackathons', path: '/events' },
            { key: 'forums', label: '💡 Discussion Forum & Q&A', path: '/forums' },
            { key: 'resources', label: '📚 Useful Resources', path: '/resources' },
            { key: 'experiences', label: '📝 Interview Experiences', path: '/interview-experiences' },
            { key: 'students', label: '🎓 Student Contacts', path: '/students-directory' },
            { key: 'coordinators', label: '👔 Coordinator Contacts', path: '/coordinators-directory' },
            { key: 'messages', label: '💬 Messages & Mentorship', path: '/messages' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.path) {
                  navigate(tab.path);
                } else {
                  setActiveTab(tab.key);
                }
              }}
              style={{
                background: activeTab === tab.key ? '#3b82f6' : 'var(--bg-card, #1e293b)',
                color: activeTab === tab.key ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '999px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: COMMUNITY FEED */}
        {activeTab === 'feed' && (
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <FeedContainer
              key={feedRefreshKey}
              user={user}
              onOpenCreateModal={() => setIsFeedModalOpen(true)}
            />
            <CreateAnnouncementModal
              isOpen={isFeedModalOpen}
              onClose={() => setIsFeedModalOpen(false)}
              onSuccess={() => setFeedRefreshKey(k => k + 1)}
            />
          </div>
        )}

        {/* TAB 2: MY REFERRALS & APPLICANTS WITH LIVE CODING STATS */}
        {activeTab === 'referrals' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Job Postings List */}
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  My Posted Referral Slots
                </h3>
                <button onClick={() => setIsPostingModalOpen(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                  + Post Slot
                </button>
              </div>

              {postings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No referral slots posted yet. Click "+ Post Slot" to add one!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {postings.map(job => (
                    <div
                      key={job._id}
                      onClick={() => { setSelectedJob(job); fetchJobApplicants(job._id); }}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: selectedJob?._id === job._id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary, #0f172a)',
                        border: selectedJob?._id === job._id ? '1px solid #3b82f6' : '1px solid var(--border, #334155)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{job.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>{job.company} • {job.role}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {job.applicantCount || 0} Student Applicants
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Applicants Table & Live CodeTrack Stats */}
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '16px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                📋 Student Applicants for {selectedJob?.title || 'Selected Referral'}
              </h3>

              {loadingApplicants ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading applicant live metrics...</div>
              ) : applicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                  No applicants received yet for this referral posting.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {applicants.map(app => {
                    const snap = app.codingMetricsSnapshot || {};
                    const applicantUser = app.applicant || {};

                    return (
                      <div
                        key={app._id}
                        style={{
                          background: 'var(--bg-secondary, #0f172a)',
                          border: '1px solid var(--border, #334155)',
                          borderRadius: '12px',
                          padding: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
                              {applicantUser.name || 'Student Applicant'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              {applicantUser.branch || 'CSE'} ({applicantUser.currentYear || '4th Year'}) • GPA: {snap.gpa || applicantUser.overallGpa || 'N/A'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: app.status === 'referred' ? 'rgba(16, 185, 129, 0.2)' : app.status === 'shortlisted' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                              color: app.status === 'referred' ? '#10b981' : app.status === 'shortlisted' ? '#60a5fa' : '#94a3b8'
                            }}>
                              Status: {app.status.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Live CodeTrack Metrics Banner */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                          gap: '0.5rem',
                          margin: '0.85rem 0',
                          background: 'rgba(30, 41, 59, 0.8)',
                          padding: '0.65rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #334155)'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>LeetCode Solved</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>⚡ {snap.leetcodeSolved || 0}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>LC Contest Rating</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6' }}>📈 {snap.leetcodeRating || 0}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>CodeChef Rating</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>⭐ {snap.codechefRating || 0}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>CodeTrack Score</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#c084fc' }}>🏆 {snap.totalScore || 0}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {app.resumeUrl && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#3b82f6',
                                color: '#fff',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              📄 View Resume PDF
                            </a>
                          )}

                          <button
                            onClick={() => handleUpdateStatus(app._id, 'referred')}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            ✅ Refer Student
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(app._id, 'shortlisted')}
                            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            ⭐ Shortlist
                          </button>

                          <button
                            onClick={() => navigate(`/messages?recipientId=${applicantUser._id}&name=${encodeURIComponent(applicantUser.name || 'Student')}`)}
                            style={{ background: 'var(--bg-card, #1e293b)', color: '#60a5fa', border: '1px solid #3b82f6', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            💬 Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT INNOVATION GRANTS & CROWDFUNDING */}
        {activeTab === 'funding' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                🚀 Student Project Innovation Grants & Crowdfunding
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Sponsor innovative student projects, IoT hardware prototypes, hackathons, and research initiatives.
              </p>
            </div>

            {fundingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', color: '#94a3b8' }}>
                No active student funding requests at the moment.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {fundingRequests.map(req => {
                  const percent = Math.min(100, Math.round((req.raisedAmount / req.targetAmount) * 100));

                  return (
                    <div
                      key={req._id}
                      style={{
                        background: 'var(--bg-card, #1e293b)',
                        border: '1px solid var(--border, #334155)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {req.category}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: req.status === 'funded' ? '#10b981' : '#3b82f6', fontWeight: 700 }}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                          {req.title}
                        </h3>

                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                          By {req.student?.name || 'Student'} ({req.student?.branch || 'CSE'})
                        </div>

                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                          {req.description}
                        </p>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                            <span style={{ color: '#10b981' }}>Raised: ₹{req.raisedAmount || 0}</span>
                            <span style={{ color: '#94a3b8' }}>Goal: ₹{req.targetAmount} ({percent}%)</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--bg-secondary, #0f172a)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: '999px' }} />
                          </div>
                        </div>
                      </div>

                      {/* Pledge Action Form */}
                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
                        <input
                          type="number"
                          placeholder="Amount ₹"
                          value={pledgeAmounts[req._id] || ''}
                          onChange={(e) => setPledgeAmounts({ ...pledgeAmounts, [req._id]: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '0.4rem 0.65rem',
                            background: 'var(--bg-secondary, #0f172a)',
                            border: '1px solid var(--border, #334155)',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handlePledgeSupport(req._id)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          💸 Pledge
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* POST REFERRAL SLOT MODAL */}
        {isPostingModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}>
            <div style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>💼 Post New Referral Slot</h3>
                <button onClick={() => setIsPostingModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleCreatePosting} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer II / Frontend Intern"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Company</label>
                    <input
                      type="text"
                      required
                      value={jobForm.company}
                      onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Role</label>
                    <input
                      type="text"
                      required
                      value={jobForm.role}
                      onChange={(e) => setJobForm({ ...jobForm, role: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Description & Referral Instructions</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe the role, referral requirements, and criteria..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsPostingModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.55rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Publish Referral Slot</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
