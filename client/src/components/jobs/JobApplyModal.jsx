import React, { useEffect, useState } from 'react';
import { jobApi } from '../../api/jobApi';

export function JobApplyModal({ isOpen, job, user, onClose, onSuccess }) {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedResumeUrl, setSelectedResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [fetchingResumes, setFetchingResumes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchResumes = async () => {
    try {
      setFetchingResumes(true);
      const res = await jobApi.getStudentResumes();
      if (res.success && Array.isArray(res.data)) {
        setResumes(res.data);
        if (res.data.length > 0) {
          // Pre-select default or first resume
          const defaultRes = res.data.find(r => r.isDefault) || res.data[0];
          setSelectedResumeId(defaultRes.id);
          setSelectedResumeUrl(defaultRes.resumeUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load student resumes:', err);
    } finally {
      setFetchingResumes(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.type.includes('pdf')) {
      setError('Please select a valid PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    try {
      const res = await jobApi.uploadResume(formData);
      if (res.success && res.data) {
        const newResume = res.data;
        setResumes(prev => [newResume, ...prev]);
        setSelectedResumeId(newResume.id);
        setSelectedResumeUrl(newResume.resumeUrl);
      } else {
        setError(res.message || 'Failed to upload resume PDF');
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Failed to upload PDF resume to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResumeId && !selectedResumeUrl) {
      setError('Please select a resume or upload a new PDF');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await jobApi.applyToJob(job._id, {
        resumeId: selectedResumeId,
        resumeUrl: selectedResumeUrl,
        coverLetter
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error applying to job:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !job) return null;

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
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #f8fafc)' }}>
              1-Click Job Application
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 600 }}>
              Applying for {job.title} at {job.company}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Selectable Resumes Section */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                Select Your Resume
              </label>

              {/* Upload PDF Trigger */}
              <label style={{
                fontSize: '0.78rem',
                color: '#3b82f6',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                ➕ {uploading ? 'Uploading PDF...' : 'Upload New Resume'}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>

            {fetchingResumes ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
                Loading your resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div style={{
                padding: '1.25rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px dashed var(--border, #334155)',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                  No resumes found in your Resume Studio or profile.
                </p>
                <label style={{
                  display: 'inline-block',
                  background: '#3b82f6',
                  color: '#ffffff',
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Upload Resume PDF
                  <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {resumes.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedResumeId(r.id);
                      setSelectedResumeUrl(r.resumeUrl);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: selectedResumeId === r.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary, #0f172a)',
                      border: selectedResumeId === r.id ? '1.5px solid #3b82f6' : '1px solid var(--border, #334155)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <input
                        type="radio"
                        name="resumeSelect"
                        checked={selectedResumeId === r.id}
                        onChange={() => {
                          setSelectedResumeId(r.id);
                          setSelectedResumeUrl(r.resumeUrl);
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                          📄 {r.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {r.source} • Updated {new Date(r.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {r.isDefault && (
                      <span style={{ background: '#10b98120', color: '#10b981', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cover Message */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.4rem' }}>
              Cover Message to Alumnus (Optional)
            </label>
            <textarea
              rows={3}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Briefly state why your skills match this position..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
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
              disabled={submitting || uploading}
              style={{
                padding: '0.6rem 1.4rem',
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: submitting || uploading ? 0.7 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
