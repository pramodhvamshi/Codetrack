import React from 'react';
import { Link } from 'react-router-dom';

export function MedhaHero() {
  return (
    <section className="mct-hero">
      <div className="mct-container">
        <div className="mct-hero-badge">
          <span className="mct-hero-badge-dot" />
          <span>Founded in 2006 • Medha Charitable Trust</span>
        </div>

        <h1 className="mct-hero-title">
          Empowering India <br />
          <span style={{ color: 'var(--mct-accent-blue)' }}>Through Education</span>
        </h1>

        <p className="mct-hero-subtitle">
          Supporting students and young people with education, resources, guidance and opportunities to build self-sustainable lives.
        </p>

        <div className="mct-hero-ctas">
          <a href="#programmes" className="mct-btn mct-btn-primary">
            Explore Our Programmes →
          </a>
          <Link to="/about" className="mct-btn mct-btn-secondary">
            Learn About Medha
          </Link>
        </div>
      </div>
    </section>
  );
}
