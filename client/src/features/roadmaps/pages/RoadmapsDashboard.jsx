import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoadmaps } from '../api/roadmapApi';
import { AppShell } from '../../../components/AppShell';

const RoadmapsDashboard = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const data = await getRoadmaps();
        setRoadmaps(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  return (
    <AppShell active="roadmaps">
      <div className="ct-card">
        <div className="ct-card-header">
          <h2 className="ct-card-title">Learning Roadmaps</h2>
          <p className="ct-card-description">Select a roadmap to begin your journey.</p>
        </div>
        <div className="ct-card-content">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
          ) : roadmaps.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>No roadmaps found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
              {roadmaps.map(rm => (
                <div 
                  key={rm._id} 
                  onClick={() => navigate(`/roadmaps/${rm._id}`)}
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
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{rm.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rm.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default RoadmapsDashboard;
