import React, { useState, useEffect } from 'react';
import { feedApi } from '../../api/feedApi';

export function TwitterNestedComments({ postId, isOpen, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadComments = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const res = await feedApi.getComments(postId);
      if (res.success) {
        setComments(res.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const handlePostTopComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await feedApi.addComment(postId, newCommentText.trim());
      if (res.success) {
        setComments(prev => [...prev, res.comment]);
        setNewCommentText('');
        if (onCommentAdded) onCommentAdded();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handlePostReply = async (parentCommentId) => {
    if (!replyText.trim()) return;

    try {
      const res = await feedApi.addComment(postId, replyText.trim(), parentCommentId);
      if (res.success) {
        setComments(prev => [...prev, res.comment]);
        setReplyText('');
        setReplyingToId(null);
        if (onCommentAdded) onCommentAdded();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    try {
      const res = await feedApi.likeComment(commentId);
      if (res.success) {
        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return { ...c, likesCount: res.likesCount, isLikedByMe: res.isLiked };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  if (!isOpen) return null;

  // Organize comments into top-level and children map
  const topLevel = comments.filter(c => !c.parentCommentId);
  const childrenMap = {};
  comments.forEach(c => {
    if (c.parentCommentId) {
      if (!childrenMap[c.parentCommentId]) {
        childrenMap[c.parentCommentId] = [];
      }
      childrenMap[c.parentCommentId].push(c);
    }
  });

  const renderCommentItem = (comment, level = 0) => {
    const initials = comment.author?.name
      ? comment.author.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'U';

    const replies = childrenMap[comment.id] || [];

    return (
      <div key={comment.id} style={{ marginLeft: level > 0 ? '1.5rem' : '0', marginTop: '0.85rem', position: 'relative' }}>
        {/* Connection line for nested replies */}
        {level > 0 && (
          <div style={{
            position: 'absolute',
            left: '-1rem',
            top: '0',
            bottom: '0',
            width: '2px',
            background: 'var(--border, #334155)'
          }} />
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            flexShrink: 0
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, background: 'var(--bg-secondary, #0f172a)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border, #334155)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary, #f8fafc)' }}>
                  {comment.author?.name || 'User'}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  padding: '0.05rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {comment.author?.role || 'student'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.5 }}>
              {comment.content}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
              <button
                onClick={() => handleToggleCommentLike(comment.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: comment.isLikedByMe ? '#ef4444' : 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                {comment.isLikedByMe ? '❤️' : '🤍'} {comment.likesCount}
              </button>

              <button
                onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                💬 Reply
              </button>
            </div>

            {/* Inline Reply Box */}
            {replyingToId === comment.id && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder={`Reply to @${comment.author?.name || 'user'}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(comment.id); }}
                  style={{
                    flex: 1,
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid var(--border, #334155)',
                    color: 'var(--text-primary, #f8fafc)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handlePostReply(comment.id)}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recursive Sub-replies */}
        {replies.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            {replies.map(child => renderCommentItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid var(--border, #334155)'
    }}>
      {/* Top Level Comment Composer */}
      <form onSubmit={handlePostTopComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Write a comment or reply to this post..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--bg-secondary, #0f172a)',
            border: '1px solid var(--border, #334155)',
            color: 'var(--text-primary, #f8fafc)',
            borderRadius: '999px',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Comment
        </button>
      </form>

      {/* Loading indicator */}
      {loading && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', textAlign: 'center', padding: '0.5rem' }}>Loading discussion thread...</div>}

      {/* Comments List */}
      {topLevel.length === 0 && !loading ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        topLevel.map(comment => renderCommentItem(comment, 0))
      )}
    </div>
  );
}
