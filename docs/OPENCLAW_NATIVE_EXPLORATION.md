# OpenClaw Native Exploration

**Date:** 2026-02-10  
**Purpose:** Explore official OpenClaw documentation and GitHub repos to ensure Zaki Platform stays native

---

## 🔍 Official OpenClaw Resources

### Main Repository
- **Repo:** [openclaw/openclaw](https://github.com/openclaw/openclaw)
- **Stars:** 180,277 ⭐
- **Description:** Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞
- **Homepage:** https://openclaw.ai
- **Docs:** https://docs.openclaw.ai
- **Topics:** ai, assistant, own-your-data, personal, crustacean, molty, openclaw

### Official Documentation Sites
- **Primary:** https://docs.openclaw.ai
- **Legacy:** https://docs.clawd.bot (older docs)
- **Legacy:** https://docs.molt.bot (older docs)
- **DeepWiki:** https://deepwiki.com/openclaw/openclaw

### Key GitHub Repositories

#### Core Repos
1. **openclaw/openclaw** (180K stars)
   - Main repository
   - Personal AI assistant framework
   - CLI + Gateway architecture

2. **openclaw/clawhub** (1,638 stars)
   - Skill Directory for OpenClaw
   - Registry of available skills
   - https://github.com/openclaw/clawhub

3. **openclaw/openclaw-ansible** (259 stars)
   - Automated, hardened installation
   - Tailscale VPN, UFW firewall, Docker isolation
   - https://github.com/openclaw/openclaw-ansible

4. **openclaw/nix-openclaw** (302 stars)
   - Nix packages for OpenClaw
   - https://github.com/openclaw/nix-openclaw

5. **openclaw/openclaw.ai** (151 stars)
   - Website repository
   - https://github.com/openclaw/openclaw.ai

#### Community Repos
- **VoltAgent/awesome-openclaw-skills** (12,573 stars) - Skill collection
- **cloudflare/moltworker** (8,300 stars) - Cloudflare Workers implementation
- **NevaMind-AI/memU** (8,662 stars) - Memory for proactive agents
- **SamurAIGPT/awesome-openclaw** (549 stars) - Curated resources

---

## 📚 Official Documentation Structure

### Core Concepts (from docs.openclaw.ai)

#### 1. **Sessions** (`docs.openclaw.ai/concepts/sessions`)
- Session management handles context and concurrency
- Session keys organize conversations by agent, channel, and group
- Session routing is deterministic - replies go back to originating channel
- Session files: `~/.openclaw/agents/<agentId>/sessions/`
- Session metadata: `sessions.json` tracks token usage, last route, etc.

#### 2. **Channel Routing** (`docs.openclaw.ai/concepts/provider-routing`)
- Replies route deterministically back to originating channel
- Supports: WhatsApp, Telegram, Discord, Slack, Google Chat, Signal, iMessage, BlueBubbles, Microsoft Teams, Matrix, Zalo, Zalo Personal, WebChat
- No manual routing needed - OpenClaw handles it natively

#### 3. **Session Management** (`docs.clawd.bot/reference/session-management-compaction`)
- Session routing and persistence
- Transcript structure and hygiene
- Context window management
- Compaction (manual and auto-compaction)

#### 4. **CLI Commands**
- `openclaw agent` - Run agent with message
- `openclaw agents` - List/manage agents
- `openclaw sessions` - Session management
- `openclaw gateway` - Start/stop gateway
- `openclaw logs` - View logs
- `openclaw health` - Health check
- `openclaw doctor` - Diagnose issues
- `openclaw message` - Send messages
- `openclaw models` - Model management

#### 5. **Background Processes** (`docs.clawd.bot/background-process`)
- `exec` tool - Run shell commands
- `process` tool - Manage background sessions
- Support for long-running tasks with timeout
- Background execution options

---

## 🏗️ Native OpenClaw Architecture

### Gateway Pattern
```
User → Channel (Telegram/WhatsApp/etc) → OpenClaw Gateway → Agent → Response
```

**Key Points:**
- Gateway is the control plane
- One gateway can handle multiple channels
- Channels are configured in `openclaw.json`
- Each channel has its own bot token/credentials
- Routing is automatic - no manual routing needed

### Session Lock Mechanism (Native)

**Location:** `/root/openclaw-source/src/agents/session-write-lock.ts`

**How it works:**
1. Process acquires lock by creating `.lock` file
2. Lock file contains: `{ pid, createdAt }`
3. Default timeout: 10 seconds (10,000ms)
4. Default stale timeout: 30 minutes
5. Lock released when process finishes

**Native behavior:**
- Prevents concurrent writes to same session file
- Automatic stale lock cleanup (checks if process is alive)
- Symlink-aware (handles symlinked session paths)
- Cleanup on process termination (SIGTERM, SIGINT, etc.)

**Our implementation should:**
- ✅ Respect OpenClaw's native lock mechanism
- ✅ Not bypass locks (would cause corruption)
- ✅ Handle lock timeouts gracefully
- ✅ Clean stale locks when detected
- ✅ Use OpenClaw's native retry logic

### Channel Configuration (Native)

**Native pattern:**
```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "user_provided_token"
    },
    "whatsapp": {
      "enabled": true,
      "allowFrom": ["+1234567890"]
    }
  }
}
```

**Key points:**
- Each channel is configured independently
- Bot tokens are stored in config (not in code)
- Pairing system for DMs (security)
- Group chat mention patterns

**Our implementation should:**
- ✅ Use OpenClaw's native channel config
- ✅ Let OpenClaw handle routing (don't build our own router)
- ✅ Support user-owned bot tokens (already planned)
- ✅ Use OpenClaw's pairing system for security

### Session Management (Native)

**Native pattern:**
- Sessions stored in: `~/.openclaw/agents/<agentId>/sessions/`
- Session files: `{sessionId}.jsonl`
- Session metadata: `sessions.json`
- Per-sender scope (default)
- Reset triggers: `/new`, `/reset`
- Auto-reset: daily, idle timeout

**Our implementation should:**
- ✅ Use OpenClaw's native session structure
- ✅ Store sessions in user's data directory
- ✅ Let OpenClaw handle session routing
- ✅ Support session reset commands

---

## 🚨 What We Should NOT Do (Stay Native)

### ❌ Don't Build Custom Router
**Why:** OpenClaw already handles routing natively
- Each channel connects directly to gateway
- Replies route back automatically
- No need for message relay layer

**Instead:** 
- ✅ Configure each user's container with their bot token
- ✅ Let OpenClaw gateway handle all routing
- ✅ Use OpenClaw's native channel system

### ❌ Don't Bypass Session Locks
**Why:** Would cause session file corruption
- Locks prevent concurrent writes
- Bypassing would corrupt session data
- OpenClaw's lock mechanism is battle-tested

**Instead:**
- ✅ Handle lock timeouts gracefully
- ✅ Retry with exponential backoff
- ✅ Clean stale locks when detected
- ✅ Use OpenClaw's native retry logic

### ❌ Don't Reimplement Channel Logic
**Why:** OpenClaw already has full channel support
- Telegram, WhatsApp, Discord, etc. all supported
- Pairing, security, group chat handling all built-in
- No need to reinvent the wheel

**Instead:**
- ✅ Use OpenClaw's native channel config
- ✅ Let OpenClaw handle all channel logic
- ✅ Configure channels per user

### ❌ Don't Build Custom Session Storage
**Why:** OpenClaw has native session management
- Session structure is well-defined
- Metadata tracking built-in
- Compaction, reset, routing all handled

**Instead:**
- ✅ Use OpenClaw's native session files
- ✅ Store in user's data directory
- ✅ Let OpenClaw manage sessions

---

## ✅ What We SHOULD Do (Native Approach)

### 1. **User-Owned Bot Tokens** ✅ (Already Planned)
- Each user creates their own bot via BotFather
- Token stored in their container's `openclaw.json`
- OpenClaw gateway handles all routing natively
- No router needed - direct connection

### 2. **Native Channel Configuration**
```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "{{user_bot_token}}"
    }
  }
}
```

### 3. **Native Session Management**
- Let OpenClaw handle all session logic
- Store sessions in user's data directory
- Use OpenClaw's native reset/compaction

### 4. **Native Gateway Pattern**
- One gateway per user container
- Gateway handles all channels
- No custom routing layer

### 5. **Handle Lock Errors Gracefully**
- Retry with exponential backoff
- Clean stale locks when detected
- Don't bypass locks (would corrupt data)

---

## 🔧 Implementation Recommendations

### Current Architecture (Router-Based)
```
User → @zakified_bot → Router → Container → OpenClaw Gateway → Response
```

**Issues:**
- Router sees all messages (privacy concern)
- No proactive messaging support
- Custom routing layer (not native)
- Session lock errors from concurrent requests

### Native Architecture (Recommended)
```
User → User's Bot → Container (OpenClaw Gateway) → Response
```

**Benefits:**
- ✅ Direct connection (no router)
- ✅ Full proactive messaging support
- ✅ Complete privacy (user owns token)
- ✅ Native OpenClaw design
- ✅ No session lock conflicts (one gateway per user)

### Migration Path

1. **Onboarding:** User creates bot via BotFather
2. **Container Setup:** Configure OpenClaw with user's bot token
3. **Gateway Start:** Start OpenClaw gateway in container
4. **Direct Connection:** User chats directly with their bot
5. **No Router:** OpenClaw handles all routing natively

---

## 📖 Key Documentation Links

### Official Docs
- Getting Started: https://docs.openclaw.ai/start/getting-started
- Onboarding: https://docs.openclaw.ai/start/onboarding
- Concepts: https://docs.openclaw.ai/concepts
- Session Management: https://docs.clawd.bot/reference/session-management-compaction
- Channel Routing: https://docs.clawd.bot/concepts/provider-routing
- Background Processes: https://docs.clawd.bot/background-process

### GitHub
- Main Repo: https://github.com/openclaw/openclaw
- ClawHub: https://github.com/openclaw/clawhub
- Ansible: https://github.com/openclaw/openclaw-ansible
- Nix: https://github.com/openclaw/nix-openclaw

---

## 🎯 Action Items

1. ✅ **Review OpenClaw native architecture** - Done
2. ✅ **Identify non-native patterns** - Done
3. ⏳ **Update router to use native channel config** - In progress
4. ⏳ **Migrate to user-owned bots** - Planned
5. ⏳ **Remove custom routing layer** - After migration
6. ⏳ **Use native session management** - Already using
7. ⏳ **Handle locks gracefully** - Already implemented

---

## 💡 Key Takeaways

1. **OpenClaw is designed for single-user instances** - One gateway = one user
2. **Routing is automatic** - No need for custom router
3. **Channels are native** - Configure per user, OpenClaw handles the rest
4. **Sessions are native** - Use OpenClaw's structure, don't reinvent
5. **Locks are necessary** - Handle gracefully, don't bypass
6. **User-owned bots = native design** - Matches OpenClaw's architecture perfectly

---

**Status:** Exploration complete. Ready to implement native patterns.
