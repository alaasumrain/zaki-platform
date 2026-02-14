# Dashboard Implementation Guide

**Date:** 2026-02-10  
**Purpose:** Practical guide for implementing Zaki Platform dashboard based on OpenClaw ecosystem patterns

---

## 🎯 Recommended Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router) or React 18 + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State:** React hooks + Context API
- **Real-time:** WebSocket for live updates
- **Type Safety:** TypeScript

### Core Components

```
Dashboard
├── Layout
│   ├── Header (weather, time, mode toggle)
│   ├── Sidebar (navigation)
│   └── Main Content
├── Widgets (Modular)
│   ├── StatusWidget (gateway health, channels)
│   ├── SessionsWidget (active sessions)
│   ├── ChannelsWidget (channel status)
│   ├── UsageWidget (stats, costs)
│   └── ... (extensible)
└── Pages
    ├── Dashboard (overview)
    ├── Sessions (management)
    └── Channels (status)
```

---

## 📦 Widget Architecture (from jpequegn)

### Widget Structure
```typescript
// components/widgets/StatusWidget.tsx
export function StatusWidget({ gatewayStatus, channels }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway Status</CardTitle>
      </CardHeader>
      <CardContent>
        <StatusIndicator status={gatewayStatus} />
        <ChannelList channels={channels} />
      </CardContent>
    </Card>
  );
}
```

### Widget Grid
```typescript
// Grid-based layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {isVisible("status") && <StatusWidget {...props} />}
  {isVisible("sessions") && <SessionsWidget {...props} />}
  {isVisible("channels") && <ChannelsWidget {...props} />}
</div>
```

### Widget Visibility
```typescript
// Settings panel controls visibility
const [visibleWidgets, setVisibleWidgets] = useState([
  "status", "sessions", "channels"
]);
```

---

## 🔌 Gateway API Wrapper (from gaoliwei1102)

### API Structure
```typescript
// lib/api.ts
const GATEWAY_URL = process.env.VITE_GATEWAY_URL;
const GATEWAY_TOKEN = process.env.VITE_GATEWAY_TOKEN;

async function invokeTool(tool: string, args: any) {
  const response = await fetch(`${GATEWAY_URL}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GATEWAY_TOKEN}`
    },
    body: JSON.stringify({
      tool,
      args,
      sessionKey: 'main'
    })
  });
  
  const data = await response.json();
  return data.result?.details || data.result?.content || data.result;
}

export const api = {
  sessions: {
    list: (args = {}) => invokeTool('sessions_list', { limit: 200, ...args }),
    get: (id: string) => invokeTool('sessions_get', { id })
  },
  channels: {
    list: () => invokeTool('channels_list', {})
  },
  gateway: {
    status: () => invokeTool('gateway_status', {})
  }
};
```

---

## 🎣 Custom Hooks Pattern

### Data Fetching Hook
```typescript
// hooks/useSessions.ts
export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.sessions.list()
      .then(setSessions)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { sessions, loading, error };
}
```

### Dashboard Hook
```typescript
// hooks/useDashboard.ts
export function useDashboard({ refreshInterval = 60000 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [sessions, channels, gateway] = await Promise.all([
        api.sessions.list(),
        api.channels.list(),
        api.gateway.status()
      ]);
      setData({ sessions, channels, gateway });
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return { data, loading, error, lastRefresh, refresh };
}
```

---

## 🔄 Real-time Updates (WebSocket)

### WebSocket Hook
```typescript
// hooks/useWebSocket.ts
export function useWebSocket(url: string, token: string) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${url}?token=${token}`);
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setData(message);
    };

    return () => ws.close();
  }, [url, token]);

  return { data, connected };
}
```

---

## 📄 Page Structure

### Dashboard Page
```typescript
// pages/Dashboard.tsx
export function DashboardPage() {
  const { data, loading, error, refresh } = useDashboard();
  const { visibleWidgets } = useDashboardSettings();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleWidgets.includes("status") && (
        <StatusWidget 
          gatewayStatus={data.gateway.status}
          channels={data.channels}
        />
      )}
      {visibleWidgets.includes("sessions") && (
        <SessionsWidget sessions={data.sessions} />
      )}
      {/* ... more widgets */}
    </div>
  );
}
```

### Sessions Page
```typescript
// pages/Sessions.tsx
export function SessionsPage() {
  const { sessions, loading } = useSessions();
  const [search, setSearch] = useState("");

  const filtered = sessions.filter(s => 
    s.id.includes(search) || s.title?.includes(search)
  );

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <SessionsTable sessions={filtered} loading={loading} />
    </div>
  );
}
```

---

## 🎨 UI Components (shadcn/ui)

### Recommended Components
- **Card** - Widget containers
- **Button** - Actions
- **Table** - Data display
- **Badge** - Status indicators
- **Skeleton** - Loading states
- **Dialog** - Modals
- **Command** - Command palette

### Example Widget
```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StatusWidget({ gatewayStatus, channels }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={gatewayStatus === "running" ? "success" : "error"}>
          {gatewayStatus}
        </Badge>
        <div className="mt-4">
          {channels.map(channel => (
            <ChannelItem key={channel.id} channel={channel} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ⚙️ Settings & Configuration

### Dashboard Settings Hook
```typescript
// hooks/useDashboardSettings.ts
export function useDashboardSettings() {
  const [mode, setMode] = useState<"work" | "personal">("work");
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([
    "status", "sessions", "channels"
  ]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-settings");
    if (saved) {
      const { mode, widgets } = JSON.parse(saved);
      setMode(mode);
      setVisibleWidgets(widgets);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-settings", JSON.stringify({
      mode,
      widgets: visibleWidgets
    }));
  }, [mode, visibleWidgets]);

  return {
    mode,
    visibleWidgets,
    setMode,
    setVisibleWidgets
  };
}
```

---

## 🎯 Command Palette (⌘K)

### Command Palette Component
```typescript
// components/CommandPalette.tsx
import { Command } from "cmdk";

export function CommandPalette({ commands }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command..." />
      <Command.List>
        {commands.map(cmd => (
          <Command.Item key={cmd.id} onSelect={cmd.action}>
            {cmd.icon} {cmd.name}
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
```

---

## 🔐 Authentication

### Auth Hook
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [status, setStatus] = useState<"authenticated" | "unauthenticated">("unauthenticated");
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  useEffect(() => {
    // Check if password or token mode
    const token = localStorage.getItem("gateway-token");
    if (token) {
      setStatus("authenticated");
    } else {
      setIsPasswordMode(true);
    }
  }, []);

  const login = async (password: string) => {
    // Authenticate with gateway
    const response = await fetch(`${GATEWAY_URL}/auth`, {
      method: "POST",
      body: JSON.stringify({ password })
    });
    if (response.ok) {
      setStatus("authenticated");
    }
  };

  return { status, isPasswordMode, login };
}
```

---

## 📊 Recommended Widgets

### Phase 1 (Core)
1. **StatusWidget** - Gateway health, channels
2. **SessionsWidget** - Active sessions list
3. **ChannelsWidget** - Channel status cards

### Phase 2 (Enhanced)
4. **UsageWidget** - Stats, costs, token usage
5. **ActivityWidget** - Recent activity feed
6. **HealthWidget** - System health metrics

### Phase 3 (Advanced)
7. **CalendarWidget** - Upcoming events
8. **TasksWidget** - Pending tasks
9. **MemoryWidget** - Memory usage stats

---

## 🚀 Implementation Steps

### Step 1: Setup Project
```bash
npx create-next-app@latest zaki-dashboard --typescript --tailwind --app
cd zaki-dashboard
npx shadcn-ui@latest init
```

### Step 2: Create API Wrapper
- Create `lib/api.ts` with Gateway API wrapper
- Add TypeScript types for Gateway responses

### Step 3: Build Core Hooks
- `useSessions` - Session data
- `useChannels` - Channel data
- `useDashboard` - Dashboard data aggregation

### Step 4: Create Widget Components
- Start with StatusWidget
- Add SessionsWidget
- Add ChannelsWidget

### Step 5: Build Pages
- Dashboard page with widget grid
- Sessions management page
- Channels status page

### Step 6: Add Real-time
- WebSocket integration
- Live updates for sessions/channels

### Step 7: Polish
- Command palette
- Settings panel
- Loading/error states

---

## 📁 File Structure

```
zaki-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard)
│   │   ├── sessions/
│   │   │   └── page.tsx
│   │   └── channels/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── widgets/
│   │   │   ├── StatusWidget.tsx
│   │   │   ├── SessionsWidget.tsx
│   │   │   └── ChannelsWidget.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── CommandPalette.tsx
│   ├── hooks/
│   │   ├── useSessions.ts
│   │   ├── useChannels.ts
│   │   ├── useDashboard.ts
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   └── api.ts
│   └── types/
│       └── gateway.ts
└── package.json
```

---

## 💡 Key Takeaways

1. **Widget Architecture** - Modular, reusable widgets
2. **API Abstraction** - Clean wrapper for Gateway API
3. **Custom Hooks** - Reusable data fetching logic
4. **Real-time Updates** - WebSocket for live data
5. **Type Safety** - TypeScript throughout
6. **Modern UI** - shadcn/ui components
7. **Command Palette** - ⌘K for quick actions
8. **Settings** - User-configurable widgets

---

**Status:** Ready to implement! All patterns documented and ready to use.
