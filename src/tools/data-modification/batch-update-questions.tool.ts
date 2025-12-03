/**
 * Batch Update Questions Tool
 *
 * Updates multiple questions at once (bulk operation).
 */

import { batchUpdateQuestionsSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';
import { DifficultyLevel } from '../../models/entities/question.entity.js';

/**
 * Tool definition for Claude SDK
 */
export const batchUpdateQuestionsTool = {
  name: 'batch_update_questions',
  description: `Update multiple questions at once (batch operation).

  Use this tool to:
  - Categorize multiple questions simultaneously
  - Update difficulty for multiple questions
  - Bulk edit tags or favorite status
  - Process up to 50 questions per batch

  This is more efficient than updating questions one by one.
  Returns the operation result with success/error counts.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      updates: {
        type: 'array',
        description: 'Array of question updates (1-50 updates)',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            questionId: {
              type: 'string',
              description: 'Question ID to update',
            },
            categoryId: {
              type: ['string', 'null'],
              description: 'Updated category ID',
            },
            difficulty: {
              type: 'string',
              enum: ['Easy', 'Medium', 'Hard'],
              description: 'Updated difficulty',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Updated tags',
            },
            isFavorite: {
              type: 'boolean',
              description: 'Updated favorite status',
            },
          },
          required: ['questionId'],
        },
      },
    },
    required: ['updates'],
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = batchUpdateQuestionsSchema.parse(input);

      logger.debug(
        { userId: context.userId, updateCount: validated.updates.length },
        'Batch updating questions via tool'
      );

      // Batch update questions in Firestore
      const result = await firestoreService.batchUpdateQuestions(
        context.userId,
        validated.updates.map((update) => ({
          questionId: update.questionId,
          data: removeUndefined({
            categoryId: update.categoryId,
            difficulty: update.difficulty as DifficultyLevel | undefined,
            tags: update.tags,
            isFavorite: update.isFavorite,
          }) as {
            categoryId?: string | null;
            difficulty?: DifficultyLevel;
            tags?: string[];
            isFavorite?: boolean;
          },
        }))
      );

      logger.info(
        {
          userId: context.userId,
          processedCount: result.processedCount,
          errorCount: result.errorCount,
        },
        'Batch update questions completed via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: result.success,
                message: result.success
                  ? `Successfully updated ${result.processedCount} questions`
                  : `Updated ${result.processedCount} questions with ${result.errorCount} errors`,
                processedCount: result.processedCount,
                errorCount: result.errorCount,
                errors: result.errors,
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
        'Failed to batch update questions via tool'
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
