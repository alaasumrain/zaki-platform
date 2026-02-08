# OpenClaw Documentation Priority Guide

**Date:** 2026-02-03  
**Purpose:** Prioritized reading list for Zaki Platform development

---

## 🎯 Strategy: Don't Read Everything!

**We don't need all docs right now.** Focus on what's relevant for Zaki Platform MVP.

---

## 🔥 Priority 1: Essential for MVP (Read Now)

### Core Concepts
- ✅ **Getting Started** - Already documented
- ✅ **Onboarding Wizard** - Already documented
- ✅ **Gateway Architecture** - Understand how Gateway works
- ✅ **Agent Runtime** - How agents process messages
- ✅ **Session Management** - Per-user sessions

### Implementation
- ✅ **Gateway Protocol** - WebSocket protocol for TUI/WebChat
- ✅ **Configuration** - Config file structure
- ✅ **Authentication** - How auth works

**Status:** ✅ Most of this already captured in `OPENCLAW_REFERENCE.md`

---

## 🟡 Priority 2: Important for Features (Read When Needed)

### Channels (Add as we implement)
- **Telegram** - When implementing Telegram support
- **WhatsApp** - When implementing WhatsApp support
- **Discord** - When implementing Discord support

### Tools & Skills
- **Tools** - When adding tool support
- **Skills** - When implementing skill marketplace
- **Plugins** - When adding plugin support

### Advanced Features
- **Multi-Agent Routing** - For future multi-agent support
- **Memory** - When implementing long-term memory
- **Heartbeat** - Already documented

---

## 🟢 Priority 3: Nice to Have (Read Later)

### Platform-Specific
- **macOS App** - Not relevant (we're web-based)
- **iOS App** - Not relevant (we're web-based)
- **Windows (WSL2)** - Not relevant (Cloudflare handles this)

### Advanced Concepts
- **Sandboxing** - Already understand basics
- **OAuth** - Already documented
- **Model Providers** - Reference as needed

### Operations
- **Gateway Runbook** - For production ops
- **Troubleshooting** - Reference when debugging
- **Security** - Already documented basics

---

## 📋 What We Already Have

### ✅ Documented in `OPENCLAW_REFERENCE.md`:
- Getting Started Flow
- Onboarding Wizard Details
- Personal Assistant Setup
- Pairing & Security
- Workspace Structure
- Session Management
- Heartbeats
- Media Handling
- Channel Configuration
- Auth & Credentials
- macOS App Onboarding Flow
- Agent Bootstrap Ritual

### ✅ Documented Elsewhere:
- `MOLTWORKER_LEARNINGS.md` - Sandbox patterns
- `OPENCLAW_ONBOARDING_FLOW.md` - Detailed onboarding
- `MARKET_VALIDATION.md` - Competitive analysis

---

## 🎯 Focus Areas for Zaki Platform

### Right Now (MVP):
1. **Gateway Protocol** - How to communicate with Gateway
2. **Configuration** - How to store/load user configs
3. **Session Management** - Per-user session handling
4. **Channel Basics** - Telegram/WhatsApp setup

### Soon (Post-MVP):
1. **Tools** - Adding tool support
2. **Skills** - Skill marketplace
3. **Memory** - Long-term memory
4. **Multi-Agent** - Advanced routing

---

## 💡 Reading Strategy

### Don't Read:
- ❌ Platform-specific docs (macOS, iOS, Windows)
- ❌ Deployment guides (Railway, Render, etc.) - We use Cloudflare
- ❌ Install guides - We're building SaaS, not installer
- ❌ Everything at once!

### Do Read (When Needed):
- ✅ Gateway Protocol - When implementing WebSocket client
- ✅ Channel docs - When adding that channel
- ✅ Tool docs - When adding tool support
- ✅ Troubleshooting - When debugging issues

---

## 📚 Quick Reference Links

**Keep these bookmarked, read when needed:**

### Essential:
- Gateway Protocol: `/gateway/protocol`
- Configuration: `/gateway/configuration`
- Session Management: `/concepts/sessions`

### Channels (Read when implementing):
- Telegram: `/channels/telegram`
- WhatsApp: `/channels/whatsapp`
- Discord: `/channels/discord`

### Tools (Read when adding):
- Tools: `/tools/tools`
- Skills: `/tools/skills`
- Plugins: `/tools/plugins`

---

## 🎯 Action Plan

### Phase 1: MVP (Now)
1. ✅ Understand Gateway Protocol (read when implementing WebSocket)
2. ✅ Understand Configuration (already documented)
3. ✅ Understand Sessions (already documented)
4. ✅ Implement basic channels (read channel docs as needed)

### Phase 2: Features (Later)
1. Read Tool docs when adding tool support
2. Read Skill docs when building marketplace
3. Read Memory docs when adding long-term memory

### Phase 3: Advanced (Future)
1. Read Multi-Agent docs
2. Read Advanced Routing docs
3. Read Security deep-dives

---

## 💡 Key Insight

**We don't need to read everything upfront!**

- Read docs **as we need them**
- Use our reference doc (`OPENCLAW_REFERENCE.md`) as primary source
- Reference official docs for specific implementation details
- Focus on **building**, not reading

---

## 📝 Documentation Tracker

### Already Captured:
- ✅ Onboarding flow
- ✅ Workspace structure
- ✅ Session management
- ✅ Pairing & security
- ✅ Heartbeats
- ✅ Media handling
- ✅ Channel basics
- ✅ Auth patterns

### Need to Read (When Implementing):
- ⏳ Gateway Protocol (WebSocket details)
- ⏳ Channel-specific implementations
- ⏳ Tool/Skill APIs
- ⏳ Memory system

### Can Skip:
- ❌ Platform-specific (macOS, iOS, Windows)
- ❌ Deployment guides (Railway, Render, etc.)
- ❌ Install guides
- ❌ Advanced features we don't need yet

---

**Bottom Line:** We have enough documentation to build MVP. Read more as we need specific features!
