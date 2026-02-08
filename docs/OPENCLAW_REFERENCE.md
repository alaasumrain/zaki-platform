# OpenClaw Reference - Complete Patterns & Concepts

**Date:** 2026-02-03  
**Purpose:** Comprehensive reference of OpenClaw patterns, concepts, and implementation details for Zaki Platform

---

## 📚 Table of Contents

1. [Getting Started Flow](#getting-started-flow)
2. [Onboarding Wizard Details](#onboarding-wizard-details)
3. [Personal Assistant Setup](#personal-assistant-setup)
4. [Pairing & Security](#pairing--security)
5. [Workspace Structure](#workspace-structure)
6. [Session Management](#session-management)
7. [Heartbeats](#heartbeats)
8. [Media Handling](#media-handling)
9. [Channel Configuration](#channel-configuration)
10. [Auth & Credentials](#auth--credentials)

---

## 🚀 Getting Started Flow

### Fastest Path to First Chat

**Option 1: Control UI (No channel setup needed)**
```bash
openclaw dashboard
# Opens http://127.0.0.1:18789/ in browser
```

**Option 2: CLI Onboarding Wizard**
```bash
openclaw onboard --install-daemon
```

### What Onboarding Sets Up

- ✅ Model/auth (OAuth recommended)
- ✅ Gateway settings
- ✅ Channels (WhatsApp/Telegram/Discord/Mattermost)
- ✅ Pairing defaults (secure DMs)
- ✅ Workspace bootstrap + skills
- ✅ Optional background service

---

## 🧙 Onboarding Wizard Details

### QuickStart vs Advanced

**QuickStart (defaults):**
- Local gateway (loopback)
- Workspace default (or existing)
- Gateway port 18789
- Gateway auth Token (auto-generated)
- Tailscale exposure Off
- Telegram + WhatsApp DMs default to allowlist

**Advanced:**
- Exposes every step
- Full control over all settings

### Flow Details

#### 1. Existing Config Detection
- If `~/.openclaw/openclaw.json` exists: Keep / Modify / Reset
- Re-running doesn't wipe unless Reset chosen
- Invalid config → run `openclaw doctor` first

#### 2. Model/Auth Options

**Anthropic:**
- API key (recommended): Uses `ANTHROPIC_API_KEY` or prompts
- OAuth (Claude Code CLI): Checks Keychain (macOS) or `~/.claude/.credentials.json`
- Token (paste setup-token): Run `claude setup-token`, paste token

**OpenAI:**
- Code (Codex) subscription OAuth: Browser flow
- API key: Uses `OPENAI_API_KEY` or prompts

**Other Providers:**
- Vercel AI Gateway
- MiniMax M2.1
- Moonshot (Kimi K2)
- Synthetic (Anthropic-compatible)
- OpenCode Zen

#### 3. Workspace
- Default: `~/.openclaw/workspace`
- Seeds bootstrap files (AGENTS.md, SOUL.md, TOOLS.md, etc.)
- Auto-initializes git repo if git installed

#### 4. Gateway
- Port, bind, auth mode, tailscale exposure
- Auth recommendation: Keep Token even for loopback
- Non-loopback binds require auth

#### 5. Channels
- **WhatsApp:** QR login
- **Telegram:** Bot token
- **Discord:** Bot token
- **Google Chat:** Service account JSON + webhook
- **Mattermost:** Bot token + base URL
- **Signal:** signal-cli install + account config
- **iMessage:** Local imsg CLI path + DB access

**DM Security:** Default is pairing. First DM sends code; approve via `openclaw pairing approve <channel> <code>`

#### 6. Daemon Install
- **macOS:** LaunchAgent (requires logged-in session)
- **Linux/WSL2:** systemd user unit
- Enables lingering so Gateway stays up after logout
- Runtime: Node (recommended; required for WhatsApp/Telegram)

#### 7. Skills
- Reads available skills
- Checks requirements
- Node manager: npm / pnpm (bun not recommended)
- Installs optional dependencies (some use Homebrew)

### Non-Interactive Mode

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

---

## 👤 Personal Assistant Setup

### Two-Phone Setup (Recommended)

```
Your Phone (personal)          Second Phone (assistant)
┌─────────────────┐           ┌─────────────────┐
│  Your WhatsApp  │  ──────▶  │  Assistant WA   │
│  +1-555-YOU     │  message  │  +1-555-ASSIST  │
└─────────────────┘           └────────┬────────┘
                                       │ linked via QR
                                       ▼
                              ┌─────────────────┐
                              │  Your Mac       │
                              │  (openclaw)      │
                              │    Pi agent     │
                              └─────────────────┘
```

**Why:** If you link personal WhatsApp, every message becomes "agent input" - rarely what you want.

### 5-Minute Quick Start

```bash
# 1. Pair WhatsApp Web (shows QR)
openclaw channels login

# 2. Start Gateway
openclaw gateway --port 18789

# 3. Minimal config
# ~/.openclaw/openclaw.json
{
  channels: { 
    whatsapp: { 
      allowFrom: ["+15555550123"] 
    } 
  }
}
```

### Assistant Config Example

```json
{
  "logging": { "level": "info" },
  "agent": {
    "model": "anthropic/claude-opus-4-5",
    "workspace": "~/.openclaw/workspace",
    "thinkingDefault": "high",
    "timeoutSeconds": 1800,
    "heartbeat": { "every": "0m" }  // Start with 0; enable later
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"],
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "routing": {
    "groupChat": {
      "mentionPatterns": ["@openclaw", "openclaw"]
    }
  },
  "session": {
    "scope": "per-sender",
    "resetTriggers": ["/new", "/reset"],
    "reset": {
      "mode": "daily",
      "atHour": 4,
      "idleMinutes": 10080
    }
  }
}
```

---

## 🔐 Pairing & Security

### DM Pairing (Inbound Chat Access)

**Default:** Unknown senders get pairing code, message not processed until approved.

**Pairing Codes:**
- 8 characters, uppercase
- No ambiguous chars (0O1I)
- Expire after 1 hour
- Capped at 3 pending requests per channel

**Approve a sender:**
```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

**Supported channels:** telegram, whatsapp, signal, imessage, discord, slack

**State Storage:**
- Pending: `~/.openclaw/credentials/<channel>-pairing.json`
- Approved: `~/.openclaw/credentials/<channel>-allowFrom.json`

### Node Device Pairing

**Approve a node device:**
```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

**State Storage:**
- `~/.openclaw/devices/pending.json` (short-lived)
- `~/.openclaw/devices/paired.json` (paired devices + tokens)

### Security Best Practices

- ✅ Always set `channels.whatsapp.allowFrom` (never open-to-the-world)
- ✅ Use dedicated WhatsApp number for assistant
- ✅ Start with heartbeats disabled (`heartbeat.every: "0m"`)
- ✅ Use pairing for unknown DMs
- ✅ Require mentions in group chats

---

## 📁 Workspace Structure

### Default Workspace: `~/.openclaw/workspace`

**Bootstrap Files (auto-created):**
- `AGENTS.md` - Agent instructions
- `SOUL.md` - Persona/instructions
- `TOOLS.md` - Available tools
- `IDENTITY.md` - Agent identity
- `USER.md` - User context
- `BOOTSTRAP.md` - Only created when workspace is brand new

**Tip:** Make workspace a git repo (ideally private) for backup.

**Custom Workspace:**
```json
{
  "agent": {
    "workspace": "~/.openclaw/workspace"
  }
}
```

**Disable Bootstrap:**
```json
{
  "agent": {
    "skipBootstrap": true
  }
}
```

---

## 💬 Session Management

### Session Files

**Location:** `~/.openclaw/agents/<agentId>/sessions/`

**Files:**
- `{{SessionId}}.jsonl` - Session conversation
- `sessions.json` - Session metadata (token usage, last route, etc.)

### Session Commands

- `/new` or `/reset` - Start fresh session
- `/compact [instructions]` - Compact session context

### Session Scope

**Per-sender (default):**
```json
{
  "session": {
    "scope": "per-sender"
  }
}
```

**Reset Triggers:**
```json
{
  "session": {
    "resetTriggers": ["/new", "/reset"],
    "reset": {
      "mode": "daily",
      "atHour": 4,
      "idleMinutes": 10080
    }
  }
}
```

---

## 💓 Heartbeats (Proactive Mode)

**Default:** Every 30 minutes

**Prompt:** "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK."

**Behavior:**
- If `HEARTBEAT.md` exists but empty → skips heartbeat (saves API calls)
- If file missing → heartbeat still runs
- If agent replies `HEARTBEAT_OK` → suppresses outbound delivery

**Config:**
```json
{
  "agent": {
    "heartbeat": { 
      "every": "30m",
      "ackMaxChars": 50  // Optional padding limit
    }
  }
}
```

**Disable:**
```json
{
  "agent": {
    "heartbeat": { "every": "0m" }
  }
}
```

---

## 🎬 Media Handling

### Inbound Attachments

**Templates available:**
- `{{MediaPath}}` - Local temp file path
- `{{MediaUrl}}` - Pseudo-URL
- `{{Transcript}}` - Audio transcription (if enabled)

### Outbound Attachments

**Format:** Include `MEDIA:<path-or-url>` on its own line (no spaces)

**Example:**
```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw extracts and sends as media alongside text.

---

## 📡 Channel Configuration

### WhatsApp

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "allowFrom": ["+15555550123"],
      "groups": {
        "*": { "requireMention": true }
      }
    }
  }
}
```

**Setup:**
```bash
openclaw channels login  # Shows QR code
```

### Telegram

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "123456:ABC..."
    }
  }
}
```

**Setup:** Get token from @BotFather

### Discord

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "your-bot-token"
    }
  }
}
```

### Group Chat Routing

```json
{
  "routing": {
    "groupChat": {
      "mentionPatterns": ["@openclaw", "openclaw"]
    }
  }
}
```

---

## 🔑 Auth & Credentials

### Auth Storage Locations

**OAuth credentials (legacy):**
- `~/.openclaw/credentials/oauth.json`

**Auth profiles (OAuth + API keys):**
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

**Environment variables:**
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `AI_GATEWAY_API_KEY`

### Anthropic Auth Methods

1. **API Key (recommended):**
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

2. **OAuth (Claude Code CLI):**
   - macOS: Keychain item "Claude Code-credentials"
   - Linux: `~/.claude/.credentials.json`

3. **Token (paste setup-token):**
   ```bash
   claude setup-token
   # Paste token into onboarding wizard
   ```

---

## 🛠️ Operations

### Status Commands

```bash
openclaw status          # Local status
openclaw status --all    # Full diagnosis (read-only, pasteable)
openclaw status --deep  # Adds gateway health probes
openclaw health --json   # Gateway health snapshot (WS)
```

### Logs

**Location:** `/tmp/openclaw/openclaw-YYYY-MM-DD.log`

### Gateway Commands

```bash
openclaw gateway status  # Check if running
openclaw gateway --port 18789 --verbose  # Manual start
openclaw dashboard       # Open Control UI
```

---

## 🍎 macOS App Onboarding Flow

### Page Order (Current)

1. **Welcome + Security Notice**
   - Read security notice
   - User decides to proceed

2. **Gateway Selection**
   - **Local (this Mac):** OAuth flows work, credentials written locally
   - **Remote (SSH/Tailnet):** No local OAuth; credentials must exist on gateway host
   - **Configure later:** Skip setup, leave app unconfigured

   **Gateway Auth Tip:**
   - Wizard generates token even for loopback (local WS clients must authenticate)
   - Disable auth only on fully trusted machines
   - Use token for multi-machine access or non-loopback binds

3. **Local-Only Auth (Anthropic OAuth)**
   - macOS app supports Anthropic OAuth (Claude Pro/Max)
   - Flow: Opens browser for OAuth (PKCE)
   - User pastes `code#state` value
   - Writes to `~/.openclaw/credentials/oauth.json`
   - Other providers: Configure via env vars or config files

4. **Setup Wizard (Gateway-Driven)**
   - App runs same wizard as CLI
   - Keeps onboarding in sync with Gateway-side behavior
   - Avoids duplicating logic in SwiftUI

5. **Permissions**
   - Requests TCC permissions:
     - Notifications
     - Accessibility
     - Screen Recording
     - Microphone / Speech Recognition
     - Automation (AppleScript)

6. **CLI (Optional)**
   - App can install global `openclaw` CLI via npm/pnpm
   - Enables terminal workflows and launchd tasks

7. **Onboarding Chat (Dedicated Session)**
   - After setup, opens dedicated onboarding chat
   - Agent introduces itself and guides next steps
   - Keeps first-run guidance separate from normal conversation

---

## 🤖 Agent Bootstrap Ritual

### First Agent Run

**When:** On first agent run, OpenClaw bootstraps workspace (default `~/.openclaw/workspace`)

**Process:**
1. **Seeds files:**
   - `AGENTS.md`
   - `BOOTSTRAP.md`
   - `IDENTITY.md`
   - `USER.md`

2. **Runs Q&A ritual:**
   - One question at a time
   - Short, focused questions

3. **Writes identity + preferences:**
   - `IDENTITY.md` - Agent identity
   - `USER.md` - User preferences
   - `SOUL.md` - Persona/instructions

4. **Removes `BOOTSTRAP.md`:**
   - Only runs once
   - File removed when finished

**Purpose:** Personalizes the agent for the user without overwhelming them.

---

## 🔗 Optional: Gmail Hooks (Manual)

**Setup:**
```bash
openclaw webhooks gmail setup --account you@gmail.com
```

**Details:** See `/automation/gmail-pubsub` for full documentation.

---

## 🌐 Remote Mode Notes

**When Gateway runs on another machine:**

- Credentials live on gateway host: `~/.openclaw/credentials/oauth.json`
- Workspace files live on gateway host: `~/.openclaw/workspace`
- Agent profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

**For OAuth in remote mode:**
- Create credentials on gateway host first
- Or copy from local machine

**Exposing OpenClaw Securely:**
- See [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) for a complete guide on exposing OpenClaw to the internet using Cloudflare Tunnels and Workers VPC without opening ports on your router

---

## 🎯 Zaki Platform Implementation Notes

### Per-User Equivalents

**Workspace:**
- Zaki: `users/{userId}/.openclaw/workspace` (in R2, mounted to Sandbox)

**Sessions:**
- Zaki: `users/{userId}/.openclaw/agents/main/sessions/` (in R2)

**Credentials:**
- Zaki: `users/{userId}/.openclaw/credentials/` (in R2, encrypted)

**Config:**
- Zaki: `users/{userId}/.openclaw/openclaw.json` (in R2)

### Onboarding Flow

**Zaki Platform should:**
1. ✅ Welcome + Security acknowledgment
2. ✅ Gateway selection (always Local/Sandbox for us)
3. ✅ Model/auth selection (API key or OAuth)
4. ✅ Channel selection (Telegram, WhatsApp, etc.)
5. ✅ Workspace initialization
6. ✅ Sandbox creation
7. ✅ Gateway startup
8. ✅ Agent bootstrap ritual (first run)
9. ✅ Onboarding chat session (dedicated)
10. ✅ Verification

### Agent Bootstrap Ritual (Zaki Platform)

**When:** First message from user after onboarding

**Process:**
1. Check if `BOOTSTRAP.md` exists in user's workspace
2. If exists, run bootstrap ritual:
   - Ask one question at a time
   - Write responses to `IDENTITY.md`, `USER.md`, `SOUL.md`
3. Remove `BOOTSTRAP.md` when complete
4. Continue with normal conversation

**Storage:** All files in R2: `users/{userId}/.openclaw/workspace/`

### Onboarding Chat Session

**Zaki Platform:**
- Create dedicated session: `onboarding-{timestamp}`
- Agent introduces itself
- Guides user through first steps
- Separate from normal conversation sessions

### Pairing

**Zaki Platform:**
- Store pairing state in R2: `users/{userId}/.openclaw/credentials/<channel>-pairing.json`
- Approve via API: `POST /api/users/{userId}/pairing/approve`

### Heartbeats

**Zaki Platform:**
- Each user's Sandbox runs its own heartbeat
- Config stored in user's `openclaw.json`
- `HEARTBEAT.md` in user's workspace

---

## 📝 Key Takeaways for Zaki Platform

1. **Onboarding is critical** - Make it dead simple
2. **Security first** - Pairing, allowlists, mentions
3. **Workspace = Memory** - Each user needs isolated workspace
4. **Sessions are per-user** - Store in R2, mount to Sandbox
5. **Channels are flexible** - Support multiple per user
6. **Auth is flexible** - Support API keys and OAuth
7. **Heartbeats are powerful** - But start disabled
8. **Media handling** - Templates for inbound, MEDIA: for outbound

---

**This is a living document - update as we learn more!**
