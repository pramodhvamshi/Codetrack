import React from 'react';

export function ResumePreviewHTML({ templateKey = 'template_a', layout = {}, content = {} }) {
  const sectionsOrder = layout.sectionsOrder || [
    'academic',
    'profiles',
    'experience',
    'projects',
    'certifications',
    'achievements'
  ];
  const hiddenSections = layout.hiddenSections || [];

  const {
    personalDetails = {},
    education = [],
    skills = [],
    projects = [],
    workExperience = [],
    certifications = [],
    achievements = [],
    codingProfiles = {},
    hackathons = [],
    leadership = [],
    publications = [],
    customSections = []
  } = content;

  // Determine theme colors based on template
  const getTheme = () => {
    switch (templateKey) {
      case 'template_b': // Two Column Professional
        return {
          primary: '#1f2937', // Charcoal
          secondary: '#4b5563',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#ffffff',
          textColor: '#1f2937',
          accent: '#2563eb'
        };
      case 'template_c': // Modern Placement (Purple)
        return {
          primary: '#7c3aed', // Purple
          secondary: '#6d28d9',
          fontFamily: 'Georgia, serif',
          background: '#ffffff',
          textColor: '#1f2937',
          accent: '#7c3aed'
        };
      case 'template_d': // Software Engineer Focused (Dark Teal)
        return {
          primary: '#0d9488', // Teal
          secondary: '#0f766e',
          fontFamily: 'Courier New, monospace',
          background: '#ffffff',
          textColor: '#1f2937',
          accent: '#0d9488'
        };
      case 'template_e': // AI/ML Focused (Royal Blue)
        return {
          primary: '#1e3a8a', // Deep Blue
          secondary: '#1d4ed8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#ffffff',
          textColor: '#1f2937',
          accent: '#10b981' // Green highlight
        };
      case 'template_f': // Internship Focused (Emerald Green)
        return {
          primary: '#059669', // Emerald
          secondary: '#047857',
          fontFamily: 'system-ui, sans-serif',
          background: '#ffffff',
          textColor: '#1f2937',
          accent: '#059669'
        };
      case 'template_a': // Single Column ATS (Classic Blue)
      default:
        return {
          primary: '#1e3a8a', // Classic deep blue
          secondary: '#3b82f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#ffffff',
          textColor: '#111827',
          accent: '#1e3a8a'
        };
    }
  };

  const theme = getTheme();

  // Shared Styles
  const containerStyle = {
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    backgroundColor: theme.background,
    padding: '30px',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '840px',
    fontSize: '12px',
    lineHeight: '1.5',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(0,0,0,0.08)'
  };

  const hrStyle = {
    border: 0,
    borderTop: `1px solid ${theme.primary}`,
    margin: '4px 0 10px 0'
  };

  const sectionHeaderStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '15px',
    marginBottom: '2px'
  };

  // Helper date formatter
  const formatDateString = (dateVal) => {
    if (!dateVal) return 'Present';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  /* ================= SUB-RENDERERS ================= */

  // Personal Header
  const renderHeader = () => {
    const isTwoCol = templateKey === 'template_b';
    if (isTwoCol) {
      return (
        <div style={{ borderBottom: `2px solid ${theme.primary}`, paddingBottom: '12px', marginBottom: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: theme.primary, fontWeight: '800' }}>
            {personalDetails.name || 'Your Name'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: '6px', color: '#4b5563', fontSize: '11px' }}>
            {personalDetails.email && <span>📧 {personalDetails.email}</span>}
            {personalDetails.phone && <span>📞 {personalDetails.phone}</span>}
            {personalDetails.linkedinUrl && <span>🔗 LinkedIn</span>}
            {personalDetails.githubUrl && <span>💻 GitHub</span>}
          </div>
          {personalDetails.summary && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', fontStyle: 'italic', color: '#4b5563' }}>
              {personalDetails.summary}
            </p>
          )}
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: theme.primary, fontWeight: '800', textTransform: 'uppercase' }}>
          {personalDetails.name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 12px', marginTop: '4px', color: '#4b5563', fontSize: '11px' }}>
          {personalDetails.email && <span>{personalDetails.email}</span>}
          {personalDetails.phone && <span>| {personalDetails.phone}</span>}
          {personalDetails.linkedinUrl && (
            <span>
              | <a href={personalDetails.linkedinUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: theme.secondary }}>LinkedIn</a>
            </span>
          )}
          {personalDetails.githubUrl && (
            <span>
              | <a href={personalDetails.githubUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: theme.secondary }}>GitHub</a>
            </span>
          )}
          {personalDetails.portfolioUrl && (
            <span>
              | <a href={personalDetails.portfolioUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: theme.secondary }}>Portfolio</a>
            </span>
          )}
        </div>
        {personalDetails.summary && (
          <p style={{ margin: '8px auto 0 auto', maxWidth: '600px', fontSize: '11.5px', color: '#374151' }}>
            {personalDetails.summary}
          </p>
        )}
      </div>
    );
  };

  // Academic Details
  const renderAcademic = () => {
    if (education.length === 0) return null;
    return (
      <div key="academic">
        <h2 style={sectionHeaderStyle}>Education</h2>
        <hr style={hrStyle} />
        {education.map((edu, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{edu.institution || 'Institution Name'}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                {edu.startYear} - {edu.endYear}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#374151' }}>
              <span>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</span>
              {edu.gpa && <span style={{ fontWeight: 'bold' }}>GPA: {edu.gpa}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Coding Profiles
  const renderProfiles = () => {
    const lc = codingProfiles.leetcode || {};
    const cc = codingProfiles.codechef || {};
    const gfg = codingProfiles.gfg || {};
    const gh = codingProfiles.github || {};

    const hasAnyProfile =
      (lc.show && lc.username) ||
      (cc.show && cc.username) ||
      (gfg.show && gfg.username) ||
      (gh.show && gh.username);

    if (!hasAnyProfile) return null;

    return (
      <div key="profiles">
        <h2 style={sectionHeaderStyle}>Coding Profiles</h2>
        <hr style={hrStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 15px', marginBottom: '8px' }}>
          {lc.show && lc.username && (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#F59E0B' }}>LeetCode: @{lc.username}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>Showcasing problems solved & contest ratings.</span>
            </div>
          )}
          {cc.show && cc.username && (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#ef4444' }}>CodeChef: @{cc.username}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>Synced competitive ratings and ranking stars.</span>
            </div>
          )}
          {gfg.show && gfg.username && (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#22C55E' }}>GeeksforGeeks: @{gfg.username}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>Practice scores and coding streak highlights.</span>
            </div>
          )}
          {gh.show && gh.username && (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#8B5CF6' }}>GitHub: @{gh.username}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>Open source contributions, repositories and stars.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Work Experience
  const renderExperience = () => {
    if (workExperience.length === 0) return null;
    return (
      <div key="experience">
        <h2 style={sectionHeaderStyle}>Work Experience</h2>
        <hr style={hrStyle} />
        {workExperience.map((exp, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{exp.role || 'Role'} — {exp.company || 'Company'}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                {formatDateString(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDateString(exp.endDate)}
              </span>
            </div>
            {exp.location && <div style={{ fontStyle: 'italic', fontSize: '10.5px', color: '#6b7280' }}>{exp.location}</div>}
            {exp.description && (
              <p style={{ margin: '4px 0 0 0', color: '#374151', paddingLeft: '8px', borderLeft: `2px solid ${theme.secondary}` }}>
                {exp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Projects
  const renderProjects = () => {
    if (projects.length === 0) return null;
    return (
      <div key="projects">
        <h2 style={sectionHeaderStyle}>Academic & Personal Projects</h2>
        <hr style={hrStyle} />
        {projects.map((proj, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{proj.name || 'Project Name'}</span>
              <span style={{ fontSize: '11px', color: theme.secondary }}>
                {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" style={{ marginRight: '8px', textDecoration: 'underline' }}>Code</a>}
                {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Live Demo</a>}
              </span>
            </div>
            {proj.techStack && proj.techStack.length > 0 && (
              <div style={{ fontSize: '10.5px', color: '#4b5563', margin: '2px 0' }}>
                <strong>Technologies:</strong> {proj.techStack.join(', ')}
              </div>
            )}
            {proj.description && <p style={{ margin: '2px 0 0 0', color: '#374151' }}>{proj.description}</p>}
            {proj.highlights && proj.highlights.length > 0 && (
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '15px', color: '#4b5563' }}>
                {proj.highlights.map((h, i) => h ? <li key={i}>{h}</li> : null)}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Certifications
  const renderCertifications = () => {
    if (certifications.length === 0) return null;
    return (
      <div key="certifications">
        <h2 style={sectionHeaderStyle}>Certifications</h2>
        <hr style={hrStyle} />
        <ul style={{ margin: 0, paddingLeft: '15px' }}>
          {certifications.map((cert, index) => (
            <li key={index} style={{ marginBottom: '4px' }}>
              <strong>{cert.title}</strong> — {cert.issuer}
              {cert.date && ` (${formatDateString(cert.date)})`}
              {cert.credentialLink && (
                <span style={{ fontSize: '10.5px' }}>
                  {' '}— <a href={cert.credentialLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: theme.secondary }}>Verify</a>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Achievements & Hackathons
  const renderAchievements = () => {
    const hasAchievements = achievements.length > 0;
    const hasHackathons = hackathons.length > 0;
    if (!hasAchievements && !hasHackathons) return null;

    return (
      <div key="achievements">
        <h2 style={sectionHeaderStyle}>Achievements & Hackathons</h2>
        <hr style={hrStyle} />
        <ul style={{ margin: 0, paddingLeft: '15px' }}>
          {achievements.map((ach, index) => (
            <li key={`ach-${index}`} style={{ marginBottom: '4px' }}>
              <strong>{ach.title}</strong>
              {ach.description && `: ${ach.description}`}
            </li>
          ))}
          {hackathons.map((h, index) => (
            <li key={`hack-${index}`} style={{ marginBottom: '4px' }}>
              <strong>Hackathon: {h.name}</strong> ({h.mode}) — Role: {h.role || 'Participant'} {h.outcome ? `(${h.outcome})` : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Skills
  const renderSkills = () => {
    if (skills.length === 0) return null;
    return (
      <div key="skills">
        <h2 style={sectionHeaderStyle}>Skills</h2>
        <hr style={hrStyle} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {skills.map((skill, index) => (
            <span
              key={index}
              style={{
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '30px',
                padding: '3px 8px',
                fontSize: '11px',
                color: theme.textColor
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Leadership & Extracurriculars
  const renderLeadership = () => {
    if (leadership.length === 0) return null;
    return (
      <div key="leadership">
        <h2 style={sectionHeaderStyle}>Leadership & Volunteering</h2>
        <hr style={hrStyle} />
        {leadership.map((lead, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{lead.role} — {lead.organization}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                {formatDateString(lead.startDate)} - {formatDateString(lead.endDate)}
              </span>
            </div>
            {lead.description && <p style={{ margin: '2px 0 0 0', color: '#4b5563' }}>{lead.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  // Publications & Research
  const renderPublications = () => {
    if (publications.length === 0) return null;
    return (
      <div key="publications">
        <h2 style={sectionHeaderStyle}>Publications & Patents</h2>
        <hr style={hrStyle} />
        {publications.map((pub, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{pub.title}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>{formatDateString(pub.date)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563' }}>
              Publisher: {pub.publisher}
              {pub.link && ` | Link: `}
              {pub.link && <a href={pub.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: theme.secondary }}>View</a>}
            </div>
            {pub.description && <p style={{ margin: '2px 0 0 0', color: '#4b5563' }}>{pub.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  // Custom Sections rendering
  const renderCustom = (secId) => {
    const cSec = customSections.find(s => s.sectionId === secId || s.title === secId);
    if (!cSec || !cSec.title) return null;
    return (
      <div key={cSec.sectionId || cSec.title}>
        <h2 style={sectionHeaderStyle}>{cSec.title}</h2>
        <hr style={hrStyle} />
        <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>{cSec.content}</p>
      </div>
    );
  };

  // Main Section Dispatcher
  const renderSectionByKey = (key) => {
    if (hiddenSections.includes(key)) return null;

    switch (key) {
      case 'academic':
        return renderAcademic();
      case 'profiles':
        return renderProfiles();
      case 'experience':
        return renderExperience();
      case 'projects':
        return renderProjects();
      case 'certifications':
        return renderCertifications();
      case 'achievements':
        return renderAchievements();
      case 'skills':
        return renderSkills();
      case 'leadership':
        return renderLeadership();
      case 'publications':
        return renderPublications();
      default:
        // Try rendering as a custom section ID
        return renderCustom(key);
    }
  };

  /* ================= TEMPLATE LAYOUT RENDER MODES ================= */

  // Render Template B as a Two-Column Layout
  const renderTwoColumnLayout = () => {
    // In Template B:
    // Left column: Personal, Skills, Coding Profiles, Achievements, Certifications
    // Right column: Academic, Work Experience, Projects, Leadership, Publications, Custom Sections
    const leftKeys = ['skills', 'profiles', 'certifications', 'achievements'];
    const rightKeys = ['academic', 'experience', 'projects', 'leadership', 'publications'];

    // Also distribute custom sections or custom ordered list keys
    const orderedLeft = sectionsOrder.filter(k => leftKeys.includes(k) || k === 'skills');
    const orderedRight = sectionsOrder.filter(k => !leftKeys.includes(k) && k !== 'skills');

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px', marginTop: '15px' }}>
        {/* LEFT COLUMN */}
        <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '15px' }}>
          {orderedLeft.map(k => renderSectionByKey(k))}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {orderedRight.map(k => renderSectionByKey(k))}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      {renderHeader()}
      {templateKey === 'template_b' ? (
        renderTwoColumnLayout()
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {sectionsOrder.map(k => renderSectionByKey(k))}
        </div>
      )}
    </div>
  );
}
