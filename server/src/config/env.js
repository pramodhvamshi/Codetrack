const dotenv = require('dotenv');

dotenv.config();

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
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports = config;

