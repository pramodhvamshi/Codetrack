import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';

export function StudentDirectoryPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ hostels: [], branches: [], colleges: [], years: [] });

  // Filters State
  const [query, setQuery] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [hostel, setHostel] = useState('');

  const fetchFilterSuggestions = async () => {
    try {
      const res = await api.getJson('/v2/alumni/student-filters');
      if (res.success && res.data) {
        setFilterOptions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch student filter suggestions:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (query) queryParams.append('query', query);
      if (college) queryParams.append('college', college);
      if (branch) queryParams.append('branch', branch);
      if (currentYear) queryParams.append('currentYear', currentYear);
      if (hostel) queryParams.append('hostel', hostel);

      const res = await api.getJson(`/v2/alumni/students?${queryParams.toString()}`);
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch student directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterSuggestions();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [college, branch, currentYear, hostel]);

  return (
    <AppShell active="students-directory">
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
            🎓 Registered Junior Students Directory & Contacts
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Search registered students filtered by College, Year, Hostel location, and Branch to offer mentorship or view their public profiles.
          </p>
        </div>

        {/* Filter Drawer */}
        <div style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
          alignItems: 'center'
        }}>
          {/* Keyword Search */}
          <input
            type="text"
            placeholder="Search student name, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />

          {/* Year Dropdown */}
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="">All Academic Years</option>

            {(filterOptions.years.length > 0
              ? filterOptions.years
              : ['1st Year', '2nd Year', '3rd Year', '4th Year']
            ).map((yr, idx) => (
              <option key={idx} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Branch Dropdown */}
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="">All Branches</option>
            {(filterOptions.branches.length > 0
              ? filterOptions.branches
              : ['CSE', 'IT', 'ECE', 'EEE', 'AIML', 'CSM', 'AI&DS', 'Civil', 'Mechanical']
            ).map((b, idx) => (
              <option key={idx} value={b}>{b}</option>
            ))}
          </select>

          {/* Hostel / Residency Dropdown */}
          <select
            value={hostel}
            onChange={(e) => setHostel(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="">All Residency Locations / Hostels</option>
            {(filterOptions.hostels.length > 0
              ? filterOptions.hostels
              : ['Hosteller', 'Day Scholar', 'Kukatpally', 'Mehdipatnam', 'Campus Hostel']
            ).map((h, idx) => (
              <option key={idx} value={h}>{h}</option>
            ))}
          </select>

          {/* Search Button */}
          <button
            onClick={fetchStudents}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Search Students
          </button>
        </div>

        {/* Student Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading student directory...</div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, #334155)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🎓</span>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>No Students Found</h3>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Try adjusting your search criteria or clear filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
            {students.map(st => {
              const initials = st.name ? st.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'S';
              const phone = st.phoneNumber || '';
              const profilePath = `/student/profile/view/${st._id}`;

              return (
                <div
                  key={st._id}
                  style={{
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'transform 0.15s, border-color 0.15s'
                  }}
                >
                  <div>
                    {/* Top Avatar & Name (Clickable to Public Profile) */}
                    <div
                      onClick={() => navigate(profilePath)}
                      style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}>
                        {initials}
                      </div>

                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                          {st.name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                          {st.branch || 'CSE'} ({st.currentYear || st.year || 'Student'})
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                        🏛️ {st.college || 'CBIT'}
                      </span>
                      {st.hostel && (
                        <span style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#c084fc', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                          🏠 {st.hostel}
                        </span>
                      )}
                    </div>

                    {/* Contact Info Details */}
                    <div style={{ background: 'var(--bg-secondary, #0f172a)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--border, #334155)', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div>📧 <strong>Email:</strong> {st.email}</div>
                      <div>📞 <strong>Phone:</strong> {phone || 'Not specified'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
                    <button
                      onClick={() => navigate(profilePath)}
                      style={{
                        width: '100%',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: '8px',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      👤 View Public Profile & Coding Stats
                    </button>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => navigate(`/messages?recipientId=${st._id}&name=${encodeURIComponent(st.name)}`)}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.45rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        💬 Chat
                      </button>

                      {st.email && (
                        <a
                          href={`mailto:${st.email}`}
                          style={{
                            background: 'var(--bg-secondary, #0f172a)',
                            color: '#60a5fa',
                            border: '1px solid var(--border, #334155)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          📧 Email
                        </a>
                      )}

                      {phone && (
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          📱 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
