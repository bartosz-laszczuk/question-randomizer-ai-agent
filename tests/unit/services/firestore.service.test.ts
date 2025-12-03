/**
 * Firestore Service - Unit Tests
 */

import { FirestoreService } from '../../../src/services/firestore.service.js';
import { db } from '../../../src/config/firebase.config.js';
import {
  generateTestQuestion,
  generateTestQuestions,
  generateUserId,
} from '../../helpers/test-data.helper.js';
import {
  mockFirestoreCollection,
  mockFirestoreDocument,
  mockFirestoreQuerySnapshot,
  mockFirestoreDocumentSnapshot,
} from '../../helpers/mock.helper.js';

// Mock Firebase Admin
jest.mock('../../../src/config/firebase.config.js', () => ({
  db: {
    collection: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('FirestoreService', () => {
  let service: FirestoreService;

  beforeEach(() => {
    service = new FirestoreService();
    jest.clearAllMocks();
  });

  describe('getQuestions', () => {
    it('should fetch questions for a user', async () => {
      const userId = generateUserId();
      const testQuestions = generateTestQuestions(3, userId);

      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.get.mockResolvedValue(
        mockFirestoreQuerySnapshot(testQuestions)
      );

      const result = await service.getQuestions(userId, {}, {});

      expect(mockDb.collection).toHaveBeenCalledWith('questions');
      expect(collectionMock._mocks.where).toHaveBeenCalledWith(
        'userId',
        '==',
        userId
      );
      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe(userId);
    });

    it('should apply filters correctly', async () => {
      const userId = generateUserId();
      const categoryId = 'category-1';

      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.get.mockResolvedValue(
        mockFirestoreQuerySnapshot([])
      );

      await service.getQuestions(userId, { categoryId }, {});

      expect(collectionMock._mocks.where).toHaveBeenCalledWith(
        'userId',
        '==',
        userId
      );
      expect(collectionMock._mocks.where).toHaveBeenCalledWith(
        'categoryId',
        '==',
        categoryId
      );
    });

    it('should apply limit and offset', async () => {
      const userId = generateUserId();

      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.get.mockResolvedValue(
        mockFirestoreQuerySnapshot([])
      );

      await service.getQuestions(userId, {}, { limit: 10, offset: 5 });

      expect(collectionMock._mocks.limit).toHaveBeenCalledWith(10);
      expect(collectionMock._mocks.offset).toHaveBeenCalledWith(5);
    });
  });

  describe('getQuestionById', () => {
    it('should fetch a question by ID', async () => {
      const userId = generateUserId();
      const question = generateTestQuestion({ userId });

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(question, true)
      );

      const result = await service.getQuestionById(userId, question.id);

      expect(mockDb.collection).toHaveBeenCalledWith('questions');
      expect(collectionMock._mocks.doc).toHaveBeenCalledWith(question.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(question.id);
    });

    it('should return null if question not found', async () => {
      const userId = generateUserId();
      const questionId = 'non-existent';

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(null, false)
      );

      const result = await service.getQuestionById(userId, questionId);

      expect(result).toBeNull();
    });

    it('should verify userId ownership', async () => {
      const userId = generateUserId();
      const otherUserId = generateUserId();
      const question = generateTestQuestion({ userId: otherUserId });

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(question, true)
      );

      const result = await service.getQuestionById(userId, question.id);

      // Should return null because userId doesn't match
      expect(result).toBeNull();
    });
  });

  describe('createQuestion', () => {
    it('should create a new question', async () => {
      const userId = generateUserId();
      const questionData = {
        questionText: 'What is TypeScript?',
        categoryId: 'category-1',
        qualificationId: null,
        difficulty: 'medium' as const,
        tags: ['typescript'],
        notes: null,
      };

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.set.mockResolvedValue(undefined);

      const result = await service.createQuestion(userId, questionData);

      expect(mockDb.collection).toHaveBeenCalledWith('questions');
      expect(docMock._mocks.set).toHaveBeenCalled();
      expect(result.userId).toBe(userId);
      expect(result.questionText).toBe(questionData.questionText);
      expect(result.isActive).toBe(true);
      expect(result.isFavorite).toBe(false);
    });
  });

  describe('updateQuestion', () => {
    it('should update an existing question', async () => {
      const userId = generateUserId();
      const question = generateTestQuestion({ userId });
      const updates = {
        questionText: 'Updated question text',
        difficulty: 'hard' as const,
      };

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);

      // Mock get to return existing question
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(question, true)
      );
      docMock._mocks.update.mockResolvedValue(undefined);

      const result = await service.updateQuestion(
        userId,
        question.id,
        updates
      );

      expect(docMock._mocks.get).toHaveBeenCalled();
      expect(docMock._mocks.update).toHaveBeenCalled();
      expect(result?.questionText).toBe(updates.questionText);
      expect(result?.difficulty).toBe(updates.difficulty);
    });

    it('should return null if question not found', async () => {
      const userId = generateUserId();

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(null, false)
      );

      const result = await service.updateQuestion(userId, 'non-existent', {
        questionText: 'New text',
      });

      expect(result).toBeNull();
      expect(docMock._mocks.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteQuestion', () => {
    it('should soft delete a question', async () => {
      const userId = generateUserId();
      const question = generateTestQuestion({ userId });

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(question, true)
      );
      docMock._mocks.update.mockResolvedValue(undefined);

      const result = await service.deleteQuestion(userId, question.id);

      expect(result).toBe(true);
      expect(docMock._mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });

    it('should return false if question not found', async () => {
      const userId = generateUserId();

      const docMock = mockFirestoreDocument();
      const collectionMock = mockFirestoreCollection();
      mockDb.collection.mockReturnValue(collectionMock);
      collectionMock._mocks.doc.mockReturnValue(docMock);
      docMock._mocks.get.mockResolvedValue(
        mockFirestoreDocumentSnapshot(null, false)
      );

      const result = await service.deleteQuestion(userId, 'non-existent');

      expect(result).toBe(false);
      expect(docMock._mocks.update).not.toHaveBeenCalled();
    });
  });
});
