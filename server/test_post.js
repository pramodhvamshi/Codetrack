require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const config = require('./src/config/env');
const StudentMentoringRecord = require('./src/models/StudentMentoringRecord');

mongoose.connect(config.mongoUri).then(async () => {
  const reqBody = {
    meetingType: 'General Mentoring',
    meetingNumber: 99,
    observation: 'Testing action items',
    actionItems: [
      { task: "Do homework", completed: false }
    ]
  };

  const newRecord = new StudentMentoringRecord({
    ...reqBody,
    studentId: new mongoose.Types.ObjectId(), // Dummy ID
    createdBy: new mongoose.Types.ObjectId(), // Dummy ID
    createdByRole: 'coordinator'
  });

  await newRecord.save();
  console.log("Saved actionItems length:", newRecord.actionItems.length);
  process.exit(0);
});
