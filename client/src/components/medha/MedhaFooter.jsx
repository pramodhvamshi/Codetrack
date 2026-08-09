import React from 'react';
import { Link } from 'react-router-dom';
import { TRUST_INFO } from '../../data/programmesData';

export function MedhaFooter() {
  return (
    <footer id="contact" className="mct-footer">
      <div className="mct-container">
        <div className="mct-footer-grid">
          <div className="mct-footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <img
                src="/logo-icon.png"
                alt="Medha Charitable Trust Logo"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                MEDHA CHARITABLE TRUST
              </span>
            </div>
            <p style={{ color: 'var(--mct-text-secondary)', fontSize: '0.9rem', maxWidth: 360, lineHeight: 1.6 }}>
              {TRUST_INFO.tagline}. Founded in 2006 to improve the quality of education in India and support students build prosperous, self-sustainable lives.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--mct-text-muted)', margin: 0 }}>
              Sponsored by <strong>{TRUST_INFO.sponsor}</strong>
            </p>
          </div>

          <div className="mct-footer-col">
            <h4>Programmes</h4>
            <ul className="mct-footer-links">
              <li>
                <Link to="/programmes/sampurna-siksha">Medha Sampurna Siksha</Link>
              </li>
              <li>
                <Link to="/programmes/naipunya-nirmana">Medha Naipunya Nirmana</Link>
              </li>
              <li>
                <Link to="/programmes/helping-hands">Medha Helping Hands</Link>
              </li>
              <li>
                <Link to="/programmes/mvn">Medha Vidyalaya Navikarana (MVN)</Link>
              </li>
            </ul>
          </div>

          <div className="mct-footer-col">
            <h4>Digital Platform</h4>
            <ul className="mct-footer-links">
              <li>
                <Link to="/codetrack" style={{ color: 'var(--mct-accent-blue)', fontWeight: 600 }}>
                  Medha CodeTrack →
                </Link>
              </li>
              <li>
                <Link to="/login">Portal Login</Link>
              </li>
              <li>
                <Link to="/register">Student Sign Up</Link>
              </li>
            </ul>
          </div>

          <div className="mct-footer-col">
            <h4>Contact Us</h4>
            <div className="mct-footer-contact">
              <p style={{ marginBottom: '0.5rem' }}>
                📞 <a href={`tel:${TRUST_INFO.phone}`}>{TRUST_INFO.phone}</a>
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                ✉️ <a href={`mailto:${TRUST_INFO.email}`}>{TRUST_INFO.email}</a>
              </p>
              <p style={{ color: 'var(--mct-text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                📍 {TRUST_INFO.address}
              </p>
            </div>
          </div>
        </div>

        <div className="mct-footer-bottom">
          <div>
            © {new Date().getFullYear()} {TRUST_INFO.name}. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/" style={{ color: 'var(--mct-text-muted)', textDecoration: 'none' }}>Home</Link>
            <Link to="/about" style={{ color: 'var(--mct-text-muted)', textDecoration: 'none' }}>About</Link>
            <Link to="/programmes" style={{ color: 'var(--mct-text-muted)', textDecoration: 'none' }}>Programmes</Link>
            <Link to="/codetrack" style={{ color: 'var(--mct-text-muted)', textDecoration: 'none' }}>CodeTrack</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
