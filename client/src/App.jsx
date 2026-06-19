import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentResume } from './pages/student/StudentResume';
import { StudentProfileEdit } from './pages/student/StudentProfileEdit';

import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { CoordinatorStudents } from './pages/coordinator/CoordinatorStudents';
import { CoordinatorStudentDetail } from './pages/coordinator/CoordinatorStudentDetail';
import { CoordinatorStudentsList } from './pages/coordinator/CoordinatorStudentsList';

import { CoordinatorReports } from './pages/coordinator/CoordinatorReports';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCoordinators } from './pages/admin/AdminCoordinators';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminBugs } from './pages/admin/AdminBugs';
import { AdminSyncCenter } from './pages/admin/AdminSyncCenter';

import { ReportBugPage } from './pages/shared/ReportBugPage';
import { LeaderboardPage } from './pages/shared/LeaderboardPage';
import { PublicStudentProfile } from './pages/shared/PublicStudentProfile';
import { LandingPage } from './pages/shared/LandingPage';

import './styles/global.css';

/* ---------- PROTECTED ROUTE ---------- */
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

/* ---------- APP ---------- */
function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0B1020',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ct-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* LANDING */}
        <Route path="/" element={<LandingPage />} />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* STUDENT */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="student">
              <PublicStudentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/resume"
          element={
            <ProtectedRoute role="student">
              <StudentResume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/personal"
          element={
            <ProtectedRoute role="student">
              <StudentProfileEdit tab="personal" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/professional"
          element={
            <ProtectedRoute role="student">
              <StudentProfileEdit tab="professional" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/coding"
          element={
            <ProtectedRoute role="student">
              <StudentProfileEdit tab="coding" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/password"
          element={
            <ProtectedRoute role="student">
              <StudentProfileEdit tab="password" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/academic"
          element={
            <ProtectedRoute role="student">
              <StudentProfileEdit tab="academic" />
            </ProtectedRoute>
          }
        />

        {/* COORDINATOR */}
        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/reports"
          element={
            <ProtectedRoute role={['coordinator', 'admin']}>
              <CoordinatorReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/all"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/active"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/inactive"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/placement-ready"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/needs-improvement"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/at-risk"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/students/:id"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorStudentDetail />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/coordinators"
          element={
            <ProtectedRoute role="admin">
              <AdminCoordinators />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute role="admin">
              <AdminStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bugs"
          element={
            <ProtectedRoute role="admin">
              <AdminBugs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/sync-center"
          element={
            <ProtectedRoute role="admin">
              <AdminSyncCenter />
            </ProtectedRoute>
          }
        />

        {/* BUG REPORTING */}
        <Route
          path="/report-bug"
          element={
            <ProtectedRoute>
              <ReportBugPage />
            </ProtectedRoute>
          }
        />

        {/* LEADERBOARD */}
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ PUBLIC STUDENT PROFILE (IMPORTANT) */}
        <Route
          path="/student/profile/view/:id"
          element={<PublicStudentProfile />}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
