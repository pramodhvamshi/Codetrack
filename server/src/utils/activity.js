const config = require('../config/env');

function computeActivityStatus(user) {
  const { activityActiveThresholdDays } = config;
  const thresholdMs = activityActiveThresholdDays * 24 * 60 * 60 * 1000;

  const now = Date.now();
  const timestamps = [
    user.lastPlatformSyncAt,
    user.lastProfileUpdateAt,
    user.lastManualActivityAt
  ]
    .filter(Boolean)
    .map((d) => new Date(d).getTime());

  if (timestamps.length === 0) {
    return 'inactive';
  }

  const latest = Math.max(...timestamps);
  const isActive = now - latest <= thresholdMs;
  return isActive ? 'active' : 'inactive';
}

module.exports = {
  computeActivityStatus
};

