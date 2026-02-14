# Telegram Flow - Exact Step-by-Step (Router Implementation)

**Date:** 2026-02-09  
**Implementation:** `router/index.js` (Simple Router)

---

## 🎯 Exact Flow - Every Step

### **Step 1: User Types Message in Telegram**

```
User opens Telegram
    ↓
Types message: "Hello"
    ↓
Presses Send
```

**What happens:**
- Telegram app sends message to Telegram servers
- Telegram servers queue message for bot

---

### **Step 2: Telegram Sends Update to Bot**

```
Telegram API
    ↓
Sends update via long polling
    ↓
Bot receives update
```

**Code:** `router/index.js:333`
```javascript
bot.on('message:text', async (ctx) => {
  // ctx.message contains the message
  // ctx.from contains user info
});
```

**Update format:**
```json
{
  "update_id": 123,
  "message": {
    "message_id": 456,
    "from": {
      "id": 789,
      "first_name": "John",
      "username": "john_doe"
    },
    "chat": { "id": 789 },
    "text": "Hello",
    "date": 1234567890
  }
}
```

**⏱️ Time:** < 100ms (network latency)

---

### **Step 3: Extract User Info**

```javascript
const userId = String(ctx.from.id);  // "789"
const text = ctx.message.text;        // "Hello"
const userInfo = {
  firstName: ctx.from.first_name,    // "John"
  lastName: ctx.from.last_name,       // undefined
  username: ctx.from.username         // "john_doe"
};
```

**⏱️ Time:** < 1ms

---

### **Step 4: Check if User Exists**

```javascript
let info = userPorts.get(userId);
// info = { port: 19001, token: "...", name: "John", ... }
// OR
// info = undefined (new user)
```

**Data structure:**
- `userPorts` is a Map: `userId → { port, token, name, username, created }`
- Loaded from `/var/zaki-platform/router/users.json` on startup

**⏱️ Time:** < 1ms (Map lookup)

---

### **Step 5A: New User - Provision Container**

**If `info === undefined`:**

```javascript
// Send immediate response
await ctx.reply(`Hey ${userInfo.firstName}! 👋 First time here - spinning up YOUR personal AI. Takes about 40 seconds, grab a coffee ☕`);

// Provision container
info = await provisionContainer(userId, userInfo);
```

**What `provisionContainer` does:**

1. **Create directories** (1s)
   ```javascript
   /var/zaki-platform/users/user-789/.openclaw/
   /var/zaki-platform/users/user-789/workspace/
   ```

2. **Create OpenClaw config** (1s)
   ```json
   {
     "gateway": {
       "port": 18789,
       "bind": "lan",
       "auth": { "mode": "token", "token": "zaki-token-789-..." },
       "http": { "endpoints": { "chatCompletions": { "enabled": true } } }
     },
     "agents": { "defaults": { "model": { "primary": "moonshot/kimi-k2-0905-preview" } } },
     "models": { "providers": { "moonshot": { "apiKey": "...", ... } } }
   }
   ```

3. **Create workspace files** (1s)
   - `SOUL.md` - AI personality
   - `USER.md` - User info
   - `IDENTITY.md` - Bot identity
   - `MEMORY.md` - Long-term memory
   - `TOOLS.md` - Tool notes
   - `HEARTBEAT.md` - Empty (skip heartbeat)

4. **Create Docker container** (5s)
   ```javascript
   docker.createContainer({
     Image: 'alpine/openclaw:latest',
     name: 'zaki-user-789',
     HostConfig: {
       Memory: 2GB,
       CpuQuota: 200000,  // 2 CPUs
       PidsLimit: 100,
       PortBindings: { '18789/tcp': [{ HostPort: '19001' }] },
       Binds: [
         '/var/zaki-platform/users/user-789/.openclaw:/home/node/.openclaw:rw',
         '/var/zaki-platform/users/user-789/workspace:/home/node/workspace:rw'
       ]
     }
   });
   ```

5. **Start container** (2s)
   ```javascript
   await container.start();
   ```

6. **Wait for OpenClaw gateway** (35s)
   ```javascript
   await new Promise(r => setTimeout(r, 35000));
   // OpenClaw needs time to:
   // - Start Node.js
   // - Load config
   // - Initialize gateway
   // - Bind to port 18789
   ```

**Total: ~45 seconds**

**⏱️ Time:** 40-45 seconds

---

### **Step 5B: Existing User - Check Container**

**If `info` exists:**

```javascript
const { container, running } = await getContainer(userId);
// Checks Docker API: docker.getContainer('zaki-user-789').inspect()
```

**If not running:**
```javascript
await ctx.reply('One sec, waking up... 💤');
await container.start();
await new Promise(r => setTimeout(r, 30000)); // Wait 30s
```

**⏱️ Time:** 0-30 seconds (if stopped)

---

### **Step 6: Send Message to OpenClaw Gateway**

```javascript
const response = await sendToContainer(userId, text, info);
```

**What `sendToContainer` does:**

1. **Build URL**
   ```javascript
   const url = `http://127.0.0.1:${info.port}/v1/chat/completions`;
   // Example: http://127.0.0.1:19001/v1/chat/completions
   ```

2. **Create HTTP request**
   ```javascript
   fetch(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${info.token}`
     },
     body: JSON.stringify({
       model: 'openclaw',
       user: userId,
       messages: [{ role: 'user', content: message }]
     }),
     signal: AbortSignal.timeout(60000)  // 60s timeout
   });
   ```

3. **OpenClaw Gateway receives request**
   - Validates token
   - Routes to OpenClaw core
   - Processes message with AI
   - Returns response

4. **Receive response**
   ```json
   {
     "choices": [{
       "message": {
         "content": "Hello! How can I help you today?"
       }
     }],
     "usage": {
       "prompt_tokens": 10,
       "completion_tokens": 8,
       "total_tokens": 18
     }
   }
   ```

**⏱️ Time:** 2-60 seconds (depends on AI response time)

---

### **Step 7: Record Usage (Async, Non-Blocking)**

```javascript
if (data.usage) {
  recordUsage(userId, data).catch(err => {
    console.error(`[Usage] Error recording usage:`, err.message);
  });
}
```

**What happens:**
1. Extract usage: `{ input_tokens: 10, output_tokens: 8, ... }`
2. Calculate cost: `$0.000015` (example)
3. Save to database: `INSERT INTO usage (...)`

**⏱️ Time:** < 100ms (doesn't block response)

---

### **Step 8: Send Response to User**

```javascript
const response = await sendToContainer(userId, text, info);
// response = "Hello! How can I help you today?"

// Split if too long
if (response.length > 4000) {
  const chunks = response.match(/.{1,4000}/gs) || [response];
  for (const chunk of chunks) {
    await ctx.reply(chunk);
  }
} else {
  await ctx.reply(response);
}
```

**What happens:**
- Grammy bot sends message via Telegram API
- User sees response in Telegram

**⏱️ Time:** < 1 second

---

## ⏱️ Total Time Breakdown

### **New User (First Message)**
```
Step 1-3: Extract info          < 1ms
Step 4:   Check user            < 1ms
Step 5A:  Provision container   40-45s  ⚠️ SLOW
Step 6:   Send to OpenClaw      2-60s
Step 7:   Record usage          < 100ms (async)
Step 8:   Send response         < 1s
─────────────────────────────────────────
Total:   42-106 seconds
```

### **Existing User (Container Running)**
```
Step 1-3: Extract info          < 1ms
Step 4:   Check user            < 1ms
Step 5B:  Check container       < 1s
Step 6:   Send to OpenClaw      2-60s
Step 7:   Record usage          < 100ms (async)
Step 8:   Send response         < 1s
─────────────────────────────────────────
Total:   3-62 seconds
```

### **Existing User (Container Stopped)**
```
Step 1-3: Extract info          < 1ms
Step 4:   Check user            < 1ms
Step 5B:  Start container       30s  ⚠️ SLOW
Step 6:   Send to OpenClaw      2-60s
Step 7:   Record usage          < 100ms (async)
Step 8:   Send response         < 1s
─────────────────────────────────────────
Total:   33-92 seconds
```

---

## 🎯 Optimization Opportunities

### **1. Container Startup (BIGGEST ISSUE)**

**Problem:** 30-45 second wait

**Current:**
- Fixed 35s wait for new containers
- Fixed 30s wait for restarted containers
- No health check - just wait

**Solution: Health Check Instead of Fixed Wait**

```javascript
async function waitForGatewayReady(port, maxWait = 30) {
  for (let i = 0; i < maxWait; i++) {
    try {
      // Try to connect to gateway
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        console.log(`Gateway ready after ${i + 1}s`);
        return true;
      }
    } catch (e) {
      // Not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

// Use:
const ready = await waitForGatewayReady(info.port);
if (!ready) {
  await ctx.reply('⏱️ Taking longer than expected...');
}
```

**Benefit:** 
- Usually ready in 10-15s instead of 30-35s
- User gets feedback faster

---

### **2. No Conversation History**

**Problem:** Each message is isolated

**Current:**
```javascript
messages: [{ role: 'user', content: message }]  // Only current message
```

**Impact:**
- AI doesn't remember previous messages
- Each message is treated as new conversation
- Poor user experience

**Solution: Store Conversation History**

```javascript
// At top of file
const conversationHistory = new Map();

// In sendToContainer:
async function sendToContainer(userId, message, info, retries = 3) {
  // Load history
  let history = conversationHistory.get(userId) || [];
  
  // Build messages array
  const messages = [
    ...history,
    { role: 'user', content: message }
  ];
  
  // Send with history
  body: JSON.stringify({
    model: 'openclaw',
    user: userId,
    messages: messages  // Include history
  }),
  
  // After response, update history
  const responseText = data.choices?.[0]?.message?.content || 'No response';
  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: responseText });
  
  // Keep last 20 messages (prevent context overflow)
  conversationHistory.set(userId, history.slice(-20));
  
  return responseText;
}
```

**Benefit:**
- AI remembers conversation
- Much better UX
- Follows OpenClaw's session-based approach

---

### **3. Response Splitting**

**Problem:** Splits at arbitrary 4000 chars

**Current:**
```javascript
const chunks = response.match(/.{1,4000}/gs);  // Just splits at 4000 chars
```

**Better: Split at sentences**

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

### **4. Error Messages**

**Problem:** Generic error messages

**Current:**
```javascript
return `❌ Error: ${e.message.substring(0, 100)}`;
```

**Better: User-friendly messages**

```javascript
if (e.message.includes('ECONNREFUSED')) {
  return `🔄 Your AI is starting up... try again in 30 seconds.`;
} else if (e.message.includes('timeout')) {
  return `⏱️ The AI is taking longer than usual. This might be a complex request. Try again?`;
} else if (e.message.includes('session file locked')) {
  return `⚠️ Your AI is busy processing another request. Please wait a moment.`;
} else {
  return `❌ Something went wrong. Please try again or use /help for support.`;
}
```

---

## 📊 Current Data Flow

```
┌─────────────┐
│   User      │
│  Telegram   │
└──────┬──────┘
       │ 1. Message
       ▼
┌─────────────────┐
│  Grammy Bot     │
│  (router/index) │
└──────┬──────────┘
       │ 2. Check user
       ├─ New? → Provision (40s)
       ├─ Stopped? → Start (30s)
       │
       ▼
┌─────────────────┐
│  Docker         │
│  Container      │
│  (per user)     │
└──────┬──────────┘
       │ 3. OpenClaw Gateway
       │    (port 18789)
       ▼
┌─────────────────┐
│  OpenClaw Core  │
│  (AI Processing) │
└──────┬──────────┘
       │ 4. Response + Usage
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

## 🚀 Immediate Actions

### **Priority 1: Add Conversation History** (Biggest UX improvement)

**File:** `router/index.js`

Add at top:
```javascript
const conversationHistory = new Map();
```

Modify `sendToContainer`:
```javascript
// Load history
let history = conversationHistory.get(userId) || [];

// Include in request
messages: [
  ...history,
  { role: 'user', content: message }
]

// Update after response
history.push({ role: 'user', content: message });
history.push({ role: 'assistant', content: responseText });
conversationHistory.set(userId, history.slice(-20));
```

---

### **Priority 2: Health Check Instead of Fixed Wait**

**File:** `router/index.js`

Replace fixed waits with:
```javascript
async function waitForGatewayReady(port, maxWait = 30) {
  for (let i = 0; i < maxWait; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}
```

---

### **Priority 3: Better Response Splitting**

**File:** `router/index.js`

Replace simple split with sentence-aware splitting (code above).

---

## 📝 Summary

**Current Flow:**
1. User sends message → Bot receives
2. Check user → Provision/start container (30-45s) ⚠️
3. Send to OpenClaw → Get response (2-60s)
4. Record usage → Save to DB (async)
5. Send response → User sees it

**Biggest Issues:**
1. ⚠️ No conversation history (each message isolated)
2. ⚠️ Fixed 30-45s wait for containers
3. ⚠️ Basic response splitting

**Quick Wins:**
1. ✅ Add conversation history (5 min)
2. ✅ Health check instead of fixed wait (10 min)
3. ✅ Better response splitting (5 min)

**Total improvement time: ~20 minutes for major UX boost!**

---

**Last Updated:** 2026-02-09
