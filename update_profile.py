import re
import sys

file_path = r'c:\Users\Medha Trust\Downloads\codetrack\client\src\pages\shared\PublicStudentProfile.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add tab to tabs array
# Look for { key: 'achievements', label: '🏆 Achievements & Badges' },
content = content.replace(
    "{ key: 'achievements', label: '🏆 Achievements & Badges' },",
    "{ key: 'achievements', label: '🏆 Achievements & Badges' },\n    { key: 'certifications-hackathons', label: '🎓 Certifications & Hackathons' },"
)

# 2. Add CSS rules to PROFILE_STYLES
css_to_add = """
  /* ── INFO CARD ── */
  .info-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .info-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  }
  .status-badge {
    font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap;
  }
  .status-badge.verified { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
  .status-badge.unverified { background: rgba(156,163,175,0.15); color: #9ca3af; border: 1px solid rgba(156,163,175,0.3); }
  .status-badge.winner { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
  .status-badge.runner-up { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.3); }
  .status-badge.finalist { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
  .status-badge.participant { background: rgba(156,163,175,0.15); color: #9ca3af; border: 1px solid rgba(156,163,175,0.3); }
  
  .certs-hacks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
"""
content = content.replace("  .suggestion-item:hover {", css_to_add + "\n  .suggestion-item:hover {")

# 3. Add JSX block for certifications-hackathons
jsx_to_add = """
          {/* ── CERTIFICATIONS & HACKATHONS ── */}
          {activeTab === 'certifications-hackathons' && (() => {
            const certs = [...(profile.certifications || [])].sort((a, b) => {
              if (!a.issueDate) return 1;
              if (!b.issueDate) return -1;
              return new Date(b.issueDate) - new Date(a.issueDate);
            });
            const hacks = [...(profile.hackathons || [])].sort((a, b) => {
              if (!a.date) return 1;
              if (!b.date) return -1;
              return new Date(b.date) - new Date(a.date);
            });
            
            const hackWins = hacks.filter(h => {
              const res = (h.result || '').toLowerCase();
              return res.includes('winner') || res.includes('1st') || res === 'first';
            }).length;
            
            return (
              <div className="tab-panel">
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.8rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Info size={16} /> This is a read-only view. Editing remains inside Configure Student Profile.
                </div>
                
                {/* ACHIEVEMENTS SUMMARY */}
                <div className="ct-card" style={{ marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ marginBottom: '1.2rem' }}>⭐ Achievements Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🎓 Certifications</span>
                      <span style={{ fontWeight: 800 }}>{certs.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🏆 Hackathons</span>
                      <span style={{ fontWeight: 800 }}>{hacks.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🥇 Wins</span>
                      <span style={{ fontWeight: 800 }}>{hackWins}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>⭐ Total Achievements</span>
                      <span style={{ fontWeight: 800, color: '#f59e0b' }}>{certs.length + hacks.length}</span>
                    </div>
                  </div>
                </div>

                {/* CERTIFICATIONS */}
                <div className="ct-card">
                  <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>🎓 Certifications</h3>
                  {certs.length > 0 ? (
                    <div className="certs-hacks-grid">
                      {certs.map((c, i) => {
                        const verified = isValidUrl(c.credentialLink);
                        return (
                          <InfoCard
                            key={`cert-${i}`}
                            icon="🏅"
                            title={c.title}
                            subtitle={c.provider}
                            fields={[{ label: 'Issued', value: formatNiceDate(c.issueDate) }]}
                            badge={{ type: verified ? 'verified' : 'unverified', text: verified ? 'Verified' : 'No Credential' }}
                            actions={verified ? [{ label: 'Open Certificate', url: c.credentialLink }] : []}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '3rem 2rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#e5e7eb' }}>No Certifications Added</h3>
                      <p style={{ margin: 0 }}>This student hasn't added any certifications yet.</p>
                    </div>
                  )}
                </div>

                {/* HACKATHONS */}
                <div className="ct-card" style={{ marginTop: '1rem' }}>
                  <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>🏆 Hackathons</h3>
                  {hacks.length > 0 ? (
                    <div className="certs-hacks-grid">
                      {hacks.map((h, i) => {
                        const resLower = (h.result || '').toLowerCase();
                        let badgeType = 'participant';
                        let badgeText = h.result || 'Participant';
                        if (resLower.includes('winner') || resLower.includes('1st') || resLower === 'first') {
                          badgeType = 'winner';
                          badgeText = '🥇 ' + badgeText;
                        } else if (resLower.includes('runner')) {
                          badgeType = 'runner-up';
                          badgeText = '🥈 ' + badgeText;
                        } else if (resLower.includes('finalist')) {
                          badgeType = 'finalist';
                          badgeText = '🏅 ' + badgeText;
                        } else if (resLower) {
                          badgeText = '👨‍💻 ' + badgeText;
                        } else {
                          badgeText = '👨‍💻 Participant';
                        }
                        
                        const hasCert = isValidUrl(h.certificateLink);

                        return (
                          <InfoCard
                            key={`hack-${i}`}
                            icon="🏆"
                            title={h.name || h.hackathonName}
                            subtitle={h.organizer}
                            fields={[
                              { label: 'Date', value: formatNiceDate(h.date) },
                              { label: 'Team Size', value: h.teamSize },
                              { label: 'Position', value: h.position }
                            ]}
                            badge={{ type: badgeType, text: badgeText }}
                            description={h.description}
                            actions={hasCert ? [{ label: 'Certificate', url: h.certificateLink }] : []}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '3rem 2rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#e5e7eb' }}>No Hackathons Added</h3>
                      <p style={{ margin: 0 }}>This student hasn't added any hackathons yet.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

"""

content = content.replace("          {activeTab === 'activity' && (", jsx_to_add + "          {activeTab === 'activity' && (")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update complete")
