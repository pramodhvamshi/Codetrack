import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { api } from '../api/client';
import { X, AlertTriangle, RefreshCw, Trophy, Target, Calendar, ChevronRight, ChevronDown, CheckCircle, Flame, Star, BookOpen, GraduationCap, Layout, Activity, Award, Code, Server, Check, TrendingUp } from 'lucide-react';
import '../styles/AnalyticsModal.css';

const METRIC_CONFIG = {
  'solved': Trophy,
  'rating': Star,
  'streak': Flame,
  'contest': Activity,
  'level': Target,
  'book': BookOpen,
  'cgpa': GraduationCap,
  'projects': Layout,
  'dsa': Code,
  'rank': Award,
  'badge': Award,
  'certification': CheckCircle,
  'default': Check
};

const getIcon = (keyword) => {
  const Icon = METRIC_CONFIG[keyword] || METRIC_CONFIG['default'];
  return <Icon size={20} color="currentColor" />;
};

const formatNum = (val) => {
  if (val == null || isNaN(val)) return val;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
};

const AnalyticsModal = ({ isOpen, onClose, reportType }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  
  // As requested: breakdown OPEN by default, others CLOSED
  const [expanded, setExpanded] = useState({
    breakdown: true,
    history: false,
    suggestions: false
  });

  const [showFormula, setShowFormula] = useState({});

  const modalRef = useRef(null);

  // Accessibility: Escape key and Focus Trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // prevent background scrolling
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && reportType) {
      fetchAnalytics();
      setExpanded({ breakdown: true, history: false, suggestions: false });
      setShowFormula({});
    }
  }, [isOpen, reportType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getJson(`/student/analytics/${reportType}`);
      if (typeof res === 'string' || !res.metadata) {
        throw new Error('Received malformed response from server.');
      }
      setReport(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      let msg = err.message || 'Failed to load analytics data.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed.message) msg = parsed.message;
        if (parsed.error) msg = parsed.error;
      } catch (e) {}
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFormula = (index) => {
    setShowFormula(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="am-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div className="am-modal" onClick={e => e.stopPropagation()} ref={modalRef} tabIndex="-1">
        {/* HEADER */}
        <div className="am-header">
          {report && report.summary ? (
            <div className="am-headerContent">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {report.summary.platformIcon && <img src={report.summary.platformIcon} alt="Icon" className="am-headerIcon" />}
                <div>
                  <h2 id="modal-title" style={{ color: report.summary.color || 'var(--text-main)' }}>{report.summary.title} Analytics</h2>
                  <div className="am-headerSubtitle">
                    {report.summary.studentName} <span className="am-username">@{report.summary.username}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="am-closeBtn" aria-label="Close modal"><X size={24} /></button>
            </div>
          ) : (
            <div className="am-headerContent">
              <h2 id="modal-title">Analytics Report</h2>
              <button onClick={onClose} className="am-closeBtn" aria-label="Close modal"><X size={24} /></button>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="am-body">
          {loading ? (
            <div className="am-reportContainer">
              <div className="am-skeleton am-skelHero"></div>
              <div className="am-skelGrid">
                <div className="am-skeleton am-skelCard"></div>
                <div className="am-skeleton am-skelCard"></div>
                <div className="am-skeleton am-skelCard"></div>
                <div className="am-skeleton am-skelCard"></div>
              </div>
              <div className="am-skeleton am-skelBreakdown"></div>
              <div className="am-skeleton am-skelBreakdown"></div>
            </div>
          ) : error ? (
            <div className="am-errorState">
              <AlertTriangle size={48} color="var(--accent-red)" />
              <h3>Couldn't load analytics.</h3>
              <p>{error}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={fetchAnalytics} className="ct-btn-primary">Retry</button>
                <button onClick={onClose} className="ct-btn-outline">Close</button>
              </div>
            </div>
          ) : report && report.metadata ? (
            !report.summary.lastSynced ? (
              <div className="am-emptyState" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                  <TrendingUp size={48} color={report.summary.color || 'var(--text-muted)'} opacity={0.5} />
                </div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Analytics Unavailable</h3>
                <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>Detailed analytics will be generated automatically after your first successful profile sync.</p>
              </div>
            ) : (
            <div className="am-reportContainer">
              
              {/* 1. HERO SECTION (COMPACT) */}
              <div className="am-heroSection" style={{ borderLeft: `3px solid ${report.summary.color || '#fff'}` }}>
                <div className="am-heroTop">
                  <div className="am-heroLeft">
                    <h3>Final Score</h3>
                    <div className="am-heroScore">
                      <span style={{ color: report.summary.color }}>{formatNum(report.summary.finalScore) ?? 'Unavailable'}</span>
                      <span className="am-heroMax">/ {report.summary.maxScore ?? 100}</span>
                    </div>
                  </div>
                  {report.summary.label && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {report.summary.label}
                    </div>
                  )}
                </div>
                <div className="am-heroProgressBar">
                  <div 
                    className="am-heroProgressFill" 
                    style={{ 
                      width: `${Math.min(100, Math.round(((report.summary.finalScore || 0) / (report.summary.maxScore || 100)) * 100))}%`, 
                      background: report.summary.color 
                    }} 
                  />
                </div>
              </div>

              {/* 2. CURRENT PERFORMANCE (COMPRESSED) */}
              {report.metrics && report.metrics.length > 0 && (
                <div>
                  <h3 className="am-sectionTitle">Current Performance</h3>
                  <div className="am-metricsGrid">
                    {report.metrics.map((m, i) => (
                      <div key={i} className="am-metricCard">
                        <div className="am-metricIcon" style={{ color: report.summary.color }}>
                          {getIcon(m.keyword)}
                        </div>
                        <div>
                          <div className="am-metricLabel">{m.label}</div>
                          <div className="am-metricValue">{formatNum(m.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CALCULATION BREAKDOWN (COLLAPSIBLE, OPEN BY DEFAULT) */}
              {((report.breakdown && report.breakdown.length > 0) || (report.hierarchy && Object.keys(report.hierarchy).length > 0)) && (
                <div className="am-collapsibleSection">
                  <div className="am-collapsibleHeader" onClick={() => toggleSection('breakdown')}>
                    <h3><Server size={18} /> Calculation Breakdown</h3>
                    {expanded.breakdown ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  
                  {expanded.breakdown && (
                    <div className="am-collapsibleContent">
                      
                      {report.hierarchy && Object.keys(report.hierarchy).length > 0 ? (
                        <div className="am-hierarchyTree">
                          {Object.keys(report.hierarchy).map(rootKey => (
                            <React.Fragment key={rootKey}>
                              <div className="am-hierarchyRow">
                                <strong>{rootKey}</strong>
                              </div>
                              {report.hierarchy[rootKey].map((node, i) => (
                                <React.Fragment key={`node-${i}`}>
                                  <div className="am-hierarchyRow">
                                    <span className="am-hierarchyPrefix">├──</span>
                                    <span>{node.label}</span>
                                    <strong style={{ marginLeft: 'auto' }}>{formatNum(node.value)}</strong>
                                  </div>
                                  {node.children && node.children.map((child, j) => (
                                    <div key={`child-${i}-${j}`} className="am-hierarchyRow">
                                      <span className="am-hierarchyPrefix">│&nbsp;&nbsp;&nbsp;{j === node.children.length - 1 ? '└──' : '├──'}</span>
                                      <span>{child.label}</span>
                                      <strong style={{ marginLeft: 'auto' }}>{formatNum(child.value)}</strong>
                                    </div>
                                  ))}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : null}

                      {report.breakdown && report.breakdown.length > 0 && (
                        <div className="am-breakdownList" style={{ marginTop: report.hierarchy && Object.keys(report.hierarchy).length > 0 ? '1.5rem' : '0' }}>
                          {report.breakdown.map((b, i) => (
                            <div key={i} className="am-breakdownItem">
                              <div className="am-breakdownHeader">
                                <span className="am-breakdownLabel">{b.label}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contribution</span>
                                  <span className="am-breakdownScore" style={{ color: report.summary.color }}>{formatNum(b.scoreComponent)} pts</span>
                                </div>
                              </div>
                              
                              <div className="am-barContainer">
                                <div className="am-barFill" style={{ width: `${b.progressPerc}%`, background: report.summary.color }} />
                              </div>

                              <button className="am-formulaToggle" onClick={() => toggleFormula(i)}>
                                {showFormula[i] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                {showFormula[i] ? 'Hide Calculation' : 'Show Calculation'}
                              </button>
                              
                              {showFormula[i] && (
                                <div className="am-formulaBox">
                                  <div className="am-formulaRow">
                                    <span className="am-formulaLabel">Target</span>
                                    <span className="am-formulaText">{formatNum(b.value)} / {b.max}</span>
                                  </div>
                                  <div className="am-formulaRow">
                                    <span className="am-formulaLabel">Weight</span>
                                    <span className="am-formulaText">{b.weight}%</span>
                                  </div>
                                  <div className="am-formulaRow">
                                    <span className="am-formulaLabel">Formula</span>
                                    <span className="am-formulaText">{b.formula}</span>
                                  </div>
                                  <div className="am-formulaRow">
                                    <span className="am-formulaLabel">Calculation</span>
                                    <span className="am-formulaText">{b.calculation}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* 4. HISTORICAL PROGRESS (COLLAPSIBLE, CLOSED BY DEFAULT) */}
              <div className="am-collapsibleSection">
                <div className="am-collapsibleHeader" onClick={() => toggleSection('history')}>
                  <h3><Calendar size={18} /> Historical Progress</h3>
                  {expanded.history ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                {expanded.history && (
                  <div className="am-collapsibleContent">
                    {report.history && report.history.length > 0 ? (
                      <div className="am-timelineRow">
                        {report.history.map((pt, i) => {
                          const maxScore = report.summary.maxScore || 100;
                          const blocksCount = Math.max(1, Math.round((pt.value / maxScore) * 10));
                          return (
                            <div key={i} className="am-timelinePoint">
                              <div className="am-timelineMonth">{pt.label}</div>
                              <div className="am-timelineBarWrapper">
                                {Array.from({ length: Math.min(20, blocksCount) }).map((_, j) => (
                                  <div key={j} className="am-timelineBlock" style={{ background: report.summary.color }} />
                                ))}
                              </div>
                              <div className="am-timelineScore">{formatNum(pt.value)}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="am-emptyState">Historical data not available.</div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. IMPROVEMENT SUGGESTIONS (COLLAPSIBLE, CLOSED BY DEFAULT) */}
              {report.suggestions && (report.suggestions.strength || report.suggestions.weakness) && (
                <div className="am-collapsibleSection">
                  <div className="am-collapsibleHeader" onClick={() => toggleSection('suggestions')}>
                    <h3><TrendingUp size={18} /> Improvement Analysis</h3>
                    {expanded.suggestions ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  {expanded.suggestions && (
                    <div className="am-collapsibleContent">
                      <div className="am-suggestionsGrid">
                        {report.suggestions.strength && (
                          <div className="am-suggestionBox" style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.1)' }}>
                            <div className="am-suggestionBoxLeft">
                              <h4 style={{ color: '#22c55e' }}><Trophy size={14} /> Strength</h4>
                              <p>{report.suggestions.strength.label}</p>
                            </div>
                            <span className="am-suggestionValue" style={{ color: '#22c55e' }}>
                              +{formatNum(report.suggestions.strength.score)} / {report.suggestions.strength.max}
                            </span>
                          </div>
                        )}
                        {report.suggestions.weakness && (
                          <div className="am-suggestionBox" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}>
                            <div className="am-suggestionBoxLeft">
                              <h4 style={{ color: '#ef4444' }}><AlertTriangle size={14} /> Improve</h4>
                              <p>{report.suggestions.weakness.label}</p>
                            </div>
                            <span className="am-suggestionValue" style={{ color: '#ef4444' }}>
                              +{formatNum(report.suggestions.weakness.score)} / {report.suggestions.weakness.max}
                            </span>
                          </div>
                        )}
                        {report.suggestions.nextGoal && (
                          <div className="am-suggestionBox am-nextGoalBox">
                            <div className="am-suggestionBoxLeft">
                              <h4><Target size={14} /> Next Goal</h4>
                              <p>{report.suggestions.nextGoal.action}</p>
                            </div>
                            <span className="am-suggestionValue" style={{ color: 'var(--accent-blue)' }}>
                              Expected +{formatNum(report.suggestions.nextGoal.gain)} pts
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          ) : null}
        </div>

        {/* FOOTER */}
        {report && report.metadata && (
          <div className="am-footer">
            <span>Calculation Engine {report.metadata.version}</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>Source: {report.metadata.generatedFrom}</span>
              <span>Generated {new Date(report.metadata.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Use Portal to ensure it floats above all other stacking contexts and doesn't get messed up by parent layouts.
  return ReactDOM.createPortal(modalContent, document.body);
};

export default AnalyticsModal;
