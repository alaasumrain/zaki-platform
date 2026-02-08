# API Key vs OAuth Token - Why CLI Fails

**Date:** 2026-02-03  
**Issue:** OAuth token doesn't work for Gateway API calls

---

## 🔍 The Problem

**Current Setup:**
- Token: `sk-ant-oat01-...` (OAuth token)
- Gateway: Needs `sk-ant-api03-...` (API key)
- Result: HTTP 500 errors ❌

---

## 💡 Two Types of Tokens

### 1. OAuth Token (`sk-ant-oat01-...`)
**What it's for:**
- Claude Code CLI only
- Interactive CLI commands
- `claude 'hello'` command

**What it CAN'T do:**
- ❌ Direct API calls
- ❌ OpenClaw Gateway
- ❌ Programmatic access

**How to get:**
```bash
claude setup-token
# Opens browser, OAuth flow
```

---

### 2. API Key (`sk-ant-api03-...`)
**What it's for:**
- Direct API calls
- OpenClaw Gateway
- Programmatic access
- Production use

**What it CAN do:**
- ✅ Direct API calls
- ✅ OpenClaw Gateway
- ✅ Programmatic access

**How to get:**
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy key (starts with `sk-ant-api03-...`)

---

## 🎯 Why CLI Fails

**The Confusion:**
- "It's CLI-based, so why does it need API key?"
- "I have OAuth token, why doesn't it work?"

**The Answer:**
- CLI tools (`claude` command) use OAuth token ✅
- **But Gateway needs API key** ❌
- OAuth token ≠ API key!

**Think of it:**
- OAuth token = Personal CLI access
- API key = Programmatic API access
- Gateway = Programmatic → Needs API key!

---

## 🔧 The Fix

### Step 1: Get API Key
1. Go to https://console.anthropic.com/
2. Click "API Keys"
3. Create new key
4. Copy it (starts with `sk-ant-api03-...`)

### Step 2: Update Config
```bash
# Use the update script
bash /root/zaki-platform/scripts/update-anthropic-token.sh sk-ant-api03-YOUR_KEY_HERE

# Or set env var first
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"
bash /root/zaki-platform/scripts/update-anthropic-token.sh
```

### Step 3: Restart Gateway
```bash
systemctl --user restart openclaw-gateway
```

### Step 4: Test
```bash
# Test Gateway
curl http://localhost:18789/health

# Test via Telegram
# Send message to Zaki bot
```

---

## 📊 Comparison

| Feature | OAuth Token | API Key |
|---------|-------------|---------|
| **Starts with** | `sk-ant-oat01-...` | `sk-ant-api03-...` |
| **For CLI** | ✅ Yes | ❌ No |
| **For Gateway** | ❌ No | ✅ Yes |
| **For API calls** | ❌ No | ✅ Yes |
| **How to get** | `claude setup-token` | Anthropic console |
| **Use case** | Personal CLI | Production |

---

## 🚀 Quick Fix

```bash
# 1. Get API key from Anthropic console
# 2. Update config
bash /root/zaki-platform/scripts/update-anthropic-token.sh YOUR_API_KEY

# 3. Restart
systemctl --user restart openclaw-gateway

# 4. Test
claude 'hello'  # Should work now
```

---

## 💡 Summary

**The Problem:**
- OAuth token (`sk-ant-oat01-...`) is set ✅
- But Gateway needs API key (`sk-ant-api03-...`) ❌
- OAuth token doesn't work for API calls!

**The Solution:**
- Get API key from Anthropic console
- Update config with API key
- Restart gateway

**Why CLI Still Needs API Key:**
- CLI command = Uses OAuth token ✅
- Gateway = Needs API key ❌
- They're different things!

---

**Status:** Need API key, not OAuth token! 🔑
