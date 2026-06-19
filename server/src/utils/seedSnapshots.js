const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AcademicProfile = require('../models/AcademicProfile');
const WeeklySnapshot = require('../models/WeeklySnapshot');
const LeetCodeGrowthSnapshot = require('../models/LeetCodeGrowthSnapshot');
const ContestSnapshot = require('../models/ContestSnapshot');
const ReportCache = require('../models/ReportCache');
const config = require('../config/env');

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(config.mongoUri);
  console.log('Connected.');

  // Clear existing snapshots for seeding fresh
  console.log('Cleaning existing snapshots and cache...');
  await Promise.all([
    WeeklySnapshot.deleteMany({}),
    LeetCodeGrowthSnapshot.deleteMany({}),
    ContestSnapshot.deleteMany({}),
    AcademicProfile.deleteMany({}),
    ReportCache.deleteMany({})
  ]);

  let students = await User.find({ role: 'student' });
  if (students.length === 0) {
    console.log('No student users found. Creating mock student users...');
    
    const mockStudentsData = [
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'dummy',
        role: 'student',
        isOnboarded: true,
        isActive: true,
        mssid: 'MSS001',
        college: 'Medha Tech College',
        branch: 'CSE',
        year: '3',
        currentYear: '3rd Year',
        leetcodeUsername: 'janedoe_lc',
        codechefUsername: 'janedoe_cc',
        gfgUsername: 'janedoe_gfg',
        githubUsername: 'janedoe_gh',
        overallGpa: 8.8,
        platformStats: {
          leetcode: { rating: 1750, ranking: 45000, problemsSolved: 320, easySolved: 100, mediumSolved: 180, hardSolved: 40, contestCount: 12, acceptanceRate: 64.5 },
          codechef: { rating: 1620, currentRating: 1620, highestRating: 1700, stars: '3★', globalRank: 12000, problemsSolved: 150, contestCount: 8 }
        }
      },
      {
        name: 'John Smith',
        email: 'john@example.com',
        passwordHash: 'dummy',
        role: 'student',
        isOnboarded: true,
        isActive: true,
        mssid: 'MSS002',
        college: 'Medha Tech College',
        branch: 'ECE',
        year: '4',
        currentYear: '4th Year',
        leetcodeUsername: 'johnsmith_lc',
        codechefUsername: 'johnsmith_cc',
        overallGpa: 9.2,
        platformStats: {
          leetcode: { rating: 1980, ranking: 18000, problemsSolved: 510, easySolved: 150, mediumSolved: 280, hardSolved: 80, contestCount: 22, acceptanceRate: 58.2 },
          codechef: { rating: 1840, currentRating: 1840, highestRating: 1890, stars: '4★', globalRank: 4500, problemsSolved: 240, contestCount: 15 }
        }
      },
      {
        name: 'Alex Mercer',
        email: 'alex@example.com',
        passwordHash: 'dummy',
        role: 'student',
        isOnboarded: true,
        isActive: true,
        mssid: 'MSS003',
        college: 'Medha Engineering College',
        branch: 'CSE',
        year: '3',
        currentYear: '3rd Year',
        leetcodeUsername: 'alexmercer_lc',
        overallGpa: 7.9,
        platformStats: {
          leetcode: { rating: 1420, ranking: 120000, problemsSolved: 120, easySolved: 80, mediumSolved: 35, hardSolved: 5, contestCount: 4, acceptanceRate: 48.0 }
        }
      }
    ];

    students = [];
    for (const data of mockStudentsData) {
      const u = await User.create(data);
      students.push(u);
    }
    console.log(`Created ${students.length} mock student users.`);
  }

  // Create StudentProfiles & AcademicProfiles
  console.log('Seeding profiles...');
  const mentors = ['Dr. Sarah Jenkins', 'Prof. Alan Turing', 'Dr. Grace Hopper'];
  const sections = ['A', 'B', 'C'];
  const genders = ['Male', 'Female'];
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    
    // 1. StudentProfile
    await StudentProfile.findOneAndUpdate(
      { userId: student._id },
      {
        personalDetails: {
          fullName: student.name,
          email: student.email,
          mobile: '987654321' + i,
          gender: genders[i % 2],
          college: student.college,
          branch: student.branch,
          year: student.year,
          rollNumber: `20BCE100${i + 1}`,
          mentorName: mentors[i % mentors.length],
          section: sections[i % sections.length]
        },
        profileCompletion: 85,
        readinessProfile: {
          overallReadiness: student.overallGpa > 9 ? 85 : student.overallGpa > 8 ? 70 : 45,
          dsaScore: student.overallGpa > 9 ? 90 : student.overallGpa > 8 ? 75 : 50,
          projectsScore: 80,
          resumeScore: 75,
          profileScore: 85
        }
      },
      { upsert: true }
    );

    // 2. AcademicProfile
    const isAlex = student.email === 'alex@example.com';
    const isJohn = student.email === 'john@example.com';
    
    const sgpa1 = isJohn ? 9.0 : isAlex ? 7.2 : 8.4;
    const sgpa2 = isJohn ? 9.1 : isAlex ? 7.5 : 8.5;
    const sgpa3 = isJohn ? 9.2 : isAlex ? 7.8 : 8.6;
    const sgpa4 = isJohn ? 9.3 : isAlex ? 7.6 : 8.7;
    const sgpa5 = isJohn ? 9.4 : isAlex ? 8.0 : 8.9;
    const sgpa6 = isJohn ? 9.2 : (isAlex ? null : 8.8); // Jane completed sem 5, John completed 6, Alex completed 5
    
    const cgpa = isJohn ? 9.2 : isAlex ? 7.62 : 8.65;
    const backlogs = isAlex ? 1 : 0;
    const academicStatus = cgpa >= 9.0 ? 'Excellent' : cgpa >= 8.0 ? 'Good' : cgpa >= 7.0 ? 'Average' : 'Needs Improvement';

    await AcademicProfile.create({
      userId: student._id,
      sgpa1, sgpa2, sgpa3, sgpa4, sgpa5, sgpa6,
      cgpa,
      backlogs,
      academicStatus
    });

    // 3. LeetCode Contest History
    const lcBaseRating = isJohn ? 1900 : isAlex ? 1400 : 1700;
    const mockHistory = [
      { name: "Weekly Contest 390", date: "2026-05-10", rating: lcBaseRating - 60 },
      { name: "Biweekly Contest 130", date: "2026-05-17", rating: lcBaseRating - 40 },
      { name: "Weekly Contest 391", date: "2026-05-24", rating: lcBaseRating - 20 },
      { name: "Weekly Contest 392", date: "2026-05-31", rating: lcBaseRating },
    ];
    await User.findByIdAndUpdate(student._id, {
      'platformStats.leetcode.contestHistory': mockHistory
    });
  }

  // Create Snapshots
  console.log('Seeding Snapshots...');
  
  // Weekly Snapshots (w1 = 3 weeks ago, w2 = 2 weeks ago, w3 = 1 week ago, w4 = current week)
  const now = new Date();
  const w4KeyStr = getStartOfWeek(now).toISOString().split('T')[0];
  const w3KeyStr = getStartOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const w2KeyStr = getStartOfWeek(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const w1KeyStr = getStartOfWeek(new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  const weeks = [
    { key: w1KeyStr, lagDays: 21 },
    { key: w2KeyStr, lagDays: 14 },
    { key: w3KeyStr, lagDays: 7 },
    { key: w4KeyStr, lagDays: 0 }
  ];

  for (const student of students) {
    const isAlex = student.email === 'alex@example.com';
    const isJohn = student.email === 'john@example.com';
    
    const lcBaseRating = isJohn ? 1900 : isAlex ? 1400 : 1700;
    const ccBaseRating = isJohn ? 1750 : isAlex ? 0 : 1550;
    
    const lcBaseMedSolved = isJohn ? 240 : isAlex ? 20 : 150;

    for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
      const wk = weeks[wIdx];
      const ratingGrowth = wIdx * 20; // 20 rating points per week
      const mediumGrowth = wIdx * 10; // 10 medium problems per week

      const lcRating = lcBaseRating + ratingGrowth;
      const ccRating = ccBaseRating > 0 ? ccBaseRating + ratingGrowth : 0;
      
      const snapDate = new Date(now.getTime() - wk.lagDays * 24 * 60 * 60 * 1000);

      // Weekly snapshot
      await WeeklySnapshot.create({
        userId: student._id,
        weekKey: wk.key,
        leetcode: {
          rating: lcRating,
          ranking: 50000 - wIdx * 5000
        },
        codechef: {
          rating: ccRating,
          globalRank: ccRating > 0 ? 10000 - wIdx * 1000 : 0
        },
        snapshotDate: snapDate
      });

      // Medium Solved Growth
      await LeetCodeGrowthSnapshot.create({
        userId: student._id,
        weekKey: wk.key,
        mediumSolved: lcBaseMedSolved + mediumGrowth,
        snapshotDate: snapDate
      });
    }

    // Monthly Snapshots (Current and Previous Month)
    const currentMonthKey = getMonthKey(now);
    const prevMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 15));

    // Prev Month snapshot
    await ContestSnapshot.create({
      userId: student._id,
      monthKey: prevMonthKey,
      leetcode: {
        rating: lcBaseRating + 20,
        ranking: 45000,
        contestCount: 5
      },
      codechef: {
        rating: ccBaseRating > 0 ? ccBaseRating + 20 : 0,
        globalRank: ccBaseRating > 0 ? 9000 : 0,
        contestCount: 3
      },
      snapshotDate: new Date(now.getFullYear(), now.getMonth() - 1, 28)
    });

    // Current Month snapshot
    await ContestSnapshot.create({
      userId: student._id,
      monthKey: currentMonthKey,
      leetcode: {
        rating: lcBaseRating + 80,
        ranking: 35000,
        contestCount: 9
      },
      codechef: {
        rating: ccBaseRating > 0 ? ccBaseRating + 80 : 0,
        globalRank: ccBaseRating > 0 ? 7000 : 0,
        contestCount: 6
      },
      snapshotDate: new Date()
    });
  }

  console.log('Seeding snapshot historical data completed successfully!');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  mongoose.disconnect();
});
