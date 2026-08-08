import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AlumniProfileCard({ person }) {
  const navigate = useNavigate();

  const initials = person.name
    ? person.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  const social = person.socialLinks || {};

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      border: '1px solid var(--border, #334155)',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'transform 0.2s, border-color 0.2s',
      cursor: 'pointer'
    }}>
      <div>
        {/* Top Header Avatar & Info */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
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
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
              {person.name}
            </h3>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3b82f6' }}>
              {person.currentCompanyRole || 'Software Engineer'} {person.currentCompany ? `at ${person.currentCompany}` : ''}
            </div>
          </div>
        </div>

        {/* Batch, Branch, College & Location Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
          <span style={{
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            padding: '0.15rem 0.55rem',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 600
          }}>
            🏛️ {person.college || 'CBIT'}
          </span>
          {person.batch && (
            <span style={{
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              padding: '0.15rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              🎓 Batch {person.batch}
            </span>
          )}
          {person.branch && (
            <span style={{
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              padding: '0.15rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              💻 {person.branch}
            </span>
          )}
        </div>
      </div>

      {/* Footer Socials & Direct Message Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border, #334155)',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(person.linkedinUrl || social.linkedin) ? (
            <a
              href={person.linkedinUrl || social.linkedin}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              title="LinkedIn Profile"
              style={{
                background: '#0077b5',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              in
            </a>
          ) : null}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/messages?recipientId=${person._id || person.id}&name=${encodeURIComponent(person.name)}`);
          }}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
        >
          💬 Direct Message
        </button>
      </div>
    </div>
  );
}
