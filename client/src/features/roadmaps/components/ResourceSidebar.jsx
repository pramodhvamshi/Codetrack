import React from 'react';
import { NODE_STATUSES } from '../constants/statuses';
import { X, Calendar, FileText, Globe, PlayCircle, Clock, BookOpen, Sparkles } from 'lucide-react';

const ResourceSidebar = ({ node, onClose, currentStatus, onStatusChange, readOnly }) => {
  if (!node || readOnly) return null;

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
      case 'playlist':
        return <PlayCircle size={16} className="text-red-400" />;
      case 'documentation':
      case 'official_docs':
        return <FileText size={16} className="text-blue-400" />;
      default:
        return <Globe size={16} className="text-purple-400" />;
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 999
        }}
      />

      {/* Slide-Over Drawer from Right */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '90vw',
          backgroundColor: '#0f172a',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          gap: '1.5rem',
          overflowY: 'auto',
          color: '#f8fafc'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Topic Resource Guide
            </span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', color: '#ffffff', fontWeight: 800 }}>
              {node.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.08)', margin: 0 }} />

        {/* Progress Status Dropdown Selector */}
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>
            Your Learning Status
          </label>
          <select 
            value={currentStatus || NODE_STATUSES.PENDING}
            onChange={(e) => onStatusChange(node._id, e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={NODE_STATUSES.PENDING}>⚪ Pending (Not Started)</option>
            <option value={NODE_STATUSES.IN_PROGRESS}>🟡 In Progress</option>
            <option value={NODE_STATUSES.DONE}>🟢 Completed (Done)</option>
            <option value={NODE_STATUSES.BOOKMARKED}>⭐ Bookmarked</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Description
          </h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            {node.description || "Comprehensive guide and overview for this topic in the curriculum."}
          </p>
        </div>

        {/* Metadata Badges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Difficulty</div>
            <div style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 600 }}>{node.difficulty || 'Intermediate'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Est. Time</div>
            <div style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 600 }}>{node.estimatedTime || '1-2 Days'}</div>
          </div>
        </div>

        {/* Curated Resources List */}
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Curated Resources
          </h4>
          {!node.resources || node.resources.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Standard documentation & practice resources linked.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {node.resources.map((res, i) => (
                <li key={i}>
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      color: '#60a5fa', 
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      fontWeight: 500
                    }}
                  >
                    {getResourceIcon(res.type)}
                    <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{res.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default ResourceSidebar;
