import React, { useState } from 'react';
import { LinkedInReactionPicker } from '../LinkedInReactionPicker';
import { TwitterNestedComments } from '../TwitterNestedComments';

export function PlacementCard({ item }) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount || 0);

  const pm = item.placementMetadata || {};
  const meta = item.metadata || {};

  const companyName = pm.company || meta.company || item.title || 'Placement Drive';
  const roleName = pm.role || meta.role || 'Software Engineer';
  const hackerRankUrl = pm.hackerRankUrl || meta.registrationLink || '';
  const rounds = pm.rounds || [];
  const taggedStudents = pm.taggedStudents || [];

  const initials = item.author?.name
    ? item.author.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'P';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
      border: '1px solid rgba(59, 130, 246, 0.35)',
      borderRadius: '16px',
      padding: '1.35rem',
      marginBottom: '1.25rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      position: 'relative'
    }}>
      {/* Top Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              {item.author?.name || 'Placement Coordinator'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <span style={{
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          padding: '0.2rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          💼 Placement Drive & Recaps
        </span>
      </div>

      {/* Company Title & Role */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
          🏢 {companyName}
        </h3>
        <div style={{ fontSize: '0.88rem', color: '#93c5fd', fontWeight: 600 }}>
          Role: {roleName} {meta.salary ? `• Package: ${meta.salary}` : ''}
        </div>
      </div>

      {/* Content / JD */}
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, whitespace: 'pre-line' }}>
        {item.content}
      </p>

      {/* HackerRank Practice Contest Link Button */}
      {hackerRankUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <a
            href={hackerRankUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            ⚡ Practice HackerRank Contest Link 🎯
          </a>
        </div>
      )}

      {/* Interview Process Rounds Timeline */}
      {rounds && rounds.length > 0 && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>
            🔄 RECRUITMENT ROUNDS & INTERVIEW FLOW:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {rounds.map((r, idx) => (
              <div key={idx} style={{ fontSize: '0.83rem', color: '#cbd5e1', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>Step {idx + 1}:</span>
                <span><strong style={{ color: '#f8fafc' }}>{r.name}:</strong> {r.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tagged Participating Students */}
      {taggedStudents && taggedStudents.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Tagged Participants:</span>
          {taggedStudents.map((s, idx) => (
            <span
              key={s._id || idx}
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#c084fc',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              @{s.name || 'student'}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: LinkedIn Reaction Picker + Comments Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #334155)' }}>
        <LinkedInReactionPicker
          postId={item.dbId}
          initialReactions={item.reactionCounts || {}}
          initialUserReaction={item.userReaction || null}
          initialTotal={item.totalReactions || item.likesCount || 0}
        />

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          💬 Comments & Replies ({commentCount})
        </button>
      </div>

      {/* Twitter Nested Comments Section */}
      <TwitterNestedComments
        postId={item.dbId}
        isOpen={showComments}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />
    </div>
  );
}
