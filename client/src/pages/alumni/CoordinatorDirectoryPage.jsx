import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';

export function CoordinatorDirectoryPage() {
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const res = await api.getJson('/v2/alumni/coordinators');
      if (res.success && res.data) {
        setCoordinators(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch coordinator directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  return (
    <AppShell active="coordinators-directory">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
            👔 Registered Campus Coordinators Directory
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Contact official campus placement & department coordinators for drives, events, or administrative inquiries.
          </p>
        </div>

        {/* Coordinators Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading campus coordinators...</div>
        ) : coordinators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>👔</span>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>No Registered Coordinators Found</h3>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Check back soon as new coordinators register.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
            {coordinators.map(c => {
              const initials = c.name ? c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'C';
              const phone = c.phoneNumber || '';

              return (
                <div
                  key={c._id}
                  style={{
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  <div>
                    {/* Avatar & Info */}
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>

                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                          {c.name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 700 }}>
                          🎓 Campus Placement Coordinator
                        </div>
                      </div>
                    </div>

                    {/* Department Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                      <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                        🏛️ {c.college || 'CBIT'}
                      </span>
                      {c.branch && (
                        <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                          💻 Department of {c.branch}
                        </span>
                      )}
                    </div>

                    {/* Contact Info Box */}
                    <div style={{ background: 'var(--bg-secondary, #0f172a)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--border, #334155)', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div>📧 <strong>Official Email:</strong> {c.email}</div>
                      <div>📞 <strong>Phone:</strong> {phone || 'Not specified'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
                    <button
                      onClick={() => navigate(`/messages?recipientId=${c._id}&name=${encodeURIComponent(c.name)}`)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      💬 Chat
                    </button>

                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        style={{
                          background: 'var(--bg-secondary, #0f172a)',
                          color: '#c084fc',
                          border: '1px solid var(--border, #334155)',
                          borderRadius: '8px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        📧 Email
                      </a>
                    )}

                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          borderRadius: '8px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        📱 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
