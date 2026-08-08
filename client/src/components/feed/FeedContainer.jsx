import React, { useEffect, useState } from 'react';
import { feedApi } from '../../api/feedApi';
import { StartPostComposer } from './StartPostComposer';
import { GeneralPostCard } from './cards/GeneralPostCard';
import { AnnouncementCard } from './cards/AnnouncementCard';
import { AchievementCard } from './cards/AchievementCard';
import { ShowcaseCard } from './cards/ShowcaseCard';
import { PlacementCard } from './cards/PlacementCard';

export function FeedContainer({ user, onOpenCreateModal }) {
  const [feed, setFeed] = useState([]);
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchFeed = async (reset = false, newCat = category) => {
    try {
      setLoading(true);
      const targetPage = reset ? 1 : page;
      const res = await feedApi.getFeed(targetPage, newCat, 10);

      if (res.success && res.data) {
        const newItems = res.data.feed || [];
        setFeed(prev => reset ? newItems : [...prev, ...newItems]);
        setHasMore(res.data.pagination?.hasMore || false);
        if (reset) setPage(1);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(true, category);
  }, [category]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
  };

  const renderCard = (item) => {
    switch (item.postType || item.feedType) {
      case 'placement':
      case 'placement_recap':
        return <PlacementCard key={item.id} item={item} />;
      case 'announcement':
        return <AnnouncementCard key={item.id} item={item} />;
      case 'achievement':
        return <AchievementCard key={item.id} item={item} />;
      case 'showcase':
        return <ShowcaseCard key={item.id} item={item} />;
      default:
        return <GeneralPostCard key={item.id} item={item} />;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Start a Post Composer */}
      <StartPostComposer user={user} onPostCreated={() => fetchFeed(true, category)} />

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.65rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border, #334155)',
        paddingBottom: '0.85rem'
      }}>
        {[
          { key: 'all', label: '🌟 Main Feed' },
          { key: 'announcements', label: '📢 Announcements' },
          { key: 'placements', label: '💼 Placement Drives' },
          { key: 'showcase', label: '🚀 Student Showcase' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleCategoryChange(tab.key)}
            style={{
              background: category === tab.key ? '#3b82f6' : 'var(--bg-card, #1e293b)',
              color: category === tab.key ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '999px',
              padding: '0.45rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Stream */}
      {feed.length === 0 && !loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1rem',
          background: 'var(--bg-card, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--border, #334155)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>💬</span>
          <h3 style={{ margin: 0, color: 'var(--text-primary, #f8fafc)', fontSize: '1.1rem' }}>No Posts in Stream Yet</h3>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
            Be the first to share an update, project showcase, or ask a question above!
          </p>
        </div>
      ) : (
        <div>
          {feed.map(item => renderCard(item))}

          {loading && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              Loading stream...
            </div>
          )}

          {!loading && hasMore && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setPage(p => p + 1);
                  fetchFeed(false);
                }}
                style={{
                  background: 'var(--bg-card, #1e293b)',
                  color: 'var(--text-primary, #f8fafc)',
                  border: '1px solid var(--border, #334155)',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Load More Posts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
