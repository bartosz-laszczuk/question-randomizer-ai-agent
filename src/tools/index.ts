/**
 * Agent Tools Registry
 *
 * Exports all 15 agent tools for use with Claude Agent SDK.
 * Tools are organized into three categories:
 * - Data Retrieval (6 tools): Read-only operations
 * - Data Modification (7 tools): Write operations
 * - Data Analysis (2 tools): Compute-heavy analysis
 */

// Data Retrieval Tools (6)
export {
  getQuestionsTool,
  getQuestionByIdTool,
  getCategoriesTool,
  getQualificationsTool,
  getUncategorizedQuestionsTool,
  searchQuestionsTool,
} from './data-retrieval/index.js';

// Data Modification Tools (7)
export {
  createQuestionTool,
  updateQuestionTool,
  deleteQuestionTool,
  updateQuestionCategoryTool,
  createCategoryTool,
  createQualificationTool,
  batchUpdateQuestionsTool,
} from './data-modification/index.js';

// Data Analysis Tools (2)
export {
  findDuplicateQuestionsTool,
  analyzeQuestionDifficultyTool,
} from './data-analysis/index.js';

/**
 * All tools as an array for registering with Claude Agent SDK
 */
export const allTools = [
  // Data Retrieval (6 tools)
  getQuestionsTool,
  getQuestionByIdTool,
  getCategoriesTool,
  getQualificationsTool,
  getUncategorizedQuestionsTool,
  searchQuestionsTool,

  // Data Modification (7 tools)
  createQuestionTool,
  updateQuestionTool,
  deleteQuestionTool,
  updateQuestionCategoryTool,
  createCategoryTool,
  createQualificationTool,
  batchUpdateQuestionsTool,

  // Data Analysis (2 tools)
  findDuplicateQuestionsTool,
  analyzeQuestionDifficultyTool,
] as const;

/**
 * Tool count
 */
export const TOOL_COUNT = allTools.length; // Should be 15

// Re-export imports from the tool categories
import {
  getQuestionsTool,
  getQuestionByIdTool,
  getCategoriesTool,
  getQualificationsTool,
  getUncategorizedQuestionsTool,
  searchQuestionsTool,
} from './data-retrieval/index.js';

import {
  createQuestionTool,
  updateQuestionTool,
  deleteQuestionTool,
  updateQuestionCategoryTool,
  createCategoryTool,
  createQualificationTool,
  batchUpdateQuestionsTool,
} from './data-modification/index.js';

import {
  findDuplicateQuestionsTool,
  analyzeQuestionDifficultyTool,
} from './data-analysis/index.js';
