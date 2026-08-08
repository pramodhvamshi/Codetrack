import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';

export function InterviewExperiencesPage() {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);

  // Form State
  const [form, setForm] = useState({
    company: '',
    role: 'Software Engineer',
    difficulty: 'Medium',
    outcome: 'Selected',
    overview: '',
    rounds: [{ roundName: 'Round 1: Online Assessment', details: '' }],
    tips: ''
  });

  const canPublish = user && (user.role === 'alumni' || user.role === 'admin' || user.role === 'coordinator');

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const res = await api.getJson(`/v2/interview-experiences?query=${encodeURIComponent(query)}&difficulty=${difficultyFilter === 'all' ? '' : difficultyFilter}`);
      if (res.success && res.data) {
        setExperiences(res.data);
      }
    } catch (err) {
      console.error('Failed to load interview experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [difficultyFilter]);

  const handleAddRound = () => {
    setForm(prev => ({
      ...prev,
      rounds: [...prev.rounds, { roundName: `Round ${prev.rounds.length + 1}`, details: '' }]
    }));
  };

  const handleRoundChange = (index, field, value) => {
    setForm(prev => {
      const newRounds = [...prev.rounds];
      newRounds[index][field] = value;
      return { ...prev, rounds: newRounds };
    });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.company || !form.role || !form.overview) return;

    try {
      const res = await api.postJson('/v2/interview-experiences', form);
      if (res.success) {
        setIsModalOpen(false);
        setForm({
          company: '',
          role: 'Software Engineer',
          difficulty: 'Medium',
          outcome: 'Selected',
          overview: '',
          rounds: [{ roundName: 'Round 1: Online Assessment', details: '' }],
          tips: ''
        });
        fetchExperiences();
      }
    } catch (err) {
      console.error('Failed to publish experience:', err);
    }
  };

  return (
    <AppShell active="interview-experiences">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              📝 Alumni Interview Experiences Hub
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Real round-by-round interview breakdowns, coding questions asked, and prep advice from placed alumni
            </p>
          </div>

          {canPublish && (
            <button
              onClick={() => setIsModalOpen(true)}
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
              ➕ Share Interview Experience
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search company (e.g. Amazon, Google, TCS)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExperiences()}
            style={{
              padding: '0.55rem 0.95rem',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '999px',
              color: '#f8fafc',
              fontSize: '0.88rem',
              width: '260px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['all', 'Easy', 'Medium', 'Hard'].map(diff => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                style={{
                  background: difficultyFilter === diff ? '#3b82f6' : 'var(--bg-card, #1e293b)',
                  color: difficultyFilter === diff ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '999px',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {diff === 'all' ? '🌟 All Difficulties' : diff}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Stream */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading interview experiences...</div>
        ) : experiences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>No Experiences Found</h3>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Try searching another company name or publish your experience!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {experiences.map(exp => {
              const isExpanded = selectedExp === exp._id;

              return (
                <div
                  key={exp._id}
                  style={{
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                          🏢 {exp.company}
                        </h2>
                        <span style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: exp.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.2)' : exp.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: exp.difficulty === 'Easy' ? '#10b981' : exp.difficulty === 'Hard' ? '#f87171' : '#f59e0b'
                        }}>
                          {exp.difficulty}
                        </span>
                        <span style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: exp.outcome === 'Selected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: exp.outcome === 'Selected' ? '#10b981' : '#94a3b8'
                        }}>
                          {exp.outcome}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                        {exp.role} • Shared by {exp.author?.name || 'Alumnus'} ({exp.author?.batch ? `Batch ${exp.author.batch}` : 'Alumni'})
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedExp(isExpanded ? null : exp._id)}
                      style={{
                        background: 'var(--bg-secondary, #0f172a)',
                        color: '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isExpanded ? 'Collapse ▲' : 'View Full Experience ▼'}
                    </button>
                  </div>

                  <p style={{ margin: '0.85rem 0 0 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {exp.overview}
                  </p>

                  {/* Expanded Round-by-Round Breakdown */}
                  {isExpanded && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border, #334155)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                        📋 Round-by-Round Breakdown ({exp.rounds?.length || 0} Rounds)
                      </h4>

                      {exp.rounds?.map((rnd, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '12px', padding: '1rem' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.35rem' }}>
                            {rnd.roundName}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.55, whitespace: 'pre-line' }}>
                            {rnd.details}
                          </div>
                        </div>
                      ))}

                      {exp.tips && (
                        <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '1rem' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.35rem' }}>
                            💡 Preparation Tips & Advice for Juniors
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                            {exp.tips}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PUBLISH EXPERIENCE MODAL */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>📝 Share Interview Experience</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handlePublish} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amazon / Microsoft"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Role Offered</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SDE-1 / Frontend Engineer"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Overall Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Selection Outcome</label>
                    <select
                      value={form.outcome}
                      onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    >
                      <option value="Selected">Selected ✅</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>General Overview</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide a brief summary of the interview process..."
                    value={form.overview}
                    onChange={(e) => setForm({ ...form, overview: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Rounds Input Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>Rounds Breakdown</label>
                    <button type="button" onClick={handleAddRound} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>+ Add Round</button>
                  </div>

                  {form.rounds.map((rnd, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-secondary, #0f172a)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.65rem', border: '1px solid var(--border, #334155)' }}>
                      <input
                        type="text"
                        placeholder="Round Title (e.g. Round 1: Coding & OA)"
                        value={rnd.roundName}
                        onChange={(e) => handleRoundChange(idx, 'roundName', e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.65rem', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '6px', color: '#f8fafc', fontSize: '0.82rem', marginBottom: '0.5rem' }}
                      />
                      <textarea
                        rows={2}
                        placeholder="Questions asked, topics covered, solutions expected..."
                        value={rnd.details}
                        onChange={(e) => handleRoundChange(idx, 'details', e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.65rem', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '6px', color: '#f8fafc', fontSize: '0.82rem' }}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Tips & Advice for Juniors</label>
                  <textarea
                    rows={2}
                    placeholder="Key topics to focus on, mistake to avoid..."
                    value={form.tips}
                    onChange={(e) => setForm({ ...form, tips: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.55rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Publish Experience</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
