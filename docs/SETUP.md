# Setup Guide - Question Randomizer AI Agent Service

Complete step-by-step setup instructions for the TypeScript AI Agent Service.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [Verification](#verification)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js 20 LTS** or higher
   ```bash
   node --version  # Should output: v20.x.x or higher
   ```
   - Download: https://nodejs.org/
   - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for version management

2. **npm 10** or higher
   ```bash
   npm --version   # Should output: 10.x.x or higher
   ```
   - Comes with Node.js 20+

3. **Redis** (for BullMQ queue)

   **Option A: Docker (Recommended)**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

   **Option B: Local Installation**
   - Windows: https://redis.io/docs/getting-started/installation/install-redis-on-windows/
   - macOS: `brew install redis`
   - Linux: `sudo apt-get install redis-server`

   **Verify Redis:**
   ```bash
   redis-cli ping  # Should output: PONG
   ```

4. **Firebase Project**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database
   - Create service account credentials

5. **Anthropic API Key**
   - Sign up at https://console.anthropic.com/
   - Create API key (starts with `sk-ant-`)

### Optional (Development)

- **Git** for version control
- **VS Code** with recommended extensions:
  - ESLint
  - Prettier
  - TypeScript + JavaScript Language Features

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/question-randomizer-ai-agent.git
cd question-randomizer-ai-agent
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages from `package.json`:
- Runtime: `@anthropic-ai/sdk`, `express`, `firebase-admin`, `bullmq`, `ioredis`, `zod`, `pino`
- Development: `typescript`, `tsx`, `jest`, `eslint`, `prettier`

**Verify installation:**
```bash
npm list --depth=0
```

---

## Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Firebase Credentials

**Option A: Service Account JSON File (Recommended for Development)**

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `firebase-dev-credentials.json` in the project root
4. **IMPORTANT:** Add to `.gitignore` (already included)

Update `.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json
```

**Option B: Inline JSON (Production/CI)**

For production or CI/CD, use environment variable:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project",...}'
```

### 3. Configure Anthropic API Key

Add to `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get your API key from: https://console.anthropic.com/settings/keys

### 4. Configure Redis (Optional)

Default values work for local development. Update if needed:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
```

### 5. Complete Environment Configuration

Here's a complete `.env` file for development:

```env
# Server
NODE_ENV=development
PORT=3002
LOG_LEVEL=debug

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Queue
QUEUE_CONCURRENCY=3
QUEUE_MAX_RETRIES=3

# Timeouts
AGENT_TIMEOUT_MS=120000
REQUEST_TIMEOUT_MS=150000

# Observability
ENABLE_REQUEST_LOGGING=true
```

---

## Running the Service

### Development Mode

Run with hot-reload (automatically restarts on file changes):

```bash
npm run dev
```

Output:
```
📝 Environment Configuration:
  NODE_ENV: development
  PORT: 3002
  FIREBASE_PROJECT_ID: your-project-id
  ...

🚀 Server started successfully
📡 Listening on port 3002
🌍 Environment: development
📋 Health check: http://localhost:3002/health
🔄 Agent worker started

✅ Question Randomizer AI Agent Service is ready!
```

### Production Mode

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

### Background Worker Only

To run only the queue worker (without HTTP server):

```bash
node dist/queue/workers/agent-worker.js
```

---

## Verification

### 1. Health Check

Check if the service is running:

```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-27T...",
  "uptime": 123.45,
  "checks": {
    "firestore": "healthy",
    "redis": "healthy"
  }
}
```

### 2. Agent Health Check

Check if the agent executor is working:

```bash
curl http://localhost:3002/agent/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "agent",
  "timestamp": "2025-11-27T..."
}
```

### 3. Test Agent Task

Execute a simple agent task:

```bash
curl -X POST http://localhost:3002/agent/task \
  -H "Content-Type: application/json" \
  -d '{
    "task": "List the available agent tools",
    "userId": "test-user-123"
  }'
```

Expected response (truncated):
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "I have access to 15 tools...",
  "metadata": {
    "toolsUsed": 0,
    "iterations": 1,
    "durationMs": 1234
  }
}
```

### 4. Test Streaming

Test SSE streaming:

```bash
curl -N -X POST http://localhost:3002/agent/task/stream \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Get my categories",
    "userId": "test-user-123"
  }'
```

You should see streaming events:
```
event: progress
data: {"type":"progress","message":"Starting task execution...","progress":0}

event: thinking
data: {"type":"thinking","content":"Let me fetch your categories..."}

event: tool_use
data: {"type":"tool_use","toolName":"get_categories","input":{}}

event: complete
data: {"type":"complete","taskId":"...","result":"..."}
```

### 5. Test Queue

Queue a background task:

```bash
curl -X POST http://localhost:3002/agent/task/queue \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze all my questions",
    "userId": "test-user-123"
  }'
```

Response:
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

Check status:
```bash
curl http://localhost:3002/agent/task/550e8400-e29b-41d4-a716-446655440000
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Build

```bash
# Build TypeScript to JavaScript
npm run build

# Clean build artifacts
rm -rf dist/

# Rebuild
npm run build
```

### Hot Reload

Use `npm run dev` for automatic restart on file changes:

```bash
npm run dev
```

Powered by `tsx watch` - no need to manually restart!

---

## Production Deployment

### Environment Variables

Set these environment variables in your production environment:

```env
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

FIREBASE_PROJECT_ID=prod-project-id
FIREBASE_CREDENTIALS_JSON=${SECRET:FIREBASE_CREDENTIALS}

ANTHROPIC_API_KEY=${SECRET:ANTHROPIC_API_KEY}

REDIS_HOST=redis-prod.internal
REDIS_PORT=6379
REDIS_PASSWORD=${SECRET:REDIS_PASSWORD}
REDIS_TLS=true

QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRIES=3
```

### Using Docker

**Build image:**
```bash
docker build -t question-randomizer-agent:latest .
```

**Run container:**
```bash
docker run -d \
  --name agent-service \
  -p 3002:3002 \
  --env-file .env.production \
  question-randomizer-agent:latest
```

**With Docker Compose:**
```yaml
version: '3.8'
services:
  agent-service:
    build: .
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Run:
```bash
docker-compose up -d
```

### Cloud Deployment

**Google Cloud Run:**
```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/agent-service

# Deploy
gcloud run deploy agent-service \
  --image gcr.io/PROJECT_ID/agent-service \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

**AWS ECS/Fargate:**
- Use the Dockerfile to build an image
- Push to ECR
- Create ECS task definition
- Configure secrets via AWS Secrets Manager

**Azure Container Instances:**
```bash
az container create \
  --resource-group myResourceGroup \
  --name agent-service \
  --image myregistry.azurecr.io/agent-service:latest \
  --ports 3002 \
  --environment-variables NODE_ENV=production
```

---

## Troubleshooting

### Common Issues

**1. "Firebase credentials not found"**
```
Solution:
- Verify firebase-dev-credentials.json exists
- Check FIREBASE_CREDENTIALS_PATH in .env
- Ensure JSON is valid (use jsonlint)
```

**2. "Anthropic API key invalid"**
```
Solution:
- Verify API key starts with 'sk-ant-'
- Check for extra spaces or quotes
- Generate new key from console.anthropic.com
```

**3. "Redis connection failed"**
```
Solution:
- Ensure Redis is running: redis-cli ping
- Check REDIS_HOST and REDIS_PORT in .env
- If using Docker: docker ps | grep redis
```

**4. "Port 3002 already in use"**
```
Solution:
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill

Or change PORT in .env
```

**5. "Module not found" errors**
```
Solution:
rm -rf node_modules package-lock.json
npm install
npm run build
```

**6. "TypeScript compilation errors"**
```
Solution:
npm run type-check
# Fix errors shown
npm run build
```

### Debug Mode

Enable verbose logging:

```env
LOG_LEVEL=debug
```

View detailed logs:
```bash
npm run dev 2>&1 | tee debug.log
```

### Check Dependencies

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit for security issues
npm audit
npm audit fix
```

---

## Next Steps

1. ✅ **Service is running** - Verify health checks pass
2. ✅ **Test endpoints** - Try sample requests
3. 📖 **Read [AGENT-TOOLS.md](./AGENT-TOOLS.md)** - Learn about the 15 agent tools
4. 📖 **Read [STREAMING.md](./STREAMING.md)** - Understand SSE streaming
5. 📖 **Read [QUEUE.md](./QUEUE.md)** - Learn about background job processing
6. 📖 **Read [TASK-EXAMPLES.md](./TASK-EXAMPLES.md)** - See example agent tasks

---

**Setup Complete!** 🎉

The Question Randomizer AI Agent Service is now ready to execute autonomous AI tasks!
