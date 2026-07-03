const StudentMentoringRecord = require('../models/StudentMentoringRecord');

/**
 * Calculates global statistics for a student's mentoring history.
 * Used consistently across API responses and PDF generation.
 */
async function calculateMentoringStats(studentId) {
  const records = await StudentMentoringRecord.find({ 
    studentId, 
    isDeleted: false 
  });

  const totalMeetings = records.length;
  let openTasks = 0;
  let completedTasks = 0;
  let lastMeeting = null;

  records.forEach(record => {
    // Resolve meeting date (prefer explicit meetingDate, fallback to createdAt)
    const recordDate = record.meetingDate || record.createdAt;
    
    if (!lastMeeting || new Date(recordDate) > new Date(lastMeeting)) {
      lastMeeting = recordDate;
    }

    if (record.actionItems && Array.isArray(record.actionItems)) {
      record.actionItems.forEach(task => {
        if (task.completed) completedTasks++;
        else openTasks++;
      });
    }
  });

  return {
    totalMeetings,
    openTasks,
    completedTasks,
    lastMeeting
  };
}

module.exports = {
  calculateMentoringStats
};
