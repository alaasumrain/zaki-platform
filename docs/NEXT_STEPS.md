# Next Steps - Implementation Plan

**Date:** 2026-02-03  
**Status:** Ready to implement based on Moltworker learnings

---

## 🎯 Immediate Next Steps (Priority Order)

### Step 1: Create Dockerfile ✅ IN PROGRESS
**Why:** Need container image with OpenClaw pre-installed  
**Based on:** Moltworker's Dockerfile  
**Time:** 30 minutes

**What to do:**
- Base image: `cloudflare/sandbox:0.7.0`
- Install Node.js 22
- Install OpenClaw (clawdbot) globally
- Create directories
- Copy startup script

---

### Step 2: Create Startup Script
**Why:** Need script to configure and start OpenClaw Gateway per user  
**Based on:** Moltworker's `start-moltbot.sh` (simplified)  
**Time:** 1 hour

**What to do:**
- Restore config from R2 (per-user prefix)
- Configure from environment variables
- Start gateway: `clawdbot gateway --port 18789`

---

### Step 3: Update wrangler.toml
**Why:** Need container configuration for Sandboxes  
**Based on:** Moltworker's `wrangler.jsonc`  
**Time:** 15 minutes

**What to do:**
- Add `containers` section with Dockerfile
- Add `durable_objects` for Sandbox binding
- Add migrations
- Add R2 bucket binding (already done)
- Add browser binding (optional, for browser automation)

---

### Step 4: Fix Sandbox Manager
**Why:** Current code uses wrong APIs  
**Based on:** Moltworker's `gateway/r2.ts` and `gateway/process.ts`  
**Time:** 1 hour

**What to do:**
- Replace mount options with `sandbox.mountBucket()`
- Replace exec with `sandbox.startProcess()`
- Add process management (listProcesses, waitForPort)
- Add R2 mounting per user

---

### Step 5: Fix API Endpoints
**Why:** Need to proxy requests correctly  
**Based on:** Moltworker's `index.ts`  
**Time:** 1 hour

**What to do:**
- Replace placeholder code with `sandbox.containerFetch()`
- Add WebSocket support with `sandbox.wsConnect()`
- Route to correct user Sandbox
- Handle loading states

---

### Step 6: Test Single Sandbox
**Why:** Verify everything works  
**Time:** 1-2 hours

**What to do:**
- Deploy to Cloudflare
- Test `/health` endpoint
- Test `/api/chat` endpoint
- Test Sandbox initialization
- Verify OpenClaw Gateway starts
- Test message flow

---

## 📋 Implementation Checklist

### Phase 1: Infrastructure Setup
- [ ] Create Dockerfile
- [ ] Create startup script
- [ ] Update wrangler.toml
- [ ] Test Dockerfile builds

### Phase 2: Sandbox Implementation
- [ ] Fix R2 mounting (use mountBucket)
- [ ] Fix process management (use startProcess)
- [ ] Add process status checking
- [ ] Add per-user Sandbox isolation

### Phase 3: API Implementation
- [ ] Fix HTTP proxying (use containerFetch)
- [ ] Add WebSocket proxying (use wsConnect)
- [ ] Add loading page
- [ ] Add error handling

### Phase 4: Testing
- [ ] Deploy to Cloudflare
- [ ] Test single Sandbox
- [ ] Test R2 mounting
- [ ] Test OpenClaw Gateway
- [ ] Test message flow
- [ ] Test multi-user (if time)

---

## 🚀 Let's Start!

**Starting with Step 1: Create Dockerfile**

This is the foundation - everything else depends on having a working container image.
