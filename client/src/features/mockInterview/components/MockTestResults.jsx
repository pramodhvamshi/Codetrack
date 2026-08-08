import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowLeft, ChevronUp, ChevronDown, Check, X, Award, RotateCcw } from 'lucide-react';

export function MockTestResults({ resultData, onGoBack, onRetake }) {
  const { session, score = 0, percentage = 0, totalQuestions = 10 } = resultData || {};
  const { topic = 'Mock Test', questions = [], userAnswers = [] } = session || {};

  const [showDetailedAnswers, setShowDetailedAnswers] = useState(true);

  const isPassed = percentage >= 60;

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        paddingBottom: '3rem',
      }}
    >
      {/* ── TOP HERO SCORE CARD (Matching Screenshots 3 & 4) ── */}
      <div
        style={{
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          marginBottom: '2.5rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Large Green Circle Checkmark Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '4px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Check size={44} color="#10b981" strokeWidth={3} />
        </div>

        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            color: '#ffffff',
            marginBottom: '0.5rem',
          }}
        >
          Quiz Completed!
        </h1>

        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: '700',
            color: '#34d399',
            marginBottom: '1rem',
          }}
        >
          Your Score: {score}/{totalQuestions}
        </div>

        <p
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: isPassed ? '#a7f3d0' : '#cbd5e1',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem',
          }}
        >
          {isPassed
            ? 'Great job! You demonstrated solid technical understanding.'
            : "Don't give up! Try again to improve your score."}
        </p>

        {/* Action Buttons */}
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
            onClick={onGoBack}
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
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>

          {onRetake && (
            <button
              onClick={onRetake}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              <span>Retake Test</span>
            </button>
          )}

          <button
            onClick={() => setShowDetailedAnswers((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            <span>{showDetailedAnswers ? 'Hide results' : 'Show results'}</span>
            {showDetailedAnswers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* ── DETAILED SUBMITTED ANSWERS REVIEW ── */}
      {showDetailedAnswers && (
        <div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#ffffff',
            }}
          >
            Your submitted answers
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {questions.map((q, qIdx) => {
              const selectedOptIdx = userAnswers[qIdx];
              const isCorrect = selectedOptIdx === q.correctIndex;

              return (
                <div
                  key={q.id || qIdx}
                  style={{
                    background: '#10172a',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* Question Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                      Question {qIdx + 1}
                    </span>

                    {/* Status Pill (Incorrect in red, Correct in green) */}
                    <span
                      style={{
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: isCorrect ? '#065f46' : '#9f1239',
                        color: isCorrect ? '#a7f3d0' : '#fecdd3',
                      }}
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      lineHeight: '1.5',
                      color: '#ffffff',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {q.question}
                  </h3>

                  {/* Options List (Matching Screenshot 3 & 4) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {q.options &&
                      q.options.map((optText, optIdx) => {
                        const letter = String.fromCharCode(97 + optIdx); // a, b, c, d
                        const isThisCorrectOpt = optIdx === q.correctIndex;
                        const isUserSelection = optIdx === selectedOptIdx;

                        let optionBg = '#131c2e';
                        let optionBorder = '1px solid #1e293b';
                        let textColor = '#cbd5e1';
                        let icon = null;

                        if (isThisCorrectOpt) {
                          // Correct Option -> Highlighted in dark green
                          optionBg = '#065f46';
                          optionBorder = '1px solid #10b981';
                          textColor = '#ffffff';
                          icon = <Check size={18} color="#34d399" />;
                        } else if (isUserSelection && !isCorrect) {
                          // User's wrong selection -> Highlighted in dark red
                          optionBg = '#9f1239';
                          optionBorder = '1px solid #f43f5e';
                          textColor = '#ffffff';
                          icon = <X size={18} color="#fca5a5" />;
                        }

                        return (
                          <div
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem 1.25rem',
                              borderRadius: '10px',
                              background: optionBg,
                              border: optionBorder,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span
                                style={{
                                  fontWeight: '700',
                                  color: isThisCorrectOpt ? '#a7f3d0' : isUserSelection ? '#fecdd3' : '#94a3b8',
                                  fontSize: '1rem',
                                  width: '20px',
                                }}
                              >
                                {letter}.
                              </span>
                              <span style={{ fontSize: '1rem', color: textColor, fontWeight: isThisCorrectOpt || isUserSelection ? '600' : '400' }}>
                                {optText}
                              </span>
                            </div>

                            {icon && <div>{icon}</div>}
                          </div>
                        );
                      })}
                  </div>

                  {/* ── EXPLANATION BOX (Light Blue Tint Container matching Screenshot 3 & 4) ── */}
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '10px',
                      padding: '1.25rem 1.5rem',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: '#38bdf8',
                        margin: '0 0 0.5rem 0',
                      }}
                    >
                      Explanation:
                    </h4>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: '#94a3b8',
                        lineHeight: '1.6',
                        margin: 0,
                      }}
                    >
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
