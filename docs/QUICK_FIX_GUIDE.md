# Quick Fix Guide - Instant Problem Resolution

**Goal:** Fix OpenClaw issues immediately and quickly

---

## 🚀 Quick Fix Script

```bash
# Diagnose all issues
bash /root/zaki-platform/scripts/quick-fix.sh

# Fix specific issue
bash /root/zaki-platform/scripts/quick-fix.sh auth
bash /root/zaki-platform/scripts/quick-fix.sh gateway
bash /root/zaki-platform/scripts/quick-fix.sh telegram
```

---

## ⚡ Common Issues & Instant Fixes

### 1. HTTP 401: Invalid Bearer Token

**Symptoms:**
- Bot receives messages but can't respond
- Error: "authentication_error: Invalid bearer token"

**Quick Fix:**
```bash
# Option 1: Update token
bash /root/zaki-platform/scripts/update-anthropic-token.sh sk-ant-api03-...

# Option 2: Get new OAuth token
claude setup-token
# Then update with script

# Option 3: Restart gateway (sometimes fixes stale token)
systemctl --user restart openclaw-gateway
```

**Time:** 30 seconds

---

### 2. Gateway Not Running

**Symptoms:**
- No response from bot
- Health check fails

**Quick Fix:**
```bash
# Start gateway
systemctl --user start openclaw-gateway

# Or manually
openclaw gateway --port 18789 --verbose
```

**Time:** 10 seconds

---

### 3. Claude CLI Token Invalid

**Symptoms:**
- `claude 'hello'` returns error
- "Invalid API key · Please run /login"

**Quick Fix:**
```bash
# Get new token
claude setup-token

# Or set API key
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Time:** 1 minute (OAuth) or 10 seconds (API key)

---

### 4. Telegram Pairing Required

**Symptoms:**
- Bot sends pairing code
- Messages not processed

**Quick Fix:**
```bash
# List pending
openclaw pairing list telegram

# Approve
openclaw pairing approve telegram <CODE>
```

**Time:** 10 seconds

---

### 5. Gateway Health Check Fails

**Symptoms:**
- `openclaw health` fails
- Gateway seems unresponsive

**Quick Fix:**
```bash
# Restart gateway
systemctl --user restart openclaw-gateway

# Check logs
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# Check status
openclaw gateway status
```

**Time:** 30 seconds

---

## 🔍 Quick Diagnosis Commands

```bash
# Full status
openclaw status --all

# Health check
openclaw health

# Gateway status
openclaw gateway status

# Test Claude CLI
claude 'hello'

# Check logs
tail -20 /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log
journalctl --user -u openclaw-gateway -n 20
```

---

## 📋 Troubleshooting Checklist

When something breaks, run through this:

1. **Gateway running?**
   ```bash
   pgrep -f "openclaw gateway"
   ```

2. **Health OK?**
   ```bash
   curl http://localhost:18789/health
   ```

3. **Claude CLI works?**
   ```bash
   claude 'test'
   ```

4. **Token valid?**
   ```bash
   cat ~/.openclaw/agents/main/agent/auth-profiles.json | jq '.profiles'
   ```

5. **Gateway restarted?**
   ```bash
   systemctl --user restart openclaw-gateway
   ```

---

## 🎯 Fix Priority Order

1. **Restart Gateway** (fixes 70% of issues)
2. **Check Token** (fixes 20% of issues)
3. **Check Logs** (diagnoses remaining 10%)

---

## 💡 Pro Tips

- **Always restart gateway first** - fixes most issues
- **Check logs immediately** - shows exact error
- **Use quick-fix script** - automates common fixes
- **Keep API key handy** - faster than OAuth for testing

---

**Goal:** Fix issues in < 1 minute. This guide helps achieve that.
