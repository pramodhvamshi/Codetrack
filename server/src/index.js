const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const coordinatorRoutes = require('./routes/coordinator');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profiles');
const resumeRoutes = require('./routes/resume');
const adminRoutes = require('./routes/admin');
const bugRoutes = require('./routes/bugs');

const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// ── CORS must be FIRST — before helmet, rate-limiter, and body parsers ──
app.use(
  cors({
    origin: [
      config.clientUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
// Handle all preflight OPTIONS requests immediately
app.options('/{*wildcard}', cors({
  origin: [
    config.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cookieParser());
app.use(limiter);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));


// Static files for uploads (certificates, screenshots, manual resumes)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeTrack API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student/resume', resumeRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bugs', bugRoutes);

// Fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const port = config.port;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CodeTrack API listening on port ${port}`);
});

