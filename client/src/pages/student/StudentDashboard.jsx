import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';
import styles from '../../styles/Dashboard.module.css';

export function StudentDashboard() {
  const { token } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await api.getJson('/student/me', token);
        setMe(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    try {
      await api.postJson('/student/me/sync-platforms', { force: true }, token);
      const data = await api.getJson('/student/me', token);
      setMe(data);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !me) {
    return (
      <AppShell active="student-dashboard">
        <div className="ct-card">Loading profile…</div>
      </AppShell>
    );
  }

  /* ---------------- DATA ---------------- */
  const scores = me.scores || {
    lcScore: 0,
    ccScore: 0,
    hrScore: 0,
    totalScore: 0
  };

  const platformStats = me.platformStats || {};
  const lc = platformStats.leetcode || {};
  const cc = platformStats.codechef || {};
  const hr = me.hackerrank || {};

  /* ---------------- METRICS ---------------- */
  const daysSinceLastSync = me.lastPlatformSyncAt
  ? Math.floor(
      (Date.now() - new Date(me.lastPlatformSyncAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  : null;

const streak =
  daysSinceLastSync === null
    ? 0
    : daysSinceLastSync <= 1
    ? 1
    : daysSinceLastSync <= 3
    ? 3
    : daysSinceLastSync <= 7
    ? 7
    : 0;

const activePlatforms =
  (scores.lcScore > 0 ? 1 : 0) +
  (scores.ccScore > 0 ? 1 : 0) +
  (scores.hrScore > 0 ? 1 : 0);

const consistency = Math.round((activePlatforms / 3) * 100);

  /* ---------------- UTILS ---------------- */
  const round = (value, digits = 0) => {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Number(Number(value).toFixed(digits));
  };

  return (
    <AppShell active="student-dashboard">
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Your coding performance at a glance</p>

        {/* ================= SUMMARY ================= */}
        <div className={styles.platformCards} style={{ marginBottom: '1.8rem' }}>
          <div
            className={styles.platformCard}
            style={{ '--accent': 'var(--accent-green)' }}
          >
            <span
              className={styles.bigStat}
              style={{ color: 'var(--accent-green)' }}
            >
              {round(scores.totalScore)}
            </span>
            <span className={styles.platformStat}>Overall Score</span>
          </div>

          <div
            className={styles.platformCard}
            style={{ '--accent': 'var(--accent-orange)' }}
          >
            <span
              className={styles.bigStat}
              style={{ color: 'var(--accent-orange)' }}
            >
              🔥 {streak}
            </span>
            <span className={styles.platformStat}>Coding Streak (days)</span>
          </div>

          <div
            className={styles.platformCard}
            style={{ '--accent': 'var(--accent-purple)' }}
          >
            <span
              className={styles.bigStat}
              style={{ color: 'var(--accent-purple)' }}
            >
              {consistency}%
            </span>
            <span className={styles.platformStat}>Consistency</span>
          </div>
        </div>

        {/* ================= PLATFORMS ================= */}
        <section>
          <h2 className={styles.sectionTitle}>Platform overview</h2>

          <div className={styles.platformCards}>
            <Link
              to="/student/platforms#leetcode"
              className={styles.platformCard}
              style={{ '--accent': 'var(--accent-orange)' }}
            >
              <img
                src="/LeetCode_logo_black.png"
                alt="LeetCode"
                className={styles.platformLogo}
              />
              <h3>LeetCode</h3>
              <p>{lc.problemsSolved || 0} problems solved</p>
              <p>Rating: {round(lc.rating)}</p>
            </Link>

            <Link
              to="/student/platforms#codechef"
              className={styles.platformCard}
              style={{ '--accent': 'var(--accent-red)' }}
            >
              <img
                src="/codechef.svg"
                alt="CodeChef"
                className={styles.platformLogo}
              />
              <h3>CodeChef</h3>
              <p>Rating: {round(cc.rating)}</p>
              <p>{cc.contestCount || 0} contests</p>
            </Link>

            <Link
              to="/student/platforms#hackerrank"
              className={styles.platformCard}
              style={{ '--accent': 'var(--accent-green)' }}
            >
              <img
                src="/HackerRank.svg"
                alt="HackerRank"
                className={styles.platformLogo}
              />
              <h3>HackerRank</h3>
              <p>{hr.badgeCount || 0} badges</p>
              <p>
                Skills:{' '}
                {Array.isArray(hr.skills) && hr.skills.length > 0
                  ? hr.skills.slice(0, 2).join(', ')
                  : '-'}
              </p>
            </Link>
          </div>

        </section>
      </div>
    </AppShell>
  );
}
