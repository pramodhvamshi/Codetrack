import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { AppShell } from '../../../components/AppShell';
import { LeaveRequestTab } from '../components/LeaveRequestTab';
import { MentoringTab } from '../components/MentoringTab';
import { LaptopManagementTab } from '../components/LaptopManagementTab';
import { FileText, Calendar, Laptop } from 'lucide-react';

export function CoordinatorServicesDashboard() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active sub-tab: 'leave' | 'mentoring' | 'laptop'
  const currentTab = searchParams.get('tab') || 'leave';
  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['leave', 'mentoring', 'laptop'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <AppShell active="services">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
        {/* Header Title */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>Coordinator Services Desk</h1>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Review student leave requests, manage mentoring slots & notes, and update laptop inventory audit table</p>
          </div>

          {/* Sub Tab Switcher Pills */}
          <div style={{ display: 'flex', background: 'rgba(9, 13, 22, 0.9)', padding: '0.4rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.25)', gap: '0.4rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <button
              type="button"
              onClick={() => handleTabChange('leave')}
              style={{
                background: activeTab === 'leave' ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' : 'transparent',
                color: activeTab === 'leave' ? '#ffffff' : '#94a3b8',
                border: activeTab === 'leave' ? '1px solid #3b82f6' : '1px solid transparent',
                padding: '0.6rem 1.1rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'leave' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <FileText size={16} /> Leave Requests
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('mentoring')}
              style={{
                background: activeTab === 'mentoring' ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' : 'transparent',
                color: activeTab === 'mentoring' ? '#ffffff' : '#94a3b8',
                border: activeTab === 'mentoring' ? '1px solid #3b82f6' : '1px solid transparent',
                padding: '0.6rem 1.1rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'mentoring' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Calendar size={16} /> Mentoring Requests
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('laptop')}
              style={{
                background: activeTab === 'laptop' ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' : 'transparent',
                color: activeTab === 'laptop' ? '#ffffff' : '#94a3b8',
                border: activeTab === 'laptop' ? '1px solid #3b82f6' : '1px solid transparent',
                padding: '0.6rem 1.1rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'laptop' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Laptop size={16} /> Laptop Requests & Audit Table
            </button>
          </div>
        </div>

        {/* Tab Content Views */}
        <div>
          {activeTab === 'leave' && <LeaveRequestTab role="coordinator" token={token} />}
          {activeTab === 'mentoring' && <MentoringTab role="coordinator" token={token} />}
          {activeTab === 'laptop' && <LaptopManagementTab role="coordinator" token={token} />}
        </div>
      </div>
    </AppShell>
  );
}
