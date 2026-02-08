# Moltworker Implementation Learnings

**Date:** 2026-02-03  
**Source:** https://github.com/cloudflare/moltworker

---

## Key Discoveries

### 1. Sandbox Initialization ✅

**How Moltworker does it:**
```typescript
const options = { keepAlive: true }; // or { sleepAfter: '10m' }
const sandbox = getSandbox(c.env.Sandbox, 'moltbot', options);
```

**Key points:**
- `getSandbox()` takes: `(namespace, id, options)`
- Options only include `keepAlive` or `sleepAfter` - NOT mount options
- Mount options are separate (see R2 mounting below)

**For multi-tenant:**
- Use unique ID per user: `getSandbox(c.env.Sandbox, `user-${userId}`, options)`
- Each user gets their own Sandbox instance

---

### 2. R2 Mounting ✅

**How Moltworker does it:**
```typescript
await sandbox.mountBucket(R2_BUCKET_NAME, R2_MOUNT_PATH, {
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
```

**Key points:**
- R2 mounting is a **separate call** AFTER getting the sandbox
- Uses `sandbox.mountBucket()` method
- Requires R2 credentials (access key ID, secret access key, account ID)
- Mount path: `/data/moltbot` (or custom path)

**For multi-tenant:**
- Each user needs their own R2 prefix: `users/${userId}/`
- Mount to same path in each Sandbox, but use different prefixes
- OR: Mount to different paths per user (more isolation)

---

### 3. Process Management ✅

**How Moltworker does it:**

**Check if running:**
```typescript
const processes = await sandbox.listProcesses();
const existingProcess = processes.find(p => 
  p.command.includes('clawdbot gateway') && 
  p.status === 'running'
);
```

**Start process:**
```typescript
const process = await sandbox.startProcess('/usr/local/bin/start-moltbot.sh', {
  env: { ANTHROPIC_API_KEY: '...', ... }
});
```

**Wait for port:**
```typescript
await process.waitForPort(18789, { 
  mode: 'tcp', 
  timeout: 180_000 // 3 minutes
});
```

**Key points:**
- Use `sandbox.listProcesses()` to check if gateway is running
- Use `sandbox.startProcess()` to start gateway
- Use `process.waitForPort()` to wait for gateway to be ready
- Gateway runs on port 18789

**For multi-tenant:**
- Each Sandbox has its own processes
- Check per-user Sandbox for running gateway
- Start gateway per Sandbox if not running

---

### 4. Proxying Requests ✅

**How Moltworker does it:**

**HTTP requests:**
```typescript
const httpResponse = await sandbox.containerFetch(request, MOLTBOT_PORT);
```

**WebSocket requests:**
```typescript
const containerResponse = await sandbox.wsConnect(request, MOLTBOT_PORT);
const containerWs = containerResponse.webSocket;
// Then relay messages between client and container WebSockets
```

**Key points:**
- Use `sandbox.containerFetch()` for HTTP
- Use `sandbox.wsConnect()` for WebSocket
- Port is 18789 (MOLTBOT_PORT)

**For multi-tenant:**
- Route to correct user's Sandbox
- Each Sandbox has its own gateway on port 18789
- Proxy requests to the correct Sandbox

---

### 5. OpenClaw Setup ✅

**How Moltworker does it:**

**Dockerfile approach:**
- Pre-installs OpenClaw (clawdbot) in Dockerfile
- Uses startup script: `/usr/local/bin/start-moltbot.sh`
- Script configures and starts gateway

**Startup script does:**
1. Restores config from R2 backup
2. Updates config from environment variables
3. Starts gateway: `clawdbot gateway --port 18789`

**Key points:**
- OpenClaw is pre-installed in container image
- Startup script handles configuration
- Gateway runs as long-running process

**For multi-tenant:**
- **Option A:** Use same Dockerfile (OpenClaw pre-installed)
  - Faster startup
  - Less flexible
  - Each Sandbox uses same image
  
- **Option B:** Install OpenClaw per Sandbox
  - More flexible
  - Slower startup
  - Can customize per user

**Recommendation:** Use Option A (same Dockerfile) for MVP

---

## Implementation Plan

### Phase 1: Single User MVP

1. **Update wrangler.toml:**
   - Add container configuration (Dockerfile)
   - Add R2 bucket binding
   - Add Sandbox binding

2. **Create Dockerfile:**
   - Base: `cloudflare/sandbox:0.7.0`
   - Install Node.js 22
   - Install OpenClaw (clawdbot)
   - Copy startup script

3. **Create startup script:**
   - Restore from R2
   - Configure from env vars
   - Start gateway

4. **Update Sandbox manager:**
   - Use `sandbox.mountBucket()` for R2
   - Use `sandbox.startProcess()` for gateway
   - Use `sandbox.listProcesses()` to check status

5. **Update API endpoints:**
   - Use `sandbox.containerFetch()` for HTTP
   - Use `sandbox.wsConnect()` for WebSocket
   - Route to correct user Sandbox

### Phase 2: Multi-Tenancy

1. **Per-user Sandboxes:**
   - Each user gets unique Sandbox ID
   - Each Sandbox has its own R2 prefix
   - Each Sandbox runs its own gateway

2. **R2 isolation:**
   - Use prefix: `users/${userId}/`
   - Mount to same path in each Sandbox
   - Data is isolated by prefix

3. **Process isolation:**
   - Each Sandbox has its own processes
   - Check per-Sandbox for running gateway
   - Start gateway per Sandbox if needed

---

## Code Changes Needed

### 1. Update `wrangler.toml`
```toml
containers = [
  {
    class_name = "Sandbox"
    image = "./Dockerfile"
    instance_type = "standard-4"
    max_instances = 1
  }
]

r2_buckets = [
  {
    binding = "UserStorage"
    bucket_name = "zaki-user-storage"
  }
]
```

### 2. Create `Dockerfile`
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.0

# Install Node.js 22
# Install OpenClaw (clawdbot)
# Copy startup script
```

### 3. Update `src/sandbox/manager.ts`
```typescript
// Use sandbox.mountBucket() instead of mount options
await sandbox.mountBucket('zaki-user-storage', '/data/zaki', {
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { ... }
});

// Use sandbox.startProcess() instead of exec
const process = await sandbox.startProcess('/usr/local/bin/start-zaki.sh', {
  env: { ... }
});
```

### 4. Update `src/index.ts`
```typescript
// Use sandbox.containerFetch() for HTTP
const response = await sandbox.containerFetch(request, 18789);

// Use sandbox.wsConnect() for WebSocket
const wsResponse = await sandbox.wsConnect(request, 18789);
```

---

## Next Steps

1. ✅ Study Moltworker (DONE)
2. 🔨 Create Dockerfile
3. 🔨 Create startup script
4. 🔨 Update Sandbox manager
5. 🔨 Update API endpoints
6. 🔨 Test single Sandbox
7. 🔨 Test multi-tenancy

---

**Ready to implement!** 🚀
