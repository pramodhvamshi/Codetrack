const path = require('path');
const serverDir = 'c:/Users/Medha Trust/Downloads/codetrack/server';
const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));

dotenv.config({ path: path.join(serverDir, '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrack';
const coordinatorRouter = require(path.join(serverDir, 'src/routes/coordinator'));

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Mock Express request and response
    const req = {
      query: {
        reportType: 'codechef-all-contest',
        limit: 2
      }
    };

    const res = {
      json: function(data) {
        console.log('API RESPONSE ROWS:');
        console.log(JSON.stringify(data.rows, null, 2));
      },
      status: function(code) {
        console.log('STATUS:', code);
        return this;
      }
    };

    // Find the route handler
    const route = coordinatorRouter.stack.find(r => r.route && r.route.path === '/tracking-reports/data');
    if (route) {
      const handler = route.route.stack[0].handle;
      await handler(req, res);
    } else {
      console.log('Route not found');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
