import React, { useEffect, useState } from 'react';
import { notificationApi } from '../../api/notificationApi';

export function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications(20);
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAsRead([], true);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '360px',
      maxWidth: '90vw',
      background: 'var(--bg-card, #1e293b)',
      borderLeft: '1px solid var(--border, #334155)',
      boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.4)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.25s ease'
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border, #334155)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔔</span>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary, #f8fafc)' }}>Notifications</h3>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '0.15rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--border, #334155)', textAlign: 'right' }}>
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>You're all caught up! No new notifications.</p>
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item._id || item.id}
              style={{
                padding: '0.85rem',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                background: item.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                border: item.isRead ? '1px solid var(--border, #334155)' : '1px solid rgba(59, 130, 246, 0.3)',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary, #f8fafc)', marginBottom: '0.2rem' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.4rem' }}>
                {item.message}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
