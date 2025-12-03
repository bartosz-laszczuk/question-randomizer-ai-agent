/**
 * Get Questions Tool - Unit Tests
 */

import { getQuestionsTool } from '../../../../src/tools/data-retrieval/get-questions.tool.js';
import { firestoreService } from '../../../../src/services/firestore.service.js';
import { generateTestContext, generateTestQuestions } from '../../../helpers/test-data.helper.js';

// Mock the FirestoreService module
jest.mock('../../../../src/services/firestore.service.js', () => ({
  firestoreService: {
    getQuestions: jest.fn(),
  },
}));

const mockFirestoreService = firestoreService as jest.Mocked<typeof firestoreService>;

describe('Get Questions Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(getQuestionsTool.name).toBe('get_questions');
    expect(getQuestionsTool.description).toContain('questions');
    expect(getQuestionsTool.input_schema).toBeDefined();
    expect(getQuestionsTool.input_schema.type).toBe('object');
  });

  it('should fetch questions with default parameters', async () => {
    const context = generateTestContext();
    const testQuestions = generateTestQuestions(5);

    mockFirestoreService.getQuestions?.mockResolvedValue(testQuestions);

    const result = await getQuestionsTool.execute({}, context);

    expect(mockFirestoreService.getQuestions).toHaveBeenCalledWith(
      context.userId,
      expect.any(Object),
      expect.any(Object)
    );

    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);

    const content = result.content[0];
    expect(content).toHaveProperty('type', 'text');
    if ('text' in content) {
      const parsed = JSON.parse(content.text);
      expect(parsed.success).toBe(true);
      expect(parsed.questions).toHaveLength(5);
    }
  });

  it('should fetch questions with category filter', async () => {
    const context = generateTestContext();
    const testQuestions = generateTestQuestions(3);

    mockFirestoreService.getQuestions?.mockResolvedValue(testQuestions);

    const result = await getQuestionsTool.execute(
      { categoryId: 'category-1' },
      context
    );

    expect(mockFirestoreService.getQuestions).toHaveBeenCalledWith(
      context.userId,
      expect.objectContaining({ categoryId: 'category-1' }),
      expect.any(Object)
    );

    expect(result.content).toBeDefined();
  });

  it('should fetch questions with limit', async () => {
    const context = generateTestContext();
    const testQuestions = generateTestQuestions(10);

    mockFirestoreService.getQuestions?.mockResolvedValue(testQuestions);

    const result = await getQuestionsTool.execute(
      { limit: 10 },
      context
    );

    expect(mockFirestoreService.getQuestions).toHaveBeenCalledWith(
      context.userId,
      expect.any(Object),
      expect.objectContaining({ limit: 10 })
    );

    expect(result.content).toBeDefined();
  });

  it('should handle empty results', async () => {
    const context = generateTestContext();

    mockFirestoreService.getQuestions?.mockResolvedValue([]);

    const result = await getQuestionsTool.execute({}, context);

    expect(result.content).toBeDefined();
    const content = result.content[0];
    if ('text' in content) {
      const parsed = JSON.parse(content.text);
      expect(parsed.success).toBe(true);
      expect(parsed.questions).toHaveLength(0);
      expect(parsed.message).toContain('No questions found');
    }
  });

  it('should handle Firestore errors', async () => {
    const context = generateTestContext();

    mockFirestoreService.getQuestions?.mockRejectedValue(
      new Error('Firestore connection error')
    );

    const result = await getQuestionsTool.execute({}, context);

    expect(result.content).toBeDefined();
    const content = result.content[0];
    if ('text' in content) {
      const parsed = JSON.parse(content.text);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('Firestore connection error');
    }
    expect(result.is_error).toBe(true);
  });

  it('should validate input schema', async () => {
    const context = generateTestContext();

    // Invalid limit (too large)
    const result = await getQuestionsTool.execute(
      { limit: 200 },
      context
    );

    expect(result.is_error).toBe(true);
    const content = result.content[0];
    if ('text' in content) {
      const parsed = JSON.parse(content.text);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('validation');
    }
  });
});
