# Telegram Flow - Complete Step-by-Step Analysis

**Date:** 2026-02-09  
**Focus:** Telegram channel only

---

## 🔍 Current Architecture

You have **TWO Telegram implementations**:

### 1. **Router Implementation** (`router/index.js`)
- **Simple, direct approach**
- Uses Grammy bot library
- Directly routes to OpenClaw containers
- **Currently active** (based on code structure)

### 2. **Platform Implementation** (`src/index.ts` + `src/handlers/telegram.ts`)
- **Full platform with onboarding**
- Uses Express + polling
- Has database integration
- More complex, feature-rich

**Let's focus on Router (the active one) and optimize it.**

---

## 📱 Complete Telegram Flow (Router)

### Step 1: User Sends Message

```
User types message in Telegram
    ↓
Telegram API sends update to bot
    ↓
Grammy bot receives update
```

**Code:** `router/index.js:333`
```javascript
bot.on('message:text', async (ctx) => {
  const userId = String(ctx.from.id);
  const text = ctx.message.text;
  // ...
});
```

---

### Step 2: Check User & Container

```
Check if user exists in userPorts Map
    ↓
If new user → Provision container (40s wait)
If existing → Check if container running
    ↓
If stopped → Start container (30s wait)
```

**Code:** `router/index.js:345-375`
```javascript
let info = userPorts.get(userId);

if (!info) {
  // New user - provision container
  await ctx.reply(`Hey ${userInfo.firstName}! 👋 First time here...`);
  info = await provisionContainer(userId, userInfo);
} else {
  // Check if container is running
  const { container, running } = await getContainer(userId);
  if (!running) {
    await container.start();
    await new Promise(r => setTimeout(r, 30000)); // Wait 30s
  }
}
```

**⏱️ Time:** 0-40 seconds (new user) or 0-30 seconds (restart)

---

### Step 3: Send to OpenClaw Gateway

```
HTTP POST to OpenClaw gateway
    ↓
http://127.0.0.1:${port}/v1/chat/completions
    ↓
OpenClaw processes message
    ↓
Returns response with usage
```

**Code:** `router/index.js:247-306`
```javascript
async function sendToContainer(userId, message, info, retries = 3) {
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
  // Returns: { choices: [...], usage: {...} }
}
```

**⏱️ Time:** 2-60 seconds (depends on AI response time)

---

### Step 4: Record Usage

```
Extract usage from response
    ↓
Calculate cost
    ↓
Save to database
```

**Code:** `router/index.js:298-304`
```javascript
if (data.usage) {
  recordUsage(userId, data).catch(err => {
    console.error(`[Usage] Error recording usage:`, err.message);
  });
}
```

**Code:** `router/usage-tracker.js`
```javascript
// Extracts usage, calculates cost, saves to DB
await service.recordUsage({
  userId,
  model: usage.model,
  provider: usage.provider,
  inputTokens: usage.input_tokens,
  outputTokens: usage.output_tokens,
  costMicrocents: calculateCostMicrocents(...)
});
```

**⏱️ Time:** < 100ms (non-blocking)

---

### Step 5: Send Response to User

```
Extract response text
    ↓
Split if > 4000 chars
    ↓
Send to Telegram
```

**Code:** `router/index.js:382-390`
```javascript
const response = await sendToContainer(userId, text, info);

// Split long responses
if (response.length > 4000) {
  const chunks = response.match(/.{1,4000}/gs) || [response];
  for (const chunk of chunks) {
    await ctx.reply(chunk);
  }
} else {
  await ctx.reply(response);
}
```

**⏱️ Time:** < 1 second

---

## ⏱️ Total Time Breakdown

### New User (First Message)
1. Provision container: **~40 seconds**
2. Wait for gateway: **~35 seconds** (included in provision)
3. Send to OpenClaw: **2-60 seconds**
4. Record usage: **< 100ms** (async)
5. Send response: **< 1 second**

**Total: ~42-76 seconds** (mostly waiting for container)

### Existing User (Container Running)
1. Check container: **< 1 second**
2. Send to OpenClaw: **2-60 seconds**
3. Record usage: **< 100ms** (async)
4. Send response: **< 1 second**

**Total: ~3-62 seconds** (mostly AI processing)

### Existing User (Container Stopped)
1. Start container: **~30 seconds**
2. Send to OpenClaw: **2-60 seconds**
3. Record usage: **< 100ms** (async)
4. Send response: **< 1 second**

**Total: ~33-92 seconds**

---

## 🎯 Optimization Opportunities

### 1. **Container Startup Time** (Biggest Issue)

**Problem:** 30-40 second wait for new/stopped containers

**Solutions:**
- ✅ Keep containers running (already have restart policy)
- ⬜ Pre-warm containers for active users
- ⬜ Faster container startup (optimize image)
- ⬜ Health check before responding to user

**Code to add:**
```javascript
// Health check before replying
async function waitForGatewayReady(port, maxWait = 30) {
  for (let i = 0; i < maxWait; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { timeout: 1000 });
      if (response.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}
```

---

### 2. **Session Context** (Missing)

**Problem:** Each message is sent as a single message, no conversation history

**Current:**
```javascript
messages: [{ role: 'user', content: message }]  // Only current message
```

**Should be:**
```javascript
messages: [
  ...conversationHistory,  // Previous messages
  { role: 'user', content: message }  // Current message
]
```

**Solution:** Store conversation history per user

**Code to add:**
```javascript
// Store conversation history
const conversationHistory = new Map();

// Load history before sending
let history = conversationHistory.get(userId) || [];

// Add to history after response
history.push({ role: 'user', content: message });
history.push({ role: 'assistant', content: response });
conversationHistory.set(userId, history.slice(-20)); // Keep last 20 messages
```

---

### 3. **Error Handling** (Can Improve)

**Current:** Basic retry logic, but could be better

**Improvements:**
- Better error messages for users
- Retry with exponential backoff (already done)
- Circuit breaker for failing containers
- Graceful degradation

---

### 4. **Usage Tracking** (Needs Integration)

**Current:** Code is there but needs:
- ✅ Database connection working
- ✅ tsx installed or TypeScript compiled
- ✅ DATABASE_URL set

**Status:** Ready, just needs setup

---

### 5. **Response Splitting** (Good, but can improve)

**Current:** Splits at 4000 chars

**Improvements:**
- Split at sentence boundaries
- Add "Part 1/3" indicators
- Better formatting for code blocks

---

## 🔧 Immediate Optimizations

### Priority 1: Add Conversation History

**File:** `router/index.js`

```javascript
// Add at top
const conversationHistory = new Map();

// In sendToContainer, modify:
async function sendToContainer(userId, message, info, retries = 3) {
  // Load conversation history
  let history = conversationHistory.get(userId) || [];
  
  // Add current message
  const messages = [
    ...history,
    { role: 'user', content: message }
  ];
  
  // ... existing fetch code ...
  body: JSON.stringify({
    model: 'openclaw',
    user: userId,
    messages: messages  // Use history
  }),
  
  // After getting response, update history
  const responseText = data.choices?.[0]?.message?.content || 'No response';
  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: responseText });
  conversationHistory.set(userId, history.slice(-20)); // Keep last 20
  
  return responseText;
}
```

---

### Priority 2: Health Check Before Responding

**File:** `router/index.js`

```javascript
async function waitForGatewayReady(port, maxWait = 30) {
  for (let i = 0; i < maxWait; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { 
        signal: AbortSignal.timeout(1000) 
      });
      if (response.ok) {
        console.log(`Gateway ready on port ${port} after ${i + 1}s`);
        return true;
      }
    } catch (e) {
      // Not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

// Use in container startup:
if (!running) {
  await ctx.reply('One sec, waking up... 💤');
  await container.start();
  
  // Wait for gateway to be ready
  const ready = await waitForGatewayReady(info.port);
  if (!ready) {
    await ctx.reply('⏱️ Taking longer than expected... still starting up.');
  }
}
```

---

### Priority 3: Better Response Splitting

**File:** `router/index.js`

```javascript
function splitResponse(text, maxLength = 4000) {
  if (text.length <= maxLength) return [text];
  
  // Try to split at sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks.length > 0 ? chunks : [text];
}

// Use:
const chunks = splitResponse(response);
for (let i = 0; i < chunks.length; i++) {
  const prefix = chunks.length > 1 ? `[${i + 1}/${chunks.length}] ` : '';
  await ctx.reply(prefix + chunks[i]);
}
```

---

## 📊 Current Flow Diagram

```
┌─────────────┐
│   User      │
│  Telegram   │
└──────┬──────┘
       │ Message
       ▼
┌─────────────────┐
│  Grammy Bot     │
│  (router/index) │
└──────┬──────────┘
       │
       ├─ New User? → Provision Container (40s)
       ├─ Stopped? → Start Container (30s)
       │
       ▼
┌─────────────────┐
│  OpenClaw       │
│  Gateway        │
│  (per user)     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  OpenClaw Core  │
│  (AI Processing)│
└──────┬──────────┘
       │
       ├─ Response
       └─ Usage Data
       │
       ▼
┌─────────────────┐
│  Usage Tracker  │
│  (async save)   │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  Send to User   │
└─────────────────┘
```

---

## 🎯 Next Steps

1. **Add conversation history** - Biggest UX improvement
2. **Add health checks** - Better user feedback
3. **Improve response splitting** - Better formatting
4. **Complete usage tracking** - Set up database
5. **Add /usage command** - Show user their stats

---

**Last Updated:** 2026-02-09
