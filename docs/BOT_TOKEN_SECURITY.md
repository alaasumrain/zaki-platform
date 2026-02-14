# Bot Token Security - Current Process & Alternatives

**Date:** 2026-02-10  
**Issue:** Bot tokens are pasted in chat, which is not ideal for security

---

## 🔒 Current Process (Security Concerns)

### How It Works Now:
1. User clicks "Open BotFather" button
2. User creates bot via BotFather
3. BotFather gives user a token
4. User **pastes token in chat** ← Security concern
5. We validate and use token

### Security Issues:
- ❌ Token visible in chat (could be screenshot)
- ❌ Token stored in chat history
- ❌ Anyone with access to chat can see token
- ❌ Token is plain text in our system

---

## ✅ Better Alternatives

### Option 1: Web-Based Token Entry (Recommended)
**How it works:**
1. User clicks button → Opens web page (our dashboard)
2. User pastes token on secure web page
3. Token sent via HTTPS to our API
4. Token never appears in chat
5. We validate and create instance

**Pros:**
- ✅ Token not in chat
- ✅ HTTPS encrypted
- ✅ Can add 2FA/verification
- ✅ Better UX (form validation, etc.)

**Cons:**
- ⚠️ Requires web interface
- ⚠️ User needs to switch between Telegram and browser

**Implementation:**
```typescript
// Button opens web page instead of BotFather directly
buttons: [
  [
    { text: '🔐 Secure Setup (Recommended)', url: 'https://zaki.ai/setup?user={userId}' }
  ],
  [
    { text: '📱 Open BotFather', url: 'https://t.me/BotFather?start=start' }
  ]
]
```

---

### Option 2: Pre-Create Bot Pool (For Premium Users)
**How it works:**
1. We create 40 bots upfront (BotFather limit)
2. User gets assigned a bot from pool
3. We give them the bot username
4. They can use it immediately
5. No token exchange needed

**Pros:**
- ✅ No token in chat
- ✅ Instant setup
- ✅ We control everything

**Cons:**
- ❌ Limited to 40 users per Telegram account
- ❌ We hold the tokens (privacy concern)
- ❌ Requires upfront work

---

### Option 3: Hybrid Approach (Best UX)
**How it works:**
1. **Free tier:** User creates own bot, pastes token (current)
2. **Premium tier:** We pre-create bot, assign to user
3. **Enterprise:** Custom bot creation via API

**Pros:**
- ✅ Flexible
- ✅ Privacy option for users who want it
- ✅ Premium feature

**Cons:**
- ⚠️ Two systems to maintain

---

## 🎯 Recommended Solution: Web-Based Entry

### Implementation Plan:

1. **Create secure web page:**
   - `/setup` route in our dashboard
   - User authentication (Telegram login widget)
   - Token input form
   - Validation and submission

2. **Update onboarding:**
   - Button opens web page instead of asking for token in chat
   - Web page handles token securely
   - Returns to Telegram with confirmation

3. **Security features:**
   - HTTPS only
   - Token validation before storage
   - One-time use (invalidate after use)
   - Encrypted storage

---

## 🔐 Current Best Practices (Until We Implement Web)

1. **Token Validation:**
   - ✅ Validate immediately
   - ✅ Use token right away
   - ✅ Don't store in plain text (encrypt)

2. **User Education:**
   - ⚠️ Warn users not to share token
   - ⚠️ Explain token gives full bot control
   - ⚠️ Suggest revoking if compromised

3. **Token Handling:**
   - ✅ Validate with Telegram API
   - ✅ Store encrypted
   - ✅ Use immediately for instance
   - ✅ Don't log in plain text

---

## 📋 Next Steps

1. **Short term (Now):**
   - Add security warnings in onboarding
   - Encrypt token storage
   - Validate immediately

2. **Medium term (This week):**
   - Create web-based token entry page
   - Update onboarding to use web page
   - Add Telegram login widget

3. **Long term (Next month):**
   - Pre-create bot pool for premium
   - Add token rotation
   - Add 2FA for token changes

---

**Status:** Current process works but has security concerns. Web-based entry is recommended next step.
