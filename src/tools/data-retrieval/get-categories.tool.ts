/**
 * Get Categories Tool
 *
 * Retrieves all categories for the user.
 */

import { getCategoriesSchema } from '../schemas/category.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';

/**
 * Tool definition for Claude SDK
 */
export const getCategoriesTool = {
  name: 'get_categories',
  description: `Get all question categories for the user.

  Use this tool to:
  - List all available categories
  - View category details (name, description, color, icon)
  - Check category order and question counts

  Returns an array of category objects sorted by order.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results (1-100)',
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip for pagination',
        minimum: 0,
      },
    },
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = getCategoriesSchema.parse(input);

      logger.debug(
        { userId: context.userId },
        'Getting categories via tool'
      );

      // Get categories from Firestore (userId filtering handled by service)
      const categories = await firestoreService.getCategories(
        context.userId,
        removeUndefined({
          limit: validated.limit,
          offset: validated.offset,
        }) as { limit?: number; offset?: number }
      );

      logger.info(
        { userId: context.userId, count: categories.length },
        'Categories retrieved via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                count: categories.length,
                categories: categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  description: c.description,
                  color: c.color,
                  icon: c.icon,
                  order: c.order,
                  isActive: c.isActive,
                  questionCount: c.questionCount,
                  createdAt: c.createdAt.toDate().toISOString(),
                  updatedAt: c.updatedAt.toDate().toISOString(),
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
        'Failed to get categories via tool'
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
