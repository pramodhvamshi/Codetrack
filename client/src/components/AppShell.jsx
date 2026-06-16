import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, API_BASE_URL } from '../api/client';

export function AppShell({ active, children }) {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
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
  const isImpersonating = user?.isImpersonating || sessionStorage.getItem("impersonationActive") === "true";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const navItem = (label, path, key) => (
    <button
      key={key}
      type="button"
      onClick={() => navigate(path)}
      className="ct-nav-item"
      data-active={active === key ? 'true' : 'false'}
    >
      {label}
    </button>
  );

  // Avatar initials
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const dropdownItems = isStudent
    ? [
        { icon: '⚡', label: 'Dashboard', path: '/student/dashboard' },
        { icon: '👤', label: 'My Profile', path: '/student/profile' },
        { icon: '📄', label: 'Resume Builder', path: '/student/resume' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
        { icon: '🐛', label: 'Report a Bug', path: '/report-bug' }
      ]
    : isCoordinator
    ? [
        { icon: '⚡', label: 'Dashboard', path: '/coordinator/dashboard' },
        { icon: '👥', label: 'Students', path: '/coordinator/students' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
        { icon: '🐛', label: 'Report a Bug', path: '/report-bug' }
      ]
    : isAdmin
    ? [
        { icon: '⚡', label: 'Admin Dashboard', path: '/admin/dashboard' },
        { icon: '👥', label: 'Students', path: '/admin/students' },
        { icon: '🛡️', label: 'Coordinators', path: '/admin/coordinators' },
        { icon: '🐛', label: 'Bug Reports', path: '/admin/bugs' },
        { icon: '🏆', label: 'Leaderboard', path: '/leaderboard' },
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
        .ct-user-dropdown {
          position: relative;
        }
        .ct-avatar-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 0.3rem 0.75rem 0.3rem 0.3rem;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          color: var(--text-primary);
        }
        .ct-avatar-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(59,130,246,0.4);
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
          color: #e5e7eb;
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
          background: rgba(15, 23, 42, 0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1);
          overflow: hidden;
          z-index: 1000;
          animation: dropdownFadeIn 0.18s ease;
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ct-dropdown-header {
          padding: 0.9rem 1rem;
          background: rgba(59,130,246,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
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
          color: #f3f4f6;
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
          color: #d1d5db;
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 8px;
          text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .ct-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
          color: #f3f4f6;
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
          background: rgba(255,255,255,0.06);
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
        <div className="ct-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img src="/logo-icon.png" alt="MEDHA CODE TRACK Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span className="ct-logo-text">MEDHA CODE TRACK</span>
        </div>
        <div className="ct-header-right">
          <div className="ct-nav-group">
            {isStudent && [
              navItem('Dashboard', '/student/dashboard', 'student-dashboard'),
              navItem('Profile', '/student/profile', 'student-profile'),
              navItem('Resume', '/student/resume', 'student-resume'),
              navItem('Leaderboard', '/leaderboard', 'leaderboard')
            ]}
            {isCoordinator && [
              navItem('Dashboard', '/coordinator/dashboard', 'coord-dashboard'),
              navItem('Students', '/coordinator/students', 'coord-students'),
              navItem('Leaderboard', '/leaderboard', 'leaderboard')
            ]}
            {isAdmin && [
              navItem('Dashboard', '/admin/dashboard', 'admin-dashboard'),
              navItem('Coordinators', '/admin/coordinators', 'admin-coordinators'),
              navItem('Students', '/admin/students', 'admin-students'),
              navItem('Leaderboard', '/leaderboard', 'leaderboard'),
              navItem('Bugs', '/admin/bugs', 'admin-bugs')
            ]}
          </div>

          {user && (
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
                      <div className={`ct-dropdown-role-badge ${user.role === 'coordinator' ? 'coordinator' : user.role === 'admin' ? 'admin' : ''}`}>
                        {user.role === 'admin' ? '👑 Admin' : user.role === 'coordinator' ? '🎓 Coordinator' : '💻 Student'}
                      </div>
                    </div>
                  </div>

                  {/* Nav items */}
                  <div className="ct-dropdown-items">
                    {dropdownItems.map(item => (
                      <button
                        key={item.path}
                        className="ct-dropdown-item"
                        onClick={() => { setDropdownOpen(false); navigate(item.path); }}
                        role="menuitem"
                      >
                        <span className="ct-dropdown-icon">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}

                    <div className="ct-dropdown-divider" />

                    <button
                      className="ct-dropdown-item ct-dropdown-logout"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <span className="ct-dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={active === 'student-profile' || active === 'leaderboard' ? 'ct-main-full' : 'ct-main'}>
        {children}
      </main>
    </div>
  );
}
