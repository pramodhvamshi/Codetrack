import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api, API_BASE_URL } from '../../api/client';
import { Bug, RefreshCw, Calendar, AlertTriangle, User, ExternalLink, X } from 'lucide-react';

export function AdminBugs() {
  const { token } = useAuth();

  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Bug details modal state
  const [selectedBug, setSelectedBug] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  // Screenshot Lightbox States
  const [screenshotModalUrl, setScreenshotModalUrl] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageError, setImageError] = useState(false);

  const loadBugs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getJson('/admin/bugs', token);
      setBugs(res);
    } catch (err) {
      console.error('Failed to load bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, [token]);

  const handleStatusChange = async (bugId, newStatus) => {
    try {
      const backendBase = `${API_BASE_URL}/api`;
      const res = await fetch(`${backendBase}/admin/bugs/${bugId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const updated = await res.json();
      setBugs(prev => prev.map(b => b._id === bugId ? updated : b));
      if (selectedBug && selectedBug._id === bugId) {
        setSelectedBug(updated);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'Critical': return '#ef4444'; // Red
      case 'High': return '#f97316'; // Orange
      case 'Medium': return '#eab308'; // Yellow
      case 'Low': return '#3b82f6'; // Blue
      default: return '#9ca3af';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#ef4444';
      case 'In Progress': return '#eab308';
      case 'Resolved': return '#22c55e';
      case 'Closed': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const filteredBugs = bugs.filter(b => {
    if (filterSeverity && b.severity !== filterSeverity) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    return true;
  });

  const backendBase = `${API_BASE_URL}/api`;
  // Adjust base URL for screenshots which are stored in the server uploads folder
  const getAbsoluteScreenshotUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `${API_BASE_URL.replace('/api', '')}${url}`;
    }
    const serverUrl = backendBase.replace('/api', '');
    return `${serverUrl}${url}`;
  };

  const openBugDetails = (bug) => {
    setSelectedBug(bug);
    setImageError(false);
    setActiveImage(bug.screenshotUrls?.[0] ? getAbsoluteScreenshotUrl(bug.screenshotUrls[0]) : null);
  };

  const handleThumbnailClick = (absUrl) => {
    setImageError(false);
    setActiveImage(absUrl);
  };

  return (
    <AppShell active="admin-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>🐛 Bug Reports Dashboard</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Inspect user bug reports, view uploaded attachments, and update resolution status.
            </p>
          </div>
          <button onClick={loadBugs} className="ct-button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}>
            <RefreshCw size={14} /> Refresh Reports
          </button>
        </div>

        {/* FILTERS */}
        <div className="ct-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          <select
            className="ct-input"
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            style={{ width: '180px', color: '#f3f4f6', background: '#111827' }}
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="ct-input"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: '180px', color: '#f3f4f6', background: '#111827' }}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

        </div>

        {/* REPORTS LIST */}
        <div className="ct-card">
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem auto' }} />
              Loading bug reports...
            </div>
          ) : filteredBugs.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No bug reports matching criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Bug Title</th>
                    <th>Reporter</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center', width: '120px' }}>Severity</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>Status</th>
                    <th style={{ textAlign: 'center', width: '120px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBugs.map(bug => (
                    <tr key={bug._id}>
                      <td style={{ fontWeight: 'bold' }}>{bug.title}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem' }}>{bug.reporterName}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{bug.reporterRole}</span>
                        </div>
                      </td>
                      <td>{bug.category}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="ct-chip" style={{
                          background: `${getSeverityColor(bug.severity)}20`,
                          color: getSeverityColor(bug.severity),
                          border: `1px solid ${getSeverityColor(bug.severity)}40`,
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}>
                          {bug.severity}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          className="ct-input"
                          value={bug.status}
                          onChange={e => handleStatusChange(bug._id, e.target.value)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.78rem',
                            border: `1px solid ${getStatusColor(bug.status)}`,
                            color: getStatusColor(bug.status),
                            background: '#111827',
                            width: '125px',
                            fontWeight: '600'
                          }}
                        >
                          <option value="Open">🔴 Open</option>
                          <option value="In Progress">🟡 In Progress</option>
                          <option value="Resolved">🟢 Resolved</option>
                          <option value="Closed">⚫ Closed</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => openBugDetails(bug)}
                          className="ct-button-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DETAILED BUG MODAL */}
        {selectedBug && (
          <div className="hm-modal-overlay" onClick={() => setSelectedBug(null)}>
            <div className="hm-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bug size={20} color="var(--accent-red)" /> Inspect Bug Report
                </h2>
                <button
                  onClick={() => setSelectedBug(null)}
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', textAlign: 'left' }}>
                
                {/* Left side: details & description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.2rem 0', color: '#f3f4f6' }}>{selectedBug.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.4rem' }}>
                      <span className="ct-chip">📁 Category: {selectedBug.category}</span>
                      <span className="ct-chip" style={{ color: getSeverityColor(selectedBug.severity) }}>
                        ⚠️ Severity: {selectedBug.severity}
                      </span>
                      <span className="ct-chip" style={{ color: getStatusColor(selectedBug.status) }}>
                        ● Status: {selectedBug.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                    <label className="ct-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Description / Steps</label>
                    <p style={{
                      margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: '#e5e7eb',
                      background: 'rgba(0,0,0,0.25)', padding: '0.8rem', borderRadius: '6px',
                      whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      {selectedBug.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                    <label className="ct-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Reporter Details</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', color: '#e5e7eb', marginTop: '0.2rem' }}>
                      <span>👤 Name: <strong>{selectedBug.reporterName}</strong></span>
                      <span>📧 Email: <strong>{selectedBug.reporterEmail}</strong></span>
                      <span>🛡️ Role: <strong>{selectedBug.reporterRole}</strong></span>
                      <span>📅 Reported: <strong>{new Date(selectedBug.createdAt).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right side: attachments (screenshots) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label className="ct-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Attachments ({selectedBug.screenshotUrls?.length || 0} files)
                  </label>

                  {selectedBug.screenshotUrls && selectedBug.screenshotUrls.length > 0 ? (
                    <>
                      {/* Big image preview */}
                      {activeImage && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{
                            width: '100%', height: '180px', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', overflow: 'hidden', background: '#050810',
                            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {imageError ? (
                              <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                ⚠️ Screenshot unavailable
                              </div>
                            ) : (
                              <img 
                                src={activeImage} 
                                alt="screenshot" 
                                onError={() => setImageError(true)}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
                                onClick={() => {
                                  setImageError(false);
                                  setScreenshotModalUrl(activeImage);
                                }}
                              />
                            )}
                          </div>
                          {!imageError && (
                            <button
                              className="ct-button"
                              style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}
                              onClick={() => {
                                setImageError(false);
                                setScreenshotModalUrl(activeImage);
                              }}
                            >
                              🔍 View Screenshot
                            </button>
                          )}
                        </div>
                      )}

                      {/* Thumbnails row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selectedBug.screenshotUrls.map((url, idx) => {
                          const absUrl = getAbsoluteScreenshotUrl(url);
                          const isActive = activeImage === absUrl;
                          return (
                            <img
                              key={idx}
                              src={absUrl}
                              alt={`thumb-${idx}`}
                              onClick={() => handleThumbnailClick(absUrl)}
                              style={{
                                width: '50px', height: '50px', objectFit: 'cover',
                                borderRadius: '4px', cursor: 'pointer',
                                border: isActive ? '2px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
                                opacity: isActive ? 1 : 0.6,
                                transition: 'opacity 0.15s'
                              }}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      flex: 1, minHeight: '150px', border: '1px dashed rgba(255,255,255,0.08)',
                      borderRadius: '8px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem',
                      fontStyle: 'italic'
                    }}>
                      No screenshots attached
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', marginTop: 'auto' }}>
                    <label className="ct-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Update Status</label>
                    <select
                      className="ct-input"
                      value={selectedBug.status}
                      onChange={e => handleStatusChange(selectedBug._id, e.target.value)}
                      style={{ marginTop: '0.3rem', background: '#111827', color: '#f3f4f6' }}
                    >
                      <option value="Open">🔴 Open</option>
                      <option value="In Progress">🟡 In Progress</option>
                      <option value="Resolved">🟢 Resolved</option>
                      <option value="Closed">⚫ Closed</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      {/* SCREENSHOT LIGHTBOX MODAL */}
      {screenshotModalUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
        }}>
          {/* Top control bar */}
          <div style={{
            width: '100%', maxWidth: '90vw', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', color: '#fff', marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0 }}>Screenshot Inspector</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                className="ct-button-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
              >
                ➕ Zoom In
              </button>
              <button 
                className="ct-button-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
              >
                ➖ Zoom Out
              </button>
              <button 
                className="ct-button-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setZoomLevel(1)}
              >
                🔄 Reset Zoom
              </button>
              <a 
                href={screenshotModalUrl} 
                target="_blank" 
                rel="noreferrer"
                className="ct-button-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
              >
                ↗ Open in New Tab
              </a>
              <button 
                className="ct-button"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = screenshotModalUrl;
                  a.download = `screenshot-${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                📥 Download
              </button>
              <button 
                onClick={() => {
                  setScreenshotModalUrl(null);
                  setZoomLevel(1);
                }}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.4rem', cursor: 'pointer', marginLeft: '0.5rem' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Image Container with Zoom */}
          <div style={{
            flex: 1, width: '100%', maxWidth: '90vw', maxHeight: '80vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            background: '#040711'
          }}>
            <img 
              src={screenshotModalUrl} 
              alt="Screenshot Inspector Zoomed" 
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out',
                maxWidth: '95%',
                maxHeight: '95%',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}

    </div>
  </AppShell>
);
}
