const path = require('path');
const serverDir = 'c:/Users/Medha Trust/Downloads/codetrack/server';
const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));

dotenv.config({ path: path.join(serverDir, '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrack';
const Activity = require(path.join(serverDir, 'src/models/Activity'));
const User = require(path.join(serverDir, 'src/models/User'));

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const monthlyAggregation = await Activity.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfMonth, $lt: endOfMonth },
          platform: { $in: ['leetcode', 'geeksforgeeks'] },
          type: 'solved'
        }
      },
      {
        $group: {
          _id: "$userId",
          leetcodeSolved: {
            $sum: {
              $cond: [
                { $eq: ["$platform", "leetcode"] },
                { $ifNull: ["$meta.increment", 1] },
                0
              ]
            }
          },
          gfgSolved: {
            $sum: {
              $cond: [
                { $eq: ["$platform", "geeksforgeeks"] },
                { $ifNull: ["$meta.increment", 1] },
                0
              ]
            }
          },
          monthlyScore: {
            $sum: { $ifNull: [ "$meta.increment", 1 ] }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      {
        $unwind: "$studentInfo"
      },
      {
        $match: {
          "studentInfo.role": "student",
          "studentInfo.isOnboarded": true
        }
      },
      {
        $sort: {
          monthlyScore: -1,
          leetcodeSolved: -1,
          gfgSolved: -1,
          "studentInfo.name": 1
        }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$studentInfo.name",
          branch: "$studentInfo.branch",
          leetcodeSolved: 1,
          gfgSolved: 1,
          monthlyScore: 1
        }
      }
    ]);

    console.log('Monthly Aggregation Result:');
    console.log(JSON.stringify(monthlyAggregation, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
