import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedApi } from '../../api/feedApi';

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], announcements: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await feedApi.globalSearch(query);
          if (res.success && res.data) {
            setResults(res.data);
            setIsOpen(true);
          }
        } catch (err) {
          console.error('Global search error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ students: [], announcements: [] });
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
        if (!query.trim()) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleToggleExpand = () => {
    setIsExpanded(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      {!isExpanded ? (
        /* Minimized Circular Search Icon Button */
        <button
          type="button"
          onClick={handleToggleExpand}
          title="Search students, announcements..."
          style={{
            background: 'var(--bg-secondary, #0f172a)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.95rem',
            color: 'var(--text-primary, #f8fafc)',
            transition: 'all 0.2s ease'
          }}
        >
          🔍
        </button>
      ) : (
        /* Expanded Input Field */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-secondary, #0f172a)',
          border: '1px solid var(--accent-blue, #3b82f6)',
          borderRadius: '999px',
          padding: '0.3rem 0.75rem',
          fontSize: '0.85rem',
          width: '240px',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease'
        }}>
          <span style={{ marginRight: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, announcements..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.82rem',
              width: '100%'
            }}
          />
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsExpanded(false);
              setIsOpen(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
              marginLeft: '0.3rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Results Popover Dropdown */}
      {isOpen && isExpanded && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '280px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '14px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          padding: '0.75rem',
          maxHeight: '350px',
          overflowY: 'auto'
        }}>
          {loading && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', padding: '0.5rem' }}>Searching...</div>}

          {!loading && results.students.length === 0 && results.announcements.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', padding: '0.5rem' }}>No results found</div>
          )}

          {results.students.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, marginBottom: '0.35rem' }}>
                Students & Alumni
              </div>
              {results.students.map(st => (
                <div
                  key={st._id}
                  onClick={() => {
                    setIsOpen(false);
                    setIsExpanded(false);
                    navigate(`/alumni`);
                  }}
                  style={{ padding: '0.4rem 0.5rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>{st.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>{st.role} • {st.college || 'CBIT'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.announcements.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, marginBottom: '0.35rem' }}>
                Announcements
              </div>
              {results.announcements.map(anc => (
                <div
                  key={anc._id}
                  onClick={() => {
                    setIsOpen(false);
                    setIsExpanded(false);
                    navigate(`/feed`);
                  }}
                  style={{ padding: '0.4rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>{anc.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
