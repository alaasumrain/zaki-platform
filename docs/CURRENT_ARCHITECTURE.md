# Current Architecture - Two Agents Setup

**Date:** 2026-02-10  
**Status:** Clarifying current setup

---

## 🤖 Two Agents/Bots We Have

### 1. **@zakified_bot** (Shared Bot - Entry Point)
**Purpose:** The bot people talk to initially to create their own bot

**What it does:**
- Receives messages from new users
- Handles onboarding flow
- Guides users to create their own bot via BotFather
- Collects bot token from user
- Creates user's instance automatically

**Current Implementation:**
- Token: `8517348591:AAH0-wsbFUn0so3JO-yN_BsV32Khw6IUs6Q` (in router/index.js)
- Handled by: `/root/zaki-platform/src/index.ts` (Express server)
- Also handled by: `/root/zaki-platform/router/index.js` (legacy router)

**Flow:**
```
User → @zakified_bot → Zaki Platform Server → Onboarding → Instance Creation
```

---

### 2. **Zaki Platform Server** (Our Main Server)
**Purpose:** The backend that manages everything

**What it does:**
- Receives Telegram updates (polling or webhook)
- Handles onboarding flow
- Creates user instances
- Manages containers
- Routes messages (temporarily, until users have own bots)

**Current Implementation:**
- File: `/root/zaki-platform/src/index.ts`
- Uses: `TELEGRAM_BOT_TOKEN` environment variable
- Port: 3000 (Express server)
- Status: Should be running

**Flow:**
```
Telegram Updates → Zaki Platform Server → Onboarding/Instance Management
```

---

## 🔄 Current Flow

### For New Users:
```
1. User messages @zakified_bot
   ↓
2. Zaki Platform Server receives update
   ↓
3. Onboarding flow starts
   - Language selection
   - Name, purpose, style
   - API keys (optional)
   - Bot token collection
   ↓
4. User creates bot via BotFather
   ↓
5. User pastes token to @zakified_bot
   ↓
6. Zaki Platform creates instance with user's bot
   ↓
7. User switches to their own bot
```

### For Users with Own Bot:
```
1. User messages their own bot
   ↓
2. User's bot → User's Container → OpenClaw Gateway
   ↓
3. Response back to user
```

---

## ⚠️ Current Issue: Two Handlers?

**Problem:** We might have TWO things handling @zakified_bot:

1. **Zaki Platform Server** (`/root/zaki-platform/src/index.ts`)
   - Express server
   - Handles onboarding
   - Creates instances

2. **Router** (`/root/zaki-platform/router/index.js`)
   - Legacy router
   - Routes messages to containers
   - Uses shared bot token

**This causes conflicts!**

---

## ✅ What Should Happen

### @zakified_bot Should:
- ✅ Handle onboarding (Zaki Platform Server)
- ✅ Guide users to create their own bot
- ✅ Collect bot tokens
- ❌ NOT route messages to containers (that's for user's own bots)

### User's Own Bot Should:
- ✅ Connect directly to their container
- ✅ Use OpenClaw Gateway in container
- ✅ Full proactive messaging
- ✅ No router needed

---

## 🔧 Fix Needed

### Option 1: Use Zaki Platform Server Only
- ✅ Keep `/root/zaki-platform/src/index.ts`
- ❌ Stop/remove `/root/zaki-platform/router/index.js`
- ✅ @zakified_bot handled by Zaki Platform Server only

### Option 2: Use Router Only (Temporary)
- ❌ Keep router for now (legacy users)
- ✅ Zaki Platform Server handles onboarding
- ⚠️ Router routes messages (temporary, until migration)

**Recommendation:** Option 1 - Use Zaki Platform Server only, remove router

---

## 📊 Current Status

| Component | Status | Purpose |
|-----------|--------|---------|
| **@zakified_bot** | ✅ Running | Entry point for onboarding |
| **Zaki Platform Server** | ⏳ Check if running | Handles onboarding |
| **Router** | ⚠️ Might conflict | Legacy message routing |
| **User Containers** | ✅ Running (2 users) | User instances |

---

## 🎯 Next Steps

1. **Check what's running:**
   ```bash
   ps aux | grep -E "(node|tsx|zaki)" | grep -v grep
   ```

2. **Stop router if conflicting:**
   ```bash
   # If router is running, stop it
   pkill -f "router/index.js"
   ```

3. **Ensure Zaki Platform Server is running:**
   ```bash
   cd /root/zaki-platform
   npm run dev  # or npm start
   ```

4. **Test @zakified_bot:**
   - Message @zakified_bot
   - Should get onboarding flow
   - Should NOT conflict with router

---

## 💡 Summary

**Yes, we have 2 agents:**

1. **@zakified_bot** - Shared bot for onboarding
2. **Zaki Platform Server** - Backend that handles everything

**The @zakified_bot is the entry point** - people talk to it to:
- Start onboarding
- Create their own bot
- Get their instance set up

**After onboarding:**
- User gets their own bot
- User talks to their own bot
- @zakified_bot is no longer needed for that user

---

**Status:** Architecture clarified. Need to check what's actually running! 🦞
