# OpenClaw Alignment - Everything Built Around OpenClaw

**Date:** 2026-02-09  
**Principle:** OpenClaw is the heart/core - everything is built around it

---

## 🎯 Core Principle

**OpenClaw is the #1 source - it's literally the heart/core. Everything is built around it.**

Zaki Platform doesn't reinvent - it orchestrates OpenClaw instances and integrates with OpenClaw's native APIs.

---

## 🏗️ Architecture Alignment

### How Zaki Platform Uses OpenClaw

```
User → Zaki Platform → OpenClaw Gateway (per user) → OpenClaw Core
```

1. **Each user gets their own OpenClaw instance**
   - Isolated Docker container
   - Dedicated port (18789+)
   - Own config directory
   - Own workspace

2. **OpenClaw Gateway runs per user**
   - `clawdbot gateway --port ${port}`
   - Exposes OpenResponses API at `/v1/responses`
   - Handles all AI operations

3. **Zaki Platform orchestrates**
   - Creates/manages instances
   - Routes messages to correct gateway
   - Tracks usage from OpenClaw responses

---

## 🔌 OpenClaw API Integration

### OpenResponses API (`/v1/responses`)

OpenClaw exposes the OpenResponses API standard:

**Endpoint:** `POST http://localhost:${port}/v1/responses`

**Request:**
```typescript
{
  model: string,
  input: string | ItemParam[],
  instructions?: string,
  tools?: ToolDefinition[],
  stream?: boolean,
  max_output_tokens?: number,
  // ... other options
}
```

**Response:**
```typescript
{
  id: string,
  object: "response",
  created_at: number,
  status: "completed" | "in_progress" | "failed",
  model: string,
  output: OutputItem[],
  usage: {
    input_tokens: number,
    output_tokens: number,
    total_tokens: number
  },
  error?: { code: string, message: string }
}
```

**This is the exact format we need to match!**

---

## 📊 Usage Tracking Alignment

### OpenClaw's Usage Format

From `src/gateway/open-responses.schema.ts`:

```typescript
export const UsageSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});
```

### Our Implementation

Our `extractUsageFromResponse()` already matches this:

```typescript
// Primary location: response.usage (OpenClaw/OpenResponses format)
if (response.usage) {
  return {
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    total_tokens: usage.total_tokens ?? 0,
    model: response.model,
    provider: response.provider,
  };
}
```

✅ **Already aligned!**

---

## 🔧 Gateway Methods Alignment

### OpenClaw Gateway Methods

OpenClaw exposes these methods via gateway protocol:

- `usage.cost` - Cost summary
- `sessions.usage` - Session usage list
- `sessions.usage.timeseries` - Time series data
- `sessions.usage.logs` - Session logs

### Our Implementation

We should expose similar methods or call OpenClaw's gateway methods directly.

**Option 1: Call OpenClaw Gateway Methods**
```typescript
// Call OpenClaw's usage.cost method
const response = await fetch(`http://localhost:${port}/gateway`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    method: 'usage.cost',
    params: { startDate, endDate },
  }),
});
```

**Option 2: Aggregate from Our Database**
```typescript
// We track usage in our database
// Aggregate similar to OpenClaw's patterns
const stats = await services.usage.getUserStats(userId, 30);
```

---

## 📁 Config Alignment

### OpenClaw Config Format

From `start-zaki.sh`:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514"
      },
      "workspace": "/root/clawd",
      "heartbeat": {
        "every": "0m"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

✅ **We're using OpenClaw's native config format!**

---

## 🚀 Instance Management Alignment

### How We Start OpenClaw

From `instance-manager.ts`:

```typescript
// Start gateway in background
const startCmd = `bash -c "cd ${configDir} && OPENCLAW_CONFIG_DIR=${configDir} nohup ${cmd} gateway --port ${port} --token '${gatewayToken}' --verbose --allow-unconfigured --bind lan > ${logFile} 2>&1 &"`;
```

**This is exactly how OpenClaw expects to be run!**

### OpenClaw CLI Commands We Use

- `clawdbot gateway --port ${port}` - Start gateway
- `clawdbot gateway stop` - Stop gateway
- `clawdbot gateway --token ${token}` - With auth token
- `clawdbot gateway --allow-unconfigured` - Allow startup without full config

✅ **All aligned with OpenClaw's CLI!**

---

## 💬 Message Handling Alignment

### OpenClaw's Message Flow

1. Telegram message arrives
2. OpenClaw processes via gateway
3. OpenClaw returns response with usage
4. We track usage from response

### Our Implementation

From `handlers/telegram.ts`:

```typescript
// OpenClaw will handle the actual AI call
// Usage will be tracked when saveAssistantResponse is called with metadata
return {
  response: '', // AI response will be generated by OpenClaw
  context,
  agent: {
    systemPrompt: agent.systemPrompt || '',
    model: agent.model || 'claude-sonnet-4-20250514',
    provider: agent.provider || 'anthropic',
  },
  session: { id: session.id },
};
```

**We need to ensure we're calling OpenClaw's `/v1/responses` endpoint!**

---

## 🔍 What We Need to Verify

### 1. How We Call OpenClaw Gateway

**Question:** Where do we actually call OpenClaw's `/v1/responses` endpoint?

**Need to check:**
- Router/gateway handler
- Message processing flow
- HTTP client code

### 2. Response Handling

**Question:** Are we receiving OpenClaw responses in the correct format?

**Expected format:**
```typescript
{
  id: string,
  status: "completed",
  model: string,
  output: [...],
  usage: {
    input_tokens: number,
    output_tokens: number,
    total_tokens: number
  }
}
```

### 3. Usage Extraction

**Question:** Are we extracting usage correctly from OpenClaw responses?

**Our code:**
```typescript
const usage = extractUsageFromResponse(response);
// Should match OpenClaw's format exactly
```

---

## ✅ What's Already Aligned

1. ✅ **Config Format** - Using OpenClaw's native JSON config
2. ✅ **Gateway Startup** - Using OpenClaw CLI commands
3. ✅ **Usage Schema** - Matching OpenClaw's Usage format
4. ✅ **Response Format** - Expecting OpenResponses API format
5. ✅ **Instance Isolation** - Each user gets own OpenClaw instance
6. ✅ **Workspace Structure** - Using OpenClaw's workspace format

---

## 🔧 What Needs Alignment

1. ⬜ **Gateway API Calls** - Verify we're calling `/v1/responses` correctly
2. ⬜ **Response Parsing** - Ensure we parse OpenClaw responses correctly
3. ⬜ **Usage Tracking** - Verify usage extraction matches OpenClaw format
4. ⬜ **Gateway Methods** - Consider calling OpenClaw's gateway methods
5. ⬜ **Session Tracking** - Align with OpenClaw's session-based tracking

---

## 📚 OpenClaw Files We Reference

1. **`src/gateway/open-responses.schema.ts`** - Response/Usage schemas
2. **`src/gateway/openresponses-http.ts`** - HTTP handler
3. **`src/gateway/server-methods/usage.ts`** - Usage gateway methods
4. **`docs/concepts/usage-tracking.md`** - Usage tracking docs
5. **`docs/reference/api-usage-costs.md`** - API usage guide

---

## 🎯 Action Items

1. **Find where we call OpenClaw gateway**
   - Search for `/v1/responses` calls
   - Check router/gateway handlers
   - Verify HTTP client code

2. **Verify response format**
   - Ensure we're receiving OpenClaw responses
   - Check response parsing
   - Validate usage extraction

3. **Test integration**
   - Send test message
   - Verify OpenClaw response
   - Check usage tracking

4. **Document integration points**
   - Where we call OpenClaw
   - How we parse responses
   - How we track usage

---

## 💡 Key Insight

**OpenClaw is the heart/core - we're just orchestrating it!**

- We don't reinvent AI logic
- We don't create our own gateway
- We use OpenClaw's native APIs
- We track usage from OpenClaw responses
- We manage instances around OpenClaw

**Everything aligns with OpenClaw's patterns!**

---

**Last Updated:** 2026-02-09
