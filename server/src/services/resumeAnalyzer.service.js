const aiService = require('./ai.service');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const ResumeVersion = require('../models/Resume/ResumeVersion');
const ResumeAnalysis = require('../models/Resume/ResumeAnalysis');

const RESUME_ANALYSIS_SYSTEM = `You are an expert ATS (Applicant Tracking System) resume analyst and career advisor specializing in Indian engineering placements. You have deep knowledge of:
- How ATS software parses and scores resumes
- Indian campus placement standards and expectations
- Resume formatting best practices for tech roles
- Keyword optimization for software engineering positions

Your analysis must be:
1. SPECIFIC — point to exact lines/sections that need improvement
2. ACTIONABLE — give clear, implementable suggestions
3. GROUNDED — reference ATS rules
4. ENCOURAGING — acknowledge strengths while highlighting improvements`;

function buildResumeAnalysisPrompt(resumeText, jobDescription) {
  return `RESUME TEXT TO ANALYZE:
${resumeText}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n\n---` : ""}

TASK: Analyze this resume and provide a comprehensive ATS compatibility assessment.

Return a JSON response with this exact structure:
{
  "overallScore": 85,
  "scores": {
    "formatting": { "score": 90, "feedback": "<specific feedback>" },
    "keywords": { "score": 80, "feedback": "<specific feedback>", "missing": ["<keyword1>", "<keyword2>"] },
    "structure": { "score": 85, "feedback": "<specific feedback>" },
    "impact": { "score": 75, "feedback": "<specific feedback>" },
    "consistency": { "score": 95, "feedback": "<specific feedback>" },
    "relevance": { "score": 85, "feedback": "<specific feedback>" }
  },
  "suggestions": [
    {
      "priority": "high",
      "category": "keywords",
      "issue": "<what's wrong>",
      "suggestion": "<how to fix it>",
      "example": "<example>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "summary": "<2-3 sentence overall assessment>"
}`;
}

async function extractTextFromUrl(pdfUrl) {
  try {
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (err) {
    console.error('Error fetching/parsing PDF:', err.message);
    throw new Error('Could not parse PDF from provided URL');
  }
}

const ResumeFile = require('../models/ResumeFile');

exports.analyzeResume = async (resumeVersionId, resumeFileId, jobDescription, force = false) => {
  let document = null;
  let textToAnalyze = '';

  if (resumeVersionId) {
    document = await ResumeVersion.findById(resumeVersionId);
    if (!document) throw new Error('ResumeVersion not found');
  } else if (resumeFileId) {
    document = await ResumeFile.findById(resumeFileId);
    if (!document) throw new Error('ResumeFile not found');
  } else {
    throw new Error('No resume specified for analysis');
  }

  // Check if an analysis already exists
  const query = resumeVersionId ? { resumeVersionId } : { resumeFileId };
  const existingAnalysis = await ResumeAnalysis.findOne(query);
  if (existingAnalysis && !jobDescription && !force) {
    return existingAnalysis; // If no JD and not forced, just return the cached general analysis
  }

  // If there's already parsed JSON with text, use it.
  if (document.parsedJson && document.parsedJson.text) {
    textToAnalyze = document.parsedJson.text;
  } else if (resumeVersionId && document.content && Object.keys(document.content).length > 0) {
    // It's a builder resume, stringify the JSON content
    textToAnalyze = JSON.stringify(document.content, null, 2);
  } else if (document.pdfUrl || document.fileUrl || document.resumeUrl) {
    // It's an uploaded PDF resume
    const url = document.pdfUrl || document.fileUrl || document.resumeUrl;
    textToAnalyze = await extractTextFromUrl(url);
    if (resumeVersionId) {
      document.parsedJson = { text: textToAnalyze };
      await document.save();
    }
  } else {
    throw new Error('Resume has no content and no URL to analyze.');
  }

  if (textToAnalyze.length < 50) {
    throw new Error("Resume text is too short to analyze.");
  }

  const prompt = buildResumeAnalysisPrompt(textToAnalyze, jobDescription);

  const resumeSchema = {
    type: "object",
    properties: {
      overallScore: { type: "number" },
      scores: {
        type: "object",
        properties: {
          formatting: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
          keywords: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" }, missing: { type: "array", items: { type: "string" } } }, required: ["score", "feedback", "missing"] },
          structure: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
          impact: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
          consistency: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
          relevance: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] }
        },
        required: ["formatting", "keywords", "structure", "impact", "consistency", "relevance"]
      },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            priority: { type: "string", enum: ["high", "medium", "low"] },
            category: { type: "string" },
            issue: { type: "string" },
            suggestion: { type: "string" },
            example: { type: "string" }
          },
          required: ["priority", "category", "issue", "suggestion"]
        }
      },
      strengths: { type: "array", items: { type: "string" } },
      summary: { type: "string" }
    },
    required: ["overallScore", "scores", "suggestions", "strengths", "summary"]
  };

  const analysisData = await aiService.generateJSON(prompt, RESUME_ANALYSIS_SYSTEM, { 
    temperature: 0.3,
    responseSchema: resumeSchema
  });
  
  // Format the result to fit the ResumeAnalysis schema
  // Note: the schema requires atsScore, suggestions (strings), missingKeywords
  const missingKws = analysisData.scores?.keywords?.missing || [];
  const suggestionStrings = analysisData.suggestions.map(
    (s) => `[${s.priority.toUpperCase()}] ${s.category}: ${s.suggestion} (Issue: ${s.issue})`
  );

  let analysisRecord = existingAnalysis;
  if (analysisRecord) {
    analysisRecord.atsScore = analysisData.overallScore;
    analysisRecord.suggestions = suggestionStrings;
    analysisRecord.missingKeywords = missingKws;
    analysisRecord.fullAnalysis = analysisData;
    await analysisRecord.save();
  } else {
    analysisRecord = await ResumeAnalysis.create({
      resumeVersionId,
      resumeFileId,
      atsScore: analysisData.overallScore,
      suggestions: suggestionStrings,
      missingKeywords: missingKws,
      fullAnalysis: analysisData,
    });
  }

  return analysisRecord.toObject();
};
