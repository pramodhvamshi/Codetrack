import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { alumniApi } from '../api/alumniApi';

export function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await alumniApi.getPublicProfile(id);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.message || 'Profile not found');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Profile not found');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted, #94a3b8)' }}>
          Loading profile...
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
          <h2 style={{ color: '#ef4444', margin: 0 }}>User Profile Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            style={{ marginTop: '1.25rem', padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            ← Go Back
          </button>
        </div>
      </AppShell>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const social = profile.socialLinks || {};
  const scores = profile.scores || {};

  return (
    <AppShell>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Profile Card Header */}
        <div style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '20px',
          padding: '2rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Banner Graphic */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(135deg, #1e3a8a, #4c1d95, #0f172a)'
          }} />

          {/* User Meta Row */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', gap: '1.25rem', marginTop: '40px', flexWrap: 'wrap' }}>
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '2rem',
              border: '4px solid var(--bg-card, #1e293b)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              flexShrink: 0
            }}>
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
                  {profile.name}
                </h1>
                <span style={{
                  background: profile.role === 'alumni' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: profile.role === 'alumni' ? '#ec4899' : '#3b82f6',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {profile.role || 'Student'}
                </span>
              </div>

              <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary, #cbd5e1)', marginTop: '0.2rem', fontWeight: 600 }}>
                {profile.currentCompanyRole ? `${profile.currentCompanyRole} at ${profile.currentCompany || 'Tech'}` : `${profile.branch || 'CSE'} Student`}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>🏫 {profile.college || 'CBIT'}</span>
                {profile.batch && <span>🎓 Batch {profile.batch}</span>}
                {profile.location && <span>📍 {profile.location}</span>}
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(social.linkedin || social.github || social.leetcode || social.codechef) && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border, #334155)', flexWrap: 'wrap' }}>
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-secondary, #0f172a)', color: '#3b82f6', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border, #334155)' }}>
                  🔗 LinkedIn Profile
                </a>
              )}
              {social.github && (
                <a href={social.github} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-secondary, #0f172a)', color: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border, #334155)' }}>
                  💻 GitHub Profile
                </a>
              )}
              {social.leetcode && (
                <a href={`https://leetcode.com/u/${social.leetcode}`} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-secondary, #0f172a)', color: '#f59e0b', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border, #334155)' }}>
                  ⚡ LeetCode
                </a>
              )}
            </div>
          )}
        </div>

        {/* Competitive Stats (if student or available) */}
        {scores && (scores.leetcodeSolved > 0 || scores.codechefRating > 0) && (
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-primary, #f8fafc)' }}>
              ⚡ Competitive Coding Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary, #0f172a)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{scores.leetcodeSolved || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>LeetCode Solved</div>
              </div>

              <div style={{ background: 'var(--bg-secondary, #0f172a)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ec4899' }}>{scores.codechefRating || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>CodeChef Rating</div>
              </div>

              <div style={{ background: 'var(--bg-secondary, #0f172a)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{scores.overallScore || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>Competitive Index</div>
              </div>
            </div>
          </div>
        )}

        {/* Projects / Work Experience */}
        {profile.projects && profile.projects.length > 0 && (
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-primary, #f8fafc)' }}>
              🚀 Showcase & Key Projects
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {profile.projects.map((proj, idx) => (
                <div key={idx} style={{ background: 'var(--bg-secondary, #0f172a)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border, #334155)' }}>
                  <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-primary, #f8fafc)', fontSize: '0.95rem' }}>{proj.title}</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', lineHeight: 1.5 }}>{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
