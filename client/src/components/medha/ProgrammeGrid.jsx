import React from 'react';
import { ProgrammeCard } from './ProgrammeCard';
import { PROGRAMMES_DATA } from '../../data/programmesData';

export function ProgrammeGrid() {
  return (
    <section id="programmes" className="mct-section">
      <div className="mct-container">
        <div className="mct-section-header">
          <div className="mct-section-eyebrow">Medha Initiatives</div>
          <h2 className="mct-section-title">Our Programmes</h2>
          <p className="mct-section-desc">
            Empowering students and young adults across India through targeted educational, career, and resource initiatives.
          </p>
        </div>

        <div className="mct-programmes-grid">
          {PROGRAMMES_DATA.map((programme) => (
            <ProgrammeCard key={programme.id} programme={programme} />
          ))}
        </div>
      </div>
    </section>
  );
}
