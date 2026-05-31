// Scoring helpers based on project specification
//
// LeetCode:
// LC_SCORE = LCPS + (LCNC × 5) + (LCR ÷ 10)
//
// CodeChef:
// CC_SCORE = CCPS + (CCNC × 5) + (CCR ÷ 10)
//
// Overall:
// TOTAL_SCORE = LC_SCORE + CC_SCORE + HR_SCORE

function computeLeetCodeScore(metrics = {}) {
  const LCPS = Number(metrics.problemsSolved || metrics.solvedProblem || 0);
  const LCNC = Number(metrics.contestCount || metrics.contestAttend || 0);
  const LCR = Number(metrics.rating || metrics.contestRating || 0);

  return LCPS + LCNC * 5 + LCR / 10;
}

function computeCodeChefScore(metrics = {}) {
  // New API provides problemSolved directly
  const CCPS = Number(metrics.problemsSolved || 0);
  const CCNC = Number(metrics.contestCount || 0);
  const CCR = Number(metrics.rating || 0);

  return CCPS + CCNC * 5 + CCR / 10;
}

// HackerRank scoring is not specified in detail in the prompt.
// A reasonable heuristic:
// HR_SCORE = problemsSolved + (badgeCount × 10) + (certificationCount × 15)
function computeHackerRankScore(hr = {}) {
  const problemsSolved = Number(hr.totalProblemsSolved || 0);
  const badges = Number(hr.badgeCount || 0);
  const certs = Array.isArray(hr.certifications) ? hr.certifications.length : 0;

  return problemsSolved + badges * 10 + certs * 15;
}

function computeAggregateScores({ platformStats = {}, hackerrank = {} }) {
  const lcMetrics = platformStats.leetcode || {};
  const ccMetrics = platformStats.codechef || {};

  const lcScore = computeLeetCodeScore(lcMetrics);
  const ccScore = computeCodeChefScore(ccMetrics);
  const hrScore = computeHackerRankScore(hackerrank);
  const totalScore = lcScore + ccScore + hrScore;

  return {
    lcScore,
    ccScore,
    hrScore,
    totalScore
  };
}

module.exports = {
  computeLeetCodeScore,
  computeCodeChefScore,
  computeHackerRankScore,
  computeAggregateScores
};

