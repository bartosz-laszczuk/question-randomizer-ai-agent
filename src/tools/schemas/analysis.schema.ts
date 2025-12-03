/**
 * Analysis Schemas for Agent Tools
 *
 * Zod schemas for analysis-related tool inputs.
 */

import { z } from 'zod';

/**
 * Find duplicate questions schema
 */
export const findDuplicatesSchema = z.object({
  similarityThreshold: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.8)
    .describe(
      'Similarity threshold (0-1) for considering questions as duplicates. Higher = more strict. Default: 0.8'
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Maximum number of duplicate groups to return'),
});

/**
 * Analyze question difficulty schema
 */
export const analyzeQuestionDifficultySchema = z.object({
  questionId: z
    .string()
    .optional()
    .describe(
      'Specific question ID to analyze (if not provided, analyzes all questions)'
    ),
  categoryId: z
    .string()
    .optional()
    .describe('Analyze only questions in this category'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Maximum number of questions to analyze'),
});
