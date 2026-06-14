import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { Users, Shield, Bug, Activity, RefreshCw } from 'lucide-react';

export function AdminDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ students: 0, coordinators: 0, bugs: 0, logs: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [students, coordinators, bugs, auditLogs] = await Promise.all([
        api.getJson('/admin/students', token),
        api.getJson('/admin/coordinators', token),
        api.getJson('/admin/bugs', token),
        api.getJson('/admin/audit-logs', token)
      ]);

      setStats({
        students: students.length,
        coordinators: coordinators.length,
        bugs: bugs.length,
        logs: auditLogs.length
      });
      setLogs(auditLogs.slice(0, 10)); // Show latest 10 logs
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  if (loading) {
    return (
      <AppShell active="admin-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="admin-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HEADER */}
        <div>
          <h1 style={{ margin: 0 }}>System Administration</h1>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage student databases, register coordinators, audit impersonations, and resolve bug reports.
          </p>
        </div>

        {/* ADMIN STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
          
          <div className="ct-card" onClick={() => navigate('/admin/students')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-blue)', background: 'var(--grad-score)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Manage Students</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 800 }}>{stats.students}</h2>
            </div>
            <Users size={24} color="var(--accent-blue)" />
          </div>

          <div className="ct-card" onClick={() => navigate('/admin/coordinators')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-purple)', background: 'var(--grad-consistency)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Coordinators</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 800 }}>{stats.coordinators}</h2>
            </div>
            <Shield size={24} color="var(--accent-purple)" />
          </div>

          <div className="ct-card" onClick={() => navigate('/admin/bugs')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-red)', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(17,24,39,0.95))' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bug Reports</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 800 }}>{stats.bugs}</h2>
            </div>
            <Bug size={24} color="var(--accent-red)" />
          </div>

        </div>

        {/* LOGS & ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          
          {/* Audit Logs Table */}
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-purple)" /> Recent Impersonation Logs
            </h3>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                No impersonation sessions audited yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th>Admin Email</th>
                      <th>Target Student/Coordinator</th>
                      <th>Action</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td>{log.adminEmail}</td>
                        <td>{log.targetEmail}</td>
                        <td>
                          <span className="ct-chip" style={{
                            background: log.action === 'impersonate_start' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                            color: log.action === 'impersonate_start' ? 'var(--accent-orange)' : 'var(--accent-green)',
                            fontWeight: 'bold'
                          }}>
                            {log.action === 'impersonate_start' ? 'Impersonate Start' : 'Revert Impersonation'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Administrative Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/admin/coordinators" className="ct-button" style={{ textContainer: 'center', display: 'block', textAlign: 'center', textDecoration: 'none', color: '#0b1120', fontWeight: 'bold' }}>
                🛡️ Register Coordinator
              </Link>
              <Link to="/admin/students" className="ct-button-secondary" style={{ textContainer: 'center', display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.55rem' }}>
                👥 Manage Student Database
              </Link>
              <Link to="/admin/bugs" className="ct-button-secondary" style={{ textContainer: 'center', display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.55rem' }}>
                🐛 View Bug Dashboard
              </Link>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
