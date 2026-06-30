const PDFDocument = require('pdfkit');
const { calculateMandatoryScores } = require('./mandatoryAccomplishmentsUtils');

/**
 * Format numeric value to exactly 2 decimal places. Returns fallback if invalid.
 */
function formatNum(val, fallback = 'N/A') {
  if (val === undefined || val === null || val === '' || isNaN(val)) return fallback;
  return Number(val).toFixed(2);
}

/**
 * Format date string into a readable format.
 */
function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Draw page header.
 */
function drawPageHeader(doc, title, margin = 40, contentWidth = 515) {
  const COLOR_THEME = '#1e3a8a'; // slate-900 or dark blue
  const startY = doc.y;
  doc.fillColor(COLOR_THEME).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase(), margin, startY, { lineBreak: false });
  doc.x = margin;
  doc.y = startY + doc.currentLineHeight();
  doc.moveTo(margin, doc.y + 3).lineTo(margin + contentWidth, doc.y + 3).strokeColor(COLOR_THEME).lineWidth(1).stroke();
  doc.moveDown(0.6);
}

function drawSectionHeading(doc, text, size = 9.5, color = '#0f172a', margin = 40) {
  doc.fillColor(color).font('Helvetica-Bold').fontSize(size);
  const startY = doc.y;
  doc.text(text, margin, startY, { lineBreak: false });
  doc.x = margin;
  doc.y = startY + doc.currentLineHeight();
}

/**
 * Checks remaining page height and breaks page if needed.
 */
function checkPageBreak(doc, neededHeight, margin = 40, footerY = 700, headerTitle = "Report Details") {
  if (doc.y + neededHeight > footerY) {
    doc.addPage();
    drawPageHeader(doc, headerTitle, margin, doc.page.width - margin * 2);
    return true;
  }
  return false;
}

/**
 * Build the multi-page student report card PDF
 */
function buildStudentReportPdf(student, profile, codingProfile, options = {}) {
  return new Promise((resolve, reject) => {
    // Enable bufferPages so we can loop back and add "Page X of Y" page numbers in the footer
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;
    const footerY = 745; // Footer boundary

    // Design Tokens (Color Palette)
    const COLOR_HEADING  = '#0f172a'; // slate-900
    const COLOR_BODY     = '#334155'; // slate-700
    const COLOR_MUTED    = '#64748b'; // slate-500
    const COLOR_LINE     = '#e2e8f0'; // slate-200
    const COLOR_THEME    = '#1e3a8a'; // dark-blue (navy)
    const COLOR_ACCENT   = '#2563eb'; // blue-600
    const COLOR_CARD_BG  = '#f8fafc'; // slate-50

    const academic = options.academic || {};
    const weeklySnapshots = options.weeklySnapshots || [];
    const contestSnapshots = options.contestSnapshots || [];
    const defaultResume = options.defaultResume || null;
    const photoBuffer = options.photoBuffer || null;
    
    const pd = profile?.personalDetails || {};
    const fd = profile?.familyDetails || {};
    const rp = profile?.readinessProfile || {};
    const lc = student.platformStats?.leetcode || {};
    const cc = student.platformStats?.codechef || {};
    const gfg = student.platformStats?.geeksforgeeks || {};
    const gh = student.platformStats?.github || {};
    
    // Resolve overall readiness
    const overallReadiness = rp.overallReadiness ?? 0;
    let statusText = 'AT RISK';
    let badgeColor = '#dc2626'; // red-600
    if (overallReadiness >= 75) {
      statusText = 'READY';
      badgeColor = '#16a34a'; // green-600
    } else if (overallReadiness >= 50) {
      statusText = 'MODERATE';
      badgeColor = '#d97706'; // amber-600
    }

    // ==========================================
    // PAGE 1: COVER PAGE / EXECUTIVE SUMMARY
    // ==========================================
    
    // Top banner
    doc.rect(0, 0, pageWidth, 125).fillColor(COLOR_THEME).fill();
    
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
       .text("MEDHA SCHOLAR Report Card", margin, 38, { lineBreak: false });
    doc.fillColor('#93c5fd').font('Helvetica-Bold').fontSize(11)
       .text("COGNITIVE POTENTIAL & DOPAMINE DISCIPLINE TRACKING", margin, 70, { lineBreak: false });

    const topY = 150;
    
    // Left Box: Student Summary Info
    doc.rect(margin, topY, 340, 150).fillColor(COLOR_CARD_BG).fill();
    doc.rect(margin, topY, 340, 150).strokeColor(COLOR_LINE).lineWidth(1).stroke();
    
    let infoY = topY + 12;
    doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(10).text("STUDENT PROFILE SUMMARY", margin + 15, infoY, { lineBreak: false });
    
    doc.font('Helvetica').fontSize(9).fillColor(COLOR_BODY);
    infoY += 18;
    doc.text(`Name:`, margin + 15, infoY, { continued: true })
       .font('Helvetica-Bold').text(` ${student.name}`);
    doc.font('Helvetica').text(`Roll No:`, margin + 15, infoY + 14, { continued: true })
       .font('Helvetica-Bold').text(` ${pd.rollNumber || 'N/A'}`);
    doc.font('Helvetica').text(`MSS ID:`, margin + 15, infoY + 28, { continued: true })
       .font('Helvetica-Bold').text(` ${student.mssid || 'N/A'}`);
    doc.font('Helvetica').text(`College:`, margin + 15, infoY + 42, { continued: true })
       .font('Helvetica-Bold').text(` ${student.college || 'N/A'}`);
    doc.font('Helvetica').text(`Branch & Year:`, margin + 15, infoY + 56, { continued: true })
       .font('Helvetica-Bold').text(` ${student.branch || 'N/A'} - ${student.currentYear || 'N/A'}`);
    doc.font('Helvetica').text(`Section:`, margin + 15, infoY + 70, { continued: true })
       .font('Helvetica-Bold').text(` ${pd.section || 'N/A'}`);
    doc.font('Helvetica').text(`Email:`, margin + 15, infoY + 84, { continued: true })
       .font('Helvetica-Bold').text(` ${student.email}`);
    doc.font('Helvetica').text(`Track / Goal:`, margin + 15, infoY + 98, { continued: true })
       .font('Helvetica-Bold').text(` ${profile?.goal || 'N/A'}`);

    // Right Box: Photo Support / Fallback Initials Avatar
    const photoX = margin + 355;
    doc.rect(photoX, topY, 160, 150).fillColor(COLOR_CARD_BG).fill();
    doc.rect(photoX, topY, 160, 150).strokeColor(COLOR_LINE).lineWidth(1).stroke();
    
    if (photoBuffer) {
      try {
        doc.image(photoBuffer, photoX + 15, topY + 10, { width: 130, height: 130 });
      } catch (err) {
        console.error('PDF photo render error, falling back to initials:', err.message);
        drawCoverInitialsAvatar(doc, photoX, topY, student.name);
      }
    } else {
      drawCoverInitialsAvatar(doc, photoX, topY, student.name);
    }

    function drawCoverInitialsAvatar(doc, pX, pY, name) {
      doc.circle(pX + 80, pY + 60, 32).fillColor(COLOR_THEME).fill();
      const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ST';
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
         .text(initials, pX, pY + 53, { width: 160, align: 'center' });
      doc.fillColor(COLOR_MUTED).font('Helvetica-Bold').fontSize(8.5)
         .text(name || '', pX + 5, pY + 110, { width: 150, align: 'center' });
    }

    // Grid: Key Metrics Dashboard Cards
    const gridY = 320;
    const cardWidth = (contentWidth - 30) / 4; 
    const cardHeight = 75;

    const drawCoverCard = (title, val, x, y, accentColor = COLOR_ACCENT) => {
      doc.rect(x, y, cardWidth, cardHeight).fillColor(COLOR_CARD_BG).fill();
      doc.rect(x, y, cardWidth, cardHeight).strokeColor(COLOR_LINE).lineWidth(1).stroke();
      doc.rect(x, y, cardWidth, 4).fillColor(accentColor).fill();
      
      doc.fillColor(COLOR_MUTED).font('Helvetica-Bold').fontSize(7.5)
         .text(title.toUpperCase(), x + 5, y + 12, { width: cardWidth - 10, align: 'center' });
      
      doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(16)
         .text(val, x + 5, y + 33, { width: cardWidth - 10, align: 'center' });
    };

    drawCoverCard("Placement Score", `${formatNum(rp.overallReadiness)}%`, margin, gridY, '#f59e0b');
    drawCoverCard("Academic CGPA", formatNum(academic.cgpa || student.overallGpa), margin + cardWidth + 10, gridY, '#10b981');
    drawCoverCard("LeetCode Rating", formatNum(lc.rating), margin + (cardWidth + 10) * 2, gridY, '#2563eb');
    drawCoverCard("CodeChef Rating", formatNum(cc.currentRating || cc.rating), margin + (cardWidth + 10) * 3, gridY, '#ef4444');

    // Platforms Last Sync Timestamps (New Page 1 Requirement)
    const syncTableY = 415;
    doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(10).text("PLATFORMS INTEGRATION & SYNC TRACKER", margin, syncTableY, { lineBreak: false });
    
    // Draw table
    const sTableY = syncTableY + 15;
    doc.rect(margin, sTableY, contentWidth, 18).fillColor('#e2e8f0').fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
    doc.text("Platform / Component", margin + 12, sTableY + 5);
    doc.text("Connected Profile / Username", margin + 180, sTableY + 5);
    doc.text("Last Successful Platform Sync Date", margin + 350, sTableY + 5);

    const drawSyncRow = (name, username, date, rowY) => {
      doc.rect(margin, rowY, contentWidth, 16).fillColor(COLOR_CARD_BG).fill();
      doc.rect(margin, rowY, contentWidth, 16).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_BODY);
      doc.text(name, margin + 12, rowY + 4);
      doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
      doc.text(username || 'Not Connected', margin + 180, rowY + 4);
      
      let dateText = 'N/A';
      if (date) {
        dateText = new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      }
      doc.text(dateText, margin + 350, rowY + 4);
    };

    drawSyncRow("LeetCode", student.leetcodeUsername, lc.lastSyncAt, sTableY + 18);
    drawSyncRow("CodeChef", student.codechefUsername, cc.lastSyncAt, sTableY + 34);
    drawSyncRow("GeeksforGeeks", student.gfgUsername, gfg.lastSyncAt, sTableY + 50);
    drawSyncRow("GitHub", student.githubUsername, gh.lastSyncAt, sTableY + 66);
    drawSyncRow("Overall Platform Sync", student.mssid || student.name, student.lastPlatformSyncAt, sTableY + 82);

    // Status Badge Section
    const statusY = 540;
    doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(10).text("OVERALL PLACEMENT READINESS STATUS", margin, statusY, { lineBreak: false });
    
    // Draw status pill
    doc.rect(margin, statusY + 15, 140, 30).fillColor(badgeColor).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
       .text(statusText, margin, statusY + 24, { width: 140, align: 'center' });

    // Status explanation
    doc.fillColor(COLOR_BODY).font('Helvetica').fontSize(8.5);
    const explanation = statusText === 'READY' 
      ? "The student meets or exceeds the recommended threshold for placement readiness, demonstrating strong coding skills, profile completion, and robust academic history."
      : statusText === 'MODERATE'
      ? "The student is on track but requires improvements in coding performance or resume content optimization to become fully ready for recruitment."
      : "The student is currently at risk. Critical focus is required immediately to improve coding practice, clear backlogs, and update platform profiles.";
    
    doc.text(explanation, margin + 160, statusY + 15, { width: contentWidth - 160, align: 'justify', lineGap: 2 });


    // ==========================================
    // PAGE 2: PERSONAL & FAMILY DETAILS (Dynamic Filtering)
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "PERSONAL & FAMILY DETAILS", margin, contentWidth);

    // Filter and collect Personal Details
    const personalRows = [];
    if (pd.fullName || student.name) personalRows.push({ label: "Full Name", value: pd.fullName || student.name });
    if (pd.gender) personalRows.push({ label: "Gender", value: pd.gender });
    if (pd.dob) personalRows.push({ label: "Date of Birth", value: new Date(pd.dob).toLocaleDateString() });
    if (pd.mobile) personalRows.push({ label: "Mobile Number", value: pd.mobile });
    if (pd.email || student.email) personalRows.push({ label: "Email Address", value: pd.email || student.email });
    if (student.mssid) personalRows.push({ label: "MSS ID", value: student.mssid });
    if (pd.rollNumber) personalRows.push({ label: "Roll Number", value: pd.rollNumber });
    if (student.college) personalRows.push({ label: "College", value: student.college });
    if (student.branch) personalRows.push({ label: "Branch", value: student.branch });
    if (pd.year || student.currentYear) personalRows.push({ label: "Academic Year", value: pd.year || student.currentYear });
    if (pd.section) personalRows.push({ label: "Section", value: pd.section });
    if (pd.hostelName || student.hostel) personalRows.push({ label: "Hostel Details", value: pd.hostelName || student.hostel });
    if (pd.mentorName) personalRows.push({ label: "Mentor Name", value: pd.mentorName });

    // Address
    const addressParts = [pd.permanentAddress, pd.city, pd.district, pd.state, pd.pincode].filter(Boolean);
    if (addressParts.length > 0) {
      personalRows.push({ label: "Address", value: addressParts.join(', ') });
    }

    drawSectionHeading(doc, "PERSONAL INFORMATION", 9, COLOR_HEADING);
    doc.moveDown(0.2);

    let infoGridY = doc.y;
    personalRows.forEach((row, i) => {
      // Draw grid rows
      doc.rect(margin, infoGridY, contentWidth, 18).fillColor(COLOR_CARD_BG).fill();
      doc.rect(margin, infoGridY, contentWidth, 18).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
      doc.text(row.label, margin + 10, infoGridY + 5, { lineBreak: false });
      
      doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
      doc.text(String(row.value), margin + 140, infoGridY + 5, { width: contentWidth - 150 });
      
      infoGridY += 18;
    });

    doc.y = infoGridY + 15;

    // Family Details
    const familyRows = [];
    if (fd.parentStatus) familyRows.push({ label: "Parental Status", value: fd.parentStatus });
    
    // Father
    if (fd.father?.name) {
      familyRows.push({ label: "Father Name", value: fd.father.name });
      if (fd.father.occupation) familyRows.push({ label: "Father Occupation", value: fd.father.occupation });
      if (fd.father.education) familyRows.push({ label: "Father Education", value: fd.father.education });
      if (fd.father.mobile) familyRows.push({ label: "Father Contact", value: fd.father.mobile });
    }
    // Mother
    if (fd.mother?.name) {
      familyRows.push({ label: "Mother Name", value: fd.mother.name });
      if (fd.mother.occupation) familyRows.push({ label: "Mother Occupation", value: fd.mother.occupation });
      if (fd.mother.education) familyRows.push({ label: "Mother Education", value: fd.mother.education });
      if (fd.mother.mobile) familyRows.push({ label: "Mother Contact", value: fd.mother.mobile });
    }
    // Guardian support
    const guardianName = fd.guardian?.name || fd.guardianName || pd.guardianName || "";
    const guardianOccupation = fd.guardian?.occupation || fd.guardianOccupation || "";
    const guardianMobile = fd.guardian?.mobile || fd.guardianMobile || "";
    if (guardianName) {
      familyRows.push({ label: "Guardian Name", value: guardianName });
      if (guardianOccupation) familyRows.push({ label: "Guardian Occupation", value: guardianOccupation });
      if (guardianMobile) familyRows.push({ label: "Guardian Contact", value: guardianMobile });
    }
    // Family Income support
    const familyIncome = fd.familyIncome || fd.annualIncome || fd.income || pd.annualIncome || pd.income || "";
    if (familyIncome) {
      familyRows.push({ label: "Family Annual Income", value: familyIncome });
    }

    if (familyRows.length > 0) {
      drawSectionHeading(doc, "FAMILY & SOCIOECONOMIC DETAILS", 9, COLOR_HEADING);
      doc.moveDown(0.2);
      
      let famGridY = doc.y;
      familyRows.forEach((row) => {
        doc.rect(margin, famGridY, contentWidth, 18).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, famGridY, contentWidth, 18).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
        doc.text(row.label, margin + 10, famGridY + 5, { lineBreak: false });
        
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
        doc.text(String(row.value), margin + 140, famGridY + 5, { lineBreak: false });
        
        famGridY += 18;
      });
      
      doc.y = famGridY;
    }

    // Mentor details
    const mentorRows = [];
    const formatMentor = (m) => m && m.name ? `${m.name} (${m.mobileNumber || 'N/A'})` : '';
    
    if (profile?.collegeMentor?.name) mentorRows.push({ label: "College Mentor", value: formatMentor(profile.collegeMentor) });
    if (profile?.academicMentor?.name) mentorRows.push({ label: "Academic Mentor", value: formatMentor(profile.academicMentor) });
    if (profile?.codingMentor?.name) mentorRows.push({ label: "Coding Mentor", value: formatMentor(profile.codingMentor) });
    if (profile?.communicationMentor?.name) mentorRows.push({ label: "Communication Skills Mentor", value: formatMentor(profile.communicationMentor) });
    if (profile?.projectMentor?.name) mentorRows.push({ label: "Project Mentor", value: formatMentor(profile.projectMentor) });

    if (mentorRows.length > 0) {
      doc.moveDown(0.8);
      checkPageBreak(doc, 40 + mentorRows.length * 18, margin, footerY, "PERSONAL & FAMILY DETAILS (Contd.)");
      drawSectionHeading(doc, "MENTOR INFORMATION", 9, COLOR_HEADING);
      doc.moveDown(0.2);
      
      let mentorGridY = doc.y;
      mentorRows.forEach(row => {
        doc.rect(margin, mentorGridY, contentWidth, 18).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, mentorGridY, contentWidth, 18).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
        doc.text(row.label, margin + 10, mentorGridY + 5, { lineBreak: false });
        
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
        doc.text(String(row.value), margin + 200, mentorGridY + 5, { lineBreak: false });
        mentorGridY += 18;
      });
      doc.y = mentorGridY;
    }

    // Siblings
    if (fd.siblings && fd.siblings.length > 0) {
      doc.moveDown(0.8);
      drawSectionHeading(doc, "SIBLING DETAILS", 9, COLOR_HEADING);
      doc.moveDown(0.2);
      
      let sibTableY = doc.y;
      doc.rect(margin, sibTableY, contentWidth, 16).fillColor('#e2e8f0').fill();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_HEADING);
      doc.text("Sibling Name", margin + 10, sibTableY + 4, { lineBreak: false });
      doc.text("Relation", margin + 120, sibTableY + 4, { lineBreak: false });
      doc.text("Education Status", margin + 220, sibTableY + 4, { lineBreak: false });
      doc.text("Occupation", margin + 370, sibTableY + 4, { lineBreak: false });
      
      let sibRowY = sibTableY + 16;
      fd.siblings.forEach(s => {
        if (!s.name) return;
        doc.rect(margin, sibRowY, contentWidth, 16).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, sibRowY, contentWidth, 16).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
        doc.text(s.name, margin + 10, sibRowY + 4, { lineBreak: false });
        doc.text(s.relation || 'Sibling', margin + 120, sibRowY + 4, { lineBreak: false });
        doc.text(s.educationStatus || 'N/A', margin + 220, sibRowY + 4, { lineBreak: false });
        doc.text(s.occupation || 'N/A', margin + 370, sibRowY + 4, { lineBreak: false });
        sibRowY += 16;
      });
      doc.y = sibRowY;
    }


    // ==========================================
    // PAGE 3: ACADEMIC DETAILS
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "ACADEMIC DETAILS & PROFILE", margin, contentWidth);

    // Semesters SGPA table
    drawSectionHeading(doc, "SEMESTER GRADE SUMMARY (SGPA)", 9, COLOR_HEADING);
    doc.moveDown(0.2);

    const semY = doc.y;
    doc.rect(margin, semY, contentWidth, 18).fillColor('#e2e8f0').rect(margin, semY, contentWidth, 18).fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
    doc.text("Sem 1", margin + 10, semY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text("Sem 2", margin + 70, semY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text("Sem 3", margin + 130, semY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text("Sem 4", margin + 190, semY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text("Sem 5", margin + 250, semY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text("Sem 6", margin + 310, semY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text("Backlogs", margin + 370, semY + 5, { width: 60, align: 'center', lineBreak: false });
    doc.text("CGPA Score", margin + 440, semY + 5, { width: 65, align: 'center', lineBreak: false });

    const semValY = semY + 18;
    doc.rect(margin, semValY, contentWidth, 18).fillColor(COLOR_CARD_BG).fill();
    doc.rect(margin, semValY, contentWidth, 18).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY);
    
    doc.text(formatNum(academic.sgpa1), margin + 10, semValY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text(formatNum(academic.sgpa2), margin + 70, semValY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text(formatNum(academic.sgpa3), margin + 130, semValY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text(formatNum(academic.sgpa4), margin + 190, semValY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text(formatNum(academic.sgpa5), margin + 250, semValY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text(formatNum(academic.sgpa6), margin + 310, semValY + 5, { width: 50, align: 'center', lineBreak: false });
    doc.text(String(academic.backlogs ?? 0), margin + 370, semValY + 5, { width: 60, align: 'center', lineBreak: false });
    
    doc.font('Helvetica-Bold').fillColor(COLOR_ACCENT);
    doc.text(formatNum(academic.cgpa || student.overallGpa), margin + 440, semValY + 5, { width: 65, align: 'center', lineBreak: false });

    doc.y = semValY + 28;

    // Schooling grid (SSC and Intermediate)
    drawSectionHeading(doc, "SCHOOLING DETAILS (10TH & 12TH)", 9, COLOR_HEADING);
    doc.moveDown(0.2);
    
    const schoolY = doc.y;
    const drawSchoolRow = (lbl1, val1, lbl2, val2, y) => {
      doc.rect(margin, y, contentWidth, 18).fillColor(COLOR_CARD_BG).fill();
      doc.rect(margin, y, contentWidth, 18).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
      doc.text(lbl1, margin + 8, y + 5, { lineBreak: false });
      doc.font('Helvetica').fillColor(COLOR_BODY);
      doc.text(String(val1 || '—'), margin + 120, y + 5, { lineBreak: false });
      
      doc.font('Helvetica-Bold').fillColor(COLOR_HEADING);
      doc.text(lbl2, margin + 268, y + 5, { lineBreak: false });
      doc.font('Helvetica').fillColor(COLOR_BODY);
      doc.text(String(val2 || '—'), margin + 380, y + 5, { lineBreak: false });
    };

    drawSchoolRow("SSC School Name", pd.ssc?.schoolName, "Intermediate College", pd.intermediate?.collegeName, schoolY);
    drawSchoolRow("SSC Board", pd.ssc?.board, "Intermediate Board", pd.intermediate?.board, schoolY + 18);
    drawSchoolRow("SSC Passout Year", pd.ssc?.passoutYear, "Intermediate Passout Year", pd.intermediate?.passoutYear, schoolY + 36);
    drawSchoolRow("SSC Percentage", pd.ssc?.percentage ? `${formatNum(pd.ssc.percentage)}%` : '—', "Intermediate Percentage", pd.intermediate?.percentage ? `${formatNum(pd.intermediate.percentage)}%` : '—', schoolY + 54);

    let nextAcademicsY = schoolY + 85;

    // Entrance Exam Details
    const entranceExamRows = [];
    const ad = profile?.academicDetails || {};
    const eamcetVal = ad.eamcetRank || ad.eapcetRank;
    if (eamcetVal) entranceExamRows.push({ label: "EAMCET Rank", value: eamcetVal });
    if (ad.jeeMainsPercentile) entranceExamRows.push({ label: "JEE Mains Percentile", value: `${formatNum(ad.jeeMainsPercentile)}%` });
    if (ad.jeeMainsOverallRank) entranceExamRows.push({ label: "JEE Mains Overall Rank", value: ad.jeeMainsOverallRank });
    if (ad.jeeMainsCategoryRank) entranceExamRows.push({ label: "JEE Mains Category Rank", value: ad.jeeMainsCategoryRank });
    if (ad.jeeAdvOverallRank) entranceExamRows.push({ label: "JEE Advanced Overall Rank", value: ad.jeeAdvOverallRank });
    if (ad.jeeAdvCategoryRank) entranceExamRows.push({ label: "JEE Advanced Category Rank", value: ad.jeeAdvCategoryRank });

    if (entranceExamRows.length > 0) {
      doc.y = nextAcademicsY;
      checkPageBreak(doc, 40 + entranceExamRows.length * 18, margin, footerY, "ACADEMIC DETAILS & PROFILE (Contd.)");
      drawSectionHeading(doc, "ENTRANCE EXAM DETAILS", 9, COLOR_HEADING);
      doc.moveDown(0.2);
      
      let examY = doc.y;
      entranceExamRows.forEach(row => {
        doc.rect(margin, examY, contentWidth, 18).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, examY, contentWidth, 18).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
        doc.text(row.label, margin + 10, examY + 5, { lineBreak: false });
        
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
        doc.text(String(row.value), margin + 200, examY + 5, { lineBreak: false });
        examY += 18;
      });
      nextAcademicsY = examY + 15;
    }

    doc.y = nextAcademicsY;

    // Higher Education entries
    if (profile?.education && profile.education.length > 0) {
      checkPageBreak(doc, 40, margin, footerY, "ACADEMIC DETAILS & PROFILE (Contd.)");
      drawSectionHeading(doc, "OTHER EDUCATIONAL DEGREES", 9, COLOR_HEADING);
      doc.moveDown(0.2);
      profile.education.forEach(edu => {
        checkPageBreak(doc, 20, margin, footerY, "ACADEMIC DETAILS & PROFILE (Contd.)");
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_BODY)
           .text(`${edu.degree} in ${edu.branch || 'N/A'}`, { continued: true })
           .font('Helvetica').fillColor(COLOR_MUTED).text(` at ${edu.institution} (${edu.startYear} - ${edu.endYear}) - CGPA/GPA: ${edu.cgpa || 'N/A'}`);
        doc.moveDown(0.15);
      });
    }


    // ==========================================
    // PAGE: MANDATORY ACCOMPLISHMENTS SCORECARD
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "MANDATORY ACCOMPLISHMENTS SCORECARD", margin, contentWidth);
    
    const ma = profile?.mandatoryAccomplishments || student.mandatoryAccomplishments || {};
    const ms = calculateMandatoryScores({ mandatoryAccomplishments: ma }, profile?.overallGpa || student.overallGpa || 0);

    drawSectionHeading(doc, `TOTAL SCHOLARSHIP SCORE: ${ms.total || 0} / 70`, 11, COLOR_HEADING);
    doc.moveDown(0.6);

    const maBlockW = (contentWidth - 10) / 2;
    const maBlockH = 55;
    
    const drawMABlock = (title, score, lines, x, y, accentCol) => {
      doc.rect(x, y, maBlockW, maBlockH).fillColor(COLOR_CARD_BG).fill();
      doc.rect(x, y, maBlockW, maBlockH).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.rect(x, y, maBlockW, 3).fillColor(accentCol).fill();
      
      doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(8.5)
         .text(`${title} (${score || 0}/10)`, x + 8, y + 10);
      
      let curY = y + 25;
      lines.forEach(l => {
        doc.fillColor(COLOR_BODY).font('Helvetica').fontSize(7.5)
           .text(l, x + 8, curY);
        curY += 10;
      });
    };
    
    let curMaY = doc.y;
    // 1. Academic CGPA
    drawMABlock("1. Academic CGPA (Auto-synced)", ms.cgpa, [
      `Overall CGPA: ${profile?.overallGpa || student.overallGpa || 'N/A'}`
    ], margin, curMaY, '#6366f1');

    // 2. Technical Courses
    const courses = ma.technicalCourses || [];
    drawMABlock("2. Technical Courses", ms.technicalCourses, [
      `Courses Listed: ${courses.length}`,
      `Completed: ${courses.filter(c => c.status === 'Completed').length}`
    ], margin + maBlockW + 10, curMaY, '#3b82f6');

    curMaY += maBlockH + 10;

    // 3. Coding Consistency
    drawMABlock("3. Coding Consistency (Auto-synced)", ms.codingConsistency, [
      `Arrays Solved (LeetCode): ${ma.codingConsistency?.arraysSolved || 0}`,
      `Strings Solved (LeetCode): ${ma.codingConsistency?.stringsSolved || 0}`
    ], margin, curMaY, '#f59e0b');
    
    // 4. Technical Projects
    const projs = ma.projects || [];
    drawMABlock("4. Technical Projects", ms.projects, [
      `Projects Added: ${projs.length}`,
      `With GitHub Link: ${projs.filter(p => p.githubLink).length}`,
      `With Live Link: ${projs.filter(p => p.liveLink).length}`
    ], margin + maBlockW + 10, curMaY, '#8b5cf6');

    curMaY += maBlockH + 10;

    // 5. Contest Performance
    drawMABlock("5. Contest Performance (Auto-synced)", ms.contestPerformance, [
      `LeetCode Max Rating: ${formatNum(ma.contestPerformance?.leetcodeRating, '0')}`,
      `CodeChef Max Rating: ${formatNum(ma.contestPerformance?.codechefRating, '0')}`
    ], margin, curMaY, '#ec4899');
    
    // 6. Technical Hackathons
    const hacks = ma.hackathons || [];
    drawMABlock("6. Technical Hackathons", ms.hackathons, [
      `Hackathons Added: ${hacks.length}`
    ], margin + maBlockW + 10, curMaY, '#14b8a6');
    
    curMaY += maBlockH + 10;

    // 7. Personality Dev
    const pers = ma.personalityActivities || [];
    drawMABlock("7. Personality Development Activities", ms.personalityDevelopment, [
      `Activities Added: ${pers.length}`
    ], margin, curMaY, '#eab308');
    
    doc.y = curMaY + maBlockH + 25;

    // Detailed Log
    drawSectionHeading(doc, "MANDATORY ACCOMPLISHMENTS DETAILED LOG", 10, COLOR_HEADING);
    doc.moveDown(0.4);
    
    const drawLogTable = (title, items, rowFn) => {
      if (items.length === 0) return;
      checkPageBreak(doc, 20 + items.length * 15, margin, footerY, "MANDATORY ACCOMPLISHMENTS (Contd.)");
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_THEME).text(title, margin, doc.y);
      doc.moveDown(0.1);
      items.forEach(i => {
        doc.rect(margin, doc.y, contentWidth, 14).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, doc.y, contentWidth, 14).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_BODY);
        rowFn(i, doc.y);
        doc.y += 14;
      });
      doc.moveDown(0.5);
    };

    drawLogTable("Technical Courses", courses, (c, y) => {
      doc.text(c.courseName || 'N/A', margin + 5, y + 3, { width: 190, lineBreak: false });
      doc.text(c.platform || 'N/A', margin + 200, y + 3, { width: 140, lineBreak: false });
      doc.text(c.status || 'N/A', margin + 350, y + 3);
      if (c.certificateLink) {
        doc.fillColor(COLOR_ACCENT).text('Certificate / Drive Link ↗', margin + 410, y + 3, { link: c.certificateLink, underline: true });
        doc.fillColor(COLOR_BODY);
      }
    });

    drawLogTable("Technical Projects", projs, (p, y) => {
      doc.text(p.projectName || 'N/A', margin + 5, y + 3, { width: 190, lineBreak: false });
      if (p.githubLink) {
        doc.fillColor(COLOR_ACCENT).text('GitHub Link ↗', margin + 200, y + 3, { link: p.githubLink, underline: true });
        doc.fillColor(COLOR_BODY); // reset
      } else {
        doc.text('No GitHub Link', margin + 200, y + 3);
      }
      if (p.liveLink) {
        doc.fillColor(COLOR_ACCENT).text('Live Link ↗', margin + 310, y + 3, { link: p.liveLink, underline: true });
        doc.fillColor(COLOR_BODY); // reset
      } else {
        doc.text('No Live Link', margin + 310, y + 3);
      }
    });

    drawLogTable("Technical Hackathons", hacks, (h, y) => {
      doc.text(h.hackathonName || 'N/A', margin + 5, y + 3, { width: 190, lineBreak: false });
      doc.text(`Position: ${h.position || 'Participant'}`, margin + 200, y + 3);
      if (h.certificateLink) {
        doc.fillColor(COLOR_ACCENT).text('Live Link ↗', margin + 350, y + 3, { link: h.certificateLink, underline: true });
        doc.fillColor(COLOR_BODY);
      }
    });

    drawLogTable("Personality Development Activities", pers, (a, y) => {
      doc.text(a.activityName || 'N/A', margin + 5, y + 3);
      if (a.certificateLink) {
        doc.fillColor(COLOR_ACCENT).text('Proof Link ↗', margin + 200, y + 3, { link: a.certificateLink, underline: true });
        doc.fillColor(COLOR_BODY);
      }
    });


    // ==========================================
    // PAGE 4+: PROFESSIONAL DETAILS (Layout configurations)
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "PROFESSIONAL DETAILS", margin, contentWidth);

    // Resolve unified professional info
    let skills = [];
    let projects = [];
    let experience = [];
    let certifications = [];
    let education = [];
    let achievements = [];
    let hackathons = [];
    let customSections = [];

    if (defaultResume) {
      const content = defaultResume.content || {};
      skills = content.skills || [];
      projects = content.projects || [];
      experience = content.workExperience || [];
      certifications = content.certifications || [];
      education = content.education || [];
      achievements = content.achievements || [];
      hackathons = content.hackathons || [];
      customSections = content.customSections || [];
    } else {
      // Fallback order: StudentProfile
      skills = profile?.skills || [];
      projects = (profile?.projects || []).map(p => ({
        name: p.title,
        description: p.description,
        techStack: p.technologies || [],
        githubUrl: p.githubLink,
        liveUrl: p.liveLink,
        highlights: []
      }));
      experience = (profile?.experiences || []).map(e => ({
        company: e.company,
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description
      }));
      certifications = (profile?.certifications || []).map(c => ({
        title: c.title,
        issuer: c.provider,
        date: c.issueDate,
        credentialLink: c.credentialLink
      }));
      education = (profile?.education || []).map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.branch,
        startYear: edu.startYear,
        endYear: edu.endYear,
        gpa: edu.cgpa
      }));
      achievements = (profile?.achievements || []).map(a => ({
        title: a.title,
        description: a.description,
        date: a.date || null
      }));
      hackathons = (profile?.hackathons || []).map(h => ({
        name: h.name,
        organizer: h.organizer || '',
        role: h.role || 'Participant',
        outcome: h.result || h.position || h.outcome || 'Participant',
        description: h.description || '',
        date: h.date || null,
        teamSize: h.teamSize || 1
      }));
    }

    // Merge hackathons from mandatory accomplishments if available
    const maHackathons = profile?.mandatoryAccomplishments?.hackathons || student.mandatoryAccomplishments?.hackathons || [];
    maHackathons.forEach(mh => {
      hackathons.push({
        name: mh.hackathonName,
        organizer: mh.organizer || '',
        role: 'Participant',
        outcome: mh.position || 'Participant',
        description: mh.description || '',
        date: mh.date || null,
        teamSize: mh.teamSize || 1
      });
    });

    // Draw Sections in configuration order
    let layoutOrder = defaultResume?.layout?.sectionsOrder ? [...defaultResume.layout.sectionsOrder] : [
      'skills',
      'education',
      'experience',
      'projects',
      'certifications',
      'achievements',
      'hackathons'
    ];
    
    // Ensure hackathons is present in the layout if it was missed in older default resumes
    if (!layoutOrder.includes('hackathons')) {
      layoutOrder.push('hackathons');
    }
    const hiddenSections = defaultResume?.layout?.hiddenSections || [];

    layoutOrder.forEach(secKey => {
      if (hiddenSections.includes(secKey)) return;

      if (secKey === 'skills') {
        if (skills.length === 0) return;
        checkPageBreak(doc, 35, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "TECHNICAL SKILLS", 9.5, COLOR_HEADING);
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_BODY).text(skills.join('  •  '));
        doc.moveDown(0.8);
      }
      else if (secKey === 'academic' || secKey === 'education') {
        if (education.length === 0) return;
        checkPageBreak(doc, 40, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "EDUCATION & DEGREES", 9.5, COLOR_HEADING);
        doc.moveDown(0.25);
        education.forEach(edu => {
          checkPageBreak(doc, 32, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_BODY)
             .text(`${edu.degree || 'Degree'} - ${edu.fieldOfStudy || 'Field of Study'}`);
          doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
             .text(`${edu.institution || 'Institution'} (${edu.startYear || 'N/A'} - ${edu.endYear || 'Present'}) | GPA: ${edu.gpa || 'N/A'}`);
          doc.moveDown(0.3);
        });
        doc.moveDown(0.5);
      }
      else if (secKey === 'experience' || secKey === 'workExperience') {
        if (experience.length === 0) return;
        checkPageBreak(doc, 40, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "PROFESSIONAL EXPERIENCE", 9.5, COLOR_HEADING);
        doc.moveDown(0.25);
        experience.forEach(exp => {
          const contentHeightEstimate = exp.description ? 45 : 30;
          checkPageBreak(doc, contentHeightEstimate, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
          
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_BODY)
             .text(`${exp.role}  |  ${exp.company}`, { continued: true })
             .font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED)
             .text(`  (${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'})`, { align: 'right' });
          
          if (exp.location) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLOR_MUTED).text(`Location: ${exp.location}`);
          }
          if (exp.description) {
            doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY).text(exp.description, { lineGap: 1.5 });
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(0.5);
      }
      else if (secKey === 'projects') {
        if (projects.length === 0) return;
        checkPageBreak(doc, 40, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "PROJECTS PORTFOLIO", 9.5, COLOR_HEADING);
        doc.moveDown(0.25);
        projects.forEach(proj => {
          const contentHeightEstimate = (proj.description ? 25 : 0) + (proj.highlights?.length ? proj.highlights.length * 12 : 0) + 25;
          checkPageBreak(doc, contentHeightEstimate, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
          
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_BODY).text(proj.name);
          
          // Links
          const links = [];
          if (proj.githubUrl) links.push(`GitHub: ${proj.githubUrl}`);
          if (proj.liveUrl) links.push(`Live: ${proj.liveUrl}`);
          if (links.length > 0) {
            doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_ACCENT).text(links.join('  |  '), { underline: true });
          }
          
          if (proj.techStack && proj.techStack.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_MUTED).text(`Tech Stack: ${proj.techStack.join(', ')}`);
          }
          if (proj.description) {
            doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY).text(proj.description, { lineGap: 1.5 });
          }
          if (proj.highlights && proj.highlights.length > 0) {
            doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
            proj.highlights.forEach(h => {
              if (h) doc.text(`• ${h}`);
            });
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(0.5);
      }
      else if (secKey === 'certifications') {
        if (certifications.length === 0) return;
        checkPageBreak(doc, 40, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "CERTIFICATIONS", 9.5, COLOR_HEADING);
        doc.moveDown(0.25);
        certifications.forEach(cert => {
          checkPageBreak(doc, 22, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_BODY)
             .text(`${cert.title}`, { continued: true })
             .font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
             .text(` - Issued by ${cert.issuer || 'N/A'} (${formatDate(cert.date)})`);
          if (cert.credentialLink) {
            doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_ACCENT).text(`Verify Link: ${cert.credentialLink}`, { underline: true });
          }
          doc.moveDown(0.25);
        });
        doc.moveDown(0.5);
      }
      else if (secKey === 'achievements') {
        if (achievements.length === 0) return;
        checkPageBreak(doc, 40, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "ACHIEVEMENTS & HONOR AWARDS", 9.5, COLOR_HEADING);
        doc.moveDown(0.25);
        achievements.forEach(ach => {
          checkPageBreak(doc, 25, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_BODY)
             .text(`🏆 ${ach.title}`, { continued: true })
             .font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
             .text(ach.date ? ` (${formatDate(ach.date)})` : '');
          if (ach.description) {
            doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY).text(ach.description);
          }
          doc.moveDown(0.25);
        });
        doc.moveDown(0.5);
      }
      else if (secKey === 'hackathons') {
        if (hackathons.length === 0) return;
        checkPageBreak(doc, 40, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, "HACKATHONS", 9.5, COLOR_HEADING);
        doc.moveDown(0.25);
        hackathons.forEach(h => {
          checkPageBreak(doc, 35, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#6366f1').text(h.name);
          
          if (h.organizer) {
            doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED).text(`Organizer: ${h.organizer}`);
          }
          
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_BODY).text('Result: ', { continued: true })
             .font('Helvetica-Bold').fillColor('#10b981').text(h.outcome, { continued: true })
             .font('Helvetica').fillColor(COLOR_BODY).text(` — ${h.role}`);
          
          if (h.description) {
            doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY).text(h.description, { lineGap: 1 });
          }
          
          const dateStr = h.date ? formatDate(h.date) : 'N/A';
          doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED).text(`Date: ${dateStr}    Team Size: ${h.teamSize}`);
          doc.moveDown(0.4);
        });
        doc.moveDown(0.5);
      }
    });

    // Render Custom Builder Sections if they exist and are not empty
    if (customSections && customSections.length > 0) {
      customSections.forEach(cs => {
        if (!cs.title || !cs.content) return;
        checkPageBreak(doc, 45, margin, footerY, "PROFESSIONAL DETAILS (Contd.)");
        drawSectionHeading(doc, cs.title.toUpperCase(), 9.5, COLOR_HEADING);
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY).text(cs.content, { lineGap: 1.5 });
        doc.moveDown(0.8);
      });
    }


    // ==========================================
    // PAGE: CODING PLATFORMS & LEETCODE ANALYTICS
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "CODING PLATFORMS & LEETCODE ANALYTICS", margin, contentWidth);

    drawSectionHeading(doc, "LEETCODE PERFORMANCE CARD", 9.5, COLOR_HEADING);
    doc.moveDown(0.3);

    let lcYCoords = doc.y;
    // Box 1: Solved Problems
    doc.rect(margin, lcYCoords, 250, 90).fillColor(COLOR_CARD_BG).fill();
    doc.rect(margin, lcYCoords, 250, 90).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    
    doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(8).text("SOLVED PROBLEMS SUMMARY", margin + 12, lcYCoords + 10, { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
    doc.text(`Total Solved:`, margin + 12, lcYCoords + 25).font('Helvetica-Bold').text(` ${lc.problemsSolved || 0}`, margin + 95, lcYCoords + 25);
    doc.font('Helvetica').text(`Easy Solved:`, margin + 12, lcYCoords + 39).font('Helvetica-Bold').text(` ${lc.easySolved || 0}`, margin + 95, lcYCoords + 39);
    doc.font('Helvetica').text(`Medium Solved:`, margin + 12, lcYCoords + 53).font('Helvetica-Bold').text(` ${lc.mediumSolved || 0}`, margin + 95, lcYCoords + 53);
    doc.font('Helvetica').text(`Hard Solved:`, margin + 12, lcYCoords + 67).font('Helvetica-Bold').text(` ${lc.hardSolved || 0}`, margin + 95, lcYCoords + 67);

    // Box 2: Contest Details
    const lcX2 = margin + 265;
    doc.rect(lcX2, lcYCoords, 250, 90).fillColor(COLOR_CARD_BG).fill();
    doc.rect(lcX2, lcYCoords, 250, 90).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
    
    doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(8).text("CONTEST & RATING METRICS", lcX2 + 12, lcYCoords + 10, { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
    doc.text(`Contest Rating:`, lcX2 + 12, lcYCoords + 25).font('Helvetica-Bold').text(` ${formatNum(lc.rating)}`, lcX2 + 115, lcYCoords + 25);
    doc.font('Helvetica').text(`Global Ranking:`, lcX2 + 12, lcYCoords + 39).font('Helvetica-Bold').text(` ${lc.ranking || 'N/A'}`, lcX2 + 115, lcYCoords + 39);
    doc.font('Helvetica').text(`Acceptance Rate:`, lcX2 + 12, lcYCoords + 53).font('Helvetica-Bold').text(` ${formatNum(lc.acceptanceRate)}%`, lcX2 + 115, lcYCoords + 53);
    doc.font('Helvetica').text(`Contest Count:`, lcX2 + 12, lcYCoords + 67).font('Helvetica-Bold').text(` ${lc.contestCount || 0}`, lcX2 + 115, lcYCoords + 67);

    doc.y = lcYCoords + 105;

    // LeetCode Contest Logs (Requirement: Show up to 10 attended contests without truncation)
    drawSectionHeading(doc, "LEETCODE CONTEST ATTENDANCE LOG", 9.5, COLOR_HEADING);
    doc.moveDown(0.25);

    const contestLogY = doc.y;
    doc.rect(margin, contestLogY, contentWidth, 18).fillColor('#e2e8f0').rect(margin, contestLogY, contentWidth, 18).fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
    doc.text("Contest Name", margin + 12, contestLogY + 5);
    doc.text("Contest Date / Time", margin + 250, contestLogY + 5);
    doc.text("Official Rating Achieved", margin + 380, contestLogY + 5, { width: 120, align: 'center' });

    const rawLcContests = options.leetcodeContests || lc.contestHistory || [];
    const lcHistory = rawLcContests.map(c => ({
      name: c.contestName || c.name || 'Contest',
      date: c.contestDate ? new Date(c.contestDate).toISOString().split('T')[0] : (c.date || 'N/A'),
      rating: c.rating
    }));
    let contestRowY = contestLogY + 18;

    if (lcHistory.length === 0) {
      doc.rect(margin, contestRowY, contentWidth, 20).fillColor(COLOR_CARD_BG).fill();
      doc.rect(margin, contestRowY, contentWidth, 20).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLOR_MUTED);
      doc.text("No contest history data found for this student.", margin + 15, contestRowY + 6);
      contestRowY += 20;
    } else {
      lcHistory.forEach(c => {
        // Dynamic break checks for tables
        checkPageBreak(doc, 16, margin, footerY, "LEETCODE CONTEST ATTENDANCE LOG (Contd.)");
        
        doc.rect(margin, doc.y, contentWidth, 16).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, doc.y, contentWidth, 16).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
        doc.text(c.name || 'Contest', margin + 12, doc.y + 4);
        doc.text(c.date || 'N/A', margin + 250, doc.y + 4);
        
        doc.font('Helvetica-Bold').fillColor(COLOR_ACCENT);
        doc.text(formatNum(c.rating), margin + 380, doc.y + 4, { width: 120, align: 'center' });
        doc.y += 16;
      });
      contestRowY = doc.y;
    }
    
    doc.y = contestRowY + 15;


    // ==========================================
    // PAGE: CODECHEF & GITHUB ANALYTICS
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "CODECHEF & GITHUB ANALYTICS", margin, contentWidth);

    // CodeChef
    drawSectionHeading(doc, "CODECHEF PERFORMANCE CARD", 9.5, COLOR_HEADING);
    doc.moveDown(0.25);

    const ccYCoords = doc.y;
    doc.rect(margin, ccYCoords, contentWidth, 52).fillColor(COLOR_CARD_BG).fill();
    doc.rect(margin, ccYCoords, contentWidth, 52).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();

    doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
    doc.text(`Current Rating:`, margin + 12, ccYCoords + 12).font('Helvetica-Bold').text(` ${formatNum(cc.currentRating || cc.rating)}`, margin + 90, ccYCoords + 12);
    doc.font('Helvetica').text(`Highest Rating:`, margin + 12, ccYCoords + 28).font('Helvetica-Bold').text(` ${formatNum(cc.highestRating)}`, margin + 90, ccYCoords + 28);
    
    doc.font('Helvetica').text(`Stars Rating:`, margin + 175, ccYCoords + 12).font('Helvetica-Bold').text(` ${cc.stars || '1★'}`, margin + 250, ccYCoords + 12);
    doc.font('Helvetica').text(`Global Rank:`, margin + 175, ccYCoords + 28).font('Helvetica-Bold').text(` ${cc.globalRank || 'N/A'}`, margin + 250, ccYCoords + 28);

    doc.font('Helvetica').text(`Country Rank:`, margin + 335, ccYCoords + 12).font('Helvetica-Bold').text(` ${cc.countryRank || 'N/A'}`, margin + 415, ccYCoords + 12);
    doc.font('Helvetica').text(`Contests Attended:`, margin + 335, ccYCoords + 28).font('Helvetica-Bold').text(` ${cc.contestCount || 0}`, margin + 415, ccYCoords + 28);

    doc.y = ccYCoords + 70;

    // GitHub
    drawSectionHeading(doc, "GITHUB PORTFOLIO & CONTRIBUTION TRACKER", 9.5, COLOR_HEADING);
    doc.moveDown(0.25);

    const ghYCoords = doc.y;
    doc.rect(margin, ghYCoords, contentWidth, 68).fillColor(COLOR_CARD_BG).fill();
    doc.rect(margin, ghYCoords, contentWidth, 68).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();

    const githubContributions = Array.isArray(gh.contributions)
      ? gh.contributions.reduce((sum, d) => sum + (d.contributionCount || 0), 0)
      : 0;

    doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
    doc.text(`Public Repositories:`, margin + 12, ghYCoords + 14).font('Helvetica-Bold').text(` ${gh.reposCount || 0}`, margin + 120, ghYCoords + 14);
    doc.font('Helvetica').text(`Total Stars Received:`, margin + 12, ghYCoords + 32).font('Helvetica-Bold').text(` ${gh.starsCount || 0}`, margin + 120, ghYCoords + 32);
    doc.font('Helvetica').text(`Public GitHub URL:`, margin + 12, ghYCoords + 50).font('Helvetica-Bold').fillColor(COLOR_ACCENT)
       .text(`github.com/${student.githubUsername || ''}`, margin + 120, ghYCoords + 50, { underline: true });

    doc.font('Helvetica').fillColor(COLOR_BODY);
    doc.text(`Account Followers:`, margin + 270, ghYCoords + 14).font('Helvetica-Bold').text(` ${gh.followersCount || 0}`, margin + 380, ghYCoords + 14);
    doc.text(`Account Following:`, margin + 270, ghYCoords + 32).font('Helvetica-Bold').text(` ${gh.followingCount || 0}`, margin + 380, ghYCoords + 32);
    doc.text(`Total Contributions (1Yr):`, margin + 270, ghYCoords + 50).font('Helvetica-Bold').text(` ${githubContributions}`, margin + 380, ghYCoords + 50);

    doc.y = ghYCoords + 85;

    // HackerRank & GFG Summary
    drawSectionHeading(doc, "ADDITIONAL CODING HANDLES", 9.5, COLOR_HEADING);
    doc.moveDown(0.25);

    const otherYCoords = doc.y;
    doc.rect(margin, otherYCoords, contentWidth, 38).fillColor(COLOR_CARD_BG).fill();
    doc.rect(margin, otherYCoords, contentWidth, 38).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();

    doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
    doc.text(`GeeksforGeeks Handle:`, margin + 12, otherYCoords + 12)
       .font('Helvetica-Bold').text(` ${student.gfgUsername || 'Not connected'}`, margin + 120, otherYCoords + 12);
    doc.font('Helvetica').text(`GFG Solved Problems:`, margin + 12, otherYCoords + 24)
       .font('Helvetica-Bold').text(` ${gfg.totalProblemsSolved || gfg.problemsSolved || 0}`, margin + 120, otherYCoords + 24);

    doc.font('Helvetica').fillColor(COLOR_BODY);
    doc.text(`HackerRank Username:`, margin + 270, otherYCoords + 12)
       .font('Helvetica-Bold').text(` ${student.hackerrankUsername || student.hackerrank?.username || 'Not connected'}`, margin + 380, otherYCoords + 12);
    doc.font('Helvetica').text(`HackerRank Solved:`, margin + 270, otherYCoords + 24)
       .font('Helvetica-Bold').text(` ${student.hackerrank?.totalProblemsSolved || 0}`, margin + 380, otherYCoords + 24);

    doc.y = otherYCoords + 50;


    // ==========================================
    // PAGE: PLACEMENT READINESS SCORECARD & SNAPSHOTS
    // ==========================================
    doc.addPage();
    drawPageHeader(doc, "PLACEMENT READINESS & PROGRESS TRACKER", margin, contentWidth);

    // Component-wise placement readiness breakdown (New Page requirement)
    drawSectionHeading(doc, "PLACEMENT READINESS SCORE INDEX BREAKDOWN", 10, COLOR_HEADING);
    doc.moveDown(0.3);

    const scorecardY = doc.y;
    const blockW = (contentWidth - 20) / 3;
    const blockH = 50;

    // Component-wise scores definition
    const dsaScore = rp.dsaScore || 0;
    const resumeScore = rp.resumeScore || 0;
    const githubScore = student.scores?.ghScore || 0;
    const profileScore = profile?.profileCompletion || 0;
    const academicScore = (academic.cgpa || student.overallGpa || 0) * 10;
    const overallScore = rp.overallReadiness || 0;

    const drawScoreCard = (title, score, x, y, accentCol = '#2563eb') => {
      doc.rect(x, y, blockW, blockH).fillColor(COLOR_CARD_BG).fill();
      doc.rect(x, y, blockW, blockH).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.rect(x, y, blockW, 3).fillColor(accentCol).fill();
      
      doc.fillColor(COLOR_MUTED).font('Helvetica-Bold').fontSize(7.5)
         .text(title.toUpperCase(), x + 5, y + 10, { width: blockW - 10, align: 'center', lineBreak: false });
      
      // Make sure all numerical scores display with exactly 2 decimal places
      doc.fillColor(COLOR_HEADING).font('Helvetica-Bold').fontSize(13)
         .text(`${formatNum(score)}%`, x + 5, y + 25, { width: blockW - 10, align: 'center', lineBreak: false });
    };

    drawScoreCard("DSA Score", dsaScore, margin, scorecardY, '#f59e0b');
    drawScoreCard("Resume Score", resumeScore, margin + blockW + 10, scorecardY, '#10b981');
    drawScoreCard("GitHub Score", githubScore, margin + (blockW + 10) * 2, scorecardY, '#8b5cf6');

    drawScoreCard("Profile Completion", profileScore, margin, scorecardY + blockH + 10, '#3b82f6');
    drawScoreCard("Academic Score", academicScore, margin + blockW + 10, scorecardY + blockH + 10, '#06b6d4');
    drawScoreCard("Overall Placement Score", overallScore, margin + (blockW + 10) * 2, scorecardY + blockH + 10, '#f43f5e');

    doc.y = scorecardY + blockH * 2 + 35;

    // Snapshot Weekly Tracking Log
    drawSectionHeading(doc, "HISTORICAL GROWTH SNAPSHOT LOGS (RECENT WEEKS)", 10, COLOR_HEADING);
    doc.moveDown(0.25);

    const logTableY = doc.y;
    doc.rect(margin, logTableY, contentWidth, 18).fillColor('#e2e8f0').rect(margin, logTableY, contentWidth, 18).fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_HEADING);
    doc.text("Snapshot Week", margin + 12, logTableY + 5);
    doc.text("Snapshot Capture Date", margin + 120, logTableY + 5);
    doc.text("LeetCode Rating", margin + 230, logTableY + 5, { width: 90, align: 'center' });
    doc.text("CodeChef Rating", margin + 330, logTableY + 5, { width: 90, align: 'center' });
    doc.text("CodeChef Stars", margin + 430, logTableY + 5, { width: 70, align: 'center' });

    // Show last 6 weekly snapshots
    const lastSixWeeks = weeklySnapshots.slice(-6);
    let tableRowY = logTableY + 18;
    
    if (lastSixWeeks.length === 0) {
      doc.rect(margin, tableRowY, contentWidth, 20).fillColor(COLOR_CARD_BG).fill();
      doc.rect(margin, tableRowY, contentWidth, 20).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLOR_MUTED);
      doc.text("No historical snapshot logs captured in database yet.", margin + 15, tableRowY + 6);
      tableRowY += 20;
    } else {
      lastSixWeeks.forEach(snap => {
        checkPageBreak(doc, 16, margin, footerY, "HISTORICAL GROWTH SNAPSHOT LOGS (Contd.)");
        
        doc.rect(margin, doc.y, contentWidth, 16).fillColor(COLOR_CARD_BG).fill();
        doc.rect(margin, doc.y, contentWidth, 16).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
        doc.font('Helvetica').fontSize(8).fillColor(COLOR_BODY);
        
        doc.text(snap.weekKey || 'N/A', margin + 12, doc.y + 4);
        doc.text(snap.snapshotDate ? new Date(snap.snapshotDate).toLocaleDateString() : 'N/A', margin + 120, doc.y + 4);
        
        doc.font('Helvetica-Bold');
        doc.text(formatNum(snap.leetcode?.rating), margin + 230, doc.y + 4, { width: 90, align: 'center' });
        doc.text(formatNum(snap.codechef?.rating || snap.codechef?.currentRating), margin + 330, doc.y + 4, { width: 90, align: 'center' });
        
        doc.font('Helvetica');
        doc.text(snap.codechef?.stars || '1★', margin + 430, doc.y + 4, { width: 70, align: 'center' });
        
        doc.y += 16;
      });
      tableRowY = doc.y;
    }
    
    doc.y = tableRowY;


    // ==========================================
    // POST-PROCESSING: PAGE NUMBERS IN FOOTER
    // ==========================================
    // Loop through all buffered pages and add the footer page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Draw footer line and text
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(COLOR_LINE).lineWidth(0.5).stroke();
      doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(7.5);
      
      // Page 1 footer has slightly different text
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
