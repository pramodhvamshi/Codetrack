import React from 'react';
import { TRUST_INFO } from '../../data/programmesData';

export function BeliefSection() {
  return (
    <section className="mct-section">
      <div className="mct-container">
        <div className="mct-belief-card">
          <div className="mct-belief-quote-mark">“</div>
          
          <blockquote className="mct-belief-text">
            “{TRUST_INFO.coreBelief}”
          </blockquote>

          <div className="mct-belief-author">
            — Medha Charitable Trust Philosophy
          </div>
        </div>
      </div>
    </section>
  );
}
