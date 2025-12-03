/**
 * Task Queue
 *
 * BullMQ queue for async agent task processing.
 */

import { Queue, QueueEvents } from 'bullmq';
import { createRedisConnection } from '../config/redis.config.js';
import { env } from '../config/environment.js';
import logger from '../utils/logger.js';
import type { AgentTaskInput } from '../agent/agent-executor.js';

/**
 * Job data for agent tasks
 */
export interface AgentTaskJobData extends AgentTaskInput {
  // Additional job-specific fields if needed
}

/**
 * Job result for agent tasks
 */
export interface AgentTaskJobResult {
  taskId: string;
  result: string;
  toolsUsed: number;
  iterations: number;
  durationMs: number;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Queue name
 */
export const AGENT_TASK_QUEUE_NAME = 'agent-tasks';

/**
 * Create agent task queue
 */
export function createAgentTaskQueue(): Queue<AgentTaskJobData, AgentTaskJobResult> {
  const connection = createRedisConnection('queue');

  const queue = new Queue<AgentTaskJobData, AgentTaskJobResult>(
    AGENT_TASK_QUEUE_NAME,
    {
      connection,
      defaultJobOptions: {
        attempts: env.QUEUE_MAX_RETRIES + 1, // +1 for initial attempt
        backoff: {
          type: 'exponential',
          delay: 1000, // Start with 1 second
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    }
  );

  logger.info('Agent task queue created');

  return queue;
}

/**
 * Create queue events listener
 */
export function createQueueEvents(): QueueEvents {
  const connection = createRedisConnection('queue-events');

  const queueEvents = new QueueEvents(AGENT_TASK_QUEUE_NAME, {
    connection,
  });

  // Listen to queue events
  queueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'Job completed');
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'Job failed');
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    logger.debug({ jobId, progress: data }, 'Job progress');
  });

  logger.info('Queue events listener created');

  return queueEvents;
}

/**
 * Shared queue instance
 */
export const agentTaskQueue = createAgentTaskQueue();

/**
 * Shared queue events instance
 */
export const queueEvents = createQueueEvents();

/**
 * Add agent task to queue
 */
export async function enqueueAgentTask(
  taskInput: AgentTaskInput
): Promise<string> {
  try {
    const jobOptions: {
      jobId?: string;
    } = {};

    if (taskInput.metadata && 'taskId' in taskInput.metadata && typeof taskInput.metadata['taskId'] === 'string') {
      jobOptions.jobId = taskInput.metadata['taskId'];
    }

    const job = await agentTaskQueue.add('execute-agent-task', taskInput, jobOptions);

    logger.info(
      { jobId: job.id, userId: taskInput.userId },
      'Agent task enqueued'
    );

    return job.id!;
  } catch (error) {
    logger.error({ err: error, taskInput }, 'Failed to enqueue agent task');
    throw error;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  status: string;
  progress?: unknown;
  result?: AgentTaskJobResult;
  error?: string;
}> {
  try {
    const job = await agentTaskQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress;

    const result: {
      status: string;
      progress?: unknown;
      result?: AgentTaskJobResult;
      error?: string;
    } = {
      status: state,
    };

    if (progress) {
      result.progress = progress;
    }

    if (state === 'completed') {
      result.result = job.returnvalue;
    }

    if (state === 'failed') {
      result.error = job.failedReason;
    }

    return result;
  } catch (error) {
    logger.error({ err: error, jobId }, 'Failed to get job status');
    throw error;
  }
}

/**
 * Clean up old jobs (maintenance)
 */
export async function cleanupOldJobs(): Promise<void> {
  try {
    await agentTaskQueue.clean(24 * 3600 * 1000, 1000, 'completed'); // 24 hours
    await agentTaskQueue.clean(7 * 24 * 3600 * 1000, 100, 'failed'); // 7 days

    logger.info('Old jobs cleaned up');
  } catch (error) {
    logger.error({ err: error }, 'Failed to clean up old jobs');
  }
}

/**
 * Close queue connections gracefully
 */
export async function closeQueue(): Promise<void> {
  try {
    await agentTaskQueue.close();
    await queueEvents.close();
    logger.info('Queue connections closed');
  } catch (error) {
    logger.error({ err: error }, 'Error closing queue connections');
  }
}
