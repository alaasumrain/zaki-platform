# Dashboard & UI Exploration - Key Findings

**Date:** 2026-02-10  
**Purpose:** Document dashboard implementations, UI patterns, and features from OpenClaw ecosystem

---

## 🔍 Repositories Explored

### 1. **Main OpenClaw UI** ⭐⭐⭐
**Location:** `/tmp/openclaw/ui`  
**Purpose:** Official OpenClaw Control UI (built-in dashboard)

#### Key Features
- **Control Dashboard** - Main UI for OpenClaw Gateway
- **WebSocket Support** - Real-time communication
- **Chat Interface** - Direct chat with agents
- **Channel Management** - WhatsApp, Telegram, Discord, etc.
- **Agent Controllers** - Agent management and identity
- **Debug Tools** - Debug endpoints and tools

#### Structure
```
ui/
├── src/
│   ├── ui/
│   │   ├── chat/          # Chat interface components
│   │   ├── views/          # Main views (chat, channels)
│   │   ├── controllers/    # Business logic
│   │   └── types/          # TypeScript types
│   └── ...
├── package.json
└── vite.config.ts
```

#### Tech Stack
- **Vite** - Build tool
- **TypeScript** - Type safety
- **WebSocket** - Real-time updates

#### What We Can Use
- ✅ **Chat interface patterns** - Message rendering, tool cards
- ✅ **WebSocket patterns** - Real-time updates
- ✅ **Controller architecture** - Business logic separation
- ✅ **Type definitions** - TypeScript types for Gateway API

---

### 2. **jpequegn/clawdbot-dashboard** ⭐⭐⭐
**Location:** `/tmp/clawdbot-dashboard-jpequegn`  
**Stars:** 1  
**Purpose:** Rich, glanceable dashboard with widgets

#### Key Features
- **Widget-based Layout** - Modular dashboard widgets
- **Weather Widget** - Current weather display
- **Calendar Widget** - Calendar integration
- **Email Widget** - Email management
- **Cron Jobs Widget** - Scheduled tasks
- **Sports Widget** - Sports scores (PSG, Arsenal)
- **Status Widget** - Gateway health, channels
- **Header** - Weather and time display

#### Tech Stack
- **Next.js 15** - React framework (App Router)
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **TypeScript** - Type safety

#### Structure
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/              # API routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── widgets/          # Dashboard widgets
│   │   ├── StatusWidget.tsx
│   │   ├── CalendarWidget.tsx
│   │   ├── EmailWidget.tsx
│   │   ├── CronWidget.tsx
│   │   └── SportsWidget.tsx
│   └── layout/           # Layout components
│       └── Header.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
└── types/                # TypeScript types
```

#### Roadmap
- **Phase 1:** ✅ Basic dashboard with mock data
- **Phase 2:** Real API integration with Gateway
- **Phase 3:** Daily briefing, newspaper view, usage stats
- **Phase 4:** Topic/project management, timeline view
- **Phase 5:** Dynamic layouts, command palette (⌘K)

#### What We Can Use
- ✅ **Widget architecture** - Modular, reusable widgets
- ✅ **Layout patterns** - Grid-based dashboard layout
- ✅ **API integration** - Gateway WebSocket patterns
- ✅ **shadcn/ui components** - Modern UI component library

---

### 3. **gaoliwei1102/clawdbot-dashboard** ⭐⭐
**Location:** `/tmp/clawdbot-dashboard-react`  
**Purpose:** React frontend for managing sessions and channels

#### Key Features
- **Sessions Management** - List, search, filter sessions
- **Channels Status** - WhatsApp/Discord/Telegram/Slack cards
- **Dashboard Overview** - Real-time stats
- **Gateway API Integration** - Direct HTTP API calls
- **No Mock Data** - All data from Gateway

#### Tech Stack
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router** - Routing

#### Structure
```
src/
├── components/
│   ├── layout/           # Sidebar, Header
│   ├── pages/            # Dashboard, Sessions, Channels
│   └── ui/               # Button, Card, Table (Radix + Tailwind)
├── hooks/                # useSessions, useChannels, useDashboard
├── lib/
│   └── api.ts            # Gateway API wrapper
└── App.tsx
```

#### API Pattern
```typescript
// Gateway API call
POST {GATEWAY_URL}/tools/invoke
Header: Authorization: Bearer <token>
Body: {
  "tool": "sessions_list",
  "args": { "limit": 200 },
  "sessionKey": "main"
}
```

#### Pages
- `/dashboard` - Real-time overview
- `/sessions` - Session management
- `/channels` - Channel status

#### What We Can Use
- ✅ **API wrapper pattern** - Clean Gateway API integration
- ✅ **Custom hooks** - useSessions, useChannels patterns
- ✅ **Page structure** - Dashboard, Sessions, Channels pages
- ✅ **CORS handling** - Proxy pattern for development

---

### 4. **oneles/openclaw-models-ui** ⭐⭐
**Location:** `/tmp/openclaw-models-ui`  
**Stars:** 1  
**Purpose:** Visual model priority manager

#### Key Features
- **Drag-and-drop Priority** - Reorder model fallback chains
- **Provider Browsing** - Click provider to see models
- **Auth Status** - Visual indicators (green = ready, orange = needs key)
- **One-click API Key Config** - Easy provider setup
- **Native Dashboard Integration** - iframe in OpenClaw Dashboard
- **Real-time Config Sync** - Updates Gateway config

#### Architecture
```
OpenClaw Dashboard (iframe)
    ↓
Models UI Backend (port 8085)
    ↓
OpenClaw Gateway RPC
    - config.get
    - config.patch
    - models.list
    - status
```

#### Installation
- Injects menu into Dashboard
- Backend server on port 8085
- Auto-start via PM2

#### What We Can Use
- ✅ **Dashboard extension pattern** - iframe integration
- ✅ **Model management UI** - Visual priority ordering
- ✅ **RPC proxy pattern** - Backend proxies Gateway RPC
- ✅ **Config sync** - Real-time config updates

---

### 5. **ibelick/webclaw** ⭐⭐
**Location:** `/tmp/webclaw`  
**Stars:** 369  
**Purpose:** Fast web client for OpenClaw

#### Key Features
- **Web Client** - Alternative to built-in Control UI
- **WebSocket Support** - Real-time communication
- **Gateway Integration** - Direct Gateway connection

#### Setup
```env
CLAWDBOT_GATEWAY_URL=ws://127.0.0.1:18789
CLAWDBOT_GATEWAY_TOKEN=your-token
```

#### What We Can Use
- ✅ **WebSocket client patterns** - Real-time communication
- ✅ **Gateway connection** - Direct WebSocket connection

---

## 🎯 Key Patterns We Should Adopt

### 1. Widget-Based Dashboard (from jpequegn)
```typescript
// Modular widget architecture
<Dashboard>
  <StatusWidget />
  <CalendarWidget />
  <EmailWidget />
  <CronWidget />
  <SportsWidget />
</Dashboard>
```

**Benefits:**
- Reusable components
- Easy to add/remove widgets
- Flexible layouts

### 2. Gateway API Wrapper (from gaoliwei1102)
```typescript
// Clean API abstraction
const api = {
  sessions: {
    list: (args) => invokeTool('sessions_list', args),
    get: (id) => invokeTool('sessions_get', { id })
  },
  channels: {
    list: () => invokeTool('channels_list', {})
  }
}
```

**Benefits:**
- Type-safe API calls
- Centralized error handling
- Easy to test

### 3. Custom Hooks Pattern (from gaoliwei1102)
```typescript
// Data fetching hooks
const useSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    api.sessions.list().then(setSessions);
  }, []);
  
  return { sessions, loading };
}
```

**Benefits:**
- Reusable data fetching
- Loading states
- Error handling

### 4. Dashboard Extension (from openclaw-models-ui)
```typescript
// iframe integration pattern
<iframe src="http://localhost:8085/models" />
```

**Benefits:**
- Extend existing dashboard
- Isolated backend
- Easy to add features

### 5. WebSocket Real-time Updates (from main UI)
```typescript
// Real-time communication
const ws = new WebSocket('ws://gateway:18789/ws?token=...');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
}
```

**Benefits:**
- Real-time updates
- No polling needed
- Efficient

---

## 🚀 Implementation Recommendations

### Immediate (High Value)

1. **Widget-Based Dashboard**
   - Adopt jpequegn's widget architecture
   - Create reusable widget components
   - Grid-based layout system

2. **Gateway API Wrapper**
   - Implement gaoliwei1102's API pattern
   - Type-safe API calls
   - Centralized error handling

3. **Custom Hooks**
   - Create useSessions, useChannels hooks
   - Loading and error states
   - Reusable data fetching

### Short-term (Medium Value)

4. **Real-time Updates**
   - WebSocket integration
   - Live session updates
   - Channel status updates

5. **Dashboard Pages**
   - Dashboard overview
   - Sessions management
   - Channels status

6. **Model Management UI**
   - Visual model priority (like openclaw-models-ui)
   - Provider browsing
   - Auth status indicators

### Long-term (Nice to Have)

7. **Advanced Widgets**
   - Calendar integration
   - Email management
   - Cron jobs display
   - Usage stats

8. **Command Palette**
   - ⌘K command palette
   - Quick actions
   - Search functionality

9. **Dynamic Layouts**
   - Time-based layouts
   - Work/Personal mode
   - Drag & drop customization

---

## 📁 File Locations

### Cloned Repos
- `/tmp/openclaw/ui` - Official OpenClaw Control UI
- `/tmp/clawdbot-dashboard-jpequegn` - Widget-based dashboard
- `/tmp/clawdbot-dashboard-react` - React sessions/channels dashboard
- `/tmp/openclaw-models-ui` - Model priority manager
- `/tmp/webclaw` - Fast web client

### Key Files to Review
- `/tmp/openclaw/ui/src/ui/chat/` - Chat interface
- `/tmp/openclaw/ui/src/ui/controllers/` - Business logic
- `/tmp/clawdbot-dashboard-jpequegn/src/components/widgets/` - Widget components
- `/tmp/clawdbot-dashboard-react/src/lib/api.ts` - API wrapper
- `/tmp/clawdbot-dashboard-react/src/hooks/` - Custom hooks

---

## 💡 Key Insights

1. **Widget Architecture** - Modular, reusable widgets are the way to go
2. **API Abstraction** - Clean API wrapper makes integration easier
3. **Real-time Updates** - WebSocket is essential for live data
4. **Type Safety** - TypeScript types make development smoother
5. **Extension Pattern** - iframe integration allows extending existing dashboards

---

## 🎯 Next Steps

1. ✅ **Review widget architecture** - jpequegn's implementation
2. ⏳ **Implement API wrapper** - gaoliwei1102's pattern
3. ⏳ **Create custom hooks** - useSessions, useChannels
4. ⏳ **Build widget components** - Status, Sessions, Channels
5. ⏳ **Add WebSocket support** - Real-time updates
6. ⏳ **Create dashboard pages** - Overview, Sessions, Channels

---

**Status:** Exploration complete. Ready to implement dashboard patterns.
