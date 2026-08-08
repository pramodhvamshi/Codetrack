import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AppShell } from '../components/AppShell';
import { jobApi } from '../api/jobApi';
import { JobReferralCard } from '../components/jobs/JobReferralCard';
import { JobApplyModal } from '../components/jobs/JobApplyModal';
import { CreateJobModal } from '../components/jobs/CreateJobModal';

export function JobPortalPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [activeTab, setActiveTab] = useState('all-jobs'); // 'all-jobs' | 'my-applications'

  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [myApplications, setMyApplications] = useState([]);

  const isStudent = user?.role === 'student';
  const isAlumniOrAdmin = user && (user.role === 'alumni' || user.role === 'admin' || user.role === 'coordinator');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobApi.getJobs(1, filterType, keyword, location);
      if (res.success && res.data) {
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await jobApi.getMyApplications();
      if (res.success) {
        setMyApplications(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'all-jobs') {
      fetchJobs();
    } else if (activeTab === 'my-applications') {
      fetchMyApplications();
    }
  }, [filterType, activeTab]);

  return (
    <AppShell active="jobs">
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              💼 Jobs & Referral Portal
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Explore career opportunities, internships, and alumni referrals
            </p>
          </div>

          {isAlumniOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '0.6rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              ➕ Post Job / Referral
            </button>
          )}
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('all-jobs')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'all-jobs' ? '#3b82f6' : 'var(--bg-card, #1e293b)',
              color: activeTab === 'all-jobs' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🏢 Explore Jobs
          </button>
          {isStudent && (
            <button
              onClick={() => setActiveTab('my-applications')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'my-applications' ? '#3b82f6' : 'var(--bg-card, #1e293b)',
                color: activeTab === 'my-applications' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              📄 My Applications ({myApplications.length})
            </button>
          )}
        </div>

        {/* Search & Filters */}
        {activeTab === 'all-jobs' && (
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search title, company, skills..."
              style={{
                padding: '0.55rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Filter by location..."
              style={{
                padding: '0.55rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '0.55rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="all">All Employment Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internships</option>
              <option value="Referral">Alumni Referrals</option>
              <option value="Part-Time">Part-Time</option>
            </select>

            <button
              onClick={fetchJobs}
              style={{
                padding: '0.55rem 1rem',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Search Jobs
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === 'all-jobs' ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #94a3b8)' }}>
                Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'var(--bg-card, #1e293b)',
                borderRadius: '16px',
                border: '1px solid var(--border, #334155)'
              }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>💼</span>
                <h3 style={{ margin: 0, color: 'var(--text-primary, #f8fafc)' }}>No Job Listings Found</h3>
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
                  Try adjusting your search filters or check back soon for new referral posts.
                </p>
              </div>
            ) : (
              jobs.map(job => (
                <JobReferralCard
                  key={job._id}
                  job={job}
                  isStudent={isStudent}
                  onApply={(j) => setSelectedJobForApply(j)}
                />
              ))
            )}
          </div>
        ) : (
          <div>
            {myApplications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'var(--bg-card, #1e293b)',
                borderRadius: '16px',
                border: '1px solid var(--border, #334155)'
              }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
                <h3 style={{ margin: 0, color: 'var(--text-primary, #f8fafc)' }}>No Applications Submitted Yet</h3>
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
                  Explore the job portal and use 1-click apply to track your referrals here.
                </p>
              </div>
            ) : (
              myApplications.map(app => (
                <div
                  key={app._id}
                  style={{
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary, #f8fafc)' }}>
                      {app.job?.title || 'Job Position'}
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {app.job?.company} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '999px',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}>
                    {app.status?.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modals */}
        <JobApplyModal
          isOpen={!!selectedJobForApply}
          job={selectedJobForApply}
          user={user}
          onClose={() => setSelectedJobForApply(null)}
          onSuccess={() => {
            fetchJobs();
            fetchMyApplications();
          }}
        />

        <CreateJobModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchJobs}
        />
      </div>
    </AppShell>
  );
}
