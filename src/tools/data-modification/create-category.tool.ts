/**
 * Create Category Tool
 *
 * Creates a new question category.
 */

import { createCategorySchema } from '../schemas/category.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';
import { CreateCategoryInput } from '../../models/entities/category.entity.js';

/**
 * Tool definition for Claude SDK
 */
export const createCategoryTool = {
  name: 'create_category',
  description: `Create a new question category.

  Use this tool to:
  - Add new categories for organizing questions
  - Set category properties (name, description, color, icon)
  - Define display order

  Returns the created category object with its ID.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Category name (1-100 characters)',
        minLength: 1,
        maxLength: 100,
      },
      description: {
        type: 'string',
        description: 'Category description (optional)',
      },
      color: {
        type: 'string',
        description: 'Hex color code (e.g., #FF5733) for UI display (optional)',
        pattern: '^#[0-9A-Fa-f]{6}$',
      },
      icon: {
        type: 'string',
        description: 'Icon name for UI display (optional)',
      },
      order: {
        type: 'number',
        description: 'Display order (default: 0)',
        minimum: 0,
      },
    },
    required: ['name'],
  },

  /**
   * Execute the tool
   */
  execute: async (input: unknown, context: AgentContext) => {
    try {
      // Validate input
      const validated = createCategorySchema.parse(input);

      logger.debug(
        { userId: context.userId, name: validated.name },
        'Creating category via tool'
      );

      // Create category in Firestore
      const category = await firestoreService.createCategory(
        context.userId,
        removeUndefined({
          userId: context.userId,
          name: validated.name,
          description: validated.description,
          color: validated.color,
          icon: validated.icon,
          order: validated.order,
          isActive: true,
          questionCount: 0,
        }) as CreateCategoryInput
      );

      logger.info(
        { userId: context.userId, categoryId: category.id },
        'Category created via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Category created successfully',
                category: {
                  id: category.id,
                  name: category.name,
                  description: category.description,
                  color: category.color,
                  icon: category.icon,
                  order: category.order,
                  questionCount: category.questionCount,
                  createdAt: category.createdAt.toDate().toISOString(),
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
        'Failed to create category via tool'
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
