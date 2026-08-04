import React from 'react';
import { CheckCircle2, Clock, Star } from 'lucide-react';

export const TopicCard = ({ node, status, onClick }) => {
  const isDone = status === 'Done';
  const isInProgress = status === 'In Progress';
  const isBookmarked = status === 'Bookmarked';

  let btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.5rem',
    border: '2px solid #22c55e',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontWeight: 600,
    fontSize: '0.9rem',
    minWidth: '240px',
    maxWidth: '320px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  };

  if (isDone) {
    btnStyle = {
      ...btnStyle,
      backgroundColor: '#064e3b',
      borderColor: '#10b981',
      color: '#a7f3d0',
      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
    };
  } else if (isInProgress) {
    btnStyle = {
      ...btnStyle,
      backgroundColor: '#451a03',
      borderColor: '#f59e0b',
      color: '#fde68a',
      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
    };
  } else if (isBookmarked) {
    btnStyle = {
      ...btnStyle,
      backgroundColor: '#3b0764',
      borderColor: '#a855f7',
      color: '#e9d5ff',
      boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)'
    };
  }

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(node)}
      style={btnStyle}
    >
      {isDone && (
        <CheckCircle2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />
      )}
      {isInProgress && (
        <Clock size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
      )}
      {isBookmarked && (
        <Star size={16} style={{ color: '#c084fc', flexShrink: 0 }} />
      )}
      <span>{node.title}</span>
    </button>
  );
};

export default TopicCard;
