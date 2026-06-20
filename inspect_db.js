const path = require('path');
const serverDir = 'c:/Users/Medha Trust/Downloads/codetrack/server';
const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));

dotenv.config({ path: path.join(serverDir, '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrack';
const User = require(path.join(serverDir, 'src/models/User'));
const ContestSnapshot = require(path.join(serverDir, 'src/models/ContestSnapshot'));
const WeeklySnapshot = require(path.join(serverDir, 'src/models/WeeklySnapshot'));

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student', isOnboarded: true }).limit(5);
    console.log(`Found ${students.length} students`);
    for (const student of students) {
      console.log('--- STUDENT ---');
      console.log('Name:', student.name);
      console.log('LeetCode Username:', student.leetcodeUsername);
      console.log('CodeChef Username:', student.codechefUsername);
      console.log('LeetCode Rating:', student.platformStats?.leetcode?.rating);
      console.log('LeetCode Ranking:', student.platformStats?.leetcode?.ranking);
      console.log('CodeChef Rating:', student.platformStats?.codechef?.rating);
      console.log('CodeChef CurrentRating:', student.platformStats?.codechef?.currentRating);
      console.log('CodeChef GlobalRank:', student.platformStats?.codechef?.globalRank);
    }

    const contestSnapshots = await ContestSnapshot.find().limit(5);
    console.log(`Found ${contestSnapshots.length} contest snapshots`);
    for (const cs of contestSnapshots) {
      console.log('Contest Snapshot Month:', cs.monthKey, 'User ID:', cs.userId);
      console.log('LeetCode Rating:', cs.leetcode?.rating, 'Ranking:', cs.leetcode?.ranking);
    }

    const weeklySnapshots = await WeeklySnapshot.find().limit(5);
    console.log(`Found ${weeklySnapshots.length} weekly snapshots`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connect(mongoUri).then(() => mongoose.disconnect());
  }
}

run();
