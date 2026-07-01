const mongoose = require('mongoose');
const { syncPlatformsForUser } = require('./src/services/platformSyncService');
const { buildStudentReportPdf } = require('./src/utils/pdfReport');
const User = require('./src/models/User');
const StudentProfile = require('./src/models/StudentProfile');
const CodingProfile = require('./src/models/CodingProfile');
const fs = require('fs');

require('dotenv').config();

async function testPdf() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Get first user with leetcode username
  const user = await User.findOne({ leetcodeUsername: { $ne: null } });
  if (!user) {
    console.log("No user found.");
    process.exit(1);
  }

  console.log("Syncing platforms for user:", user.email);
  const updatedUser = await syncPlatformsForUser(user, { force: true });
  console.log("Sync complete.");

  const studentProfile = await StudentProfile.findOne({ userId: user._id });
  const codingProfile = await CodingProfile.findOne({ userId: user._id });

  const pdfBuffer = await buildStudentReportPdf(updatedUser, studentProfile, codingProfile);

  fs.writeFileSync('test_report.pdf', pdfBuffer);
  console.log("PDF saved to test_report.pdf");

  process.exit(0);
}

testPdf().catch(e => {
  console.error(e);
  process.exit(1);
});
