import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';

export function PublicStudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ FIXED PATH (matches app.js)
        const data = await api.getJson(`/profiles/${id}`);
        setStudent(data);
      } catch {
        setError('Profile not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="ct-card">Loading profile…</div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <div className="ct-card" style={{ color: '#f87171' }}>
          Profile not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="ct-card" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/leaderboard" style={{ color: '#38bdf8' }}>
          ← Back to leaderboard
        </Link>

        <h2 style={{ marginTop: '1rem' }}>{student.name}</h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          {student.college} · {student.branch} · Year {student.year}
        </p>

        <hr style={{ opacity: 0.15, margin: '1rem 0' }} />

        <div className="ct-section-title">Coding profiles</div>
        <ul>
          {student.leetcodeUsername && (
            <li>
              LeetCode:{' '}
              <a
                href={`https://leetcode.com/${student.leetcodeUsername}`}
                target="_blank"
                rel="noreferrer"
              >
                @{student.leetcodeUsername}
              </a>
            </li>
          )}
          {student.codechefUsername && (
            <li>
              CodeChef:{' '}
              <a
                href={`https://www.codechef.com/users/${student.codechefUsername}`}
                target="_blank"
                rel="noreferrer"
              >
                @{student.codechefUsername}
              </a>
            </li>
          )}
        </ul>

        <div className="ct-section-title">Scores</div>
        <p>
          LC: {student.scores?.lcScore || 0} · CC: {student.scores?.ccScore || 0} · HR:{' '}
          {student.scores?.hrScore || 0}
        </p>
      </div>
    </AppShell>
  );
}
