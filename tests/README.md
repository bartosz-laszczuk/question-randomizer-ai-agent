# Testing Guide

## Overview

This directory contains comprehensive tests for the Question Randomizer AI Agent Service.

**Coverage Goal:** >80% overall test coverage

## Test Structure

```
tests/
├── setup.ts                  # Global test setup
├── helpers/                  # Test utilities
│   ├── test-data.helper.ts  # Data generators
│   └── mock.helper.ts       # Mock factories
├── unit/                     # Unit tests (70% of tests)
│   ├── tools/               # Test all 15 agent tools
│   │   ├── data-retrieval/
│   │   ├── data-modification/
│   │   └── data-analysis/
│   ├── services/            # Test service layer
│   └── agent/               # Test agent executor
└── integration/             # Integration tests (25% of tests)
    ├── api/                 # Test API endpoints
    └── tools/               # Test tools with real Firestore
```

## Testing Layers

### Unit Tests (tests/unit/)

Test individual components in isolation with mocked dependencies.

**Focus:**
- Agent tools (15 tools)
- Service layer (FirestoreService, TaskTrackerService)
- Agent executor logic
- Utilities and helpers

**Characteristics:**
- Fast execution (<1s per test)
- No external dependencies
- Mocked Firestore, Anthropic, Redis
- High coverage (>90%)

**Example:**
```typescript
import { getQuestionsTool } from '../../src/tools/data-retrieval/get-questions.tool.js';
import { generateTestContext } from '../helpers/test-data.helper.js';

jest.mock('../../src/services/firestore.service.js');

describe('Get Questions Tool', () => {
  it('should fetch questions', async () => {
    const context = generateTestContext();
    const result = await getQuestionsTool.execute({}, context);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests (tests/integration/)

Test component interactions with real or emulated external services.

**Focus:**
- API endpoints (Express routes + controllers)
- Tools + Firestore Emulator
- Queue + Redis (via Testcontainers)

**Characteristics:**
- Slower execution (1-5s per test)
- Real Firebase Emulator or Testcontainers
- End-to-end request/response flows
- Moderate coverage (>70%)

**Example:**
```typescript
import request from 'supertest';
import { createApp } from '../../src/server.js';

describe('Agent Routes', () => {
  it('should execute agent task', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/agent/task')
      .send({ task: 'List categories', userId: 'user-123' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Helpers

### Data Generators (test-data.helper.ts)

Generate test data for entities:

```typescript
import { generateTestQuestion, generateTestQuestions } from './helpers/test-data.helper.js';

// Single question
const question = generateTestQuestion({ userId: 'user-123' });

// Multiple questions
const questions = generateTestQuestions(10, 'user-123');

// Context
const context = generateTestContext({ userId: 'user-123' });
```

### Mock Factories (mock.helper.ts)

Create mocks for external services:

```typescript
import {
  mockFirestoreCollection,
  mockClaudeTextResponse,
  mockRequest,
  mockResponse,
} from './helpers/mock.helper.js';

// Firestore mocks
const collection = mockFirestoreCollection();
collection._mocks.get.mockResolvedValue(data);

// Claude API mocks
const response = mockClaudeTextResponse('Result');

// Express mocks
const req = mockRequest({ body: { userId: '123' } });
const res = mockResponse();
```

## Mocking Strategy

### 1. Unit Tests - Mock Everything

Mock all external dependencies:
- Firestore (via jest.mock)
- Anthropic Claude API (via jest.mock)
- Redis (via jest.mock)
- Environment config

### 2. Integration Tests - Real Services

Use real or emulated services:
- Firebase Emulator (for Firestore)
- Testcontainers Redis (for queue)
- Real Express app (for HTTP)

## Coverage Requirements

| Component | Target Coverage |
|-----------|----------------|
| **Tools** | >90% |
| **Services** | >90% |
| **Agent Executor** | >85% |
| **Controllers** | >80% |
| **Utilities** | >85% |
| **Overall** | >80% |

## Writing Good Tests

### ✅ DO:
- Test one thing per test
- Use descriptive test names
- Use test data generators
- Mock external dependencies in unit tests
- Test error cases
- Test edge cases (empty arrays, nulls, etc.)
- Clean up mocks between tests (`jest.clearAllMocks()`)

### ❌ DON'T:
- Test implementation details
- Rely on test execution order
- Share mutable state between tests
- Mock what you're testing
- Skip error handling tests
- Leave open handles

## Test Naming Convention

Use this pattern: `should [expected behavior] when [condition]`

**Examples:**
```typescript
// ✅ Good
it('should return questions when user has data', async () => {})
it('should throw error when userId is missing', async () => {})
it('should apply filters when categoryId provided', async () => {})

// ❌ Bad
it('test get questions', async () => {})
it('works', async () => {})
```

## Debugging Tests

### Run single test file
```bash
npm test -- get-questions.tool.test.ts
```

### Run single test
```bash
npm test -- -t "should fetch questions"
```

### Debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Check for open handles
```bash
npm test -- --detectOpenHandles
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Manual workflow dispatch

CI enforces:
- All tests pass
- Coverage >80%
- No open handles
- No console errors

## Troubleshooting

### "Cannot find module" errors
- Check import paths use `.js` extension
- Verify jest.config.js moduleNameMapper

### "Open handles" warnings
- Close all connections in afterAll()
- Use jest.setTimeout() for long-running tests
- Enable forceExit in jest.config.js

### Firebase Emulator issues
- Ensure emulator is running: `firebase emulators:start`
- Check FIRESTORE_EMULATOR_HOST env var
- Clear emulator data between test runs

### Flaky tests
- Avoid hardcoded delays (`setTimeout`)
- Use `waitFor` utilities
- Mock time-dependent code
- Ensure proper test isolation

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Guide](https://kulshekhar.github.io/ts-jest/)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Testcontainers](https://www.testcontainers.org/)
- [Firebase Test Lab](https://firebase.google.com/docs/test-lab)
