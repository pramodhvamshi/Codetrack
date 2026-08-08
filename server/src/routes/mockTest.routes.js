const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const MockTestSession = require('../models/MockTestSession');
const MockTestQuota = require('../models/MockTestQuota');
const mockTestService = require('../services/mockTestService');

const MAX_DAILY_ATTEMPTS = 5;
const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown between test generations

// Utility to get today's date key YYYY-MM-DD
function getTodayDateKey() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Helper to calculate quota state for a user
async function getUserQuotaState(studentId) {
  const todayKey = getTodayDateKey();
  let quota = await MockTestQuota.findOne({ studentId });

  if (!quota) {
    quota = new MockTestQuota({
      studentId,
      dateWindow: todayKey,
      dailyAttemptsCount: 0,
      lastAttemptAt: null,
    });
    await quota.save();
  } else if (quota.dateWindow !== todayKey) {
    // Reset for new day
    quota.dateWindow = todayKey;
    quota.dailyAttemptsCount = 0;
    await quota.save();
  }

  const attemptsRemaining = Math.max(0, MAX_DAILY_ATTEMPTS - quota.dailyAttemptsCount);
  let cooldownSecondsRemaining = 0;

  if (quota.lastAttemptAt) {
    const elapsed = Date.now() - new Date(quota.lastAttemptAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      cooldownSecondsRemaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    }
  }

  const canStartTest = attemptsRemaining > 0 && cooldownSecondsRemaining === 0;

  return {
    quota,
    dailyAttemptsCount: quota.dailyAttemptsCount,
    maxDailyAttempts: MAX_DAILY_ATTEMPTS,
    attemptsRemaining,
    cooldownSecondsRemaining,
    canStartTest,
    lastAttemptAt: quota.lastAttemptAt,
  };
}

// GET /api/ai/mocktest/quota
router.get('/quota', auth, async (req, res) => {
  try {
    const quotaState = await getUserQuotaState(req.user.id);
    res.json(quotaState);
  } catch (err) {
    console.error('Fetch mock test quota error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/mocktest/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const { topic, category = 'topic', difficulty = 'medium', totalQuestions = 10, useFallbackIfLimited = false } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const quotaState = await getUserQuotaState(req.user.id);

    let isUsingFallback = false;

    // Check rate limit constraints
    if (!quotaState.canStartTest) {
      if (quotaState.attemptsRemaining === 0) {
        if (!useFallbackIfLimited) {
          return res.status(429).json({
            error: `Daily limit reached (${MAX_DAILY_ATTEMPTS}/${MAX_DAILY_ATTEMPTS}). You can take a standard offline test or try again tomorrow.`,
            quotaState,
            rateLimited: true,
            reason: 'daily_limit_exceeded',
          });
        }
        isUsingFallback = true;
      } else if (quotaState.cooldownSecondsRemaining > 0) {
        if (!useFallbackIfLimited) {
          return res.status(429).json({
            error: `Cooldown active. Please wait ${quotaState.cooldownSecondsRemaining} seconds before starting another AI-generated test.`,
            quotaState,
            rateLimited: true,
            reason: 'cooldown_active',
          });
        }
        isUsingFallback = true;
      }
    }

    let questions = [];
    if (!isUsingFallback) {
      // Update quota
      quotaState.quota.dailyAttemptsCount += 1;
      quotaState.quota.lastAttemptAt = new Date();
      await quotaState.quota.save();

      // Generate via Gemini AI
      questions = await mockTestService.generateMockTestQuestions({
        topic,
        category,
        difficulty,
        totalQuestions: Number(totalQuestions) || 10,
      });
    } else {
      // Fallback prebuilt question set
      const prebuilt = mockTestService.FALLBACK_QUESTION_BANK[topic] || mockTestService.FALLBACK_QUESTION_BANK['Operating System (OS)'];
      questions = prebuilt.slice(0, Number(totalQuestions) || 10);
    }

    // Save session in DB
    const session = new MockTestSession({
      studentId: req.user.id,
      topic,
      category,
      difficulty,
      totalQuestions: questions.length,
      questions,
      status: 'in_progress',
    });

    await session.save();

    // Sanitize questions for client test runner (hide correctIndex & explanation during test execution)
    const sanitizedQuestions = session.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    const updatedQuota = await getUserQuotaState(req.user.id);

    res.json({
      sessionId: session._id,
      topic: session.topic,
      difficulty: session.difficulty,
      totalQuestions: session.totalQuestions,
      questions: sanitizedQuestions,
      quotaState: updatedQuota,
      isFallback: isUsingFallback,
    });
  } catch (err) {
    console.error('Generate mock test error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/mocktest/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { sessionId, userAnswers, durationSeconds } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await MockTestSession.findOne({
      _id: sessionId,
      studentId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Mock test session not found' });
    }

    const answers = Array.isArray(userAnswers) ? userAnswers : [];

    // Calculate score
    let score = 0;
    session.questions.forEach((q, idx) => {
      const selected = answers[idx];
      if (selected !== undefined && selected !== null && selected === q.correctIndex) {
        score += 1;
      }
    });

    const percentage = Math.round((score / session.totalQuestions) * 100);

    session.userAnswers = answers;
    session.score = score;
    session.percentage = percentage;
    session.status = 'completed';
    session.durationSeconds = Number(durationSeconds) || 0;
    session.completedAt = new Date();

    await session.save();

    res.json({
      session,
      score,
      percentage,
      totalQuestions: session.totalQuestions,
    });
  } catch (err) {
    console.error('Submit mock test error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/mocktest/history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await MockTestSession.find({
      studentId: req.user.id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(sessions);
  } catch (err) {
    console.error('Fetch mock test history error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/mocktest/session/:sessionId
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const session = await MockTestSession.findOne({
      _id: req.params.sessionId,
      studentId: req.user.id,
    }).lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (err) {
    console.error('Fetch mock test session error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
