/**
 * Agent Context
 *
 * Context passed to agent tools during execution.
 * Contains userId and other execution metadata.
 */

/**
 * Agent execution context
 *
 * CRITICAL: All tools must use context.userId to filter operations
 */
export interface AgentContext {
  /**
   * User ID for scoping all operations
   * CRITICAL: Must be used in all Firestore queries
   */
  userId: string;

  /**
   * Task ID for tracking
   */
  taskId: string;

  /**
   * Optional conversation ID for context
   */
  conversationId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Create agent context
 */
export function createAgentContext(
  userId: string,
  taskId: string,
  options?: {
    conversationId?: string;
    metadata?: Record<string, unknown>;
  }
): AgentContext {
  const context: AgentContext = {
    userId,
    taskId,
  };

  if (options?.conversationId) {
    context.conversationId = options.conversationId;
  }

  if (options?.metadata) {
    context.metadata = options.metadata;
  }

  return context;
}
