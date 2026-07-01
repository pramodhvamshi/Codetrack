const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPathLocal = path.resolve(__dirname, '../../.env.local');
const envPathDefault = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPathLocal)) {
  dotenv.config({ path: envPathLocal });
} else {
  dotenv.config({ path: envPathDefault });
}

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrack',
  jwtSecret: process.env.JWT_SECRET || 'change_this_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Hosted external APIs for LeetCode & CodeChef metrics.
  // Do NOT run these APIs locally; always use the public URLs.
  leetcodeApiBaseUrl:
    process.env.LEETCODE_API_BASE_URL || 'https://alfa-leetcode-api.onrender.com',
  codechefApiBaseUrl:
    process.env.CODECHEF_API_BASE_URL || 'https://hades-black.vercel.app/api',
  // Minimum minutes between external platform sync calls per user
  platformSyncMinMinutes: parseInt(process.env.PLATFORM_SYNC_MIN_MINUTES || '60', 10),
  // How many days of inactivity before a student is considered inactive
  activityActiveThresholdDays: parseInt(process.env.ACTIVITY_ACTIVE_DAYS || '7', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  bulkSyncBatchSize: parseInt(process.env.BULK_SYNC_BATCH_SIZE || '20', 10),
  bulkSyncDelayMs: parseInt(process.env.BULK_SYNC_DELAY_MS || '3000', 10),

  // Configurable ranking weights for Leaderboard Ranking Logic
  rankingWeights: {
    codingScore: parseFloat(process.env.WEIGHT_CODING_SCORE || '0.40'),
    contestPerformance: parseFloat(process.env.WEIGHT_CONTEST_PERFORMANCE || '0.25'),
    activityScore: parseFloat(process.env.WEIGHT_ACTIVITY_SCORE || '0.20'),
    consistencyScore: parseFloat(process.env.WEIGHT_CONSISTENCY_SCORE || '0.15')
  },

  // Competitive Index configuration (Max Score 400)
  COMPETITIVE_INDEX_MAX: 400,
  
  SCORING_CONFIG: {
    leetcode: {
      solved: 40,
      rating: 40,
      contests: 20
    },
    codechef: {
      solved: 30,
      rating: 50,
      contests: 20
    },
    gfg: {
      codingScore: 50,
      solved: 30,
      streak: 20
    },
    hackerrank: {
      solved: 50,
      badges: 30,
      certifications: 20
    }
  }
};

module.exports = config;

