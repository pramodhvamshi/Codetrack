import React, { useState, useEffect, useRef } from "react";
import { api, API_BASE_URL } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";
import { 
  Play, Square, Mic, MicOff, Clock, Calendar, ChevronRight, 
  MessageSquare, Award, AlertCircle, RefreshCw, X, ChevronDown, ChevronUp, CheckCircle
} from "lucide-react";
import { AppShell } from "../../../components/AppShell";

const codeTemplates = {
  javascript: `// JavaScript Scratchpad\n\nfunction solve(input) {\n  // Write your solution here\n  console.log("Input:", input);\n  return null;\n}\n\nconst result = solve("test");\nconsole.log("Result:", result);`,
  python: `# Python Scratchpad\n\ndef solve(input_val):\n    # Write your solution here\n    print(f"Input: {input_val}")\n    return None\n\nresult = solve("test")\nprint(f"Result: {result}")`,
  cpp: `// C++ Scratchpad\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve(string input) {\n        cout << "Input: " << input << endl;\n    }\n};\n\nint main() {\n    Solution s;\n    s.solve("test");\n    return 0;\n}`,
  java: `// Java Scratchpad\nimport java.util.*;\n\npublic class Solution {\n    public static void solve(String input) {\n        System.out.println("Input: " + input);\n    }\n\n    public static void main(String[] args) {\n        solve("test");\n    }\n}`
};

export function MockInterviewDashboard() {
  const { token } = useAuth();
  
  // Tab control: 'lobby' | 'history'
  const [activeTab, setActiveTab] = useState('lobby');
  
  const [company, setCompany] = useState("Google");
  const [round, setRound] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  
  const [isListening, setIsListening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  
  const [code, setCode] = useState(codeTemplates.javascript);
  const [codeLang, setCodeLang] = useState("javascript");
  const [recognition, setRecognition] = useState(null);

  // History states
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Detail overlay state
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);

  const messagesRef = useRef([]);
  const chatEndRef = useRef(null);
  const accumulatedTextRef = useRef("");
  
  // Real-time scrolling
  useEffect(() => {
    messagesRef.current = messages;
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // STT Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN";
        
        rec.onresult = (event) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInput(prev => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
            });
          }
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        setRecognition(rec);
      }
    }
  }, []);

  // Timer
  useEffect(() => {
    let interval = null;
    if (started && !evaluating && !evaluation) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            endAndEvaluateInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started, evaluating, evaluation]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await api.getJson('/ai/interview/history', token);
      setHistoryList(data);
    } catch (err) {
      console.error(err);
      setHistoryError("Failed to load interview history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startInterview = async () => {
    setStarted(true);
    setSessionId(null);
    setEvaluation(null);
    setMessages([]);
    setThinking(true);
    setTimeLeft(1800);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "start",
          company,
          role: "Software Developer",
          round,
          difficulty,
        }),
      });

      if (!res.ok) throw new Error("Failed to start interview.");

      const systemPromptBase64 = res.headers.get("x-system-prompt");
      const systemPromptStr = systemPromptBase64 ? atob(systemPromptBase64) : "";
      setSystemPrompt(systemPromptStr);

      const dbSessionId = res.headers.get("x-session-id");
      if (dbSessionId) {
        setSessionId(dbSessionId);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Stream error");

      setMessages([{ role: "ai", content: "" }]);
      setThinking(false);

      let textAccumulator = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        textAccumulator += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const list = [...prev];
          list[list.length - 1] = { ...list[list.length - 1], content: textAccumulator };
          return list;
        });
      }
    } catch (err) {
      console.error(err);
      setStarted(false);
    } finally {
      setThinking(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || thinking) return;

    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const res = await fetch(`${API_BASE_URL}/api/ai/interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "message",
          systemPrompt,
          history,
          message: input,
          sessionId: sessionId
        }),
      });

      if (!res.ok) throw new Error("Stream error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      setMessages((prev) => [...prev, { role: "ai", content: "" }]);
      setThinking(false);

      let textAccumulator = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        textAccumulator += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const list = [...prev];
          list[list.length - 1] = { ...list[list.length - 1], content: textAccumulator };
          return list;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setThinking(false);
    }
  };

  const endAndEvaluateInterview = async () => {
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }

    setEvaluating(true);
    setStarted(false);

    try {
      const historyText = messagesRef.current.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

      const data = await api.postJson('/ai/interview', {
        action: "evaluate",
        company,
        role: "Software Developer",
        round,
        conversationHistory: historyText,
        sessionId: sessionId
      }, token);

      setEvaluation(data);
    } catch (err) {
      console.error(err);
      alert("Failed to evaluate mock session: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // View details of previous session
  const viewSessionDetails = async (sess) => {
    setSelectedHistorySession(sess);
    setDetailLoading(true);
    setSessionDetails(null);
    try {
      const data = await api.getJson(`/ai/interview/details/${sess._id}`, token);
      setSessionDetails(data);
    } catch (err) {
      console.error(err);
      alert("Could not load details of this interview.");
    } finally {
      setDetailLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--accent-red)';
  };

  if (evaluating) {
    return (
      <AppShell active="interview">
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-bold">Evaluating Placement Readiness...</h2>
          <p className="text-gray-400">Gemini is grading your replies against ATS rigor.</p>
        </div>
      </AppShell>
    );
  }

  // Active Session View
  if (started) {
    return (
      <AppShell active="interview">
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div>
            <h3 className="font-bold text-lg text-gray-200">{company} — {round} Round</h3>
            <p className="text-xs text-gray-400">Level: {difficulty} • Role: Software Developer</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-lg font-semibold">
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
            <button onClick={endAndEvaluateInterview} className="ct-button" style={{ backgroundColor: 'var(--accent-red)' }}>
              Finish & Evaluate
            </button>
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)' }}>
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${m.role === 'ai' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-gray-700/30 text-gray-300 border border-gray-600/30'}`}>
                {m.role === 'ai' ? 'AI' : 'ME'}
              </div>
              <div className={`max-w-[75%] rounded-2xl p-4 ${m.role === 'ai' ? 'bg-gray-800/40 text-gray-200 border border-gray-700/30' : 'bg-blue-900/20 text-gray-200 border border-blue-800/40'}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">AI</div>
              <div className="bg-gray-800/40 rounded-2xl p-4 flex items-center gap-2 border border-gray-700/30">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Dock */}
        <div className="p-4 border-t border-gray-800" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex gap-3">
            <button 
              onClick={toggleListening} 
              className={`p-3 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'}`}
            >
              {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isListening ? "Listening..." : "Type your response and press Enter..."}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-3 text-white resize-none text-sm focus:border-blue-500 outline-none"
              rows={1}
            />
            <button onClick={sendMessage} disabled={!input.trim() || thinking} className="ct-button px-6">
              Send
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

  // Session Grading Evaluation Panel (Direct finish review)
  if (evaluation) {
    return (
      <AppShell active="interview">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center p-6 rounded-xl border border-gray-800" style={{ background: 'var(--grad-score)' }}>
          <div>
            <h1 className="text-2xl font-black text-gray-100">Grade Assessment</h1>
            <p className="text-sm text-gray-400">{company} • {round} Round • SDE Preparation</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-blue-400">{evaluation.overallScore}/100</div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Placement Readiness</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-800/30 p-5 rounded-xl border-l-4 border-green-500 border-t border-r border-b border-gray-800">
            <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2"><CheckCircle size={18} /> Strengths</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {evaluation.strengths?.map((s, i) => <li key={i} className="flex gap-2"><span>•</span>{s}</li>)}
            </ul>
          </div>
          <div className="bg-gray-800/30 p-5 rounded-xl border-l-4 border-yellow-500 border-t border-r border-b border-gray-800">
            <h3 className="font-bold text-yellow-500 mb-3 flex items-center gap-2"><AlertCircle size={18} /> Focus & Improvement Areas</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {evaluation.improvements?.map((s, i) => <li key={i} className="flex gap-2"><span>•</span>{s}</li>)}
            </ul>
          </div>
        </div>

        <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-800">
          <h3 className="font-bold text-gray-200 mb-3">Overall Evaluator Summary</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{evaluation.summary}</p>
        </div>
        
        <button onClick={() => { setEvaluation(null); setMessages([]); loadHistory(); }} className="ct-button w-full">
          Return to Interview Center
        </button>
      </div>
    </AppShell>
  );
  }

  // Dashboard configuration lobby & list
  return (
    <AppShell active="interview">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1.5rem', paddingBottom: '0.2rem' }}>
        <button 
          onClick={() => setActiveTab('lobby')}
          style={{ 
            fontSize: '1rem', 
            fontWeight: 600,
            padding: '0.5rem 1rem', 
            color: activeTab === 'lobby' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'lobby' ? '2.5px solid var(--accent-blue)' : 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
        >
          Prepare & Start
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            fontSize: '1rem', 
            fontWeight: 600,
            padding: '0.5rem 1rem', 
            color: activeTab === 'history' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2.5px solid var(--accent-blue)' : 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
        >
          Session History
        </button>
      </div>

      {activeTab === 'lobby' ? (
        /* Configuration Lobby (PlacementPlot layout) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="ct-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f3f4f6' }}>AI Mock Interview</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tailor AI interviewers to simulate real-world company rounds</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Target Company</label>
                  <div className="flex flex-wrap gap-2">
                    {["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Adobe"].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setCompany(opt)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${company === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Interview Round</label>
                  <div className="flex flex-wrap gap-2">
                    {["Technical", "HR", "System Design", "Behavioral"].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setRound(opt)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${round === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Difficulty</label>
                  <div className="flex flex-wrap gap-2">
                    {["Easy", "Medium", "Hard"].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setDifficulty(opt)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${difficulty === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={startInterview}
                  className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  <Play size={18} fill="currentColor" /> Start Interview Prep
                </button>
              </div>
            </div>
          </div>

          {/* Quick tips panel */}
          <div className="space-y-6">
            <div className="ct-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f3f4f6', fontWeight: 700 }} className="flex items-center gap-2"><Award size={16} /> Placement Assessment Tips</h4>
              <ul className="text-xs space-y-3 text-gray-400 leading-relaxed list-disc pl-4">
                <li>Speak clearly and describe your step-by-step logic out loud.</li>
                <li>Write code in the scratchpad if requested and paste it directly.</li>
                <li>Avoid giving single-word answers like "yes" or "ok"—this will result in a lower placement evaluation score.</li>
                <li>Complete the interview until final evaluation to capture detail logs.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Historical Logs (Previous Sessions) */
        <div className="space-y-4">
          {historyLoading ? (
            <div className="space-y-3">
              <div style={{ height: '70px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '70px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '70px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : historyError ? (
            <div className="ct-card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={32} color="var(--accent-red)" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-muted)' }}>{historyError}</p>
              <button onClick={loadHistory} className="ct-button-secondary"><RefreshCw size={14} /> Retry</button>
            </div>
          ) : historyList.length === 0 ? (
            <div className="ct-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 1.5rem auto', opacity: 0.3 }} />
              <p>No mock interviews recorded yet. Head over to "Prepare & Start" to run your first session.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {historyList.map((session) => (
                <div 
                  key={session._id} 
                  className="ct-card hover-lift"
                  style={{ 
                    padding: '1.25rem 1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '1px solid var(--border)' 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f3f4f6', fontWeight: 700 }}>{session.company} — {session.round}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Role: {session.role} • Level: {session.difficulty} • Date: {new Date(session.startTime).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {session.feedback ? (
                      <div className="text-right">
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(session.feedback.overallScore) }}>
                          {session.feedback.overallScore}/100
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assessment Score</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        Incomplete
                      </span>
                    )}

                    <button 
                      onClick={() => viewSessionDetails(session)} 
                      className="ct-button-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      Review details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL OVERLAY POPUP */}
      {selectedHistorySession && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '950px', height: '85vh', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            {/* Overlay Header */}
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f3f4f6', fontWeight: 800 }}>Interview Review Session</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedHistorySession.company} • {selectedHistorySession.round} Round • SDE Simulation
                </p>
              </div>
              <button onClick={() => setSelectedHistorySession(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            {/* Overlay Body Content */}
            {detailLoading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', itemsCenter: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span>Loading transcript and grading logs...</span>
              </div>
            ) : sessionDetails ? (
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Left Side: Transcript */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Chat Transcript</h4>
                  
                  {sessionDetails.messages.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No messages recorded.</p>
                  ) : (
                    sessionDetails.messages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: msg.role === 'ai' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.06)',
                          color: msg.role === 'ai' ? 'var(--accent-blue)' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>
                          {msg.role === 'ai' ? 'AI' : 'ME'}
                        </div>
                        <div style={{
                          maxWidth: '78%', padding: '0.75rem 1rem', borderRadius: '12px',
                          background: msg.role === 'ai' ? 'rgba(255,255,255,0.02)' : 'rgba(59,130,246,0.05)',
                          border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(59,130,246,0.1)',
                          color: '#e5e7eb', fontSize: '0.85rem', lineHeight: 1.5
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Side: Feedback Metrics */}
                <div style={{ width: '400px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-secondary)' }}>
                  
                  {/* Overall score */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL GRADE</span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.2rem 0', color: sessionDetails.feedback ? getScoreColor(sessionDetails.feedback.overallScore) : 'var(--text-muted)' }}>
                      {sessionDetails.feedback ? `${sessionDetails.feedback.overallScore}/100` : 'Grading Pending'}
                    </h2>
                  </div>

                  {/* Category sliders */}
                  {sessionDetails.feedback && sessionDetails.feedback.categories && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skill Assessment</h4>
                      
                      {Object.entries(sessionDetails.feedback.categories).map(([categoryName, scoreValue]) => {
                        const score = Number(scoreValue);
                        // Clean category labels
                        const formattedLabel = categoryName
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase());
                        
                        return (
                          <div key={categoryName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ color: '#d1d5db' }}>{formattedLabel}</span>
                              <span style={{ fontWeight: 'bold', color: getScoreColor(score) }}>{score}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), borderRadius: '3px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tips list */}
                  {sessionDetails.feedback && sessionDetails.feedback.tips && (
                    <div>
                      <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Areas to Improve</h4>
                      <ul style={{ paddingLeft: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#9ca3af', listStyleType: 'disc' }}>
                        {sessionDetails.feedback.tips.map((tip, idx) => (
                          <li key={idx} style={{ lineHeight: 1.4 }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No details could be retrieved.
              </div>
            )}

          </div>
        </div>
      )}

      </div>
    </AppShell>
  );
}
