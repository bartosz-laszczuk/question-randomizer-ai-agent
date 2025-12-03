/**
 * Get Questions Tool
 *
 * Retrieves questions with optional filters.
 * Agent can use this to view user's questions.
 */

import { getQuestionsFilterSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import { removeUndefined } from '../../utils/validators.js';
import logger from '../../utils/logger.js';

/**
 * Tool definition for Claude SDK
 */
export const getQuestionsTool = {
  name: 'get_questions',
  description: `Get a list of interview questions with optional filters.

  Use this tool to:
  - View all questions for a user
  - Filter questions by category, qualification, difficulty
  - Find active or favorite questions
  - Get paginated results

  Returns an array of question objects with all details.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      categoryId: {
        type: 'string',
        description:
          'Filter by category ID. Use null to get uncategorized questions.',
      },
      qualificationId: {
        type: 'string',
        description: 'Filter by qualification ID',
      },
      difficulty: {
        type: 'string',
        enum: ['Easy', 'Medium', 'Hard'],
        description: 'Filter by difficulty level',
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by active status (default: true)',
      },
      isFavorite: {
        type: 'boolean',
        description: 'Filter by favorite status',
      },
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
      const validated = getQuestionsFilterSchema.parse(input);

      logger.debug(
        { userId: context.userId, filters: validated },
        'Getting questions via tool'
      );

      // Get questions from Firestore (userId filtering handled by service)
      const questions = await firestoreService.getQuestions(
        context.userId,
        removeUndefined({
          categoryId: validated.categoryId,
          qualificationId: validated.qualificationId,
          difficulty: validated.difficulty,
          isActive: validated.isActive,
          isFavorite: validated.isFavorite,
        }) as Parameters<typeof firestoreService.getQuestions>[1],
        removeUndefined({
          limit: validated.limit,
          offset: validated.offset,
        }) as Parameters<typeof firestoreService.getQuestions>[2]
      );

      logger.info(
        { userId: context.userId, count: questions.length },
        'Questions retrieved via tool'
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
                  categoryId: q.categoryId,
                  qualificationId: q.qualificationId,
                  difficulty: q.difficulty,
                  isActive: q.isActive,
                  isFavorite: q.isFavorite,
                  tags: q.tags,
                  notes: q.notes,
                  createdAt: q.createdAt.toDate().toISOString(),
                  updatedAt: q.updatedAt.toDate().toISOString(),
                  timesUsed: q.timesUsed,
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
        'Failed to get questions via tool'
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
