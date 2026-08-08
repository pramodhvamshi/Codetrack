import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoadmaps } from '../api/roadmapApi';
import { AppShell } from '../../../components/AppShell';
import { RoadmapBrandIcon } from '../components/RoadmapBrandIcon';
import { Search } from 'lucide-react';

const CATEGORY_ORDER = [
  'Core Programming',
  'Computer Science Fundamentals',
  'System Design & Development',
  'AI & Cloud Engineering'
];

export const RoadmapsDashboard = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllRoadmaps = async () => {
      setLoading(true);
      try {
        const data = await getRoadmaps();
        setRoadmaps(data || []);
      } catch (err) {
        console.error('Failed to load roadmaps landing page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRoadmaps();
  }, []);

  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return roadmaps;

    return roadmaps.filter((rm) => {
      return (
        rm.title.toLowerCase().includes(query) ||
        (rm.description && rm.description.toLowerCase().includes(query)) ||
        (rm.category && rm.category.toLowerCase().includes(query))
      );
    });
  }, [roadmaps, searchQuery]);

  const groupedCategories = useMemo(() => {
    const groups = {
      'Core Programming': [],
      'Computer Science Fundamentals': [],
      'System Design & Development': [],
      'AI & Cloud Engineering': []
    };

    filteredRoadmaps.forEach((rm) => {
      const title = rm.title.toLowerCase();

      if (
        title.includes('java') ||
        title.includes('python') ||
        title.includes('c++') ||
        title.includes('javascript') ||
        title.includes('go') ||
        title.includes('sql') ||
        title.includes('git')
      ) {
        groups['Core Programming'].push(rm);
      } else if (
        title.includes('data structure') ||
        title.includes('dsa') ||
        title.includes('operating system') ||
        title.includes('computer network') ||
        title.includes('dbms')
      ) {
        groups['Computer Science Fundamentals'].push(rm);
      } else if (
        title.includes('frontend') ||
        title.includes('backend') ||
        title.includes('spring boot') ||
        title.includes('system design')
      ) {
        groups['System Design & Development'].push(rm);
      } else {
        groups['AI & Cloud Engineering'].push(rm);
      }
    });

    return groups;
  }, [filteredRoadmaps]);

  return (
    <AppShell active="roadmaps">
      <div className="ct-roadmaps-dashboard">
        <div className="ct-roadmaps-container">
          
          {/* ALGOMASTER HEADER SECTION */}
          <div className="ct-roadmaps-header">
            <h1 className="ct-roadmaps-title">Learning Roadmaps</h1>
            <p className="ct-roadmaps-subtitle">
              Pick a roadmap to see a concise, opinionated sequence of topics that will take you from beginner to advanced.
            </p>

            {/* SEARCH INPUT BAR */}
            <div className="ct-search-box">
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roadmaps..."
                className="ct-search-input"
              />
            </div>
          </div>

          {/* CATEGORIES DIRECTORY */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading learning roadmaps...
            </div>
          ) : (
            <div>
              {CATEGORY_ORDER.map((categoryName) => {
                const items = groupedCategories[categoryName] || [];
                if (items.length === 0) return null;

                return (
                  <div key={categoryName} className="ct-category-section">
                    <h2 className="ct-category-title">{categoryName}</h2>

                    <div className="ct-cards-grid">
                      {items.map((rm) => (
                        <div
                          key={rm._id}
                          onClick={() => navigate(`/roadmaps/${rm._id}`)}
                          className="ct-roadmap-card"
                        >
                          <span className="ct-card-title">
                            {rm.title.replace(' Developer', '').replace(' Programming', '')}
                          </span>

                          <RoadmapBrandIcon title={rm.title} size={28} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
};

export default RoadmapsDashboard;
