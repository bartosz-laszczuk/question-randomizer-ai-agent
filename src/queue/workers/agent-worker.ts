/**
 * Agent Worker
 *
 * BullMQ worker for processing agent tasks asynchronously.
 */

import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../../config/redis.config.js';
import { env } from '../../config/environment.js';
import { createAgentExecutor } from '../../agent/agent-executor.js';
import { taskTrackerService } from '../../services/task-tracker.service.js';
import logger from '../../utils/logger.js';
import {
  AGENT_TASK_QUEUE_NAME,
  type AgentTaskJobData,
  type AgentTaskJobResult,
} from '../task-queue.js';

/**
 * Process agent task job
 */
async function processAgentTask(
  job: Job<AgentTaskJobData, AgentTaskJobResult>
): Promise<AgentTaskJobResult> {
  const { task, userId, conversationId, metadata } = job.data;
  const jobId = job.id!;
  const attemptNumber = job.attemptsMade;

  logger.info(
    { jobId, userId, attempt: attemptNumber },
    'Processing agent task job'
  );

  try {
    // Update progress
    await job.updateProgress({ status: 'starting', progress: 0 });

    // Mark task as processing in Firestore
    if (metadata && 'taskId' in metadata && typeof metadata['taskId'] === 'string') {
      await taskTrackerService.markTaskProcessing(metadata['taskId']);
    }

    // Create agent executor
    const executor = createAgentExecutor();

    // Build task input
    const taskInput: Parameters<typeof executor.executeTask>[0] = {
      task,
      userId,
    };

    if (conversationId) {
      taskInput.conversationId = conversationId;
    }

    if (metadata) {
      taskInput.metadata = metadata;
    }

    // Update progress
    await job.updateProgress({ status: 'executing', progress: 25 });

    // Execute task
    const result = await executor.executeTask(taskInput);

    // Update progress
    await job.updateProgress({ status: 'finalizing', progress: 75 });

    // Mark task as completed in Firestore
    if (metadata && 'taskId' in metadata && typeof metadata['taskId'] === 'string') {
      await taskTrackerService.markTaskCompleted(
        metadata['taskId'],
        result
      );
    }

    // Update progress
    await job.updateProgress({ status: 'completed', progress: 100 });

    logger.info(
      {
        jobId,
        userId,
        taskId: result.taskId,
        toolsUsed: result.toolsUsed,
        durationMs: result.durationMs,
      },
      'Agent task job completed'
    );

    const jobResult: AgentTaskJobResult = {
      taskId: result.taskId,
      result: result.result,
      toolsUsed: result.toolsUsed,
      iterations: result.iterations,
      durationMs: result.durationMs,
    };

    if (result.tokensUsed) {
      jobResult.tokensUsed = result.tokensUsed;
    }

    return jobResult;
  } catch (error) {
    logger.error(
      {
        err: error,
        jobId,
        userId,
        attempt: attemptNumber,
      },
      'Agent task job failed'
    );

    // Mark task as failed in Firestore if this is the last attempt
    if (metadata && 'taskId' in metadata && typeof metadata['taskId'] === 'string' && attemptNumber >= env.QUEUE_MAX_RETRIES) {
      await taskTrackerService.markTaskFailed(
        metadata['taskId'],
        error as Error,
        attemptNumber
      );
    }

    throw error;
  }
}

/**
 * Create and start agent worker
 */
export function createAgentWorker(): Worker<AgentTaskJobData, AgentTaskJobResult> {
  const connection = createRedisConnection('worker');

  const worker = new Worker<AgentTaskJobData, AgentTaskJobResult>(
    AGENT_TASK_QUEUE_NAME,
    processAgentTask,
    {
      connection,
      concurrency: env.QUEUE_CONCURRENCY,
      limiter: {
        max: 10, // Max 10 jobs per duration
        duration: 1000, // Per 1 second
      },
    }
  );

  // Worker event handlers
  worker.on('ready', () => {
    logger.info(
      { concurrency: env.QUEUE_CONCURRENCY },
      'Agent worker ready'
    );
  });

  worker.on('active', (job) => {
    logger.info({ jobId: job.id }, 'Job started');
  });

  worker.on('completed', (job, result) => {
    logger.info(
      {
        jobId: job.id,
        taskId: result.taskId,
        durationMs: result.durationMs,
      },
      'Job completed successfully'
    );
  });

  worker.on('failed', (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        err: error,
        attemptsMade: job?.attemptsMade,
        attemptsLeft: job ? job.opts.attempts! - job.attemptsMade : 0,
      },
      'Job failed'
    );
  });

  worker.on('error', (error) => {
    logger.error({ err: error }, 'Worker error');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Job stalled');
  });

  return worker;
}

/**
 * Shared worker instance
 */
let workerInstance: Worker<AgentTaskJobData, AgentTaskJobResult> | null = null;

/**
 * Start the agent worker
 */
export function startAgentWorker(): Worker<AgentTaskJobData, AgentTaskJobResult> {
  if (workerInstance) {
    logger.warn('Agent worker already running');
    return workerInstance;
  }

  workerInstance = createAgentWorker();
  logger.info('Agent worker started');

  return workerInstance;
}

/**
 * Stop the agent worker
 */
export async function stopAgentWorker(): Promise<void> {
  if (!workerInstance) {
    logger.warn('Agent worker not running');
    return;
  }

  try {
    await workerInstance.close();
    workerInstance = null;
    logger.info('Agent worker stopped');
  } catch (error) {
    logger.error({ err: error }, 'Error stopping agent worker');
    throw error;
  }
}

/**
 * Get worker instance
 */
export function getWorkerInstance(): Worker<AgentTaskJobData, AgentTaskJobResult> | null {
  return workerInstance;
}
