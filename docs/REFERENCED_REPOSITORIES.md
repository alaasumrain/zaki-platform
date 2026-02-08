# Referenced Repositories

**Date:** 2026-02-03  
**List of all repositories explored/referenced for Zaki Platform**

---

## 🎯 Primary Reference (Main Inspiration)

### 1. **cloudflare/moltworker** ⭐⭐⭐⭐⭐
**URL:** https://github.com/cloudflare/moltworker  
**Stars:** 7,064+  
**Status:** Official Cloudflare implementation  
**Last Updated:** 2026-02-03

**What it is:**
- Official Cloudflare implementation of OpenClaw running on Cloudflare Workers + Sandboxes
- Single-tenant version (each user deploys their own instance)
- **This is what we're adapting for multi-tenant**

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

**What we learned:**
- How to initialize Sandboxes
- How to mount R2 storage
- How to start OpenClaw Gateway
- How to proxy requests (HTTP + WebSocket)
- Process management patterns

**Status:** ✅ **STUDIED** - We cloned and analyzed this repo

---

## 🔧 Core Dependencies

### 2. **openclaw/openclaw**
**URL:** https://github.com/openclaw/openclaw  
**Status:** Core agent runtime

**What it is:**
- OpenClaw agent runtime (formerly Moltbot, formerly Clawdbot)
- Personal AI assistant with gateway architecture
- This is what runs inside each user's Sandbox

**Key Features:**
- Gateway architecture
- Multi-channel support
- Device pairing
- Persistent conversations
- Agent runtime with workspace and skills

**Status:** ✅ **REFERENCED** - Used via npm package `clawdbot`

---

## 🎨 UI Integration

### 3. **lobehub/lobe-chat**
**URL:** https://github.com/lobehub/lobe-chat  
**Status:** Web UI for chat

**What it is:**
- Beautiful web-based chat interface
- We'll integrate this for the web UI

**Planned Integration:**
- Connect LobeChat to Workers API
- WebSocket proxy for real-time chat
- Route messages to user's Sandbox

**Status:** ⏳ **PLANNED** - Not yet integrated

---

## 📚 Reference Implementations

### 4. **jgarzik/botmaker**
**URL:** https://github.com/jgarzik/botmaker  
**Status:** Complete Guide to Building AI Agents

**What it is:**
- Guide/reference for building AI agents
- Educational resource

**Status:** ✅ **REFERENCED** - Listed in README as reference

---

### 5. **zscole/gru**
**URL:** https://github.com/zscole/gru  
**Status:** Multi-tenant AI agent platform reference

**What it is:**
- Multi-tenant AI agent platform
- **Similar to what we're building!**
- Good reference for multi-tenancy patterns

**Status:** ✅ **REFERENCED** - Listed in README as reference

---

## 🔍 Other Mentions

### Cloudflare Documentation
- **Cloudflare Sandboxes Docs** - https://developers.cloudflare.com/sandbox/
- **Cloudflare Workers Docs** - https://developers.cloudflare.com/workers/
- **Cloudflare AI Gateway** - https://developers.cloudflare.com/ai-gateway/
- **Cloudflare R2 Docs** - https://developers.cloudflare.com/r2/

### Blog Posts
- **Introducing Moltworker** - https://blog.cloudflare.com/moltworker-self-hosted-ai-agent
- **Build Agents on Cloudflare** - https://developers.cloudflare.com/agents/

---

## 📊 Repository Status Summary

| Repository | Type | Status | Usage |
|------------|------|--------|-------|
| cloudflare/moltworker | Reference | ✅ Studied | Main inspiration, cloned and analyzed |
| openclaw/openclaw | Dependency | ✅ Referenced | Core runtime, used via npm |
| lobehub/lobe-chat | Integration | ⏳ Planned | Web UI (not yet integrated) |
| jgarzik/botmaker | Reference | ✅ Referenced | Educational resource |
| zscole/gru | Reference | ✅ Referenced | Multi-tenant patterns |

---

## 🤔 Missing Repos?

**You mentioned "botbox"** - I don't see that in the current documentation. Could you mean:
- **botmaker** (jgarzik/botmaker)? 
- Or a different repository you explored?

**If you have other repos you explored**, please share them and I'll add them to this list!

---

## 📝 Notes

- **Moltworker** is our primary reference - we've studied it extensively
- **OpenClaw** is the core runtime we're using
- **LobeChat** is planned for web UI
- Other repos are references for patterns/learning

---

**Last Updated:** 2026-02-03
