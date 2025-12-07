# Architecture Guide

Comprehensive architecture decisions and patterns for the Question Randomizer AI Agent Service.

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [System Architecture](#system-architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Security Architecture](#security-architecture)

---

## Architecture Decisions

### 1. Ephemeral Agent Pattern

**Decision:** Create new agent instance per task (stateless)

**Rationale:**
- **Cost-effective** - Only pay for compute during task execution
- **Easier to scale** - Spin up workers as needed
- **Simpler architecture** - No state management in service
- **Fault tolerance** - Failed task doesn't affect others

**Trade-offs:**
- ❌ No persistent agent "memory" between tasks
- ✅ Can load conversation history from Firestore if needed

**Implementation:**
```typescript
// New agent instance for each request
const agent = new AgentExecutor(anthropic, firestoreService);
const result = await agent.executeTask(task, userId);
```

**Scaling Strategy:**
- Horizontal scaling: Add more service instances as load increases
- Queue-based: Long tasks processed asynchronously in background
- Stateless design: Any instance can handle any request

---

### 2. Direct Firestore Access

**Decision:** Agent tools access Firestore directly (not through C# Backend)

**Rationale:**
- **True autonomy** - Agent can decide what data to fetch/modify
- **Better performance** - No roundtrip to C# Backend for every operation
- **Agent capabilities** - Agent can execute complex multi-step workflows independently
- **Simpler architecture** - Agent directly uses tools, not API calls

**Trade-offs:**
- ❌ Two services writing to same database (requires coordination via userId filtering)
- ✅ Real agent autonomy and power

**Security Pattern (CRITICAL):**
```typescript
// ✅ CORRECT - Always filter by userId
const questions = await db.collection('questions')
  .where('userId', '==', context.userId)
  .get();

// ❌ WRONG - Security vulnerability!
const questions = await db.collection('questions').get();
```

**Why This Pattern:**
- Service account has full Firestore access (bypasses security rules)
- UserId filtering is the ONLY security boundary
- Every tool MUST enforce userId filtering

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
| **User feedback** | Real-time stream | Poll task status |
| **Resource usage** | Holds connection open | Releases connection |

**Architecture Diagram:**

```
┌─────────────────┐
│  C# Backend API │
└────────┬────────┘
         │
         ├──── Quick Tasks (<30s) ────┐
         │                             │
         │                      ┌──────▼──────┐
         │                      │ SSE Stream  │
         │                      │ /agent/task │
         │                      └──────┬──────┘
         │                             │
         │                      ┌──────▼──────────┐
         │                      │ Agent Executor  │
         │                      │ (synchronous)   │
         │                      └─────────────────┘
         │
         └──── Long Tasks (>30s) ────┐
                                     │
                              ┌──────▼───────────┐
                              │ Queue Endpoint   │
                              │ /agent/task/queue│
                              └──────┬───────────┘
                                     │
                              ┌──────▼──────┐
                              │  BullMQ     │
                              │  (Redis)    │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────────┐
                              │ Agent Worker    │
                              │ (background)    │
                              └─────────────────┘
```

---

### 4. TypeScript over Python

**Decision:** Use TypeScript for agent service

**Rationale:**
- Anthropic SDK supports both TypeScript and Python
- **Better type safety** than Python (strict mode, compile-time checks)
- **Same language as frontend** - Can share types with Angular
- **Team expertise** - Team already familiar with TypeScript
- **Good async/await support** for I/O operations
- **Excellent tooling** - ESLint, Prettier, Jest

**Trade-offs:**
- ❌ Python has richer AI/ML ecosystem
- ✅ Not critical for this use case (no custom ML models)
- ✅ Node.js excellent for I/O-heavy workloads (API calls, database)

**Type Safety Benefits:**
```typescript
// Compile-time type checking
interface AgentContext {
  userId: string;
  taskId: string;
}

// TypeScript catches this error at compile time
function executeTask(context: AgentContext) {
  console.log(context.usrId); // ❌ Error: Property 'usrId' does not exist
}
```

---

### 5. BullMQ over Other Queues

**Decision:** Use BullMQ (Redis-based) for task queue

**Rationale:**
- **Excellent TypeScript support** with type-safe APIs
- **Built-in retry/backoff mechanisms** (exponential backoff, max attempts)
- **Good monitoring UI** (Bull Board)
- **Redis already needed** for caching
- **Persistent queue** (survives server restarts)
- **Mature ecosystem** (battle-tested, active development)

**Trade-offs:**
- ❌ Redis becomes critical dependency
- ✅ Redis is battle-tested and reliable
- ✅ Can use managed Redis (Memorystore, ElastiCache, Azure Cache)

**Alternatives Considered:**

| Queue | Pros | Cons | Verdict |
|-------|------|------|---------|
| **BullMQ** | TypeScript support, retry logic, UI | Redis dependency | ✅ **Chosen** |
| AWS SQS | Managed, serverless | Vendor lock-in, polling overhead | ❌ Not TypeScript-native |
| RabbitMQ | Feature-rich | Complex setup, no TypeScript SDK | ❌ Overkill for use case |
| Kafka | High throughput | Heavy, complex, expensive | ❌ Not needed |

---

## System Architecture

### System Context Diagram

```
┌──────────────────┐
│  Angular Frontend│
│  (User Interface)│
└────────┬─────────┘
         │ HTTP
         │
┌────────▼──────────┐
│  C# Backend API   │
│  (Orchestration)  │
└────────┬──────────┘
         │
         ├─── HTTP ──────► ┌─────────────────────┐
         │                 │ TypeScript AI Agent │
         │                 │      Service        │
         │                 └──────────┬──────────┘
         │                            │
         │                            ├──► Anthropic Claude API
         │                            │
         │                            ├──► Redis (BullMQ Queue)
         │                            │
         └──── Firestore ◄────────────┘
                (direct access)
```

**Architecture Principles:**
1. **3-Service Architecture**: Frontend → C# Backend → TypeScript Agent Service
2. **Direct Database Access**: Agent Service accesses Firestore directly (not through C# Backend)
3. **Stateless Services**: All services are stateless and horizontally scalable
4. **Async Processing**: Long tasks processed via queue (BullMQ)

---

### Agent Execution Flow

**Synchronous Streaming (Quick Tasks):**

```
1. User sends task → C# Backend
2. C# Backend → POST /agent/task (opens SSE stream)
3. Agent Service creates AgentExecutor
4. Agent executes task (calls tools as needed)
5. Progress streamed back via SSE (tool calls, thinking, results)
6. Agent completes → final result streamed
7. SSE connection closed
8. C# Backend returns result to user
```

**Asynchronous Queue (Long Tasks):**

```
1. User sends task → C# Backend
2. C# Backend → POST /agent/task/queue
3. Agent Service adds task to BullMQ queue → returns taskId
4. C# Backend returns taskId to user (202 Accepted)
5. Worker picks up task from queue
6. Worker executes task (same as synchronous)
7. Worker updates task status in Firestore
8. User polls GET /agent/task/:taskId for status
9. When complete, user retrieves result
```

---

## Project Structure

### High-Level Structure

```
question-randomizer-ai-agent/
├── src/                    # Source code
│   ├── server.ts          # Express server entry point
│   ├── config/            # Configuration (Firebase, Anthropic, Redis)
│   ├── api/               # HTTP API layer (routes, controllers, middleware)
│   ├── agent/             # Agent execution engine
│   ├── tools/             # 15 agent tools (read, write, analyze)
│   ├── queue/             # BullMQ queue and workers
│   ├── services/          # Business logic (Firestore, cache, task tracking)
│   ├── models/            # Data models (entities, DTOs)
│   └── utils/             # Utilities (logging, errors, validation)
├── tests/                 # Test suite (unit + integration)
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── k8s/                   # Kubernetes manifests
```

### Detailed Structure by Layer

#### API Layer (`src/api/`)

```
api/
├── routes/                # Route definitions
│   ├── agent.routes.ts   # /agent/task, /agent/task/queue, /agent/task/:id
│   └── health.routes.ts  # /health, /ready, /live
├── controllers/           # Request handlers
│   └── agent.controller.ts
└── middleware/            # Middleware
    ├── error-handler.ts  # Global error handling
    ├── request-logger.ts # Request logging
    ├── timeout.ts        # Request timeout
    └── validation.ts     # Input validation
```

#### Agent Layer (`src/agent/`)

```
agent/
├── agent-executor.ts      # Main agent logic (uses Claude SDK)
├── agent-config.ts        # Agent SDK configuration
├── streaming/
│   ├── sse-manager.ts    # Server-Sent Events management
│   └── stream-formatter.ts # Format agent output for SSE
└── context/
    └── agent-context.ts  # Agent context (userId, taskId)
```

#### Tools Layer (`src/tools/`)

```
tools/
├── index.ts              # Export all tools
├── schemas/              # Zod validation schemas
│   ├── question.schema.ts
│   ├── category.schema.ts
│   ├── qualification.schema.ts
│   └── common.schema.ts
├── data-retrieval/       # 6 read-only tools
│   ├── get-questions.tool.ts
│   ├── get-question-by-id.tool.ts
│   ├── get-categories.tool.ts
│   ├── get-qualifications.tool.ts
│   ├── get-uncategorized.tool.ts
│   └── search-questions.tool.ts
├── data-modification/    # 7 write tools
│   ├── create-question.tool.ts
│   ├── update-question.tool.ts
│   ├── delete-question.tool.ts
│   ├── update-category.tool.ts
│   ├── create-category.tool.ts
│   ├── create-qualification.tool.ts
│   └── batch-update-questions.tool.ts
└── data-analysis/        # 2 analysis tools
    ├── find-duplicates.tool.ts
    └── analyze-difficulty.tool.ts
```

**See [AGENT-TOOLS.md](./AGENT-TOOLS.md) for complete tool documentation.**

---

## Technology Stack

### Core Runtime
- **Node.js 20 LTS** - Long-term support (until April 2026)
- **TypeScript 5+** - Latest language features with strict mode
- **Express.js** - Lightweight HTTP server

### Key Libraries

**AI & Agent:**
- **@anthropic-ai/sdk** (v0.32.0+) - Claude API client (Anthropic SDK)
- **zod** (v3.23.0+) - Schema validation for agent tool inputs

**Database & Storage:**
- **firebase-admin** (v12.6.0+) - Firebase Admin SDK (Firestore access)
- **ioredis** (v5.4.0+) - Redis client for caching and queue

**Queue:**
- **bullmq** (v5.13.0+) - Redis-based task queue with retry logic

**Utilities:**
- **pino** (v9.4.0+) - High-performance structured logging
- **cors** (v2.8.5+) - CORS middleware
- **helmet** (v7.1.0+) - Security headers
- **dotenv** (v16.4.0+) - Environment variable management

**Testing:**
- **jest** (v29.7.0+) - Test framework
- **ts-jest** (v29.2.0+) - TypeScript support for Jest
- **supertest** (v7.0.0+) - HTTP API testing
- **@testcontainers/redis** (v10.13.0+) - Redis containers for integration tests

**Development:**
- **tsx** (v4.19.0+) - TypeScript execution (faster than ts-node)
- **nodemon** (v3.1.0+) - Auto-reload during development
- **eslint** (v9.0.0+) - Code linting
- **prettier** (v3.3.0+) - Code formatting

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────┐
│ 1. API Layer Security                       │
│    - CORS (restrict origins)                │
│    - Helmet (security headers)              │
│    - Request validation (Zod schemas)       │
│    - Rate limiting (future)                 │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 2. Application Layer Security               │
│    - UserId filtering (MANDATORY)           │
│    - Input validation (all tools)           │
│    - Error sanitization                     │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 3. Data Layer Security                      │
│    - Service account (minimal permissions)  │
│    - Firestore rules (frontend only)        │
│    - Secret management (credentials)        │
└─────────────────────────────────────────────┘
```

### Critical Security Rules

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

**Enforcement:**
- All tools receive `AgentContext` with `userId`
- All Firestore operations use `context.userId`
- Integration tests verify userId filtering
- Code review checklist includes userId filtering

---

#### 2. Input Validation

All tool inputs validated with Zod schemas before processing.

**Example:**
```typescript
const schema = z.object({
  questionText: z.string().min(5).max(500),
  categoryId: z.string().optional()
});

// Will throw ZodError if invalid
const validated = schema.parse(input);
```

**Benefits:**
- Prevents injection attacks
- Catches type errors early
- Documents expected input format
- Provides clear error messages

---

#### 3. Error Sanitization

**Don't leak sensitive information:**

```typescript
// ❌ BAD - Leaks database structure
throw new Error(`Failed to query collection 'questions' in project ${projectId}`);

// ✅ GOOD - Generic message
throw new Error('Failed to fetch questions. Please try again.');
```

**Pattern:**
- Log full errors server-side (with context)
- Return sanitized errors to client
- Never expose: database structure, credentials, internal IPs

---

#### 4. Firestore Security Rules

**Backend service account** (used by this service):
- Has full read/write access to Firestore
- Bypasses Firestore security rules
- **Therefore, userId filtering in code is CRITICAL**

**Frontend client** (Angular app):
- Access restricted by Firestore security rules
- Can only read/write data where `userId == auth.uid`

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
- Use Secret Manager (Google Cloud Secret Manager, Azure Key Vault, AWS Secrets Manager)
- Pass secrets via environment variables
- Or use Workload Identity (GCP) / IAM roles (AWS) for automatic credentials

**See [CONFIGURATION.md](./CONFIGURATION.md) for detailed secret management.**

---

## Success Metrics

### Performance Targets
- Agent tasks complete in < 30 seconds (p95)
- API response time < 500ms (p95)
- Queue processes 100+ tasks/hour
- Zero cross-user data leaks

### Reliability Targets
- 99.9% uptime
- < 1% task failure rate
- All failed tasks successfully retried
- Zero data loss incidents

### Quality Targets
- > 80% code coverage
- Zero critical security vulnerabilities
- All tests passing in CI
- Clean architecture verified

---

**See Also:**
- [AGENT-TOOLS.md](./AGENT-TOOLS.md) - Complete tool documentation
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [SECURITY.md](./SECURITY.md) - Security best practices
