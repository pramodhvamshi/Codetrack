import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesApi } from '../../../api/servicesApi';
import { 
  FileText, ExternalLink, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Send, Check, X, User 
} from 'lucide-react';

export function LeaveRequestTab({ role, token }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All');

  // Form State (Student)
  const [reasonType, setReasonType] = useState('General');
  const [duration, setDuration] = useState('1 Day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [driveDocUrl, setDriveDocUrl] = useState('https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing');
  const [statement, setStatement] = useState('');

  // Selected Modal (Coordinator)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [coordinatorRemarks, setCoordinatorRemarks] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const data = await servicesApi.getStudentLeaves(token);
        setRequests(data);
      } else {
        const data = await servicesApi.getCoordinatorLeaves(token);
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadRequests();
  }, [token, role]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !statement.trim()) {
      alert('Please fill in start date, end date, and leave statement.');
      return;
    }

    setSubmitting(true);
    try {
      await servicesApi.submitLeave(
        {
          reasonType,
          duration,
          startDate,
          endDate,
          driveDocUrl,
          statement,
        },
        token
      );
      alert('Leave request submitted successfully!');
      setStatement('');
      loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await servicesApi.updateLeaveStatus(
        id,
        {
          status,
          coordinatorRemarks,
        },
        token
      );
      alert(`Leave request marked as ${status}!`);
      setSelectedRequest(null);
      setCoordinatorRemarks('');
      loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update leave status.');
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
        return <span className="ct-pill" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle2 size={12} /> Approved</span>;
      case 'Rejected':
        return <span className="ct-pill" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="ct-pill" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}><Clock size={12} /> Pending</span>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'All') return true;
    return r.status === filter;
  });

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

      {/* Format Header Banner */}
      <div className="ct-glass-panel" style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: 12 }}>
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Leave Application Protocol & Guidelines</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Download or view the official document format template before submitting your leave request</p>
          </div>
        </div>

        <a
          href="https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="ct-btn-primary"
          style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.55rem 1rem' }}
        >
          <span>View Leave Format Template</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* STUDENT SIDE: Form + Past History */}
      {role === 'student' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Submission Form */}
          <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} color="#60a5fa" /> Apply for Leave
            </h3>

            <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="ct-form-group">
                <label className="ct-form-label">Reason Category</label>
                <select
                  value={reasonType}
                  onChange={(e) => setReasonType(e.target.value)}
                  className="ct-form-select"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Medical">Medical</option>
                  <option value="Personal">Personal</option>
                  <option value="Placement Drive">Placement Drive</option>
                  <option value="Exam">Exam</option>
                </select>
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Duration Category</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="ct-form-select"
                >
                  <option value="1 Day">1 Day</option>
                  <option value="2 Days">2 Days</option>
                  <option value="3 Days">3 Days</option>
                  <option value="1 Week">1 Week</option>
                  <option value="2 Weeks">2 Weeks</option>
                  <option value="Custom">Custom Date Range</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="ct-form-group">
                  <label className="ct-form-label">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="ct-form-input"
                    required
                  />
                </div>
                <div className="ct-form-group">
                  <label className="ct-form-label">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ct-form-input"
                    required
                  />
                </div>
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Google Drive Document Link</label>
                <input
                  type="url"
                  value={driveDocUrl}
                  onChange={(e) => setDriveDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="ct-form-input"
                />
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Leave Statement & Reason</label>
                <textarea
                  rows={4}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Please grant me leave because..."
                  className="ct-form-textarea"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="ct-btn-primary"
              >
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>

          {/* Student Leave Request History */}
          <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#60a5fa" /> My Leave Requests History
            </h3>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading leave requests...</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '12px' }}>
                No leave requests submitted yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 520, overflowY: 'auto' }}>
                {requests.map((r) => (
                  <div key={r._id} style={{ padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>{r.reasonType} Leave ({r.duration})</span>
                      {getStatusBadge(r.status)}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>{r.statement}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</span>
                      {r.driveDocUrl && (
                        <a href={r.driveDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          Doc Link <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {r.coordinatorRemarks && (
                      <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.78rem', color: '#fcd34d' }}>
                        <strong>Coordinator Remarks:</strong> {r.coordinatorRemarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COORDINATOR SIDE: Approval Queue */
        <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Student Leave Request Verification Queue</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Review student statements, inspect drive documents, and approve leave requests</p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', background: '#090d16', padding: '4px', borderRadius: '12px', border: '1px solid #1e293b', gap: '4px' }}>
              {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  style={{
                    background: filter === st ? '#2563eb' : 'transparent',
                    color: filter === st ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading leave requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '12px' }}>
              No leave requests found for filter: {filter}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {filteredRequests.map((r) => (
                <div key={r._id} style={{ padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <button
                          onClick={() => r.studentId?._id && navigate(`/coordinator/students/${r.studentId._id}`)}
                          style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                        >
                          <User size={14} /> {r.studentId?.name || 'Student'}
                        </button>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{r.studentId?.college || 'College N/A'} • MSS ID: {r.studentId?.mssId || 'N/A'}</p>
                      </div>
                      {getStatusBadge(r.status)}
                    </div>

                    <div style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa' }}>{r.reasonType} ({r.duration})</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>{r.statement}</p>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      <strong>Dates:</strong> {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {r.driveDocUrl && (
                      <a
                        href={r.driveDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                      >
                        Doc Link <ExternalLink size={12} />
                      </a>
                    )}

                    <button
                      onClick={() => setSelectedRequest(r)}
                      style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Review Modal */}
          {selectedRequest && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="ct-glass-panel" style={{ maxWidth: 500, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Review Leave Request</h3>
                  <button onClick={() => setSelectedRequest(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Student:</strong> {selectedRequest.studentId?.name} ({selectedRequest.studentId?.email})
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Reason & Duration:</strong> {selectedRequest.reasonType} • {selectedRequest.duration}
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Dates:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Statement:</strong>
                    <p style={{ margin: '0.3rem 0 0 0', padding: '0.65rem', background: '#090d16', borderRadius: '8px', color: '#e2e8f0', border: '1px solid #1e293b', lineHeight: 1.5 }}>{selectedRequest.statement}</p>
                  </div>

                  {selectedRequest.driveDocUrl && (
                    <div>
                      <strong style={{ color: '#94a3b8' }}>Google Drive Document:</strong>
                      <a href={selectedRequest.driveDocUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '0.2rem', color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>
                        {selectedRequest.driveDocUrl} ↗
                      </a>
                    </div>
                  )}

                  <div className="ct-form-group">
                    <label className="ct-form-label">Coordinator Remarks (Optional)</label>
                    <textarea
                      rows={3}
                      value={coordinatorRemarks}
                      onChange={(e) => setCoordinatorRemarks(e.target.value)}
                      placeholder="Add remarks or instructions for the student..."
                      className="ct-form-textarea"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'Approved')}
                    style={{ flex: 1, background: '#22c55e', color: '#ffffff', fontWeight: 800, padding: '0.65rem', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '4px' }}
                  >
                    <Check size={16} /> Approve Leave
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'Rejected')}
                    style={{ flex: 1, background: '#ef4444', color: '#ffffff', fontWeight: 800, padding: '0.65rem', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '4px' }}
                  >
                    <X size={16} /> Reject Leave
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
