import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

export function StudentPublicProfile() {
  const { token } = useAuth();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await api.getJson(`/students/${id}`, token);
        setStudent(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, id]);

  if (loading || !student) {
    return (
      <AppShell active="leaderboard">
        <div className="ct-card">Loading profile…</div>
      </AppShell>
    );
  }

  const scores = student.scores || {};
  const stats = student.platformStats || {};
  const lc = stats.leetcode || {};
  const cc = stats.codechef || {};
  const hr = student.hackerrank || {};

  return (
    <AppShell active="leaderboard">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* BACK */}
        <div style={{ marginBottom: '0.8rem' }}>
          <Link
            to="/leaderboard"
            style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'underline' }}
          >
            ← Back to leaderboard
          </Link>
        </div>

        {/* HEADER */}
        <div
          className="ct-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(15,23,42,0.4))'
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>{student.name}</h2>
            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#9ca3af' }}>
              {student.college} · {student.branch} · Year {student.year}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="ct-chip" style={{ marginBottom: '0.3rem' }}>
              Rank Score: {scores.totalScore || 0}
            </div>
            <div
              className={
                student.activityStatus === 'active'
                  ? 'ct-star-active'
                  : 'ct-star-inactive'
              }
            >
              ⭐ {student.activityStatus === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* PLATFORM STATS */}
        <div className="ct-grid-3" style={{ marginTop: '1.2rem' }}>
          <div
            className="ct-card"
            style={{ borderLeft: '5px solid #FFA116' }}
          >
            <h4>LeetCode</h4>
            <p>@{student.leetcodeUsername || '-'}</p>
            <p>{lc.problemsSolved || 0} problems</p>
            <p>Rating {lc.rating || '-'}</p>
            <p className="ct-chip">Score {scores.lcScore || 0}</p>
          </div>

          <div
            className="ct-card"
            style={{ borderLeft: '5px solid #FFD700' }}
          >
            <h4>CodeChef</h4>
            <p>@{student.codechefUsername || '-'}</p>
            <p>{cc.contestCount || 0} contests</p>
            <p>Rating {cc.rating || '-'}</p>
            <p className="ct-chip">Score {scores.ccScore || 0}</p>
          </div>

          <div
            className="ct-card"
            style={{ borderLeft: '5px solid #2EC866' }}
          >
            <h4>HackerRank</h4>
            <p>@{hr.username || '-'}</p>
            <p>{hr.totalProblemsSolved || 0} problems</p>
            <p>{hr.badgeCount || 0} badges</p>
            <p className="ct-chip">Score {scores.hrScore || 0}</p>
          </div>
        </div>

        {/* PROJECTS */}
        <div className="ct-card" style={{ marginTop: '1.2rem' }}>
          <h3>Projects</h3>
          {student.projects && student.projects.length > 0 ? (
            student.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: '0.8rem' }}>
                <strong>{p.name}</strong>
                {p.highlights?.map((h, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem', color: '#cbd5f5' }}>
                    • {h}
                  </div>
                ))}
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noreferrer">
                    GitHub →
                  </a>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: '#9ca3af' }}>No projects added.</p>
          )}
        </div>

        {/* ACHIEVEMENTS */}
        <div className="ct-card" style={{ marginTop: '1.2rem' }}>
          <h3>Achievements</h3>
          {student.achievements?.length ? (
            student.achievements.map((a, i) => (
              <p key={i}>
                <strong>{a.title}</strong>
                <br />
                <span style={{ fontSize: '0.85rem', color: '#cbd5f5' }}>
                  {a.description}
                </span>
              </p>
            ))
          ) : (
            <p style={{ color: '#9ca3af' }}>No achievements listed.</p>
          )}
        </div>

      </div>
    </AppShell>
  );
}
