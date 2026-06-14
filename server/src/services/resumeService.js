const PDFDocument = require('pdfkit');

function buildResumePdfBuffer(user, options = {}) {
  const template = options.template || 'template_a';
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
    // Fallback mapping from student profile
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

  return new Promise((resolve, reject) => {
    let docOptions = { margin: 40, size: 'A4' };
    let themeColor = '#1e3a8a'; // Deep blue default
    let themeSecondary = '#2563eb';
    let fontHeader = 'Helvetica-Bold';
    let fontBody = 'Helvetica';

    // Apply template styles
    if (template === 'template_b') {
      docOptions.margin = 35;
      themeColor = '#1f2937'; // Charcoal grey
      themeSecondary = '#4b5563';
    } else if (template === 'template_c') {
      docOptions.margin = 45;
      themeColor = '#7c3aed'; // Purple
      themeSecondary = '#6d28d9';
      fontHeader = 'Times-Bold';
      fontBody = 'Times-Roman';
    } else if (template === 'template_d') {
      docOptions.margin = 30;
      themeColor = '#0d9488'; // Teal
      themeSecondary = '#0f766e';
      fontHeader = 'Courier-Bold';
      fontBody = 'Courier';
    } else if (template === 'template_e') {
      docOptions.margin = 40;
      themeColor = '#1e3a8a'; // Royal blue
      themeSecondary = '#10b981'; // Green accent
    } else if (template === 'template_f') {
      docOptions.margin = 40;
      themeColor = '#059669'; // Emerald
      themeSecondary = '#047857';
    }

    const doc = new PDFDocument(docOptions);
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const margin = docOptions.margin;
    const contentWidth = doc.page.width - (margin * 2);

    /* ================= HEADER ================= */
    doc.font(fontHeader)
       .fontSize(18)
       .fillColor(themeColor)
       .text(pd.name || user.name || 'Student', { align: 'center' });

    doc.moveDown(0.2);

    const contactLinks = [];
    if (pd.email) contactLinks.push(pd.email);
    if (pd.phone) contactLinks.push(`ID: ${pd.phone}`);
    if (pd.githubUrl) contactLinks.push('GitHub');
    if (pd.linkedinUrl) contactLinks.push('LinkedIn');

    doc.font(fontBody)
       .fontSize(9)
       .fillColor('#4b5563')
       .text(contactLinks.join(' | '), { align: 'center' });

    if (pd.summary) {
      doc.moveDown(0.4);
      doc.font(fontBody)
         .fontSize(9.5)
         .fillColor('#374151')
         .text(pd.summary, { align: 'center', width: contentWidth });
    }

    doc.moveDown(0.8);

    /* ================= SECTION DRAWERS ================= */

    function renderAcademic() {
      if (!content.education || content.education.length === 0) return;
      sectionHeader('Education');
      content.education.forEach(edu => {
        doc.font(fontHeader).fontSize(10).fillColor('#111827');
        const endStr = edu.endYear ? ` - ${edu.endYear}` : '';
        doc.text(`${edu.institution || ''}`, { continued: true });
        doc.font(fontBody).fontSize(9.5).fillColor('#4b5563');
        doc.text(` (${edu.startYear}${endStr})`, { align: 'right' });
        doc.font(fontBody).fontSize(9.5).fillColor('#374151');
        doc.text(`${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`, { continued: edu.gpa ? true : false });
        if (edu.gpa) {
          doc.font(fontHeader).fontSize(9).fillColor('#111827');
          doc.text(` | GPA: ${edu.gpa}`, { align: 'right' });
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.3);
    }

    function renderProfiles() {
      const cp = content.codingProfiles || {};
      const profiles = [];
      if (cp.leetcode?.show && cp.leetcode?.username) {
        profiles.push(`LeetCode: @${cp.leetcode.username}`);
      }
      if (cp.codechef?.show && cp.codechef?.username) {
        profiles.push(`CodeChef: @${cp.codechef.username}`);
      }
      if (cp.gfg?.show && cp.gfg?.username) {
        profiles.push(`GFG: @${cp.gfg.username}`);
      }
      if (cp.github?.show && cp.github?.username) {
        profiles.push(`GitHub: @${cp.github.username}`);
      }

      if (profiles.length === 0) return;

      sectionHeader('Coding Profiles');
      doc.font(fontBody).fontSize(9.5).fillColor('#374151');
      profiles.forEach(p => {
        doc.text(`• ${p}`);
      });
      doc.moveDown(0.5);
    }

    function renderExperience() {
      if (!content.workExperience || content.workExperience.length === 0) return;
      sectionHeader('Work Experience');
      content.workExperience.forEach(exp => {
        doc.font(fontHeader).fontSize(10).fillColor('#111827');
        const dateStr = `${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`;
        doc.text(`${exp.role || ''} — ${exp.company || ''}`, { continued: true });
        doc.font(fontBody).fontSize(9).fillColor('#4b5563');
        doc.text(` (${dateStr})`, { align: 'right' });
        if (exp.description) {
          doc.font(fontBody).fontSize(9.5).fillColor('#374151');
          doc.text(`• ${exp.description}`, { indent: 8 });
        }
        doc.moveDown(0.4);
      });
      doc.moveDown(0.3);
    }

    function renderProjects() {
      if (!content.projects || content.projects.length === 0) return;
      sectionHeader('Projects');
      content.projects.forEach(proj => {
        doc.font(fontHeader).fontSize(10).fillColor('#111827');
        doc.text(proj.name || 'Project');
        if (proj.techStack && proj.techStack.length > 0) {
          doc.font(fontBody).fontSize(9).fillColor('#4b5563');
          doc.text(`Tech Stack: ${proj.techStack.join(', ')}`);
        }
        if (proj.highlights && proj.highlights.length > 0) {
          doc.font(fontBody).fontSize(9.5).fillColor('#374151');
          proj.highlights.forEach(h => {
            if (h) doc.text(`• ${h}`, { indent: 8 });
          });
        }
        doc.moveDown(0.4);
      });
      doc.moveDown(0.3);
    }

    function renderCertifications() {
      if (!content.certifications || content.certifications.length === 0) return;
      sectionHeader('Certifications');
      content.certifications.forEach(cert => {
        doc.font(fontBody).fontSize(9.5).fillColor('#374151');
        const dateStr = cert.date ? ` (${formatDate(cert.date)})` : '';
        doc.text(`• ${cert.title || ''} — ${cert.issuer || ''}${dateStr}`);
      });
      doc.moveDown(0.5);
    }

    function renderAchievements() {
      const hasAchievements = content.achievements && content.achievements.length > 0;
      const hasHackathons = content.hackathons && content.hackathons.length > 0;
      if (!hasAchievements && !hasHackathons) return;

      sectionHeader('Achievements & Hackathons');
      doc.font(fontBody).fontSize(9.5).fillColor('#374151');
      
      if (hasAchievements) {
        content.achievements.forEach(ach => {
          doc.text(`• ${ach.title || ''}${ach.description ? `: ${ach.description}` : ''}`);
        });
      }

      if (hasHackathons) {
        content.hackathons.forEach(h => {
          doc.text(`• Hackathon: ${h.name || ''} (${h.mode || ''}) — Role: ${h.role || ''} ${h.outcome ? `(${h.outcome})` : ''}`);
        });
      }
      doc.moveDown(0.5);
    }

    function renderSkills() {
      if (!content.skills || content.skills.length === 0) return;
      sectionHeader('Skills');
      doc.font(fontBody).fontSize(9.5).fillColor('#374151');
      doc.text(content.skills.join(', '));
      doc.moveDown(0.5);
    }

    function renderLeadership() {
      if (!content.leadership || content.leadership.length === 0) return;
      sectionHeader('Leadership & Volunteering');
      content.leadership.forEach(lead => {
        doc.font(fontHeader).fontSize(10).fillColor('#111827');
        const dateStr = `${formatDate(lead.startDate)} - ${formatDate(lead.endDate)}`;
        doc.text(`${lead.role} — ${lead.organization}`, { continued: true });
        doc.font(fontBody).fontSize(9).fillColor('#4b5563');
        doc.text(` (${dateStr})`, { align: 'right' });
        if (lead.description) {
          doc.font(fontBody).fontSize(9.5).fillColor('#374151');
          doc.text(`• ${lead.description}`, { indent: 8 });
        }
        doc.moveDown(0.4);
      });
      doc.moveDown(0.3);
    }

    function renderPublications() {
      if (!content.publications || content.publications.length === 0) return;
      sectionHeader('Publications & Research');
      content.publications.forEach(pub => {
        doc.font(fontHeader).fontSize(10).fillColor('#111827');
        doc.text(pub.title);
        doc.font(fontBody).fontSize(9).fillColor('#4b5563');
        doc.text(`Publisher: ${pub.publisher} (${formatDate(pub.date)})`);
        if (pub.description) {
          doc.font(fontBody).fontSize(9.5).fillColor('#374151');
          doc.text(`• ${pub.description}`, { indent: 8 });
        }
        doc.moveDown(0.4);
      });
      doc.moveDown(0.3);
    }

    function renderCustom(secId) {
      if (!content.customSections || content.customSections.length === 0) return;
      const cSec = content.customSections.find(s => s.sectionId === secId || s.title === secId);
      if (!cSec || !cSec.title) return;

      sectionHeader(cSec.title);
      doc.font(fontBody).fontSize(9.5).fillColor('#374151');
      doc.text(cSec.content);
      doc.moveDown(0.5);
    }

    // Helper for section headers
    function sectionHeader(title) {
      doc.moveDown(0.4);
      doc.font(fontHeader).fontSize(11).fillColor(themeColor).text(title.toUpperCase());
      doc.moveDown(0.15);
      doc.moveTo(margin, doc.y)
         .lineTo(doc.page.width - margin, doc.y)
         .strokeColor(themeColor)
         .lineWidth(1)
         .stroke();
      doc.moveDown(0.35);
    }

    function formatDate(d) {
      if (!d) return 'Present';
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    }

    // Main section dispatch loop
    const hiddenSections = options.hiddenSections || [];
    sectionsOrder.forEach((secKey) => {
      // Check hidden sections
      if (hiddenSections.includes(secKey)) return;

      switch (secKey) {
        case 'academic':
          renderAcademic();
          break;
        case 'profiles':
          renderProfiles();
          break;
        case 'experience':
          renderExperience();
          break;
        case 'projects':
          renderProjects();
          break;
        case 'certifications':
          renderCertifications();
          break;
        case 'achievements':
          renderAchievements();
          break;
        case 'skills':
          renderSkills();
          break;
        case 'leadership':
          renderLeadership();
          break;
        case 'publications':
          renderPublications();
          break;
        default:
          renderCustom(secKey);
          break;
      }
    });

    doc.end();
  });
}

module.exports = {
  buildResumePdfBuffer
};
