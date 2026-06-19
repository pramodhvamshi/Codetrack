const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'c:/Users/Medha Trust/Downloads/codetrack/server/.env.local' });

const User = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/User');
const StudentProfile = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/StudentProfile');
const CodingProfile = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/CodingProfile');
const AcademicProfile = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/AcademicProfile');
const WeeklySnapshot = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/WeeklySnapshot');
const ContestSnapshot = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/ContestSnapshot');
const LeetCodeGrowthSnapshot = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/models/LeetCodeGrowthSnapshot');
const { buildStudentReportPdf } = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/utils/pdfReport');
const config = require('c:/Users/Medha Trust/Downloads/codetrack/server/src/config/env');

async function test() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to DB.');

  // Find a student
  const student = await User.findOne({ role: 'student' });
  if (!student) {
    console.error('No student found!');
    await mongoose.disconnect();
    return;
  }
  console.log(`Testing PDF generation for: ${student.name} (${student._id})`);

  const profile = await StudentProfile.findOne({ userId: student._id });
  const codingProfile = await CodingProfile.findOne({ userId: student._id });
  const academic = await AcademicProfile.findOne({ userId: student._id });
  const weeklySnapshots = await WeeklySnapshot.find({ userId: student._id }).sort({ weekKey: 1 });
  const contestSnapshots = await ContestSnapshot.find({ userId: student._id }).sort({ monthKey: 1 });
  const leetcodeGrowthSnapshots = await LeetCodeGrowthSnapshot.find({ userId: student._id }).sort({ weekKey: 1 });

  console.log('Generating PDF report...');
  const buffer = await buildStudentReportPdf(student, profile, codingProfile, {
    academic,
    weeklySnapshots,
    contestSnapshots,
    leetcodeGrowthSnapshots
  });

  const destPath = path.join('C:/Users/Medha Trust/.gemini/antigravity-ide/brain/752ba533-9e2c-4b83-a44c-f7be4d4902af', 'student_report_test.pdf');
  fs.writeFileSync(destPath, buffer);
  console.log(`PDF report generated and written successfully to: ${destPath}`);
  console.log(`Buffer size: ${buffer.length} bytes`);

  await mongoose.disconnect();
}

test().catch(console.error);
