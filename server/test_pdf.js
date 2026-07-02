const mongoose = require('mongoose');
const User = require('./src/models/User');
const StudentProfile = require('./src/models/StudentProfile');
const { buildStudentReportPdf } = require('./src/utils/pdfReport');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrack');
  
  // Find a user with a domain
  const profileWithDomain = await StudentProfile.findOne({ interestedDomain: { $ne: null } });
  if (profileWithDomain) {
    const user1 = await User.findById(profileWithDomain.userId);
    const pdf1 = await buildStudentReportPdf(user1, profileWithDomain, null, {});
    fs.writeFileSync('test1.pdf', pdf1);
    console.log('Saved test1.pdf with domain:', profileWithDomain.interestedDomain);
  }

  // Find a user without a domain
  const profileWithoutDomain = await StudentProfile.findOne({ interestedDomain: null, goal: 'Placement & Paid Internship Track' });
  if (profileWithoutDomain) {
    const user2 = await User.findById(profileWithoutDomain.userId);
    const pdf2 = await buildStudentReportPdf(user2, profileWithoutDomain, null, {});
    fs.writeFileSync('test2.pdf', pdf2);
    console.log('Saved test2.pdf without domain');
  }

  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
