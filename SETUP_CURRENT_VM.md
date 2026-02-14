# Setting Up Zaki Platform on Current VM

**Date:** 2026-02-09  
**Goal:** Get the new VM-based infrastructure running on current VM

---

## ✅ What's Done

- ✅ Express installed
- ✅ Instance Manager service created
- ✅ Cloudflare code archived
- ✅ VM-based server code ready
- ✅ Startup script created

---

## 🚀 Quick Setup

### 1. Set Environment Variables

```bash
cd /root/zaki-platform

# Create .env file
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your-token-here
ANTHROPIC_API_KEY=your-key-here
PORT=3000
NODE_ENV=development
GATEWAY_TOKEN=zaki-internal-token
DEFAULT_MODEL=anthropic/claude-opus-4-5
EOF

# Load environment
source .env
export $(cat .env | xargs)
```

### 2. Fix TypeScript Errors (if any)

```bash
cd /root/zaki-platform
npm run type-check
```

### 3. Start the Server

**Option A: Development Mode (with auto-reload)**
```bash
./scripts/start-zaki-server.sh
```

**Option B: Manual Start**
```bash
cd /root/zaki-platform
tsx watch src/index.ts
```

### 4. Test It

```bash
# Check health
curl http://localhost:3000/

# Should return:
# {"name":"Zaki Platform","status":"running","version":"0.2.0","architecture":"VM-based"}
```

---

## 📋 Current VM Status

**What's Running:**
- Port 18789: OpenClaw gateway (main instance)
- Port 18790: Landing page preview
- Port 19001: Docker proxy (LobeChat)

**What We're Adding:**
- Port 3000: Zaki Platform API server
- Port 18790+: User instances (auto-created)

---

## 🧪 Testing Steps

### 1. Test Server Startup
```bash
cd /root/zaki-platform
npm run dev
# Should start on port 3000
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/
```

### 3. Test Telegram Webhook Setup
```bash
curl http://localhost:3000/setup
```

### 4. Test with Cousin
- Have cousin send `/start` to bot
- Instance should be created automatically
- Check: `ls -la /root/.clawdbot-user-*`
- Check: `ls -la /root/clawd-user-*`

---

## 🔧 Troubleshooting

### Server Won't Start

**Check:**
```bash
# Check if port 3000 is in use
netstat -tlnp | grep 3000

# Check logs
tail -f /tmp/zaki-server.log

# Check TypeScript errors
npm run type-check
```

### Instance Creation Fails

**Check:**
```bash
# Check if clawdbot is installed
which clawdbot || which openclaw

# Check available ports
netstat -tlnp | grep -E "18790|18791"

# Check instance manager logs
# (errors will be in server logs)
```

### Telegram Webhook Not Working

**Check:**
```bash
# Verify webhook is set
curl http://localhost:3000/setup

# Check if server is accessible from internet
# (may need to configure firewall/port forwarding)
```

---

## 📊 Monitoring

### Check Running Instances

```bash
# List all user instances
ls -la /root/.clawdbot-user-*

# Check running gateways
ps aux | grep "clawdbot gateway\|openclaw gateway"

# Check ports in use
netstat -tlnp | grep -E "1879[0-9]|188[0-9][0-9]"
```

### View Logs

```bash
# Server logs
tail -f /tmp/zaki-server.log

# Gateway logs (per instance)
tail -f /tmp/clawdbot-user-*-gateway.log
```

---

## 🎯 Next Steps After Setup

1. **Test with cousin** - Create first isolated instance
2. **Monitor performance** - Check resource usage
3. **Plan upgrade** - When you hit limits, upgrade to VDS M
4. **Scale** - Add more users, monitor, upgrade as needed

---

## 💰 When to Upgrade

**Current VM Limits:**
- Check current RAM: `free -h`
- Check current CPU: `nproc`
- Check current storage: `df -h`

**Upgrade Triggers:**
- RAM usage > 80%
- CPU usage consistently high
- Running out of ports (18790-18999)
- Need more storage

**Upgrade To:**
- **VDS M** (€35.84/month) - 4 cores, 32 GB RAM
- **VDS L** (€51.20/month) - 6 cores, 48 GB RAM
- **VDS XL** (€65.92/month) - 8 cores, 64 GB RAM

---

**Status:** Ready to test on current VM! 🚀
