# Troubleshooting Guide - Question Randomizer AI Agent

Comprehensive troubleshooting guide for common issues and their solutions.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [Connection Issues](#connection-issues)
- [Runtime Errors](#runtime-errors)
- [Agent Execution Issues](#agent-execution-issues)
- [Queue and Worker Issues](#queue-and-worker-issues)
- [Performance Issues](#performance-issues)
- [Common User Errors](#common-user-errors)
- [Debugging Strategies](#debugging-strategies)
- [Getting Help](#getting-help)

---

## Quick Diagnosis

### Health Check Commands

Run these commands to quickly diagnose issues:

```bash
# 1. Check if service is running
curl http://localhost:3002/health

# 2. Check if agent endpoint is accessible
curl http://localhost:3002/agent/health

# 3. Check Redis connection
redis-cli ping

# 4. Check logs
tail -f logs/app.log  # If using file logging
npm run dev           # See console output

# 5. Check environment variables
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
node -e "console.log(process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set')"
```

### Common Symptoms and Quick Fixes

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Server won't start | Port in use | Change PORT in .env |
| "Firebase credentials not found" | Missing/invalid credentials | Check FIREBASE_CREDENTIALS_PATH |
| "Anthropic API error" | Invalid API key | Verify ANTHROPIC_API_KEY |
| "Redis connection failed" | Redis not running | Start Redis: `docker-compose up redis` |
| Agent tasks timeout | Network/API issues | Check internet connection, API status |
| Tasks stuck in "pending" | Worker not running | Restart service |
| "Module not found" errors | Dependencies not installed | Run `npm install` |

---

## Installation Issues

### Issue 1: npm install fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

**Option 1: Force install**
```bash
npm install --legacy-peer-deps
```

**Option 2: Clean install**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Option 3: Use correct Node version**
```bash
node --version  # Should be v20.x.x or higher
nvm use 20      # If using nvm
```

---

### Issue 2: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module '@anthropic-ai/sdk'
error TS2304: Cannot find name 'process'
```

**Solutions:**

**1. Install dependencies:**
```bash
npm install
```

**2. Install type definitions:**
```bash
npm install --save-dev @types/node
```

**3. Clean build:**
```bash
rm -rf dist/
npm run build
```

**4. Check tsconfig.json:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "types": ["node", "jest"]
  }
}
```

---

### Issue 3: Cannot find module 'tsx'

**Symptoms:**
```
Error: Cannot find module 'tsx'
```

**Solution:**
```bash
# Install tsx globally (optional)
npm install -g tsx

# Or use local installation
npm install --save-dev tsx

# Run with npx
npx tsx src/server.ts
```

---

## Configuration Issues

### Issue 4: Environment variables not loaded

**Symptoms:**
```
Environment validation failed: FIREBASE_PROJECT_ID is required
```

**Solutions:**

**1. Check .env file exists:**
```bash
ls -la .env  # Should exist in project root
```

**2. Verify .env format:**
```env
# ✅ CORRECT
FIREBASE_PROJECT_ID=my-project-id
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# ❌ WRONG (no spaces around =)
FIREBASE_PROJECT_ID = my-project-id

# ❌ WRONG (no quotes needed)
ANTHROPIC_API_KEY="sk-ant-api03-xxxxx"
```

**3. Manually load .env (for testing):**
```bash
# Linux/Mac
export $(cat .env | xargs)

# Windows PowerShell
Get-Content .env | ForEach-Object { $key,$val = $_.split('='); [Environment]::SetEnvironmentVariable($key, $val) }
```

**4. Check dotenv is loaded in code:**
```typescript
// Should be at the very top of src/config/environment.ts
import 'dotenv/config';
```

---

### Issue 5: Firebase credentials not found

**Symptoms:**
```
Error: Could not load Firebase credentials from path: ./firebase-dev-credentials.json
```

**Solutions:**

**1. Verify file exists:**
```bash
ls -la firebase-dev-credentials.json
```

**2. Check file path in .env:**
```env
# Relative path (from project root)
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json

# Absolute path
FIREBASE_CREDENTIALS_PATH=/Users/me/project/firebase-dev-credentials.json
```

**3. Verify JSON is valid:**
```bash
# Check JSON syntax
cat firebase-dev-credentials.json | python -m json.tool

# Or use node
node -e "console.log(JSON.parse(require('fs').readFileSync('firebase-dev-credentials.json')))"
```

**4. Check file permissions:**
```bash
chmod 600 firebase-dev-credentials.json
```

**5. Use inline credentials (alternative):**
```env
FIREBASE_CREDENTIALS_JSON='{"type":"service_account","project_id":"..."}'
```

---

### Issue 6: Invalid Anthropic API key

**Symptoms:**
```
Error: Authentication error: Invalid API key
```

**Solutions:**

**1. Verify API key format:**
- Must start with `sk-ant-`
- Should be ~100 characters long
- No extra spaces or quotes

```bash
# Check key length
echo -n "$ANTHROPIC_API_KEY" | wc -c  # Should be ~100
```

**2. Get new API key:**
- Go to https://console.anthropic.com/settings/keys
- Create new API key
- Copy to .env

**3. Check for invisible characters:**
```bash
# View key with special characters visible
cat -A .env | grep ANTHROPIC
```

---

## Connection Issues

### Issue 7: Redis connection failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
Error: Redis connection timeout
```

**Solutions:**

**1. Start Redis:**
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Using Docker Compose
docker-compose up redis

# Or local installation
redis-server
```

**2. Verify Redis is running:**
```bash
redis-cli ping  # Should return: PONG

# Check Redis logs
docker logs redis
```

**3. Check Redis connection settings:**
```env
REDIS_HOST=localhost  # or 127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=       # Leave empty for local dev
REDIS_TLS=false
```

**4. Test connection manually:**
```bash
redis-cli -h localhost -p 6379
> ping
PONG
```

**5. Check firewall/network:**
```bash
# Check if port is open
netstat -an | grep 6379

# Test connection
telnet localhost 6379
```

---

### Issue 8: Firestore connection failed

**Symptoms:**
```
Error: Failed to initialize Firestore
Error: Project ID not found
```

**Solutions:**

**1. Verify Firebase project exists:**
- Go to https://console.firebase.google.com/
- Check project ID matches FIREBASE_PROJECT_ID in .env

**2. Enable Firestore:**
- Firebase Console → Build → Firestore Database
- Click "Create database"
- Choose production or test mode

**3. Verify service account permissions:**
- Firebase Console → Project Settings → Service Accounts
- Ensure service account has "Firebase Admin SDK" role

**4. Test Firestore connection:**
```typescript
// Create test script: test-firestore.ts
import { initializeFirebase } from './src/config/firebase.config';

async function testFirestore() {
  const db = initializeFirebase();
  const testDoc = await db.collection('_test').doc('connection').set({
    tested: true,
    timestamp: new Date()
  });
  console.log('✓ Firestore connection successful');
}

testFirestore();
```

**5. Check network/firewall:**
```bash
# Test connectivity to Firestore
curl -I https://firestore.googleapis.com
```

---

### Issue 9: Anthropic API timeout

**Symptoms:**
```
Error: Request timeout after 30000ms
Error: 429 Too Many Requests
```

**Solutions:**

**1. Check Anthropic API status:**
- Visit https://status.anthropic.com/
- Check for ongoing incidents

**2. Verify API key has credits:**
- Go to https://console.anthropic.com/settings/billing
- Check usage and limits

**3. Increase timeout:**
```env
AGENT_TIMEOUT_MS=180000  # 3 minutes
REQUEST_TIMEOUT_MS=200000  # Longer than agent timeout
```

**4. Check rate limits:**
```typescript
// Add retry logic in src/agent/agent-executor.ts
import { retry } from './utils/retry';

const result = await retry(
  () => anthropic.messages.create(...),
  { maxAttempts: 3, backoff: 'exponential' }
);
```

**5. Monitor network:**
```bash
# Test connectivity
curl -I https://api.anthropic.com

# Check DNS resolution
nslookup api.anthropic.com
```

---

## Runtime Errors

### Issue 10: Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Solutions:**

**1. Change port:**
```env
PORT=3003  # Or any available port
```

**2. Kill process using port:**
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9

# Or use npx
npx kill-port 3002
```

**3. Find which process is using port:**
```bash
# Windows
netstat -ano | findstr :3002

# Linux/Mac
lsof -i:3002
```

---

### Issue 11: Memory leak / Out of memory

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

**1. Increase Node.js memory:**
```bash
# In package.json scripts
"start": "node --max-old-space-size=4096 dist/server.js"
"dev": "node --max-old-space-size=4096 --loader tsx src/server.ts"
```

**2. Check for memory leaks:**
```bash
# Monitor memory usage
node --inspect src/server.ts

# Use Chrome DevTools
# Open chrome://inspect
# Take heap snapshots to find leaks
```

**3. Limit concurrent tasks:**
```env
QUEUE_CONCURRENCY=1  # Reduce from 3 to 1
```

**4. Add garbage collection:**
```bash
node --expose-gc dist/server.js
```

---

### Issue 12: Unhandled promise rejection

**Symptoms:**
```
UnhandledPromiseRejectionWarning: Error: ...
(node:12345) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated
```

**Solutions:**

**1. Add global error handler (already in place):**
```typescript
// src/server.ts
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
});
```

**2. Wrap async calls in try-catch:**
```typescript
// ❌ BAD
async function someFunction() {
  const result = await riskyOperation();  // May throw
  return result;
}

// ✅ GOOD
async function someFunction() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    logger.error({ error }, 'Operation failed');
    throw error;
  }
}
```

**3. Use Promise.allSettled for multiple promises:**
```typescript
// ❌ BAD - One failure rejects all
await Promise.all(promises);

// ✅ GOOD - Get all results, even if some fail
const results = await Promise.allSettled(promises);
results.forEach(result => {
  if (result.status === 'fulfilled') {
    // Handle success
  } else {
    logger.error(result.reason);
  }
});
```

---

## Agent Execution Issues

### Issue 13: Agent task timeout

**Symptoms:**
```
Error: Agent execution timeout after 120000ms
Task status: in_progress (stuck)
```

**Solutions:**

**1. Increase timeout:**
```env
AGENT_TIMEOUT_MS=300000  # 5 minutes
```

**2. Simplify task:**
```
❌ Complex: "Analyze all 1000 questions and categorize them"
✅ Simpler: "Analyze first 50 questions and categorize them"
```

**3. Use queue for long tasks:**
```bash
# Instead of POST /agent/task
# Use POST /agent/task/queue
curl -X POST http://localhost:3002/agent/task/queue \
  -H "Content-Type: application/json" \
  -d '{"task": "Analyze all questions", "userId": "user-123"}'
```

**4. Check agent is not in infinite loop:**
```typescript
// Verify max iterations in src/agent/agent-config.ts
export const agentConfig = {
  maxIterations: 10,  // Prevent infinite loops
  timeout: env.AGENT_TIMEOUT_MS,
};
```

---

### Issue 14: Agent returns empty/incorrect results

**Symptoms:**
```
Agent completes but returns: "I couldn't complete that task"
Agent uses wrong tools for the task
```

**Solutions:**

**1. Improve task description:**
```
❌ Vague: "Do something with questions"
✅ Clear: "List all JavaScript questions with difficulty 4 or higher"
```

**2. Check tool availability:**
```bash
# Test agent health
curl http://localhost:3002/agent/health

# Should return list of available tools
```

**3. Verify userId exists in data:**
```typescript
// Check if user has any data
const questions = await db.collection('questions')
  .where('userId', '==', userId)
  .get();
console.log(`User has ${questions.size} questions`);
```

**4. Check agent logs:**
```env
LOG_LEVEL=debug  # Enable detailed logging
```

**5. Test with simple task first:**
```
"List my categories"
"Count my questions"
```

---

### Issue 15: Tool execution errors

**Symptoms:**
```
Error: Tool 'get_questions' failed: Permission denied
Error: Invalid input for tool 'update_question'
```

**Solutions:**

**1. Check Firestore permissions:**
```typescript
// Verify service account has correct permissions
// Firebase Console → IAM & Admin → Service Accounts
// Role should include: "Cloud Datastore User" or "Firebase Admin"
```

**2. Validate tool input:**
```typescript
// Check Zod schema matches input
import { z } from 'zod';

const schema = z.object({
  questionId: z.string(),  // Not optional
  difficulty: z.number().min(1).max(5).optional()
});

// Test validation
const input = { questionId: 'q-123' };
const validated = schema.parse(input);  // Will throw if invalid
```

**3. Check userId filtering:**
```typescript
// Ensure all queries include userId
const questions = await db.collection('questions')
  .where('userId', '==', context.userId)  // Required!
  .get();
```

---

## Queue and Worker Issues

### Issue 16: Tasks stuck in "pending" status

**Symptoms:**
```
Task queued successfully but never processed
GET /agent/task/:taskId shows status: "pending" forever
```

**Solutions:**

**1. Check worker is running:**
```bash
# Should see worker logs
npm run dev

# Output should include:
# "🔄 Agent worker started"
```

**2. Verify Redis queue:**
```bash
redis-cli
> LLEN bull:agent-tasks:wait
(integer) 5  # Shows pending jobs

> ZCARD bull:agent-tasks:active
(integer) 0  # Should show active jobs if processing
```

**3. Check worker errors:**
```bash
# Look for worker errors in logs
tail -f logs/worker.log
```

**4. Restart worker:**
```bash
# Stop and restart service
npm run dev
```

**5. Manually process job:**
```bash
# Connect to Redis
redis-cli

# Check failed jobs
LLEN bull:agent-tasks:failed

# View job details
LRANGE bull:agent-tasks:failed 0 -1
```

---

### Issue 17: Worker crashes repeatedly

**Symptoms:**
```
Worker started → crashes → restarts → crashes
Error: Worker closed unexpectedly
```

**Solutions:**

**1. Check error logs:**
```typescript
// src/queue/workers/agent-worker.ts should have error handlers
worker.on('error', (error) => {
  logger.error({ error }, 'Worker error');
});

worker.on('failed', (job, error) => {
  logger.error({ job, error }, 'Job failed');
});
```

**2. Reduce concurrency:**
```env
QUEUE_CONCURRENCY=1  # Process one job at a time
```

**3. Check memory limits:**
```bash
node --max-old-space-size=4096 dist/server.js
```

**4. Add graceful shutdown:**
```typescript
// Verify in src/server.ts
process.on('SIGTERM', async () => {
  await worker.close();
  await queue.close();
});
```

---

### Issue 18: Jobs failing with retries exhausted

**Symptoms:**
```
Job failed after 3 retry attempts
Error: Max retries (3) exceeded for task task-123
```

**Solutions:**

**1. Check retry configuration:**
```env
QUEUE_MAX_RETRIES=5  # Increase from 3 to 5
```

**2. Review failure reason:**
```bash
# Get failed job details
curl http://localhost:3002/agent/task/task-123

# Should show error in response
```

**3. Fix underlying issue:**
```
Common causes:
- Anthropic API timeout → Increase timeout
- Invalid task → Fix task description
- Missing data → Verify userId has data
- Tool errors → Check tool implementation
```

**4. Manually retry job:**
```typescript
// Create admin script to retry failed jobs
import { createAgentTaskQueue } from './queue/task-queue';

const queue = createAgentTaskQueue();
const failedJobs = await queue.getFailed();

for (const job of failedJobs) {
  await job.retry();  // Retry manually
}
```

---

## Performance Issues

### Issue 19: Slow response times

**Symptoms:**
```
Simple tasks take > 10 seconds
API endpoints have high latency
```

**Solutions:**

**1. Enable caching:**
```typescript
// Add caching for frequently accessed data
import { CacheService } from './services/cache.service';

const cached = await cacheService.get(`categories:${userId}`);
if (cached) return cached;

const categories = await db.collection('categories')
  .where('userId', '==', userId)
  .get();

await cacheService.set(`categories:${userId}`, categories, 3600);
```

**2. Add Firestore indexes:**
```bash
# Firebase Console → Firestore → Indexes
# Create composite indexes for common queries

# Example index needed:
# Collection: questions
# Fields: userId (Ascending), categoryId (Ascending)
```

**3. Reduce data fetching:**
```typescript
// ❌ BAD - Fetch all fields
const questions = await db.collection('questions').get();

// ✅ GOOD - Fetch only needed fields
const questions = await db.collection('questions')
  .select('questionText', 'categoryId')
  .limit(50)
  .get();
```

**4. Use pagination:**
```typescript
// Don't load all 1000 questions at once
const questions = await db.collection('questions')
  .where('userId', '==', userId)
  .limit(50)
  .get();
```

**5. Monitor performance:**
```typescript
// Add performance logging
const start = Date.now();
const result = await someOperation();
const duration = Date.now() - start;
logger.info({ duration, operation: 'someOperation' });
```

---

### Issue 20: High memory usage

**Symptoms:**
```
Memory usage keeps increasing
Server becomes slow over time
Eventually crashes with OOM
```

**Solutions:**

**1. Profile memory usage:**
```bash
node --inspect dist/server.js
# Open chrome://inspect
# Take heap snapshots periodically
```

**2. Limit batch sizes:**
```typescript
// Process in smaller chunks
const BATCH_SIZE = 100;
for (let i = 0; i < totalQuestions; i += BATCH_SIZE) {
  const batch = questions.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
  // Memory is released between batches
}
```

**3. Clean up resources:**
```typescript
// Close connections when done
await db.terminate();
await redis.quit();
```

**4. Use streams for large datasets:**
```typescript
// Instead of loading all at once
const stream = db.collection('questions')
  .where('userId', '==', userId)
  .stream();

stream.on('data', (doc) => {
  processDocument(doc);
});
```

---

## Common User Errors

### Issue 21: Task doesn't execute expected actions

**Symptoms:**
```
Asked agent to categorize questions, but nothing changed
Agent says "completed" but no data updated
```

**Solutions:**

**1. Check task description clarity:**
```
❌ Unclear: "Fix my questions"
✅ Clear: "Categorize all uncategorized questions about JavaScript into the 'JavaScript' category"
```

**2. Verify user has permissions:**
```typescript
// User can only modify their own data
const question = await db.collection('questions')
  .doc(questionId)
  .get();

if (question.data()?.userId !== context.userId) {
  throw new Error('Unauthorized');
}
```

**3. Check data actually exists:**
```bash
# Verify data in Firestore Console
# Firebase Console → Firestore Database
# Check if documents exist for this userId
```

---

### Issue 22: "No questions found" but data exists

**Symptoms:**
```
Agent says "You have no questions" but Firestore shows data
```

**Solutions:**

**1. Verify userId matches:**
```bash
# Check what userId you're sending
curl -X POST http://localhost:3002/agent/task \
  -H "Content-Type: application/json" \
  -d '{"task": "List questions", "userId": "correct-user-id"}'
```

**2. Check Firestore data structure:**
```json
// Document should have userId field
{
  "questionId": "q-123",
  "userId": "user-123",  // ← Must match
  "questionText": "...",
  "isActive": true  // ← Must be true
}
```

**3. Verify isActive flag:**
```typescript
// Queries filter by isActive = true
const questions = await db.collection('questions')
  .where('userId', '==', userId)
  .where('isActive', '==', true)  // Soft delete filter
  .get();
```

---

## Debugging Strategies

### Enable Debug Logging

```env
# .env
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

**What you'll see:**
```
[DEBUG] Agent executor: Starting task execution
[DEBUG] Tool call: get_questions with input {"limit": 50}
[DEBUG] Firestore query: collection=questions, filters=[userId==user-123]
[DEBUG] Tool result: Found 15 questions
[DEBUG] Agent iteration 1 complete
```

---

### Use Request IDs

All requests get a unique ID for tracing:

```bash
curl -X POST http://localhost:3002/agent/task \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: my-test-123" \
  -d '{"task": "...", "userId": "..."}'
```

Find all logs for this request:
```bash
grep "my-test-123" logs/app.log
```

---

### Test Individual Tools

```typescript
// Create tool-test.ts
import { getQuestionsTool } from './src/tools/data-retrieval/get-questions.tool';
import { createAgentContext } from './src/agent/context/agent-context';

async function testTool() {
  const context = createAgentContext('test-task-id', 'user-123');
  const result = await getQuestionsTool.execute(
    { limit: 10 },
    context
  );
  console.log(result);
}

testTool();
```

---

### Monitor Firestore Queries

```bash
# Firebase Console → Firestore → Usage
# Check:
# - Read/Write counts
# - Query patterns
# - Missing indexes
```

---

### Monitor Redis Queue

```bash
redis-cli
> KEYS bull:*
> LLEN bull:agent-tasks:wait      # Pending jobs
> ZCARD bull:agent-tasks:active   # Active jobs
> LLEN bull:agent-tasks:completed # Completed jobs
> LLEN bull:agent-tasks:failed    # Failed jobs
```

---

### Check Anthropic API Usage

```bash
# Console: https://console.anthropic.com/settings/usage
# Check:
# - API calls per day
# - Token usage
# - Rate limit status
# - Remaining credits
```

---

## Getting Help

### Before Asking for Help

1. **Check this guide** - Search for your error message
2. **Review logs** - Set `LOG_LEVEL=debug` and check output
3. **Verify health checks** - Run `curl http://localhost:3002/health`
4. **Test with simple task** - Try `"List my categories"` first
5. **Check dependencies** - Ensure Redis, Firebase, and Anthropic are accessible

---

### Gathering Debug Information

When reporting an issue, include:

```bash
# 1. Environment info
node --version
npm --version
cat .env | grep -v "API_KEY\|CREDENTIALS"  # Don't share secrets!

# 2. Health check
curl http://localhost:3002/health

# 3. Recent logs (last 50 lines)
tail -50 logs/app.log

# 4. Redis status
redis-cli info | grep version

# 5. Firestore collection counts
# (Share screenshot from Firebase Console)

# 6. Error message (full stack trace)
# Copy complete error from console
```

---

### Support Channels

**Internal Team:**
- Create issue in project repository
- Tag with appropriate labels (bug, question, enhancement)
- Include debug information from above

**Anthropic Claude API:**
- Status: https://status.anthropic.com/
- Documentation: https://docs.anthropic.com/
- Support: https://console.anthropic.com/support

**Firebase:**
- Status: https://status.firebase.google.com/
- Documentation: https://firebase.google.com/docs
- Community: https://firebase.google.com/support

**BullMQ:**
- Documentation: https://docs.bullmq.io/
- GitHub Issues: https://github.com/taskforcesh/bullmq/issues

---

## Related Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[AGENT-TOOLS.md](./AGENT-TOOLS.md)** - All 15 agent tools
- **[STREAMING.md](./STREAMING.md)** - SSE streaming guide
- **[QUEUE.md](./QUEUE.md)** - BullMQ architecture
- **[TASK-EXAMPLES.md](./TASK-EXAMPLES.md)** - Example tasks

---

**Most issues can be resolved by checking configurations and verifying connections!** 🔧
