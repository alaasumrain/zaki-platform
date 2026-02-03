# Zaki Platform

Multi-tenant personal AI assistant platform - OpenClaw on Cloudflare Workers.

## 🎯 Vision

Each user gets their own isolated OpenClaw Sandbox, accessible from web, mobile, Telegram, WhatsApp, Discord, and more.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- Workers Paid plan ($5/month) - required for Sandboxes

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Deploy to Cloudflare
npm run deploy
```

## 📁 Project Structure

```
zaki-platform/
├── src/
│   ├── index.ts          # Main Worker entry point
│   ├── types.ts          # TypeScript types
│   ├── sandbox/          # Sandbox management
│   ├── auth/             # Authentication
│   ├── routing/          # Request routing
│   └── utils/            # Utilities
├── wrangler.toml         # Cloudflare Workers config
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies
```

## 🏗️ Architecture

```
User → Workers → User's Sandbox → OpenClaw
                (isolated)
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Multi-Tenant Explained](./docs/MULTI_TENANT_EXPLAINED.md)
- [Feasibility Assessment](./docs/HONEST_FEASIBILITY.md)

## 🔗 Resources

- [Moltworker Reference](https://github.com/cloudflare/moltworker)
- [OpenClaw](https://github.com/openclaw/openclaw)
- [Cloudflare Sandboxes Docs](https://developers.cloudflare.com/sandbox/)

## 📝 License

MIT
