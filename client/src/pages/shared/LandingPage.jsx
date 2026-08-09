import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './LandingPage.css';

/* ── tiny floating-particle canvas background ── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="lp-particles" aria-hidden="true" />;
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to default feed page
  useEffect(() => {
    document.title = 'Medha CodeTrack | Digital Student Development & Placement Readiness Platform';
    if (user) {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="lp-root">
      <ParticleCanvas />

      {/* ── STICKY TOP NAVBAR ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <Link to="/" className="lp-parent-link">
            ← Medha Charitable Trust
          </Link>
          <span className="lp-nav-divider">|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img src="/logo-icon.png" alt="Medha CodeTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <div className="lp-nav-title">
              <span className="lp-nav-logotext">MEDHA CODETRACK</span>
              <span className="lp-nav-sublabel">Digital Platform for Medha Sampurna Siksha</span>
            </div>
          </div>
        </div>

        <ul className="lp-nav-menu">
          <li><a href="#pillars">Pillars</a></li>
          <li><a href="#students">Students</a></li>
          <li><a href="#coordinators">Coordinators</a></li>
          <li><a href="#alumni">Alumni</a></li>
          <li><a href="#integrations">Integrations</a></li>
          <li><a href="#sampurna-siksha">Sampurna Siksha</a></li>
        </ul>

        <div className="lp-nav-actions">
          <Link to="/login" className="lp-nav-link">Sign In</Link>
          <Link to="/register" className="lp-btn lp-btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* ── 1. HERO SECTION ── */}
      <section className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            <span>A digital initiative of Medha Charitable Trust</span>
          </div>

          <h1 className="lp-hero-title">
            Learn. Build. Connect.<br />
            <span className="lp-gradient-text">Get Ready.</span>
          </h1>

          <p className="lp-hero-subtitle">
            Medha CodeTrack is a digital student development and placement readiness platform supporting <strong>Medha Sampurna Siksha</strong>. It brings learning, coding, career preparation, community, alumni engagement and student performance intelligence together in one connected ecosystem.
          </p>

          <div className="lp-hero-ctas">
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">
              Get Started →
            </Link>
            <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-lg">
              Sign In
            </Link>
          </div>

          {/* VISUAL HERO JOURNEY FLOW DIAGRAM */}
          <div className="lp-journey-flow">
            <div className="lp-journey-step">
              <span>📚</span> LEARN
            </div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step">
              <span>💻</span> BUILD
            </div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step">
              <span>🎯</span> PREPARE
            </div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step">
              <span>🤝</span> CONNECT
            </div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step lp-journey-highlight">
              <span>🚀</span> GET READY
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CAPABILITY HIGHLIGHTS & POSITIONING ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Platform Positioning</div>
            <h2 className="lp-section-title">More Than a Coding Platform</h2>
            <p className="lp-section-desc">
              CodeTrack connects the different parts of the Medha student journey — from learning and coding practice to career preparation, placement readiness, community engagement and alumni connections.
            </p>
          </div>

          <div className="lp-highlights-grid">
            <div className="lp-highlight-card">
              <div className="lp-highlight-icon">📊</div>
              <h3 className="lp-highlight-title">Multi-Platform Coding Analytics</h3>
              <p className="lp-highlight-desc">
                Sync problem-solving progress across LeetCode, GeeksforGeeks, and CodeChef alongside GitHub development activity.
              </p>
            </div>

            <div className="lp-highlight-card">
              <div className="lp-highlight-icon">🤖</div>
              <h3 className="lp-highlight-title">AI-Powered Career Tools</h3>
              <p className="lp-highlight-desc">
                Utilize intelligent ATS resume feedback, automated scoring, and AI-assisted mock test evaluations.
              </p>
            </div>

            <div className="lp-highlight-card">
              <div className="lp-highlight-icon">🛡️</div>
              <h3 className="lp-highlight-title">Role-Based Intelligence</h3>
              <p className="lp-highlight-desc">
                Tailored interfaces for Students to grow, Coordinators to monitor cohort progress, and Alumni to mentor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SIX CORE PLATFORM PILLARS ── */}
      <section id="pillars" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Core Ecosystem</div>
            <h2 className="lp-section-title">Six Pillars of Student Success</h2>
            <p className="lp-section-desc">
              A comprehensive suite of integrated modules designed to support every phase of student preparation and career growth.
            </p>
          </div>

          <div className="lp-pillars-grid">
            {/* Pillar 1 */}
            <Link to="/dsa" className="lp-pillar-card">
              <div>
                <div className="lp-pillar-header">
                  <div className="lp-pillar-icon">💻</div>
                  <h3 className="lp-pillar-title">Code &amp; DSA</h3>
                </div>
                <p className="lp-pillar-desc">
                  Track coding activity, build problem-solving consistency, and solve curated DSA sheets.
                </p>
                <ul className="lp-pillar-features">
                  <li>LeetCode, GFG &amp; CodeChef sync</li>
                  <li>DSA tracking sheets</li>
                  <li>Coding heatmaps &amp; streaks</li>
                  <li>Peer leaderboards</li>
                </ul>
              </div>
              <div className="lp-pillar-link">Explore Code &amp; DSA →</div>
            </Link>

            {/* Pillar 2 */}
            <Link to="/roadmaps" className="lp-pillar-card">
              <div>
                <div className="lp-pillar-header">
                  <div className="lp-pillar-icon">📚</div>
                  <h3 className="lp-pillar-title">Learn &amp; Prepare</h3>
                </div>
                <p className="lp-pillar-desc">
                  Build strong technical foundations through structured learning roadmaps and mock interviews.
                </p>
                <ul className="lp-pillar-features">
                  <li>Structured tech roadmaps</li>
                  <li>Mock interview sessions</li>
                  <li>Live mentoring sessions</li>
                  <li>Interview experiences</li>
                </ul>
              </div>
              <div className="lp-pillar-link">Explore Learning →</div>
            </Link>

            {/* Pillar 3 */}
            <Link to="/student/resume" className="lp-pillar-card">
              <div>
                <div className="lp-pillar-header">
                  <div className="lp-pillar-icon">📄</div>
                  <h3 className="lp-pillar-title">Resume &amp; Career</h3>
                </div>
                <p className="lp-pillar-desc">
                  Turn achievements into a strong profile with our built-in Resume Studio and Job Portal.
                </p>
                <ul className="lp-pillar-features">
                  <li>ATS Resume Studio</li>
                  <li>Resume score &amp; HTML preview</li>
                  <li>Jobs &amp; referrals portal</li>
                  <li>Career opportunity tracking</li>
                </ul>
              </div>
              <div className="lp-pillar-link">Explore Resume Studio →</div>
            </Link>

            {/* Pillar 4 */}
            <Link to="/student/interview" className="lp-pillar-card">
              <div>
                <div className="lp-pillar-header">
                  <div className="lp-pillar-icon">🤖</div>
                  <h3 className="lp-pillar-title">AI-Powered Tools</h3>
                </div>
                <p className="lp-pillar-desc">
                  Leverage AI to refine your resume content and evaluate mock interview readiness.
                </p>
                <ul className="lp-pillar-features">
                  <li>AI ATS resume evaluation</li>
                  <li>Automated feedback</li>
                  <li>AI mock test grading</li>
                  <li>Personalized suggestions</li>
                </ul>
              </div>
              <div className="lp-pillar-link">Explore AI Tools →</div>
            </Link>

            {/* Pillar 5 */}
            <Link to="/feed" className="lp-pillar-card">
              <div>
                <div className="lp-pillar-header">
                  <div className="lp-pillar-icon">💬</div>
                  <h3 className="lp-pillar-title">Community</h3>
                </div>
                <p className="lp-pillar-desc">
                  Connect, share learnings, and communicate across the Medha student and coordinator community.
                </p>
                <ul className="lp-pillar-features">
                  <li>Social feed &amp; posts</li>
                  <li>Announcements</li>
                  <li>Real-time direct chat</li>
                  <li>Bug reporting</li>
                </ul>
              </div>
              <div className="lp-pillar-link">Explore Community →</div>
            </Link>

            {/* Pillar 6 - ALUMNI SPOTLIGHT */}
            <Link to="/alumni" className="lp-pillar-card lp-pillar-card--featured">
              <div>
                <div className="lp-pillar-header">
                  <div className="lp-pillar-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.4)' }}>🎓</div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>First-Class Pillar</span>
                    <h3 className="lp-pillar-title" style={{ color: '#ffffff' }}>Alumni Hub</h3>
                  </div>
                </div>
                <p className="lp-pillar-desc">
                  Keep the Medha community connected beyond graduation through alumni engagement, events, and guidance.
                </p>
                <ul className="lp-pillar-features">
                  <li>Alumni directory &amp; profiles</li>
                  <li>Alumni groups &amp; forums</li>
                  <li>Events &amp; experiences</li>
                  <li>Student-alumni networking</li>
                </ul>
              </div>
              <div className="lp-pillar-link" style={{ color: '#fbbf24' }}>Explore Alumni Network →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. CORE JOURNEY: ONE PLATFORM ── */}
      <section className="lp-section" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Student Development Lifecycle</div>
            <h2 className="lp-section-title">One Platform. Every Step Toward Placement.</h2>
            <p className="lp-section-desc">
              From learning DSA and building technical skills to preparing resumes, practicing interviews, discovering opportunities and connecting with peers and alumni — CodeTrack brings the journey together.
            </p>
          </div>

          <div className="lp-journey-flow" style={{ padding: '2rem', gap: '1.25rem' }}>
            <div className="lp-journey-step"><span>📖</span> LEARN</div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step"><span>⚡</span> PRACTICE</div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step"><span>🔨</span> BUILD</div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step"><span>🎯</span> PREPARE</div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step"><span>🤝</span> CONNECT</div>
            <span className="lp-journey-arrow">→</span>
            <div className="lp-journey-step lp-journey-highlight" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
              <span>🏆</span> PLACEMENT READY
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. ROLE SPOTLIGHTS: STUDENTS, COORDINATORS & ALUMNI ── */}
      <section id="students" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">User Experiences</div>
            <h2 className="lp-section-title">Tailored for Every Stakeholder</h2>
            <p className="lp-section-desc">
              Empowering students to achieve their potential, coordinators to offer data-driven guidance, and alumni to stay connected.
            </p>
          </div>

          <div className="lp-role-tabs">
            {/* Student Spotlight */}
            <div className="lp-role-card lp-role-card--student">
              <div>
                <div className="lp-role-badge" style={{ color: '#38bdf8' }}>🎓 For Students</div>
                <h3 className="lp-role-title">Everything Students Need to Grow</h3>
                <p className="lp-role-desc">
                  A single place to track coding activity, strengthen technical skills, build an ATS resume, and prepare for placement opportunities.
                </p>
                <ul className="lp-role-list">
                  <li><span>✓</span> Multi-platform coding analytics &amp; streak tracking</li>
                  <li><span>✓</span> Interactive DSA sheets &amp; leaderboards</li>
                  <li><span>✓</span> Resume Studio with ATS scoring</li>
                  <li><span>✓</span> Mock interviews &amp; jobs portal</li>
                </ul>
              </div>
              <Link to="/login" className="lp-btn lp-btn-primary">
                Student Sign In →
              </Link>
            </div>

            {/* Coordinator Spotlight */}
            <div id="coordinators" className="lp-role-card lp-role-card--coordinator">
              <div>
                <div className="lp-role-badge" style={{ color: '#818cf8' }}>🛡️ For Coordinators</div>
                <h3 className="lp-role-title">Powerful Insights for Coordinators</h3>
                <p className="lp-role-desc">
                  Complete cohort visibility allowing coordinators to track progress, monitor inactive learners, and provide targeted support.
                </p>
                <ul className="lp-role-list">
                  <li><span>✓</span> Cohort analytics &amp; performance monitoring</li>
                  <li><span>✓</span> Filter active, inactive, and at-risk students</li>
                  <li><span>✓</span> Placement readiness tracking &amp; thresholds</li>
                  <li><span>✓</span> Performance reports &amp; student detail view</li>
                </ul>
              </div>
              <Link to="/login?role=coordinator" className="lp-btn lp-btn-secondary">
                Coordinator Login →
              </Link>
            </div>

            {/* Alumni Spotlight */}
            <div id="alumni" className="lp-role-card lp-role-card--alumni">
              <div>
                <div className="lp-role-badge" style={{ color: '#fbbf24' }}>🏆 For Alumni</div>
                <h3 className="lp-role-title">The Medha Journey Doesn't End at Graduation</h3>
                <p className="lp-role-desc">
                  Stay connected with the Medha community, share interview experiences, participate in events, and guide the next generation.
                </p>
                <ul className="lp-role-list">
                  <li><span>✓</span> Alumni directory &amp; networking profile</li>
                  <li><span>✓</span> Share interview experiences &amp; resources</li>
                  <li><span>✓</span> Participate in events &amp; alumni groups</li>
                  <li><span>✓</span> Give back through guidance &amp; referrals</li>
                </ul>
              </div>
              <Link to="/alumni" className="lp-btn lp-btn-ghost" style={{ borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}>
                Explore Alumni Network →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. INTEGRATIONS & PLACEMENT READINESS ── */}
      <section id="integrations" className="lp-section">
        <div className="lp-container">
          <div className="lp-two-col-grid">
            {/* Integrations */}
            <div className="lp-integrations-box">
              <div className="lp-section-eyebrow">Platform Synchronization</div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                Your Coding Journey, Unified
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                Bring supported coding activity from platforms students already use alongside GitHub development activity into student profiles.
              </p>

              <div className="lp-integration-badges">
                <div className="lp-integration-item">
                  <span style={{ fontSize: '1.5rem' }}>🟧</span>
                  <div>
                    <div className="lp-integration-name">LeetCode</div>
                    <div className="lp-integration-category">Coding Platform</div>
                  </div>
                </div>

                <div className="lp-integration-item">
                  <span style={{ fontSize: '1.5rem' }}>🟩</span>
                  <div>
                    <div className="lp-integration-name">GeeksforGeeks</div>
                    <div className="lp-integration-category">Coding Platform</div>
                  </div>
                </div>

                <div className="lp-integration-item">
                  <span style={{ fontSize: '1.5rem' }}>🟫</span>
                  <div>
                    <div className="lp-integration-name">CodeChef</div>
                    <div className="lp-integration-category">Coding Platform</div>
                  </div>
                </div>

                <div className="lp-integration-item">
                  <span style={{ fontSize: '1.5rem' }}>🐙</span>
                  <div>
                    <div className="lp-integration-name">GitHub</div>
                    <div className="lp-integration-category">Development Activity</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Placement Readiness */}
            <div className="lp-readiness-box">
              <div className="lp-section-eyebrow">Performance Intelligence</div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                Know Where You Stand. Know What to Improve.
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                CodeTrack turns student activity into meaningful readiness insights across multiple dimensions of preparation.
              </p>

              <div className="lp-readiness-dimensions">
                <div className="lp-dimension-pill">
                  <span>🧠</span> DSA &amp; Coding
                </div>
                <div className="lp-dimension-pill">
                  <span>🚀</span> Technical Projects
                </div>
                <div className="lp-dimension-pill">
                  <span>📄</span> ATS Resume Score
                </div>
                <div className="lp-dimension-pill">
                  <span>🎓</span> Academic Progress
                </div>
                <div className="lp-dimension-pill">
                  <span>🔥</span> Consistency Streak
                </div>
                <div className="lp-dimension-pill">
                  <span>⚡</span> Platform Activities
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. ACHIEVEMENTS & MOTIVATION STRIP ── */}
      <section className="lp-section" style={{ padding: '2.5rem 0' }}>
        <div className="lp-container">
          <div className="lp-achievements-strip">
            <div className="lp-achievement-item">🔥 Coding Streaks</div>
            <div className="lp-achievement-item">🏆 Solved Problems</div>
            <div className="lp-achievement-item">🎯 DSA Tracker Progress</div>
            <div className="lp-achievement-item">📈 Coding Score</div>
            <div className="lp-achievement-item">🥇 Cohort Leaderboard</div>
            <div className="lp-achievement-item">📄 ATS Resume Ready</div>
          </div>
        </div>
      </section>

      {/* ── 8. MEDHA SAMPURNA SIKSHA CONNECTION ── */}
      <section id="sampurna-siksha" className="lp-section">
        <div className="lp-container">
          <div className="lp-brand-connection">
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Ecosystem Architecture
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              Powered by Medha Sampurna Siksha
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Medha Sampurna Siksha works to encourage and support talented students to <strong>Educate, Evolve &amp; Prosper</strong>. Medha CodeTrack extends this mission into a connected digital experience.
            </p>

            <div className="lp-hierarchy-flow">
              <div className="lp-hierarchy-node">Medha Charitable Trust</div>
              <span style={{ color: '#38bdf8' }}>→</span>
              <div className="lp-hierarchy-node">Medha Sampurna Siksha</div>
              <span style={{ color: '#38bdf8' }}>→</span>
              <div className="lp-hierarchy-node lp-hierarchy-node--active">Medha CodeTrack</div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              Connecting Students • Coordinators • Alumni • Career Development
            </p>
          </div>
        </div>
      </section>

      {/* ── 9. WHAT'S NEXT FOR CODETRACK ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Future Roadmap</div>
            <h2 className="lp-section-title">What's Next for CodeTrack</h2>
            <p className="lp-section-desc">
              Continuing to expand the Medha digital ecosystem with enhanced intelligence and communication tools.
            </p>
          </div>

          <div className="lp-highlights-grid">
            <div className="lp-highlight-card" style={{ opacity: 0.9 }}>
              <div className="lp-highlight-icon">🔔</div>
              <h3 className="lp-highlight-title">Smart Alerts</h3>
              <p className="lp-highlight-desc">
                Automatic notifications highlighting meaningful changes in student activity and cohort trends for coordinators.
              </p>
            </div>

            <div className="lp-highlight-card" style={{ opacity: 0.9 }}>
              <div className="lp-highlight-icon">🧠</div>
              <h3 className="lp-highlight-title">AI Performance Insights</h3>
              <p className="lp-highlight-desc">
                Personalized recommendations suggesting specific DSA topics and skill areas to accelerate readiness.
              </p>
            </div>

            <div className="lp-highlight-card" style={{ opacity: 0.9 }}>
              <div className="lp-highlight-icon">🚀</div>
              <h3 className="lp-highlight-title">More Digital Experiences</h3>
              <p className="lp-highlight-desc">
                Expanding digital platform integration across other Medha Charitable Trust educational initiatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA ── */}
      <section className="lp-section" style={{ textAlign: 'center', background: 'linear-gradient(180deg, #0b1021 0%, #070b18 100%)' }}>
        <div className="lp-container">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '1rem' }}>
            Your Journey. Your Growth. Your Future.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Start building the skills, profile and placement readiness you need for the opportunities ahead.
          </p>

          <div className="lp-hero-ctas" style={{ marginBottom: '2rem' }}>
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">
              Get Started →
            </Link>
            <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-lg">
              Sign In
            </Link>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Medha CodeTrack — An initiative of Medha Charitable Trust
          </div>
        </div>
      </section>

      {/* ── COMPREHENSIVE FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                <img src="/logo-icon.png" alt="Medha CodeTrack Logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>MEDHA CODETRACK</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 340, lineHeight: 1.6 }}>
                Digital Student Development &amp; Placement Readiness Platform supporting <strong>Medha Sampurna Siksha</strong>.
              </p>
            </div>

            <div>
              <h4>Platform Pillars</h4>
              <ul className="lp-footer-links">
                <li><Link to="/dsa">Code &amp; DSA</Link></li>
                <li><Link to="/roadmaps">Learning Roadmaps</Link></li>
                <li><Link to="/student/resume">Resume Studio</Link></li>
                <li><Link to="/student/interview">AI Tools &amp; Mock Tests</Link></li>
                <li><Link to="/feed">Community Feed</Link></li>
                <li><Link to="/alumni">Alumni Network</Link></li>
              </ul>
            </div>

            <div>
              <h4>For Ecosystem</h4>
              <ul className="lp-footer-links">
                <li><Link to="/register">For Students</Link></li>
                <li><Link to="/login?role=coordinator">For Coordinators</Link></li>
                <li><Link to="/alumni">For Alumni</Link></li>
                <li><Link to="/jobs">For Companies &amp; Jobs</Link></li>
              </ul>
            </div>

            <div>
              <h4>Medha Ecosystem</h4>
              <ul className="lp-footer-links">
                <li><Link to="/" style={{ color: '#38bdf8', fontWeight: 600 }}>← Medha Charitable Trust</Link></li>
                <li><Link to="/programmes/sampurna-siksha">Medha Sampurna Siksha</Link></li>
                <li><Link to="/programmes/naipunya-nirmana">Medha Naipunya Nirmana</Link></li>
                <li><Link to="/programmes/helping-hands">Medha Helping Hands</Link></li>
                <li><Link to="/programmes/mvn">Medha Vidyalaya Navikarana</Link></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <div>
              © {new Date().getFullYear()} Medha Charitable Trust. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Medha Home</Link>
              <Link to="/codetrack" style={{ color: '#64748b', textDecoration: 'none' }}>CodeTrack</Link>
              <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
