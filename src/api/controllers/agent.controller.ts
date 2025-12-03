/**
 * Agent Controller
 *
 * Handles HTTP requests for agent task execution.
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { createAgentExecutor } from '../../agent/agent-executor.js';
import { createSSEManager } from '../../agent/streaming/sse-manager.js';
import { agentTaskRequestSchema } from '../../models/dtos/agent-request.dto.js';
import { TaskStatus } from '../../models/dtos/agent-response.dto.js';
import { ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import { enqueueAgentTask } from '../../queue/task-queue.js';
import { taskTrackerService } from '../../services/task-tracker.service.js';

/**
 * Execute agent task (synchronous)
 *
 * POST /agent/task
 */
export async function executeAgentTask(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request body
    const validated = agentTaskRequestSchema.parse(req.body);

    logger.info(
      { userId: validated.userId, task: validated.task.substring(0, 100) },
      'Received agent task request'
    );

    // Create agent executor
    const executor = createAgentExecutor();

    // Build task input
    const taskInput: Parameters<typeof executor.executeTask>[0] = {
      task: validated.task,
      userId: validated.userId,
    };

    if (validated.context?.conversationId) {
      taskInput.conversationId = validated.context.conversationId;
    }

    if (validated.context?.additionalInstructions) {
      taskInput.metadata = {
        additionalInstructions: validated.context.additionalInstructions,
      };
    }

    // Execute task
    const result = await executor.executeTask(taskInput);

    logger.info(
      {
        userId: validated.userId,
        taskId: result.taskId,
        toolsUsed: result.toolsUsed,
        durationMs: result.durationMs,
      },
      'Agent task completed successfully'
    );

    // Return result
    res.status(200).json({
      success: true,
      taskId: result.taskId,
      result: result.result,
      metadata: {
        toolsUsed: result.toolsUsed,
        iterations: result.iterations,
        durationMs: result.durationMs,
        tokensUsed: result.tokensUsed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Agent task execution failed');

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: (error as Error).message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Execute agent task with streaming (Server-Sent Events)
 *
 * POST /agent/task/stream
 */
export async function executeAgentTaskStreaming(
  req: Request,
  res: Response
): Promise<void> {
  const clientId = randomUUID();
  const sseManager = createSSEManager(res, clientId);

  try {
    // Validate request body
    const validated = agentTaskRequestSchema.parse(req.body);

    logger.info(
      { userId: validated.userId, task: validated.task.substring(0, 100), clientId },
      'Received streaming agent task request'
    );

    // Create agent executor
    const executor = createAgentExecutor();

    // Build task input
    const taskInput: Parameters<typeof executor.executeTask>[0] = {
      task: validated.task,
      userId: validated.userId,
    };

    if (validated.context?.conversationId) {
      taskInput.conversationId = validated.context.conversationId;
    }

    if (validated.context?.additionalInstructions) {
      taskInput.metadata = {
        additionalInstructions: validated.context.additionalInstructions,
      };
    }

    // Execute task with streaming
    await executor.executeTask(taskInput, sseManager);

    logger.info(
      { userId: validated.userId, clientId },
      'Streaming agent task completed successfully'
    );

    // SSE connection is closed by executor
  } catch (error) {
    logger.error({ err: error, clientId }, 'Streaming agent task execution failed');

    // Send error event if connection still open
    if (!sseManager.closed) {
      if (error instanceof ValidationError) {
        sseManager.sendError(error.message, 'VALIDATION_ERROR');
      } else {
        sseManager.sendError((error as Error).message, 'EXECUTION_ERROR');
      }
      sseManager.close();
    }
  }
}

/**
 * Queue agent task for async processing
 *
 * POST /agent/task/queue
 */
export async function queueAgentTask(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request body
    const validated = agentTaskRequestSchema.parse(req.body);

    logger.info(
      { userId: validated.userId, task: validated.task.substring(0, 100) },
      'Received queue agent task request'
    );

    // Generate task ID
    const taskId = randomUUID();

    // Create task record in Firestore
    await taskTrackerService.createTask(
      taskId,
      validated.userId,
      validated.task
    );

    // Build task input
    const taskInput: Parameters<typeof enqueueAgentTask>[0] = {
      task: validated.task,
      userId: validated.userId,
      metadata: {
        taskId,
      },
    };

    if (validated.context?.conversationId) {
      taskInput.conversationId = validated.context.conversationId;
    }

    if (validated.context?.additionalInstructions) {
      taskInput.metadata = {
        ...taskInput.metadata,
        additionalInstructions: validated.context.additionalInstructions,
      };
    }

    // Enqueue task
    const jobId = await enqueueAgentTask(taskInput);

    logger.info(
      { userId: validated.userId, taskId, jobId },
      'Agent task queued successfully'
    );

    // Return accepted response
    res.status(202).json({
      success: true,
      taskId,
      jobId,
      status: TaskStatus.PENDING,
      message: 'Task queued for processing',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Queue agent task failed');

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'QUEUE_ERROR',
        message: (error as Error).message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get task status
 *
 * GET /agent/task/:taskId
 */
export async function getTaskStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const taskId = req.params['taskId'];

    if (!taskId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Task ID is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.debug({ taskId }, 'Getting task status');

    // Get task from Firestore
    const task = await taskTrackerService.getTask(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task ${taskId} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Return task status
    const response: Record<string, unknown> = {
      success: true,
      taskId: task.taskId,
      status: task.status,
      createdAt: task.createdAt.toDate().toISOString(),
      updatedAt: task.updatedAt.toDate().toISOString(),
    };

    if (task.result) {
      response['result'] = task.result;
    }

    if (task.error) {
      response['error'] = task.error;
    }

    if (task.metadata) {
      response['metadata'] = task.metadata;
    }

    if (task.completedAt) {
      response['completedAt'] = task.completedAt.toDate().toISOString();
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error({ err: error }, 'Get task status failed');

    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: (error as Error).message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Health check for agent service
 *
 * GET /agent/health
 */
export async function agentHealthCheck(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    // Simple health check - verify we can create an executor
    createAgentExecutor();

    res.status(200).json({
      status: 'healthy',
      service: 'agent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Agent health check failed');

    res.status(503).json({
      status: 'unhealthy',
      service: 'agent',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
