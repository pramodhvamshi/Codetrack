import React from 'react';
import { IMPACT_STATS } from '../../data/programmesData';

export function ImpactStats() {
  return (
    <section id="impact" className="mct-section" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
      <div className="mct-container">
        <div className="mct-section-header">
          <div className="mct-section-eyebrow">Real World Impact</div>
          <h2 className="mct-section-title">Transforming Lives Through Education</h2>
          <p className="mct-section-desc">
            Direct results achieved by Medha Charitable Trust across academic scholarships, skill training, and educational resource outreach.
          </p>
        </div>

        <div className="mct-stats-grid">
          {IMPACT_STATS.map((stat, idx) => (
            <div key={idx} className="mct-stat-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div className="mct-stat-number">{stat.number}</div>
              <div className="mct-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
