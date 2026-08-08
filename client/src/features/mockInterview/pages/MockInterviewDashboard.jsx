import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";
import { 
  Play, Mic, Calendar, MessageSquare, Award, AlertCircle, CheckCircle, Sparkles
} from "lucide-react";
import { AppShell } from "../../../components/AppShell";
import { mockTestApi } from "../../../api/mockTestApi";
import { MockTestLobby } from "../components/MockTestLobby";
import { MockTestRunner } from "../components/MockTestRunner";
import { MockTestResults } from "../components/MockTestResults";
import { VoiceInterviewRunner } from "../components/VoiceInterviewRunner";
import { SessionHistoryView } from "../components/SessionHistoryView";

export function MockInterviewDashboard() {
  const { token } = useAuth();
  
  // Tab control: 'mocktest' | 'interview' | 'history'
  const [activeTab, setActiveTab] = useState('mocktest');
  
  // Mock Test State
  const [mockTestMode, setMockTestMode] = useState('lobby'); // 'lobby' | 'runner' | 'results'
  const [quotaState, setQuotaState] = useState(null);
  const [testSession, setTestSession] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [mockTestLoading, setMockTestLoading] = useState(false);
  const [mockTestSubmitting, setMockTestSubmitting] = useState(false);

  // Voice Interview Quota State
  const [voiceQuota, setVoiceQuota] = useState(null);

  const loadQuota = async () => {
    try {
      if (!token) return;
      const data = await mockTestApi.getQuota(token);
      setQuotaState(data);
    } catch (err) {
      console.error('Failed to load mock test quota:', err);
    }
  };

  const loadVoiceQuota = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/ai/interview/quota`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVoiceQuota(data);
      }
    } catch (err) {
      console.error('Failed to load voice quota:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadQuota();
      loadVoiceQuota();
    }
  }, [token]);

  const handleStartMockTest = async (payload) => {
    setMockTestLoading(true);
    try {
      const data = await mockTestApi.generateTest(payload, token);
      setTestSession(data);
      if (data.quotaState) {
        setQuotaState(data.quotaState);
      }
      setMockTestMode('runner');
    } catch (err) {
      console.error('Failed to start mock test:', err);
      alert(err.message || 'Failed to start mock test session.');
    } finally {
      setMockTestLoading(false);
    }
  };

  const handleSubmitMockTest = async (payload) => {
    setMockTestSubmitting(true);
    try {
      const data = await mockTestApi.submitTest(payload, token);
      setTestResult(data);
      setMockTestMode('results');
      loadQuota();
    } catch (err) {
      console.error('Failed to submit mock test:', err);
      alert(err.message || 'Failed to submit mock test.');
    } finally {
      setMockTestSubmitting(false);
    }
  };

  // AI Voice Interview State
  const [company, setCompany] = useState("Google");
  const [round, setRound] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const startInterview = async () => {
    if (voiceQuota && voiceQuota.interviewsRemaining <= 0) {
      alert("You have used all 2 of your free AI Voice Interviews. Review your past session history logs or practice using Mock Tests!");
      return;
    }

    setStarted(true);
    setSessionId(null);
    setEvaluation(null);
    setMessages([]);
    
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to start voice interview.");
      }

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

      let textAccumulator = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        textAccumulator += decoder.decode(value, { stream: true });
      }

      setMessages([{ role: "ai", content: textAccumulator }]);
      loadVoiceQuota();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to start interview session.");
      setStarted(false);
    }
  };

  const sendVoiceMessage = async (messageText, currentHistory = []) => {
    const history = currentHistory.map((m) => ({
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
        message: messageText,
        sessionId: sessionId
      }),
    });

    if (!res.ok) throw new Error("Stream error");

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let textAccumulator = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      textAccumulator += decoder.decode(value, { stream: true });
    }
    return textAccumulator;
  };

  const endAndEvaluateInterview = async (finalMessages = []) => {
    setEvaluating(true);
    setStarted(false);

    try {
      const historyToUse = finalMessages.length > 0 ? finalMessages : messages;
      const historyText = historyToUse.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

      const res = await fetch(`${API_BASE_URL}/api/ai/interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "evaluate",
          company,
          role: "Software Developer",
          round,
          conversationHistory: historyText,
          sessionId: sessionId
        }),
      });

      if (!res.ok) throw new Error("Evaluation error");
      const data = await res.json();
      setEvaluation(data);
      loadVoiceQuota();
    } catch (err) {
      console.error(err);
      alert("Failed to evaluate mock session: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (evaluating) {
    return (
      <AppShell active="interview">
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-bold">Evaluating Placement Readiness...</h2>
          <p className="text-gray-400">Gemini AI is grading your spoken replies against ATS rigor.</p>
        </div>
      </AppShell>
    );
  }

  // Session Grading Evaluation Panel
  if (evaluation) {
    return (
      <AppShell active="interview">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" style={{ padding: '2rem 0' }}>
          <div className="flex justify-between items-center p-6 rounded-xl border border-gray-800" style={{ background: 'var(--bg-secondary)' }}>
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
          
          <button onClick={() => { setEvaluation(null); setMessages([]); setActiveTab('history'); }} className="ct-button w-full">
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
            onClick={() => setActiveTab('mocktest')}
            style={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              padding: '0.5rem 1rem', 
              color: activeTab === 'mocktest' ? '#10b981' : 'var(--text-muted)',
              borderBottom: activeTab === 'mocktest' ? '2.5px solid #10b981' : 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={18} />
            <span>Mock Tests</span>
          </button>
          <button 
            onClick={() => setActiveTab('interview')}
            style={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              padding: '0.5rem 1rem', 
              color: activeTab === 'interview' ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === 'interview' ? '2.5px solid var(--accent-blue)' : 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={18} />
            <span>AI Voice Interview</span>
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={18} />
            <span>Session History</span>
          </button>
        </div>

        {activeTab === 'mocktest' ? (
          /* Mock Tests Tab (Let's Code Styled) */
          <div>
            {mockTestMode === 'lobby' && (
              <MockTestLobby 
                quotaState={quotaState} 
                onStartTest={handleStartMockTest} 
                onRefreshQuota={loadQuota}
                loading={mockTestLoading}
              />
            )}
            {mockTestMode === 'runner' && testSession && (
              <MockTestRunner 
                sessionData={testSession} 
                onSubmitTest={handleSubmitMockTest}
                onCancel={() => setMockTestMode('lobby')}
                submitting={mockTestSubmitting}
              />
            )}
            {mockTestMode === 'results' && testResult && (
              <MockTestResults 
                resultData={testResult} 
                onGoBack={() => setMockTestMode('lobby')}
                onRetake={() => setMockTestMode('lobby')}
              />
            )}
          </div>
        ) : activeTab === 'interview' ? (
          started ? (
            <VoiceInterviewRunner 
              company={company}
              round={round}
              difficulty={difficulty}
              systemPrompt={systemPrompt}
              sessionId={sessionId}
              initialMessage={messages[0]?.content}
              onEndInterview={endAndEvaluateInterview}
              onSendMessage={sendVoiceMessage}
              token={token}
            />
          ) : (
            /* AI Spoken Interview Setup Lobby */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Hero Banner */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  padding: '2.5rem 2rem',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative Grid Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: '#818cf8',
                        marginBottom: '1rem',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Gemini AI Spoken Interview • 10 Min Session Limit</span>
                    </div>

                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                      AI Spoken Placement Interviewer
                    </h2>
                    <p style={{ color: '#a5b4fc', fontSize: '1.05rem', margin: 0, maxWidth: '640px' }}>
                      Simulate real-world technical and HR rounds with company-specific AI interviewers in a hands-free 10-minute voice session
                    </p>
                  </div>

                  {/* Quota Badge Indicator */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '9999px',
                      background: voiceQuota?.interviewsRemaining > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: voiceQuota?.interviewsRemaining > 0 ? '1px solid #10b981' : '1px solid #ef4444',
                      color: voiceQuota?.interviewsRemaining > 0 ? '#34d399' : '#fca5a5',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      boxShadow: voiceQuota?.interviewsRemaining > 0 ? '0 4px 14px rgba(16, 185, 129, 0.2)' : 'none',
                    }}
                  >
                    <Mic size={18} className="animate-pulse" />
                    <span>Free Quota: {voiceQuota?.interviewsRemaining ?? 2}/2 Remaining</span>
                  </div>
                </div>
              </div>

              {/* Main Setup Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {/* Left Form Panel */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  
                  {/* 1. Target Company Cards */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.85rem' }}>
                      Select Target Company
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                      {[
                        { name: "Google", tag: "Tech Giant", color: "#4285F4", bg: "rgba(66, 133, 244, 0.15)", icon: "G" },
                        { name: "Microsoft", tag: "Software & Cloud", color: "#00a4ef", bg: "rgba(0, 164, 239, 0.15)", icon: "MS" },
                        { name: "Amazon", tag: "Scale & Leadership", color: "#ff9900", bg: "rgba(255, 153, 0, 0.15)", icon: "AMZ" },
                        { name: "TCS", tag: "IT Services & Fundamentals", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", icon: "TCS" },
                        { name: "Infosys", tag: "Core Engineering", color: "#0284c7", bg: "rgba(2, 132, 199, 0.15)", icon: "INF" },
                        { name: "Adobe", tag: "Algorithms & OOPs", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.15)", icon: "ADB" },
                      ].map((c) => {
                        const isSelected = company === c.name;
                        return (
                          <div
                            key={c.name}
                            onClick={() => setCompany(c.name)}
                            style={{
                              background: isSelected ? 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, #0f172a 100%)' : '#0f172a',
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #1e293b',
                              borderRadius: '12px',
                              padding: '1rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.85rem',
                              boxShadow: isSelected ? '0 8px 20px -4px rgba(59, 130, 246, 0.3)' : 'none',
                            }}
                          >
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: c.bg,
                                color: c.color,
                                fontWeight: '800',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {c.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.name}
                              </h4>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.tag}</span>
                            </div>
                            {isSelected && (
                              <CheckCircle size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Interview Round Pills */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.85rem' }}>
                      Select Interview Round
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      {[
                        { name: "Technical", icon: "⚡", desc: "DSA & Coding" },
                        { name: "HR", icon: "🤝", desc: "Culture Fit" },
                        { name: "System Design", icon: "🏗️", desc: "Architecture" },
                        { name: "Behavioral", icon: "🌟", desc: "STAR Method" },
                      ].map((r) => {
                        const isSelected = round === r.name;
                        return (
                          <div
                            key={r.name}
                            onClick={() => setRound(r.name)}
                            style={{
                              background: isSelected ? 'rgba(99, 102, 241, 0.18)' : '#0f172a',
                              border: isSelected ? '2px solid #6366f1' : '1px solid #1e293b',
                              borderRadius: '12px',
                              padding: '0.9rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '4px' }}>{r.icon}</span>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: isSelected ? '#ffffff' : '#cbd5e1', margin: '0 0 2px 0' }}>
                              {r.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Difficulty Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.85rem' }}>
                      Select Difficulty
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      {[
                        { name: "Easy", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
                        { name: "Medium", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
                        { name: "Hard", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
                      ].map((d) => {
                        const isSelected = difficulty === d.name;
                        return (
                          <button
                            key={d.name}
                            onClick={() => setDifficulty(d.name)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '10px',
                              border: isSelected ? `2px solid ${d.color}` : '1px solid #1e293b',
                              background: isSelected ? d.bg : '#0f172a',
                              color: isSelected ? d.color : '#cbd5e1',
                              fontWeight: '700',
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {d.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={startInterview}
                    disabled={voiceQuota && voiceQuota.interviewsRemaining <= 0}
                    style={{
                      padding: '1.1rem 2rem',
                      borderRadius: '12px',
                      background: voiceQuota && voiceQuota.interviewsRemaining <= 0
                        ? '#334155'
                        : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '1.1rem',
                      border: 'none',
                      cursor: voiceQuota && voiceQuota.interviewsRemaining <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: voiceQuota && voiceQuota.interviewsRemaining <= 0 ? 'none' : '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <Play size={20} fill="#ffffff" />
                    <span>
                      {voiceQuota && voiceQuota.interviewsRemaining <= 0
                        ? 'Free Quota Limit Reached (2/2)'
                        : `Launch 10-Min ${company} ${round} Voice Interview`}
                    </span>
                  </button>
                </div>

                {/* Right Protocol / Info Panel */}
                <div style={{ gridColumn: 'span 4' }}>
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
                      <Award size={20} />
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>
                        Hands-Free Voice Protocol
                      </h4>
                    </div>

                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      <li>
                        <strong style={{ color: '#f1f5f9' }}>Spoken AI Output:</strong> The interviewer speaks questions and feedback out loud using speech synthesis.
                      </li>
                      <li>
                        <strong style={{ color: '#f1f5f9' }}>Hands-Free Verbal Response:</strong> Tap microphone to speak your answer verbally—no typing required!
                      </li>
                      <li>
                        <strong style={{ color: '#f1f5f9' }}>Strict 10-Min Session:</strong> Sessions auto-complete at 10:00 limit with strict ATS performance evaluation.
                      </li>
                      <li>
                        <strong style={{ color: '#f1f5f9' }}>2 Free Interviews:</strong> Each student account receives 2 free full AI voice interview simulations.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Historical Logs (Session History View) */
          <SessionHistoryView token={token} />
        )}
      </div>
    </AppShell>
  );
}
