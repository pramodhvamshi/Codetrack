import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDisplayDate } from '../utils/formatters';

export function MentoringTimeline({ studentId }) {
  const { token, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMeetings: 0, openTasks: 0, completedTasks: 0, lastMeeting: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  const [expandedCards, setExpandedCards] = useState({});

  const defaultForm = {
    meetingType: 'General Mentoring',
    meetingDate: '',
    meetingMode: 'Offline',
    meetingDuration: '30 mins',
    priority: 'Medium',
    status: 'Open',
    outcome: 'Good',
    tags: '',
    observation: '',
    overallRecommendation: '',
    targetDate: '',
    nextReviewDate: '',
    remarks: '',
    visibility: 'COORDINATOR_ONLY',
    studentProgress: {
      previousGoal: '',
      currentStatus: '',
      nextGoal: ''
    }
  };

  const [formData, setFormData] = useState(defaultForm);
  const [actionItems, setActionItems] = useState([]); // { task: '', completed: false }

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await api.getJson(`/coordinator/mentor-notes/students/${studentId}`, token);
      setRecords(res.records || []);
      
      if (res.stats) {
        setStats(res.stats);
      }
      
      // Expand top 2 by default
      const ex = {};
      (res.records || []).slice(0, 2).forEach(r => ex[r._id] = true);
      setExpandedCards(ex);
    } catch (err) {
      toast.error('Failed to load mentoring notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [studentId, token]);

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        meetingType: record.meetingType || 'General Mentoring',
        meetingDate: record.meetingDate ? record.meetingDate.split('T')[0] : (record.createdAt ? record.createdAt.split('T')[0] : ''),
        meetingMode: record.meetingMode || 'Offline',
        meetingDuration: record.meetingDuration || '',
        priority: record.priority || 'Medium',
        status: record.status || 'Open',
        outcome: record.outcome || 'Good',
        tags: record.tags ? record.tags.join(', ') : '',
        observation: record.observation || '',
        overallRecommendation: record.overallRecommendation || '',
        targetDate: record.targetDate ? record.targetDate.split('T')[0] : '',
        nextReviewDate: record.nextReviewDate ? record.nextReviewDate.split('T')[0] : '',
        remarks: record.remarks || '',
        visibility: record.visibility || 'COORDINATOR_ONLY',
        studentProgress: {
          previousGoal: record.studentProgress?.previousGoal || '',
          currentStatus: record.studentProgress?.currentStatus || '',
          nextGoal: record.studentProgress?.nextGoal || ''
        }
      });
      setActionItems((record.actionItems || []).map(a => ({ ...a })));
    } else {
      setEditingRecord(null);
      setFormData(defaultForm);
      setActionItems([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      actionItems: actionItems.filter(a => a.task.trim()).map(a => ({
        ...a,
        completedAt: a.completed && !a.completedAt ? new Date() : (a.completed ? a.completedAt : null)
      }))
    };

    try {
      if (editingRecord) {
        await api.putJson(`/coordinator/mentor-notes/${editingRecord._id}`, payload, token);
        toast.success('Note updated successfully');
      } else {
        await api.postJson(`/coordinator/mentor-notes/students/${studentId}`, payload, token);
        toast.success('Note added successfully');
      }
      handleCloseModal();
      loadRecords();
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteJson(`/coordinator/mentor-notes/${noteId}`, token);
      toast.success('Note deleted');
      loadRecords();
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleToggleTask = async (record, taskIndex) => {
    try {
      const updatedActionItems = [...record.actionItems];
      updatedActionItems[taskIndex].completed = !updatedActionItems[taskIndex].completed;
      updatedActionItems[taskIndex].completedAt = updatedActionItems[taskIndex].completed ? new Date() : null;

      const payload = { ...record, actionItems: updatedActionItems };
      await api.putJson(`/coordinator/mentor-notes/${record._id}`, payload, token);
      
      // Update local state optimistic UI
      setRecords(records.map(r => r._id === record._id ? { ...r, actionItems: updatedActionItems } : r));
      
      // Recalculate stats optimistically
      loadRecords(); // just reload to get fresh stats
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const toggleExpandAll = () => {
    const isAllExpanded = Object.keys(expandedCards).length === records.length;
    if (isAllExpanded) {
      setExpandedCards({});
    } else {
      const ex = {};
      records.forEach(r => ex[r._id] = true);
      setExpandedCards(ex);
    }
  };

  const isAllExpanded = records.length > 0 && Object.keys(expandedCards).length === records.length;

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading mentor notes...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* SUMMARY HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="ct-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Meetings</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalMeetings}</span>
        </div>
        <div className="ct-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Tasks</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.openTasks}</span>
        </div>
        <div className="ct-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '4px solid #22C55E' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Tasks</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.completedTasks}</span>
        </div>
        <div className="ct-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Meeting</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem' }}>
            {stats.lastMeeting ? formatDisplayDate(stats.lastMeeting) : 'Never'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Timeline</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={toggleExpandAll} className="ct-button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <button onClick={() => handleOpenModal()} className="ct-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Plus size={14} /> Add Note
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="ct-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <h3>No Mentoring Notes Yet</h3>
          <p>Add the first meeting note to start tracking progress.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          {/* Timeline connecting line */}
          <div style={{ position: 'absolute', left: '24px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />

          {records.map((r, i) => {
            const isExpanded = !!expandedCards[r._id];
            const canEdit = user.role === 'admin' || user.id === r.createdBy?._id;

            return (
              <div key={r._id} style={{ display: 'flex', gap: '1rem', zIndex: 1 }}>
                <div style={{ width: '48px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', background: '#1e293b', border: '2px solid var(--accent-blue)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' 
                  }}>
                    {r.meetingNumber || (records.length - i)}
                  </div>
                </div>

                <div className="ct-card" style={{ flex: 1, padding: '1rem' }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpandedCards(prev => ({ ...prev, [r._id]: !isExpanded }))}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{r.meetingType}</h3>
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{r.meetingMode}</span>
                        {r.priority === 'High' || r.priority === 'Critical' ? (
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>{r.priority}</span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDisplayDate(r.meetingDate || r.createdAt)} • By {r.createdBy?.name || 'Unknown'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: r.status === 'Completed' || r.status === 'Closed' ? '#22c55e' : '#f59e0b' }}>
                        {r.status}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Observation</div>
                        <div style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{r.observation}</div>
                      </div>

                      {r.overallRecommendation && (
                        <div>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Overall Recommendation</div>
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#60a5fa' }}>{r.overallRecommendation}</div>
                        </div>
                      )}

                      {r.studentProgress && (r.studentProgress.previousGoal || r.studentProgress.nextGoal) && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Student Progress</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                            <div><div style={{ opacity: 0.5, fontSize: '0.7rem' }}>Previous Goal</div>{r.studentProgress.previousGoal || '—'}</div>
                            <div><div style={{ opacity: 0.5, fontSize: '0.7rem' }}>Status</div>{r.studentProgress.currentStatus || '—'}</div>
                            <div><div style={{ opacity: 0.5, fontSize: '0.7rem' }}>Next Goal</div>{r.studentProgress.nextGoal || '—'}</div>
                          </div>
                        </div>
                      )}

                      {r.actionItems && r.actionItems.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Action Items</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {r.actionItems.map((item, idx) => (
                              <div key={idx} 
                                onClick={() => canEdit && handleToggleTask(r, idx)}
                                style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', color: item.completed ? 'var(--text-muted)' : 'inherit', cursor: canEdit ? 'pointer' : 'default' }}
                              >
                                {item.completed ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} /> : <Clock size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />}
                                <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {r.targetDate && (
                          <div><span style={{ color: 'var(--text-muted)' }}>Target Date:</span> {formatDisplayDate(r.targetDate)}</div>
                        )}
                        {r.nextReviewDate && (
                          <div><span style={{ color: 'var(--text-muted)' }}>Next Review:</span> {formatDisplayDate(r.nextReviewDate)}</div>
                        )}
                      </div>

                      {canEdit && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleOpenModal(r)} className="ct-button-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete(r._id)} className="ct-button-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#ef4444' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="ct-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>{editingRecord ? 'Edit Meeting Note' : 'Add New Meeting Note'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="ct-label">Meeting Type</label>
                  <select className="ct-input" value={formData.meetingType} onChange={e => setFormData({...formData, meetingType: e.target.value})} required>
                    <option value="General Mentoring">General Mentoring</option>
                    <option value="Monthly Review">Monthly Review</option>
                    <option value="Weekly Review">Weekly Review</option>
                    <option value="Placement Guidance">Placement Guidance</option>
                    <option value="Internship Discussion">Internship Discussion</option>
                    <option value="Resume Review">Resume Review</option>
                    <option value="Mock Interview">Mock Interview</option>
                    <option value="Technical Assessment">Technical Assessment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="ct-label">Meeting Date</label>
                  <input type="date" className="ct-input" value={formData.meetingDate} onChange={e => setFormData({...formData, meetingDate: e.target.value})} />
                </div>
                <div>
                  <label className="ct-label">Meeting Mode</label>
                  <select className="ct-input" value={formData.meetingMode} onChange={e => setFormData({...formData, meetingMode: e.target.value})}>
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Phone">Phone</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="ct-label">Duration</label>
                  <input type="text" className="ct-input" placeholder="e.g. 30 mins" value={formData.meetingDuration} onChange={e => setFormData({...formData, meetingDuration: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="ct-label">Priority</label>
                  <select className="ct-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="ct-label">Status</label>
                  <select className="ct-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="ct-label">Outcome</label>
                  <select className="ct-input" value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="ct-label">Observation</label>
                <textarea className="ct-input" rows="4" placeholder="Detailed notes about the meeting..." value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} required />
              </div>

              <div>
                <label className="ct-label">Overall Recommendation (Optional)</label>
                <input type="text" className="ct-input" placeholder="e.g. Focus on contests." value={formData.overallRecommendation} onChange={e => setFormData({...formData, overallRecommendation: e.target.value})} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <label className="ct-label" style={{ marginBottom: '0.8rem' }}>Student Progress (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <input type="text" className="ct-input" placeholder="Previous Goal" value={formData.studentProgress.previousGoal} onChange={e => setFormData({...formData, studentProgress: { ...formData.studentProgress, previousGoal: e.target.value }})} />
                  <input type="text" className="ct-input" placeholder="Current Status" value={formData.studentProgress.currentStatus} onChange={e => setFormData({...formData, studentProgress: { ...formData.studentProgress, currentStatus: e.target.value }})} />
                  <input type="text" className="ct-input" placeholder="Next Goal" value={formData.studentProgress.nextGoal} onChange={e => setFormData({...formData, studentProgress: { ...formData.studentProgress, nextGoal: e.target.value }})} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="ct-label" style={{ margin: 0 }}>Action Items (Drives Task Counters)</label>
                  <button type="button" onClick={() => setActionItems([...actionItems, { task: '', completed: false }])} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                    + Add Task
                  </button>
                </div>
                {actionItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input type="checkbox" checked={item.completed} onChange={e => {
                      const newItems = [...actionItems];
                      newItems[idx].completed = e.target.checked;
                      setActionItems(newItems);
                    }} style={{ width: '18px', height: '18px' }} />
                    <input type="text" className="ct-input" style={{ flex: 1 }} placeholder="Task description..." value={item.task} onChange={e => {
                      const newItems = [...actionItems];
                      newItems[idx].task = e.target.value;
                      setActionItems(newItems);
                    }} />
                    <button type="button" onClick={() => setActionItems(actionItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="ct-label">Target Date (Optional)</label>
                  <input type="date" className="ct-input" value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})} />
                </div>
                <div>
                  <label className="ct-label">Next Review Date (Optional)</label>
                  <input type="date" className="ct-input" value={formData.nextReviewDate} onChange={e => setFormData({...formData, nextReviewDate: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="ct-label">Tags (comma separated)</label>
                <input type="text" className="ct-input" placeholder="e.g. Placement, Resume, Technical" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
              </div>

              <div>
                <label className="ct-label">Remarks (Private)</label>
                <input type="text" className="ct-input" placeholder="Internal remarks..." value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={handleCloseModal} className="ct-button-secondary">Cancel</button>
                <button type="submit" className="ct-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
