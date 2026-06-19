import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { RefreshCw, Play, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function AdminSyncCenter() {
  const { token } = useAuth();
  const [latest, setLatest] = useState(null);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState(null);
  const [lastFailedSync, setLastFailedSync] = useState(null);
  const [averageDuration, setAverageDuration] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  
  const logContainerRef = useRef(null);

  const fetchStatus = async (showLoading = false) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.getJson('/admin/platform-sync/status/latest', token);
      if (data) {
        setLatest(data.latest);
        setLastSuccessfulSync(data.lastSuccessfulSync);
        setLastFailedSync(data.lastFailedSync);
        setAverageDuration(data.averageSyncDuration || 0);

        if (data.latest && (data.latest.status === 'Running' || data.latest.status === 'Pending')) {
          setSyncing(true);
        } else {
          setSyncing(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
      setError(err.message || 'Failed to fetch status');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus(true);
  }, [token]);

  // Polling when active sync job is running
  useEffect(() => {
    let interval = null;
    if (syncing) {
      interval = setInterval(() => {
        fetchStatus(false);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncing]);

  // Autoscroll logs container when syncing
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [latest?.logs]);

  const handleStartSync = async () => {
    if (!token) return;
    setError('');
    try {
      setSyncing(true);
      const res = await api.postJson('/admin/platform-sync/all', {}, token);
      if (res && res.jobId) {
        fetchStatus(false);
      }
    } catch (err) {
      console.error('Failed to trigger sync:', err);
      setError(err.message || 'Failed to trigger bulk sync');
      setSyncing(false);
    }
  };

  const handleExportFailed = async () => {
    if (!latest?.jobId || !token) return;
    try {
      const res = await api.getJson(`/admin/platform-sync/job/${latest.jobId}/failed-csv`, token);
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `failed_students_${latest.jobId}.csv`);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const total = latest?.totalStudents || 0;
  const processed = (latest?.completedStudents || 0) + (latest?.failedStudents || 0);
  const progressPct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <AppShell active="admin-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>Platform Sync Center</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Triggers and monitors automated platform sync batches for LeetCode, CodeChef, GitHub, and GeeksforGeeks profiles.
            </p>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            className="ct-button-secondary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="ct-card" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.2rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* METRICS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
          
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Last Successful Sync</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: lastSuccessfulSync ? '#f3f4f6' : 'var(--text-muted)' }}>
              {lastSuccessfulSync ? new Date(lastSuccessfulSync).toLocaleString() : 'Never'}
            </h3>
          </div>

          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Last Failed Sync</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: lastFailedSync ? '#f3f4f6' : 'var(--text-muted)' }}>
              {lastFailedSync ? new Date(lastFailedSync).toLocaleString() : 'Never'}
            </h3>
          </div>

          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #2563eb' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Sync Duration</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              {averageDuration > 0 ? formatDuration(averageDuration) : 'N/A'}
            </h3>
          </div>

        </div>

        {/* ACTIONS & ACTIVE RUN MONITOR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* CONTROL CONSOLE */}
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ margin: 0 }}>Sync Engine Console</h3>
            
            {latest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
                    <span className="ct-chip" style={{
                      background: latest.status === 'Completed' ? 'rgba(16,185,129,0.15)' : latest.status === 'Failed' ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)',
                      color: latest.status === 'Completed' ? '#10b981' : latest.status === 'Failed' ? '#ef4444' : '#3b82f6',
                      fontWeight: 'bold'
                    }}>
                      {latest.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Job ID: {latest.jobId}</span>
                </div>

                {/* Progress bar */}
                {(latest.status === 'Running' || latest.status === 'Pending' || latest.status === 'Completed') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Batch Sync Progress</span>
                      <span>{progressPct}% ({processed} of {total})</span>
                    </div>
                    <div style={{ height: 8, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* Batch metrics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center', padding: '0.8rem', background: '#0f172a', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL STUDENTS</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{latest.totalStudents}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981' }}>SUCCESSFUL</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>{latest.completedStudents}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>FAILED</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444' }}>{latest.failedStudents}</div>
                  </div>
                </div>

                {/* Failed students CSV export */}
                {latest.failedStudents > 0 && (
                  <button
                    onClick={handleExportFailed}
                    className="ct-button-secondary"
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    <Download size={14} />
                    Export Failed Students CSV
                  </button>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                No platform sync jobs have been queued.
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleStartSync}
                className="ct-button"
                disabled={syncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  background: syncing ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                  color: syncing ? '#1e293b' : '#0b1120',
                  fontWeight: 'bold',
                  cursor: syncing ? 'not-allowed' : 'pointer'
                }}
              >
                {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {syncing ? 'Syncing In Progress...' : 'Sync All Students'}
              </button>
            </div>
          </div>

          {/* ACTIVE RUNNING LOG MONITOR */}
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 350 }}>
            <h3 style={{ margin: 0 }}>Active Execution Console</h3>
            
            <div
              ref={logContainerRef}
              style={{
                flexGrow: 1,
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '0.8rem',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#34d399',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                whiteSpace: 'pre-wrap'
              }}
            >
              {latest && latest.logs && latest.logs.length > 0 ? (
                latest.logs.map((log, index) => {
                  let color = '#34d399'; // default green
                  if (log.startsWith('FAILED:')) {
                    color = '#f87171'; // red
                  } else if (log.startsWith('CRITICAL') || log.startsWith('SYSTEM ERROR')) {
                    color = '#f87171';
                  } else if (log.startsWith('Starting batch') || log.startsWith('Sync job')) {
                    color = '#60a5fa'; // blue
                  }
                  return (
                    <div key={index} style={{ color }}>
                      {log}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Console log is empty. Trigger sync to view live execution logs...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
