import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.postJson('/auth/login', {
        email,
        password
      });
      login(res.token, res.user);
      navigate(
        res.user.role === 'student' ? '/student/dashboard' : '/coordinator/students',
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-layout">
      <header className="ct-header">
        <div className="ct-header-title">CodeTrack · Academic Coding Analytics</div>
      </header>
      <main className="ct-main">
        <div className="ct-card" style={{ maxWidth: 420, margin: '4rem auto 0' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Sign in</h2>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
            Access your CodeTrack dashboard and leaderboard.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.9rem' }}>
              <label className="ct-label">Email</label>
              <input
                className="ct-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="ct-label">Password</label>
              <input
                className="ct-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div style={{ color: '#f97373', fontSize: '0.8rem', marginBottom: '0.9rem' }}>
                {error}
              </div>
            )}
            <button className="ct-button" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div
            style={{
              marginTop: '1.1rem',
              fontSize: '0.8rem',
              color: '#9ca3af',
              textAlign: 'center'
            }}
          >
            New to CodeTrack?{' '}
            <Link to="/register" style={{ textDecoration: 'underline' }}>
              Create account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

