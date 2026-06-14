import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, User } from 'lucide-react';
import * as XLSX from 'xlsx';

export function CoordinatorStudentsList() {
  const { token } = useAuth();
  const location = useLocation();

  // Determine configuration based on path
  const config = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/all')) {
      return { title: 'All Students', status: '', readiness: '' };
    } else if (path.includes('/active')) {
      return { title: 'Active Students', status: 'active', readiness: '' };
    } else if (path.includes('/inactive')) {
      return { title: 'Inactive Students', status: 'inactive', readiness: '' };
    } else if (path.includes('/placement-ready')) {
      return { title: 'Placement Ready Students', status: '', readiness: 'ready' };
    } else if (path.includes('/needs-improvement')) {
      return { title: 'Needs Improvement Students', status: '', readiness: 'needs_improvement' };
    } else if (path.includes('/at-risk')) {
      return { title: 'At Risk Students', status: '', readiness: 'at_risk' };
    }
    return { title: 'Students List', status: '', readiness: '' };
  }, [location.pathname]);

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    avgCodingScore: 0,
    totalLeetCodeSolved: 0,
    totalGFGSolved: 0,
    totalCodeChefSolved: 0,
    avgLeetCodeSolved: 0,
    avgGFGSolved: 0,
    avgCodeChefSolved: 0
  });

  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'scores.totalScore', 'totalSolved'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Fetch student data from coordinator API
  const loadStudents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 25); // 25 students per page

      if (config.status) params.set('status', config.status);
      if (config.readiness) params.set('readiness', config.readiness);

      if (search.trim()) params.set('name', search.trim());
      if (branch) params.set('branch', branch);
      if (currentYear) params.set('currentYear', currentYear);

      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await api.getJson(`/coordinator/students?${params.toString()}`, token);
      setStudents(res.students || []);
      setTotal(res.total || 0);
      if (res.summary) {
        setSummary(res.summary);
      }

      if (res.filters?.branches) {
        setAvailableBranches(res.filters.branches);
      }
      if (res.filters?.currentYears) {
        setAvailableYears(res.filters.currentYears);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [config, search, branch, currentYear, sortBy, sortOrder]);

  useEffect(() => {
    loadStudents();
  }, [token, config, page, search, branch, currentYear, sortBy, sortOrder]);

  // Export helper
  const getExportData = async () => {
    // Fetch all student records for export without limit
    try {
      const data = await api.getJson('/coordinator/export-data', token);
      
      // Filter the data based on current page filters
      let filtered = data.map(s => {
        // Compute total solved
        const totalSolved = (s.LeetCodeSolved || 0) + (s.CodeChefSolved || 0) + (s.GFGSolved || 0);
        return { ...s, TotalSolved: totalSolved };
      });

      // Filter status
      if (config.status === 'active') {
        filtered = filtered.filter(s => s.ActivityStatus === 'active');
      } else if (config.status === 'inactive') {
        filtered = filtered.filter(s => s.ActivityStatus === 'inactive');
      }

      // Filter readiness
      if (config.readiness === 'ready') {
        filtered = filtered.filter(s => s.TotalSolved >= 300 && s.ActivityStatus === 'active');
      } else if (config.readiness === 'needs_improvement') {
        filtered = filtered.filter(s => s.TotalSolved >= 100 && s.TotalSolved < 300);
      } else if (config.readiness === 'at_risk') {
        filtered = filtered.filter(s => s.TotalSolved < 100);
      }

      // Filter branch
      if (branch) {
        filtered = filtered.filter(s => s.Branch === branch);
      }

      // Filter currentYear
      if (currentYear) {
        filtered = filtered.filter(s => {
          const sYearStr = s.Year ? String(s.Year) : '';
          const sCurrentYear = sYearStr === '1' ? '1st Year' : sYearStr === '2' ? '2nd Year' : sYearStr === '3' ? '3rd Year' : sYearStr === '4' ? '4th Year' : `${sYearStr} Year`;
          return sCurrentYear === currentYear;
        });
      }

      // Filter search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(s => 
          s.Name.toLowerCase().includes(q) || 
          s.MSSID.toLowerCase().includes(q)
        );
      }

      // Format fields to match requested columns: Name, MSSID, Branch, Current Year, LeetCode Solved, GFG Solved, CodeChef Solved, GitHub Repositories, Coding Score
      return filtered.map(s => {
        const sYearStr = s.Year ? String(s.Year) : '';
        const sCurrentYear = sYearStr === '1' ? '1st Year' : sYearStr === '2' ? '2nd Year' : sYearStr === '3' ? '3rd Year' : sYearStr === '4' ? '4th Year' : `${sYearStr} Year`;
        return {
          Name: s.Name,
          MSSID: s.MSSID || '—',
          Branch: s.Branch || '—',
          'Current Year': sCurrentYear,
          'LeetCode Solved': s.LeetCodeSolved || 0,
          'GFG Solved': s.GFGSolved || 0,
          'CodeChef Solved': s.CodeChefSolved || 0,
          'GitHub Repositories': s.GitHubRepos || 0,
          'Coding Score': Math.round(s.ReadinessScore || 0)
        };
      });
    } catch (err) {
      console.error('Failed to get export data:', err);
      return [];
    }
  };

  const getMetadataHeaders = (count) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    return [
      ['Generated By: Coordinator'],
      [`Generated At: ${formattedDate}`],
      [],
      [`Branch Filter: ${branch || 'All'}`],
      [`Current Year Filter: ${currentYear || 'All'}`],
      [],
      [`Student Count: ${count}`],
      []
    ];
  };

  const handleExportCSV = async () => {
    const data = await getExportData();
    if (data.length === 0) return alert('No data to export');

    const metadata = getMetadataHeaders(data.length);
    const csvRows = metadata.map(row => row.join(','));
    
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    
    data.forEach(row => {
      csvRows.push(
        headers.map(field => {
          const val = row[field];
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
        }).join(',')
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const titleStr = config.title.toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('download', `codetrack_${titleStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = async () => {
    const data = await getExportData();
    if (data.length === 0) return alert('No data to export');

    const metadata = getMetadataHeaders(data.length);
    const headers = ['Name', 'MSSID', 'Branch', 'Current Year', 'LeetCode Solved', 'GFG Solved', 'CodeChef Solved', 'GitHub Repositories', 'Coding Score'];
    const excelData = [...metadata, headers];
    
    data.forEach(row => {
      excelData.push([
        row.Name,
        row.MSSID,
        row.Branch,
        row['Current Year'],
        row['LeetCode Solved'],
        row['GFG Solved'],
        row['CodeChef Solved'],
        row['GitHub Repositories'],
        row['Coding Score']
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    const titleStr = config.title.toLowerCase().replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `codetrack_${titleStr}.xlsx`);
  };

  const totalPages = Math.ceil(total / 25) || 1;

  return (
    <AppShell active="coord-dashboard">
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>{config.title}</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Coordinator view for managing {config.title.toLowerCase()}.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleExportCSV}
              className="ct-button-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="ct-button"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 1rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#0b1120', fontWeight: 700 }}
            >
              <Download size={14} /> Export Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid var(--accent-blue)', background: 'var(--grad-score)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{summary.totalStudents}</h2>
          </div>
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid #F59E0B', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(17, 24, 39, 0.95))' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average LeetCode Solved</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{summary.avgLeetCodeSolved}</h2>
          </div>
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid #22C55E', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(17, 24, 39, 0.95))' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average GFG Solved</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{summary.avgGFGSolved}</h2>
          </div>
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid #ef4444', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(17, 24, 39, 0.95))' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average CodeChef Solved</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{summary.avgCodeChefSolved}</h2>
          </div>
          <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid var(--accent-purple)', background: 'var(--grad-consistency)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average Coding Score</span>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{summary.avgCodingScore}</h2>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="ct-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name or MSSID..."
              className="ct-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="ct-input"
            value={branch}
            onChange={e => setBranch(e.target.value)}
            style={{ width: '180px', color: '#f3f4f6', background: '#111827' }}
          >
            <option value="">All Branches</option>
            {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            className="ct-input"
            value={currentYear}
            onChange={e => setCurrentYear(e.target.value)}
            style={{ width: '180px', color: '#f3f4f6', background: '#111827' }}
          >
            <option value="">All Years</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="ct-input"
            value={`${sortBy}:${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split(':');
              setSortBy(field);
              setSortOrder(order);
            }}
            style={{ width: '220px', color: '#f3f4f6', background: '#111827' }}
          >
            <option value="name:asc">Name (A → Z)</option>
            <option value="name:desc">Name (Z → A)</option>
            <option value="scores.totalScore:desc">Coding Score (High → Low)</option>
            <option value="scores.totalScore:asc">Coding Score (Low → High)</option>
            <option value="totalSolved:desc">Total Solved (High → Low)</option>
            <option value="totalSolved:asc">Total Solved (Low → High)</option>
          </select>

        </div>

        {/* DATA TABLE */}
        <div className="ct-card" style={{ padding: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 1rem auto' }} />
              Loading student records...
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No students found matching the filters.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>MSSID</th>
                      <th>Branch</th>
                      <th style={{ textAlign: 'right' }}>LeetCode</th>
                      <th style={{ textAlign: 'right' }}>GFG</th>
                      <th style={{ textAlign: 'right' }}>CodeChef</th>
                      <th style={{ textAlign: 'right' }}>GitHub Repos</th>
                      <th style={{ textAlign: 'right' }}>Coding Score</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const initial = student.name ? student.name.charAt(0).toUpperCase() : '?';
                      const codingScore = Math.round(student.codingScore || 0);

                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div className="ct-avatar-circle" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>{initial}</div>
                              <span style={{ fontWeight: 600 }}>{student.name}</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {student.mssid || '—'}
                          </td>
                          <td>{student.branch || '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {student.leetcodeSolved ?? 0}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {student.gfgSolved ?? 0}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {student.codechefSolved ?? 0}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {student.githubRepos ?? 0}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)' }}>
                            {codingScore}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link 
                              to={`/coordinator/students/${student.id}`} 
                              className="ct-button-secondary"
                              style={{ display: 'inline-block', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              View Insights
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '1.2rem' }}>
                  <button
                    className="ct-button-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total: {total} records)
                  </span>
                  <button
                    className="ct-button-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </AppShell>
  );
}
