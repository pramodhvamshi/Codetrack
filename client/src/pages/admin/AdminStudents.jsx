import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api, API_BASE_URL } from '../../api/client';
import { Search, Eye, Key, ToggleLeft, ToggleRight, RefreshCw, X, AlertCircle } from 'lucide-react';

export function AdminStudents() {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Password reset modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);

  const loadStudents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getJson('/admin/students', token);
      setStudents(res);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [token]);

  const handleToggleStatus = async (student) => {
    try {
      const backendBase = `${API_BASE_URL}/api`;
      const res = await fetch(`${backendBase}/admin/students/${student._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !student.isActive })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle status');
      }

      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenReset = (student) => {
    setTargetStudent(student);
    setNewPassword('');
    setResetError(null);
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setResetError(null);
    setResetLoading(true);

    try {
      const backendBase = `${API_BASE_URL}/api`;
      const res = await fetch(`${backendBase}/admin/students/${targetStudent._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to reset password');
      }

      setShowResetModal(false);
      alert('Password reset successfully!');
    } catch (err) {
      setResetError(err.message || 'Action failed');
    } finally {
      setResetLoading(false);
    }
  };

  const handleImpersonate = async (student) => {
    if (!window.confirm(`Are you sure you want to log in as ${student.name}?`)) return;

    try {
      const backendBase = `${API_BASE_URL}/api`;
      const res = await fetch(`${backendBase}/admin/impersonate/${student._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Impersonation request failed');
      }

      const data = await res.json();
      login(data.token, data.user);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.mssid || '').toLowerCase().includes(q) ||
      (s.college || '').toLowerCase().includes(q)
    );
  });

  return (
    <AppShell active="admin-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER */}
        <div>
          <h1 style={{ margin: 0 }}>👥 Students Database Management</h1>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Search student database, toggle account status, reset passwords, or login as user to verify profiles.
          </p>
        </div>

        {/* SEARCH FILTER */}
        <div className="ct-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            type="text"
            className="ct-input"
            placeholder="Search by name, email, MSSID, or college..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingRight: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        {/* STUDENTS TABLE */}
        <div className="ct-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading student records...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No student records matched search criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>MSSID</th>
                    <th>Email</th>
                    <th>College</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Status</th>
                    <th style={{ textAlign: 'center', width: '250px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student._id}>
                      <td style={{ fontWeight: 'bold' }}>{student.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{student.mssid || '—'}</td>
                      <td>{student.email}</td>
                      <td>{student.college || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="ct-chip" style={{
                          background: student.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: student.isActive ? 'var(--accent-green)' : 'var(--accent-red)',
                          fontWeight: 'bold'
                        }}>
                          {student.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            title={student.isActive ? 'Disable' : 'Enable'}
                            onClick={() => handleToggleStatus(student)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: student.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}
                          >
                            {student.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                          <button
                            title="Reset Password"
                            onClick={() => handleOpenReset(student)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-orange)' }}
                          >
                            <Key size={16} />
                          </button>
                          <button
                            title="View Profile Details"
                            onClick={() => navigate(`/student/profile/view/${student._id}`)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="ct-button-secondary"
                            onClick={() => handleImpersonate(student)}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }}
                          >
                            Login As User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PASSWORD RESET MODAL */}
        {showResetModal && (
          <div className="hm-modal-overlay" onClick={() => setShowResetModal(false)}>
            <div className="hm-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, color: '#f3f4f6' }}>🔑 Reset Password</h2>
                <button
                  onClick={() => setShowResetModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Resetting password for <strong>{targetStudent?.name}</strong> ({targetStudent?.email}).
              </p>

              {resetError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} /> {resetError}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="ct-label">New Password *</label>
                  <input
                    type="password"
                    className="ct-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="ct-button-secondary" onClick={() => setShowResetModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ct-button" disabled={resetLoading}>
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
