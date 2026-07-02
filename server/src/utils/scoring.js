const config = require('../config/env');

// Scoring helpers based on project specification

function computeLeetCodeScore(metrics = {}) {
  const LCPS = Number(metrics.problemsSolved || metrics.totalSolved || 0);
  const LCNC = Number(metrics.contestCount || 0);
  const LCR = Number(metrics.rating || 0);

  return LCPS + LCNC * 5 + LCR / 10;
}

function computeCodeChefScore(metrics = {}) {
  const CCPS = Number(metrics.problemsSolved || 0);
  const CCNC = Number(metrics.contestCount || 0);
  const CCR = Number(metrics.rating || 0);

  return CCPS + CCNC * 5 + CCR / 10;
}

function computeHackerRankScore(hr = {}) {
  const problemsSolved = Number(hr.totalProblemsSolved || 0);
  const badges = Number(hr.badgeCount || 0);
  const certs = Array.isArray(hr.certifications) ? hr.certifications.length : 0;

  return problemsSolved + badges * 10 + certs * 15;
}

function computeGeeksforGeeksScore(gfg = {}) {
  const GFGPS = Number(gfg.problemsSolved || 0);
  const Score = Number(gfg.codingScore || 0);
  // A heuristic for GFG score
  return GFGPS + Score / 10;
}

function computeGitHubScore(gh = {}) {
  const repos = Number(gh.reposCount || 0);
  const stars = Number(gh.starsCount || 0);
  return repos * 5 + stars * 10;
}

// -------------------------------------------------------------
// COMPETITIVE INDEX IMPLEMENTATION (Max 100 per platform)
// -------------------------------------------------------------

function getCompetitiveLeetCodeScore(metrics = {}, w = config.SCORING_CONFIG.leetcode) {
  const solved = Number(metrics.problemsSolved || metrics.totalSolved || 0);
  const rating = Number(metrics.rating || 0);
  const contests = Number(metrics.contestCount || 0);

  const solvedScore = Math.min(solved, 500) / 500 * w.solved;
  const ratingScore = Math.min(rating, 1800) / 1800 * w.rating;
  const contestsScore = Math.min(contests, 50) / 50 * w.contests;

  const score = Number((solvedScore + ratingScore + contestsScore).toFixed(2));

  const formulas = [
    { label: 'Problem Solving', target: 500, current: solved, formula: `min(${solved} / 500, 1) × ${w.solved}`, contribution: solvedScore.toFixed(1), max: w.solved },
    { label: 'Rating', target: 1800, current: rating, formula: `min(${rating} / 1800, 1) × ${w.rating}`, contribution: ratingScore.toFixed(1), max: w.rating },
    { label: 'Contest Participation', target: 50, current: contests, formula: `min(${contests} / 50, 1) × ${w.contests}`, contribution: contestsScore.toFixed(1), max: w.contests }
  ];

  const recommendations = [];
  let potentialScore = score;

  if (solved >= 500 && rating >= 1800 && contests >= 50) {
    recommendations.push({ text: '✓ Excellent overall performance', type: 'success' });
  } else {
    if (solved >= 500) recommendations.push({ text: '✓ Strong problem solving', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Solve ${500 - solved} more problems`, type: 'warning' });
      potentialScore += ((500 - solved) / 500 * w.solved);
    }
    if (rating >= 1800) recommendations.push({ text: '✓ Excellent rating', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Increase rating to 1800`, type: 'warning' });
      potentialScore += ((1800 - Math.max(rating, 0)) / 1800 * w.rating);
    }
    if (contests >= 50) recommendations.push({ text: '✓ Excellent contest participation', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Participate in ${50 - contests} more contests`, type: 'warning' });
      potentialScore += ((50 - contests) / 50 * w.contests);
    }
  }

  return { baseScore: score, multiplier: 1.0, score: score, formulas, recommendations, potentialScore: Math.min(Number(potentialScore.toFixed(1)), w.solved + w.rating + w.contests) };
}

function getCompetitiveCodeChefScore(metrics = {}, w = config.SCORING_CONFIG.codechef) {
  const solved = Number(metrics.problemsSolved || 0);
  const rating = Number(metrics.rating || metrics.currentRating || 0);
  const contests = Number(metrics.contestCount || 0);

  const solvedScore = Math.min(solved, 500) / 500 * w.solved;
  const ratingScore = Math.min(rating, 1800) / 1800 * w.rating;
  const contestsScore = Math.min(contests, 50) / 50 * w.contests;

  const score = Number((solvedScore + ratingScore + contestsScore).toFixed(2));

  const formulas = [
    { label: 'Problem Solving', target: 500, current: solved, formula: `min(${solved} / 500, 1) × ${w.solved}`, contribution: solvedScore.toFixed(1), max: w.solved },
    { label: 'Rating', target: 1800, current: rating, formula: `min(${rating} / 1800, 1) × ${w.rating}`, contribution: ratingScore.toFixed(1), max: w.rating },
    { label: 'Contest Participation', target: 50, current: contests, formula: `min(${contests} / 50, 1) × ${w.contests}`, contribution: contestsScore.toFixed(1), max: w.contests }
  ];

  const recommendations = [];
  let potentialScore = score;

  if (solved >= 500 && rating >= 1800 && contests >= 50) {
    recommendations.push({ text: '✓ Excellent overall performance', type: 'success' });
  } else {
    if (solved >= 500) recommendations.push({ text: '✓ Strong problem solving', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Solve ${500 - solved} more problems`, type: 'warning' });
      potentialScore += ((500 - solved) / 500 * w.solved);
    }
    if (rating >= 1800) recommendations.push({ text: '✓ Excellent rating', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Increase rating to 1800`, type: 'warning' });
      potentialScore += ((1800 - Math.max(rating, 0)) / 1800 * w.rating);
    }
    if (contests >= 50) recommendations.push({ text: '✓ Excellent contest participation', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Participate in ${50 - contests} more contests`, type: 'warning' });
      potentialScore += ((50 - contests) / 50 * w.contests);
    }
  }

  return { baseScore: score, multiplier: 1.0, score: score, formulas, recommendations, potentialScore: Math.min(Number(potentialScore.toFixed(1)), w.solved + w.rating + w.contests) };
}

function getCompetitiveGFGScore(metrics = {}, w = config.SCORING_CONFIG.gfg) {
  const scoreRaw = Number(metrics.codingScore || 0);
  const solved = Number(metrics.problemsSolved || 0);
  const streak = Number(metrics.streak || 0);

  const codingScore = Math.min(scoreRaw, 2000) / 2000 * w.codingScore;
  const solvedScore = Math.min(solved, 500) / 500 * w.solved;
  const streakScore = Math.min(streak, 100) / 100 * w.streak;

  const finalScore = Number((codingScore + solvedScore + streakScore).toFixed(2));

  const formulas = [
    { label: 'Coding Score', target: 2000, current: scoreRaw, formula: `min(${scoreRaw} / 2000, 1) × ${w.codingScore}`, contribution: codingScore.toFixed(1), max: w.codingScore },
    { label: 'Problem Solving', target: 500, current: solved, formula: `min(${solved} / 500, 1) × ${w.solved}`, contribution: solvedScore.toFixed(1), max: w.solved },
    { label: 'Streak', target: 100, current: streak, formula: `min(${streak} / 100, 1) × ${w.streak}`, contribution: streakScore.toFixed(1), max: w.streak }
  ];

  const recommendations = [];
  let potentialScore = finalScore;

  if (scoreRaw >= 2000 && solved >= 500 && streak >= 100) {
    recommendations.push({ text: '✓ Excellent overall performance', type: 'success' });
  } else {
    if (scoreRaw >= 2000) recommendations.push({ text: '✓ Strong coding score', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Increase coding score to 2000`, type: 'warning' });
      potentialScore += ((2000 - Math.max(scoreRaw, 0)) / 2000 * w.codingScore);
    }
    if (solved >= 500) recommendations.push({ text: '✓ Strong problem solving', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Solve ${500 - solved} more problems`, type: 'warning' });
      potentialScore += ((500 - solved) / 500 * w.solved);
    }
    if (streak >= 100) recommendations.push({ text: '✓ Great consistency streak', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Build up your coding streak`, type: 'warning' });
      potentialScore += ((100 - streak) / 100 * w.streak);
    }
  }

  return { baseScore: finalScore, multiplier: 1.0, score: finalScore, formulas, recommendations, potentialScore: Math.min(Number(potentialScore.toFixed(1)), w.codingScore + w.solved + w.streak) };
}

function getCompetitiveHackerRankScore(metrics = {}, w = config.SCORING_CONFIG.hackerrank) {
  const solved = Number(metrics.totalProblemsSolved || 0);
  const badges = Number(metrics.badgeCount || 0);
  const certs = Array.isArray(metrics.certifications) ? metrics.certifications.length : 0;

  const solvedScore = Math.min(solved, 200) / 200 * w.solved;
  const badgesScore = Math.min(badges, 20) / 20 * w.badges;
  const certsScore = Math.min(certs, 5) / 5 * w.certifications;

  const score = Number((solvedScore + badgesScore + certsScore).toFixed(2));

  const formulas = [
    { label: 'Problem Solving', target: 200, current: solved, formula: `min(${solved} / 200, 1) × ${w.solved}`, contribution: solvedScore.toFixed(1), max: w.solved },
    { label: 'Badges', target: 20, current: badges, formula: `min(${badges} / 20, 1) × ${w.badges}`, contribution: badgesScore.toFixed(1), max: w.badges },
    { label: 'Certifications', target: 5, current: certs, formula: `min(${certs} / 5, 1) × ${w.certifications}`, contribution: certsScore.toFixed(1), max: w.certifications }
  ];

  const recommendations = [];
  let potentialScore = score;

  if (solved >= 200 && badges >= 20 && certs >= 5) {
    recommendations.push({ text: '✓ Excellent overall performance', type: 'success' });
  } else {
    if (solved >= 200) recommendations.push({ text: '✓ Strong problem solving', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Solve ${200 - solved} more problems`, type: 'warning' });
      potentialScore += ((200 - solved) / 200 * w.solved);
    }
    if (badges >= 20) recommendations.push({ text: '✓ Great badge collection', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Earn ${20 - badges} more badges`, type: 'warning' });
      potentialScore += ((20 - badges) / 20 * w.badges);
    }
    if (certs >= 5) recommendations.push({ text: '✓ Excellent certifications', type: 'success' });
    else {
      recommendations.push({ text: `⚠ Earn ${5 - certs} more certifications`, type: 'warning' });
      potentialScore += ((5 - certs) / 5 * w.certifications);
    }
  }

  return { baseScore: score, multiplier: 1.0, score: score, formulas, recommendations, potentialScore: Math.min(Number(potentialScore.toFixed(1)), w.solved + w.badges + w.certifications) };
}

// -------------------------------------------------------------

function computeAggregateScores({ platformStats = {}, hackerrank = {}, currentActivityScore = 0, currentConsistencyScore = 0 }) {
  const lcMetrics = platformStats.leetcode || {};
  const ccMetrics = platformStats.codechef || {};
  const gfgMetrics = platformStats.geeksforgeeks || {};
  const ghMetrics = platformStats.github || {};
  const hr = hackerrank || {};

  // 1. Coding Score (Solved count across all active platforms)
  const lcSolved = Number(lcMetrics.problemsSolved || lcMetrics.totalSolved || 0);
  const ccSolved = Number(ccMetrics.problemsSolved || 0);
  const gfgSolved = Number(gfgMetrics.problemsSolved || 0);
  const hrSolved = Number(hr.totalProblemsSolved || 0);
  const codingScore = lcSolved + ccSolved + gfgSolved + hrSolved;

  // 2. Contest Performance (Ratings and attended contest weight)
  const lcRating = Number(lcMetrics.rating || 0);
  const lcContests = Number(lcMetrics.contestCount || 0);
  const ccRating = Number(ccMetrics.rating || 0);
  const ccContests = Number(ccMetrics.contestCount || 0);
  const gfgScoreVal = Number(gfgMetrics.codingScore || 0);

  const contestScore =
    (lcRating / 10 + lcContests * 5) +
    (ccRating / 10 + ccContests * 5) +
    (gfgScoreVal / 10);

  // 3. Activity Score (passed in from timeline engine)
  const activityScore = currentActivityScore;

  // 4. Consistency Score (passed in from timeline engine)
  const consistencyScore = currentConsistencyScore;

  // Compute legacy total score for backward compatibility
  const lcScoreLegacy = computeLeetCodeScore(lcMetrics);
  const ccScoreLegacy = computeCodeChefScore(ccMetrics);
  const hrScoreLegacy = computeHackerRankScore(hr);
  const legacyTotalScore = lcScoreLegacy + ccScoreLegacy + hrScoreLegacy;

  // Retrieve Configurable weights
  const weights = config.rankingWeights || {
    codingScore: 0.40,
    contestPerformance: 0.25,
    activityScore: 0.20,
    consistencyScore: 0.15
  };

  // Compute V2 Weighted Rank Score
  const weightedRankScore =
    (codingScore * weights.codingScore) +
    (contestScore * weights.contestPerformance) +
    (activityScore * weights.activityScore) +
    (consistencyScore * weights.consistencyScore);

  // Compute V3 Competitive Index & Breakdown
  const lcComp = getCompetitiveLeetCodeScore(lcMetrics);
  const ccComp = getCompetitiveCodeChefScore(ccMetrics);
  const gfgComp = getCompetitiveGFGScore(gfgMetrics);
  const hrComp = getCompetitiveHackerRankScore(hr);

  const competitiveIndex = Number((lcComp.score + ccComp.score + gfgComp.score + hrComp.score).toFixed(2));
  const competitiveBreakdown = {
    leetcode: lcComp,
    codechef: ccComp,
    geeksforgeeks: gfgComp,
    hackerrank: hrComp
  };

  return {
    lcScore: lcScoreLegacy,
    ccScore: ccScoreLegacy,
    gfgScore: computeGeeksforGeeksScore(gfgMetrics),
    ghScore: computeGitHubScore(ghMetrics),
    hrScore: hrScoreLegacy,
    activityScore,
    consistencyScore,
    totalScore: Math.round(legacyTotalScore),
    weightedRankScore: Math.round(weightedRankScore),
    competitiveIndex,
    competitiveBreakdown
  };
}

module.exports = {
  computeLeetCodeScore,
  computeCodeChefScore,
  computeHackerRankScore,
  computeGeeksforGeeksScore,
  computeGitHubScore,
  getCompetitiveLeetCodeScore,
  getCompetitiveCodeChefScore,
  getCompetitiveGFGScore,
  getCompetitiveHackerRankScore,
  computeAggregateScores
};

