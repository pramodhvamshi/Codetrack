const path = require('path');
const serverDir = 'c:/Users/Medha Trust/Downloads/codetrack/server';
const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));

dotenv.config({ path: path.join(serverDir, '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrack';
const Activity = require(path.join(serverDir, 'src/models/Activity'));

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const allPlatforms = await Activity.distinct('platform');
    console.log('Distinct platforms in all activities:', allPlatforms);
    
    const allTypes = await Activity.distinct('type');
    console.log('Distinct types in all activities:', allTypes);
    
    // Check if any platform has wrong casing or different names
    for (const p of allPlatforms) {
      const count = await Activity.countDocuments({ platform: p });
      console.log(`Platform "${p}": ${count} records`);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
