# How OpenClaw Fits Into Zaki Platform Vision

**Date:** 2026-02-03  
**Purpose:** Explain how OpenClaw's architecture, features, and patterns map to Zaki Platform

---

## 🎯 The Core Vision

**OpenClaw** = Single-tenant personal AI assistant  
**Zaki Platform** = Multi-tenant version (many users, each gets isolated OpenClaw)

---

## 🏗️ Architecture Mapping

### OpenClaw Architecture
```
User's Device
    │
    ├─ WhatsApp/Telegram/Discord
    │         │
    │         ▼
    └─ Gateway (one per user)
           │
           └─ OpenClaw Agent
```

### Zaki Platform Architecture
```
Many Users
    │
    ├─ User 1 → WhatsApp/Telegram/Discord
    ├─ User 2 → WhatsApp/Telegram/Discord
    ├─ User 3 → WhatsApp/Telegram/Discord
    │         │
    │         ▼
    └─ Zaki Platform (Cloudflare Workers)
           │
           ├─ Sandbox user-1 → OpenClaw Gateway
           ├─ Sandbox user-2 → OpenClaw Gateway
           └─ Sandbox user-3 → OpenClaw Gateway
```

**Key Difference:** OpenClaw = one Gateway per user's machine. Zaki Platform = one Gateway per user's Sandbox (all on Cloudflare).

---

## 📋 Feature Mapping

### What We're Using from OpenClaw

#### ✅ Core Components (Direct Use)
- **OpenClaw Gateway** - Runs in each user's Sandbox
- **OpenClaw CLI** - Pre-installed in Dockerfile
- **Channel Support** - Telegram, WhatsApp, Discord (same protocols)
- **Session Management** - Per-user sessions in R2
- **Workspace Structure** - AGENTS.md, SOUL.md, etc. (per user in R2)
- **Auth Patterns** - API keys, OAuth tokens (per user)

#### ✅ Patterns We're Adapting
- **Onboarding Wizard** - Our web-based version
- **Pairing System** - Per-user pairing in R2
- **Multi-Agent Routing** - One agent per user (isolated)
- **Tool Support** - Skills/tools per user Sandbox
- **Media Handling** - Same patterns, per-user storage

#### ⚠️ What's Different
- **Gateway Location:** OpenClaw = user's machine, Zaki = Cloudflare Sandbox
- **Storage:** OpenClaw = local filesystem, Zaki = R2 (mounted to Sandbox)
- **Multi-tenancy:** OpenClaw = single user, Zaki = many users
- **Deployment:** OpenClaw = user deploys, Zaki = we deploy once

---

## 🔄 How It All Fits Together

### OpenClaw's Role in Zaki Platform

**OpenClaw is the runtime** that runs inside each user's Sandbox:

```
Zaki Platform User Flow:
1. User signs up → Gets Sandbox user-{userId}
2. Sandbox mounts R2 → user's persistent storage
3. Sandbox starts OpenClaw Gateway → Port 18789
4. User connects via Telegram/WhatsApp/Discord
5. Messages → Workers API → User's Sandbox → OpenClaw Gateway → Response
```

### What Each User Gets

Each user's Sandbox contains:
- ✅ OpenClaw Gateway (pre-installed via Dockerfile)
- ✅ Their own workspace (`users/{userId}/.openclaw/workspace` in R2)
- ✅ Their own config (`users/{userId}/.openclaw/openclaw.json` in R2)
- ✅ Their own sessions (`users/{userId}/.openclaw/agents/main/sessions/` in R2)
- ✅ Their own credentials (`users/{userId}/.openclaw/credentials/` in R2)
- ✅ Isolated from other users

---

## 📚 Documentation Mapping

### OpenClaw Docs → Zaki Platform Implementation

| OpenClaw Concept | Zaki Platform Implementation |
|-----------------|----------------------------|
| **Gateway** | Runs in each user's Sandbox (port 18789) |
| **Workspace** | `users/{userId}/.openclaw/workspace` (R2) |
| **Config** | `users/{userId}/.openclaw/openclaw.json` (R2) |
| **Sessions** | `users/{userId}/.openclaw/agents/main/sessions/` (R2) |
| **Channels** | Same protocols, routed through Workers API |
| **Pairing** | Per-user pairing state in R2 |
| **Onboarding** | Web-based wizard (similar flow) |
| **Auth** | Per-user API keys/tokens in R2 |
| **Skills** | Per-user skills in Sandbox |
| **Tools** | Per-user tool access in Sandbox |

---

## 🎯 Key Insights

### 1. OpenClaw is the Engine
- We're not replacing OpenClaw
- We're **wrapping** it in multi-tenant infrastructure
- Each user gets their own OpenClaw instance

### 2. Sandboxes Provide Isolation
- Cloudflare Sandboxes = isolated containers
- Each runs OpenClaw Gateway independently
- No cross-user data leakage

### 3. R2 Provides Persistence
- OpenClaw expects filesystem access
- R2 mounted as filesystem in Sandbox
- User data persists across Sandbox restarts

### 4. Workers Provide API Layer
- Users don't connect directly to Sandboxes
- Workers API routes to correct Sandbox
- Handles auth, rate limiting, etc.

---

## 🔧 Implementation Details

### How We Use OpenClaw

#### 1. Dockerfile
- Base: `cloudflare/sandbox:0.7.0`
- Install: Node.js 22, OpenClaw CLI
- Pre-configure: Directories, startup script

#### 2. Startup Script (`start-zaki.sh`)
- Mounts R2 to `~/.openclaw/`
- Restores config from R2
- Starts: `openclaw gateway --port 18789`

#### 3. Sandbox Management
- Each user = one Sandbox (`user-{userId}`)
- Sandbox mounts R2 bucket (user's data)
- Sandbox starts OpenClaw Gateway process
- Workers API proxies requests to Sandbox

#### 4. Request Flow
```
User Message (Telegram)
    ↓
Workers API (/api/chat)
    ↓
Extract userId
    ↓
Get Sandbox stub (user-{userId})
    ↓
Proxy to Sandbox Gateway (containerFetch/wsConnect)
    ↓
OpenClaw Gateway (port 18789)
    ↓
OpenClaw Agent (processes message)
    ↓
Response back through same path
```

---

## 📖 Documentation We're Using

### Essential Docs (Already Captured)
- ✅ Getting Started - Onboarding flow
- ✅ Onboarding Wizard - Setup patterns
- ✅ Gateway Architecture - How Gateway works
- ✅ Session Management - Per-user sessions
- ✅ Pairing - Security patterns
- ✅ Workspace Structure - File organization
- ✅ Channel Integration - Telegram/WhatsApp/Discord

### Reference Docs (As Needed)
- Gateway Protocol - WebSocket details (when building client)
- Channel APIs - Implementation details (when adding channels)
- Tool/Skill APIs - When adding tool support
- Memory System - When adding long-term memory

### Can Skip
- ❌ Platform-specific (macOS, iOS, Windows) - We're web-based
- ❌ Deployment guides (Railway, Render) - We use Cloudflare
- ❌ Install guides - We're SaaS, not installer

---

## 🎯 The Big Picture

### OpenClaw's Value to Zaki Platform

1. **Proven Runtime**
   - OpenClaw is battle-tested
   - Handles channels, sessions, tools
   - We don't need to rebuild this

2. **Rich Feature Set**
   - Multi-channel support
   - Tool/skill ecosystem
   - Session management
   - Media handling

3. **Active Development**
   - OpenClaw is actively maintained
   - We benefit from updates
   - Community support

4. **Documentation**
   - Comprehensive docs
   - Patterns we can follow
   - Best practices

### What We Add

1. **Multi-Tenancy**
   - One platform, many users
   - Isolated Sandboxes
   - Per-user storage

2. **Cloud Infrastructure**
   - Cloudflare Workers (edge)
   - Cloudflare Sandboxes (isolation)
   - R2 Storage (persistence)

3. **Easy Onboarding**
   - Web-based wizard
   - No technical setup
   - Automated Sandbox creation

4. **Scalability**
   - Auto-scaling Sandboxes
   - Global edge network
   - Pay-per-use model

---

## 💡 Key Takeaways

### OpenClaw = The What
- **What** runs in each Sandbox
- **What** handles channels, sessions, tools
- **What** processes messages

### Zaki Platform = The How
- **How** to run OpenClaw for many users
- **How** to isolate users (Sandboxes)
- **How** to persist data (R2)
- **How** to scale (Cloudflare)

### Together = Complete Solution
- OpenClaw provides the AI agent runtime
- Zaki Platform provides the multi-tenant infrastructure
- Users get personal AI assistants without setup

---

## 🚀 Vision Alignment

### OpenClaw's Vision
> "Personal AI assistant - one per user, runs on their machine"

### Zaki Platform's Vision
> "Personal AI assistant - one per user, runs in the cloud, no setup needed"

### The Fit
- **Same goal:** Personal AI assistants
- **Different approach:** Local vs Cloud
- **Our advantage:** No setup, multi-tenant, scalable

---

## 📝 Summary

**OpenClaw is perfect for Zaki Platform because:**

1. ✅ It's the runtime we need (AI agent with channels)
2. ✅ It's well-documented (we can follow patterns)
3. ✅ It's actively maintained (we benefit from updates)
4. ✅ It's feature-rich (channels, tools, sessions)
5. ✅ It's designed for isolation (works in Sandboxes)

**We're not replacing OpenClaw - we're making it accessible to everyone through multi-tenant cloud infrastructure.**

---

**Bottom Line:** OpenClaw is the engine, Zaki Platform is the infrastructure that makes it available to everyone. Perfect fit! 🎯
