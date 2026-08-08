import React, { useState } from 'react';
import { feedApi } from '../../api/feedApi';

export function CreateAnnouncementModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [bannerUrl, setBannerUrl] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await feedApi.createAnnouncement({
        title,
        content,
        category,
        bannerUrl,
        registrationLink,
        isPinned
      });

      if (res.success) {
        onSuccess();
        onClose();
        setTitle('');
        setContent('');
        setBannerUrl('');
        setRegistrationLink('');
        setIsPinned(false);
      } else {
        setError(res.message || 'Failed to create announcement');
      }
    } catch (err) {
      console.error('Error posting announcement:', err);
      setError('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card, #1e293b)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #f8fafc)' }}>
            📢 Post New Announcement
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
              Announcement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart India Hackathon 2026 Registration"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="hackathon">Hackathon</option>
                <option value="placement">Placement</option>
                <option value="workshop">Workshop</option>
                <option value="urgent">Urgent Notice</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Registration Link (Optional)
              </label>
              <input
                type="url"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
              Banner Image URL (Optional)
            </label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
              Details & Instructions *
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write announcement details here..."
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            <label htmlFor="isPinned" style={{ fontSize: '0.85rem', color: 'var(--text-primary, #f8fafc)', cursor: 'pointer' }}>
              Pin this announcement to top of feed
            </label>
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                border: '1px solid var(--border, #334155)',
                color: 'var(--text-muted, #94a3b8)',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.4rem',
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Posting...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
