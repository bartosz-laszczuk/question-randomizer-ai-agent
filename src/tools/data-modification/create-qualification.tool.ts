/**
 * Create Qualification Tool
 *
 * Creates a new job qualification/role.
 */

import { createQualificationSchema } from '../schemas/qualification.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';
import { CreateQualificationInput } from '../../models/entities/qualification.entity.js';

/**
 * Tool definition for Claude SDK
 */
export const createQualificationTool = {
  name: 'create_qualification',
  description: `Create a new job qualification/role.

  Use this tool to:
  - Add new qualifications (e.g., "Senior Software Engineer", "Frontend Developer")
  - Set qualification properties (name, description)
  - Organize questions by job role

  Returns the created qualification object with its ID.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description:
          'Qualification name (1-200 characters) - e.g., "Senior Software Engineer"',
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        description: 'Qualification description (optional)',
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
      const validated = createQualificationSchema.parse(input);

      logger.debug(
        { userId: context.userId, name: validated.name },
        'Creating qualification via tool'
      );

      // Create qualification in Firestore
      const qualification = await firestoreService.createQualification(
        context.userId,
        removeUndefined({
          userId: context.userId,
          name: validated.name,
          description: validated.description,
          isActive: true,
          questionCount: 0,
        }) as CreateQualificationInput
      );

      logger.info(
        { userId: context.userId, qualificationId: qualification.id },
        'Qualification created via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Qualification created successfully',
                qualification: {
                  id: qualification.id,
                  name: qualification.name,
                  description: qualification.description,
                  questionCount: qualification.questionCount,
                  createdAt: qualification.createdAt.toDate().toISOString(),
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
        'Failed to create qualification via tool'
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
