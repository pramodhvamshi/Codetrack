import React from 'react';

export function JobReferralCard({ job, onApply, isStudent }) {
  const typeColors = {
    'Full-Time': '#3b82f6',
    'Part-Time': '#8b5cf6',
    'Internship': '#10b981',
    'Referral': '#ec4899',
    'Contract': '#f59e0b'
  };

  const typeColor = typeColors[job.employmentType] || '#3b82f6';

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      border: '1px solid var(--border, #334155)',
      borderRadius: '16px',
      padding: '1.25rem',
      marginBottom: '1.25rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      position: 'relative'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid var(--border, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: typeColor,
            flexShrink: 0
          }}>
            🏢
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
              {job.title}
            </h3>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
              {job.company} • <span style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>📍 {job.location}</span>
            </div>
          </div>
        </div>

        <span style={{
          background: `${typeColor}20`,
          color: typeColor,
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontWeight: 700,
          fontSize: '0.78rem',
          whiteSpace: 'nowrap'
        }}>
          {job.employmentType}
        </span>
      </div>

      {/* Description preview */}
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
        {job.description}
      </p>

      {/* Salary & Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        {job.salary && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
            💰 {job.salary}
          </div>
        )}

        {job.tags && job.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {job.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  background: 'var(--bg-secondary, #0f172a)',
                  color: 'var(--text-muted, #94a3b8)',
                  border: '1px solid var(--border, #334155)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border, #334155)',
        fontSize: '0.78rem',
        color: 'var(--text-muted, #64748b)'
      }}>
        <div>
          Posted by <strong>{job.author?.name || 'Alumnus'}</strong> ({job.author?.currentCompany || job.company}) • {new Date(job.createdAt).toLocaleDateString()}
        </div>

        {isStudent && (
          <div>
            {job.appliedStatus ? (
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                ✓ Applied ({job.appliedStatus.toUpperCase()})
              </span>
            ) : (
              <button
                onClick={() => onApply(job)}
                style={{
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 1.1rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                1-Click Apply 🚀
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
