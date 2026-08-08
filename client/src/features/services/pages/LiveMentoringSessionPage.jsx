import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { AppShell } from '../../../components/AppShell';
import { servicesApi } from '../../../api/servicesApi';


import {
  Video, Calendar, Clock, User, FileText, ArrowLeft, Save, Plus, ExternalLink, CheckCircle2, ShieldCheck, Link as LinkIcon
} from 'lucide-react';

export function LiveMentoringSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor states
  const [meetingNotes, setMeetingNotes] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docLinks, setDocLinks] = useState([]);

  const loadSession = async () => {
    setLoading(true);
    try {
      // Fetch mentoring sessions and find the matching sessionId
      const sessions = user?.role === 'student'
        ? await servicesApi.getStudentMentoring(token)
        : await servicesApi.getCoordinatorMentoring(token);

      const found = sessions.find((s) => s._id === sessionId);
      if (found) {
        setSession(found);
        setMeetingNotes(found.meetingNotes || '');
        setDocLinks(found.docLinks || []);
      }
    } catch (err) {
      console.error('Failed to load mentoring session page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && sessionId) loadSession();
  }, [token, sessionId, user]);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await servicesApi.saveMeetingNotes(
        sessionId,
        {
          meetingNotes,
          meetingUrl: session.meetingUrl,
          docLinks,
        },
        token
      );
      alert('Meeting notes successfully saved to student profile!');
      loadSession();
    } catch (err) {
      console.error(err);
      alert('Failed to save meeting notes.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocLink = () => {
    if (!docUrl.trim()) return;
    setDocLinks((prev) => [...prev, { title: docTitle || 'Resource Link', url: docUrl }]);
    setDocTitle('');
    setDocUrl('');
  };

  const isCoordinator = user?.role === 'coordinator' || user?.role === 'admin';

  return (
    <AppShell active="services">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
        <style>{`
          .ct-glass-panel {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.25);
            border-radius: 20px;
            padding: 1.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .ct-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .ct-form-label {
            font-size: 0.78rem;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .ct-form-input, .ct-form-textarea {
            background: #090d16 !important;
            border: 1px solid #1e293b !important;
            color: #f8fafc !important;
            padding: 0.75rem 1rem !important;
            border-radius: 12px !important;
            font-size: 0.88rem !important;
            outline: none !important;
            transition: border-color 0.2s, box-shadow 0.2s !important;
            width: 100%;
          }
          .ct-form-input:focus, .ct-form-textarea:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.3) !important;
          }
          .ct-btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            color: #ffffff;
            font-weight: 800;
            padding: 0.75rem 1.25rem;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: transform 0.15s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
          }
          .ct-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(37, 99, 235, 0.5);
          }
        `}</style>

        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to Mentoring Desk
        </button>

        {loading ? (
          <div className="ct-glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading mentoring session page...
          </div>
        ) : !session ? (
          <div className="ct-glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>
            Mentoring session details not found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header Title Card */}
            <div className="ct-glass-panel" style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={28} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>Live Mentoring Room & Session Portal</h1>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {session.category} • {session.date} ({session.timeSlot})
                  </p>
                </div>
              </div>

              {session.meetingUrl && (
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ct-btn-primary"
                  style={{ background: '#16a34a', textDecoration: 'none', padding: '0.75rem 1.4rem', fontSize: '0.9rem' }}
                >
                  <Video size={18} /> Launch Google Meet in New Tab ↗
                </a>
              )}
            </div>

            {/* Split Content View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

              {/* LEFT COLUMN: Google Meet & Session Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Video Conference Card */}
                <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Video size={20} color="#4ade80" /> Google Meet Video Room
                  </h3>

                  <div style={{ padding: '1.2rem', background: '#090d16', borderRadius: '14px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Session Verified
                      </span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                        {session.status}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>GMeet URL</span>
                      <p style={{ margin: '0.2rem 0 0 0', fontFamily: 'monospace', fontSize: '0.85rem', color: '#60a5fa', wordBreak: 'break-all' }}>
                        {session.meetingUrl || 'URL pending coordinator setup'}
                      </p>
                    </div>

                    {session.meetingUrl ? (
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ct-btn-primary"
                        style={{ textDecoration: 'none', marginTop: '0.4rem' }}
                      >
                        <Video size={16} /> Open GMeet Call Window ↗
                      </a>
                    ) : (
                      <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem' }}>
                        The coordinator will update the Google Meet link prior to session start.
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Meta Details Card */}
                <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} color="#60a5fa" /> Participant Information
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem' }}>
                    <div style={{ padding: '0.8rem', background: '#090d16', borderRadius: '12px', border: '1px solid #1e293b' }}>
                      <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Student Name & Email</strong>
                      <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>{session.studentId?.name || 'Student'}</span>
                      <span style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginTop: '2px' }}>{session.studentId?.email || 'N/A'} • MSS ID: {session.studentId?.mssId || 'N/A'}</span>
                    </div>

                    <div style={{ padding: '0.8rem', background: '#090d16', borderRadius: '12px', border: '1px solid #1e293b' }}>
                      <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mentor / Coordinator</strong>
                      <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>{session.mentorName || 'Placement Coordinator'}</span>
                    </div>

                    {session.notesText && (
                      <div style={{ padding: '0.8rem', background: '#090d16', borderRadius: '12px', border: '1px solid #1e293b' }}>
                        <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Student Discussion Goal</strong>
                        <p style={{ margin: '0.3rem 0 0 0', color: '#e2e8f0', lineHeight: 1.5 }}>{session.notesText}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Meeting Notes & Action Items Editor / Reader */}
              <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#c084fc" /> Mentoring Discussion Notes & Action Items
                </h3>

                {isCoordinator ? (
                  /* COORDINATOR LIVE EDITOR */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="ct-form-group">
                      <label className="ct-form-label">Raw Meeting Notes & Counsel</label>
                      <textarea
                        rows={8}
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        placeholder="Log student strengths, weaknesses, placement goals, DSA topics to focus on, and action items..."
                        className="ct-form-textarea"
                      />
                    </div>

                    <div className="ct-form-group">
                      <label className="ct-form-label">Attach Resource / Document Links</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Resource Title (e.g. Trees Sheet)"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="ct-form-input"
                          style={{ flex: 1 }}
                        />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={docUrl}
                          onChange={(e) => setDocUrl(e.target.value)}
                          className="ct-form-input"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={handleAddDocLink}
                          style={{ background: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '0 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {docLinks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                          {docLinks.map((d, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: '#090d16', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid #1e293b' }}>
                              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>📎 {d.title}</span>
                              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>
                                Open Link ↗
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSaveNotes}
                      disabled={saving}
                      className="ct-btn-primary"
                      style={{ padding: '0.85rem' }}
                    >
                      <Save size={18} /> {saving ? 'Saving...' : 'Save Notes to Student Profile'}
                    </button>
                  </div>
                ) : (
                  /* STUDENT READER VIEW */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#090d16', borderRadius: '14px', border: '1px solid #1e293b', color: '#f1f5f9', lineHeight: 1.6, fontSize: '0.9rem' }}>
                      <strong style={{ color: '#c084fc', display: 'block', marginBottom: '0.4rem' }}>Recorded Mentor Advice:</strong>
                      {meetingNotes ? (
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{meetingNotes}</p>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>The coordinator will record notes during or after the session.</span>
                      )}
                    </div>

                    {docLinks.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <strong style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase' }}>Attached Mentoring Resources</strong>
                        {docLinks.map((d, i) => (
                          <a
                            key={i}
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.9rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', color: '#60a5fa', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}
                          >
                            <span>📎 {d.title}</span>
                            <span>Open ↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
