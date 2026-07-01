import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { HeatmapWidget } from '../../components/HeatmapWidget';
import { RefreshCw, Info } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
function getPlatformColor(p) {
  const map = { leetcode: '#F59E0B', codechef: '#ef4444', geeksforgeeks: '#22C55E', github: '#8B5CF6', hackerrank: '#2EC866' };
  return map[p] || '#9ca3af';
}

function getPlatformLabel(p) {
  const map = { leetcode: 'LeetCode', codechef: 'CodeChef', geeksforgeeks: 'GFG', github: 'GitHub', hackerrank: 'HackerRank' };
  return map[p] || p;
}

function computeProfileCompletion(s) {
  if (!s || !s.profile) return 0;
  const p = s.profile;
  const checks = [
    p.name, p.college, p.branch, p.graduationYear, p.hostel,
    p.leetcodeUsername, p.codechefUsername, p.gfgUsername,
    p.githubUsername,
    p.projects?.length > 0,
    p.certifications?.length > 0,
    p.achievements?.length > 0,
    p.linkedinUrl,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function computePlacementReadiness(s) {
  if (!s || !s.profile) return { score: 0, strengths: [], improve: [] };
  const p = s.profile;
  const lc = s.leetcode || {};
  const cc = s.codechef || {};
  const gfg = s.gfg || {};
  const gh = s.github || {};

  let score = 0;
  const strengths = [];
  const improve = [];

  // DSA (35 pts)
  const totalSolved = (lc.totalSolved || 0) + (cc.problemsSolved || 0) + (gfg.totalProblemsSolved || 0);
  const dsaPts = Math.min(35, Math.round((totalSolved / 400) * 35));
  score += dsaPts;
  if (dsaPts >= 25) strengths.push('DSA'); else improve.push('Solve more problems (LeetCode / GFG)');

  // Consistency (20 pts)
  const conPts = Math.min(20, Math.round(((p.consistencyPercentage || 0) / 100) * 20));
  score += conPts;
  if (conPts >= 15) strengths.push('Consistency'); else improve.push('Improve daily activity consistency');

  // Projects (20 pts)
  const projCount = p.projects?.length || 0;
  const projPts = Math.min(20, projCount * 7);
  score += projPts;
  if (projPts >= 14) strengths.push('Projects'); else improve.push(`Add ${Math.max(0, 3 - projCount)} more projects`);

  // GitHub (15 pts)
  const repos = gh.reposCount || 0; // github count from mongo or general gh count
  const ghPts = Math.min(15, Math.round((repos / 10) * 15));
  score += ghPts;
  if (ghPts >= 10) strengths.push('GitHub'); else improve.push('Build more GitHub repositories');

  // Achievements / Certs (10 pts)
  const achPts = Math.min(10, ((p.achievements?.length || 0) + (p.certifications?.length || 0)) * 3);
  score += achPts;
  if (achPts >= 6) strengths.push('Certifications'); else improve.push('Add certifications or achievements');

  return { score: Math.min(100, score), strengths, improve };
}

export function HackerRankBadge({ name, starsCount, width = 100, height = 100 }) {
  const officialGreen = "#15c25e";
  const goldStar = "#F59E0B";

  const normalized = name.toLowerCase().trim();
  let iconContent = null;
  
  if (normalized.includes("problem solving")) {
    iconContent = (
      <path d="M50 22L57.27 36.73L73.54 39.1L61.77 50.57L64.55 66.77L50 59.12L35.45 66.77L38.23 50.57L26.46 39.1L42.73 36.73L50 22Z" fill="#F59E0B" />
    );
  } else if (normalized.includes("python")) {
    iconContent = (
      <g>
        <path d="M49.5 24C41.5 24 40.5 27.5 40.5 30.5H45.5V31.5H38.5C35.5 31.5 33.5 33.5 33.5 37.5C33.5 41.5 36.5 43.5 40.5 43.5H42.5V41.5C42.5 38.5 44.5 36.5 47.5 36.5H53.5C56.5 36.5 57.5 34.5 57.5 31.5V28.5C57.5 25.5 55.5 24 49.5 24ZM45.5 27.5C46.3 27.5 47 28.2 47 29C47 29.8 46.3 30.5 45.5 30.5C44.7 30.5 44 29.8 44 29C44 28.2 44.7 27.5 45.5 27.5Z" fill="#38bdf8" />
        <path d="M50.5 56C58.5 56 59.5 52.5 59.5 49.5H54.5V48.5H61.5C64.5 48.5 66.5 46.5 66.5 42.5C66.5 38.5 63.5 36.5 59.5 36.5H57.5V38.5C57.5 41.5 55.5 43.5 52.5 43.5H46.5C43.5 43.5 42.5 45.5 42.5 48.5V51.5C42.5 54.5 44.5 56 50.5 56ZM54.5 52.5C53.7 52.5 53 51.8 53 51C53 50.2 53.7 49.5 54.5 49.5C55.3 49.5 56 50.2 56 51C56 51.8 55.3 52.5 54.5 52.5Z" fill="#fbbf24" />
      </g>
    );
  } else if (normalized.includes("sql")) {
    iconContent = (
      <g stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="50" cy="32" rx="15" ry="6" fill="rgba(168, 85, 247, 0.2)" />
        <path d="M35 32V42C35 45.3 41.7 48 50 48C58.3 48 65 45.3 65 42V32" fill="none" />
        <path d="M35 42V52C35 55.3 41.7 58 50 58C58.3 58 65 55.3 65 52V42" fill="none" />
      </g>
    );
  } else if (normalized.includes("java")) {
    iconContent = (
      <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M42 42C42 48 58 48 58 42" fill="none" />
        <path d="M38 34H62V41C62 45 58 48 50 48C42 48 38 45 38 41V34Z" fill="rgba(239, 68, 68, 0.1)" />
        <path d="M62 38C65 38 67 39 67 41C67 43 65 44 62 44" fill="none" />
        <path d="M46 22C46 22 48 26 46 29" fill="none" />
        <path d="M51 20C51 20 53 24 51 27" fill="none" />
        <path d="M56 22C56 22 58 26 56 29" fill="none" />
        <path d="M36 54H64" strokeWidth="2" fill="none" />
      </g>
    );
  } else if (normalized.includes("javascript") || normalized.includes("js")) {
    iconContent = (
      <g>
        <rect x="35" y="32" width="30" height="30" rx="4" fill="#F7DF1E" />
        <text x="50" y="52" fill="#000000" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle">JS</text>
      </g>
    );
  } else if (normalized.includes("c++") || normalized.includes("cpp")) {
    iconContent = (
      <g>
        <circle cx="50" cy="45" r="16" fill="rgba(0, 132, 219, 0.15)" stroke="#00599C" strokeWidth="2" />
        <text x="44" y="50" fill="#f3f4f6" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">C</text>
        <text x="56" y="47" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">+</text>
        <text x="56" y="53" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">+</text>
      </g>
    );
  } else if (normalized === "c") {
    iconContent = (
      <g>
        <circle cx="50" cy="45" r="16" fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6" strokeWidth="2" />
        <text x="50" y="51" fill="#f3f4f6" fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle">C</text>
      </g>
    );
  } else if (normalized.includes("ruby")) {
    iconContent = (
      <g>
        <polygon points="50,28 62,36 65,50 57,62 43,62 35,50 38,36" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="50,33 59,40 62,50 55,59 45,59 38,50 41,40" fill="#ef4444" fillOpacity="0.7" />
        <polygon points="50,38 56,43 58,50 53,56 47,56 42,50 44,43" fill="#fca5a5" />
      </g>
    );
  } else if (normalized.includes("30 days of code") || normalized.includes("days of code")) {
    iconContent = (
      <g>
        <rect x="34" y="30" width="32" height="28" rx="4" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <line x1="34" y1="38" x2="66" y2="38" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="41" y1="26" x2="41" y2="34" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="59" y1="26" x2="59" y2="34" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <text x="50" y="53" fill="#f59e0b" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">30</text>
      </g>
    );
  } else if (normalized.includes("10 days of javascript") || normalized.includes("days of javascript") || normalized.includes("days of js")) {
    iconContent = (
      <g>
        <rect x="33" y="32" width="34" height="26" rx="4" fill="rgba(247,223,30,0.15)" stroke="#F7DF1E" strokeWidth="1.5" />
        <text x="45" y="50" fill="#F7DF1E" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">JS</text>
        <text x="58" y="42" fill="#f3f4f6" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">10</text>
      </g>
    );
  } else if (normalized.includes("10 days of statistics") || normalized.includes("days of statistics")) {
    iconContent = (
      <g stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round">
        <line x1="36" y1="58" x2="36" y2="44" stroke="#8b5cf6" />
        <line x1="44" y1="58" x2="44" y2="36" stroke="#a78bfa" />
        <line x1="52" y1="58" x2="52" y2="40" stroke="#8b5cf6" />
        <line x1="60" y1="58" x2="60" y2="30" stroke="#a78bfa" />
        <polyline points="36,44 44,36 52,40 60,30" fill="none" stroke="#c4b5fd" strokeWidth="1.5" />
      </g>
    );
  } else if (normalized.includes("react")) {
    iconContent = (
      <g fill="none" stroke="#61dafb" strokeWidth="1.8">
        <ellipse cx="50" cy="45" rx="16" ry="6" transform="rotate(0,50,45)" />
        <ellipse cx="50" cy="45" rx="16" ry="6" transform="rotate(60,50,45)" />
        <ellipse cx="50" cy="45" rx="16" ry="6" transform="rotate(120,50,45)" />
        <circle cx="50" cy="45" r="3" fill="#61dafb" stroke="none" />
      </g>
    );
  } else {
    iconContent = (
      <path d="M38 36L26 45L38 54M62 36L74 45L62 54" fill="none" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    );
  }

  const stars = [];
  const totalStars = Number(starsCount) || 0;
  for (let i = 0; i < totalStars; i++) {
    let cx = 50;
    let cy = 76;
    if (totalStars > 1) {
      const step = totalStars === 2 ? 16 : totalStars === 3 ? 12 : 9;
      const mid = (totalStars - 1) / 2;
      const offset = (i - mid) * step;
      cx = 50 + offset;
      const normOffset = (i - mid) / (mid || 1);
      cy = 76 - (totalStars > 2 ? Math.abs(normOffset) * 3 : 0);
    }
    
    stars.push(
      <path
        key={i}
        d={`M${cx} ${cy - 4} L${cx + 1.2} ${cy - 1.2} L${cx + 4} ${cy - 0.8} L${cx + 1.8} ${cy + 1.2} L${cx + 2.5} ${cy + 4} L${cx} ${cy + 2.2} L${cx - 2.5} ${cy + 4} L${cx - 1.8} ${cy + 1.2} L${cx - 4} ${cy - 0.8} L${cx - 1.2} ${cy - 1.2} Z`}
        fill={goldStar}
      />
    );
  }

  const heptagonPoints = [];
  for (let i = 0; i < 7; i++) {
    const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
    const x = 50 + 38 * Math.cos(angle);
    const y = 48 + 38 * Math.sin(angle);
    heptagonPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const heptagonStr = heptagonPoints.join(" ");

  const innerHeptagonPoints = [];
  for (let i = 0; i < 7; i++) {
    const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
    const x = 50 + 33 * Math.cos(angle);
    const y = 48 + 33 * Math.sin(angle);
    innerHeptagonPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const innerHeptagonStr = innerHeptagonPoints.join(" ");

  return (
    <svg width={width} height={height} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0px 4px 10px rgba(21, 194, 94, 0.15))` }}>
      <defs>
        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={officialGreen} />
          <stop offset="100%" stopColor="#0b4d24" />
        </linearGradient>
      </defs>
      <polygon points={heptagonStr} fill="url(#badgeGrad)" stroke="url(#borderGrad)" strokeWidth="3" strokeLinejoin="round" />
      <polygon points={innerHeptagonStr} fill="none" stroke="rgba(21, 194, 94, 0.3)" strokeWidth="1" strokeLinejoin="round" />
      <g transform="translate(0, -3)">
        {iconContent}
      </g>
      {stars}
    </svg>
  );
}

function computeAutoAchievements(s) {
  if (!s || !s.profile) return [];
  const p = s.profile;
  const lc = s.leetcode || {};
  const cc = s.codechef || {};
  const gfg = s.gfg || {};
  const hr = p.hackerrank || {};
  
  const totalSolved = (lc.totalSolved || 0) + (cc.problemsSolved || 0) + (gfg.totalProblemsSolved || 0) + (hr.totalProblemsSolved || 0);
  const badges = [];

  if (totalSolved >= 500) badges.push({ icon: '🏆', title: '500 Problems Solved', desc: 'Exceptional problem-solving mastery', color: '#F59E0B' });
  else if (totalSolved >= 100) badges.push({ icon: '🥇', title: '100 Problems Solved', desc: 'Strong DSA foundation', color: '#F59E0B' });
  else if (totalSolved >= 50) badges.push({ icon: '🥈', title: '50 Problems Solved', desc: 'DSA starter', color: '#9ca3af' });

  if ((p.longestStreak || 0) >= 100) badges.push({ icon: '🔥', title: '100 Day Streak', desc: 'Legendary consistency', color: '#ef4444' });
  else if ((p.longestStreak || 0) >= 30) badges.push({ icon: '🔥', title: '30 Day Streak', desc: 'Excellent habit', color: '#F59E0B' });
  else if ((p.currentStreak || 0) >= 7) badges.push({ icon: '⚡', title: '7 Day Streak', desc: 'On a roll!', color: '#22C55E' });

  if ((lc.contestRating || 0) >= 2000) badges.push({ icon: '👑', title: 'LeetCode Knight+', desc: `Rating ${lc.contestRating}`, color: '#F59E0B' });
  else if ((lc.contestRating || 0) >= 1500) badges.push({ icon: '⚔️', title: 'LeetCode Guardian', desc: `Rating ${lc.contestRating}`, color: '#3B82F6' });

  if (hr.skills && hr.skills.length > 0) {
    hr.skills.forEach(skill => {
      const match = skill.match(/(.*?)\s*\((\d+)★\)/);
      const name = match ? match[1] : skill;
      const stars = match ? match[2] : '0';
      badges.push({ 
        icon: <HackerRankBadge name={name} starsCount={stars} width={36} height={36} />, 
        title: `HackerRank: ${name}`, 
        desc: `Verified skill badge (${stars}★)`, 
        color: '#15c25e' 
      });
    });
  }

  return badges;
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
   ───────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

const COLLEGES = [
  'CBIT', 'VASAVI', 'MVSR', 'GRIET', 'VARDHAMAN', 'JNTU', 'GNWC', 'BVRIT', 'OU', 'KMIT', 'HCU', 'NIT', 'IIT', 'Loyola', 'Other'
];

const HOSTELS = [
  'Mehdipatnam', 'Kukatpally', 'Uppal', 'Nagergul', 'Shamshabad', 'Loyola'
];

const BRANCHES = [
  'CSE', 'CSB', 'CSD', 'CSM', 'AIML', 'IT', 'AIDS', 'ECE', 'CSE-IoT', 'CSC (Cybersecurity)'
];

/* ─────────────────────────────────────────────
   HELPERS & GENERIC COMPONENTS
   ───────────────────────────────────────────── */
const isValidUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const formatNiceDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Extensible InfoCard component for Certifications, Hackathons, Internships, etc.
const InfoCard = ({ icon, title, subtitle, fields, description, badge, actions }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongDesc = description && description.length > 120;
  const displayDesc = expanded ? description : (isLongDesc ? description.substring(0, 120) + '...' : description);

  return (
    <div className="ct-card info-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <div style={{ fontSize: '1.8rem' }}>{icon}</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6' }}>{title}</h3>
            {subtitle && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</div>}
          </div>
        </div>
        {badge && (
          <div className={`status-badge ${badge.type}`}>
            {badge.text}
          </div>
        )}
      </div>

      {fields && fields.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.8rem', padding: '0.8rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: description ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          {fields.map((f, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e5e7eb', marginTop: '0.2rem' }}>{f.value || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {description && (
        <div style={{ padding: '0.8rem 0', borderBottom: actions && actions.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Description</div>
          <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>
            {displayDesc}
            {isLongDesc && (
              <button 
                onClick={() => setExpanded(!expanded)} 
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginLeft: '0.4rem' }}
              >
                {expanded ? 'Show Less' : 'Read More'}
              </button>
            )}
          </div>
        </div>
      )}

      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', gap: '0.8rem', paddingTop: '0.8rem' }}>
          {actions.map((act, i) => (
            isValidUrl(act.url) ? (
              <a key={i} href={act.url} target="_blank" rel="noreferrer" className="ct-button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                {act.label} <span style={{ fontSize: '0.9rem' }}>↗</span>
              </a>
            ) : (
              <span key={i} className="ct-button-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: 0.5, cursor: 'not-allowed' }}>
                Unavailable
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export function PublicStudentProfile() {
  const { id: routeId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // If routeId is present, we view that student's profile. Else, load the logged-in student's profile directly.
  const id = routeId || user?.id;

  const [student, setStudent] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');


  // Editing details
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState({});
  const [collegeSearchOpen, setCollegeSearchOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    college: '',
    hostel: '',
    branch: '',
    graduationYear: '',
    linkedinUrl: '',
    githubUrl: '',
    leetcodeUsername: '',
    codechefUsername: '',
    gfgUsername: '',
    githubUsername: '',
    mssid: ''
  });
  const filteredColleges = useMemo(() => {
    const query = (editForm.college || '').toLowerCase();
    if (!query) return COLLEGES;
    return COLLEGES.filter(c => c.toLowerCase().includes(query));
  }, [editForm.college]);

  const isOwner = user && String(user.id) === String(id);
  const isCoordinator = user?.role === 'coordinator';

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      if (isOwner) {
        await api.postJson('/student/me/sync-platforms', { force: true }, token);
      } else if (isCoordinator) {
        await api.postJson(`/coordinator/students/${id}/sync`, {}, token);
      }
      await loadProfileData();
      toast.success('Sync completed successfully!');
    } catch (err) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const loadProfileData = async () => {
    if (!id) return;
    try {
      const profileData = await api.getJson(`/profiles/${id}`);
      setStudent(profileData);
      setHeatmap(profileData.heatmap || []);
      setTimeline(profileData.leetcode?.recentSubmissions || []);

      if (profileData.profile) {
        setEditForm({
          name: profileData.profile.name || '',
          bio: profileData.profile.bio || '',
          college: profileData.profile.college || '',
          hostel: profileData.profile.hostel || '',
          branch: profileData.profile.branch || '',
          graduationYear: profileData.profile.graduationYear || '',
          linkedinUrl: profileData.profile.linkedinUrl || '',
          githubUrl: profileData.profile.githubUrl || '',
          leetcodeUsername: profileData.profile.leetcodeUsername || '',
          codechefUsername: profileData.profile.codechefUsername || '',
          gfgUsername: profileData.profile.gfgUsername || '',
          githubUsername: profileData.profile.githubUsername || '',
          mssid: profileData.profile.mssid || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [id, token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalErrors({});
    try {
      await api.putJson('/student/me/profile', editForm, token);
      toast.success('Profile updated successfully.');
      await loadProfileData();
      setIsEditModalOpen(false);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.errors) {
          setModalErrors(parsed.errors);
          toast.error(parsed.message || 'Failed to save changes');
        } else {
          toast.error(parsed.message || 'Failed to save changes');
        }
      } catch (e) {
        toast.error(err.message || 'Failed to save changes');
      }
    } finally {
      setSaving(false);
    }
  };

  const profile = student?.profile || {};
  const lc = student?.leetcode || {};
  const cc = student?.codechef || {};
  const gfg = student?.gfg || {};
  const gh = student?.github || {};
  const hr = profile?.hackerrank || {};
  const scores = profile?.scores || {};

  const totalSolved = (lc.totalSolved || 0) + (cc.problemsSolved || 0) + (gfg.totalProblemsSolved || 0) + (hr.totalProblemsSolved || 0);
  const profileCompletion = computeProfileCompletion(student);
  const readiness = computePlacementReadiness(student);
  const autoAchievements = computeAutoAchievements(student);

  const totalContributions = useMemo(() => {
    return (gh.contributions || []).reduce((sum, item) => sum + Number(item.contributionCount || item.count || 0), 0);
  }, [gh]);

  const activeDays = useMemo(() => {
    return (gh.contributions || []).filter(item => Number(item.contributionCount || item.count || 0) > 0).length;
  }, [gh]);

  // Recharts data
  const platformPieData = useMemo(() => [
    { name: 'LeetCode', value: lc.totalSolved || 0, color: '#F59E0B' },
    { name: 'CodeChef', value: cc.problemsSolved || 0, color: '#ef4444' },
    { name: 'GFG', value: gfg.totalProblemsSolved || 0, color: '#22C55E' },
    { name: 'HackerRank', value: hr.totalProblemsSolved || 0, color: '#2EC866' },
  ].filter(d => d.value > 0), [student]);

  const platformBarData = useMemo(() => [
    { platform: 'LC', solved: lc.totalSolved || 0, rating: lc.contestRating || 0 },
    { platform: 'CC', solved: cc.problemsSolved || 0, rating: cc.currentRating || 0 },
    { platform: 'GFG', solved: gfg.totalProblemsSolved || 0, rating: 0 },
  ], [student]);

  const radarData = useMemo(() => [
    { subject: 'DSA', score: Math.min(100, totalSolved / 4) },
    { subject: 'Contests', score: Math.min(100, ((profile.leetcodeUsername ? 1 : 0) + (profile.codechefUsername ? 1 : 0)) * 50) },
    { subject: 'GitHub', score: Math.min(100, (profile.githubUsername ? 60 : 0)) },
    { subject: 'Consistency', score: profile.consistencyPercentage || 0 },
    { subject: 'Projects', score: Math.min(100, (profile.projects?.length || 0) * 30) },
    { subject: 'Certifications', score: Math.min(100, (profile.certifications?.length || 0) * 25) },
  ], [student]);

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'coding', label: '💻 Coding Profiles' },
    { key: 'github', label: '🐙 GitHub' },
    { key: 'statistics', label: '📈 Statistics' },
    { key: 'heatmap', label: '🔥 Heatmap' },
    { key: 'achievements', label: '🏆 Achievements & Badges' },
    { key: 'certifications-hackathons', label: '🎓 Certifications & Hackathons' },
    { key: 'activity', label: '⚡ Activity' },
  ];

  if (loading) {
    return (
      <AppShell active="student-profile">
        <style>{PROFILE_STYLES}</style>
        <div className="profile-skeleton">
          <div className="skel skel-hero" />
          <div className="skel-stats-row">
            {[...Array(4)].map((_, i) => <div key={i} className="skel skel-stat" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell active="student-profile">
        <style>{PROFILE_STYLES}</style>
        <div className="profile-error">
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h2>Profile not found</h2>
          <Link to="/leaderboard" className="profile-back-link">← Back to leaderboard</Link>
        </div>
      </AppShell>
    );
  }

  const initials = profile.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <AppShell active="student-profile">
      <style>{PROFILE_STYLES}</style>





      <div className="profile-page animate-fade-in">
        
        {/* ── BREADCRUMB & CONTROLS ── */}
        <div className="profile-breadcrumb" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/leaderboard">← Back to Leaderboard</Link>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isCoordinator && (
              <span className="coordinator-badge">🎓 Viewing as Coordinator</span>
            )}
            {(isOwner || isCoordinator) && (
              <button 
                onClick={handleSync}
                className="ct-button"
                disabled={syncing}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Profiles'}
              </button>
            )}
            {isOwner && (
              <button 
                onClick={() => navigate('/profile/personal')}
                className="ct-button-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                ⚙️ Edit Profile
              </button>
            )}
          </div>
        </div>

        <Toaster position="bottom-right" reverseOrder={false} />

        {/* ══════════════════════════════════════
            HERO SECTION
            ══════════════════════════════════════ */}
        <div className="profile-hero">
          <div className="hero-bg-gradient" />
          <div className="hero-content">
            {/* Left: Avatar + Identity */}
            <div className="hero-left">
              <div className="hero-avatar-wrap">
                <div className="hero-avatar">
                  {initials}
                </div>
                <div
                  className="hero-avatar-ring"
                  style={{ borderColor: profile.activityStatus === 'active' ? '#22C55E' : '#374151' }}
                />
                <div
                  className="hero-status-dot"
                  style={{ background: profile.activityStatus === 'active' ? '#22C55E' : '#6b7280' }}
                  title={profile.activityStatus === 'active' ? 'Active' : 'Inactive'}
                />
              </div>

              <div className="hero-identity">
                <h1 className="hero-name">{profile.name}</h1>
                <div className="hero-meta">
                  {[profile.college, profile.branch, profile.graduationYear && `Class of ${profile.graduationYear}`, profile.hostel].filter(Boolean).join(' · ')}
                </div>
                {profile.goal && (
                  <div style={{ fontSize: '0.88rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.2rem' }}>
                    Track: {profile.goal}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Email: {profile.email} {profile.mssid && `| MSSID: ${profile.mssid}`} {(profile.academicDetails?.eamcetRank || profile.academicDetails?.eapcetRank) && `| EAMCET Rank: ${profile.academicDetails.eamcetRank || profile.academicDetails.eapcetRank}`}
                </div>
                {profile.bio ? (
                  <div className="hero-tagline" style={{ marginTop: '0.2rem' }}>"{profile.bio}"</div>
                ) : (
                  <div className="hero-tagline" style={{ marginTop: '0.2rem' }}>"Code. Build. Improve."</div>
                )}

                {/* Platform badges */}
                <div className="hero-platform-badges">
                  {profile.leetcodeUsername && (
                    <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer" className="platform-badge lc-badge" title="LeetCode">
                      <img src="/LeetCode_logo_black.png" alt="LeetCode" style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }} />
                    </a>
                  )}
                  {profile.codechefUsername && (
                    <a href={`https://www.codechef.com/users/${profile.codechefUsername}`} target="_blank" rel="noreferrer" className="platform-badge cc-badge" title="CodeChef">
                      <img src="/codechef.svg" alt="CodeChef" style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }} />
                    </a>
                  )}
                  {profile.gfgUsername && (
                    <a href={`https://www.geeksforgeeks.org/user/${profile.gfgUsername}`} target="_blank" rel="noreferrer" className="platform-badge gfg-badge" title="GeeksforGeeks">
                      <img src="/gfg.svg" alt="GFG" style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }} />
                    </a>
                  )}
                  {profile.githubUsername && (
                    <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="platform-badge gh-badge" title="GitHub">
                      <img src="/github.svg" alt="GitHub" style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }} />
                    </a>
                  )}
                  {hr?.username && (
                    <a href={`https://hackerrank.com/profile/${hr.username}`} target="_blank" rel="noreferrer" className="platform-badge hr-badge">HR</a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="platform-badge li-badge">in</a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Score Cards */}
            <div className="hero-right">
              {/* Placement Readiness */}
              <div className="readiness-card">
                <div className="readiness-header">
                  <span>🎯 Placement Readiness</span>
                  <span className="readiness-score" style={{ color: readiness.score >= 70 ? '#22C55E' : readiness.score >= 40 ? '#F59E0B' : '#ef4444' }}>
                    {readiness.score}/100
                  </span>
                </div>
                <div className="readiness-bar-wrap">
                  <div className="readiness-bar" style={{ width: `${readiness.score}%`, background: readiness.score >= 70 ? 'linear-gradient(90deg,#22C55E,#16a34a)' : readiness.score >= 40 ? 'linear-gradient(90deg,#F59E0B,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
                </div>
                <div className="readiness-detail">
                  {readiness.strengths.length > 0 && (
                    <div className="readiness-strengths">
                      {readiness.strengths.map(s => <span key={s} className="readiness-tick">✓ {s}</span>)}
                    </div>
                  )}
                  {readiness.improve.length > 0 && (
                    <div className="readiness-improve">
                      <span className="readiness-improve-title">Improve:</span>
                      {readiness.improve.slice(0, 2).map(s => <div key={s} className="readiness-bullet">• {s}</div>)}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Completion */}
              <div className="completion-card">
                <div className="completion-header">
                  <span>📋 Profile Completion</span>
                  <span className="completion-pct">{profileCompletion}%</span>
                </div>
                <div className="completion-bar-wrap">
                  <div className="completion-bar" style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            QUICK STATS ROW
            ══════════════════════════════════════ */}
        <div className="stats-grid">
          {[
            { label: 'Readiness Score', value: Math.round(scores.weightedRankScore || 0), icon: '🏆', color: '#3B82F6' },
            { label: 'Total Solved', value: totalSolved, icon: '🧩', color: '#22C55E' },
            { label: 'Current Streak', value: profile.currentStreak || 0, suffix: 'd', icon: '🔥', color: '#F59E0B' },
            { label: 'Longest Streak', value: profile.longestStreak || 0, suffix: 'd', icon: '⚡', color: '#F59E0B' },
            { label: 'Active Days', value: profile.activeDaysCount || 0, icon: '📅', color: '#8B5CF6' },
            { label: 'Consistency', value: profile.consistencyPercentage || 0, suffix: '%', icon: '📈', color: '#8B5CF6' },
            { label: 'LC Solved', value: lc.totalSolved || 0, icon: '💛', color: '#F59E0B' },
            { label: 'CC Rating', value: cc.problemsSolved ? cc.currentRating : 0, icon: '❤️', color: '#ef4444' },
            { label: 'GitHub Repos', value: gh.publicReposCount || 0, icon: '📦', color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">
                <AnimatedNumber value={s.value} />{s.suffix || ''}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════
            TAB NAV
            ══════════════════════════════════════ */}
        <div className="tab-nav-wrap">
          <div className="tab-nav">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            TAB PANELS
            ══════════════════════════════════════ */}
        <div className="tab-content animate-fade-in" key={activeTab}>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="tab-panel">
              <div className="overview-grid">
                {/* Platform distribution pie */}
                <div className="ct-card chart-card">
                  <h3 className="card-title">Platform Distribution</h3>
                  {platformPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={platformPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                            {platformPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-legend">
                        {platformPieData.map((d, i) => (
                          <div key={i} className="pie-legend-item">
                            <div className="pie-legend-dot" style={{ background: d.color }} />
                            <span>{d.name}: {d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">No platform data synced yet</div>
                  )}
                </div>

                {/* Top Projects */}
                <div className="ct-card">
                  <h3 className="card-title">🚀 Top Projects</h3>
                  {(profile.projects || []).slice(0, 3).length > 0 ? (
                    <div className="projects-list">
                      {profile.projects.slice(0, 3).map((p, i) => (
                        <div key={i} className="project-card">
                          <div className="project-name">{p.name}</div>
                          {p.techStack?.length > 0 && (
                            <div className="project-tech">
                              {p.techStack.slice(0, 4).map(t => <span key={t} className="tech-pill">{t}</span>)}
                            </div>
                          )}
                          {p.highlights?.[0] && <div className="project-desc">• {p.highlights[0]}</div>}
                          {p.githubUrl && (
                            <a href={p.githubUrl} target="_blank" rel="noreferrer" className="project-link">GitHub →</a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No projects added yet</div>
                  )}
                </div>

                {/* Achievements summary */}
                <div className="ct-card">
                  <h3 className="card-title">🏅 Achievements</h3>
                  {autoAchievements.length > 0 ? (
                    <div className="badges-mini">
                      {autoAchievements.slice(0, 6).map((b, i) => (
                        <div key={i} className="badge-mini-item" style={{ '--badge-color': b.color }}>
                          <span className="badge-mini-icon">{b.icon}</span>
                          <span className="badge-mini-title">{b.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">Keep coding to earn achievements!</div>
                  )}
                </div>
              </div>

              {/* Entrance Exams & Mentors Cards Row */}
              <div className="overview-grid" style={{ marginTop: '1.5rem' }}>
                {/* Entrance Exams & Ranks */}
                <div className="ct-card">
                  <h3 className="card-title">📝 Entrance Exams & Ranks</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {(profile.academicDetails?.eamcetRank || profile.academicDetails?.eapcetRank) ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>EAMCET Rank</span>
                        <span style={{ fontWeight: 'bold' }}>{profile.academicDetails.eamcetRank || profile.academicDetails.eapcetRank}</span>
                      </div>
                    ) : null}
                    {profile.academicDetails?.jeeMainsPercentile ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>JEE Mains Percentile</span>
                        <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{profile.academicDetails.jeeMainsPercentile}%</span>
                      </div>
                    ) : null}
                    {profile.academicDetails?.jeeMainsOverallRank ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>JEE Mains Overall Rank</span>
                        <span style={{ fontWeight: 'bold' }}>{profile.academicDetails.jeeMainsOverallRank}</span>
                      </div>
                    ) : null}
                    {profile.academicDetails?.jeeMainsCategoryRank ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>JEE Mains Category Rank</span>
                        <span style={{ fontWeight: 'bold' }}>{profile.academicDetails.jeeMainsCategoryRank}</span>
                      </div>
                    ) : null}
                    {profile.academicDetails?.jeeAdvOverallRank ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>JEE Advanced Overall Rank</span>
                        <span style={{ fontWeight: 'bold' }}>{profile.academicDetails.jeeAdvOverallRank}</span>
                      </div>
                    ) : null}
                    {profile.academicDetails?.jeeAdvCategoryRank ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>JEE Advanced Category Rank</span>
                        <span style={{ fontWeight: 'bold' }}>{profile.academicDetails.jeeAdvCategoryRank}</span>
                      </div>
                    ) : null}
                    {(!profile.academicDetails || (!profile.academicDetails.eamcetRank && !profile.academicDetails.eapcetRank && !profile.academicDetails.jeeMainsPercentile && !profile.academicDetails.jeeMainsOverallRank && !profile.academicDetails.jeeMainsCategoryRank && !profile.academicDetails.jeeAdvOverallRank && !profile.academicDetails.jeeAdvCategoryRank)) && (
                      <div className="empty-state">No entrance exam details verified yet</div>
                    )}
                  </div>
                </div>

                {/* Mentor Information */}
                <div className="ct-card">
                  <h3 className="card-title">👥 Mentor Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {profile.collegeMentor?.name ? (
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>College Mentor</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{profile.collegeMentor.name}</span>
                          <span style={{ color: '#60a5fa' }}>{profile.collegeMentor.mobileNumber || '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {profile.academicMentor?.name ? (
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Mentor</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{profile.academicMentor.name}</span>
                          <span style={{ color: '#60a5fa' }}>{profile.academicMentor.mobileNumber || '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {profile.codingMentor?.name ? (
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coding Mentor</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{profile.codingMentor.name}</span>
                          <span style={{ color: '#60a5fa' }}>{profile.codingMentor.mobileNumber || '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {profile.communicationMentor?.name ? (
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication Skills Mentor</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{profile.communicationMentor.name}</span>
                          <span style={{ color: '#60a5fa' }}>{profile.communicationMentor.mobileNumber || '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {profile.projectMentor?.name ? (
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Mentor</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{profile.projectMentor.name}</span>
                          <span style={{ color: '#60a5fa' }}>{profile.projectMentor.mobileNumber || '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {(!profile.collegeMentor?.name && !profile.academicMentor?.name && !profile.codingMentor?.name && !profile.communicationMentor?.name && !profile.projectMentor?.name) && (
                      <div className="empty-state">No mentors allocated yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CODING PROFILES ── */}
          {activeTab === 'coding' && (
            <div className="tab-panel">
              <div className="coding-grid">
                {/* LeetCode */}
                {profile.leetcodeUsername && (
                  <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer" className="platform-full-card" style={{ '--pcolor': '#F59E0B', '--pglow': 'rgba(245,158,11,0.15)' }}>
                    <div className="platform-card-header">
                      <div className="platform-card-logo lc-logo">
                        <img src="/LeetCode_logo_black.png" alt="LeetCode" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} />
                      </div>
                      <div>
                        <div className="platform-card-name">LeetCode</div>
                        <div className="platform-card-username">@{profile.leetcodeUsername}</div>
                      </div>
                      <span className="platform-card-arrow">↗</span>
                    </div>
                    <div className="platform-card-stats">
                      <div className="pstat"><div className="pstat-v">{lc.totalSolved || 0}</div><div className="pstat-l">Solved</div></div>
                      <div className="pstat"><div className="pstat-v">{Math.round(lc.contestRating || 0)}</div><div className="pstat-l">Rating</div></div>
                      <div className="pstat"><div className="pstat-v">{lc.badgeCount || 0}</div><div className="pstat-l">Badges</div></div>
                    </div>
                  </a>
                )}

                {/* CodeChef */}
                {profile.codechefUsername && (
                  <a href={`https://www.codechef.com/users/${profile.codechefUsername}`} target="_blank" rel="noreferrer" className="platform-full-card" style={{ '--pcolor': '#ef4444', '--pglow': 'rgba(239,68,68,0.15)' }}>
                    <div className="platform-card-header">
                      <div className="platform-card-logo cc-logo">
                        <img src="/codechef.svg" alt="CodeChef" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} />
                      </div>
                      <div>
                        <div className="platform-card-name">CodeChef</div>
                        <div className="platform-card-username">@{profile.codechefUsername}</div>
                      </div>
                      <span className="platform-card-arrow">↗</span>
                    </div>
                    <div className="platform-card-stats">
                      <div className="pstat"><div className="pstat-v">{cc.problemsSolved || 0}</div><div className="pstat-l">Solved</div></div>
                      <div className="pstat"><div className="pstat-v">{cc.currentRating || 0}</div><div className="pstat-l">Rating</div></div>
                      <div className="pstat"><div className="pstat-v">{cc.highestRating || 0}</div><div className="pstat-l">Best</div></div>
                      <div className="pstat"><div className="pstat-v">{cc.globalRank || 0}</div><div className="pstat-l">Rank</div></div>
                      <div className="pstat"><div className="pstat-v">{cc.contestCount || 0}</div><div className="pstat-l">Contests</div></div>
                    </div>
                  </a>
                )}

                {/* GFG */}
                {profile.gfgUsername && (
                  <a href={`https://www.geeksforgeeks.org/user/${profile.gfgUsername}`} target="_blank" rel="noreferrer" className="platform-full-card" style={{ '--pcolor': '#22C55E', '--pglow': 'rgba(34,197,94,0.15)' }}>
                    <div className="platform-card-header">
                      <div className="platform-card-logo gfg-logo">
                        <img src="/gfg.svg" alt="GeeksforGeeks" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} />
                      </div>
                      <div>
                        <div className="platform-card-name">GeeksforGeeks</div>
                        <div className="platform-card-username">@{profile.gfgUsername}</div>
                      </div>
                      <span className="platform-card-arrow">↗</span>
                    </div>
                    <div className="platform-card-stats">
                      <div className="pstat"><div className="pstat-v">{gfg.totalProblemsSolved || 0}</div><div className="pstat-l">Solved</div></div>
                      <div className="pstat"><div className="pstat-v">{gfg.basicProblemsSolved || 0}</div><div className="pstat-l">Basic</div></div>
                      <div className="pstat"><div className="pstat-v">{gfg.easyProblemsSolved || 0}</div><div className="pstat-l">Easy</div></div>
                      <div className="pstat"><div className="pstat-v">{gfg.mediumProblemsSolved || 0}</div><div className="pstat-l">Medium</div></div>
                      <div className="pstat"><div className="pstat-v">{gfg.hardProblemsSolved || 0}</div><div className="pstat-l">Hard</div></div>
                    </div>
                  </a>
                )}

                {/* HackerRank */}
                {hr?.username && (
                  <a href={`https://hackerrank.com/profile/${hr.username}`} target="_blank" rel="noreferrer" className="platform-full-card" style={{ '--pcolor': '#2EC866', '--pglow': 'rgba(46,200,102,0.15)' }}>
                    <div className="platform-card-header">
                      <div className="platform-card-logo hr-logo">
                        <img src="/HackerRank.svg" alt="HackerRank" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} />
                      </div>
                      <div>
                        <div className="platform-card-name">HackerRank</div>
                        <div className="platform-card-username">@{hr.username}</div>
                      </div>
                      <span className="platform-card-arrow">↗</span>
                    </div>
                    <div className="platform-card-stats">
                      <div className="pstat"><div className="pstat-v">{hr.totalProblemsSolved || 0}</div><div className="pstat-l">Solved</div></div>
                      <div className="pstat"><div className="pstat-v">{hr.badgeCount || 0}</div><div className="pstat-l">Badges</div></div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── GITHUB ── */}
          {activeTab === 'github' && (
            <div className="tab-panel">
              {profile.githubUsername ? (
                <div className="github-tab">
                  <div className="github-hero-card ct-card">
                    <div className="github-hero-top">
                      <div className="github-avatar-large">
                        <img
                          src={`https://github.com/${profile.githubUsername}.png?size=80`}
                          alt={profile.githubUsername}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="github-avatar-fallback">GH</div>
                      </div>
                      <div>
                        <h2 className="github-user">@{profile.githubUsername}</h2>
                        <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="github-link-btn">
                          View on GitHub ↗
                        </a>
                      </div>
                    </div>
                    <div className="github-stats-row">
                      <div className="gh-stat"><div className="gh-stat-v">{gh.reposCount || 0}</div><div className="gh-stat-l">Repositories</div></div>
                      <div className="gh-stat"><div className="gh-stat-v">{gh.starsCount || 0}</div><div className="gh-stat-l">Stars Earned</div></div>
                      <div className="gh-stat"><div className="gh-stat-v">{gh.followersCount || 0}</div><div className="gh-stat-l">Followers</div></div>
                      <div className="gh-stat"><div className="gh-stat-v">{gh.followingCount || 0}</div><div className="gh-stat-l">Following</div></div>
                      <div className="gh-stat" style={{ borderLeft: '2px solid var(--accent-purple)' }}><div className="gh-stat-v" style={{ color: 'var(--accent-purple)' }}>{totalContributions}</div><div className="gh-stat-l">Total Contributions</div></div>
                      <div className="gh-stat" style={{ borderLeft: '2px solid var(--accent-blue)' }}><div className="gh-stat-v" style={{ color: 'var(--accent-blue)' }}>{activeDays}</div><div className="gh-stat-l">Active Days</div></div>
                    </div>
                  </div>

                  {/* GitHub Projects from profile */}
                  <div className="ct-card" style={{ marginTop: '1rem' }}>
                    <h3 className="card-title">📁 Highlighted Repositories</h3>
                    {(profile.projects || []).filter(p => p.githubUrl).length > 0 ? (
                      <div className="github-repos-grid">
                        {profile.projects.filter(p => p.githubUrl).map((p, i) => (
                          <a key={i} href={p.githubUrl} target="_blank" rel="noreferrer" className="github-repo-card">
                            <div className="repo-name">📦 {p.name}</div>
                            {p.highlights?.[0] && <div className="repo-desc">{p.highlights[0]}</div>}
                            {p.techStack?.length > 0 && (
                              <div className="repo-langs">
                                {p.techStack.slice(0, 3).map(t => <span key={t} className="lang-pill">{t}</span>)}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">No GitHub projects linked. Add repositories in your profile.</div>
                    )}
                  </div>

                  {/* Contribution chart embed */}
                  <div className="ct-card" style={{ marginTop: '1rem' }}>
                    <h3 className="card-title">📊 Contribution Chart</h3>
                    <div className="gh-contribution-wrap">
                      <img
                        src={`https://ghchart.rshah.org/${profile.githubUsername}`}
                        alt="GitHub contribution chart"
                        className="gh-contribution-img"
                        onError={e => { e.target.parentNode.innerHTML = '<div class="empty-state">Contribution chart unavailable</div>'; }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ct-card">
                  <div className="empty-state" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐙</div>
                    <p>No GitHub profile connected.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STATISTICS ── */}
          {activeTab === 'statistics' && (
            <div className="tab-panel">
              <div className="stats-charts-grid">
                {/* Problems by Platform Bar */}
                <div className="ct-card chart-card">
                  <h3 className="card-title">Problems Solved by Platform</h3>
                  {platformBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={platformBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="platform" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f3f4f6' }} />
                        <Bar dataKey="solved" name="Solved" radius={[6, 6, 0, 0]}>
                          {platformBarData.map((_, i) => (
                            <Cell key={i} fill={['#F59E0B', '#ef4444', '#22C55E'][i] || '#3B82F6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No solved stats available</div>
                  )}
                </div>

                {/* Radar */}
                <div className="ct-card chart-card">
                  <h3 className="card-title">Performance Radar</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Radar dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── HEATMAP ── */}
          {activeTab === 'heatmap' && (
            <div className="tab-panel">
              <div className="ct-card">
                <div className="heatmap-tab-header">
                  <h3 className="card-title">🔥 Activity Heatmap (Last 6 Months)</h3>
                  <div className="heatmap-legend">
                    <span>Less</span>
                    {['level-0','level-1','level-2','level-3','level-4'].map(l => (
                      <div key={l} className={`heatmap-cell ${l}`} style={{ width: 12, height: 12 }} />
                    ))}
                    <span>More</span>
                  </div>
                </div>
                <HeatmapWidget
                  data={heatmap}
                  showDetails={isOwner || isCoordinator}
                />
                <div className="heatmap-note">
                  {!isOwner && <span className="hm-privacy-note">💡 Activity counts are public · Exact problem details are private</span>}
                </div>
              </div>

              {/* Platform activity summary */}
              <div className="ct-card" style={{ marginTop: '1rem' }}>
                <h3 className="card-title">Platform Activity Summary</h3>
                <div className="platform-activity-row">
                  {['leetcode', 'github'].map(p => {
                    const total = heatmap.reduce((sum, d) => sum + (d.platforms?.[p] || 0), 0);
                    return (
                      <div key={p} className="platform-act-chip" style={{ borderColor: getPlatformColor(p) }}>
                        <span style={{ color: getPlatformColor(p), fontWeight: 700 }}>{getPlatformLabel(p)}</span>
                        <span className="platform-act-count">{total} activities</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ACHIEVEMENTS & BADGES ── */}
          {activeTab === 'achievements' && (
            <div className="tab-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* LeetCode Badges */}
              <div className="ct-card">
                <h3 className="card-title">🏅 LeetCode Badges (Earned: {lc.badgeCount || 0})</h3>
                {lc.badges && lc.badges.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {lc.badges.map((badge, i) => (
                      <div key={badge.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <img 
                          src={badge.icon} 
                          alt={badge.displayName} 
                          style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} 
                          onError={e => { e.target.style.display = 'none'; }} 
                        />
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f3f4f6' }}>{badge.displayName}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No badges earned yet</div>
                )}
              </div>

              {/* HackerRank Badges */}
              <div className="ct-card">
                <h3 className="card-title">🏆 HackerRank Badges & Skills (Earned: {hr.badgeCount || 0})</h3>
                {hr.skills && hr.skills.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {hr.skills.map((skill, i) => {
                      const match = skill.match(/(.*?)\s*\((\d+★)\)/);
                      const name = match ? match[1] : skill;
                      const stars = match ? match[2] : '';
                      const starsCount = stars.replace('★', '');
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <HackerRankBadge name={name} starsCount={starsCount} width={60} height={60} />
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6' }}>{name}</div>
                          {stars && <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.2rem' }}>{stars}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">No HackerRank badges synced yet</div>
                )}
              </div>

              {/* Auto-computed system badges */}
              <div className="ct-card">
                <h3 className="card-title">🤖 Auto-Computed Badges</h3>
                {autoAchievements.length > 0 ? (
                  <div className="achievements-grid">
                    {autoAchievements.map((b, i) => (
                      <div key={i} className="achievement-card" style={{ '--ach-color': b.color }}>
                        <div className="ach-icon">{b.icon}</div>
                        <div className="ach-title">{b.title}</div>
                        <div className="ach-desc">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No auto-computed badges earned yet</div>
                )}
              </div>

              {/* Manual achievements */}
              {(profile.achievements || []).length > 0 && (
                <div className="ct-card">
                  <h3 className="card-title">🎖️ General Achievements</h3>
                  <div className="manual-ach-list">
                    {profile.achievements.map((a, i) => (
                      <div key={i} className="manual-ach-item">
                        <div className="manual-ach-title">🏆 {a.title}</div>
                        {a.description && <div className="manual-ach-desc">{a.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TIMELINE ── */}

          {/* ── CERTIFICATIONS & HACKATHONS ── */}
          {activeTab === 'certifications-hackathons' && (() => {
            const certs = [...(profile.certifications || [])].sort((a, b) => {
              if (!a.issueDate) return 1;
              if (!b.issueDate) return -1;
              return new Date(b.issueDate) - new Date(a.issueDate);
            });
            const hacks = [...(profile.hackathons || [])].sort((a, b) => {
              if (!a.date) return 1;
              if (!b.date) return -1;
              return new Date(b.date) - new Date(a.date);
            });
            
            const hackWins = hacks.filter(h => {
              const res = (h.result || '').toLowerCase();
              return res.includes('winner') || res.includes('1st') || res === 'first';
            }).length;
            
            return (
              <div className="tab-panel">
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.8rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Info size={16} /> This is a read-only view. Editing remains inside Configure Student Profile.
                </div>
                
                {/* ACHIEVEMENTS SUMMARY */}
                <div className="ct-card" style={{ marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ marginBottom: '1.2rem' }}>⭐ Achievements Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🎓 Certifications</span>
                      <span style={{ fontWeight: 800 }}>{certs.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🏆 Hackathons</span>
                      <span style={{ fontWeight: 800 }}>{hacks.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🥇 Wins</span>
                      <span style={{ fontWeight: 800 }}>{hackWins}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>⭐ Total Achievements</span>
                      <span style={{ fontWeight: 800, color: '#f59e0b' }}>{certs.length + hacks.length}</span>
                    </div>
                  </div>
                </div>

                {/* CERTIFICATIONS */}
                <div className="ct-card">
                  <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>🎓 Certifications</h3>
                  {certs.length > 0 ? (
                    <div className="certs-hacks-grid">
                      {certs.map((c, i) => {
                        const verified = isValidUrl(c.credentialLink);
                        return (
                          <InfoCard
                            key={`cert-${i}`}
                            icon="🏅"
                            title={c.title}
                            subtitle={c.provider}
                            fields={[{ label: 'Issued', value: formatNiceDate(c.issueDate) }]}
                            badge={{ type: verified ? 'verified' : 'unverified', text: verified ? 'Verified' : 'No Credential' }}
                            actions={verified ? [{ label: 'Open Certificate', url: c.credentialLink }] : []}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '3rem 2rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#e5e7eb' }}>No Certifications Added</h3>
                      <p style={{ margin: 0 }}>This student hasn't added any certifications yet.</p>
                    </div>
                  )}
                </div>

                {/* HACKATHONS */}
                <div className="ct-card" style={{ marginTop: '1rem' }}>
                  <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>🏆 Hackathons</h3>
                  {hacks.length > 0 ? (
                    <div className="certs-hacks-grid">
                      {hacks.map((h, i) => {
                        const resLower = (h.result || '').toLowerCase();
                        let badgeType = 'participant';
                        let badgeText = h.result || 'Participant';
                        if (resLower.includes('winner') || resLower.includes('1st') || resLower === 'first') {
                          badgeType = 'winner';
                          badgeText = '🥇 ' + badgeText;
                        } else if (resLower.includes('runner')) {
                          badgeType = 'runner-up';
                          badgeText = '🥈 ' + badgeText;
                        } else if (resLower.includes('finalist')) {
                          badgeType = 'finalist';
                          badgeText = '🏅 ' + badgeText;
                        } else if (resLower) {
                          badgeText = '👨‍💻 ' + badgeText;
                        } else {
                          badgeText = '👨‍💻 Participant';
                        }
                        
                        const hasCert = isValidUrl(h.certificateLink);

                        return (
                          <InfoCard
                            key={`hack-${i}`}
                            icon="🏆"
                            title={h.name || h.hackathonName}
                            subtitle={h.organizer}
                            fields={[
                              { label: 'Date', value: formatNiceDate(h.date) },
                              { label: 'Team Size', value: h.teamSize },
                              { label: 'Position', value: h.position }
                            ]}
                            badge={{ type: badgeType, text: badgeText }}
                            description={h.description}
                            actions={hasCert ? [{ label: 'Certificate', url: h.certificateLink }] : []}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '3rem 2rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#e5e7eb' }}>No Hackathons Added</h3>
                      <p style={{ margin: 0 }}>This student hasn't added any hackathons yet.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'activity' && (
            <div className="tab-panel">
              <div className="ct-card">
                <h3 className="card-title">⚡ Recent Activity (LeetCode Only)</h3>
                {timeline.length > 0 ? (
                  <div className="activity-feed">
                    {timeline.map((act, i) => (
                      <div key={i} className="activity-item">
                        <div className="activity-platform-dot" style={{ background: '#F59E0B' }} />
                        <div className="activity-info">
                          <span className="activity-platform-label" style={{ color: '#F59E0B' }}>
                            LeetCode
                          </span>
                          <a href={`https://leetcode.com/problems/${act.titleSlug}/`} target="_blank" rel="noreferrer" className="activity-title">
                            {act.title}
                          </a>
                          <span style={{ color: '#22C55E', marginLeft: '0.5rem', fontWeight: 600 }}>(Accepted)</span>
                        </div>
                        <span className="activity-time">{new Date(Number(act.timestamp) * 1000).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    No recent LeetCode activities tracked yet
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}

/* ─────────────────────────────────────────────
   STYLES
   ───────────────────────────────────────────── */
const PROFILE_STYLES = `
  .profile-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 1rem 1.5rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .profile-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 640px) {
    .profile-form-row {
      grid-template-columns: 1fr;
      gap: 0.8rem;
    }
    .profile-page {
      padding: 1rem 0.75rem 3rem;
    }
    .profile-hero {
      padding: 1.5rem 1rem;
    }
    .hero-right {
      flex: 1 1 auto !important;
      width: 100%;
      min-width: 0 !important;
    }
  }
  @media (max-width: 500px) {
    .hero-left {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .hero-avatar-wrap {
      margin-bottom: 0.5rem;
    }
    .hero-identity {
      align-items: center;
      text-align: center;
    }
    .hero-platform-badges {
      justify-content: center;
    }
  }
  .profile-breadcrumb {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .profile-breadcrumb a {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .profile-breadcrumb a:hover { color: var(--accent-blue); }
  .coordinator-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: rgba(139,92,246,0.15);
    color: var(--accent-purple);
    border: 1px solid rgba(139,92,246,0.3);
  }

  /* ── HERO ── */
  .profile-hero {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
    padding: 2.5rem 2rem;
  }
  .hero-bg-gradient {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(17,24,39,0.95) 50%, rgba(139,92,246,0.08) 100%);
    z-index: 0;
  }
  .hero-content {
    position: relative; z-index: 1;
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .hero-left { display: flex; gap: 1.5rem; align-items: flex-start; flex: 1; min-width: 260px; }
  .hero-avatar-wrap { position: relative; flex-shrink: 0; }
  .hero-avatar {
    width: 90px; height: 90px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; font-weight: 800; color: white;
    box-shadow: 0 0 30px rgba(59,130,246,0.4);
  }
  .hero-avatar-ring {
    position: absolute; inset: -4px;
    border-radius: 50%;
    border: 2px solid;
    opacity: 0.7;
  }
  .hero-status-dot {
    position: absolute; bottom: 4px; right: 4px;
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 2px solid #111827;
  }
  .hero-identity { display: flex; flex-direction: column; gap: 0.4rem; }
  .hero-name { margin: 0; font-size: 1.9rem; font-weight: 800; color: #f3f4f6; line-height: 1.1; }
  .hero-meta { font-size: 0.85rem; color: var(--text-muted); }
  .hero-tagline { font-size: 0.9rem; color: var(--accent-blue); font-style: italic; }
  .hero-platform-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.3rem; }
  .platform-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 8px;
    font-size: 0.7rem; font-weight: 800;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .platform-badge:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
  .lc-badge { background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
  .cc-badge { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .gfg-badge { background: rgba(34,197,94,0.2); color: #22C55E; border: 1px solid rgba(34,197,94,0.3); }
  .gh-badge { background: rgba(139,92,246,0.2); color: #8B5CF6; border: 1px solid rgba(139,92,246,0.3); }
  .hr-badge { background: rgba(46,200,102,0.2); color: #2EC866; border: 1px solid rgba(46,200,102,0.3); }
  .li-badge { background: rgba(10,102,194,0.2); color: #0a66c2; border: 1px solid rgba(10,102,194,0.3); }

  .hero-right { display: flex; flex-direction: column; gap: 0.8rem; min-width: 260px; flex: 0 0 280px; }

  /* Readiness card */
  .readiness-card {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 1rem 1.2rem;
  }
  .readiness-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.6rem; }
  .readiness-score { font-size: 1.1rem; font-weight: 800; }
  .readiness-bar-wrap { height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; margin-bottom: 0.75rem; }
  .readiness-bar { height: 100%; border-radius: 999px; transition: width 1s ease; }
  .readiness-detail { display: flex; flex-direction: column; gap: 0.4rem; }
  .readiness-strengths { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .readiness-tick { font-size: 0.72rem; color: #22C55E; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); padding: 0.1rem 0.4rem; border-radius: 4px; }
  .readiness-improve-title { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
  .readiness-bullet { font-size: 0.72rem; color: var(--text-muted); }
  .readiness-improve { display: flex; flex-direction: column; gap: 0.15rem; }

  /* Completion */
  .completion-card {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 0.8rem 1.2rem;
  }
  .completion-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; }
  .completion-pct { color: var(--accent-blue); font-weight: 800; }
  .completion-bar-wrap { height: 5px; background: rgba(255,255,255,0.07); border-radius: 999px; overflow: hidden; }
  .completion-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple)); transition: width 1s ease; }

  /* ── STATS GRID ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  .stat-card {
    background: rgba(17,24,39,0.8);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 1rem 0.8rem;
    text-align: center;
    transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
    cursor: default;
  }
  .stat-card:hover {
    transform: translateY(-3px);
    border-color: var(--stat-color, var(--accent-blue));
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  }
  .stat-icon { font-size: 1.3rem; margin-bottom: 0.3rem; }
  .stat-value { font-size: 1.4rem; font-weight: 800; color: var(--stat-color, #f3f4f6); line-height: 1; margin-bottom: 0.3rem; }
  .stat-label { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

  /* ── TABS ── */
  .tab-nav-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tab-nav { display: flex; gap: 0.25rem; min-width: max-content; background: rgba(17,24,39,0.6); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 0.35rem; }
  .tab-btn {
    border: none; background: transparent;
    color: var(--text-muted); font-size: 0.82rem; font-weight: 500;
    padding: 0.5rem 1rem; border-radius: 9px;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .tab-btn:hover { background: rgba(255,255,255,0.05); color: #f3f4f6; }
  .tab-btn.active { background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)); color: white; font-weight: 600; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }

  /* ── TAB CONTENT ── */
  .tab-content { display: flex; flex-direction: column; gap: 1rem; }
  .tab-panel { display: flex; flex-direction: column; gap: 1rem; }
  .card-title { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 700; color: #f3f4f6; display: flex; align-items: center; gap: 0.5rem; }
  .empty-state { text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 2rem; }

  /* ── OVERVIEW ── */
  .overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .chart-card { min-height: 280px; }
  .pie-legend { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
  .pie-legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--text-muted); }
  .pie-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .projects-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .project-card { padding: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; }
  .project-name { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.35rem; }
  .project-tech { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.3rem; }
  .tech-pill { font-size: 0.68rem; padding: 0.1rem 0.4rem; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2); border-radius: 4px; color: var(--accent-blue); }
  .project-desc { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.3rem; }
  .project-link { font-size: 0.75rem; color: var(--accent-blue); text-decoration: none; }
  .project-link:hover { text-decoration: underline; }
  .badges-mini { display: flex; flex-direction: column; gap: 0.5rem; }
  .badge-mini-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid var(--badge-color); }
  .badge-mini-icon { font-size: 1.1rem; }
  .badge-mini-title { font-size: 0.82rem; font-weight: 600; }

  /* ── CODING PROFILES ── */
  .coding-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .platform-full-card {
    background: rgba(17,24,39,0.85);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 1.25rem;
    text-decoration: none; color: inherit;
    transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
    display: flex; flex-direction: column; gap: 1rem;
    position: relative; overflow: hidden;
  }
  .platform-full-card::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--pglow);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .platform-full-card:hover { transform: translateY(-4px); border-color: var(--pcolor); box-shadow: 0 12px 30px rgba(0,0,0,0.4); }
  .platform-full-card:hover::before { opacity: 1; }
  .platform-card-header { display: flex; align-items: center; gap: 0.75rem; position: relative; }
  .platform-card-logo {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 900;
  }
  .lc-logo { background: rgba(245,158,11,0.15); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
  .cc-logo { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .gfg-logo { background: rgba(34,197,94,0.15); color: #22C55E; border: 1px solid rgba(34,197,94,0.3); }
  .hr-logo { background: rgba(46,200,102,0.15); color: #2EC866; border: 1px solid rgba(46,200,102,0.3); }
  .platform-card-name { font-weight: 700; font-size: 0.95rem; color: var(--pcolor); }
  .platform-card-username { font-size: 0.78rem; color: var(--text-muted); }
  .platform-card-arrow { margin-left: auto; color: var(--text-muted); font-size: 1.1rem; }
  .platform-card-stats { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .pstat { flex: 1; min-width: 60px; text-align: center; }
  .pstat-v { font-size: 1.3rem; font-weight: 800; color: #f3f4f6; }
  .pstat-l { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.1rem; }

  /* ── GITHUB TAB ── */
  .github-tab { display: flex; flex-direction: column; gap: 1rem; }
  .github-hero-top { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .github-avatar-large { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(139,92,246,0.4); position: relative; flex-shrink: 0; }
  .github-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
  .github-avatar-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: white; font-size: 1.2rem; }
  .github-user { margin: 0 0 0.4rem 0; font-size: 1.3rem; font-weight: 800; }
  .github-link-btn { font-size: 0.82rem; color: var(--accent-blue); text-decoration: none; padding: 0.3rem 0.7rem; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; background: rgba(59,130,246,0.08); }
  .github-link-btn:hover { background: rgba(59,130,246,0.15); }
  .github-stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; }
  .gh-stat { text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; }
  .gh-stat-v { font-size: 1.4rem; font-weight: 800; color: #8B5CF6; }
  .gh-stat-l { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.15rem; }
  .github-repos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.5rem; }
  .github-repo-card { padding: 0.85rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; text-decoration: none; color: inherit; transition: border-color 0.15s, transform 0.15s; display: flex; flex-direction: column; gap: 0.35rem; }
  .github-repo-card:hover { border-color: rgba(139,92,246,0.4); transform: translateY(-2px); }
  .repo-name { font-weight: 700; font-size: 0.85rem; color: #8B5CF6; }
  .repo-desc { font-size: 0.78rem; color: var(--text-muted); }
  .repo-langs { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .lang-pill { font-size: 0.65rem; padding: 0.1rem 0.4rem; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 4px; color: #8B5CF6; }
  .gh-contribution-wrap { overflow-x: auto; padding: 0.5rem 0; }
  .gh-contribution-img { height: 120px; filter: invert(0) hue-rotate(180deg) brightness(0.8); border-radius: 8px; opacity: 0.8; }

  /* ── STATISTICS ── */
  .stats-charts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

  /* ── HEATMAP TAB ── */
  .heatmap-tab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
  .heatmap-legend { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: var(--text-muted); }
  .heatmap-note { margin-top: 0.6rem; font-size: 0.75rem; }
  .hm-privacy-note { color: var(--text-muted); font-style: italic; }
  .platform-activity-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
  .platform-act-chip { padding: 0.6rem 1rem; border: 1px solid; border-radius: 10px; display: flex; flex-direction: column; gap: 0.15rem; min-width: 120px; }
  .platform-act-count { font-size: 0.75rem; color: var(--text-muted); }

  /* ── ACHIEVEMENTS ── */
  .achievements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
  .achievement-card {
    padding: 1.2rem 0.9rem; text-align: center;
    border-radius: 12px; background: rgba(17,24,39,0.85); border: 1px solid rgba(255,255,255,0.06);
    border-top: 3px solid var(--ach-color);
  }
  .ach-icon { font-size: 1.6rem; margin-bottom: 0.4rem; }
  .ach-title { font-weight: 700; font-size: 0.82rem; color: #f3f4f6; margin-bottom: 0.2rem; }
  .ach-desc { font-size: 0.7rem; color: var(--text-muted); line-height: 1.2; }
  .manual-ach-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .manual-ach-item { padding: 0.85rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; }
  .manual-ach-title { font-weight: 700; font-size: 0.85rem; color: #fff; }
  .manual-ach-desc { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem; }

  /* ── ACTIVITY TIMELINE ── */
  .activity-feed { display: flex; flex-direction: column; gap: 0.75rem; }
  .activity-item { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; }
  .activity-platform-dot { width: 8px; height: 8px; border-radius: 50%; }
  .activity-info { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; font-size: 0.85rem; }
  .activity-platform-label { font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .activity-title { font-weight: 600; color: #f3f4f6; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .activity-title:hover { text-decoration: underline; color: var(--accent-blue); }
  .activity-time { font-size: 0.75rem; color: var(--text-muted); }

  /* ── INFO CARD ── */
  .info-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .info-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  }
  .status-badge {
    font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap;
  }
  .status-badge.verified { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
  .status-badge.unverified { background: rgba(156,163,175,0.15); color: #9ca3af; border: 1px solid rgba(156,163,175,0.3); }
  .status-badge.winner { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
  .status-badge.runner-up { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.3); }
  .status-badge.finalist { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
  .status-badge.participant { background: rgba(156,163,175,0.15); color: #9ca3af; border: 1px solid rgba(156,163,175,0.3); }
  
  .certs-hacks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }

  .suggestion-item:hover {
    background-color: rgba(59, 130, 246, 0.15) !important;
  }
`;
