/**
 * Analyze Question Difficulty Tool
 *
 * Analyzes question complexity and suggests difficulty levels.
 */

import { analyzeQuestionDifficultySchema } from '../schemas/analysis.schema.js';
import { firestoreService } from '../../services/firestore.service.js';
import { AgentContext } from '../../agent/context/agent-context.js';
import { DifficultyLevel } from '../../models/entities/question.entity.js';
import logger from '../../utils/logger.js';
import { removeUndefined } from '../../utils/validators.js';

/**
 * Analyze question difficulty based on heuristics
 */
function analyzeQuestionComplexity(questionText: string): {
  suggestedDifficulty: DifficultyLevel;
  factors: {
    length: number;
    wordCount: number;
    hasMultipleParts: boolean;
    hasTechnicalTerms: boolean;
    complexityScore: number;
  };
} {
  const length = questionText.length;
  const wordCount = questionText.split(/\s+/).length;
  const hasMultipleParts =
    questionText.includes('?') && questionText.split('?').length > 2;

  // Technical terms (simplified list)
  const technicalTerms = [
    'algorithm',
    'complexity',
    'optimization',
    'architecture',
    'design pattern',
    'concurrency',
    'distributed',
    'scalability',
    'performance',
    'database',
    'sql',
    'nosql',
    'api',
    'microservice',
    'container',
    'kubernetes',
    'aws',
    'cloud',
  ];

  const hasTechnicalTerms = technicalTerms.some((term) =>
    questionText.toLowerCase().includes(term)
  );

  // Calculate complexity score (0-100)
  let complexityScore = 0;

  // Length factor (0-30 points)
  complexityScore += Math.min(30, (length / 500) * 30);

  // Word count factor (0-20 points)
  complexityScore += Math.min(20, (wordCount / 50) * 20);

  // Multiple parts (20 points)
  if (hasMultipleParts) complexityScore += 20;

  // Technical terms (30 points)
  if (hasTechnicalTerms) complexityScore += 30;

  // Determine difficulty
  let suggestedDifficulty: DifficultyLevel;
  if (complexityScore < 40) {
    suggestedDifficulty = DifficultyLevel.Easy;
  } else if (complexityScore < 70) {
    suggestedDifficulty = DifficultyLevel.Medium;
  } else {
    suggestedDifficulty = DifficultyLevel.Hard;
  }

  return {
    suggestedDifficulty,
    factors: {
      length,
      wordCount,
      hasMultipleParts,
      hasTechnicalTerms,
      complexityScore: Math.round(complexityScore),
    },
  };
}

/**
 * Tool definition for Claude SDK
 */
export const analyzeQuestionDifficultyTool = {
  name: 'analyze_question_difficulty',
  description: `Analyze question complexity and suggest difficulty levels.

  Use this tool to:
  - Analyze individual questions or batches
  - Get difficulty suggestions based on question complexity
  - Review difficulty distribution across categories
  - Identify questions that might need difficulty adjustment

  Returns analysis with suggested difficulty levels and complexity factors.`,

  input_schema: {
    type: 'object' as const,
    properties: {
      questionId: {
        type: 'string',
        description: 'Specific question ID to analyze (optional)',
      },
      categoryId: {
        type: 'string',
        description: 'Analyze only questions in this category (optional)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of questions to analyze (default: 50)',
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
      const validated = analyzeQuestionDifficultySchema.parse(input);

      logger.debug(
        { userId: context.userId, questionId: validated.questionId },
        'Analyzing question difficulty via tool'
      );

      let questions;

      // Get questions to analyze
      if (validated.questionId) {
        // Analyze single question
        const question = await firestoreService.getQuestionById(
          context.userId,
          validated.questionId
        );
        questions = [question];
      } else {
        // Analyze multiple questions
        questions = await firestoreService.getQuestions(
          context.userId,
          removeUndefined({
            categoryId: validated.categoryId,
            isActive: true,
          }) as { categoryId?: string; isActive?: boolean },
          removeUndefined({
            limit: validated.limit,
          }) as { limit?: number }
        );
      }

      // Analyze each question
      const analyses = questions.map((q) => {
        const analysis = analyzeQuestionComplexity(q.questionText);
        return {
          questionId: q.id,
          questionText: q.questionText.substring(0, 100) + '...',
          currentDifficulty: q.difficulty,
          suggestedDifficulty: analysis.suggestedDifficulty,
          needsReview:
            q.difficulty !== analysis.suggestedDifficulty,
          complexityFactors: analysis.factors,
        };
      });

      // Calculate statistics
      const stats = {
        totalAnalyzed: analyses.length,
        needsReview: analyses.filter((a) => a.needsReview).length,
        difficultyDistribution: {
          Easy: analyses.filter(
            (a) => a.suggestedDifficulty === DifficultyLevel.Easy
          ).length,
          Medium: analyses.filter(
            (a) => a.suggestedDifficulty === DifficultyLevel.Medium
          ).length,
          Hard: analyses.filter(
            (a) => a.suggestedDifficulty === DifficultyLevel.Hard
          ).length,
        },
      };

      logger.info(
        {
          userId: context.userId,
          analyzed: analyses.length,
          needsReview: stats.needsReview,
        },
        'Difficulty analysis completed via tool'
      );

      // Format response for agent
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                statistics: stats,
                analyses: analyses,
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
        'Failed to analyze difficulty via tool'
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
