/**
 * Agent Executor
 *
 * Executes AI agent tasks using Claude SDK with tool calling.
 * Handles autonomous multi-step task execution.
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropic, CLAUDE_CONFIG } from '../config/anthropic.config.js';
import { env } from '../config/environment.js';
import { allTools } from '../tools/index.js';
import { AgentContext, createAgentContext } from './context/agent-context.js';
import { TimeoutError, AgentExecutionError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { randomUUID } from 'crypto';
import { SSEManager } from './streaming/sse-manager.js';
import {
  streamAgentResponse,
  streamToolResult,
  streamTaskCompletion,
  streamError,
} from './streaming/stream-formatter.js';

/**
 * Agent task input
 */
export interface AgentTaskInput {
  task: string;
  userId: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
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
 * Tool execution event for streaming
 */
export interface ToolExecutionEvent {
  type: 'tool_use' | 'thinking' | 'result';
  toolName?: string;
  input?: Record<string, unknown>;
  output?: string;
  thinking?: string;
  result?: string;
}

/**
 * Agent Executor Class
 *
 * Orchestrates agent task execution with Claude SDK.
 */
export class AgentExecutor {
  private client: Anthropic;

  constructor(client?: Anthropic) {
    this.client = client || anthropic;
  }

  /**
   * Execute an agent task
   *
   * @param input - Task input with natural language task
   * @param sseManager - Optional SSE manager for streaming progress
   * @returns Execution result with output and metadata
   */
  async executeTask(
    input: AgentTaskInput,
    sseManager?: SSEManager
  ): Promise<AgentExecutionResult> {
    const taskId = randomUUID();
    const startTime = Date.now();
    let toolsUsed = 0;
    let iterations = 0;

    try {
      logger.info(
        { taskId, userId: input.userId, task: input.task.substring(0, 100) },
        'Starting agent task execution'
      );

      // Stream start event
      if (sseManager) {
        sseManager.sendProgress('Starting task execution...', 0);
      }

      // Create agent context
      const contextOptions: {
        conversationId?: string;
        metadata?: Record<string, unknown>;
      } = {};
      if (input.conversationId) {
        contextOptions.conversationId = input.conversationId;
      }
      if (input.metadata) {
        contextOptions.metadata = input.metadata;
      }
      const context = createAgentContext(taskId, input.userId, contextOptions);

      // Prepare messages
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: input.task,
        },
      ];

      // Execute agent loop with timeout
      const response = await this.executeWithTimeout(
        () => this.executeAgentLoop(context, messages, sseManager),
        env.AGENT_TIMEOUT_MS
      );

      // Track iterations and tools
      iterations = 1;
      toolsUsed = this.countToolUses(response);

      // Extract final text response
      const finalText = this.extractTextFromResponse(response);

      const durationMs = Date.now() - startTime;

      logger.info(
        {
          taskId,
          userId: input.userId,
          iterations,
          toolsUsed,
          durationMs,
        },
        'Agent task completed successfully'
      );

      const result: AgentExecutionResult = {
        taskId,
        result: finalText,
        toolsUsed,
        iterations,
        durationMs,
      };

      if (response.usage) {
        result.tokensUsed = {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        };
      }

      // Stream completion
      if (sseManager) {
        streamTaskCompletion(taskId, finalText, result, sseManager);
        sseManager.close();
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      logger.error(
        {
          err: error,
          taskId,
          userId: input.userId,
          iterations,
          toolsUsed,
          durationMs,
        },
        'Agent task execution failed'
      );

      // Stream error
      if (sseManager) {
        streamError(error as Error, taskId, sseManager);
        sseManager.close();
      }

      if (error instanceof TimeoutError) {
        throw error;
      }

      throw new AgentExecutionError(
        `Agent task execution failed: ${(error as Error).message}`,
        {
          taskId,
          iterations,
          toolsUsed,
          durationMs,
        }
      );
    }
  }

  /**
   * Execute agent loop with tool calling
   *
   * Handles multi-step execution with tools
   */
  private async executeAgentLoop(
    context: AgentContext,
    messages: Anthropic.MessageParam[],
    sseManager?: SSEManager
  ): Promise<Anthropic.Message> {
    const maxIterations = CLAUDE_CONFIG.MAX_ITERATIONS;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      logger.debug(
        { taskId: context.taskId, iteration },
        'Agent iteration starting'
      );

      // Call Claude API with tools
      const response = await this.client.messages.create({
        model: CLAUDE_CONFIG.MODEL,
        max_tokens: CLAUDE_CONFIG.MAX_TOKENS,
        temperature: CLAUDE_CONFIG.TEMPERATURE,
        system: CLAUDE_CONFIG.SYSTEM_PROMPT,
        messages,
        tools: this.prepareToolsForClaude(),
      });

      logger.debug(
        {
          taskId: context.taskId,
          iteration,
          stopReason: response.stop_reason,
          contentBlocks: response.content.length,
        },
        'Agent iteration completed'
      );

      // Stream agent response
      if (sseManager) {
        streamAgentResponse(response, sseManager);
      }

      // Check stop reason
      if (response.stop_reason === 'end_turn') {
        // Agent finished without tool use
        return response;
      }

      if (response.stop_reason === 'tool_use') {
        // Agent wants to use tools
        if (sseManager) {
          sseManager.sendProgress('Executing tools...', 50);
        }

        const toolResults = await this.executeTools(context, response, sseManager);

        // Add assistant response and tool results to conversation
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        messages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue loop to get next response
        continue;
      }

      if (response.stop_reason === 'max_tokens') {
        logger.warn(
          { taskId: context.taskId },
          'Agent hit max_tokens limit'
        );
        return response;
      }

      // Other stop reasons (stop_sequence, etc.)
      return response;
    }

    // Exceeded max iterations
    throw new AgentExecutionError(
      `Agent exceeded maximum iterations (${maxIterations})`,
      { taskId: context.taskId, maxIterations }
    );
  }

  /**
   * Execute tools requested by the agent
   */
  private async executeTools(
    context: AgentContext,
    response: Anthropic.Message,
    sseManager?: SSEManager
  ): Promise<Anthropic.ToolResultBlockParam[]> {
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        logger.debug(
          {
            taskId: context.taskId,
            toolName: block.name,
            toolId: block.id,
          },
          'Executing tool'
        );

        try {
          // Find the tool
          const tool = allTools.find((t) => t.name === block.name);

          if (!tool) {
            throw new Error(`Tool '${block.name}' not found`);
          }

          // Execute the tool
          const result = await tool.execute(block.input, context);

          logger.info(
            {
              taskId: context.taskId,
              toolName: block.name,
              toolId: block.id,
            },
            'Tool executed successfully'
          );

          // Stream tool result
          if (sseManager) {
            streamToolResult(block.name, block.id, result, sseManager);
          }

          // Add result
          const toolResult: Anthropic.ToolResultBlockParam = {
            type: 'tool_result',
            tool_use_id: block.id,
            content: result.content as unknown as string,
          };
          if (result.is_error !== undefined) {
            toolResult.is_error = result.is_error;
          }
          toolResults.push(toolResult);
        } catch (error) {
          logger.error(
            {
              err: error,
              taskId: context.taskId,
              toolName: block.name,
              toolId: block.id,
            },
            'Tool execution failed'
          );

          // Return error as tool result
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({
              success: false,
              error: (error as Error).message,
            }),
            is_error: true,
          });
        }
      }
    }

    return toolResults;
  }

  /**
   * Prepare tools in the format expected by Claude SDK
   */
  private prepareToolsForClaude(): Anthropic.Tool[] {
    return allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema as Anthropic.Tool.InputSchema,
    }));
  }

  /**
   * Count tool uses in a response
   */
  private countToolUses(response: Anthropic.Message): number {
    return response.content.filter((block) => block.type === 'tool_use')
      .length;
  }

  /**
   * Extract text content from response
   */
  private extractTextFromResponse(response: Anthropic.Message): string {
    const textBlocks = response.content.filter(
      (block) => block.type === 'text'
    );

    if (textBlocks.length === 0) {
      return 'Task completed (no text output)';
    }

    return textBlocks
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n\n');
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new TimeoutError(
                `Agent execution timed out after ${timeoutMs}ms`
              )
            ),
          timeoutMs
        )
      ),
    ]);
  }
}

/**
 * Create a new agent executor instance
 */
export function createAgentExecutor(client?: Anthropic): AgentExecutor {
  return new AgentExecutor(client);
}
