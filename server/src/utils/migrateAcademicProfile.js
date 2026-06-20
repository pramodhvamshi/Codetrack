const User = require('../models/User');
const AcademicProfile = require('../models/AcademicProfile');

async function migrateAcademicProfile() {
  try {
    // eslint-disable-next-line no-console
    console.log('Running Academic Profile backfill migration...');
    const students = await User.find({ role: 'student' });
    let createdCount = 0;
    
    for (const student of students) {
      const existing = await AcademicProfile.findOne({ userId: student._id });
      if (!existing) {
        const cgpa = student.overallGpa != null ? student.overallGpa : null;
        let academicStatus = '-';
        if (cgpa !== null) {
          if (cgpa >= 9.0) academicStatus = 'Excellent';
          else if (cgpa >= 8.0) academicStatus = 'Good';
          else if (cgpa >= 7.0) academicStatus = 'Average';
          else academicStatus = 'Needs Improvement';
        }
        
        await AcademicProfile.create({
          userId: student._id,
          sgpa1: null,
          sgpa2: null,
          sgpa3: null,
          sgpa4: null,
          sgpa5: null,
          sgpa6: null,
          cgpa,
          backlogs: 0,
          academicStatus
        });
        createdCount++;
      }
    }
    
    // eslint-disable-next-line no-console
    console.log(`Academic Profile migration done. Created ${createdCount} missing profiles.`);
  } catch (err) {
    console.error('Academic Profile migration error:', err);
  }
}

module.exports = migrateAcademicProfile;
