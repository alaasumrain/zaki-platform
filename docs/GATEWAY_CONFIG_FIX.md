# Gateway Config Fix - Making It Actually Work

**Date:** 2026-02-10  
**Priority:** CRITICAL - Gateway won't work without this

---

## 🚨 Problem Identified

**Current config format in `instance-manager.ts` is WRONG:**

```typescript
// ❌ CURRENT (WRONG)
{
  gateway: {
    port: port,
    mode: "local",  // ❌ Not a valid field
    bind: "lan",
    auth: { token: token },
    api: {  // ❌ Wrong location
      enabled: true,
      openai: { enabled: true, path: "/v1" }
    }
  },
  telegram: {  // ❌ Wrong location - should be channels.telegram
    enabled: true,
    botToken: "..."
  }
}
```

**Native OpenClaw format (CORRECT):**

```typescript
// ✅ NATIVE FORMAT
{
  gateway: {
    port: 18789,
    bind: "lan",
    auth: {
      mode: "token",
      token: "..."
    },
    http: {
      endpoints: {
        chatCompletions: { enabled: true }
      }
    }
  },
  channels: {
    telegram: {
      enabled: true,
      botToken: "..."
    }
  },
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-5"
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      anthropic: {
        apiKey: "...",
        models: [
          { id: "claude-opus-4-5", name: "Claude Opus 4.5" }
        ]
      }
    }
  }
}
```

**Also:**
- ❌ Saving as `clawdbot.json` - Should be `openclaw.json`
- ❌ Wrong model config structure
- ❌ Wrong API provider structure

---

## 🔧 Fix Required

### File: `/root/zaki-platform/src/services/instance-manager.ts`

**Current `createConfig()` method (lines 197-282):**

```typescript
// ❌ WRONG
private async createConfig(...) {
  const config: any = {
    gateway: {
      port: port,
      mode: "local",  // ❌ Remove
      bind: "lan",
      auth: { token: token },  // ❌ Should be { mode: "token", token }
      api: {  // ❌ Wrong
        enabled: true,
        openai: { enabled: true, path: "/v1" }
      }
    },
    telegram: {  // ❌ Should be channels.telegram
      enabled: true,
      botToken: options?.telegramBotToken
    }
  };
  
  // ❌ Wrong model provider structure
  config.aiProviders = {};
  
  // ❌ Saving as clawdbot.json
  await execAsync(`cat > ${configDir}/clawdbot.json << 'EOF'
${JSON.stringify(config, null, 2)}
EOF`);
}
```

**Fixed version:**

```typescript
// ✅ CORRECT
private async createConfig(
  configDir: string,
  workspaceDir: string,
  port: number,
  token: string,
  options?: {
    whisperApiKey?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    googleApiKey?: string;
    telegramBotToken?: string;
  }
): Promise<void> {
  // Generate secure gateway token
  const gatewayToken = token; // Already generated
  
  // Native OpenClaw config format
  const config: any = {
    // Gateway configuration
    gateway: {
      port: port,
      bind: "lan",
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
      telegram: options?.telegramBotToken ? {
        enabled: true,
        botToken: options.telegramBotToken
      } : {
        enabled: false
      }
    },
    
    // Agent configuration
    agents: {
      defaults: {
        workspace: workspaceDir,
        model: {
          primary: "anthropic/claude-opus-4-5" // or user's preferred model
        }
      }
    },
    
    // Models configuration
    models: {
      mode: "merge",
      providers: {}
    },
    
    // Logging
    logging: {
      level: "info",
      file: "/tmp/openclaw/openclaw.log"
    }
  };
  
  // Add model providers
  if (options?.anthropicApiKey) {
    config.models.providers.anthropic = {
      apiKey: options.anthropicApiKey,
      api: "anthropic",
      models: [
        { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
        { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" }
      ]
    };
  }
  
  if (options?.openaiApiKey || options?.whisperApiKey) {
    config.models.providers.openai = {
      apiKey: options.openaiApiKey || options.whisperApiKey,
      api: "openai-completions",
      models: [
        { id: "gpt-4o", name: "GPT-4o" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" }
      ]
    };
  }
  
  if (options?.googleApiKey) {
    config.models.providers.google = {
      apiKey: options.googleApiKey,
      api: "google-completions",
      models: [
        { id: "gemini-pro", name: "Gemini Pro" }
      ]
    };
  }
  
  // Use shared API keys if user didn't provide
  if (!options?.anthropicApiKey && process.env.ANTHROPIC_API_KEY) {
    config.models.providers.anthropic = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      api: "anthropic",
      models: [
        { id: "claude-opus-4-5", name: "Claude Opus 4.5" }
      ]
    };
  }
  
  // Save as openclaw.json (native format)
  await execAsync(`cat > ${configDir}/openclaw.json << 'EOF'
${JSON.stringify(config, null, 2)}
EOF`);
  
  // Also copy to clawdbot.json for backward compatibility (if needed)
  await execAsync(`cp ${configDir}/openclaw.json ${configDir}/clawdbot.json`);
}
```

---

## 🔍 Additional Fixes Needed

### 1. Config File Name

**Current:**
```typescript
// Line 279-281
await execAsync(`cat > ${configDir}/clawdbot.json << 'EOF'
```

**Fix:**
```typescript
// Save as openclaw.json (native)
await execAsync(`cat > ${configDir}/openclaw.json << 'EOF'
```

### 2. Gateway Start Command

**Check `startGateway()` method:**

```typescript
// Should use:
// openclaw gateway --port {port} --verbose --bind lan
// NOT: clawdbot gateway
```

### 3. Environment Variable

**In container:**
```typescript
Env: [
  'NODE_OPTIONS=--max-old-space-size=1024',
  'OPENCLAW_CONFIG_DIR=/home/node/.openclaw'  // ✅ Correct
]
```

---

## ✅ Verification Steps

### 1. Test Config Format

```bash
# After instance creation, check config
cat /var/zaki-platform/users/user-{userId}/.openclaw/openclaw.json

# Should have:
# - gateway.auth.mode: "token"
# - gateway.http.endpoints.chatCompletions.enabled: true
# - channels.telegram.botToken (if provided)
# - models.providers (with API keys)
```

### 2. Test Gateway Startup

```bash
# Check container logs
docker logs zaki-user-{userId}

# Should see:
# - Gateway starting on port 18789
# - No config errors
# - "Gateway ready" message
```

### 3. Test Endpoints

```bash
# Health check
curl http://localhost:{port}/health \
  -H "Authorization: Bearer {token}"

# Chat completions
curl http://localhost:{port}/v1/chat/completions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openclaw",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## 🎯 Implementation Checklist

- [ ] Update `createConfig()` method
  - [ ] Fix gateway config structure
  - [ ] Move telegram to `channels.telegram`
  - [ ] Fix HTTP endpoints config
  - [ ] Fix models providers structure
  - [ ] Change filename to `openclaw.json`
  
- [ ] Test config generation
  - [ ] Create test instance
  - [ ] Verify config file format
  - [ ] Check all fields are correct
  
- [ ] Test gateway startup
  - [ ] Start container
  - [ ] Check logs for errors
  - [ ] Verify gateway is listening
  
- [ ] Test endpoints
  - [ ] Health endpoint
  - [ ] Chat completions
  - [ ] Tools invoke
  - [ ] WebSocket connection

---

## 📝 Key Changes Summary

1. **Config file:** `clawdbot.json` → `openclaw.json`
2. **Telegram:** `telegram` → `channels.telegram`
3. **Gateway auth:** `auth: { token }` → `auth: { mode: "token", token }`
4. **HTTP API:** `api` → `gateway.http.endpoints`
5. **Models:** `aiProviders` → `models.providers`
6. **Model structure:** Use native OpenClaw format

---

**Status:** Fix identified. Ready to implement! 🦞
