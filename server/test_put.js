require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const config = require('./src/config/env');
const StudentMentoringRecord = require('./src/models/StudentMentoringRecord');

mongoose.connect(config.mongoUri).then(async () => {
  try {
    // 1. Create record
    const newRecord = new StudentMentoringRecord({
      studentId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      createdByRole: 'coordinator',
      meetingNumber: 1,
      meetingType: 'Test',
      observation: 'Test observation',
      actionItems: []
    });
    await newRecord.save();
    console.log("Created record with 0 action items.");

    // 2. Fetch and Update via assignment (Simulating PUT)
    const record = await StudentMentoringRecord.findById(newRecord._id);
    record.actionItems = [{ task: "Test Task 1", completed: false }];
    record.markModified('actionItems');
    await record.save();
    
    // 3. Verify
    const updated = await StudentMentoringRecord.findById(newRecord._id);
    console.log("Updated record action items length:", updated.actionItems.length);
    console.log("Task:", updated.actionItems[0].task, "Completed:", updated.actionItems[0].completed);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
