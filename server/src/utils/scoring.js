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

  return {
    lcScore: lcScoreLegacy,
    ccScore: ccScoreLegacy,
    gfgScore: computeGeeksforGeeksScore(gfgMetrics),
    ghScore: computeGitHubScore(ghMetrics),
    hrScore: hrScoreLegacy,
    activityScore,
    consistencyScore,
    totalScore: Math.round(legacyTotalScore),
    weightedRankScore: Math.round(weightedRankScore)
  };
}

module.exports = {
  computeLeetCodeScore,
  computeCodeChefScore,
  computeHackerRankScore,
  computeGeeksforGeeksScore,
  computeGitHubScore,
  computeAggregateScores
};

