/**
 * Update Question Tool
 *
 * Updates an existing interview question.
 */

import { updateQuestionSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';
import { UpdateQuestionInput } from '../../models/entities/question.entity.js';

/**
 * Tool definition for Claude SDK
 */
export const updateQuestionTool = {
  name: 'update_question',
  description: `Update an existing interview question.

  Use this tool to:
  - Modify question text
  - Change category or qualification
  - Update difficulty, tags, or notes
  - Toggle favorite or active status

  All fields except questionId are optional.
  Returns the updated question object.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      questionId: {
        type: 'string',
        description: 'ID of the question to update',
      },
      questionText: {
        type: 'string',
        description: 'Updated question text (5-2000 characters)',
        minLength: 5,
        maxLength: 2000,
      },
      categoryId: {
        type: 'string',
        description: 'Updated category ID (use null to remove category)',
      },
      qualificationId: {
        type: 'string',
        description: 'Updated qualification ID (use null to remove qualification)',
      },
      difficulty: {
        type: 'string',
        enum: ['Easy', 'Medium', 'Hard'],
        description: 'Updated difficulty level',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Updated tags',
      },
      notes: {
        type: 'string',
        description: 'Updated notes (use null to clear)',
      },
      isFavorite: {
        type: 'boolean',
        description: 'Updated favorite status',
      },
      isActive: {
        type: 'boolean',
        description: 'Updated active status',
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
      const validated = updateQuestionSchema.parse(input);

      logger.debug(
        { userId: context.userId, questionId: validated.questionId },
        'Updating question via tool'
      );

      // Extract questionId and prepare updates
      const { questionId, ...updates } = validated;

      // Update question in Firestore
      const question = await firestoreService.updateQuestion(
        context.userId,
        questionId,
        removeUndefined(updates) as UpdateQuestionInput
      );

      logger.info(
        { userId: context.userId, questionId },
        'Question updated via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Question updated successfully',
                question: {
                  id: question.id,
                  questionText: question.questionText,
                  categoryId: question.categoryId,
                  qualificationId: question.qualificationId,
                  difficulty: question.difficulty,
                  tags: question.tags,
                  notes: question.notes,
                  isFavorite: question.isFavorite,
                  isActive: question.isActive,
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
        'Failed to update question via tool'
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
