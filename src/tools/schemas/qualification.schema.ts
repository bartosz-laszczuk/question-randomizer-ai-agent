/**
 * Qualification Schemas for Agent Tools
 *
 * Zod schemas for qualification-related tool inputs.
 */

import { z } from 'zod';

/**
 * Get qualifications schema
 */
export const getQualificationsSchema = z.object({
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
 * Create qualification schema
 */
export const createQualificationSchema = z.object({
  name: z
    .string()
    .min(1, 'Qualification name is required')
    .max(200, 'Qualification name must be less than 200 characters')
    .describe('Qualification name (e.g., "Senior Software Engineer")'),
  description: z
    .string()
    .optional()
    .nullable()
    .describe('Qualification description (optional)'),
});

/**
 * Update qualification schema
 */
export const updateQualificationSchema = z.object({
  qualificationId: z.string().min(1).describe('Qualification ID to update'),
  name: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe('Updated qualification name'),
  description: z
    .string()
    .optional()
    .nullable()
    .describe('Updated description'),
  isActive: z.boolean().optional().describe('Updated active status'),
});
