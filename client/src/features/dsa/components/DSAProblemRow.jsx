import React from 'react';

const DSAProblemRow = ({ problem, status, onStatusChange, readOnly, isLast }) => {
  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'var(--success)';
      case 'Medium': return 'var(--warning)';
      case 'Hard': return 'var(--accent-red)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'Completed': return 'var(--success)';
      case 'Revisit': return 'var(--warning)';
      default: return 'var(--border)';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '1rem 1.5rem', 
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      gap: '1rem'
    }}>
      <div style={{ minWidth: '40px', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => !readOnly && onStatusChange(problem._id, status === 'Completed' ? 'Pending' : 'Completed')}
          disabled={readOnly}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${getStatusColor(status)}`,
            backgroundColor: status === 'Completed' ? 'var(--success)' : 'transparent',
            cursor: readOnly ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all 0.2s'
          }}
        >
          {status === 'Completed' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <a 
          href={problem.leetcodeUrl || '#'} 
          target="_blank" 
          rel="noreferrer"
          style={{ 
            color: 'var(--text-primary)', 
            textDecoration: 'none', 
            fontWeight: 500,
            fontSize: '1rem'
          }}
          className="hover-lift"
        >
          {problem.title}
        </a>

        {problem.resources && problem.resources.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            {problem.resources.map((res, i) => {
              let typeEmoji = '🔗';
              if (res.type === 'video' || res.type === 'playlist') typeEmoji = '🎥';
              else if (res.type === 'documentation' || res.type === 'official_docs') typeEmoji = '📄';
              else if (res.type === 'article') typeEmoji = '📝';
              else if (res.type === 'github') typeEmoji = '💻';
              else if (res.type === 'book') typeEmoji = '📚';
              else if (res.type === 'practice') typeEmoji = '⚔️';
              
              return (
                <a 
                  key={i} 
                  href={res.url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-blue)',
                    textDecoration: 'none',
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.12)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                  className="hover-lift"
                >
                  <span>{typeEmoji}</span>
                  <span>{res.title}</span>
                  {res.isPremium && <span style={{ fontSize: '0.6rem', color: '#F59E0B', fontWeight: 800, marginLeft: '0.1rem' }}>[PREMIUM]</span>}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: getDifficultyColor(problem.difficulty),
          backgroundColor: `${getDifficultyColor(problem.difficulty)}20`,
          padding: '0.2rem 0.6rem',
          borderRadius: '999px'
        }}>
          {problem.difficulty}
        </span>

        <select 
          value={status || 'Pending'}
          onChange={(e) => onStatusChange(problem._id, e.target.value)}
          disabled={readOnly}
          className="ct-input"
          style={{ width: '130px', padding: '0.4rem', fontSize: '0.85rem' }}
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Revisit">Revisit</option>
        </select>
      </div>
    </div>
  );
};

export default DSAProblemRow;
