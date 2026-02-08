# Zaki Platform MVP Plan

**Date:** 2026-02-03  
**Status:** Research complete, MVP defined

---

## 🎯 MVP Scope

### What's IN
- ✅ Telegram bot signup
- ✅ Dedicated Sandbox per user
- ✅ OpenClaw Gateway per Sandbox
- ✅ Persistent storage (R2)
- ✅ Freemium limits (100 msgs/mo free, $10/mo Pro)
- ✅ User isolation

### What's OUT (For Now)
- ❌ LobeChat / custom web UI
- ❌ WhatsApp / Discord (add later)
- ❌ Multi-channel support
- ❌ Advanced features

---

## 🏗️ Architecture

```
User → Telegram Bot → Cloudflare Workers API → User's Sandbox
                                                      ├── R2 mounted (~/.openclaw)
                                                      ├── OpenClaw Gateway (:18789)
                                                      └── Per-user config/sessions
```

**Key Components:**
1. **Telegram Bot** - User interface
2. **Workers API** - Request routing
3. **Sandbox** - Isolated container per user
4. **OpenClaw Gateway** - AI runtime
5. **R2 Storage** - Persistent user data

---

## 📋 Implementation Steps

### Phase 1: Deploy & Test (Week 1)
**Goal:** Get Workers + Sandbox working

**Tasks:**
1. Deploy Workers to Cloudflare
2. Test Sandbox creation
3. Verify R2 mounting
4. Test OpenClaw Gateway startup
5. Test single user flow

**Success Criteria:**
- ✅ Can create Sandbox
- ✅ Can mount R2
- ✅ Can start Gateway
- ✅ Can send/receive messages

---

### Phase 2: Telegram Signup (Week 2)
**Goal:** User can sign up via Telegram

**Tasks:**
1. Create Telegram bot
2. Implement signup flow
3. Create user account in R2
4. Initialize Sandbox on signup
5. Send welcome message

**Success Criteria:**
- ✅ User can sign up via Telegram
- ✅ Sandbox created automatically
- ✅ User can start chatting

---

### Phase 3: Freemium Limits (Week 3)
**Goal:** Implement tier system

**Tasks:**
1. Track message count per user
2. Implement tier checks
3. Handle Sandbox sleep/wake
4. Add upgrade flow
5. Test limits

**Success Criteria:**
- ✅ Free tier: 100 msgs/month
- ✅ Pro tier: Unlimited
- ✅ Sandbox sleeps when idle (free)
- ✅ Sandbox stays alive (pro)

---

### Phase 4: Polish & Launch (Week 4)
**Goal:** Ready for users

**Tasks:**
1. Error handling
2. Logging/monitoring
3. Documentation
4. Testing
5. Launch!

**Success Criteria:**
- ✅ Stable & reliable
- ✅ Good error messages
- ✅ Documentation complete
- ✅ Ready for users

---

## 💰 Pricing Model

### Free Tier
- **Messages:** 100/month
- **Sandbox:** Sleeps when idle
- **Cold start:** 1-2 minutes
- **Storage:** 1GB

### Pro Tier ($10/month)
- **Messages:** Unlimited
- **Sandbox:** Stays alive
- **Response time:** Fast (< 5 seconds)
- **Storage:** 10GB

**Margin:** ~80% (cost ~$2/user, charge $10)

---

## 🔧 Technical Details

### Sandbox Lifecycle

**Free Tier:**
1. User sends message
2. Check if Sandbox exists
3. If not, create Sandbox (cold start: 1-2 min)
4. Mount R2, start Gateway
5. Process message
6. Sandbox sleeps after 5 min idle

**Pro Tier:**
1. User sends message
2. Sandbox already running (fast)
3. Process message immediately
4. Sandbox stays alive

### Message Counting
- Store count in R2: `users/{userId}/metadata.json`
- Increment on each message
- Check limit before processing
- Reset monthly

### Sandbox Management
- Create on first message (free) or signup (pro)
- Sleep after idle timeout (free only)
- Keep alive (pro only)
- Cleanup inactive Sandboxes (30 days)

---

## 📊 Success Metrics

### Week 1-2 (Development)
- ✅ Sandbox creation works
- ✅ Gateway starts successfully
- ✅ Messages flow end-to-end

### Week 3-4 (Testing)
- ✅ Freemium limits work
- ✅ Sandbox sleep/wake works
- ✅ Upgrade flow works

### Launch (Month 1)
- **Goal:** 10 users
- **Target:** 2 Pro conversions
- **Focus:** Stability & feedback

---

## 🚀 Next Actions

### Right Now
1. ✅ Review research findings
2. ✅ Finalize MVP plan
3. ⏭️ Update architecture docs
4. ⏭️ Start Phase 1: Deploy & Test

### This Week
- Deploy Workers + Sandbox
- Test single user flow
- Verify everything works

### Next Week
- Build Telegram signup
- Implement user management
- Test multi-user

---

## 📝 Notes

**Why Telegram First:**
- Already works via OpenClaw
- No custom UI needed
- Faster to market
- Can add channels later

**Why Skip LobeChat:**
- Not designed for OpenClaw Gateway
- Adds complexity
- Telegram is sufficient for MVP

**Why Freemium:**
- Low barrier to entry
- Clear upgrade path
- 80% margin on Pro
- Validates demand

---

**Status:** Ready to build! 🚀
