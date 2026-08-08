import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, API_BASE_URL } from '../api/client';
import { ModeToggle } from './ModeToggle';
import { NotificationDrawer } from './layout/NotificationDrawer';
import { GlobalSearchBar } from './layout/GlobalSearchBar';

export function AppShell({ active, children }) {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alumniDropdownOpen, setAlumniDropdownOpen] = useState(false);
  const [prepHubOpen, setPrepHubOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const alumniDropdownRef = useRef(null);
  const prepHubRef = useRef(null);
  const servicesRef = useRef(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setAlumniDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleRevertImpersonation = async () => {
    try {
      const data = await api.postJson(`/admin/revert-impersonate`, {}, token);
      sessionStorage.setItem("impersonationActive", "false");
      login(data.token, data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Failed to revert impersonation:', err);
      alert('Failed to return to admin session.');
    }
  };

  const isStudent = user && user.role === 'student';
  const isCoordinator = user && user.role === 'coordinator';
  const isAdmin = user && user.role === 'admin';
  const isAlumni = user && user.role === 'alumni';
  const isImpersonating = user?.isImpersonating || sessionStorage.getItem("impersonationActive") === "true";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (alumniDropdownRef.current && !alumniDropdownRef.current.contains(e.target)) {
        setAlumniDropdownOpen(false);
      }
      if (prepHubRef.current && !prepHubRef.current.contains(e.target)) {
        setPrepHubOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItem = (label, path, key) => (
    <button
      key={key}
      type="button"
      onClick={() => navigate(path)}
      className="ct-nav-item"
      data-active={active === key || (key === 'student-interview' && active === 'interview') ? 'true' : 'false'}
    >
      {label}
    </button>
  );

  // Check if current active page belongs to Prep Hub
  const isPrepHubActive = ['roadmaps', 'dsa', 'student-interview', 'interview', 'student-resume', 'resume'].includes(active);

  // Avatar initials
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const dropdownItems = isStudent
    ? [
        { icon: '⚡', label: 'Dashboard', path: '/student/dashboard' },
        { icon: '🎯', label: 'Mock Interviews & Tests', path: '/student/interview' },
        { icon: '👤', label: 'My Profile', path: '/student/profile' },
        { icon: '📄', label: 'Resume Builder', path: '/student/resume' },
        { icon: '🛣️', label: 'Roadmaps', path: '/roadmaps' },
        { icon: '🧠', label: 'DSA Tracker', path: '/dsa' },
        { icon: '🎤', label: 'Mock Interviews', path: '/student/interview' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
        { icon: '⚙️', label: 'Profile Settings', path: '/profile/personal' },
        { icon: '🐛', label: 'Report a Bug', path: '/report-bug' }
      ]
    : isAlumni
    ? [
        { icon: '⚡', label: 'Alumni Dashboard', path: '/alumni/dashboard' },
        { icon: '🌟', label: 'Community Feed', path: '/feed' },
        { icon: '👥', label: 'Alumni Directory', path: '/alumni' },
        { icon: '💬', label: 'Messages', path: '/messages' },
        { icon: '💼', label: 'Job Portal', path: '/jobs' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
        { icon: '⚙️', label: 'Profile Settings', path: '/profile/personal' }
      ]
    : isCoordinator
    ? [
        { icon: '⚡', label: 'Dashboard', path: '/coordinator/dashboard' },
        { icon: '👥', label: 'Students', path: '/coordinator/students' },
        { icon: '📊', label: 'Tracking Reports', path: '/coordinator/reports' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
        { icon: '🐛', label: 'Report a Bug', path: '/report-bug' }
      ]
    : isAdmin
    ? [
        { icon: '⚡', label: 'Admin Dashboard', path: '/admin/dashboard' },
        { icon: '👥', label: 'Students', path: '/admin/students' },
        { icon: '🛡️', label: 'Coordinators', path: '/admin/coordinators' },
        { icon: '📊', label: 'Tracking Reports', path: '/coordinator/reports' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
        { icon: '🐛', label: 'Bug Reports', path: '/admin/bugs' },
        { icon: '➕', label: 'Report a Bug', path: '/report-bug' }
      ]
    : [];

  return (
    <div className="ct-layout">
      {isImpersonating && (
        <div style={{
          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
          color: '#0b1120',
          padding: '0.6rem 1.5rem',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.2rem',
          zIndex: 9999
        }}>
          <span>Currently impersonating: <strong>{user?.name || ''}</strong></span>
          <button
            onClick={handleRevertImpersonation}
            style={{
              background: '#0b1120',
              color: '#f59e0b',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.75rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
            }}
          >
            Return To Admin
          </button>
        </div>
      )}
      <style>{`
        .ct-user-dropdown, .ct-prephub-dropdown {
          position: relative;
        }
        .ct-avatar-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.3rem 0.75rem 0.3rem 0.3rem;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          color: var(--text-primary);
        }
        .ct-avatar-btn:hover {
          background: var(--bg-card);
          border-color: var(--accent-blue);
        }
        .ct-avatar-circle-sm {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.7rem;
          color: white;
          flex-shrink: 0;
        }
        .ct-avatar-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ct-avatar-role {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .ct-avatar-chevron {
          font-size: 0.6rem;
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .ct-avatar-chevron.open {
          transform: rotate(180deg);
        }
        .ct-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--card-shadow);
          overflow: hidden;
          z-index: 1000;
          animation: dropdownFadeIn 0.18s ease;
        }
        
        .ct-prephub-dropdown {
          position: relative;
          display: inline-block;
        }

        .ct-prephub-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 285px;
          background: #0b1329;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 14px;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7);
          padding: 0.5rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          animation: dropdownFadeIn 0.18s ease;
        }

        /* Invisible hover bridge to eliminate gap flickering */
        .ct-prephub-menu::before {
          content: '';
          position: absolute;
          top: -12px;
          left: 0;
          right: 0;
          height: 12px;
          background: transparent;
        }

        .ct-prephub-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          color: #cbd5e1;
          text-decoration: none;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ct-prephub-item:hover {
          background: rgba(59, 130, 246, 0.12);
          color: #ffffff;
        }
        .ct-prephub-item.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(30, 27, 75, 0.6) 100%);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #60a5fa;
        }
        
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ct-dropdown-header {
          padding: 0.9rem 1rem;
          background: rgba(59,130,246,0.06);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .ct-dropdown-avatar-lg {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: white;
          box-shadow: 0 0 12px rgba(59,130,246,0.4);
          flex-shrink: 0;
        }
        .ct-dropdown-user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ct-dropdown-role-badge {
          display: inline-block;
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 600;
          background: rgba(59,130,246,0.15);
          color: var(--accent-blue);
          border: 1px solid rgba(59,130,246,0.25);
          margin-top: 2px;
        }
        .ct-dropdown-role-badge.coordinator {
          background: rgba(139,92,246,0.15);
          color: var(--accent-purple);
          border-color: rgba(139,92,246,0.25);
        }
        .ct-dropdown-role-badge.admin {
          background: rgba(239,68,68,0.15);
          color: var(--accent-red);
          border-color: rgba(239,68,68,0.25);
        }
        .ct-dropdown-items {
          padding: 0.4rem;
        }
        .ct-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.55rem 0.75rem;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 8px;
          text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .ct-dropdown-item:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .ct-dropdown-item.active-page {
          background: rgba(59,130,246,0.1);
          color: var(--accent-blue);
        }
        .ct-dropdown-icon {
          font-size: 0.9rem;
          width: 18px;
          text-align: center;
        }
        .ct-dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 0.3rem 0.5rem;
        }
        .ct-dropdown-logout {
          color: #f87171 !important;
        }
        .ct-dropdown-logout:hover {
          background: rgba(239,68,68,0.08) !important;
        }

        /* Mobile nav */
        @media (max-width: 640px) {
          .ct-nav-group { display: none; }
          .ct-avatar-name { display: none; }
          .ct-dropdown-menu { width: 200px; }
        }
      `}</style>

      <header className="ct-header">
        <div
          className="ct-header-left"
          onClick={() => navigate('/feed')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <img src="/logo-icon.png" alt="MEDHA CODE TRACK Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span className="ct-logo-text">MEDHA CODE TRACK</span>
        </div>
        <div className="ct-header-right">
          <div className="ct-nav-group" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {navItem('Feed', '/feed', 'feed')}

            {/* ALUMNI HUB HOVER DROPDOWN MENU */}
            <div
              ref={alumniDropdownRef}
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setAlumniDropdownOpen(true)}
              onMouseLeave={() => setAlumniDropdownOpen(false)}
            >
              <button
                type="button"
                className="ct-nav-item"
                data-active={['alumni', 'jobs', 'messages', 'events', 'forums', 'resources', 'interview-experiences', 'students-directory', 'coordinators-directory', 'groups', 'alumni-dashboard'].includes(active) ? 'true' : 'false'}
                onClick={() => setAlumniDropdownOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                🎓 Alumni Hub <span style={{ fontSize: '0.65rem' }}>▼</span>
              </button>

              {alumniDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '260px',
                  background: 'var(--bg-card, #1e293b)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '14px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                  padding: '0.4rem',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem'
                }}>
                  {isAlumni && (
                    <button
                      className="ct-dropdown-item"
                      onClick={() => { setAlumniDropdownOpen(false); navigate('/alumni/dashboard'); }}
                    >
                      <span className="ct-dropdown-icon">⚡</span> Alumni Dashboard
                    </button>
                  )}
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/jobs'); }}
                  >
                    <span className="ct-dropdown-icon">💼</span> Jobs & Referral Slots
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/messages'); }}
                  >
                    <span className="ct-dropdown-icon">💬</span> Messages & Mentorship
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/alumni'); }}
                  >
                    <span className="ct-dropdown-icon">👥</span> Alumni Directory
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/events'); }}
                  >
                    <span className="ct-dropdown-icon">📅</span> Events & Hackathons
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/forums'); }}
                  >
                    <span className="ct-dropdown-icon">💡</span> Discussion Forum & Q&A
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/resources'); }}
                  >
                    <span className="ct-dropdown-icon">📚</span> Useful Resources Library
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/interview-experiences'); }}
                  >
                    <span className="ct-dropdown-icon">📝</span> Interview Experiences
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/students-directory'); }}
                  >
                    <span className="ct-dropdown-icon">🎓</span> Student Directory & Contacts
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/coordinators-directory'); }}
                  >
                    <span className="ct-dropdown-icon">👔</span> Coordinator Directory
                  </button>
                  <button
                    className="ct-dropdown-item"
                    onClick={() => { setAlumniDropdownOpen(false); navigate('/groups'); }}
                  >
                    <span className="ct-dropdown-icon">👥</span> Alumni Interest Clubs & Groups
                  </button>
                </div>
              )}
            </div>

            {isStudent && (
              <>
                {navItem('Dashboard', '/student/dashboard', 'student-dashboard')}
                
                {/* Combined Prep Hub Dropdown */}
                <div
                  className="ct-prephub-dropdown"
                  ref={prepHubRef}
                  onMouseEnter={() => setPrepHubOpen(true)}
                  onMouseLeave={() => setPrepHubOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setPrepHubOpen(o => !o)}
                    className="ct-nav-item"
                    data-active={isPrepHubActive ? 'true' : 'false'}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Prep Hub</span>
                    <span style={{ fontSize: '0.65rem', transition: 'transform 0.2s', transform: prepHubOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>

                  {prepHubOpen && (
                    <div className="ct-prephub-menu" role="menu">
                      <button
                        onClick={() => { navigate('/roadmaps'); setPrepHubOpen(false); }}
                        className={`ct-prephub-item ${active === 'roadmaps' ? 'active' : ''}`}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🗺️</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Roadmaps</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Structured Learning Paths</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/dsa'); setPrepHubOpen(false); }}
                        className={`ct-prephub-item ${active === 'dsa' ? 'active' : ''}`}
                      >
                        <span style={{ fontSize: '1.1rem' }}>⚡</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>DSA Tracker</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Category & Topic Problems</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/student/interview'); setPrepHubOpen(false); }}
                        className={`ct-prephub-item ${['student-interview', 'interview'].includes(active) ? 'active' : ''}`}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🎯</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Interviews & Mock Tests</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Voice Interviews & AI Tests</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/student/resume'); setPrepHubOpen(false); }}
                        className={`ct-prephub-item ${['student-resume', 'resume'].includes(active) ? 'active' : ''}`}
                      >
                        <span style={{ fontSize: '1.1rem' }}>📄</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Resume Builder</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ATS Generator & Scorer</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Services Dropdown */}
                <div
                  className="ct-prephub-dropdown"
                  ref={servicesRef}
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setServicesOpen(o => !o)}
                    className="ct-nav-item"
                    data-active={active === 'services' ? 'true' : 'false'}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Services</span>
                    <span style={{ fontSize: '0.65rem', transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>

                  {servicesOpen && (
                    <div className="ct-prephub-menu" role="menu">
                      <button
                        onClick={() => { navigate('/student/services?tab=leave'); setServicesOpen(false); }}
                        className="ct-prephub-item"
                      >
                        <span style={{ fontSize: '1.1rem' }}>🍃</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Leave Request</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Apply & Track Leave Applications</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/student/services?tab=mentoring'); setServicesOpen(false); }}
                        className="ct-prephub-item"
                      >
                        <span style={{ fontSize: '1.1rem' }}>📅</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Mentoring Request</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Book Slots & GMeet Links</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/student/services?tab=laptop'); setServicesOpen(false); }}
                        className="ct-prephub-item"
                      >
                        <span style={{ fontSize: '1.1rem' }}>💻</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Laptop Request</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Report Issues & Repairs</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {navItem('Leaderboard', '/leaderboard', 'leaderboard')}
              </>
            )}

            {isAlumni && [
              navItem('Dashboard', '/alumni/dashboard', 'alumni-dashboard'),
              navItem('Leaderboard', '/leaderboard', 'leaderboard')
            ]}

            {isCoordinator && (
              <>
                {navItem('Dashboard', '/coordinator/dashboard', 'coord-dashboard')}
                {navItem('Students', '/coordinator/students', 'coord-students')}
                {navItem('Reports', '/coordinator/reports', 'coord-reports')}

                {/* Coordinator Services Dropdown */}
                <div
                  className="ct-prephub-dropdown"
                  ref={servicesRef}
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setServicesOpen(o => !o)}
                    className="ct-nav-item"
                    data-active={active === 'services' ? 'true' : 'false'}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Services</span>
                    <span style={{ fontSize: '0.65rem', transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>

                  {servicesOpen && (
                    <div className="ct-prephub-menu" role="menu">
                      <button
                        onClick={() => { navigate('/coordinator/services?tab=leave'); setServicesOpen(false); }}
                        className="ct-prephub-item"
                      >
                        <span style={{ fontSize: '1.1rem' }}>🍃</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Leave Requests</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Verify & Approve Applications</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/coordinator/services?tab=mentoring'); setServicesOpen(false); }}
                        className="ct-prephub-item"
                      >
                        <span style={{ fontSize: '1.1rem' }}>📅</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Mentoring Requests</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Reschedule Slots & Meeting Notes</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { navigate('/coordinator/services?tab=laptop'); setServicesOpen(false); }}
                        className="ct-prephub-item"
                      >
                        <span style={{ fontSize: '1.1rem' }}>💻</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Laptop Audit Table</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Excel Inventory & R&D Status</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {navItem('Leaderboard', '/leaderboard', 'leaderboard')}
              </>
            )}
            {isAdmin && [
              navItem('Dashboard', '/admin/dashboard', 'admin-dashboard'),
              navItem('Coordinators', '/admin/coordinators', 'admin-coordinators'),
              navItem('Students', '/admin/students', 'admin-students'),
              navItem('Reports', '/coordinator/reports', 'coord-reports'),
              navItem('Leaderboard', '/leaderboard', 'leaderboard'),
              navItem('Bugs', '/admin/bugs', 'admin-bugs')
            ]}
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GlobalSearchBar />
              <button
                onClick={() => setNotifOpen(true)}
                title="Notifications"
                style={{
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                🔔
              </button>
              <ModeToggle />
              <div className="ct-user-dropdown" ref={dropdownRef}>
                {/* AVATAR TRIGGER BUTTON */}
              <button
                className="ct-avatar-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="ct-avatar-circle-sm">{initials}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="ct-avatar-name">{user.name?.split(' ')[0]}</span>
                  <span className="ct-avatar-role">{user.role}</span>
                </div>
                <span className={`ct-avatar-chevron ${dropdownOpen ? 'open' : ''}`}>▼</span>
              </button>

              {/* DROPDOWN PANEL */}
              {dropdownOpen && (
                <div className="ct-dropdown-menu" role="menu">
                  {/* Header */}
                  <div className="ct-dropdown-header">
                    <div className="ct-dropdown-avatar-lg">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="ct-dropdown-user-name">{user.name}</div>
                      <span className={`ct-dropdown-role-badge ${user.role}`}>{user.role.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="ct-dropdown-items">
                    {dropdownItems.map((item, idx) => {
                      const isActive = window.location.pathname === item.path;
                      return (
                        <button
                          key={idx}
                          role="menuitem"
                          className={`ct-dropdown-item ${isActive ? 'active-page' : ''}`}
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate(item.path);
                          }}
                        >
                          <span className="ct-dropdown-icon">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    <div className="ct-dropdown-divider" />

                    <button
                      role="menuitem"
                      className="ct-dropdown-item ct-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <span className="ct-dropdown-icon">🚪</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </header>

      <main className={['feed', 'alumni-dashboard', 'jobs', 'alumni', 'messages', 'leaderboard', 'student-profile', 'events', 'forums', 'resources', 'interview-experiences', 'students-directory', 'coordinators-directory', 'groups'].includes(active) ? 'ct-main-full' : 'ct-main'}>
        {children}
      </main>

      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
