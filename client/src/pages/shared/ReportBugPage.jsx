import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api, API_BASE_URL } from '../../api/client';
import { AlertCircle, Upload, X, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Dashboard', 'Profile', 'Leaderboard', 'Heatmap',
  'Resume', 'Authentication', 'Coordinator', 'Other'
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export function ReportBugPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Dashboard',
    severity: 'Low'
  });
  const [screenshots, setScreenshots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files);

    if (screenshots.length + selectedFiles.length > 5) {
      setError('You can attach a maximum of 5 screenshots');
      return;
    }

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    for (const file of selectedFiles) {
      if (!validTypes.includes(file.type)) {
        setError(`File "${file.name}" is not a supported format. Please use PNG, JPG, JPEG, or WEBP.`);
        return;
      }
      if (file.size > maxBytes) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
    }

    setScreenshots(prev => [...prev, ...selectedFiles]);
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.title.trim() || !form.description.trim()) {
      setError('Please fill in both title and description.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('severity', form.severity);

      screenshots.forEach(file => {
        formData.append('screenshots', file);
      });

      // Submit via fetch since it has multipart form data
      const backendBase = `${API_BASE_URL}/api`;
      const res = await fetch(`${backendBase}/bugs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit bug report');
      }

      setSuccess(true);
      setForm({ title: '', description: '', category: 'Dashboard', severity: 'Low' });
      setScreenshots([]);
    } catch (err) {
      setError(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell active="report-bug">
      <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.4rem' }}>🐛 Report a Bug</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Encountered an issue or glitch? Describe it below and attach relevant screenshots to help us resolve it.
        </p>

        {success && (
          <div className="ct-card" style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'var(--accent-green)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <CheckCircle size={20} />
            <div>
              <strong style={{ display: 'block' }}>Thank you!</strong>
              <span style={{ fontSize: '0.85rem' }}>Your bug report has been successfully submitted and routed to the administrator.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="ct-card" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'var(--accent-red)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <div className="ct-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="ct-label">Bug Title *</label>
              <input
                className="ct-input"
                placeholder="Brief summary of the issue (e.g. Heatmap cells overlapping on mobile)"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="ct-grid-2">
              <div>
                <label className="ct-label">Category *</label>
                <select
                  className="ct-input"
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{ background: '#111827', color: '#f3f4f6' }}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="ct-label">Severity *</label>
                <select
                  className="ct-input"
                  value={form.severity}
                  onChange={e => setForm(prev => ({ ...prev, severity: e.target.value }))}
                  style={{ background: '#111827', color: '#f3f4f6' }}
                >
                  {SEVERITIES.map(sev => <option key={sev} value={sev}>{sev}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="ct-label">Steps to Reproduce / Description *</label>
              <textarea
                className="ct-input"
                placeholder="Please describe what you were doing, what you expected, and what actually happened."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows="5"
                required
              />
            </div>

            {/* Screenshots Upload */}
            <div>
              <label className="ct-label">Screenshots (Max 5, up to 5MB each)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.5rem' }}>
                {/* Thumbnails of attached files */}
                {screenshots.map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative', width: '90px', height: '90px',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                        overflow: 'hidden', background: '#0a0f1d'
                      }}
                    >
                      <img src={url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        style={{
                          position: 'absolute', top: '4px', right: '4px',
                          background: 'rgba(0,0,0,0.6)', border: 'none',
                          borderRadius: '50%', width: '20px', height: '20px',
                          display: 'flex', alignItems: 'center', justifyContainer: 'center',
                          color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
                          padding: 0, justifyContent: 'center'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {/* File picker button */}
                {screenshots.length < 5 && (
                  <label
                    style={{
                      width: '90px', height: '90px', border: '2px dashed rgba(255,255,255,0.15)',
                      borderRadius: '8px', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      color: 'var(--text-muted)', gap: '0.25rem', transition: 'border-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Upload size={18} />
                    <span style={{ fontSize: '0.65rem' }}>Attach</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      accept=".png,.jpg,.jpeg,.webp"
                    />
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="ct-button-secondary"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ct-button"
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', fontWeight: 600, color: '#0b1120' }}
              >
                {submitting ? 'Submitting...' : 'Submit Bug Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
