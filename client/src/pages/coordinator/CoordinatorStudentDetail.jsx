import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

export function CoordinatorStudentDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res = await api.getJson(`/coordinator/students/${id}`, token);
        setStudent(res);
      } catch {
        navigate('/coordinator/students', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, id, navigate]);

  if (loading || !student) {
    return (
      <AppShell active="coord-students">
        <div className="ct-card">Loading…</div>
      </AppShell>
    );
  }

  const scores = student.scores || {};
  const platformStats = student.platformStats || {};
  const lc = platformStats.leetcode || {};
  const cc = platformStats.codechef || {};
  const hr = student.hackerrank || {};

  const initial = student.name ? student.name.charAt(0).toUpperCase() : '?';

  return (
    <AppShell active="coord-students">
      <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
        <Link to="/coordinator/students" style={{ textDecoration: 'underline', color: '#9ca3af' }}>
          ← Back to Students
        </Link>
      </div>
      <div className="ct-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="ct-avatar-circle" style={{ width: 42, height: 42, fontSize: '1.1rem' }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{student.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{student.email}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '0.25rem' }}>
              <span className="ct-chip">Score: {scores.totalScore || 0}</span>{' '}
              <span className="ct-chip">
                LC {scores.lcScore || 0} · CC {scores.ccScore || 0} · HR {scores.hrScore || 0}
              </span>
            </div>
            <div className="ct-pill">
              <span
                className={
                  student.activityStatus === 'active' ? 'ct-star-active' : 'ct-star-inactive'
                }
              >
                ⭐
              </span>
              <span style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {student.activityStatus === 'active' ? 'Very Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ct-grid-2" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="ct-card">
            <div className="ct-section-title">Personal details</div>
            <div style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>
              <p>
                <strong>College</strong>
                <br />
                {student.college || '—'}
              </p>
              <p>
                <strong>Branch</strong>
                <br />
                {student.branch || '—'}
              </p>
              <p>
                <strong>Year</strong>
                <br />
                {student.year || '—'}
              </p>
              <p>
                <strong>Hostel</strong>
                <br />
                {student.hostel || '—'}
              </p>
              <p>
                <strong>GPA</strong>
                <br />
                {student.overallGpa != null ? student.overallGpa : '—'}
              </p>
              <p>
                <strong>Links</strong>
                <br />
                {student.githubUrl && (
                  <>
                    <a href={student.githubUrl} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                    <br />
                  </>
                )}
                {student.linkedinUrl && (
                  <a href={student.linkedinUrl} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
              </p>
            </div>
          </div>

          <div className="ct-card" style={{ marginTop: '1rem' }}>
            <div className="ct-section-title">Recent activity</div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <p>
                Platform sync:{' '}
                {student.lastPlatformSyncAt
                  ? new Date(student.lastPlatformSyncAt).toLocaleString()
                  : 'Not yet synced'}
              </p>
              <p>
                Profile updated:{' '}
                {student.lastProfileUpdateAt
                  ? new Date(student.lastProfileUpdateAt).toLocaleString()
                  : 'Not yet updated'}
              </p>
              <p>
                Manual activity:{' '}
                {student.lastManualActivityAt
                  ? new Date(student.lastManualActivityAt).toLocaleString()
                  : 'No manual entries yet'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="ct-card">
            <div className="ct-section-title">Platform performance</div>
            <div style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>
              <p>
                <strong>LeetCode</strong>
                <br />
                @{student.leetcodeUsername || '—'}
                <br />
                Problems: {lc.problemsSolved || 0} · Contests: {lc.contestCount || 0} · Rating:{' '}
                {lc.rating || 0}
              </p>
              <p>
                <strong>CodeChef</strong>
                <br />
                @{student.codechefUsername || '—'}
                <br />
                Contests: {cc.contestCount || 0} · Rating: {cc.rating || 0}
              </p>
              <p>
                <strong>HackerRank</strong>
                <br />
                @{hr.username || '—'}
                <br />
                Problems: {hr.totalProblemsSolved || 0} · Badges: {hr.badgeCount || 0}
              </p>
            </div>
          </div>

          <div className="ct-card" style={{ marginTop: '1rem' }}>
            <div className="ct-section-title">Certificates</div>
            <div style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>
              {student.certifications && student.certifications.length > 0 ? (
                student.certifications.map((c, idx) => (
                  <p key={idx}>
                    <strong>{c.title}</strong>
                    <br />
                    {c.issuer || ''}{' '}
                    {c.date ? `· ${new Date(c.date).toLocaleDateString()}` : ''}
                    <br />
                    {c.credentialLink && (
                      <a href={c.credentialLink} target="_blank" rel="noreferrer">
                        Credential
                      </a>
                    )}
                  </p>
                ))
              ) : (
                <p>No certificates recorded.</p>
              )}
            </div>
          </div>

          <div className="ct-card" style={{ marginTop: '1rem' }}>
            <div className="ct-section-title">Hackathon participation</div>
            <div style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>
              {student.hackathons && student.hackathons.length > 0 ? (
                student.hackathons.map((h, idx) => (
                  <p key={idx}>
                    <strong>{h.name}</strong>
                    <br />
                    {h.mode} · {h.teamType} · {h.role || ''} · {h.outcome || ''}
                    {h.date ? ` · ${new Date(h.date).toLocaleDateString()}` : ''}
                  </p>
                ))
              ) : (
                <p>No hackathons recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

