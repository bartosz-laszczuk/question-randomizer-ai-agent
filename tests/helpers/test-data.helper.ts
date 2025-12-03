/**
 * Test Data Generators
 *
 * Helpers to generate test data for entities.
 */

import type { Question, DifficultyLevel } from '../../src/models/entities/question.entity.js';
import type { Category } from '../../src/models/entities/category.entity.js';
import type { Qualification } from '../../src/models/entities/qualification.entity.js';
import type { AgentContext } from '../../src/agent/context/agent-context.js';
import { randomUUID } from 'crypto';

/**
 * Generate test question
 */
export function generateTestQuestion(
  overrides: Partial<Question> = {}
): Question {
  const now = new Date();

  return {
    id: randomUUID(),
    userId: 'test-user-123',
    questionText: 'What is the difference between let and const in JavaScript?',
    categoryId: null,
    qualificationId: null,
    difficulty: 'medium' as DifficultyLevel,
    isActive: true,
    isFavorite: false,
    tags: ['javascript', 'variables'],
    notes: null,
    createdAt: now,
    updatedAt: now,
    timesUsed: 0,
    lastUsedAt: null,
    ...overrides,
  };
}

/**
 * Generate multiple test questions
 */
export function generateTestQuestions(
  count: number,
  userId = 'test-user-123'
): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    questions.push(
      generateTestQuestion({
        id: `question-${i + 1}`,
        userId,
        questionText: `Test question ${i + 1}`,
        tags: [`tag-${i % 3}`],
      })
    );
  }

  return questions;
}

/**
 * Generate test category
 */
export function generateTestCategory(
  overrides: Partial<Category> = {}
): Category {
  const now = new Date();

  return {
    id: randomUUID(),
    userId: 'test-user-123',
    name: 'JavaScript',
    description: 'Questions about JavaScript programming',
    color: '#f39c12',
    icon: 'code',
    isActive: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Generate multiple test categories
 */
export function generateTestCategories(
  count: number,
  userId = 'test-user-123'
): Category[] {
  const categories: Category[] = [];

  for (let i = 0; i < count; i++) {
    categories.push(
      generateTestCategory({
        id: `category-${i + 1}`,
        userId,
        name: `Category ${i + 1}`,
        sortOrder: i,
      })
    );
  }

  return categories;
}

/**
 * Generate test qualification
 */
export function generateTestQualification(
  overrides: Partial<Qualification> = {}
): Qualification {
  const now = new Date();

  return {
    id: randomUUID(),
    userId: 'test-user-123',
    name: 'Senior Developer',
    level: 'senior',
    yearsExperience: 5,
    description: 'Senior level developer position',
    isActive: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Generate multiple test qualifications
 */
export function generateTestQualifications(
  count: number,
  userId = 'test-user-123'
): Qualification[] {
  const qualifications: Qualification[] = [];

  for (let i = 0; i < count; i++) {
    qualifications.push(
      generateTestQualification({
        id: `qualification-${i + 1}`,
        userId,
        name: `Qualification ${i + 1}`,
        sortOrder: i,
      })
    );
  }

  return qualifications;
}

/**
 * Generate test agent context
 */
export function generateTestContext(
  overrides: Partial<AgentContext> = {}
): AgentContext {
  return {
    taskId: randomUUID(),
    userId: 'test-user-123',
    conversationId: undefined,
    metadata: undefined,
    ...overrides,
  };
}

/**
 * Generate random user ID
 */
export function generateUserId(): string {
  return `user-${randomUUID()}`;
}

/**
 * Generate random task ID
 */
export function generateTaskId(): string {
  return randomUUID();
}

/**
 * Delay helper for async tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
