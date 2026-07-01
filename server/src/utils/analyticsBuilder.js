const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const WeeklySnapshot = require('../models/WeeklySnapshot');
const config = require('../config/env');

const VERSION = "v5.1";

const getContributionText = (label, rawVal, maxV, weight) => {
  const clampedVal = Math.min(rawVal, maxV);
  const scoreVal = (clampedVal / maxV) * weight;
  return {
    label,
    value: rawVal,
    max: maxV,
    weight,
    scoreComponent: Number(scoreVal.toFixed(2)),
    formula: `min(Value / Target, 1) × Weight`,
    calculation: `min(${rawVal} / ${maxV}, 1) × ${weight} = ${scoreVal.toFixed(2)}`,
    progressPerc: Math.min(100, Math.round((clampedVal / maxV) * 100))
  };
};

async function buildAnalyticsReport(studentId, reportType) {
  const user = await User.findById(studentId);
  if (!user) throw new Error('User not found');
  
  const stats = user.platformStats || {};
  const scores = user.scores || {};
  const pr = user.placementReadiness || {};

  let report = {
    metadata: {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      generatedFrom: "live"
    },
    summary: {},
    metrics: [],
    breakdown: [],
    hierarchy: {},
    history: [],
    suggestions: { strength: null, weakness: null, nextGoal: null }
  };

  const snapshots = await WeeklySnapshot.find({ userId: studentId }).sort({ weekKey: 1 }).limit(10);
  
  const extractHistory = (key1, key2) => {
    return snapshots.map(s => {
      const d = new Date(s.weekKey);
      let v = 0;
      if (s[key1] && typeof s[key1][key2] !== 'undefined') v = s[key1][key2];
      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        value: v
      };
    }).filter(s => s.value > 0);
  };

  if (reportType === 'leetcode') {
    const lc = stats.leetcode || {};
    const w = config.SCORING_CONFIG.leetcode || { solved: 40, rating: 40, contests: 20 };
    const solved = Number(lc.problemsSolved || lc.totalSolved || 0);
    const rating = Number(lc.rating || 0);
    const contests = Number(lc.contestCount || 0);
    
    report.summary = {
      title: 'LeetCode Analytics',
      platformIcon: '/LeetCode_logo_black.png',
      studentName: user.name,
      username: lc.username || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#F59E0B'
    };
    
    report.metrics = [
      { label: 'Problems Solved', value: solved, keyword: 'solved' },
      { label: 'Contest Rating', value: rating, keyword: 'rating' },
      { label: 'Contest Count', value: contests, keyword: 'contest' },
      { label: 'Global Rank', value: lc.globalRank || '-', keyword: 'rank' }
    ];
    
    report.breakdown = [
      getContributionText('Problems Solved', solved, 500, w.solved),
      getContributionText('Contest Rating', rating, 2000, w.rating),
      getContributionText('Contests Attended', contests, 50, w.contests)
    ];

    report.history = extractHistory('leetcode', 'rating');

  } else if (reportType === 'codechef') {
    const cc = stats.codechef || {};
    const w = config.SCORING_CONFIG.codechef || { solved: 30, rating: 50, contests: 20 };
    const solved = Number(cc.problemsSolved || 0);
    const rating = Number(cc.currentRating || cc.rating || 0);
    const contests = Number(cc.contestCount || 0);
    
    report.summary = {
      title: 'CodeChef Analytics',
      platformIcon: '/codechef.svg',
      studentName: user.name,
      username: cc.username || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#ef4444'
    };
    
    report.metrics = [
      { label: 'Problems Solved', value: solved, keyword: 'solved' },
      { label: 'Current Rating', value: rating, keyword: 'rating' },
      { label: 'Global Rank', value: cc.globalRank || '-', keyword: 'rank' },
      { label: 'Contest Count', value: contests, keyword: 'contest' }
    ];
    
    report.breakdown = [
      getContributionText('Problems Solved', solved, 500, w.solved),
      getContributionText('Current Rating', rating, 2500, w.rating),
      getContributionText('Contests Attended', contests, 50, w.contests)
    ];

    report.history = extractHistory('codechef', 'currentRating');

  } else if (reportType === 'geeksforgeeks' || reportType === 'gfg') {
    const gfg = stats.geeksforgeeks || {};
    const w = config.SCORING_CONFIG.gfg || { codingScore: 50, solved: 30, streak: 20 };
    const solved = Number(gfg.problemsSolved || 0);
    const codingScore = Number(gfg.codingScore || 0);
    const streak = Number(gfg.streak || 0);
    
    report.summary = {
      title: 'GeeksforGeeks Analytics',
      platformIcon: '/gfg.svg',
      studentName: user.name,
      username: gfg.username || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#22C55E'
    };
    
    report.metrics = [
      { label: 'Problems Solved', value: solved, keyword: 'solved' },
      { label: 'Coding Score', value: codingScore, keyword: 'rating' },
      { label: 'Streak (Days)', value: streak, keyword: 'streak' },
      { label: 'Institute Rank', value: gfg.instituteRank || '-', keyword: 'rank' }
    ];
    
    report.breakdown = [
      getContributionText('Coding Score', codingScore, 2000, w.codingScore),
      getContributionText('Problems Solved', solved, 500, w.solved),
      getContributionText('Streak (Days)', streak, 100, w.streak)
    ];

  } else if (reportType === 'hackerrank') {
    const hr = user.hackerrank || {};
    const w = config.SCORING_CONFIG.hackerrank || { solved: 50, badges: 30, certifications: 20 };
    const solved = Number(hr.totalProblemsSolved || 0);
    const badges = Number(hr.badgeCount || 0);
    const certs = Array.isArray(hr.certifications) ? hr.certifications.length : 0;
    
    report.summary = {
      title: 'HackerRank Analytics',
      platformIcon: '/hackerrank.svg',
      studentName: user.name,
      username: hr.username || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#2EC866'
    };
    
    report.metrics = [
      { label: 'Problems Solved', value: solved, keyword: 'solved' },
      { label: 'Total Badges', value: badges, keyword: 'badge' },
      { label: 'Certifications', value: certs, keyword: 'certification' }
    ];
    
    report.breakdown = [
      getContributionText('Problems Solved', solved, 200, w.solved),
      getContributionText('Badges', badges, 20, w.badges),
      getContributionText('Certifications', certs, 5, w.certifications)
    ];

  } else if (reportType === 'placement') {
    report.summary = {
      title: 'Placement Readiness',
      platformIcon: '', 
      studentName: user.name,
      username: user.mssid || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#F59E0B'
    };
    
    report.metrics = [
      { label: 'Readiness Level', value: pr.readinessLevel || 'Foundation', keyword: 'level' },
      { label: 'DSA Score', value: pr.dsa?.raw || 0, keyword: 'dsa' },
      { label: 'Projects & Courses', value: (pr.projects?.raw || 0) + ' / ' + (pr.courses?.raw || 0), keyword: 'projects' },
      { label: 'CGPA', value: pr.cgpa?.raw || 0, keyword: 'cgpa' }
    ];
    
    report.breakdown = [
      {
        label: 'DSA Performance',
        value: pr.dsa?.raw || 0,
        max: 100,
        weight: 60,
        scoreComponent: pr.dsa?.contribution || 0,
        formula: 'DSA Score × 60%',
        calculation: `${pr.dsa?.raw || 0} × 0.60 = ${pr.dsa?.contribution || 0}`,
        progressPerc: Math.min(100, pr.dsa?.raw || 0)
      },
      {
        label: 'Projects',
        value: pr.projects?.raw || 0,
        max: 100,
        weight: 20,
        scoreComponent: pr.projects?.contribution || 0,
        formula: 'Projects Score × 20%',
        calculation: `${pr.projects?.raw || 0} × 0.20 = ${pr.projects?.contribution || 0}`,
        progressPerc: Math.min(100, pr.projects?.raw || 0)
      },
      {
        label: 'Courses',
        value: pr.courses?.raw || 0,
        max: 100,
        weight: 10,
        scoreComponent: pr.courses?.contribution || 0,
        formula: 'Courses Score × 10%',
        calculation: `${pr.courses?.raw || 0} × 0.10 = ${pr.courses?.contribution || 0}`,
        progressPerc: Math.min(100, pr.courses?.raw || 0)
      },
      {
        label: 'CGPA',
        value: pr.cgpa?.raw || 0,
        max: 100,
        weight: 10,
        scoreComponent: pr.cgpa?.contribution || 0,
        formula: 'CGPA Score × 10%',
        calculation: `${pr.cgpa?.raw || 0} × 0.10 = ${pr.cgpa?.contribution || 0}`,
        progressPerc: Math.min(100, pr.cgpa?.raw || 0)
      }
    ];
    
    report.hierarchy = {
      'Placement Readiness': [
        { label: 'DSA Performance', value: pr.dsa?.raw || 0, children: Object.keys(pr.dsa?.breakdown || {}).map(k => ({ label: k, value: pr.dsa.breakdown[k] })) },
        { label: 'Projects', value: pr.projects?.raw || 0 },
        { label: 'Courses', value: pr.courses?.raw || 0 },
        { label: 'CGPA', value: pr.cgpa?.raw || 0 }
      ]
    };

    report.summary.finalScore = pr.finalScore || 0;
    report.summary.maxScore = 100;

  } else if (reportType === 'dsa') {
    report.summary = {
      title: 'DSA Score Analytics',
      platformIcon: '',
      studentName: user.name,
      username: stats.leetcode?.username || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#3B82F6'
    };
    
    const b = pr.dsa?.breakdown || {};
    report.metrics = [
      { label: 'Problem Solving', value: b.problemSolving || 0, keyword: 'solved' },
      { label: 'Difficulty', value: b.difficulty || 0, keyword: 'level' },
      { label: 'Topic Coverage', value: b.topicCoverage || 0, keyword: 'book' },
      { label: 'Contest', value: b.contest || 0, keyword: 'contest' }
    ];
    
    report.breakdown = [
      getContributionText('Problem Solving', b.problemSolving || 0, 30, 30),
      getContributionText('Difficulty Distribution', b.difficulty || 0, 30, 30),
      getContributionText('Topic Coverage', b.topicCoverage || 0, 30, 30),
      getContributionText('Contest Performance', b.contest || 0, 10, 10)
    ];
  } else if (reportType === 'projects') {
    report.summary = {
      title: 'Projects & Courses Analytics',
      platformIcon: '', 
      studentName: user.name,
      username: user.mssid || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#10B981'
    };
    
    const projectsRaw = pr.projects?.raw || 0;
    const coursesRaw = pr.courses?.raw || 0;

    report.metrics = [
      { label: 'Projects Score', value: projectsRaw, keyword: 'projects' },
      { label: 'Courses Score', value: coursesRaw, keyword: 'book' }
    ];

    report.breakdown = [
      {
        label: 'Projects',
        value: projectsRaw,
        max: 100,
        weight: 20,
        scoreComponent: pr.projects?.contribution || 0,
        formula: 'Projects Score × 20%',
        calculation: `${projectsRaw} × 0.20 = ${pr.projects?.contribution || 0}`,
        progressPerc: Math.min(100, projectsRaw)
      },
      {
        label: 'Technical Courses',
        value: coursesRaw,
        max: 100,
        weight: 10,
        scoreComponent: pr.courses?.contribution || 0,
        formula: 'Courses Score × 10%',
        calculation: `${coursesRaw} × 0.10 = ${pr.courses?.contribution || 0}`,
        progressPerc: Math.min(100, coursesRaw)
      }
    ];

    report.summary.finalScore = (pr.projects?.contribution || 0) + (pr.courses?.contribution || 0);
    report.summary.maxScore = 30;

  } else if (reportType === 'cgpa') {
    report.summary = {
      title: 'CGPA Analytics',
      platformIcon: '', 
      studentName: user.name,
      username: user.mssid || '',
      lastSynced: user.lastPlatformSyncAt,
      color: '#8B5CF6'
    };

    const cgpaRaw = pr.cgpa?.raw || 0;
    
    report.metrics = [
      { label: 'Current CGPA', value: user.overallGpa || 0, keyword: 'cgpa' },
      { label: 'Normalized Score', value: cgpaRaw, keyword: 'level' }
    ];

    report.breakdown = [
      {
        label: 'CGPA',
        value: cgpaRaw,
        max: 100,
        weight: 10,
        scoreComponent: pr.cgpa?.contribution || 0,
        formula: 'CGPA Score × 10%',
        calculation: `${cgpaRaw} × 0.10 = ${pr.cgpa?.contribution || 0}`,
        progressPerc: Math.min(100, cgpaRaw)
      }
    ];

    report.summary.finalScore = pr.cgpa?.contribution || 0;
    report.summary.maxScore = 10;
  } else {
    throw new Error('Unknown report type: ' + reportType);
  }

  // Calculate final score only if not pre-calculated
  if (report.summary.finalScore === undefined) {
    let finalScore = 0;
    report.breakdown.forEach(b => { finalScore += b.scoreComponent; });
    report.summary.finalScore = Number(finalScore.toFixed(2));
  }
  
  if (report.summary.maxScore === undefined) {
    let totalMax = 0;
    report.breakdown.forEach(b => { totalMax += b.weight; });
    report.summary.maxScore = totalMax;
  }
  
  if (report.breakdown.length > 0) {
    let sorted = [...report.breakdown].sort((a, b) => (a.scoreComponent / a.weight) - (b.scoreComponent / b.weight));
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    
    report.suggestions.strength = {
      label: strongest.label,
      score: strongest.scoreComponent,
      max: strongest.weight
    };
    
    const gain = Number((weakest.weight - weakest.scoreComponent).toFixed(2));
    const needed = Math.ceil(weakest.max * ((weakest.scoreComponent + gain) / weakest.weight)) - weakest.value;
    
    if (gain > 0) {
      report.suggestions.weakness = {
        label: weakest.label,
        score: weakest.scoreComponent,
        max: weakest.weight,
        suggestion: `${weakest.label}`
      };
      report.suggestions.nextGoal = {
        action: `Increase ${weakest.label} by ~${needed > 0 ? needed : '10%'}`,
        gain: `+${gain} pts`,
        expectedScore: Number((report.summary.finalScore + gain).toFixed(2))
      };
    }
  }

  return report;
}

module.exports = { buildAnalyticsReport };
