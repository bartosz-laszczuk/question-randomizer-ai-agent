/**
 * Find Duplicate Questions Tool
 *
 * Finds potential duplicate questions based on text similarity.
 */

import { findDuplicatesSchema } from '../schemas/analysis.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';

/**
 * Calculate simple text similarity (Jaccard similarity on words)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  );
  const words2 = new Set(
    text2.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  );

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Tool definition for Claude SDK
 */
export const findDuplicateQuestionsTool = {
  name: 'find_duplicate_questions',
  description: `Find potential duplicate questions based on text similarity.

  Use this tool to:
  - Identify questions that are very similar
  - Clean up duplicate questions
  - Find questions that might need merging

  Uses text similarity analysis to find duplicates.
  Returns groups of similar questions with similarity scores.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      similarityThreshold: {
        type: 'number',
        description:
          'Similarity threshold (0-1) for duplicates. Higher = more strict. Default: 0.8',
        minimum: 0,
        maximum: 1,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of duplicate groups to return (default: 50)',
        minimum: 1,
        maximum: 100,
      },
    },
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = findDuplicatesSchema.parse(input);

      logger.debug(
        {
          userId: context.userId,
          threshold: validated.similarityThreshold,
        },
        'Finding duplicate questions via tool'
      );

      // Get all active questions
      const questions = await firestoreService.getQuestions(
        context.userId,
        { isActive: true },
        { limit: 500 } // Limit to prevent performance issues
      );

      // Find duplicates
      const duplicateGroups: Array<{
        questions: Array<{
          id: string;
          questionText: string;
          categoryId?: string | null;
        }>;
        similarity: number;
      }> = [];

      // Compare each question with every other question
      for (let i = 0; i < questions.length; i++) {
        for (let j = i + 1; j < questions.length; j++) {
          const similarity = calculateSimilarity(
            questions[i]!.questionText,
            questions[j]!.questionText
          );

          if (similarity >= validated.similarityThreshold) {
            duplicateGroups.push({
              questions: [
                {
                  id: questions[i]!.id,
                  questionText: questions[i]!.questionText,
                  ...(questions[i]!.categoryId !== undefined && {
                    categoryId: questions[i]!.categoryId,
                  }),
                },
                {
                  id: questions[j]!.id,
                  questionText: questions[j]!.questionText,
                  ...(questions[j]!.categoryId !== undefined && {
                    categoryId: questions[j]!.categoryId,
                  }),
                },
              ],
              similarity: Math.round(similarity * 100) / 100,
            });
          }
        }
      }

      // Sort by similarity (highest first) and apply limit
      duplicateGroups.sort((a, b) => b.similarity - a.similarity);
      const limitedGroups = duplicateGroups.slice(0, validated.limit);

      logger.info(
        { userId: context.userId, duplicateCount: limitedGroups.length },
        'Duplicate search completed via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                totalQuestions: questions.length,
                duplicateGroups: limitedGroups.length,
                threshold: validated.similarityThreshold,
                duplicates: limitedGroups,
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
        'Failed to find duplicates via tool'
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
