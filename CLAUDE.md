# Question Randomizer AI Agent Service - Implementation Guide

**Project:** Question Randomizer AI Agent Service
**Technology:** Node.js 20+ with TypeScript 5+
**Architecture:** Microservice with Claude Agent SDK
**AI Model:** Claude Sonnet 4.5
**Database:** Firebase Firestore (direct access)
**Queue:** BullMQ + Redis
**Last Updated:** 2025-11-28
**Status:** ✅ Production Ready - All Phases Complete

---

## 📚 Documentation Index

This file (CLAUDE.md) is the **implementation guide and quick reference** for the AI Agent Service.

**Core Documentation:**
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Architecture decisions, system design, technology stack
- **[CONFIGURATION.md](./docs/CONFIGURATION.md)** - Environment variables, deployment configs
- **[SETUP.md](./docs/SETUP.md)** - Complete setup instructions
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deployment guide (Docker, K8s, Cloud)

**Feature Documentation:**
- **[AGENT-TOOLS.md](./docs/AGENT-TOOLS.md)** - All 15 agent tools documented
- **[STREAMING.md](./docs/STREAMING.md)** - SSE streaming guide
- **[QUEUE.md](./docs/QUEUE.md)** - BullMQ queue architecture
- **[TASK-EXAMPLES.md](./docs/TASK-EXAMPLES.md)** - Example agent tasks

**Reference Documentation:**
- **[COMMANDS.md](./docs/COMMANDS.md)** - All npm scripts and CLI commands
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[README.md](./README.md)** - Quick start and project overview

---

## Project Overview

### Purpose
Build a TypeScript-based AI Agent Service that executes autonomous tasks using the Anthropic Claude Agent SDK. This service is part of the Question Randomizer application's 3-service architecture.

### What This Service Does
- **Executes AI-powered tasks** - Users send natural language tasks, agent executes autonomously
- **Direct Firestore access** - Agent tools read/write questions, categories, qualifications
- **Streaming responses** - Real-time progress updates via Server-Sent Events (SSE)
- **Async queue processing** - Long-running tasks via BullMQ
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

**📖 See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for complete system design and architecture decisions.**

---

## Key Features

- ✅ Production-ready AI agent with Claude SDK
- ✅ 15 autonomous agent tools for Firestore operations
- ✅ Streaming responses (SSE) for real-time feedback
- ✅ Async queue (BullMQ) for long-running tasks
- ✅ Comprehensive test coverage (>80%)
- ✅ Strong security (userId filtering on all operations)
- ✅ Full CI/CD with GitHub Actions
- ✅ Docker + Kubernetes ready

---

## Quick Start

### Prerequisites

- Node.js 20+ (`node --version`)
- npm 10+ (`npm --version`)
- Docker Desktop (for Redis and Firebase Emulator)
- Firebase project with service account credentials
- Anthropic API key (from console.anthropic.com)

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

**📖 See [SETUP.md](./docs/SETUP.md) for complete setup instructions.**

---

## Agent Tools

The agent has **15 tools** organized into 3 categories:

### Data Retrieval Tools (6 tools)
1. **get_questions** - Fetch questions with filters
2. **get_question_by_id** - Get specific question
3. **get_categories** - Get all user categories
4. **get_qualifications** - Get all qualifications
5. **get_uncategorized_questions** - Get uncategorized questions
6. **search_questions** - Full-text search

### Data Modification Tools (7 tools)
7. **create_question** - Create new question
8. **update_question** - Update question fields
9. **delete_question** - Soft delete question
10. **update_question_category** - Assign category
11. **create_category** - Create new category
12. **create_qualification** - Create new qualification
13. **batch_update_questions** - Update multiple questions

### Data Analysis Tools (2 tools)
14. **find_duplicate_questions** - Find duplicates by similarity
15. **analyze_question_difficulty** - Analyze complexity

**📖 See [AGENT-TOOLS.md](./docs/AGENT-TOOLS.md) for complete tool documentation with examples.**

---

## API Endpoints

### Agent Execution

```
POST /agent/task
  Execute task with streaming response (SSE)
  Request: { task: string, userId: string }
  Response: Server-Sent Events stream

POST /agent/task/queue
  Queue task for async background processing
  Request: { task: string, userId: string }
  Response: { taskId: string, status: "pending" }

GET /agent/task/:taskId
  Get status of queued task
  Response: { taskId, status, result?, error? }
```

### Health Checks

```
GET /health       - Full health check with dependencies
GET /ready        - Kubernetes readiness probe
GET /live         - Kubernetes liveness probe
```

---

## Configuration

### Environment Variables (Quick Reference)

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

**📖 See [CONFIGURATION.md](./docs/CONFIGURATION.md) for complete configuration guide with production examples.**

---

## Testing

### Run Tests

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch mode
```

### Test Structure

```
tests/
├── unit/                # 70% of tests - mocked dependencies
├── integration/         # 25% of tests - real dependencies
└── helpers/             # Test utilities
```

**Coverage Goals:**
- Minimum: 70% overall
- Target: 80% overall
- Critical paths: 95% (tool execution, userId filtering)

---

## Common Commands

**Development:**
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript → JavaScript
npm start                # Start production server
npm run lint             # Check code quality
npm run format           # Format code with Prettier
```

**Testing:**
```bash
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
```

**Docker:**
```bash
docker-compose up        # Start Redis + Firebase Emulator
docker build -t agent-service .
docker run -p 3002:3002 --env-file .env agent-service
```

**📖 See [COMMANDS.md](./docs/COMMANDS.md) for complete command reference.**

---

## Security - CRITICAL Rules

### 1. UserId Filtering (MANDATORY)

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
- Service account bypasses Firestore security rules
- UserId filtering is the ONLY security boundary
- Prevents cross-user data access
- Enforced in all 15 agent tools

### 2. Input Validation

All tool inputs validated with Zod schemas before processing.

### 3. Error Sanitization

Never expose database structure, credentials, or internal details in error messages.

### 4. Secret Management

**Never commit:**
- Firebase service account credentials
- Anthropic API keys
- Any secrets

**Production:**
- Use Secret Manager (Google Cloud, AWS, Azure)
- Pass secrets via environment variables

**📖 See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for complete security architecture.**

---

## Implementation Phases

### ✅ Phase 0: Project Documentation - COMPLETE
- [x] Repository structure
- [x] CLAUDE.md and README.md
- [x] .gitignore

### ✅ Phase 1: Project Setup & Core Infrastructure - COMPLETE
- [x] TypeScript project initialization
- [x] Environment validation (Zod)
- [x] Firebase Admin SDK
- [x] Express server with middleware
- [x] Health check endpoint
- [x] Pino logging

### ✅ Phase 2: Firestore Service Layer - COMPLETE
- [x] Entity models (Question, Category, Qualification)
- [x] FirestoreService with CRUD operations
- [x] UserId-based security filtering
- [x] Batch operations
- [x] Error handling

### ✅ Phase 3: Agent Tools Implementation - COMPLETE
- [x] Zod schemas for all tool inputs
- [x] 6 data retrieval tools
- [x] 7 data modification tools
- [x] 2 data analysis tools
- [x] Tool registry

### ✅ Phase 4: Agent Execution Engine - COMPLETE
- [x] AgentContext interface
- [x] AgentExecutor with Claude SDK
- [x] Agent configuration (model, tools, max iterations)
- [x] Tool call handling
- [x] Timeout and error handling

### ✅ Phase 5: Streaming Implementation - COMPLETE
- [x] SSEManager for Server-Sent Events
- [x] Real-time progress streaming
- [x] Connection drop handling
- [x] Streaming endpoint

### ✅ Phase 6: BullMQ Queue Integration - COMPLETE
- [x] Redis connection
- [x] BullMQ queue for agent tasks
- [x] Agent worker (3 concurrent tasks)
- [x] TaskTrackerService (Firestore)
- [x] Retry logic (3 retries, exponential backoff)
- [x] Queue endpoints

### ✅ Phase 7: Testing Infrastructure - COMPLETE
- [x] Jest with TypeScript
- [x] Test helpers and mocking utilities
- [x] Test data generators
- [x] Unit tests (tools, services)
- [x] Integration tests (API, tools, queue)
- [x] Testing documentation

### ✅ Phase 8: C# Backend Integration - COMPLETE
- [x] IAgentService interface update
- [x] SSE stream consumer
- [x] Streaming endpoints (Controllers + Minimal API)
- [x] AgentService implementation
- [x] All execution modes (sync, stream, queue)

### ✅ Phase 9: Additional Documentation - COMPLETE
- [x] SETUP.md
- [x] AGENT-TOOLS.md
- [x] STREAMING.md
- [x] QUEUE.md
- [x] TASK-EXAMPLES.md
- [x] TROUBLESHOOTING.md

### ✅ Phase 10: Deployment & Production Readiness - COMPLETE
- [x] Production Dockerfile
- [x] docker-compose.yml
- [x] CI/CD pipeline (GitHub Actions)
- [x] Kubernetes manifests
- [x] Security audit
- [x] Deployment documentation

---

## Deployment

**Quick Deploy:**

```bash
# Docker
docker build -t agent-service . && docker run -p 3002:3002 --env-file .env agent-service

# Docker Compose
docker-compose up -d

# Kubernetes
kubectl apply -f k8s/

# Google Cloud Run
gcloud run deploy agent-service --image gcr.io/PROJECT/agent-service
```

**Deployment Options:**
- Docker + Docker Compose
- Kubernetes (GKE, EKS, AKS)
- Google Cloud Run
- AWS ECS/Fargate
- Azure Container Instances

**📖 See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete deployment guide.**

---

## Success Metrics

### Performance
- Agent tasks < 30 seconds (p95)
- API response < 500ms (p95)
- Queue processes 100+ tasks/hour
- Zero cross-user data leaks

### Reliability
- 99.9% uptime
- < 1% task failure rate
- All failed tasks successfully retried
- Zero data loss incidents

### Quality
- > 80% code coverage
- Zero critical security vulnerabilities
- All tests passing in CI

---

## Project Status

**Status:** ✅ All Phases Complete - Production Ready 🚀
**Next Action:** Deploy to production environment
**Version:** 1.0.0

---

## References

### Internal Documentation
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture and design decisions
- [CONFIGURATION.md](./docs/CONFIGURATION.md) - Configuration guide
- [SETUP.md](./docs/SETUP.md) - Setup instructions
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [AGENT-TOOLS.md](./docs/AGENT-TOOLS.md) - Tool documentation
- [COMMANDS.md](./docs/COMMANDS.md) - Command reference

### External Documentation
- **Anthropic Claude SDK:** https://docs.anthropic.com/
- **Firebase Admin SDK:** https://firebase.google.com/docs/admin/setup
- **BullMQ:** https://docs.bullmq.io/
- **Zod:** https://zod.dev/

### C# Backend Reference Files
1. **QuestionRandomizer.Infrastructure\Repositories\QuestionRepository.cs** - Firestore operations
2. **ARCHITECTURE.md** - System architecture
3. **QuestionRandomizer.Application\Interfaces\IAgentService.cs** - Service contract
4. **docs\CODE-TEMPLATES.md** - Coding patterns

---

**Last Updated:** 2025-11-28
**Maintainer:** Question Randomizer Team
