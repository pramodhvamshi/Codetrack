require('dotenv').config({ path: '../.env.local' });
const mongoose = require('mongoose');
const Student = require('./models/User');
const Profile = require('./models/StudentProfile');
const { buildStudentReportPdf } = require('./utils/pdfReport');

async function testPdf() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const studentId = '6a2fe8c239ac981d88fd9b9b';
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('Student not found');
      process.exit(1);
    }
    const profile = await Profile.findOne({ userId: studentId });
    
    const CodingProfile = require('./models/CodingProfile');
    const AcademicProfile = require('./models/AcademicProfile');
    const ResumeVersion = require('./models/ResumeVersion');
    
    const codingProfile = await CodingProfile.findOne({ userId: studentId });
    const academic = await AcademicProfile.findOne({ userId: studentId });
    const defaultResume = await ResumeVersion.findOne({ userId: studentId, isDefault: true });

    const WeeklySnapshot = require('./models/WeeklySnapshot');
    const ContestSnapshot = require('./models/ContestSnapshot');
    const LeetCodeGrowthSnapshot = require('./models/LeetCodeGrowthSnapshot');
    const LeetCodeContestSnapshot = require('./models/LeetCodeContestSnapshot');

    const leetcodeContests = await LeetCodeContestSnapshot.find({ userId: student._id }).sort({ contestDate: 1 }).lean();
    const weeklySnapshots = await WeeklySnapshot.find({ userId: student._id }).sort({ weekKey: 1 }).lean();
    const contestSnapshots = await ContestSnapshot.find({ userId: student._id }).sort({ monthKey: 1 }).lean();
    const leetcodeGrowthSnapshots = await LeetCodeGrowthSnapshot.find({ userId: student._id }).sort({ weekKey: 1 }).lean();

    console.log('Building PDF...');
    await buildStudentReportPdf(student, profile, codingProfile, {
      academic,
      defaultResume,
      weeklySnapshots,
      contestSnapshots,
      leetcodeGrowthSnapshots,
      leetcodeContests
    });
    console.log('PDF built successfully');
  } catch (err) {
    console.error('ERROR BUILDING PDF:', err);
  } finally {
    mongoose.disconnect();
  }
}

testPdf();
