const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { authMiddleware } = require('../middleware/auth');
const { searchAlumni, getFilterSuggestions, getPublicProfile } = require('../services/alumniService');
const User = require('../models/User');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Enforce authentication on all alumni directory & profile routes
router.use(authMiddleware);

/**
 * GET /api/v2/alumni
 * Search & filter alumni directory
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, batch, branch, company, location, query } = req.query;
    const result = await searchAlumni({ page, limit, batch, branch, company, location, query });

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error searching alumni:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch alumni directory' });
  }
});

/**
 * GET /api/v2/alumni/suggestions
 * Fetch distinct filter values (companies, batches, branches)
 */
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await getFilterSuggestions();
    return res.json({
      success: true,
      data: suggestions
    });
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
  }
});

/**
 * GET /api/v2/alumni/students
 * Search & filter student directory (College, Year, Hostel, Branch, Query)
 */
router.get('/students', async (req, res) => {
  try {
    const { college, year, currentYear, hostel, branch, query } = req.query;
    const filter = { role: 'student' };

    if (college) filter.college = { $regex: college, $options: 'i' };
    if (branch) filter.branch = { $regex: branch, $options: 'i' };
    if (hostel) filter.hostel = { $regex: hostel, $options: 'i' };
    if (year) filter.year = year;
    if (currentYear) filter.currentYear = currentYear;
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { mssid: { $regex: query, $options: 'i' } }
      ];
    }

    const students = await User.find(filter)
      .select('name email phoneNumber college hostel branch year currentYear overallGpa scores platformStats resume')
      .sort({ name: 1 })
      .lean();

    return res.json({ success: true, data: students });
  } catch (err) {
    console.error('Error searching students:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch student directory' });
  }
});

/**
 * GET /api/v2/alumni/student-filters
 * Fetch distinct filter values for student directory (hostels, branches, colleges, years)
 */
router.get('/student-filters', async (req, res) => {
  try {
    const hostels = await User.distinct('hostel', { role: 'student', hostel: { $ne: null, $ne: '' } });
    const branches = await User.distinct('branch', { role: 'student', branch: { $ne: null, $ne: '' } });
    const colleges = await User.distinct('college', { role: 'student', college: { $ne: null, $ne: '' } });
    const years = await User.distinct('currentYear', { role: 'student', currentYear: { $ne: null, $ne: '' } });

    return res.json({
      success: true,
      data: {
        hostels: hostels.sort(),
        branches: branches.sort(),
        colleges: colleges.sort(),
        years: ['1st Year', '2nd Year', '3rd Year', '4th Year', ...years.filter(y => !['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(y))].filter(Boolean)
      }
    });
  } catch (err) {
    console.error('Error fetching student filters:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch student filters' });
  }
});

/**
 * GET /api/v2/alumni/coordinators
 * List all registered campus coordinators
 */
router.get('/coordinators', async (req, res) => {
  try {
    const coordinators = await User.find({ role: 'coordinator' })
      .select('name email phoneNumber college branch role bio')
      .sort({ name: 1 })
      .lean();

    return res.json({ success: true, data: coordinators });
  } catch (err) {
    console.error('Error fetching coordinators:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch coordinator directory' });
  }
});

/**
 * POST /api/v2/alumni/add
 * Manually add new Alumni record (Admin or Coordinator)
 */
router.post('/add', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin or Coordinator access required.' });
    }

    const { name, email, password, branch, batch, currentCompany, currentCompanyRole, location, linkedin, github } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'alumni123', 10);

    const alumnus = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'alumni',
      college: 'CBIT',
      branch: branch || 'CSE',
      batch: batch || '2022',
      currentCompany: currentCompany || '',
      currentCompanyRole: currentCompanyRole || 'Software Engineer',
      location: location || '',
      socialLinks: {
        linkedin: linkedin || '',
        github: github || ''
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Alumnus added successfully',
      data: alumnus
    });
  } catch (err) {
    console.error('Error adding alumnus:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to add alumnus' });
  }
});

/**
 * POST /api/v2/alumni/import
 * Bulk Import Alumni from Excel (.xlsx) / CSV spreadsheet (Admin or Coordinator)
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin or Coordinator access required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Excel or CSV file is required' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ success: false, message: 'No valid worksheet found in uploaded file' });
    }

    const rows = [];
    const headers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.text ? cell.text.trim().toLowerCase() : '';
        });
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.text ? cell.text.trim() : '';
          }
        });
        if (Object.keys(rowData).length > 0) {
          rows.push(rowData);
        }
      }
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Spreadsheet is empty or headers are missing' });
    }

    const defaultPasswordHash = await bcrypt.hash('alumni123', 10);
    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rows) {
      const name = r.name || r['full name'] || r['alumni name'] || r.student || '';
      const email = (r.email || r['email address'] || r.mail || '').toLowerCase();
      const college = r.college || r.institution || r.university || 'CBIT';
      const branch = r.branch || r.department || r.stream || 'CSE';
      const batch = r.batch || r['graduation year'] || r.year || '2022';
      const company = r.company || r['current company'] || r.organization || '';
      const role = r.role || r['current role'] || r.designation || 'Software Engineer';
      const linkedin = r.linkedin || r['linkedin url'] || r.social || '';

      if (!email || !name) continue;

      let user = await User.findOne({ email });
      if (user) {
        user.role = 'alumni';
        user.name = name;
        user.college = college;
        user.branch = branch;
        user.batch = batch;
        user.currentCompany = company;
        user.currentCompanyRole = role;
        if (linkedin) user.linkedinUrl = linkedin;
        await user.save();
        updatedCount++;
      } else {
        await User.create({
          name,
          email,
          passwordHash: defaultPasswordHash,
          role: 'alumni',
          college,
          branch,
          batch,
          currentCompany: company,
          currentCompanyRole: role,
          linkedinUrl: linkedin
        });
        createdCount++;
      }
    }

    return res.json({
      success: true,
      message: `Import completed successfully: ${createdCount} alumni created, ${updatedCount} updated.`,
      createdCount,
      updatedCount,
      totalProcessed: rows.length
    });
  } catch (err) {
    console.error('Error importing alumni spreadsheet:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to import alumni spreadsheet' });
  }
});

/**
 * GET /api/v2/alumni/:id
 * Get public profile of a user (student or alumnus)
 */
router.get('/:id', async (req, res) => {
  try {
    const profile = await getPublicProfile(req.params.id);
    return res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    console.error('Error fetching public profile:', err.message);
    return res.status(404).json({ success: false, message: err.message || 'Profile not found' });
  }
});

module.exports = router;
