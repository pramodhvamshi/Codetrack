import React, { useState } from 'react';

export function AchievementCard({ item }) {
  const [likesCount, setLikesCount] = useState(item.likesCount || 15);
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
      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.1rem'
        }}>
          🏆
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)' }}>
            {item.author?.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
            Student Coding Achievement • {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Content */}
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
        {item.title}
      </h3>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)' }}>
        {item.content}
      </p>

      {/* Metrics Grid Badge */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '0.75rem',
        background: 'var(--bg-secondary, #0f172a)',
        padding: '0.85rem',
        borderRadius: '12px',
        marginBottom: '1rem',
        border: '1px solid var(--border, #334155)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)' }}>LeetCode</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{meta.lcSolved || 0}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)' }}>Total Solved</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{meta.totalSolved || 0}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)' }}>Streak</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>🔥 {meta.streak || 0}d</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)' }}>Score</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6' }}>{meta.totalScore || 0}</div>
        </div>
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
