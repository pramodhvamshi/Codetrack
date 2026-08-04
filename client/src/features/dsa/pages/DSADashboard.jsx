import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDSASheets } from '../api/dsaApi';
import { AppShell } from '../../../components/AppShell';
import { BookOpen, ExternalLink, Code } from 'lucide-react';

const DSADashboard = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const data = await getDSASheets();
        setSheets(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSheets();
  }, []);

  return (
    <AppShell active="dsa">
      <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#0b0f17', color: '#f8fafc', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              DSA Practice Sheets
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Master Data Structures & Algorithms topic-wise with curated problem sheets and progress tracking.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading practice sheets...
            </div>
          ) : sheets.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No sheets found.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {sheets.map((sheet) => (
                <div 
                  key={sheet._id} 
                  onClick={() => navigate(`/dsa/${sheet._id}`)}
                  style={{
                    padding: '1.75rem',
                    backgroundColor: '#121824',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.backgroundColor = '#161e2e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1e293b';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.backgroundColor = '#121824';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sheet.source === 'algomaster' ? '#60a5fa' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {sheet.source === 'algomaster' ? 'AlgoMaster 771 Sheet' : 'Striver A2Z Sheet'}
                      </span>
                      <Code size={20} style={{ color: '#64748b' }} />
                    </div>

                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                      {sheet.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {sheet.description}
                    </p>
                  </div>

                  {sheet.source === 'algomaster' && (
                    <div style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      <ExternalLink size={13} /> Referenced from AlgoMaster
                    </div>
                  )}
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
