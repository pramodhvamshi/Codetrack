import React, { useMemo, useState, useEffect } from 'react';

/**
 * HeatmapWidget — Reusable GitHub-style activity heatmap with built-in modal
 *
 * Props:
 *   data        — array of { date: "YYYY-MM-DD", count: number, activities?: [], platforms?: {} }
 *   showDetails — if true, activities[] are shown in the click modal
 *                 if false, a privacy note or only count is shown
 */

/**
 * HeatmapWidget — Reusable GitHub-style activity heatmap with built-in modal
 *
 * Props:
 *   data        — array of { date: "YYYY-MM-DD", count: number, activities?: [], platforms?: {} }
 *   showDetails — if true, activities[] are shown in the click modal
 *                 if false, a privacy note or only count is shown
 */
export function HeatmapWidget({ data = [], showDetails = true }) {
  const [selectedCell, setSelectedCell] = useState(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!selectedCell) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCell(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedCell) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCell]);

  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - 6);
  startDate.setHours(0, 0, 0, 0);

  const dataMap = useMemo(() => {
    return new Map((data || []).map(d => [d.date, d]));
  }, [data]);

  const cells = useMemo(() => {
    const list = [];
    const tempDate = new Date(startDate);
    const offset = tempDate.getDay();
    for (let i = 0; i < offset; i++) {
      list.push({ pad: true });
    }
    while (tempDate <= today) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const entry = dataMap.get(dateStr) || { date: dateStr, count: 0, activities: [] };
      list.push({
        date: dateStr,
        count: entry.count || 0,
        activities: entry.activities || []
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return list;
  }, [dataMap]);

  const getLevelClass = (count) => {
    if (count === 0) return 'level-0';
    if (count <= 2) return 'level-1';
    if (count <= 4) return 'level-2';
    if (count <= 7) return 'level-3';
    return 'level-4';
  };

  const weekdays = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

  const cleanTitle = (title) => {
    if (!title) return '';
    return title
      .replace(/^(LeetCode|GFG|CodeChef|GeeksforGeeks)\s+Solved:\s*"/i, '')
      .replace(/"$/, '');
  };

  const formattedDate = selectedCell
    ? new Date(selectedCell.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <>
      <div className="heatmap-wrapper" style={{ display: 'flex', gap: '0.8rem' }}>
        {/* Weekday labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {weekdays.map((day, idx) => (
            <div key={idx} style={{ height: 10, lineHeight: '10px' }}>{day}</div>
          ))}
        </div>
        <div className="heatmap-grid" style={{ gridAutoColumns: '10px' }}>
          {cells.map((cell, idx) => {
            if (cell.pad) {
              return <div key={`pad-${idx}`} style={{ width: 10, height: 10, opacity: 0 }} />;
            }
            return (
              <div
                key={cell.date}
                className={`heatmap-cell ${getLevelClass(cell.count)}`}
                onClick={() => setSelectedCell(cell)}
                title={`${cell.date}: ${cell.count} activities`}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </div>
      </div>

      {/* MODAL POPUP */}
      {selectedCell && (
        <div className="hm-modal-overlay" onClick={() => setSelectedCell(null)}>
          <div className="hm-modal" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedCell(null)} 
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '1.5rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0.2rem',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
            >
              ×
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
                  {formattedDate}
                </h3>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Total Activity Count: <strong style={{ color: 'var(--accent-blue)' }}>{selectedCell.count}</strong>
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                {selectedCell.count > 0 ? (
                  <>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Problems Solved
                    </h4>
                    {showDetails ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {selectedCell.activities && selectedCell.activities.length > 0 ? (
                          selectedCell.activities.map((act, idx) => {
                            const titleStr = cleanTitle(act.title);
                            return (
                              <div key={idx} style={{ fontSize: '0.9rem', color: '#e5e7eb', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--accent-blue)', flexShrink: 0 }}>•</span>
                                <span style={{ flexGrow: 1 }}>
                                  {act.link ? (
                                    <a href={act.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                                      {titleStr}
                                    </a>
                                  ) : (
                                    titleStr
                                  )}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ fontSize: '0.9rem', color: '#e5e7eb', fontStyle: 'italic' }}>
                            Details not available
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        Activity details are private
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
                    No activity on this day
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
