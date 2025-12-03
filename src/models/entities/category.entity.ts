/**
 * Category Entity
 *
 * Represents a question category in Firestore.
 * Matches the C# Backend CategoryDto structure.
 */

import { FirestoreTimestamp } from '../../config/firebase.config.js';

/**
 * Category entity interface
 */
export interface Category {
  /**
   * Firestore document ID
   */
  id: string;

  /**
   * User ID (owner of the category)
   * CRITICAL: Always filter by this field for security
   */
  userId: string;

  /**
   * Category name
   */
  name: string;

  /**
   * Category description (optional)
   */
  description?: string | null;

  /**
   * Color for UI display (hex color code)
   * Example: "#FF5733"
   */
  color?: string | null;

  /**
   * Icon name for UI display (optional)
   * Example: "folder", "star", "code"
   */
  icon?: string | null;

  /**
   * Display order for sorting
   */
  order: number;

  /**
   * Whether the category is active
   */
  isActive: boolean;

  /**
   * Number of questions in this category
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
 * Type for creating a new category (without auto-generated fields)
 */
export type CreateCategoryInput = Omit<
  Category,
  'id' | 'createdAt' | 'updatedAt'
> & {
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

/**
 * Type for updating a category (all fields optional except id)
 */
export type UpdateCategoryInput = Partial<
  Omit<Category, 'id' | 'userId' | 'createdAt'>
> & {
  id: string;
};

/**
 * Type for Firestore document data (without id field)
 */
export type CategoryDocumentData = Omit<Category, 'id'>;

/**
 * Default values for new categories
 */
export const DEFAULT_CATEGORY_VALUES = {
  isActive: true,
  questionCount: 0,
  order: 0,
} as const;

/**
 * Helper to convert Firestore document to Category entity
 */
export function toCategoryEntity(
  id: string,
  data: CategoryDocumentData
): Category {
  return {
    id,
    ...data,
  };
}

/**
 * Predefined category colors
 */
export const CATEGORY_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B500', // Orange
  '#6C5B7B', // Dark Purple
] as const;
