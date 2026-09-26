const BulkSyncJob = require('../models/BulkSyncJob');
const User = require('../models/User');
const config = require('../config/env');
const { syncPlatformsForUser } = require('./platformSyncService');

// In-memory set of cancelled jobs
const cancelledJobIds = new Set();

/**
 * Stop a specific running job or all running jobs.
 */
async function stopSyncJob(jobId) {
  if (jobId) {
    cancelledJobIds.add(jobId);
    await BulkSyncJob.updateOne(
      { jobId },
      {
        $set: { status: 'Cancelled', completedAt: new Date() },
        $push: { logs: '🛑 SYNC STOPPED - Job cancelled by admin request.' }
      }
    );
  } else {
    return stopAllSyncJobs();
  }
}

/**
 * Stops all pending or running jobs in database and signals running loops.
 */
async function stopAllSyncJobs() {
  const runningJobs = await BulkSyncJob.find({ status: { $in: ['Pending', 'Running'] } });
  for (const job of runningJobs) {
    cancelledJobIds.add(job.jobId);
  }

  const result = await BulkSyncJob.updateMany(
    { status: { $in: ['Pending', 'Running'] } },
    {
      $set: {
        status: 'Cancelled',
        completedAt: new Date()
      },
      $push: {
        logs: '🛑 SYNC STOPPED - Interrupted or stopped by system/admin request.'
      }
    }
  );
  return result;
}

/**
 * Startup cleaner: marks any abandoned jobs as interrupted so the system never deadlocks.
 */
async function cleanOrphanedJobsOnStartup() {
  try {
    const result = await BulkSyncJob.updateMany(
      { status: { $in: ['Pending', 'Running'] } },
      {
        $set: {
          status: 'Failed',
          completedAt: new Date()
        },
        $push: {
          logs: '✗ JOB INTERRUPTED - Server was restarted while sync was running. You can resume or restart sync anytime.'
        }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[BulkSync] Cleaned up ${result.modifiedCount} orphaned bulk sync job(s) on server startup.`);
    }
    return result;
  } catch (err) {
    console.error('[BulkSync] Error cleaning up orphaned jobs on startup:', err.message);
  }
}

/**
 * Runs bulk sync for all onboarded students or resumes from a previous job.
 * @param {string} jobId
 * @param {object} options { resumeFromJobId }
 */
async function runBulkSync(jobId, options = {}) {
  const job = await BulkSyncJob.findOne({ jobId });
  if (!job) return;

  // Clear cancel flag if previously set for this ID
  cancelledJobIds.delete(jobId);

  try {
    job.status = 'Running';
    job.startedAt = new Date();
    
    // Fetch all active students with at least one platform handle
    const allStudents = await User.find({
      role: 'student',
      isOnboarded: true,
      $or: [
        { leetcodeUsername: { $ne: '', $exists: true } },
        { codechefUsername: { $ne: '', $exists: true } },
        { gfgUsername: { $ne: '', $exists: true } },
        { githubUsername: { $ne: '', $exists: true } }
      ]
    });

    let alreadyProcessedIds = new Set();
    let previousJob = null;

    if (options.resumeFromJobId) {
      previousJob = await BulkSyncJob.findOne({ jobId: options.resumeFromJobId });
      if (previousJob) {
        if (previousJob.processedStudentIds && previousJob.processedStudentIds.length > 0) {
          previousJob.processedStudentIds.forEach(id => alreadyProcessedIds.add(id.toString()));
        }
        job.completedStudents = previousJob.completedStudents || 0;
        job.failedStudents = previousJob.failedStudents || 0;
        job.partialStudents = previousJob.partialStudents || 0;
        job.platformFailures = {
          LeetCode: previousJob.platformFailures?.LeetCode || 0,
          CodeChef: previousJob.platformFailures?.CodeChef || 0,
          GFG: previousJob.platformFailures?.GFG || 0,
          GitHub: previousJob.platformFailures?.GitHub || 0,
          HackerRank: previousJob.platformFailures?.HackerRank || 0
        };
        job.failedStudentsList = previousJob.failedStudentsList || [];
        job.processedStudentIds = Array.from(alreadyProcessedIds);
      }
    } else {
      job.completedStudents = 0;
      job.failedStudents = 0;
      job.partialStudents = 0;
      job.platformFailures = {
        LeetCode: 0,
        CodeChef: 0,
        GFG: 0,
        GitHub: 0,
        HackerRank: 0
      };
      job.processedStudentIds = [];
    }

    job.totalStudents = allStudents.length;

    // Filter students remaining to be processed
    const students = allStudents.filter(s => !alreadyProcessedIds.has(s._id.toString()));

    const resumeMsg = options.resumeFromJobId 
      ? `Resuming sync: ${alreadyProcessedIds.size} students already processed, ${students.length} remaining.`
      : `Found ${allStudents.length} students with registered platform handles.`;

    job.logs.push(resumeMsg);
    job.logs.push(`Batch Size: ${config.bulkSyncBatchSize}. Delay Interval: ${config.bulkSyncDelayMs}ms.`);
    await job.save();

    const batchSize = Math.max(1, config.bulkSyncBatchSize || 5);
    const delayMs = config.bulkSyncDelayMs || 2000;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const totalBatches = Math.ceil(students.length / batchSize);

    for (let i = 0; i < students.length; i += batchSize) {
      // Check cancellation signal
      if (cancelledJobIds.has(jobId)) {
        console.log(`[BulkSync] Job ${jobId} was cancelled. Stopping loop.`);
        return;
      }

      // Check DB cancellation in case another cluster/worker updated it
      const checkStatus = await BulkSyncJob.findOne({ jobId }).select('status');
      if (!checkStatus || checkStatus.status === 'Cancelled' || checkStatus.status === 'Failed') {
        console.log(`[BulkSync] Job ${jobId} status is ${checkStatus?.status}. Aborting.`);
        return;
      }

      const batch = students.slice(i, i + batchSize);
      const currentBatchNum = Math.floor(i / batchSize) + 1;
      const progressLog = `Starting batch ${currentBatchNum} of ${totalBatches} (remaining students ${i + 1} to ${Math.min(i + batchSize, students.length)})`;

      await BulkSyncJob.updateOne(
        { jobId },
        { $push: { logs: progressLog } }
      );

      const batchPromises = batch.map(async (student) => {
        try {
          // Wrap with a 45-second timeout so no platform hangs indefinitely
          const updatedStudent = await Promise.race([
            syncPlatformsForUser(student, { force: true }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Sync timed out after 45s')), 45000)
            )
          ]);

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
                  processedStudentIds: student._id,
                  failedStudentsList: {
                    studentName: student.name,
                    email: student.email,
                    reason: `Partial Failure: ${updatedStudent.syncErrors?.join(', ') || 'Platform errors'}`
                  }
                }
              }
            );
          } else {
            await BulkSyncJob.updateOne(
              { jobId },
              { 
                $inc: { completedStudents: 1 },
                $push: { 
                  logs: studentLog,
                  processedStudentIds: student._id 
                }
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
                processedStudentIds: student._id,
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

      // Check cancellation after batch
      if (cancelledJobIds.has(jobId)) {
        return;
      }

      // Apply delay between batches
      if (i + batchSize < students.length) {
        await delay(delayMs);
      }
    }

    // Mark job as completed
    const finalJob = await BulkSyncJob.findOne({ jobId });
    if (!finalJob || finalJob.status === 'Cancelled') return;

    finalJob.status = 'Completed';
    finalJob.completedAt = new Date();

    const summaryLog = 
      `--- SYNC SUMMARY ---\n` +
      `Students In System: ${finalJob.totalStudents}\n` +
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
  } finally {
    cancelledJobIds.delete(jobId);
  }
}

module.exports = {
  runBulkSync,
  stopSyncJob,
  stopAllSyncJobs,
  stopStuckSyncJobs: stopAllSyncJobs,
  cleanOrphanedJobsOnStartup
};
