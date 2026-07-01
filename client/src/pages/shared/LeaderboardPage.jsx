import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';
import { Trophy, Shield, Filter, Search, RefreshCw, Award, Code, Compass, HelpCircle, Flame, Download, Settings, X, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { LEADERBOARD_CONFIG } from '../../config/LeaderboardConfig';

export function LeaderboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState('global'); // 'global', 'college', 'branch', 'hostel', 'year'

  // Pagination & Total
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalPages: 1, total: 0 });

  // Column Visibility Config
  const defaultVisibility = LEADERBOARD_CONFIG.platforms.reduce((acc, p) => ({ ...acc, [p.id]: true }), {});
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('codetrack_leaderboard_cols');
    return saved ? JSON.parse(saved) : defaultVisibility;
  });
  const [showColSettings, setShowColSettings] = useState(false);

  // Analytics Modal
  const [activeModal, setActiveModal] = useState(null); // { studentId, platformId, studentName }

  useEffect(() => {
    localStorage.setItem('codetrack_leaderboard_cols', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

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
    sortBy: 'scores.competitiveIndex',
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

      params.set('page', pagination.page);
      params.set('limit', pagination.limit);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getJson(`/leaderboard${query}`, token);
      if (data && Array.isArray(data.data)) {
        setRows(data.data);
        setPagination(p => ({ ...p, totalPages: data.totalPages, total: data.total }));
      } else if (Array.isArray(data)) {
        // Fallback for legacy api during transition
        setRows(data);
      }
    } catch (err) {
      console.error('Leaderboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [token, filters, leaderboardType, pagination.page, pagination.limit]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleSort = (key) => {
    setFilters(prev => {
      if (prev.sortBy === key) {
        return { ...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' };
      }
      return { ...prev, sortBy: key, sortOrder: 'desc' };
    });
    setPagination(p => ({ ...p, page: 1 }));
  };

  const exportCSV = () => {
    if (user?.role === 'student') return;
    
    const headers = ['Rank', 'Name', 'College', 'Branch', 'Competitive Index'];
    const csvData = rows.map(r => [r.rank, `"${r.name}"`, `"${r.college || ''}"`, `"${r.branch || ''}"`, r.competitiveIndex].join(','));
    const blob = new Blob([[headers.join(','), '\n', ...csvData].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leaderboard_export.csv';
    a.click();
  };

  const stickyStyle = (leftOffset, isHeader = false) => ({
    position: 'sticky',
    left: leftOffset,
    background: isHeader ? '#111827' : 'var(--bg-card)',
    zIndex: isHeader ? 10 : 2,
    borderRight: '1px solid rgba(255,255,255,0.05)'
  });

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
                onClick={() => { setLeaderboardType(tab.key); setPagination(p => ({ ...p, page: 1 })); }}
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
                🏆 Competitive Programming Leaderboard
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Rankings based on coding performance across LeetCode, CodeChef, GeeksforGeeks, and HackerRank using the Competitive Index.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="ct-button-secondary" onClick={() => setShowColSettings(!showColSettings)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={16} /> Customize Columns
              </button>
              {(user?.role === 'admin' || user?.role === 'coordinator') && (
                <button className="ct-button-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={16} /> Export
                </button>
              )}
            </div>
          </div>

          {/* COLUMN SETTINGS PANEL */}
          {showColSettings && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Visible Platforms:</strong>
              {LEADERBOARD_CONFIG.platforms.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={columnVisibility[p.id]} 
                    onChange={(e) => setColumnVisibility(prev => ({ ...prev, [p.id]: e.target.checked }))} 
                  />
                  {p.name}
                </label>
              ))}
            </div>
          )}

          {/* DYNAMIC FILTERS (ONLY ENABLED FOR GLOBAL VIEW) */}
          {leaderboardType === 'global' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div>
                <select className="ct-input" value={filters.college} onChange={(e) => handleFilterChange('college', e.target.value)}>
                  <option value="">All Colleges</option>
                  {filterOptions.colleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <select className="ct-input" value={filters.hostel} onChange={(e) => handleFilterChange('hostel', e.target.value)}>
                  <option value="">All Hostels</option>
                  {filterOptions.hostels.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <select className="ct-input" value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)}>
                  <option value="">All Branches</option>
                  {filterOptions.branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <select className="ct-input" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
                  <option value="">All Years</option>
                  {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ct-input"
                    placeholder="Search name, username, roll no..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    style={{ paddingRight: '2rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--text-muted)' }} />
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
        <div className="ct-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
              Loading rankings...
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Trophy size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
              No students found matching your criteria.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table className="ct-table" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    {/* GROUPED HEADERS */}
                    <tr>
                      <th style={{ ...stickyStyle('0px', true), minWidth: '60px', zIndex: 11 }}>Rank</th>
                      <th style={{ ...stickyStyle('60px', true), minWidth: '200px', zIndex: 11 }}>Student</th>
                      <th style={{ ...stickyStyle('260px', true), minWidth: '150px', zIndex: 11 }}>College</th>
                      
                      {LEADERBOARD_CONFIG.platforms.filter(p => columnVisibility[p.id]).map(p => (
                        <th key={`group-${p.id}`} colSpan={p.columns.length} style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', color: p.color, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {p.name}
                        </th>
                      ))}
                      <th style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', color: 'var(--accent-blue)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        Overall
                      </th>
                    </tr>
                    
                    {/* COLUMN HEADERS */}
                    <tr>
                      <th style={{ ...stickyStyle('0px', true), borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 11 }}></th>
                      <th style={{ ...stickyStyle('60px', true), borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 11 }}></th>
                      <th style={{ ...stickyStyle('260px', true), borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 11 }}></th>
                      
                      {LEADERBOARD_CONFIG.platforms.filter(p => columnVisibility[p.id]).map(p => 
                        p.columns.map((col, idx) => (
                          <th 
                            key={`col-${p.id}-${col.key}`} 
                            style={{ 
                              cursor: 'pointer', 
                              borderLeft: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              fontSize: '0.8rem',
                              borderBottom: '1px solid rgba(255,255,255,0.1)',
                              color: filters.sortBy === col.key ? '#fff' : 'var(--text-muted)',
                              textAlign: col.isScore ? 'right' : 'left',
                              userSelect: 'none'
                            }}
                            onClick={() => handleSort(col.key)}
                          >
                            {col.label} {filters.sortBy === col.key ? (filters.sortOrder === 'desc' ? '↓' : '↑') : ''}
                          </th>
                        ))
                      )}
                      
                      <th 
                        style={{ cursor: 'pointer', textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: filters.sortBy === 'scores.competitiveIndex' ? '#fff' : 'var(--accent-blue)', userSelect: 'none' }}
                        onClick={() => handleSort('scores.competitiveIndex')}
                      >
                        Competitive Index {filters.sortBy === 'scores.competitiveIndex' ? (filters.sortOrder === 'desc' ? '↓' : '↑') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} style={{ background: r.isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : (i % 2 === 0 ? 'var(--bg-card)' : 'rgba(255,255,255,0.01)') }}>
                        <td style={{ ...stickyStyle('0px'), fontWeight: r.isCurrentUser ? 700 : 400 }}>#{r.rank}</td>
                        <td style={{ ...stickyStyle('60px') }}>
                          <span
                            onClick={() => navigate(`/student/profile/view/${r.id}`)}
                            style={{ cursor: 'pointer', fontWeight: 600, color: r.isCurrentUser ? '#f3f4f6' : 'var(--accent-blue)', textDecoration: 'underline' }}
                          >
                            {r.name} {r.isCurrentUser && ' (You)'}
                          </span>
                        </td>
                        <td style={{ ...stickyStyle('260px'), fontSize: '0.85rem' }}>{r.college || '-'}</td>
                        
                        {LEADERBOARD_CONFIG.platforms.filter(p => columnVisibility[p.id]).map(p => 
                          p.columns.map((col, idx) => (
                            <td 
                              key={`cell-${p.id}-${col.key}`} 
                              style={{ 
                                borderLeft: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                textAlign: col.isScore ? 'right' : 'left',
                                fontWeight: col.isScore ? 600 : 400,
                                color: col.isScore ? p.color : 'inherit'
                              }}
                            >
                              {col.isScore ? (
                                <span 
                                  style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}
                                  onClick={() => setActiveModal({ studentId: r.id, studentName: r.name, platformId: p.id, row: r })}
                                >
                                  {col.accessor(r)}
                                </span>
                              ) : col.accessor(r)}
                            </td>
                          ))
                        )}
                        
                        <td style={{ fontWeight: 800, textAlign: 'right', fontSize: '1rem', color: 'var(--accent-blue)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                          {Math.round(r.competitiveIndex || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* PAGINATION */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button 
                    className="ct-button-secondary" 
                    disabled={pagination.page <= 1} 
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
                  </span>
                  <button 
                    className="ct-button-secondary" 
                    disabled={pagination.page >= pagination.totalPages} 
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* MODALS */}
      {activeModal && (
        <PlatformAnalyticsModal 
          isOpen={!!activeModal} 
          onClose={() => setActiveModal(null)} 
          data={activeModal} 
        />
      )}

    </AppShell>
  );
}

// ----------------------------------------------------
// PLATFORM ANALYTICS MODAL COMPONENT
// ----------------------------------------------------
function PlatformAnalyticsModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { row, platformId, studentName } = data;
  const config = LEADERBOARD_CONFIG.platforms.find(p => p.id === platformId);
  if (!config) return null;

  const breakDown = row.competitiveBreakdown?.[platformId] || {};
  const stats = row.platformStats?.[platformId] || row[platformId] || {}; // Hackerrank uses row.hackerrank

  return (
    <div className="hm-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="hm-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: config.color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} /> {config.name} Analytics
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Student: </span>
          <strong style={{ fontSize: '1.1rem' }}>{studentName}</strong>
          {stats.username && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>@{stats.username}</div>
          )}
        </div>

        <div className="ct-grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          {config.columns.map(col => !col.isScore && (
            <div key={col.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{col.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{col.accessor(row)}</div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Score Breakdown</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Base Score</span>
            <span>{Math.round(breakDown.baseScore || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Multiplier</span>
            <span>x{breakDown.multiplier?.toFixed(2) || '1.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', color: config.color }}>
            <span>Final Contribution</span>
            <span>{Math.round(breakDown.score || 0)} / 100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
