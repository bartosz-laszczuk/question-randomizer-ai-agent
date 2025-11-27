# Question Randomizer AI Agent Service - Implementation Guide

**Project:** Question Randomizer AI Agent Service
**Technology:** Node.js 20+ with TypeScript 5+
**Architecture:** Microservice with Claude Agent SDK
**AI Model:** Claude Sonnet 4.5
**Database:** Firebase Firestore (direct access)
**Queue:** BullMQ + Redis
**Last Updated:** 2025-11-27
**Status:** Phase 0 Complete - Ready for Implementation

---

## 📚 Documentation Index

This file (CLAUDE.md) is the **single source of truth** for the AI Agent Service. Refer to this document for all architectural decisions, implementation patterns, and project guidelines.

**Additional Documentation:**
- **[README.md](./README.md)** - Quick start and project overview
- **[docs/SETUP.md](./docs/SETUP.md)** - Complete setup instructions (Phase 1+)
- **[docs/AGENT-TOOLS.md](./docs/AGENT-TOOLS.md)** - All 15 agent tools documented (Phase 3+)
- **[docs/STREAMING.md](./docs/STREAMING.md)** - SSE streaming guide (Phase 5+)
- **[docs/QUEUE.md](./docs/QUEUE.md)** - BullMQ architecture (Phase 6+)
- **[docs/TASK-EXAMPLES.md](./docs/TASK-EXAMPLES.md)** - Example agent tasks (Phase 9+)

---

## Project Overview

### Purpose
Build a TypeScript-based AI Agent Service that executes autonomous tasks using the Anthropic Claude Agent SDK. This service is part of the Question Randomizer application's 3-service architecture.

### What This Service Does
- **Executes AI-powered tasks** - Users send natural language tasks, agent executes them autonomously
- **Direct Firestore access** - Agent tools read/write questions, categories, qualifications
- **Streaming responses** - Real-time progress updates via Server-Sent Events (SSE)
- **Async queue processing** - Long-running tasks processed in background with BullMQ
- **User-scoped operations** - All operations filtered by userId for security

### System Context

```
Angular Frontend → C# Backend API → TypeScript AI Agent Service
                         ↓                         ↓
                   Firestore ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
                                  (direct access)

AI Agent Service → Redis (BullMQ Queue)
AI Agent Service → Anthropic Claude API
```

**Architecture:**
1. **Angular Frontend** (existing) - User interface
2. **C# Backend API** (existing) - Main API and orchestration
3. **TypeScript AI Agent Service** (this project) - Autonomous AI task execution

**Key Integration Points:**
- C# Backend sends tasks to Agent Service (`POST /agent/task`)
- Agent Service executes tasks using Claude SDK
- Agent Service accesses Firestore directly via agent tools
- Results streamed back to C# Backend via SSE
- Long tasks processed asynchronously via BullMQ queue

---

## Key Goals

- ✅ Production-ready AI agent with Claude SDK
- ✅ 15 autonomous agent tools for Firestore operations
- ✅ Streaming responses (SSE) for real-time feedback
- ✅ Async queue (BullMQ) for long-running tasks
- ✅ Comprehensive test coverage (>80% - unit + integration)
- ✅ Strong security (userId filtering on all operations)
- ✅ Clean, maintainable TypeScript codebase
- ✅ Full CI/CD with GitHub Actions

---

## Architecture Decisions

### 1. Ephemeral Agent Pattern
**Decision:** Create new agent instance per task (stateless)

**Rationale:**
- Cost-effective - only pay for compute during task execution
- Easier to scale - spin up workers as needed
- Simpler architecture - no state management in service
- Fault tolerance - failed task doesn't affect others

**Trade-off:**
- ❌ No persistent agent "memory" between tasks
- ✅ Can load conversation history from Firestore if needed

**Implementation:**
```typescript
// New agent instance for each request
const agent = new AgentExecutor(anthropic, firestoreService);
const result = await agent.executeTask(task, userId);
```

---

### 2. Direct Firestore Access
**Decision:** Agent tools access Firestore directly (not through C# Backend)

**Rationale:**
- **True autonomy** - Agent can decide what data to fetch/modify
- **Better performance** - No roundtrip to C# Backend for every operation
- **Agent capabilities** - Agent can execute complex multi-step workflows independently
- **Simpler architecture** - Agent directly uses tools, not API calls

**Trade-off:**
- ❌ Two services writing to same database (requires coordination via userId filtering)
- ✅ Real agent autonomy and power

**Security Pattern:**
```typescript
// ✅ CRITICAL: Always filter by userId
const questions = await db.collection('questions')
  .where('userId', '==', userId)
  .get();

// ❌ NEVER query without userId - Security vulnerability
const questions = await db.collection('questions').get();
```

---

### 3. Both Streaming and Queue
**Decision:** Support both SSE streaming and async queue processing

**Rationale:**
- **Different use cases** - Real-time vs background processing
- **User experience** - Immediate feedback for quick tasks, status polling for long tasks
- **Scalability** - Queue prevents overload, streaming provides responsiveness

**When to Use Each:**

| Scenario | Use Streaming (SSE) | Use Queue (BullMQ) |
|----------|---------------------|-------------------|
| **Task duration** | < 30 seconds | > 30 seconds |
| **User expectation** | Immediate result | Can wait |
| **Example** | "List my categories" | "Categorize 500 questions" |
| **Endpoint** | `POST /agent/task` | `POST /agent/task/queue` |

---

### 4. TypeScript over Python
**Decision:** Use TypeScript for agent service

**Rationale:**
- Anthropic SDK supports both TypeScript and Python
- **Better type safety** than Python
- **Same language as frontend** - can share types with Angular
- **Team expertise** - team already familiar with TypeScript
- Good async/await support for I/O operations

**Trade-off:**
- ❌ Python has richer AI/ML ecosystem
- ✅ Not critical for this use case (no custom ML models)

---

### 5. BullMQ over Other Queues
**Decision:** Use BullMQ (Redis-based) for task queue

**Rationale:**
- Excellent TypeScript support with type-safe APIs
- Built-in retry/backoff mechanisms
- Good monitoring UI (Bull Board)
- Redis already needed for caching
- Persistent queue (survives server restarts)

**Trade-off:**
- ❌ Redis becomes critical dependency
- ✅ Redis is battle-tested and reliable

---

## Technology Stack

### Core Runtime
- **Node.js 20 LTS** - Long-term support (until April 2026)
- **TypeScript 5+** - Latest language features with strict mode
- **Express.js** - Lightweight HTTP server

### Key Libraries

**AI & Agent:**
- **@anthropic-ai/sdk** - Claude API client (Anthropic SDK)
- **zod** - Schema validation for agent tool inputs

**Database & Storage:**
- **firebase-admin** - Firebase Admin SDK (Firestore access)
- **ioredis** - Redis client for caching and queue

**Queue:**
- **bullmq** - Redis-based task queue with retry logic

**Utilities:**
- **pino** - High-performance structured logging
- **cors** - CORS middleware
- **helmet** - Security headers
- **dotenv** - Environment variable management

**Testing:**
- **jest** - Test framework
- **ts-jest** - TypeScript support for Jest
- **supertest** - HTTP API testing
- **@testcontainers/redis** - Redis containers for integration tests

**Development:**
- **tsx** - TypeScript execution (faster than ts-node)
- **nodemon** - Auto-reload during development
- **eslint** - Code linting
- **prettier** - Code formatting

---

## Project Structure

```
question-randomizer-ai-agent/
├── src/
│   ├── server.ts                           # Express server entry point
│   │
│   ├── config/                             # Configuration
│   │   ├── environment.ts                  # Environment validation (Zod)
│   │   ├── firebase.config.ts              # Firebase Admin SDK init
│   │   ├── anthropic.config.ts             # Anthropic client config
│   │   └── redis.config.ts                 # Redis connection
│   │
│   ├── api/                                # HTTP API layer
│   │   ├── routes/
│   │   │   ├── agent.routes.ts             # Agent endpoints
│   │   │   └── health.routes.ts            # Health checks
│   │   ├── controllers/
│   │   │   └── agent.controller.ts         # Request handlers
│   │   └── middleware/
│   │       ├── error-handler.ts            # Global error handling
│   │       ├── request-logger.ts           # Request logging
│   │       ├── timeout.ts                  # Request timeout
│   │       └── validation.ts               # Input validation
│   │
│   ├── agent/                              # Agent execution engine
│   │   ├── agent-executor.ts               # Main agent logic
│   │   ├── agent-config.ts                 # Agent SDK configuration
│   │   ├── streaming/
│   │   │   ├── sse-manager.ts              # Server-Sent Events
│   │   │   └── stream-formatter.ts         # Format agent output
│   │   └── context/
│   │       └── agent-context.ts            # Agent context (userId, taskId)
│   │
│   ├── tools/                              # 15 agent tools
│   │   ├── index.ts                        # Export all tools
│   │   ├── schemas/                        # Zod schemas
│   │   │   ├── question.schema.ts
│   │   │   ├── category.schema.ts
│   │   │   ├── qualification.schema.ts
│   │   │   └── common.schema.ts
│   │   ├── data-retrieval/                 # 6 read-only tools
│   │   │   ├── get-questions.tool.ts
│   │   │   ├── get-question-by-id.tool.ts
│   │   │   ├── get-categories.tool.ts
│   │   │   ├── get-qualifications.tool.ts
│   │   │   ├── get-uncategorized.tool.ts
│   │   │   └── search-questions.tool.ts
│   │   ├── data-modification/              # 7 write tools
│   │   │   ├── create-question.tool.ts
│   │   │   ├── update-question.tool.ts
│   │   │   ├── delete-question.tool.ts
│   │   │   ├── update-category.tool.ts
│   │   │   ├── create-category.tool.ts
│   │   │   ├── create-qualification.tool.ts
│   │   │   └── batch-update-questions.tool.ts
│   │   └── data-analysis/                  # 2 analysis tools
│   │       ├── find-duplicates.tool.ts
│   │       └── analyze-difficulty.tool.ts
│   │
│   ├── queue/                              # BullMQ async queue
│   │   ├── task-queue.ts                   # Queue setup
│   │   ├── workers/
│   │   │   └── agent-worker.ts             # Worker for background tasks
│   │   └── jobs/
│   │       └── agent-task.job.ts           # Job definition
│   │
│   ├── services/                           # Business logic layer
│   │   ├── firestore.service.ts            # Firestore operations
│   │   ├── cache.service.ts                # Redis caching
│   │   └── task-tracker.service.ts         # Track task status
│   │
│   ├── models/                             # Data models
│   │   ├── entities/                       # Match C# Backend entities
│   │   │   ├── question.entity.ts
│   │   │   ├── category.entity.ts
│   │   │   └── qualification.entity.ts
│   │   └── dtos/
│   │       ├── agent-request.dto.ts
│   │       └── agent-response.dto.ts
│   │
│   └── utils/                              # Utilities
│       ├── logger.ts                       # Pino logger
│       ├── errors.ts                       # Custom error classes
│       └── validators.ts                   # Common validators
│
├── tests/                                  # Test suite (>80% coverage)
│   ├── unit/                               # 70% of tests
│   │   ├── tools/                          # Test all 15 tools
│   │   ├── services/                       # Test services
│   │   └── agent/                          # Test agent executor
│   ├── integration/                        # 25% of tests
│   │   ├── api/                            # Test endpoints
│   │   ├── tools/                          # Tools + Firestore
│   │   └── queue/                          # Queue integration
│   └── helpers/
│       ├── firebase-emulator.helper.ts     # Firestore Emulator
│       ├── redis-container.helper.ts       # Testcontainers Redis
│       └── test-data.helper.ts             # Test data generation
│
├── docs/                                   # Documentation
│   ├── SETUP.md                            # Setup guide
│   ├── AGENT-TOOLS.md                      # Tool docs
│   ├── TASK-EXAMPLES.md                    # Example tasks
│   ├── STREAMING.md                        # SSE guide
│   ├── QUEUE.md                            # Queue architecture
│   └── TROUBLESHOOTING.md                  # Common issues
│
├── scripts/                                # Utility scripts
│   ├── setup-firebase-emulator.sh
│   └── seed-test-data.ts
│
├── .env.example                            # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
├── Dockerfile                              # Production Docker image
├── docker-compose.yml                      # Dev services (Redis, Firebase)
├── README.md                               # Quick reference
└── CLAUDE.md                               # This file
```

---

## Agent Tools Overview

The agent has **15 tools** organized into 3 categories:

### Data Retrieval Tools (6 tools - Read-only, low risk)

1. **`get_questions`** - Fetch questions with filters (categoryId, limit, search)
2. **`get_question_by_id`** - Get specific question by ID
3. **`get_categories`** - Get all user categories
4. **`get_qualifications`** - Get all qualifications
5. **`get_uncategorized_questions`** - Get questions without category
6. **`search_questions`** - Full-text search in questions

**Characteristics:**
- Read-only operations
- Can be called frequently by agent
- No side effects
- Low security risk

---

### Data Modification Tools (7 tools - Write operations, higher risk)

7. **`create_question`** - Create new interview question
8. **`update_question`** - Update question fields
9. **`delete_question`** - Soft delete question (set isActive = false)
10. **`update_question_category`** - Assign category to question
11. **`create_category`** - Create new category
12. **`create_qualification`** - Create new qualification
13. **`batch_update_questions`** - Update multiple questions at once

**Characteristics:**
- Write operations
- Require careful validation (Zod schemas)
- All changes logged
- Must verify userId ownership

---

### Data Analysis Tools (2 tools - Compute-heavy)

14. **`find_duplicate_questions`** - Find potential duplicate questions based on similarity
15. **`analyze_question_difficulty`** - Analyze question complexity and difficulty

**Characteristics:**
- May take longer to execute
- No side effects (read-only)
- Can use caching for performance

---

### Tool Implementation Pattern

Every tool follows this standard pattern:

```typescript
// src/tools/[category]/[tool-name].tool.ts
import { z } from 'zod';

// 1. Input schema (Zod validation)
const inputSchema = z.object({
  // Define all parameters with validation rules
  categoryId: z.string().optional(),
  limit: z.number().max(100).default(50)
});

// 2. Tool definition for Claude SDK
export const toolName = {
  name: 'tool_name',
  description: 'Clear description for the agent',

  input_schema: {
    type: 'object',
    properties: {
      // JSON Schema matching Zod schema
    },
    required: ['required_fields']
  },

  // 3. Execution function
  execute: async (input: unknown, context: AgentContext) => {
    // Validate input
    const validated = inputSchema.parse(input);

    // Execute Firestore operations (ALWAYS with context.userId)
    const result = await firestoreService.someOperation(
      context.userId,
      validated
    );

    // Return formatted response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
};
```

**Security Pattern (CRITICAL):**
```typescript
// ✅ CORRECT - Always filter by userId
const questions = await db.collection('questions')
  .where('userId', '==', context.userId)
  .get();

// ❌ WRONG - Security vulnerability
const questions = await db.collection('questions').get();
```

**See [docs/AGENT-TOOLS.md](./docs/AGENT-TOOLS.md) for complete documentation of all 15 tools.**

---

## API Endpoints

### Agent Execution

```
POST /agent/task
  Description: Execute agent task with streaming response (SSE)
  Request: { task: string, userId: string }
  Response: Server-Sent Events stream
  Content-Type: text/event-stream

  Events:
    - event: progress, data: { type: "tool_use", toolName: "get_questions", input: {...} }
    - event: progress, data: { type: "thinking", content: "Analyzing questions..." }
    - event: complete, data: { taskId: "task_123", result: "..." }
    - event: error, data: { message: "Error message" }

POST /agent/task/queue
  Description: Queue task for async background processing
  Request: { task: string, userId: string }
  Response: { taskId: string, status: "pending" }
  Status: 202 Accepted

GET /agent/task/:taskId
  Description: Get status of queued task
  Response: { taskId, status, result?, error? }
  Status: 200 OK | 404 Not Found
```

### Health Checks

```
GET /health
  Description: Full health check with dependencies
  Response: {
    status: "healthy" | "degraded" | "unhealthy",
    checks: {
      firestore: "healthy" | "unhealthy",
      redis: "healthy" | "unhealthy",
      anthropic: "not_checked"
    }
  }

GET /ready
  Description: Kubernetes readiness probe
  Response: { ready: true }

GET /live
  Description: Kubernetes liveness probe
  Response: { alive: true }
```

---

## Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development|test|production
PORT=3002
LOG_LEVEL=debug|info|warn|error

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json
# OR (for production)
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false|true

# Queue
QUEUE_CONCURRENCY=3

# Timeouts
AGENT_TIMEOUT_MS=120000
REQUEST_TIMEOUT_MS=150000
```

### Development (.env)

```env
NODE_ENV=development
PORT=3002
LOG_LEVEL=debug
FIREBASE_PROJECT_ID=dev-project
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json
ANTHROPIC_API_KEY=sk-ant-api03-...
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_CONCURRENCY=3
```

### Production (Cloud Run / Kubernetes)

```env
NODE_ENV=production
PORT=3002
LOG_LEVEL=info
FIREBASE_PROJECT_ID=prod-project
FIREBASE_CREDENTIALS_JSON=${SECRET:FIREBASE_CREDENTIALS}
ANTHROPIC_API_KEY=${SECRET:ANTHROPIC_API_KEY}
REDIS_HOST=redis-prod.internal
REDIS_PORT=6379
REDIS_PASSWORD=${SECRET:REDIS_PASSWORD}
REDIS_TLS=true
```

**See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for detailed configuration examples.**

---

## Implementation Phases

### Phase 0: Project Documentation ✅ COMPLETE
- [x] Create repository structure
- [x] Create CLAUDE.md (this file)
- [x] Create README.md
- [x] Create .gitignore
- [x] Initial git commit

### Phase 1: Project Setup & Core Infrastructure (Days 1-2)
- [ ] Initialize TypeScript project
- [ ] Install all dependencies
- [ ] Configure TypeScript (strict mode)
- [ ] Set up environment validation (Zod)
- [ ] Initialize Firebase Admin SDK
- [ ] Create Express server with middleware
- [ ] Implement health check endpoint
- [ ] Set up Pino logging

**Deliverables:**
- Project builds without errors
- Server starts and responds to health check
- Firebase connection works
- Environment validation catches missing variables

---

### Phase 2: Firestore Service Layer (Days 3-4)
- [ ] Create entity models (Question, Category, Qualification)
- [ ] Implement FirestoreService with all CRUD operations
- [ ] Add userId-based security filtering
- [ ] Support batch operations
- [ ] Error handling for missing documents

**Deliverables:**
- All Firestore operations work correctly
- Security filtering prevents cross-user access
- Batch operations handle multiple documents efficiently

---

### Phase 3: Agent Tools Implementation (Days 5-8)
- [ ] Define Zod schemas for all tool inputs
- [ ] Implement 6 data retrieval tools
- [ ] Implement 7 data modification tools
- [ ] Implement 2 data analysis tools
- [ ] Create tool registry (export all tools)

**Deliverables:**
- All 15 tools implemented with proper schemas
- Comprehensive input validation (Zod)
- All tools respect userId context
- Tools return structured JSON responses

---

### Phase 4: Agent Execution Engine (Days 9-11)
- [ ] Create AgentContext interface
- [ ] Implement AgentExecutor with Claude SDK
- [ ] Configure agent (model, tools, max iterations)
- [ ] Handle agent loops and tool calls
- [ ] Implement timeout and error handling

**Deliverables:**
- Agent can execute multi-step tasks autonomously
- Tools are called by agent based on task
- Timeout prevents infinite loops
- Errors are logged and handled gracefully

---

### Phase 5: Streaming Implementation (Days 12-13)
- [ ] Implement SSEManager for Server-Sent Events
- [ ] Stream agent progress in real-time
- [ ] Handle connection drops gracefully
- [ ] Create streaming endpoint (POST /agent/task)

**Deliverables:**
- SSE streaming works from agent service
- Progress updates stream in real-time
- Connection drops handled gracefully

---

### Phase 6: BullMQ Queue Integration (Days 14-15)
- [ ] Set up Redis connection
- [ ] Create BullMQ queue for agent tasks
- [ ] Implement agent worker (3 concurrent tasks)
- [ ] Implement TaskTrackerService (Firestore)
- [ ] Add retry logic (3 retries, exponential backoff)
- [ ] Create queue endpoints

**Deliverables:**
- BullMQ queue processes tasks asynchronously
- Worker handles concurrent task execution
- Task status tracked in Firestore
- Retry logic works for failed tasks

---

### Phase 7: Testing Infrastructure (Days 16-19)
- [ ] Configure Jest with TypeScript
- [ ] Set up Firebase Emulator for integration tests
- [ ] Configure Testcontainers for Redis
- [ ] Write unit tests for all 15 tools (>90% coverage)
- [ ] Write integration tests for API endpoints
- [ ] Write integration tests for tools + Firestore
- [ ] Achieve >80% overall code coverage

**Deliverables:**
- Unit tests for all tools
- Integration tests for API endpoints
- Firebase Emulator integration works
- All tests pass in CI environment
- Code coverage >80%

---

### Phase 8: C# Backend Integration (Days 20-21)
- [ ] Update IAgentService interface in C# Backend
- [ ] Implement SSE stream consumer in C# Backend
- [ ] Add streaming endpoints to Controllers
- [ ] Add streaming endpoints to Minimal API
- [ ] Test C# ↔ TypeScript communication

**Deliverables:**
- C# Backend can consume SSE streams
- Queue endpoints work for async tasks
- Both Controllers and Minimal API support streaming
- Integration tests validate communication

---

### Phase 9: Additional Documentation (Days 22-23)
- [ ] Complete SETUP.md (setup guide)
- [ ] Complete AGENT-TOOLS.md (all 15 tools documented)
- [ ] Complete STREAMING.md (SSE guide)
- [ ] Complete QUEUE.md (BullMQ architecture)
- [ ] Complete TASK-EXAMPLES.md (example agent tasks)
- [ ] Complete TROUBLESHOOTING.md (common issues)

**Deliverables:**
- All documentation complete and accurate
- Setup guide verified on clean machine
- Tool documentation includes all 15 tools

---

### Phase 10: Deployment & Production Readiness (Days 24-25)
- [ ] Create production Dockerfile
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure production environment
- [ ] Implement health checks
- [ ] Performance testing (>100 concurrent requests)
- [ ] Security audit (`npm audit`, Snyk)
- [ ] Load testing (<500ms p95 response time)

**Deliverables:**
- Production Dockerfile builds successfully
- CI/CD pipeline runs all tests
- Health checks pass
- Load tests show acceptable performance
- Security audit passed
- Deployment guide complete

---

## Security Considerations

### CRITICAL Security Rules

#### 1. UserId Filtering (MANDATORY)

**Every Firestore query MUST filter by userId:**

```typescript
// ✅ CORRECT - Always filter by userId
const questions = await db.collection('questions')
  .where('userId', '==', context.userId)
  .get();

// ❌ WRONG - Security vulnerability!
const questions = await db.collection('questions').get();
```

**Why:**
- Prevents users from accessing other users' data
- Single most important security rule
- Enforced in all 15 agent tools
- Verified by integration tests

---

#### 2. Input Validation

- All tool inputs validated with Zod schemas
- Reject invalid inputs before Firestore operations
- Log validation failures
- Return clear error messages

**Example:**
```typescript
const schema = z.object({
  questionText: z.string().min(5).max(500),
  categoryId: z.string().optional()
});

// Will throw ZodError if invalid
const validated = schema.parse(input);
```

---

#### 3. Error Messages

- Don't leak sensitive information in error messages
- Log full errors server-side (with context)
- Return sanitized errors to client

**Example:**
```typescript
// ❌ BAD - Leaks database structure
throw new Error(`Failed to query collection 'questions' in project ${projectId}`);

// ✅ GOOD - Generic message
throw new Error('Failed to fetch questions. Please try again.');
```

---

#### 4. Firestore Security Rules

**Backend service account** (used by this service):
- Has full read/write access to Firestore
- Bypasses Firestore security rules
- **Therefore, userId filtering in code is CRITICAL**

**Frontend client** (Angular app):
- Access restricted by Firestore security rules
- Can only read/write data where userId matches auth token

---

#### 5. API Key Management

**Never commit:**
- Firebase service account credentials
- Anthropic API keys
- Any secrets or credentials

**Development:**
- Use `.env` file (in `.gitignore`)
- Store credentials in `firebase-dev-credentials.json` (in `.gitignore`)

**Production:**
- Use Secret Manager (Google Cloud Secret Manager, Azure Key Vault, etc.)
- Pass secrets via environment variables
- Or use Workload Identity (GCP) for automatic credentials

---

## Quick Start

### Prerequisites

- ✅ Node.js 20+ (`node --version` → 20.x.x)
- ✅ npm 10+ (`npm --version` → 10.x.x)
- ✅ Docker Desktop (for Redis and Firebase Emulator)
- ✅ Firebase project with service account credentials
- ✅ Anthropic API key (from console.anthropic.com)

### Installation

```bash
# Clone repository
cd C:\D\Repositories\question-randomizer-ai-agent

# Install dependencies
npm install

# Copy environment template
copy .env.example .env

# Edit .env and add:
# - FIREBASE_PROJECT_ID
# - FIREBASE_CREDENTIALS_PATH (path to service account JSON)
# - ANTHROPIC_API_KEY

# Build project
npm run build

# Run development server
npm run dev
# Server starts at http://localhost:3002
```

### Verify Setup

```bash
# Health check
curl http://localhost:3002/health

# Should return:
{
  "status": "healthy",
  "checks": {
    "firestore": "healthy",
    "redis": "healthy",
    "anthropic": "not_checked"
  }
}
```

**See [docs/SETUP.md](./docs/SETUP.md) for complete setup instructions.**

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── unit/                    # 70% of tests
│   ├── tools/              # Test all 15 tools (mocked Firestore)
│   ├── services/           # Test service layer
│   └── agent/              # Test agent executor
│
├── integration/            # 25% of tests
│   ├── api/               # Test API endpoints (real server)
│   ├── tools/             # Test tools with Firebase Emulator
│   └── queue/             # Test BullMQ integration
│
└── helpers/
    ├── firebase-emulator.helper.ts
    ├── redis-container.helper.ts
    └── test-data.helper.ts
```

**Coverage Goals:**
- Minimum: 70% overall
- Target: 80% overall
- Critical paths: 95% (tool execution, userId filtering)

---

## Commands Reference

### Development

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build project
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Docker

```bash
# Build Docker image
docker build -t question-randomizer-agent:latest .

# Run container
docker run -p 3002:3002 --env-file .env question-randomizer-agent:latest

# Docker Compose (Redis + Firebase Emulator)
docker-compose up
```

---

## Troubleshooting

### Issue: "Firebase credentials not found"
**Solution:**
1. Ensure `firebase-dev-credentials.json` exists in project root
2. Check `FIREBASE_CREDENTIALS_PATH` in `.env` is correct
3. Verify file has valid JSON format

---

### Issue: "Anthropic API key invalid"
**Solution:**
1. Get API key from console.anthropic.com
2. Ensure it starts with `sk-ant-`
3. Set `ANTHROPIC_API_KEY` in `.env`

---

### Issue: "Redis connection failed"
**Solution:**
1. Start Redis: `docker-compose up redis`
2. Or install Redis locally: `sudo apt-get install redis-server`
3. Verify connection: `redis-cli ping` → should return `PONG`

---

### Issue: "Port 3002 already in use"
**Solution:**
1. Change port in `.env`: `PORT=3003`
2. Or kill process using port 3002:
   ```bash
   # Windows
   netstat -ano | findstr :3002
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:3002 | xargs kill
   ```

---

## Success Metrics

### Performance
- [ ] Agent tasks complete in < 30 seconds (p95)
- [ ] API response time < 500ms (p95)
- [ ] Queue processes 100+ tasks/hour
- [ ] Zero cross-user data leaks

### Reliability
- [ ] 99.9% uptime
- [ ] < 1% task failure rate
- [ ] All failed tasks successfully retried
- [ ] Zero data loss incidents

### Quality
- [ ] > 80% code coverage
- [ ] Zero critical security vulnerabilities
- [ ] All tests passing in CI
- [ ] Clean architecture verified

### User Experience
- [ ] Real-time progress updates work smoothly
- [ ] Agent responses are accurate and helpful
- [ ] Tasks complete without user intervention
- [ ] Clear, actionable error messages

---

## Next Steps

1. ✅ **Phase 0 Complete** - Documentation created
2. ➡️ **Start Phase 1** - Project setup & core infrastructure
3. **Read [docs/SETUP.md](./docs/SETUP.md)** - Complete setup guide
4. **Implement incrementally** - Complete one phase before moving to next
5. **Test continuously** - Write tests alongside implementation

---

## References

### C# Backend Files (Reference during implementation)

1. **`QuestionRandomizer.Infrastructure\Repositories\QuestionRepository.cs`**
   - Example of Firestore operations, userId filtering, batch operations

2. **`ARCHITECTURE.md`**
   - Complete system architecture, database schema, security rules

3. **`QuestionRandomizer.Application\Interfaces\IAgentService.cs`**
   - Current agent service contract (needs to be fulfilled)

4. **`QuestionRandomizer.Application\DTOs\QuestionDto.cs`**
   - DTO structure (should match TypeScript entities)

5. **`docs\CODE-TEMPLATES.md`**
   - Established patterns and conventions

### External Documentation

- **Anthropic Claude SDK:** https://docs.anthropic.com/
- **Firebase Admin SDK (Node.js):** https://firebase.google.com/docs/admin/setup
- **BullMQ:** https://docs.bullmq.io/
- **Zod:** https://zod.dev/

---

**Project Status:** Phase 0 Complete ✅
**Next Action:** Start Phase 1 - Project Setup & Core Infrastructure
**Last Updated:** 2025-11-27
**Version:** 1.0.0
