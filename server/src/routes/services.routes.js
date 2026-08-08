const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const LeaveRequest = require('../models/Service/LeaveRequest');
const MentoringRequest = require('../models/Service/MentoringRequest');
const LaptopInventory = require('../models/Service/LaptopInventory');
const LaptopRequest = require('../models/Service/LaptopRequest');
const User = require('../models/User');

// ==========================================
// 1. LEAVE REQUESTS ENDPOINTS
// ==========================================

// POST /api/services/leave - Student submits leave request
router.post('/leave', auth, async (req, res) => {
  try {
    const { reasonType, duration, startDate, endDate, driveDocUrl, statement } = req.body;
    if (!startDate || !endDate || !statement) {
      return res.status(400).json({ error: 'startDate, endDate, and statement are required.' });
    }

    const leave = new LeaveRequest({
      studentId: req.user.id,
      reasonType: reasonType || 'General',
      duration: duration || '1 Day',
      startDate,
      endDate,
      driveDocUrl: driveDocUrl || 'https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing',
      statement,
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (err) {
    console.error('Submit leave error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/leave/student - Student views their leave requests
router.get('/leave/student', auth, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ studentId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch student leave error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/leave/coordinator - Coordinator views all student leave requests
router.get('/leave/coordinator', auth, async (req, res) => {
  try {
    const requests = await LeaveRequest.find()
      .populate('studentId', 'name email mssId college hostel')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch coordinator leave error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/leave/student-profile/:studentId - Coordinator views leave history for specific student
router.get('/leave/student-profile/:studentId', auth, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch student leave history error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/services/leave/:id/status - Coordinator updates leave status
router.patch('/leave/:id/status', auth, async (req, res) => {
  try {
    const { status, coordinatorRemarks } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        coordinatorRemarks: coordinatorRemarks || '',
        reviewedBy: req.user.id,
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!leave) return res.status(404).json({ error: 'Leave request not found.' });
    res.json(leave);
  } catch (err) {
    console.error('Update leave status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. MENTORING REQUESTS & CALENDAR ENDPOINTS
// ==========================================

// GET /api/services/mentoring/slots - Get time slots for a date
router.get('/mentoring/slots', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const defaultSlots = [
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
    ];

    if (!date) return res.json({ defaultSlots, bookedSlots: [] });

    const booked = await MentoringRequest.find({ date, status: { $ne: 'Cancelled' } }).select('timeSlot');
    const bookedSlots = booked.map(b => b.timeSlot);

    res.json({
      defaultSlots,
      bookedSlots,
    });
  } catch (err) {
    console.error('Fetch slots error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/mentoring/book - Student books mentoring slot
router.post('/mentoring/book', auth, async (req, res) => {
  try {
    const { category, date, timeSlot, notesText, mentorName } = req.body;
    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'date and timeSlot are required.' });
    }

    const mentoring = new MentoringRequest({
      studentId: req.user.id,
      category: category || 'Placement Prep',
      date,
      timeSlot,
      notesText: notesText || '',
      mentorName: mentorName || 'Placement Coordinator',
    });

    await mentoring.save();
    res.status(201).json(mentoring);
  } catch (err) {
    console.error('Book mentoring error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/mentoring/student - Fetch student's booked mentoring sessions
router.get('/mentoring/student', auth, async (req, res) => {
  try {
    const sessions = await MentoringRequest.find({ studentId: req.user.id })
      .sort({ date: -1, createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error('Fetch student mentoring error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/mentoring/coordinator - Fetch all mentoring requests for calendar
router.get('/mentoring/coordinator', auth, async (req, res) => {
  try {
    const sessions = await MentoringRequest.find()
      .populate('studentId', 'name email mssId college hostel profileImage')
      .sort({ date: -1, createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error('Fetch coordinator mentoring error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/services/mentoring/:id/approve-modify - Coordinator approves or modifies time slot
router.patch('/mentoring/:id/approve-modify', auth, async (req, res) => {
  try {
    const { status, date, timeSlot, meetingUrl } = req.body;
    const updateData = { coordinatorId: req.user.id };
    if (status) updateData.status = status;
    if (date) updateData.date = date;
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl;

    const session = await MentoringRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('studentId', 'name email');

    if (!session) return res.status(404).json({ error: 'Mentoring session not found.' });
    res.json(session);
  } catch (err) {
    console.error('Approve/modify mentoring error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/services/mentoring/:id/meeting-notes - Coordinator adds meeting notes & doc links
router.patch('/mentoring/:id/meeting-notes', auth, async (req, res) => {
  try {
    const { meetingNotes, meetingUrl, docLinks } = req.body;
    const updateData = {};
    if (meetingNotes !== undefined) updateData.meetingNotes = meetingNotes;
    if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl;
    if (docLinks) updateData.docLinks = docLinks;

    const session = await MentoringRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('studentId', 'name email');

    if (!session) return res.status(404).json({ error: 'Mentoring session not found.' });
    res.json(session);
  } catch (err) {
    console.error('Save meeting notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/mentoring/student-profile/:studentId/notes - Fetch meeting notes for Student Detail Profile tab
router.get('/mentoring/student-profile/:studentId/notes', auth, async (req, res) => {
  try {
    const notes = await MentoringRequest.find({ studentId: req.params.studentId })
      .populate('coordinatorId', 'name email')
      .sort({ date: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Fetch student meeting notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. LAPTOP MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/services/laptops/inventory - Fetch full laptop audit inventory table
router.get('/laptops/inventory', auth, async (req, res) => {
  try {
    const inventory = await LaptopInventory.find().sort({ sNo: 1 });
    res.json(inventory);
  } catch (err) {
    console.error('Fetch laptop inventory error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/services/laptops/inventory/:id - Coordinator updates status & remarks
router.patch('/laptops/inventory/:id', auth, async (req, res) => {
  try {
    const { status, remarks, studentName, mssId } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (studentName !== undefined) updateData.studentName = studentName;
    if (mssId !== undefined) updateData.mssId = mssId;

    const item = await LaptopInventory.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!item) return res.status(404).json({ error: 'Laptop record not found.' });
    res.json(item);
  } catch (err) {
    console.error('Update laptop inventory error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/laptops/report-issue - Student submits issue report
router.post('/laptops/report-issue', auth, async (req, res) => {
  try {
    const { laptopNumber, issueCategory, driveDocUrl, description, taggedCoordinatorId } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required.' });

    const laptopReq = new LaptopRequest({
      studentId: req.user.id,
      laptopNumber: laptopNumber || '',
      issueCategory: issueCategory || 'Hardware Issue',
      driveDocUrl: driveDocUrl || 'https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing',
      description,
      taggedCoordinatorId: taggedCoordinatorId || null,
    });

    await laptopReq.save();
    res.status(201).json(laptopReq);
  } catch (err) {
    console.error('Report laptop issue error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/laptops/requests - Fetch laptop issue requests
router.get('/laptops/requests', auth, async (req, res) => {
  try {
    const requests = await LaptopRequest.find()
      .populate('studentId', 'name email mssId college hostel')
      .populate('taggedCoordinatorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch laptop requests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/services/laptops/request/:id/status - Coordinator updates request status & remarks
router.patch('/laptops/request/:id/status', auth, async (req, res) => {
  try {
    const { status, coordinatorRemarks } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (coordinatorRemarks !== undefined) updateData.coordinatorRemarks = coordinatorRemarks;

    const request = await LaptopRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('studentId', 'name email mssId college hostel');
    if (!request) return res.status(404).json({ error: 'Laptop issue request not found.' });
    res.json(request);
  } catch (err) {
    console.error('Update laptop request status error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
