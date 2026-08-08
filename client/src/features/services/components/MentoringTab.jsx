import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesApi } from '../../../api/servicesApi';
import { GoogleCalendarView } from './GoogleCalendarView';
import { 
  Calendar as CalendarIcon, Clock, Video, User, CheckCircle2, Edit3, Plus, ExternalLink, Save, Check, X 
} from 'lucide-react';

export function MentoringTab({ role, token }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Student booking form state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [category, setCategory] = useState('Placement Prep');
  const [notesText, setNotesText] = useState('');

  // Coordinator modification modal state
  const [activeSession, setActiveSession] = useState(null);
  const [modDate, setModDate] = useState('');
  const [modSlot, setModSlot] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  // Coordinator meeting notes modal state
  const [notesModalSession, setNotesModalSession] = useState(null);
  const [liveMeetingSession, setLiveMeetingSession] = useState(null);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docLinks, setDocLinks] = useState([]);

  const loadSlots = async (dateStr) => {
    try {
      const data = await servicesApi.getSlots(dateStr, token);
      setAvailableSlots(data.defaultSlots || []);
      setBookedSlots(data.bookedSlots || []);
      if (data.defaultSlots && data.defaultSlots.length > 0) {
        setSelectedSlot(data.defaultSlots[0]);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const data = await servicesApi.getStudentMentoring(token);
        setSessions(data);
        const lData = await servicesApi.getStudentLeaves(token).catch(() => []);
        setLeaves(lData || []);
      } else {
        const data = await servicesApi.getCoordinatorMentoring(token);
        setSessions(data);
        const lData = await servicesApi.getCoordinatorLeaves(token).catch(() => []);
        setLeaves(lData || []);
      }
    } catch (err) {
      console.error('Failed to load mentoring sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllData();
      loadSlots(selectedDate);
    }
  }, [token, role]);

  const handleDateChange = (dateStr) => {
    setSelectedDate(dateStr);
    loadSlots(dateStr);
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      alert('Please select a date and time slot.');
      return;
    }

    setSubmitting(true);
    try {
      await servicesApi.bookMentoring(
        {
          category,
          date: selectedDate,
          timeSlot: selectedSlot,
          notesText,
        },
        token
      );
      alert('Mentoring session requested successfully!');
      setNotesText('');
      loadAllData();
      loadSlots(selectedDate);
    } catch (err) {
      console.error(err);
      alert('Failed to book mentoring session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveModify = async () => {
    if (!activeSession) return;
    try {
      await servicesApi.approveModifyMentoring(
        activeSession._id,
        {
          status: 'Approved',
          date: modDate || activeSession.date,
          timeSlot: modSlot || activeSession.timeSlot,
          meetingUrl: meetingUrl || activeSession.meetingUrl,
        },
        token
      );
      alert('Mentoring session approved/updated!');
      setActiveSession(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to update session.');
    }
  };

  const handleSaveNotes = async () => {
    if (!notesModalSession) return;
    try {
      await servicesApi.saveMeetingNotes(
        notesModalSession._id,
        {
          meetingNotes,
          meetingUrl,
          docLinks,
        },
        token
      );
      alert('Meeting notes saved successfully!');
      setNotesModalSession(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to save meeting notes.');
    }
  };

  const handleAddDocLink = () => {
    if (!docUrl.trim()) return;
    setDocLinks((prev) => [...prev, { title: docTitle || 'Doc Resource', url: docUrl }]);
    setDocTitle('');
    setDocUrl('');
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
        return <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Approved</span>;
      case 'Modified':
        return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Edit3 size={12} /> Rescheduled</span>;
      default:
        return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Requested</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .ct-glass-panel {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
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
        .ct-form-input, .ct-form-select, .ct-form-textarea {
          background: #090d16 !important;
          border: 1px solid #1e293b !important;
          color: #f8fafc !important;
          padding: 0.65rem 0.9rem !important;
          border-radius: 12px !important;
          font-size: 0.85rem !important;
          outline: none !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          width: 100%;
        }
        .ct-form-input:focus, .ct-form-select:focus, .ct-form-textarea:focus {
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

      {/* Google Calendar Master Component */}
      <GoogleCalendarView
        role={role}
        sessions={sessions}
        leaves={leaves}
        onSelectDate={handleDateChange}
        onOpenSession={(s) => setActiveSession(s)}
      />

      {/* STUDENT VIEW FORM & LIST */}
      {role === 'student' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Booking Form */}
          <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} color="#60a5fa" /> Book Mentoring Session for {selectedDate}
            </h3>

            <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="ct-form-group">
                <label className="ct-form-label">Mentoring Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ct-form-select"
                >
                  <option value="Placement Prep">Placement Prep & Strategy</option>
                  <option value="Technical Guidance">Technical & Coding Guidance</option>
                  <option value="Resume/Portfolio">Resume & Portfolio Review</option>
                  <option value="Mental Health / Wellness">Mental Health & Wellness Counsel</option>
                  <option value="General Counsel">General Mentoring</option>
                </select>
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Selected Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="ct-form-input"
                  required
                />
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Available Time Slots for Selected Day</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {availableSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          background: isBooked
                            ? 'rgba(15, 23, 42, 0.4)'
                            : isSelected
                            ? '#2563eb'
                            : '#090d16',
                          color: isBooked ? '#475569' : isSelected ? '#ffffff' : '#cbd5e1',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid #1e293b',
                          padding: '0.65rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          textDecoration: isBooked ? 'line-through' : 'none',
                          textAlign: 'center'
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Session Purpose & Specific Questions</label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Mention your key topics or questions..."
                  className="ct-form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="ct-btn-primary"
              >
                <CalendarIcon size={16} /> {submitting ? 'Booking...' : 'Confirm Mentoring Slot'}
              </button>
            </form>
          </div>

          {/* Student Mentoring Sessions List */}
          <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#60a5fa" /> My Scheduled Sessions
            </h3>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading mentoring sessions...</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '12px' }}>
                No mentoring sessions booked yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 520, overflowY: 'auto' }}>
                {sessions.map((s) => (
                  <div key={s._id} style={{ padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>{s.category}</h4>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Mentor: {s.mentorName || 'Placement Coordinator'}</p>
                      </div>
                      {getStatusBadge(s.status)}
                    </div>

                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CalendarIcon size={14} />
                      <span>{s.date}</span>
                      <span>•</span>
                      <Clock size={14} />
                      <span>{s.timeSlot}</span>
                    </div>

                    {s.notesText && <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>{s.notesText}</p>}

                    {s.meetingUrl ? (
                      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Video size={14} /> Session Active
                        </span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(`/services/mentoring/${s._id}`)}
                            style={{ background: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Open Live Session Page 🎥
                          </button>
                          <a
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: '#16a34a', color: '#ffffff', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Join GMeet ↗
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', paddingTop: '0.2rem' }}>GMeet link will be updated 10 mins prior to session time.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COORDINATOR VIEW: Calendar & Slot Management Queue */
        <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Mentoring Calendar & Session Notes Queue</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Manage student time slots, attach GMeet links, and record persistent meeting notes</p>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading mentoring queue...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '12px' }}>
              No mentoring sessions requested by students.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {sessions.map((s) => (
                <div key={s._id} style={{ padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {/* Clickable Student Name redirecting to Coordinator Student Profile */}
                        <button
                          onClick={() => s.studentId?._id && navigate(`/coordinator/students/${s.studentId._id}`)}
                          style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                        >
                          <User size={14} /> {s.studentId?.name || 'Student'}
                        </button>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{s.studentId?.college || 'College N/A'} • MSS: {s.studentId?.mssId || 'N/A'}</p>
                      </div>
                      {getStatusBadge(s.status)}
                    </div>

                    <div style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa' }}>{s.category}</div>
                      <div style={{ fontSize: '0.78rem', color: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarIcon size={12} /> {s.date} • {s.timeSlot}
                      </div>
                      {s.notesText && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>{s.notesText}</p>}
                    </div>

                    {s.meetingNotes && (
                      <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.25)', fontSize: '0.78rem', color: '#ddd6fe' }}>
                        <strong>Notes Saved:</strong> {s.meetingNotes.slice(0, 60)}...
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate(`/services/mentoring/${s._id}`)}
                      style={{ flex: 1, background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.45rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      Open Live Session Page 🎥
                    </button>
                    <button
                      onClick={() => {
                        setActiveSession(s);
                        setModDate(s.date);
                        setModSlot(s.timeSlot);
                        setMeetingUrl(s.meetingUrl || '');
                      }}
                      style={{ flex: 1, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.45rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Approve / Slot
                    </button>
                    <button
                      onClick={() => {
                        setNotesModalSession(s);
                        setMeetingNotes(s.meetingNotes || '');
                        setMeetingUrl(s.meetingUrl || '');
                        setDocLinks(s.docLinks || []);
                      }}
                      style={{ flex: 1, background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.45rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Add Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reschedule / Approve Modal */}
          {activeSession && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="ct-glass-panel" style={{ maxWidth: 450, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Approve or Modify Time Slot</h3>
                  <button onClick={() => setActiveSession(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="ct-form-group">
                    <label className="ct-form-label">Date</label>
                    <input
                      type="date"
                      value={modDate}
                      onChange={(e) => setModDate(e.target.value)}
                      className="ct-form-input"
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-form-label">Time Slot</label>
                    <input
                      type="text"
                      value={modSlot}
                      onChange={(e) => setModSlot(e.target.value)}
                      placeholder="e.g. 2:00 PM - 3:00 PM"
                      className="ct-form-input"
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-form-label">Google Meet / Meeting URL</label>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="ct-form-input"
                    />
                  </div>
                </div>

                <button
                  onClick={handleApproveModify}
                  style={{ background: '#22c55e', color: '#ffffff', fontWeight: 800, padding: '0.65rem', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '4px' }}
                >
                  <Check size={16} /> Save & Approve Session
                </button>
              </div>
            </div>
          )}

          {/* Meeting Notes Modal */}
          {notesModalSession && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="ct-glass-panel" style={{ maxWidth: 500, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Add Meeting Notes & Attachments</h3>
                  <button onClick={() => setNotesModalSession(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="ct-form-group">
                    <label className="ct-form-label">GMeet / Video Link</label>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="ct-form-input"
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-form-label">Raw Meeting Notes & Action Items</label>
                    <textarea
                      rows={4}
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      placeholder="Type mentor feedback, student goals, or summary..."
                      className="ct-form-textarea"
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-form-label">Attach Doc / Resource Links</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Link Title (e.g. DSA Plan)"
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
                        onClick={handleAddDocLink}
                        style={{ background: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '0 0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {docLinks.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                        {docLinks.map((d, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#090d16', borderRadius: '8px', fontSize: '0.78rem' }}>
                            <span style={{ color: '#cbd5e1' }}>{d.title}</span>
                            <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                              View ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSaveNotes}
                  className="ct-btn-primary"
                >
                  <Save size={16} /> Save Notes to Student Profile
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED LIVE MEETING WINDOW MODAL */}
          {liveMeetingSession && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(16px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="ct-glass-panel" style={{ maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>Live Mentoring Room & Discussion Window</h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        {liveMeetingSession.category} • {liveMeetingSession.date} ({liveMeetingSession.timeSlot})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setLiveMeetingSession(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Google Meet Launch Card */}
                <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>● Video Call Active</span>
                    <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Google Meet Conference Room</h4>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>Click button to launch video call in a separate browser window</p>
                  </div>

                  {liveMeetingSession.meetingUrl ? (
                    <a
                      href={liveMeetingSession.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-btn-primary"
                      style={{ background: '#16a34a', textDecoration: 'none', padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
                    >
                      <Video size={16} /> Launch GMeet in New Tab ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>Meeting URL Pending Coordinator Setup</span>
                  )}
                </div>

                {/* Session Participant Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: '#090d16', padding: '0.8rem', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '0.82rem' }}>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Student:</strong> {liveMeetingSession.studentId?.name || 'Student'} ({liveMeetingSession.studentId?.email || 'N/A'})
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Mentor / Coordinator:</strong> {liveMeetingSession.mentorName || 'Placement Coordinator'}
                  </div>
                </div>

                {/* Coordinator Live Notes & Resource Link Editor */}
                {role === 'coordinator' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Edit3 size={16} /> Live Meeting Notes & Student Advice Editor
                    </h4>

                    <div className="ct-form-group">
                      <label className="ct-form-label">Meeting Notes & Summary Points</label>
                      <textarea
                        rows={4}
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        placeholder="Log student goals, key discussion points, and action items..."
                        className="ct-form-textarea"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await servicesApi.saveMeetingNotes(liveMeetingSession._id, { meetingNotes, docLinks }, token);
                          alert('Meeting notes saved to student profile!');
                          loadAllData();
                        } catch (err) {
                          alert('Failed to save notes');
                        }
                      }}
                      className="ct-btn-primary"
                    >
                      <Save size={16} /> Save Notes to Student Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
