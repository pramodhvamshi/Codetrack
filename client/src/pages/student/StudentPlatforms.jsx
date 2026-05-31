import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

export function StudentPlatforms() {
  const { token } = useAuth();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingHr, setSavingHr] = useState(false);

  const [hrForm, setHrForm] = useState({
    username: '',
    totalProblemsSolved: '',
    badgeCount: '',
    skills: '',
    certifications: ''
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await api.getJson('/student/me', token);
        setMe(data);

        const hr = data.hackerrank || {};
        setHrForm({
          username: hr.username || '',
          totalProblemsSolved:
            hr.totalProblemsSolved != null ? String(hr.totalProblemsSolved) : '',
          badgeCount: hr.badgeCount != null ? String(hr.badgeCount) : '',
          skills: Array.isArray(hr.skills) ? hr.skills.join(', ') : '',
          certifications: Array.isArray(hr.certifications)
            ? hr.certifications.join(', ')
            : ''
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  /* ================= LOADING STATE ================= */
  if (loading || !me) {
    return (
      <AppShell active="student-platforms">
        <div className="ct-card">Loading…</div>
      </AppShell>
    );
  }

  /* ================= SYNC COOLDOWN ================= */
  const SYNC_COOLDOWN_HOURS = 24;

  const lastSyncAt = me.lastPlatformSyncAt
    ? new Date(me.lastPlatformSyncAt)
    : null;

  const canSync =
    !lastSyncAt ||
    Date.now() - lastSyncAt.getTime() >
      SYNC_COOLDOWN_HOURS * 60 * 60 * 1000;

  /* ================= SYNC ================= */
  const handleSync = async () => {
    if (!token || !canSync) return;

    setSyncing(true);
    try {
      await api.postJson('/student/me/sync-platforms', { force: true }, token);
      const updated = await api.getJson('/student/me', token);
      setMe(updated);
    } finally {
      setSyncing(false);
    }
  };

  /* ================= SAVE HR ================= */
  const handleHrSave = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSavingHr(true);
    try {
      await api.putJson(
        '/student/me/profile',
        {
          hackerrank: {
            username: hrForm.username,
            totalProblemsSolved: Number(hrForm.totalProblemsSolved || 0),
            badgeCount: Number(hrForm.badgeCount || 0),
            skills: hrForm.skills
              ? hrForm.skills.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            certifications: hrForm.certifications
              ? hrForm.certifications.split(',').map(s => s.trim()).filter(Boolean)
              : []
          }
        },
        token
      );

      const updated = await api.getJson('/student/me', token);
      setMe(updated);
    } finally {
      setSavingHr(false);
    }
  };

  /* ================= DATA ================= */
  const stats = me.platformStats || {};
  const lc = stats.leetcode || {};
  const cc = stats.codechef || {};
  const scores = me.scores || {};

  const cardBase = {
    padding: '1.4rem',
    borderRadius: '16px',
    marginBottom: '1.4rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
  };

  const statChip = {
    padding: '0.45rem 0.8rem',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    fontSize: '0.85rem',
    fontWeight: 600
  };

  return (
    <AppShell active="student-platforms">
      <div className="ct-card">

        {/* ================= HEADER ================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.6rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Platforms</h2>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0 }}>
              Your competitive programming presence
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              className="ct-button"
              onClick={handleSync}
              disabled={syncing || !canSync}
              style={{
                opacity: syncing || !canSync ? 0.6 : 1,
                cursor: syncing || !canSync ? 'not-allowed' : 'pointer'
              }}
            >
              {syncing ? 'Syncing…' : 'Sync platforms'}
            </button>

            {!canSync && (
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.8rem',
                  color: '#fbbf24',
                  fontWeight: 500
                }}
              >
                ⏳ You can sync again after 24 hours
              </div>
            )}
          </div>
        </div>
{/* ================= LEETCODE ================= */}
<div
  style={{
    ...cardBase,
    background: 'linear-gradient(135deg, rgba(255,161,22,0.18), rgba(0,0,0,0.35))',
    borderLeft: '5px solid #FFA116'
  }}
>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
    <a
      href={`https://leetcode.com/${me.leetcodeUsername}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        color: '#FFA116',
        textDecoration: 'none'
      }}
    >
      <img src="/LeetCode_logo_black.png" width="30" />
      <strong>LeetCode </strong>
    </a>
    <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
      @{me.leetcodeUsername}
    </span>
  </div>

  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <div style={statChip}>
      🧩 {lc.problemsSolved || 0} Problems
    </div>

    <div style={statChip}>
      🏁 {lc.contestCount || 0} Contests
    </div>

    <div style={statChip}>
      ⭐ Rating {Math.round(lc.rating || 0)}
    </div>

    <div style={{ ...statChip, background: 'rgba(255,161,22,0.25)' }}>
      🏆 Score {Math.round(scores.lcScore || 0)}
    </div>
  </div>
</div>

        {/* ================= CODECHEF ================= */}
<div
  style={{
    ...cardBase,
    background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(0,0,0,0.35))',
    borderLeft: '5px solid #FFD700'
  }}
>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
    <a
      href={`https://www.codechef.com/users/${me.codechefUsername}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        color: '#FFD700',
        textDecoration: 'none'
      }}
    >
      <img src="/codechef.svg" width="30" />
      <strong>CodeChef</strong>
    </a>

    <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
      @{me.codechefUsername}
    </span>
  </div>

  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <div style={statChip}>
      🧩 {cc.problemsSolved || 0} Solved
    </div>
<div style={statChip}>
      🏁 {cc.contestCount || 0} Contests
    </div>
    <div style={statChip}>
      ⭐ Rating {cc.rating || 0}
    </div>

    <div style={{ ...statChip, background: 'rgba(255,215,0,0.25)' }}>
      🏆 Score {scores.ccScore || 0}
    </div>
  </div>
</div>

        {/* ================= HACKERRANK ================= */}
        <div
          style={{
            ...cardBase,
            background: 'linear-gradient(135deg, rgba(46,200,102,0.18), rgba(0,0,0,0.35))',
            borderLeft: '5px solid #2EC866'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <img src="/HackerRank.svg" width="30" />
            <strong style={{ color: '#2EC866' }}>HackerRank (Manual)</strong>
          </div>

          <form onSubmit={handleHrSave}>
            <div className="ct-grid-2">
              <div>
                <label className="ct-label">Username</label>
                <input className="ct-input" value={hrForm.username}
                  onChange={(e) => setHrForm({ ...hrForm, username: e.target.value })} />
              </div>
              <div>
                <label className="ct-label">Problems solved</label>
                <input className="ct-input" type="number" value={hrForm.totalProblemsSolved}
                  onChange={(e) => setHrForm({ ...hrForm, totalProblemsSolved: e.target.value })} />
              </div>
            </div>

            <div className="ct-grid-2" style={{ marginTop: '0.8rem' }}>
              <div>
                <label className="ct-label">Badge count</label>
                <input className="ct-input" type="number" value={hrForm.badgeCount}
                  onChange={(e) => setHrForm({ ...hrForm, badgeCount: e.target.value })} />
              </div>
              <div>
                <label className="ct-label">Skills</label>
                <input className="ct-input" value={hrForm.skills}
                  onChange={(e) => setHrForm({ ...hrForm, skills: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: '0.8rem' }}>
              <label className="ct-label">Certifications</label>
              <input className="ct-input" value={hrForm.certifications}
                onChange={(e) => setHrForm({ ...hrForm, certifications: e.target.value })} />
            </div>


            <button
              className="ct-button"
              type="submit"
              style={{ marginTop: '1rem' }}
              disabled={savingHr}
            >
              {savingHr ? 'Saving…' : 'Save HackerRank details'}
            </button>
          </form>
        </div>

      </div>
    </AppShell>
  );
}
