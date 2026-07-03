require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const config = require('./src/config/env');
const StudentMentoringRecord = require('./src/models/StudentMentoringRecord');
const { calculateMentoringStats } = require('./src/services/mentorNotesService');

mongoose.connect(config.mongoUri).then(async () => {
  const records = await StudentMentoringRecord.find({});
  if (records.length > 0) {
    const record = records[0];
    record.actionItems = [{ task: "Test Task", completed: false }];
    await record.save();
    console.log("Added action item to record", record._id);
    
    const stats = await calculateMentoringStats(record.studentId);
    console.log("Stats after save:", stats);
  }
  process.exit(0);
});
