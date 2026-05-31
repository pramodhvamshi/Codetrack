import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

export function StudentResume() {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('auto');
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const backendBase =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

  // Upload manual resume
  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.postForm('/student/me/resume/manual', formData, token);
      setMode('manual'); // auto switch after upload
    } finally {
      setUploading(false);
    }
  };

  // Build API endpoint (NO iframe direct call!)
  const resumeApiUrl =
    mode === 'manual'
      ? `${backendBase}/student/me/resume?mode=manual`
      : `${backendBase}/student/me/resume?mode=auto`;

  // Fetch PDF securely and convert to Blob URL
  useEffect(() => {
    if (!token) return;

    let active = true;
    let blobUrl;

    const loadResume = async () => {
      setLoadingPreview(true);
      setPreviewError(null);

      try {
        const res = await fetch(resumeApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to load resume (${res.status})`);
        }

        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);

        if (active) {
          setResumeBlobUrl(blobUrl);
        }
      } catch (err) {
        if (active) {
          setPreviewError(err.message || 'Failed to load resume');
          setResumeBlobUrl(null);
        }
      } finally {
        if (active) setLoadingPreview(false);
      }
    };

    loadResume();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [mode, token, resumeApiUrl]);

  return (
    <AppShell active="student-resume">
      <div className="ct-card">
        <h2 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Resume</h2>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
          CodeTrack generates an academic coding resume automatically from your verified data.
          You can optionally upload a manual PDF override.
        </p>

        <div className="ct-grid-2">
          {/* LEFT: Preview */}
          <div>
            <div className="ct-section-title">Preview</div>
            <div
              style={{
                background: '#020617',
                borderRadius: '0.75rem',
                border: '1px solid rgba(55,65,81,0.9)',
                padding: '0.75rem',
                height: 420,
                overflow: 'hidden'
              }}
            >
              {loadingPreview && (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                  Loading resume preview…
                </div>
              )}

              {previewError && (
                <div style={{ color: '#f87171', fontSize: '0.85rem' }}>
                  {previewError}
                </div>
              )}

              {!loadingPreview && !previewError && resumeBlobUrl && (
                <iframe
                  title="Resume preview"
                  src={resumeBlobUrl}
                  style={{ border: 'none', width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>

          {/* RIGHT: Controls */}
          <div>
            <div className="ct-section-title">Controls</div>
            <div style={{ fontSize: '0.85rem', color: '#e5e7eb', marginBottom: '0.75rem' }}>
              <p>
                <strong>Auto mode</strong> builds your resume from academic details,
                platform scores, projects, certifications, achievements, and hackathons.
              </p>
              <p>
                <strong>Manual mode</strong> lets you upload a custom PDF. You can still
                regenerate the auto version any time.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
              <button
                className="ct-button-secondary"
                type="button"
                onClick={() => setMode('auto')}
              >
                View auto resume
              </button>
              <button
                className="ct-button-secondary"
                type="button"
                onClick={() => setMode('manual')}
              >
                View manual resume
              </button>
            </div>

            <div>
              <label className="ct-label">Upload manual resume (PDF)</label>
              <input
                className="ct-input"
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                {uploading ? 'Uploading…' : 'Optional. Overrides the auto-generated version.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
