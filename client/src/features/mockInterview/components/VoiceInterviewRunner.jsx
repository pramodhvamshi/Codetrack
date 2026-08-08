import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Clock, Square, Send, Sparkles, AlertCircle, RefreshCw, CheckCircle, Shield
} from 'lucide-react';

export function VoiceInterviewRunner({
  company = 'Google',
  round = 'Technical',
  difficulty = 'Medium',
  systemPrompt,
  sessionId,
  initialMessage = '',
  onEndInterview,
  onSendMessage,
  token,
}) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: initialMessage || `Welcome to your ${company} ${round} interview. Let's begin!` }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [thinking, setThinking] = useState(false);

  // 10 Minute Timer (600 Seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat log
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinking]);

  // 10-Minute Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech Synthesis (TTS) - AI Speaks Out Loud
  const speakText = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isMuted) return;

    window.speechSynthesis.cancel(); // stop previous speech

    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speak initial message if present
  useEffect(() => {
    if (initialMessage) {
      speakText(initialMessage);
    }
  }, [initialMessage]);

  const accumulatedTranscriptRef = useRef('');
  const [micError, setMicError] = useState(null);

  // Web Speech Recognition (STT) - User Speaks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + transcriptPart.trim();
            } else {
              interim += transcriptPart;
            }
          }
          const fullText = (accumulatedTranscriptRef.current + ' ' + interim).trim();
          if (fullText) {
            setTranscriptInput(fullText);
          }
        };

        rec.onerror = (err) => {
          console.warn('Speech recognition event warning:', err.error || err);
          if (err.error === 'no-speech') {
            // Ignore silence timeout, keep listening if intended
            return;
          }
          if (err.error === 'not-allowed' || err.error === 'audio-capture') {
            setMicError('Microphone permission blocked. Please allow mic access or type your answers below.');
            setIsListening(false);
          }
        };

        rec.onend = () => {
          // If still marked as listening and no error, auto-restart to maintain continuous listening
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              setIsListening(false);
            }
          }
        };

        recognitionRef.current = rec;
      } else {
        setMicError('Speech recognition is not natively supported in this browser. You can type your responses below.');
      }
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    setMicError(null);
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your answers below.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      // Stop AI speech if user starts talking
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
      }
      try {
        accumulatedTranscriptRef.current = transcriptInput;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 200);
        } catch (err2) {
          setIsListening(false);
        }
      }
    }
  };

  const handleSendSpokenResponse = async () => {
    const textToSend = transcriptInput.trim();
    if (!textToSend || thinking) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setTranscriptInput('');
    accumulatedTranscriptRef.current = '';
    setThinking(true);

    try {
      const responseText = await onSendMessage(textToSend, messages);
      if (responseText) {
        const aiMsg = { role: 'ai', content: responseText };
        setMessages((prev) => [...prev, aiMsg]);
        speakText(responseText);
      }
    } catch (err) {
      console.error('Send voice response error:', err);
    } finally {
      setThinking(false);
    }
  };

  const handleFinishInterview = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    onEndInterview(messages);
  };

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        background: '#090d16',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        padding: '2rem',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: '620px',
      }}
    >
      {/* ── INTERVIEW HEADER ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#3b82f6',
                color: '#fff',
                textTransform: 'uppercase',
              }}
            >
              {company}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              {round} Interview
            </h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Level: {difficulty} • Voice-to-Voice AI Interviewer
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Mute/Unmute AI Voice Button */}
          <button
            onClick={() => {
              setIsMuted((prev) => !prev);
              if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
              }
            }}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: isMuted ? '#ef4444' : '#34d399',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? 'Muted' : 'Voice On'}</span>
          </button>

          {/* 10 Min Timer */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: timeLeft < 120 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: timeLeft < 120 ? '1px solid #ef4444' : '1px solid #3b82f6',
              color: timeLeft < 120 ? '#fca5a5' : '#60a5fa',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'monospace',
            }}
          >
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleFinishInterview}
            style={{
              background: '#e11d48',
              color: '#fff',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Square size={14} fill="#fff" />
            <span>End & Evaluate</span>
          </button>
        </div>
      </div>

      {/* ── CHAT DIALOG LOG ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        {messages.map((msg, idx) => {
          const isAi = msg.role === 'ai';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: isAi ? 'flex-start' : 'flex-end',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '1rem 1.25rem',
                  borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  background: isAi ? '#131c2e' : '#1d4ed8',
                  border: isAi ? '1px solid #1e293b' : 'none',
                  color: '#fff',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: isAi ? '#38bdf8' : '#93c5fd',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {isAi ? `${company} AI Interviewer` : 'You (Candidate)'}
                </div>
                <div>{msg.content}</div>
              </div>
            </div>
          );
        })}

        {thinking && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '16px 16px 16px 4px',
                background: '#131c2e',
                border: '1px solid #1e293b',
                color: '#94a3b8',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} className="animate-spin" color="#38bdf8" />
              <span>Evaluating your reply & framing next question...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── VOICE INTERACTION CONTROL PANEL (NO TYPING NEEDED) ── */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
        }}
      >
        {/* Animated Voice Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAiSpeaking ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#34d399',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                }}
              >
                <span className="animate-pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} />
                <span>AI Interviewer Speaking...</span>
              </div>
            ) : isListening ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                }}
              >
                <span className="animate-ping" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span>Listening to your spoken answer...</span>
              </div>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Tap Microphone to Speak Your Answer
              </span>
            )}
          </div>
        </div>

        {/* Live Spoken Transcript Preview */}
        <div
          style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            minHeight: '48px',
            color: transcriptInput ? '#f8fafc' : '#64748b',
            fontSize: '0.95rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {transcriptInput || (isListening ? 'Speak now... your words will appear here...' : 'Your spoken words will appear here...')}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={toggleListening}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.85rem 2rem',
              borderRadius: '9999px',
              background: isListening ? '#ef4444' : '#3b82f6',
              color: '#fff',
              border: 'none',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 4px 14px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isListening ? 'Stop Listening' : 'Tap to Speak Answer'}</span>
          </button>

          <button
            disabled={!transcriptInput.trim() || thinking}
            onClick={handleSendSpokenResponse}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.85rem 1.75rem',
              borderRadius: '9999px',
              background: !transcriptInput.trim() || thinking ? '#1e293b' : '#10b981',
              color: !transcriptInput.trim() || thinking ? '#64748b' : '#022c22',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: !transcriptInput.trim() || thinking ? 'not-allowed' : 'pointer',
            }}
          >
            <span>Send Verbal Answer</span>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
