import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';
import { Trophy, Shield, Filter, Search, RefreshCw, Award, Code, Compass, HelpCircle, Flame } from 'lucide-react';

export function LeaderboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState('global'); // 'global', 'college', 'branch', 'hostel', 'year'

  // Monthly leaderboard states
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  // Dropdown options loaded from API
  const [filterOptions, setFilterOptions] = useState({
    colleges: [],
    hostels: [],
    branches: [],
    years: []
  });

  const [filters, setFilters] = useState({
    college: '',
    hostel: '',
    branch: '',
    year: '',
    name: '',
    sortBy: 'scores.weightedRankScore',
    sortOrder: 'desc'
  });

  /* ---------- LOAD DROPDOWN OPTIONS ---------- */
  useEffect(() => {
    const fetchOptions = async () => {
      if (!token) return;
      try {
        const data = await api.getJson('/leaderboard/filters', token);
        setFilterOptions(data);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchOptions();
  }, [token]);

  /* ---------- LOAD MONTHLY RANKINGS ---------- */
  const loadMonthlyLeaderboard = async () => {
    if (!token) return;
    setMonthlyLoading(true);
    try {
      const data = await api.getJson('/leaderboard/monthly', token);
      setMonthlyRows(data);
    } catch (err) {
      console.error('Failed to load monthly leaderboard:', err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyLeaderboard();
  }, [token]);

  /* ---------- LOAD LEADERS ---------- */
  const loadLeaderboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Apply correct type scope
      if (leaderboardType !== 'global') {
        params.set('type', leaderboardType);
      }
      
      // Only attach manual filters if leaderboard type is global
      if (leaderboardType === 'global') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
      } else {
        // Still allow searching by name and changing sorting
        if (filters.name) params.set('name', filters.name);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      }

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getJson(`/leaderboard${query}`, token);
      setRows(data);
    } catch (err) {
      console.error('Leaderboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [token, filters, leaderboardType]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const activeTabStyle = {
    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
    color: '#0b1120',
    fontWeight: 700
  };

  return (
    <AppShell active="leaderboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* LEADERBOARD SCOPE TABS */}
        <div className="ct-card" style={{ padding: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {[
              { key: 'global', label: '🌐 Global' },
              { key: 'college', label: `🏛️ College: ${user?.college || 'My College'}` },
              { key: 'branch', label: `💻 Branch: ${user?.branch || 'My Branch'}` },
              { key: 'hostel', label: `🏨 Hostel: ${user?.hostel || 'My Hostel'}` },
              { key: 'year', label: `📅 Year: ${user?.year || 'My Year'}` }
            ].map(tab => (
              <button
                key={tab.key}
                className="ct-nav-item"
                style={leaderboardType === tab.key ? activeTabStyle : {}}
                onClick={() => setLeaderboardType(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="ct-button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={loadLeaderboard}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* MONTHLY LEADERBOARD WIDGET */}
        <div className="ct-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(17, 24, 39, 0.8))',
          borderColor: 'rgba(139, 92, 246, 0.25)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', color: '#f3f4f6' }}>
              <Flame color="#ef4444" fill="#ef4444" size={20} /> Top Coders of the Month
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Based on monthly solved count (LeetCode + GFG + CodeChef)
            </span>
          </div>
          
          {monthlyLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading monthly standings...
            </div>
          ) : monthlyRows.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No monthly activity recorded yet.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {monthlyRows.map((coder) => {
                let medal = '';
                let borderCol = 'rgba(255, 255, 255, 0.05)';
                let bgGradient = 'rgba(255, 255, 255, 0.01)';
                if (coder.rank === 1) {
                  medal = '🥇';
                  borderCol = 'rgba(245, 158, 11, 0.4)';
                  bgGradient = 'rgba(245, 158, 11, 0.05)';
                } else if (coder.rank === 2) {
                  medal = '🥈';
                  borderCol = 'rgba(156, 163, 175, 0.4)';
                  bgGradient = 'rgba(156, 163, 175, 0.05)';
                } else if (coder.rank === 3) {
                  medal = '🥉';
                  borderCol = 'rgba(180, 83, 9, 0.4)';
                  bgGradient = 'rgba(180, 83, 9, 0.05)';
                }
                return (
                  <div
                    key={coder.userId}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: bgGradient,
                      border: `1px solid ${borderCol}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {medal || `#${coder.rank}`}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#f3f4f6',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/student/profile/view/${coder.userId}`)}
                        >
                          {coder.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {coder.branch}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                        {coder.monthlyScore}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>solved</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* HEADER & FILTER DROPDOWNS */}
        <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy color="#F59E0B" /> CP Placement Readiness Leaderboard
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Ranking evaluated dynamically based on CP solved counts, streaks, activity consistency, and contest ratings.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="ct-input"
                style={{ width: '160px' }}
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(':');
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <option value="scores.weightedRankScore:desc">Readiness Score ↓</option>
                <option value="scores.weightedRankScore:asc">Readiness Score ↑</option>
                <option value="scores.totalScore:desc">CP Score ↓</option>
                <option value="scores.totalScore:asc">CP Score ↑</option>
                <option value="name:asc">Name A→Z</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC FILTERS (ONLY ENABLED FOR GLOBAL VIEW) */}
          {leaderboardType === 'global' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div>
                <label className="ct-label">College</label>
                <select className="ct-input" value={filters.college} onChange={(e) => handleFilterChange('college', e.target.value)}>
                  <option value="">All Colleges</option>
                  {filterOptions.colleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="ct-label">Hostel</label>
                <select className="ct-input" value={filters.hostel} onChange={(e) => handleFilterChange('hostel', e.target.value)}>
                  <option value="">All Hostels</option>
                  {filterOptions.hostels.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="ct-label">Branch</label>
                <select className="ct-input" value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)}>
                  <option value="">All Branches</option>
                  {filterOptions.branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="ct-label">Year</label>
                <select className="ct-input" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
                  <option value="">All Years</option>
                  {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="ct-label">Name Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ct-input"
                    placeholder="Search students..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {leaderboardType !== 'global' && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Compass size={18} color="var(--accent-purple)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                You are currently viewing the contextual leaderboard scoped to your own <strong>{leaderboardType.toUpperCase()}</strong> details. External filters are locked.
              </span>
            </div>
          )}
        </div>

        {/* DATA TABLE */}
        <div className="ct-card" style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
              Loading rankings...
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No students found matching filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th style={{ width: '40px' }}>Status</th>
                    <th>Name</th>
                    <th>College</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th style={{ color: '#F59E0B' }}>LC</th>
                    <th style={{ color: '#ef4444' }}>CC</th>
                    <th style={{ color: '#22C55E' }}>GFG</th>
                    <th style={{ textAlign: 'right', color: 'var(--accent-blue)' }}>Readiness Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        background: r.isCurrentUser
                          ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(17, 24, 39, 0.3))'
                          : undefined,
                        borderLeft: r.isCurrentUser ? '3px solid var(--accent-blue)' : undefined
                      }}
                    >
                      <td style={{ fontWeight: r.isCurrentUser ? 700 : 400 }}>#{r.rank}</td>
                      <td>
                        <span style={{ color: r.activityStatus === 'active' ? '#22C55E' : '#6b7280', fontSize: '1.2rem', lineHeight: '1' }}>
                          {r.activityStatus === 'active' ? '●' : '○'}
                        </span>
                      </td>
                      <td>
                        <span
                          onClick={() => navigate(`/student/profile/view/${r.id}`)}
                          style={{
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: r.isCurrentUser ? '#f3f4f6' : 'var(--accent-blue)',
                            textDecoration: 'underline'
                          }}
                        >
                          {r.name} {r.isCurrentUser && ' (You)'}
                        </span>
                      </td>
                      <td>{r.college || '-'}</td>
                      <td>{r.branch || '-'}</td>
                      <td>Year {r.year || '-'}</td>
                      <td>{Math.round(r.lcScore || 0)}</td>
                      <td>{Math.round(r.ccScore || 0)}</td>
                      <td>{Math.round(r.gfgScore || 0)}</td>
                      <td style={{ fontWeight: 800, textAlign: 'right', fontSize: '1rem', color: 'var(--accent-blue)' }}>
                        {Math.round(r.weightedRankScore || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
