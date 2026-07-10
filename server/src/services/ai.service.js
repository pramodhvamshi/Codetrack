const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const { jsonrepair } = require('jsonrepair');
const config = require('../config/env');

const genAI = new GoogleGenerativeAI(config.geminiApiKey || process.env.GEMINI_API_KEY || '');
const GENERATION_MODEL = "gemini-2.5-flash"; // Fallback to standard 2.5-flash if lite isn't available

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

async function generateText(prompt, systemInstruction = '', options = {}) {
  const model = genAI.getGenerativeModel({
    model: GENERATION_MODEL,
    safetySettings,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      responseMimeType: options.responseMimeType,
      responseSchema: options.responseSchema,
    },
  });

  let retries = 3;
  let delay = 1000;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      retries--;
      const status = err.status || (err.message && err.message.includes("503") ? 503 : 0);
      const isTransient = status === 503 || status === 429 || 
        (err.message && (
          err.message.includes("demand") || 
          err.message.includes("rate limit") || 
          err.message.includes("exhausted") ||
          err.message.includes("Service Unavailable") ||
          err.message.includes("Too Many Requests")
        ));
      
      if (retries === 0 || !isTransient) {
        throw err;
      }
      console.warn(`Gemini generation transient error (status ${status}). Retrying in ${delay}ms... remaining retries: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed after retries");
}

function cleanJsonString(str) {
  let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  
  try {
    cleaned = jsonrepair(cleaned);
  } catch (repairErr) {
    console.warn("jsonrepair was unable to repair string. Error:", repairErr.message);
  }
  
  cleaned = cleaned.replace(/,(\s*[\]}])/g, "$1");
  return cleaned;
}

async function generateJSON(prompt, systemInstruction = '', options = {}) {
  const text = await generateText(prompt, systemInstruction, {
    ...options,
    responseMimeType: "application/json",
  });

  let jsonString = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  const cleaned = cleanJsonString(jsonString);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parsing failed. Error:", err.message);
    throw new Error(`Failed to parse Gemini response as JSON: ${err.message}`);
  }
}

function createChatSession(systemInstruction, history = []) {
  const model = genAI.getGenerativeModel({
    model: GENERATION_MODEL,
    safetySettings,
    systemInstruction,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
    },
  });

  return model.startChat({ history });
}

module.exports = {
  generateText,
  generateJSON,
  createChatSession
};
