import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';

export function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    category: 'DSA'
  });

  const canShare = user && (user.role === 'alumni' || user.role === 'admin' || user.role === 'coordinator');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.getJson(`/v2/resources?category=${category}&query=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        setResources(res.data);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [category]);

  const handleLike = async (id) => {
    try {
      const res = await api.postJson(`/v2/resources/${id}/like`, {});
      if (res.success) {
        fetchResources();
      }
    } catch (err) {
      console.error('Failed to like resource:', err);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!form.title || !form.link || !form.category) return;

    try {
      const res = await api.postJson('/v2/resources', form);
      if (res.success) {
        setIsModalOpen(false);
        setForm({ title: '', description: '', link: '', category: 'DSA' });
        fetchResources();
      }
    } catch (err) {
      console.error('Failed to share resource:', err);
    }
  };

  return (
    <AppShell active="resources">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              📚 Alumni Resource Sharing Hub
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Curated Google Drive folders, DSA roadmaps, GitHub repos, cheat sheets, and course links shared by Medha alumni
            </p>
          </div>

          {canShare && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '0.65rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              ➕ Share Useful Resource
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search resource title or topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
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
            {['all', 'DSA', 'System Design', 'Web Dev', 'DevOps', 'AI/ML', 'Interview Prep', 'Other'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  background: category === cat ? '#10b981' : 'var(--bg-card, #1e293b)',
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
                {cat === 'all' ? '🌟 All Domains' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading resource library...</div>
        ) : resources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📚</span>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>No Resources Found</h3>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              No shared materials in this category yet. Share one above!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {resources.map(res => {
              const userIdStr = user?._id || user?.id;
              const hasLiked = res.likes?.some(l => String(l) === String(userIdStr));

              return (
                <div
                  key={res._id}
                  style={{
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {res.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                      {res.title}
                    </h3>

                    <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Shared by {res.author?.name || 'Alumnus'} ({res.author?.currentCompany || 'Alumni'})
                    </div>

                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                      {res.description || 'No additional description provided.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid var(--border, #334155)' }}>
                    <a
                      href={res.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      🔗 Open Resource
                    </a>

                    <button
                      onClick={() => handleLike(res._id)}
                      style={{
                        background: hasLiked ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary, #0f172a)',
                        color: hasLiked ? '#10b981' : '#94a3b8',
                        border: '1px solid var(--border, #334155)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ❤️ {res.likes?.length || 0}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SHARE RESOURCE MODAL */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>📚 Share Useful Resource</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleShare} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Resource Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete System Design Roadmap & Notes Drive"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Domain Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    >
                      <option value="DSA">DSA</option>
                      <option value="System Design">System Design</option>
                      <option value="Web Dev">Web Dev</option>
                      <option value="DevOps">DevOps</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Interview Prep">Interview Prep</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Resource Link / URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/..."
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what this resource includes..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.55rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Publish Resource</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
