import React from 'react';

export function AboutMedha() {
  return (
    <section id="about" className="mct-section">
      <div className="mct-container">
        <div className="mct-about-grid">
          <div className="mct-about-content">
            <div className="mct-section-eyebrow">About Medha</div>
            <h3>Improving the Quality of Education in India Since 2006</h3>
            <p>
              Medha Charitable Trust was founded in 2006 with the fundamental objective of improving the quality of education in India and creating sustainable growth paths for students from underserved communities.
            </p>
            <p>
              We firmly believe that education is the ultimate catalyst for long-term social and economic independence. Through comprehensive scholarships, skill development initiatives, book donations, and technology-driven learning platforms, we empower students to achieve academic excellence and career success.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--mct-text-muted)', fontStyle: 'italic' }}>
              Medha Charitable Trust initiatives are proudly sponsored by <strong>Medha Servo Drives Pvt. Ltd.</strong>
            </p>

            <div className="mct-about-highlights">
              <div className="mct-highlight-item">
                <div className="mct-highlight-title">Founded in 2006</div>
                <div className="mct-highlight-desc">Two decades of educational impact</div>
              </div>
              <div className="mct-highlight-item">
                <div className="mct-highlight-title">Scholarships & Support</div>
                <div className="mct-highlight-desc">Financial aid & academic mentoring</div>
              </div>
              <div className="mct-highlight-item">
                <div className="mct-highlight-title">Career Readiness</div>
                <div className="mct-highlight-desc">Skill training & job placement support</div>
              </div>
              <div className="mct-highlight-item">
                <div className="mct-highlight-title">Technology Platforms</div>
                <div className="mct-highlight-desc">Digital tracking & readiness tools</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--mct-bg-card)',
            border: '1px solid var(--mct-border)',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--mct-accent-blue)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }}>
              Our Core Pillars
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem' }}>📖</span>
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Educational Support</h4>
                  <p style={{ color: 'var(--mct-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    Providing scholarships, learning kits, and academic guidance to deserving students across institutions.
                  </p>
                </div>
              </li>

              <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem' }}>🚀</span>
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Career &amp; Skill Development</h4>
                  <p style={{ color: 'var(--mct-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    Training youth in industry-relevant technical skills, software engineering, DSA, and interview readiness.
                  </p>
                </div>
              </li>

              <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem' }}>🌱</span>
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Long-Term Self-Sustainability</h4>
                  <p style={{ color: 'var(--mct-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    Creating intergenerational change where an educated individual transforms the future of their entire family.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
