/**
 * Category Schemas for Agent Tools
 *
 * Zod schemas for category-related tool inputs.
 */

import { z } from 'zod';

/**
 * Get categories schema
 */
export const getCategoriesSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of results'),
  offset: z.number().int().min(0).optional().describe('Number to skip'),
});

/**
 * Create category schema
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .describe('Category name'),
  description: z
    .string()
    .optional()
    .nullable()
    .describe('Category description (optional)'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code (e.g., #FF5733)')
    .optional()
    .nullable()
    .describe('Hex color code for UI display'),
  icon: z
    .string()
    .optional()
    .nullable()
    .describe('Icon name for UI display'),
  order: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Display order'),
});

/**
 * Update category schema
 */
export const updateCategorySchema = z.object({
  categoryId: z.string().min(1).describe('Category ID to update'),
  name: z.string().min(1).max(100).optional().describe('Updated category name'),
  description: z
    .string()
    .optional()
    .nullable()
    .describe('Updated description'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable()
    .describe('Updated color'),
  icon: z.string().optional().nullable().describe('Updated icon'),
  order: z.number().int().min(0).optional().describe('Updated order'),
  isActive: z.boolean().optional().describe('Updated active status'),
});
