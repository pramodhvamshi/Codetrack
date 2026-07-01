const PDFDocument = require('pdfkit');
const { calculateMandatoryScores } = require('./mandatoryAccomplishmentsUtils');

// =========================================================
// UTILITIES & CONSTANTS
// =========================================================
const COLORS = {
  HEADING: '#0f172a',
  BODY: '#334155',
  MUTED: '#64748b',
  LINE: '#e2e8f0',
  THEME: '#1e3a8a',
  ACCENT: '#2563eb',
  CARD_BG: '#f8fafc',
  ROW_ALT: '#ffffff',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444'
};

function formatNum(val, fallback = 'N/A') {
  if (val === undefined || val === null || val === '' || isNaN(val)) return fallback;
  return Number(val).toFixed(2).replace(/\.00$/, ''); 
}

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function sanitizeText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[✔➜🟢🟡🔴█]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, '-');
}

// =========================================================
// REUSABLE RENDERERS
// =========================================================

function checkPageBreak(doc, neededHeight, margin = 40, footerY = 700, headerTitle = "Report Details") {
  if (doc.y + neededHeight > footerY) {
    doc.addPage();
    drawPageHeader(doc, headerTitle, margin, doc.page.width - margin * 2);
    return true;
  }
  return false;
}

function drawPageHeader(doc, title, margin = 40, contentWidth = 515) {
  const startY = doc.y;
  doc.fillColor(COLORS.THEME).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase(), margin, startY, { lineBreak: false });
  doc.x = margin;
  doc.y = startY + doc.currentLineHeight();
  doc.moveTo(margin, doc.y + 3).lineTo(margin + contentWidth, doc.y + 3).strokeColor(COLORS.THEME).lineWidth(1).stroke();
  doc.moveDown(0.6);
}

function drawSectionHeading(doc, text, size = 9.5, color = COLORS.HEADING, margin = 40) {
  doc.fillColor(color).font('Helvetica-Bold').fontSize(size);
  const startY = doc.y;
  doc.text(text, margin, startY, { lineBreak: false });
  doc.x = margin;
  doc.y = startY + doc.currentLineHeight();
}

function drawInfoCard(doc, title, val, x, y, width, height, accentColor = COLORS.ACCENT) {
  doc.rect(x, y, width, height).fillColor(COLORS.CARD_BG).fill();
  doc.rect(x, y, width, height).strokeColor(COLORS.LINE).lineWidth(1).stroke();
  doc.rect(x, y, width, 4).fillColor(accentColor).fill();
  
  doc.fillColor(COLORS.MUTED).font('Helvetica-Bold').fontSize(8)
     .text(title.toUpperCase(), x + 5, y + 14, { width: width - 10, align: 'center' });
  
  doc.fillColor(COLORS.HEADING).font('Helvetica-Bold').fontSize(18)
     .text(val, x + 5, y + 36, { width: width - 10, align: 'center' });
}

function drawTable(doc, config) {
  const {
    margin = 40,
    contentWidth = 515,
    headers = [],
    widths = [],
    aligns = [],
    rows = [],
    rowHeight = 16,
    padding = 4,
    footerY = 745,
    headerTitle = "Report Details"
  } = config;

  if (!rows || rows.length === 0) return;

  let totalFixed = 0;
  let autoCount = 0;
  widths.forEach(w => {
    if (w === 'auto') autoCount++;
    else totalFixed += w;
  });
  const autoWidth = autoCount > 0 ? (contentWidth - totalFixed) / autoCount : 0;
  const actualWidths = widths.map(w => w === 'auto' ? autoWidth : w);

  const drawHeaders = () => {
    if (!headers || headers.length === 0) return;
    let maxHeaderLines = 1;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(8);
      const lh = doc.heightOfString(h, { width: actualWidths[i] - padding * 2 });
      const lines = Math.ceil(lh / doc.currentLineHeight());
      if (lines > maxHeaderLines) maxHeaderLines = lines;
    });
    const headerRowHeight = Math.max(rowHeight + 4, maxHeaderLines * 10 + padding * 2);

    doc.rect(margin, doc.y, contentWidth, headerRowHeight).fillColor('#e2e8f0').fill();
    let currentX = margin;
    const startY = doc.y;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.HEADING);
      doc.text(h, currentX + padding, startY + padding + 2, {
        width: actualWidths[i] - padding * 2,
        align: aligns[i] || 'left'
      });
      currentX += actualWidths[i];
    });
    doc.y = startY + headerRowHeight;
  };

  drawHeaders();

  rows.forEach((row, rowIndex) => {
    let maxLines = 1;
    row.forEach((cell, i) => {
      const text = typeof cell === 'object' ? cell.text : cell;
      const w = actualWidths[i] - padding * 2;
      const hOptions = { width: w, align: aligns[i] || 'left' };
      const currentFont = typeof cell === 'object' && cell.font ? cell.font : 'Helvetica';
      const currentSize = typeof cell === 'object' && cell.size ? cell.size : 8;
      doc.font(currentFont).fontSize(currentSize);
      const h = doc.heightOfString(sanitizeText(text), hOptions);
      const lines = Math.ceil(h / doc.currentLineHeight());
      if (lines > maxLines) maxLines = lines;
    });

    const paddingY = config.compact ? 2 : padding;
    const currentRowHeight = Math.max(config.compact ? 12 : rowHeight, maxLines * (config.compact ? 9 : 10) + paddingY * 2);

    if (checkPageBreak(doc, currentRowHeight, margin, footerY, headerTitle)) {
      drawHeaders();
    }

    const bgColor = rowIndex % 2 === 0 ? COLORS.CARD_BG : COLORS.ROW_ALT;
    doc.rect(margin, doc.y, contentWidth, currentRowHeight).fillColor(bgColor).fill();
    doc.rect(margin, doc.y, contentWidth, currentRowHeight).strokeColor(COLORS.LINE).lineWidth(0.5).stroke();

    let currentX = margin;
    const startY = doc.y;
    row.forEach((cell, i) => {
      const text = sanitizeText(typeof cell === 'object' ? cell.text : cell);
      const isLink = typeof cell === 'object' ? cell.link : null;
      const color = typeof cell === 'object' && cell.color ? cell.color : COLORS.BODY;
      const font = typeof cell === 'object' && cell.font ? cell.font : 'Helvetica';
      const size = typeof cell === 'object' && cell.size ? cell.size : (config.compact ? 7.5 : 8);

      doc.font(font).fontSize(size).fillColor(color);
      
      const textOpts = {
        width: actualWidths[i] - padding * 2,
        align: aligns[i] || 'left'
      };
      
      if (isLink) {
        textOpts.link = isLink;
        textOpts.underline = true;
      }
      
      doc.text(text, currentX + padding, startY + paddingY + (currentRowHeight - (maxLines * (config.compact ? 9 : 10))) / 2 - paddingY / 2, textOpts);
      currentX += actualWidths[i];
    });

    doc.y = startY + currentRowHeight;
  });
  doc.moveDown(0.2);
}

// ---------------------------------------------------------
// SAFE MAPPED RENDERER (V5)
// ---------------------------------------------------------
// Maps specific backend fields to human-readable tables without arbitrary recursion
function renderMappedTable(doc, obj, mappings, title, margin, contentWidth, footerY, headerTitle = title.toUpperCase()) {
  if (!obj || typeof obj !== 'object') return;
  
  const rows = [];
  
  Object.keys(mappings).forEach(key => {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      let formattedVal = val;
      
      if (typeof val === 'number') {
        formattedVal = formatNum(val);
      } else if (val instanceof Date || (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/))) {
        formattedVal = formatDate(val);
      } else if (Array.isArray(val)) {
        if (val.length === 0) return; // skip empty arrays
        // Check if array of objects, skip it. Mapped fields shouldn't dump complex arrays blindly.
        if (typeof val[0] === 'object') return;
        formattedVal = val.join(', ');
      } else if (typeof val === 'string') {
        // Fix codechef unicode
        formattedVal = val.replace(/(\d+)\s*&\#9733;/g, '$1 Star')
                          .replace(/(\d+)\s*&\s*#\s*9733\s*;/g, '$1 Star')
                          .replace(/(\d+)\s*★/g, '$1 Star')
                          .replace(/★/g, 'Star');
      } else if (typeof val === 'object') {
        return; // skip objects in mapped fields
      }
      
      rows.push([mappings[key], String(formattedVal)]);
    }
  });

  if (rows.length > 0) {
    checkPageBreak(doc, 60, margin, footerY, headerTitle);
    drawSectionHeading(doc, title.toUpperCase(), 10);
    doc.moveDown(0.2);
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Metric", "Value"],
      widths: [200, 'auto'],
      rows: rows,
      headerTitle: headerTitle
    });
  }
}

// =========================================================
// MAIN BUILDER
// =========================================================
function buildStudentReportPdf(student, profile, codingProfile, options = {}) {
  // Sanitize Mongoose documents to guarantee POJOs everywhere
  if (student && typeof student.toObject === 'function') student = student.toObject();
  if (profile && typeof profile.toObject === 'function') profile = profile.toObject();
  if (codingProfile && typeof codingProfile.toObject === 'function') codingProfile = codingProfile.toObject();
  if (options.academic && typeof options.academic.toObject === 'function') options.academic = options.academic.toObject();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;
    const footerY = 760;

    const academic = options.academic || {};
    const defaultResume = options.defaultResume || null;
    const photoBuffer = options.photoBuffer || null;
    
    const pd = profile?.personalDetails || {};
    const fd = profile?.familyDetails || {};
    const rp = profile?.readinessProfile || {};
    
    const stats = student.platformStats || {};
    const lc = stats.leetcode || {};
    const cc = stats.codechef || {};
    const gfg = stats.geeksforgeeks || {};
    const gh = stats.github || {};
    const hr = student.hackerrank || {};
    
    const overallReadiness = rp.overallReadiness ?? 0;
    const readiness = student.placementReadiness || {};
    const rpFinalScore = readiness.finalScore || overallReadiness || 0;
    const dsaRawScore = readiness.dsa?.raw || 0;
    const mentorship = readiness.mentorship || {};

    // ---------------------------------------------------------
    // PAGE 1: COVER PAGE
    // ---------------------------------------------------------
    doc.rect(0, 0, pageWidth, 125).fillColor(COLORS.THEME).fill();
    
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
       .text("MEDHA SCHOLAR Report Card", margin, 38, { lineBreak: false });
    doc.fillColor('#93c5fd').font('Helvetica-Bold').fontSize(11)
       .text("COGNITIVE POTENTIAL & DOPAMINE DISCIPLINE TRACKING", margin, 70, { lineBreak: false });

    const topY = 150;
    
    doc.rect(margin, topY, 340, 150).fillColor(COLORS.CARD_BG).fill();
    doc.rect(margin, topY, 340, 150).strokeColor(COLORS.LINE).lineWidth(1).stroke();
    
    let infoY = topY + 12;
    doc.fillColor(COLORS.HEADING).font('Helvetica-Bold').fontSize(10).text("STUDENT PROFILE SUMMARY", margin + 15, infoY, { lineBreak: false });
    
    infoY += 18;
    const addProfileRow = (label, val, yOffset) => {
      if (val !== null && val !== undefined && val !== '') {
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.BODY).text(label, margin + 15, infoY + yOffset, { continued: true })
           .font('Helvetica-Bold').text(' ' + sanitizeText(val));
      } else {
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.BODY).text(label, margin + 15, infoY + yOffset, { continued: true })
           .font('Helvetica-Bold').text(' N/A');
      }
    };
    
    addProfileRow("Name:", student.name, 0);
    addProfileRow("Roll No:", pd.rollNumber, 14);
    addProfileRow("MSS ID:", student.mssid, 28);
    addProfileRow("College:", student.college, 42);
    addProfileRow("Branch & Year:", `${student.branch || 'N/A'} - ${student.currentYear || 'N/A'}`, 56);
    addProfileRow("Section:", pd.section, 70);
    addProfileRow("Email:", student.email, 84);
    addProfileRow("Track / Goal:", profile?.goal, 98);

    const photoX = margin + 355;
    doc.rect(photoX, topY, 160, 150).fillColor(COLORS.CARD_BG).fill();
    doc.rect(photoX, topY, 160, 150).strokeColor(COLORS.LINE).lineWidth(1).stroke();
    
    if (photoBuffer) {
      try {
        doc.image(photoBuffer, photoX + 15, topY + 10, { width: 130, height: 130 });
      } catch (err) {
        drawCoverInitialsAvatar();
      }
    } else {
      drawCoverInitialsAvatar();
    }

    function drawCoverInitialsAvatar() {
      doc.circle(photoX + 80, topY + 60, 32).fillColor(COLORS.THEME).fill();
      const initials = (student.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ST';
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
         .text(initials, photoX, topY + 53, { width: 160, align: 'center' });
      doc.fillColor(COLORS.MUTED).font('Helvetica-Bold').fontSize(8.5)
         .text(sanitizeText(student.name), photoX + 5, topY + 110, { width: 150, align: 'center' });
    }

    const gridY = 320;
    const cardWidth = (contentWidth - 30) / 4; 
    const cardHeight = 85;
    
    drawInfoCard(doc, "Placement Readiness", `${formatNum(rpFinalScore)}%`, margin, gridY, cardWidth, cardHeight, COLORS.WARNING);
    drawInfoCard(doc, "DSA Score", formatNum(dsaRawScore), margin + cardWidth + 10, gridY, cardWidth, cardHeight, COLORS.DANGER);
    drawInfoCard(doc, "CGPA", formatNum(academic.cgpa || student.overallGpa), margin + (cardWidth + 10) * 2, gridY, cardWidth, cardHeight, COLORS.SUCCESS);
    drawInfoCard(doc, "LeetCode Rating", String(Math.round(lc.rating || 0)), margin + (cardWidth + 10) * 3, gridY, cardWidth, cardHeight, COLORS.ACCENT);

    doc.y = gridY + 105;
    drawSectionHeading(doc, "PLATFORMS INTEGRATION", 10);
    doc.moveDown(0.2);
    
    const syncRows = [
      ["LeetCode", student.leetcodeUsername || 'Not Connected', student.leetcodeUsername ? 'Linked' : 'Pending'],
      ["CodeChef", student.codechefUsername || 'Not Connected', student.codechefUsername ? 'Linked' : 'Pending'],
      ["GeeksforGeeks", student.gfgUsername || 'Not Connected', student.gfgUsername ? 'Linked' : 'Pending'],
      ["GitHub", student.githubUsername || 'Not Connected', student.githubUsername ? 'Linked' : 'Pending'],
      ["HackerRank", student.hackerrankUsername || hr.username || 'Not Connected', (student.hackerrankUsername || hr.username) ? 'Linked' : 'Pending']
    ];
    
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Platform", "Connected Username", "Connection Status"],
      widths: ['auto', 'auto', 'auto'],
      rows: syncRows
    });

    // ---------------------------------------------------------
    // PAGE 2: OVERALL TECHNICAL ASSESSMENT & MILESTONES
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "OVERALL TECHNICAL ASSESSMENT & MILESTONES", margin, contentWidth);
    
    drawSectionHeading(doc, "OVERALL ASSESSMENT", 10);
    doc.moveDown(0.2);
    
    const statusText = rpFinalScore >= 75 ? 'Ready' : (rpFinalScore >= 50 ? 'Moderate' : 'At Risk');
    const evalRows = [
      ["DSA Level", `${mentorship.dsaLevel || 'Intermediate'} (${formatNum(dsaRawScore)}/100)`],
      ["Placement Readiness", `${mentorship.readinessLevel || 'Foundation'}`],
      ["Placement Score", `${formatNum(rpFinalScore)}%`],
      ["Status", statusText]
    ];
    
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Metric", "Assessment"],
      widths: [200, 'auto'],
      rows: evalRows
    });
    
    drawSectionHeading(doc, "STRENGTHS & WEAKNESSES", 10);
    doc.moveDown(0.2);
    
    let maxLen = Math.max((mentorship.strengths || []).length, (mentorship.weaknesses || []).length);
    if (maxLen === 0) maxLen = 1;
    const swRows = [];
    for (let i = 0; i < maxLen; i++) {
      const s = (mentorship.strengths || [])[i];
      const w = (mentorship.weaknesses || [])[i];
      swRows.push([
        s ? { text: `[+] ${s}`, color: COLORS.SUCCESS } : '—',
        w ? { text: `[!] ${w}`, color: COLORS.DANGER } : '—'
      ]);
    }
    
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Strongest Areas", "Needs Improvement"],
      widths: ['auto', 'auto'],
      rows: swRows
    });

    // ---------------------------------------------------------
    // PAGE 3: PERSONAL, FAMILY & MENTOR DETAILS (Single Page Optimization)
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "PERSONAL, FAMILY & MENTOR DETAILS", margin, contentWidth);

    const persData = [
      ["Full Name", pd.fullName || student.name],
      ["Gender", pd.gender],
      ["Date of Birth", pd.dob ? new Date(pd.dob).toLocaleDateString() : null],
      ["Mobile Number", pd.mobile],
      ["Email Address", pd.email || student.email],
      ["MSS ID", student.mssid],
      ["Roll Number", pd.rollNumber],
      ["College", student.college],
      ["Branch", student.branch],
      ["Academic Year", pd.year || student.currentYear],
      ["Section", pd.section],
      ["Hostel", pd.hostelName || student.hostel]
    ].filter(r => r[1]);
    
    const addressParts = [pd.permanentAddress, pd.city, pd.district, pd.state, pd.pincode].filter(Boolean);
    if (addressParts.length > 0) {
      persData.push(["Address", addressParts.join(', ')]);
    }
    
    drawSectionHeading(doc, "PERSONAL INFORMATION", 9.5);
    doc.moveDown(0.1);
    drawTable(doc, {
      margin, contentWidth,
      widths: [150, 'auto'],
      rows: persData,
      headerTitle: "PERSONAL, FAMILY & MENTOR DETAILS",
      compact: true
    });

    const famData = [];
    if (fd.parentStatus) famData.push(["Parental Status", fd.parentStatus]);
    if (fd.father?.name) famData.push(["Father Name", fd.father.name]);
    if (fd.father?.occupation) famData.push(["Father Occupation", fd.father.occupation]);
    if (fd.father?.education) famData.push(["Father Education", fd.father.education]);
    if (fd.father?.mobile || fd.father?.contact) famData.push(["Father Contact", fd.father.mobile || fd.father.contact]);
    
    if (fd.mother?.name) famData.push(["Mother Name", fd.mother.name]);
    if (fd.mother?.occupation) famData.push(["Mother Occupation", fd.mother.occupation]);
    if (fd.mother?.education) famData.push(["Mother Education", fd.mother.education]);
    if (fd.mother?.mobile || fd.mother?.contact) famData.push(["Mother Contact", fd.mother.mobile || fd.mother.contact]);
    
    const famIncome = fd.familyIncome || fd.annualIncome || pd.annualIncome || "";
    if (famIncome) famData.push(["Annual Income", famIncome]);
    if (fd.category || pd.category) famData.push(["Category", fd.category || pd.category]);
    if (fd.scholarshipInfo || pd.scholarship) famData.push(["Scholarship", fd.scholarshipInfo || pd.scholarship]);
    
    if (famData.length > 0) {
      drawSectionHeading(doc, "FAMILY & SOCIOECONOMIC DETAILS", 9.5);
      doc.moveDown(0.1);
      drawTable(doc, {
        margin, contentWidth,
        widths: [150, 'auto'],
        rows: famData,
        headerTitle: "PERSONAL, FAMILY & MENTOR DETAILS",
        compact: true
      });
    }

    if (fd.siblings && fd.siblings.length > 0) {
      drawSectionHeading(doc, "SIBLING DETAILS", 9.5);
      doc.moveDown(0.1);
      const sibRows = fd.siblings.map(s => [
        s.name || 'N/A',
        s.relation || 'Sibling',
        s.educationStatus || s.education || 'N/A',
        s.occupation || 'N/A'
      ]);
      drawTable(doc, {
        margin, contentWidth,
        headers: ["Name", "Relation", "Education", "Occupation"],
        widths: ['auto', 'auto', 'auto', 'auto'],
        rows: sibRows,
        headerTitle: "PERSONAL, FAMILY & MENTOR DETAILS",
        compact: true
      });
    }

    const mentorRows = [];
    const fmtM = (m) => m?.name ? `${m.name} (${m.mobileNumber || m.contact || 'N/A'})` : '';
    if (fmtM(profile?.collegeMentor)) mentorRows.push(["College Mentor", fmtM(profile.collegeMentor)]);
    if (fmtM(profile?.academicMentor)) mentorRows.push(["Academic Mentor", fmtM(profile.academicMentor)]);
    if (fmtM(profile?.codingMentor)) mentorRows.push(["Coding Mentor", fmtM(profile.codingMentor)]);
    if (fmtM(profile?.communicationMentor)) mentorRows.push(["Communication Mentor", fmtM(profile.communicationMentor)]);
    if (fmtM(profile?.projectMentor)) mentorRows.push(["Project Mentor", fmtM(profile.projectMentor)]);
    
    if (mentorRows.length > 0) {
      drawSectionHeading(doc, "MENTOR INFORMATION", 9.5);
      doc.moveDown(0.1);
      drawTable(doc, {
        margin, contentWidth,
        widths: [150, 'auto'],
        rows: mentorRows,
        headerTitle: "PERSONAL, FAMILY & MENTOR DETAILS",
        compact: true
      });
    }
    
    // ---------------------------------------------------------
    // PAGE 4: ACADEMIC DETAILS
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "ACADEMIC DETAILS & PROFILE", margin, contentWidth);

    drawSectionHeading(doc, "SEMESTER GRADE SUMMARY (SGPA)", 10);
    doc.moveDown(0.2);
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Backlogs", "CGPA"],
      widths: ['auto','auto','auto','auto','auto','auto','auto','auto'],
      aligns: ['center','center','center','center','center','center','center','center'],
      rows: [[
        formatNum(academic.sgpa1), formatNum(academic.sgpa2), formatNum(academic.sgpa3),
        formatNum(academic.sgpa4), formatNum(academic.sgpa5), formatNum(academic.sgpa6),
        String(academic.backlogs ?? 0),
        { text: formatNum(academic.cgpa || student.overallGpa), font: 'Helvetica-Bold', color: COLORS.ACCENT }
      ]],
      headerTitle: "ACADEMIC DETAILS & PROFILE"
    });

    drawSectionHeading(doc, "SCHOOLING DETAILS (10TH & 12TH)", 10);
    doc.moveDown(0.2);
    const formatAcademicScore = (score) => {
      if (!score) return '—';
      const num = Number(score);
      return num <= 10.1 ? `${formatNum(num)} CGPA` : `${formatNum(num)}%`;
    };

    const schRows = [
      ["Institution", pd.ssc?.schoolName || '—', pd.intermediate?.collegeName || '—'],
      ["Board", pd.ssc?.board || '—', pd.intermediate?.board || '—'],
      ["Passout Year", pd.ssc?.passoutYear || '—', pd.intermediate?.passoutYear || '—'],
      ["Percentage", formatAcademicScore(pd.ssc?.percentage), formatAcademicScore(pd.intermediate?.percentage)]
    ];
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Metric", "10th (SSC)", "12th (Intermediate)"],
      widths: [120, 'auto', 'auto'],
      rows: schRows,
      headerTitle: "ACADEMIC DETAILS & PROFILE"
    });

    const ad = profile?.academicDetails || {};
    const exams = [];
    if (ad.eamcetRank || ad.eapcetRank) exams.push(["EAMCET / EAPCET Rank", ad.eamcetRank || ad.eapcetRank]);
    if (ad.jeeMainsPercentile) exams.push(["JEE Mains Percentile", `${formatNum(ad.jeeMainsPercentile)}%`]);
    if (ad.jeeMainsOverallRank) exams.push(["JEE Mains Overall Rank", ad.jeeMainsOverallRank]);
    if (ad.jeeMainsCategoryRank) exams.push(["JEE Mains Category Rank", ad.jeeMainsCategoryRank]);
    if (ad.jeeAdvOverallRank) exams.push(["JEE Advanced Overall Rank", ad.jeeAdvOverallRank]);
    if (ad.jeeAdvCategoryRank) exams.push(["JEE Advanced Category Rank", ad.jeeAdvCategoryRank]);
    
    if (exams.length > 0) {
      drawSectionHeading(doc, "ENTRANCE EXAM DETAILS", 10);
      doc.moveDown(0.2);
      drawTable(doc, {
        margin, contentWidth,
        headers: ["Exam", "Result"],
        widths: [150, 'auto'],
        rows: exams,
        headerTitle: "ACADEMIC DETAILS & PROFILE"
      });
    }

    if (profile?.education && profile.education.length > 0) {
      drawSectionHeading(doc, "OTHER EDUCATIONAL DEGREES", 10);
      doc.moveDown(0.2);
      const eduRows = profile.education.map(edu => [
        `${edu.degree} in ${edu.branch || 'N/A'}`,
        edu.institution,
        `${edu.startYear} - ${edu.endYear}`,
        edu.cgpa || 'N/A'
      ]);
      drawTable(doc, {
        margin, contentWidth,
        headers: ["Degree", "Institution", "Duration", "CGPA"],
        widths: ['auto', 'auto', 100, 60],
        rows: eduRows,
        headerTitle: "ACADEMIC DETAILS & PROFILE"
      });
    }

    // ---------------------------------------------------------
    // PAGE 5: MANDATORY ACCOMPLISHMENTS
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "MANDATORY ACCOMPLISHMENTS SCORECARD", margin, contentWidth);
    
    const ma = profile?.mandatoryAccomplishments || student.mandatoryAccomplishments || {};
    const ms = calculateMandatoryScores({ mandatoryAccomplishments: ma }, profile?.overallGpa || student.overallGpa || 0);

    drawSectionHeading(doc, `TOTAL SCHOLARSHIP SCORE: ${formatNum(ms.total || 0)} / 70`, 11);
    doc.moveDown(0.4);

    const maRows = [
      ["CGPA", `${profile?.overallGpa || student.overallGpa || 'N/A'}`, formatNum(ms.cgpa)],
      ["Technical Courses", `${(ma.technicalCourses || []).filter(c => c.status === 'Completed').length} Completed`, formatNum(ms.technicalCourses)],
      ["Coding Consistency", `Arrays: ${ma.codingConsistency?.arraysSolved || 0}, Strings: ${ma.codingConsistency?.stringsSolved || 0}`, formatNum(ms.codingConsistency)],
      ["Projects", `${(ma.projects || []).length} Projects`, formatNum(ms.projects)],
      ["Contest Performance", `LC Rating: ${formatNum(ma.contestPerformance?.leetcodeRating, '0')}`, formatNum(ms.contestPerformance)],
      ["Hackathons", `${(ma.hackathons || []).length} Participation`, formatNum(ms.hackathons)],
      ["Personality Dev", `${(ma.personalityActivities || []).length} Activity`, formatNum(ms.personalityDevelopment)],
      [{ text: "Total Score", font: 'Helvetica-Bold' }, "", { text: `${formatNum(ms.total || 0)} / 70`, font: 'Helvetica-Bold', color: COLORS.ACCENT }]
    ];
    
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Category", "Supporting Evidence", "Score"],
      widths: ['auto', 'auto', 80],
      aligns: ['left', 'left', 'right'],
      rows: maRows,
      headerTitle: "MANDATORY ACCOMPLISHMENTS SCORECARD"
    });

    drawSectionHeading(doc, "DETAILED LOGS", 10);
    doc.moveDown(0.2);
    
    const tCourses = (ma.technicalCourses || []).map(c => [
      c.courseName || 'N/A', 
      c.platform || 'N/A', 
      c.status || 'N/A', 
      c.certificateLink ? { text: 'Link', link: c.certificateLink, color: COLORS.ACCENT } : { text: 'No Link Provided', color: COLORS.MUTED }
    ]);
    if (tCourses.length > 0) {
      drawTable(doc, { margin, contentWidth, headers: ["Course Name", "Platform", "Status", "Certificate"], widths: ['auto', 100, 80, 80], rows: tCourses, headerTitle: "MANDATORY ACCOMPLISHMENTS SCORECARD" });
    }

    const tProjs = (ma.projects || []).map(p => [
      p.projectName || 'N/A',
      p.githubLink ? { text: 'GitHub', link: p.githubLink, color: COLORS.ACCENT } : { text: 'No GitHub Link', color: COLORS.MUTED },
      p.liveLink ? { text: 'Live Demo', link: p.liveLink, color: COLORS.ACCENT } : { text: 'No Live Link', color: COLORS.MUTED }
    ]);
    if (tProjs.length > 0) {
      drawTable(doc, { margin, contentWidth, headers: ["Project Name", "GitHub", "Live Demo"], widths: ['auto', 100, 100], rows: tProjs, headerTitle: "MANDATORY ACCOMPLISHMENTS SCORECARD" });
    }
    
    const tHacks = (ma.hackathons || []).map(h => [
      h.hackathonName || 'N/A',
      h.position || 'Participant',
      h.certificateLink ? { text: 'Live Link', link: h.certificateLink, color: COLORS.ACCENT } : { text: 'No Link', color: COLORS.MUTED }
    ]);
    if (tHacks.length > 0) {
      drawTable(doc, { margin, contentWidth, headers: ["Hackathon Name", "Position", "Link"], widths: ['auto', 100, 100], rows: tHacks, headerTitle: "MANDATORY ACCOMPLISHMENTS SCORECARD" });
    }
    
    const tPers = (ma.personalityActivities || []).map(a => [
      a.activityName || 'N/A',
      a.certificateLink ? { text: 'Proof Link', link: a.certificateLink, color: COLORS.ACCENT } : { text: 'No Link', color: COLORS.MUTED }
    ]);
    if (tPers.length > 0) {
      drawTable(doc, { margin, contentWidth, headers: ["Activity Name", "Link"], widths: ['auto', 100], rows: tPers, headerTitle: "MANDATORY ACCOMPLISHMENTS SCORECARD" });
    }

    // ---------------------------------------------------------
    // PAGE 6: PROFESSIONAL DETAILS
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "PROFESSIONAL DETAILS OVERVIEW", margin, contentWidth);
    
    const resumeSkills = defaultResume?.content?.skills || profile?.skills || [];
    if (resumeSkills.length > 0) {
      drawSectionHeading(doc, "TECHNICAL SKILLS", 10);
      doc.moveDown(0.2);
      drawTable(doc, {
        margin, contentWidth, headers: ["Skills"], widths: ['auto'],
        rows: [[resumeSkills.join(', ')]],
        headerTitle: "PROFESSIONAL DETAILS OVERVIEW"
      });
    }
    
    const resumeProjs = defaultResume?.content?.projects || (profile?.projects || []).map(p => ({
        name: p.title, description: p.description, techStack: p.technologies || [], githubUrl: p.githubLink, liveUrl: p.liveLink, highlights: []
    }));
    if (resumeProjs.length > 0) {
      drawSectionHeading(doc, "PROJECTS", 10);
      doc.moveDown(0.2);
      const projRows = resumeProjs.map(p => [
        { text: p.name, font: 'Helvetica-Bold' },
        (p.techStack || []).join(', '),
        p.githubUrl ? { text: 'GitHub', link: p.githubUrl, color: COLORS.ACCENT } : '-',
        p.liveUrl ? { text: 'Live', link: p.liveUrl, color: COLORS.ACCENT } : '-'
      ]);
      drawTable(doc, {
        margin, contentWidth, headers: ["Project Name", "Tech Stack", "GitHub", "Live Demo"],
        widths: [150, 'auto', 60, 60], rows: projRows, headerTitle: "PROFESSIONAL DETAILS OVERVIEW"
      });
    }

    const resumeExp = defaultResume?.content?.workExperience || (profile?.experiences || []).map(e => ({
        company: e.company, role: e.role, startDate: e.startDate, endDate: e.endDate, description: e.description
    }));
    if (resumeExp.length > 0) {
      drawSectionHeading(doc, "WORK EXPERIENCE", 10);
      doc.moveDown(0.2);
      const expRows = resumeExp.map(e => [
        { text: e.company, font: 'Helvetica-Bold' },
        e.role,
        `${formatDate(e.startDate)} - ${e.endDate ? formatDate(e.endDate) : 'Present'}`
      ]);
      drawTable(doc, {
        margin, contentWidth, headers: ["Company", "Role", "Duration"],
        widths: ['auto', 'auto', 120], rows: expRows, headerTitle: "PROFESSIONAL DETAILS OVERVIEW"
      });
    }
    
    const resumeCerts = defaultResume?.content?.certifications || (profile?.certifications || []);
    if (resumeCerts.length > 0) {
      drawSectionHeading(doc, "CERTIFICATIONS", 10);
      doc.moveDown(0.2);
      const certRows = resumeCerts.map(c => [
        { text: c.title, font: 'Helvetica-Bold' },
        c.issuer || c.provider,
        formatDate(c.date || c.issueDate)
      ]);
      drawTable(doc, {
        margin, contentWidth, headers: ["Certification", "Issuer", "Date"],
        widths: ['auto', 150, 100], rows: certRows, headerTitle: "PROFESSIONAL DETAILS OVERVIEW"
      });
    }

    const hackathons = profile?.hackathons || [];
    drawSectionHeading(doc, "HACKATHONS", 10);
    doc.moveDown(0.2);
    if (hackathons.length > 0) {
      const hackRows = hackathons.map(h => [
        { text: h.name || h.hackathonName || '-', font: 'Helvetica-Bold' },
        h.organizer || '-',
        formatDate(h.date),
        (h.teamSize || '-').toString(),
        h.position || '-',
        h.result || '-',
        h.certificateLink ? { text: 'View', link: h.certificateLink, color: COLORS.ACCENT } : '-'
      ]);
      drawTable(doc, {
        margin, contentWidth, headers: ["Hackathon", "Organizer", "Date", "Team Size", "Position", "Result", "Certificate"],
        widths: ['auto', 'auto', 60, 60, 60, 60, 50], rows: hackRows, headerTitle: "PROFESSIONAL DETAILS OVERVIEW"
      });
    } else {
      drawTable(doc, {
        margin, contentWidth, headers: ["Hackathon", "Organizer", "Date", "Team Size", "Position", "Result", "Certificate"],
        widths: ['auto', 'auto', 60, 60, 60, 60, 50], rows: [["No Hackathons Added", "-", "-", "-", "-", "-", "-"]], headerTitle: "PROFESSIONAL DETAILS OVERVIEW"
      });
    }

    // ---------------------------------------------------------
    // PAGE 7: LEETCODE ANALYTICS - PAGE A (Metrics & Logs)
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "LEETCODE ANALYTICS - METRICS & HISTORY", margin, contentWidth);
    
    const lcMappings = {
      username: "Username",
      problemsSolved: "Total Solved",
      easySolved: "Easy",
      mediumSolved: "Medium",
      hardSolved: "Hard",
      acceptanceRate: "Acceptance Rate",
      rating: "Contest Rating",
      highestRating: "Highest Rating",
      globalRanking: "Global Rank",
      contestCount: "Contest Count",
      badgeCount: "Badge Count",
      activeDays: "Active Days",
      currentStreak: "Current Streak",
      longestStreak: "Longest Streak"
    };

    renderMappedTable(doc, lc, lcMappings, "LEETCODE GENERAL METRICS", margin, contentWidth, footerY);
    // V6: Contest Logs and Recent Activity Removed Completely

    // ---------------------------------------------------------
    // PAGE 8: LEETCODE ANALYTICS - PAGE B (Topic Coverage)
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "LEETCODE ANALYTICS - TOPIC COVERAGE", margin, contentWidth);

    if (lc.topicScores) {
      drawSectionHeading(doc, "LEETCODE TOPIC COVERAGE", 10);
      doc.moveDown(0.2);
      const topicsList = [
        { key: 'arrays', label: 'Arrays' },
        { key: 'strings', label: 'Strings' },
        { key: 'hashTable', label: 'Hash Table' },
        { key: 'twoPointers', label: 'Two Pointers' },
        { key: 'binarySearch', label: 'Binary Search' },
        { key: 'trees', label: 'Trees' },
        { key: 'dynamicProgramming', label: 'Dynamic Programming' },
        { key: 'graphs', label: 'Graphs' },
        { key: 'greedy', label: 'Greedy' },
        { key: 'linkedList', label: 'Linked List' }
      ];

      const topicRows = topicsList.map(t => {
        const ts = lc.topicScores[t.key] || { solved: 0, target: 0, completion: 0, score: 0 };
        return [
          { text: t.label, font: 'Helvetica-Bold' },
          String(ts.solved),
          String(ts.target),
          { text: `${formatNum(ts.completion, '0.00')}%`, color: ts.completion >= 100 ? COLORS.SUCCESS : COLORS.BODY },
          { text: formatNum(ts.score, '0.00'), font: 'Helvetica-Bold', color: COLORS.ACCENT }
        ];
      });

      topicRows.push([
        { text: "Total Topic Coverage Score", font: 'Helvetica-Bold' },
        "",
        "",
        "",
        { text: `${lc.topicScores.totalTopicScore || 0} / 30`, font: 'Helvetica-Bold', color: COLORS.ACCENT }
      ]);

      drawTable(doc, {
        margin, contentWidth,
        headers: ["Topic", "Solved", "Target", "Completion %", "Score"],
        widths: ['auto', 60, 60, 80, 60],
        aligns: ['left', 'right', 'right', 'right', 'right'],
        rows: topicRows,
        headerTitle: "LEETCODE ANALYTICS - TOPIC COVERAGE"
      });
    } else {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLORS.MUTED).text("No Topic Coverage Data Available.", margin, doc.y);
    }

    // ---------------------------------------------------------
    // PAGE 9: PLATFORM ANALYTICS (Continuous Flow)
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "PLATFORM ANALYTICS", margin, contentWidth);
    
    const ccMappings = {
      username: "Username",
      currentRating: "Current Rating",
      highestRating: "Highest Rating",
      stars: "Stars",
      globalRank: "Global Rank",
      countryRank: "Country Rank",
      division: "Division",
      problemsSolved: "Problems Solved",
      contestCount: "Contests Participated",
      longChallenge: "Long Challenge",
      cookOff: "CookOff",
      lunchTime: "Lunchtime",
      recentContestRating: "Recent Contest Rating",
      highestStars: "Highest Stars"
    };
    renderMappedTable(doc, cc, ccMappings, "CODECHEF METRICS", margin, contentWidth, footerY, "PLATFORM ANALYTICS");

    if (gh.username) {
      checkPageBreak(doc, 80, margin, footerY, "PLATFORM ANALYTICS");
      drawSectionHeading(doc, "GITHUB PORTFOLIO & CONTRIBUTION TRACKER", 10);
      doc.moveDown(0.2);
      const ghRows = [];
      const totalContribs = Array.isArray(gh.contributions) 
        ? gh.contributions.reduce((sum, c) => sum + (c.contributionCount || 0), 0) 
        : (gh.contributionCount || gh.totalCommits || 0);
        
      const ghMetrics = [
        { label: "Public Repositories:", value: gh.reposCount || gh.publicRepos },
        { label: "Account Followers:", value: gh.followersCount || gh.followers },
        { label: "Total Stars Received:", value: gh.starsCount || gh.stars },
        { label: "Account Following:", value: gh.followingCount || gh.following },
        { label: "Public GitHub URL:", value: gh.url || gh.profileUrl || (gh.username ? `github.com/${gh.username}` : null), isLink: true },
        { label: "Total Contributions (1Yr):", value: totalContribs > 0 ? totalContribs : null }
      ].filter(m => m.value !== undefined && m.value !== null && m.value !== '' && String(m.value) !== '0');
      
      for (let i = 0; i < ghMetrics.length; i += 2) {
        const left = ghMetrics[i];
        const right = ghMetrics[i + 1] || { label: '', value: '' };
        
        const formatVal = (m) => {
           if (!m || !m.value) return "";
           const valStr = typeof m.value === 'number' ? String(formatNum(m.value)) : String(m.value);
           if (m.isLink) {
              return { text: valStr, link: `https://${valStr.replace(/^https?:\/\//, '')}`, color: COLORS.ACCENT, font: 'Helvetica-Bold' };
           }
           return { text: valStr, font: 'Helvetica-Bold', color: COLORS.HEADING };
        };

        ghRows.push([
           { text: left.label, font: 'Helvetica', color: COLORS.MUTED }, 
           formatVal(left), 
           { text: right.label, font: 'Helvetica', color: COLORS.MUTED }, 
           formatVal(right)
        ]);
      }
      
      drawTable(doc, {
        margin, contentWidth,
        headers: [], 
        widths: [130, 'auto', 130, 'auto'],
        rows: ghRows,
        headerTitle: "PLATFORM ANALYTICS"
      });
    }
    
    let gfgData = gfg;
    if (!gfgData.totalProblemsSolved && gfgData.problemsSolved) {
      gfgData = { ...gfgData, totalProblemsSolved: gfgData.problemsSolved };
    }
    
    if (String(gfgData.instituteRank) === '0') delete gfgData.instituteRank;
    if (String(gfgData.globalRank) === '0') delete gfgData.globalRank;
    if (String(gfgData.monthlyScore) === '0') delete gfgData.monthlyScore;
    const gfgMappings = {
      username: "Username",
      codingScore: "Coding Score",
      totalProblemsSolved: "Problems Solved",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      schoolScore: "School Score",
      instituteRank: "Institute Rank",
      globalRank: "Global Rank",
      monthlyScore: "Monthly Score",
      currentStreak: "Current Streak",
      longestStreak: "Longest Streak",
      articles: "Articles",
      potdCount: "Potd Count",
      contestCount: "Contest Count"
    };
    renderMappedTable(doc, gfgData, gfgMappings, "GEEKSFORGEEKS METRICS", margin, contentWidth, footerY, "PLATFORM ANALYTICS");
    
    // Explicit manual extraction for HackerRank array dumps (continuous flow)
    if (hr.username || hr.totalProblemsSolved) {
      checkPageBreak(doc, 60, margin, footerY, "PLATFORM ANALYTICS");
      drawSectionHeading(doc, "HACKERRANK METRICS", 10);
      doc.moveDown(0.2);
      const hrRows = [];
      if (hr.username) hrRows.push(["Username", hr.username]);
      if (hr.totalProblemsSolved) hrRows.push(["Total Problems Solved", String(hr.totalProblemsSolved)]);
      if (hr.badgeCount) hrRows.push(["Badge Count", String(hr.badgeCount)]);
      
      if (hr.skills && Array.isArray(hr.skills) && hr.skills.length > 0) {
        const formattedSkills = hr.skills.map(s => {
          return String(s).replace(/\(\s*(\d+)[^)]*\)/g, (match, p1) => {
            return `— Level: ${p1} Stars`;
          });
        }).join('\n');
        hrRows.push(["Skills", formattedSkills]);
      }
      
      if (hr.certifications && Array.isArray(hr.certifications) && hr.certifications.length > 0) {
        hrRows.push(["Certifications", hr.certifications.join('\n')]);
      }

      if (hrRows.length > 0) {
        drawTable(doc, {
          margin, contentWidth, headers: ["Metric", "Value"], widths: [200, 'auto'],
          rows: hrRows, headerTitle: "PLATFORM ANALYTICS"
        });
      }
    } else {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLORS.MUTED).text("No HackerRank data available.", margin, doc.y);
    }

    // ---------------------------------------------------------
    // PAGE 13: PLACEMENT READINESS & PROGRESS TRACKER
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "PLACEMENT READINESS & PROGRESS TRACKER", margin, contentWidth);

    drawSectionHeading(doc, "DSA SCORE CALCULATION", 10);
    doc.moveDown(0.2);
    
    const dsaBreakdown = readiness.dsa?.breakdown || { problemSolving: 0, difficulty: 0, topicCoverage: 0, contest: 0, total: 0 };
    
    const getRatingScore = (r) => {
      if (r < 1200) return 0; if (r < 1300) return 1; if (r < 1400) return 2;
      if (r < 1500) return 3; if (r < 1600) return 4; if (r < 1700) return 5;
      if (r < 1750) return 6; return 7;
    };
    const getParticipationScore = (c) => {
      if (c >= 30) return 3; if (c >= 20) return 2; if (c >= 10) return 1; return 0;
    };
    const dsaRows = [
      [
        "Problem Solving", 
        `Solved Problems: ${lc.problemsSolved || 0}\nTarget: 400`,
        `${lc.problemsSolved || 0} / 400 × 30 = ${formatNum(dsaBreakdown.problemSolving)}`
      ],
      [
        "Difficulty", 
        `Easy: ${lc.easySolved || 0} solved (Target: 150)\nMedium: ${lc.mediumSolved || 0} solved (Target: 200)\nHard: ${lc.hardSolved || 0} solved (Target: 50)`,
        `Easy: ${formatNum(Math.min(10, ((lc.easySolved||0)/150)*10))}\nMedium: ${formatNum(Math.min(15, ((lc.mediumSolved||0)/200)*15))}\nHard: ${formatNum(Math.min(5, ((lc.hardSolved||0)/50)*5))}\nDifficulty Score = ${formatNum(dsaBreakdown.difficulty)}`
      ],
      [
        "Topic Coverage", 
        `Sum of 10 Topic Scores`,
        `Topic Coverage = ${formatNum(dsaBreakdown.topicCoverage)}`
      ],
      [
        "Contest Performance", 
        `Contest Rating: ${formatNum(lc.rating || 0)}\nRating Score: ${getRatingScore(lc.rating || 0)} / 7\n\nContest Participation: ${lc.contestCount || 0}\nParticipation Score: ${getParticipationScore(lc.contestCount || 0)} / 3`,
        `Final Contest Score:\n${formatNum(dsaBreakdown.contest)} / 10`
      ],
      [
        { text: "Total DSA Score", font: 'Helvetica-Bold' }, 
        "", 
        { text: `${formatNum(dsaBreakdown.total)} / 100`, font: 'Helvetica-Bold', color: COLORS.ACCENT }
      ]
    ];
    
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Component", "Values & Targets", "Formula & Result"],
      widths: [100, 160, 'auto'],
      rows: dsaRows,
      headerTitle: "DSA SCORE CALCULATION"
    });
    
    doc.moveDown(1);
    
    // ---------------------------------------------------------
    // PLACEMENT READINESS SCORE BREAKDOWN
    // ---------------------------------------------------------
    drawSectionHeading(doc, "PLACEMENT READINESS SCORE BREAKDOWN", 10);
    doc.moveDown(0.2);
    
    const prRows = [
      ["DSA Score", readiness.dsa?.weight || "60%", formatNum(readiness.dsa?.raw || 0), formatNum(readiness.dsa?.contribution || 0)],
      ["Projects", readiness.projects?.weight || "20%", formatNum(readiness.projects?.raw || 0), formatNum(readiness.projects?.contribution || 0)],
      ["Technical Courses", readiness.courses?.weight || "10%", formatNum(readiness.courses?.raw || 0), formatNum(readiness.courses?.contribution || 0)],
      ["Academics (CGPA)", readiness.cgpa?.weight || "10%", formatNum(readiness.cgpa?.raw || 0), formatNum(readiness.cgpa?.contribution || 0)]
    ];
    
    drawTable(doc, {
      margin, contentWidth,
      headers: ["Component", "Weight", "Raw Score", "Contribution"],
      widths: ['auto', 100, 100, 100],
      rows: prRows,
      headerTitle: "PLACEMENT READINESS SCORE BREAKDOWN"
    });
    
    doc.moveDown(1);
    
    const boxWidth = 350;
    const boxHeight = 50;
    const boxX = margin + (contentWidth - boxWidth) / 2;
    const currentY = doc.y;
    
    doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 5).fillOpacity(0.05).fill(COLORS.ACCENT);
    doc.fillOpacity(1);
    
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.HEADING)
       .text("FINAL PLACEMENT READINESS SCORE", boxX, currentY + 12, { width: boxWidth, align: 'center' });
       
    doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.ACCENT)
       .text(`${formatNum(readiness.overallReadiness || readiness.finalScore)}%`, boxX, currentY + 28, { width: boxWidth, align: 'center' });
       
    doc.y = currentY + boxHeight + 20;

    if (readiness.breakdown) {
      drawSectionHeading(doc, "PLACEMENT READINESS COMPONENT BREAKDOWN", 10);
      doc.moveDown(0.2);
      const prBreakdown = readiness.breakdown;
      const prRows = [
        ["DSA", "60%", formatNum(prBreakdown.dsa?.raw), formatNum(prBreakdown.dsa?.contribution)],
        ["Resume", "20%", formatNum(prBreakdown.resume?.raw), formatNum(prBreakdown.resume?.contribution)],
        ["GitHub", "10%", formatNum(prBreakdown.github?.raw), formatNum(prBreakdown.github?.contribution)],
        ["Core Subjects", "10%", formatNum(prBreakdown.coreSubjects?.raw), formatNum(prBreakdown.coreSubjects?.contribution)],
        [{ text: "Total Placement Readiness Score", font: 'Helvetica-Bold' }, "100%", "", { text: `${formatNum(rpFinalScore)}%`, font: 'Helvetica-Bold', color: COLORS.ACCENT }]
      ];
      drawTable(doc, {
        margin, contentWidth,
        headers: ["Component", "Weight", "Raw Score", "Contribution"],
        widths: ['auto', 60, 80, 80],
        aligns: ['left', 'center', 'right', 'right'],
        rows: prRows,
        headerTitle: "PLACEMENT READINESS & PROGRESS TRACKER"
      });
    }
    
    // V6: Historical Growth Snapshot Logs Removed Completely

    // ---------------------------------------------------------
    // PAGE 14: MENTOR FEEDBACK
    // ---------------------------------------------------------
    doc.addPage();
    drawPageHeader(doc, "MENTOR FEEDBACK", margin, contentWidth);
    
    const feedbackRows = [];
    if (mentorship.strengths && mentorship.strengths.length > 0) {
      mentorship.strengths.forEach(s => feedbackRows.push(["Strength", s]));
    }
    if (mentorship.weaknesses && mentorship.weaknesses.length > 0) {
      mentorship.weaknesses.forEach(w => feedbackRows.push(["Area of Improvement", w]));
    }
    if (mentorship.recommendations && mentorship.recommendations.length > 0) {
      mentorship.recommendations.forEach(r => feedbackRows.push(["Recommendation", r]));
    }
    if (mentorship.feedback) {
      feedbackRows.push(["Overall Feedback", mentorship.feedback]);
    }
    
    if (feedbackRows.length > 0) {
      drawTable(doc, {
        margin, contentWidth,
        headers: ["Category", "Feedback"],
        widths: [120, 'auto'],
        rows: feedbackRows,
        headerTitle: "MENTOR FEEDBACK"
      });
    } else {
      drawSectionHeading(doc, "NO MENTOR FEEDBACK AVAILABLE", 10, COLORS.MUTED);
    }

    // NOTE: ATS RESUME COMPLETELY REMOVED FROM FINAL REPORT 

    // ---------------------------------------------------------
    // POST-PROCESSING: PAGE NUMBERS IN FOOTER
    // ---------------------------------------------------------
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(COLORS.LINE).lineWidth(0.5).stroke();
      doc.fillColor(COLORS.MUTED).font('Helvetica').fontSize(7.5);
      if (i === 0) {
        doc.text(`Medha Scholar - Student Evaluation Report`, margin, footerY + 8, { lineBreak: false });
        doc.text(`Confidential Evaluation - Institutional Use Only`, margin + contentWidth - 250, footerY + 8, { width: 250, align: 'right', lineBreak: false });
      } else {
        doc.text(`Student: ${student.name} (${student.mssid || 'N/A'})`, margin, footerY + 8, { lineBreak: false });
        doc.text(`Page ${i + 1} of ${range.count}`, margin + contentWidth - 100, footerY + 8, { width: 100, align: 'right', lineBreak: false });
      }
    }

    doc.end();
  });
}

module.exports = { buildStudentReportPdf };
