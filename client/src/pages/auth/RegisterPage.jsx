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
    confirmPassword: '',
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
  const [backendErrors, setBackendErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    mssid: false,
    password: false,
    confirmPassword: false
  });

  const isStudent = form.role === 'student';

  const validateField = (field, value) => {
    switch (field) {
      case 'email': {
        const val = value.trim().toLowerCase();
        if (!val) return 'Email is required';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(val)) {
          return 'Please enter a valid Gmail address ending with @gmail.com';
        }
        return '';
      }
      case 'mssid': {
        const val = value.trim().toUpperCase();
        if (!val) return 'MSSID is required';
        const mssidRegex = /^MSS\d{7}$/;
        if (!mssidRegex.test(val)) {
          return 'MSSID must be in the format MSS2020012';
        }
        return '';
      }
      case 'password': {
        const val = value;
        if (!val) return 'Password is required';
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,32}$/;
        if (!passwordRegex.test(val)) {
          return 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.';
        }
        // Blacklist check
        const PASSWORD_BLACKLIST = [
          "password", "password123", "admin123", "welcome123", "medha123",
          "password@123", "admin@123", "medha@123"
        ];
        const lowercasePw = val.toLowerCase();
        const isBlacklisted = PASSWORD_BLACKLIST.some(item => lowercasePw === item || lowercasePw.includes(item));
        if (isBlacklisted) {
          return 'Password is too weak (common patterns like "Password@123" or "Medha@123" are blacklisted).';
        }
        return '';
      }
      case 'confirmPassword': {
        if (!value) return 'Confirm Password is required';
        if (value !== form.password) {
          return 'Passwords do not match.';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', color: '', percentage: 0 };
    
    const hasMinLength = pw.length >= 8 && pw.length <= 32;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[@$!%*?&^#]/.test(pw);
    
    const PASSWORD_BLACKLIST = [
      "password", "password123", "admin123", "welcome123", "medha123",
      "password@123", "admin@123", "medha@123"
    ];
    const lowercasePw = pw.toLowerCase();
    const isBlacklisted = PASSWORD_BLACKLIST.some(item => lowercasePw === item || lowercasePw.includes(item));

    if (isBlacklisted || pw.length < 8) {
      return { label: 'Weak', color: 'var(--accent-red)', percentage: 25 };
    }

    let score = 0;
    if (hasMinLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;

    if (score <= 2) {
      return { label: 'Weak', color: 'var(--accent-red)', percentage: 25 };
    } else if (score === 3) {
      return { label: 'Medium', color: 'var(--accent-orange)', percentage: 50 };
    } else if (score === 4) {
      return { label: 'Strong', color: '#3B82F6', percentage: 75 };
    } else {
      return { label: 'Very Strong', color: 'var(--accent-green)', percentage: 100 };
    }
  };

  const handleChange = (field, value) => {
    let finalValue = value;
    if (field === 'mssid') {
      finalValue = value.toUpperCase();
    }
    setForm((prev) => ({ ...prev, [field]: finalValue }));
    if (['email', 'mssid', 'password', 'confirmPassword'].includes(field)) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
    if (backendErrors[field]) {
      setBackendErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const emailError = (touched.email ? validateField('email', form.email) : '') || backendErrors.email;
  const mssidError = (touched.mssid ? validateField('mssid', form.mssid) : '') || backendErrors.mssid;
  const passwordError = (touched.password ? validateField('password', form.password) : '') || backendErrors.password;
  const confirmPasswordError = (touched.confirmPassword ? validateField('confirmPassword', form.confirmPassword) : '') || backendErrors.confirmPassword;
  const strength = getPasswordStrength(form.password);

  const hasFrontendErrors = 
    validateField('email', form.email) ||
    validateField('mssid', form.mssid) ||
    validateField('password', form.password) ||
    validateField('confirmPassword', form.confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBackendErrors({});

    if (hasFrontendErrors) {
      setError('Please resolve all validation errors before submitting.');
      setTouched({
        email: true,
        mssid: true,
        password: true,
        confirmPassword: true
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        rememberMe: form.rememberMe
      };

      if (isStudent) {
        Object.assign(payload, {
          mssid: form.mssid.trim().toUpperCase(),
          college: form.college.trim(),
          hostel: form.hostel.trim(),
          branch: form.branch.trim(),
          year: form.year.trim(),
          overallGpa: Number(form.overallGpa),
          leetcodeUsername: form.leetcodeUsername.trim(),
          codechefUsername: form.codechefUsername.trim(),
          gfgUsername: form.gfgUsername.trim(),
          githubUsername: form.githubUsername.trim()
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
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.errors) {
          setBackendErrors(parsed.errors);
          setError(parsed.message || 'Registration failed');
        } else {
          setError(parsed.message || 'Registration failed');
        }
      } catch (e) {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-layout">
      <header className="ct-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img src="/logo-icon.png" alt="MEDHA CODE TRACK Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <div className="ct-header-title" style={{ fontSize: '0.9rem', fontWeight: 600 }}>MEDHA CODE TRACK · Medha Charitable Trust</div>
        </div>
      </header>

      <main className="ct-main">
        <div className="ct-card" style={{ maxWidth: 700, margin: '3.5rem auto' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Student Registration</h2>

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
                {touched.email && (
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    color: emailError ? 'var(--accent-red)' : 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {emailError ? `✗ ${emailError}` : '✓ Gmail address is valid.'}
                  </div>
                )}
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
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem', lineHeight: '1.25' }}>
                  8–32 characters, uppercase, lowercase, number and special character required.
                </div>
                {touched.password && (
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    color: passwordError ? 'var(--accent-red)' : 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {passwordError ? `✗ ${passwordError}` : '✓ Password format is valid.'}
                  </div>
                )}
                {form.password && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Password Strength:</span>
                      <span style={{ fontWeight: 600, color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ height: '4px', background: '#374151', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${strength.percentage}%`,
                        background: strength.color,
                        transition: 'width 0.3s ease, background-color 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="ct-label">Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ct-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    style={{
                      position: 'absolute', right: '0.65rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#9ca3af',
                      fontSize: '1rem', padding: 0, lineHeight: 1,
                    }}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {touched.confirmPassword && (
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    color: confirmPasswordError ? 'var(--accent-red)' : 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {confirmPasswordError ? `✗ ${confirmPasswordError}` : '✓ Passwords match.'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className="ct-label">MSSID *</label>
              <input
                className="ct-input"
                value={form.mssid}
                onChange={(e) => handleChange('mssid', e.target.value)}
                placeholder="MSS2020012"
                required
              />
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                Format: MSS2020012
              </div>
              {touched.mssid && (
                <div style={{
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  color: mssidError ? 'var(--accent-red)' : 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {mssidError ? `✗ ${mssidError}` : '✓ MSSID format is valid.'}
                </div>
              )}
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
