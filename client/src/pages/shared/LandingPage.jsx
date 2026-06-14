import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PlatformIcon } from '../../components/PlatformIcon';
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

/* ── feature card ── */
function FeatureCard({ icon, title, desc, isImage }) {
  return (
    <div className="lp-feature-card">
      <span className="lp-feature-icon">
        {isImage
          ? <img src={icon} alt={title} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
          : icon}
      </span>
      <h3 className="lp-feature-card-title">{title}</h3>
      <p className="lp-feature-card-desc">{desc}</p>
    </div>
  );
}

/* ── platform badge with real logo ── */
function PlatformBadge({ platform, name, color }) {
  return (
    <div className="lp-platform-badge" style={{ '--pc': color }}>
      <PlatformIcon platform={platform} size={28} style={{ borderRadius: 6 }} />
      <span className="lp-platform-name">{name}</span>
    </div>
  );
}

/* ── stat pill ── */
function StatPill({ value, label }) {
  return (
    <div className="lp-stat-pill">
      <span className="lp-stat-value">{value}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(
        user.role === 'coordinator' ? '/coordinator/dashboard' : '/student/dashboard',
        { replace: true }
      );
    }
  }, [user, navigate]);

  return (
    <div className="lp-root">
      <ParticleCanvas />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <span className="lp-nav-logomark" />
          <span className="lp-nav-logotext">CodeTrack</span>
          <span className="lp-nav-beta">v1.0 Beta</span>
        </div>
        <div className="lp-nav-actions">
          <Link to="/login" className="lp-nav-link">Sign in</Link>
          <Link to="/register" className="lp-btn lp-btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            Exclusively for Medha Charitable Trust
          </div>

          <h1 className="lp-hero-title">
            Track Coding Progress.<br />
            <span className="lp-gradient-text">Measure Growth.</span><br />
            Enable Success.
          </h1>

          <p className="lp-hero-subtitle">
            A centralized coding analytics platform built exclusively for{' '}
            <strong>Medha Charitable Trust</strong> students and curriculum coordinators.
            Track coding progress across platforms, monitor learning consistency,
            discover top performers, and support placement readiness through real-time analytics.
          </p>

          <div className="lp-hero-ctas">
            <Link to="/register" id="lp-cta-student" className="lp-btn lp-btn-primary lp-btn-lg">
              <span>🎓</span> Sign Up as Student
            </Link>
            <Link to="/login?role=coordinator" id="lp-cta-coordinator" className="lp-btn lp-btn-ghost lp-btn-lg">
              <span>🛡️</span> Continue as Coordinator
            </Link>
          </div>

          <div className="lp-hero-stats">
            <StatPill value="500+" label="Problems Tracked" />
            <StatPill value="3" label="Coding Platforms" />
            <StatPill value="Live" label="Student Analytics" />
            <StatPill value="Smart" label="Coordinator Insights" />
          </div>
        </div>

        {/* Decorative glow orbs */}
        <div className="lp-orb lp-orb-1" aria-hidden="true" />
        <div className="lp-orb lp-orb-2" aria-hidden="true" />
      </section>

      {/* ── WHY CODETRACK ── */}
      <section className="lp-section lp-why">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Why CodeTrack?</div>
          <h2 className="lp-section-title">
            More than a coding tracker
          </h2>
          <p className="lp-section-desc">
            CodeTrack helps students stay consistent in their coding journey while giving
            coordinators powerful insights into student performance, engagement, and placement readiness.
          </p>

          <div className="lp-why-grid">
            <div className="lp-why-card lp-why-card--student">
              <div className="lp-why-card-header">
                <span className="lp-why-icon">🎓</span>
                <span className="lp-why-role">For Students</span>
              </div>
              <ul className="lp-why-list">
                <li>Track coding activity across LeetCode, CodeChef &amp; GeeksforGeeks in one place</li>
                <li>View your coding streak, consistency score, and overall coding score</li>
                <li>Monitor your monthly activity and compare with peers on the leaderboard</li>
                <li>Identify your strengths and areas for improvement</li>
                <li>Stay motivated with a visual coding heatmap and activity timeline</li>
              </ul>
            </div>

            <div className="lp-why-card lp-why-card--coordinator">
              <div className="lp-why-card-header">
                <span className="lp-why-icon">🛡️</span>
                <span className="lp-why-role">For Coordinators</span>
              </div>
              <ul className="lp-why-list">
                <li>Get a full overview of student coding activity across the cohort</li>
                <li>Identify active students, inactive students, and at-risk learners</li>
                <li>Track placement readiness based on coding score thresholds</li>
                <li>Monitor monthly performance trends and leaderboard standings</li>
                <li>Drill down into individual student profiles to offer targeted support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM INTEGRATIONS ── */}
      <section className="lp-section lp-platforms">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Platform Integrations</div>
          <h2 className="lp-section-title">One platform. All your coding data.</h2>
          <p className="lp-section-desc">
            CodeTrack automatically syncs data from the top competitive programming
            and coding practice platforms used by Medha Trust students.
          </p>

          <div className="lp-platform-grid">
            <PlatformBadge platform="leetcode"   name="LeetCode"       color="#F59E0B" />
            <PlatformBadge platform="codechef"   name="CodeChef"       color="#EF4444" />
            <PlatformBadge platform="gfg"        name="GeeksforGeeks"  color="#22C55E" />
            <PlatformBadge platform="github"     name="GitHub"         color="#8B5CF6" />
          </div>

          <p className="lp-platforms-note">
            Data is synced automatically. No manual entry required.
          </p>
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section className="lp-section lp-features">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Key Features</div>
          <h2 className="lp-section-title">Everything you need to succeed</h2>

          <div className="lp-features-grid">
            <FeatureCard
              icon="📊"
              title="Coding Heatmap"
              desc="Visualize your daily coding activity with a GitHub-style contribution heatmap spanning the last 12 months."
            />
            <FeatureCard
              icon="🏆"
              title="Live Leaderboard"
              desc="Compete on both all-time and monthly leaderboards ranked by solved problems across all platforms."
            />
            <FeatureCard
              icon="🔥"
              title="Streak Tracking"
              desc="Monitor your longest coding streak and current streak to build a habit of daily practice."
            />
            <FeatureCard
              icon="🎯"
              title="Coding Score"
              desc="A composite score combining problems solved, platform ratings, and activity consistency."
            />
            <FeatureCard
              icon="📈"
              title="Student Analytics"
              desc="Coordinators get cohort-wide analytics: active vs inactive, placement-ready vs at-risk segmentation."
            />
            <FeatureCard
              icon="👤"
              title="Public Profile"
              desc="Every student gets a shareable public profile showcasing their coding journey and platform stats."
            />
            {/* Resume Builder — already live */}
            <FeatureCard
              icon="📄"
              title="Resume Builder"
              desc="Auto-generate a coding-focused resume from your CodeTrack profile with one click. Download as PDF."
            />
            {/* Badges — already live */}
            <FeatureCard
              icon="🏅"
              title="Badges & Achievements"
              desc="Earn milestone badges for streaks, problem counts, and rating achievements automatically."
            />
          </div>
        </div>
      </section>

      {/* ── COMING SOON ── */}
      <section className="lp-section lp-coming-soon">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Coming Soon</div>
          <h2 className="lp-section-title">The roadmap ahead</h2>
          <div className="lp-coming-grid">
            {[
              { icon: '🔔', title: 'Smart Alerts', desc: 'Automated alerts for coordinators when a student goes inactive for more than 7 days.' },
              { icon: '🤖', title: 'AI Insights', desc: 'AI-powered personalized recommendations on which topics and problems to focus on next.' },
            ].map((item) => (
              <div key={item.title} className="lp-coming-card">
                <span className="lp-coming-icon">{item.icon}</span>
                <div>
                  <div className="lp-coming-title">{item.title}</div>
                  <div className="lp-coming-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-section lp-final-cta">
        <div className="lp-section-inner lp-final-cta-inner">
          <h2 className="lp-final-cta-title">
            Ready to track your<br />
            <span className="lp-gradient-text">coding journey?</span>
          </h2>
          <p className="lp-final-cta-sub">
            Join your Medha Charitable Trust peers on CodeTrack today.
          </p>
          <div className="lp-hero-ctas">
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">
              🎓 Sign Up as Student
            </Link>
            <Link to="/login?role=coordinator" className="lp-btn lp-btn-ghost lp-btn-lg">
              🛡️ Coordinator Login
            </Link>
          </div>
        </div>
        <div className="lp-orb lp-orb-cta" aria-hidden="true" />
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-nav-logomark" />
        <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
          © 2025 CodeTrack · Built for Medha Charitable Trust · v1.0 Beta
        </span>
      </footer>
    </div>
  );
}
