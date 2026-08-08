const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');
const Job = require('../models/Job');
const Post = require('../models/Post');

const alumniData = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@alumni.cbit.ac.in',
    role: 'alumni',
    college: 'CBIT',
    branch: 'CSE',
    batch: '2021',
    currentCompany: 'Google',
    currentCompanyRole: 'Software Engineer II',
    location: 'Bangalore, India',
    homeTown: 'Hyderabad',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rahul-sharma',
      github: 'https://github.com/rahul-sharma',
      leetcode: 'rahul_g'
    }
  },
  {
    name: 'Priya Verma',
    email: 'priya.verma@alumni.cbit.ac.in',
    role: 'alumni',
    college: 'CBIT',
    branch: 'IT',
    batch: '2022',
    currentCompany: 'Amazon',
    currentCompanyRole: 'SDE-1',
    location: 'Hyderabad, India',
    homeTown: 'Hyderabad',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/priya-verma',
      github: 'https://github.com/priya-verma'
    }
  },
  {
    name: 'Ankit Reddy',
    email: 'ankit.reddy@alumni.cbit.ac.in',
    role: 'alumni',
    college: 'CBIT',
    branch: 'CSE',
    batch: '2020',
    currentCompany: 'Microsoft',
    currentCompanyRole: 'Senior Cloud Engineer',
    location: 'Seattle, USA',
    homeTown: 'Hyderabad',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/ankit-reddy',
      github: 'https://github.com/ankit-reddy'
    }
  },
  {
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@alumni.cbit.ac.in',
    role: 'alumni',
    college: 'CBIT',
    branch: 'ECE',
    batch: '2021',
    currentCompany: 'Deloitte',
    currentCompanyRole: 'Tech Consultant',
    location: 'Pune, India',
    homeTown: 'Pune',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sneha-kulkarni'
    }
  },
  {
    name: 'Vikram Joshi',
    email: 'vikram.joshi@alumni.cbit.ac.in',
    role: 'alumni',
    college: 'CBIT',
    branch: 'CSE',
    batch: '2023',
    currentCompany: 'Atlassian',
    currentCompanyRole: 'Backend Engineer',
    location: 'Bengaluru, India',
    homeTown: 'Hyderabad',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/vikram-joshi',
      github: 'https://github.com/vikram-joshi'
    }
  }
];

const jobData = [
  {
    title: 'SDE-1 (Backend Focus)',
    company: 'Amazon',
    location: 'Hyderabad, India',
    employmentType: 'Full-Time',
    salary: '₹22 LPA',
    description: 'Looking for strong CS fundamentals, Java/Node.js, and DSA problem-solving skills for our AWS infrastructure team.',
    requirements: 'Proficiency in Data Structures, Algorithms, System Design basics.',
    tags: ['Java', 'Node.js', 'AWS', 'Backend']
  },
  {
    title: 'Frontend Developer Intern',
    company: 'Google',
    location: 'Bangalore, India',
    employmentType: 'Internship',
    salary: '₹60,000 / month',
    description: 'Great opportunity for 3rd and 4th-year CBIT students with strong React, JavaScript, and Web Performance skills.',
    requirements: 'Strong React.js experience, HTML5, CSS3, REST APIs.',
    tags: ['React', 'JavaScript', 'Web']
  },
  {
    title: 'Cloud Engineer (Alumni Referral)',
    company: 'Microsoft',
    location: 'Remote / Hyderabad',
    employmentType: 'Referral',
    salary: '₹18 LPA',
    description: 'Direct referral opportunity for Azure Cloud Infrastructure team. I will personally review resumes of Medha students.',
    requirements: 'Docker, Kubernetes, Azure/AWS, CI/CD pipelines.',
    tags: ['Azure', 'DevOps', 'Docker', 'Kubernetes']
  }
];

async function seedAlumni() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const passwordHash = await bcrypt.hash('alumni123', 10);
    const createdAlumni = [];

    for (const a of alumniData) {
      let user = await User.findOne({ email: a.email });
      if (!user) {
        user = await User.create({
          ...a,
          passwordHash
        });
        console.log(`Created alumnus: ${a.name} (${a.currentCompany})`);
      } else {
        console.log(`Alumnus ${a.name} already exists`);
      }
      createdAlumni.push(user);
    }

    // Seed Jobs
    if (createdAlumni.length > 0) {
      for (let i = 0; i < jobData.length; i++) {
        const j = jobData[i];
        const author = createdAlumni[i % createdAlumni.length];

        const existingJob = await Job.findOne({ title: j.title, company: j.company });
        if (!existingJob) {
          const newJob = await Job.create({
            ...j,
            author: author._id
          });
          console.log(`Created Job: ${j.title} at ${j.company}`);

          // Also publish job post to Community Feed
          await Post.create({
            author: author._id,
            postType: 'job',
            title: `${j.title} at ${j.company}`,
            content: `${j.company} is hiring for ${j.title} (${j.employmentType}, ${j.location}). ${j.description}`,
            category: 'career',
            metadata: {
              company: j.company,
              role: j.title,
              salary: j.salary,
              jobId: newJob._id.toString()
            }
          });
        }
      }
    }

    console.log('\n✅ Alumni & Jobs Seeded Successfully!');
    console.log('Login credentials for demo alumni:');
    console.log('Email: rahul.sharma@alumni.cbit.ac.in | Password: alumni123');
    console.log('Email: priya.verma@alumni.cbit.ac.in  | Password: alumni123');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding alumni:', err);
    process.exit(1);
  }
}

seedAlumni();
