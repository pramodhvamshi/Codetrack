import React from 'react';
import { X, BarChart3 } from 'lucide-react';
import { LEADERBOARD_CONFIG } from '../../config/LeaderboardConfig';

const AnalyticsHeader = ({ config, studentName, stats, breakDown, onClose }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '1.5rem', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card, #0f172a)', zIndex: 10, paddingTop: '1.5rem' }}>
    <div>
      <h2 style={{ margin: 0, color: config.color, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
        <BarChart3 size={24} /> {config.name} Analytics
      </h2>
      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Student: </span>
        <strong style={{ fontSize: '1.1rem' }}>{studentName}</strong>
        {stats.username && (
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', marginLeft: '0.2rem' }}>@{stats.username}</span>
        )}
      </div>
    </div>
    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: config.color, lineHeight: 1 }}>
        {Math.round(breakDown.score || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
      </div>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
    </div>
  </div>
);

const StatisticsGrid = ({ config, row }) => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Statistics</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
      {config.columns.map(col => !col.isScore && (
        <div key={col.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{col.label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{col.accessor(row)}</div>
        </div>
      ))}
    </div>
  </div>
);

const ScoreBreakdown = ({ formulas, totalScore, config }) => {
  if (!formulas || formulas.length === 0) return null;
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Transparent Calculation</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {formulas.map((f, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <strong style={{ fontSize: '1rem', color: '#f3f4f6' }}>{f.label}</strong>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Value</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{f.current}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Value</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{f.target}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weight</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: config.color }}>{f.max} Points</div>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Formula:
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '4px', fontFamily: 'monospace', color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
              min(Current / Target, 1) &times; Weight
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Calculation:
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '4px', fontFamily: 'monospace', color: '#d1d5db', fontSize: '0.85rem', lineHeight: '1.6' }}>
              {f.formula}<br />
              = {f.contribution} / {f.max}
            </div>
          </div>
        ))}
        
        {/* FINAL SUMMATION */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: `1px solid ${config.color}40`, marginTop: '1rem', fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'right' }}>
          {formulas.map((f, i) => (
            <div key={i} style={{ color: '#d1d5db' }}>
              {i > 0 ? '+' : ' '} {parseFloat(f.contribution).toFixed(2)}
            </div>
          ))}
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', margin: '0.5rem 0', paddingTop: '0.5rem', fontWeight: 800, color: config.color }}>
            {totalScore.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Rounded = {Math.round(totalScore)} / 100
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ recommendations, potentialScore, currentScore, config }) => {
  if (!recommendations || recommendations.length === 0) return null;
  const strengths = recommendations.filter(r => r.type === 'success');
  const improvements = recommendations.filter(r => r.type === 'warning');
  
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Recommendations</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {strengths.length > 0 && (
          <div style={{ background: 'rgba(52, 211, 153, 0.05)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <h4 style={{ margin: '0 0 0.8rem 0', color: '#34d399', fontSize: '0.9rem', textTransform: 'uppercase' }}>Strengths</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {strengths.map((rec, i) => (
                <div key={i} style={{ fontSize: '0.9rem', color: '#d1d5db', display: 'flex', gap: '0.5rem' }}><span>✓</span> {rec.text.replace('✓', '')}</div>
              ))}
            </div>
          </div>
        )}
        
        {improvements.length > 0 && (
          <div style={{ background: 'rgba(251, 191, 36, 0.05)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <h4 style={{ margin: '0 0 0.8rem 0', color: '#fbbf24', fontSize: '0.9rem', textTransform: 'uppercase' }}>Areas to Improve</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {improvements.map((rec, i) => (
                <div key={i} style={{ fontSize: '0.9rem', color: '#d1d5db', display: 'flex', gap: '0.5rem' }}><span>⚠</span> {rec.text.replace('⚠', '')}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {potentialScore > currentScore && (
        <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Score after improvements:</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: config.color }}>
            {Math.round(currentScore)} → {Math.round(potentialScore)}
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryCard = () => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Historical Progress</h3>
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
      <div style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#f3f4f6' }}>No historical snapshots available.</div>
      <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Historical analytics will appear after future snapshots are generated.</div>
    </div>
  </div>
);

export default function PlatformAnalyticsModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { row, platformId, studentName } = data;
  const config = LEADERBOARD_CONFIG.platforms.find(p => p.id === platformId);
  if (!config) return null;

  const breakDown = row.competitiveBreakdown?.[platformId] || {};
  const stats = row.platformStats?.[platformId] || row[platformId] || {}; // Hackerrank uses row.hackerrank
  
  return (
    <div className="hm-modal-overlay" onClick={onClose} style={{ zIndex: 9999, padding: '2rem', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
      <div className="hm-modal" style={{ maxWidth: '950px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', padding: '0 2rem', background: 'var(--bg-card, #0f172a)' }} onClick={e => e.stopPropagation()}>
        <AnalyticsHeader config={config} studentName={studentName} stats={stats} breakDown={breakDown} onClose={onClose} />
        
        <div style={{ paddingBottom: '2rem' }}>
          <StatisticsGrid config={config} row={row} />
          
          <ScoreBreakdown formulas={breakDown.formulas} totalScore={breakDown.score || 0} config={config} />
          
          <RecommendationCard recommendations={breakDown.recommendations} potentialScore={breakDown.potentialScore} currentScore={breakDown.score || 0} config={config} />
          
          <HistoryCard />
        </div>
      </div>
    </div>
  );
}
