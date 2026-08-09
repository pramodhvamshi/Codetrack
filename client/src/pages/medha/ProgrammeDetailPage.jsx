import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MedhaNavbar } from '../../components/medha/MedhaNavbar';
import { MedhaFooter } from '../../components/medha/MedhaFooter';
import { ProgrammeStatusBadge } from '../../components/medha/ProgrammeStatusBadge';
import { PROGRAMMES_DATA } from '../../data/programmesData';
import '../../components/medha/medha.css';

export function ProgrammeDetailPage({ slugOverride }) {
  const params = useParams();
  const slug = slugOverride || params.slug;
  const programme = PROGRAMMES_DATA.find(p => p.slug === slug);

  useEffect(() => {
    if (programme) {
      document.title = `${programme.name} | Medha Charitable Trust`;
    }
    window.scrollTo(0, 0);
  }, [programme]);

  if (!programme) {
    return (
      <div className="mct-root">
        <MedhaNavbar />
        <main style={{ padding: '5rem 0', textAlign: 'center' }}>
          <div className="mct-container">
            <h2>Programme Not Found</h2>
            <p style={{ color: 'var(--mct-text-secondary)', marginBottom: '2rem' }}>
              The requested Medha Charitable Trust initiative could not be found.
            </p>
            <Link to="/programmes" className="mct-btn mct-btn-primary">
              View All Programmes
            </Link>
          </div>
        </main>
        <MedhaFooter />
      </div>
    );
  }

  return (
    <div className="mct-root">
      <MedhaNavbar />
      
      <main style={{ padding: '3.5rem 0 5rem' }}>
        <div className="mct-container">
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/programmes" style={{ color: 'var(--mct-accent-blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              ← Back to Programmes
            </Link>
          </div>

          <div style={{
            background: 'var(--mct-bg-card)',
            border: '1px solid var(--mct-border)',
            borderRadius: '24px',
            padding: '3.5rem 2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            marginBottom: '3rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--mct-accent-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Active Medha Initiative
                </span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>
                  {programme.name}
                </h1>
                <div style={{ fontSize: '1.1rem', color: 'var(--mct-accent-blue)', fontWeight: 600 }}>
                  {programme.tagline}
                </div>
              </div>
              <ProgrammeStatusBadge status={programme.status} statusLabel={programme.statusLabel} />
            </div>

            <p style={{ fontSize: '1.1rem', color: 'var(--mct-text-secondary)', lineHeight: 1.7, maxWidth: '850px', marginBottom: '2rem' }}>
              {programme.description}
            </p>

            {programme.impact && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem'
              }}>
                <span>✨</span>
                <span>Verified Impact: <strong>{programme.impact}</strong></span>
              </div>
            )}
          </div>

          {/* DIGITAL PLATFORM STATUS NOTICE */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px dashed var(--mct-border-accent)',
            borderRadius: '20px',
            padding: '2.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              💻
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
              Digital Experience Under Development
            </h3>
            <p style={{ color: 'var(--mct-text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
              This Medha programme is actively operating in real life. Its dedicated digital platform is currently under development and will be launched soon.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Link to="/programmes/sampurna-siksha" className="mct-btn mct-btn-primary">
                Explore Medha CodeTrack Platform →
              </Link>
              <Link to="/" className="mct-btn mct-btn-secondary">
                Return to Medha Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MedhaFooter />
    </div>
  );
}
