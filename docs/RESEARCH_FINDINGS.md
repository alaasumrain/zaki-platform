# Zaki Platform - Research Findings

**Date:** 2026-02-03  
**Status:** ✅ Research Complete

---

## 📊 Executive Summary

| Question | Answer | Impact |
|----------|--------|--------|
| Can we afford Sandboxes? | ✅ YES | ~$0.50-2/user/month active |
| Does LobeChat fit? | ⚠️ PARTIAL | Good UI, but we don't need it |
| What's the MVP? | Telegram-first | Skip LobeChat for now |

---

## 🏗️ Cloudflare Containers/Sandboxes

### Pricing (CRITICAL) ✅ ANSWERED

**Base Cost:** $5/month Workers Paid plan (required)

**Included Monthly:**
- 25 GiB-hours memory
- 375 vCPU-minutes
- 200 GB-hours disk

**Overage Rates:**
| Resource | Rate |
|----------|------|
| Memory | $0.0000025/GiB-second |
| CPU | $0.000020/vCPU-second |
| Disk | $0.00000007/GB-second |

**Instance Types:**
| Type | vCPU | Memory | Disk | Best For |
|------|------|--------|------|----------|
| lite | 1/16 | 256 MiB | 2 GB | Testing |
| basic | 1/4 | 1 GiB | 4 GB | Light users |
| standard-1 | 1/2 | 4 GiB | 8 GB | **Most users** |
| standard-4 | 4 | 12 GiB | 20 GB | Power users |

### Per-User Cost Estimate

**Scenario: User active 2 hours/day, standard-1 instance**

```
Memory:  4 GiB × 2 hours × 30 days = 240 GiB-hours
         240 - 25 (included) = 215 GiB-hours overage
         215 × 3600 sec × $0.0000025 = $1.94

CPU:     0.5 vCPU × 2 hours × 30 days = 30 vCPU-hours = 1800 vCPU-min
         1800 - 375 (included) = 1425 vCPU-min overage
         1425 × 60 sec × $0.000020 = $1.71

Disk:    8 GB × 2 hours × 30 days = 480 GB-hours
         480 - 200 (included) = 280 GB-hours overage
         280 × 3600 sec × $0.00000007 = $0.07

TOTAL:   ~$3.72/user/month (active 2 hrs/day)
```

**Better Scenario: Sleep when idle (pay only when active)**
```
Memory:  4 GiB × 30 min/day × 30 days = 60 GiB-hours
         All within included! = $0

TOTAL:   ~$0-1/user/month (typical light usage)
```

### Limits

| Resource | Limit |
|----------|-------|
| Concurrent memory | 400 GiB |
| Concurrent vCPU | 100 |
| Concurrent disk | 2 TB |
| Image size | Same as instance disk |
| Total image storage | 50 GB/account |

**Capacity:** With standard-1 (4 GiB), can run ~100 concurrent Sandboxes.

### Key Insights

1. **Scale to Zero:** Sandboxes can sleep when idle → minimal cost
2. **Cold Start:** ~1-2 minutes to start a sleeping Sandbox
3. **Keep-Alive Option:** Pay more for instant response
4. **Multi-Tenant Feasible:** 100+ concurrent users possible

---

## 💾 R2 Storage Pricing

**Free Tier:**
- 10 GB-month storage
- 1M Class A ops (writes)
- 10M Class B ops (reads)
- **Free egress** (no data transfer charges!)

**Paid Rates:**
| Resource | Rate |
|----------|------|
| Storage | $0.015/GB-month |
| Class A ops | $4.50/million |
| Class B ops | $0.36/million |

**Per-User Estimate:**
- 100 MB workspace/user → $0.0015/user/month
- Essentially free for small workspaces

---

## 🖥️ Workers Pricing

**Free Tier:**
- 100,000 requests/day
- 10ms CPU time/request

**Paid ($5/month includes):**
- 10M requests/month
- 30M CPU-ms/month

**Overage:**
- $0.30/million requests
- $0.02/million CPU-ms

**Capacity:** 10M requests = ~330K requests/day = plenty for MVP

---

## 🎨 LobeChat Analysis

### What is LobeChat?

**Type:** Open-source AI chat framework  
**License:** Apache 2.0 (can modify, commercial use OK)  
**Tech Stack:** Next.js, React, TypeScript  
**Stars:** 50K+ on GitHub

### Features

| Feature | Has It? | Notes |
|---------|---------|-------|
| Web chat UI | ✅ | Beautiful, modern |
| Multi-model support | ✅ | OpenAI, Anthropic, etc. |
| Plugin system (MCP) | ✅ | 10,000+ plugins |
| File upload | ✅ | Knowledge base |
| Voice (TTS/STT) | ✅ | Built-in |
| Multi-user | ✅ | With auth providers |
| Telegram integration | ❌ | Web-only |
| WhatsApp integration | ❌ | Web-only |
| Discord integration | ❌ | Web-only |

### Architecture

```
LobeChat (Next.js)
    ↓
OpenAI-compatible API
    ↓
LLM Provider (Anthropic, OpenAI, etc.)
```

**Key Point:** LobeChat connects directly to LLM APIs. It does NOT connect to custom backends like OpenClaw Gateway.

### Deployment Options

1. **Vercel** - One-click deploy (recommended)
2. **Docker** - Self-hosted
3. **Cloudflare Pages** - Possible but not official

### Database Support

- **Local:** IndexedDB (browser storage)
- **Server:** PostgreSQL + S3 (for multi-user)
- **Auth:** Clerk, NextAuth, Casdoor

### Verdict for Zaki Platform

**Recommendation: Don't use LobeChat** ❌

**Reasons:**
1. LobeChat is for direct LLM access, not for connecting to OpenClaw Gateway
2. We already have channels (Telegram) working via OpenClaw
3. LobeChat adds complexity without solving our problem
4. We'd need to heavily modify it to work with Sandboxes

**Alternative:**
- Use OpenClaw's built-in Control UI for web access
- Or build a simple custom web UI later
- Focus on Telegram/WhatsApp first (already works!)

---

## 🔌 OpenClaw Gateway Protocol

### Connection Methods

| Method | Protocol | Use Case |
|--------|----------|----------|
| HTTP | REST | Simple requests |
| WebSocket | WS | Real-time chat |
| Telegram | Bot API | Mobile messaging |
| WhatsApp | Web API | Mobile messaging |

### Gateway API

**Health Check:**
```
GET /health → { status: "ok" }
```

**Chat (WebSocket):**
```
ws://localhost:18789/
→ Send/receive JSON messages
```

**Our Implementation:**
```
User → Workers API → Sandbox → OpenClaw Gateway
                              ↓
                         LLM (Anthropic)
```

### Multi-Tenancy

- ✅ One Gateway per Sandbox (isolated)
- ✅ Each user gets own Sandbox
- ✅ R2 storage per user (prefixed)
- ✅ Channels route through Gateway

---

## 💰 Business Model

### Cost Structure (Per User)

| Component | Light User | Active User | Power User |
|-----------|------------|-------------|------------|
| Sandbox | $0-0.50/mo | $1-2/mo | $3-5/mo |
| R2 Storage | ~$0 | ~$0.01/mo | ~$0.05/mo |
| Workers | ~$0 | ~$0 | ~$0.10/mo |
| **Total** | **~$0.50** | **~$2** | **~$5** |

**Note:** Plus AI API costs (user provides own key or we bill)

### Pricing Tiers (Recommendation)

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | 100 msgs/month, sleeps after 5min |
| Pro | $10/mo | Unlimited, keep-alive, priority |
| Team | $25/mo | Multi-user workspace, shared agents |

### Break-Even Analysis

| Tier | Our Cost | Price | Margin |
|------|----------|-------|--------|
| Free | ~$0.50 | $0 | -$0.50 (loss leader) |
| Pro | ~$2 | $10 | +$8 (80%) |
| Team | ~$5 | $25 | +$20 (80%) |

**Verdict:** Business model works with subscription pricing.

---

## 🔐 Security

### Sandbox Isolation

- ✅ Each Sandbox is isolated container
- ✅ Cannot access other Sandboxes
- ✅ Network isolated by default
- ✅ R2 access via credentials only

### Authentication Options

1. **Device Pairing** (OpenClaw built-in) - Code-based
2. **OAuth** (Clerk, NextAuth) - For web UI
3. **API Keys** - For programmatic access

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Resource abuse | Rate limits, usage caps |
| Data leakage | Per-user R2 prefix isolation |
| Sandbox escape | Cloudflare's container security |
| API key theft | Store encrypted in R2 |

---

## 📱 Channel Support

### Current (via OpenClaw)

| Channel | Status | Setup |
|---------|--------|-------|
| Telegram | ✅ Working | Bot token |
| WhatsApp | ✅ Supported | QR code login |
| Discord | ✅ Supported | Bot token |
| Signal | ✅ Supported | signal-cli |
| Web UI | ✅ Control UI | Built-in |

### For Zaki Platform

**MVP:** Telegram only  
**Phase 2:** Add WhatsApp, Discord  
**Phase 3:** Custom web UI

---

## 🎯 MVP Recommendation

### What to Build

1. **Workers API** - Route requests to user Sandboxes ✅ Done
2. **Sandbox Manager** - Create/manage user Sandboxes ✅ Done
3. **Onboarding Flow** - Sign up → Create Sandbox → Connect Telegram
4. **Billing** - Track usage, Stripe integration

### What NOT to Build

- ❌ LobeChat integration (not needed)
- ❌ Custom web chat UI (use Control UI)
- ❌ Multi-channel from day one (start with Telegram)

### Timeline

| Week | Milestone |
|------|-----------|
| 1 | Deploy & test single Sandbox |
| 2 | Add user onboarding flow |
| 3 | Add usage tracking |
| 4 | Beta launch (Telegram only) |

---

## 🎯 Key Decisions

### 1. Use LobeChat?
**Decision:** NO  
**Reason:** Doesn't fit our architecture, adds complexity

### 2. Which channels first?
**Decision:** Telegram only for MVP  
**Reason:** Already working, easiest setup

### 3. How to handle cold starts?
**Decision:** Accept 1-2 min cold start for free tier  
**Reason:** Cost savings, acceptable UX for free users

### 4. Pricing model?
**Decision:** Freemium + subscription  
**Reason:** Proven model, good margins

---

## 📝 Next Steps

1. ✅ Research complete
2. 🔨 Deploy to Cloudflare (test single Sandbox)
3. 🔨 Test cold start times
4. 🔨 Build onboarding flow
5. 🔨 Add Stripe billing
6. 🔨 Beta launch

---

## 📚 Sources

- [Cloudflare Containers Pricing](https://developers.cloudflare.com/containers/pricing/)
- [Cloudflare Containers Limits](https://developers.cloudflare.com/containers/platform-details/limits/)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [LobeChat GitHub](https://github.com/lobehub/lobehub)
- [Moltworker (reference implementation)](https://github.com/cloudflare/moltworker)

---

**Last Updated:** 2026-02-03
