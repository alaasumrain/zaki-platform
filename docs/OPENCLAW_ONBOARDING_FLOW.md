# OpenClaw Onboarding Flow Analysis

**Date:** 2026-02-03  
**Purpose:** Document OpenClaw's onboarding wizard flow for Zaki Platform implementation

---

## 🎯 Overview

OpenClaw uses an interactive wizard (`openclaw onboard`) that guides users through complete setup. This document captures the flow so we can implement similar onboarding for Zaki Platform.

---

## 📋 Onboarding Flow Steps

### 1. **Security Acknowledgment**
- Shows security warning about OpenClaw being beta
- Explains risks (file access, command execution)
- Requires explicit "I understand" confirmation
- Links to security docs

**Key Points:**
- Must acknowledge risks before proceeding
- Recommends pairing/allowlists, sandboxing, least-privilege
- Mentions security audit commands

---

### 2. **Onboarding Mode Selection**
- Options: QuickStart, Custom
- QuickStart uses sensible defaults
- Custom allows full configuration

**Zaki Platform:** We should offer QuickStart + Custom options

---

### 3. **Config Detection**
- Detects existing config
- Shows current settings:
  - workspace: ~/clawd
  - model: anthropic/claude-opus-4-5
  - gateway.mode: local
  - gateway.port: 18789
  - gateway.bind: lan
- Option to "Use existing values" or reconfigure

**Zaki Platform:** Detect existing user configs in R2

---

### 4. **Gateway Configuration** (QuickStart)
- Gateway port: 18789 (default)
- Gateway bind: LAN (network accessible)
- Gateway auth: Token (default)
- Tailscale exposure: Off
- Direct to chat channels

**Zaki Platform:** Each user's Sandbox Gateway runs on port 18789

---

### 5. **Model/Auth Provider Selection**
- Options: Anthropic, OpenAI, Ollama, etc.
- User selects: **Anthropic**

---

### 6. **Anthropic Auth Method**
- Options:
  - Anthropic API key (direct)
  - **Anthropic token (paste setup-token)** ← Selected
- Shows instructions: "Run `claude setup-token` in your terminal"

---

### 7. **Anthropic Setup-Token Entry**
- Prompts to paste token from `claude setup-token`
- Token format: `sk-ant-oat01-...` (multi-line)
- Token name: Optional (default or custom like "alaa")
- Default model: Keep current or change

**Zaki Platform:** Support both API keys and OAuth tokens

---

### 8. **Channel Status Overview**
- Shows all available channels:
  - Telegram: not configured
  - WhatsApp: not configured
  - Discord: not configured
  - Google Chat: not configured
  - Slack: not configured
  - Signal: not configured
  - iMessage: not configured
  - Plus plugin-based channels

---

### 9. **Channel Selection** (QuickStart)
- User selects: **Telegram (Bot API)**
- Shows instructions:
  1. Open Telegram, chat with @BotFather
  2. Run /newbot (or /mybots)
  3. Copy token (format: 123456:ABC...)
- Tip: Can also set `TELEGRAM_BOT_TOKEN` in env

---

### 10. **Telegram Bot Token Entry**
- User pastes token: `8536043178:AAFfjE0JKzer87PKnUlVQAHPmOV9DCwlSYA`
- Config updated: `~/.openclaw/openclaw.json`
- Workspace verified: `~/clawd`
- Sessions verified: `~/.openclaw/agents/main/sessions`

---

### 11. **Skills Status**
- Eligible: 5 skills
- Missing requirements: 45 skills
- Blocked by allowlist: 0
- Option to configure now (recommended)

---

### 12. **Skills Installation**
- Many require Homebrew (Linux/Mac)
- Shows Homebrew install command if not installed
- Preferred node manager: npm (or pnpm)
- Attempts to install missing dependencies:
  - ✅ Installed: clawhub
  - ❌ Failed (brew required): 1password, gemini, github, nano-banana-pro, openai-whisper, peekaboo, wacli

**Zaki Platform:** Skills will be per-user in Sandboxes

---

### 13. **Skill API Keys**
- Prompts for API keys as needed:
  - GOOGLE_PLACES_API_KEY for goplaces/local-places
  - GEMINI_API_KEY for nano-banana-pro
  - NOTION_API_KEY for notion
  - OPENAI_API_KEY for openai-image-gen/openai-whisper-api
  - ELEVENLABS_API_KEY for sag

**Zaki Platform:** Store per-user API keys in R2

---

### 14. **Hooks Configuration**
- Explains hooks (automate actions on agent commands)
- Example: Save session context to memory on `/new`
- Options to enable:
  - 🚀 boot-md
  - 📝 command-logger
  - 💾 session-memory
- User can enable/disable later with CLI

**Zaki Platform:** Hooks can run in user Sandboxes

---

### 15. **Systemd Service Setup**
- Explains systemd user service
- Without lingering: service stops on logout/idle
- Enables lingering for user (may require sudo)
- Writes to `/var/lib/systemd/linger`

**Zaki Platform:** Sandboxes are managed by Cloudflare, not systemd

---

### 16. **Gateway Service Runtime**
- QuickStart uses Node (stable + supported)
- Alternative: Bun (not recommended for WhatsApp/Telegram)

**Zaki Platform:** Our Sandboxes use Node (pre-installed in Dockerfile)

---

### 17. **Service Installation**
- Installs systemd service: `~/.config/systemd/user/openclaw-gateway.service`
- Service runs Gateway as background daemon

**Zaki Platform:** Gateway runs via `startProcess()` in Sandbox

---

## 🔑 Key Patterns for Zaki Platform

### 1. **Progressive Disclosure**
- Start with QuickStart (sensible defaults)
- Allow customization at each step
- Show what's configured vs. not configured

### 2. **Configuration Detection**
- Detect existing configs
- Show current state
- Allow reuse or reconfiguration

### 3. **Multi-Step Wizard**
- Security acknowledgment first
- Then gateway/model setup
- Then channels
- Then skills/hooks
- Finally service installation

### 4. **Error Handling**
- Show what failed and why (e.g., "brew not installed")
- Provide tips and docs links
- Continue with what works

### 5. **Environment Variable Support**
- Support both config file and env vars
- Env vars can override config
- Tips shown in prompts

---

## 🎯 Zaki Platform Onboarding Flow (Proposed)

### Step 1: User Registration
- Email/username
- Password/auth
- Terms acceptance

### Step 2: Security Acknowledgment
- Explain Sandbox isolation
- Explain AI capabilities/risks
- Require acknowledgment

### Step 3: AI Model Selection
- Anthropic Claude (recommended)
- OpenAI GPT-4
- Ollama (local)
- API key or OAuth token entry

### Step 4: Gateway Configuration
- Auto-configured per user
- Port: 18789 (in Sandbox)
- Bind: localhost (within Sandbox)
- Auth token: Auto-generated

### Step 5: Channel Selection (Optional)
- Telegram bot
- WhatsApp (via QR)
- Discord bot
- Web interface (default)

### Step 6: Skills Selection (Optional)
- Browse available skills
- Install selected skills
- Configure API keys as needed

### Step 7: Sandbox Initialization
- Create user Sandbox
- Mount R2 storage
- Install OpenClaw Gateway
- Start Gateway service

### Step 8: Verification
- Test Gateway health
- Send test message
- Show dashboard URL

---

## 📝 Implementation Notes

### APIs to Note (for future):
- `openclaw onboard` - Main wizard entry point
- `openclaw configure` - Interactive config
- `openclaw gateway status` - Check Gateway
- `openclaw health` - Health check
- `openclaw pairing` - DM pairing management
- `openclaw hooks` - Hook management
- `openclaw skills` - Skill management

### Config File Structure:
- `~/.openclaw/openclaw.json` - Main config
- `~/.openclaw/credentials/oauth.json` - OAuth tokens
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` - Auth profiles
- `~/.openclaw/agents/<agentId>/sessions/` - Session data

### Zaki Platform Equivalents:
- `users/{userId}/.openclaw/openclaw.json` - In R2
- `users/{userId}/.openclaw/credentials/` - In R2
- `users/{userId}/.openclaw/workspace/` - In R2 (mounted to Sandbox)

---

## 🚀 Next Steps

1. **Design Zaki Platform onboarding UI**
   - Web-based wizard (similar to OpenClaw's CLI wizard)
   - Multi-step form
   - Progress indicator

2. **Implement onboarding API endpoints**
   - `/api/onboard/start` - Begin onboarding
   - `/api/onboard/step/{step}` - Complete step
   - `/api/onboard/complete` - Finish onboarding

3. **Store onboarding state**
   - In R2: `users/{userId}/onboarding.json`
   - Track completed steps
   - Allow resume from any step

4. **Auto-initialize Sandbox**
   - After onboarding completes
   - Create Sandbox
   - Mount R2
   - Start Gateway

---

**Key Takeaway:** OpenClaw's onboarding is comprehensive, user-friendly, and handles errors gracefully. We should replicate this experience for Zaki Platform users, adapted for our multi-tenant Sandbox architecture.
