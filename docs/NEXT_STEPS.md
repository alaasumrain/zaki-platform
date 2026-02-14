# Next Steps - What to Do Now

**Date:** 2026-02-10  
**Status:** All features implemented ✅

---

## ✅ What We've Done

1. **Implemented all 5 top features:**
   - ✅ Session Lock Manager
   - ✅ Health Check Hierarchy
   - ✅ Actionable Error Messages
   - ✅ ResourceQuota per User
   - ✅ Auto-Scroll Component

2. **Configured bot:**
   - ✅ Bot name: "Zaki - Setup Assistant"
   - ✅ Auto-configuration on server start
   - ✅ Updated all references

---

## 🚀 Immediate Next Steps

### 1. Configure the Bot (If Not Done Yet)

The bot will auto-configure on server start, but you can also do it manually:

```bash
cd /root/zaki-platform
export TELEGRAM_BOT_TOKEN=your-token-here
tsx scripts/configure-bot.ts
```

**Verify it worked:**
- Search for `@zakified_bot` in Telegram
- Should see "Zaki - Setup Assistant" as the name
- Description should explain setup process

---

### 2. Test the New Features

#### A. Health Checks
```bash
# Test health endpoints
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/startup
curl http://localhost:3000/health
```

**Expected:** All should return 200 with health status

#### B. Session Lock Manager
- Test with concurrent requests to same user
- Should handle locks gracefully
- Check logs for lock cleanup

#### C. Actionable Errors
- Trigger an error (e.g., invalid bot token)
- Should see user-friendly error with actions
- Check Telegram messages for formatted errors

#### D. Resource Quotas
```bash
# Check container limits
docker inspect zaki-user-123 | jq '.[0].HostConfig'
```

**Expected:** Should see:
- Memory: 2GB
- CPU: 2 cores
- PIDs: 100

---

### 3. Test End-to-End Onboarding

1. **Message @zakified_bot** (or your bot username)
2. **Send `/start`**
3. **Go through onboarding:**
   - Language selection
   - Name
   - Purpose
   - Style
   - API keys (skip or add)
   - Bot token (create via BotFather)
4. **Verify:**
   - Instance created
   - Container running
   - Bot configured
   - Can chat with private bot

---

### 4. Integrate Features into Router

The session lock manager and actionable errors need to be integrated into the router:

**File:** `router/index.js`

**Add:**
```javascript
const { acquireSessionLock, cleanupStaleLocks } = require('../src/services/session-lock-manager');
const { createActionableError, formatErrorForTelegram } = require('../src/utils/actionable-errors');

// In sendToContainer function:
try {
  // Use session lock before accessing session
  const lock = await acquireSessionLock(sessionPath);
  // ... send message
  await lock.release();
} catch (error) {
  const actionable = createActionableError(error, { userId, requestId });
  return formatErrorForTelegram(actionable);
}
```

---

### 5. Integrate Auto-Scroll into Dashboard

**File:** `zaki-dashboard/src/features/Conversation/ChatList/`

**Add:**
```tsx
import AutoScroll from '@/components/AutoScroll';
import BackBottom from '@/components/AutoScroll/BackBottom';

// In ChatList component:
<ChatList>
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
  <AutoScroll
    isGenerating={isGenerating}
    atBottom={atBottom}
    isScrolling={isScrolling}
    scrollToBottom={scrollToBottom}
    lastMessageLength={lastMessage?.content?.length || 0}
  />
</ChatList>

<BackBottom
  visible={!atBottom}
  onClick={() => scrollToBottom(true)}
/>
```

---

## 📋 Testing Checklist

- [ ] Bot name shows as "Zaki - Setup Assistant" in Telegram
- [ ] Health checks return proper status
- [ ] Session locks prevent conflicts
- [ ] Error messages are user-friendly
- [ ] Containers have resource limits
- [ ] Onboarding flow works end-to-end
- [ ] Auto-scroll works in dashboard (if dashboard is running)
- [ ] All features integrated and tested

---

## 🔧 Optional Improvements

### 1. Add Monitoring
- Set up alerts for health check failures
- Monitor resource usage per user
- Track session lock conflicts

### 2. Add Logging
- Structured logging with request IDs
- Correlation IDs for tracing
- Error tracking

### 3. Add Metrics
- Request rate per user
- Error rate
- Response time
- Resource usage

### 4. Dashboard Integration
- Show health status in dashboard
- Display resource usage
- Show error history

---

## 🎯 Priority Order

1. **Test bot configuration** (5 min)
2. **Test health checks** (5 min)
3. **Test onboarding flow** (10 min)
4. **Integrate session locks** (15 min)
5. **Integrate actionable errors** (15 min)
6. **Test resource quotas** (5 min)
7. **Integrate auto-scroll** (if dashboard ready) (20 min)

**Total:** ~1 hour to fully test and integrate everything

---

## 🚨 If Something Breaks

1. **Check logs:**
   ```bash
   tail -f /tmp/zaki-platform-server.log
   ```

2. **Check health:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check containers:**
   ```bash
   docker ps | grep zaki
   ```

4. **Restart server:**
   ```bash
   # Stop
   pkill -f "npm run dev"
   
   # Start
   cd /root/zaki-platform
   npm run dev
   ```

---

**Status:** Ready to test! Start with bot configuration, then test features one by one. 🦞
