const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const resumeAnalyzerService = require('../services/resumeAnalyzer.service');
const InterviewSession = require('../models/Interview/InterviewSession');
const InterviewMessage = require('../models/Interview/InterviewMessage');
const InterviewFeedback = require('../models/Interview/InterviewFeedback');

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
      const { company, role, round, difficulty } = req.body;
      const systemPrompt = `You are a senior interviewer at ${company || 'a top tech company'} conducting a ${round || 'Technical'} interview for the position of ${role || 'Software Engineer'}. The difficulty level is ${difficulty || 'Medium'}.
      
YOUR BEHAVIOR:
1. Start with a brief introduction and put the candidate at ease
2. Ask questions ONE AT A TIME — wait for the candidate's response before proceeding
3. Ask follow-up questions based on the candidate's responses
4. Be encouraging but maintain professional rigor
5. For Technical rounds: ask coding/DSA questions, evaluate approach and logic
6. For HR/Behavioral rounds: focus on behavioral questions, cultural fit, communication

IMPORTANT:
- Keep responses concise (2-3 sentences for follow-ups)
- When asking a coding question, present it clearly with constraints
- Don't give away answers — guide the candidate if they're stuck

Respond in a conversational, professional tone. Start the interview now with a greeting and your first question.`;

      // 1. Create a session in the database
      const dbSession = await InterviewSession.create({
        studentId: req.user.id,
        company: company || 'Tech Company',
        role: role || 'Software Engineer',
        round: round || 'Technical',
        difficulty: difficulty || 'Medium',
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

      // 2. Save greeting message to DB
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

      // Save user response to DB
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

      // Save AI reply to DB
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
      const evalPrompt = `You are evaluating a mock interview session for ${role || 'Software Engineer'} at ${company || 'a top tech company'} (${round || 'Technical'} round).

INTERVIEW CONVERSATION:
${conversationHistory}

GRADING CRITERIA & RULES:
1. Be extremely strict and realistic. This is a simulation of real campus placements.
2. If the candidate provides irrelevant, gibberish, single-letter, very short (e.g. less than 3 words), or empty answers (like "c", "kk", "ok", "yes", "i don't know"), you MUST score that specific question as 0 (zero) points.
3. If the candidate answers most questions with nonsense or single-letter responses, the overallScore and all category scores MUST be extremely low (e.g., between 0 and 5).

TASK: Evaluate the candidate's performance based on the above rules and provide detailed feedback.

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
      
      // Save feedback and set session Completed
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
