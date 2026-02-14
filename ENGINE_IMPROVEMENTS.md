# Engine Improvements - Critical Analysis

**Date:** 2026-02-10  
**Current Engine:** `src/services/instance-manager.ts` (642 lines, 19 exec() calls)

---

## 🎯 EXACTLY WHAT WE CAN TAKE FROM REPOS

### ⭐⭐⭐⭐⭐ CRITICAL (Must Have)

#### 1. **execDocker() Wrapper Function**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:12-34`

**What it does:**
- Wraps `spawn('docker', args)` with proper error handling
- Captures stdout/stderr separately
- `allowFailure` option for non-critical commands
- Returns `{ stdout, stderr, code }` instead of throwing

**Why critical:**
- Current: 19 `exec()` calls with inconsistent error handling
- Better: Single wrapper with consistent error handling
- Prevents silent failures
- Easier debugging

**Code to extract:**
```typescript
export function execDocker(args: string[], opts?: { allowFailure?: boolean }) {
  return new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      const exitCode = code ?? 0;
      if (exitCode !== 0 && !opts?.allowFailure) {
        reject(new Error(stderr.trim() || `docker ${args.join(" ")} failed`));
        return;
      }
      resolve({ stdout, stderr, code: exitCode });
    });
  });
}
```

**Impact:** Replace all 19 exec() calls with this. Massive improvement.

---

#### 2. **Container Registry System**
**Source:** `repos/openclaw-core/src/agents/sandbox/registry.ts`

**What it does:**
- JSON file tracking all containers
- Stores: `containerName`, `sessionKey`, `createdAtMs`, `lastUsedAtMs`, `image`, `configHash`
- Functions: `readRegistry()`, `updateRegistry()`, `removeRegistryEntry()`

**Why critical:**
- Current: No tracking. Can't list containers, can't clean up properly
- Better: Know all containers, their state, when last used
- Enables: Pruning, listing, management dashboard

**Code to extract:**
```typescript
type InstanceRegistryEntry = {
  containerName: string;
  userId: string;
  createdAtMs: number;
  lastUsedAtMs: number;
  port: number;
  image: string;
  configHash?: string;
};

async function readRegistry(): Promise<{ entries: InstanceRegistryEntry[] }>
async function updateRegistry(entry: InstanceRegistryEntry): Promise<void>
async function removeRegistryEntry(containerName: string): Promise<void>
```

**Impact:** Foundation for all container management features.

---

#### 3. **dockerContainerState() Function**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:79-87`

**What it does:**
- Single function to check container state
- Returns `{ exists: boolean, running: boolean }`
- Uses `docker inspect` with proper error handling

**Why critical:**
- Current: Multiple `pgrep`/`netstat` checks, unreliable
- Better: Single reliable check via Docker API
- Used everywhere: start, stop, status checks

**Code to extract:**
```typescript
export async function dockerContainerState(name: string) {
  const result = await execDocker(["inspect", "-f", "{{.State.Running}}", name], {
    allowFailure: true,
  });
  if (result.code !== 0) {
    return { exists: false, running: false };
  }
  return { exists: true, running: result.stdout.trim() === "true" };
}
```

**Impact:** Replace all `isInstanceRunning()` logic. More reliable.

---

### ⭐⭐⭐⭐ HIGH PRIORITY (Should Have)

#### 4. **Resource Limits**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:178-199`

**What it does:**
- CPU limits: `--cpus 2.0`
- Memory limits: `--memory 2g`
- PID limits: `--pids-limit 100`
- Ulimits: `--ulimit nofile=1024:2048`

**Why high priority:**
- Current: No limits. One user can consume all resources
- Better: Fair resource allocation per user
- Prevents: Resource exhaustion, system crashes

**Code to extract:**
```typescript
// From buildSandboxCreateArgs()
if (typeof params.cfg.pidsLimit === "number" && params.cfg.pidsLimit > 0) {
  args.push("--pids-limit", String(params.cfg.pidsLimit));
}
const memory = normalizeDockerLimit(params.cfg.memory);
if (memory) {
  args.push("--memory", memory);
}
if (typeof params.cfg.cpus === "number" && params.cfg.cpus > 0) {
  args.push("--cpus", String(params.cfg.cpus));
}
```

**Impact:** Production-ready resource management.

---

#### 5. **Container Pruning System**
**Source:** `repos/openclaw-core/src/agents/sandbox/prune.ts`

**What it does:**
- Removes idle containers (configurable hours)
- Removes old containers (configurable days)
- Automatic cleanup via `maybePruneSandboxes()`
- Updates registry after pruning

**Why high priority:**
- Current: Containers never cleaned up. Disk fills up
- Better: Automatic maintenance
- Saves: Disk space, memory, resources

**Code to extract:**
```typescript
async function pruneInstances(cfg: { idleHours: number; maxAgeDays: number }) {
  const now = Date.now();
  const registry = await readRegistry();
  for (const entry of registry.entries) {
    const idleMs = now - entry.lastUsedAtMs;
    const ageMs = now - entry.createdAtMs;
    if (
      (cfg.idleHours > 0 && idleMs > cfg.idleHours * 60 * 60 * 1000) ||
      (cfg.maxAgeDays > 0 && ageMs > cfg.maxAgeDays * 24 * 60 * 60 * 1000)
    ) {
      await execDocker(["rm", "-f", entry.containerName], { allowFailure: true });
      await removeRegistryEntry(entry.containerName);
    }
  }
}
```

**Impact:** Prevents disk/memory bloat. Essential for long-term operation.

---

#### 6. **Image Management**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:52-77`

**What it does:**
- `dockerImageExists()` - Check if image exists
- `ensureDockerImage()` - Pull if missing
- Handles default images automatically

**Why high priority:**
- Current: Assumes image exists. Fails silently if missing
- Better: Verify image exists, pull if needed
- Prevents: Container creation failures

**Code to extract:**
```typescript
async function dockerImageExists(image: string) {
  const result = await execDocker(["image", "inspect", image], {
    allowFailure: true,
  });
  if (result.code === 0) return true;
  if (result.stderr.includes("No such image")) return false;
  throw new Error(`Failed to inspect image: ${result.stderr}`);
}

export async function ensureDockerImage(image: string) {
  const exists = await dockerImageExists(image);
  if (exists) return;
  await execDocker(["pull", image]);
}
```

**Impact:** Prevents startup failures. Better user experience.

---

### ⭐⭐⭐ MEDIUM PRIORITY (Nice to Have)

#### 7. **Config Hash System**
**Source:** `repos/openclaw-core/src/agents/sandbox/config-hash.ts`

**What it does:**
- Computes SHA1 hash of container config
- Detects config changes
- Recreates container if config changed

**Why medium:**
- Current: Config changes don't trigger recreation
- Better: Auto-detect and apply config changes
- Use case: User changes API keys, bot token, etc.

**Code to extract:**
```typescript
export function computeConfigHash(config: InstanceConfig): string {
  const payload = normalizeForHash(config);
  const raw = JSON.stringify(payload);
  return crypto.createHash("sha1").update(raw).digest("hex");
}
```

**Impact:** Better config management. Prevents stale configs.

---

#### 8. **Container Labels**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:134-145`

**What it does:**
- Adds labels to containers: `--label "zaki.userId=123"`
- Stores metadata in Docker labels
- Easy filtering: `docker ps --filter "label=zaki.userId=123"`

**Why medium:**
- Current: No labels. Hard to identify containers
- Better: Easy filtering, organization
- Enables: Better management tools

**Code to extract:**
```typescript
args.push("--label", "zaki.instance=1");
args.push("--label", `zaki.userId=${userId}`);
args.push("--label", `zaki.createdAtMs=${Date.now()}`);
```

**Impact:** Better container organization. Easier debugging.

---

#### 9. **Security Hardening**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:146-167`

**What it does:**
- `--read-only` root filesystem
- `--cap-drop` capabilities
- `--security-opt no-new-privileges`
- `--security-opt seccomp=profile`
- `--security-opt apparmor=profile`

**Why medium:**
- Current: Containers have full privileges
- Better: Hardened security for production
- Use case: Multi-tenant security

**Code to extract:**
```typescript
if (params.cfg.readOnlyRoot) {
  args.push("--read-only");
}
for (const cap of params.cfg.capDrop) {
  args.push("--cap-drop", cap);
}
args.push("--security-opt", "no-new-privileges");
```

**Impact:** Production security. Important for multi-tenant.

---

### ⭐⭐ LOW PRIORITY (Future)

#### 10. **Hot Container Detection**
**Source:** `repos/openclaw-core/src/agents/sandbox/docker.ts:314-327`

**What it does:**
- Reuses containers used in last 5 minutes
- Faster startup for recent containers
- Only recreates if config changed

**Why low:**
- Current: Always creates new process (works fine)
- Better: Slightly faster startup
- Trade-off: More complexity

**Impact:** Minor performance improvement. Not critical.

---

## 📊 IMPLEMENTATION PRIORITY

### Phase 1: Critical (Do First)
1. ✅ execDocker() wrapper - Replace all exec() calls
2. ✅ Container Registry - Track all containers
3. ✅ dockerContainerState() - Reliable state checks

**Time:** 2-3 hours  
**Impact:** Massive reliability improvement

### Phase 2: High Priority (Do Soon)
4. ✅ Resource Limits - CPU, memory, PID limits
5. ✅ Container Pruning - Automatic cleanup
6. ✅ Image Management - Ensure images exist

**Time:** 3-4 hours  
**Impact:** Production-ready resource management

### Phase 3: Medium Priority (Do Later)
7. ✅ Config Hash - Detect config changes
8. ✅ Container Labels - Better organization
9. ✅ Security Hardening - Production security

**Time:** 2-3 hours  
**Impact:** Better management and security

---

## 🎯 EXACTLY WHAT I WANT TO DO

### Step 1: Extract execDocker()
- Copy function from OpenClaw
- Replace all 19 exec() calls in instance-manager.ts
- Test with existing containers

### Step 2: Add Container Registry
- Copy registry.ts structure
- Adapt for our use case (userId instead of sessionKey)
- Add registry updates to createUserInstance()
- Add registry cleanup to stopInstance()

### Step 3: Replace State Checks
- Replace isInstanceRunning() with dockerContainerState()
- Use in all status checks
- More reliable than pgrep/netstat

### Step 4: Add Resource Limits
- Add CPU limit (2 cores per user)
- Add memory limit (2GB per user)
- Add PID limit (100 per container)
- Add to container creation

### Step 5: Add Pruning
- Add pruneInstances() function
- Call periodically (every 5 minutes)
- Remove idle containers (>24 hours)
- Remove old containers (>7 days)

### Step 6: Add Image Management
- Add ensureDockerImage() before container creation
- Verify alpine/openclaw:latest exists
- Pull if missing

---

## ✅ WHAT MAKES PERFECT SENSE

**Perfect sense:**
1. execDocker() - Better error handling, no brainer
2. Container Registry - Need to track containers anyway
3. dockerContainerState() - More reliable than current approach
4. Resource Limits - Essential for multi-tenant
5. Pruning - Prevents disk bloat

**Makes sense but can wait:**
6. Image Management - Good practice
7. Config Hash - Nice to have
8. Labels - Helpful but not critical

**Nice to have:**
9. Security Hardening - For production
10. Hot Container - Minor optimization

---

## 🚨 CRITICAL RATING SUMMARY

| Improvement | Priority | Impact | Effort | Rating |
|------------|----------|--------|--------|--------|
| execDocker() | ⭐⭐⭐⭐⭐ | High | Low | **MUST DO** |
| Container Registry | ⭐⭐⭐⭐⭐ | High | Medium | **MUST DO** |
| dockerContainerState() | ⭐⭐⭐⭐⭐ | High | Low | **MUST DO** |
| Resource Limits | ⭐⭐⭐⭐ | High | Medium | **SHOULD DO** |
| Container Pruning | ⭐⭐⭐⭐ | High | Medium | **SHOULD DO** |
| Image Management | ⭐⭐⭐⭐ | Medium | Low | **SHOULD DO** |
| Config Hash | ⭐⭐⭐ | Medium | Medium | **COULD DO** |
| Container Labels | ⭐⭐⭐ | Low | Low | **COULD DO** |
| Security Hardening | ⭐⭐⭐ | Medium | High | **LATER** |
| Hot Container | ⭐⭐ | Low | High | **MAYBE** |

---

## 🎯 FINAL RECOMMENDATION

**Do immediately (Phase 1):**
- execDocker() wrapper
- Container Registry
- dockerContainerState()

**Do soon (Phase 2):**
- Resource Limits
- Container Pruning
- Image Management

**Do later (Phase 3):**
- Everything else

**Current engine is functional but needs these improvements for production.**
