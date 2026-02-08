# Clawbot Setup for Zaki Platform

**Date:** 2026-02-03  
**Based on:** Official Clawbot Documentation

---

## 🎯 What We're Building

**Clawbot** = Personal AI Infrastructure (same as OpenClaw/clawdbot)

- **Gateway Service** - Persistent service managing all AI activity
- **AI Model Connection** - Claude, GPT-4, or Ollama
- **Multi-Channel Support** - WhatsApp, Telegram, Discord, etc.
- **System Control** - Can execute commands and automate tasks

---

## ✅ Current Setup Status

### What's Installed:
- ✅ Node.js 22.22.0
- ✅ Clawbot (clawdbot) 2026.1.24-3
- ✅ Config directory: `~/.clawdbot/`
- ✅ Workspace: `/root/clawd`

### What's Configured:
- ✅ Gateway port: 18789
- ✅ Bind mode: lan (network accessible)
- ✅ Config file: `~/.clawdbot/clawdbot.json`

---

## 🔧 Configuration for Zaki Platform

### Current Config Structure

```json
{
  "agents": {
    "defaults": {
      "workspace": "/root/clawd",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan"
  }
}
```

### Recommended Config for Multi-Tenant Use

For Zaki Platform, we want each user's Sandbox to run its own Gateway instance. The config should be per-user in R2 storage.

**Per-User Config Structure:**
```json
{
  "agents": {
    "defaults": {
      "workspace": "/root/clawd",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "auth": {
      "token": "user-specific-token"
    }
  },
  "aiProviders": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "enabled": true
    }
  }
}
```

---

## 🚀 Starting Clawbot Gateway

### Option 1: Using Our Startup Script

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start gateway
bash /root/zaki-platform/scripts/start-openclaw-vm.sh
```

### Option 2: Manual Start

```bash
# Start gateway
clawdbot gateway --port 18789 --verbose --allow-unconfigured --bind lan

# Or with config
clawdbot gateway --config ~/.clawdbot/clawdbot.json
```

### Option 3: Background Service (Recommended)

```bash
# Start in background
nohup clawdbot gateway --port 18789 --verbose --allow-unconfigured --bind lan > /tmp/clawbot-gateway.log 2>&1 &

# Check status
clawdbot gateway status

# View logs
tail -f /tmp/clawbot-gateway.log
```

---

## 🔍 Verification

### Check Gateway Status

```bash
# Check if running
clawdbot gateway status

# Should show: Gateway is running on ws://127.0.0.1:18789
```

### Test Health Endpoint

```bash
curl http://localhost:18789/health
```

### Test WebSocket Connection

```bash
# Test WebSocket (requires wscat or similar)
wscat -c ws://localhost:18789
```

---

## 🔐 Security Considerations

### API Key Management

**Best Practice:** Use environment variables, not config files

```bash
# Set in environment
export ANTHROPIC_API_KEY=sk-ant-...

# Clawbot will read from environment automatically
clawdbot gateway start
```

### Gateway Authentication

For multi-tenant use, each user should have their own token:

```json
{
  "gateway": {
    "auth": {
      "token": "user-specific-secure-token"
    }
  }
}
```

---

## 📡 Channel Setup (Optional for VM)

If you want to test channels on the VM:

### Telegram (Recommended)

```bash
clawbot channel add telegram
# Follow prompts to authenticate
```

### WhatsApp (Use with caution)

```bash
clawbot channel add whatsapp
# Scan QR code with your phone
```

**Note:** For Zaki Platform, channels will be handled by Workers, not directly on VM.

---

## 🧪 Testing System Control

Once Gateway is running, test that it can execute commands:

```bash
# Via API (if configured)
curl -X POST http://localhost:18789/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a test file called hello.txt"}'
```

---

## 🔗 Integration with Zaki Platform

### How It Works:

1. **User sends message** → Workers API receives it
2. **Workers routes to user's Sandbox** → Each Sandbox runs its own Gateway
3. **Gateway processes message** → Uses configured AI model
4. **Response sent back** → Through Workers to user

### Per-User Configuration:

Each user's Sandbox will have:
- Own Gateway instance (port 18789)
- Own config in R2 (`users/{userId}/.clawdbot/clawdbot.json`)
- Own workspace (`/root/clawd` in Sandbox)
- Isolated from other users

---

## 📋 Next Steps

1. **Set API Key:**
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Start Gateway:**
   ```bash
   bash /root/zaki-platform/scripts/start-openclaw-vm.sh
   ```

3. **Verify It Works:**
   ```bash
   curl http://localhost:18789/health
   ```

4. **Test with Zaki Platform:**
   - Deploy Workers
   - Initialize user Sandbox
   - Send test message via API

---

## 🐛 Troubleshooting

### Gateway Won't Start

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port 18789
lsof -ti:18789 | xargs kill -9

# Or use different port
clawdbot gateway --port 18790
```

### API Authentication Failed

**Error:** "API authentication failed"

**Solution:**
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Test API key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Config Not Found

**Error:** "Configuration file not found"

**Solution:**
```bash
# Create config directory
mkdir -p ~/.clawdbot

# Create minimal config
cat > ~/.clawdbot/clawdbot.json << 'EOF'
{
  "gateway": {
    "port": 18789,
    "mode": "local"
  }
}
EOF
```

---

## 📚 Resources

- **Official Docs:** https://docs.clawd.bot
- **GitHub:** https://github.com/steipete/clawbot
- **ClawdHub (Skills):** Browse available skills and automations

---

**Ready to use Clawbot with Zaki Platform!** 🚀
