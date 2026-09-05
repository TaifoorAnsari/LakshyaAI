/**
 * Roadmap Generation Queue
 * 
 * Manages asynchronous background roadmap generation jobs.
 * 
 * Dual Architecture:
 * 1. Production / Redis available: Uses BullMQ connected to Redis with concurrency,
 *    retries, and persistent job state.
 * 2. Local Dev / Redis offline: Uses an in-memory job store and async executor
 *    so developers and automated tests never crash without Redis.
 */

const { Queue } = require('bullmq');
const crypto = require('crypto');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const { logger } = require('../config/logger');

const QUEUE_NAME = 'roadmap-generation';

let bullQueue = null;

// In-memory fallback job store for local development without Redis
const inMemoryJobs = new Map();

/**
 * Initializes BullMQ Queue if Redis is active
 */
const getBullQueue = () => {
  if (bullQueue) return bullQueue;

  if (isRedisAvailable()) {
    const redis = getRedisClient();
    if (redis) {
      bullQueue = new Queue(QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      });
      logger.info('🚀 BullMQ roadmap-generation queue initialized');
    }
  }

  return bullQueue;
};

/**
 * Dispatches a roadmap generation job into the background
 * 
 * @param {Object} jobData
 * @param {string} jobData.userId - ID of the requesting student
 * @param {string} jobData.goalText - Topic/goal to generate
 * @param {string} jobData.skillLevel - 'beginner' | 'intermediate' | 'advanced'
 * @param {number} jobData.hoursPerWeek - Pacing in hours
 * @param {string} jobData.learningStyle - Preferred learning style
 * @returns {Promise<{ jobId: string, status: string, isMemoryQueue: boolean }>}
 */
const addRoadmapGenerationJob = async (jobData) => {
  const queue = getBullQueue();

  if (queue && isRedisAvailable()) {
    try {
      const job = await queue.add('generate', jobData, {
        jobId: `gen_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      });
      logger.info(`📋 Enqueued BullMQ roadmap generation job: ${job.id} for "${jobData.goalText}"`);
      return { jobId: job.id, status: 'pending', isMemoryQueue: false };
    } catch (error) {
      logger.warn(`BullMQ add failed (${error.message}). Falling back to in-memory queue.`);
    }
  }

  // In-memory queue fallback
  const jobId = `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const record = {
    id: jobId,
    data: jobData,
    status: 'pending',
    progress: 0,
    result: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryJobs.set(jobId, record);
  logger.info(`📋 Enqueued in-memory roadmap generation job: ${jobId} for "${jobData.goalText}"`);

  // Trigger worker execution asynchronously on next tick
  setImmediate(async () => {
    try {
      const { processGenerationJob } = require('./roadmapWorker');
      record.status = 'generating';
      record.progress = 25;
      record.updatedAt = new Date();

      const result = await processGenerationJob(jobData, (prog) => {
        record.progress = prog;
        record.updatedAt = new Date();
      });

      record.status = 'completed';
      record.progress = 100;
      record.result = result;
      record.updatedAt = new Date();
    } catch (err) {
      logger.error(`In-memory generation job failed: ${err.message}`);
      record.status = 'failed';
      record.error = err.message;
      record.updatedAt = new Date();
    }
  });

  return { jobId, status: 'pending', isMemoryQueue: true };
};

/**
 * Retrieves the live status and result of a generation job
 * 
 * @param {string} jobId
 * @returns {Promise<{ jobId: string, status: string, progress: number, result: Object|null, error: string|null }>}
 */
const getJobStatus = async (jobId) => {
  // 1. Check in-memory store
  if (inMemoryJobs.has(jobId)) {
    const job = inMemoryJobs.get(jobId);
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    };
  }

  // 2. Check BullMQ if active
  const queue = getBullQueue();
  if (queue && isRedisAvailable()) {
    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState(); // 'waiting' | 'active' | 'completed' | 'failed'
      const statusMap = {
        waiting: 'pending',
        delayed: 'pending',
        active: 'generating',
        completed: 'completed',
        failed: 'failed',
      };

      return {
        jobId: job.id,
        status: statusMap[state] || state,
        progress: job.progress || (state === 'completed' ? 100 : 50),
        result: job.returnvalue || null,
        error: job.failedReason || null,
      };
    } catch (error) {
      logger.error(`Error querying BullMQ job status: ${error.message}`);
    }
  }

  return null;
};

module.exports = {
  addRoadmapGenerationJob,
  getJobStatus,
  QUEUE_NAME,
  inMemoryJobs,
};
