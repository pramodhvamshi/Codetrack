import React, { useState } from 'react';
import { feedApi } from '../../../api/feedApi';
import { LinkedInReactionPicker } from '../LinkedInReactionPicker';
import { TwitterNestedComments } from '../TwitterNestedComments';

export function GeneralPostCard({ item }) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount || 0);

  const getPostBadge = () => {
    switch (item.postType) {
      case 'announcement':
        return { label: '📢 Announcement', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      case 'placement':
      case 'placement_recap':
        return { label: '💼 Placement Drive', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'showcase':
        return { label: '🚀 Project Showcase', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
      case 'question':
        return { label: '❓ Question', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      case 'achievement':
        return { label: '🏆 Achievement', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      default:
        return { label: '💬 Post', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    }
  };

  const badge = getPostBadge();
  const meta = item.metadata || {};

  const initials = item.author?.name
    ? item.author.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      border: item.isPinned ? '2px solid #3b82f6' : '1px solid var(--border, #334155)',
      borderRadius: '16px',
      padding: '1.25rem',
      marginBottom: '1.25rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      position: 'relative'
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
          borderRadius: '999px'
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
          fontSize: '0.95rem'
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)' }}>
            {item.author?.name || 'Community Member'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            <span style={{
              background: badge.bg,
              color: badge.color,
              padding: '0.1rem 0.5rem',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.7rem'
            }}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      {item.title && (
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
          {item.title}
        </h3>
      )}

      {/* Content */}
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.6, whitespace: 'pre-line' }}>
        {item.content}
      </p>

      {/* Media Images */}
      {item.mediaUrls && item.mediaUrls.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: item.mediaUrls.length > 1 ? '1fr 1fr' : '1fr', gap: '0.5rem', marginBottom: '1rem', borderRadius: '10px', overflow: 'hidden' }}>
          {item.mediaUrls.map((url, idx) => (
            <img key={idx} src={url} alt="Post attachment" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px' }} />
          ))}
        </div>
      )}

      {/* Metadata Links */}
      {(meta.githubUrl || meta.liveUrl) && (
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
                textDecoration: 'none'
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
                textDecoration: 'none'
              }}
            >
              🌐 Live Demo
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
        <LinkedInReactionPicker
          postId={item.dbId}
          initialReactions={item.reactionCounts || {}}
          initialUserReaction={item.userReaction || null}
          initialTotal={item.totalReactions || item.likesCount || 0}
        />

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          💬 Comments ({commentCount})
        </button>
      </div>

      {/* Twitter Nested Comments Section */}
      <TwitterNestedComments
        postId={item.dbId}
        isOpen={showComments}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />
    </div>
  );
}
