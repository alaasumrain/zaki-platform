# Zaki Platform Authentication System - Deep Analysis

**Last Updated:** 2026-02-10  
**Status:** Comprehensive Analysis - No Changes Made

---

## Executive Summary

The Zaki Platform implements a **multi-layered, multi-tenant authentication system** with three distinct authentication mechanisms:

1. **Telegram-Based Authentication** (Primary for bot users)
2. **OAuth-Based Authentication** (Dashboard web interface via Manus OAuth)
3. **Wallet-Based Authentication** (Web3/Admin access)

Each authentication method serves different use cases and operates independently, with different token storage, validation, and session management strategies.

---

## Architecture Overview

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Zaki Platform Auth Layers                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Telegram Bot Auth (Primary User Flow)              │
│  ├─ Telegram User ID → Onboarding → Instance Creation      │
│  ├─ Bot Token Validation → Container Provisioning           │
│  └─ Per-User Bot Tokens → Isolated Containers               │
│                                                               │
│  Layer 2: OAuth Authentication (Dashboard)                   │
│  ├─ Manus OAuth Server → JWT Session Tokens                 │
│  ├─ Cookie-Based Sessions → tRPC Context                    │
│  └─ User Sync → Database Upsert                              │
│                                                               │
│  Layer 3: Wallet Authentication (Admin/Web3)                 │
│  ├─ Ethereum Wallet Address → Signature Verification       │
│  ├─ Wallet → openId Mapping → Session Token                 │
│  └─ Admin Role Enforcement                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Telegram-Based Authentication (Primary Flow)

### Overview
The primary authentication mechanism for end users interacting with Zaki via Telegram. Uses Telegram User ID as the authentication boundary - no passwords required.

### Authentication Flow

```
User sends /start
    ↓
Extract Telegram User ID (message.from.id)
    ↓
Check onboarding state (/tmp/zaki-onboarding/{telegramUserId}.json)
    ↓
[New User] → Onboarding Flow (7 steps)
    ↓
[Existing User] → Route to Instance
    ↓
Instance Lookup → Container Routing
```

### Key Components

#### 1.1 Telegram User ID as Auth Boundary

**Location:** `/root/zaki-platform/src/index.ts:137`

```typescript
const telegramUserId = String(message.from.id);
```

**Details:**
- **No password required** - Telegram User ID is the sole authentication mechanism
- **Immutable identifier** - Telegram User IDs are permanent and cannot be changed
- **Direct mapping** - `telegramUserId` → `instanceId` → `containerName`
- **Format:** String conversion of numeric Telegram ID (e.g., "123456789")

**Security Considerations:**
- ✅ Telegram User IDs are cryptographically verified by Telegram API
- ✅ Cannot be spoofed without Telegram account access
- ⚠️ No additional verification beyond Telegram's authentication
- ⚠️ Relies on Telegram's security model

#### 1.2 Onboarding State Management

**Location:** `/tmp/zaki-onboarding/{telegramUserId}.json`

**State Structure:**
```typescript
interface OnboardingState {
  step: 'language' | 'bot_token' | 'name' | 'purpose' | 'style' | 'interests' | 'api_keys' | 'complete';
  language?: string;
  botToken?: string;
  botUsername?: string;
  name?: string;
  purpose?: string;
  style?: string;
  interests?: string;
  apiKeys?: {
    anthropic?: string;
    openai?: string;
    google?: string;
    useShared?: boolean;
  };
}
```

**State Persistence:**
- **Storage:** File system (`/tmp/zaki-onboarding/`)
- **Format:** JSON files per user
- **Lifecycle:** 
  - Created on `/start` command
  - Updated during each onboarding step
  - Deleted on completion or reset
- **Concurrency:** No locking mechanism - potential race conditions

**State Transitions:**
```
language → bot_token → name → purpose → style → interests → api_keys → complete
```

**Critical Flow Points:**
1. **Language Selection** (`lang:{code}` callback)
   - Sets `state.language`
   - Immediately transitions to `bot_token` step
   - Location: `/root/zaki-platform/src/index.ts:284`

2. **Bot Token Collection** (`bot_token` step)
   - User provides Telegram bot token from @BotFather
   - Token validation via Telegram API `getMe` endpoint
   - Format validation: `/^\d{8,11}:[A-Za-z0-9_-]{35}$/`
   - Location: `/root/zaki-platform/src/index.ts:395-503`

3. **Token Validation Process:**
   ```typescript
   // Step 1: Format validation
   const tokenPattern = /^\d{8,11}:[A-Za-z0-9_-]{35}$/;
   if (!tokenPattern.test(text)) { /* reject */ }
   
   // Step 2: Telegram API validation
   const botInfoResponse = await fetch(`https://api.telegram.org/bot${text}/getMe`);
   const botInfo = await botInfoResponse.json();
   
   // Step 3: Save token and username
   state.botToken = text;
   state.botUsername = botInfo.result.username;
   ```

#### 1.3 Bot Token Security

**Token Storage:**
- **During Onboarding:** Stored in plaintext JSON file (`/tmp/zaki-onboarding/{telegramUserId}.json`)
- **After Onboarding:** 
  - Saved to profile: `/root/zaki-platform/data/users/{telegramUserId}/profile.json`
  - Passed to instance config: `telegramBotToken` option
  - Stored in container config: `{configDir}/config.json`

**Token Transmission:**
- **User → Server:** Via Telegram message (plaintext in chat)
- **Server → Container:** Via environment variables or config file
- **Container → OpenClaw Gateway:** Via gateway configuration

**Security Warnings:**
- ⚠️ **Plaintext Storage:** Bot tokens stored in plaintext JSON files
- ⚠️ **No Encryption:** Tokens not encrypted at rest
- ⚠️ **Chat History:** Tokens visible in Telegram chat history (user responsibility)
- ⚠️ **File Permissions:** No explicit file permission restrictions on state files

**Token Validation:**
- ✅ Format validation before API call
- ✅ Telegram API validation (`getMe` endpoint)
- ✅ Username extraction and storage
- ✅ Error handling for invalid tokens

#### 1.4 Instance Creation & Token Assignment

**Location:** `/root/zaki-platform/src/services/instance-manager.ts:89-197`

**Process:**
```typescript
async createUserInstance(
  userId: string,
  userName: string,
  options?: {
    telegramBotToken?: string;
    anthropicApiKey?: string;
    openaiApiKey?: string;
    googleApiKey?: string;
  }
): Promise<InstanceConfig>
```

**Token Flow:**
1. Bot token passed as `options.telegramBotToken`
2. Token included in config hash computation
3. Token written to container config file
4. Container started with token in environment/config

**Config File Structure:**
```json
{
  "gateway": {
    "auth": {
      "token": "generated-gateway-token"
    }
  },
  "channels": {
    "telegram": {
      "botToken": "user-provided-bot-token"
    }
  }
}
```

#### 1.5 Profile Persistence

**Location:** `/root/zaki-platform/data/users/{telegramUserId}/profile.json`

**Profile Contents:**
- Complete onboarding state
- Bot token (plaintext)
- Bot username
- User preferences (name, purpose, style, interests)
- API keys (if provided)

**Generated Files:**
- `USER.md` - User information for AI context
- `SOUL.md` - AI personality and behavior configuration

**Profile Access:**
- Read during message routing to determine user's bot
- Used to redirect users to their private bot after setup

---

## 2. OAuth-Based Authentication (Dashboard)

### Overview
Web dashboard authentication using Manus OAuth server. Provides JWT-based session management with cookie storage.

### Authentication Flow

```
User clicks "Login" → OAuth Redirect
    ↓
Manus OAuth Server → Authorization Code
    ↓
Callback: /api/oauth/callback?code=...&state=...
    ↓
Exchange Code for Access Token
    ↓
Get User Info (openId, name, email, platform)
    ↓
Create/Update User in Database
    ↓
Generate JWT Session Token
    ↓
Set HTTP-Only Cookie
    ↓
Redirect to Dashboard
```

### Key Components

#### 2.1 OAuth Service Implementation

**Location:** `/root/zaki-platform/dashboard/server/_core/sdk.ts:31-77`

**OAuth Endpoints:**
- `ExchangeToken`: `/webdev.v1.WebDevAuthPublicService/ExchangeToken`
- `GetUserInfo`: `/webdev.v1.WebDevAuthPublicService/GetUserInfo`
- `GetUserInfoWithJwt`: `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`

**Token Exchange:**
```typescript
async getTokenByCode(code: string, state: string): Promise<ExchangeTokenResponse> {
  const payload: ExchangeTokenRequest = {
    clientId: ENV.appId,
    grantType: "authorization_code",
    code,
    redirectUri: this.decodeState(state), // Base64 decoded
  };
  // POST to OAuth server
}
```

**State Parameter:**
- **Format:** Base64-encoded redirect URI
- **Purpose:** CSRF protection and redirect URI validation
- **Decoding:** `atob(state)` - simple base64 decode

#### 2.2 Session Token Generation

**Location:** `/root/zaki-platform/dashboard/server/_core/sdk.ts:167-198`

**JWT Structure:**
```typescript
{
  openId: string;      // Unique user identifier from OAuth
  appId: string;        // Application ID (ENV.appId)
  name: string;         // User display name
}
```

**JWT Configuration:**
- **Algorithm:** HS256 (HMAC-SHA256)
- **Secret:** `ENV.cookieSecret` (environment variable)
- **Expiration:** 1 year (default: `ONE_YEAR_MS`)
- **Issued At:** Current timestamp
- **Expiration Time:** `issuedAt + expiresInMs` (in seconds)

**Token Signing:**
```typescript
return new SignJWT({
  openId: payload.openId,
  appId: payload.appId,
  name: payload.name,
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(expirationSeconds)
  .sign(secretKey);
```

#### 2.3 Cookie Management

**Location:** `/root/zaki-platform/dashboard/server/_core/cookies.ts` (referenced)

**Cookie Configuration:**
- **Name:** `COOKIE_NAME` (from `@shared/const`)
- **Type:** HTTP-Only (prevents XSS)
- **Secure:** Should be true in production (HTTPS only)
- **SameSite:** Likely "lax" or "strict" (CSRF protection)
- **Max Age:** 1 year (`ONE_YEAR_MS`)

**Cookie Setting:**
```typescript
ctx.res.cookie(COOKIE_NAME, sessionToken, {
  ...cookieOptions,
  maxAge: ONE_YEAR_MS,
});
```

**Cookie Clearing (Logout):**
```typescript
ctx.res.clearCookie(COOKIE_NAME, { 
  ...cookieOptions, 
  maxAge: -1 
});
```

#### 2.4 Session Verification

**Location:** `/root/zaki-platform/dashboard/server/_core/sdk.ts:200-233`

**Verification Process:**
```typescript
async verifySession(cookieValue: string | undefined | null) {
  // 1. Check cookie exists
  if (!cookieValue) return null;
  
  // 2. Verify JWT signature
  const { payload } = await jwtVerify(cookieValue, secretKey, {
    algorithms: ["HS256"],
  });
  
  // 3. Validate payload structure
  const { openId, appId, name } = payload;
  if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
    return null;
  }
  
  // 4. Return session data
  return { openId, appId, name };
}
```

**Error Handling:**
- Missing cookie → `null` (unauthenticated)
- Invalid signature → `null` (logged as warning)
- Missing fields → `null` (logged as warning)
- Expired token → JWT library throws → `null`

#### 2.5 Request Authentication

**Location:** `/root/zaki-platform/dashboard/server/_core/context.ts:11-28`

**tRPC Context Creation:**
```typescript
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }
  
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
```

**Authentication Flow:**
1. Extract cookie from request headers
2. Verify session token
3. Lookup user by `openId` in database
4. If user not found, sync from OAuth server
5. Update `lastSignedIn` timestamp
6. Return user object or `null`

**User Sync Logic:**
```typescript
// If user not in DB, sync from OAuth server automatically
if (!user) {
  const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
  await db.upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn: signedInAt,
  });
  user = await db.getUserByOpenId(userInfo.openId);
}
```

#### 2.6 Protected Procedures

**Location:** `/root/zaki-platform/dashboard/server/_core/trpc.ts:13-28`

**Middleware Chain:**
```typescript
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  
  if (!ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED", 
      message: UNAUTHED_ERR_MSG 
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowing
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);
```

**Admin Procedure:**
```typescript
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: NOT_ADMIN_ERR_MSG 
      });
    }
    
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
```

**Procedure Types:**
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authenticated user
- `adminProcedure` - Requires authenticated admin user

---

## 3. Wallet-Based Authentication (Admin/Web3)

### Overview
Ethereum wallet address-based authentication for admin access and Web3 integration. Uses wallet address as the user identifier.

### Authentication Flow

```
User connects wallet (MetaMask, etc.)
    ↓
User signs message (optional)
    ↓
Submit wallet address to /auth.walletLogin
    ↓
Normalize address (lowercase)
    ↓
Create openId: "wallet:{address}"
    ↓
Upsert user in database
    ↓
Check admin role
    ↓
Generate session token
    ↓
Set cookie
```

### Key Components

#### 3.1 Wallet Login Endpoint

**Location:** `/root/zaki-platform/dashboard/server/routers.ts:79-118`

**Input Validation:**
```typescript
.input(z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().optional(),
  message: z.string().optional(),
}))
```

**Address Format:**
- **Pattern:** `^0x[a-fA-F0-9]{40}$`
- **Length:** 42 characters (0x + 40 hex chars)
- **Case:** Case-insensitive (normalized to lowercase)

**Current Implementation:**
- ⚠️ **Signature verification not implemented** - `signature` and `message` parameters are accepted but not validated
- ⚠️ **No cryptographic proof** - Relies on wallet connection only
- ⚠️ **Admin-only access** - Non-admin users are rejected

#### 3.2 User Creation/Update

**Location:** `/root/zaki-platform/dashboard/server/db.ts:110-150`

**openId Generation:**
```typescript
const normalizedAddress = walletAddress.toLowerCase();
const openId = `wallet:${normalizedAddress}`;
```

**User Upsert Logic:**
```typescript
export async function upsertUserByWallet(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  const openId = `wallet:${normalizedAddress}`;
  
  // Check if user exists
  const existingUser = await getUserByWalletAddress(normalizedAddress);
  
  if (existingUser) {
    // Update last signed in
    await db.update(users).set({ lastSignedIn: new Date() });
    return { ...existingUser, lastSignedIn: new Date() };
  }
  
  // Create new user
  const newUser: InsertUser = {
    openId,
    walletAddress: normalizedAddress,
    loginMethod: 'wallet',
    lastSignedIn: new Date(),
  };
  
  await db.insert(users).values(newUser);
  return await getUserByWalletAddress(normalizedAddress);
}
```

**Database Schema:**
```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  walletAddress: varchar("walletAddress", { length: 42 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // ...
});
```

#### 3.3 Admin Role Enforcement

**Location:** `/root/zaki-platform/dashboard/server/routers.ts:95-97`

**Access Control:**
```typescript
if (user.role !== 'admin') {
  throw new Error("Access denied. Only administrators can access this dashboard.");
}
```

**Role Assignment:**
- **Default:** `'user'` (from schema default)
- **Admin Assignment:** Manual database update or via `ENV.ownerOpenId` check
- **Location:** `/root/zaki-platform/dashboard/server/db.ts:58-61`

```typescript
if (user.openId === ENV.ownerOpenId) {
  values.role = 'admin';
  updateSet.role = 'admin';
}
```

**Security Considerations:**
- ⚠️ **No automatic admin assignment** for wallet addresses
- ⚠️ **Manual database update required** to grant admin access
- ⚠️ **No signature verification** - anyone with wallet address can attempt login

#### 3.4 Session Token Generation

**Same as OAuth flow:**
- Uses `sdk.createSessionToken(openId, { name })`
- Sets HTTP-only cookie
- 1-year expiration
- JWT with HS256 algorithm

---

## 4. Database Schema & User Management

### User Table Structure

**Location:** `/root/zaki-platform/dashboard/drizzle/schema.ts:7-25`

```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  walletAddress: varchar("walletAddress", { length: 42 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
```

### openId as Universal Identifier

**openId Formats:**
- **OAuth Users:** `"openId"` from Manus OAuth server (e.g., `"user-12345"`)
- **Wallet Users:** `"wallet:{lowercase_address}"` (e.g., `"wallet:0x1234...abcd"`)
- **Admin Test Users:** `"admin-local-user"` (hardcoded for testing)

**Uniqueness:**
- `openId` is unique across all users
- Used as the primary lookup key
- Maps to different authentication methods

### User Lookup Methods

**By openId:**
```typescript
await db.getUserByOpenId(openId)
```

**By Wallet Address:**
```typescript
await db.getUserByWalletAddress(walletAddress.toLowerCase())
```

**Upsert Logic:**
- **OAuth:** `upsertUser({ openId, name, email, loginMethod, ... })`
- **Wallet:** `upsertUserByWallet(walletAddress)`
- **Auto-sync:** OAuth users automatically synced on first login

---

## 5. Token & Secret Management

### Gateway Token Generation

**Location:** `/root/zaki-platform/src/services/instance-manager.ts:121`

**Token Generation:**
```typescript
private async generateToken(): Promise<string> {
  // Implementation not shown in visible code
  // Likely uses crypto.randomBytes or similar
}
```

**Token Usage:**
- **Purpose:** Authenticate requests to OpenClaw Gateway
- **Storage:** Container config file
- **Format:** Likely base64-encoded random bytes
- **Scope:** Per-instance (each user gets unique token)

**Token in Config:**
```json
{
  "gateway": {
    "auth": {
      "token": "generated-gateway-token"
    }
  }
}
```

### API Key Management

**User-Provided API Keys:**
- **Storage:** Container config file (plaintext)
- **Providers:** Anthropic, OpenAI, Google
- **Fallback:** Shared keys from environment variables
- **Encryption:** ⚠️ Not encrypted at rest

**Shared API Keys:**
- **Source:** Environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`)
- **Usage:** Default for users who don't provide their own
- **Scope:** Shared across all users (if not overridden)

**Key Flow:**
```
Onboarding → User provides keys → Saved to state → Passed to instance creation → Written to config
```

### Bot Token Storage

**Storage Locations:**
1. **Onboarding State:** `/tmp/zaki-onboarding/{telegramUserId}.json` (temporary)
2. **User Profile:** `/root/zaki-platform/data/users/{telegramUserId}/profile.json` (permanent)
3. **Container Config:** `{configDir}/config.json` (runtime)

**Security Issues:**
- ⚠️ **Plaintext storage** in all locations
- ⚠️ **No encryption** at rest
- ⚠️ **File permissions** not explicitly restricted
- ⚠️ **No token rotation** mechanism

---

## 6. Security Analysis

### Strengths

1. **Telegram User ID Verification:**
   - Cryptographically verified by Telegram API
   - Cannot be spoofed without account access
   - Immutable identifier

2. **JWT Session Management:**
   - HTTP-only cookies prevent XSS
   - HS256 algorithm with secret key
   - Expiration handling

3. **OAuth Integration:**
   - Industry-standard OAuth 2.0 flow
   - Authorization code exchange
   - State parameter for CSRF protection

4. **Per-User Isolation:**
   - Each user gets isolated container
   - Separate config files
   - Unique gateway tokens

### Weaknesses

1. **Plaintext Token Storage:**
   - Bot tokens stored in plaintext JSON files
   - API keys not encrypted at rest
   - Gateway tokens in config files

2. **No Signature Verification:**
   - Wallet authentication doesn't verify signatures
   - Relies on wallet connection only

3. **State File Race Conditions:**
   - No locking mechanism for onboarding state
   - Concurrent requests could corrupt state

4. **Long Session Expiration:**
   - 1-year session tokens (very long)
   - No refresh token mechanism
   - No session revocation

5. **Admin Access Control:**
   - Manual database updates required
   - No automatic role assignment for wallets
   - Hardcoded test admin credentials

6. **Token Transmission:**
   - Bot tokens sent via Telegram messages (visible in chat)
   - No secure token exchange mechanism
   - Tokens visible in chat history

### Recommendations (Analysis Only - No Changes)

1. **Encrypt Sensitive Tokens:**
   - Use AES-256-GCM for bot tokens and API keys
   - Store encryption key in secure key management system
   - Encrypt before writing to files

2. **Implement Signature Verification:**
   - Verify Ethereum message signatures for wallet auth
   - Use EIP-191 message signing standard
   - Require signature for wallet login

3. **Add State File Locking:**
   - Use file locks or database for onboarding state
   - Prevent concurrent modifications
   - Add transaction-like behavior

4. **Reduce Session Lifetime:**
   - Reduce to 7-30 days
   - Implement refresh tokens
   - Add session revocation endpoint

5. **Secure Token Exchange:**
   - Use temporary tokens for bot token collection
   - Implement secure token exchange endpoint
   - Clear tokens from chat after processing

6. **Add Token Rotation:**
   - Implement gateway token rotation
   - Add bot token refresh mechanism
   - Rotate API keys periodically

---

## 7. Authentication Flow Diagrams

### Telegram Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ /start
       ▼
┌─────────────────┐
│ Extract User ID  │
│ (message.from.id)│
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ Check Onboarding      │
│ State File            │
└──────┬───────────────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
[New]   [Existing]
   │       │
   │       └───► Check Profile
   │               │
   │           ┌───┴───┐
   │           │       │
   │           ▼       ▼
   │       [Has Bot] [No Bot]
   │           │       │
   │           │       └───► Upgrade Flow
   │           │
   │           └───► Redirect to Bot
   │
   └───► Onboarding Flow
           │
           ▼
       Language Selection
           │
           ▼
       Bot Token Collection
           │
           ▼
       Token Validation (Telegram API)
           │
           ▼
       Instance Creation
           │
           ▼
       Profile Save
           │
           ▼
       Complete
```

### OAuth Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Click Login
       ▼
┌─────────────────┐
│ OAuth Redirect   │
│ (Manus Server)   │
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│ User Authorizes  │
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│ Authorization   │
│ Code Returned   │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ /api/oauth/callback  │
│ Exchange Code        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Get User Info        │
│ (openId, name, etc.) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Upsert User in DB    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Generate JWT Token   │
│ (openId, appId, name) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Set HTTP-Only Cookie │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Redirect to Dashboard│
└──────────────────────┘
```

### Wallet Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Connect Wallet
       ▼
┌─────────────────┐
│ Get Wallet Addr  │
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│ Sign Message    │
│ (Optional)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ POST /auth.walletLogin│
│ {walletAddress, ...}  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Normalize Address     │
│ (lowercase)           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Create openId         │
│ "wallet:{address}"   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Upsert User in DB    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Check Admin Role     │
└──────┬───────────────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
[Admin] [Not Admin]
   │       │
   │       └───► Error: Access Denied
   │
   └───► Generate Session Token
           │
           ▼
       Set Cookie
           │
           ▼
       Return Success
```

---

## 8. Token Lifecycle Management

### Bot Token Lifecycle

```
Creation (User provides)
    ↓
Validation (Telegram API)
    ↓
Storage (Onboarding state)
    ↓
Instance Creation (Passed to container)
    ↓
Profile Save (Permanent storage)
    ↓
Container Config (Runtime)
    ↓
[No Rotation] [No Expiration] [No Revocation]
```

### JWT Session Token Lifecycle

```
OAuth/Wallet Login
    ↓
Token Generation (JWT)
    ↓
Cookie Set (HTTP-only)
    ↓
Request Authentication (Verify JWT)
    ↓
User Lookup (Database)
    ↓
[1 Year Expiration] [No Refresh] [No Revocation]
```

### Gateway Token Lifecycle

```
Instance Creation
    ↓
Token Generation (Random)
    ↓
Config File Storage
    ↓
Container Startup
    ↓
Gateway Authentication
    ↓
[No Rotation] [No Expiration] [No Revocation]
```

---

## 9. Cross-System Integration

### Telegram ↔ Dashboard

**No Direct Integration:**
- Telegram users and Dashboard users are separate systems
- No mapping between Telegram User ID and Dashboard openId
- Separate authentication mechanisms

**Potential Bridge:**
- Could add `telegramUserId` field to `users` table
- Could allow Telegram users to link dashboard accounts
- Currently: Two independent user bases

### Instance Manager ↔ Authentication

**Integration Points:**
1. **Instance Creation:** Requires `telegramUserId` (not dashboard user ID)
2. **Config Generation:** Includes bot tokens and API keys
3. **Container Isolation:** Each Telegram user gets isolated container
4. **No Dashboard Integration:** Dashboard users cannot create instances via UI

---

## 10. Error Handling & Edge Cases

### Onboarding State Errors

**Missing State File:**
- Treated as new user
- `/start` command resets state
- Location: `/root/zaki-platform/src/index.ts:150-170`

**Corrupted State File:**
- JSON parse error → Treated as new user
- No validation of state structure
- No recovery mechanism

**Concurrent Modifications:**
- No file locking
- Last write wins
- Potential data loss

### Authentication Errors

**Invalid Session Token:**
- Returns `null` user
- Public procedures continue
- Protected procedures throw `UNAUTHORIZED`

**OAuth Server Unavailable:**
- User sync fails
- Error logged
- User creation fails (throws error)

**Database Unavailable:**
- User lookup returns `undefined`
- Operations fail gracefully
- Logs warnings

---

## 11. Configuration & Environment Variables

### Required Environment Variables

**Telegram Bot:**
- `TELEGRAM_BOT_TOKEN` - Setup assistant bot token

**OAuth:**
- `OAUTH_SERVER_URL` - Manus OAuth server base URL
- `APP_ID` - Application ID for OAuth
- `COOKIE_SECRET` - JWT signing secret

**Database:**
- `DATABASE_URL` - MySQL connection string

**API Keys (Shared):**
- `ANTHROPIC_API_KEY` - Shared Anthropic key
- `OPENAI_API_KEY` - Shared OpenAI key
- `GOOGLE_API_KEY` - Shared Google key

**Admin:**
- `OWNER_OPEN_ID` - Owner's openId (auto-admin)

### Configuration Files

**Instance Config:**
- Location: `{INSTANCE_CONFIG_BASE}-{instanceId}/config.json`
- Contains: Gateway token, bot token, API keys, port, workspace

**User Profile:**
- Location: `/root/zaki-platform/data/users/{telegramUserId}/profile.json`
- Contains: Onboarding state, bot token, preferences

**Onboarding State:**
- Location: `/tmp/zaki-onboarding/{telegramUserId}.json`
- Temporary: Deleted on completion

---

## 12. Testing & Validation

### Test Coverage

**OAuth Tests:**
- Location: `/root/zaki-platform/dashboard/server/wallet-auth.test.ts`
- Coverage: Wallet login, user creation, session management

**Auth Tests:**
- Location: `/root/zaki-platform/dashboard/server/auth.logout.test.ts`
- Coverage: Logout, cookie clearing

**Model Tests:**
- Location: `/root/zaki-platform/dashboard/server/models.test.ts`
- Coverage: Authenticated vs unauthenticated access

### Manual Validation

**Telegram Bot Token:**
- Format validation: Regex pattern
- API validation: `getMe` endpoint call
- Username extraction: From API response

**JWT Tokens:**
- Signature verification: HS256 with secret
- Expiration check: JWT library handles
- Payload validation: Field presence check

**Wallet Address:**
- Format validation: Regex pattern
- Normalization: Lowercase conversion
- No signature verification: ⚠️ Not implemented

---

## 13. Future Considerations

### Potential Enhancements

1. **Token Encryption:**
   - Encrypt all tokens at rest
   - Use key management system
   - Implement key rotation

2. **Signature Verification:**
   - Add Ethereum message signing
   - Verify wallet ownership
   - Implement EIP-191 standard

3. **Session Management:**
   - Add refresh tokens
   - Implement session revocation
   - Reduce session lifetime

4. **State Management:**
   - Move to database
   - Add transaction support
   - Implement locking

5. **Token Rotation:**
   - Gateway token rotation
   - Bot token refresh
   - API key rotation

6. **Unified User System:**
   - Link Telegram and Dashboard users
   - Single user identity
   - Cross-platform access

---

## 14. Summary

### Authentication Methods

| Method | Primary Use | Identifier | Token Type | Storage | Encryption |
|--------|-------------|------------|------------|---------|------------|
| **Telegram** | Bot users | Telegram User ID | Bot Token | File system | ❌ None |
| **OAuth** | Dashboard | openId | JWT | HTTP cookie | ✅ HS256 |
| **Wallet** | Admin/Web3 | Wallet Address | JWT | HTTP cookie | ✅ HS256 |

### Security Posture

**Strong:**
- OAuth JWT session management
- HTTP-only cookies
- Telegram User ID verification
- Per-user container isolation

**Weak:**
- Plaintext token storage
- No signature verification (wallet)
- Long session expiration
- No token rotation
- No encryption at rest

### Recommendations Priority

1. **High:** Encrypt bot tokens and API keys
2. **High:** Implement wallet signature verification
3. **Medium:** Reduce session expiration time
4. **Medium:** Add state file locking
5. **Low:** Implement token rotation
6. **Low:** Unified user system

---

**End of Analysis** - No code changes made, analysis only.
