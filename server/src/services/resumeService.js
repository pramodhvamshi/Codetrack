const PDFDocument = require('pdfkit');

function buildResumePdfBuffer(user, options = {}) {
  // Support both new keys (single_column/double_column) and legacy keys (template_a/b)
  const templateRaw = options.template || 'single_column';
  // Map legacy keys to new ones
  const legacyMap = {
    template_a: 'single_column',
    template_c: 'single_column',
    template_d: 'single_column',
    template_f: 'single_column',
    template_b: 'double_column',
    template_e: 'double_column'
  };
  const template = legacyMap[templateRaw] || templateRaw;

  const sectionsOrder = options.sections || [
    'academic',
    'profiles',
    'experience',
    'projects',
    'certifications',
    'achievements'
  ];

  // Unify content from custom version edits OR fallback to user profile
  let content = options.content;
  if (!content) {
    content = {
      personalDetails: {
        name: user.name || '',
        email: user.email || '',
        phone: user.mssid || '',
        githubUrl: user.githubUrl || (user.githubUsername ? `https://github.com/${user.githubUsername}` : ''),
        linkedinUrl: user.linkedinUrl || '',
        portfolioUrl: '',
        summary: 'Motivated student eager to apply competitive technical capabilities.'
      },
      education: [
        {
          institution: user.college || '',
          degree: 'Bachelor of Technology',
          fieldOfStudy: user.branch || '',
          startYear: user.year ? String(2026 - (4 - Number(user.year))) : '2022',
          endYear: '2026',
          gpa: user.overallGpa != null ? String(user.overallGpa) : ''
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
      projects: (user.projects || []).map(p => ({
        name: p.name || '',
        description: p.highlights?.join(' ') || '',
        techStack: p.techStack || [],
        githubUrl: p.githubUrl || '',
        liveUrl: p.liveUrl || '',
        highlights: p.highlights || []
      })),
      workExperience: (user.workExperience || []).map(w => ({
        company: w.company || '',
        role: w.role || '',
        location: w.location || '',
        startDate: w.startDate || null,
        endDate: w.endDate || null,
        isCurrent: !w.endDate,
        description: w.description || ''
      })),
      certifications: (user.certifications || []).map(c => ({
        title: c.title || '',
        issuer: c.issuer || '',
        date: c.date || null,
        credentialLink: c.credentialLink || ''
      })),
      achievements: (user.achievements || []).map(a => ({
        title: a.title || '',
        description: a.description || '',
        date: a.date || null
      })),
      codingProfiles: {
        leetcode: { show: true, username: user.leetcodeUsername || '' },
        codechef: { show: true, username: user.codechefUsername || '' },
        gfg: { show: true, username: user.gfgUsername || '' },
        github: { show: true, username: user.githubUsername || '' }
      },
      hackathons: (user.hackathons || []).map(h => ({
        name: h.name || '',
        mode: h.mode || 'online',
        teamType: h.teamType || 'individual',
        role: h.role || '',
        outcome: h.outcome || '',
        date: h.date || null
      })),
      leadership: [],
      publications: [],
      customSections: []
    };
  }

  const pd = content.personalDetails || {};

  function formatDate(d) {
    if (!d) return 'Present';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    // ─── Color palette (monochrome) ───
    const COLOR_HEADING  = '#111827';
    const COLOR_BODY     = '#374151';
    const COLOR_MUTED    = '#6B7280';
    const COLOR_LINE     = '#D1D5DB';

    // ─── Shared helpers ───
    function sectionHeader(title, x = margin, width = contentWidth) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_HEADING)
         .text(title.toUpperCase(), x, doc.y, { width });
      doc.moveDown(0.12);
      doc.moveTo(x, doc.y).lineTo(x + width, doc.y)
         .strokeColor(COLOR_LINE).lineWidth(0.75).stroke();
      doc.moveDown(0.3);
    }

    function renderPersonalDetails() {
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR_HEADING)
         .text(pd.name || user.name || 'Student', { align: 'center' });
      doc.moveDown(0.2);

      const contactParts = [];
      if (pd.email)       contactParts.push(pd.email);
      if (pd.phone)       contactParts.push(`ID: ${pd.phone}`);
      if (pd.linkedinUrl) contactParts.push('linkedin.com');
      if (pd.githubUrl)   contactParts.push('github.com');
      if (pd.portfolioUrl)contactParts.push('Portfolio');

      doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
         .text(contactParts.join('  |  '), { align: 'center' });

      if (pd.summary) {
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
           .text(pd.summary, { align: 'center', width: contentWidth });
      }
      doc.moveDown(0.4);
    }

    function renderAcademic() {
      if (!content.education || content.education.length === 0) return;
      sectionHeader('Education');
      content.education.forEach(edu => {
        const endStr = edu.endYear ? ` – ${edu.endYear}` : '';
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_HEADING)
           .text(edu.institution || '', { continued: true });
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED)
           .text(`  (${edu.startYear}${endStr})`, { align: 'right' });
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
           .text(`${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`, { continued: !!edu.gpa });
        if (edu.gpa) {
          doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING)
             .text(`  GPA: ${edu.gpa}`, { align: 'right' });
        }
        doc.moveDown(0.3);
      });
    }

    function renderProfiles() {
      const cp = content.codingProfiles || {};
      const profiles = [];
      if (cp.leetcode?.show && cp.leetcode?.username) profiles.push(`LeetCode: @${cp.leetcode.username}`);
      if (cp.codechef?.show && cp.codechef?.username) profiles.push(`CodeChef: @${cp.codechef.username}`);
      if (cp.gfg?.show && cp.gfg?.username)           profiles.push(`GeeksforGeeks: @${cp.gfg.username}`);
      if (cp.github?.show && cp.github?.username)     profiles.push(`GitHub: @${cp.github.username}`);
      if (profiles.length === 0) return;

      sectionHeader('Coding Profiles');
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY);
      profiles.forEach(p => doc.text(`• ${p}`));
      doc.moveDown(0.3);
    }

    function renderExperience() {
      if (!content.workExperience || content.workExperience.length === 0) return;
      sectionHeader('Work Experience');
      content.workExperience.forEach(exp => {
        const dateStr = `${formatDate(exp.startDate)} – ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`;
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_HEADING)
           .text(`${exp.role || ''} — ${exp.company || ''}`, { continued: true });
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED)
           .text(`  ${dateStr}`, { align: 'right' });
        if (exp.location) {
          doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED).text(exp.location);
        }
        if (exp.description) {
          doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
             .text(`• ${exp.description}`, { indent: 8 });
        }
        doc.moveDown(0.35);
      });
    }

    function renderProjects() {
      if (!content.projects || content.projects.length === 0) return;
      sectionHeader('Projects');
      content.projects.forEach(proj => {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_HEADING).text(proj.name || 'Project');
        if (proj.techStack && proj.techStack.length > 0) {
          doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
             .text(`Technologies: ${proj.techStack.join(', ')}`);
        }
        if (proj.highlights && proj.highlights.length > 0) {
          proj.highlights.forEach(h => {
            if (h) doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY).text(`• ${h}`, { indent: 8 });
          });
        } else if (proj.description) {
          doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY).text(`• ${proj.description}`, { indent: 8 });
        }
        doc.moveDown(0.35);
      });
    }

    function renderCertifications() {
      if (!content.certifications || content.certifications.length === 0) return;
      sectionHeader('Certifications');
      content.certifications.forEach(cert => {
        const dateStr = cert.date ? ` (${formatDate(cert.date)})` : '';
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
           .text(`• ${cert.title || ''} — ${cert.issuer || ''}${dateStr}`);
      });
      doc.moveDown(0.3);
    }

    function renderAchievements() {
      const hasAchievements = content.achievements && content.achievements.length > 0;
      const hasHackathons   = content.hackathons   && content.hackathons.length > 0;
      if (!hasAchievements && !hasHackathons) return;

      sectionHeader('Achievements & Hackathons');
      if (hasAchievements) {
        content.achievements.forEach(ach => {
          doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
             .text(`• ${ach.title || ''}${ach.description ? `: ${ach.description}` : ''}`);
        });
      }
      if (hasHackathons) {
        content.hackathons.forEach(h => {
          doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
             .text(`• Hackathon: ${h.name || ''} (${h.mode || ''}) — Role: ${h.role || ''} ${h.outcome ? `(${h.outcome})` : ''}`);
        });
      }
      doc.moveDown(0.3);
    }

    function renderSkills() {
      if (!content.skills || content.skills.length === 0) return;
      sectionHeader('Skills');
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY).text(content.skills.join(', '));
      doc.moveDown(0.3);
    }

    function renderLeadership() {
      if (!content.leadership || content.leadership.length === 0) return;
      sectionHeader('Leadership & Volunteering');
      content.leadership.forEach(lead => {
        const dateStr = `${formatDate(lead.startDate)} – ${formatDate(lead.endDate)}`;
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_HEADING)
           .text(`${lead.role} — ${lead.organization}`, { continued: true });
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED)
           .text(`  ${dateStr}`, { align: 'right' });
        if (lead.description) {
          doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
             .text(`• ${lead.description}`, { indent: 8 });
        }
        doc.moveDown(0.35);
      });
    }

    function renderPublications() {
      if (!content.publications || content.publications.length === 0) return;
      sectionHeader('Publications & Research');
      content.publications.forEach(pub => {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_HEADING).text(pub.title);
        doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED)
           .text(`Publisher: ${pub.publisher} (${formatDate(pub.date)})`);
        if (pub.description) {
          doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY)
             .text(`• ${pub.description}`, { indent: 8 });
        }
        doc.moveDown(0.35);
      });
    }

    function renderCustom(secId) {
      if (!content.customSections || content.customSections.length === 0) return;
      const cSec = content.customSections.find(s => s.sectionId === secId || s.title === secId);
      if (!cSec || !cSec.title) return;
      sectionHeader(cSec.title);
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY).text(cSec.content);
      doc.moveDown(0.3);
    }

    function renderSectionByKey(key) {
      const hiddenSections = options.hiddenSections || [];
      if (hiddenSections.includes(key)) return;
      switch (key) {
        case 'academic':        renderAcademic();       break;
        case 'profiles':        renderProfiles();       break;
        case 'experience':      renderExperience();     break;
        case 'projects':        renderProjects();       break;
        case 'certifications':  renderCertifications(); break;
        case 'achievements':    renderAchievements();   break;
        case 'skills':          renderSkills();         break;
        case 'leadership':      renderLeadership();     break;
        case 'publications':    renderPublications();   break;
        default:                renderCustom(key);      break;
      }
    }

    // ═══════════ SINGLE COLUMN ═══════════
    if (template === 'single_column') {
      renderPersonalDetails();
      sectionsOrder.forEach(k => renderSectionByKey(k));
    }

    // ═══════════ DOUBLE COLUMN ═══════════
    else if (template === 'double_column') {
      renderPersonalDetails();

      // Layout: left col 38% width, gap 15pt, right col rest
      const leftWidth  = Math.floor(contentWidth * 0.35);
      const gap        = 15;
      const rightWidth = contentWidth - leftWidth - gap;
      const leftX      = margin;
      const rightX     = margin + leftWidth + gap;

      // Determine which sections go left vs right
      const leftSectionKeys  = ['skills', 'profiles', 'certifications', 'achievements', 'leadership'];
      const rightSectionKeys = ['academic', 'experience', 'projects', 'publications'];

      const ordered = sectionsOrder.filter(k => !(options.hiddenSections || []).includes(k));
      const leftSections  = ordered.filter(k => leftSectionKeys.includes(k));
      const rightSections = ordered.filter(k => rightSectionKeys.includes(k));
      // Any custom sections go right
      const extra = ordered.filter(k => !leftSectionKeys.includes(k) && !rightSectionKeys.includes(k));
      rightSections.push(...extra);

      // Render helper with column x/width override
      function sectionHeaderCol(title, x, width) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_HEADING)
           .text(title.toUpperCase(), x, doc.y, { width });
        doc.moveDown(0.12);
        doc.moveTo(x, doc.y).lineTo(x + width, doc.y)
           .strokeColor(COLOR_LINE).lineWidth(0.75).stroke();
        doc.moveDown(0.3);
      }

      function renderColSection(key, x, width) {
        if ((options.hiddenSections || []).includes(key)) return;
        const savedY = doc.y;
        // Temporarily override doc column by passing absolute x
        switch (key) {
          case 'academic': {
            if (!content.education || content.education.length === 0) return;
            sectionHeaderCol('Education', x, width);
            content.education.forEach(edu => {
              doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING)
                 .text(edu.institution || '', x, doc.y, { width });
              doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
                 .text(`${edu.startYear} – ${edu.endYear || 'Present'}`, x, doc.y, { width });
              doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                 .text(`${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`, x, doc.y, { width });
              if (edu.gpa) {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
                   .text(`GPA: ${edu.gpa}`, x, doc.y, { width });
              }
              doc.moveDown(0.3);
            });
            break;
          }
          case 'skills': {
            if (!content.skills || content.skills.length === 0) return;
            sectionHeaderCol('Skills', x, width);
            doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
               .text(content.skills.join(' • '), x, doc.y, { width });
            doc.moveDown(0.3);
            break;
          }
          case 'profiles': {
            const cp = content.codingProfiles || {};
            const profiles = [];
            if (cp.leetcode?.show && cp.leetcode?.username) profiles.push(`LeetCode: @${cp.leetcode.username}`);
            if (cp.codechef?.show && cp.codechef?.username) profiles.push(`CodeChef: @${cp.codechef.username}`);
            if (cp.gfg?.show && cp.gfg?.username)           profiles.push(`GFG: @${cp.gfg.username}`);
            if (cp.github?.show && cp.github?.username)     profiles.push(`GitHub: @${cp.github.username}`);
            if (profiles.length === 0) return;
            sectionHeaderCol('Coding Profiles', x, width);
            profiles.forEach(p => {
              doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY).text(`• ${p}`, x, doc.y, { width });
            });
            doc.moveDown(0.3);
            break;
          }
          case 'certifications': {
            if (!content.certifications || content.certifications.length === 0) return;
            sectionHeaderCol('Certifications', x, width);
            content.certifications.forEach(cert => {
              const dStr = cert.date ? ` (${formatDate(cert.date)})` : '';
              doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                 .text(`• ${cert.title || ''} — ${cert.issuer || ''}${dStr}`, x, doc.y, { width });
            });
            doc.moveDown(0.3);
            break;
          }
          case 'achievements': {
            const hasA = content.achievements && content.achievements.length > 0;
            const hasH = content.hackathons && content.hackathons.length > 0;
            if (!hasA && !hasH) return;
            sectionHeaderCol('Achievements', x, width);
            if (hasA) {
              content.achievements.forEach(ach => {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                   .text(`• ${ach.title || ''}${ach.description ? `: ${ach.description}` : ''}`, x, doc.y, { width });
              });
            }
            if (hasH) {
              content.hackathons.forEach(h => {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                   .text(`• ${h.name || ''} (${h.outcome || 'Finalist'})`, x, doc.y, { width });
              });
            }
            doc.moveDown(0.3);
            break;
          }
          case 'leadership': {
            if (!content.leadership || content.leadership.length === 0) return;
            sectionHeaderCol('Leadership', x, width);
            content.leadership.forEach(lead => {
              doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_HEADING)
                 .text(`${lead.role} — ${lead.organization}`, x, doc.y, { width });
              if (lead.description) {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                   .text(`• ${lead.description}`, x, doc.y, { width, indent: 6 });
              }
              doc.moveDown(0.3);
            });
            break;
          }
          case 'experience': {
            if (!content.workExperience || content.workExperience.length === 0) return;
            sectionHeaderCol('Work Experience', x, width);
            content.workExperience.forEach(exp => {
              const dateStr = `${formatDate(exp.startDate)} – ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`;
              doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING)
                 .text(`${exp.role || ''} — ${exp.company || ''}`, x, doc.y, { width });
              doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
                 .text(dateStr, x, doc.y, { width });
              if (exp.description) {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                   .text(`• ${exp.description}`, x, doc.y, { width, indent: 6 });
              }
              doc.moveDown(0.35);
            });
            break;
          }
          case 'projects': {
            if (!content.projects || content.projects.length === 0) return;
            sectionHeaderCol('Projects', x, width);
            content.projects.forEach(proj => {
              doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING)
                 .text(proj.name || 'Project', x, doc.y, { width });
              if (proj.techStack && proj.techStack.length > 0) {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
                   .text(`Tech: ${proj.techStack.join(', ')}`, x, doc.y, { width });
              }
              if (proj.highlights && proj.highlights.length > 0) {
                proj.highlights.forEach(h => {
                  if (h) {
                    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                       .text(`• ${h}`, x, doc.y, { width, indent: 6 });
                  }
                });
              } else if (proj.description) {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY)
                   .text(`• ${proj.description}`, x, doc.y, { width, indent: 6 });
              }
              doc.moveDown(0.35);
            });
            break;
          }
          case 'publications': {
            if (!content.publications || content.publications.length === 0) return;
            sectionHeaderCol('Publications', x, width);
            content.publications.forEach(pub => {
              doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING)
                 .text(pub.title, x, doc.y, { width });
              doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
                 .text(`${pub.publisher} (${formatDate(pub.date)})`, x, doc.y, { width });
              doc.moveDown(0.3);
            });
            break;
          }
          default: {
            if (!content.customSections || content.customSections.length === 0) return;
            const cSec = content.customSections.find(s => s.sectionId === key || s.title === key);
            if (!cSec || !cSec.title) return;
            sectionHeaderCol(cSec.title, x, width);
            doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY).text(cSec.content, x, doc.y, { width });
            doc.moveDown(0.3);
            break;
          }
        }
      }

      // Render two-column by capturing Y positions
      // We render left col first, record ending Y, then render right col from top Y
      const startBodyY = doc.y;

      // Render LEFT column
      doc.y = startBodyY;
      leftSections.forEach(k => renderColSection(k, leftX, leftWidth));
      const leftEndY = doc.y;

      // Render RIGHT column (go back to start Y)
      doc.y = startBodyY;
      rightSections.forEach(k => renderColSection(k, rightX, rightWidth));
      const rightEndY = doc.y;

      // Draw vertical divider between columns
      const dividerX = margin + leftWidth + Math.floor(gap / 2);
      doc.moveTo(dividerX, startBodyY)
         .lineTo(dividerX, Math.max(leftEndY, rightEndY))
         .strokeColor(COLOR_LINE).lineWidth(0.5).stroke();

      // Set cursor to the end of the longer column
      doc.y = Math.max(leftEndY, rightEndY);
    }

    doc.end();
  });
}

module.exports = { buildResumePdfBuffer };
