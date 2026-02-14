# Zaki Platform - Complete Vision & Architecture

**Date:** 2026-02-10  
**Version:** 1.0  
**Status:** Vision Document

---

## 🎯 Core Vision

**Zaki Platform** is a multi-tenant, privacy-first AI assistant platform where each user gets their own isolated OpenClaw instance with full proactive capabilities, complete privacy, and a beautiful dashboard experience.

### Mission Statement
> "Every user deserves their own AI assistant - private, powerful, and always ready. No compromises."

### Key Principles
1. **Privacy First** - User owns their bot token, data, and conversations
2. **Native OpenClaw** - Follow OpenClaw's design patterns, don't reinvent
3. **Beautiful UX** - Dashboard that users actually want to use
4. **Proactive Intelligence** - Full heartbeat, cron, and proactive messaging
5. **Developer Friendly** - Easy to extend, integrate, and customize

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zaki Platform                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │   API Layer  │  │   Dashboard  │     │
│  │  (Next.js)   │  │  (Express)   │  │  (React)     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  Instance Manager│                       │
│                   │  (Container Mgmt)│                      │
│                   └────────┬────────┘                       │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         │                  │                  │             │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐     │
│  │ User 1      │  │ User 2       │  │ User N       │     │
│  │ Container   │  │ Container    │  │ Container    │     │
│  │             │  │              │  │              │     │
│  │ OpenClaw    │  │ OpenClaw     │  │ OpenClaw     │     │
│  │ Gateway     │  │ Gateway      │  │ Gateway      │     │
│  │             │  │              │  │              │     │
│  │ Bot Token   │  │ Bot Token    │  │ Bot Token    │     │
│  │ (User Owned)│  │ (User Owned) │  │ (User Owned) │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User → Telegram Bot (User's Own Bot)
         ↓
    OpenClaw Gateway (in User's Container)
         ↓
    Agent Processing
         ↓
    Response → Telegram Bot → User
```

**No router needed!** Each user's bot connects directly to their OpenClaw gateway.

---

## 👤 User Experience Journey

### 1. Onboarding Flow

#### Step 1: Welcome & Discovery
```
User lands on zakified.com
    ↓
Beautiful landing page:
  - "Your Personal AI Assistant"
  - "Private, Powerful, Always Ready"
  - "Get Started" button
    ↓
User clicks "Get Started"
```

#### Step 2: Account Creation
```
Sign up form:
  - Email
  - Password
  - Name
    ↓
Email verification
    ↓
Welcome email with next steps
```

#### Step 3: Bot Creation (Guided)
```
Dashboard shows:
  "Step 1: Create Your Private Bot"
  
  Instructions:
  - Open @BotFather on Telegram
  - Send /newbot
  - Choose a name
  - Get your token
  
  [Button: Open BotFather]
  [Input: Paste your bot token]
    ↓
Token validation:
  - Format check
  - Telegram API verification
  - Extract bot username
    ↓
Success: "✅ Your bot @your_bot is ready!"
```

#### Step 4: Instance Provisioning
```
"Setting up your AI assistant..."
  - Creating container
  - Configuring OpenClaw
  - Setting up workspace
  - Initializing memory
    ↓
"✅ Your AI is ready!"
  - Link to your bot: t.me/your_bot
  - Link to dashboard
```

#### Step 5: First Chat
```
User clicks bot link
    ↓
Telegram opens @your_bot
    ↓
Bot greets:
  "Hey! I'm Zaki, your personal AI assistant.
   I'm here to help with anything you need.
   
   What would you like to do first?"
    ↓
User chats naturally
```

### 2. Dashboard Experience

#### Dashboard Home
```
┌─────────────────────────────────────────────────┐
│  Zaki Dashboard                    [Settings]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────┐  ┌─────────────┐             │
│  │   Status    │  │  Sessions   │             │
│  │             │  │             │             │
│  │ 🟢 Online   │  │  Active: 3  │             │
│  │ Bot: Ready  │  │  Total: 127 │             │
│  └─────────────┘  └─────────────┘             │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐             │
│  │  Channels  │  │   Usage     │             │
│  │             │  │             │             │
│  │ Telegram ✅ │  │  Tokens: 2.1M│             │
│  │ WhatsApp ❌ │  │  Cost: $12  │             │
│  └─────────────┘  └─────────────┘             │
│                                                  │
│  ┌─────────────────────────────────────┐       │
│  │      Recent Activity                 │       │
│  │  • Chat about project ideas          │       │
│  │  • Scheduled reminder for meeting   │       │
│  │  • Researched AI trends             │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

#### Sessions Page
```
┌─────────────────────────────────────────────────┐
│  Sessions                          [Search] [New]│
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Project Planning                          │  │
│  │ Last active: 2 hours ago                  │  │
│  │ Messages: 45                              │  │
│  │ [View] [Archive]                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Code Review Help                         │  │
│  │ Last active: 1 day ago                   │  │
│  │ Messages: 23                             │  │
│  │ [View] [Archive]                         │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Settings Page
```
┌─────────────────────────────────────────────────┐
│  Settings                                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  Bot Configuration                              │
│  ┌──────────────────────────────────────────┐  │
│  │ Bot Username: @your_bot                   │  │
│  │ Bot Token: •••••••••••••••••              │  │
│  │ [Change Token]                            │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  AI Model                                        │
│  ┌──────────────────────────────────────────┐  │
│  │ Primary: Claude Opus 4.5                 │  │
│  │ Fallback: GPT-4                          │  │
│  │ [Change Models]                           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Proactive Features                              │
│  ┌──────────────────────────────────────────┐  │
│  │ Heartbeat: Every 30 minutes              │  │
│  │ Cron Jobs: 3 active                      │  │
│  │ [Configure]                              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Dashboard Design System

### Design Philosophy
- **Clean & Minimal** - Focus on content, not chrome
- **Information Density** - Show what matters, hide the rest
- **Progressive Disclosure** - Details on demand
- **Responsive** - Works on mobile, tablet, desktop
- **Fast** - Instant feedback, no waiting

### Color Palette
```css
/* Primary */
--zaki-blue: #3B82F6;
--zaki-blue-dark: #2563EB;
--zaki-blue-light: #60A5FA;

/* Accent */
--zaki-purple: #8B5CF6;
--zaki-green: #10B981;
--zaki-orange: #F59E0B;

/* Neutral */
--zaki-gray-50: #F9FAFB;
--zaki-gray-100: #F3F4F6;
--zaki-gray-900: #111827;
```

### Typography
- **Headings:** Inter Bold
- **Body:** Inter Regular
- **Code:** JetBrains Mono

### Component Library
Based on shadcn/ui with Zaki customizations:
- Cards (elevated, flat, outlined)
- Buttons (primary, secondary, ghost)
- Badges (status, category, count)
- Tables (sortable, filterable, paginated)
- Dialogs (modal, sheet, drawer)
- Forms (input, select, textarea, checkbox)

---

## 🧩 Core Features

### 1. Multi-Tenant Isolation

**Each user gets:**
- Own Docker container
- Own OpenClaw gateway instance
- Own bot token (user-owned)
- Own workspace directory
- Own session storage
- Own memory/context

**Isolation guarantees:**
- No cross-user data access
- No shared resources
- Complete privacy
- Independent scaling

### 2. Native OpenClaw Integration

**Full OpenClaw capabilities:**
- ✅ Gateway API (HTTP + WebSocket)
- ✅ Agent runtime
- ✅ Session management
- ✅ Channel routing (native)
- ✅ Heartbeat system
- ✅ Cron jobs
- ✅ Proactive messaging
- ✅ Skills system

**No custom routing layer** - OpenClaw handles everything natively.

### 3. Beautiful Dashboard

**Widget-based architecture:**
- StatusWidget - Gateway health, channels
- SessionsWidget - Active sessions list
- ChannelsWidget - Channel status cards
- UsageWidget - Token usage, costs
- ActivityWidget - Recent activity feed
- MemoryWidget - Memory usage stats
- CalendarWidget - Upcoming events
- TasksWidget - Pending tasks

**Features:**
- Real-time updates (WebSocket)
- Customizable layout
- Command palette (⌘K)
- Dark/light mode
- Responsive design

### 4. Proactive Intelligence

**Heartbeat System:**
- Configurable intervals (default: 30min)
- Reads HEARTBEAT.md from workspace
- Proactive task execution
- Context-aware suggestions

**Cron Jobs:**
- Schedule recurring tasks
- Web UI for management
- Execution logs
- Error handling

**Proactive Messaging:**
- User's bot can message them
- No router needed (direct connection)
- Full Telegram API access

### 5. Memory & Context

**Hierarchical Memory (inspired by memU):**
```
workspace/
├── preferences/
│   ├── communication_style.md
│   └── topic_interests.md
├── relationships/
│   ├── contacts/
│   └── interaction_history/
├── knowledge/
│   ├── domain_expertise/
│   └── learned_skills/
└── context/
    ├── recent_conversations/
    └── pending_tasks/
```

**Features:**
- Auto-categorization
- Cross-referencing
- Persistent storage (R2)
- Search & retrieval

### 6. Skills & Extensions

**Skill Management:**
- Browse from ClawHub
- Install with one click
- Update notifications
- Custom skills support

**Popular Skills:**
- Web search
- Calendar integration
- Email management
- Code execution
- File operations

### 7. API & Integrations

**REST API:**
- User management
- Instance control
- Session access
- Webhook support

**WebSocket API:**
- Real-time updates
- Live chat
- Event streaming

**Webhooks:**
- Session events
- Message events
- Error notifications

---

## 🔧 Technical Architecture

### Frontend Stack

**Web App (Next.js 15):**
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS 4
- Components: shadcn/ui
- State: React Context + Hooks
- Real-time: WebSocket

**Dashboard (React 18):**
- Framework: React 18 + Vite
- Language: TypeScript
- Styling: Tailwind CSS 4
- Components: shadcn/ui
- Charts: Recharts
- Routing: React Router

### Backend Stack

**API Layer (Express/Node.js):**
- Framework: Express.js
- Language: TypeScript
- Database: PostgreSQL (user data)
- Storage: R2 (user files, sessions)
- Queue: Bull (background jobs)
- Cache: Redis (sessions, rate limiting)

**Instance Manager:**
- Container: Docker
- Orchestration: Docker Compose (or Kubernetes)
- Monitoring: Prometheus + Grafana
- Logging: Structured logs (JSON)

### Infrastructure

**Cloudflare:**
- Workers: API edge functions
- R2: Object storage (user data)
- D1: SQLite database (optional)
- Pages: Static hosting
- Tunnels: Secure connections

**Container Host:**
- Docker: Container runtime
- Systemd: Service management
- UFW: Firewall
- Fail2ban: SSH protection

---

## 📊 Data Architecture

### User Data Structure

```
User (PostgreSQL)
├── id (UUID)
├── email
├── password_hash
├── name
├── created_at
├── subscription_tier
└── settings (JSONB)

Instance (PostgreSQL)
├── id (UUID)
├── user_id (FK)
├── container_name
├── port
├── bot_token (encrypted)
├── bot_username
├── status (running/stopped)
├── created_at
└── config (JSONB)

Session (R2)
└── users/{user_id}/.openclaw/agents/main/sessions/
    ├── {session_id}.jsonl
    └── sessions.json

Workspace (R2)
└── users/{user_id}/.openclaw/workspace/
    ├── SOUL.md
    ├── IDENTITY.md
    ├── USER.md
    ├── MEMORY.md
    ├── preferences/
    ├── relationships/
    ├── knowledge/
    └── context/
```

### Storage Strategy

**PostgreSQL (Metadata):**
- User accounts
- Instance metadata
- Settings
- Billing

**R2 (User Data):**
- Workspace files
- Session transcripts
- Memory files
- Media attachments

**Redis (Cache):**
- Session state
- Rate limiting
- Real-time data

---

## 🔐 Security Architecture

### Authentication & Authorization

**User Authentication:**
- Email + password
- OAuth (Google, GitHub)
- 2FA (optional)

**Gateway Authentication:**
- Token-based (per instance)
- User-owned bot tokens
- No shared credentials

**API Authentication:**
- JWT tokens
- Refresh tokens
- Rate limiting

### Data Security

**Encryption:**
- Bot tokens: Encrypted at rest (AES-256)
- Database: Encrypted connections (TLS)
- R2: Server-side encryption
- Backups: Encrypted

**Isolation:**
- Docker containers (process isolation)
- Network isolation (no cross-container access)
- File system isolation (separate volumes)
- Resource limits (CPU, memory)

**Privacy:**
- User owns bot token
- No message interception
- No data sharing between users
- GDPR compliant

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2: Core Infrastructure**
- [ ] Set up PostgreSQL database
- [ ] Set up R2 storage
- [ ] Docker container setup
- [ ] Instance manager (create/start/stop)
- [ ] Basic API (Express)

**Week 3-4: Onboarding**
- [ ] User registration
- [ ] Email verification
- [ ] Bot token collection
- [ ] Token validation
- [ ] Container provisioning
- [ ] Basic dashboard (Next.js)

### Phase 2: Dashboard (Weeks 5-8)

**Week 5-6: Core Dashboard**
- [ ] Dashboard layout
- [ ] StatusWidget
- [ ] SessionsWidget
- [ ] ChannelsWidget
- [ ] Gateway API integration
- [ ] Real-time updates (WebSocket)

**Week 7-8: Enhanced Features**
- [ ] Sessions page
- [ ] Channels page
- [ ] Settings page
- [ ] Command palette (⌘K)
- [ ] Dark/light mode

### Phase 3: Proactive Features (Weeks 9-12)

**Week 9-10: Heartbeat & Cron**
- [ ] Heartbeat configuration UI
- [ ] Cron job management
- [ ] Execution logs
- [ ] Error handling

**Week 11-12: Memory System**
- [ ] Memory structure setup
- [ ] Auto-categorization
- [ ] Search & retrieval
- [ ] Memory widget

### Phase 4: Polish & Scale (Weeks 13-16)

**Week 13-14: UX Improvements**
- [ ] Loading states
- [ ] Error handling
- [ ] Animations
- [ ] Mobile responsive

**Week 15-16: Performance & Scale**
- [ ] Caching layer
- [ ] Rate limiting
- [ ] Monitoring
- [ ] Load testing

---

## 📈 Success Metrics

### User Metrics
- **Sign-ups:** Target 1000 users in first 3 months
- **Activation:** 80% create bot and send first message
- **Retention:** 70% active after 30 days
- **Engagement:** Average 50 messages/user/week

### Technical Metrics
- **Uptime:** 99.9% availability
- **Response Time:** <200ms API, <1s dashboard
- **Container Startup:** <30 seconds
- **Error Rate:** <0.1%

### Business Metrics
- **MRR:** $10K/month by month 6
- **Churn:** <5% monthly
- **LTV:** $500+ per user
- **CAC:** <$50 per user

---

## 🎯 Competitive Advantages

1. **Privacy First** - User owns their bot token
2. **Native OpenClaw** - Full capabilities, no compromises
3. **Beautiful UX** - Dashboard users actually want to use
4. **Proactive Intelligence** - Heartbeat, cron, proactive messaging
5. **Easy Onboarding** - Guided bot creation, no technical knowledge needed
6. **Multi-tenant** - True isolation, secure by design
7. **Extensible** - Skills, webhooks, API access

---

## 💡 Future Vision

### Short-term (3-6 months)
- WhatsApp channel support
- Voice messages
- Image generation
- Code execution sandbox
- Team workspaces

### Medium-term (6-12 months)
- Mobile apps (iOS/Android)
- Desktop apps (Electron)
- Browser extension
- API marketplace
- White-label solution

### Long-term (12+ months)
- Enterprise features
- Multi-region deployment
- Advanced analytics
- AI model marketplace
- Agent-to-agent communication

---

## 🎨 Brand Identity

### Name: Zaki
- **Meaning:** Intelligent, pure (Arabic origin)
- **Personality:** Helpful, direct, gets things done
- **Voice:** Friendly but professional, no fluff

### Visual Identity
- **Logo:** Modern, clean, tech-forward
- **Colors:** Blue (trust), Purple (creativity), Green (growth)
- **Typography:** Inter (modern, readable)
- **Iconography:** Minimal, functional

### Messaging
- **Tagline:** "Your Personal AI Assistant"
- **Value Prop:** "Private, Powerful, Always Ready"
- **Tone:** Confident, helpful, approachable

---

## 📚 Documentation Strategy

### User Documentation
- Getting started guide
- Bot setup tutorial
- Dashboard walkthrough
- Features guide
- FAQ

### Developer Documentation
- API reference
- Webhook guide
- Skills development
- Integration examples
- Architecture docs

### Internal Documentation
- Runbooks
- Incident response
- Deployment procedures
- Monitoring setup

---

## 🎯 This Is Your Canvas

**You have complete creative freedom to build Zaki however you want.**

This vision document is a starting point - a synthesis of:
- OpenClaw's native architecture
- Best practices from the ecosystem
- Modern web development patterns
- User experience principles

**But it's YOUR platform.** You can:
- Change the design
- Add new features
- Remove what doesn't work
- Experiment with new ideas
- Build something unique

**The only constraints:**
- Stay true to OpenClaw's native patterns
- Prioritize user privacy
- Build something beautiful
- Make it work reliably

**Everything else is up to you.** 🚀

---

**Status:** Vision complete. Ready to build. 🦞
