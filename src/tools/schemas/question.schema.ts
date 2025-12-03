/**
 * Question Schemas for Agent Tools
 *
 * Zod schemas for question-related tool inputs.
 */

import { z } from 'zod';
import { DifficultyLevel } from '../../models/entities/question.entity.js';

/**
 * Difficulty level schema
 */
export const difficultyLevelSchema = z
  .enum([DifficultyLevel.Easy, DifficultyLevel.Medium, DifficultyLevel.Hard])
  .describe('Question difficulty level');

/**
 * Get questions filter schema
 */
export const getQuestionsFilterSchema = z.object({
  categoryId: z
    .string()
    .optional()
    .nullable()
    .describe('Filter by category ID (null for uncategorized)'),
  qualificationId: z
    .string()
    .optional()
    .nullable()
    .describe('Filter by qualification ID'),
  difficulty: difficultyLevelSchema.optional().describe('Filter by difficulty'),
  isActive: z
    .boolean()
    .optional()
    .describe('Filter by active status (default: true)'),
  isFavorite: z
    .boolean()
    .optional()
    .describe('Filter by favorite status'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Maximum number of results'),
  offset: z.number().int().min(0).optional().describe('Number to skip'),
});

/**
 * Get question by ID schema
 */
export const getQuestionByIdSchema = z.object({
  questionId: z.string().min(1).describe('Question ID'),
});

/**
 * Search questions schema
 */
export const searchQuestionsSchema = z.object({
  searchText: z
    .string()
    .min(1)
    .max(200)
    .describe('Text to search for in questions'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Maximum number of results'),
});

/**
 * Create question schema
 */
export const createQuestionSchema = z.object({
  questionText: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(2000, 'Question must be less than 2000 characters')
    .describe('The question text'),
  categoryId: z
    .string()
    .optional()
    .nullable()
    .describe('Category ID (optional)'),
  qualificationId: z
    .string()
    .optional()
    .nullable()
    .describe('Qualification ID (optional)'),
  difficulty: difficultyLevelSchema
    .optional()
    .default(DifficultyLevel.Medium)
    .describe('Question difficulty level'),
  tags: z
    .array(z.string())
    .optional()
    .default([])
    .describe('Tags for categorization'),
  notes: z
    .string()
    .optional()
    .nullable()
    .describe('Additional notes about the question'),
  isFavorite: z
    .boolean()
    .optional()
    .default(false)
    .describe('Mark as favorite'),
});

/**
 * Update question schema
 */
export const updateQuestionSchema = z.object({
  questionId: z.string().min(1).describe('Question ID to update'),
  questionText: z
    .string()
    .min(5)
    .max(2000)
    .optional()
    .describe('Updated question text'),
  categoryId: z
    .string()
    .optional()
    .nullable()
    .describe('Updated category ID'),
  qualificationId: z
    .string()
    .optional()
    .nullable()
    .describe('Updated qualification ID'),
  difficulty: difficultyLevelSchema
    .optional()
    .describe('Updated difficulty level'),
  tags: z.array(z.string()).optional().describe('Updated tags'),
  notes: z.string().optional().nullable().describe('Updated notes'),
  isFavorite: z.boolean().optional().describe('Updated favorite status'),
  isActive: z.boolean().optional().describe('Updated active status'),
});

/**
 * Delete question schema
 */
export const deleteQuestionSchema = z.object({
  questionId: z.string().min(1).describe('Question ID to delete'),
});

/**
 * Update question category schema
 */
export const updateQuestionCategorySchema = z.object({
  questionId: z.string().min(1).describe('Question ID'),
  categoryId: z
    .string()
    .nullable()
    .describe('Category ID to assign (null to remove category)'),
});

/**
 * Batch update questions schema
 */
export const batchUpdateQuestionsSchema = z.object({
  updates: z
    .array(
      z.object({
        questionId: z.string().min(1).describe('Question ID'),
        categoryId: z.string().optional().nullable(),
        difficulty: difficultyLevelSchema.optional(),
        tags: z.array(z.string()).optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .min(1, 'At least one update is required')
    .max(50, 'Maximum 50 updates per batch')
    .describe('Array of question updates'),
});
