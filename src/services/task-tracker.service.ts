/**
 * Task Tracker Service
 *
 * Tracks agent task status in Firestore for queue processing.
 */

import { db } from '../config/firebase.config.js';
import { TaskStatus } from '../models/dtos/agent-response.dto.js';
import logger from '../utils/logger.js';
import type { AgentExecutionResult } from '../agent/agent-executor.js';

const COLLECTION_NAME = 'agent_tasks';

/**
 * Task record stored in Firestore
 */
export interface TaskRecord {
  taskId: string;
  userId: string;
  task: string;
  status: TaskStatus;
  result?: string;
  error?: {
    message: string;
    code?: string;
  };
  metadata?: {
    toolsUsed?: number;
    iterations?: number;
    durationMs?: number;
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
    retryCount?: number;
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp | null;
}

/**
 * Task Tracker Service
 *
 * Manages task status in Firestore for async queue processing.
 */
export class TaskTrackerService {
  /**
   * Create a new task record
   */
  async createTask(
    taskId: string,
    userId: string,
    task: string
  ): Promise<void> {
    try {
      const now = FirebaseFirestore.Timestamp.now();

      const taskRecord: TaskRecord = {
        taskId,
        userId,
        task,
        status: TaskStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection(COLLECTION_NAME).doc(taskId).set(taskRecord);

      logger.info({ taskId, userId }, 'Task record created');
    } catch (error) {
      logger.error({ err: error, taskId, userId }, 'Failed to create task record');
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: FirebaseFirestore.Timestamp.now(),
      };

      if (metadata !== undefined) {
        updateData['metadata'] = metadata;
      }

      if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
        updateData['completedAt'] = FirebaseFirestore.Timestamp.now();
      }

      await db.collection(COLLECTION_NAME).doc(taskId).update(updateData);

      logger.debug({ taskId, status }, 'Task status updated');
    } catch (error) {
      logger.error({ err: error, taskId, status }, 'Failed to update task status');
      throw error;
    }
  }

  /**
   * Mark task as processing
   */
  async markTaskProcessing(taskId: string): Promise<void> {
    await this.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
  }

  /**
   * Mark task as completed
   */
  async markTaskCompleted(
    taskId: string,
    result: AgentExecutionResult
  ): Promise<void> {
    try {
      const metadata: Record<string, unknown> = {
        toolsUsed: result.toolsUsed,
        iterations: result.iterations,
        durationMs: result.durationMs,
      };

      if (result.tokensUsed) {
        metadata['tokensUsed'] = result.tokensUsed;
      }

      const updateData: Record<string, unknown> = {
        status: TaskStatus.COMPLETED,
        result: result.result,
        metadata,
        updatedAt: FirebaseFirestore.Timestamp.now(),
        completedAt: FirebaseFirestore.Timestamp.now(),
      };

      await db.collection(COLLECTION_NAME).doc(taskId).update(updateData);

      logger.info({ taskId }, 'Task marked as completed');
    } catch (error) {
      logger.error({ err: error, taskId }, 'Failed to mark task as completed');
      throw error;
    }
  }

  /**
   * Mark task as failed
   */
  async markTaskFailed(
    taskId: string,
    error: Error,
    retryCount?: number
  ): Promise<void> {
    try {
      const updateData: Partial<TaskRecord> = {
        status: TaskStatus.FAILED,
        error: {
          message: error.message,
          code: error.name,
        },
        updatedAt: FirebaseFirestore.Timestamp.now(),
        completedAt: FirebaseFirestore.Timestamp.now(),
      };

      if (retryCount !== undefined) {
        updateData.metadata = {
          retryCount,
        };
      }

      await db.collection(COLLECTION_NAME).doc(taskId).update(updateData);

      logger.info({ taskId, errorMessage: error.message }, 'Task marked as failed');
    } catch (err) {
      logger.error({ err, taskId }, 'Failed to mark task as failed');
      throw err;
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<TaskRecord | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(taskId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as TaskRecord;
    } catch (error) {
      logger.error({ err: error, taskId }, 'Failed to get task');
      throw error;
    }
  }

  /**
   * Get tasks by user ID
   */
  async getTasksByUser(
    userId: string,
    limit = 50
  ): Promise<TaskRecord[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as TaskRecord);
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get tasks by user');
      throw error;
    }
  }

  /**
   * Delete old completed tasks (cleanup)
   */
  async deleteOldTasks(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffTimestamp = FirebaseFirestore.Timestamp.fromDate(cutoffDate);

      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('completedAt', '<', cutoffTimestamp)
        .where('status', 'in', [TaskStatus.COMPLETED, TaskStatus.FAILED])
        .limit(100)
        .get();

      // Delete in batch
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(
        { deletedCount: snapshot.size, daysOld },
        'Deleted old completed tasks'
      );

      return snapshot.size;
    } catch (error) {
      logger.error({ err: error, daysOld }, 'Failed to delete old tasks');
      throw error;
    }
  }
}

/**
 * Create a new task tracker service instance
 */
export function createTaskTrackerService(): TaskTrackerService {
  return new TaskTrackerService();
}

/**
 * Shared task tracker service instance
 */
export const taskTrackerService = createTaskTrackerService();
