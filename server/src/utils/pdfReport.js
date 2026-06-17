const PDFDocument = require('pdfkit');

function buildStudentReportPdf(student, profile, codingProfile) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    const COLOR_HEADING  = '#1e293b';
    const COLOR_BODY     = '#334155';
    const COLOR_MUTED    = '#64748b';
    const COLOR_LINE     = '#cbd5e1';
    const COLOR_THEME    = '#2563eb';

    // ─── Header ───
    doc.fillColor(COLOR_THEME).font('Helvetica-Bold').fontSize(18)
       .text("MEDHA CODE TRACK", { align: 'center' });
    doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(13)
       .text("PLACEMENT READINESS REPORT CARD", { align: 'center' });
    doc.moveDown(0.5);
    
    doc.moveTo(margin, doc.y).lineTo(margin + contentWidth, doc.y)
       .strokeColor(COLOR_THEME).lineWidth(1.5).stroke();
    doc.moveDown(0.8);

    // ─── Personal Info Section (2 Column layout) ───
    const yStartInfo = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_HEADING).text("Personal Information", margin, yStartInfo);
    doc.moveTo(margin, doc.y + 2).lineTo(margin + 200, doc.y + 2).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    doc.moveDown(0.4);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_BODY).text("Name: ", margin, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.name || "-");
    doc.font('Helvetica-Bold').fillColor(COLOR_BODY).text("Email: ", margin, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.email || "-");
    doc.font('Helvetica-Bold').fillColor(COLOR_BODY).text("MSSID: ", margin, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.mssid || "-");
    doc.font('Helvetica-Bold').fillColor(COLOR_BODY).text("Status: ", margin, doc.y, { continued: true })
       .font('Helvetica').fillColor(student.activityStatus === 'active' ? '#16a34a' : '#dc2626').text((student.activityStatus || 'inactive').toUpperCase());

    // Right Column for Academics
    const col2X = margin + 260;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_HEADING).text("Academic Details", col2X, yStartInfo);
    doc.moveTo(col2X, doc.y + 2).lineTo(col2X + 200, doc.y + 2).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    doc.moveDown(0.4);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_BODY).text("College: ", col2X, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.college || "-");
    doc.font('Helvetica-Bold').fillColor(COLOR_BODY).text("Branch: ", col2X, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.branch || "-");
    doc.font('Helvetica-Bold').fillColor(COLOR_BODY).text("Year: ", col2X, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.currentYear || "-");
    doc.font('Helvetica-Bold').fillColor(COLOR_BODY).text("GPA: ", col2X, doc.y, { continued: true })
       .font('Helvetica').fillColor(COLOR_BODY).text(student.overallGpa ? String(student.overallGpa) : "-");

    doc.moveDown(1.5);

    // ─── Placement Readiness Section ───
    const rp = profile?.readinessProfile || { dsaScore: 0, projectsScore: 0, resumeScore: 0, profileScore: 0, overallReadiness: 0 };
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_HEADING).text("Placement Readiness Score Card");
    doc.moveTo(margin, doc.y + 2).lineTo(margin + contentWidth, doc.y + 2).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    doc.moveDown(0.6);

    const rpY = doc.y;
    // Readiness blocks
    const drawScoreBox = (label, score, x, y, width) => {
      doc.rect(x, y, width, 55).strokeColor(COLOR_LINE).lineWidth(1).stroke();
      doc.fillColor('#f8fafc').rect(x + 1, y + 1, width - 2, 53).fill();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_MUTED).text(label.toUpperCase(), x + 5, y + 8, { width: width - 10, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(18).fillColor(COLOR_THEME).text(String(score), x + 5, y + 22, { width: width - 10, align: 'center' });
    };

    const boxWidth = (contentWidth - 40) / 5;
    drawScoreBox("DSA", rp.dsaScore || 0, margin, rpY, boxWidth);
    drawScoreBox("Projects", rp.projectsScore || 0, margin + boxWidth + 10, rpY, boxWidth);
    drawScoreBox("Resume", rp.resumeScore || 0, margin + (boxWidth + 10) * 2, rpY, boxWidth);
    drawScoreBox("Profile", rp.profileScore || 0, margin + (boxWidth + 10) * 3, rpY, boxWidth);
    
    // Overall score highlighted
    const overallX = margin + (boxWidth + 10) * 4;
    doc.rect(overallX, rpY, boxWidth, 55).fillColor(COLOR_THEME).rect(overallX, rpY, boxWidth, 55).fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text("OVERALL", overallX + 5, rpY + 8, { width: boxWidth - 10, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text(String(rp.overallReadiness || 0), overallX + 5, rpY + 22, { width: boxWidth - 10, align: 'center' });

    doc.moveDown(3.0);

    // ─── Coding Statistics Section ───
    const lc = student.platformStats?.leetcode || {};
    const cc = student.platformStats?.codechef || {};
    const gfg = student.platformStats?.geeksforgeeks || {};
    const hr = codingProfile?.hackerrank?.problemSolving || student.hackerrank?.totalProblemsSolved ? { solved: student.hackerrank.totalProblemsSolved } : {};
    
    const lcSolved = lc.problemsSolved || lc.totalSolved || 0;
    const ccSolved = cc.problemsSolved || 0;
    const gfgSolved = gfg.totalProblemsSolved || gfg.problemsSolved || 0;
    const hrSolved = hr.solved || student.hackerrank?.totalProblemsSolved || 0;
    const totalSolved = lcSolved + ccSolved + gfgSolved + hrSolved;

    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_HEADING).text("Coding Platforms Summary");
    doc.moveTo(margin, doc.y + 2).lineTo(margin + contentWidth, doc.y + 2).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    doc.moveDown(0.6);

    const tableY = doc.y;
    // Draw table headers
    doc.rect(margin, tableY, contentWidth, 20).fillColor('#e2e8f0').rect(margin, tableY, contentWidth, 20).fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING);
    doc.text("Platform", margin + 10, tableY + 5);
    doc.text("Username", margin + 120, tableY + 5);
    doc.text("Problems Solved", margin + 280, tableY + 5);
    doc.text("Rating / Badges", margin + 400, tableY + 5);

    const drawRow = (platform, username, solved, extra, y) => {
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY);
      doc.text(platform, margin + 10, y + 5);
      doc.text(username || "N/A", margin + 120, y + 5);
      doc.text(String(solved), margin + 280, y + 5);
      doc.text(extra || "-", margin + 400, y + 5);
      doc.moveTo(margin, y + 20).lineTo(margin + contentWidth, y + 20).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    };

    drawRow("LeetCode", student.leetcodeUsername, lcSolved, lc.rating ? `Rating: ${Math.round(lc.rating)}` : "-", tableY + 20);
    drawRow("GeeksforGeeks", student.gfgUsername, gfgSolved, gfg.codingScore ? `Score: ${gfg.codingScore}` : "-", tableY + 40);
    drawRow("CodeChef", student.codechefUsername, ccSolved, cc.rating ? `Rating: ${cc.rating}` : "-", tableY + 60);
    drawRow("HackerRank", student.hackerrankUsername, hrSolved, codingProfile?.hackerrank?.badgeCount ? `${codingProfile.hackerrank.badgeCount} Badges` : "-", tableY + 80);
    
    // Total Solved Row
    doc.rect(margin, tableY + 100, contentWidth, 20).fillColor('#f1f5f9').rect(margin, tableY + 100, contentWidth, 20).fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_HEADING);
    doc.text("TOTAL PROBLEMS SOLVED", margin + 10, tableY + 105);
    doc.text(String(totalSolved), margin + 280, tableY + 105);

    doc.moveDown(5.0);

    // ─── Projects summary (only if exists) ───
    if (profile && profile.projects && profile.projects.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_HEADING).text("Projects Summary");
      doc.moveTo(margin, doc.y + 2).lineTo(margin + contentWidth, doc.y + 2).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.moveDown(0.6);

      profile.projects.forEach(proj => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_BODY).text(proj.title);
        if (proj.technologies && proj.technologies.length > 0) {
          doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLOR_MUTED).text(`Tech Stack: ${proj.technologies.join(', ')}`);
        }
        if (proj.description) {
          doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY).text(proj.description, { width: contentWidth, align: 'justify' });
        }
        doc.moveDown(0.4);
      });
    }

    doc.end();
  });
}

module.exports = { buildStudentReportPdf };
