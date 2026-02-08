# Zaki Platform

**Your personal AI assistant. One brain, every platform.**

Talk to Zaki in our app, on Telegram, WhatsApp, or Discord. Same memory, same context, everywhere you go. Not a chatbot. Not a wrapper. A full AI assistant that actually does things.

---

## 🎯 What is Zaki?

Zaki is a **full-service personal AI assistant** that:

- **Lives everywhere** - Zaki App + Telegram + WhatsApp + Discord
- **Remembers everything** - Persistent memory across all channels
- **Actually does stuff** - Browse web, run code, manage files, automate tasks
- **Grows with you** - Learns your preferences and adapts

### Not a Wrapper

| Wrapper Apps | Zaki |
|--------------|------|
| "Connect your API key" | Just sign up and go |
| Web-only chat | App + Telegram + WhatsApp + Discord |
| Generic responses | Personalized to you |
| Chat only | Tools, automation, actions |
| Forgets everything | Persistent memory |

---

## 💰 Pricing

| Tier | Price | What You Get |
|------|-------|--------------|
| **Free** | $0 | 50 msgs/mo, Telegram only |
| **Starter** | $19/mo | 500 msgs, All channels, Zaki App |
| **Pro** | $39/mo | 2000 msgs, Priority AI, Advanced tools |
| **BYOK** | $9/mo | Platform only, bring your own API key |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ZAKI PLATFORM                     │
│                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│   │  ZAKI APP   │  │  TELEGRAM   │  │  WHATSAPP  │  │
│   │             │  │             │  │            │  │
│   └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│          └────────────────┼───────────────┘          │
│                           ▼                          │
│          ┌────────────────────────────┐              │
│          │  Cloudflare Workers API    │              │
│          └────────────┬───────────────┘              │
│                       ▼                              │
│          ┌────────────────────────────┐              │
│          │  User's Personal Sandbox   │              │
│          │  ┌──────────────────────┐  │              │
│          │  │  OpenClaw Gateway    │  │              │
│          │  │  + Memory            │  │              │
│          │  │  + Tools             │  │              │
│          │  │  + Your Data (R2)    │  │              │
│          │  └──────────────────────┘  │              │
│          └────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Cloudflare Workers** - API Gateway, routing
- **Cloudflare Sandboxes** - Isolated user containers
- **Cloudflare R2** - Persistent per-user storage
- **OpenClaw** - AI agent runtime (inside each Sandbox)

---

## 📱 Channels

| Channel | Status | Notes |
|---------|--------|-------|
| Telegram | ✅ MVP | First channel, working |
| Zaki Web App | 🔨 Planned | Phase 2 |
| WhatsApp | 🔨 Planned | Phase 2 |
| Discord | 🔨 Planned | Phase 3 |
| iOS/Android | 🔨 Planned | Phase 3 |

---

## 🚀 Roadmap

### Phase 1: MVP (Current)
- [x] Core platform architecture
- [x] Sandbox management
- [x] R2 storage integration
- [ ] Telegram onboarding flow
- [ ] User signup & billing

### Phase 2: Multi-Channel
- [ ] Zaki Web App
- [ ] WhatsApp integration
- [ ] Unified conversation history

### Phase 3: Native Apps
- [ ] iOS app
- [ ] Android app
- [ ] Discord integration
- [ ] Slack integration

---

## 📦 What Ships with Zaki

Every Zaki user gets:

| Capability | Description |
|------------|-------------|
| **Multi-channel** | Same assistant on app, Telegram, WhatsApp |
| **Persistent memory** | Remembers across sessions and channels |
| **Web browsing** | Search and browse the internet |
| **File handling** | Upload, read, create files |
| **Code execution** | Run code in secure sandbox |
| **Scheduled tasks** | Reminders, cron jobs, automation |
| **Voice messages** | Speech-to-text, text-to-speech |

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Cloudflare account (Workers Paid plan)
- Anthropic API key

### Local Development

```bash
# Clone
git clone https://github.com/alaasumrain/zaki-platform.git
cd zaki-platform

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys

# Run locally
npm run dev
```

### Deploy

```bash
# Set secrets
npx wrangler secret put ANTHROPIC_API_KEY

# Deploy
npm run deploy
```

---

## 📁 Project Structure

```
zaki-platform/
├── src/
│   ├── index.ts           # Workers API entry
│   ├── config.ts          # Configuration
│   ├── types.ts           # TypeScript types
│   └── sandbox/
│       ├── manager.ts     # Sandbox lifecycle
│       └── openclaw.ts    # OpenClaw integration
├── docs/
│   ├── RESEARCH_FINDINGS.md
│   ├── ZAKI_CAPABILITIES.md
│   └── ...
├── memory/                # Session memories
├── Dockerfile             # Sandbox container image
├── start-zaki.sh          # Sandbox startup script
├── wrangler.toml          # Cloudflare config
└── README.md
```

---

## 📚 Documentation

- [Research Findings](docs/RESEARCH_FINDINGS.md) - Pricing, architecture research
- [Capabilities](docs/ZAKI_CAPABILITIES.md) - What Zaki can do
- [OpenClaw Reference](docs/OPENCLAW_REFERENCE.md) - OpenClaw patterns
- [Moltworker Learnings](docs/MOLTWORKER_LEARNINGS.md) - Implementation patterns

---

## 🤝 Credits

Built on:
- [OpenClaw](https://github.com/openclaw/openclaw) - AI agent runtime
- [Moltworker](https://github.com/cloudflare/moltworker) - Reference implementation
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge compute platform

---

## 📄 License

MIT

---

**Questions?** Open an issue or reach out on Telegram.
