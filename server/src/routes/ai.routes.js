const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const resumeAnalyzerService = require('../services/resumeAnalyzer.service');
const InterviewSession = require('../models/Interview/InterviewSession');
const InterviewMessage = require('../models/Interview/InterviewMessage');
const InterviewFeedback = require('../models/Interview/InterviewFeedback');
const InterviewQuota = require('../models/InterviewQuota');

const MAX_FREE_INTERVIEWS = 2;

// Company specific behavior nuances
const COMPANY_PROMPTS = {
  Google: "Simulate a senior Google software engineering interviewer. Focus heavily on optimal algorithmic efficiency (Big-O time/space complexity), scalable data structure choices, and edge-case handling.",
  Amazon: "Simulate an Amazon Bar Raiser. Incorporate Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action). Ask questions using the STAR framework and evaluate technical scalability.",
  Microsoft: "Simulate a Microsoft Principal Engineer. Emphasize modular code design, robust exception handling, practical software engineering principles, and core OS/system concepts.",
  TCS: "Simulate a TCS Technical Lead. Focus on solid core CS fundamentals (OOPs, DBMS, Operating Systems, Networks), clear logical communication, and structured problem solving.",
  Infosys: "Simulate an Infosys Technical Specialist. Focus on foundational DSA, database querying, object-oriented concepts, and articulate verbal explanations.",
  Adobe: "Simulate an Adobe Computer Scientist. Focus on creative algorithmic thinking, data structures, low-level efficiency, and clean object-oriented architecture.",
};

// GET /api/ai/interview/quota
router.get('/interview/quota', auth, async (req, res) => {
  try {
    let quota = await InterviewQuota.findOne({ studentId: req.user.id });
    if (!quota) {
      // Also sync count from existing Completed/InProgress InterviewSession
      const count = await InterviewSession.countDocuments({ studentId: req.user.id });
      quota = new InterviewQuota({
        studentId: req.user.id,
        interviewsCount: count,
        maxInterviews: MAX_FREE_INTERVIEWS,
      });
      await quota.save();
    }

    const interviewsRemaining = Math.max(0, MAX_FREE_INTERVIEWS - quota.interviewsCount);
    res.json({
      interviewsCount: quota.interviewsCount,
      maxInterviews: MAX_FREE_INTERVIEWS,
      interviewsRemaining,
      canStartInterview: interviewsRemaining > 0,
    });
  } catch (err) {
    console.error('Fetch interview quota error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/resume/analyze
router.post('/resume/analyze', auth, async (req, res) => {
  try {
    const { resumeVersionId, resumeFileId, jobDescription, force } = req.body;
    if (!resumeVersionId && !resumeFileId) {
      return res.status(400).json({ error: 'resumeVersionId or resumeFileId is required' });
    }

    const analysis = await resumeAnalyzerService.analyzeResume(resumeVersionId, resumeFileId, jobDescription, force);
    res.json(analysis);
  } catch (err) {
    console.error('Resume Analysis Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/interview/history
router.get('/interview/history', auth, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ studentId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
      
    const sessionIds = sessions.map(s => s._id);
    const feedbacks = await InterviewFeedback.find({ sessionId: { $in: sessionIds } }).lean();
    
    const sessionsWithFeedback = sessions.map(session => {
      const fb = feedbacks.find(f => f.sessionId.toString() === session._id.toString());
      return {
        ...session,
        feedback: fb || null
      };
    });
    
    res.json(sessionsWithFeedback);
  } catch (err) {
    console.error('Fetch interview history error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/interview/details/:sessionId
router.get('/interview/details/:sessionId', auth, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ 
      _id: req.params.sessionId,
      studentId: req.user.id
    }).lean();
    
    if (!session) {
      return res.status(404).json({ error: 'Interview session not found' });
    }
    
    const [messages, feedback] = await Promise.all([
      InterviewMessage.find({ sessionId: session._id }).sort({ timestamp: 1 }).lean(),
      InterviewFeedback.findOne({ sessionId: session._id }).lean()
    ]);
    
    res.json({
      session,
      messages,
      feedback
    });
  } catch (err) {
    console.error('Fetch interview details error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/interview
router.post('/interview', auth, async (req, res) => {
  try {
    const { action } = req.body;
    const aiService = require('../services/ai.service');

    if (action === 'start') {
      const { company = 'Google', role = 'Software Developer', round = 'Technical', difficulty = 'Medium' } = req.body;

      // Enforce 2 Free Interviews Quota
      let quota = await InterviewQuota.findOne({ studentId: req.user.id });
      if (!quota) {
        const count = await InterviewSession.countDocuments({ studentId: req.user.id });
        quota = new InterviewQuota({ studentId: req.user.id, interviewsCount: count });
        await quota.save();
      }

      if (quota.interviewsCount >= MAX_FREE_INTERVIEWS) {
        return res.status(429).json({
          error: `You have used all ${MAX_FREE_INTERVIEWS} of your free AI Voice Interviews quota. Try our Mock Tests or review past sessions.`,
          quotaExceeded: true,
        });
      }

      // Increment quota count
      quota.interviewsCount += 1;
      quota.lastInterviewAt = new Date();
      await quota.save();

      const companyGuidance = COMPANY_PROMPTS[company] || `Simulate a senior interviewer at ${company}.`;

      const systemPrompt = `You are conducting a strict 10-minute voice-to-voice interview for ${company} (${round} Round, ${difficulty} Difficulty) for the role of ${role}.

COMPANY SPECIFIC INTERVIEW STYLE:
${companyGuidance}

VOICE INTERVIEW PROTOCOL (CRITICAL):
1. Keep ALL responses short, clear, and direct (MAXIMUM 2 to 3 sentences per turn).
2. Since this is a SPOKEN voice interview, do NOT output long paragraphs, code blocks, or markdown tables.
3. Ask ONE focused question at a time.
4. Listen to the candidate's spoken reply, give brief constructive follow-up or validation, then ask the next question.
5. Keep track of time and maintain professional momentum.

Start now by warmly greeting the candidate for their ${company} ${round} interview and asking your first question.`;

      const dbSession = await InterviewSession.create({
        studentId: req.user.id,
        company,
        role,
        round,
        difficulty,
        status: 'InProgress',
        startTime: new Date()
      });

      const chat = aiService.createChatSession(systemPrompt);
      const result = await chat.sendMessageStream("Start the interview. Greet the candidate and ask your first question.");

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('x-system-prompt', Buffer.from(systemPrompt).toString('base64'));
      res.setHeader('x-session-id', dbSession._id.toString());
      
      let textAccumulator = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        textAccumulator += text;
        res.write(text);
      }
      res.end();

      if (textAccumulator) {
        await InterviewMessage.create({
          sessionId: dbSession._id,
          role: 'ai',
          content: textAccumulator
        });
      }
      return;
    } 
    else if (action === 'message') {
      const { systemPrompt, history, message, sessionId } = req.body;
      
      let adjustedHistory = [...(history || [])];
      if (adjustedHistory.length > 0 && adjustedHistory[0].role === "model") {
        adjustedHistory.unshift({
          role: "user",
          parts: [{ text: "Hello, I am ready for the interview." }],
        });
      }

      if (sessionId) {
        await InterviewMessage.create({
          sessionId,
          role: 'user',
          content: message
        });
      }

      const chat = aiService.createChatSession(systemPrompt, adjustedHistory);
      const result = await chat.sendMessageStream(message);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      let textAccumulator = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        textAccumulator += text;
        res.write(text);
      }
      res.end();

      if (sessionId && textAccumulator) {
        await InterviewMessage.create({
          sessionId,
          role: 'ai',
          content: textAccumulator
        });
      }
      return;
    }
    else if (action === 'evaluate') {
      const { company, role, round, conversationHistory, sessionId } = req.body;
      const evalPrompt = `You are evaluating a 10-minute voice mock interview session for ${role || 'Software Engineer'} at ${company || 'a top tech company'} (${round || 'Technical'} round).

INTERVIEW CONVERSATION:
${conversationHistory}

GRADING CRITERIA:
1. Be strict, fair, and realistic for campus placement standards.
2. Evaluate technical accuracy, communication clarity, problem-solving, and confidence.
3. If candidate answers were extremely short, empty, or gibberish, grade accordingly.

Return JSON:
{
  "overallScore": 80,
  "scores": {
    "technicalAccuracy": { "score": 85, "feedback": "<feedback>" },
    "communication": { "score": 75, "feedback": "<feedback>" },
    "problemSolving": { "score": 80, "feedback": "<feedback>" },
    "confidence": { "score": 90, "feedback": "<feedback>" }
  },
  "questionBreakdown": [
    {
      "question": "<the question asked>",
      "candidateAnswer": "<summary of what they said>",
      "score": 80,
      "feedback": "<what was good/bad>",
      "modelAnswer": "<ideal answer>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area 2>"],
  "summary": "<2-3 sentence overall assessment>",
  "recommendedTopics": ["<topic to study 1>", "<topic 2>"]
}`;
      const analysis = await aiService.generateJSON(evalPrompt, "You are an expert interviewer.", { temperature: 0.3 });
      
      if (sessionId) {
        try {
          await InterviewFeedback.findOneAndUpdate(
            { sessionId },
            {
              categories: {
                technicalAccuracy: analysis.scores?.technicalAccuracy?.score || 0,
                communication: analysis.scores?.communication?.score || 0,
                problemSolving: analysis.scores?.problemSolving?.score || 0,
                confidence: analysis.scores?.confidence?.score || 0
              },
              overallScore: analysis.overallScore || 0,
              tips: analysis.improvements || []
            },
            { upsert: true, new: true }
          );

          await InterviewSession.findByIdAndUpdate(sessionId, {
            status: 'Completed',
            endTime: new Date()
          });
        } catch (dbErr) {
          console.error("Failed to save interview session metrics:", dbErr);
        }
      }
      return res.json(analysis);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Interview API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
