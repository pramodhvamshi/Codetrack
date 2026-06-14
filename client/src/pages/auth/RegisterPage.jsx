import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',

    // student-only fields
    mssid: '',
    college: '',
    hostel: '',
    branch: '',
    year: '',
    overallGpa: '',
    leetcodeUsername: '',
    codechefUsername: '',
    gfgUsername: '',
    githubUsername: '',
    rememberMe: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const isStudent = form.role === 'student';

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        rememberMe: form.rememberMe
      };

      if (isStudent) {
        Object.assign(payload, {
          mssid: form.mssid,
          college: form.college,
          hostel: form.hostel,
          branch: form.branch,
          year: form.year,
          overallGpa: Number(form.overallGpa),
          leetcodeUsername: form.leetcodeUsername,
          codechefUsername: form.codechefUsername,
          gfgUsername: form.gfgUsername,
          githubUsername: form.githubUsername
        });
      }

      const res = await api.postJson('/auth/register', payload);
      login(res.token, res.user);

      navigate(
        res.user.role === 'student'
          ? '/student/dashboard'
          : '/coordinator/dashboard',
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-layout">
      <header className="ct-header">
        <div className="ct-header-title">CodeTrack · Medha Charitable Trust</div>
      </header>

      <main className="ct-main">
        <div className="ct-card" style={{ maxWidth: 700, margin: '3.5rem auto' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Create account</h2>

          <form onSubmit={handleSubmit}>
            {/* ACCOUNT DETAILS */}
            <div className="ct-section-title">Account details</div>

            <div className="ct-grid-2">
              <div>
                <label className="ct-label">Name *</label>
                <input
                  className="ct-input"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="ct-label">Email *</label>
                <input
                  className="ct-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="ct-grid-2" style={{ marginTop: '1rem' }}>
              <div>
                <label className="ct-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ct-input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute', right: '0.65rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#9ca3af',
                      fontSize: '1rem', padding: 0, lineHeight: 1,
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="ct-label">Role *</label>
                <select
                  className="ct-input"
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="coordinator">Coordinator</option>
                </select>
              </div>
            </div>
            
                {/* MSSID */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="ct-label">MSSID *</label>
                  <input
                    className="ct-input"
                    value={form.mssid}
                    onChange={(e) => handleChange('mssid', e.target.value)}
                    placeholder="MSS2022022"
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Example: MSS2022022
                  </div>
                </div>

            {/* STUDENT DETAILS */}
            {isStudent && (
              <>
                <div className="ct-section-title">Academic details</div>

                

                {/* COLLEGE */}
                <div className="ct-grid-2">
                  <div>
                    <label className="ct-label">College *</label>
                    <select
                      className="ct-input"
                      value={form.college}
                      onChange={(e) => handleChange('college', e.target.value)}
                      required
                    >
                      <option value="">Select college</option>
                      <option>CBIT</option>
                      <option>VASAVI</option>
                      <option>MVSR</option>
                      <option>GRIET</option>
                      <option>VARDHAMAN</option>
                      <option>JNTU</option>
                      <option>GNWC</option>
                      <option>BVRIT</option>
                      <option>OU</option>
                      <option>KMIT</option>
                      <option>HCU</option>
                      <option>NIT</option>
                      <option>IIT</option>
                      <option>Loyola</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="ct-label">Hostel *</label>
                    <select
                      className="ct-input"
                      value={form.hostel}
                      onChange={(e) => handleChange('hostel', e.target.value)}
                      required
                    >
                      <option value="">Select hostel</option>
                      <option>Mehdipatnam</option>
                      <option>Kukatpally</option>
                      <option>Uppal</option>
                      <option>Nagergul</option>
                      <option>Shamshabad</option>
                      <option>Loyola</option>
                    </select>
                  </div>
                </div>

                {/* BRANCH & YEAR */}
                <div className="ct-grid-2" style={{ marginTop: '1rem' }}>
                  <div>
                    <label className="ct-label">Branch *</label>
                    <select
                      className="ct-input"
                      value={form.branch}
                      onChange={(e) => handleChange('branch', e.target.value)}
                      required
                    >
                      <option value="">Select branch</option>
                      <option>CSE</option>
                      <option>CSB</option>
                      <option>CSD</option>
                      <option>CSM</option>
                      <option>AIML</option>
                      <option>IT</option>
                      <option>AIDS</option>
                      <option>ECE</option>
                      <option>CSE-IoT</option>
                      <option>CSC (Cybersecurity)</option>
                    </select>
                  </div>

                  <div>
                    <label className="ct-label">Year *</label>
                    <select
                      className="ct-input"
                      value={form.year}
                      onChange={(e) => handleChange('year', e.target.value)}
                      required
                    >
                      <option value="">Select year</option>
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                    </select>
                  </div>
                </div>

                {/* GPA */}
                <div style={{ marginTop: '1rem' }}>
                  <label className="ct-label">Overall GPA *</label>
                  <input
                    className="ct-input"
                    type="number"
                    step="0.01"
                    value={form.overallGpa}
                    onChange={(e) => handleChange('overallGpa', e.target.value)}
                    required
                  />
                </div>

                {/* PLATFORMS */}
                <div className="ct-section-title">Platform usernames</div>

                <div className="ct-grid-2">
                  <div>
                    <label className="ct-label">LeetCode *</label>
                    <input
                      className="ct-input"
                      value={form.leetcodeUsername}
                      onChange={(e) => handleChange('leetcodeUsername', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="ct-label">CodeChef *</label>
                    <input
                      className="ct-input"
                      value={form.codechefUsername}
                      onChange={(e) => handleChange('codechefUsername', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ct-grid-2" style={{ marginTop: '1rem' }}>
                  <div>
                    <label className="ct-label">GeeksforGeeks</label>
                    <input
                      className="ct-input"
                      value={form.gfgUsername}
                      onChange={(e) => handleChange('gfgUsername', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="ct-label">GitHub</label>
                    <input
                      className="ct-input"
                      value={form.githubUsername}
                      onChange={(e) => handleChange('githubUsername', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => handleChange('rememberMe', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" className="ct-label" style={{ marginBottom: 0, cursor: 'pointer', userSelect: 'none' }}>
                Remember Me
              </label>
            </div>

            {error && (
              <div style={{ color: '#f87171', marginTop: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              className="ct-button"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '1.4rem' }}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: '1.2rem', fontSize: '0.8rem', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ textDecoration: 'underline' }}>
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
