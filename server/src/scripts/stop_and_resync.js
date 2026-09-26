const path = require('path');
const serverDir = path.resolve(__dirname, '../../');
const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));
const crypto = require('crypto');

dotenv.config({ path: path.join(serverDir, '.env') });
const config = require(path.join(serverDir, 'src/config/env'));

const mongoUri = config.mongoUri;
const BulkSyncJob = require(path.join(serverDir, 'src/models/BulkSyncJob'));
const { runBulkSync, stopStuckSyncJobs } = require(path.join(serverDir, 'src/services/bulkSyncService'));

async function main() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to database.');

  console.log('\n🛑 Step 1: Stopping stuck or orphaned sync jobs...');
  const stopResult = await stopStuckSyncJobs();
  console.log(`Stopped jobs count: ${stopResult.modifiedCount}`);

  console.log('\n⚡ Step 2: Launching fresh bulk sync for all student accounts...');
  const jobId = crypto.randomUUID();
  await BulkSyncJob.create({
    jobId,
    status: 'Pending',
    logs: [`Initial fast sync job created at ${new Date().toISOString()}`]
  });

  console.log(`Job created with ID: ${jobId}`);
  console.log('Running bulk sync now...');
  
  const startTime = Date.now();

  // Run the bulk sync
  await runBulkSync(jobId);

  const durationMs = Date.now() - startTime;
  const minutes = (durationMs / (1000 * 60)).toFixed(2);

  const finalJob = await BulkSyncJob.findOne({ jobId });
  console.log('\n========================================');
  console.log('🏁 BULK SYNC EXECUTION FINISHED');
  console.log(`⏱ Total Duration: ${minutes} minutes`);
  console.log(`Status: ${finalJob.status}`);
  console.log(`Total Students: ${finalJob.totalStudents}`);
  console.log(`Fully Synced: ${finalJob.completedStudents}`);
  console.log(`Partial Synced: ${finalJob.partialStudents || 0}`);
  console.log(`Failed: ${finalJob.failedStudents}`);
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(err => {
  console.error('Fatal error during sync script execution:', err);
  process.exit(1);
});
