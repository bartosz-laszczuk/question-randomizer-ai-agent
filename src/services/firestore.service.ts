/**
 * Firestore Service
 *
 * Provides CRUD operations for all entities with userId-based security filtering.
 * All operations MUST filter by userId to prevent cross-user data access.
 */

import {
  db,
  COLLECTIONS,
  serverTimestamp,
  timestamp,
} from '../config/firebase.config.js';
import {
  Question,
  QuestionDocumentData,
  CreateQuestionInput,
  toQuestionEntity,
  DEFAULT_QUESTION_VALUES,
  Category,
  CategoryDocumentData,
  CreateCategoryInput,
  toCategoryEntity,
  DEFAULT_CATEGORY_VALUES,
  Qualification,
  QualificationDocumentData,
  CreateQualificationInput,
  toQualificationEntity,
  DEFAULT_QUALIFICATION_VALUES,
} from '../models/entities/index.js';
import { NotFoundError, FirestoreError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Query options for filtering and pagination
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Firestore Service Class
 *
 * CRITICAL SECURITY RULE:
 * Every query MUST filter by userId to prevent cross-user data access.
 */
export class FirestoreService {
  // ======================
  // QUESTION OPERATIONS
  // ======================

  /**
   * Get all questions for a user with optional filters
   *
   * @param userId - User ID (REQUIRED for security)
   * @param filters - Optional filters (categoryId, qualificationId, isActive, etc.)
   * @param options - Query options (limit, offset, orderBy)
   */
  async getQuestions(
    userId: string,
    filters: {
      categoryId?: string | null;
      qualificationId?: string | null;
      isActive?: boolean;
      isFavorite?: boolean;
      difficulty?: string;
      tags?: string[];
    } = {},
    options: QueryOptions = {}
  ): Promise<Question[]> {
    try {
      logger.debug(
        { userId, filters, options },
        'Getting questions from Firestore'
      );

      // Start with userId filter (CRITICAL)
      let query = db
        .collection(COLLECTIONS.QUESTIONS)
        .where('userId', '==', userId);

      // Apply additional filters
      if (filters.categoryId !== undefined) {
        query = query.where('categoryId', '==', filters.categoryId);
      }
      if (filters.qualificationId !== undefined) {
        query = query.where('qualificationId', '==', filters.qualificationId);
      }
      if (filters.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }
      if (filters.isFavorite !== undefined) {
        query = query.where('isFavorite', '==', filters.isFavorite);
      }
      if (filters.difficulty) {
        query = query.where('difficulty', '==', filters.difficulty);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(
          options.orderBy,
          options.orderDirection || 'asc'
        );
      } else {
        // Default: order by creation date descending
        query = query.orderBy('createdAt', 'desc');
      }

      // Apply pagination
      if (options.offset) {
        query = query.offset(options.offset);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      const questions = snapshot.docs.map((doc) => {
        return toQuestionEntity(doc.id, doc.data() as QuestionDocumentData);
      });

      logger.debug(
        { userId, count: questions.length },
        'Retrieved questions successfully'
      );

      return questions;
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get questions');
      throw new FirestoreError('Failed to retrieve questions', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get a single question by ID
   *
   * @param userId - User ID (REQUIRED for security)
   * @param questionId - Question ID
   */
  async getQuestionById(
    userId: string,
    questionId: string
  ): Promise<Question> {
    try {
      const doc = await db
        .collection(COLLECTIONS.QUESTIONS)
        .doc(questionId)
        .get();

      if (!doc.exists) {
        throw new NotFoundError('Question', questionId);
      }

      const data = doc.data() as QuestionDocumentData;

      // CRITICAL: Verify userId matches
      if (data.userId !== userId) {
        throw new NotFoundError('Question', questionId);
      }

      return toQuestionEntity(doc.id, data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId, questionId }, 'Failed to get question');
      throw new FirestoreError('Failed to retrieve question', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Create a new question
   *
   * @param userId - User ID (REQUIRED for security)
   * @param input - Question data
   */
  async createQuestion(
    userId: string,
    input: CreateQuestionInput
  ): Promise<Question> {
    try {
      logger.debug({ userId, input }, 'Creating question');

      const now = timestamp.now();

      const data: QuestionDocumentData = {
        ...DEFAULT_QUESTION_VALUES,
        ...input,
        userId, // CRITICAL: Always set userId
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await db.collection(COLLECTIONS.QUESTIONS).add(data);

      logger.info({ userId, questionId: docRef.id }, 'Question created');

      return toQuestionEntity(docRef.id, data);
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to create question');
      throw new FirestoreError('Failed to create question', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Update a question
   *
   * @param userId - User ID (REQUIRED for security)
   * @param questionId - Question ID
   * @param updates - Fields to update
   */
  async updateQuestion(
    userId: string,
    questionId: string,
    updates: Partial<Omit<Question, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Question> {
    try {
      logger.debug({ userId, questionId, updates }, 'Updating question');

      // First verify the question exists and belongs to user
      await this.getQuestionById(userId, questionId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await db
        .collection(COLLECTIONS.QUESTIONS)
        .doc(questionId)
        .update(updateData);

      logger.info({ userId, questionId }, 'Question updated');

      // Return updated question
      return await this.getQuestionById(userId, questionId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId, questionId }, 'Failed to update question');
      throw new FirestoreError('Failed to update question', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Delete a question (soft delete)
   *
   * @param userId - User ID (REQUIRED for security)
   * @param questionId - Question ID
   */
  async deleteQuestion(userId: string, questionId: string): Promise<void> {
    try {
      logger.debug({ userId, questionId }, 'Deleting question');

      // Verify the question exists and belongs to user
      await this.getQuestionById(userId, questionId);

      // Soft delete: set isActive to false
      await db.collection(COLLECTIONS.QUESTIONS).doc(questionId).update({
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      logger.info({ userId, questionId }, 'Question deleted (soft delete)');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId, questionId }, 'Failed to delete question');
      throw new FirestoreError('Failed to delete question', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Search questions by text
   *
   * @param userId - User ID (REQUIRED for security)
   * @param searchText - Text to search for
   * @param options - Query options
   */
  async searchQuestions(
    userId: string,
    searchText: string,
    options: QueryOptions = {}
  ): Promise<Question[]> {
    try {
      logger.debug({ userId, searchText, options }, 'Searching questions');

      // Get all active questions for the user
      const questions = await this.getQuestions(
        userId,
        { isActive: true },
        options
      );

      // Client-side filtering (Firestore doesn't have full-text search)
      const searchLower = searchText.toLowerCase();
      const filtered = questions.filter((q) => {
        return (
          q.questionText.toLowerCase().includes(searchLower) ||
          q.notes?.toLowerCase().includes(searchLower) ||
          q.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      });

      logger.debug(
        { userId, count: filtered.length },
        'Search completed'
      );

      return filtered;
    } catch (error) {
      logger.error({ err: error, userId, searchText }, 'Failed to search questions');
      throw new FirestoreError('Failed to search questions', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get uncategorized questions
   *
   * @param userId - User ID (REQUIRED for security)
   * @param options - Query options
   */
  async getUncategorizedQuestions(
    userId: string,
    options: QueryOptions = {}
  ): Promise<Question[]> {
    return this.getQuestions(userId, { categoryId: null }, options);
  }

  /**
   * Batch update questions
   *
   * @param userId - User ID (REQUIRED for security)
   * @param updates - Array of question updates
   */
  async batchUpdateQuestions(
    userId: string,
    updates: Array<{
      questionId: string;
      data: Partial<Omit<Question, 'id' | 'userId' | 'createdAt'>>;
    }>
  ): Promise<BatchOperationResult> {
    try {
      logger.debug(
        { userId, updateCount: updates.length },
        'Batch updating questions'
      );

      const batch = db.batch();
      let processedCount = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const update of updates) {
        try {
          // Verify question belongs to user
          await this.getQuestionById(userId, update.questionId);

          const ref = db
            .collection(COLLECTIONS.QUESTIONS)
            .doc(update.questionId);

          batch.update(ref, {
            ...update.data,
            updatedAt: serverTimestamp(),
          });

          processedCount++;
        } catch (error) {
          errors.push({
            id: update.questionId,
            error: (error as Error).message,
          });
        }
      }

      await batch.commit();

      logger.info(
        { userId, processedCount, errorCount: errors.length },
        'Batch update completed'
      );

      return {
        success: errors.length === 0,
        processedCount,
        errorCount: errors.length,
        errors,
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to batch update questions');
      throw new FirestoreError('Failed to batch update questions', {
        originalError: (error as Error).message,
      });
    }
  }

  // ======================
  // CATEGORY OPERATIONS
  // ======================

  /**
   * Get all categories for a user
   *
   * @param userId - User ID (REQUIRED for security)
   * @param options - Query options
   */
  async getCategories(
    userId: string,
    options: QueryOptions = {}
  ): Promise<Category[]> {
    try {
      logger.debug({ userId, options }, 'Getting categories from Firestore');

      // CRITICAL: Filter by userId
      let query = db
        .collection(COLLECTIONS.CATEGORIES)
        .where('userId', '==', userId);

      // Apply ordering (default: by order field)
      query = query.orderBy(options.orderBy || 'order', 'asc');

      // Apply pagination
      if (options.offset) {
        query = query.offset(options.offset);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      const categories = snapshot.docs.map((doc) => {
        return toCategoryEntity(doc.id, doc.data() as CategoryDocumentData);
      });

      logger.debug(
        { userId, count: categories.length },
        'Retrieved categories successfully'
      );

      return categories;
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get categories');
      throw new FirestoreError('Failed to retrieve categories', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get a single category by ID
   *
   * @param userId - User ID (REQUIRED for security)
   * @param categoryId - Category ID
   */
  async getCategoryById(
    userId: string,
    categoryId: string
  ): Promise<Category> {
    try {
      const doc = await db
        .collection(COLLECTIONS.CATEGORIES)
        .doc(categoryId)
        .get();

      if (!doc.exists) {
        throw new NotFoundError('Category', categoryId);
      }

      const data = doc.data() as CategoryDocumentData;

      // CRITICAL: Verify userId matches
      if (data.userId !== userId) {
        throw new NotFoundError('Category', categoryId);
      }

      return toCategoryEntity(doc.id, data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId, categoryId }, 'Failed to get category');
      throw new FirestoreError('Failed to retrieve category', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Create a new category
   *
   * @param userId - User ID (REQUIRED for security)
   * @param input - Category data
   */
  async createCategory(
    userId: string,
    input: CreateCategoryInput
  ): Promise<Category> {
    try {
      logger.debug({ userId, input }, 'Creating category');

      const now = timestamp.now();

      const data: CategoryDocumentData = {
        ...DEFAULT_CATEGORY_VALUES,
        ...input,
        userId, // CRITICAL: Always set userId
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await db.collection(COLLECTIONS.CATEGORIES).add(data);

      logger.info({ userId, categoryId: docRef.id }, 'Category created');

      return toCategoryEntity(docRef.id, data);
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to create category');
      throw new FirestoreError('Failed to create category', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Update a category
   *
   * @param userId - User ID (REQUIRED for security)
   * @param categoryId - Category ID
   * @param updates - Fields to update
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Category> {
    try {
      logger.debug({ userId, categoryId, updates }, 'Updating category');

      // First verify the category exists and belongs to user
      await this.getCategoryById(userId, categoryId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await db
        .collection(COLLECTIONS.CATEGORIES)
        .doc(categoryId)
        .update(updateData);

      logger.info({ userId, categoryId }, 'Category updated');

      // Return updated category
      return await this.getCategoryById(userId, categoryId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId, categoryId }, 'Failed to update category');
      throw new FirestoreError('Failed to update category', {
        originalError: (error as Error).message,
      });
    }
  }

  // ======================
  // QUALIFICATION OPERATIONS
  // ======================

  /**
   * Get all qualifications for a user
   *
   * @param userId - User ID (REQUIRED for security)
   * @param options - Query options
   */
  async getQualifications(
    userId: string,
    options: QueryOptions = {}
  ): Promise<Qualification[]> {
    try {
      logger.debug({ userId, options }, 'Getting qualifications from Firestore');

      // CRITICAL: Filter by userId
      let query = db
        .collection(COLLECTIONS.QUALIFICATIONS)
        .where('userId', '==', userId);

      // Apply ordering
      query = query.orderBy(
        options.orderBy || 'name',
        options.orderDirection || 'asc'
      );

      // Apply pagination
      if (options.offset) {
        query = query.offset(options.offset);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      const qualifications = snapshot.docs.map((doc) => {
        return toQualificationEntity(
          doc.id,
          doc.data() as QualificationDocumentData
        );
      });

      logger.debug(
        { userId, count: qualifications.length },
        'Retrieved qualifications successfully'
      );

      return qualifications;
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get qualifications');
      throw new FirestoreError('Failed to retrieve qualifications', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get a single qualification by ID
   *
   * @param userId - User ID (REQUIRED for security)
   * @param qualificationId - Qualification ID
   */
  async getQualificationById(
    userId: string,
    qualificationId: string
  ): Promise<Qualification> {
    try {
      const doc = await db
        .collection(COLLECTIONS.QUALIFICATIONS)
        .doc(qualificationId)
        .get();

      if (!doc.exists) {
        throw new NotFoundError('Qualification', qualificationId);
      }

      const data = doc.data() as QualificationDocumentData;

      // CRITICAL: Verify userId matches
      if (data.userId !== userId) {
        throw new NotFoundError('Qualification', qualificationId);
      }

      return toQualificationEntity(doc.id, data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(
        { err: error, userId, qualificationId },
        'Failed to get qualification'
      );
      throw new FirestoreError('Failed to retrieve qualification', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Create a new qualification
   *
   * @param userId - User ID (REQUIRED for security)
   * @param input - Qualification data
   */
  async createQualification(
    userId: string,
    input: CreateQualificationInput
  ): Promise<Qualification> {
    try {
      logger.debug({ userId, input }, 'Creating qualification');

      const now = timestamp.now();

      const data: QualificationDocumentData = {
        ...DEFAULT_QUALIFICATION_VALUES,
        ...input,
        userId, // CRITICAL: Always set userId
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await db
        .collection(COLLECTIONS.QUALIFICATIONS)
        .add(data);

      logger.info(
        { userId, qualificationId: docRef.id },
        'Qualification created'
      );

      return toQualificationEntity(docRef.id, data);
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to create qualification');
      throw new FirestoreError('Failed to create qualification', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Update a qualification
   *
   * @param userId - User ID (REQUIRED for security)
   * @param qualificationId - Qualification ID
   * @param updates - Fields to update
   */
  async updateQualification(
    userId: string,
    qualificationId: string,
    updates: Partial<Omit<Qualification, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Qualification> {
    try {
      logger.debug(
        { userId, qualificationId, updates },
        'Updating qualification'
      );

      // First verify the qualification exists and belongs to user
      await this.getQualificationById(userId, qualificationId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await db
        .collection(COLLECTIONS.QUALIFICATIONS)
        .doc(qualificationId)
        .update(updateData);

      logger.info({ userId, qualificationId }, 'Qualification updated');

      // Return updated qualification
      return await this.getQualificationById(userId, qualificationId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(
        { err: error, userId, qualificationId },
        'Failed to update qualification'
      );
      throw new FirestoreError('Failed to update qualification', {
        originalError: (error as Error).message,
      });
    }
  }
}

/**
 * Singleton instance of FirestoreService
 */
export const firestoreService = new FirestoreService();
