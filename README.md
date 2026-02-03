# Zaki Platform

**Multi-tenant personal AI assistant platform - OpenClaw on Cloudflare Workers**

Each user gets their own isolated OpenClaw Sandbox, accessible from web, mobile, Telegram, WhatsApp, Discord, and more.

---

## 📋 Table of Contents

- [Vision](#-vision)
- [Architecture](#-architecture)
- [Research Findings](#-research-findings)
- [Feasibility Assessment](#-feasibility-assessment)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Key Resources](#-key-resources)
- [What Works vs What Needs Testing](#-what-works-vs-what-needs-testing)
- [Next Steps](#-next-steps)
- [License](#-license)

---

## 🎯 Vision

**Zaki Platform** = Multi-tenant version of Moltworker

- **Moltworker:** Each user deploys their own instance (single-tenant)
- **Zaki Platform:** One platform, many users, each gets isolated Sandbox (multi-tenant)

### The Difference

```
Moltworker (Single-Tenant):
User 1 → Deploys → Gets Sandbox-1
User 2 → Deploys → Gets Sandbox-2
Each deployment = ONE Sandbox = ONE User

Zaki Platform (Multi-Tenant):
User 1 → Signs up → Gets Sandbox user-1
User 2 → Signs up → Gets Sandbox user-2
User 3 → Signs up → Gets Sandbox user-3
ONE platform = MANY Sandboxes = ONE Sandbox per user
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Zaki Platform (One Deployment)             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Sandbox      │  │ Sandbox      │  │ Sandbox      │   │
│  │ user-1       │  │ user-2       │  │ user-3       │   │
│  │              │  │              │  │              │   │
│  │ OpenClaw     │  │ OpenClaw     │  │ OpenClaw     │   │
│  │ Gateway      │  │ Gateway      │  │ Gateway      │   │
│  │              │  │              │  │              │   │
│  │ R2: user-1/  │  │ R2: user-2/  │  │ R2: user-3/  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  User 1's data          User 2's data      User 3's data│
│  (isolated)             (isolated)         (isolated)    │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ Workers│          │ Workers │          │ Workers │
    │  API   │          │  API   │          │  API   │
    └────┬────┘          └────┬────┘          └────┬────┘
         │                    │                    │
    ┌────┴────────────────────┴────────────────────┴────┐
    │         Cloudflare Workers (API Gateway)            │
    └────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ LobeChat│          │Telegram │          │WhatsApp │
    │   Web   │          │   Bot   │          │   Bot   │
    └─────────┘          └─────────┘          └─────────┘
```

### Request Flow

1. **User sends message** (via LobeChat/Telegram/WhatsApp/etc.)
2. **Workers API** receives request
3. **Extract userId** from auth token
4. **Route to user's Sandbox** (`user-{userId}`)
5. **Sandbox** runs OpenClaw Gateway
6. **OpenClaw** processes message
7. **Response** sent back through Workers
8. **Delivered** to original platform

---

## 🔍 Research Findings

### Key Discovery: **cloudflare/moltworker** ⭐⭐⭐⭐⭐

**Repository:** https://github.com/cloudflare/moltworker  
**Stars:** 7,064+  
**Status:** Official Cloudflare implementation  
**Last Updated:** 2026-02-03

**What It Is:**
Moltworker is the **official Cloudflare implementation** of OpenClaw running on Cloudflare Workers + Sandboxes. This is **exactly** what we want to build, but as a multi-tenant platform.

**Key Features:**
- ✅ Cloudflare Sandbox Containers - Isolated OpenClaw runtime
- ✅ R2 Storage - Persistent storage for chat history
- ✅ Cloudflare Access - Zero Trust authentication
- ✅ Browser Rendering - Web automation capabilities
- ✅ AI Gateway - Optional API routing and analytics
- ✅ Multi-Channel Support - Telegram, Discord, Slack
- ✅ Device Pairing - Secure authentication
- ✅ Admin UI - Web-based control panel
- ✅ Control UI - Web-based chat interface

**Architecture:**
```
Internet
    ↓
Cloudflare Zero Trust (Access)
    ↓
Cloudflare Workers (API Gateway)
    ↓
Cloudflare Sandbox Container
    ├── OpenClaw Gateway Runtime
    ├── R2 Storage (mounted)
    ├── Browser Rendering (via API)
    └── AI Gateway (optional)
```

**What We Can Learn:**
1. **Sandbox Setup** - Uses Cloudflare Sandbox SDK, mounts R2 as filesystem
2. **Authentication** - Cloudflare Access for admin UI, device pairing for clients
3. **Storage** - R2 mounted as `~/.openclaw/` filesystem, survives restarts
4. **Multi-Platform** - All channels route through same Gateway

**Deployment:**
```bash
npm install
npx wrangler secret put ANTHROPIC_API_KEY
npm run deploy
```

**Requirements:**
- Workers Paid plan ($5/month) - Required for Sandboxes
- Anthropic API key - Or use AI Gateway Unified Billing
- Cloudflare Access - For admin UI protection

---

## ✅ Feasibility Assessment

### What DEFINITELY Works ✅

#### 1. OpenClaw in ONE Sandbox ✅ 100% PROVEN
- **Moltworker proves this works**
- No question, it's working in production
- **Verdict:** ✅ **Absolutely feasible**

#### 2. Multiple Sandboxes ✅ LIKELY WORKS
- `getSandbox(env.Sandbox, 'unique-id')` accepts any ID
- Each unique ID = separate Sandbox
- Blog post shows `'user-123'` pattern
- **Verdict:** ✅ **Probably works, but need to test limits**

#### 3. R2 Storage Per User ✅ DEFINITELY WORKS
- R2 prefixes are standard feature
- `user-123/` vs `user-456/` works fine
- **Verdict:** ✅ **100% feasible**

---

### What's UNCERTAIN ⚠️

#### 1. Sandbox Limits ❓ CRITICAL UNKNOWN

**The Real Question:**
- Can you create 1,000 Sandboxes?
- Is there a limit per account?
- What's the cost?

**What We DON'T Know:**
- ❌ Max Sandboxes per account
- ❌ Cost per Sandbox
- ❌ Rate limits on Sandbox creation
- ❌ Concurrent Sandbox limits

**Risk Level:** ⚠️ **HIGH** - This could be a blocker

**What We Need:**
- Test creating 100 Sandboxes
- Check Cloudflare billing
- Read Sandbox docs for limits

**Honest Answer:** **Don't know. Need to test.**

---

#### 2. Cold Start Problem ⚠️ UX ISSUE

**Moltworker README says:**
> "The first request may take 1-2 minutes while the container starts."

**The Problem:**
- If Sandbox sleeps after inactivity
- User's first message = 1-2 minute wait
- That's TERRIBLE UX for "always-on" assistant

**Solutions:**
- Keep Sandboxes alive (`keepAlive: true`)
- But this costs money (always running)
- Or accept cold starts (bad UX)

**Verdict:** ⚠️ **Trade-off** - Cost vs UX, need to decide

**Honest Answer:** **Works, but UX might suck if Sandboxes sleep.**

---

#### 3. Cost Structure ❓ BUSINESS MODEL RISK

**Best Case:**
- Sandboxes included in Workers Paid ($5/month)
- 1,000 Sandboxes = Still $5/month
- **Business model works**

**Worst Case:**
- Sandboxes cost $10 each per month
- 1,000 Sandboxes = $10,000/month
- **Business model breaks**

**Most Likely:**
- Sandboxes included, but there's a limit
- Or usage-based pricing
- **Need to verify**

**Verdict:** ⚠️ **Unknown** - Could break business model

**Honest Answer:** **Don't know costs. Need to check pricing.**

**Blog Post Insight:**
> "minimum $5 USD Workers paid plan subscription to use Sandbox Containers"

This suggests Sandboxes are **included** in Workers Paid plan, not billed separately. But we need to verify limits.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Cloudflare account**
- **Workers Paid plan** ($5/month) - Required for Sandboxes
- **Anthropic API key** (or use AI Gateway Unified Billing)

### Setup

```bash
# Clone repository
git clone https://github.com/alaasumrain/zaki-platform.git
cd zaki-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set Cloudflare secrets
npx wrangler secret put ANTHROPIC_API_KEY
# Enter your Anthropic API key when prompted

# Deploy to Cloudflare
npm run deploy
```

### Development

```bash
# Run locally
npm run dev

# Type check
npm run type-check

# Deploy
npm run deploy
```

---

## 📁 Project Structure

```
zaki-platform/
├── src/
│   ├── index.ts              # Main Worker entry point
│   ├── types.ts              # TypeScript types
│   └── sandbox/
│       ├── manager.ts         # Sandbox lifecycle management
│       └── openclaw.ts        # OpenClaw integration (placeholder)
├── docs/
│   └── BUILD_PROGRESS.md     # Build progress tracking
├── wrangler.toml             # Cloudflare Workers config
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies
└── README.md                 # This file
```

### Current Implementation

**Working:**
- ✅ Health check endpoint (`/health`)
- ✅ Chat API endpoint (`/api/chat`) - placeholder
- ✅ Sandbox status endpoint (`/api/sandbox/:userId`)
- ✅ User Sandbox ID generation (`user-{userId}`)
- ✅ TypeScript types configured
- ✅ All TypeScript errors resolved

**TODO:**
- ⏳ Study Moltworker code
- ⏳ Implement R2 mounting
- ⏳ Get OpenClaw running in Sandbox
- ⏳ Test single Sandbox
- ⏳ Test multiple Sandboxes (verify multi-tenancy)

---

## 🔗 Key Resources

### Official Documentation

- **[Cloudflare Sandboxes Docs](https://developers.cloudflare.com/sandbox/)** - Official Sandbox documentation
- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)** - Workers documentation
- **[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)** - AI Gateway for analytics and billing
- **[Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)** - R2 storage documentation

### Reference Implementations

- **[cloudflare/moltworker](https://github.com/cloudflare/moltworker)** ⭐ - Official OpenClaw on Cloudflare implementation
- **[openclaw/openclaw](https://github.com/openclaw/openclaw)** - OpenClaw agent runtime
- **[lobehub/lobe-chat](https://github.com/lobehub/lobe-chat)** - LobeChat UI (we'll integrate this)

### Blog Posts & Articles

- **[Introducing Moltworker](https://blog.cloudflare.com/moltworker-self-hosted-ai-agent)** - Official Cloudflare blog post about Moltworker
- **[Build Agents on Cloudflare](https://developers.cloudflare.com/agents/)** - Cloudflare Agents SDK docs

### Related Projects

- **[jgarzik/botmaker](https://github.com/jgarzik/botmaker)** - Complete Guide to Building AI Agents
- **[zscole/gru](https://github.com/zscole/gru)** - Multi-tenant AI agent platform reference

---

## ✅ What Works vs What Needs Testing

### ✅ Confirmed Working (From Moltworker)

| Feature | Status | Notes |
|---------|--------|-------|
| Single Sandbox | ✅ **PROVEN** | Moltworker works in production |
| OpenClaw in Sandbox | ✅ **PROVEN** | Running successfully |
| R2 Storage Mounting | ✅ **PROVEN** | Mounted as filesystem |
| Browser Rendering | ✅ **PROVEN** | Via Cloudflare API |
| AI Gateway Integration | ✅ **PROVEN** | Optional analytics |
| Multi-Channel Support | ✅ **PROVEN** | Telegram, Discord, Slack |

### ⚠️ Needs Testing (Multi-Tenancy)

| Feature | Status | Risk | Test Plan |
|---------|--------|------|-----------|
| Multiple Sandboxes | ⚠️ **UNKNOWN** | HIGH | Create 10 Sandboxes, verify isolation |
| Sandbox Limits | ⚠️ **UNKNOWN** | HIGH | Test creating 100+ Sandboxes |
| Cost Per Sandbox | ⚠️ **UNKNOWN** | HIGH | Check Cloudflare billing |
| Cold Start Performance | ⚠️ **UNKNOWN** | MEDIUM | Test first request latency |
| Concurrent Sandboxes | ⚠️ **UNKNOWN** | MEDIUM | Test 10+ simultaneous requests |
| R2 Per-User Isolation | ✅ **LIKELY** | LOW | Test prefix isolation |

---

## 📋 Next Steps

### Phase 1: Single User MVP (This Week)

1. **Study Moltworker Code** 📚
   - Clone Moltworker repository
   - Understand Sandbox initialization
   - See how R2 is mounted
   - Learn how OpenClaw starts

2. **Implement Sandbox Initialization** 🔨
   - Mount R2 storage for user
   - Install OpenClaw dependencies
   - Start OpenClaw Gateway

3. **Test Single Sandbox** ✅
   - Verify Sandbox starts
   - Test R2 mounting
   - Test OpenClaw Gateway connection
   - Test basic chat flow

### Phase 2: Multi-Tenancy (Next Week)

1. **Test Multiple Sandboxes** 🧪
   - Create 10 test Sandboxes
   - Verify complete isolation
   - Check Cloudflare billing
   - Test concurrent requests

2. **Add User Authentication** 🔐
   - Extract userId from auth token
   - Route to correct Sandbox
   - Implement user management

3. **Add User Management** 👥
   - Create Sandbox on signup
   - Store user configs in R2
   - Implement basic tier system

### Phase 3: LobeChat Integration (Week 3)

1. **Connect LobeChat** 🎨
   - Update LobeChat to use Workers API
   - Implement WebSocket proxy
   - Route messages to Sandboxes

2. **Add Multi-Platform Support** 📱
   - Telegram bot integration
   - WhatsApp bot integration
   - Discord bot integration

---

## 🎯 Current Status

**Last Updated:** 2026-02-03

**What's Done:**
- ✅ Repository created
- ✅ Project structure set up
- ✅ Basic API endpoints implemented
- ✅ TypeScript configured
- ✅ All errors fixed

**What's Next:**
- 🔨 Study Moltworker implementation
- 🔨 Implement R2 mounting
- 🔨 Get OpenClaw running in Sandbox
- 🔨 Test single Sandbox

**Blockers:**
- ⚠️ Need to verify Sandbox limits
- ⚠️ Need to check pricing
- ⚠️ Need to test multi-tenancy

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- **[cloudflare/moltworker](https://github.com/cloudflare/moltworker)** - For proving OpenClaw works on Cloudflare
- **[openclaw/openclaw](https://github.com/openclaw/openclaw)** - For the amazing agent runtime
- **[lobehub/lobe-chat](https://github.com/lobehub/lobe-chat)** - For the beautiful UI we'll integrate

---

**Questions?** Check the [docs](./docs/) folder or open an issue on GitHub.
