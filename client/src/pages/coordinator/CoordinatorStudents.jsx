import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import styles from '../../styles/StudentList.module.css';

const SORT_OPTIONS = [
  { value: 'scores.weightedRankScore:desc', label: 'Readiness Score (High → Low)' },
  { value: 'scores.weightedRankScore:asc', label: 'Readiness Score (Low → High)' },
  { value: 'scores.totalScore:desc', label: 'Legacy CP Score (High → Low)' },
  { value: 'name:asc', label: 'Name (A → Z)' },
  { value: 'name:desc', label: 'Name (Z → A)' },
  { value: 'year:asc', label: 'Year (1 → 4)' },
  { value: 'year:desc', label: 'Year (4 → 1)' }
];

export function CoordinatorStudents() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [allStudents, setAllStudents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    college: '',
    branch: '',
    year: '',
    scoreMin: '',
    scoreMax: '',
    sortBy: 'scores.weightedRankScore',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ colleges: [], branches: [], years: [] });

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.college) params.set('college', filters.college);
        if (filters.branch) params.set('branch', filters.branch);
        if (filters.year) params.set('year', filters.year);
        if (filters.search) params.set('name', filters.search);
        if (filters.scoreMin) params.set('scoreMin', filters.scoreMin);
        if (filters.scoreMax) params.set('scoreMax', filters.scoreMax);
        params.set('sortBy', filters.sortBy);
        params.set('sortOrder', filters.sortOrder);
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await api.getJson(`/coordinator/students${query}`, token);
        setAllStudents(res.students || res || []);
        if (res.filters) {
          setFilterOptions(res.filters);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, filters]);

  const filteredAndSorted = useMemo(() => {
    let list = [...allStudents];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.college || '').toLowerCase().includes(q)
      );
    }
    if (filters.college) list = list.filter((s) => s.college === filters.college);
    if (filters.branch) list = list.filter((s) => s.branch === filters.branch);
    if (filters.year) list = list.filter((s) => String(s.year) === filters.year);
    if (filters.scoreMin !== '') {
      list = list.filter((s) => Math.round((s.score ?? s.scores?.totalScore ?? 0)) >= Number(filters.scoreMin));
    }
    if (filters.scoreMax !== '') {
      list = list.filter((s) => Math.round((s.score ?? s.scores?.totalScore ?? 0)) <= Number(filters.scoreMax));
    }

    const [field, order] = filters.sortBy.split('.');
    list.sort((a, b) => {
      let va, vb;
      if (field === 'scores' && order === 'weightedRankScore') {
        va = Math.round(a.scores?.weightedRankScore ?? a.score ?? a.scores?.totalScore ?? 0);
        vb = Math.round(b.scores?.weightedRankScore ?? b.score ?? b.scores?.totalScore ?? 0);
      } else if (field === 'scores' && order === 'totalScore') {
        va = Math.round(a.scores?.totalScore ?? a.score ?? 0);
        vb = Math.round(b.scores?.totalScore ?? b.score ?? 0);
      } else if (field === 'name') {
        va = (a.name || '').toLowerCase();
        vb = (b.name || '').toLowerCase();
        return filters.sortOrder === 'asc' ? (va < vb ? -1 : 1) : (vb < va ? -1 : 1);
      } else if (field === 'year') {
        va = Number(a.year || 0);
        vb = Number(b.year || 0);
      } else {
        va = a[field] || 0;
        vb = b[field] || 0;
      }
      return filters.sortOrder === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [allStudents, filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      college: '',
      branch: '',
      year: '',
      scoreMin: '',
      scoreMax: '',
      sortBy: 'scores.weightedRankScore',
      sortOrder: 'desc'
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell active="coord-students">
      <div className={styles.page}>
        <h1 className={styles.title}>Students</h1>
        <p className={styles.subtitle}>Browse, filter, and sort coding profiles</p>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Search name, email, college..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.search}
            />
            <select
              value={filters.college}
              onChange={(e) => handleFilterChange('college', e.target.value)}
              className={styles.select}
            >
              <option value="">All colleges</option>
              {filterOptions.colleges.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
              className={styles.select}
            >
              <option value="">All branches</option>
              {filterOptions.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className={styles.select}
            >
              <option value="">All years</option>
              {filterOptions.years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
            <div className={styles.scoreRange}>
              <input
                type="number"
                min="0"
                max="1000"
                placeholder="Min score"
                value={filters.scoreMin}
                onChange={(e) => handleFilterChange('scoreMin', e.target.value)}
                className={styles.scoreInput}
              />
              <span className={styles.scoreSep}>–</span>
              <input
                type="number"
                min="0"
                max="1000"
                placeholder="Max score"
                value={filters.scoreMax}
                onChange={(e) => handleFilterChange('scoreMax', e.target.value)}
                className={styles.scoreInput}
              />
            </div>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
              className={styles.select}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={clearFilters} className={styles.clearBtn}>
              Clear filters
            </button>
          </div>
        </div>

        <div className={styles.resultsInfo}>
          Showing {filteredAndSorted.length} of {allStudents.length} students
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            <div className={styles.cardGrid}>
              {filteredAndSorted.map((student) => {
                const initial = student.name ? student.name.charAt(0).toUpperCase() : '?';
                const score = student.scores?.weightedRankScore ?? student.score ?? student.scores?.totalScore ?? 0;
                return (
                  <Link
                    key={student.id}
                    to={`/coordinator/students/${student.id}`}
                    className={styles.card}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.avatar}>{initial}</div>
                      <div className={styles.cardMeta}>
                        <h3 className={styles.cardName}>{student.name}</h3>
                        <span className={styles.cardCollege}>{student.college}</span>
                      </div>
                      <span className={styles.cardScore}>{score}</span>
                    </div>
                    <div className={styles.cardDetails}>
                      <span>{student.branch}</span>
                      <span>Year {student.year}</span>
                    </div>
                    <div className={styles.platformBadges} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        {student.platforms?.leetcode && (
                          <span className={styles.badge}>LeetCode</span>
                        )}
                        {student.platforms?.codechef && (
                          <span className={styles.badge}>CodeChef</span>
                        )}
                        {student.platforms?.hackerrank && (
                          <span className={styles.badge}>HackerRank</span>
                        )}
                      </div>
                      
                      {student.resumeInfo?.hasResume ? (
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <span style={{ color: '#22c55e' }}>📝 {student.resumeInfo.score}%</span>
                          <span style={{ color: '#a855f7' }}>⚡ {student.resumeInfo.atsScore}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>⚠️ No Resume</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredAndSorted.length === 0 && (
              <p className={styles.empty}>No students match your filters.</p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
