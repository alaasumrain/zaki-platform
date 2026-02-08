# Zaki Platform - Build Progress

**Last Updated:** 2026-02-04 15:20 CET

---

## ✅ What Works

### Onboarding Flow
- Multi-step onboarding via Telegram inline buttons
- Language selection (EN, AR, DE, FR, ES, TR) with full translations
- Name, purpose, style, interests collection
- Profile saved to R2 (`users/{telegramId}/profile.json`)
- SOUL.md and USER.md generated from preferences
- "All set!" completion message — **fully working**

### Infrastructure
- Worker deployed at `https://zaki-platform.ieditgam3rz.workers.dev`
- Telegram webhook registered for `@zakified_bot`
- R2 bucket `zaki-user-storage` for user data
- Docker image built and pushed (1.83GB, under 2GB limit)
- Dockerfile: `cloudflare/sandbox:0.7.0` + Node.js 22 + OpenClaw (clawdbot@2026.1.24-3)
- `start-zaki.sh` startup script creates SOUL.md, USER.md, IDENTITY.md, openclaw.json

### Code
- `src/index.ts` — Hono Worker with health check, webhook setup, Telegram handler
- `src/onboarding.ts` — Full multilingual onboarding flow with translations
- `src/sandbox/manager.ts` — Sandbox management module (reference, not actively used yet)
- `start-zaki.sh` — OpenClaw startup script with per-user customization

---

## ❌ What's Broken — The Sandbox Gap

### Problem: Can't get AI responses after onboarding

After onboarding completes, the user sends a message → Worker tries to:
1. Boot user's Sandbox (`getSandbox(env.Sandbox, 'user-{telegramId}')`)
2. Start OpenClaw inside it (`sandbox.startProcess('/usr/local/bin/start-zaki.sh')`)
3. Forward message to OpenClaw (`sandbox.containerFetch('/v1/chat/completions')`)
4. Send response back to Telegram

**It fails at step 2.** Two bugs discovered:

#### Bug 1: SDK `startProcess` response parsing (critical)
```
[HTTP Client] Making POST request to http://localhost:3000/api/process/start
[HTTP Client] Response: 200 OK
[HTTP Client] Error starting process: TypeError: Cannot read properties of undefined (reading 'id')
```
The Sandbox SDK (`@cloudflare/sandbox@0.1.4`) sends the `startProcess` request successfully (200 OK), but fails to parse the response. The SDK expects `response.process.id` but `response.process` is `undefined`. 

**The process DOES start** — we can see logs from it via `process.getLogs()`. But the SDK throws, so we can't get a process handle for `waitForPort()`.

**Workaround attempted:** Catch the error and poll for port via `containerFetch`. This works but is fragile.

#### Bug 2: Environment variables don't reach the container process
```
[Zaki] Starting OpenClaw for user: User (lang: en)
[Zaki] GOOGLE_API_KEY set: NO
[Zaki] ERROR: No API key found!
```
Despite passing `env: { GOOGLE_API_KEY: '...', ... }` in `startProcess` options, the script inside the container receives empty env vars. The default values are used instead.

**Attempts tried:**
- `startProcess(..., { env: processEnv })` — env vars don't arrive
- Write env to file via `exec()`, source in startup script — `exec` might also not pass through
- Inline env vars in command string — not tested properly yet
- Base64-encoded env file — same issue

**This is the actual blocker.** Without env vars (especially API keys), OpenClaw can't start.

#### Possible Root Causes
1. SDK version mismatch: `@cloudflare/sandbox@0.1.4` might not be compatible with `sandbox:0.7.0` container runtime
2. Container runtime might not support `env` option in process start API
3. The internal API at `http://localhost:3000/api/process/start` might ignore env vars

#### What Moltworker Does Differently
Moltworker (reference implementation) uses the same pattern and it works. Differences:
- Uses `@cloudflare/sandbox@*` (latest)
- May have a different container runtime version
- Uses `wrangler secret` for sensitive values (not `vars` in wrangler.jsonc)

---

## 🔧 Next Steps to Fix

### Priority 1: Fix env var passing
Options to investigate:
1. **Update SDK**: Check if newer `@cloudflare/sandbox` version fixes these bugs
2. **Use `wrangler secret`**: Move API keys to secrets instead of vars
3. **Bake config in Dockerfile**: Write a default config with placeholder API key, replace at runtime via exec
4. **File-based approach**: Use `sandbox.exec()` to write env file, verify it works before starting gateway
5. **Check moltworker's actual deployed SDK version**: Compare with ours

### Priority 2: Verify OpenClaw API endpoint
Once env vars work:
- Verify `/v1/chat/completions` is the correct endpoint
- Test with gateway token authentication
- Confirm response format (OpenAI-compatible)

### Priority 3: UX Polish
- ✅ Thinking message ("⚡ Starting up..." → "🧠 Thinking...")
- ✅ Typing indicator loop (every 4 seconds)
- ✅ Edit thinking message with actual response
- Add cold start messaging for returning users

---

## 📊 Architecture

```
Telegram User
    │
    ▼
Telegram API
    │ webhook
    ▼
Cloudflare Worker (zaki-platform.ieditgam3rz.workers.dev)
    │
    ├─ /start → Onboarding flow (R2 state machine) ✅
    │
    ├─ New user → Start onboarding ✅
    │
    └─ Onboarded user → Route to Sandbox ❌ (blocked)
         │
         ├─ getSandbox('user-{id}') ✅
         ├─ startProcess(start-zaki.sh) ⚠️ (SDK bug + no env vars)
         ├─ containerFetch(/v1/chat/completions) ❓ (untested)
         └─ Response → Telegram ❓
```

---

## 💰 Cost Status

- Cloudflare Workers Paid: $5/mo
- Neon Postgres: Free tier
- R2: Free tier (< 10GB)
- Google Gemini API: Free tier (1500 req/day)
- Domain (zakified.com): Secured
- **Total current: ~$5/mo**

---

## 📁 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `wrangler.jsonc` | Worker + container config | ✅ |
| `src/index.ts` | Main Worker (webhook handler) | ✅ (needs sandbox fix) |
| `src/onboarding.ts` | Multilingual onboarding | ✅ |
| `start-zaki.sh` | Container startup script | ✅ (env vars don't reach it) |
| `Dockerfile` | Container image | ✅ |
| `src/sandbox/manager.ts` | Sandbox management | Reference only |
| `src/db/schema.ts` | Database schema | Built but not used yet |
| `src/services/` | User/Agent/Chat services | Built but not used yet |
