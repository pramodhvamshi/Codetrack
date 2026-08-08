import React, { useState } from 'react';
import { feedApi } from '../../api/feedApi';

const REACTION_TYPES = [
  { key: 'like', label: 'Like', icon: '👍', color: '#3b82f6' },
  { key: 'celebrate', label: 'Celebrate', icon: '🎉', color: '#10b981' },
  { key: 'support', label: 'Support', icon: '💡', color: '#f59e0b' },
  { key: 'love', label: 'Love', icon: '❤️', color: '#ef4444' },
  { key: 'insightful', label: 'Insightful', icon: '👏', color: '#8b5cf6' }
];

export function LinkedInReactionPicker({ postId, initialReactions = {}, initialUserReaction = null, initialTotal = 0 }) {
  const [showPicker, setShowPicker] = useState(false);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [reactionCounts, setReactionCounts] = useState({
    like: initialReactions.like || 0,
    celebrate: initialReactions.celebrate || 0,
    support: initialReactions.support || 0,
    love: initialReactions.love || 0,
    insightful: initialReactions.insightful || 0
  });
  const [totalReactions, setTotalReactions] = useState(initialTotal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectReaction = async (type) => {
    if (!postId || isSubmitting) return;
    setIsSubmitting(true);
    setShowPicker(false);

    try {
      const res = await feedApi.reactToPost(postId, type);
      if (res.success) {
        setUserReaction(res.userReaction);
        if (res.reactionCounts) {
          setReactionCounts(res.reactionCounts);
        }
        setTotalReactions(res.totalReactions);
      }
    } catch (err) {
      console.error('Failed to update reaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentObj = REACTION_TYPES.find(r => r.key === userReaction);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Reaction Hover Popup */}
      {showPicker && (
        <div
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '8px',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '999px',
            padding: '0.4rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
            zIndex: 100,
            animation: 'fadeInUp 0.15s ease-out'
          }}
        >
          {REACTION_TYPES.map(r => (
            <button
              key={r.key}
              onClick={() => handleSelectReaction(r.key)}
              title={r.label}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                padding: '0.1rem 0.2rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.35) translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
            >
              {r.icon}
            </button>
          ))}
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onMouseEnter={() => setShowPicker(true)}
        onClick={() => handleSelectReaction(userReaction || 'like')}
        style={{
          background: 'none',
          border: 'none',
          color: currentObj ? currentObj.color : 'var(--text-muted, #94a3b8)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          padding: '0.3rem 0.5rem',
          borderRadius: '6px',
          transition: 'background 0.15s'
        }}
      >
        <span>{currentObj ? currentObj.icon : '👍'}</span>
        <span>{currentObj ? currentObj.label : 'React'}</span>
        {totalReactions > 0 && (
          <span style={{ fontSize: '0.78rem', background: 'var(--bg-secondary, #0f172a)', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
            {totalReactions}
          </span>
        )}
      </button>

      {/* Reaction Counts Pills */}
      {totalReactions > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.75rem' }}>
          {REACTION_TYPES.map(r => {
            const count = reactionCounts[r.key] || 0;
            if (count === 0) return null;
            return (
              <span
                key={r.key}
                title={`${count} ${r.label} reactions`}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #94a3b8)',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                {r.icon} {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
