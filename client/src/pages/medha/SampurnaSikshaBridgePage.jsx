import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MedhaNavbar } from '../../components/medha/MedhaNavbar';
import { MedhaFooter } from '../../components/medha/MedhaFooter';
import { ProgrammeStatusBadge } from '../../components/medha/ProgrammeStatusBadge';
import { PROGRAMMES_DATA } from '../../data/programmesData';
import '../../components/medha/medha.css';

export function SampurnaSikshaBridgePage() {
  const programme = PROGRAMMES_DATA.find(p => p.slug === 'sampurna-siksha');

  useEffect(() => {
    document.title = 'Medha Sampurna Siksha → Medha CodeTrack | Medha Charitable Trust';
    window.scrollTo(0, 0);
  }, []);

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
            padding: '3rem 2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            marginBottom: '3rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--mct-accent-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Programme Overview
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
              <span>🎓</span>
              <span>Impact: <strong>{programme.impact}</strong></span>
            </div>
          </div>

          {/* TRANSITION BRIDGE TO CODETRACK */}
          <div style={{ textAlign: 'center', margin: '3rem 0 2rem' }}>
            <div style={{ fontSize: '2rem', color: 'var(--mct-accent-blue)', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>
              ↓
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--mct-text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Supported Digitally By
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid var(--mct-border-accent)',
            borderRadius: '24px',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(56, 189, 248, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <img src="/logo-icon.png" alt="Medha CodeTrack Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                MEDHA CODETRACK
              </span>
            </div>

            <div style={{ fontSize: '1.15rem', color: 'var(--mct-accent-blue)', fontWeight: 700, marginBottom: '1.25rem' }}>
              Placement &amp; Coding Readiness Platform
            </div>

            <p style={{ fontSize: '1.05rem', color: 'var(--mct-text-secondary)', maxWidth: '720px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
              {programme.platformDescription}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/codetrack" className="mct-btn mct-btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                Enter CodeTrack Platform →
              </Link>
              <Link to="/login" className="mct-btn mct-btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                Student / Coordinator Login
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MedhaFooter />
    </div>
  );
}
