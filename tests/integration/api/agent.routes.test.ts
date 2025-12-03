/**
 * Agent Routes - Integration Tests
 */

import request from 'supertest';
import express, { type Application } from 'express';
import agentRoutes from '../../../src/api/routes/agent.routes.js';
import { errorHandler } from '../../../src/api/middleware/error-handler.js';

// Mock dependencies
jest.mock('../../../src/agent/agent-executor.js');
jest.mock('../../../src/services/task-tracker.service.js');
jest.mock('../../../src/queue/task-queue.js');

import { createAgentExecutor } from '../../../src/api/controllers/agent.controller.js';

describe('Agent Routes Integration', () => {
  let app: Application;

  beforeAll(() => {
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use(agentRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /agent/task', () => {
    it('should execute agent task synchronously', async () => {
      // Mock the agent executor
      const mockExecuteTask = jest.fn().mockResolvedValue({
        taskId: 'task-123',
        result: 'Task completed successfully',
        toolsUsed: 2,
        iterations: 1,
        durationMs: 1500,
      });

      (createAgentExecutor as jest.Mock) = jest.fn().mockReturnValue({
        executeTask: mockExecuteTask,
      });

      const response = await request(app)
        .post('/agent/task')
        .send({
          task: 'List my categories',
          userId: 'test-user-123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.taskId).toBe('task-123');
      expect(response.body.result).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should return 400 for invalid request', async () => {
      const response = await request(app)
        .post('/agent/task')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 500 on execution error', async () => {
      const mockExecuteTask = jest.fn().mockRejectedValue(
        new Error('Execution failed')
      );

      (createAgentExecutor as jest.Mock) = jest.fn().mockReturnValue({
        executeTask: mockExecuteTask,
      });

      const response = await request(app)
        .post('/agent/task')
        .send({
          task: 'List my categories',
          userId: 'test-user-123',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXECUTION_ERROR');
    });
  });

  describe('GET /agent/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/agent/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('agent');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /agent/task/queue', () => {
    it('should queue agent task for async processing', async () => {
      // Mock task tracker and queue
      const mockEnqueue = jest.fn().mockResolvedValue('job-123');

      jest.mock('../../../src/queue/task-queue.js', () => ({
        enqueueAgentTask: mockEnqueue,
      }));

      const response = await request(app)
        .post('/agent/task/queue')
        .send({
          task: 'Categorize all questions',
          userId: 'test-user-123',
        })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.taskId).toBeDefined();
      expect(response.body.status).toBe('pending');
    });
  });

  describe('GET /agent/task/:taskId', () => {
    it('should return task status', async () => {
      // Mock task tracker
      const mockTask = {
        taskId: 'task-123',
        userId: 'test-user-123',
        task: 'List categories',
        status: 'completed',
        result: 'Task completed',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        completedAt: { toDate: () => new Date() },
      };

      jest.mock('../../../src/services/task-tracker.service.js', () => ({
        taskTrackerService: {
          getTask: jest.fn().mockResolvedValue(mockTask),
        },
      }));

      const response = await request(app)
        .get('/agent/task/task-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.taskId).toBe('task-123');
      expect(response.body.status).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      jest.mock('../../../src/services/task-tracker.service.js', () => ({
        taskTrackerService: {
          getTask: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .get('/agent/task/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TASK_NOT_FOUND');
    });
  });
});
