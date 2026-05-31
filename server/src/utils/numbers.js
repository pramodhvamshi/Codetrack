/**
 * Safely round numeric values
 * - Handles null / undefined / NaN
 * - Default: whole number
 */
export function round(value, digits = 0) {
  if (value === null || value === undefined) return 0;

  const num = Number(value);
  if (Number.isNaN(num)) return 0;

  return Number(num.toFixed(digits));
}

/**
 * Round all numeric fields of a score object
 */
export function roundScores(scores = {}) {
  return {
    lcScore: round(scores.lcScore),
    ccScore: round(scores.ccScore),
    hrScore: round(scores.hrScore),
    totalScore: round(scores.totalScore)
  };
}
