const PDFDocument = require('pdfkit');

/**
 * Auto-generate resume PDF from user-entered data.
 * Sections render ONLY if data exists.
 */
function buildResumePdfBuffer(user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    /* ================= HEADER ================= */
    doc.font('Helvetica-Bold')
      .fontSize(18)
      .text(user.name || 'Student', { align: 'center' });

    doc.moveDown(0.3);

    const headerLinks = [];
    if (user.email) headerLinks.push(user.email);
    if (user.githubUrl) headerLinks.push(user.githubUrl);
    if (user.linkedinUrl) headerLinks.push(user.linkedinUrl);

    doc.font('Helvetica')
      .fontSize(9)
      .text(headerLinks.join(' | '), { align: 'center' });

    doc.moveDown(1);

    /* ================= ACADEMIC ================= */
    if (user.college || user.branch || user.year || user.overallGpa != null) {
      section(doc, 'Academic Details');

      if (user.college) doc.text(`College: ${user.college}`);
      if (user.branch) doc.text(`Branch: ${user.branch}`);
      if (user.year) doc.text(`Year: ${user.year}`);
      if (user.overallGpa != null) doc.text(`GPA: ${user.overallGpa}`);

      doc.moveDown(0.6);
    }

    /* ================= CODING PROFILES ================= */
    section(doc, 'Coding Profiles');

    const ps = user.platformStats || {};
    const lc = ps.leetcode || {};
    const cc = ps.codechef || {};
    const hr = user.hackerrank || {};

    if (user.leetcodeUsername) {
      doc.text(
        `LeetCode: ${user.leetcodeUsername}`,
        { link: `https://leetcode.com/${user.leetcodeUsername}`, underline: true }
      );
      doc.text(
        `  Problems Solved: ${lc.problemsSolved || 0}, Rating: ${lc.rating || 0}`
      );
    }

    if (user.codechefUsername) {
      doc.text(
        `CodeChef: ${user.codechefUsername}`,
        { link: `https://www.codechef.com/users/${user.codechefUsername}`, underline: true }
      );
      doc.text(
        `  Contests: ${cc.contestCount || 0}, Rating: ${cc.rating || 0}`
      );
    }

    if (hr.username) {
      doc.text(`HackerRank: ${hr.username}`);
      doc.text(
        `  Problems: ${hr.totalProblemsSolved || 0}, Badges: ${hr.badgeCount || 0}`
      );
    }

    doc.moveDown(0.6);

    /* ================= WORK EXPERIENCE ================= */
    if (Array.isArray(user.workExperience) && user.workExperience.length > 0) {
      section(doc, 'Work Experience');

      user.workExperience.forEach((w) => {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .text(`${w.role || ''} — ${w.company || ''}`);

        doc.font('Helvetica')
           .fontSize(9);

        const dateLine = [
          w.startDate ? formatDate(w.startDate) : null,
          w.endDate ? formatDate(w.endDate) : 'Present'
        ].filter(Boolean).join(' - ');

        if (dateLine) doc.text(dateLine);

        if (w.description) {
          doc.text(`• ${w.description}`, { indent: 10 });
        }

        doc.moveDown(0.4);
      });

      doc.moveDown(0.4);
    }

    /* ================= PROJECTS ================= */
    if (Array.isArray(user.projects) && user.projects.length > 0) {
      section(doc, 'Projects');

      user.projects.forEach((p) => {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .text(p.name || 'Project');

        doc.font('Helvetica')
           .fontSize(9);

        if (p.techStack?.length) {
          doc.text(`Tech: ${p.techStack.join(', ')}`);
        }
        if (p.description) {
          doc.text(`• ${p.description}`, { indent: 10 });
        }
        if (p.githubUrl) {
          doc.text(
            p.githubUrl,
            { link: p.githubUrl, underline: true }
          );
        }
        if (p.liveUrl) {
          doc.text(
            p.liveUrl,
            { link: p.liveUrl, underline: true }
          );
        }

        doc.moveDown(0.4);
      });

      doc.moveDown(0.4);
    }

    /* ================= CERTIFICATIONS ================= */
    if (Array.isArray(user.certifications) && user.certifications.length > 0) {
      section(doc, 'Certifications');

      user.certifications.forEach((c) => {
        doc.text(`• ${c.title} — ${c.issuer}`);
        if (c.credentialLink) {
          doc.text(c.credentialLink, { link: c.credentialLink, underline: true });
        }
      });

      doc.moveDown(0.4);
    }

    /* ================= ACHIEVEMENTS ================= */
    if (Array.isArray(user.achievements) && user.achievements.length > 0) {
      section(doc, 'Achievements');

      user.achievements.forEach((a) => {
        doc.text(`• ${a.title}`);
        if (a.description) {
          doc.text(a.description, { indent: 10 });
        }
      });
    }

    doc.end();
  });
}

/* ================= HELPERS ================= */

function section(doc, title) {
  doc.font('Helvetica-Bold').fontSize(11).text(title);
  doc.moveDown(0.2);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

module.exports = {
  buildResumePdfBuffer
};
