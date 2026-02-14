# LobeChat + OpenClaw Integration Plan

**Date:** 2026-02-09  
**Goal:** Fork latest LobeChat and import OpenClaw dashboard features

---

## 🎯 Overview

We're forking the latest LobeChat repository and integrating features from the OpenClaw dashboard to create a unified UI that combines:
- **LobeChat's beautiful chat interface** (latest version)
- **OpenClaw's gateway management** (from openclaw-dashboard)
- **OpenClaw's channel settings** (multi-channel support)
- **OpenClaw's chat features** (thinking display, streaming, etc.)

---

## 📦 What We're Importing

### 1. **Gateway Management** (High Priority)
**Source:** `/root/zaki-platform/repos/openclaw-dashboard/client/src/pages/GatewayManagement.tsx`

**Features:**
- ✅ Gateway status monitoring (running/stopped/error)
- ✅ CPU/Memory usage display
- ✅ Uptime tracking
- ✅ Gateway start/stop/restart controls
- ✅ Connection mode switching (Gateway vs Webhook)
- ✅ Webhook URL configuration
- ✅ Webhook status checking
- ✅ Restart logs history

**Integration Strategy:**
- Add as a new settings page in LobeChat: `/settings/gateway`
- Use LobeChat's existing settings UI patterns
- Keep the cyberpunk terminal aesthetic from OpenClaw dashboard

**Files to Import:**
- `GatewayManagement.tsx` → `apps/web/src/app/(main)/settings/gateway/page.tsx`
- Gateway status hooks/logic
- tRPC routes for gateway management

---

### 2. **Channel Settings** (High Priority)
**Source:** `/root/zaki-platform/repos/openclaw-dashboard/client/src/pages/ChannelSettings.tsx`

**Features:**
- ✅ Multi-channel support (Telegram, Discord, Slack, WhatsApp, etc.)
- ✅ Channel configuration UI
- ✅ Connection testing
- ✅ Enable/disable toggles
- ✅ Sync to Gateway functionality

**Integration Strategy:**
- Add as `/settings/channels` in LobeChat
- Integrate with LobeChat's existing provider settings
- Use LobeChat's form components

**Files to Import:**
- `ChannelSettings.tsx` → `apps/web/src/app/(main)/settings/channels/page.tsx`
- Channel configuration types
- Channel testing logic

---

### 3. **Enhanced Chat Features** (Medium Priority)
**Source:** `/root/zaki-platform/repos/openclaw-dashboard/client/src/pages/Chatbox.tsx`

**Features:**
- ✅ Thinking process display (collapsible)
- ✅ Streaming responses with real-time updates
- ✅ Session management (create, edit, delete)
- ✅ Model selector with provider colors
- ✅ Resizable sessions panel
- ✅ Mobile-responsive drawer

**Integration Strategy:**
- Enhance LobeChat's existing chat interface
- Add thinking display as an optional feature
- Improve session management UI
- Keep LobeChat's existing chat components but enhance them

**Files to Import:**
- Thinking display component
- Enhanced streaming logic
- Session management improvements

---

### 4. **AIChatBox Component** (Low Priority)
**Source:** `/root/zaki-platform/repos/openclaw-dashboard/client/src/components/AIChatBox.tsx`

**Features:**
- ✅ Reusable chat box component
- ✅ Markdown rendering with Streamdown
- ✅ Auto-scroll
- ✅ Loading states

**Integration Strategy:**
- LobeChat already has excellent chat components
- Only import if we need a simpler standalone component
- Likely not needed since LobeChat's chat is more advanced

---

## 🏗️ Architecture Decisions

### Backend Integration

**Option 1: Proxy Mode (Current)**
- LobeChat → `OPENAI_PROXY_URL=http://localhost:19001/v1` → OpenClaw
- ✅ Simple, works now
- ❌ Limited to chat only, no gateway/channel management

**Option 2: Full Integration (Recommended)**
- LobeChat UI → Custom API routes → OpenClaw Gateway API
- ✅ Full control over features
- ✅ Gateway management
- ✅ Channel settings
- ✅ Better error handling

**Decision:** Start with Option 1 for chat, add Option 2 for settings pages.

---

### UI/UX Strategy

1. **Keep LobeChat's Design System**
   - Use LobeChat's components and styling
   - Maintain consistency with existing UI

2. **Add OpenClaw Features as Settings Pages**
   - `/settings/gateway` - Gateway management
   - `/settings/channels` - Channel configuration
   - `/settings/models` - Model configuration (enhance existing)

3. **Enhance Chat Interface**
   - Add thinking display toggle
   - Improve streaming UX
   - Better session management

---

## 📋 Implementation Steps

### Phase 1: Setup (Current)
- [x] Stop vanilla LobeChat Docker container
- [x] Clone latest LobeChat repository
- [x] Explore OpenClaw dashboard components
- [ ] Document integration plan (this file)

### Phase 2: Basic Integration
- [ ] Set up LobeChat fork for development
- [ ] Configure OpenClaw proxy URL
- [ ] Test basic chat functionality
- [ ] Verify streaming works

### Phase 3: Gateway Management
- [ ] Create `/settings/gateway` page
- [ ] Port GatewayManagement component
- [ ] Add tRPC routes for gateway API
- [ ] Test gateway controls

### Phase 4: Channel Settings
- [ ] Create `/settings/channels` page
- [ ] Port ChannelSettings component
- [ ] Add channel management API routes
- [ ] Test channel configuration

### Phase 5: Enhanced Chat
- [ ] Add thinking display to chat
- [ ] Improve session management UI
- [ ] Add model selector enhancements
- [ ] Mobile responsiveness improvements

### Phase 6: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Documentation
- [ ] Testing

---

## 🔌 API Integration Points

### OpenClaw Gateway API
```
GET  /api/gateway/status          - Gateway status
POST /api/gateway/start           - Start gateway
POST /api/gateway/stop            - Stop gateway
POST /api/gateway/restart         - Restart gateway
GET  /api/gateway/connection-mode  - Get connection mode
POST /api/gateway/connection-mode  - Set connection mode
```

### OpenClaw Channels API
```
GET    /api/channels              - List channels
POST   /api/channels              - Create channel
PUT    /api/channels/:id          - Update channel
DELETE /api/channels/:id          - Delete channel
POST   /api/channels/:id/test     - Test channel
POST   /api/channels/:id/sync     - Sync to gateway
```

### OpenClaw Chat API (via Proxy)
```
POST /v1/chat/completions         - Chat completion (OpenAI-compatible)
```

---

## 🎨 Design Considerations

### Color Scheme
- **LobeChat:** Uses theme system (light/dark)
- **OpenClaw Dashboard:** Cyberpunk terminal aesthetic (dark, red accents)
- **Decision:** Use LobeChat's theme system, add OpenClaw red as accent color option

### Components
- **LobeChat:** Uses shadcn/ui components
- **OpenClaw Dashboard:** Also uses shadcn/ui
- **Decision:** Both compatible, can share components

### Typography
- **LobeChat:** Modern sans-serif
- **OpenClaw Dashboard:** Monospace (terminal style)
- **Decision:** Use LobeChat's typography, add monospace option for code/terminal displays

---

## 🚀 Quick Start Commands

```bash
# Navigate to LobeChat fork
cd /root/zaki-platform/repos/lobe-chat-latest

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add: OPENAI_PROXY_URL=http://localhost:19001/v1

# Run development server
pnpm dev
```

---

## 📝 Notes

### What NOT to Import
- ❌ OpenClaw dashboard's entire layout (too different from LobeChat)
- ❌ OpenClaw's login/auth system (LobeChat has its own)
- ❌ OpenClaw's database schema (different architecture)
- ❌ OpenClaw's tRPC server (we'll create new routes in LobeChat)

### What to Adapt
- ✅ Gateway management logic → LobeChat API routes
- ✅ Channel settings UI → LobeChat settings pages
- ✅ Chat enhancements → LobeChat chat components
- ✅ Thinking display → LobeChat message rendering

---

## 🔗 Related Files

- **OpenClaw Dashboard:** `/root/zaki-platform/repos/openclaw-dashboard/`
- **LobeChat Latest:** `/root/zaki-platform/repos/lobe-chat-latest/`
- **OpenClaw Gateway:** Running on port 19001
- **This Plan:** `/root/zaki-platform/docs/LOBECHAT_OPENCLAW_IMPORT_PLAN.md`

---

**Status:** Planning phase complete, ready to start implementation! 🚀
