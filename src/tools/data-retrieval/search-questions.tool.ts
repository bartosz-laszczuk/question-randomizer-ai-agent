/**
 * Search Questions Tool
 *
 * Searches for questions by text (full-text search).
 */

import { searchQuestionsSchema } from '../schemas/question.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';

/**
 * Tool definition for Claude SDK
 */
export const searchQuestionsTool = {
  name: 'search_questions',
  description: `Search for questions by text.

  Use this tool to:
  - Find questions containing specific keywords
  - Search in question text, notes, and tags
  - Locate questions matching a topic or theme

  Searches are case-insensitive and match partial text.
  Returns matching question objects.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      searchText: {
        type: 'string',
        description: 'Text to search for in questions (min 1, max 200 characters)',
        minLength: 1,
        maxLength: 200,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (1-100, default: 50)',
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['searchText'],
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = searchQuestionsSchema.parse(input);

      logger.debug(
        { userId: context.userId, searchText: validated.searchText },
        'Searching questions via tool'
      );

      // Search questions in Firestore
      const questions = await firestoreService.searchQuestions(
        context.userId,
        validated.searchText,
        {
          limit: validated.limit,
        }
      );

      logger.info(
        { userId: context.userId, count: questions.length },
        'Questions search completed via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                searchText: validated.searchText,
                count: questions.length,
                questions: questions.map((q) => ({
                  id: q.id,
                  questionText: q.questionText,
                  categoryId: q.categoryId,
                  qualificationId: q.qualificationId,
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
        'Failed to search questions via tool'
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
