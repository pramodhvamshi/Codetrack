import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'webinar' | 'hackathon' | 'workshop'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    type: 'webinar',
    description: '',
    meetingUrl: '',
    eventDate: '',
    isHackathon: false,
    themes: '',
    submissionUrl: '',
    prizePool: '',
    maxTeamSize: 4
  });

  const canCreate = user && (user.role === 'alumni' || user.role === 'admin' || user.role === 'coordinator');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getJson('/v2/events');
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRsvp = async (eventId) => {
    try {
      const res = await api.postJson(`/v2/events/${eventId}/rsvp`, {});
      if (res.success) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to RSVP:', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.eventDate) return;

    try {
      const res = await api.postJson('/v2/events', {
        ...form,
        isHackathon: form.type === 'hackathon' || form.isHackathon
      });
      if (res.success) {
        setIsModalOpen(false);
        setForm({
          title: '',
          type: 'webinar',
          description: '',
          meetingUrl: '',
          eventDate: '',
          isHackathon: false,
          themes: '',
          submissionUrl: '',
          prizePool: '',
          maxTeamSize: 4
        });
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterType === 'hackathon') return e.isHackathon || e.type === 'hackathon';
    if (filterType !== 'all') return e.type === filterType;
    return true;
  });

  return (
    <AppShell active="events">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              📅 Campus Events & Alumni Hackathons
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Join live Google Meet / Zoom workshops, tech talks, AMAs, and hackathons hosted by Medha alumni & coordinators
            </p>
          </div>

          {canCreate && (
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
              ➕ Schedule Event / Hackathon
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border, #334155)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
          {[
            { key: 'all', label: '🌟 All Events' },
            { key: 'hackathon', label: '🚀 Hackathons' },
            { key: 'webinar', label: '💻 Webinars & AMAs' },
            { key: 'workshop', label: '🛠️ Hands-on Workshops' },
            { key: 'techtalk', label: '🎤 Tech Talks' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              style={{
                background: filterType === tab.key ? '#3b82f6' : 'var(--bg-card, #1e293b)',
                color: filterType === tab.key ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '999px',
                padding: '0.45rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading campus events...</div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📅</span>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>No Scheduled Events Found</h3>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Check back soon or schedule a new event to connect with students!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {filteredEvents.map(evt => {
              const userIdStr = user?._id || user?.id;
              const hasRsvped = evt.rsvps?.some(r => String(r._id || r) === String(userIdStr));
              const isHackathon = evt.isHackathon || evt.type === 'hackathon';
              const dateStr = evt.eventDate ? new Date(evt.eventDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBA';

              return (
                <div
                  key={evt._id}
                  style={{
                    background: 'var(--bg-card, #1e293b)',
                    border: isHackathon ? '1px solid #8b5cf6' : '1px solid var(--border, #334155)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span style={{
                        background: isHackathon ? 'rgba(139, 92, 246, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                        color: isHackathon ? '#c084fc' : '#60a5fa',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {isHackathon ? '🚀 Hackathon' : evt.type}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                        👥 {evt.rsvps?.length || 0} Attending
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                      {evt.title}
                    </h3>

                    <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.65rem' }}>
                      Host: {evt.host?.name || 'Alumnus'} {evt.host?.currentCompany ? `(${evt.host.currentCompany})` : ''}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      ⏰ {dateStr}
                    </div>

                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {evt.description}
                    </p>

                    {isHackathon && (
                      <div style={{ background: 'var(--bg-secondary, #0f172a)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border, #334155)' }}>
                        {evt.prizePool && <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>🏆 Prize Pool: {evt.prizePool}</div>}
                        {evt.themes && evt.themes.length > 0 && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Themes: {evt.themes.join(', ')}</div>}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border, #334155)', flexWrap: 'wrap' }}>
                    {evt.meetingUrl && (
                      <a
                        href={evt.meetingUrl}
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
                        🔗 Join Meet / Zoom
                      </a>
                    )}

                    {evt.submissionUrl && (
                      <a
                        href={evt.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#8b5cf6',
                          color: '#ffffff',
                          textDecoration: 'none',
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}
                      >
                        📤 Submit Project
                      </a>
                    )}

                    <button
                      onClick={() => handleRsvp(evt._id)}
                      style={{
                        background: hasRsvped ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-secondary, #0f172a)',
                        color: hasRsvped ? '#60a5fa' : '#cbd5e1',
                        border: '1px solid var(--border, #334155)',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {hasRsvped ? '✅ Attending' : '⭐ RSVP'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SCHEDULE EVENT MODAL */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '540px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>📅 Schedule Event or Hackathon</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleCreateEvent} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Design Workshop / Hackathon 2026"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Event Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    >
                      <option value="webinar">💻 Webinar / AMA</option>
                      <option value="workshop">🛠️ Workshop</option>
                      <option value="techtalk">🎤 Tech Talk</option>
                      <option value="hackathon">🚀 Hackathon</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.eventDate}
                      onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Google Meet / Zoom URL</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz-abc-def"
                    value={form.meetingUrl}
                    onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what will be covered or hackathon rules..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                {form.type === 'hackathon' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Prize Pool (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹25,000 + Goodies"
                        value={form.prizePool}
                        onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Submission URL</label>
                      <input
                        type="url"
                        placeholder="e.g. GitHub submission link"
                        value={form.submissionUrl}
                        onChange={(e) => setForm({ ...form, submissionUrl: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.55rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Publish Event</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
