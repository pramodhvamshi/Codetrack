import React, { useState } from 'react';
import { alumniApi } from '../../api/alumniApi';

export function AddAlumniModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('alumni123');
  const [branch, setBranch] = useState('CSE');
  const [batch, setBatch] = useState('2022');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentCompanyRole, setCurrentCompanyRole] = useState('Software Engineer');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await alumniApi.addAlumnus({
        name,
        email,
        password,
        branch,
        batch,
        currentCompany,
        currentCompanyRole,
        location,
        linkedin,
        github
      });

      if (res.success) {
        onSuccess();
        onClose();
        setName('');
        setEmail('');
        setCurrentCompany('');
        setLocation('');
        setLinkedin('');
        setGithub('');
      } else {
        setError(res.message || 'Failed to add alumnus');
      }
    } catch (err) {
      console.error('Error adding alumnus:', err);
      setError('Failed to add alumnus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card, #1e293b)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #f8fafc)' }}>
            🎓 Add New Alumnus Profile
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', maxHeight: '80vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ankit Verma"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ankit@alumni.cbit.ac.in"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Batch
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="2022"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Default Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="alumni123"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Current Company
              </label>
              <input
                type="text"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="e.g. Google / Microsoft"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Current Role / Designation
              </label>
              <input
                type="text"
                value={currentCompanyRole}
                onChange={(e) => setCurrentCompanyRole(e.target.value)}
                placeholder="e.g. SDE-2 / Product Manager"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
              Current Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hyderabad, India"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                GitHub URL
              </label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                border: '1px solid var(--border, #334155)',
                color: 'var(--text-muted, #94a3b8)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.4rem',
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating...' : 'Save Alumnus Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
