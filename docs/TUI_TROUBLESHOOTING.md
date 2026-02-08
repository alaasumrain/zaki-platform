# TUI Troubleshooting Guide

**Issue:** TUI connects but shows "(no output)" when sending messages

---

## ✅ What's Working

- Gateway is running (systemd service)
- TUI connects successfully (`connected | idle`)
- WebSocket connection established
- Gateway health check passes

---

## ❌ Problem

**Anthropic API token is invalid or expired**

When testing with `claude 'hello'`, we get:
```
Invalid API key · Please run /login
```

This means:
- TUI can connect to Gateway ✅
- Gateway is running ✅
- But Anthropic API calls fail ❌
- So agent can't generate responses ❌

---

## 🔧 Solutions

### Option 1: Get New Claude Token (OAuth)

```bash
# Get new token
claude setup-token

# Copy the token it gives you
# Then update OpenClaw config or re-run onboarding
```

### Option 2: Use Direct API Key (Easier)

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Restart gateway
systemctl --user restart openclaw-gateway

# Or restart manually
systemctl --user stop openclaw-gateway
openclaw gateway --port 18789 --verbose
```

### Option 3: Re-run Onboarding

```bash
openclaw onboard
# Select: Anthropic → API key (not setup-token)
# Paste your API key
# Complete setup
```

---

## 🧪 Testing

After fixing, test:

```bash
# Test Claude CLI
claude 'hello'

# Test Gateway
openclaw health

# Test TUI
openclaw tui ws://127.0.0.1:18789
```

---

## 📝 Notes for Zaki Platform

When implementing Zaki Platform:
- Each user's Sandbox needs valid Anthropic API key
- Store keys securely in R2 (encrypted)
- Support both API keys and OAuth tokens
- Handle token expiration gracefully
- Show clear error messages when auth fails

---

**Key Takeaway:** Gateway connection ≠ API authentication. Both must work for the agent to respond.
