# Agent Tools Documentation

Complete reference for all 15 autonomous agent tools available to the Claude AI agent.

## Table of Contents

- [Overview](#overview)
- [Tool Categories](#tool-categories)
- [Data Retrieval Tools](#data-retrieval-tools)
- [Data Modification Tools](#data-modification-tools)
- [Data Analysis Tools](#data-analysis-tools)
- [Security & Best Practices](#security--best-practices)

---

## Overview

The Question Randomizer AI Agent has access to **15 specialized tools** that allow it to autonomously interact with the Firestore database. These tools are organized into three categories based on their functionality.

### Tool Architecture

```
Agent Task → Claude AI → Tool Selection → Tool Execution → Firestore Operation → Result
```

**Key Features:**
- ✅ Zod schema validation for all inputs
- ✅ Automatic userId filtering for security
- ✅ Structured JSON responses
- ✅ Comprehensive error handling
- ✅ Detailed logging

### Usage Context

All tools receive an `AgentContext` containing:
```typescript
{
  taskId: string;      // Unique task identifier
  userId: string;      // User making the request (CRITICAL for security)
  conversationId?: string;  // Optional conversation tracking
  metadata?: Record<string, unknown>;  // Additional context
}
```

---

## Tool Categories

### 📖 Data Retrieval Tools (6 tools)
Read-only operations for fetching data. Low risk, can be called frequently.

### ✏️ Data Modification Tools (7 tools)
Write operations that create, update, or delete data. Requires careful validation.

### 🔍 Data Analysis Tools (2 tools)
Compute-intensive analysis operations. Read-only but may take longer to execute.

---

## Data Retrieval Tools

### 1. `get_questions`

Fetch a list of questions with optional filters.

**Purpose:** Retrieve user's questions with filtering and pagination.

**Input Schema:**
```typescript
{
  categoryId?: string;        // Filter by category ID
  qualificationId?: string;   // Filter by qualification ID
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';  // Filter by difficulty
  isActive?: boolean;         // Filter active/inactive questions
  isFavorite?: boolean;       // Filter favorite questions
  tags?: string[];            // Filter by tags (array)
  limit?: number;             // Max results (default: 50, max: 100)
  offset?: number;            // Skip first N results
}
```

**Example Usage:**
```json
{
  "categoryId": "cat-123",
  "difficulty": "medium",
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q-1",
      "questionText": "What is TypeScript?",
      "difficulty": "medium",
      "categoryId": "cat-123",
      "tags": ["typescript", "basics"],
      "createdAt": "2025-11-27T..."
    }
  ],
  "count": 1,
  "message": "Found 1 question(s)"
}
```

**Common Use Cases:**
- "List my JavaScript questions"
- "Show me all medium difficulty questions"
- "Get my favorite questions"

---

### 2. `get_question_by_id`

Fetch a single question by its ID.

**Purpose:** Retrieve detailed information about a specific question.

**Input Schema:**
```typescript
{
  questionId: string;  // Required: Question ID
}
```

**Example Usage:**
```json
{
  "questionId": "q-550e8400"
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "q-550e8400",
    "userId": "user-123",
    "questionText": "Explain closures in JavaScript",
    "categoryId": "cat-js",
    "qualificationId": "qual-senior",
    "difficulty": "hard",
    "isActive": true,
    "isFavorite": false,
    "tags": ["javascript", "closures", "scope"],
    "notes": "Focus on practical examples",
    "timesUsed": 5,
    "lastUsedAt": "2025-11-20T...",
    "createdAt": "2025-11-01T...",
    "updatedAt": "2025-11-20T..."
  }
}
```

**Common Use Cases:**
- "Show me question q-550e8400"
- "Get details for the question about closures"

---

### 3. `get_categories`

Fetch all categories for the user.

**Purpose:** Retrieve user's question categories with metadata.

**Input Schema:**
```typescript
{
  // No parameters - fetches all user categories
}
```

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "cat-1",
      "name": "JavaScript",
      "description": "JavaScript programming questions",
      "color": "#f39c12",
      "icon": "code",
      "isActive": true,
      "sortOrder": 0,
      "createdAt": "2025-11-01T..."
    },
    {
      "id": "cat-2",
      "name": "React",
      "description": "React framework questions",
      "color": "#61dafb",
      "icon": "react",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2025-11-05T..."
    }
  ],
  "count": 2
}
```

**Common Use Cases:**
- "List my categories"
- "Show all question categories"

---

### 4. `get_qualifications`

Fetch all qualifications for the user.

**Purpose:** Retrieve job qualifications/experience levels.

**Input Schema:**
```typescript
{
  // No parameters - fetches all user qualifications
}
```

**Response:**
```json
{
  "success": true,
  "qualifications": [
    {
      "id": "qual-1",
      "name": "Junior Developer",
      "level": "junior",
      "yearsExperience": 1,
      "description": "Entry-level developer position",
      "isActive": true,
      "sortOrder": 0
    },
    {
      "id": "qual-2",
      "name": "Senior Developer",
      "level": "senior",
      "yearsExperience": 5,
      "description": "Senior developer position",
      "isActive": true,
      "sortOrder": 1
    }
  ],
  "count": 2
}
```

**Common Use Cases:**
- "What qualifications do I have?"
- "List all experience levels"

---

### 5. `get_uncategorized_questions`

Fetch questions that don't have a category assigned.

**Purpose:** Find questions needing categorization.

**Input Schema:**
```typescript
{
  limit?: number;  // Max results (default: 50)
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q-uncategorized-1",
      "questionText": "What is REST API?",
      "categoryId": null,
      "difficulty": "medium",
      "tags": ["api", "rest"]
    }
  ],
  "count": 1,
  "message": "Found 1 uncategorized question(s)"
}
```

**Common Use Cases:**
- "Show me questions without categories"
- "Find uncategorized questions"

---

### 6. `search_questions`

Search questions by text content.

**Purpose:** Full-text search across question text, notes, and tags.

**Input Schema:**
```typescript
{
  searchText: string;  // Required: Search query
  limit?: number;      // Max results (default: 20)
}
```

**Example Usage:**
```json
{
  "searchText": "async await",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q-async-1",
      "questionText": "Explain async/await in JavaScript",
      "difficulty": "medium",
      "tags": ["javascript", "async", "promises"],
      "relevance": 0.95
    }
  ],
  "count": 1,
  "searchText": "async await"
}
```

**Common Use Cases:**
- "Search for questions about promises"
- "Find questions mentioning React hooks"

---

## Data Modification Tools

### 7. `create_question`

Create a new interview question.

**Purpose:** Add a new question to the database.

**Input Schema:**
```typescript
{
  questionText: string;           // Required: Question content (5-1000 chars)
  categoryId?: string | null;     // Optional: Category ID
  qualificationId?: string | null; // Optional: Qualification ID
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';  // Required
  tags?: string[];                // Optional: Tags array
  notes?: string | null;          // Optional: Additional notes
  isFavorite?: boolean;           // Optional: Mark as favorite (default: false)
}
```

**Example Usage:**
```json
{
  "questionText": "What are the main differences between SQL and NoSQL databases?",
  "categoryId": "cat-database",
  "qualificationId": "qual-mid",
  "difficulty": "medium",
  "tags": ["database", "sql", "nosql"],
  "notes": "Focus on use cases and trade-offs"
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "q-new-123",
    "questionText": "What are the main differences...",
    "categoryId": "cat-database",
    "difficulty": "medium",
    "isActive": true,
    "isFavorite": false,
    "tags": ["database", "sql", "nosql"],
    "timesUsed": 0,
    "createdAt": "2025-11-27T...",
    "updatedAt": "2025-11-27T..."
  },
  "message": "Question created successfully"
}
```

**Validation Rules:**
- Question text: 5-1000 characters
- Difficulty: Must be one of: easy, medium, hard, expert
- Tags: Array of strings, each 1-50 characters
- Notes: Max 500 characters

**Common Use Cases:**
- "Create a question about React hooks"
- "Add a new database question"

---

### 8. `update_question`

Update an existing question's properties.

**Purpose:** Modify question details (text, category, difficulty, etc.).

**Input Schema:**
```typescript
{
  questionId: string;             // Required: Question ID
  questionText?: string;          // Optional: Update text
  categoryId?: string | null;     // Optional: Update category
  qualificationId?: string | null; // Optional: Update qualification
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  tags?: string[];                // Optional: Update tags
  notes?: string | null;          // Optional: Update notes
  isFavorite?: boolean;           // Optional: Update favorite status
}
```

**Example Usage:**
```json
{
  "questionId": "q-123",
  "difficulty": "hard",
  "tags": ["advanced", "react", "performance"],
  "isFavorite": true
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "q-123",
    "difficulty": "hard",
    "tags": ["advanced", "react", "performance"],
    "isFavorite": true,
    "updatedAt": "2025-11-27T..."
  },
  "message": "Question updated successfully"
}
```

**Common Use Cases:**
- "Update question q-123 difficulty to hard"
- "Mark question as favorite"
- "Change category to JavaScript"

---

### 9. `delete_question`

Soft delete a question (marks as inactive).

**Purpose:** Remove a question from active use without permanently deleting.

**Input Schema:**
```typescript
{
  questionId: string;  // Required: Question ID to delete
}
```

**Example Usage:**
```json
{
  "questionId": "q-old-123"
}
```

**Response:**
```json
{
  "success": true,
  "questionId": "q-old-123",
  "message": "Question deleted successfully (marked as inactive)"
}
```

**Note:** This is a **soft delete** - the question is marked `isActive: false` but remains in the database for potential recovery.

**Common Use Cases:**
- "Delete question q-old-123"
- "Remove the question about outdated frameworks"

---

### 10. `update_question_category`

Assign or change a question's category.

**Purpose:** Categorize questions or move them between categories.

**Input Schema:**
```typescript
{
  questionId: string;         // Required: Question ID
  categoryId: string | null;  // Required: New category (null to remove)
}
```

**Example Usage:**
```json
{
  "questionId": "q-123",
  "categoryId": "cat-javascript"
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "q-123",
    "categoryId": "cat-javascript",
    "updatedAt": "2025-11-27T..."
  },
  "message": "Question category updated successfully"
}
```

**Common Use Cases:**
- "Categorize question q-123 as JavaScript"
- "Move question to React category"
- "Remove category from question"

---

### 11. `create_category`

Create a new question category.

**Purpose:** Add a new category for organizing questions.

**Input Schema:**
```typescript
{
  name: string;          // Required: Category name (3-50 chars)
  description?: string;  // Optional: Description (max 200 chars)
  color?: string;        // Optional: Hex color (e.g., "#f39c12")
  icon?: string;         // Optional: Icon name
  sortOrder?: number;    // Optional: Display order (default: 0)
}
```

**Example Usage:**
```json
{
  "name": "TypeScript",
  "description": "TypeScript programming questions",
  "color": "#3178c6",
  "icon": "typescript",
  "sortOrder": 2
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "cat-new-ts",
    "name": "TypeScript",
    "description": "TypeScript programming questions",
    "color": "#3178c6",
    "icon": "typescript",
    "isActive": true,
    "sortOrder": 2,
    "createdAt": "2025-11-27T..."
  },
  "message": "Category created successfully"
}
```

**Common Use Cases:**
- "Create a category for TypeScript questions"
- "Add a new System Design category"

---

### 12. `create_qualification`

Create a new qualification/experience level.

**Purpose:** Add a new job qualification or experience level.

**Input Schema:**
```typescript
{
  name: string;          // Required: Qualification name (3-50 chars)
  level: string;         // Required: Level (e.g., "junior", "senior")
  yearsExperience: number; // Required: Years of experience
  description?: string;  // Optional: Description (max 200 chars)
  sortOrder?: number;    // Optional: Display order (default: 0)
}
```

**Example Usage:**
```json
{
  "name": "Mid-Level Developer",
  "level": "mid",
  "yearsExperience": 3,
  "description": "3-5 years of professional development experience",
  "sortOrder": 1
}
```

**Response:**
```json
{
  "success": true,
  "qualification": {
    "id": "qual-new-mid",
    "name": "Mid-Level Developer",
    "level": "mid",
    "yearsExperience": 3,
    "description": "3-5 years of professional development experience",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2025-11-27T..."
  },
  "message": "Qualification created successfully"
}
```

**Common Use Cases:**
- "Create a qualification for mid-level developers"
- "Add a new Staff Engineer qualification"

---

### 13. `batch_update_questions`

Update multiple questions at once.

**Purpose:** Efficiently update many questions with the same changes.

**Input Schema:**
```typescript
{
  questionIds: string[];          // Required: Array of question IDs
  updates: {
    categoryId?: string | null;
    qualificationId?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    isFavorite?: boolean;
  }
}
```

**Example Usage:**
```json
{
  "questionIds": ["q-1", "q-2", "q-3"],
  "updates": {
    "categoryId": "cat-javascript",
    "difficulty": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "updatedCount": 3,
  "questionIds": ["q-1", "q-2", "q-3"],
  "message": "Updated 3 question(s) successfully"
}
```

**Common Use Cases:**
- "Categorize questions q-1, q-2, q-3 as JavaScript"
- "Mark all React questions as medium difficulty"

---

## Data Analysis Tools

### 14. `find_duplicate_questions`

Find potential duplicate questions based on text similarity.

**Purpose:** Identify questions with similar content to avoid duplication.

**Input Schema:**
```typescript
{
  threshold?: number;  // Optional: Similarity threshold (0-1, default: 0.8)
  limit?: number;      // Optional: Max results (default: 20)
}
```

**Example Usage:**
```json
{
  "threshold": 0.75,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "duplicates": [
    {
      "question1": {
        "id": "q-1",
        "questionText": "What is React?"
      },
      "question2": {
        "id": "q-2",
        "questionText": "Explain React library"
      },
      "similarity": 0.85
    }
  ],
  "count": 1,
  "threshold": 0.75
}
```

**Algorithm:** Uses Jaccard similarity coefficient on word sets.

**Common Use Cases:**
- "Find duplicate questions"
- "Check for similar questions"

---

### 15. `analyze_question_difficulty`

Analyze and suggest difficulty levels for questions.

**Purpose:** Evaluate question complexity using heuristics.

**Input Schema:**
```typescript
{
  questionId?: string;   // Optional: Analyze specific question
  categoryId?: string;   // Optional: Analyze all in category
}
```

**Example Usage:**
```json
{
  "categoryId": "cat-javascript"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": [
    {
      "questionId": "q-1",
      "questionText": "Explain event loop in JavaScript",
      "currentDifficulty": "medium",
      "suggestedDifficulty": "hard",
      "confidence": 0.85,
      "factors": {
        "textLength": 150,
        "technicalTerms": ["event loop", "asynchronous", "callback queue"],
        "complexity": "high"
      }
    }
  ],
  "count": 1
}
```

**Heuristics:**
- Text length
- Technical terminology count
- Keyword complexity
- Sentence structure

**Common Use Cases:**
- "Analyze difficulty of my JavaScript questions"
- "Check if question difficulty is correct"

---

## Security & Best Practices

### Critical Security Rules

#### 1. UserId Filtering (Mandatory)

**Every tool ALWAYS filters by `context.userId`:**

```typescript
// ✅ CORRECT - Always filter by userId
const questions = await firestoreService.getQuestions(
  context.userId,  // CRITICAL
  filters,
  options
);

// ❌ WRONG - Security vulnerability!
const questions = await firestoreService.getQuestions(
  filters,  // Missing userId
  options
);
```

**Why:** Prevents users from accessing other users' data.

#### 2. Input Validation

All inputs are validated with Zod schemas **before** execution:

```typescript
const validated = inputSchema.parse(input);  // Throws if invalid
```

**Validation includes:**
- Type checking (string, number, boolean, array)
- Length constraints
- Allowed values (enums)
- Required vs optional fields

#### 3. Error Handling

Tools return structured errors:

```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE"
}
```

**Never expose:**
- Database structure
- Internal paths
- Stack traces
- Other users' data

### Best Practices

#### For Tool Developers

1. **Always use userId filtering**
2. **Validate all inputs with Zod**
3. **Return structured JSON responses**
4. **Log operations for audit trails**
5. **Handle errors gracefully**

#### For Agent Operators

1. **Monitor tool usage** - Track which tools are called most
2. **Review logs** - Check for suspicious patterns
3. **Test edge cases** - Empty results, invalid inputs
4. **Performance monitoring** - Track execution times
5. **Rate limiting** - Prevent abuse (future enhancement)

---

## Tool Usage Examples

### Example 1: Categorizing Questions

```
Agent Task: "Categorize all my uncategorized React questions"

Tool Sequence:
1. get_uncategorized_questions()
2. search_questions({ searchText: "react" })
3. get_categories()  // Find React category
4. batch_update_questions({
     questionIds: [...],
     updates: { categoryId: "cat-react" }
   })
```

### Example 2: Finding Duplicates

```
Agent Task: "Find and remove duplicate questions"

Tool Sequence:
1. find_duplicate_questions({ threshold: 0.85 })
2. For each duplicate pair:
   - get_question_by_id() for both
   - Compare creation dates
   - delete_question() for newer one
```

### Example 3: Question Analysis

```
Agent Task: "Analyze my JavaScript questions and fix incorrect difficulty levels"

Tool Sequence:
1. get_questions({ categoryId: "cat-javascript" })
2. analyze_question_difficulty({ categoryId: "cat-javascript" })
3. For each with wrong difficulty:
   - update_question({
       questionId: ...,
       difficulty: suggestedDifficulty
     })
```

---

## Related Documentation

- **[TASK-EXAMPLES.md](./TASK-EXAMPLES.md)** - Complete task examples
- **[STREAMING.md](./STREAMING.md)** - Real-time progress monitoring
- **[QUEUE.md](./QUEUE.md)** - Background task processing
- **[../CLAUDE.md](../CLAUDE.md)** - Architecture overview

---

**Total Tools: 15**
- 📖 Data Retrieval: 6 tools
- ✏️ Data Modification: 7 tools
- 🔍 Data Analysis: 2 tools

All tools are production-ready and battle-tested! 🚀
