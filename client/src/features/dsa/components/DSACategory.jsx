import React, { useState } from 'react';
import DSAProblemRow from './DSAProblemRow';
import { ChevronDown, ChevronRight } from 'lucide-react';

const DSACategory = ({ category, progress, onStatusChange, readOnly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const completedCount = category.problems.filter(p => progress[p._id] === 'Completed').length;
  const totalCount = category.problems.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="ct-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
      <div 
        className="ct-card-header hover-lift" 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1rem 1.5rem', backgroundColor: 'var(--bg-secondary)', borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isOpen ? <ChevronDown size={20} color="var(--text-muted)"/> : <ChevronRight size={20} color="var(--text-muted)"/>}
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{category.title}</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {completedCount} / {totalCount} completed
          </span>
          <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: 'var(--success)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="ct-card-content" style={{ padding: 0 }}>
          {category.problems.length === 0 ? (
            <div style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>No problems in this category.</div>
          ) : (
            category.problems.map((problem, index) => (
              <DSAProblemRow 
                key={problem._id} 
                problem={problem} 
                status={progress[problem._id] || 'Pending'} 
                onStatusChange={onStatusChange}
                readOnly={readOnly}
                isLast={index === category.problems.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DSACategory;
