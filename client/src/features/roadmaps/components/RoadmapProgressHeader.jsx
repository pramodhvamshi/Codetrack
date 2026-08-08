import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';

export const RoadmapProgressHeader = ({
  title,
  description,
  completionPercent = 0,
  completedNodes = 0,
  totalNodes = 0,
  isCoordinator = false,
  studentId,
  readOnly = false,
  onContinueLearning
}) => {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '1rem 2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        
        {/* Left Section: Back Button & Course Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {isCoordinator ? (
            <Link
              to={`/coordinator/students/${studentId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#60a5fa',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} /> Student Profile
            </Link>
          ) : (
            <Link
              to="/roadmaps"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#60a5fa',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} /> All Roadmaps
            </Link>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {title || 'Learning Roadmap'}
              </h1>
              {isCoordinator && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  backgroundColor: '#1e3a8a',
                  color: '#93c5fd',
                  border: '1px solid #1d4ed8'
                }}>
                  Coordinator Mode
                </span>
              )}
            </div>
            {description && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Progress Track & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          
          {/* Progress Bar Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', minWidth: '180px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>Progress</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>
                {completionPercent}% <span style={{ color: '#64748b', fontWeight: 400 }}>({completedNodes}/{totalNodes})</span>
              </span>
            </div>

            {/* Gradient Progress Bar */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completionPercent}%`,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* Continue Learning Action Button */}
          {!readOnly && onContinueLearning && (
            <button
              type="button"
              onClick={onContinueLearning}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <Play size={14} fill="#ffffff" />
              <span>{completedNodes > 0 ? 'Continue Learning' : 'Start Learning'}</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default RoadmapProgressHeader;
