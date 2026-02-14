# Zaki Platform - Technical Specification

**Date:** 2026-02-10  
**Version:** 1.0  
**Purpose:** Detailed technical specification for implementation

---

## 🏗️ System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Zaki Platform Stack                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Layer                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web App     │  │  Dashboard   │  │  Landing     │     │
│  │  (Next.js)   │  │  (React)     │  │  (Next.js)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│  API Layer                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express API Server                                  │  │
│  │  - REST endpoints                                     │  │
│  │  - WebSocket server                                   │  │
│  │  - Authentication                                     │  │
│  │  - Rate limiting                                      │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                      │                                      │
│  Business Logic Layer                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Instance Manager                                     │  │
│  │  - Container lifecycle                                │  │
│  │  - OpenClaw config generation                         │  │
│  │  - Health monitoring                                  │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                      │                                      │
│  Data Layer                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │  R2 Storage  │  │    Redis     │     │
│  │ (Metadata)   │  │ (User Data)  │  │   (Cache)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Container Layer                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Host                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │User 1    │  │User 2    │  │User N    │          │  │
│  │  │Container │  │Container │  │Container │          │  │
│  │  │          │  │          │  │          │          │  │
│  │  │OpenClaw  │  │OpenClaw  │  │OpenClaw  │          │  │
│  │  │Gateway   │  │Gateway   │  │Gateway   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Specifications

### 1. Web Application (Next.js 15)

**Purpose:** Main user-facing web application

**Tech Stack:**
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS 4
- Components: shadcn/ui
- Forms: React Hook Form + Zod
- Auth: NextAuth.js

**Pages:**
- `/` - Landing page
- `/signup` - Registration
- `/login` - Login
- `/dashboard` - Main dashboard (redirect)
- `/onboarding` - Bot setup flow
- `/settings` - User settings

**Features:**
- Server-side rendering
- Static generation for landing
- API routes for backend calls
- Middleware for auth
- SEO optimized

**File Structure:**
```
web-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (landing)
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── onboarding/
│   │   └── settings/
│   └── api/
│       └── auth/
├── components/
│   ├── ui/ (shadcn)
│   ├── layout/
│   └── features/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
└── types/
```

---

### 2. Dashboard (React 18 + Vite)

**Purpose:** Rich dashboard for managing AI assistant

**Tech Stack:**
- Framework: React 18
- Build: Vite
- Language: TypeScript
- Styling: Tailwind CSS 4
- Components: shadcn/ui
- Charts: Recharts
- Routing: React Router
- State: React Context + Hooks
- Real-time: WebSocket

**Pages:**
- `/dashboard` - Overview with widgets
- `/sessions` - Session management
- `/channels` - Channel status
- `/settings` - Instance settings
- `/usage` - Usage stats
- `/memory` - Memory browser

**Widgets:**
- StatusWidget
- SessionsWidget
- ChannelsWidget
- UsageWidget
- ActivityWidget
- MemoryWidget
- CalendarWidget
- TasksWidget

**Features:**
- Real-time updates (WebSocket)
- Command palette (⌘K)
- Dark/light mode
- Responsive design
- Customizable layout

**File Structure:**
```
dashboard/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── widgets/
│   │   ├── layout/
│   │   └── pages/
│   ├── hooks/
│   │   ├── useSessions.ts
│   │   ├── useChannels.ts
│   │   ├── useDashboard.ts
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── websocket.ts
│   └── types/
├── public/
└── package.json
```

---

### 3. API Server (Express)

**Purpose:** Backend API for web app and dashboard

**Tech Stack:**
- Framework: Express.js
- Language: TypeScript
- Validation: Zod
- Auth: JWT
- Database: PostgreSQL (via Prisma)
- Storage: R2 (via AWS SDK)
- Cache: Redis (via ioredis)
- Queue: Bull (via Redis)

**Endpoints:**

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

**Users:**
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update user
- `DELETE /api/users/me` - Delete account

**Instances:**
- `GET /api/instances` - List user instances
- `POST /api/instances` - Create instance
- `GET /api/instances/:id` - Get instance
- `PATCH /api/instances/:id` - Update instance
- `DELETE /api/instances/:id` - Delete instance
- `POST /api/instances/:id/start` - Start container
- `POST /api/instances/:id/stop` - Stop container
- `POST /api/instances/:id/restart` - Restart container

**Onboarding:**
- `POST /api/onboarding/validate-bot-token` - Validate token
- `POST /api/onboarding/provision` - Provision instance

**WebSocket:**
- `WS /ws` - Real-time updates
  - Events: instance.status, session.update, channel.update

**File Structure:**
```
api-server/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── instances.ts
│   │   └── onboarding.ts
│   ├── services/
│   │   ├── instance-manager.ts
│   │   ├── container-service.ts
│   │   └── openclaw-config.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   ├── utils/
│   │   ├── docker.ts
│   │   ├── encryption.ts
│   │   └── validation.ts
│   └── types/
├── prisma/
│   └── schema.prisma
└── package.json
```

---

### 4. Instance Manager

**Purpose:** Manage Docker containers and OpenClaw instances

**Responsibilities:**
- Create containers
- Start/stop containers
- Generate OpenClaw configs
- Monitor health
- Clean up resources

**Implementation:**
```typescript
class InstanceManager {
  async createInstance(userId: string, botToken: string): Promise<Instance> {
    // 1. Generate container name
    // 2. Create data directories
    // 3. Generate OpenClaw config
    // 4. Create Docker container
    // 5. Start container
    // 6. Wait for gateway ready
    // 7. Return instance info
  }

  async startInstance(instanceId: string): Promise<void> {
    // Start Docker container
    // Wait for gateway ready
  }

  async stopInstance(instanceId: string): Promise<void> {
    // Stop Docker container
  }

  async deleteInstance(instanceId: string): Promise<void> {
    // Stop container
    // Remove container
    // Clean up data
  }

  async getInstanceStatus(instanceId: string): Promise<Status> {
    // Check container status
    // Check gateway health
    // Return status
  }
}
```

**OpenClaw Config Generation:**
```typescript
function generateOpenClawConfig(params: {
  botToken: string;
  model: string;
  workspace: string;
}): OpenClawConfig {
  return {
    gateway: {
      port: 18789,
      bind: "lan",
      auth: { mode: "token", token: generateToken() }
    },
    channels: {
      telegram: {
        enabled: true,
        botToken: params.botToken
      }
    },
    agents: {
      defaults: {
        model: { primary: params.model }
      }
    },
    agent: {
      workspace: params.workspace
    }
  };
}
```

---

### 5. Database Schema (PostgreSQL)

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Instances Table:**
```sql
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  container_name VARCHAR(255) UNIQUE NOT NULL,
  port INTEGER UNIQUE NOT NULL,
  bot_token_encrypted TEXT NOT NULL,
  bot_username VARCHAR(255),
  status VARCHAR(50) DEFAULT 'stopped',
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sessions Table (Metadata):**
```sql
CREATE TABLE session_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  session_key VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  message_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(instance_id, session_key)
);
```

---

### 6. Storage Structure (R2)

**User Data:**
```
users/
└── {user_id}/
    └── .openclaw/
        ├── openclaw.json (config)
        ├── agents/
        │   └── main/
        │       └── sessions/
        │           ├── {session_id}.jsonl
        │           └── sessions.json
        └── workspace/
            ├── SOUL.md
            ├── IDENTITY.md
            ├── USER.md
            ├── MEMORY.md
            ├── preferences/
            ├── relationships/
            ├── knowledge/
            └── context/
```

**Backup Strategy:**
- Daily backups (automated)
- Incremental backups (every 6 hours)
- Retention: 30 days
- Encryption: Server-side

---

## 🔌 API Specifications

### REST API

**Base URL:** `https://api.zakified.com/v1`

**Authentication:**
```
Authorization: Bearer {jwt_token}
```

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Error Format:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### WebSocket API

**Connection:**
```
wss://api.zakified.com/ws?token={jwt_token}
```

**Events:**

**Client → Server:**
- `subscribe:instance.{id}` - Subscribe to instance updates
- `subscribe:sessions.{instance_id}` - Subscribe to session updates
- `unsubscribe:*` - Unsubscribe from all

**Server → Client:**
- `instance.status` - Instance status changed
- `session.created` - New session created
- `session.updated` - Session updated
- `channel.connected` - Channel connected
- `channel.disconnected` - Channel disconnected

---

## 🐳 Container Specifications

### Docker Image
```dockerfile
FROM alpine/openclaw:latest

# User data mounted as volumes
VOLUME ["/home/node/.openclaw", "/home/node/workspace"]

# Expose gateway port
EXPOSE 18789

# Start gateway
CMD ["openclaw", "gateway", "--port", "18789", "--verbose"]
```

### Container Configuration
```typescript
{
  Image: 'alpine/openclaw:latest',
  name: `zaki-user-${userId}`,
  ExposedPorts: { '18789/tcp': {} },
  HostConfig: {
    Memory: 2 * 1024 * 1024 * 1024, // 2GB
    CpuShares: 1024,
    PortBindings: {
      '18789/tcp': [{ HostPort: String(port) }]
    },
    Binds: [
      `${userDataDir}/.openclaw:/home/node/.openclaw:rw`,
      `${userDataDir}/workspace:/home/node/workspace:rw`
    ],
    RestartPolicy: { Name: 'unless-stopped' }
  },
  Env: [
    'NODE_OPTIONS=--max-old-space-size=1024'
  ]
}
```

---

## 🔐 Security Specifications

### Encryption

**Bot Tokens:**
- Algorithm: AES-256-GCM
- Key: Derived from master key + user ID
- Storage: Encrypted in database

**API Keys:**
- Algorithm: AES-256-GCM
- Key: Environment variable
- Storage: Encrypted in database

### Authentication

**JWT Tokens:**
- Algorithm: HS256
- Expiry: 15 minutes (access), 7 days (refresh)
- Storage: HttpOnly cookies

**Rate Limiting:**
- API: 100 requests/minute per user
- Auth: 5 attempts/minute per IP
- WebSocket: 10 connections per user

### Network Security

**Firewall Rules:**
- SSH: Port 22 (restricted IPs)
- API: Port 443 (HTTPS only)
- Containers: No external ports
- Internal: Docker network only

---

## 📊 Monitoring & Observability

### Metrics

**Application Metrics:**
- Request rate
- Response time
- Error rate
- Active users
- Container count

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Container health

### Logging

**Structured Logs (JSON):**
```json
{
  "timestamp": "2026-02-10T12:00:00Z",
  "level": "info",
  "service": "api-server",
  "message": "Instance created",
  "user_id": "uuid",
  "instance_id": "uuid",
  "duration_ms": 1234
}
```

**Log Levels:**
- ERROR: Errors requiring attention
- WARN: Warnings
- INFO: Important events
- DEBUG: Detailed debugging

### Alerting

**Alerts:**
- Error rate > 1%
- Response time > 1s (p95)
- Container failure
- Disk usage > 80%
- Memory usage > 90%

---

## 🚀 Deployment

### Environment Variables

**API Server:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
REDIS_URL=redis://...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

**Container Host:**
```env
DOCKER_HOST=unix:///var/run/docker.sock
DATA_DIR=/var/zaki-platform/users
LOG_DIR=/var/zaki-platform/logs
```

### Deployment Steps

1. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Build Applications:**
   ```bash
   npm run build
   ```

3. **Start Services:**
   ```bash
   pm2 start ecosystem.config.js
   ```

4. **Health Check:**
   ```bash
   curl https://api.zakified.com/health
   ```

---

**Status:** Technical specification complete. Ready for implementation.
