import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Play, FileText, Check, MinusCircle, Bookmark } from 'lucide-react';
import ConnectionLine from './ConnectionLine';

const getStatusIcon = (status) => {
  switch (status) {
    case 'Done': return <CheckCircle2 size={18} color="var(--accent-green)" />;
    case 'In Progress': return <Clock size={18} color="var(--accent-yellow)" />;
    case 'Skipped': return <MinusCircle size={18} color="var(--text-muted)" />;
    case 'Bookmarked': return <Bookmark size={18} color="var(--accent-purple)" />;
    default: return <Circle size={18} color="rgba(255,255,255,0.2)" />;
  }
};

const TreeNode = ({ node, progress, onNodeClick, selectedNodeId, isRoot = false }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node._id;
  const status = progress[node._id] || 'Pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div 
        onClick={() => onNodeClick(node)}
        className={`hover-lift ${isSelected ? 'selected' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: isRoot ? '1rem' : '0.75rem 1rem',
          backgroundColor: isSelected ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
          border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isRoot ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
          zIndex: 2,
        }}
      >
        {hasChildren ? (
          <div 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              padding: '0.2rem', borderRadius: '4px', background: 'var(--border)' 
            }}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        ) : (
          <div style={{ width: '20px' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          {getStatusIcon(status)}
          <span style={{ 
            fontWeight: isRoot ? '600' : '500', 
            fontSize: isRoot ? '1.1rem' : '1rem',
            color: status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: status === 'Done' ? 'line-through' : 'none'
          }}>
            {node.title}
          </span>
        </div>
        
        {/* Difficulty badge */}
        {node.difficulty && (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '12px',
            background: node.difficulty === 'Advanced' ? 'rgba(239,68,68,0.1)' : 
                        node.difficulty === 'Intermediate' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            color: node.difficulty === 'Advanced' ? 'var(--accent-red)' : 
                   node.difficulty === 'Intermediate' ? 'var(--accent-yellow)' : 'var(--accent-green)'
          }}>
            {node.difficulty}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1.5rem', marginTop: '1rem', gap: '0.5rem', position: 'relative' }}>
          <ConnectionLine />
          {node.children.map((child, index) => (
            <div key={child._id} style={{ position: 'relative' }}>
              {/* L-shaped connector for each child */}
              <div style={{
                position: 'absolute',
                left: '-1.5rem',
                top: '1.25rem',
                width: '1.5rem',
                height: '1px',
                backgroundColor: 'var(--border)'
              }} />
              <TreeNode 
                node={child} 
                progress={progress} 
                onNodeClick={onNodeClick} 
                selectedNodeId={selectedNodeId} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
