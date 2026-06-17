import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';
import { HeatmapWidget } from '../../components/HeatmapWidget';
import { 
  Trophy, Flame, Activity, Award, Code, GitCommit, 
  ExternalLink, RefreshCw, AlertCircle, Calendar, Globe, BookOpen, Layers
} from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

export function StudentDashboard() {
  const { token } = useAuth();
  const [me, setMe] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [ranks, setRanks] = useState({ global: '-', college: '-', branch: '-', hostel: '-' });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  


  const loadAllData = async () => {
    if (!token) return;
    try {
      // 1. Fetch own profile details
      const profile = await api.getJson('/student/me', token);
      setMe(profile);

      // 2. Fetch recent timeline events
      const timelineData = await api.getJson('/student/me/timeline', token);
      setTimeline(timelineData);

      // 3. Fetch heatmap stats
      const heatmapData = await api.getJson('/student/me/heatmap', token);
      setHeatmap(heatmapData);

      // 4. Fetch ranks
      const [globalList, collegeList, branchList, hostelList] = await Promise.all([
        api.getJson('/leaderboard', token),
        profile.college ? api.getJson(`/leaderboard?college=${encodeURIComponent(profile.college)}`, token) : Promise.resolve([]),
        profile.branch ? api.getJson(`/leaderboard?branch=${encodeURIComponent(profile.branch)}`, token) : Promise.resolve([]),
        profile.hostel ? api.getJson(`/leaderboard?hostel=${encodeURIComponent(profile.hostel)}`, token) : Promise.resolve([])
      ]);

      const findRank = (list) => {
        const idx = list.findIndex(item => String(item.id) === String(profile.id));
        return idx !== -1 ? idx + 1 : '-';
      };

      setRanks({
        global: findRank(globalList),
        college: findRank(collegeList),
        branch: findRank(branchList),
        hostel: findRank(hostelList)
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await api.postJson('/student/me/sync-platforms', { force: true }, token);
      await loadAllData();
    } catch (err) {
      setSyncError(err.message || 'Synchronization failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Generate last 6 months of calendar cells for the heatmap
  const heatmapCells = useMemo(() => {
    if (!heatmap) return [];
    const dataMap = new Map(heatmap.map(d => [d.date, d]));
    const cells = [];
    const today = new Date();
    
    // Start exactly 6 months ago
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Padding cells so grid rows align to weekday indices (0-6)
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ pad: true });
    }

    const curr = new Date(startDate);
    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr) || { date: dateStr, count: 0, activities: [] };
      cells.push({
        date: dateStr,
        count: dayData.count,
        activities: dayData.activities
      });
      curr.setDate(curr.getDate() + 1);
    }
    return cells;
  }, [heatmap]);

  const getHeatmapLevel = (count) => {
    if (count === 0) return 'level-0';
    if (count <= 2) return 'level-1';
    if (count <= 4) return 'level-2';
    if (count <= 7) return 'level-3';
    return 'level-4';
  };

  if (loading || !me) {
    return (
      <AppShell active="student-dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }} className="animate-fade-in">
          {/* Skeleton Loaders */}
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[1, 2, 3, 4].map(n => <div key={n} style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />)}
          </div>
          <div style={{ height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
        </div>
      </AppShell>
    );
  }

  const scores = me.scores || {};
  const stats = me.platformStats || {};
  const lc = stats.leetcode || {};
  const cc = stats.codechef || {};
  const gfg = stats.geeksforgeeks || {};
  const gh = stats.github || {};

  // Total problems solved across all platforms
  const totalSolvedCount = 
    (lc.problemsSolved || 0) + 
    (cc.problemsSolved || 0) + 
    (gfg.problemsSolved || 0) + 
    (me.hackerrank?.totalProblemsSolved || 0);

  // Contest counts
  const totalContestCount = 
    (lc.contestCount || 0) + 
    (cc.contestCount || 0);

  return (
    <AppShell active="student-dashboard">
      <div className={`${styles.dashboard} animate-fade-in`} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* ================= TOP SECTION: PROFILE & SYNC ================= */}
        <div className="ct-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(17, 24, 39, 0.75))' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <h1 className={styles.title} style={{ margin: 0 }}>Welcome back, {me.name}</h1>
              <span className="ct-pill" style={{ background: me.activityStatus === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.1)', borderColor: me.activityStatus === 'active' ? '#22C55E' : '#9ca3af', color: me.activityStatus === 'active' ? '#22C55E' : '#9ca3af' }}>
                {me.activityStatus === 'active' ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <p className={styles.subtitle} style={{ margin: '0.2rem 0 0 0' }}>
              MSSID: <strong>{me.mssid || '-'}</strong> | {me.branch} · Year {me.year} · {me.college}
            </p>
          </div>
          <div>
            <button 
              className="ct-button" 
              onClick={handleSync}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing Profiles...' : 'Sync Profiles'}
            </button>
            {syncError && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={12} /> {syncError}
              </div>
            )}
          </div>
        </div>

        {/* ================= RANKINGS ROW ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Global Rank', value: ranks.global, icon: <Trophy color="#F59E0B" size={24} /> },
            { label: 'College Rank', value: ranks.college, icon: <Award color="#3B82F6" size={24} /> },
            { label: 'Branch Rank', value: ranks.branch, icon: <Code color="#8B5CF6" size={24} /> },
            { label: 'Hostel Rank', value: ranks.hostel, icon: <Layers color="#22C55E" size={24} /> }
          ].map((r, i) => (
            <div key={i} className="ct-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</span>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '2rem', fontWeight: 800 }}>#{r.value}</h2>
              </div>
              <div>{r.icon}</div>
            </div>
          ))}
        </div>

        {/* ================= KPI STATS CARDS ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
          
          <div className="ct-card" style={{ borderLeft: '4px solid var(--accent-blue)', background: 'var(--grad-score)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Weighted Readiness Score</span>
              <Award size={18} color="var(--accent-blue)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{Math.round(scores.weightedRankScore || 0)}</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Legacy CP Score: {Math.round(scores.totalScore || 0)}</p>
          </div>

          <div className="ct-card" style={{ borderLeft: '4px solid var(--accent-orange)', background: 'var(--grad-streak)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Streaks (Current / Max)</span>
              <Flame size={18} color="var(--accent-orange)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>
              🔥 {me.currentStreak || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {me.longestStreak || 0} days</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Days: {me.activeDaysCount || 0} total</p>
          </div>

          <div className="ct-card" style={{ borderLeft: '4px solid var(--accent-purple)', background: 'var(--grad-consistency)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Consistency (30 Days)</span>
              <Activity size={18} color="var(--accent-purple)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{me.consistencyPercentage || 0}%</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Activity score: {scores.activityScore || 0}</p>
          </div>

          <div className="ct-card" style={{ borderLeft: '4px solid var(--accent-green)', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(17,24,39,0.95))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Solved & Contests</span>
              <Code size={18} color="var(--accent-green)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{totalSolvedCount}</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contest participations: {totalContestCount}</p>
          </div>

        </div>

        {/* ================= PLATFORMS GRID ================= */}
        <div>
          <h2 className="ct-section-title">Coding Profiles overview</h2>
          <div className={styles.platformCards}>
            
            {/* LeetCode */}
            <Link to="/student/profile" className={styles.platformCard} style={{ '--accent': '#F59E0B', background: 'var(--grad-lc)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/LeetCode_logo_black.png" alt="LeetCode" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }} />
                  LeetCode
                </span>
                {lc.username ? (
                  <a href={`https://leetcode.com/u/${lc.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', zIndex: 2, position: 'relative' }}>
                    @{lc.username} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                <span>🧩 Solved: <strong>{lc.problemsSolved || 0}</strong></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Easy: {lc.easySolved || 0} | Med: {lc.mediumSolved || 0} | Hard: {lc.hardSolved || 0}</span>
                <span>⭐ Rating: <strong>{Math.round(lc.rating || 0)}</strong></span>
                <span>🏁 Contests: <strong>{lc.contestCount || 0}</strong></span>
              </div>
            </Link>

            {/* CodeChef */}
            <Link to="/student/profile" className={styles.platformCard} style={{ '--accent': '#ef4444', background: 'var(--grad-cc)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/codechef.svg" alt="CodeChef" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }} />
                  CodeChef
                </span>
                {cc.username ? (
                  <a href={`https://www.codechef.com/users/${cc.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', zIndex: 2, position: 'relative' }}>
                    @{cc.username} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                <span>⭐ Current Rating: <strong>{cc.currentRating || cc.rating || 0}</strong></span>
                <span>🏆 Highest Rating: <strong>{cc.highestRating || 0}</strong></span>
                <span>🌍 Global Rank: <strong>{cc.globalRank || 0}</strong></span>
                <span>🏁 Contests Participated: <strong>{cc.contestCount || 0}</strong></span>
                <span>🧩 Problems Solved: <strong>{cc.problemsSolved || 0}</strong></span>
              </div>
            </Link>

            {/* GeeksforGeeks */}
            <Link to="/student/profile" className={styles.platformCard} style={{ '--accent': '#22C55E', background: 'var(--grad-gfg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/gfg.svg" alt="GeeksforGeeks" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }} />
                  GeeksforGeeks
                </span>
                {gfg.username ? (
                  <a href={`https://www.geeksforgeeks.org/user/${gfg.username}/`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', zIndex: 2, position: 'relative' }}>
                    @{gfg.username} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                <span>🧩 Solved: <strong>{gfg.problemsSolved || 0}</strong></span>
                <span>🏆 Score: <strong>{gfg.codingScore || 0}</strong></span>
                <span>🏛️ Inst. Rank: <strong>#{gfg.instituteRank || '-'}</strong></span>
                <span>🔥 Streak: <strong>{gfg.streak || 0} days</strong></span>
              </div>
            </Link>

            {/* GitHub */}
            <Link to="/student/profile" className={styles.platformCard} style={{ '--accent': '#8B5CF6', background: 'var(--grad-gh)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/github.svg" alt="GitHub" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }} />
                  GitHub
                </span>
                {gh.username ? (
                  <a href={`https://github.com/${gh.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', zIndex: 2, position: 'relative' }}>
                    @{gh.username} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                <span>📦 Repositories: <strong>{gh.reposCount || 0}</strong></span>
                <span>⭐ Stars: <strong>{gh.starsCount || 0}</strong></span>
                <span>👥 Followers: <strong>{gh.followersCount || 0}</strong></span>
                <span>🔗 Profile URL: <strong style={{ color: 'var(--accent-blue)', fontSize: '0.75rem' }}>View Profile</strong></span>
              </div>
            </Link>

            {/* HackerRank */}
            <Link to="/student/profile" className={styles.platformCard} style={{ '--accent': '#00EA64', background: 'linear-gradient(135deg, rgba(0, 234, 100, 0.1), rgba(17, 24, 39, 0.95))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#00EA64', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏆</span>
                  HackerRank
                </span>
                {(me.hackerrankUsername || me.hackerrank?.username) ? (
                  <a href={`https://www.hackerrank.com/profile/${me.hackerrankUsername || me.hackerrank?.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', zIndex: 2, position: 'relative' }}>
                    @{me.hackerrankUsername || me.hackerrank?.username} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                <span>🧩 Solved: <strong>{me.hackerrank?.totalProblemsSolved || 0}</strong></span>
                <span>🏅 Badges: <strong>{me.hackerrank?.badgeCount || 0}</strong></span>
                {me.hackerrank?.skills && me.hackerrank.skills.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem' }}>
                    {me.hackerrank.skills.slice(0, 3).map((sk, i) => (
                      <span key={i} className="ct-pill" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', background: 'rgba(255,255,255,0.05)' }}>{sk}</span>
                    ))}
                    {me.hackerrank.skills.length > 3 && <span>+{me.hackerrank.skills.length - 3} more</span>}
                  </div>
                )}
              </div>
            </Link>

          </div>
        </div>

        {/* ================= ACTIVITY HEATMAP ================= */}
        <div className="ct-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--accent-blue)" /> Unified Activity Heatmap
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click cells to view exact activity logs</span>
          </div>
          
          <HeatmapWidget data={heatmap} showDetails={true} />

          {/* Color legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Less</span>
            <div className="heatmap-cell level-0" style={{ width: 10, height: 10 }} />
            <div className="heatmap-cell level-1" style={{ width: 10, height: 10 }} />
            <div className="heatmap-cell level-2" style={{ width: 10, height: 10 }} />
            <div className="heatmap-cell level-3" style={{ width: 10, height: 10 }} />
            <div className="heatmap-cell level-4" style={{ width: 10, height: 10 }} />
            <span>More</span>
          </div>
        </div>

        {/* ================= RECENT ACTIVITY TIMELINE & FEED ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div className="ct-card">
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-purple)" /> Recent Timeline (Latest 10 activities)
            </h3>
            
            {(!me.platformStats?.leetcode?.recentSubmissions || me.platformStats.leetcode.recentSubmissions.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No recent LeetCode activities tracked yet. Run a profile sync to collect logs.
              </div>
            ) : (
              <div className="timeline-feed">
                {me.platformStats.leetcode.recentSubmissions.map((act, idx) => (
                  <div key={idx} className="timeline-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="timeline-platform-badge" style={{ color: '#F59E0B' }}>
                        <Code size={14} /> LEETCODE
                      </span>
                      <span className="timeline-text" style={{ fontSize: '0.85rem' }}>
                        <a href={`https://leetcode.com/problems/${act.titleSlug}/`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f3f4f6', textDecoration: 'underline' }}>
                          {act.title} <ExternalLink size={12} />
                        </a>
                        <span style={{ color: '#22C55E', marginLeft: '0.5rem', fontWeight: 600 }}>(Accepted)</span>
                      </span>
                    </div>
                    <span className="timeline-date">{new Date(Number(act.timestamp) * 1000).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



      </div>
    </AppShell>
  );
}


