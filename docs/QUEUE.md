# Queue Guide - BullMQ Background Processing

Complete guide to asynchronous task processing using BullMQ and Redis.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [When to Use the Queue](#when-to-use-the-queue)
- [Queue API](#queue-api)
- [Worker Configuration](#worker-configuration)
- [Task Lifecycle](#task-lifecycle)
- [Monitoring & Management](#monitoring--management)
- [Retry Logic](#retry-logic)
- [Best Practices](#best-practices)

---

## Overview

The AI Agent Service uses **BullMQ** with **Redis** for background task processing. This allows long-running agent tasks to be executed asynchronously without blocking HTTP requests.

### Why Queue-Based Processing?

**Without Queue (Synchronous):**
```
Request → Execute → Wait... Wait... Wait... → Response (after 5 minutes)

Problems:
❌ Request timeout (typically 30-60s)
❌ Connection drops during long execution
❌ Inefficient resource usage
❌ Poor scalability
```

**With Queue (Asynchronous):**
```
Request → Queue Task → Return Task ID (immediately)
                    ↓
         [Background Worker processes task]
                    ↓
Poll Status → Get Result (when ready)

Benefits:
✅ Immediate response
✅ Handles long-running tasks
✅ Automatic retries on failure
✅ Scales with concurrent workers
✅ Survives server restarts
```

---

## Architecture

### System Components

```
┌──────────────┐
│   C# Backend │
└──────┬───────┘
       │ POST /agent/task/queue
       ↓
┌──────────────────────┐
│  Agent HTTP Server   │
│  (Express.js)        │
└──────────┬───────────┘
           │ Add job to queue
           ↓
┌──────────────────────┐
│   BullMQ Queue       │
│   (Redis)            │
└──────────┬───────────┘
           │ Worker picks up job
           ↓
┌──────────────────────┐
│   Agent Worker       │
│   (Background)       │
│   Concurrency: 3     │
└──────────┬───────────┘
           │ Execute task
           ↓
┌──────────────────────┐
│   AgentExecutor      │
└──────────┬───────────┘
           │ Use tools
           ↓
┌──────────────────────┐
│   Firestore          │
└──────────────────────┘
```

### Data Flow

1. **Queue Request** - Client sends task to queue endpoint
2. **Create Task Record** - Task saved to Firestore (status: pending)
3. **Add to Queue** - Job added to BullMQ queue
4. **Return Task ID** - Client receives task ID immediately
5. **Worker Picks Up** - Background worker dequeues job
6. **Execute Task** - Agent executes with tools
7. **Update Status** - Task record updated in Firestore
8. **Poll for Result** - Client polls status endpoint

---

## When to Use the Queue

### Decision Matrix

| Criteria | Synchronous | Streaming | **Queue** |
|----------|------------|-----------|-----------|
| **Duration** | < 10s | 10-30s | **> 30s** ✅ |
| **User waiting** | Yes | Yes | **No** |
| **Retry needed** | Manual | Manual | **Automatic** ✅ |
| **Load handling** | Limited | Limited | **High** ✅ |
| **Examples** | "List categories" | "Categorize 20 questions" | **"Analyze 1000 questions"** |

### Use Queue When:

✅ **Long-running tasks** - Takes more than 30 seconds
✅ **Batch operations** - Processing many items
✅ **Resource-intensive** - High CPU/memory usage
✅ **Not time-sensitive** - User can wait for result
✅ **Retry capability needed** - Task may fail and should retry
✅ **High load** - Many concurrent requests

### Don't Use Queue When:

❌ **Quick tasks** - Completes in <10 seconds
❌ **User actively waiting** - Needs immediate response
❌ **Real-time feedback needed** - Use streaming instead
❌ **Interactive tasks** - Requires user input

---

## Queue API

### 1. Queue a Task

**Endpoint:**
```
POST /agent/task/queue
```

**Request:**
```json
{
  "task": "Analyze all my questions and categorize them",
  "userId": "user-123"
}
```

**Response:** (HTTP 202 Accepted)
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Task queued for processing",
  "timestamp": "2025-11-27T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/agent/task/queue \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Find and remove all duplicate questions",
    "userId": "user-123"
  }'
```

---

### 2. Get Task Status

**Endpoint:**
```
GET /agent/task/:taskId
```

**Response:**
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": "I analyzed all your questions and found 3 duplicates...",
  "createdAt": "2025-11-27T10:30:00.000Z",
  "updatedAt": "2025-11-27T10:32:15.000Z",
  "completedAt": "2025-11-27T10:32:15.000Z",
  "metadata": {
    "toolsUsed": 5,
    "iterations": 3,
    "durationMs": 135000,
    "tokensUsed": {
      "input": 1500,
      "output": 800,
      "total": 2300
    }
  }
}
```

**Status Values:**
- `pending` - Waiting in queue
- `in_progress` - Currently executing
- `completed` - Finished successfully
- `failed` - Execution failed

**cURL Example:**
```bash
curl http://localhost:3002/agent/task/550e8400-e29b-41d4-a716-446655440000
```

---

### 3. Poll for Completion

**Client-side polling pattern:**

```javascript
async function pollTaskStatus(taskId) {
  const maxAttempts = 60;  // 5 minutes
  const pollInterval = 5000; // 5 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/agent/task/${taskId}`);
    const status = await response.json();

    if (status.status === 'completed') {
      return status.result;
    }

    if (status.status === 'failed') {
      throw new Error(status.error);
    }

    // Still processing, wait and retry
    await sleep(pollInterval);
  }

  throw new Error('Task timeout');
}
```

---

## Worker Configuration

### Environment Variables

```env
# Queue Configuration
QUEUE_CONCURRENCY=3          # Number of concurrent tasks
QUEUE_MAX_RETRIES=3          # Max retry attempts
AGENT_TIMEOUT_MS=120000      # Task timeout (2 minutes)
```

### Worker Settings

**Location:** `src/queue/workers/agent-worker.ts`

**Configuration:**
```typescript
const worker = new Worker(QUEUE_NAME, processAgentTask, {
  connection: redisConnection,
  concurrency: 3,              // Process 3 tasks simultaneously
  limiter: {
    max: 10,                   // Max 10 jobs
    duration: 1000,            // Per 1 second (rate limiting)
  },
});
```

### Scaling Workers

**Single Server (Vertical Scaling):**
```env
QUEUE_CONCURRENCY=5  # Increase concurrent tasks
```

**Multiple Servers (Horizontal Scaling):**
```bash
# Server 1
npm start

# Server 2
npm start

# Server 3
npm start
```

**Result:** All workers share the same Redis queue, distributing load automatically!

---

## Task Lifecycle

### 1. Task Created (pending)

```
POST /agent/task/queue
  ↓
Create Firestore record: { status: "pending" }
  ↓
Add job to BullMQ queue
  ↓
Return task ID to client
```

**Firestore Record:**
```json
{
  "taskId": "550e8400...",
  "userId": "user-123",
  "task": "Analyze questions",
  "status": "pending",
  "createdAt": "2025-11-27T10:30:00Z",
  "updatedAt": "2025-11-27T10:30:00Z"
}
```

---

### 2. Worker Picks Up (in_progress)

```
Worker dequeues job
  ↓
Update Firestore: { status: "in_progress" }
  ↓
Execute AgentExecutor
  ↓
[Tools are called, agent iterates]
```

**Firestore Updated:**
```json
{
  "status": "in_progress",
  "updatedAt": "2025-11-27T10:30:05Z"
}
```

---

### 3. Task Completes (completed)

```
Execution succeeds
  ↓
Update Firestore: {
  status: "completed",
  result: "...",
  metadata: {...}
}
  ↓
Mark job as completed in Bull MQ
```

**Firestore Updated:**
```json
{
  "status": "completed",
  "result": "I analyzed all your questions...",
  "metadata": {
    "toolsUsed": 5,
    "iterations": 3,
    "durationMs": 135000
  },
  "completedAt": "2025-11-27T10:32:15Z",
  "updatedAt": "2025-11-27T10:32:15Z"
}
```

---

### 4. Task Fails (failed)

```
Execution throws error
  ↓
Retry attempt #1
  ↓
Retry attempt #2
  ↓
Retry attempt #3
  ↓
All retries exhausted
  ↓
Update Firestore: {
  status: "failed",
  error: {...},
  metadata: { retryCount: 3 }
}
```

**Firestore Updated:**
```json
{
  "status": "failed",
  "error": {
    "message": "Anthropic API timeout",
    "code": "TIMEOUT_ERROR"
  },
  "metadata": {
    "retryCount": 3
  },
  "completedAt": "2025-11-27T10:35:00Z",
  "updatedAt": "2025-11-27T10:35:00Z"
}
```

---

## Monitoring & Management

### Queue Health Check

```bash
curl http://localhost:3002/health
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "firestore": "healthy",
    "redis": "healthy"
  }
}
```

### Redis CLI Monitoring

**Connect to Redis:**
```bash
redis-cli
```

**Check queue stats:**
```redis
# List all keys
KEYS *

# Check queue length
LLEN bull:agent-tasks:wait

# Check active jobs
ZCARD bull:agent-tasks:active

# Check completed jobs
LLEN bull:agent-tasks:completed

# Check failed jobs
LLEN bull:agent-tasks:failed
```

### BullMQ Dashboard (Optional)

Install Bull Board for web UI:

```bash
npm install @bull-board/express @bull-board/api
```

**Setup:** (Add to server.ts)
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(agentTaskQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

**Access:** http://localhost:3002/admin/queues

---

## Retry Logic

### Configuration

**Default Settings:**
```typescript
{
  attempts: 4,  // 1 initial + 3 retries
  backoff: {
    type: 'exponential',
    delay: 1000,  // Start with 1 second
  }
}
```

### Retry Schedule

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 (initial) | 0s | 0s |
| 2 (retry 1) | 1s | 1s |
| 3 (retry 2) | 2s | 3s |
| 4 (retry 3) | 4s | 7s |

**Total:** Up to 4 attempts over ~7 seconds

### Retry Triggers

Tasks are retried when:
- ❌ Anthropic API timeout
- ❌ Firestore connection error
- ❌ Redis connection error
- ❌ Unexpected exceptions

Tasks are **NOT** retried when:
- ✅ Validation errors (bad input)
- ✅ User authorization failures
- ✅ Intentional agent errors

---

## Best Practices

### For API Developers

1. **Use appropriate execution mode**
   ```typescript
   // Quick task (< 10s)
   await executeTaskAsync(task, userId);

   // Medium task with feedback (10-30s)
   await executeTaskStreamingAsync(task, userId, onProgress);

   // Long task (> 30s)
   const taskId = await queueTaskAsync(task, userId);
   ```

2. **Implement exponential backoff polling**
   ```typescript
   let delay = 2000;  // Start with 2s
   while (status !== 'completed') {
     await sleep(delay);
     status = await getStatus(taskId);
     delay = Math.min(delay * 1.5, 30000);  // Max 30s
   }
   ```

3. **Set reasonable timeouts**
   ```typescript
   const timeout = setTimeout(() => {
     throw new Error('Task timeout');
   }, 5 * 60 * 1000);  // 5 minutes
   ```

4. **Handle all statuses**
   - `pending` - Show "Queued..."
   - `in_progress` - Show "Processing..."
   - `completed` - Show result
   - `failed` - Show error, offer retry

### For System Administrators

1. **Monitor Redis memory**
   ```bash
   redis-cli info memory
   ```

2. **Configure Redis persistence**
   ```redis
   # redis.conf
   save 900 1      # Save after 900s if 1 key changed
   save 300 10     # Save after 300s if 10 keys changed
   save 60 10000   # Save after 60s if 10000 keys changed
   ```

3. **Set up queue cleanup**
   ```typescript
   // Run daily
   await agentTaskQueue.clean(24 * 3600 * 1000, 1000, 'completed');
   await agentTaskQueue.clean(7 * 24 * 3600 * 1000, 100, 'failed');
   ```

4. **Monitor worker health**
   ```bash
   # Check worker is running
   ps aux | grep node

   # Check logs
   tail -f logs/agent-worker.log
   ```

---

## Related Documentation

- **[STREAMING.md](./STREAMING.md)** - Real-time execution
- **[AGENT-TOOLS.md](./AGENT-TOOLS.md)** - Tool documentation
- **[TASK-EXAMPLES.md](./TASK-EXAMPLES.md)** - Example tasks

---

**BullMQ + Redis = Reliable background processing!** 🚀
