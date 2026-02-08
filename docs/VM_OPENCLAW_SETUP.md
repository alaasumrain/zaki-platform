# OpenClaw Setup on VM for Zaki Platform

**Date:** 2026-02-03  
**Purpose:** Set up OpenClaw Gateway on VM for local testing/development

---

## ✅ Setup Complete!

OpenClaw is now installed and ready to use on this VM.

---

## 🚀 Quick Start

### Start OpenClaw Gateway

```bash
# Option 1: Use the helper script
cd /root/zaki-platform
bash scripts/start-openclaw-vm.sh

# Option 2: Start manually
clawdbot gateway --port 18789 --verbose --allow-unconfigured --bind lan
```

### Check Status

```bash
# Check if running
pgrep -f "clawdbot gateway"

# View logs
tail -f /tmp/openclaw-gateway.log
```

---

## 🔑 Environment Variables

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...

# Or add to ~/.bashrc for persistence
echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc
source ~/.bashrc
```

---

## 📁 Configuration

**Config Location:** `~/.clawdbot/clawdbot.json`

**Workspace:** `/root/clawd`

**Port:** `18789`

---

## 🧪 Testing

### Test Gateway Health

```bash
curl http://localhost:18789/health
```

### Test from Another Machine

```bash
# Get VM IP
hostname -I

# Test from your local machine
curl http://<VM_IP>:18789/health
```

---

## 🔧 Management

### Stop Gateway

```bash
# Find PID
pgrep -f "clawdbot gateway"

# Kill process
kill $(pgrep -f "clawdbot gateway")
```

### Restart Gateway

```bash
# Stop first
kill $(pgrep -f "clawdbot gateway") 2>/dev/null || true

# Start again
bash /root/zaki-platform/scripts/start-openclaw-vm.sh
```

---

## 📊 Status

- ✅ Node.js 22 installed
- ✅ OpenClaw (clawdbot) installed
- ✅ Config created at `~/.clawdbot/clawdbot.json`
- ✅ Workspace created at `/root/clawd`
- ✅ Startup script ready

---

## 🎯 Next Steps

1. **Set API Key:**
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Start Gateway:**
   ```bash
   bash /root/zaki-platform/scripts/start-openclaw-vm.sh
   ```

3. **Test Connection:**
   ```bash
   curl http://localhost:18789/health
   ```

4. **Use with Zaki Platform:**
   - Gateway runs on port 18789
   - Can be accessed from Workers or locally
   - For local testing, point Workers to VM IP

---

**Ready to use!** 🚀
