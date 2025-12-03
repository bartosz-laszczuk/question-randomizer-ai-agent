/**
 * Common Schemas for Agent Tools
 *
 * Shared Zod schemas used across multiple tools.
 */

import { z } from 'zod';

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of results to return (1-100)'),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Number of results to skip'),
});

/**
 * Order by schema
 */
export const orderBySchema = z.object({
  field: z
    .string()
    .optional()
    .describe('Field to order by (e.g., "createdAt", "name")'),
  direction: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort direction (ascending or descending)'),
});

/**
 * ID schema
 */
export const idSchema = z
  .string()
  .min(1)
  .describe('Document ID in Firestore');
