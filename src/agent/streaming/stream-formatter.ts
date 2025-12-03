/**
 * Stream Formatter
 *
 * Formats agent execution events for streaming via SSE.
 */

import Anthropic from '@anthropic-ai/sdk';
import { SSEManager } from './sse-manager.js';

/**
 * Format and stream agent response content
 */
export function streamAgentResponse(
  response: Anthropic.Message,
  sseManager: SSEManager
): void {
  for (const block of response.content) {
    if (block.type === 'text') {
      // Stream thinking/text content
      sseManager.sendThinking(block.text);
    } else if (block.type === 'tool_use') {
      // Stream tool use
      sseManager.sendToolUse(block.name, block.input);
    }
  }
}

/**
 * Format and stream tool result
 */
export function streamToolResult(
  toolName: string,
  toolId: string,
  result: { content: unknown; is_error?: boolean },
  sseManager: SSEManager
): void {
  // Extract text from result
  let resultText = 'Tool executed';

  if (Array.isArray(result.content)) {
    const textContent = result.content.find(
      (c: { type?: string; text?: string }) => c.type === 'text'
    );
    if (textContent && 'text' in textContent) {
      resultText = textContent.text as string;
    }
  }

  sseManager.sendToolUse(toolName, { toolId }, resultText);
}

/**
 * Format task completion for streaming
 */
export function streamTaskCompletion(
  taskId: string,
  result: string,
  metadata: {
    toolsUsed: number;
    iterations: number;
    durationMs: number;
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
  },
  sseManager: SSEManager
): void {
  sseManager.sendComplete({
    taskId,
    result,
    metadata,
  });
}

/**
 * Format error for streaming
 */
export function streamError(
  error: Error,
  _taskId?: string,
  sseManager?: SSEManager
): void {
  if (sseManager && !sseManager.closed) {
    sseManager.sendError(error.message, error.name);
  }
}
