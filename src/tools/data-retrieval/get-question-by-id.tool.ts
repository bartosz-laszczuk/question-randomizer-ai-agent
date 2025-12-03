/**
 * Get Question By ID Tool
 *
 * Retrieves a specific question by its ID.
 */

import { getQuestionByIdSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';

/**
 * Tool definition for Claude SDK
 */
export const getQuestionByIdTool = {
  name: 'get_question_by_id',
  description: `Get a specific interview question by its ID.

  Use this tool to:
  - View details of a specific question
  - Verify a question exists before updating/deleting
  - Get full question details including metadata

  Returns the complete question object.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      questionId: {
        type: 'string',
        description: 'The ID of the question to retrieve',
      },
    },
    required: ['questionId'],
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = getQuestionByIdSchema.parse(input);

      logger.debug(
        { userId: context.userId, questionId: validated.questionId },
        'Getting question by ID via tool'
      );

      // Get question from Firestore (userId verification handled by service)
      const question = await firestoreService.getQuestionById(
        context.userId,
        validated.questionId
      );

      logger.info(
        { userId: context.userId, questionId: validated.questionId },
        'Question retrieved via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                question: {
                  id: question.id,
                  questionText: question.questionText,
                  categoryId: question.categoryId,
                  qualificationId: question.qualificationId,
                  difficulty: question.difficulty,
                  isActive: question.isActive,
                  isFavorite: question.isFavorite,
                  tags: question.tags,
                  notes: question.notes,
                  createdAt: question.createdAt.toDate().toISOString(),
                  updatedAt: question.updatedAt.toDate().toISOString(),
                  timesUsed: question.timesUsed,
                  lastUsedAt: question.lastUsedAt
                    ? question.lastUsedAt.toDate().toISOString()
                    : null,
                },
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
        'Failed to get question by ID via tool'
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
