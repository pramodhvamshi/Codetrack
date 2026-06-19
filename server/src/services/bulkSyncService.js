const BulkSyncJob = require('../models/BulkSyncJob');
const User = require('../models/User');
const config = require('../config/env');
const { syncPlatformsForUser } = require('./platformSyncService');

/**
 * Runs the bulk sync task for all onboarded students with active platform handles.
 * Updates the BulkSyncJob document in real-time.
 */
async function runBulkSync(jobId) {
  const job = await BulkSyncJob.findOne({ jobId });
  if (!job) return;

  try {
    job.status = 'Running';
    job.startedAt = new Date();
    await job.save();

    // Fetch active students with at least one platform username
    const students = await User.find({
      role: 'student',
      isOnboarded: true,
      $or: [
        { leetcodeUsername: { $ne: '', $exists: true } },
        { codechefUsername: { $ne: '', $exists: true } },
        { gfgUsername: { $ne: '', $exists: true } },
        { githubUsername: { $ne: '', $exists: true } }
      ]
    });

    job.totalStudents = students.length;
    job.logs.push(`Found ${students.length} students with registered platform handles.`);
    job.logs.push(`Batch Size: ${config.bulkSyncBatchSize}. Delay Interval: ${config.bulkSyncDelayMs}ms.`);
    await job.save();

    const batchSize = config.bulkSyncBatchSize;
    const delayMs = config.bulkSyncDelayMs;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      const progressLog = `Starting batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(students.length / batchSize)} (students ${i + 1} to ${Math.min(i + batchSize, students.length)})`;
      await BulkSyncJob.updateOne(
        { jobId },
        { $push: { logs: progressLog } }
      );

      // Execute this batch's sync operations in parallel
      const batchPromises = batch.map(async (student) => {
        try {
          await syncPlatformsForUser(student, { force: true });
          
          await BulkSyncJob.updateOne(
            { jobId },
            { 
              $inc: { completedStudents: 1 },
              $push: { logs: `SUCCESS: Synced student ${student.name} (${student.email})` }
            }
          );
        } catch (err) {
          await BulkSyncJob.updateOne(
            { jobId },
            { 
              $inc: { failedStudents: 1 },
              $push: { 
                logs: `FAILED: Student ${student.name} (${student.email}) - Error: ${err.message}`,
                failedStudentsList: {
                  studentName: student.name,
                  email: student.email,
                  reason: err.message || 'Unknown sync error'
                }
              }
            }
          );
        }
      });

      await Promise.all(batchPromises);

      // Apply configurable delay between batches
      if (i + batchSize < students.length) {
        await delay(delayMs);
      }
    }

    // Mark job as completed
    const finalJob = await BulkSyncJob.findOne({ jobId });
    finalJob.status = 'Completed';
    finalJob.completedAt = new Date();
    finalJob.logs.push(`Bulk sync complete. Success: ${finalJob.completedStudents}, Failed: ${finalJob.failedStudents}`);
    await finalJob.save();

  } catch (err) {
    console.error(`Bulk sync job ${jobId} failed with critical error:`, err);
    await BulkSyncJob.updateOne(
      { jobId },
      { 
        $set: { status: 'Failed', completedAt: new Date() },
        $push: { logs: `CRITICAL SYSTEM ERROR: ${err.message}` }
      }
    );
  }
}

module.exports = { runBulkSync };
