import React, { useState } from 'react';
import { feedApi } from '../../api/feedApi';

export function StartPostComposer({ user, onPostCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [postType, setPostType] = useState('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [hackerRankUrl, setHackerRankUrl] = useState('');
  const [roundsText, setRoundsText] = useState('');

  const isCoordinatorOrAdmin = user && (user.role === 'coordinator' || user.role === 'admin');

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    try {
      const res = await feedApi.uploadMedia(formData);
      if (res.success && res.url) {
        setMediaUrls(prev => [...prev, res.url]);
      } else {
        setError(res.message || 'Image upload failed');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write something in your post');
      return;
    }

    setLoading(true);
    setError('');

    // Parse rounds text format: "OA: 30 MCQs | Tech 1: DSA Coding | HR: Behavioral"
    const parsedRounds = roundsText
      ? roundsText.split('|').map(item => {
          const parts = item.split(':');
          return {
            name: parts[0] ? parts[0].trim() : 'Round',
            description: parts[1] ? parts[1].trim() : parts[0].trim()
          };
        })
      : [];

    try {
      const res = await feedApi.createPost({
        postType,
        title,
        content,
        category: postType === 'placement' ? 'placement' : category,
        mediaUrls,
        metadata: {
          githubUrl,
          liveUrl,
          company,
          role,
          salary
        },
        placementMetadata: {
          company,
          role,
          jdText: content,
          hackerRankUrl,
          rounds: parsedRounds
        }
      });

      if (res.success) {
        onPostCreated();
        setIsOpen(false);
        setContent('');
        setTitle('');
        setGithubUrl('');
        setLiveUrl('');
        setCompany('');
        setRole('');
        setSalary('');
        setHackerRankUrl('');
        setRoundsText('');
        setMediaUrls([]);
        setPostType('general');
      } else {
        setError(res.message || 'Failed to publish post');
      }
    } catch (err) {
      console.error('Error publishing post:', err);
      setError('Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      border: '1px solid var(--border, #334155)',
      borderRadius: '16px',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    }}>
      {/* LinkedIn style top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
          fontSize: '0.9rem',
          flexShrink: 0
        }}>
          {initials}
        </div>

        <button
          onClick={() => setIsOpen(true)}
          style={{
            flex: 1,
            textAlign: 'left',
            background: 'var(--bg-secondary, #0f172a)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '999px',
            padding: '0.75rem 1.25rem',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
        >
          Start a post, share a project, or ask a question...
        </button>
      </div>

      {/* Quick Action Badges */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: '0.85rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border, #334155)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => { setPostType('placement'); setIsOpen(true); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          💼 Placement Drive
        </button>

        <button
          onClick={() => { setPostType('showcase'); setIsOpen(true); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          🚀 Project Showcase
        </button>

        <button
          onClick={() => { setPostType('question'); setIsOpen(true); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#f59e0b',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          ❓ Ask Question
        </button>

        <button
          onClick={() => { setPostType('general'); setIsOpen(true); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#10b981',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          📷 Photo Upload
        </button>

        {isCoordinatorOrAdmin && (
          <button
            onClick={() => { setPostType('announcement'); setIsOpen(true); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            📢 Announcement
          </button>
        )}
      </div>

      {/* CREATE POST MODAL */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.2rem',
              borderBottom: '1px solid var(--border, #334155)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Post to Anyone • Medha Ecosystem
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              {/* Post Type Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                  Post Type
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
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
                  <option value="general">💬 General Community Post</option>
                  <option value="placement">💼 Placement Drive & Recaps</option>
                  <option value="showcase">🚀 Project Showcase</option>
                  <option value="question">❓ Question / Help Needed</option>
                  {isCoordinatorOrAdmin && <option value="announcement">📢 Official Announcement</option>}
                </select>
              </div>

              {/* Title (for showcase, placement, or announcement) */}
              {(postType === 'showcase' || postType === 'announcement' || postType === 'placement') && (
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={postType === 'placement' ? "Company & Drive Title (e.g. Google Campus Recruitment Drive 2026)" : postType === 'showcase' ? "Project Title (e.g. AI Resume Analyzer)" : "Announcement Title"}
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
              )}

              {/* Placement Specific Input Fields */}
              {postType === 'placement' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', background: 'rgba(59, 130, 246, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Company Name (e.g. Amazon)"
                      style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                    />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Role (e.g. SDE-1)"
                      style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                    />
                  </div>

                  <input
                    type="url"
                    value={hackerRankUrl}
                    onChange={(e) => setHackerRankUrl(e.target.value)}
                    placeholder="HackerRank Practice Contest Link (optional)"
                    style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                  />

                  <input
                    type="text"
                    value={roundsText}
                    onChange={(e) => setRoundsText(e.target.value)}
                    placeholder="Rounds Flow (e.g. OA: 30 MCQs | Tech 1: DSA Trees | HR: Culture Fit)"
                    style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {/* Main Content Textarea */}
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What do you want to talk about? Share your achievements, project updates, or questions..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary, #0f172a)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '10px',
                    color: 'var(--text-primary, #f8fafc)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Links if Showcase */}
              {postType === 'showcase' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="GitHub Repo URL"
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: 'var(--bg-secondary, #0f172a)',
                      border: '1px solid var(--border, #334155)',
                      borderRadius: '8px',
                      color: 'var(--text-primary, #f8fafc)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="Live Demo URL"
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: 'var(--bg-secondary, #0f172a)',
                      border: '1px solid var(--border, #334155)',
                      borderRadius: '8px',
                      color: 'var(--text-primary, #f8fafc)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {/* Image Previews */}
              {mediaUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {mediaUrls.map((url, idx) => (
                    <div key={idx} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3b82f6', position: 'relative' }}>
                      <img src={url} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Direct File Picker Upload */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#3b82f6',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  📷 {uploading ? 'Uploading to Cloudinary...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '0.55rem 1.1rem',
                      background: 'transparent',
                      border: '1px solid var(--border, #334155)',
                      color: 'var(--text-muted, #94a3b8)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    style={{
                      padding: '0.55rem 1.4rem',
                      background: '#3b82f6',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: loading || uploading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
