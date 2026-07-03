require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const config = require('./src/config/env');
const StudentMentoringRecord = require('./src/models/StudentMentoringRecord');

mongoose.connect(config.mongoUri).then(async () => {
  const records = await StudentMentoringRecord.find({});
  console.log("Total records:", records.length);
  for (const r of records) {
    console.log("Record ID:", r._id, "actionItems length:", r.actionItems ? r.actionItems.length : 0);
    if (r.actionItems && r.actionItems.length > 0) {
      console.log("Items:", r.actionItems);
    }
  }
  process.exit(0);
});
