const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
const config = require('../config/env');
const User = require('../models/User');

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;
    
    console.log('Executing V1.0 Surgical Reset: Wiping Student Data Only...');
    
    // 1. Delete all student users
    const studentDeleteResult = await User.deleteMany({ role: 'student' });
    console.log(`- Deleted ${studentDeleteResult.deletedCount} student accounts (Admins & Coordinators preserved).`);

    // 2. Drop student-centric collections
    const collectionsToDrop = [
      'studentprofiles',
      'weeklysnapshots',
      'contestsnapshots',
      'leetcodecontestsnapshots',
      'leetcodegrowthsnapshots',
      'codechefcontestsnapshots',
      'activities',
      'reportcaches',
      'resumescores',
      'resumesnapshots',
      'resumeversions',
      'resumefiles',
      'bulksyncjobs'
    ];

    console.log('Dropping student-generated collections...');
    for (const collName of collectionsToDrop) {
      try {
        await db.dropCollection(collName);
        console.log(`- Dropped collection: ${collName}`);
      } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
          console.log(`- Skipped: ${collName} (Does not exist)`);
        } else {
          console.log(`- Error dropping ${collName}: ${err.message}`);
        }
      }
    }

    console.log('\n✅ V1.0 Production Reset Complete!');
    console.log('The database is now a clean slate for the coordinator.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database reset:', error);
    process.exit(1);
  }
}

resetDatabase();
