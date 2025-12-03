/**
 * Agent Routes
 *
 * API routes for agent task execution.
 */

import { Router } from 'express';
import {
  executeAgentTask,
  executeAgentTaskStreaming,
  queueAgentTask,
  getTaskStatus,
  agentHealthCheck,
} from '../controllers/agent.controller.js';

const router = Router();

/**
 * POST /agent/task
 * Execute an agent task (synchronous)
 */
router.post('/agent/task', executeAgentTask);

/**
 * POST /agent/task/stream
 * Execute an agent task with streaming progress (SSE)
 */
router.post('/agent/task/stream', executeAgentTaskStreaming);

/**
 * POST /agent/task/queue
 * Queue an agent task for async background processing
 */
router.post('/agent/task/queue', queueAgentTask);

/**
 * GET /agent/task/:taskId
 * Get task status
 */
router.get('/agent/task/:taskId', getTaskStatus);

/**
 * GET /agent/health
 * Agent service health check
 */
router.get('/agent/health', agentHealthCheck);

export default router;
