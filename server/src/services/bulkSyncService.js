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
    job.completedStudents = 0;
    job.failedStudents = 0;
    job.partialStudents = 0;
    
    // Add counters for platform failures
    job.platformFailures = {
      LeetCode: 0,
      CodeChef: 0,
      GFG: 0,
      GitHub: 0,
      HackerRank: 0
    };
    
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

      const batchPromises = batch.map(async (student) => {
        try {
          const updatedStudent = await syncPlatformsForUser(student, { force: true });
          
          let hasErrors = false;
          let hasSuccess = false;
          const platformLogs = [];
          const platformFailureUpdates = {};
          
          if (updatedStudent.syncResults) {
            Object.entries(updatedStudent.syncResults).forEach(([platform, result]) => {
              if (!result || result.startsWith('Skipped')) {
                platformLogs.push(`⏭ ${platform} : ${result || 'Not configured'}`);
              } else if (result === 'SUCCESS') {
                hasSuccess = true;
                platformLogs.push(`✓ ${platform} : SUCCESS`);
              } else {
                hasErrors = true;
                platformLogs.push(`✗ ${platform} : ${result}`);
                platformFailureUpdates[`platformFailures.${platform}`] = 1;
              }
            });
          }

          const studentLog = `Student ${student.name} (${student.email}):\n${platformLogs.join('\n')}`;

          if (hasErrors) {
            await BulkSyncJob.updateOne(
              { jobId },
              { 
                $inc: { 
                  partialStudents: hasSuccess ? 1 : 0, 
                  failedStudents: hasSuccess ? 0 : 1,
                  ...platformFailureUpdates
                },
                $push: { 
                  logs: studentLog,
                  failedStudentsList: {
                    studentName: student.name,
                    email: student.email,
                    reason: `Partial Failure: ${updatedStudent.syncErrors?.join(', ')}`
                  }
                }
              }
            );
          } else {
            await BulkSyncJob.updateOne(
              { jobId },
              { 
                $inc: { completedStudents: 1 },
                $push: { logs: studentLog }
              }
            );
          }
        } catch (err) {
          await BulkSyncJob.updateOne(
            { jobId },
            { 
              $inc: { failedStudents: 1 },
              $push: { 
                logs: `✗ FATAL ERROR - Student ${student.name} (${student.email}): ${err.message}`,
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
    
    const summaryLog = 
      `--- SYNC SUMMARY ---\n` +
      `Students Processed: ${finalJob.totalStudents}\n` +
      `Students Fully Synced: ${finalJob.completedStudents}\n` +
      `Students Partial: ${finalJob.partialStudents || 0}\n` +
      `Students Failed: ${finalJob.failedStudents}\n\n` +
      `Platform Failures:\n` +
      `LeetCode: ${finalJob.platformFailures?.LeetCode || 0}\n` +
      `CodeChef: ${finalJob.platformFailures?.CodeChef || 0}\n` +
      `GitHub: ${finalJob.platformFailures?.GitHub || 0}\n` +
      `GFG: ${finalJob.platformFailures?.GFG || 0}\n` +
      `HackerRank: ${finalJob.platformFailures?.HackerRank || 0}`;
      
    finalJob.logs.push(summaryLog);
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
