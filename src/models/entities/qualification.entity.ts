/**
 * Qualification Entity
 *
 * Represents a job qualification/role in Firestore.
 * Matches the C# Backend QualificationDto structure.
 */

import { FirestoreTimestamp } from '../../config/firebase.config.js';

/**
 * Qualification entity interface
 */
export interface Qualification {
  /**
   * Firestore document ID
   */
  id: string;

  /**
   * User ID (owner of the qualification)
   * CRITICAL: Always filter by this field for security
   */
  userId: string;

  /**
   * Qualification name
   * Example: "Senior Software Engineer", "Frontend Developer"
   */
  name: string;

  /**
   * Description of the qualification (optional)
   */
  description?: string | null;

  /**
   * Whether the qualification is active
   */
  isActive: boolean;

  /**
   * Number of questions associated with this qualification
   * This is denormalized for performance
   */
  questionCount: number;

  /**
   * Metadata fields
   */
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

/**
 * Type for creating a new qualification (without auto-generated fields)
 */
export type CreateQualificationInput = Omit<
  Qualification,
  'id' | 'createdAt' | 'updatedAt'
> & {
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

/**
 * Type for updating a qualification (all fields optional except id)
 */
export type UpdateQualificationInput = Partial<
  Omit<Qualification, 'id' | 'userId' | 'createdAt'>
> & {
  id: string;
};

/**
 * Type for Firestore document data (without id field)
 */
export type QualificationDocumentData = Omit<Qualification, 'id'>;

/**
 * Default values for new qualifications
 */
export const DEFAULT_QUALIFICATION_VALUES = {
  isActive: true,
  questionCount: 0,
} as const;

/**
 * Helper to convert Firestore document to Qualification entity
 */
export function toQualificationEntity(
  id: string,
  data: QualificationDocumentData
): Qualification {
  return {
    id,
    ...data,
  };
}
