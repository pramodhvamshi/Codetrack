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

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);
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
app.use('/api/student', studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profiles', profileRoutes);

// Fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const port = config.port;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CodeTrack API listening on port ${port}`);
});

