require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { calculatePlacementReadiness } = require('../utils/profileMetrics');

async function updateAllReadiness() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");
    
    const users = await User.find({ role: 'student' });
    console.log(`Found ${users.length} students. Updating readiness scores...`);
    
    let updated = 0;
    for (const user of users) {
      const profile = await StudentProfile.findOne({ userId: user._id });
      if (profile) {
        const newReadiness = calculatePlacementReadiness(user, profile);
        user.placementReadiness = newReadiness;
        await user.save();
        updated++;
      }
    }
    
    console.log(`Successfully updated ${updated} students with the new Placement Readiness formula.`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

updateAllReadiness();
