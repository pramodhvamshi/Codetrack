import React from 'react';
import { NODE_STATUSES } from '../constants/statuses';
import { X, Calendar, FileText, Globe, PlayCircle } from 'lucide-react';

const ResourceSidebar = ({ node, onClose, currentStatus, onStatusChange, readOnly }) => {
  if (!node) return null;

  const lastUpdated = node.updatedAt 
    ? new Date(node.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '2026-07-10';

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
      case 'playlist':
        return <PlayCircle size={15} color="var(--accent-red)" />;
      case 'documentation':
      case 'official_docs':
        return <FileText size={15} color="var(--accent-blue)" />;
      default:
        return <Globe size={15} color="var(--accent-purple)" />;
    }
  };

  return (
    <div 
      className="resource-sidebar animate-slide-in"
      style={{
        width: '380px',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.25)',
        overflowY: 'auto',
        height: '100%',
        zIndex: 50
      }}
    >
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>{node.title}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
            <Calendar size={13} /> Last updated: {lastUpdated}
          </span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}
          className="hover-lift"
        >
          <X size={20} />
        </button>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.06)', margin: 0 }} />

      {/* Description */}
      <div>
        <h4 style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Description</h4>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          {node.description || "No description provided for this topic yet."}
        </p>
      </div>

      {/* Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Difficulty</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{node.difficulty || 'N/A'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Time Estimate</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{node.estimatedTime || 'N/A'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Interview Value</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{node.interviewImportance || 'N/A'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Project Value</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{node.projectImportance || 'N/A'}</div>
        </div>
      </div>

      {/* Status Selector */}
      <div>
        <h4 style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Progress Status</h4>
        {readOnly ? (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Status: {currentStatus || 'Pending'} (Read-Only)
          </div>
        ) : (
          <select 
            value={currentStatus || NODE_STATUSES.PENDING}
            onChange={(e) => onStatusChange(node._id, e.target.value)}
            className="ct-input"
            style={{ width: '100%' }}
          >
            {Object.values(NODE_STATUSES).map(status => (
              <option key={status} value={status}>
                {status === NODE_STATUSES.BOOKMARKED ? '⭐ Bookmarked' : status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Free Resources List */}
      <div style={{ flex: 1 }}>
        <h4 style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Recommended Resources</h4>
        {!node.resources || node.resources.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No resources linked yet.</p>
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
                    color: 'var(--accent-blue)', 
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'all 0.2s'
                  }}
                  className="hover-lift"
                >
                  {getResourceIcon(res.type)}
                  <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{res.title}</span>
                  {res.isPremium && <span style={{ fontSize: '0.65rem', color: '#F59E0B', fontWeight: 800 }}>[PREMIUM]</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Personal Notes (Placeholder disabled) */}
      <div style={{ marginTop: 'auto' }}>
        <h4 style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Personal Notes</h4>
        <textarea
          disabled
          placeholder="Personal notes are coming soon..."
          className="ct-input"
          style={{ width: '100%', resize: 'none', height: '60px', opacity: 0.5, fontSize: '0.8rem' }}
        />
      </div>
    </div>
  );
};

export default ResourceSidebar;
