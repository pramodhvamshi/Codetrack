import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';
import { Users, UserCheck, UserX, BarChart3, Star, Award, Download, Search, RefreshCw, X, ArrowUpDown } from 'lucide-react';

export function CoordinatorDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Top rankings
  const [topCoders, setTopCoders] = useState([]);
  const [codersLoading, setCodersLoading] = useState(true);

  // Branch statistics
  const [branchStats, setBranchStats] = useState([]);
  const [branchSort, setBranchSort] = useState({ key: 'branch', desc: false });

  // Modal lists
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'total', 'active', 'inactive', 'ready', 'needs_improvement', 'at_risk'
  const [modalTitle, setModalTitle] = useState('');
  const [modalStudents, setModalStudents] = useState([]);
  const [modalTotal, setModalTotal] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [modalSearch, setModalSearch] = useState('');
  const [modalBranch, setModalBranch] = useState('');
  const [modalGoal, setModalGoal] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);

  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getJson('/coordinator/dashboard', token);
      setData(res);
    } catch (err) {
      console.error('Coordinator dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTopCoders = async () => {
    if (!token) return;
    setCodersLoading(true);
    try {
      const res = await api.getJson('/leaderboard', token);
      setTopCoders(res.slice(0, 10));
    } catch (err) {
      console.error('Failed to load top coders:', err);
    } finally {
      setCodersLoading(false);
    }
  };

  const loadBranchStats = async () => {
    if (!token) return;
    try {
      const exportData = await api.getJson('/coordinator/export-data', token);
      
      const groups = {};
      const branchesList = new Set();
      
      exportData.forEach(s => {
        const b = s.Branch || 'Other';
        branchesList.add(b);
        if (!groups[b]) {
          groups[b] = { branch: b, total: 0, active: 0, totalSolved: 0, totalScore: 0 };
        }
        groups[b].total++;
        if (s.ActivityStatus === 'active') {
          groups[b].active++;
        }
        groups[b].totalSolved += s.TotalSolved || 0;
        groups[b].totalScore += s.OverallScore || 0;
      });

      setAvailableBranches([...branchesList].sort());

      const statsArray = Object.values(groups).map(g => ({
        branch: g.branch,
        total: g.total,
        active: g.active,
        avgSolved: Math.round(g.totalSolved / g.total),
        avgScore: Math.round(g.totalScore / g.total)
      }));

      setBranchStats(statsArray);
    } catch (err) {
      console.error('Failed to compute branch stats:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadTopCoders();
    loadBranchStats();
  }, [token]);

  // Modal dynamic fetch logic
  const loadModalStudents = async () => {
    if (!token || !modalOpen) return;
    setModalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', modalPage);
      params.set('limit', 10);
      if (modalSearch) params.set('name', modalSearch);
      if (modalBranch) params.set('branch', modalBranch);
      if (modalGoal) params.set('goal', modalGoal);

      if (modalType === 'active') params.set('status', 'active');
      else if (modalType === 'inactive') params.set('status', 'inactive');
      else if (modalType === 'ready') params.set('readiness', 'ready');
      else if (modalType === 'needs_improvement') params.set('readiness', 'needs_improvement');
      else if (modalType === 'at_risk') params.set('readiness', 'at_risk');

      const res = await api.getJson(`/coordinator/students?${params.toString()}`, token);
      setModalStudents(res.students || []);
      setModalTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load modal students:', err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    loadModalStudents();
  }, [token, modalOpen, modalType, modalPage, modalBranch, modalGoal]);

  const handleOpenModal = (type, title) => {
    setModalType(type);
    setModalTitle(title);
    setModalPage(1);
    setModalSearch('');
    setModalBranch('');
    setModalGoal('');
    setModalOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setModalPage(1);
    loadModalStudents();
  };

  const handleExportCSV = async () => {
    try {
      const data = await api.getJson('/coordinator/export-data', token);
      if (!data || data.length === 0) return alert('No student data to export');
      
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(fieldName => {
            const val = row[fieldName];
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
          }).join(',')
        )
      ];
      
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `codetrack_student_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Failed to export CSV report');
    }
  };

  const sortedBranchStats = useMemo(() => {
    const { key, desc } = branchSort;
    return [...branchStats].sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (typeof va === 'string') {
        return desc ? vb.localeCompare(va) : va.localeCompare(vb);
      }
      return desc ? vb - va : va - vb;
    });
  }, [branchStats, branchSort]);

  const handleBranchSort = (key) => {
    setBranchSort(prev => ({
      key,
      desc: prev.key === key ? !prev.desc : false
    }));
  };

  if (loading || !data) {
    return (
      <AppShell active="coord-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  const ps = data.platformStats || {};

  return (
    <AppShell active="coord-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>Coordinator Control Center</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Monitor coding activity streaks, evaluate placement readiness scores, and view platform metrics.
            </p>
          </div>
          <button
            className="ct-button"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#0b1120', fontWeight: 700 }}
          >
            <Download size={16} /> Export Student Data (CSV)
          </button>
        </div>

        {/* QUICK STATS CARD ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
          
          <div className="ct-card" onClick={() => navigate('/coordinator/students/all')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-blue)', background: 'var(--grad-score)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 850 }}>{data.totalStudents || 0}</h2>
            </div>
            <Users size={24} color="var(--accent-blue)" />
          </div>

          <div className="ct-card" onClick={() => navigate('/coordinator/students/active')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-green)', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(17,24,39,0.95))' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Students</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 850 }}>{data.activeCount || 0}</h2>
            </div>
            <UserCheck size={24} color="var(--accent-green)" />
          </div>

          <div className="ct-card" onClick={() => navigate('/coordinator/students/inactive')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-red)', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(17,24,39,0.95))' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Inactive Students</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 850 }}>{data.inactiveCount || 0}</h2>
            </div>
            <UserX size={24} color="var(--accent-red)" />
          </div>

          <div className="ct-card" onClick={() => navigate('/coordinator/students/placement-ready')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #3B82F6', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(17,24,39,0.95))' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Placement Ready</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 850 }}>{data.readyCount || 0}</h2>
            </div>
            <Award size={24} color="#3B82F6" />
          </div>

          <div className="ct-card" onClick={() => navigate('/coordinator/students/needs-improvement')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #F59E0B', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(17,24,39,0.95))' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Needs Improvement</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 850 }}>{data.needsImprovementCount || 0}</h2>
            </div>
            <BarChart3 size={24} color="#F59E0B" />
          </div>

          <div className="ct-card" onClick={() => navigate('/coordinator/students/at-risk')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #EF4444', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(17,24,39,0.95))' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>At Risk</span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.8rem', fontWeight: 850 }}>{data.atRiskCount || 0}</h2>
            </div>
            <UserX size={24} color="#EF4444" />
          </div>

        </div>



        {/* INSTITUTION STATS & RANKINGS ROW */}
        <div className="ct-grid-2" style={{ gap: '1.5rem' }}>
          
          {/* Top 10 rankings */}
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#f3f4f6' }}>Top 10 Global Coders</h3>
            {codersLoading ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>Loading coders...</div>
            ) : topCoders.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>No onboarded coders found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th>Name</th>
                      <th>Branch</th>
                      <th style={{ textAlign: 'right' }}>Readiness Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCoders.map((coder) => (
                      <tr key={coder.id}>
                        <td>#{coder.rank}</td>
                        <td
                          style={{ color: 'var(--accent-blue)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => navigate(`/student/profile/view/${coder.id}`)}
                        >
                          {coder.name}
                        </td>
                        <td>{coder.branch || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-purple)' }}>{Math.round(coder.weightedRankScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Institution Platform Totals */}
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#f3f4f6' }}>Institution Platform Totals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total LeetCode Solved</span>
                <strong style={{ color: '#F59E0B' }}>{ps.leetcode?.totalProblems || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total CodeChef Solved</span>
                <strong style={{ color: '#ef4444' }}>{ps.codechef?.totalProblems || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>CodeChef Contests Participated</span>
                <strong style={{ color: 'var(--accent-purple)' }}>{ps.codechef?.totalContests || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>HackerRank Badges Earned</span>
                <strong style={{ color: '#2EC866' }}>{ps.hackerrank?.totalBadges || 0}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* BRANCH WISE SORTABLE SUMMARY */}
        <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#f3f4f6' }}>Branch-wise Summary</h3>
          {branchStats.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>No branch statistics available.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleBranchSort('branch')}>
                      Branch <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleBranchSort('total')}>
                      Students <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleBranchSort('active')}>
                      Active <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleBranchSort('avgSolved')}>
                      Avg. Solved <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleBranchSort('avgScore')}>
                      Avg. Score <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBranchStats.map((stat) => (
                    <tr key={stat.branch}>
                      <td style={{ fontWeight: 700 }}>{stat.branch}</td>
                      <td>{stat.total}</td>
                      <td style={{ color: '#22C55E' }}>{stat.active}</td>
                      <td>{stat.avgSolved}</td>
                      <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{stat.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATED DETAILS MODAL */}
        {modalOpen && (
          <div className="hm-modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="hm-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, color: '#f3f4f6' }}>📋 {modalTitle} ({modalTotal})</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* SEARCH & FILTER BAR */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flex: 1, minWidth: '200px', position: 'relative' }}>
                  <input
                    className="ct-input"
                    placeholder="Search by name..."
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                    <Search size={16} />
                  </button>
                </div>

                <select
                  className="ct-input"
                  value={modalBranch}
                  onChange={e => { setModalBranch(e.target.value); setModalPage(1); }}
                  style={{ width: '180px', color: '#f3f4f6', background: '#111827' }}
                >
                  <option value="">All Branches</option>
                  {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <select
                  className="ct-input"
                  value={modalGoal}
                  onChange={e => { setModalGoal(e.target.value); setModalPage(1); }}
                  style={{ width: '180px', color: '#f3f4f6', background: '#111827' }}
                >
                  <option value="">All Goals</option>
                  <option value="Placement & Paid Internship Track">Placement & Paid Internship Track</option>
                  <option value="GATE & Higher Studies Track">GATE & Higher Studies Track</option>
                  <option value="PSU & Government Track">PSU & Government Track</option>
                  <option value="Both Placement and GATE">Both Placement and GATE</option>
                </select>

                <button type="submit" className="ct-button" style={{ padding: '0.5rem 1rem' }}>
                  Filter
                </button>
              </form>

              {/* DATA TABLE */}
              {modalLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
                  Loading...
                </div>
              ) : modalStudents.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No matching students found.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ct-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>Year</th>
                        <th>Activity</th>
                        <th style={{ textAlign: 'right' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalStudents.map(student => (
                        <tr key={student.id}>
                          <td>
                            <span
                              style={{ color: 'var(--accent-blue)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => { setModalOpen(false); navigate(`/student/profile/view/${student.id}`); }}
                            >
                              {student.name}
                            </span>
                          </td>
                          <td>{student.branch || '-'}</td>
                          <td>Year {student.year || '-'}</td>
                          <td>
                            <span style={{ color: student.activityStatus === 'active' ? '#22C55E' : '#6b7280', fontSize: '1.2rem', lineHeight: 1 }}>
                              {student.activityStatus === 'active' ? '●' : '○'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-purple)' }}>
                            {Math.round(student.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {modalTotal > 10 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                  <button
                    className="ct-button-secondary"
                    disabled={modalPage <= 1 || modalLoading}
                    onClick={() => setModalPage(p => Math.max(1, p - 1))}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Page <strong>{modalPage}</strong> of <strong>{Math.ceil(modalTotal / 10)}</strong>
                  </span>
                  <button
                    className="ct-button-secondary"
                    disabled={modalPage >= Math.ceil(modalTotal / 10) || modalLoading}
                    onClick={() => setModalPage(p => p + 1)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
