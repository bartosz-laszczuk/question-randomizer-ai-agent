/**
 * Get Qualifications Tool
 *
 * Retrieves all qualifications for the user.
 */

import { getQualificationsSchema } from '../schemas/qualification.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';

/**
 * Tool definition for Claude SDK
 */
export const getQualificationsTool = {
  name: 'get_qualifications',
  description: `Get all job qualifications for the user.

  Use this tool to:
  - List all available qualifications (roles)
  - View qualification details (name, description)
  - Check question counts per qualification

  Returns an array of qualification objects sorted by name.`,

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
      const validated = getQualificationsSchema.parse(input);

      logger.debug(
        { userId: context.userId },
        'Getting qualifications via tool'
      );

      // Get qualifications from Firestore (userId filtering handled by service)
      const qualifications = await firestoreService.getQualifications(
        context.userId,
        removeUndefined({
          limit: validated.limit,
          offset: validated.offset,
        }) as { limit?: number; offset?: number }
      );

      logger.info(
        { userId: context.userId, count: qualifications.length },
        'Qualifications retrieved via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                count: qualifications.length,
                qualifications: qualifications.map((q) => ({
                  id: q.id,
                  name: q.name,
                  description: q.description,
                  isActive: q.isActive,
                  questionCount: q.questionCount,
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
        'Failed to get qualifications via tool'
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
