import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';

export function LeaderboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    college: '',
    hostel: '',
    branch: '',
    year: '',
    name: '',
    sortBy: 'scores.totalScore',
    sortOrder: 'desc'
  });

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        const query = params.toString() ? `?${params.toString()}` : '';
        const data = await api.getJson(`/leaderboard${query}`, token);
        setRows(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AppShell active="leaderboard">
      <div
        className="ct-card"
        style={{
          background:
            'radial-gradient(circle at top, rgba(56,189,248,0.08), rgba(2,6,23,0.9))',
          boxShadow: '0 25px 70px rgba(0,0,0,0.55)'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '1.2rem',
            gap: '1rem'
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Contextual leaderboard</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
              Filter by college, hostel, year, and branch. Sorted by total score by default.
            </p>
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.6rem',
              maxWidth: 480
            }}
          >
            <input
              className="ct-input"
              placeholder="College"
              value={filters.college}
              onChange={(e) => handleFilterChange('college', e.target.value)}
            />
            <input
              className="ct-input"
              placeholder="Hostel"
              value={filters.hostel}
              onChange={(e) => handleFilterChange('hostel', e.target.value)}
            />
            <input
              className="ct-input"
              placeholder="Year (primary)"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            />
            <input
              className="ct-input"
              placeholder="Branch"
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
            />
            <input
              className="ct-input"
              placeholder="Name search"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
            <select
              className="ct-input"
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
              }}
            >
              <option value="scores.totalScore:desc">Score ↓</option>
              <option value="scores.totalScore:asc">Score ↑</option>
              <option value="name:asc">Name A→Z</option>
              <option value="name:desc">Name Z→A</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div>Loading leaderboard…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ct-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>⭐</th>
                  <th>Name</th>
                  <th>College</th>
                  <th>Hostel</th>
                  <th>Year</th>
                  <th>Branch</th>
                  <th style={{ color: '#f59e0b' }}>LC</th>
                  <th style={{ color: '#facc15' }}>CC</th>
                  <th style={{ color: '#22c55e' }}>HR</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      background: r.isCurrentUser
                        ? 'linear-gradient(90deg, rgba(56,189,248,0.22), rgba(15,23,42,0.25))'
                        : undefined
                    }}
                  >
                    <td>{r.rank}</td>

                    <td>
                      <span
                        style={{
                          color:
                            r.activityStatus === 'active' ? '#facc15' : '#475569'
                        }}
                      >
                        ★
                      </span>
                    </td>

                    {/* ✅ CLICKABLE NAME */}
                    <td>
                      <span
                        onClick={() =>
                          navigate(`/student/profile/view/${r.id}`)
                        }
                        style={{
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: '#38bdf8'
                        }}
                      >
                        {r.name}
                      </span>
                    </td>

                    <td>{r.college || '-'}</td>
                    <td>{r.hostel || '-'}</td>
                    <td>{r.year || '-'}</td>
                    <td>{r.branch || '-'}</td>

                    <td>{Math.round(r.lcScore || 0)}</td>
<td>{Math.round(r.ccScore || 0)}</td>
<td>{Math.round(r.hrScore || 0)}</td>

<td style={{ fontWeight: 700 }}>
  {Math.round(r.totalScore || 0)}
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
