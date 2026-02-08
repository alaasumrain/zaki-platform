# Can CLI Create API Key?

**Date:** 2026-02-03  
**Question:** Can the CLI create an API key?

---

## 🎯 Short Answer

**No, the CLI cannot create API keys.** You need to create them in the Anthropic console.

---

## 🔍 What the CLI Can Do

### 1. `claude setup-token`
**What it does:**
- Creates OAuth token (not API key!)
- Opens browser for OAuth flow
- Gets token for CLI use only

**What it CAN'T do:**
- ❌ Create API key
- ❌ Generate `sk-ant-api03-...` key
- ❌ Create keys for Gateway use

**Result:**
- Token: `sk-ant-oat01-...` (OAuth token)
- Works for: CLI commands only
- Doesn't work for: Gateway/API calls

---

### 2. Other CLI Commands
**Available commands:**
- `claude 'message'` - Send message via CLI
- `claude setup-token` - Get OAuth token
- `claude --help` - Show help

**No API key creation command exists!**

---

## 🔧 How to Get API Key

### Method 1: Anthropic Console (Recommended)
1. Go to https://console.anthropic.com/
2. Sign in
3. Click "API Keys" in sidebar
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-api03-...`)
6. Save it securely (only shown once!)

**This is the ONLY way to get API keys!**

---

### Method 2: Anthropic API (Advanced)
You can create API keys programmatically, but you need:
- Existing API key with admin permissions
- API access to Anthropic's management API

**Not recommended for most users!**

---

## 💡 Why CLI Can't Create API Keys

**Security Reasons:**
- API keys are sensitive credentials
- Should be created in secure console
- Need proper authentication/authorization
- Console has better security controls

**Design Reasons:**
- OAuth tokens = For CLI use
- API keys = For programmatic use
- Different purposes, different creation methods

---

## 🚀 Quick Guide

### Step 1: Get API Key
```bash
# Open browser
# Go to: https://console.anthropic.com/
# Create API key
# Copy it (sk-ant-api03-...)
```

### Step 2: Set API Key
```bash
# Set environment variable
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"

# Or update OpenClaw config
bash /root/zaki-platform/scripts/update-anthropic-token.sh "$ANTHROPIC_API_KEY"
```

### Step 3: Restart Gateway
```bash
systemctl --user restart openclaw-gateway
```

### Step 4: Test
```bash
claude 'hello'
# Should work now!
```

---

## 📊 Comparison

| Method | What It Creates | Works For |
|--------|-----------------|-----------|
| **Console** | API Key (`sk-ant-api03-...`) | Gateway, API calls ✅ |
| **CLI (`setup-token`)** | OAuth Token (`sk-ant-oat01-...`) | CLI only ❌ |

---

## 🎯 Summary

**Question:** Can CLI create API key?  
**Answer:** No ❌

**What CLI can do:**
- ✅ Create OAuth token (`claude setup-token`)
- ✅ Use OAuth token for CLI commands
- ❌ Cannot create API keys

**What you need to do:**
1. Go to Anthropic console
2. Create API key manually
3. Use it with Gateway

**Why:**
- Security (keys are sensitive)
- Design (different purposes)
- Console is the official way

---

**Status:** Need to create API key in console! 🔑
