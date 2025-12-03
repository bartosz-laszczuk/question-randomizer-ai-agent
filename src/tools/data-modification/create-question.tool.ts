/**
 * Create Question Tool
 *
 * Creates a new interview question.
 */

import { createQuestionSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';
import { CreateQuestionInput } from '../../models/entities/question.entity.js';

/**
 * Tool definition for Claude SDK
 */
export const createQuestionTool = {
  name: 'create_question',
  description: `Create a new interview question.

  Use this tool to:
  - Add new questions to the database
  - Set question properties (text, category, difficulty, tags)
  - Create questions with metadata (notes, favorite status)

  Returns the created question object with its ID.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      questionText: {
        type: 'string',
        description: 'The question text (5-2000 characters)',
        minLength: 5,
        maxLength: 2000,
      },
      categoryId: {
        type: 'string',
        description: 'Category ID (optional)',
      },
      qualificationId: {
        type: 'string',
        description: 'Qualification ID (optional)',
      },
      difficulty: {
        type: 'string',
        enum: ['Easy', 'Medium', 'Hard'],
        description: 'Difficulty level (default: Medium)',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization (optional)',
      },
      notes: {
        type: 'string',
        description: 'Additional notes (optional)',
      },
      isFavorite: {
        type: 'boolean',
        description: 'Mark as favorite (default: false)',
      },
    },
    required: ['questionText'],
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = createQuestionSchema.parse(input);

      logger.debug(
        { userId: context.userId, questionText: validated.questionText.substring(0, 50) },
        'Creating question via tool'
      );

      // Create question in Firestore
      const question = await firestoreService.createQuestion(
        context.userId,
        removeUndefined({
          userId: context.userId,
          questionText: validated.questionText,
          categoryId: validated.categoryId,
          qualificationId: validated.qualificationId,
          difficulty: validated.difficulty,
          tags: validated.tags,
          notes: validated.notes,
          isFavorite: validated.isFavorite,
          isActive: true,
        }) as CreateQuestionInput
      );

      logger.info(
        { userId: context.userId, questionId: question.id },
        'Question created via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Question created successfully',
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
                  createdAt: question.createdAt.toDate().toISOString(),
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
        'Failed to create question via tool'
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
