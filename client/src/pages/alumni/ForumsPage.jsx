import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';

export function ForumsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Form State
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.getJson(`/v2/forums?category=${category}&query=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        setPosts(res.data);
        if (activePost) {
          const updatedActive = res.data.find(p => p._id === activePost._id);
          if (updatedActive) setActivePost(updatedActive);
        }
      }
    } catch (err) {
      console.error('Failed to load forum posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const handleUpvote = async (postId, e) => {
    e.stopPropagation();
    try {
      const res = await api.postJson(`/v2/forums/${postId}/upvote`, {});
      if (res.success) {
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to upvote thread:', err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;

    try {
      const res = await api.postJson('/v2/forums', newPost);
      if (res.success) {
        setIsCreateModalOpen(false);
        setNewPost({ title: '', content: '', category: 'General' });
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activePost) return;

    try {
      const res = await api.postJson(`/v2/forums/${activePost._id}/reply`, { content: replyText });
      if (res.success) {
        setReplyText('');
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  return (
    <AppShell active="forums">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              💡 Campus & Alumni Discussion Forum
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Ask doubts, discuss system design & DSA, placement preparation, and get answers from experienced alumni
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '0.65rem 1.4rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}
          >
            ➕ Start Discussion Thread
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search discussion topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
            style={{
              padding: '0.55rem 0.95rem',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '999px',
              color: '#f8fafc',
              fontSize: '0.88rem',
              width: '240px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
            {['all', 'DSA', 'System Design', 'Placements', 'Career Advice', 'Higher Studies', 'General'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  background: category === cat ? '#3b82f6' : 'var(--bg-card, #1e293b)',
                  color: category === cat ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '999px',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'all' ? '🌟 All Topics' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: activePost ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Posts Feed Column */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading forum discussions...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>💡</span>
                <h3 style={{ margin: 0, color: '#f8fafc' }}>No Threads Yet</h3>
                <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Be the first to start a topic or ask a doubt above!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map(p => {
                  const isSelected = activePost?._id === p._id;
                  const userIdStr = user?._id || user?.id;
                  const hasUpvoted = p.upvotes?.some(u => String(u) === String(userIdStr));

                  return (
                    <div
                      key={p._id}
                      onClick={() => setActivePost(p)}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card, #1e293b)',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border, #334155)',
                        borderRadius: '14px',
                        padding: '1.15rem',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, border-color 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {p.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                        {p.title}
                      </h3>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.65rem' }}>
                        By {p.author?.name || 'User'} ({p.author?.role === 'alumni' ? `🎓 Alumni - ${p.author?.currentCompany || ''}` : p.author?.role || 'Student'})
                      </div>

                      <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.content}
                      </p>

                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                        <button
                          onClick={(e) => handleUpvote(p._id, e)}
                          style={{
                            background: hasUpvoted ? 'rgba(59, 130, 246, 0.25)' : 'var(--bg-secondary, #0f172a)',
                            color: hasUpvoted ? '#60a5fa' : '#94a3b8',
                            border: '1px solid var(--border, #334155)',
                            borderRadius: '999px',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          👍 {p.upvotes?.length || 0} Upvotes
                        </button>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                          💬 {p.replies?.length || 0} Replies
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Thread Detail Column */}
          {activePost && (
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '16px', padding: '1.25rem', height: 'fit-content', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {activePost.category}
                </span>
                <button onClick={() => setActivePost(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
              </div>

              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {activePost.title}
              </h2>

              <div style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 600, marginBottom: '1rem' }}>
                {activePost.author?.name} • {activePost.author?.role === 'alumni' ? `🎓 Alumni (${activePost.author?.currentCompany || 'Software Engineer'})` : 'Student'}
              </div>

              <div style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, background: 'var(--bg-secondary, #0f172a)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                {activePost.content}
              </div>

              {/* Replies Header */}
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                💬 Discussion Replies ({activePost.replies?.length || 0})
              </h4>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Write a reply or answer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: '0.55rem 0.85rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                />
                <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Reply</button>
              </form>

              {/* Replies List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {activePost.replies?.map((rep, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: rep.author?.role === 'alumni' ? '#10b981' : '#60a5fa', marginBottom: '0.25rem' }}>
                      {rep.author?.name || 'User'} {rep.author?.role === 'alumni' ? '🎓 Alumni' : ''}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {rep.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CREATE POST MODAL */}
        {isCreateModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>💡 Start Discussion Topic</h3>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleCreatePost} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Topic Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How to prepare for Amazon LLD Round?"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  >
                    <option value="DSA">DSA</option>
                    <option value="System Design">System Design</option>
                    <option value="Placements">Placements</option>
                    <option value="Career Advice">Career Advice</option>
                    <option value="Higher Studies">Higher Studies</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Discussion Body / Question Details</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe your question or topic in detail..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.55rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Post Thread</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
