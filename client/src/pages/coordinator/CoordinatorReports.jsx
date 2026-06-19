import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api, API_BASE_URL } from '../../api/client';

export function CoordinatorReports() {
  const { token, user } = useAuth();

  const formatValue = (val, dec = 2) => {
    if (val === undefined || val === null || val === '' || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  const renderContestCell = (contest) => {
    if (!contest || typeof contest !== 'object' || !contest.name) return '—';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', lineHeight: '1.2' }}>
        <span style={{ fontWeight: 'bold', color: '#60a5fa', whiteSpace: 'normal', wordBreak: 'break-word' }}>{contest.name}</span>
        <span style={{ color: '#9ca3af' }}>{contest.date}</span>
        <span style={{ color: '#34d399', fontWeight: 'bold' }}>Rating: {Number(contest.rating).toFixed(2)}</span>
      </div>
    );
  };
  
  // Tab Selection
  const [activeReport, setActiveReport] = useState('student-master');

  // Loading States
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [triggeringSnapshots, setTriggeringSnapshots] = useState(false);

  // Errors / Success Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stats Card Data
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    averageCgpa: 0,
    averageLeetcodeRating: 0,
    averageCodechefRating: 0,
    averageProblemsSolved: 0,
    below9CgpaCount: 0,
    noProfileCount: 0,
    highRiskCount: 0,
    mediumRiskCount: 0
  });

  // Table Data & Filters
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Dropdown options
  const [filterOptions, setFilterOptions] = useState({
    colleges: [],
    branches: [],
    years: [],
    sections: [],
    mentors: [],
    genders: []
  });

  // Active filters
  const [filters, setFilters] = useState({
    search: '',
    college: '',
    branch: '',
    currentYear: '',
    section: '',
    mentorName: '',
    gender: ''
  });

  // Fetch Dashboard Metrics Cards
  const fetchStatsCards = async () => {
    try {
      setLoadingCards(true);
      const params = new URLSearchParams();
      if (filters.college) params.set('college', filters.college);
      if (filters.branch) params.set('branch', filters.branch);
      if (filters.currentYear) params.set('currentYear', filters.currentYear);
      if (filters.section) params.set('section', filters.section);
      if (filters.mentorName) params.set('mentorName', filters.mentorName);
      if (filters.gender) params.set('gender', filters.gender);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getJson(`/coordinator/tracking-reports/dashboard-cards${query}`, token);
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoadingCards(false);
    }
  };

  // Fetch Table Data & Options
  const fetchReportData = async () => {
    try {
      setLoadingTable(true);
      const params = new URLSearchParams();
      params.set('reportType', activeReport);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (sortBy) {
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
      }
      if (filters.search) params.set('search', filters.search);
      if (filters.college) params.set('college', filters.college);
      if (filters.branch) params.set('branch', filters.branch);
      if (filters.currentYear) params.set('currentYear', filters.currentYear);
      if (filters.section) params.set('section', filters.section);
      if (filters.mentorName) params.set('mentorName', filters.mentorName);
      if (filters.gender) params.set('gender', filters.gender);

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.getJson(`/coordinator/tracking-reports/data${query}`, token);
      
      if (response) {
        setRecords(response.rows || []);
        setTotalCount(response.total || 0);
        if (response.filters) {
          setFilterOptions(prev => ({
            ...prev,
            colleges: response.filters.colleges || [],
            branches: response.filters.branches || [],
            years: response.filters.years || [],
            sections: response.filters.sections || [],
            mentors: response.filters.mentors || [],
            genders: response.filters.genders || []
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report details.');
    } finally {
      setLoadingTable(false);
    }
  };

  // Trigger fetch when inputs, page, or tab changes
  useEffect(() => {
    fetchStatsCards();
  }, [filters.college, filters.branch, filters.currentYear, filters.section, filters.mentorName, filters.gender, token]);

  useEffect(() => {
    fetchReportData();
  }, [activeReport, page, limit, sortBy, sortOrder, filters, token]);

  // Handle manual snapshot triggers for admins
  const handleTriggerSnapshots = async (type) => {
    if (!window.confirm(`Are you sure you want to trigger snapshot generation for "${type}"? This will checkpoint coding progress stats for all onboarded students.`)) {
      return;
    }
    try {
      setTriggeringSnapshots(true);
      setError('');
      setSuccess('');
      const endpoint = type === 'weekly' 
        ? `/admin/snapshots/weekly/generate` 
        : `/admin/snapshots/monthly/generate`;
      const data = await api.postJson(endpoint, {}, token);
      setSuccess(data.message || 'Snapshots generated successfully!');
      fetchReportData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to manually trigger snapshot.');
    } finally {
      setTriggeringSnapshots(false);
    }
  };

  // Excel Downloads
  const downloadReport = async (reportTypeStr) => {
    try {
      setExporting(true);
      setError('');
      setSuccess('');
      
      const params = new URLSearchParams();
      params.set('reportType', reportTypeStr);
      if (filters.search) params.set('search', filters.search);
      if (filters.college) params.set('college', filters.college);
      if (filters.branch) params.set('branch', filters.branch);
      if (filters.currentYear) params.set('currentYear', filters.currentYear);
      if (filters.section) params.set('section', filters.section);
      if (filters.mentorName) params.set('mentorName', filters.mentorName);
      if (filters.gender) params.set('gender', filters.gender);

      const downloadUrl = `${API_BASE_URL}/api/coordinator/tracking-reports/export?${params.toString()}`;
      
      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to generate export file');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportTypeStr === 'complete-workbook' 
        ? 'complete_coordinator_tracking_report.xlsx' 
        : `${reportTypeStr}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Excel spreadsheet exported successfully!');
    } catch (err) {
      console.error(err);
      setError('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Toggle Filters
  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
    setPage(1); // Reset page to 1 on filter edits
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      college: '',
      branch: '',
      currentYear: '',
      section: '',
      mentorName: '',
      gender: ''
    });
    setSortBy('');
    setSortOrder('asc');
    setPage(1);
  };

  // Alert cleanups
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  // Headers dynamic helper based on selected report tab
  const getTableHeader = () => {
    switch (activeReport) {
      case 'student-master':
        return [
          { label: 'MSS ID', key: 'mssid' },
          { label: 'Roll Number', key: 'rollNumber' },
          { label: 'Name', key: 'name' },
          { label: 'College', key: 'college' },
          { label: 'Branch', key: 'branch' },
          { label: 'Year', key: 'year' },
          { label: 'Section', key: 'section' },
          { label: 'Mentor', key: 'mentorName' },
          { label: 'Placement Score', key: 'placementScore' },
          { label: 'Sync Status', key: 'profileStatus' },
          { label: 'Account Status', key: 'accountStatus' },
          { label: 'Last Login', key: 'lastLogin' }
        ];
      case 'leetcode-tracking':
        return [
          { label: 'Name', key: 'name' },
          { label: 'LeetCode Username', key: 'leetcodeUsername' },
          { label: 'Total Solved', key: 'totalSolved' },
          { label: 'Easy', key: 'easySolved' },
          { label: 'Medium', key: 'mediumSolved' },
          { label: 'Hard', key: 'hardSolved' },
          { label: 'Contest Rating', key: 'contestRating' },
          { label: 'Contest Rank', key: 'contestRank' },
          { label: 'Acceptance Rate %', key: 'acceptanceRate' },
          { label: 'Attended Contests', key: 'contestCount' },
          { label: 'Solved (30 Days)', key: 'problemsSolvedLast30Days' },
          { label: 'Current Streak', key: 'currentStreak' }
        ];
      case 'contest-tracking':
        return [
          { label: 'Name', key: 'name' },
          { label: 'LC Rating', key: 'lcCurrentRating' },
          { label: 'LC Previous', key: 'lcPreviousRating' },
          { label: 'LC Growth', key: 'lcRatingGrowth' },
          { label: 'LC Rank Change', key: 'lcRankChange' },
          { label: 'CC Rating', key: 'ccCurrentRating' },
          { label: 'CC Highest Rating', key: 'ccHighestRating' },
          { label: 'CC Stars', key: 'ccStars' },
          { label: 'CC Global Rank', key: 'ccGlobalRank' },
          { label: 'CC Country Rank', key: 'ccCountryRank' }
        ];
      case 'weekly-rank':
        return [
          { label: 'Name', key: 'name' },
          { label: 'LC Contest 1', key: 'lcW1' },
          { label: 'LC Contest 2', key: 'lcW2' },
          { label: 'LC Contest 3', key: 'lcW3' },
          { label: 'LC Contest 4', key: 'lcW4' },
          { label: 'LC Current', key: 'lcCurrent' },
          { label: 'LC Growth', key: 'lcGrowth' },
          { label: 'CC Current Rating', key: 'ccCurrentRating' },
          { label: 'CC Highest Rating', key: 'ccHighestRating' },
          { label: 'CC Stars', key: 'ccStars' },
          { label: 'CC Global Rank', key: 'ccGlobalRank' },
          { label: 'CC Country Rank', key: 'ccCountryRank' }
        ];
      case 'medium-growth':
        return [
          { label: 'Name', key: 'name' },
          { label: 'W1 Medium Count', key: 'w1Count' },
          { label: 'W2 Medium Count', key: 'w2Count' },
          { label: 'W3 Medium Count', key: 'w3Count' },
          { label: 'W4 Medium Count', key: 'w4Count' },
          { label: 'Current Medium', key: 'currentCount' },
          { label: 'Medium Growth', key: 'growth' },
          { label: 'Growth %', key: 'growthPercentage' }
        ];
      case 'codechef-tracking':
        return [
          { label: 'Name', key: 'name' },
          { label: 'CodeChef Username', key: 'codechefUsername' },
          { label: 'Current Rating', key: 'currentRating' },
          { label: 'Highest Rating', key: 'highestRating' },
          { label: 'Stars', key: 'stars' },
          { label: 'Global Rank', key: 'globalRank' },
          { label: 'Country Rank', key: 'countryRank' },
          { label: 'Problems Solved', key: 'problemsSolved' }
        ];
      case 'cgpa-tracking':
        return [
          { label: 'Name', key: 'name' },
          { label: 'Sem 1 GPA', key: 'sgpa1' },
          { label: 'Sem 2 GPA', key: 'sgpa2' },
          { label: 'Sem 3 GPA', key: 'sgpa3' },
          { label: 'Sem 4 GPA', key: 'sgpa4' },
          { label: 'Sem 5 GPA', key: 'sgpa5' },
          { label: 'Sem 6 GPA', key: 'sgpa6' },
          { label: 'Cumulative CGPA', key: 'cgpa' },
          { label: 'Backlogs', key: 'backlogs' },
          { label: 'Academic Status', key: 'academicStatus' }
        ];
      case 'below-9-cgpa':
        return [
          { label: 'Name', key: 'name' },
          { label: 'Branch', key: 'branch' },
          { label: 'Mentor', key: 'mentorName' },
          { label: 'CGPA', key: 'cgpa' },
          { label: 'LeetCode Solved', key: 'leetcodeSolved' },
          { label: 'LC Rating', key: 'leetcodeContestRating' },
          { label: 'CodeChef Rating', key: 'codechefRating' },
          { label: 'Placement Score', key: 'placementScore' },
          { label: 'Risk Status', key: 'riskStatus' }
        ];
      default:
        return [];
    }
  };

  const headers = getTableHeader();

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  return (
    <AppShell active="coord-reports">
      <div className="reports-page-wrapper animate-fade-in">
        
        {/* CSS Stylesheet Embed for stunning dashboard visuals */}
        <style>{`
          .reports-page-wrapper {
            padding: 1.5rem 2rem;
            color: #f3f4f6;
            font-family: 'Inter', sans-serif;
          }
          .reports-title-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          .reports-title-bar h1 {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(90deg, #60a5fa, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
          }
          .reports-title-bar p {
            color: #9ca3af;
            font-size: 0.9rem;
            margin: 0.25rem 0 0 0;
          }
          .actions-row {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2rem;
          }
          .stat-card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 1.25rem;
            backdrop-filter: blur(12px);
            transition: transform 0.2s, border-color 0.2s;
            position: relative;
            overflow: hidden;
          }
          .stat-card:hover {
            transform: translateY(-2px);
            border-color: rgba(59, 130, 246, 0.4);
          }
          .stat-card-label {
            font-size: 0.75rem;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }
          .stat-card-val {
            font-size: 1.8rem;
            font-weight: 800;
            margin-top: 0.5rem;
            color: #ffffff;
            display: flex;
            align-items: baseline;
            gap: 0.4rem;
          }
          .stat-card-val span {
            font-size: 0.85rem;
            font-weight: 500;
            color: #9ca3af;
          }
          .stat-card-sub {
            font-size: 0.75rem;
            color: #9ca3af;
            margin-top: 0.4rem;
          }
          .reports-filter-panel {
            background: rgba(15, 23, 42, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 14px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
          }
          .filter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1.2rem;
          }
          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .filter-group label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
          }
          .filter-input, .filter-select {
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 0.55rem 0.75rem;
            color: white;
            font-size: 0.85rem;
            outline: none;
            transition: border-color 0.2s;
          }
          .filter-input:focus, .filter-select:focus {
            border-color: #3b82f6;
          }
          .report-tabs {
            display: flex;
            gap: 0.4rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 1.5rem;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 1px;
          }
          .report-tab-btn {
            background: transparent;
            border: none;
            color: #9ca3af;
            padding: 0.8rem 1.2rem;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .report-tab-btn:hover {
            color: white;
            background: rgba(255, 255, 255, 0.03);
          }
          .report-tab-btn.active {
            color: #3b82f6;
            background: rgba(59, 130, 246, 0.08);
            border-bottom: 2px solid #3b82f6;
          }
          .table-container {
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            overflow-x: auto;
            margin-bottom: 1.5rem;
          }
          .reports-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            text-align: left;
          }
          .reports-table th {
            background: rgba(30, 41, 59, 0.8);
            color: #9ca3af;
            font-weight: 700;
            padding: 1rem 0.9rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
            transition: background 0.2s, color 0.2s;
          }
          .reports-table th:hover {
            background: rgba(30, 41, 59, 1);
            color: white;
          }
          .reports-table td {
            padding: 0.9rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: #e5e7eb;
            white-space: nowrap;
          }
          .reports-table tr:hover td {
            background: rgba(255, 255, 255, 0.02);
          }
          .reports-btn {
            padding: 0.55rem 1.2rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
          }
          .btn-primary {
            background: linear-gradient(90deg, #3b82f6, #4f46e5);
            color: white;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
          }
          .btn-primary:hover:not(:disabled) {
            opacity: 0.95;
            transform: translateY(-1px);
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #d1d5db;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .btn-secondary:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
          }
          .btn-danger {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }
          .btn-danger:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.25);
          }
          .reports-alert {
            padding: 0.85rem 1.25rem;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            border: 1px solid;
          }
          .alert-success {
            background: rgba(16, 185, 129, 0.1);
            color: #34d399;
            border-color: rgba(16, 185, 129, 0.25);
          }
          .alert-error {
            background: rgba(239, 68, 68, 0.1);
            color: #f87171;
            border-color: rgba(239, 68, 68, 0.25);
          }
          .pagination-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 0.85rem;
            color: #9ca3af;
          }
          .pagination-btns {
            display: flex;
            gap: 0.4rem;
          }
          .pagination-btn {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .pagination-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
          }
          .pagination-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
          .text-risk-high {
            color: #f87171;
            font-weight: 700;
          }
          .text-risk-medium {
            color: #fbbf24;
            font-weight: 700;
          }
          .text-risk-low {
            color: #34d399;
            font-weight: 700;
          }
        `}</style>

        {/* ─── TITLE & SNAPSHOT TRIGGERS ─── */}
        <div className="reports-title-bar">
          <div>
            <h1>Cohort Tracking Reports</h1>
            <p>Monitor academic performance, coding progression milestones, and contest snapshot insights.</p>
          </div>
          
          <div className="actions-row">
            {/* Generate Snapshots (Admin Only) */}
            {user?.role === 'admin' && (
              <>
                <button
                  type="button"
                  disabled={triggeringSnapshots}
                  onClick={() => handleTriggerSnapshots('weekly')}
                  className="reports-btn btn-danger"
                >
                  ⏳ {triggeringSnapshots ? 'Running...' : 'Generate Weekly Snapshots Now'}
                </button>
                <button
                  type="button"
                  disabled={triggeringSnapshots}
                  onClick={() => handleTriggerSnapshots('monthly')}
                  className="reports-btn btn-danger"
                >
                  📅 {triggeringSnapshots ? 'Running...' : 'Generate Monthly Snapshots Now'}
                </button>
              </>
            )}

            {/* Excel Download Actions */}
            <button
              type="button"
              disabled={exporting}
              onClick={() => downloadReport(activeReport)}
              className="reports-btn btn-secondary"
            >
              📥 {exporting ? 'Exporting...' : 'Export Current Sheet'}
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => downloadReport('complete-workbook')}
              className="reports-btn btn-primary"
            >
              📥 {exporting ? 'Exporting...' : 'Download Complete Workbook'}
            </button>
          </div>
        </div>

        {/* Success/Error messages */}
        {success && <div className="reports-alert alert-success">✓ {success}</div>}
        {error && <div className="reports-alert alert-error">⚠ {error}</div>}

        {/* ─── DASHBOARD SUMMARY METRICS CARDS ─── */}
        {loadingCards ? (
          <div style={{ color: '#9ca3af', marginBottom: '2rem' }}>Recalculating cached stats...</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card-label">Total Cohort Size</span>
              <div className="stat-card-val">{stats.totalStudents} <span>Students</span></div>
              <div className="stat-card-sub">{stats.activeStudents} Active | {stats.inactiveStudents} Inactive</div>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Cohort Average CGPA</span>
              <div className="stat-card-val" style={{ color: '#60a5fa' }}>{formatValue(stats.averageCgpa)}</div>
              <div className="stat-card-sub" style={{ color: '#f87171' }}>{stats.below9CgpaCount} Below 9.0 CGPA</div>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Avg LeetCode Rating</span>
              <div className="stat-card-val" style={{ color: '#f59e0b' }}>{formatValue(stats.averageLeetcodeRating, 0)}</div>
              <span className="stat-card-sub">Competitive benchmark score</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Academic Risk Status</span>
              <div className="stat-card-val" style={{ color: stats.highRiskCount > 0 ? '#f87171' : '#34d399', fontSize: '1.4rem' }}>
                {stats.highRiskCount} At High Risk
              </div>
              <div className="stat-card-sub">{stats.mediumRiskCount} At Medium Risk</div>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Problems Solved / Sync</span>
              <div className="stat-card-val" style={{ color: '#10b981' }}>{formatValue(stats.averageProblemsSolved, 0)} <span>Avg</span></div>
              <div className="stat-card-sub" style={{ color: '#fbbf24' }}>{stats.noProfileCount} Unconnected Profiles</div>
            </div>
          </div>
        )}

        {/* ─── REPORTS FILTER PANEL ─── */}
        <div className="reports-filter-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Search Directory</label>
              <input
                type="text"
                placeholder="Search name, roll, MSS ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>College</label>
              <select
                value={filters.college}
                onChange={(e) => handleFilterChange('college', e.target.value)}
                className="filter-select"
              >
                <option value="">All Colleges</option>
                {filterOptions.colleges.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Branch</label>
              <select
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                className="filter-select"
              >
                <option value="">All Branches</option>
                {filterOptions.branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Year</label>
              <select
                value={filters.currentYear}
                onChange={(e) => handleFilterChange('currentYear', e.target.value)}
                className="filter-select"
              >
                <option value="">All Years</option>
                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Section</label>
              <select
                value={filters.section}
                onChange={(e) => handleFilterChange('section', e.target.value)}
                className="filter-select"
              >
                <option value="">All Sections</option>
                {filterOptions.sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Mentor Name</label>
              <select
                value={filters.mentorName}
                onChange={(e) => handleFilterChange('mentorName', e.target.value)}
                className="filter-select"
              >
                <option value="">All Mentors</option>
                {filterOptions.mentors.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="filter-select"
              >
                <option value="">All Genders</option>
                {filterOptions.genders.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClearFilters}
                className="reports-btn btn-secondary"
                style={{ height: '38px', width: '100%', justifyContent: 'center' }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION FOR THE 8 REPORTS ─── */}
        <div className="report-tabs">
          {[
            { id: 'student-master', label: '👤 Student Master' },
            { id: 'leetcode-tracking', label: '⚡ LeetCode Tracking' },
            { id: 'contest-tracking', label: '🏆 Contest Growth' },
            { id: 'weekly-rank', label: '⏳ Weekly Ratings' },
            { id: 'medium-growth', label: '📈 Medium Solved Growth' },
            { id: 'codechef-tracking', label: '🍳 CodeChef Tracking' },
            { id: 'cgpa-tracking', label: '🎓 Academics & CGPA' },
            { id: 'below-9-cgpa', label: '⚠️ Below 9.0 CGPA' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveReport(t.id); setPage(1); }}
              className={`report-tab-btn ${activeReport === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── DATA TABLE ─── */}
        <div className="table-container">
          {loadingTable ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              Querying records database...
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h.key} onClick={() => handleSort(h.key)}>
                      {h.label} {sortBy === h.key ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, index) => (
                  <tr key={r.id || index}>
                    {activeReport === 'student-master' && (
                      <>
                        <td>{r.mssid}</td>
                        <td>{r.rollNumber}</td>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>{r.college}</td>
                        <td>{r.branch}</td>
                        <td>{r.year}</td>
                        <td>{r.section}</td>
                        <td>{r.mentorName}</td>
                        <td>{r.placementScore}%</td>
                        <td>
                          <span style={{ color: r.profileStatus === 'active' ? '#34d399' : '#9ca3af' }}>
                            {r.profileStatus === 'active' ? '● Synced' : '○ Pending'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: r.accountStatus === 'Active' ? '#34d399' : '#f87171' }}>
                            {r.accountStatus}
                          </span>
                        </td>
                        <td>{r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : 'Never'}</td>
                      </>
                    )}
                    
                    {activeReport === 'leetcode-tracking' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>
                          <a href={`https://leetcode.com/${r.leetcodeUsername}`} target="_blank" rel="noreferrer" style={{ color: '#f59e0b', textDecoration: 'underline' }}>
                            {r.leetcodeUsername || '—'}
                          </a>
                        </td>
                        <td>{r.totalSolved}</td>
                        <td>{r.easySolved}</td>
                        <td>{r.mediumSolved}</td>
                        <td>{r.hardSolved}</td>
                        <td>{formatValue(r.contestRating)}</td>
                        <td>{r.contestRank || 0}</td>
                        <td>{formatValue(r.acceptanceRate)}%</td>
                        <td>{r.contestCount}</td>
                        <td>{r.problemsSolvedLast30Days}</td>
                        <td>{r.currentStreak} days</td>
                      </>
                    )}

                    {activeReport === 'contest-tracking' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>{formatValue(r.lcCurrentRating)}</td>
                        <td>{formatValue(r.lcPreviousRating)}</td>
                        <td style={{ color: r.lcRatingGrowth > 0 ? '#34d399' : r.lcRatingGrowth < 0 ? '#f87171' : 'inherit' }}>
                          {r.lcRatingGrowth > 0 ? `+${formatValue(r.lcRatingGrowth)}` : formatValue(r.lcRatingGrowth)}
                        </td>
                        <td style={{ color: r.lcRankChange > 0 ? '#34d399' : r.lcRankChange < 0 ? '#f87171' : 'inherit' }}>
                          {r.lcRankChange > 0 ? `+${formatValue(r.lcRankChange)}` : formatValue(r.lcRankChange)}
                        </td>
                        <td>{formatValue(r.ccCurrentRating)}</td>
                        <td>{formatValue(r.ccHighestRating)}</td>
                        <td>{r.ccStars || '1★'}</td>
                        <td>#{r.ccGlobalRank || '—'}</td>
                        <td>{r.ccCountryRank || '—'}</td>
                      </>
                    )}

                    {activeReport === 'weekly-rank' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>{renderContestCell(r.lcW1)}</td>
                        <td>{renderContestCell(r.lcW2)}</td>
                        <td>{renderContestCell(r.lcW3)}</td>
                        <td>{renderContestCell(r.lcW4)}</td>
                        <td>{formatValue(r.lcCurrent)}</td>
                        <td style={{ color: r.lcGrowth > 0 ? '#34d399' : r.lcGrowth < 0 ? '#f87171' : 'inherit' }}>
                          {r.lcGrowth > 0 ? `+${formatValue(r.lcGrowth)}` : formatValue(r.lcGrowth)}
                        </td>
                        <td>{formatValue(r.ccCurrentRating)}</td>
                        <td>{formatValue(r.ccHighestRating)}</td>
                        <td>{r.ccStars || '1★'}</td>
                        <td>#{r.ccGlobalRank || '—'}</td>
                        <td>{r.ccCountryRank || '—'}</td>
                      </>
                    )}

                    {activeReport === 'medium-growth' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>{r.w1Count}</td>
                        <td>{r.w2Count}</td>
                        <td>{r.w3Count}</td>
                        <td>{r.w4Count}</td>
                        <td>{r.currentCount}</td>
                        <td style={{ color: r.growth > 0 ? '#34d399' : 'inherit' }}>
                          {r.growth > 0 ? `+${r.growth}` : r.growth}
                        </td>
                        <td style={{ color: r.growthPercentage > 0 ? '#34d399' : 'inherit' }}>
                          {r.growthPercentage > 0 ? `+${formatValue(r.growthPercentage)}%` : `${formatValue(r.growthPercentage)}%`}
                        </td>
                      </>
                    )}

                    {activeReport === 'codechef-tracking' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>
                          <a href={`https://www.codechef.com/users/${r.codechefUsername}`} target="_blank" rel="noreferrer" style={{ color: '#ef4444', textDecoration: 'underline' }}>
                            {r.codechefUsername || '—'}
                          </a>
                        </td>
                        <td>{formatValue(r.currentRating)}</td>
                        <td>{formatValue(r.highestRating)}</td>
                        <td>{r.stars || '1★'}</td>
                        <td>#{r.globalRank || '—'}</td>
                        <td>{r.countryRank || '—'}</td>
                        <td>{r.problemsSolved || 0}</td>
                      </>
                    )}

                    {activeReport === 'cgpa-tracking' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>{formatValue(r.sgpa1)}</td>
                        <td>{formatValue(r.sgpa2)}</td>
                        <td>{formatValue(r.sgpa3)}</td>
                        <td>{formatValue(r.sgpa4)}</td>
                        <td>{formatValue(r.sgpa5)}</td>
                        <td>{formatValue(r.sgpa6)}</td>
                        <td style={{ fontWeight: 'bold', color: '#60a5fa' }}>{formatValue(r.cgpa)}</td>
                        <td style={{ color: r.backlogs > 0 ? '#f87171' : '#34d399' }}>{r.backlogs}</td>
                        <td>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: r.academicStatus === 'Excellent' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: r.academicStatus === 'Excellent' ? '#34d399' : '#fbbf24',
                            border: '1px solid currentColor'
                          }}>
                            {r.academicStatus}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'below-9-cgpa' && (
                      <>
                        <td>
                          <a href={`/coordinator/students/${r.id}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                            {r.name}
                          </a>
                        </td>
                        <td>{r.branch}</td>
                        <td>{r.mentorName}</td>
                        <td style={{ color: '#f87171', fontWeight: 'bold' }}>{formatValue(r.cgpa)}</td>
                        <td>{r.leetcodeSolved}</td>
                        <td>{formatValue(r.leetcodeContestRating)}</td>
                        <td>{formatValue(r.codechefRating)}</td>
                        <td>{formatValue(r.placementScore)}%</td>
                        <td>
                          <span className={r.riskStatus === 'High Risk' ? 'text-risk-high' : r.riskStatus === 'Medium Risk' ? 'text-risk-medium' : 'text-risk-low'}>
                            {r.riskStatus}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                      No records match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ─── PAGINATION BAR ─── */}
        {!loadingTable && records.length > 0 && (
          <div className="pagination-bar">
            <div>
              Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} students
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span>Limit:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="filter-select"
                  style={{ padding: '0.25rem 0.5rem', background: '#1e293b' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="pagination-btns">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= totalCount}
                  onClick={() => setPage(prev => prev + 1)}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
