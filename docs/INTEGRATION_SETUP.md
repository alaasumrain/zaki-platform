# Integration Setup - How to Connect Everything

**Date:** 2026-02-03  
**Purpose:** Complete guide to connecting all components

---

## 🎯 What We're Connecting

```
User → Telegram Bot → Workers API → Sandbox → OpenClaw Gateway → Anthropic API
```

---

## 📋 Prerequisites

### 1. Cloudflare Account
- Sign up at: https://dash.cloudflare.com/
- Get API token for Wrangler

### 2. Anthropic API Key
- Go to: https://console.anthropic.com/
- Create API key (starts with `sk-ant-api03-...`)

### 3. Telegram Bot Token
- Message @BotFather on Telegram
- Create bot, get token

### 4. Local Setup
- Node.js 22+
- Docker running
- npm/pnpm installed

---

## 🔧 Step-by-Step Setup

### Step 1: Set Up Anthropic API Key

#### For OpenClaw Gateway (Required)
```bash
# Get API key from https://console.anthropic.com/
# Then update config:
bash /root/zaki-platform/scripts/update-anthropic-token.sh YOUR_API_KEY

# Restart gateway
systemctl --user restart openclaw-gateway

# Verify
openclaw gateway status
```

#### For Claude CLI (Optional)
```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Set up OAuth token (interactive)
claude setup-token

# Test
claude 'hello'
```

---

### Step 2: Set Up Cloudflare Workers

#### Install Wrangler
```bash
npm install -g wrangler
```

#### Login to Cloudflare
```bash
wrangler login
```

#### Set Up Secrets
```bash
# R2 credentials (if using custom R2)
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY

# Gateway token (for OpenClaw)
wrangler secret put GATEWAY_TOKEN

# Anthropic API key (if storing centrally)
wrangler secret put ANTHROPIC_API_KEY
```

#### Create R2 Bucket
```bash
wrangler r2 bucket create zaki-user-storage
```

---

### Step 3: Set Up Telegram Bot

#### Create Bot
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow prompts
4. Copy bot token

#### Add Token to Workers
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

#### Update OpenClaw Config
```bash
# Edit config or use script
# Add Telegram bot token to OpenClaw config
```

---

### Step 4: Build and Deploy

#### Install Dependencies
```bash
cd /root/zaki-platform
npm install
```

#### Build Docker Image
```bash
# Docker must be running
docker build -t zaki-platform .
```

#### Deploy Workers
```bash
wrangler deploy
```

#### Verify Deployment
```bash
# Check deployment
wrangler deployments list

# Test endpoint
curl https://your-worker.your-subdomain.workers.dev/health
```

---

### Step 5: Connect Telegram Bot to Gateway

#### Pair Bot with Gateway
```bash
# Start gateway (if not running)
systemctl --user start openclaw-gateway

# Approve pairing
openclaw pairing approve telegram YOUR_PAIRING_CODE
```

#### Test Bot
```bash
# Send message to bot on Telegram
# Should get response from Gateway
```

---

## 🔗 Connection Flow

### 1. User Sends Message
```
Telegram → Bot receives message
```

### 2. Bot Routes to Workers API
```
Bot → POST https://your-worker.workers.dev/api/chat
     Headers: X-User-Id: <userId>
     Body: { message: "..." }
```

### 3. Workers API Routes to Sandbox
```
Workers → Get user's Sandbox
        → Ensure Gateway running
        → Proxy to Gateway
```

### 4. Gateway Processes Message
```
Gateway → Calls Anthropic API
       → Gets response
       → Returns to Workers
```

### 5. Response Returns to User
```
Workers → Bot → Telegram → User
```

---

## 🧪 Testing Each Component

### Test 1: Gateway Health
```bash
curl http://localhost:18789/health
# Should return: {"status":"ok"}
```

### Test 2: Workers API
```bash
curl https://your-worker.workers.dev/health
# Should return: {"status":"ok","service":"zaki-platform"}
```

### Test 3: Sandbox Creation
```bash
curl -X POST https://your-worker.workers.dev/api/sandbox/test-user/init
# Should create Sandbox for test-user
```

### Test 4: End-to-End
```bash
# Send message via Telegram bot
# Should get response from Gateway
```

---

## 🔧 Configuration Files

### OpenClaw Config (`~/.openclaw/openclaw.json`)
```json
{
  "auth": {
    "profiles": {
      "anthropic:alaa": {
        "token": "sk-ant-api03-YOUR_KEY"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "token": "YOUR_GATEWAY_TOKEN"
  }
}
```

### Workers Config (`wrangler.toml`)
```toml
name = "zaki-platform"
main = "src/index.ts"

[[containers]]
class_name = "Sandbox"
image = "./Dockerfile"

[[r2_buckets]]
binding = "UserStorage"
bucket_name = "zaki-user-storage"
```

### Environment Variables
```bash
# Local development (.dev.vars)
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
GATEWAY_TOKEN=your_token
TELEGRAM_BOT_TOKEN=your_bot_token
```

---

## 🚨 Troubleshooting

### Gateway Not Starting
```bash
# Check logs
journalctl --user -u openclaw-gateway -n 50

# Check API key
jq -r '.auth.profiles."anthropic:alaa".token' ~/.openclaw/openclaw.json

# Restart
systemctl --user restart openclaw-gateway
```

### Workers Deployment Fails
```bash
# Check Docker is running
docker info

# Check wrangler.toml
cat wrangler.toml

# Check secrets
wrangler secret list
```

### Bot Not Responding
```bash
# Check Gateway status
openclaw gateway status

# Check pairing
openclaw pairing list

# Check logs
journalctl --user -u openclaw-gateway -n 100
```

---

## 📊 Verification Checklist

- [ ] Anthropic API key configured
- [ ] Gateway running and healthy
- [ ] Workers deployed successfully
- [ ] R2 bucket created
- [ ] Telegram bot token set
- [ ] Bot paired with Gateway
- [ ] End-to-end test works

---

## 🎯 Quick Start Commands

```bash
# 1. Set API key
bash /root/zaki-platform/scripts/update-anthropic-token.sh YOUR_API_KEY
systemctl --user restart openclaw-gateway

# 2. Deploy Workers
cd /root/zaki-platform
wrangler deploy

# 3. Test
curl https://your-worker.workers.dev/health
```

---

**Status:** Ready to connect everything! 🔗
