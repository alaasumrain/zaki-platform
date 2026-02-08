# Troubleshooting HTTP 500 Error

**Date:** 2026-02-03  
**Error:** `HTTP 500: api_error: Internal server error`

---

## 🔍 What This Error Means

**HTTP 500** = Internal Server Error on Anthropic's API

This usually means:
- Anthropic's API is having issues (temporary)
- Invalid/expired API key
- Rate limiting
- Request format issue
- Network problem

---

## 🛠️ Quick Fixes

### 1. Check API Key
```bash
# Check if token is set
cat ~/.openclaw/openclaw.json | jq '.auth.profiles."anthropic:alaa".token'

# If invalid, update it
bash /root/zaki-platform/scripts/update-anthropic-token.sh YOUR_API_KEY
```

### 2. Restart Gateway
```bash
systemctl --user restart openclaw-gateway
openclaw gateway status
```

### 3. Test Claude CLI
```bash
claude 'hello'
# If this works, API key is valid
# If this fails, API key is invalid
```

### 4. Check Gateway Logs
```bash
journalctl --user -u openclaw-gateway -n 100 --no-pager
# Look for error messages
```

---

## 🔧 Common Causes

### 1. Invalid API Key
**Symptom:** 500 error consistently  
**Fix:** Update API key

### 2. Expired Token
**Symptom:** Was working, now 500  
**Fix:** Get new token via `claude setup-token`

### 3. Rate Limiting
**Symptom:** Intermittent 500 errors  
**Fix:** Wait a few minutes, retry

### 4. API Service Issue
**Symptom:** 500 errors for everyone  
**Fix:** Check Anthropic status page, wait

### 5. Network Issue
**Symptom:** Timeout or 500  
**Fix:** Check internet connection

---

## 🚀 Quick Fix Script

```bash
#!/bin/bash
# Quick fix for 500 error

echo "🔧 Fixing 500 error..."

# 1. Check gateway status
echo "Checking gateway..."
openclaw gateway status

# 2. Restart gateway
echo "Restarting gateway..."
systemctl --user restart openclaw-gateway
sleep 2

# 3. Check status again
echo "Checking status..."
openclaw gateway status

# 4. Test Claude CLI
echo "Testing Claude CLI..."
claude 'hello' 2>&1 | head -5

echo "✅ Done! Try messaging the bot again."
```

---

## 📝 Next Steps

1. Check gateway status
2. Check API key validity
3. Restart gateway
4. Test with Claude CLI
5. Check logs for details

---

**Status:** Troubleshooting in progress...
