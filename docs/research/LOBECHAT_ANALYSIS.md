# LobeChat Codebase Analysis

**Version Analyzed:** 2.1.13  
**Analysis Date:** February 3, 2026  
**Purpose:** Deep research for Zaki Platform integration planning

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [API Layer](#2-api-layer)
3. [Authentication & Multi-tenancy](#3-authentication--multi-tenancy)
4. [Database Schema](#4-database-schema)
5. [Agent Runtime](#5-agent-runtime)
6. [Model Provider Layer](#6-model-provider-layer)
7. [MCP Plugin System](#7-mcp-plugin-system)
8. [Key Features Implementation](#8-key-features-implementation)
9. [Deployment](#9-deployment)
10. [Integration Points for Zaki Platform](#10-integration-points-for-zaki-platform)

---

## 1. Architecture Overview

### Project Structure

LobeChat is a **pnpm monorepo** with the following organization:

```
lobe-chat/
├── src/                     # Main Next.js application
│   ├── app/                 # Next.js app router pages & API routes
│   │   ├── (backend)/       # Server-side API routes
│   │   │   ├── api/         # REST API endpoints
│   │   │   ├── trpc/        # tRPC endpoints (lambda, async, tools, mobile)
│   │   │   └── oidc/        # OIDC provider routes
│   │   └── [variants]/      # Frontend pages
│   ├── server/              # Server-side logic
│   │   ├── modules/         # Core modules (AgentRuntime, S3, etc.)
│   │   ├── routers/         # tRPC routers
│   │   └── services/        # Database/business services
│   ├── services/            # Client-side service layer
│   ├── store/               # Zustand state management
│   ├── components/          # React components (77 directories!)
│   ├── features/            # Feature modules (65 directories)
│   ├── libs/                # Library integrations
│   │   ├── better-auth/     # Authentication configuration
│   │   ├── trpc/            # tRPC setup
│   │   ├── mcp/             # MCP client
│   │   └── ...
│   └── hooks/               # React hooks
├── packages/                # Internal packages (38 packages)
│   ├── agent-runtime/       # Agent execution engine
│   ├── model-runtime/       # Multi-provider model abstraction
│   ├── database/            # Drizzle ORM schemas & repositories
│   ├── context-engine/      # Message context processing
│   ├── conversation-flow/   # Conversation tree parsing
│   ├── file-loaders/        # Document parsing (PDF, DOCX, etc.)
│   ├── memory-user-memory/  # User memory extraction
│   ├── builtin-tool-*/      # 13+ builtin tools
│   └── ...
├── apps/
│   └── desktop/             # Electron desktop app
└── docker-compose/          # Docker configurations
```

### Monorepo Organization

**Workspaces defined in `pnpm-workspace.yaml`:**
- `packages/*` - Core shared packages
- `packages/business/*` - Business/premium features
- `e2e` - E2E tests
- `apps/desktop/src/main` - Electron main process

### Key Dependencies

| Category | Package | Purpose |
|----------|---------|---------|
| **Framework** | Next.js 16 | Full-stack React framework |
| **Database** | drizzle-orm + pg | PostgreSQL ORM |
| **API** | tRPC 11 | Type-safe API layer |
| **Auth** | better-auth 1.4.6 | Modern authentication |
| **AI SDKs** | openai, @anthropic-ai/sdk, @google/genai | Provider SDKs |
| **State** | zustand 5 | Client state management |
| **UI** | @lobehub/ui, antd 6 | Component library |
| **MCP** | @modelcontextprotocol/sdk | Plugin protocol |
| **Storage** | @aws-sdk/client-s3 | S3-compatible storage |
| **Queue** | @upstash/qstash | Async task processing |

---

## 2. API Layer

### Communication Architecture

LobeChat uses **tRPC** as its primary API layer with multiple router types:

```
Frontend (React) ──► tRPC Client ──► tRPC Server (Next.js API routes) ──► Database
                                            │
                                            ├── lambda/  (main API, authenticated)
                                            ├── async/   (background jobs)
                                            ├── tools/   (MCP/plugins)
                                            └── mobile/  (mobile-specific)
```

### tRPC Router Structure

**Main Lambda Router** (`src/server/routers/lambda/index.ts`):

```typescript
export const lambdaRouter = router({
  // Core features
  agent: agentRouter,           // Agent CRUD
  session: sessionRouter,       // Chat sessions
  message: messageRouter,       // Messages
  topic: topicRouter,           // Topics (conversations)
  thread: threadRouter,         // Threaded conversations
  
  // AI features
  aiAgent: aiAgentRouter,       // AI agent execution
  aiChat: aiChatRouter,         // Chat completions
  aiModel: aiModelRouter,       // Model management
  aiProvider: aiProviderRouter, // Provider configuration
  
  // Knowledge & RAG
  file: fileRouter,
  knowledgeBase: knowledgeBaseRouter,
  chunk: chunkRouter,
  document: documentRouter,
  search: searchRouter,
  
  // User & settings
  user: userRouter,
  userMemory: userMemoryRouter,
  userMemories: userMemoriesRouter,
  
  // Business features
  subscription: subscriptionRouter,
  spend: spendRouter,
  topUp: topUpRouter,
});
```

### Authentication Flow

tRPC procedures are protected with middleware:

```typescript
// src/libs/trpc/lambda/index.ts
const baseProcedure = trpc.procedure.use(openTelemetry);
export const publicProcedure = baseProcedure;
export const authedProcedure = baseProcedure.use(oidcAuth).use(userAuth);
```

**Context creation** (`src/libs/trpc/lambda/context.ts`):
1. Check for OIDC token (header: `Oidc-Auth`)
2. Fall back to Better Auth session
3. Extract user ID, client IP, market access token

### API Routes

REST endpoints exist alongside tRPC:
- `/api/auth/[...all]` - Better Auth handlers
- `/api/agent/run` - Agent execution
- `/api/agent/stream` - Streaming agent responses
- `/api/webhooks/*` - Background job handlers

---

## 3. Authentication & Multi-tenancy

### Authentication System: Better Auth

**Configuration** (`src/libs/better-auth/define-config.ts`):

```typescript
export function defineConfig(customOptions) {
  return betterAuth({
    // Core
    baseURL: appEnv.APP_URL,
    secret: authEnv.AUTH_SECRET,
    
    // Email/Password
    emailAndPassword: {
      enabled: !authEnv.AUTH_DISABLE_EMAIL_PASSWORD,
      requireEmailVerification: authEnv.AUTH_EMAIL_VERIFICATION,
      password: {
        // Compatible with bcrypt (Clerk migration)
        verify: async ({ hash, password }) => {
          if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
            return bcrypt.compare(password, hash);
          }
          return defaultVerifyPassword({ hash, password });
        },
      },
    },
    
    // Database
    database: drizzleAdapter(serverDB, { provider: 'pg', schema }),
    
    // Plugins
    plugins: [
      expo(),                    // Mobile support
      emailOTP(),               // OTP verification
      passkey(),                // WebAuthn passkeys
      admin(),                  // Admin features
      magicLink(),              // Magic link auth
      genericOAuth({ config }), // Configurable OAuth
    ],
    
    // User bootstrap
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await userService.initUser({ ...user });
          },
        },
      },
    },
  });
}
```

### Supported Auth Providers

Via `AUTH_SSO_PROVIDERS` environment variable:
- Google
- GitHub
- Microsoft (Azure AD)
- Generic OAuth (configurable)
- Magic Link
- Email + Password
- Passkeys (WebAuthn)
- Mobile OTP

### Multi-tenancy & Data Isolation

**Every table has `userId` foreign key** for data isolation:

```typescript
// Example from agents table
agents = pgTable('agents', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  // ... other fields
});
```

**Indexes for efficient filtering:**
```typescript
index('agents_user_id_idx').on(t.userId),
```

**Client ID for sync:**
```typescript
clientId: text('client_id'),
uniqueIndex('client_id_user_id_unique').on(t.clientId, t.userId),
```

### RBAC System

Full role-based access control:

```typescript
// Tables
roles           // admin, user, guest, etc.
permissions     // chat:create, file:upload, etc.
rolePermissions // Many-to-many
userRoles       // With optional expiry
```

---

## 4. Database Schema

### Core Entity Relationship

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                         users                           │
                    │  id, email, username, avatar, preference, role, etc.    │
                    └────────────────────────┬────────────────────────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
         ▼                                   ▼                                   ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│     agents      │               │    sessions     │               │  knowledgeBases │
│  (AI assistants)│               │ (conversation   │               │   (RAG stores)  │
│                 │               │   containers)   │               │                 │
└────────┬────────┘               └────────┬────────┘               └────────┬────────┘
         │                                 │                                 │
         │    ┌────────────────────────────┼────────────────────────────┐    │
         │    │                            │                            │    │
         ▼    ▼                            ▼                            ▼    ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│ agentsToSessions│               │     topics      │               │knowledgeBaseFiles│
│   (junction)    │               │ (conversations) │               │   (junction)    │
└─────────────────┘               └────────┬────────┘               └─────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │    messages     │    │    threads      │    │  messageGroups  │
          │ (chat messages) │    │(branching/tasks)│    │(parallel models)│
          └────────┬────────┘    └─────────────────┘    └─────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│messagePlugins│ │messagesFiles│ │messageQueries│
│(tool calls)│ │(attachments)│ │(RAG queries) │
└──────────┘ └──────────┘ └──────────────┘
```

### Complete Table List

#### User & Auth
| Table | Purpose |
|-------|---------|
| `users` | Core user data (id, email, username, avatar, preference, onboarding, banned status) |
| `user_settings` | User preferences (TTS, hotkeys, keyVaults, language model config) |
| `user_installed_plugins` | MCP/plugin installations per user |
| `auth_sessions` | Better Auth sessions |
| `accounts` | OAuth account links |
| `verifications` | Email/phone verification tokens |
| `two_factor` | 2FA secrets |
| `passkey` | WebAuthn credentials |

#### Agent & Session
| Table | Purpose |
|-------|---------|
| `agents` | AI assistant definitions (systemRole, model, provider, plugins, chatConfig) |
| `agents_knowledge_bases` | Agent ↔ Knowledge base links |
| `agents_files` | Agent ↔ File associations |
| `session_groups` | Session folder organization |
| `sessions` | Chat session containers |
| `agents_to_sessions` | Agent ↔ Session assignments |

#### Conversation
| Table | Purpose |
|-------|---------|
| `topics` | Conversation threads within sessions |
| `threads` | Sub-threads (continuation, standalone, isolation types) |
| `messages` | Chat messages (user, assistant, tool roles) |
| `message_groups` | Parallel model comparison groups |
| `message_plugins` | Tool call data and intervention state |
| `message_tts` | TTS audio cache |
| `message_translates` | Translation cache |
| `messages_files` | Message ↔ File attachments |
| `topic_documents` | Topic ↔ Document associations |
| `topic_shares` | Public sharing configuration |

#### Files & Knowledge
| Table | Purpose |
|-------|---------|
| `global_files` | Deduplicated file storage (by hash) |
| `files` | User file references |
| `documents` | Parsed document content with pages |
| `knowledge_bases` | RAG knowledge base containers |
| `knowledge_base_files` | KB ↔ File links |
| `chunks` | Text chunks for embedding |
| `embeddings` | Vector embeddings (1024 dimensions) |
| `unstructured_chunks` | Raw parsed chunks |
| `document_chunks` | Document ↔ Chunk links |
| `file_chunks` | File ↔ Chunk links |
| `message_queries` | RAG query logs |
| `message_query_chunks` | Query ↔ Chunk results with similarity |

#### AI Infrastructure
| Table | Purpose |
|-------|---------|
| `ai_providers` | User-configured AI providers |
| `ai_models` | User-configured/discovered models |
| `api_keys` | API key storage (encrypted) |

#### Multi-Agent
| Table | Purpose |
|-------|---------|
| `chat_groups` | Multi-agent chat containers |
| `chat_groups_agents` | Group ↔ Agent assignments with roles |

#### Advanced Features
| Table | Purpose |
|-------|---------|
| `agent_cron_jobs` | Scheduled agent tasks |
| `async_tasks` | Background task tracking |
| `generations` | Image/content generation records |
| `generation_batches` | Batch generation groups |
| `generation_topics` | Generation categories |
| `rbac_roles` | Role definitions |
| `rbac_permissions` | Permission definitions |
| `rbac_role_permissions` | Role ↔ Permission links |
| `rbac_user_roles` | User ↔ Role assignments |
| `user_memories` | Extracted user memory facts |
| `personas` | User persona profiles |

#### RAG Evaluation
| Table | Purpose |
|-------|---------|
| `rag_eval_datasets` | Evaluation datasets |
| `rag_eval_records` | Evaluation run records |

---

## 5. Agent Runtime

### Core Architecture

The agent runtime (`packages/agent-runtime/`) implements a **Plan → Execute** decision loop:

```
┌─────────────────────────────────────────────────────────────────┐
│                      AgentRuntime                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    GeneralChatAgent                         ││
│  │                                                             ││
│  │  runner(context, state) → AgentInstruction[]                ││
│  │                                                             ││
│  │  Phases:                                                    ││
│  │  - init/user_input → call_llm                              ││
│  │  - llm_result → check tools → call_tools/request_approval  ││
│  │  - tool_result → call_llm (loop)                           ││
│  │  - compression_result → call_llm (after context compress)  ││
│  │  - human_abort → resolve_aborted_tools → finish            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Executors                               ││
│  │  - call_llm: Stream LLM response                           ││
│  │  - call_tool: Execute single tool                          ││
│  │  - call_tools_batch: Parallel tool execution               ││
│  │  - request_human_approve: Wait for user approval           ││
│  │  - finish: Complete execution                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### GeneralChatAgent Decision Loop

**From `packages/agent-runtime/src/agents/GeneralChatAgent.ts`:**

```typescript
class GeneralChatAgent implements Agent {
  async runner(context: AgentRuntimeContext, state: AgentState) {
    switch (context.phase) {
      case 'init':
      case 'user_input':
        // Check if context compression needed
        if (shouldCompress(state.messages)) {
          return { type: 'compress_context', payload: { messages } };
        }
        return { type: 'call_llm', payload: { messages } };

      case 'llm_result':
        const { hasToolsCalling, toolsCalling } = context.payload;
        
        if (hasToolsCalling) {
          // Check intervention requirements
          const [needsApproval, canExecute] = this.checkInterventionNeeded(toolsCalling, state);
          
          const instructions = [];
          
          // Execute safe tools immediately
          if (canExecute.length > 0) {
            instructions.push({ type: 'call_tools_batch', payload: { toolsCalling: canExecute } });
          }
          
          // Request approval for sensitive tools
          if (needsApproval.length > 0) {
            instructions.push({ type: 'request_human_approve', pendingToolsCalling: needsApproval });
          }
          
          return instructions;
        }
        
        return { type: 'finish', reason: 'completed' };

      case 'tool_result':
      case 'tools_batch_result':
        // Check for pending approvals
        const pending = state.messages.filter(m => m.pluginIntervention?.status === 'pending');
        if (pending.length > 0) {
          return { type: 'request_human_approve', pendingToolsCalling: pending };
        }
        
        // Continue LLM loop with tool results
        return { type: 'call_llm', payload: { messages: state.messages } };
    }
  }
}
```

### Human Intervention System

**Intervention modes** (from user config):
- `auto-run` - Execute all tools automatically
- `manual` - Check tool's own intervention config
- `allow-list` - Only auto-execute whitelisted tools
- `headless` - Skip blacklisted tools, execute rest (for async tasks)

**Intervention checking** (`InterventionChecker`):

```typescript
// Security blacklist (always requires approval)
const securityBlacklist = [
  { pattern: /password|secret|key/i, type: 'contains' },
  { pattern: /delete|remove|drop/i, type: 'contains' },
  // ...
];

// Tool-level policies
type HumanInterventionConfig = 
  | 'always'      // Always require approval
  | 'never'       // Never require approval
  | Array<{       // Conditional rules
      policy: 'always' | 'never';
      match?: Record<string, string>;  // Parameter matching
    }>;
```

### Agent State

```typescript
interface AgentState {
  operationId: string;
  status: 'idle' | 'running' | 'waiting_for_human' | 'interrupted' | 'done' | 'error';
  messages: Message[];
  tools: Tool[];
  toolManifestMap: Record<string, ToolManifest>;
  
  // Execution tracking
  stepCount: number;
  maxSteps?: number;
  
  // Human intervention
  userInterventionConfig?: UserInterventionConfig;
  securityBlacklist?: SecurityRule[];
  pendingToolsCalling?: ChatToolPayload[];
  
  // Usage/Cost tracking
  usage: Usage;
  cost: Cost;
  costLimit?: CostLimit;
}
```

---

## 6. Model Provider Layer

### Architecture

The model runtime (`packages/model-runtime/`) provides a unified interface for 70+ AI providers:

```
┌─────────────────────────────────────────────────────────────────┐
│                       ModelRuntime                               │
│                                                                  │
│  static initializeWithProvider(provider, params) → ModelRuntime │
│                                                                  │
│  Methods:                                                        │
│  - chat(payload, options)                                        │
│  - generateObject(payload)                                       │
│  - createImage(payload)                                          │
│  - embeddings(payload)                                           │
│  - textToSpeech(payload)                                         │
│  - models()                                                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      providerRuntimeMap                          │
│  {                                                               │
│    openai: LobeOpenAI,                                          │
│    anthropic: LobeAnthropicAI,                                  │
│    google: LobeGoogleAI,                                        │
│    azure: LobeAzureOpenAI,                                      │
│    bedrock: LobeBedrockAI,                                      │
│    ollama: LobeOllamaAI,                                        │
│    deepseek: LobeDeepSeekAI,                                    │
│    // ... 60+ more providers                                    │
│  }                                                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LobeRuntimeAI                             │
│  (Base class for all providers)                                  │
│                                                                  │
│  abstract chat(payload, options): Promise<Response>              │
│  optional generateObject(payload)                                │
│  optional createImage(payload)                                   │
│  optional embeddings(payload)                                    │
│  optional textToSpeech(payload)                                  │
│  optional models()                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Supported Providers (70+)

**Major providers:**
- OpenAI, Azure OpenAI
- Anthropic (Claude)
- Google (Gemini), Vertex AI
- AWS Bedrock
- Mistral, Groq, Cohere
- DeepSeek, Qwen, Zhipu
- Ollama (local)
- OpenRouter (aggregator)
- HuggingFace, Replicate
- ComfyUI (image generation)
- FAL, BFL (image models)

### OpenAI-Compatible Factory

For providers using OpenAI-compatible APIs:

```typescript
// packages/model-runtime/src/core/openaiCompatibleFactory.ts
export function createOpenAICompatibleRuntime(config: {
  apiKey: string;
  baseURL: string;
  modelList?: string[];
}) {
  // Creates a provider with OpenAI SDK
}
```

### Context Building

`packages/context-engine/` processes messages before LLM calls:

```typescript
const engine = new ContextEngine({
  providers: [
    new SystemRoleProvider(),      // Inject system prompt
    new KnowledgeBaseProvider(),   // RAG retrieval
    new UserMemoryProvider(),      // User context
    new FileContentProvider(),     // Attached files
  ],
  processors: [
    new HistoryTruncateProcessor(),    // Token limit
    new MessageCleanupProcessor(),     // Remove empty
    new ToolCallProcessor(),           // Format tool calls
    new PlaceholderVariablesProcessor(), // Template substitution
  ],
});
```

---

## 7. MCP Plugin System

### MCP (Model Context Protocol) Integration

LobeChat supports MCP plugins via three transport types:

1. **stdio** - Local subprocess (Desktop only)
2. **http/sse** - HTTP-based servers
3. **cloud** - LobeHub-hosted cloud plugins

### Plugin Service (`src/services/mcp.ts`)

```typescript
class MCPService {
  async invokeMcpToolCall(payload: ChatToolPayload, options) {
    const plugin = getInstalledPlugin(payload.identifier);
    const connection = plugin.customParams?.mcp;
    
    if (connection?.type === 'cloud') {
      // Call via cloud gateway
      return toolsClient.market.callCloudMcpEndpoint.mutate({
        apiParams,
        identifier,
        toolName: apiName,
      });
    }
    
    if (isDesktop && connection?.type === 'stdio') {
      // IPC to Electron main process
      return electronIpc.mcp.callTool(data);
    }
    
    // HTTP/SSE via server relay
    return toolsClient.mcp.callTool.mutate(data);
  }
}
```

### Builtin Tools (13 packages)

| Package | Purpose |
|---------|---------|
| `builtin-tool-knowledge-base` | RAG search & file reading |
| `builtin-tool-memory` | User memory management |
| `builtin-tool-web-browsing` | Web search & page reading |
| `builtin-tool-cloud-sandbox` | Code execution sandbox |
| `builtin-tool-python-interpreter` | Python REPL |
| `builtin-tool-notebook` | Note-taking |
| `builtin-tool-gtd` | Task management (GTD) |
| `builtin-tool-agent-builder` | Create agents |
| `builtin-tool-group-agent-builder` | Create agent groups |
| `builtin-tool-group-management` | Multi-agent orchestration |
| `builtin-tool-page-agent` | Browser automation |
| `builtin-tool-local-system` | File system access (Desktop) |

### Plugin Manifest Structure

```typescript
interface PluginManifest {
  identifier: string;
  type: 'plugin' | 'customPlugin';
  meta: {
    title: string;
    description: string;
    avatar: string;
  };
  api: Array<{
    name: string;
    description: string;
    parameters: JSONSchema;
    humanIntervention?: HumanInterventionConfig;
  }>;
  customParams?: {
    mcp?: {
      type: 'stdio' | 'http' | 'sse' | 'cloud';
      command?: string;     // For stdio
      args?: string[];
      env?: Record<string, string>;
      url?: string;         // For http/sse
      headers?: Record<string, string>;
    };
  };
}
```

---

## 8. Key Features Implementation

### Knowledge Base (RAG)

**Flow:**
1. File upload → Parse (`packages/file-loaders/`)
2. Create document → Chunk text
3. Generate embeddings (1024-dim vectors)
4. Store in `embeddings` table with pgvector
5. Query: Embed query → Vector similarity search → Return chunks

**Key tables:**
- `knowledge_bases` - KB containers
- `documents` - Parsed content with pages
- `chunks` - Text segments
- `embeddings` - Vector storage (pgvector)
- `message_queries` - Query history

### File Uploads

**Storage:**
- S3-compatible storage (AWS S3, MinIO, Cloudflare R2)
- Global file deduplication by SHA-256 hash
- Presigned URLs for direct uploads

**Processing:**
- Supported: PDF, DOCX, XLSX, EPUB, TXT, Markdown, images
- Loaders: pdf-parse, mammoth, officeparser, epub2

### TTS/STT

**TTS:**
- Per-message audio caching (`message_tts` table)
- Multiple providers via `@lobehub/tts`
- Content hash for cache invalidation

**STT:**
- Browser-based (Web Speech API)
- Provider APIs (OpenAI Whisper, etc.)

### User Memory

**Memory extraction** (`packages/memory-user-memory/`):

```typescript
// Extract facts from conversations
const extractor = new MemoryExtractionService({
  provider: modelRuntime,
  schema: memorySchema,
});

// Extracted data types:
interface UserMemory {
  type: 'preference' | 'fact' | 'relationship' | 'goal';
  content: string;
  confidence: number;
  source: { topicId, messageId };
}
```

**Storage:**
- `user_memories` - Extracted facts
- `personas` - Synthesized user profiles

### Agent Marketplace

**Integration with LobeHub Market:**
- `@lobehub/market-sdk` for API
- Public agent sharing
- Usage analytics

---

## 9. Deployment

### Docker Setup

**Dockerfile features:**
- Multi-stage build (base → builder → app → final)
- Distroless final image for security
- Proxychains support
- Automatic DB migration on start

**Key environment variables:**

```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/db
DATABASE_DRIVER=node

# Auth
AUTH_SECRET=<random-string>
AUTH_SSO_PROVIDERS=github,google

# Storage
S3_ENDPOINT=https://s3.example.com
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=lobechat

# AI Providers
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=xxx
# ... 50+ provider keys
```

### Docker Compose Options

```
docker-compose/
├── local/          # Local development
├── production/     # Production with PostgreSQL
└── deploy/         # Cloud deploy configs
```

### Database Requirements

- PostgreSQL 15+ (for pgvector)
- pgvector extension enabled
- Initial migration: `npm run db:migrate`

### Redis (Optional)

For session caching and rate limiting:
```bash
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=lobechat
```

---

## 10. Integration Points for Zaki Platform

### What We Can Reuse As-Is

| Component | Reusability | Notes |
|-----------|-------------|-------|
| **Database schemas** | ✅ High | Well-designed, user-isolated, comprehensive |
| **Model runtime** | ✅ High | 70+ providers, clean abstraction |
| **File loaders** | ✅ High | PDF, DOCX, EPUB parsing |
| **Agent runtime types** | ✅ High | State machine, intervention system |
| **Conversation flow** | ✅ Medium | Tree parsing, good for complex threads |
| **Context engine** | ✅ Medium | Message processing pipeline |
| **Better Auth config** | ✅ Medium | OAuth, passkeys, email OTP |

### What Needs Modification

| Component | Modifications Needed |
|-----------|---------------------|
| **Authentication** | Replace Better Auth context with OpenClaw session |
| **Storage** | Adapt S3 to R2 or use OpenClaw's file system |
| **Real-time** | WebSocket/SSE → Telegram/Node push |
| **UI Components** | Don't need - we have TUI/Telegram |
| **tRPC layer** | Replace with OpenClaw tools or direct calls |
| **Frontend stores** | Don't need - state lives in OpenClaw |

### What We Should Build Ourselves

| Component | Reason |
|-----------|--------|
| **Telegram interface** | Core platform channel |
| **Node integration** | Device-specific tools |
| **Sandbox orchestration** | Cloudflare-specific |
| **User session management** | OpenClaw-native |
| **Tool execution layer** | OpenClaw tool protocol |
| **Billing/metering** | Custom requirements |

### How OpenClaw Replaces/Complements

```
LobeChat Architecture          →    Zaki Platform Architecture
─────────────────────────────────────────────────────────────
Next.js Frontend               →    OpenClaw Gateway + Telegram
tRPC API Layer                 →    OpenClaw Tool System
Better Auth                    →    OpenClaw Session + Telegram Auth
Zustand Stores                 →    OpenClaw Agent State
WebSocket/SSE Streaming        →    Telegram Messages + Node Push
Local Storage                  →    R2 + Sandbox Persistence
Browser-based UI               →    Telegram UI + Canvas + Node Apps

Reused:
- Database schemas (Drizzle + PostgreSQL)
- Model runtime (multi-provider)
- Agent runtime logic (decision loop)
- File loaders & RAG pipeline
- Memory extraction
```

### Recommended Integration Strategy

1. **Phase 1: Extract Core Packages**
   - Copy `packages/database/` schemas
   - Copy `packages/model-runtime/`
   - Copy `packages/agent-runtime/` types and logic
   - Copy `packages/file-loaders/`

2. **Phase 2: Build Zaki Services**
   - Create `/src/services/` with LobeChat-inspired structure
   - Implement agent service using runtime patterns
   - Build RAG service using their schema design

3. **Phase 3: Adapt to OpenClaw**
   - Replace tRPC with OpenClaw tool definitions
   - Map agent runtime events to Telegram messages
   - Integrate with OpenClaw's session management

4. **Phase 4: Extend**
   - Add Cloudflare Sandbox integration
   - Implement node-specific tools
   - Build custom memory/context providers

### Key Insights

1. **User isolation is well-implemented** - Every query filters by `userId`, good to copy.

2. **Agent runtime is decoupled** - The `GeneralChatAgent` doesn't know about HTTP/tRPC, just produces instructions.

3. **Model runtime is provider-agnostic** - Easy to integrate with any AI provider.

4. **Tool intervention system is sophisticated** - Security blacklist, user policies, per-tool config.

5. **Context engine is extensible** - Plug in custom providers and processors.

6. **Schema design supports complex features** - Multi-agent, threads, message groups, RAG all well-modeled.

---

## Appendix: File Sizes and Complexity

### Largest Schema Files
- `message.ts` - 10.5 KB (most complex)
- `relations.ts` - 9.8 KB (all relationships)
- `file.ts` - 7.5 KB (files, documents, KBs)
- `oidc.ts` - 7.6 KB (OIDC provider)

### Largest Runtime Files
- `GeneralChatAgent.ts` - 21.6 KB (main agent logic)
- `runtime.ts` - 27.8 KB (execution engine)
- `userMemories.ts` (router) - 47.9 KB (memory extraction)

### Package Count
- 38 packages in monorepo
- 72 AI provider implementations
- 77 component directories
- 65 feature modules
