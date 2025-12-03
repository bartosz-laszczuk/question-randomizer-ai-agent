/**
 * Agent Request DTOs
 *
 * Data transfer objects for agent task requests.
 */

import { z } from 'zod';

/**
 * Agent task request schema
 */
export const agentTaskRequestSchema = z.object({
  /**
   * Natural language task description
   * Example: "Categorize all uncategorized questions about JavaScript"
   */
  task: z.string().min(1, 'Task description is required').max(2000),

  /**
   * User ID for scoping operations
   */
  userId: z.string().min(1, 'User ID is required'),

  /**
   * Optional context to help the agent
   */
  context: z
    .object({
      /**
       * Previous conversation context
       */
      conversationId: z.string().optional(),

      /**
       * Additional context or instructions
       */
      additionalInstructions: z.string().optional(),
    })
    .optional(),
});

/**
 * Agent task request type
 */
export type AgentTaskRequest = z.infer<typeof agentTaskRequestSchema>;

/**
 * Agent task status request schema (for checking task status)
 */
export const agentTaskStatusRequestSchema = z.object({
  /**
   * Task ID to check status for
   */
  taskId: z.string().min(1, 'Task ID is required'),

  /**
   * User ID (for authorization)
   */
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Agent task status request type
 */
export type AgentTaskStatusRequest = z.infer<
  typeof agentTaskStatusRequestSchema
>;

/**
 * Batch operation request schema (for queueing multiple tasks)
 */
export const batchTaskRequestSchema = z.object({
  /**
   * Array of tasks to execute
   */
  tasks: z
    .array(agentTaskRequestSchema)
    .min(1, 'At least one task is required')
    .max(50, 'Maximum 50 tasks allowed per batch'),
});

/**
 * Batch task request type
 */
export type BatchTaskRequest = z.infer<typeof batchTaskRequestSchema>;
