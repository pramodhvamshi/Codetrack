import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function MedhaNavbar() {
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <header className="mct-navbar">
      <div className="mct-container mct-nav-inner">
        <Link to="/" className="mct-brand">
          <img
            src="/logo-icon.png"
            alt="Medha Charitable Trust Logo"
            className="mct-brand-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="mct-brand-text">
            <span className="mct-brand-title">MEDHA CHARITABLE TRUST</span>
            <span className="mct-brand-subtitle">Empowering India Through Education</span>
          </div>
        </Link>

        <nav>
          <ul className="mct-nav-links">
            <li>
              <Link to="/about" className={`mct-nav-link ${isCurrent('/about') ? 'active' : ''}`}>
                About
              </Link>
            </li>
            <li>
              <Link to="/programmes" className={`mct-nav-link ${isCurrent('/programmes') ? 'active' : ''}`}>
                Programmes
              </Link>
            </li>
            <li>
              <a href="/#impact" className="mct-nav-link">
                Impact
              </a>
            </li>
            <li>
              <a href="/#contact" className="mct-nav-link">
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <div className="mct-nav-actions">
          <Link to="/login" className="mct-btn mct-btn-primary">
            <span>🔑</span> Login to Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
