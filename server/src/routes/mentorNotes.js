const express = require('express');
const { authMiddleware, requireAnyRole } = require('../middleware/auth');
const StudentMentoringRecord = require('../models/StudentMentoringRecord');
const { calculateMentoringStats } = require('../services/mentorNotesService');

const router = express.Router();

router.use(authMiddleware, requireAnyRole(['coordinator', 'admin']));

// Get next meeting number
async function getNextMeetingNumber(studentId) {
  const lastRecord = await StudentMentoringRecord.findOne({ studentId })
    .sort({ meetingNumber: -1 })
    .limit(1);
  return lastRecord ? lastRecord.meetingNumber + 1 : 1;
}

// Get mentoring notes for a student
router.get('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      page = 1,
      limit = 20,
      meetingType,
      status,
      priority,
      startDate,
      endDate
    } = req.query;

    const filter = { studentId, isDeleted: false };

    if (meetingType) filter.meetingType = meetingType;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const records = await StudentMentoringRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email role avatar')
      .populate('versions.updatedBy', 'name');

    const total = await StudentMentoringRecord.countDocuments(filter);
    
    // Fetch global stats specifically for this student
    const stats = await calculateMentoringStats(studentId);

    res.json({
      records,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      stats
    });
  } catch (err) {
    console.error('Error fetching mentoring records:', err);
    res.status(500).json({ message: 'Failed to fetch mentoring records' });
  }
});

// Create a new mentoring note
router.post('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const nextMeetingNumber = await getNextMeetingNumber(studentId);

    const newRecord = new StudentMentoringRecord({
      ...req.body,
      studentId,
      createdBy: userId,
      createdByRole: userRole,
      meetingNumber: nextMeetingNumber
    });

    await newRecord.save();
    
    const populatedRecord = await StudentMentoringRecord.findById(newRecord._id).populate('createdBy', 'name email role avatar');

    res.status(201).json(populatedRecord);
  } catch (err) {
    console.error('Error creating mentoring record:', err);
    res.status(500).json({ message: 'Failed to create mentoring record' });
  }
});

// Update a mentoring note
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const record = await StudentMentoringRecord.findById(noteId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (String(record.createdBy) !== String(userId) && userRole !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to edit this note' });
    }

    // Save current state to versions
    const currentState = record.toObject();
    delete currentState.versions;
    
    record.versions.push({
      updatedBy: userId,
      updatedAt: new Date(),
      changes: currentState
    });

    // Update fields
    const fieldsToUpdate = [
      'meetingType', 'meetingMode', 'meetingDate', 'meetingDuration', 'priority', 'status',
      'outcome', 'tags', 'observation', 'overallRecommendation', 'studentProgress',
      'actionItems', 'targetDate', 'nextReviewDate', 'remarks', 'visibility'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    record.markModified('actionItems');
    record.markModified('studentProgress');

    await record.save();
    
    const populatedRecord = await StudentMentoringRecord.findById(record._id).populate('createdBy', 'name email role avatar');

    res.json(populatedRecord);
  } catch (err) {
    console.error('Error updating mentoring record:', err);
    res.status(500).json({ message: 'Failed to update mentoring record' });
  }
});

// Soft delete a mentoring note
router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const record = await StudentMentoringRecord.findById(noteId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (String(record.createdBy) !== String(userId) && userRole !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this note' });
    }

    record.isDeleted = true;
    record.deletedBy = userId;
    record.deletedAt = new Date();

    await record.save();

    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting mentoring record:', err);
    res.status(500).json({ message: 'Failed to delete mentoring record' });
  }
});

module.exports = router;
