# Commands to Run - Copy & Paste

**Date:** 2026-02-03  
**Purpose:** Commands for you to run in your terminal

---

## 🔧 Option 1: Set Up CLI with OAuth Token

### Step 1: Add Claude CLI to PATH
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Step 2: Run CLI Setup (Interactive)
```bash
claude setup-token
```
- This will open a browser
- Follow the OAuth flow
- Copy the callback URL when it appears
- Paste it back when prompted

### Step 3: Test CLI
```bash
claude 'hello'
```

---

## 🔧 Option 2: Use API Key (Recommended for Gateway)

### Step 1: Get API Key
1. Go to: https://console.anthropic.com/
2. Click "API Keys"
3. Create new key
4. Copy it (starts with `sk-ant-api03-...`)

### Step 2: Update OpenClaw Config
```bash
bash /root/zaki-platform/scripts/update-anthropic-token.sh YOUR_API_KEY_HERE
```
Replace `YOUR_API_KEY_HERE` with your actual API key.

### Step 3: Restart Gateway
```bash
systemctl --user restart openclaw-gateway
```

### Step 4: Test Gateway
```bash
# Check gateway status
openclaw gateway status

# Test via Telegram bot
# Send a message to your bot
```

---

## 🔧 Option 3: Update Existing OAuth Token

If you already have an OAuth token (like the one you just provided):

### Step 1: Update Config
```bash
bash /root/zaki-platform/scripts/update-anthropic-token.sh sk-ant-oat01-YOUR_TOKEN_HERE
```

### Step 2: Restart Gateway
```bash
systemctl --user restart openclaw-gateway
```

### Step 3: Test
```bash
# Test CLI (if you set it up)
export PATH="$HOME/.local/bin:$PATH"
claude 'hello'

# Test Gateway via Telegram bot
```

---

## 📋 Quick Status Check

### Check Gateway Status
```bash
openclaw gateway status
```

### Check Token in Config
```bash
jq -r '.auth.profiles."anthropic:alaa".token' ~/.openclaw/openclaw.json | head -c 30
```

### Check Gateway Logs
```bash
journalctl --user -u openclaw-gateway -n 50 --no-pager
```

### Test CLI
```bash
export PATH="$HOME/.local/bin:$PATH"
claude 'hello'
```

---

## 🎯 Recommended: Use API Key

**For Gateway to work properly, use API key:**

```bash
# 1. Get API key from https://console.anthropic.com/
# 2. Update config
bash /root/zaki-platform/scripts/update-anthropic-token.sh YOUR_API_KEY

# 3. Restart
systemctl --user restart openclaw-gateway

# 4. Test
openclaw gateway status
```

---

**Copy and paste these commands into your terminal!**
