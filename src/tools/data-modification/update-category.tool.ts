/**
 * Update Question Category Tool
 *
 * Assigns or removes a category from a question.
 */

import { updateQuestionCategorySchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';

/**
 * Tool definition for Claude SDK
 */
export const updateQuestionCategoryTool = {
  name: 'update_question_category',
  description: `Assign or remove a category from a question.

  Use this tool to:
  - Categorize questions
  - Move questions between categories
  - Remove category assignment (set to null)

  This is a shortcut for updating just the category field.
  Returns the updated question.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      questionId: {
        type: 'string',
        description: 'ID of the question to update',
      },
      categoryId: {
        type: ['string', 'null'],
        description: 'Category ID to assign (null to remove category)',
      },
    },
    required: ['questionId', 'categoryId'],
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = updateQuestionCategorySchema.parse(input);

      logger.debug(
        { userId: context.userId, questionId: validated.questionId, categoryId: validated.categoryId },
        'Updating question category via tool'
      );

      // Update question category in Firestore
      const question = await firestoreService.updateQuestion(
        context.userId,
        validated.questionId,
        {
          categoryId: validated.categoryId,
        }
      );

      logger.info(
        { userId: context.userId, questionId: validated.questionId },
        'Question category updated via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: validated.categoryId
                  ? 'Question category updated successfully'
                  : 'Question category removed successfully',
                question: {
                  id: question.id,
                  questionText: question.questionText,
                  categoryId: question.categoryId,
                  updatedAt: question.updatedAt.toDate().toISOString(),
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
        'Failed to update question category via tool'
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
