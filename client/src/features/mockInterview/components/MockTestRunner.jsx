import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function MockTestRunner({ sessionData, onSubmitTest, onCancel, submitting }) {
  const { sessionId, topic, questions = [] } = sessionData;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(new Array(questions.length).fill(-1));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentQuestion = questions[currentIndex] || {};
  const currentAnswer = selectedAnswers[currentIndex];

  const handleOptionSelect = (optionIdx) => {
    const nextAnswers = [...selectedAnswers];
    nextAnswers[currentIndex] = optionIdx;
    setSelectedAnswers(nextAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    onSubmitTest({
      sessionId,
      userAnswers: selectedAnswers,
      durationSeconds: elapsedSeconds,
    });
  };

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = selectedAnswers.filter((ans) => ans !== -1).length;

  return (
    <div
      style={{
        minHeight: '80vh',
        background: '#090d16',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        padding: '2rem',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── TOP NAV / HEADER ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '1.25rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            background: '#1e293b',
            color: '#cbd5e1',
            border: '1px solid #334155',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Exit Test</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            {topic}
          </h3>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Answered {answeredCount} of {questions.length}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '0.9rem',
              fontWeight: '600',
            }}
          >
            <Clock size={16} />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '700' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* ── QUESTION BODY ── */}
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '1rem 0' }}>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: '600',
            lineHeight: '1.5',
            color: '#f8fafc',
            marginBottom: '2rem',
          }}
        >
          {currentQuestion.question}
        </h2>

        {/* ── OPTIONS GRID (a, b, c, d) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          {currentQuestion.options &&
            currentQuestion.options.map((opt, optIdx) => {
              const letter = String.fromCharCode(97 + optIdx); // a, b, c, d
              const isSelected = currentAnswer === optIdx;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleOptionSelect(optIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.1rem 1.4rem',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : '#131c2e',
                    border: isSelected ? '2px solid #10b981' : '1px solid #1e293b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontWeight: '700',
                      color: isSelected ? '#34d399' : '#94a3b8',
                      fontSize: '1rem',
                      width: '24px',
                    }}
                  >
                    {letter}.
                  </span>

                  <span
                    style={{
                      fontSize: '1.05rem',
                      color: isSelected ? '#ffffff' : '#cbd5e1',
                      fontWeight: isSelected ? '600' : '400',
                      flex: 1,
                    }}
                  >
                    {opt}
                  </span>

                  {isSelected && (
                    <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
        </div>

        {/* ── BOTTOM ACTION BUTTONS ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #1e293b',
            paddingTop: '1.75rem',
          }}
        >
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: currentIndex === 0 ? '#1e293b' : '#334155',
              color: currentIndex === 0 ? '#64748b' : '#f8fafc',
              border: 'none',
              fontWeight: '600',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ArrowLeft size={18} />
            <span>Previous Question</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              <span>Next Question</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                background: '#10b981',
                color: '#022c22',
                border: 'none',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <span>Submit Test</span>
              <CheckCircle size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── CONFIRM SUBMIT MODAL ── */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
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
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={48} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
              Submit Mock Test?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
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
                Continue Test
              </button>
              <button
                disabled={submitting}
                onClick={confirmSubmit}
                style={{
                  padding: '0.7rem 1.5rem',
                  borderRadius: '8px',
                  background: '#10b981',
                  color: '#022c22',
                  border: 'none',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
