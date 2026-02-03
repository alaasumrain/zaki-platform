# Quick Connect to VM

## 🚀 Connect to VM

```bash
ssh root@62.171.148.105
# Password: Asumrain@19
```

## 📁 Once Connected

```bash
# Navigate to project
cd /root/zaki-platform

# Check status
pwd
ls -la

# View environment file
cat .env.local

# Edit environment file (add your API keys)
nano .env.local
```

## 🔑 Add Your API Keys

Edit `.env.local` and add:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
ANTHROPIC_API_KEY=sk-ant-...
AI_GATEWAY_BASE_URL=https://gateway.ai.cloudflare.com
AI_GATEWAY_API_KEY=your_gateway_key_here
GATEWAY_TOKEN=$(openssl rand -hex 32)
```

## 🧪 Test It

```bash
# Type check
npm run type-check

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## 📚 View Documentation

```bash
# Read README
cat README.md

# View setup docs
cat docs/VM_SETUP.md
cat docs/ARCHITECTURE_FLOW.md
```

---

**Quick Copy-Paste:**

```bash
ssh root@62.171.148.105
cd /root/zaki-platform
```
