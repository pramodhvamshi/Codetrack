import React, { useState, useEffect } from 'react';
import { api, API_BASE_URL } from '../../../api/client';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle, Activity, FileText } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';

export function ATSAnalysisTab({ targetId, targetType = 'version' }) {
  const { token } = useAuth();
  const [fullAnalysis, setFullAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (targetId) {
      fetchLatestAnalysis();
    }
  }, [targetId, targetType]);

  const fetchLatestAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = targetType === 'version' ? { resumeVersionId: targetId } : { resumeFileId: targetId };
      const result = await api.postJson('/ai/resume/analyze', payload, token);
      if (result && result.fullAnalysis) {
        setFullAnalysis(result);
      } else {
        setFullAnalysis(null);
      }
    } catch (err) {
      console.error("Failed to fetch analysis", err);
      // Optional: don't show huge errors if it just doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      setError(null);
      const payload = targetType === 'version' ? { resumeVersionId: targetId } : { resumeFileId: targetId };
      payload.force = true;
      const result = await api.postJson('/ai/resume/analyze', payload, token);
      if (result && result.fullAnalysis) {
        setFullAnalysis(result);
      }
    } catch (err) {
      setError(err.message || "Failed to analyze. Did you set your GEMINI_API_KEY?");
    } finally {
      setLoading(false);
    }
  };

  if (!targetId) {
    return (
      <div className="ct-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a resume to analyze.</p>
      </div>
    );
  }

  if (loading && !fullAnalysis) {
    return (
      <div className="ct-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }} />
        <p>Loading your ATS analysis...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div className="ct-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="var(--accent-green)" size={24} /> ATS Intelligence Report
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Deep analysis of your resume format, impact, and keywords for placement readiness.
          </p>
        </div>
        <button 
          className="ct-button"
          disabled={loading}
          onClick={handleRunAnalysis}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Activity size={16} />}
          {fullAnalysis ? 'Re-Analyze Resume' : 'Run Full ATS Scan'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: '8px', color: '#fca5a5' }}>
          <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
          <strong>Analysis Failed:</strong> {error}
        </div>
      )}

      {fullAnalysis && fullAnalysis.fullAnalysis ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Top Score Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.2rem' }}>
            
            <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <div className="score-circle" style={{ width: '120px', height: '120px', fontSize: '2.5rem', borderWidth: '6px', borderColor: fullAnalysis.atsScore >= 80 ? 'var(--accent-green)' : (fullAnalysis.atsScore >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)') }}>
                {fullAnalysis.atsScore}
              </div>
              <h3 style={{ marginTop: '1rem', marginBottom: '0.2rem' }}>Overall Score</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date(fullAnalysis.updatedAt).toLocaleString()}
              </span>
            </div>

            <div className="ct-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Category Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {Object.entries(fullAnalysis.fullAnalysis.scores || {}).map(([key, data]) => (
                  <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{key}</strong>
                      <span style={{ color: data.score >= 80 ? 'var(--accent-green)' : 'var(--accent-orange)', fontWeight: 'bold' }}>{data.score}/100</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.feedback}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Keywords & Strengths */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div className="ct-card">
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} color="var(--accent-red)" /> Missing Keywords
              </h3>
              {fullAnalysis.missingKeywords?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {fullAnalysis.missingKeywords.map(kw => (
                    <span key={kw} style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your keyword coverage is excellent!</p>
              )}
            </div>

            <div className="ct-card">
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="var(--accent-green)" /> Key Strengths
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {fullAnalysis.fullAnalysis.strengths?.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="ct-card">
            <h3 style={{ margin: '0 0 1rem 0' }}>Actionable Suggestions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {fullAnalysis.fullAnalysis.suggestions?.map((sug, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `4px solid ${sug.priority === 'high' ? 'var(--accent-red)' : (sug.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-blue)')}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{sug.category.toUpperCase()}: {sug.issue}</strong>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{sug.priority} Priority</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    {sug.suggestion}
                  </div>
                  {sug.example && (
                    <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <strong>Example:</strong> {sug.example}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="ct-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <FileText size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No Analysis Found</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Run a full ATS scan to get deep insights into your resume's formatting, keywords, and impact.
          </p>
          <button className="ct-button" onClick={handleRunAnalysis} disabled={loading}>
            {loading ? 'Scanning...' : 'Scan Resume Now'}
          </button>
        </div>
      )}
    </div>
  );
}
