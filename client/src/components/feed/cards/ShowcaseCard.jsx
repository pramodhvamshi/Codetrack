import React, { useState } from 'react';

export function ShowcaseCard({ item }) {
  const [likesCount, setLikesCount] = useState(item.likesCount || 10);
  const [isLiked, setIsLiked] = useState(false);

  const meta = item.metadata || {};

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      border: '1px solid var(--border, #334155)',
      borderRadius: '16px',
      padding: '1.25rem',
      marginBottom: '1.25rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.1rem'
        }}>
          🚀
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)' }}>
            {item.author?.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
            Project Showcase • {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
        {item.title}
      </h3>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)' }}>
        {item.content}
      </p>

      {/* Tech stack badges */}
      {meta.techStack && meta.techStack.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
          {meta.techStack.map((tech, idx) => (
            <span
              key={idx}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        {meta.githubUrl && (
          <a
            href={meta.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--bg-secondary, #0f172a)',
              color: 'var(--text-primary, #f8fafc)',
              border: '1px solid var(--border, #334155)',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            💻 GitHub Repo
          </a>
        )}
        {meta.liveUrl && (
          <a
            href={meta.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#3b82f6',
              color: '#ffffff',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            🌐 Live Demo
          </a>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
        <button
          onClick={() => {
            setIsLiked(!isLiked);
            setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: isLiked ? '#ef4444' : 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          {isLiked ? '❤️' : '🤍'} {likesCount} Likes
        </button>
      </div>
    </div>
  );
}
