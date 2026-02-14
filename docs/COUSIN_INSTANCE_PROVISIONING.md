# Cousin Instance Provisioning Guide

**Date:** 2026-02-09  
**Purpose:** Provision isolated Zaki Platform instance for cousin on VM

---

## 🎯 How It Works

We'll create a separate isolated instance on the VM for your cousin! Here's how:

### Architecture

```
VM Instance for Cousin
├── Separate OpenClaw Gateway (different port)
├── Separate config directory: ~/.clawdbot-cousin/
├── Separate workspace: /root/clawd-cousin/
├── Separate Telegram bot (or shared with different routing)
└── Full Control (isolated from main instance)
```

**Key Point:** Each user gets their own OpenClaw gateway instance running on the VM with separate ports and configs!

---

## 🚀 Quick Provisioning

### Option 1: Run Setup Script (Recommended)

**Use the setup script to create cousin's instance:**

1. Run the provisioning script
2. Enter cousin's Telegram ID
3. Script will:
   - Create separate config directory
   - Set up separate workspace
   - Configure separate OpenClaw gateway port
   - Create startup script
   - Set up Telegram bot routing (if needed)

**That's it!** The instance is ready to start.

---

### Option 2: Manual Setup (If Needed)

If you want to set up manually:

```bash
# Create config directory
mkdir -p ~/.clawdbot-cousin
mkdir -p /root/clawd-cousin

# Create config file
cat > ~/.clawdbot-cousin/clawdbot.json << EOF
{
  "agents": {
    "defaults": {
      "workspace": "/root/clawd-cousin",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": 18790,
    "mode": "local",
    "bind": "lan"
  }
}
EOF
```

Then start the gateway on the separate port.

---

## 📋 What Cousin Gets

### Isolated Instance
- ✅ **Own OpenClaw Gateway** - Runs on separate port (e.g., 18790)
- ✅ **Own Config Directory** - `~/.clawdbot-cousin/`
- ✅ **Own Workspace** - `/root/clawd-cousin/`
- ✅ **Own Memory** - Separate memory files and context
- ✅ **Own Files** - Can create files, run code, etc.

### Access
- ✅ **Telegram Bot** - Direct access via Telegram
- ✅ **Full Control** - Can configure, customize, add tools
- ✅ **Persistent** - Data persists across sessions
- ✅ **Isolated** - Can't see or access other users' data

---

## 🔍 How to Verify

### Check if Instance Exists

```bash
# Check if gateway is running
pgrep -f "clawdbot gateway.*18790" || echo "Not running"

# Check config directory
ls -la ~/.clawdbot-cousin/

# Check workspace
ls -la /root/clawd-cousin/
```

### Check Gateway Status

```bash
# Check if gateway is listening on port
netstat -tlnp | grep 18790

# Or check process
ps aux | grep "clawdbot gateway.*18790"
```

### Test Gateway

```bash
# Test health endpoint
curl http://localhost:18790/health
```

---

## 🛠️ Manual Setup Steps

If you want to set up manually:

```bash
# 1. Create directories
mkdir -p ~/.clawdbot-cousin
mkdir -p /root/clawd-cousin/{memory,skills}

# 2. Create config
cat > ~/.clawdbot-cousin/clawdbot.json << 'EOF'
{
  "agents": {
    "defaults": {
      "workspace": "/root/clawd-cousin",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": 18790,
    "mode": "local",
    "bind": "lan"
  }
}
EOF

# 3. Start gateway
clawdbot gateway --config ~/.clawdbot-cousin/clawdbot.json --port 18790
```

---

## 🔐 Access Details for Cousin

### Telegram Bot
- **Bot Username:** `@your_bot_username`
- **How to start:** Send `/start` message
- **Instance ID:** `user-{their-telegram-id}`

### What Happens on First Message

1. **User Creation**
   - System creates user record
   - Assigns unique user ID

2. **Sandbox Provisioning**
   - Creates isolated Sandbox: `user-{telegram-id}`
   - Mounts R2 storage: `users/{telegram-id}/`
   - Sets up workspace

3. **OpenClaw Startup**
   - Starts OpenClaw gateway in Sandbox
   - Configures with user preferences
   - Creates SOUL.md and USER.md

4. **Onboarding**
   - Starts onboarding flow (language, name, etc.)
   - Saves preferences to R2
   - Completes setup

---

## 📊 Instance Details

### Config Directory
```
~/.clawdbot-cousin/
├── clawdbot.json        # Main config
└── workspace/           # (if used)
```

### Workspace Directory
```
/root/clawd-cousin/
├── memory/              # Conversation memory
├── skills/               # Custom skills
├── SOUL.md              # AI personality
├── USER.md              # User info
└── workspace/           # User's files
```

### Gateway Endpoint
Cousin's instance runs on:
- **Port:** 18790 (separate from main instance on 18789)
- **Endpoint:** `http://localhost:18790/v1/chat/completions`
- **Config:** `~/.clawdbot-cousin/clawdbot.json`

---

## 🎯 For Tasheel Platform

If you're building **Tasheel Platform** separately:

### Setup Options

**Option A: Separate Port on Same VM**
- Cousin's gateway on port 18790
- Main instance on port 18789
- Same VM, separate processes
- Easy to manage

**Option B: Separate VM**
- Deploy on different VM
- Completely isolated
- More resources needed

**Recommendation:** Option A - separate port on same VM is easiest!

---

## ✅ Verification Checklist

After setup:

- [ ] Config directory created: `~/.clawdbot-cousin/`
- [ ] Workspace created: `/root/clawd-cousin/`
- [ ] Config file created: `~/.clawdbot-cousin/clawdbot.json`
- [ ] OpenClaw gateway running on port 18790
- [ ] Gateway accessible: `curl http://localhost:18790/health`
- [ ] Telegram bot configured (if using separate bot)
- [ ] Can send/receive messages

---

## 🚨 Troubleshooting

### Gateway Not Starting

**Check:**
1. Is port 18790 available?
2. Is config file correct?
3. Check gateway logs

**Fix:**
```bash
# Check if port is in use
netstat -tlnp | grep 18790

# Check config
cat ~/.clawdbot-cousin/clawdbot.json

# Check logs
tail -f /tmp/clawdbot-cousin-gateway.log
```

### Can't Access Gateway

**Check:**
1. Is gateway process running?
2. Is firewall blocking port?
3. Check gateway status

**Fix:**
```bash
# Check process
ps aux | grep "clawdbot gateway.*18790"

# Test locally
curl http://localhost:18790/health

# Restart if needed
pkill -f "clawdbot gateway.*18790"
clawdbot gateway --config ~/.clawdbot-cousin/clawdbot.json --port 18790
```

---

## 📞 Support

If cousin needs help:
1. Check this guide
2. Review Zaki Platform docs
3. Check Worker logs
4. Contact you for support

---

**Status:** Ready to set up! Run the provisioning script or set up manually! 🚀
