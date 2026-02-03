# VM Setup Guide - Zaki Platform

**VM IP:** 62.171.148.105  
**User:** root  
**Purpose:** Dedicated VM for Zaki Platform development and OpenClaw instance

---

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# SSH into VM
ssh root@62.171.148.105
# Password: Asumrain@19

# Run setup script
cd /root
curl -s https://raw.githubusercontent.com/alaasumrain/zaki-platform/master/scripts/vm-setup.sh | bash

# Or clone and run locally
git clone https://github.com/alaasumrain/zaki-platform.git
cd zaki-platform
bash scripts/vm-setup.sh
```

### Option 2: Manual Setup

```bash
# SSH into VM
ssh root@62.171.148.105

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y git curl nodejs npm python3 python3-pip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Clone repository
cd /root
git clone https://github.com/alaasumrain/zaki-platform.git
cd zaki-platform

# Install dependencies
npm install
```

---

## 🔑 Environment Variables Setup

After setup, edit `.env.local`:

```bash
cd /root/zaki-platform
nano .env.local
```

**Required Variables:**

```bash
# Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Anthropic API Key (for OpenClaw)
ANTHROPIC_API_KEY=sk-ant-...

# AI Gateway (optional)
AI_GATEWAY_BASE_URL=https://gateway.ai.cloudflare.com
AI_GATEWAY_API_KEY=your_gateway_key_here

# Gateway Token (generate new)
GATEWAY_TOKEN=$(openssl rand -hex 32)
```

**How to Get These:**

1. **Cloudflare Account ID:**
   - Go to Cloudflare Dashboard
   - Right sidebar → Account ID

2. **Cloudflare API Token:**
   - Cloudflare Dashboard → My Profile → API Tokens
   - Create token with Workers:Edit permissions

3. **Anthropic API Key:**
   - https://console.anthropic.com/
   - Create API key

4. **AI Gateway (optional):**
   - Cloudflare Dashboard → AI Gateway
   - Create gateway → Get API key

---

## 🦎 OpenClaw Setup on VM

### Install OpenClaw

```bash
cd /root/zaki-platform
bash scripts/setup-openclaw.sh
```

### Or Manual Installation

```bash
# Install OpenClaw Gateway
npm install -g @openclaw/gateway

# Or from source
cd /tmp
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm link
```

### Create Config

```bash
mkdir -p ~/.openclaw
cat > ~/.openclaw/openclaw.json << 'EOF'
{
  "persona": {
    "name": "Zaki",
    "description": "Helpful AI assistant",
    "instructions": "You are Zaki, a helpful AI assistant.",
    "model": "claude-3-5-sonnet-20241022"
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0"
  }
}
EOF
```

### Start OpenClaw Gateway

```bash
# Start Gateway
openclaw-gateway start

# Or with config path
openclaw-gateway start --config ~/.openclaw/openclaw.json
```

---

## 🧪 Testing

### Test Workers API

```bash
cd /root/zaki-platform

# Run locally
npm run dev

# Or deploy to Cloudflare
npm run deploy
```

### Test OpenClaw Gateway

```bash
# Start Gateway
openclaw-gateway start

# Test connection (in another terminal)
curl http://localhost:18789/health
```

---

## 📁 Directory Structure

```
/root/zaki-platform/
├── src/                    # Workers code
├── scripts/               # Setup scripts
├── docs/                  # Documentation
├── .env.local            # Environment variables (create this)
└── package.json          # Dependencies
```

---

## 🔐 Security Notes

1. **Change default password** after first login
2. **Set up SSH keys** instead of password auth
3. **Firewall rules** - only allow necessary ports
4. **Keep .env.local secure** - don't commit to git

---

## 🚀 Next Steps

1. ✅ VM setup complete
2. 🔨 Configure environment variables
3. 🔨 Install OpenClaw
4. 🔨 Test Workers API
5. 🔨 Test OpenClaw Gateway
6. 🔨 Connect Workers to OpenClaw

---

## 📞 Troubleshooting

**Can't SSH?**
- Check firewall rules
- Verify IP: 62.171.148.105
- Try: `ssh -v root@62.171.148.105`

**OpenClaw won't start?**
- Check Node.js version: `node -v` (need 18+)
- Check config: `cat ~/.openclaw/openclaw.json`
- Check logs: `openclaw-gateway start --verbose`

**Workers deploy fails?**
- Check `.env.local` has all required vars
- Verify Cloudflare API token permissions
- Check: `npx wrangler whoami`

---

**Ready to build!** 🚀
