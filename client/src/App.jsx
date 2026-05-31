import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentPlatforms } from './pages/student/StudentPlatforms';
import { StudentResume } from './pages/student/StudentResume';

// import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { CoordinatorStudents } from './pages/coordinator/CoordinatorStudents';
import { CoordinatorStudentDetail } from './pages/coordinator/CoordinatorStudentDetail';

import { LeaderboardPage } from './pages/shared/LeaderboardPage';
import { PublicStudentProfile } from './pages/shared/PublicStudentProfile'; // ✅ NEW

import './styles/global.css';

/* ---------- PROTECTED ROUTE ---------- */
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ---------- APP ---------- */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/platforms"
            element={
              <ProtectedRoute role="student">
                <StudentPlatforms />
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

          {/* COORDINATOR */}
          {/* <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute role="coordinator">
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/coordinator/students"
            element={
              <ProtectedRoute role="coordinator">
                <CoordinatorStudents />
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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
