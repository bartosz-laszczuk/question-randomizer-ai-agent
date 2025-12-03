/**
 * Agent Response DTOs
 *
 * Data transfer objects for agent task responses.
 */

/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Agent task response (for synchronous execution)
 */
export interface AgentTaskResponse {
  /**
   * Task ID
   */
  taskId: string;

  /**
   * Task status
   */
  status: TaskStatus;

  /**
   * Agent's response/result
   */
  result?: string;

  /**
   * Error message if task failed
   */
  error?: string;

  /**
   * Metadata about the execution
   */
  metadata: {
    /**
     * Number of tools used
     */
    toolsUsed: number;

    /**
     * Execution duration in milliseconds
     */
    durationMs: number;

    /**
     * Number of agent iterations
     */
    iterations: number;

    /**
     * Token usage (if available)
     */
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
  };

  /**
   * Timestamp when task was created
   */
  createdAt: string;

  /**
   * Timestamp when task was completed/failed
   */
  completedAt?: string;
}

/**
 * Agent task queued response (for asynchronous execution)
 */
export interface AgentTaskQueuedResponse {
  /**
   * Task ID for tracking
   */
  taskId: string;

  /**
   * Initial status (always 'pending')
   */
  status: TaskStatus.PENDING;

  /**
   * Message to user
   */
  message: string;

  /**
   * Timestamp when task was queued
   */
  queuedAt: string;

  /**
   * Estimated time until completion (optional)
   */
  estimatedCompletionMs?: number;
}

/**
 * Agent task status response (for checking task status)
 */
export interface AgentTaskStatusResponse {
  /**
   * Task ID
   */
  taskId: string;

  /**
   * Current status
   */
  status: TaskStatus;

  /**
   * Progress percentage (0-100)
   */
  progress?: number;

  /**
   * Current progress message
   */
  progressMessage?: string;

  /**
   * Result if completed
   */
  result?: string;

  /**
   * Error if failed
   */
  error?: string;

  /**
   * Metadata
   */
  metadata?: {
    toolsUsed: number;
    durationMs: number;
    iterations: number;
  };

  /**
   * Timestamps
   */
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Batch task response
 */
export interface BatchTaskResponse {
  /**
   * Batch ID
   */
  batchId: string;

  /**
   * Array of task IDs
   */
  taskIds: string[];

  /**
   * Number of tasks queued
   */
  totalTasks: number;

  /**
   * Message to user
   */
  message: string;

  /**
   * Timestamp when batch was created
   */
  createdAt: string;
}

/**
 * Streaming event types for SSE
 */
export enum StreamEventType {
  PROGRESS = 'progress',
  TOOL_USE = 'tool_use',
  THINKING = 'thinking',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * Streaming event data
 */
export interface StreamEvent {
  /**
   * Event type
   */
  type: StreamEventType;

  /**
   * Event data
   */
  data:
    | {
        type: 'tool_use';
        toolName: string;
        input: Record<string, unknown>;
        output?: string;
      }
    | {
        type: 'thinking';
        content: string;
      }
    | {
        type: 'progress';
        message: string;
        progress?: number;
      }
    | {
        type: 'complete';
        taskId: string;
        result: string;
        metadata: AgentTaskResponse['metadata'];
      }
    | {
        type: 'error';
        message: string;
        code?: string;
      };

  /**
   * Timestamp
   */
  timestamp: string;
}
