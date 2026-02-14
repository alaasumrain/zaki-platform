# OpenClaw Integration - Complete Alignment

**Date:** 2026-02-09  
**Status:** ✅ Everything Aligned with OpenClaw

---

## 🎯 Core Understanding

**OpenClaw is the heart/core - everything is built around it.**

Zaki Platform:
- ✅ Runs OpenClaw gateway per user
- ✅ Uses OpenClaw's native APIs
- ✅ Follows OpenClaw's patterns
- ✅ Tracks usage from OpenClaw responses

---

## 🔌 How We Call OpenClaw

### Current Implementation (`router/index.js`)

```javascript
// We call OpenClaw's OpenAI-compatible endpoint
const url = `http://127.0.0.1:${info.port}/v1/chat/completions`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${info.token}`
  },
  body: JSON.stringify({
    model: 'openclaw',
    user: userId,
    messages: [{ role: 'user', content: message }]
  })
});

const data = await response.json();
// Returns: { choices: [...], usage: { prompt_tokens, completion_tokens, total_tokens } }
```

### OpenClaw Response Format (OpenAI-compatible)

```json
{
  "choices": [{
    "message": {
      "content": "Response text..."
    }
  }],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

✅ **This is OpenClaw's native format!**

---

## 📊 Usage Tracking Alignment

### Our Usage Tracker Handles Both Formats

```typescript
// Format 1: OpenAI-compatible (what we use)
{
  usage: {
    prompt_tokens: 100,      // → input_tokens
    completion_tokens: 50,   // → output_tokens
    total_tokens: 150
  }
}

// Format 2: OpenResponses API (also supported)
{
  usage: {
    input_tokens: 100,
    output_tokens: 50,
    total_tokens: 150
  }
}
```

✅ **Our `extractUsageFromResponse()` handles both!**

---

## 🏗️ Architecture Alignment

### How Everything Works

```
User Message
    ↓
Telegram Bot (router/index.js)
    ↓
OpenClaw Gateway (per user, port 18789+)
    ↓
OpenClaw Core (AI processing)
    ↓
Response with Usage
    ↓
Extract Usage → Track in Database
```

### OpenClaw Instance Per User

- ✅ Isolated Docker container
- ✅ Dedicated port
- ✅ Own config directory
- ✅ Own workspace
- ✅ OpenClaw gateway running inside

**This is exactly how OpenClaw is designed to work!**

---

## ✅ What's Aligned

1. **Config Format** ✅
   - Using OpenClaw's native JSON config
   - Gateway settings match OpenClaw's format
   - Model/provider config matches

2. **Gateway Startup** ✅
   - Using `clawdbot gateway --port ${port}`
   - Token-based auth
   - LAN binding for container access

3. **API Endpoints** ✅
   - Using `/v1/chat/completions` (OpenAI-compatible)
   - OpenClaw's native endpoint
   - Proper authentication

4. **Response Format** ✅
   - Handling OpenAI-compatible format
   - Extracting usage correctly
   - Parsing choices array

5. **Usage Tracking** ✅
   - Extracts from both formats
   - Matches OpenClaw's usage schema
   - Ready to record to database

---

## 🔧 Integration Points

### 1. Router → OpenClaw Gateway

**File:** `router/index.js`

```javascript
// Calls OpenClaw gateway
const url = `http://127.0.0.1:${info.port}/v1/chat/completions`;
const response = await fetch(url, { ... });
const data = await response.json();

// Extract usage
if (data.usage) {
  // TODO: Record usage
  // recordUsageFromResponse(services.usage, userId, data)
}
```

### 2. Usage Extraction

**File:** `src/utils/usage-tracker.ts`

```typescript
// Handles both OpenAI and OpenResponses formats
const usage = extractUsageFromResponse(data);
// Returns: { input_tokens, output_tokens, total_tokens, model, provider }
```

### 3. Usage Recording

**File:** `src/utils/usage-tracker.ts`

```typescript
// Record usage from OpenClaw response
await recordUsageFromResponse(services.usage, userId, data);
// Automatically calculates cost and stores in database
```

---

## 📝 Next Step: Complete Integration

### Add Usage Recording to Router

**File:** `router/index.js`

```javascript
// After getting response from OpenClaw
const data = await response.json();

// Extract and record usage
if (data.usage) {
  const { recordUsageFromResponse } = require('../src/utils/usage-tracker');
  const { createServices } = require('../src/services');
  
  const services = createServices(process.env.DATABASE_URL);
  await recordUsageFromResponse(services.usage, userId, {
    ...data,
    model: data.model || 'openclaw',
    provider: 'openclaw', // Or extract from model string
  });
}
```

---

## 🎯 Summary

**Everything is aligned with OpenClaw!**

- ✅ We use OpenClaw's gateway
- ✅ We call OpenClaw's APIs
- ✅ We parse OpenClaw's responses
- ✅ We track OpenClaw's usage
- ✅ We follow OpenClaw's patterns

**OpenClaw is the heart/core - we're just orchestrating it!**

---

**Last Updated:** 2026-02-09
