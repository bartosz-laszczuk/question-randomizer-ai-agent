/**
 * Anthropic Claude SDK Configuration
 *
 * Initializes and exports Anthropic client for agent execution.
 */

import Anthropic from '@anthropic-ai/sdk';
import { env } from './environment.js';
import logger from '../utils/logger.js';

/**
 * Anthropic client instance
 *
 * Use this for all Claude API calls.
 */
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  maxRetries: 3, // Retry failed API calls up to 3 times
  timeout: env.AGENT_TIMEOUT_MS, // Timeout for API calls
});

/**
 * Claude model configuration
 */
export const CLAUDE_CONFIG = {
  /**
   * Model to use for agent execution
   * claude-sonnet-4-5-20250929 - Latest Sonnet 4.5 model
   */
  MODEL: 'claude-sonnet-4-5-20250929' as const,

  /**
   * Maximum tokens for agent responses
   */
  MAX_TOKENS: 4096,

  /**
   * Temperature (0 = deterministic, 1 = creative)
   * Use 0 for data operations to ensure consistency
   */
  TEMPERATURE: 0,

  /**
   * Maximum iterations for agent loop
   * Prevents infinite loops
   */
  MAX_ITERATIONS: 20,

  /**
   * System prompt for the agent
   */
  SYSTEM_PROMPT: `You are an AI assistant that helps manage interview questions in a Firestore database.

You have access to tools that can:
- Read questions, categories, and qualifications
- Create new questions, categories, and qualifications
- Update existing data
- Analyze questions for duplicates and difficulty
- Perform batch operations

Important guidelines:
1. Always filter operations by userId - never access other users' data
2. When categorizing questions, analyze the content carefully
3. For batch operations, provide progress updates
4. If you're unsure, ask for clarification before making changes
5. Be concise and clear in your responses

Remember: All operations are scoped to the current user's data only.`,
} as const;

/**
 * Helper to verify Anthropic API connection
 */
export async function verifyAnthropicConnection(): Promise<boolean> {
  try {
    // Make a minimal API call to verify credentials
    // We don't actually send a message, just test the connection
    logger.debug('Verifying Anthropic API connection...');

    // Note: There's no simple "ping" endpoint, so we just check if the client is configured
    // Actual verification will happen when we make our first API call
    const hasApiKey = !!env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.startsWith('sk-ant-');

    if (hasApiKey) {
      logger.debug('Anthropic API key configured correctly');
      return true;
    }

    logger.warn('Anthropic API key not configured or invalid');
    return false;
  } catch (error) {
    logger.error({ err: error }, 'Anthropic API verification failed');
    return false;
  }
}

logger.info('✅ Anthropic client initialized');
