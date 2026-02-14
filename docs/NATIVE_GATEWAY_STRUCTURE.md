# Native Gateway Structure - Making It Actually Work

**Date:** 2026-02-10  
**Purpose:** Complete guide to building Zaki Platform with native OpenClaw gateway

---

## 🎯 Core Principle: Gateway = OpenClaw

**We don't build a gateway. We configure OpenClaw.**

The gateway IS OpenClaw running in gateway mode. Our job is to:
1. ✅ Configure it properly per user
2. ✅ Start it in a container
3. ✅ Connect frontends to it
4. ❌ NOT build custom routing
5. ❌ NOT reinvent the wheel

---

## 🏗️ The Structure We're Building

```
┌─────────────────────────────────────────────────────────────┐
│                    Zaki Platform                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Options:                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Custom      │  │  LibreChat   │  │  Native UI   │     │
│  │  Dashboard   │  │  Fork        │  │  (Built-in) │     │
│  │  (React)     │  │  (Recommended)│  │             │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  API Server     │                       │
│                   │  (Express)      │                       │
│                   │  - Auth         │                       │
│                   │  - Instance Mgmt│                       │
│                   └────────┬────────┘                       │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │ Instance Manager│                       │
│                   │ - Create        │                       │
│                   │ - Start/Stop    │                       │
│                   │ - Monitor       │                       │
│                   └────────┬────────┘                       │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         │                  │                  │             │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐     │
│  │ User 1      │  │ User 2       │  │ User N       │     │
│  │ Container   │  │ Container    │  │ Container    │     │
│  │             │  │              │  │              │     │
│  │ OpenClaw    │  │ OpenClaw     │  │ OpenClaw     │     │
│  │ Gateway     │  │ Gateway      │  │ Gateway      │     │
│  │ Port 19001  │  │ Port 19002  │  │ Port 1900N  │     │
│  │             │  │              │  │              │     │
│  │ Bot Token   │  │ Bot Token    │  │ Bot Token    │     │
│  │ (User Owned)│  │ (User Owned) │  │ (User Owned) │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 How Frontends Connect

### Option 1: Custom Dashboard (Our Build)

**Direct connection to gateway:**

```typescript
// Each user's dashboard connects to THEIR gateway
const userGatewayUrl = `http://localhost:${userInstance.port}`;
const userGatewayToken = userInstance.gatewayToken;

// HTTP API
const response = await fetch(`${userGatewayUrl}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userGatewayToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openclaw',
    messages: [{ role: 'user', content: message }]
  })
});

// WebSocket
const ws = new WebSocket(
  `ws://localhost:${userInstance.port}/ws?token=${userGatewayToken}`
);
```

**Pros:**
- ✅ Full control
- ✅ Multi-tenant aware
- ✅ Custom features

**Cons:**
- ❌ More development

### Option 2: LibreChat Fork (Recommended for Quick Start)

**From:** `kokayicobb/openclaw-frontend-librechat`

**How it works:**
1. LibreChat connects to OpenClaw gateway
2. Uses OpenAI-compatible `/v1/chat/completions` endpoint
3. OpenClaw proxy (`openclaw-proxy/proxy.py`) handles tool streaming
4. Beautiful chat UI out of the box

**Setup:**
```yaml
# librechat.yaml
endpoints:
  - name: OpenClaw
    apiKey: ${OPENCLAW_GATEWAY_TOKEN}
    baseURL: http://openclaw-gateway:18789
    models:
      - openclaw
```

**Proxy for tool streaming:**
```python
# openclaw-proxy/proxy.py
# Watches OpenClaw logs for tool events
# Streams :::thinking blocks to LibreChat
# Handles retries and gateway restarts
```

**Integration with Zaki:**
```typescript
// For each user, we can:
// 1. Run LibreChat container pointing to their gateway
// 2. Or embed LibreChat in our dashboard
// 3. Or use LibreChat as inspiration for our UI

// Option: Run LibreChat per user
const librechatContainer = await docker.createContainer({
  Image: 'librechat:openclaw',
  name: `librechat-user-${userId}`,
  Env: [
    `OPENCLAW_BASE_URL=http://zaki-user-${userId}:18789`,
    `OPENCLAW_GATEWAY_TOKEN=${gatewayToken}`
  ],
  // ... other config
});
```

**Pros:**
- ✅ Beautiful UI
- ✅ Tool streaming
- ✅ Multi-model support
- ✅ Can customize

**Cons:**
- ❌ More complex setup
- ❌ Need to maintain fork

### Option 3: Native OpenClaw Control UI

**Built-in at:** `http://gateway:18789/`

**Just point users to their gateway URL:**
```typescript
const dashboardUrl = `http://localhost:${userInstance.port}`;
// User opens in browser, authenticates with token
```

**Pros:**
- ✅ Works out of the box
- ✅ Full feature set
- ✅ No custom code

**Cons:**
- ❌ Can't customize
- ❌ Not multi-tenant aware

---

## 📦 Container Structure (Native)

### Dockerfile

```dockerfile
FROM alpine/openclaw:latest

# User data mounted as volumes
VOLUME ["/home/node/.openclaw", "/home/node/workspace"]

# Expose gateway port
EXPOSE 18789

# Start gateway (native OpenClaw command)
CMD ["openclaw", "gateway", "--port", "18789", "--verbose", "--bind", "lan"]
```

### Container Creation

```typescript
const container = await docker.createContainer({
  Image: 'alpine/openclaw:latest',
  name: `zaki-user-${userId}`,
  ExposedPorts: { '18789/tcp': {} },
  HostConfig: {
    Memory: 2 * 1024 * 1024 * 1024, // 2GB
    PortBindings: {
      '18789/tcp': [{ HostPort: String(port) }] // e.g., 19001
    },
    Binds: [
      // OpenClaw config
      `${userDataDir}/.openclaw:/home/node/.openclaw:rw`,
      // Workspace
      `${userDataDir}/workspace:/home/node/workspace:rw`
    ],
    RestartPolicy: { Name: 'unless-stopped' }
  },
  Env: [
    'NODE_OPTIONS=--max-old-space-size=1024',
    'OPENCLAW_CONFIG_DIR=/home/node/.openclaw'
  ]
});
```

---

## ⚙️ OpenClaw Config (Native Format)

### Config File Location
```
/home/node/.openclaw/openclaw.json
```

### Config Structure

```json
{
  "gateway": {
    "port": 18789,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "generated-secure-token"
    },
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true },
        "tools": { "enabled": true }
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "user-provided-bot-token"
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "agent": {
    "workspace": "/home/node/workspace"
  },
  "models": {
    "mode": "merge",
    "providers": {
      "anthropic": {
        "apiKey": "shared-or-user-api-key",
        "models": [
          { "id": "claude-opus-4-5", "name": "Claude Opus 4.5" }
        ]
      }
    }
  }
}
```

**This is the native OpenClaw config.** We generate it, OpenClaw reads it.

---

## 🔌 Gateway Endpoints

### HTTP Endpoints

**1. Chat Completions (OpenAI-compatible)**
```
POST http://gateway:18789/v1/chat/completions
Authorization: Bearer {gateway-token}
Content-Type: application/json

{
  "model": "openclaw",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "stream": false
}
```

**2. Tools Invocation**
```
POST http://gateway:18789/tools/invoke
Authorization: Bearer {gateway-token}
Content-Type: application/json

{
  "tool": "sessions_list",
  "args": { "limit": 100 },
  "sessionKey": "main"
}
```

**3. Health Check**
```
GET http://gateway:18789/health
Authorization: Bearer {gateway-token}
```

### WebSocket

**Connection:**
```
ws://gateway:18789/ws?token={gateway-token}
```

**RPC Protocol:**
```json
// Request
{
  "type": "req",
  "id": "request-id",
  "method": "chat.send",
  "params": {
    "sessionKey": "main",
    "message": "Hello"
  }
}

// Response
{
  "type": "res",
  "id": "request-id",
  "ok": true,
  "payload": { ... }
}

// Events
{
  "type": "event",
  "event": "session.created",
  "payload": { ... }
}
```

---

## 🚀 Implementation Steps

### Step 1: Instance Creation

```typescript
async function createUserInstance(userId: string, botToken: string) {
  // 1. Generate port
  const port = await getNextAvailablePort();
  
  // 2. Create directories
  const userDataDir = `/var/zaki-platform/users/user-${userId}`;
  await fs.mkdir(`${userDataDir}/.openclaw`, { recursive: true });
  await fs.mkdir(`${userDataDir}/workspace`, { recursive: true });
  
  // 3. Generate OpenClaw config
  const gatewayToken = generateSecureToken();
  const config = generateOpenClawConfig({
    userId,
    botToken,
    model: 'anthropic/claude-opus-4-5',
    workspace: '/home/node/workspace'
  });
  
  await fs.writeFile(
    `${userDataDir}/.openclaw/openclaw.json`,
    JSON.stringify(config, null, 2)
  );
  
  // 4. Create workspace files
  await createWorkspaceFiles(userId, userDataDir);
  
  // 5. Create and start container
  const container = await createContainer(userId, port, userDataDir);
  await container.start();
  
  // 6. Wait for gateway ready
  await waitForGatewayReady(port, gatewayToken);
  
  // 7. Save to database
  return await saveInstance(userId, port, botToken, gatewayToken);
}
```

### Step 2: Frontend Connection

**Custom Dashboard:**
```typescript
// Get user's instance
const instance = await getInstance(userId);

// Connect to their gateway
const gatewayUrl = `http://localhost:${instance.port}`;
const gatewayToken = instance.gatewayToken;

// Use in API calls
const api = createGatewayAPI(gatewayUrl, gatewayToken);
```

**LibreChat:**
```typescript
// Run LibreChat container pointing to user's gateway
const librechat = await docker.createContainer({
  Image: 'librechat:openclaw',
  name: `librechat-user-${userId}`,
  Env: [
    `OPENCLAW_BASE_URL=http://zaki-user-${userId}:18789`,
    `OPENCLAW_GATEWAY_TOKEN=${gatewayToken}`
  ]
});
```

---

## ✅ Key Takeaways

1. **Gateway = OpenClaw** - We configure, not build
2. **Native config** - Use OpenClaw's config format
3. **Direct connection** - Frontends connect directly
4. **No routing** - OpenClaw handles everything
5. **LibreChat option** - Can use fork for quick UI
6. **Custom dashboard** - Build our own for full control

---

## 🎯 Recommended Approach

**Phase 1: Get Gateway Working**
1. ✅ Create containers with OpenClaw
2. ✅ Generate native configs
3. ✅ Start gateways
4. ✅ Test with native Control UI

**Phase 2: Add Frontend**
1. ✅ Option A: Use LibreChat fork (quick)
2. ✅ Option B: Build custom dashboard (full control)
3. ✅ Both connect directly to gateway

**Phase 3: Polish**
1. ✅ Health monitoring
2. ✅ Error handling
3. ✅ Auto-restart
4. ✅ Logging

---

**Status:** Native gateway structure complete. Ready to build! 🦞
