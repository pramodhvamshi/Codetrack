import React, { useState, useEffect } from 'react';
import { 
  Award, MessageSquare, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, X, Sparkles
} from 'lucide-react';
import { mockTestApi } from '../../../api/mockTestApi';
import { api } from '../../../api/client';
import { MockTestResults } from './MockTestResults';

export function SessionHistoryView({ token }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'mocktests' | 'voice'
  const [mockTests, setMockTests] = useState([]);
  const [voiceInterviews, setVoiceInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected details for overlay modals
  const [selectedMockTest, setSelectedMockTest] = useState(null);
  const [selectedVoiceSession, setSelectedVoiceSession] = useState(null);
  const [voiceDetails, setVoiceDetails] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const loadHistoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [testData, voiceData] = await Promise.all([
        mockTestApi.getHistory(token).catch(() => []),
        api.getJson('/ai/interview/history', token).catch(() => []),
      ]);
      setMockTests(Array.isArray(testData) ? testData : []);
      setVoiceInterviews(Array.isArray(voiceData) ? voiceData : []);
    } catch (err) {
      console.error('Failed to load history data:', err);
      setError('Could not load complete session history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadHistoryData();
    }
  }, [token]);

  const viewVoiceDetails = async (sess) => {
    setSelectedVoiceSession(sess);
    setVoiceLoading(true);
    setVoiceDetails(null);
    try {
      const data = await api.getJson(`/ai/interview/details/${sess._id}`, token);
      setVoiceDetails(data);
    } catch (err) {
      console.error('Failed to load interview details:', err);
    } finally {
      setVoiceLoading(false);
    }
  };

  // Combine and format history items
  const combinedHistory = [
    ...mockTests.map((t) => ({
      id: t._id,
      type: 'mocktest',
      title: t.topic,
      subtitle: `${t.totalQuestions || 10} Questions • ${t.difficulty || 'Medium'}`,
      scoreText: `${t.score}/${t.totalQuestions || 10} (${t.percentage || 0}%)`,
      percentage: t.percentage || 0,
      status: t.status === 'completed' ? 'Completed' : 'In Progress',
      date: new Date(t.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      rawData: t,
    })),
    ...voiceInterviews.map((v) => ({
      id: v._id,
      type: 'voice',
      title: `${v.company || 'Tech Company'} — ${v.round || 'Technical'}`,
      subtitle: `Role: ${v.role || 'Software Developer'} • Level: ${v.difficulty || 'Medium'}`,
      scoreText: v.feedback?.overallScore ? `${v.feedback.overallScore}/100` : 'Not Graded',
      percentage: v.feedback?.overallScore || 0,
      status: v.status || (v.feedback ? 'Completed' : 'In Progress'),
      date: new Date(v.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      rawData: v,
    })),
  ].sort((a, b) => new Date(b.rawData.createdAt) - new Date(a.rawData.createdAt));

  const filteredItems = combinedHistory.filter((item) => {
    if (activeFilter === 'mocktests') return item.type === 'mocktest';
    if (activeFilter === 'voice') return item.type === 'voice';
    return true;
  });

  return (
    <div style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '0.75rem',
        }}
      >
        {[
          { id: 'all', label: 'All Sessions', icon: Calendar },
          { id: 'mocktests', label: 'Mock Tests (MCQs)', icon: Award },
          { id: 'voice', label: 'AI Voice Interviews', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                border: isActive ? '1px solid #3b82f6' : '1px solid #1e293b',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={loadHistoryData}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '80px',
                background: '#0f172a',
                borderRadius: '12px',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#94a3b8',
          }}
        >
          <Calendar size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>No session history found</h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Complete a Mock Test or AI Voice Interview to see your detailed performance logs.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredItems.map((item) => {
            const isMockTest = item.type === 'mocktest';
            const isCompleted = item.status === 'Completed';

            return (
              <div
                key={item.id}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: isMockTest ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isMockTest ? '#34d399' : '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isMockTest ? <Award size={22} /> : <MessageSquare size={22} />}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                      {item.title}
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      {item.subtitle} • Date: {item.date}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: isCompleted ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {item.scoreText}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isCompleted ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  {isMockTest ? (
                    <button
                      onClick={() => setSelectedMockTest(item.rawData)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Review Test</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => viewVoiceDetails(item.rawData)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Review Voice</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MOCK TEST REVIEW MODAL ── */}
      {selectedMockTest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                Test Review: {selectedMockTest.topic}
              </h3>
              <button
                onClick={() => setSelectedMockTest(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <MockTestResults
              resultData={{
                session: selectedMockTest,
                score: selectedMockTest.score,
                percentage: selectedMockTest.percentage,
                totalQuestions: selectedMockTest.totalQuestions,
              }}
              onGoBack={() => setSelectedMockTest(null)}
            />
          </div>
        </div>
      )}

      {/* ── VOICE INTERVIEW REVIEW MODAL ── */}
      {selectedVoiceSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                  {selectedVoiceSession.company} — {selectedVoiceSession.round} Round
                </h3>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Role: {selectedVoiceSession.role} • Level: {selectedVoiceSession.difficulty}
                </span>
              </div>
              <button
                onClick={() => setSelectedVoiceSession(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {voiceLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <RefreshCw size={32} className="animate-spin" color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#94a3b8' }}>Loading interview transcript & feedback...</p>
              </div>
            ) : voiceDetails ? (
              <div>
                {/* Score Summary */}
                {voiceDetails.feedback && (
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#34d399', marginBottom: '0.5rem' }}>
                      Overall Score: {voiceDetails.feedback.overallScore}/100
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0 }}>
                      {voiceDetails.feedback.summary || 'Detailed feedback evaluation complete.'}
                    </p>
                  </div>
                )}

                {/* Conversation Transcript */}
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '1rem' }}>
                  Spoken Conversation Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {voiceDetails.messages &&
                    voiceDetails.messages.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: m.role === 'ai' ? '#131c2e' : '#1e293b',
                          padding: '1rem',
                          borderRadius: '10px',
                          border: '1px solid #334155',
                        }}
                      >
                        <strong style={{ color: m.role === 'ai' ? '#38bdf8' : '#60a5fa', fontSize: '0.85rem' }}>
                          {m.role === 'ai' ? `${selectedVoiceSession.company} Interviewer` : 'Candidate'}
                        </strong>
                        <p style={{ color: '#f1f5f9', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
                          {m.content}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8' }}>No transcript available for this session.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
