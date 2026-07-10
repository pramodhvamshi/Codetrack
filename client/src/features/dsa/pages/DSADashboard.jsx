import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDSASheets } from '../api/dsaApi';
import { AppShell } from '../../../components/AppShell';

const DSADashboard = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const data = await getDSASheets();
        setSheets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSheets();
  }, []);

  return (
    <AppShell active="dsa-tracker">
      <div className="ct-card">
        <div className="ct-card-header">
          <h2 className="ct-card-title">DSA Practice Sheets</h2>
          <p className="ct-card-description">Track your progress across popular DSA sheets.</p>
        </div>
        <div className="ct-card-content">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
          ) : sheets.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>No sheets found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
              {sheets.map(sheet => (
                <div 
                  key={sheet._id} 
                  onClick={() => navigate(`/dsa/${sheet._id}`)}
                  className="hover-lift"
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{sheet.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sheet.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default DSADashboard;
