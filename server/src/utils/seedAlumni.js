const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');

const sampleAlumni = [
  {
    name: 'Ananya Sharma',
    email: 'ananya.sharma@alumni.cbit.ac.in',
    college: 'CBIT Hyderabad',
    branch: 'CSE',
    batch: '2021',
    currentCompany: 'Google',
    currentCompanyRole: 'Software Engineer II',
    location: 'Bengaluru, India',
    linkedinUrl: 'https://linkedin.com/in/ananyasharma',
    githubUsername: 'ananyasharma'
  },
  {
    name: 'Karthik Varma',
    email: 'karthik.varma@alumni.jntu.ac.in',
    college: 'JNTU College of Engineering',
    branch: 'ECE',
    batch: '2020',
    currentCompany: 'Microsoft',
    currentCompanyRole: 'Senior SDE',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/in/karthikvarma',
    githubUsername: 'karthikv'
  },
  {
    name: 'Sainath Reddy',
    email: 'sainath.reddy@alumni.vasavi.ac.in',
    college: 'Vasavi College of Engineering',
    branch: 'IT',
    batch: '2022',
    currentCompany: 'Amazon',
    currentCompanyRole: 'Software Development Engineer',
    location: 'Bengaluru, India',
    linkedinUrl: 'https://linkedin.com/in/sainathreddy',
    githubUsername: 'sainathr'
  },
  {
    name: 'Pooja Hegde',
    email: 'pooja.hegde@alumni.vnr.ac.in',
    college: 'VNR VJIET',
    branch: 'CSE',
    batch: '2021',
    currentCompany: 'Salesforce',
    currentCompanyRole: 'MTS Software Engineer',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/in/poojahegde-tech',
    githubUsername: 'poojah'
  },
  {
    name: 'Rahul Kulkarni',
    email: 'rahul.kulkarni@alumni.griet.ac.in',
    college: 'GRIET Hyderabad',
    branch: 'EEE',
    batch: '2019',
    currentCompany: 'Oracle',
    currentCompanyRole: 'Cloud Software Architect',
    location: 'Bengaluru, India',
    linkedinUrl: 'https://linkedin.com/in/rahulkulkarni',
    githubUsername: 'rahulk'
  },
  {
    name: 'Meghana Rao',
    email: 'meghana.rao@alumni.cbit.ac.in',
    college: 'CBIT Hyderabad',
    branch: 'CSE',
    batch: '2023',
    currentCompany: 'Uber',
    currentCompanyRole: 'Software Engineer I',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/in/meghanarao',
    githubUsername: 'meghanarao'
  },
  {
    name: 'Vikramaditya Roy',
    email: 'vikram.roy@alumni.ou.ac.in',
    college: 'Osmania University College of Engineering',
    branch: 'AIML',
    batch: '2022',
    currentCompany: 'Deloitte',
    currentCompanyRole: 'Technology Consultant',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/in/vikramroy',
    githubUsername: 'vroy'
  },
  {
    name: 'Divya Teja',
    email: 'divya.teja@alumni.cbit.ac.in',
    college: 'CBIT Hyderabad',
    branch: 'IT',
    batch: '2020',
    currentCompany: 'ServiceNow',
    currentCompanyRole: 'Senior Quality Engineer',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/in/divyateja',
    githubUsername: 'divyateja'
  }
];

async function seedAlumniData() {
  try {
    const passwordHash = await bcrypt.hash('alumni123', 10);
    let created = 0;

    for (const a of sampleAlumni) {
      const exists = await User.findOne({ email: a.email });
      if (!exists) {
        await User.create({
          ...a,
          passwordHash,
          role: 'alumni',
          isActive: true
        });
        created++;
      }
    }

    console.log(`✅ Seeded ${created} sample Alumni records successfully.`);
  } catch (err) {
    console.error('Error seeding alumni:', err.message);
  }
}

if (require.main === module) {
  mongoose.connect(config.mongoUri).then(async () => {
    await seedAlumniData();
    mongoose.disconnect();
  });
}

module.exports = seedAlumniData;
