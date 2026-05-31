import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

/* ---------- EMPTY TEMPLATES ---------- */
const emptyProject = { name: '', highlight1: '', highlight2: '', githubUrl: '' };
const emptyCertification = { title: '', issuer: '', credentialLink: '' };
const emptyAchievement = { title: '', description: '' };
const emptyHackathon = { name: '', role: '', outcome: '' };

export function StudentProfile() {
  const { token } = useAuth();

  /* ---------- BASIC PROFILE ---------- */
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    hostel: '',
    branch: '',
    year: '',
    overallGpa: '',
    leetcodeUsername: '',
    codechefUsername: '',
    hackerrankUsername: '',
    githubUrl: '',
    linkedinUrl: ''
  });

  /* ---------- EXTRA SECTIONS ---------- */
  const [projects, setProjects] = useState([emptyProject]);
  const [certifications, setCertifications] = useState([emptyCertification]);
  const [achievements, setAchievements] = useState([emptyAchievement]);
  const [hackathons, setHackathons] = useState([emptyHackathon]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /* ---------- LOAD PROFILE ---------- */
  useEffect(() => {
    const load = async () => {
      const data = await api.getJson('/student/me', token);

      setForm({
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        hostel: data.hostel || '',
        branch: data.branch || '',
        year: data.year || '',
        overallGpa: data.overallGpa != null ? String(data.overallGpa) : '',
        leetcodeUsername: data.leetcodeUsername || '',
        codechefUsername: data.codechefUsername || '',
        hackerrankUsername: data.hackerrank?.username || '',
        githubUrl: data.githubUrl || '',
        linkedinUrl: data.linkedinUrl || ''
      });

      setProjects(
        data.projects?.length
          ? data.projects.map(p => ({
              name: p.name || '',
              highlight1: p.highlights?.[0] || '',
              highlight2: p.highlights?.[1] || '',
              githubUrl: p.githubUrl || ''
            }))
          : [emptyProject]
      );

      setCertifications(data.certifications?.length ? data.certifications : [emptyCertification]);
      setAchievements(data.achievements?.length ? data.achievements : [emptyAchievement]);
      setHackathons(data.hackathons?.length ? data.hackathons : [emptyHackathon]);

      setLoading(false);
    };
    load();
  }, [token]);

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.putJson(
        '/student/me/profile',
        {
          ...form,
          overallGpa: Number(form.overallGpa),
          hackerrank: { username: form.hackerrankUsername }
        },
        token
      );

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI HELPERS ---------- */
  const section = (accent) => ({
    padding: '1.4rem',
    borderRadius: '16px',
    marginBottom: '1.6rem',
    borderLeft: `5px solid ${accent}`,
    background: `linear-gradient(135deg, ${accent}22, rgba(0,0,0,0.35))`,
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)'
  });

  const helper = (text) => (
    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
      {text}
    </div>
  );

  if (loading) {
    return <AppShell><div className="ct-card">Loading…</div></AppShell>;
  }

  return (
    <AppShell active="student-profile">
      <div className="ct-card" style={{ maxWidth: 820, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Profile & Settings</h2>

        <form onSubmit={handleSubmit}>

          {/* PERSONAL */}
          <div style={section('#38bdf8')}>
            <div className="ct-section-title">Personal details</div>
            <div className="ct-grid-2">
              <div>
                <label className="ct-label">Name</label>
                <input className="ct-input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
                {helper('Used on resume and leaderboard')}
              </div>
              <div>
                <label className="ct-label">Email</label>
                <input className="ct-input" value={form.email} disabled />
              </div>
            </div>
          </div>

          {/* ACADEMIC */}
          <div style={section('#22c55e')}>
            <div className="ct-section-title">Academic details</div>
            <div className="ct-grid-2">
              <input className="ct-input" placeholder="College"
                value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
              <input className="ct-input" placeholder="Hostel"
                value={form.hostel} onChange={e => setForm({ ...form, hostel: e.target.value })} />
            </div>
            <div className="ct-grid-2">
              <input className="ct-input" placeholder="Branch"
                value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
              <input className="ct-input" placeholder="Year"
                value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <input className="ct-input" placeholder="Overall GPA"
              value={form.overallGpa} onChange={e => setForm({ ...form, overallGpa: e.target.value })} />
          </div>

          {/* PLATFORMS */}
          <div style={section('#f59e0b')}>
            <div className="ct-section-title">Platform usernames</div>
            <div className="ct-grid-2">
              <input className="ct-input" placeholder="LeetCode"
                value={form.leetcodeUsername}
                onChange={e => setForm({ ...form, leetcodeUsername: e.target.value })} />
              <input className="ct-input" placeholder="CodeChef"
                value={form.codechefUsername}
                onChange={e => setForm({ ...form, codechefUsername: e.target.value })} />
            </div>
            <input className="ct-input" placeholder="HackerRank"
              value={form.hackerrankUsername}
              onChange={e => setForm({ ...form, hackerrankUsername: e.target.value })} />
          </div>

          {/* LINKS */}
          <div style={section('#a78bfa')}>
            <div className="ct-section-title">Links</div>
            <div className="ct-grid-2">
              <input className="ct-input" placeholder="GitHub profile"
                value={form.githubUrl}
                onChange={e => setForm({ ...form, githubUrl: e.target.value })} />
              <input className="ct-input" placeholder="LinkedIn profile"
                value={form.linkedinUrl}
                onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} />
            </div>
          </div>

          {/* PROJECTS */}
          <div style={section('#f97316')}>
            <div className="ct-section-title">Projects</div>
            {projects.map((p, i) => (
              <div key={i}>
                <input className="ct-input" placeholder="Project name"
                  value={p.name}
                  onChange={e => {
                    const x = [...projects]; x[i].name = e.target.value; setProjects(x);
                  }} />
                <input className="ct-input" placeholder="Highlight 1"
                  value={p.highlight1}
                  onChange={e => {
                    const x = [...projects]; x[i].highlight1 = e.target.value; setProjects(x);
                  }} />
                <input className="ct-input" placeholder="Highlight 2"
                  value={p.highlight2}
                  onChange={e => {
                    const x = [...projects]; x[i].highlight2 = e.target.value; setProjects(x);
                  }} />
                <input className="ct-input" placeholder="GitHub repo link"
                  value={p.githubUrl}
                  onChange={e => {
                    const x = [...projects]; x[i].githubUrl = e.target.value; setProjects(x);
                  }} />
              </div>
            ))}
            <button type="button" className="ct-button-secondary"
              onClick={() => setProjects([...projects, emptyProject])}>
              ➕ Add project
            </button>
          </div>

          {/* CERTIFICATIONS */}
          <div style={section('#06b6d4')}>
            <div className="ct-section-title">Certifications</div>
            {certifications.map((c, i) => (
              <div key={i}>
                <input className="ct-input" placeholder="Title" value={c.title}
                  onChange={e => {
                    const x = [...certifications]; x[i].title = e.target.value; setCertifications(x);
                  }} />
                <input className="ct-input" placeholder="Issuer" value={c.issuer}
                  onChange={e => {
                    const x = [...certifications]; x[i].issuer = e.target.value; setCertifications(x);
                  }} />
                <input className="ct-input" placeholder="Credential link" value={c.credentialLink}
                  onChange={e => {
                    const x = [...certifications]; x[i].credentialLink = e.target.value; setCertifications(x);
                  }} />
              </div>
            ))}
            <button type="button" className="ct-button-secondary"
              onClick={() => setCertifications([...certifications, emptyCertification])}>
              ➕ Add certification
            </button>
          </div>

          {/* ACHIEVEMENTS */}
          <div style={section('#22c55e')}>
            <div className="ct-section-title">Achievements</div>
            {achievements.map((a, i) => (
              <div key={i}>
                <input className="ct-input" placeholder="Title" value={a.title}
                  onChange={e => {
                    const x = [...achievements]; x[i].title = e.target.value; setAchievements(x);
                  }} />
                <input className="ct-input" placeholder="Description" value={a.description}
                  onChange={e => {
                    const x = [...achievements]; x[i].description = e.target.value; setAchievements(x);
                  }} />
              </div>
            ))}
            <button type="button" className="ct-button-secondary"
              onClick={() => setAchievements([...achievements, emptyAchievement])}>
              ➕ Add achievement
            </button>
          </div>

          {/* HACKATHONS */}
          <div style={section('#ef4444')}>
            <div className="ct-section-title">Hackathons</div>
            {hackathons.map((h, i) => (
              <div key={i}>
                <input className="ct-input" placeholder="Hackathon name" value={h.name}
                  onChange={e => {
                    const x = [...hackathons]; x[i].name = e.target.value; setHackathons(x);
                  }} />
                <input className="ct-input" placeholder="Role" value={h.role}
                  onChange={e => {
                    const x = [...hackathons]; x[i].role = e.target.value; setHackathons(x);
                  }} />
                <input className="ct-input" placeholder="Outcome" value={h.outcome}
                  onChange={e => {
                    const x = [...hackathons]; x[i].outcome = e.target.value; setHackathons(x);
                  }} />
              </div>
            ))}
            <button type="button" className="ct-button-secondary"
              onClick={() => setHackathons([...hackathons, emptyHackathon])}>
              ➕ Add hackathon
            </button>
          </div>

          {error && <div style={{ color: '#f87171' }}>{error}</div>}
          {success && <div style={{ color: '#22c55e' }}>Profile saved successfully</div>}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.6rem' }}>
            <button className="ct-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>

        </form>
      </div>
    </AppShell>
  );
}
