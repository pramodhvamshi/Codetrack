import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AppShell } from '../components/AppShell';
import { alumniApi } from '../api/alumniApi';
import { AlumniProfileCard } from '../components/alumni/AlumniProfileCard';
import { AddAlumniModal } from '../components/alumni/AddAlumniModal';
import { ImportAlumniModal } from '../components/alumni/ImportAlumniModal';

export function AlumniDirectoryPage() {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [batch, setBatch] = useState('');
  const [branch, setBranch] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState({ companies: [], batches: [], branches: [] });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isAdminOrCoordinator = user && (user.role === 'admin' || user.role === 'coordinator');

  const fetchSuggestions = async () => {
    try {
      const res = await alumniApi.getSuggestions();
      if (res.success && res.data) {
        setSuggestions(res.data);
      }
    } catch (err) {
      console.error('Failed to load filter suggestions:', err);
    }
  };

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const res = await alumniApi.searchAlumni(1, query, batch, branch, company, location);
      if (res.success && res.data) {
        setAlumni(res.data.alumni || []);
      }
    } catch (err) {
      console.error('Failed to load alumni directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    fetchAlumni();
  }, [batch, branch, company, location]);

  return (
    <AppShell active="alumni">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              👥 Alumni Network & Directory
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Connect with Medha alumni working across top tech companies worldwide
            </p>
          </div>

          {isAdminOrCoordinator && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setIsImportModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                📥 Import Excel / CSV
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.6rem 1.4rem',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                ➕ Add Alumnus
              </button>
            </div>
          )}
        </div>

        {/* Filter Drawer */}
        <div style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '16px',
          padding: '1.2rem',
          marginBottom: '1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
          alignItems: 'center'
        }}>
          {/* Keyword Search */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAlumni()}
            placeholder="Search name, company, role..."
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />

          {/* Company Dropdown */}
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="">All Companies</option>
            {suggestions.companies.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>

          {/* Batch Dropdown */}
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="">All Graduation Batches</option>
            {suggestions.batches.map((b, idx) => (
              <option key={idx} value={b}>Batch {b}</option>
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
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="">All Branches</option>
            {suggestions.branches.map((b, idx) => (
              <option key={idx} value={b}>{b}</option>
            ))}
          </select>

          {/* Search Button */}
          <button
            onClick={fetchAlumni}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Search Alumni
          </button>
        </div>

        {/* Grid Layout */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted, #94a3b8)' }}>
            Loading alumni network...
          </div>
        ) : alumni.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'var(--bg-card, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--border, #334155)'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>👥</span>
            <h3 style={{ margin: 0, color: 'var(--text-primary, #f8fafc)' }}>No Alumni Found</h3>
            <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {alumni.map(person => (
              <AlumniProfileCard key={person._id} person={person} />
            ))}
          </div>
        )}

        {/* Add Alumni Modal */}
        <AddAlumniModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            fetchAlumni();
            fetchSuggestions();
          }}
        />

        {/* Import Alumni Excel Modal */}
        <ImportAlumniModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            fetchAlumni();
            fetchSuggestions();
          }}
        />
      </div>
    </AppShell>
  );
}
