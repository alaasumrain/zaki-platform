# CLI Troubleshooting - Why Is It Failing?

**Date:** 2026-02-03  
**Issue:** CLI failing even though it's a CLI-based setup

---

## 🔍 The Problem

**Question:** "Why is ours failing even though it's a CLI?"

**Answer:** The CLI itself works, but **the API key is missing/invalid**, so API calls fail.

---

## 🎯 What's Happening

### The Setup
```
Telegram Bot → OpenClaw Gateway → Anthropic API
                                    ↓
                              (HTTP 500 - No API Key!)
```

### Why It Fails
1. **Gateway is running** ✅
2. **CLI tools work** ✅
3. **API key is missing** ❌ ← This is the problem!

**Even though it's CLI-based, it still needs an API key to call Anthropic!**

---

## 🔧 The Fix

### Option 1: Set API Key (Fastest)
```bash
# Get your Anthropic API key from https://console.anthropic.com/
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Update OpenClaw config
bash /root/zaki-platform/scripts/update-anthropic-token.sh "$ANTHROPIC_API_KEY"

# Restart gateway
systemctl --user restart openclaw-gateway

# Test
claude 'hello'
```

### Option 2: Use Claude CLI Setup (Interactive)
```bash
# This will open browser for OAuth
claude setup-token

# Follow the prompts
# Copy the callback URL when it appears
# Paste it back when prompted
```

### Option 3: Manual Config Edit
```bash
# Edit config file
nano ~/.openclaw/openclaw.json

# Add your API key to:
{
  "auth": {
    "profiles": {
      "anthropic:alaa": {
        "token": "sk-ant-api03-YOUR_KEY_HERE"
      }
    }
  }
}

# Restart gateway
systemctl --user restart openclaw-gateway
```

---

## 🔍 Diagnosis Steps

### 1. Check Gateway Status
```bash
openclaw gateway status
# Should show: Runtime: running
```

### 2. Check API Key
```bash
# Check if key is set
jq -r '.auth.profiles."anthropic:alaa".token' ~/.openclaw/openclaw.json

# If shows "null" or empty → API key is missing!
```

### 3. Test Claude CLI
```bash
claude 'hello'
# If shows "Invalid API key" → API key is invalid!
```

### 4. Check Gateway Logs
```bash
journalctl --user -u openclaw-gateway -n 50 --no-pager
# Look for "Invalid API key" or "401" errors
```

---

## 💡 Why CLI Still Needs API Key

**Common Misconception:** "It's CLI, so it shouldn't need API key"

**Reality:**
- CLI tools (like `claude` command) work ✅
- But they still need API key to call Anthropic API ❌
- The Gateway needs API key to make API calls ❌
- Without API key → HTTP 500 errors ❌

**Think of it like:**
- CLI = The tool (works fine)
- API Key = The permission to use Anthropic's API (missing!)

---

## 🚀 Quick Fix Script

```bash
#!/bin/bash
# Quick fix for CLI/API key issues

echo "🔧 Fixing API Key Issue..."

# 1. Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set!"
    echo "Please set it:"
    echo "  export ANTHROPIC_API_KEY='sk-ant-api03-...'"
    exit 1
fi

# 2. Update OpenClaw config
echo "📝 Updating OpenClaw config..."
bash /root/zaki-platform/scripts/update-anthropic-token.sh "$ANTHROPIC_API_KEY"

# 3. Restart gateway
echo "🔄 Restarting gateway..."
systemctl --user restart openclaw-gateway
sleep 2

# 4. Test
echo "🧪 Testing..."
claude 'hello' 2>&1 | head -5

echo "✅ Done! Try messaging Zaki again."
```

---

## 📋 Common Issues

### Issue 1: "Invalid API key"
**Cause:** API key is wrong or expired  
**Fix:** Get new API key from Anthropic console

### Issue 2: "API key not set"
**Cause:** API key not configured  
**Fix:** Set API key using update script

### Issue 3: "Gateway not responding"
**Cause:** Gateway crashed or not started  
**Fix:** Restart gateway: `systemctl --user restart openclaw-gateway`

### Issue 4: "HTTP 500 error"
**Cause:** API key missing → Anthropic rejects request  
**Fix:** Set valid API key

---

## 🎯 Summary

**The Problem:**
- CLI tools work ✅
- Gateway runs ✅
- **API key missing** ❌ ← This causes failures!

**The Solution:**
- Set API key
- Restart gateway
- Test with `claude 'hello'`

**Why CLI Still Needs API Key:**
- CLI = Tool (works)
- API Key = Permission (needed!)
- Without permission → API calls fail → HTTP 500

---

**Status:** Need to set API key! 🔑
