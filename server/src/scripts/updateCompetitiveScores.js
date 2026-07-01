const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const { computeAggregateScores } = require('../utils/scoring');

async function run() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students to update.`);

    let updatedCount = 0;
    
    for (const student of students) {
      const scores = computeAggregateScores({
        platformStats: student.platformStats || {},
        hackerrank: student.hackerrank || {},
        currentActivityScore: student.scores?.activityScore || 0,
        currentConsistencyScore: student.scores?.consistencyScore || 0
      });

      student.scores = scores;
      await student.save();
      
      updatedCount++;
      if (updatedCount % 50 === 0) {
        console.log(`Updated ${updatedCount} students...`);
      }
    }

    console.log(`Successfully updated competitiveIndex for ${updatedCount} students.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
