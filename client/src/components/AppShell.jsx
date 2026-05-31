import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AppShell({ active, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isStudent = user && user.role === 'student';
  const isCoordinator = user && user.role === 'coordinator';

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

  return (
    <div className="ct-layout">
      <header className="ct-header">
        <div className="ct-header-left">
          <div className="ct-logo-mark" />
          <span className="ct-logo-text">CodeTrack</span>
        </div>
        <div className="ct-header-right">
          <div className="ct-nav-group">
            {isStudent &&
              [
                navItem('Dashboard', '/student/dashboard', 'student-dashboard'),
                navItem('Platforms', '/student/platforms', 'student-platforms'),
                navItem('Profile', '/student/profile', 'student-profile'),
                navItem('Resume', '/student/resume', 'student-resume'),
                navItem('Leaderboard', '/leaderboard', 'leaderboard')
              ]}
            {isCoordinator &&
              [
                navItem('Students', '/coordinator/students', 'coord-students'),
                navItem('Leaderboard', '/leaderboard', 'leaderboard')
              ]}
          </div>
          {user && (
            <div className="ct-header-user">
              <span className="ct-header-user-name">{user.name}</span>
              <button type="button" className="ct-button-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main className={active === 'student-platforms' || active === 'leaderboard' ? 'ct-main-full' : 'ct-main'}>
        {children}
      </main>
    </div>
  );
}

