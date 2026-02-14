# Gateway Implementation Guide - Making It Actually Work

**Date:** 2026-02-10  
**Purpose:** Native OpenClaw gateway setup and integration guide

---

## 🎯 Core Principle: Stay Native

**The gateway IS OpenClaw.** We don't build a custom gateway. We:
1. Configure OpenClaw gateway per user
2. Let OpenClaw handle everything natively
3. Connect frontends to the gateway
4. No routing layer needed

---

## 🏗️ Gateway Architecture

### How OpenClaw Gateway Works

```
┌─────────────────────────────────────────────────┐
│         OpenClaw Gateway (Port 18789)          │
├─────────────────────────────────────────────────┤
│                                                  │
│  HTTP Endpoints:                                 │
│  - /v1/chat/completions (OpenAI-compatible)    │
│  - /health                                       │
│  - /tools/invoke                                 │
│                                                  │
│  WebSocket:                                      │
│  - ws://gateway:18789/ws                        │
│  - RPC protocol                                  │
│  - Real-time events                              │
│                                                  │
│  Control UI:                                     │
│  - http://gateway:18789/                         │
│  - Built-in dashboard                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Gateway Components

**1. HTTP Server** (`server-http.ts`)
- OpenAI-compatible `/v1/chat/completions`
- Health checks
- Tool invocation
- File uploads

**2. WebSocket Server** (`server-ws-runtime.ts`)
- RPC protocol
- Real-time events
- Device pairing
- Session management

**3. Control UI** (`control-ui.ts`)
- Built-in dashboard
- Configuration
- Session browser
- Channel management

---

## 📦 Container Setup (Native)

### Docker Container Structure

```dockerfile
FROM alpine/openclaw:latest

# User data mounted as volumes
VOLUME ["/home/node/.openclaw", "/home/node/workspace"]

# Expose gateway port
EXPOSE 18789

# Start gateway (native OpenClaw command)
CMD ["openclaw", "gateway", "--port", "18789", "--verbose", "--bind", "lan"]
```

### Container Configuration

```typescript
// Instance Manager creates this
const containerConfig = {
  Image: 'alpine/openclaw:latest',
  name: `zaki-user-${userId}`,
  ExposedPorts: { '18789/tcp': {} },
  HostConfig: {
    Memory: 2 * 1024 * 1024 * 1024, // 2GB
    PortBindings: {
      '18789/tcp': [{ HostPort: String(port) }] // e.g., 19001
    },
    Binds: [
      // OpenClaw config and data
      `${userDataDir}/.openclaw:/home/node/.openclaw:rw`,
      // Workspace (SOUL.md, MEMORY.md, etc.)
      `${userDataDir}/workspace:/home/node/workspace:rw`
    ],
    RestartPolicy: { Name: 'unless-stopped' }
  },
  Env: [
    'NODE_OPTIONS=--max-old-space-size=1024',
    'OPENCLAW_CONFIG_DIR=/home/node/.openclaw'
  ]
};
```

---

## ⚙️ OpenClaw Config Generation

### Native Config Structure

```typescript
// Generate native OpenClaw config
function generateOpenClawConfig(params: {
  userId: string;
  botToken: string;
  model: string;
  workspace: string;
}): OpenClawConfig {
  // Generate secure gateway token
  const gatewayToken = generateSecureToken();
  
  return {
    // Gateway configuration
    gateway: {
      port: 18789,
      bind: "lan", // Allow LAN access
      auth: {
        mode: "token",
        token: gatewayToken
      },
      http: {
        endpoints: {
          chatCompletions: { enabled: true },
          tools: { enabled: true }
        }
      }
    },
    
    // Telegram channel (user's own bot)
    channels: {
      telegram: {
        enabled: true,
        botToken: params.botToken // User-owned token
      }
    },
    
    // Agent configuration
    agents: {
      defaults: {
        model: {
          primary: params.model // e.g., "anthropic/claude-opus-4-5"
        }
      }
    },
    
    // Workspace location
    agent: {
      workspace: params.workspace // /home/node/workspace
    },
    
    // Models configuration
    models: {
      mode: "merge",
      providers: {
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY, // Shared or user's own
          models: [
            { id: "claude-opus-4-5", name: "Claude Opus 4.5" }
          ]
        }
      }
    },
    
    // Logging
    logging: {
      level: "info",
      file: "/tmp/openclaw/openclaw.log"
    }
  };
}
```

### Config File Location

```
/home/node/.openclaw/openclaw.json
```

**This is the native OpenClaw config file.** OpenClaw reads this automatically.

---

## 🔌 Gateway Connection Patterns

### 1. HTTP API (OpenAI-Compatible)

**Endpoint:** `POST http://gateway:18789/v1/chat/completions`

```typescript
async function sendMessage(
  gatewayUrl: string,
  token: string,
  message: string
) {
  const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: 'openclaw', // Always use 'openclaw' model
      messages: [
        { role: 'user', content: message }
      ],
      stream: false
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 2. WebSocket RPC

**Connection:** `ws://gateway:18789/ws?token={token}`

```typescript
// From OpenClaw UI gateway.ts
class GatewayBrowserClient {
  constructor(opts: {
    url: string; // ws://gateway:18789/ws
    token: string;
    onEvent?: (evt: GatewayEventFrame) => void;
  }) {}
  
  // Send RPC call
  async call(method: string, params: any) {
    const id = generateId();
    this.ws.send(JSON.stringify({
      type: 'req',
      id,
      method,
      params
    }));
    
    // Wait for response
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
}

// Usage
const client = new GatewayBrowserClient({
  url: 'ws://gateway:18789/ws',
  token: gatewayToken
});

await client.call('chat.send', {
  sessionKey: 'main',
  message: 'Hello'
});
```

### 3. Tools Invocation

**Endpoint:** `POST http://gateway:18789/tools/invoke`

```typescript
async function invokeTool(
  gatewayUrl: string,
  token: string,
  tool: string,
  args: any
) {
  const response = await fetch(`${gatewayUrl}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tool,
      args,
      sessionKey: 'main'
    })
  });
  
  const data = await response.json();
  return data.result;
}

// Examples
const sessions = await invokeTool(gatewayUrl, token, 'sessions_list', {
  limit: 100
});

const channels = await invokeTool(gatewayUrl, token, 'channels_list', {});
```

---

## 🎨 Frontend Integration Options

### Option 1: Native OpenClaw Control UI

**Built-in dashboard at:** `http://gateway:18789/`

**Features:**
- Chat interface
- Session management
- Channel status
- Configuration
- Agent management

**Usage:**
```typescript
// Just point users to their gateway URL
const dashboardUrl = `http://localhost:${port}`;
// User opens in browser, authenticates with token
```

**Pros:**
- ✅ Native, works out of the box
- ✅ Full feature set
- ✅ No custom code needed

**Cons:**
- ❌ Can't customize much
- ❌ Not multi-tenant aware

### Option 2: LibreChat Fork (Recommended)

**From:** `kokayicobb/openclaw-frontend-librechat`

**How it works:**
1. LibreChat connects to OpenClaw gateway
2. Uses OpenAI-compatible API
3. OpenClaw proxy handles tool streaming
4. Beautiful chat UI

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
# Streams to LibreChat client
```

**Pros:**
- ✅ Beautiful UI
- ✅ Multi-model support
- ✅ Tool streaming
- ✅ Can customize

**Cons:**
- ❌ More complex setup
- ❌ Need to maintain fork

### Option 3: Custom Dashboard (Our Approach)

**Build our own dashboard:**
- React + Vite
- Connect to gateway via HTTP + WebSocket
- Widget-based architecture
- Multi-tenant aware

**Implementation:**
```typescript
// lib/api.ts
const GATEWAY_URL = `http://localhost:${userPort}`;
const GATEWAY_TOKEN = userGatewayToken;

// HTTP API
export const api = {
  chat: {
    send: (message: string) => 
      fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openclaw',
          messages: [{ role: 'user', content: message }]
        })
      })
  },
  
  tools: {
    invoke: (tool: string, args: any) =>
      fetch(`${GATEWAY_URL}/tools/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tool, args, sessionKey: 'main' })
      })
  }
};

// WebSocket
export const ws = new WebSocket(
  `ws://localhost:${userPort}/ws?token=${GATEWAY_TOKEN}`
);
```

**Pros:**
- ✅ Full control
- ✅ Multi-tenant aware
- ✅ Custom features
- ✅ Branded experience

**Cons:**
- ❌ More development
- ❌ Need to build everything

---

## 🚀 Instance Manager Implementation

### Creating an Instance

```typescript
class InstanceManager {
  async createInstance(userId: string, botToken: string): Promise<Instance> {
    // 1. Generate unique port
    const port = await this.getNextAvailablePort();
    
    // 2. Create data directories
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
    await this.createWorkspaceFiles(userId, userDataDir);
    
    // 5. Create Docker container
    const container = await docker.createContainer({
      Image: 'alpine/openclaw:latest',
      name: `zaki-user-${userId}`,
      ExposedPorts: { '18789/tcp': {} },
      HostConfig: {
        Memory: 2 * 1024 * 1024 * 1024,
        PortBindings: {
          '18789/tcp': [{ HostPort: String(port) }]
        },
        Binds: [
          `${userDataDir}/.openclaw:/home/node/.openclaw:rw`,
          `${userDataDir}/workspace:/home/node/workspace:rw`
        ],
        RestartPolicy: { Name: 'unless-stopped' }
      },
      Env: [
        'NODE_OPTIONS=--max-old-space-size=1024',
        'OPENCLAW_CONFIG_DIR=/home/node/.openclaw'
      ]
    });
    
    // 6. Start container
    await container.start();
    
    // 7. Wait for gateway to be ready
    await this.waitForGatewayReady(port, gatewayToken);
    
    // 8. Save to database
    const instance = await db.instances.create({
      userId,
      containerName: `zaki-user-${userId}`,
      port,
      botTokenEncrypted: encrypt(botToken),
      botUsername: await this.getBotUsername(botToken),
      gatewayToken,
      status: 'running'
    });
    
    return instance;
  }
  
  async waitForGatewayReady(port: number, token: string, maxWait = 60000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return;
      } catch (e) {
        // Not ready yet
      }
      await sleep(2000);
    }
    throw new Error('Gateway failed to start');
  }
}
```

---

## 🔍 Gateway Health & Monitoring

### Health Check

```typescript
async function checkGatewayHealth(
  port: number,
  token: string
): Promise<HealthStatus> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return { status: 'unhealthy', error: 'Health check failed' };
    }
    
    const data = await response.json();
    return {
      status: 'healthy',
      gateway: data.gateway,
      channels: data.channels,
      agents: data.agents
    };
  } catch (e) {
    return { status: 'unreachable', error: e.message };
  }
}
```

### Monitoring

```typescript
// Periodic health checks
setInterval(async () => {
  const instances = await db.instances.findMany({ where: { status: 'running' } });
  
  for (const instance of instances) {
    const health = await checkGatewayHealth(instance.port, instance.gatewayToken);
    
    if (health.status !== 'healthy') {
      // Log error
      // Restart container if needed
      await this.restartInstance(instance.id);
    }
  }
}, 60000); // Every minute
```

---

## 🐛 Troubleshooting

### Gateway Won't Start

**Check:**
1. Container logs: `docker logs zaki-user-{userId}`
2. Config file: `cat /var/zaki-platform/users/user-{userId}/.openclaw/openclaw.json`
3. Port availability: `netstat -tuln | grep {port}`
4. Permissions: `ls -la /var/zaki-platform/users/user-{userId}/`

### Gateway Not Responding

**Check:**
1. Container running: `docker ps | grep zaki-user-{userId}`
2. Health endpoint: `curl http://localhost:{port}/health -H "Authorization: Bearer {token}"`
3. Network: `docker network inspect bridge`

### Bot Not Receiving Messages

**Check:**
1. Bot token valid: `curl https://api.telegram.org/bot{token}/getMe`
2. Gateway config: `channels.telegram.enabled === true`
3. Container logs: Look for Telegram connection errors

---

## ✅ Best Practices

1. **Always use native OpenClaw config** - Don't try to customize the structure
2. **Let OpenClaw handle routing** - No custom router needed
3. **Use proper authentication** - Gateway tokens for API, bot tokens for Telegram
4. **Monitor health** - Regular health checks
5. **Handle errors gracefully** - Retry logic, fallbacks
6. **Log everything** - Debugging is easier with logs
7. **Test thoroughly** - Gateway is critical, test all paths

---

## 🎯 Key Takeaways

1. **Gateway = OpenClaw** - We configure it, we don't build it
2. **Native config** - Use OpenClaw's config format
3. **Direct connection** - Frontends connect directly to gateway
4. **No routing layer** - OpenClaw handles everything
5. **Health monitoring** - Essential for reliability

---

**Status:** Gateway implementation guide complete. Ready to build native OpenClaw instances.
