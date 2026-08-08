import React, { useState } from 'react';
import { 
  Sparkles, Zap, Award, Clock, AlertTriangle, ShieldCheck, ChevronRight, Play, CheckCircle2, RefreshCw
} from 'lucide-react';

export const CS_TOPICS = [
  { id: 'dbms', name: 'Database Management System (DBMS)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'os', name: 'Operating System (OS)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'cn', name: 'Computer Networks (CN)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'dsa', name: 'Data Structures & Algorithms (DSA)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'oops', name: 'Object Oriented Programming (OOPs)', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 'system_design', name: 'System Design', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  { id: 'computer_arch', name: 'Computer Architecture', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'compiler', name: 'Compiler Design', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  { id: 'software_eng', name: 'Software Engineering', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  { id: 'distributed', name: 'Distributed Systems', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' },
  { id: 'cloud', name: 'Cloud Computing', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' },
  { id: 'cyber', name: 'Cyber Security', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
  { id: 'network_sec', name: 'Network Security', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
];

export const LANGUAGES = [
  { id: 'java', name: 'Java', icon: '☕', color: '#f97316' },
  { id: 'python', name: 'Python', icon: '🐍', color: '#3b82f6' },
  { id: 'cpp', name: 'C++', icon: '⚡', color: '#06b6d4' },
  { id: 'javascript', name: 'JavaScript', icon: '🟨', color: '#eab308' },
  { id: 'sql', name: 'SQL', icon: '🗄️', color: '#a855f7' },
  { id: 'golang', name: 'Go (Golang)', icon: '🐹', color: '#00add8' },
  { id: 'rust', name: 'Rust', icon: '🦀', color: '#ef4444' },
];

export function MockTestLobby({ quotaState, onStartTest, onRefreshQuota, loading }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const attemptsRemaining = quotaState?.attemptsRemaining ?? 5;
  const maxAttempts = quotaState?.maxDailyAttempts ?? 5;
  const cooldownSeconds = quotaState?.cooldownSecondsRemaining ?? 0;
  const canStartAI = attemptsRemaining > 0 && cooldownSeconds === 0;

  const handleTopicClick = (topicObj) => {
    setSelectedTopic(topicObj);
    setShowConfigModal(true);
  };

  const handleStartSubmit = (useFallback = false) => {
    if (!selectedTopic) return;
    setShowConfigModal(false);
    onStartTest({
      topic: selectedTopic.name,
      category: selectedTopic.icon ? 'language' : 'topic',
      difficulty,
      totalQuestions: questionCount,
      useFallbackIfLimited: useFallback,
    });
  };

  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* ── HERO BANNER ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 45%, #022c22 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          marginBottom: '3rem',
        }}
      >
        {/* Decorative Grid Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
            opacity: 0.7,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(6, 78, 59, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#34d399',
              marginBottom: '1.5rem',
            }}
          >
            <Sparkles size={16} />
            <span>AI Generated • 35+ CS Topics • CodeTrack Assessment</span>
          </div>

          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: '800',
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              marginBottom: '1rem',
              background: 'linear-gradient(to right, #ffffff, #a7f3d0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Master Your Technical Assessments
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#9fe7c7',
              marginBottom: '2rem',
              fontWeight: '400',
            }}
          >
            Practice with AI-powered CS fundamental & coding challenges tailored for your CodeTrack career path
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => handleTopicClick(CS_TOPICS[0])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.8rem 2rem',
                borderRadius: '8px',
                background: '#10b981',
                color: '#022c22',
                fontWeight: '700',
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Play size={18} fill="#022c22" />
              <span>Start a Quick Test</span>
            </button>

            {/* Quota Indicator Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.9rem',
              }}
            >
              <Zap size={18} color={canStartAI ? '#34d399' : '#f59e0b'} />
              <span>
                Daily Attempts:{' '}
                <strong style={{ color: canStartAI ? '#34d399' : '#fbbf24' }}>
                  {attemptsRemaining}/{maxAttempts}
                </strong>
              </span>

              {cooldownSeconds > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#fbbf24',
                    fontSize: '0.85rem',
                    marginLeft: '8px',
                  }}
                >
                  <Clock size={14} />
                  <span>Cooldown: {formatCooldown(cooldownSeconds)}</span>
                </span>
              )}

              <button
                onClick={onRefreshQuota}
                title="Refresh Quota"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CS TOPICS SECTION ── */}
      <div style={{ marginBottom: '3.5rem' }}>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            color: '#f8fafc',
          }}
        >
          Start Preparing for your campus placement
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1.75rem' }}>
          Choose from 15+ core CS topics for your mock interview test
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {CS_TOPICS.map((topic) => (
            <div
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              style={{
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = topic.color;
                e.currentTarget.style.boxShadow = `0 8px 20px -6px ${topic.bg}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: topic.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${topic.bg}`,
                }}
              >
                &lt;&gt;
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>
                  {topic.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROGRAMMING LANGUAGES SECTION ── */}
      <div style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            color: '#f8fafc',
          }}
        >
          Select a Programming Language
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1.75rem' }}>
          Choose language-specific conceptual questions for your mock assessment
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {LANGUAGES.map((lang) => (
            <div
              key={lang.id}
              onClick={() => handleTopicClick(lang)}
              style={{
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = lang.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>{lang.icon}</span>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>
                  {lang.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONFIG MODAL / DRAWER ── */}
      {showConfigModal && selectedTopic && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
              Configure Mock Test
            </h3>
            <p style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {selectedTopic.name}
            </p>

            {/* Difficulty Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Difficulty Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: difficulty === d ? '1px solid #10b981' : '1px solid #334155',
                      background: difficulty === d ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                      color: difficulty === d ? '#34d399' : '#cbd5e1',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selector */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Number of Questions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: questionCount === cnt ? '1px solid #3b82f6' : '1px solid #334155',
                      background: questionCount === cnt ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                      color: questionCount === cnt ? '#60a5fa' : '#cbd5e1',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Quota warning inside modal if limited */}
            {!canStartAI && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  {attemptsRemaining === 0 ? (
                    <span>Daily AI attempt quota reached (5/5). You can proceed using our prebuilt practice bank.</span>
                  ) : (
                    <span>Cooldown active ({formatCooldown(cooldownSeconds)}). You can start with our prebuilt practice bank.</span>
                  )}
                </div>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{
                  padding: '0.7rem 1.25rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#cbd5e1',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              {canStartAI ? (
                <button
                  disabled={loading}
                  onClick={() => handleStartSubmit(false)}
                  style={{
                    padding: '0.7rem 1.5rem',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#022c22',
                    border: 'none',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {loading ? 'Generating...' : 'Start Test'}
                </button>
              ) : (
                <button
                  disabled={loading}
                  onClick={() => handleStartSubmit(true)}
                  style={{
                    padding: '0.7rem 1.5rem',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {loading ? 'Loading...' : 'Start Offline Practice'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
