import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MedhaNavbar } from '../../components/medha/MedhaNavbar';
import { MedhaFooter } from '../../components/medha/MedhaFooter';
import '../../components/medha/medha.css';

export function NotFoundPage() {
  useEffect(() => {
    document.title = '404 - Page Not Found | Medha Charitable Trust';
  }, []);

  return (
    <div className="mct-root">
      <MedhaNavbar />
      
      <main style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="mct-container">
          <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--mct-accent-blue)', marginBottom: '1rem' }}>
            404
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Page Not Found
          </h1>
          <p style={{ color: 'var(--mct-text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem', fontSize: '1rem' }}>
            The page you are looking for does not exist or has been moved.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/" className="mct-btn mct-btn-primary">
              Return to Medha Home
            </Link>
            <Link to="/codetrack" className="mct-btn mct-btn-secondary">
              Go to CodeTrack Platform
            </Link>
          </div>
        </div>
      </main>

      <MedhaFooter />
    </div>
  );
}
