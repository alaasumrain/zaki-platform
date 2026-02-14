# Quick Start - Zaki Platform on Current VM

**Ready to test!** 🚀

---

## ⚡ 3-Step Setup

### Step 1: Set Environment Variables

```bash
cd /root/zaki-platform

# Get your Telegram bot token (if you have it)
# Get your Anthropic API key

# Create .env file
cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=your-token-here
ANTHROPIC_API_KEY=your-key-here
PORT=3000
NODE_ENV=development
GATEWAY_TOKEN=zaki-internal-token
DEFAULT_MODEL=anthropic/claude-opus-4-5
EOF

# Load it
export $(cat .env | xargs)
```

### Step 2: Start Server

```bash
# Option A: Use startup script
./scripts/start-zaki-server.sh

# Option B: Manual start
npm run dev
```

### Step 3: Test

```bash
# Health check
curl http://localhost:3000/

# Should see:
# {"name":"Zaki Platform","status":"running","version":"0.2.0","architecture":"VM-based"}
```

---

## ✅ What's Ready

- ✅ Express server code
- ✅ Instance Manager service
- ✅ Auto instance creation
- ✅ TypeScript errors fixed
- ✅ Startup script ready
- ✅ No Cloudflare dependencies

---

## 🧪 Test with Cousin

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Set up webhook** (if needed):
   ```bash
   curl http://localhost:3000/setup
   ```

3. **Have cousin send `/start`** to Telegram bot

4. **Check instance created:**
   ```bash
   ls -la /root/.clawdbot-user-*
   ls -la /root/clawd-user-*
   ```

---

## 📊 Current VM Resources

Check your current resources:
```bash
# RAM
free -h

# CPU
nproc
top

# Storage
df -h

# Current processes
ps aux | grep -E "clawdbot|openclaw|node" | head -10
```

---

## 🚀 When Ready to Upgrade

**Upgrade to VDS M when:**
- You have 50+ users
- RAM usage > 80%
- Need more performance

**For now:** Test on current VM, see how it performs!

---

**Ready to start?** Run `npm run dev` and test it! 🎉
