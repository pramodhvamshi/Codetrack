import React, { useState } from 'react';
import { feedApi } from '../../../api/feedApi';

export function AnnouncementCard({ item }) {
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);
  const [isLiked, setIsLiked] = useState(item.isLikedByMe || false);

  const handleLike = async () => {
    try {
      if (item.dbId) {
        const res = await feedApi.toggleLike(item.dbId);
        if (res.success) {
          setLikesCount(res.likesCount);
          setIsLiked(res.isLiked);
        }
      }
    } catch (err) {
      console.error('Failed to like announcement:', err);
    }
  };

  const categoryColors = {
    hackathon: '#ec4899',
    event: '#3b82f6',
    placement: '#10b981',
    workshop: '#8b5cf6',
    urgent: '#ef4444',
    general: '#64748b'
  };

  const badgeColor = categoryColors[item.category] || categoryColors.general;

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      border: item.isPinned ? '2px solid #3b82f6' : '1px solid var(--border, #334155)',
      borderRadius: '16px',
      padding: '1.25rem',
      marginBottom: '1.25rem',
      position: 'relative',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    }}>
      {item.isPinned && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '16px',
          background: '#3b82f6',
          color: '#ffffff',
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '0.2rem 0.65rem',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          📌 Pinned Announcement
        </div>
      )}

      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem'
        }}>
          📢
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)' }}>
            {item.author?.name || 'Coordinator'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            <span style={{
              background: `${badgeColor}20`,
              color: badgeColor,
              padding: '0.1rem 0.5rem',
              borderRadius: '4px',
              fontWeight: 600,
              textTransform: 'capitalize',
              fontSize: '0.7rem'
            }}>
              {item.category}
            </span>
          </div>
        </div>
      </div>

      {/* Title & Body */}
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
        {item.title}
      </h3>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.6, whitespace: 'pre-line' }}>
        {item.content}
      </p>

      {/* Banner Graphic if attached */}
      {item.bannerUrl && (
        <div style={{ marginBottom: '1rem', borderRadius: '10px', overflow: 'hidden', maxHeight: '300px' }}>
          <img src={item.bannerUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Registration Link / Event Action */}
      {item.registrationLink && (
        <div style={{ marginBottom: '1rem' }}>
          <a
            href={item.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#3b82f6',
              color: '#ffffff',
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            🚀 Register Now
          </a>
        </div>
      )}

      {/* Interaction Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
        <button
          onClick={handleLike}
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
