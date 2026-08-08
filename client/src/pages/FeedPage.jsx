import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppShell } from '../components/AppShell';
import { FeedContainer } from '../components/feed/FeedContainer';
import { CreateAnnouncementModal } from '../components/feed/CreateAnnouncementModal';
import { alumniApi } from '../api/alumniApi';

export function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [topAlumni, setTopAlumni] = useState([]);

  useEffect(() => {
    alumniApi.searchAlumni(1, '', '', '', '', '').then(res => {
      if (res.success && res.data) {
        setTopAlumni((res.data.alumni || []).slice(0, 5));
      }
    }).catch(console.error);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <AppShell active="feed">
      <div style={{
        width: '100%',
        padding: '1.25rem 2.5rem',
        boxSizing: 'border-box',
        position: 'relative',
        minHeight: 'calc(100vh - 70px)'
      }}>
        {/* LEFT SIDEBAR: FIXED POSITION (STAYS 100% STATIC ON PAGE) */}
        <div style={{
          position: 'fixed',
          top: '85px',
          left: '2.5rem',
          width: '300px',
          maxHeight: 'calc(100vh - 105px)',
          overflowY: 'auto',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            {/* Cover Banner */}
            <div style={{
              height: '72px',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #8b5cf6)'
            }} />

            {/* User Avatar & Info */}
            <div style={{ padding: '0 1.25rem 1.25rem', marginTop: '-36px', textAlign: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.4rem',
                margin: '0 auto 0.75rem',
                border: '4px solid var(--bg-card, #1e293b)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
              }}>
                {initials}
              </div>

              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
                {user?.name || 'Community Member'}
              </h3>
              
              <div style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 700, textTransform: 'capitalize', marginBottom: '0.45rem' }}>
                {user?.role || 'Student'} {user?.college ? `• ${user.college}` : ''}
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                {user?.branch || 'Computer Science'} {user?.currentYear ? `(${user.currentYear})` : ''}
              </p>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div style={{ borderTop: '1px solid var(--border, #334155)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.2rem 0.5rem 0.4rem 0.5rem' }}>
                🎓 Alumni Hub & Shortcuts
              </div>
              {[
                { label: '💼 Jobs & Referral Slots', path: '/jobs' },
                { label: '💬 Messages & Direct Chat', path: '/messages' },
                { label: '📅 Events & Hackathons', path: '/events' },
                { label: '💡 Discussion Forum & Q&A', path: '/forums' },
                { label: '📚 Resource Library', path: '/resources' },
                { label: '📝 Interview Experiences', path: '/interview-experiences' },
                { label: '🎓 Student Directory & Contacts', path: '/students-directory' },
                { label: '👔 Coordinator Directory', path: '/coordinators-directory' },
                { label: '👥 Alumni Interest Clubs', path: '/groups' },
                { label: '👥 Alumni Network', path: '/alumni' },
                { label: '🏆 Leaderboard', path: '/leaderboard' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    color: 'var(--text-secondary, #cbd5e1)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; e.currentTarget.style.color = '#3b82f6'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary, #cbd5e1)'; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: MAIN SCROLLABLE FEED STREAM */}
        <div style={{
          marginLeft: '325px',
          marginRight: '375px',
          width: 'calc(100% - 700px)'
        }}>
          <FeedContainer
            key={refreshKey}
            user={user}
            onOpenCreateModal={() => setIsModalOpen(true)}
          />

          <CreateAnnouncementModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => setRefreshKey(k => k + 1)}
          />
        </div>

        {/* RIGHT SIDEBAR: FIXED POSITION (STAYS 100% STATIC ON PAGE) */}
        <div style={{
          position: 'fixed',
          top: '85px',
          right: '2.5rem',
          width: '350px',
          maxHeight: 'calc(100vh - 105px)',
          overflowY: 'auto',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* HackerRank & Drive Widget */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>💼</span> Campus Placement Drives
            </div>
            <p style={{ margin: '0 0 0.95rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45 }}>
              Track upcoming recruitment drives, OA practice contest links on HackerRank, and interview round feedback!
            </p>
            <button
              onClick={() => navigate('/jobs')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              View Active Placement Drives →
            </button>
          </div>

          {/* Quick Alumni Connects Widget */}
          {topAlumni.length > 0 && (
            <div style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
            }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🤝 Alumni Connects</span>
                <button onClick={() => navigate('/alumni')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {topAlumni.map(person => (
                  <div key={person._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}>
                        {person.name ? person.name.slice(0, 2).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {person.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {person.currentCompany || 'Alumni'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/messages?recipientId=${person._id}&name=${encodeURIComponent(person.name)}`)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      💬 Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
