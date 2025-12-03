# Streaming Guide - Server-Sent Events (SSE)

Complete guide to real-time agent progress streaming using Server-Sent Events.

## Table of Contents

- [Overview](#overview)
- [Why Streaming?](#why-streaming)
- [SSE Architecture](#sse-architecture)
- [Event Types](#event-types)
- [Using the Streaming API](#using-the-streaming-api)
- [Client Implementation](#client-implementation)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

The AI Agent Service supports **real-time progress streaming** using Server-Sent Events (SSE). This allows clients to receive live updates as the agent executes tasks, providing immediate feedback to users.

### What is SSE?

Server-Sent Events is a server push technology that allows servers to send real-time updates to clients over HTTP.

**Key Features:**
- ✅ **Unidirectional** - Server → Client (perfect for progress updates)
- ✅ **Text-based** - Easy to debug and inspect
- ✅ **Auto-reconnect** - Browser handles connection drops
- ✅ **Standard HTTP** - Works through firewalls and proxies
- ✅ **Efficient** - Single long-lived connection

### When to Use Streaming

| Scenario | Recommended Mode |
|----------|------------------|
| Quick tasks (< 10s) | Synchronous |
| Medium tasks (10-30s) | **Streaming (SSE)** ✅ |
| Long tasks (> 30s) | Queue + Polling |

**Use streaming when:**
- User needs real-time feedback
- Task involves multiple steps
- Transparency is important
- User is actively waiting

---

## Why Streaming?

### Without Streaming (Synchronous)

```
User Request → [Black Box] → Result (after 30s)

Problems:
❌ No feedback during execution
❌ User doesn't know what's happening
❌ Looks like the app is frozen
❌ High anxiety for long tasks
```

### With Streaming (SSE)

```
User Request → Starting...
            → Thinking...
            → Using tool: get_questions
            → Using tool: analyze_difficulty
            → Complete!

Benefits:
✅ Real-time progress updates
✅ User knows what's happening
✅ Transparency builds trust
✅ Better user experience
```

---

## SSE Architecture

### System Flow

```
Client                    TypeScript Agent Service                 Firestore
  |                                  |                                |
  |-- POST /agent/task/stream ----→ |                                |
  |                                  |                                |
  |← event: progress (starting) ---- |                                |
  |                                  |                                |
  |← event: thinking ---------------- |                                |
  |                                  |                                |
  |← event: tool_use ---------------- |                                |
  |                                  |-- execute tool --------------→ |
  |                                  |← tool result ------------------ |
  |                                  |                                |
  |← event: tool_result ------------- |                                |
  |                                  |                                |
  |← event: complete ---------------- |                                |
  |                                  |                                |
  Connection closed                  |                                |
```

### SSE Message Format

SSE uses a simple text format:

```
event: <event_type>
data: <json_data>

```

**Example:**
```
event: progress
data: {"type":"progress","message":"Starting task...","progress":0}

event: thinking
data: {"type":"thinking","content":"Let me fetch your categories..."}

event: complete
data: {"type":"complete","taskId":"abc-123","result":"..."}

```

**Note:** Each message ends with two newlines (`\n\n`)

---

## Event Types

The agent service sends 5 types of events:

### 1. `progress`

General progress updates about task execution.

**Data:**
```json
{
  "type": "progress",
  "message": "Starting task execution...",
  "progress": 0,
  "timestamp": "2025-11-27T10:30:00.000Z"
}
```

**Fields:**
- `message`: Human-readable status message
- `progress`: Optional progress percentage (0-100)
- `timestamp`: ISO 8601 timestamp

**Example Messages:**
- "Starting task execution..."
- "Processing your request..."
- "Analyzing results..."

---

### 2. `thinking`

Agent's reasoning and thought process.

**Data:**
```json
{
  "type": "thinking",
  "content": "I need to first check what categories exist before categorizing the questions...",
  "timestamp": "2025-11-27T10:30:01.000Z"
}
```

**Fields:**
- `content`: Agent's internal reasoning
- `timestamp`: ISO 8601 timestamp

**Example Content:**
- "Let me analyze the question text to determine the appropriate category..."
- "I'll use the find_duplicates tool to check for similar questions first..."

---

### 3. `tool_use`

Agent is calling a tool to perform an action.

**Data:**
```json
{
  "type": "tool_use",
  "toolName": "get_questions",
  "input": {
    "categoryId": "cat-javascript",
    "limit": 20
  },
  "output": "[Results from tool execution]",
  "timestamp": "2025-11-27T10:30:02.000Z"
}
```

**Fields:**
- `toolName`: Name of the tool being called
- `input`: Parameters sent to the tool
- `output`: Optional tool result (included after execution)
- `timestamp`: ISO 8601 timestamp

**Tool Names:**
- Data Retrieval: `get_questions`, `get_categories`, etc.
- Data Modification: `create_question`, `update_question`, etc.
- Data Analysis: `find_duplicate_questions`, `analyze_question_difficulty`

---

### 4. `complete`

Task execution completed successfully.

**Data:**
```json
{
  "type": "complete",
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "I've categorized 15 questions into their appropriate categories...",
  "metadata": {
    "toolsUsed": 3,
    "iterations": 2,
    "durationMs": 5234,
    "tokensUsed": {
      "input": 500,
      "output": 250,
      "total": 750
    }
  },
  "timestamp": "2025-11-27T10:30:05.000Z"
}
```

**Fields:**
- `taskId`: Unique task identifier
- `result`: Final result from the agent
- `metadata`: Execution statistics
- `timestamp`: ISO 8601 timestamp

**After receiving this event, the connection will close.**

---

### 5. `error`

An error occurred during execution.

**Data:**
```json
{
  "type": "error",
  "message": "Failed to execute task: Timeout exceeded",
  "code": "TIMEOUT_ERROR",
  "timestamp": "2025-11-27T10:30:05.000Z"
}
```

**Fields:**
- `message`: Error description
- `code`: Optional error code
- `timestamp`: ISO 8601 timestamp

**After receiving this event, the connection will close.**

---

## Using the Streaming API

### Endpoint

```
POST /agent/task/stream
```

### Request

```bash
curl -N -X POST http://localhost:3002/agent/task/stream \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Categorize all my uncategorized questions",
    "userId": "user-123"
  }'
```

**Note:** The `-N` flag disables buffering for real-time output.

### Response Headers

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Response Body

```
event: progress
data: {"type":"progress","message":"Starting task execution...","progress":0}

event: thinking
data: {"type":"thinking","content":"I need to first get all uncategorized questions..."}

event: tool_use
data: {"type":"tool_use","toolName":"get_uncategorized_questions","input":{}}

event: tool_use
data: {"type":"tool_use","toolName":"get_categories","input":{}}

event: tool_use
data: {"type":"tool_use","toolName":"batch_update_questions","input":{"questionIds":["q-1","q-2"],"updates":{"categoryId":"cat-js"}}}

event: complete
data: {"type":"complete","taskId":"abc-123","result":"I've categorized 2 questions...","metadata":{...}}

```

---

## Client Implementation

### JavaScript (Browser)

```javascript
const eventSource = new EventSource('http://localhost:3002/agent/task/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task: 'List my categories',
    userId: 'user-123'
  })
});

// Handle different event types
eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.message, data.progress);
  updateProgressBar(data.progress);
});

eventSource.addEventListener('thinking', (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent thinking:', data.content);
  showThinkingBubble(data.content);
});

eventSource.addEventListener('tool_use', (event) => {
  const data = JSON.parse(event.data);
  console.log('Tool called:', data.toolName, data.input);
  logToolExecution(data.toolName, data.input);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Complete:', data.result);
  showResult(data.result, data.metadata);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data.message);
  showError(data.message);
  eventSource.close();
});

// Handle connection errors
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};
```

### C# (.NET)

See `AgentService.ExecuteTaskStreamingAsync()` in the C# Backend:

```csharp
await _agentService.ExecuteTaskStreamingAsync(
    task: "List my categories",
    userId: "user-123",
    onProgress: (streamEvent) =>
    {
        switch (streamEvent.Type)
        {
            case "progress":
                Console.WriteLine($"Progress: {streamEvent.Message}");
                break;
            case "thinking":
                Console.WriteLine($"Thinking: {streamEvent.Content}");
                break;
            case "tool_use":
                Console.WriteLine($"Tool: {streamEvent.ToolName}");
                break;
            case "complete":
                Console.WriteLine($"Complete: {streamEvent.Content}");
                break;
            case "error":
                Console.WriteLine($"Error: {streamEvent.Message}");
                break;
        }
    },
    cancellationToken
);
```

### Python

```python
import requests
import json

response = requests.post(
    'http://localhost:3002/agent/task/stream',
    json={
        'task': 'List my categories',
        'userId': 'user-123'
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('event:'):
            event_type = line[6:].strip()
        elif line.startswith('data:'):
            data = json.loads(line[5:])
            print(f'{event_type}: {data}')
```

---

## Error Handling

### Connection Drops

SSE connections can drop for various reasons:
- Network issues
- Server restart
- Client navigation
- Timeout

**Built-in reconnection:**
Browsers automatically try to reconnect when SSE connections drop.

**Manual handling:**
```javascript
eventSource.onerror = (error) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection closed, will not reconnect');
  } else {
    console.log('Connection error, will reconnect automatically');
  }
};
```

### Timeout Handling

The agent has a configurable timeout (default: 120 seconds).

If exceeded, you'll receive an error event:
```json
{
  "type": "error",
  "message": "Task execution timeout exceeded",
  "code": "TIMEOUT_ERROR"
}
```

**Configure timeout:**
```env
AGENT_TIMEOUT_MS=120000  # 2 minutes
```

### Client-Side Timeout

```javascript
const timeout = setTimeout(() => {
  eventSource.close();
  showError('Request timed out');
}, 30000); // 30 seconds

eventSource.addEventListener('complete', () => {
  clearTimeout(timeout);
  eventSource.close();
});
```

---

## Best Practices

### For Client Developers

1. **Always close connections**
   ```javascript
   // When task completes or errors
   eventSource.close();

   // When user navigates away
   window.addEventListener('beforeunload', () => {
     eventSource.close();
   });
   ```

2. **Handle all event types**
   - Minimum: `complete` and `error`
   - Recommended: All 5 event types

3. **Show progress to users**
   - Display thinking bubbles
   - Show tool execution logs
   - Update progress bars

4. **Implement timeout**
   - Don't wait forever
   - Show user-friendly timeout messages

5. **Handle reconnection**
   - Detect disconnects
   - Ask user if they want to retry

### For Server Developers

1. **Send regular events**
   - Keep connection alive with periodic pings
   - Our implementation sends ping every 15 seconds

2. **Close connections properly**
   - Always send `complete` or `error` before closing
   - Clean up resources

3. **Limit connection duration**
   - Implement server-side timeout
   - Our default: 120 seconds

4. **Monitor connection count**
   - Track active SSE connections
   - Implement rate limiting if needed

---

## Related Documentation

- **[QUEUE.md](./QUEUE.md)** - For long-running tasks
- **[AGENT-TOOLS.md](./AGENT-TOOLS.md)** - Tool documentation
- **[TASK-EXAMPLES.md](./TASK-EXAMPLES.md)** - Example tasks

---

**Streaming provides real-time transparency and builds user trust!** 🚀
