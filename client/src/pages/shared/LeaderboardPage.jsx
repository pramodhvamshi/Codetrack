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

  // Monthly & Weekly leaderboard states
  const [period, setPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [monthlyRows, setMonthlyRows] = useState({
    allYears: [],
    firstYear: [],
    secondYear: [],
    thirdYear: [],
    fourthYear: []
  });
  const [weeklyRows, setWeeklyRows] = useState({
    allYears: [],
    firstYear: [],
    secondYear: [],
    thirdYear: [],
    fourthYear: []
  });
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [monthlyYearTab, setMonthlyYearTab] = useState('all'); // 'all', '1', '2', '3', '4'

  const formatYear = (yr) => {
    if (yr === '1' || yr === 1) return '1st Year';
    if (yr === '2' || yr === 2) return '2nd Year';
    if (yr === '3' || yr === 3) return '3rd Year';
    if (yr === '4' || yr === 4) return '4th Year';
    return yr ? (yr.includes('Year') ? yr : `${yr} Year`) : '-';
  };

  const monthlyKeyMap = {
    all: 'allYears',
    '1': 'firstYear',
    '2': 'secondYear',
    '3': 'thirdYear',
    '4': 'fourthYear'
  };
  
  const activeKey = monthlyKeyMap[monthlyYearTab] || 'allYears';
  const currentMonthlyStudents = (period === 'weekly' ? weeklyRows : monthlyRows)[activeKey] || [];
  const widgetLoading = period === 'weekly' ? weeklyLoading : monthlyLoading;

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
      setMonthlyRows(data || {
        allYears: [],
        firstYear: [],
        secondYear: [],
        thirdYear: [],
        fourthYear: []
      });
    } catch (err) {
      console.error('Failed to load monthly leaderboard:', err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  /* ---------- LOAD WEEKLY RANKINGS ---------- */
  const loadWeeklyLeaderboard = async () => {
    if (!token) return;
    setWeeklyLoading(true);
    try {
      const data = await api.getJson('/leaderboard/weekly', token);
      setWeeklyRows(data || {
        allYears: [],
        firstYear: [],
        secondYear: [],
        thirdYear: [],
        fourthYear: []
      });
    } catch (err) {
      console.error('Failed to load weekly leaderboard:', err);
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyLeaderboard();
    loadWeeklyLeaderboard();
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

        {/* WEEKLY/MONTHLY LEADERBOARD WIDGET */}
        <div className="ct-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(17, 24, 39, 0.8))',
          borderColor: 'rgba(139, 92, 246, 0.25)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <style>{`
            @media (min-width: 768px) {
              .monthly-desktop-table {
                display: table !important;
              }
              .monthly-mobile-cards {
                display: none !important;
              }
            }
            @media (max-width: 767px) {
              .monthly-desktop-table {
                display: none !important;
              }
              .monthly-mobile-cards {
                display: flex !important;
                flex-direction: column;
                gap: 0.8rem;
              }
            }
          `}</style>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', color: '#f3f4f6' }}>
                🏆 {period === 'weekly' ? 'Weekly Solved Increase' : 'Monthly Solved Activity'} By Academic Year
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {period === 'weekly' 
                  ? 'Based on solved counts increase during the current week (Mon-Sun)' 
                  : 'Based on cumulative LeetCode and GeeksForGeeks activity during the current month'}
              </span>
            </div>

            {/* Toggle button */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.25)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: period === 'weekly' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: period === 'weekly' ? '#60a5fa' : '#9ca3af',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onClick={() => setPeriod('weekly')}
              >
                Weekly Increase
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: period === 'monthly' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: period === 'monthly' ? '#c084fc' : '#9ca3af',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onClick={() => setPeriod('monthly')}
              >
                Monthly Activity
              </button>
            </div>
          </div>

          {/* Year tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
            {[
              { key: 'all', label: 'All Years' },
              { key: '1', label: '1st Year' },
              { key: '2', label: '2nd Year' },
              { key: '3', label: '3rd Year' },
              { key: '4', label: '4th Year' }
            ].map(tab => (
              <button
                key={tab.key}
                className="ct-nav-item"
                style={monthlyYearTab === tab.key ? activeTabStyle : {}}
                onClick={() => setMonthlyYearTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {widgetLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              Loading standings...
            </div>
          ) : currentMonthlyStudents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No coding activity recorded for this period.
            </div>
          ) : (
            <>
              {/* DESKTOP/TABLET TABLE VIEW */}
              <div className="monthly-desktop-table" style={{ overflowX: 'auto', display: 'none', width: '100%' }}>
                <table className="ct-table" style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Rank</th>
                      <th>Student</th>
                      <th>Branch</th>
                      <th>Year</th>
                      <th style={{ color: '#F59E0B' }}>LeetCode Solved</th>
                      <th style={{ color: '#22C55E' }}>GFG Solved</th>
                      <th style={{ textAlign: 'right', color: period === 'weekly' ? '#60a5fa' : '#c084fc' }}>
                        {period === 'weekly' ? 'Weekly Increase' : 'Monthly Score'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthlyStudents.map((coder) => (
                      <tr key={coder.userId}>
                        <td style={{ fontWeight: 600 }}>
                          {coder.rank === 1 ? '🥇 Rank 1' : coder.rank === 2 ? '🥈 Rank 2' : coder.rank === 3 ? '🥉 Rank 3' : `#${coder.rank}`}
                        </td>
                        <td>
                          <span
                            onClick={() => navigate(`/student/profile/view/${coder.userId}`)}
                            style={{
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: 'var(--accent-blue)',
                              textDecoration: 'underline'
                            }}
                          >
                            {coder.name}
                          </span>
                        </td>
                        <td>{coder.branch || '-'}</td>
                        <td>{formatYear(coder.year)}</td>
                        <td>{coder.leetcodeSolved || 0}</td>
                        <td>{coder.gfgSolved || 0}</td>
                        <td style={{ fontWeight: 800, textAlign: 'right', fontSize: '1rem', color: period === 'weekly' ? '#60a5fa' : '#c084fc' }}>
                          {period === 'weekly' ? coder.weeklyScore : coder.monthlyScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="monthly-mobile-cards" style={{ display: 'none' }}>
                {currentMonthlyStudents.map((coder) => (
                  <div 
                    key={coder.userId}
                    className="ct-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          {coder.rank === 1 ? '🥇 Rank 1' : coder.rank === 2 ? '🥈 Rank 2' : coder.rank === 3 ? '🥉 Rank 3' : `#${coder.rank}`}
                        </span>
                        <span 
                          onClick={() => navigate(`/student/profile/view/${coder.userId}`)}
                          style={{
                            fontWeight: 600,
                            color: 'var(--accent-blue)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          {coder.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: period === 'weekly' ? '#60a5fa' : '#c084fc' }}>
                        {period === 'weekly' ? coder.weeklyScore : coder.monthlyScore} pts
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Branch: {coder.branch || '-'} | Year: {formatYear(coder.year)}</span>
                      <span>LC: {coder.leetcodeSolved || 0} | GFG: {coder.gfgSolved || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                      <td>{r.year || '-'}</td>
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
