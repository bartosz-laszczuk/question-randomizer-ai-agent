/**
 * Get Uncategorized Questions Tool
 *
 * Retrieves questions that don't have a category assigned.
 */

import { z } from 'zod';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';

/**
 * Input schema
 */
const getUncategorizedSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Maximum number of results'),
  offset: z.number().int().min(0).optional().describe('Number to skip'),
});

/**
 * Tool definition for Claude SDK
 */
export const getUncategorizedQuestionsTool = {
  name: 'get_uncategorized_questions',
  description: `Get all questions that don't have a category assigned.

  Use this tool to:
  - Find questions that need categorization
  - Identify uncategorized questions before bulk categorizing
  - Clean up questions without categories

  Returns an array of uncategorized question objects.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results (1-100, default: 50)',
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip for pagination',
        minimum: 0,
      },
    },
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = getUncategorizedSchema.parse(input);

      logger.debug(
        { userId: context.userId },
        'Getting uncategorized questions via tool'
      );

      // Get uncategorized questions from Firestore
      const questions = await firestoreService.getUncategorizedQuestions(
        context.userId,
        removeUndefined({
          limit: validated.limit,
          offset: validated.offset,
        }) as { limit?: number; offset?: number }
      );

      logger.info(
        { userId: context.userId, count: questions.length },
        'Uncategorized questions retrieved via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                count: questions.length,
                questions: questions.map((q) => ({
                  id: q.id,
                  questionText: q.questionText,
                  difficulty: q.difficulty,
                  tags: q.tags,
                  notes: q.notes,
                  createdAt: q.createdAt.toDate().toISOString(),
                  updatedAt: q.updatedAt.toDate().toISOString(),
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error(
        { err: error, userId: context.userId },
        'Failed to get uncategorized questions via tool'
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: (error as Error).message,
            }),
          },
        ],
        is_error: true,
      };
    }
  },
};
