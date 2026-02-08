# Error Handling in Cloudflare Workers + Sandboxes

**Date:** 2026-02-03  
**Question:** How do we handle errors when running on Cloudflare?

---

## 🎯 Overview

**Short Answer:** Cloudflare handles infrastructure errors, but **we need to handle application errors**.

---

## ✅ What Cloudflare Handles Automatically

### 1. Infrastructure Errors
- **Network failures:** Cloudflare retries automatically
- **Worker crashes:** Cloudflare restarts Workers
- **Sandbox crashes:** Cloudflare restarts Sandboxes
- **Timeout handling:** Cloudflare has built-in timeouts
- **Rate limiting:** Cloudflare enforces rate limits

### 2. Platform Errors
- **Out of memory:** Cloudflare kills and restarts
- **CPU limits:** Cloudflare throttles
- **Storage limits:** Cloudflare blocks writes
- **Concurrent limits:** Cloudflare queues requests

**We don't need to handle these!** Cloudflare does it automatically.

---

## ❌ What We Need to Handle

### 1. Application Errors
- **API errors** (like HTTP 500 from Anthropic)
- **Invalid user input**
- **Missing API keys**
- **Sandbox not ready** (cold start)
- **Gateway not responding**
- **Invalid responses**

### 2. Business Logic Errors
- **User over limit** (free tier)
- **Invalid authentication**
- **Missing user data**
- **Sandbox initialization failures**

**We need to handle these ourselves!**

---

## 🏗️ Error Handling Architecture

### Our Stack
```
User → Telegram Bot → Workers API → Sandbox → OpenClaw Gateway → Anthropic API
                                                                    ↓
                                                              (HTTP 500 error)
```

### Error Flow
1. **Anthropic API fails** (HTTP 500)
2. **OpenClaw Gateway** catches error
3. **Sandbox** propagates error
4. **Workers API** catches error
5. **Telegram Bot** shows error to user

---

## 🔧 Implementation Strategy

### 1. Workers API Error Handling

```typescript
// src/index.ts
app.all('/api/*', async (c) => {
  try {
    const userId = getUserId(c);
    const sandbox = await getSandbox(c.env, userId);
    
    // Ensure Gateway is running
    await ensureGateway(sandbox, c.env);
    
    // Proxy request to Gateway
    const response = await sandbox.containerFetch(...);
    
    // Check for errors
    if (!response.ok) {
      return handleGatewayError(response, c);
    }
    
    return response;
    
  } catch (error) {
    return handleError(error, c);
  }
});

function handleError(error: Error, c: Context) {
  // Log error
  console.error('API Error:', error);
  
  // Return user-friendly message
  if (error.message.includes('API key')) {
    return c.json({ 
      error: 'Authentication error',
      message: 'Please check your API key configuration'
    }, 401);
  }
  
  if (error.message.includes('timeout')) {
    return c.json({ 
      error: 'Request timeout',
      message: 'The service is taking longer than expected. Please try again.'
    }, 504);
  }
  
  // Generic error
  return c.json({ 
    error: 'Internal error',
    message: 'Something went wrong. Please try again later.'
  }, 500);
}
```

---

### 2. Sandbox Error Handling

```typescript
// src/sandbox/openclaw.ts
export async function sendToOpenClaw(
  sandbox: Sandbox,
  message: string,
  env: Env
): Promise<Response> {
  try {
    // Check if Gateway is running
    const status = await getOpenClawStatus(sandbox);
    if (!status.running) {
      throw new Error('Gateway not running');
    }
    
    // Send message
    const response = await sandbox.containerFetch(
      `http://localhost:${GATEWAY_PORT}/api/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    );
    
    // Handle Gateway errors
    if (!response.ok) {
      const error = await response.json();
      throw new GatewayError(error.message, response.status);
    }
    
    return response;
    
  } catch (error) {
    // Handle different error types
    if (error instanceof GatewayError) {
      // Gateway-specific error
      throw error;
    }
    
    if (error.message.includes('timeout')) {
      throw new Error('Gateway timeout - please try again');
    }
    
    // Generic error
    throw new Error('Failed to communicate with Gateway');
  }
}
```

---

### 3. Gateway Error Handling

**OpenClaw Gateway handles errors automatically:**
- **API errors:** Returns error response
- **Rate limits:** Queues requests
- **Timeouts:** Returns timeout error
- **Invalid requests:** Returns validation error

**We just need to check response status!**

---

## 🛡️ Error Types & Handling

### 1. API Errors (HTTP 500, 401, etc.)

**Example:** Anthropic API returns HTTP 500

**Handling:**
```typescript
if (response.status === 500) {
  // Log error
  console.error('Anthropic API error:', await response.text());
  
  // Return user-friendly message
  return c.json({
    error: 'AI service error',
    message: 'The AI service is temporarily unavailable. Please try again in a moment.'
  }, 503);
}
```

**Cloudflare:** Doesn't handle this - we need to!

---

### 2. Timeout Errors

**Example:** Gateway takes too long to respond

**Handling:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await sandbox.containerFetch(url, {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    return c.json({
      error: 'Timeout',
      message: 'Request took too long. Please try again.'
    }, 504);
  }
}
```

**Cloudflare:** Has default timeouts, but we should set our own!

---

### 3. Sandbox Not Ready (Cold Start)

**Example:** Sandbox is starting up (1-2 min)

**Handling:**
```typescript
async function ensureGateway(sandbox: Sandbox, env: Env) {
  const status = await getOpenClawStatus(sandbox);
  
  if (!status.running) {
    // Start Gateway
    await startOpenClawGateway(sandbox, env);
    
    // Wait for Gateway to be ready
    await waitForGateway(sandbox, 120000); // 2 min max
  }
}

async function waitForGateway(sandbox: Sandbox, timeout: number) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const status = await getOpenClawStatus(sandbox);
    if (status.running) {
      return;
    }
    await sleep(2000); // Check every 2 seconds
  }
  
  throw new Error('Gateway failed to start within timeout');
}
```

**Cloudflare:** Doesn't handle this - we need to wait!

---

### 4. Missing API Key

**Example:** User hasn't configured API key

**Handling:**
```typescript
async function checkApiKey(userId: string, env: Env) {
  const userData = await getUserData(userId, env);
  
  if (!userData.apiKey) {
    throw new Error('API key not configured');
  }
  
  return userData.apiKey;
}

// In handler
try {
  const apiKey = await checkApiKey(userId, env);
} catch (error) {
  return c.json({
    error: 'Configuration required',
    message: 'Please configure your API key first.',
    action: 'setup_api_key'
  }, 400);
}
```

**Cloudflare:** Doesn't handle this - we need to check!

---

### 5. Rate Limiting

**Example:** User exceeds free tier limit

**Handling:**
```typescript
async function checkRateLimit(userId: string, env: Env) {
  const userData = await getUserData(userId, env);
  
  if (userData.tier === 'free') {
    if (userData.messageCount >= 100) {
      throw new RateLimitError('Free tier limit reached');
    }
  }
}

// In handler
try {
  await checkRateLimit(userId, env);
} catch (error) {
  if (error instanceof RateLimitError) {
    return c.json({
      error: 'Rate limit exceeded',
      message: 'You\'ve reached your free tier limit. Upgrade to Pro for unlimited messages.',
      upgradeUrl: '/upgrade'
    }, 429);
  }
}
```

**Cloudflare:** Has platform rate limits, but we need business logic limits!

---

## 📊 Error Handling Best Practices

### 1. Always Use Try-Catch
```typescript
try {
  // Risky operation
} catch (error) {
  // Handle error
}
```

### 2. Log Errors
```typescript
console.error('Error:', error);
// Or use Cloudflare's logging
c.env.LOGS.write(JSON.stringify({ error: error.message }));
```

### 3. Return User-Friendly Messages
```typescript
// Don't expose internal errors
return c.json({
  error: 'Something went wrong',
  message: 'Please try again later'
}, 500);
```

### 4. Set Timeouts
```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);
```

### 5. Retry Logic
```typescript
async function retry(fn: () => Promise<Response>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

## 🔍 Monitoring & Debugging

### Cloudflare Analytics
- **Workers Analytics:** See request counts, errors
- **Logs:** View error logs in dashboard
- **Alerts:** Set up alerts for high error rates

### Our Logging
```typescript
// Log errors with context
console.error('API Error:', {
  userId,
  endpoint,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

---

## 🎯 Summary

### Cloudflare Handles:
- ✅ Infrastructure failures
- ✅ Worker crashes
- ✅ Sandbox crashes
- ✅ Platform limits
- ✅ Network issues

### We Need to Handle:
- ❌ API errors (HTTP 500, 401, etc.)
- ❌ Application errors
- ❌ Business logic errors
- ❌ Timeouts
- ❌ Cold starts
- ❌ Rate limiting (business logic)

---

## 🚀 Implementation Plan

### Phase 1: Basic Error Handling
1. Add try-catch to all API endpoints
2. Return user-friendly error messages
3. Log errors

### Phase 2: Advanced Error Handling
1. Add retry logic
2. Handle timeouts
3. Handle cold starts
4. Add rate limiting

### Phase 3: Monitoring
1. Set up Cloudflare Analytics
2. Add error tracking
3. Set up alerts

---

**Status:** Need to implement error handling! 🛡️
