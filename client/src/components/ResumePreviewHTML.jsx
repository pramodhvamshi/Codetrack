import React from 'react';

// Map legacy template keys to the new canonical keys
const LEGACY_KEY_MAP = {
  template_a: 'single_column',
  template_c: 'single_column',
  template_d: 'single_column',
  template_f: 'single_column',
  template_b: 'double_column',
  template_e: 'double_column'
};

export function ResumePreviewHTML({ templateKey = 'single_column', layout = {}, content = {} }) {
  // Normalize template key
  const resolvedKey = LEGACY_KEY_MAP[templateKey] || templateKey;

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

  // ─── Typography & palette (strict monochrome) ───
  const FONT  = "'Helvetica Neue', Arial, Helvetica, sans-serif";
  const C_HEAD  = '#111827';
  const C_BODY  = '#374151';
  const C_MUTED = '#6B7280';
  const C_LINE  = '#D1D5DB';
  const C_BG    = '#ffffff';

  const containerStyle = {
    fontFamily: FONT,
    color: C_BODY,
    backgroundColor: C_BG,
    padding: '28px 32px',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '840px',
    fontSize: '11px',
    lineHeight: '1.55',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    borderRadius: '3px'
  };

  const sectionHeaderStyle = {
    fontSize: '9.5px',
    fontWeight: '800',
    color: C_HEAD,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginTop: '14px',
    marginBottom: '3px'
  };

  const hrStyle = {
    border: 0,
    borderTop: `0.75px solid ${C_LINE}`,
    margin: '3px 0 8px 0'
  };

  const formatDateString = (dateVal) => {
    if (!dateVal) return 'Present';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  /* ═══════════════════════════ SECTION RENDERERS ═══════════════════════════ */

  const renderPersonalHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
      <h1 style={{ margin: 0, fontSize: '18px', color: C_HEAD, fontWeight: '800', letterSpacing: '0.02em' }}>
        {personalDetails.name || 'Your Name'}
      </h1>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 10px', marginTop: '4px', color: C_MUTED, fontSize: '9.5px' }}>
        {personalDetails.email    && <span>{personalDetails.email}</span>}
        {personalDetails.phone    && <span>| {personalDetails.phone}</span>}
        {personalDetails.linkedinUrl && <span>| <a href={personalDetails.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: C_MUTED, textDecoration: 'underline' }}>LinkedIn</a></span>}
        {personalDetails.githubUrl   && <span>| <a href={personalDetails.githubUrl}   target="_blank" rel="noreferrer" style={{ color: C_MUTED, textDecoration: 'underline' }}>GitHub</a></span>}
        {personalDetails.portfolioUrl && <span>| <a href={personalDetails.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: C_MUTED, textDecoration: 'underline' }}>Portfolio</a></span>}
      </div>
      {personalDetails.summary && (
        <p style={{ margin: '7px auto 0', maxWidth: '90%', fontSize: '9.5px', color: C_BODY, fontStyle: 'italic' }}>
          {personalDetails.summary}
        </p>
      )}
    </div>
  );

  const renderAcademic = () => {
    if (education.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Education</h2>
        <hr style={hrStyle} />
        {education.map((edu, i) => (
          <div key={i} style={{ marginBottom: '7px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: C_HEAD }}>
              <span>{edu.institution || 'Institution'}</span>
              <span style={{ fontWeight: '400', color: C_MUTED, fontSize: '9px' }}>{edu.startYear} – {edu.endYear || 'Present'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: C_BODY, fontSize: '9.5px' }}>
              <span>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</span>
              {edu.gpa && <span style={{ fontWeight: '600' }}>GPA: {edu.gpa}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProfiles = () => {
    const lc = codingProfiles.leetcode || {};
    const cc = codingProfiles.codechef || {};
    const gfg = codingProfiles.gfg || {};
    const gh = codingProfiles.github || {};
    const profiles = [];
    if (lc.show && lc.username)  profiles.push({ label: 'LeetCode',      username: lc.username });
    if (cc.show && cc.username)  profiles.push({ label: 'CodeChef',       username: cc.username });
    if (gfg.show && gfg.username) profiles.push({ label: 'GeeksforGeeks', username: gfg.username });
    if (gh.show && gh.username)  profiles.push({ label: 'GitHub',         username: gh.username });
    if (profiles.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Coding Profiles</h2>
        <hr style={hrStyle} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          {profiles.map((p, i) => (
            <span key={i} style={{ fontSize: '9.5px', color: C_BODY }}>
              <strong style={{ color: C_HEAD }}>{p.label}:</strong> @{p.username}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderExperience = () => {
    if (workExperience.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Work Experience</h2>
        <hr style={hrStyle} />
        {workExperience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: C_HEAD }}>
              <span>{exp.role || 'Role'} — {exp.company || 'Company'}</span>
              <span style={{ fontWeight: '400', color: C_MUTED, fontSize: '9px' }}>
                {formatDateString(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDateString(exp.endDate)}
              </span>
            </div>
            {exp.location && <div style={{ fontSize: '9px', color: C_MUTED }}>{exp.location}</div>}
            {exp.description && (
              <p style={{ margin: '3px 0 0', color: C_BODY, paddingLeft: '8px', borderLeft: `2px solid ${C_LINE}`, fontSize: '9.5px' }}>
                {exp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProjects = () => {
    if (projects.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Projects</h2>
        <hr style={hrStyle} />
        {projects.map((proj, i) => (
          <div key={i} style={{ marginBottom: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: C_HEAD }}>
              <span>{proj.name || 'Project Name'}</span>
              <span style={{ fontSize: '9px', color: C_MUTED }}>
                {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" style={{ color: C_MUTED, marginRight: '6px', textDecoration: 'underline' }}>Code</a>}
                {proj.liveUrl  && <a href={proj.liveUrl}   target="_blank" rel="noreferrer" style={{ color: C_MUTED, textDecoration: 'underline' }}>Live</a>}
              </span>
            </div>
            {proj.techStack && proj.techStack.length > 0 && (
              <div style={{ fontSize: '9px', color: C_MUTED, marginBottom: '1px' }}>
                <strong>Tech:</strong> {proj.techStack.join(', ')}
              </div>
            )}
            {proj.highlights && proj.highlights.length > 0 ? (
              <ul style={{ margin: '3px 0 0', paddingLeft: '14px', color: C_BODY, fontSize: '9.5px' }}>
                {proj.highlights.map((h, hi) => h ? <li key={hi}>{h}</li> : null)}
              </ul>
            ) : proj.description ? (
              <p style={{ margin: '3px 0 0', color: C_BODY, fontSize: '9.5px' }}>{proj.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderCertifications = () => {
    if (certifications.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Certifications</h2>
        <hr style={hrStyle} />
        <ul style={{ margin: 0, paddingLeft: '13px' }}>
          {certifications.map((cert, i) => (
            <li key={i} style={{ marginBottom: '3px', fontSize: '9.5px' }}>
              <strong style={{ color: C_HEAD }}>{cert.title}</strong> — {cert.issuer}
              {cert.date && ` (${formatDateString(cert.date)})`}
              {cert.credentialLink && (
                <span> — <a href={cert.credentialLink} target="_blank" rel="noreferrer" style={{ color: C_MUTED, textDecoration: 'underline' }}>Verify</a></span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAchievements = () => {
    const hasA = achievements.length > 0;
    const hasH = hackathons.length > 0;
    if (!hasA && !hasH) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Achievements & Hackathons</h2>
        <hr style={hrStyle} />
        <ul style={{ margin: 0, paddingLeft: '13px', fontSize: '9.5px' }}>
          {achievements.map((a, i) => (
            <li key={`a-${i}`} style={{ marginBottom: '3px' }}>
              <strong style={{ color: C_HEAD }}>{a.title}</strong>{a.description && `: ${a.description}`}
            </li>
          ))}
          {hackathons.map((h, i) => (
            <li key={`h-${i}`} style={{ marginBottom: '3px' }}>
              <strong style={{ color: C_HEAD }}>Hackathon: {h.name}</strong> ({h.mode}) — {h.role || 'Participant'}{h.outcome ? ` (${h.outcome})` : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSkills = () => {
    if (skills.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Skills</h2>
        <hr style={hrStyle} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '9.5px', color: C_BODY }}>
          {skills.map((skill, i) => (
            <span key={i} style={{ border: `1px solid ${C_LINE}`, borderRadius: '2px', padding: '1px 7px' }}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderLeadership = () => {
    if (leadership.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Leadership & Volunteering</h2>
        <hr style={hrStyle} />
        {leadership.map((lead, i) => (
          <div key={i} style={{ marginBottom: '7px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: C_HEAD }}>
              <span>{lead.role} — {lead.organization}</span>
              <span style={{ fontWeight: '400', color: C_MUTED, fontSize: '9px' }}>{formatDateString(lead.startDate)} – {formatDateString(lead.endDate)}</span>
            </div>
            {lead.description && <p style={{ margin: '2px 0 0', color: C_BODY, fontSize: '9.5px' }}>{lead.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  const renderPublications = () => {
    if (publications.length === 0) return null;
    return (
      <div>
        <h2 style={sectionHeaderStyle}>Publications & Research</h2>
        <hr style={hrStyle} />
        {publications.map((pub, i) => (
          <div key={i} style={{ marginBottom: '7px' }}>
            <div style={{ fontWeight: '700', color: C_HEAD }}>{pub.title}</div>
            <div style={{ fontSize: '9px', color: C_MUTED }}>
              {pub.publisher} ({formatDateString(pub.date)})
              {pub.link && <> — <a href={pub.link} target="_blank" rel="noreferrer" style={{ color: C_MUTED, textDecoration: 'underline' }}>View</a></>}
            </div>
            {pub.description && <p style={{ margin: '2px 0 0', color: C_BODY, fontSize: '9.5px' }}>{pub.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  const renderCustom = (secId) => {
    const cSec = customSections.find(s => s.sectionId === secId || s.title === secId);
    if (!cSec || !cSec.title) return null;
    return (
      <div key={cSec.sectionId || cSec.title}>
        <h2 style={sectionHeaderStyle}>{cSec.title}</h2>
        <hr style={hrStyle} />
        <p style={{ margin: 0, color: C_BODY, whiteSpace: 'pre-wrap', fontSize: '9.5px' }}>{cSec.content}</p>
      </div>
    );
  };

  const renderSectionByKey = (key) => {
    if (hiddenSections.includes(key)) return null;
    switch (key) {
      case 'academic':       return <React.Fragment key={key}>{renderAcademic()}</React.Fragment>;
      case 'profiles':       return <React.Fragment key={key}>{renderProfiles()}</React.Fragment>;
      case 'experience':     return <React.Fragment key={key}>{renderExperience()}</React.Fragment>;
      case 'projects':       return <React.Fragment key={key}>{renderProjects()}</React.Fragment>;
      case 'certifications': return <React.Fragment key={key}>{renderCertifications()}</React.Fragment>;
      case 'achievements':   return <React.Fragment key={key}>{renderAchievements()}</React.Fragment>;
      case 'skills':         return <React.Fragment key={key}>{renderSkills()}</React.Fragment>;
      case 'leadership':     return <React.Fragment key={key}>{renderLeadership()}</React.Fragment>;
      case 'publications':   return <React.Fragment key={key}>{renderPublications()}</React.Fragment>;
      default:               return <React.Fragment key={key}>{renderCustom(key)}</React.Fragment>;
    }
  };

  /* ═══════════════════════════ LAYOUT MODES ═══════════════════════════ */

  const renderDoubleColumn = () => {
    const leftKeys  = ['skills', 'profiles', 'certifications', 'achievements', 'leadership'];
    const orderedLeft  = sectionsOrder.filter(k => leftKeys.includes(k));
    const orderedRight = sectionsOrder.filter(k => !leftKeys.includes(k));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '35% 1fr', gap: '0 20px', marginTop: '4px' }}>
        {/* LEFT COLUMN */}
        <div style={{ borderRight: `1px solid ${C_LINE}`, paddingRight: '15px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {orderedLeft.map(k => renderSectionByKey(k))}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {orderedRight.map(k => renderSectionByKey(k))}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      {renderPersonalHeader()}
      {resolvedKey === 'double_column' ? (
        renderDoubleColumn()
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sectionsOrder.map(k => renderSectionByKey(k))}
        </div>
      )}
    </div>
  );
}
