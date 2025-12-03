/**
 * Delete Question Tool
 *
 * Soft deletes a question (sets isActive = false).
 */

import { deleteQuestionSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';

/**
 * Tool definition for Claude SDK
 */
export const deleteQuestionTool = {
  name: 'delete_question',
  description: `Delete an interview question (soft delete).

  Use this tool to:
  - Remove questions from active use
  - Mark questions as inactive (soft delete - data is preserved)
  - Clean up unwanted or duplicate questions

  Note: This performs a soft delete (sets isActive = false).
  The question is not permanently removed from the database.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      questionId: {
        type: 'string',
        description: 'ID of the question to delete',
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
      const validated = deleteQuestionSchema.parse(input);

      logger.debug(
        { userId: context.userId, questionId: validated.questionId },
        'Deleting question via tool'
      );

      // Delete question from Firestore (soft delete)
      await firestoreService.deleteQuestion(
        context.userId,
        validated.questionId
      );

      logger.info(
        { userId: context.userId, questionId: validated.questionId },
        'Question deleted via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Question deleted successfully (soft delete)',
                questionId: validated.questionId,
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
        'Failed to delete question via tool'
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
