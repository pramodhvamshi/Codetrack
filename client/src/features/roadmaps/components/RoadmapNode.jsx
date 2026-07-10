import React from 'react';
import { NODE_STATUSES } from '../constants/statuses';

const getStatusColors = (status, isSelected, isHighlighted) => {
  if (isHighlighted) {
    return {
      border: 'var(--accent-blue)',
      bg: 'rgba(59,130,246,0.12)',
      text: '#3b82f6',
      shadow: '0 0 15px rgba(59,130,246,0.45)'
    };
  }

  const borderBase = isSelected ? 'var(--accent-blue)' : '';
  const shadowBase = isSelected ? '0 0 10px rgba(59,130,246,0.3)' : 'none';

  switch (status) {
    case NODE_STATUSES.DONE:
      return {
        border: 'var(--success)',
        bg: 'rgba(34,197,94,0.06)',
        text: 'var(--success)',
        shadow: isSelected ? '0 0 10px rgba(34,197,94,0.3)' : 'none'
      };
    case NODE_STATUSES.IN_PROGRESS:
      return {
        border: 'var(--warning)',
        bg: 'rgba(245,158,11,0.06)',
        text: 'var(--warning)',
        shadow: isSelected ? '0 0 10px rgba(245,158,11,0.3)' : 'none'
      };
    case NODE_STATUSES.BOOKMARKED:
      return {
        border: 'var(--accent-blue)',
        bg: 'rgba(59,130,246,0.06)',
        text: 'var(--accent-blue)',
        shadow: isSelected ? '0 0 10px rgba(59,130,246,0.3)' : 'none'
      };
    case NODE_STATUSES.SKIP:
      return {
        border: 'rgba(255,255,255,0.15)',
        bg: 'rgba(255,255,255,0.01)',
        text: 'var(--text-muted)',
        shadow: shadowBase
      };
    default:
      return {
        border: borderBase || 'rgba(255,255,255,0.06)',
        bg: 'var(--bg-secondary)',
        text: '#e5e7eb',
        shadow: shadowBase
      };
  }
};

const RoadmapNode = ({ node, status, isSelected, isHighlighted, onClick }) => {
  const colors = getStatusColors(status, isSelected, isHighlighted);

  // Group container style
  if (node.nodeType === 'group') {
    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          border: '1px dashed rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0.75rem',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
          {node.title}
        </span>
      </div>
    );
  }

  // Label style (pure text header)
  if (node.nodeType === 'label' || node.nodeType === 'paragraph') {
    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {node.title}
        </span>
      </div>
    );
  }

  // Topic & Subtopic styles (Milestones cards)
  const isSubtopic = node.nodeType === 'subtopic';

  return (
    <button 
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: isSubtopic ? '6px' : '8px',
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        cursor: 'pointer',
        boxShadow: colors.shadow,
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 1rem',
        gap: '0.2rem',
        textDecoration: 'none'
      }}
      className="roadmap-node-box hover-lift"
    >
      <span 
        style={{ 
          fontSize: isSubtopic ? '0.8rem' : '0.85rem', 
          color: colors.text, 
          fontWeight: isSubtopic ? 500 : 700,
          textAlign: 'center',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          width: '100%'
        }}
      >
        {node.title}
      </span>
      
      {node.isOptional && (
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 800 }}>
          Optional
        </span>
      )}
    </button>
  );
};

export default RoadmapNode;
