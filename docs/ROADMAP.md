# Zaki Platform Roadmap

**Last Updated:** 2026-02-03

---

## 🎯 Vision

> **Zaki** - Your personal AI assistant. One brain, every platform.

Full-service personal AI that works on the Zaki App AND Telegram/WhatsApp/Discord. Same memory, same context, everywhere you go.

---

## 📊 Business Model

| Tier | Price | Messages | Channels |
|------|-------|----------|----------|
| **Free** | $0 | 50/mo | Telegram |
| **Starter** | $19/mo | 500/mo | All |
| **Pro** | $39/mo | 2000/mo | All + Priority |
| **BYOK** | $9/mo | Unlimited* | All |

*BYOK = Bring Your Own Key (user provides Anthropic API key)

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ IN PROGRESS
**Goal:** Working Telegram bot with user isolation

| Task | Status | Notes |
|------|--------|-------|
| Core architecture | ✅ Done | Workers + Sandboxes + R2 |
| Sandbox management | ✅ Done | Create, mount, start |
| OpenClaw integration | ✅ Done | Gateway in Sandbox |
| Dockerfile | ✅ Done | Node 22 + clawdbot |
| Research & planning | ✅ Done | Pricing, architecture |
| Deploy to Cloudflare | 🔨 Next | Test single Sandbox |
| Telegram onboarding | 🔨 Next | Sign up flow |
| Usage tracking | ⏳ Todo | Message counts |
| Stripe billing | ⏳ Todo | Subscription management |

### Phase 2: Multi-Channel
**Goal:** Zaki Web App + WhatsApp

| Task | Status | Notes |
|------|--------|-------|
| Zaki Web App | ⏳ Todo | Custom chat UI |
| WhatsApp integration | ⏳ Todo | Via OpenClaw channel |
| Unified history | ⏳ Todo | Same memory everywhere |
| User dashboard | ⏳ Todo | Settings, usage, billing |

### Phase 3: Native & Enterprise
**Goal:** iOS/Android apps, team features

| Task | Status | Notes |
|------|--------|-------|
| iOS app | ⏳ Todo | Native Swift |
| Android app | ⏳ Todo | Native Kotlin |
| Discord integration | ⏳ Todo | Bot + server support |
| Slack integration | ⏳ Todo | Workspace apps |
| Team workspaces | ⏳ Todo | Shared agents |

---

## 🔨 Current Sprint: MVP

### This Week
1. Deploy to Cloudflare - test single Sandbox works
2. Test cold start times
3. Build basic onboarding (Telegram → Sandbox)

### Next Week
1. Add usage tracking
2. Integrate Stripe
3. Beta launch to small group

---

## 📦 Features - What Ships

### Day 1 (MVP)
- ✅ Telegram access
- ✅ Persistent memory
- ✅ Web browsing
- ✅ File handling
- ✅ Code execution
- ✅ Voice messages

### Phase 2
- Zaki Web App
- WhatsApp
- Custom skills

### Phase 3
- iOS/Android apps
- Discord/Slack
- Team features

---

## 📈 Success Metrics

| Metric | MVP Target | Phase 2 Target |
|--------|------------|----------------|
| Users | 100 beta | 1,000 |
| Paid conversion | 10% | 15% |
| Monthly revenue | $500 | $5,000 |
| Churn | <10% | <5% |

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| High AI costs | Low margin | Smart model routing, BYOK option |
| Cold start UX | User frustration | Keep-alive for paid, accept for free |
| Sandbox limits | Can't scale | Monitor, request limit increase |
| Competition | User loss | Differentiate on multi-channel + memory |

---

## 📝 Decisions Made

| Decision | Date | Rationale |
|----------|------|-----------|
| Skip LobeChat | 2026-02-03 | Doesn't fit architecture |
| Telegram first | 2026-02-03 | Already working, easiest |
| $19/mo Starter | 2026-02-03 | Covers costs with margin |
| BYOK option | 2026-02-03 | Power users, zero AI cost risk |
| Full service | 2026-02-03 | Not a wrapper, real value |

---

**Next Update:** After MVP deployment
