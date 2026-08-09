import React from 'react';
import { Link } from 'react-router-dom';
import { ProgrammeStatusBadge } from './ProgrammeStatusBadge';

export function ProgrammeCard({ programme }) {
  const { name, tagline, description, impact, status, statusLabel, ctaText, route } = programme;

  return (
    <div className="mct-programme-card">
      <div>
        <div className="mct-card-header">
          <h3 className="mct-card-name">{name}</h3>
          <ProgrammeStatusBadge status={status} statusLabel={statusLabel} />
        </div>

        <div className="mct-card-tagline">{tagline}</div>
        
        <p className="mct-card-desc">{description}</p>
      </div>

      <div>
        {impact && (
          <div className="mct-card-impact">
            <span>✨</span>
            <span>{impact}</span>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <Link
            to={route}
            className={`mct-btn ${status === 'AVAILABLE' ? 'mct-btn-primary' : 'mct-btn-secondary'}`}
            style={{ width: '100%' }}
          >
            {ctaText || 'Learn More →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
