/**
 * Question Entity
 *
 * Represents an interview question in Firestore.
 * Matches the C# Backend QuestionDto structure.
 */

import { FirestoreTimestamp } from '../../config/firebase.config.js';

/**
 * Difficulty level enum
 */
export enum DifficultyLevel {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

/**
 * Question entity interface
 */
export interface Question {
  /**
   * Firestore document ID
   */
  id: string;

  /**
   * User ID (owner of the question)
   * CRITICAL: Always filter by this field for security
   */
  userId: string;

  /**
   * Question text
   */
  questionText: string;

  /**
   * Category ID (reference to Category collection)
   * Optional - questions can be uncategorized
   */
  categoryId?: string | null;

  /**
   * Qualification ID (reference to Qualification collection)
   * Optional - questions can have no qualification
   */
  qualificationId?: string | null;

  /**
   * Difficulty level
   */
  difficulty: DifficultyLevel;

  /**
   * Whether the question is active
   * Soft delete: set to false instead of deleting
   */
  isActive: boolean;

  /**
   * Whether the question has been marked as a favorite
   */
  isFavorite: boolean;

  /**
   * Tags for categorization and search
   */
  tags: string[];

  /**
   * Notes about the question
   */
  notes?: string | null;

  /**
   * Metadata fields
   */
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;

  /**
   * Usage statistics
   */
  timesUsed?: number;
  lastUsedAt?: FirestoreTimestamp | null;
}

/**
 * Type for creating a new question (without auto-generated fields)
 */
export type CreateQuestionInput = Omit<
  Question,
  'id' | 'createdAt' | 'updatedAt'
> & {
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

/**
 * Type for updating a question (all fields optional except id)
 */
export type UpdateQuestionInput = Partial<
  Omit<Question, 'id' | 'userId' | 'createdAt'>
> & {
  id: string;
};

/**
 * Type for Firestore document data (without id field)
 */
export type QuestionDocumentData = Omit<Question, 'id'>;

/**
 * Default values for new questions
 */
export const DEFAULT_QUESTION_VALUES = {
  difficulty: DifficultyLevel.Medium,
  isActive: true,
  isFavorite: false,
  tags: [],
  timesUsed: 0,
} as const;

/**
 * Helper to check if difficulty is valid
 */
export function isValidDifficulty(value: string): value is DifficultyLevel {
  return Object.values(DifficultyLevel).includes(value as DifficultyLevel);
}

/**
 * Helper to convert Firestore document to Question entity
 */
export function toQuestionEntity(
  id: string,
  data: QuestionDocumentData
): Question {
  return {
    id,
    ...data,
  };
}
