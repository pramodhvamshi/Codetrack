import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { Shield, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, AlertCircle } from 'lucide-react';

export function AdminCoordinators() {
  const { token } = useAuth();

  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingCoord, setEditingCoord] = useState(null); // Null = Create, Object = Edit
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '' });
  const [formLoading, setFormLoading] = useState(false);

  const loadCoordinators = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getJson('/admin/coordinators', token);
      setCoordinators(res);
    } catch (err) {
      console.error('Failed to load coordinators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoordinators();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingCoord(null);
    setForm({ name: '', email: '', password: '', college: '' });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (coord) => {
    setEditingCoord(coord);
    setForm({ name: coord.name, email: coord.email, password: '', college: coord.college || '' });
    setError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    try {
      if (editingCoord) {
        // Edit coordinator
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          college: form.college.trim()
        };
        if (form.password) payload.password = form.password;

        const backendBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
        const res = await fetch(`${backendBase}/admin/coordinators/${editingCoord._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to edit coordinator');
        }
      } else {
        // Create coordinator
        if (!form.password) throw new Error('Password is required for new coordinators');

        const backendBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
        const res = await fetch(`${backendBase}/admin/coordinators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            college: form.college.trim()
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to create coordinator');
        }
      }

      setShowModal(false);
      loadCoordinators();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (coord) => {
    try {
      const backendBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
      const res = await fetch(`${backendBase}/admin/coordinators/${coord._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !coord.isActive })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle status');
      }

      loadCoordinators();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (coord) => {
    if (!window.confirm(`Are you sure you want to delete coordinator ${coord.name}?`)) return;

    try {
      const backendBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
      const res = await fetch(`${backendBase}/admin/coordinators/${coord._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete coordinator');
      }

      loadCoordinators();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AppShell active="admin-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>🛡️ Coordinators Management</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Create and manage coordinator accounts, college assignments, and logins.
            </p>
          </div>
          <button
            className="ct-button"
            onClick={handleOpenCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#0b1120', fontWeight: 'bold' }}
          >
            <Plus size={16} /> Register Coordinator
          </button>
        </div>

        {/* LIST */}
        <div className="ct-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading coordinators...
            </div>
          ) : coordinators.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No coordinator accounts registered yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>College</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Status</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinators.map((coord) => (
                    <tr key={coord._id}>
                      <td style={{ fontWeight: 'bold' }}>{coord.name}</td>
                      <td>{coord.email}</td>
                      <td>{coord.college || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="ct-chip" style={{
                          background: coord.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: coord.isActive ? 'var(--accent-green)' : 'var(--accent-red)',
                          fontWeight: 'bold'
                        }}>
                          {coord.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            title={coord.isActive ? 'Disable' : 'Enable'}
                            onClick={() => handleToggleStatus(coord)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: coord.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}
                          >
                            {coord.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                          <button
                            title="Edit"
                            onClick={() => handleOpenEdit(coord)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDelete(coord)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}
                          >
                            <Trash2 size={16} />
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

        {/* MODAL */}
        {showModal && (
          <div className="hm-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="hm-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, color: '#f3f4f6' }}>
                  {editingCoord ? '📝 Edit Coordinator' : '🛡️ Register Coordinator'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="ct-label">Full Name *</label>
                  <input
                    className="ct-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="ct-label">Email Address *</label>
                  <input
                    type="email"
                    className="ct-input"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="ct-label">
                    {editingCoord ? 'New Password (Leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    className="ct-input"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required={!editingCoord}
                  />
                </div>

                <div>
                  <label className="ct-label">Assigned College (Optional)</label>
                  <input
                    className="ct-input"
                    value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. CBIT, VASAVI"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="ct-button-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ct-button" disabled={formLoading}>
                    {formLoading ? 'Saving...' : 'Save Coordinator'}
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
