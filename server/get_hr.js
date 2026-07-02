const mongoose = require('mongoose');
const env = require('./src/config/env');
const User = require('./src/models/User');

async function getHR() {
  await mongoose.connect(env.mongoUri);
  const user = await User.findOne({ hackerrankUsername: { $exists: true, $ne: "" } });
  if (user) {
    console.log("Found HR username:", user.hackerrankUsername);
  } else {
    console.log("No HR username found");
  }
  mongoose.disconnect();
}
getHR();
