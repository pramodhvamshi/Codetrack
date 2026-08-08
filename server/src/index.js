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
const mentorNotesRoutes = require('./routes/mentorNotes');
const progressRoutes = require('./routes/progress');
const roadmapRoutes = require('./routes/roadmap.routes');
const dsaRoutes = require('./routes/dsa.routes');
const aiRoutes = require('./routes/ai.routes');
const feedRoutes = require('./routes/feed.routes');
const notificationRoutes = require('./routes/notification.routes');
const jobRoutes = require('./routes/job.routes');
const alumniRoutes = require('./routes/alumni.routes');
const messageRoutes = require('./routes/message.routes');
const fundingRoutes = require('./routes/funding.routes');
const eventRoutes = require('./routes/event.routes');
const forumRoutes = require('./routes/forum.routes');
const resourceRoutes = require('./routes/resource.routes');
const interviewExperienceRoutes = require('./routes/interviewExperience.routes');
const alumniGroupRoutes = require('./routes/alumniGroup.routes');
const mockTestRoutes = require('./routes/mockTest.routes');
const servicesRoutes = require('./routes/services.routes');

const { initSocket } = require('./services/socketService');
const http = require('http');

const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const seedAlumniData = require('./utils/seedAlumni');

const app = express();

// Connect to MongoDB
connectDB().then(() => {
  seedAlumniData();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

// ── CORS must be FIRST — before helmet, rate-limiter, and body parsers ──
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl, server calls)
      if (!origin) return callback(null, true);
      // Dynamically echo the requesting origin (https://medhacodetrack.vercel.app, localhost, etc.)
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-session-id', 'x-system-prompt'],
    exposedHeaders: ['x-session-id', 'x-system-prompt'],
    optionsSuccessStatus: 200
  })
);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cookieParser());
app.use(limiter);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MEDHA CODE TRACK API is running' });
});

// V1 Routes
app.use('/api/auth', authRoutes);
app.use('/api/student/resume', resumeRoutes);
app.use('/api/student/progress', progressRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/mocktest', mockTestRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/coordinator/mentor-notes', mentorNotesRoutes);

// V2 Integrated Architecture Routes
app.use('/api/v2/feed', feedRoutes);
app.use('/api/v2/notifications', notificationRoutes);
app.use('/api/v2/jobs', jobRoutes);
app.use('/api/v2/alumni', alumniRoutes);
app.use('/api/v2/messages', messageRoutes);
app.use('/api/v2/funding', fundingRoutes);
app.use('/api/v2/events', eventRoutes);
app.use('/api/v2/forums', forumRoutes);
app.use('/api/v2/resources', resourceRoutes);
app.use('/api/v2/interview-experiences', interviewExperienceRoutes);
app.use('/api/v2/groups', alumniGroupRoutes);

// Fallback
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

const PORT = config.port || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 MEDHA CODE TRACK Server running on port ${PORT}`);
});
