# Question Randomizer AI Agent Service

**AI-powered autonomous task execution using Claude Agent SDK**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## Overview

The AI Agent Service is a TypeScript-based microservice that executes autonomous tasks using the Anthropic Claude Agent SDK. Part of the Question Randomizer application's 3-service architecture.

**Key Features:**
- 🤖 **15 Agent Tools** for autonomous Firestore operations
- ⚡ **Streaming Responses** via Server-Sent Events (SSE)
- 🔄 **Async Queue** with BullMQ for long-running tasks
- 🔒 **Secure** user-scoped operations
- 📊 **Real-time Progress** updates
- 🧪 **>80% Test Coverage** (unit + integration)

---

## Quick Start

### Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Firebase project with service account credentials
- Anthropic API key ([Get key](https://console.anthropic.com/))

### Installation

```bash
# Clone repository
cd question-randomizer-ai-agent

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env and add your Firebase credentials and Anthropic API key

# Build project
npm run build

# Start development server
npm run dev
# Server runs at http://localhost:3002
```

### Verify Setup

```bash
curl http://localhost:3002/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "checks": {
    "firestore": "healthy",
    "redis": "healthy"
  }
}
```

---

## Architecture

```
Angular Frontend → C# Backend API → TypeScript AI Agent Service
                         ↓                         ↓
                   Firestore ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
                                  (direct access)

AI Agent Service → Redis (BullMQ Queue)
AI Agent Service → Anthropic Claude API
```

**Components:**
- **Agent Executor** - Runs autonomous tasks with Claude SDK
- **15 Agent Tools** - Firestore CRUD operations (questions, categories, qualifications)
- **Streaming Engine** - Real-time progress via SSE
- **Task Queue** - Async processing with BullMQ
- **Security Layer** - userId-based access control

---

## Agent Tools

### Data Retrieval (6 tools - Read-only)
- `get_questions` - Fetch questions with filters
- `get_question_by_id` - Get specific question
- `get_categories` - Get all user categories
- `get_qualifications` - Get all qualifications
- `get_uncategorized_questions` - Get questions without category
- `search_questions` - Full-text search

### Data Modification (7 tools - Write operations)
- `create_question` - Create new question
- `update_question` - Update question fields
- `delete_question` - Soft delete question
- `update_question_category` - Assign category
- `create_category` - Create new category
- `create_qualification` - Create qualification
- `batch_update_questions` - Bulk update

### Data Analysis (2 tools - Compute-heavy)
- `find_duplicate_questions` - Find similar questions
- `analyze_question_difficulty` - Analyze complexity

---

## API Endpoints

### Agent Execution

```bash
# Streaming task execution (SSE)
POST /agent/task
Content-Type: application/json
{
  "task": "Categorize all uncategorized questions",
  "userId": "user123"
}

# Async task queue
POST /agent/task/queue
{
  "task": "Find and merge duplicate questions",
  "userId": "user123"
}

# Task status
GET /agent/task/:taskId
```

### Health Checks

```bash
GET /health       # Full health check
GET /ready        # Readiness probe
GET /live         # Liveness probe
```

---

## Example Agent Tasks

### Simple Tasks

```
"List all my question categories"
"Show me uncategorized questions"
"Create a JavaScript question about closures"
```

### Complex Multi-Step Tasks

```
"Categorize all uncategorized questions"
"Find duplicate questions and suggest merges"
"Analyze the difficulty of all Python questions"
"Create 5 interview questions about React hooks"
```

---

## Development

### Commands

```bash
# Development
npm run dev               # Start dev server (hot reload)
npm run build             # Build for production
npm start                 # Start production server

# Testing
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # Coverage report

# Code Quality
npm run lint              # Run linter
npm run lint:fix          # Fix linting issues
npm run format            # Format code with Prettier
npm run type-check        # TypeScript type checking
```

### Docker

```bash
# Start Redis + Firebase Emulator
docker-compose up

# Build Docker image
docker build -t question-randomizer-agent .

# Run container
docker run -p 3002:3002 --env-file .env question-randomizer-agent
```

---

## Testing

### Test Structure

```
tests/
├── unit/                # 70% of tests
│   ├── tools/          # Test all 15 tools
│   ├── services/       # Test services
│   └── agent/          # Test agent executor
│
└── integration/        # 25% of tests
    ├── api/           # Test API endpoints
    ├── tools/         # Tools + Firestore Emulator
    └── queue/         # Queue integration
```

### Run Tests

```bash
# All tests
npm test

# Unit tests (fast, mocked dependencies)
npm run test:unit

# Integration tests (Firebase Emulator + Redis)
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Coverage Target:** >80% overall, 95% for critical paths (userId filtering, tool execution)

---

## Documentation

📖 **[CLAUDE.md](./CLAUDE.md)** - **Complete implementation guide** (READ THIS FIRST)

**Phase-specific documentation:**
- [docs/SETUP.md](./docs/SETUP.md) - Detailed setup instructions
- [docs/AGENT-TOOLS.md](./docs/AGENT-TOOLS.md) - All 15 tools documented
- [docs/STREAMING.md](./docs/STREAMING.md) - SSE streaming guide
- [docs/QUEUE.md](./docs/QUEUE.md) - BullMQ queue architecture
- [docs/TASK-EXAMPLES.md](./docs/TASK-EXAMPLES.md) - Example agent tasks
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues

---

## Technology Stack

**Core:**
- Node.js 20 (LTS)
- TypeScript 5+
- Express.js

**AI & Agent:**
- @anthropic-ai/sdk (Claude API)
- Zod (schema validation)

**Database & Queue:**
- Firebase Admin SDK (Firestore)
- BullMQ + Redis

**Testing:**
- Jest + ts-jest
- Supertest (HTTP testing)
- Testcontainers (Redis)
- Firebase Emulator

---

## Project Structure

```
src/
├── server.ts               # Express server entry
├── config/                 # Configuration
├── api/                    # HTTP API layer
├── agent/                  # Agent execution engine
├── tools/                  # 15 agent tools
├── queue/                  # BullMQ async queue
├── services/               # Business logic
├── models/                 # Data models
└── utils/                  # Utilities

tests/
├── unit/                   # Unit tests (70%)
├── integration/            # Integration tests (25%)
└── helpers/                # Test utilities
```

---

## Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3002
LOG_LEVEL=debug

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue
QUEUE_CONCURRENCY=3
```

**See [CLAUDE.md](./CLAUDE.md#configuration) for complete configuration guide.**

---

## Security

### Critical Security Rules

1. **UserId Filtering (MANDATORY)**
   ```typescript
   // ✅ CORRECT
   const questions = await db.collection('questions')
     .where('userId', '==', userId)
     .get();

   // ❌ WRONG - Security vulnerability
   const questions = await db.collection('questions').get();
   ```

2. **Input Validation** - All tool inputs validated with Zod
3. **Error Messages** - Never leak sensitive info
4. **API Key Management** - Never commit credentials
5. **Firestore Security Rules** - Backend bypasses rules (userId filtering critical)

**See [CLAUDE.md](./CLAUDE.md#security-considerations) for complete security guide.**

---

## Implementation Status

### Completed Phases
- ✅ **Phase 0:** Project Documentation

### Upcoming Phases
- ⏳ **Phase 1:** Project Setup & Core Infrastructure (Days 1-2)
- ⏳ **Phase 2:** Firestore Service Layer (Days 3-4)
- ⏳ **Phase 3:** Agent Tools Implementation (Days 5-8)
- ⏳ **Phase 4:** Agent Execution Engine (Days 9-11)
- ⏳ **Phase 5:** Streaming Implementation (Days 12-13)
- ⏳ **Phase 6:** BullMQ Queue Integration (Days 14-15)
- ⏳ **Phase 7:** Testing Infrastructure (Days 16-19)
- ⏳ **Phase 8:** C# Backend Integration (Days 20-21)
- ⏳ **Phase 9:** Additional Documentation (Days 22-23)
- ⏳ **Phase 10:** Deployment & Production Readiness (Days 24-25)

**Timeline:** 26 days total (Phase 0 + 25 days implementation)

---

## Contributing

1. Read [CLAUDE.md](./CLAUDE.md) for architecture and patterns
2. Follow TypeScript strict mode conventions
3. Write tests for all new features (>80% coverage)
4. All agent tools MUST filter by userId
5. Document significant changes

---

## Troubleshooting

### Common Issues

**Firebase credentials not found:**
- Ensure `firebase-dev-credentials.json` exists in project root
- Check `FIREBASE_CREDENTIALS_PATH` in `.env`

**Redis connection failed:**
- Start Redis: `docker-compose up redis`
- Or install locally: `sudo apt-get install redis-server`

**Port 3002 already in use:**
- Change port in `.env`: `PORT=3003`

**See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for complete troubleshooting guide.**

---

## Resources

### Documentation
- [CLAUDE.md](./CLAUDE.md) - Complete implementation guide
- [Anthropic Claude SDK](https://docs.anthropic.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [BullMQ](https://docs.bullmq.io/)

### Related Repositories
- [C# Backend API](../question-randomizer-backend/) - Main API and orchestration
- [Angular Frontend](../worse-and-pricier/) - User interface

---

## License

MIT License - See [LICENSE](./LICENSE) for details

---

## Contact

**Project:** Question Randomizer
**Repository:** question-randomizer-ai-agent
**Last Updated:** 2025-11-27
**Status:** Phase 0 Complete ✅

---

**🚀 Ready to start implementation? Read [CLAUDE.md](./CLAUDE.md) for the complete guide!**
