# Implementation Roadmap - What to Do Next

**Date:** 2026-02-10  
**Status:** Ready to implement

---

## ✅ What We Have

1. **LobeChat Fork** (`/root/zaki-dashboard`) - Beautiful chat UI
2. **OpenClaw Dashboard** (`/root/zaki-platform/dashboard`) - Gateway management
3. **Instance Manager** - Creates containers (needs config fix)
4. **Onboarding** - Collects bot tokens
5. **Router** - Works but will be removed after migration

---

## 🚨 Critical Fix (Do First)

### Fix Config Format

**File:** `/root/zaki-platform/src/services/instance-manager.ts`

**Changes:**
- ✅ Fixed `createConfig()` to use native OpenClaw format
- ✅ Changed `telegram` → `channels.telegram`
- ✅ Changed `api` → `gateway.http.endpoints`
- ✅ Changed `aiProviders` → `models.providers`
- ✅ Changed filename `clawdbot.json` → `openclaw.json`
- ✅ Fixed auth format: `{ token }` → `{ mode: "token", token }`

**Next:**
1. Test config generation
2. Test gateway startup
3. Verify endpoints work

---

## 🎯 Implementation Plan

### Phase 1: Fix & Test Gateway (Week 1)

**Goal:** Ensure gateway actually works

**Tasks:**
1. ✅ Fix config format (DONE)
2. ⏳ Test instance creation
3. ⏳ Verify gateway starts
4. ⏳ Test all endpoints
5. ⏳ Fix any issues found

**Test Script:**
```bash
# Create test instance
# Check config
cat /var/zaki-platform/users/user-TEST/.openclaw/openclaw.json

# Check gateway
curl http://localhost:19001/health -H "Authorization: Bearer {token}"

# Test chat
curl http://localhost:19001/v1/chat/completions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw","messages":[{"role":"user","content":"test"}]}'
```

---

### Phase 2: Connect LobeChat (Week 2)

**Goal:** LobeChat connects to user's gateway

**Tasks:**
1. ⏳ Configure LobeChat to use user's gateway
2. ⏳ Set up environment per user
3. ⏳ Test chat in LobeChat
4. ⏳ Verify streaming works

**Approach:**
```typescript
// In LobeChat, for each user:
const userGatewayUrl = `http://localhost:${userInstance.port}`;
const userGatewayToken = userInstance.gatewayToken;

// Configure LobeChat
process.env.OPENAI_PROXY_URL = `${userGatewayUrl}/v1`;
process.env.OPENAI_API_KEY = userGatewayToken;
```

---

### Phase 3: Integrate Gateway Management (Week 3)

**Goal:** Add gateway management to LobeChat

**Options:**

**Option A: Keep Separate**
- LobeChat: Chat UI
- OpenClaw Dashboard: Gateway management
- User switches between them

**Option B: Integrate (Recommended)**
- LobeChat as main UI
- Add `/settings/gateway` page to LobeChat
- Port GatewayManagement component

**Decision:** Option B - Unified experience

**Tasks:**
1. ⏳ Port GatewayManagement to LobeChat
2. ⏳ Add API routes in LobeChat
3. ⏳ Connect to user's gateway
4. ⏳ Test gateway controls

---

### Phase 4: User Migration (Week 4)

**Goal:** All users on own bots

**Tasks:**
1. ⏳ Migrate existing users
2. ⏳ Verify direct connections
3. ⏳ Remove router
4. ⏳ Update documentation

---

## 🔧 Immediate Actions (Today)

### 1. Test Config Fix

```bash
# After code changes, test instance creation
cd /root/zaki-platform
npm run build
npm start

# In another terminal, trigger onboarding
# Check generated config
cat /var/zaki-platform/users/user-*/openclaw.json
```

### 2. Verify Gateway Starts

```bash
# Check container logs
docker logs zaki-user-{userId}

# Should see:
# - "Gateway starting on port 18789"
# - "Gateway ready"
# - No config errors
```

### 3. Test Endpoints

```bash
# Get token from config
TOKEN=$(cat /var/zaki-platform/users/user-*/openclaw.json | jq -r '.gateway.auth.token')
PORT=19001

# Health
curl http://localhost:$PORT/health -H "Authorization: Bearer $TOKEN"

# Chat
curl http://localhost:$PORT/v1/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw","messages":[{"role":"user","content":"hello"}]}'
```

---

## 📊 Success Criteria

### Gateway Works ✅
- [ ] Config file is valid OpenClaw format
- [ ] Gateway starts without errors
- [ ] Health endpoint responds
- [ ] Chat completions work
- [ ] Tools invoke works
- [ ] WebSocket connects

### LobeChat Connects ✅
- [ ] LobeChat points to user's gateway
- [ ] Chat messages work
- [ ] Streaming works
- [ ] No CORS errors

### Gateway Management ✅
- [ ] Gateway status visible
- [ ] Start/stop/restart works
- [ ] Logs accessible
- [ ] Metrics display

---

## 🎯 Next Steps (In Order)

1. **Test config fix** - Verify new config format works
2. **Test gateway** - Ensure gateway starts and responds
3. **Connect LobeChat** - Point to user's gateway
4. **Test end-to-end** - User → Bot → Gateway → LobeChat
5. **Add management** - Port gateway management to LobeChat
6. **Migrate users** - Move to own bots
7. **Remove router** - After migration

---

**Status:** Config fix applied. Ready to test! 🦞
