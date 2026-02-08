# Zaki Platform - Key Decisions

**Date:** 2026-02-03  
**Status:** Research complete, decisions made

---

## ✅ Decisions Made

### 1. Sandbox Costs: ✅ AFFORDABLE
**Decision:** Proceed with per-user Sandbox architecture

**Cost Breakdown:**
| User Type                | Cost/Month | Notes                    |
| ------------------------ | ---------- | ------------------------ |
| Light (sleeps when idle) | ~$0.50     | Scales to zero           |
| Active (2 hrs/day)       | ~$2        | Typical usage            |
| Power user               | ~$5        | Heavy usage              |

**Impact:**
- With $10/mo Pro tier: 80% margin
- Freemium model viable
- Can scale profitably

**Action:** ✅ Proceed with Sandbox architecture

---

### 2. LobeChat: ❌ SKIP IT
**Decision:** Do NOT use LobeChat

**Reasoning:**
- Designed for direct LLM access, not OpenClaw Gateway
- Adds complexity without solving our problem
- Telegram already works via OpenClaw
- No custom UI needed for MVP

**Impact:**
- Faster MVP (no frontend work)
- Focus on backend/API
- Add web UI later if needed

**Action:** ✅ Skip LobeChat, focus on Telegram

---

### 3. MVP Strategy: ✅ TELEGRAM FIRST
**Decision:** Launch with Telegram only

**Reasoning:**
- Telegram already works via OpenClaw
- No custom UI needed
- Faster time to market
- Can add WhatsApp/Discord later

**Impact:**
- Simpler MVP
- Faster launch
- Validate product-market fit first

**Action:** ✅ Build Telegram-first MVP

---

### 4. Sandbox Limits: ✅ FINE
**Decision:** Limits are acceptable

**Findings:**
- Can run ~100 concurrent Sandboxes
- Sandboxes sleep when idle (scale to zero)
- Cold start: 1-2 min (acceptable for free tier)

**Impact:**
- Can handle initial users
- Free tier viable (sleeps when idle)
- Pro tier gets faster (keeps alive)

**Action:** ✅ Proceed with current architecture

---

### 5. Pricing Model: ✅ FREEMIUM
**Decision:** Freemium model

**Tiers:**
- **Free:** 100 msgs/month, Sandbox sleeps when idle
- **Pro ($10/mo):** Unlimited, Sandbox stays alive, faster response

**Impact:**
- Low barrier to entry
- Clear upgrade path
- 80% margin on Pro tier

**Action:** ✅ Implement freemium pricing

---

## 🎯 MVP Plan

### Phase 1: Telegram Bot Signup
**What:**
- User signs up via Telegram bot
- Gets dedicated Sandbox
- Onboarding flow

**How:**
- Telegram bot handles signup
- Create Sandbox per user
- Store user data in R2

**Timeline:** 1-2 weeks

---

### Phase 2: Dedicated Sandbox Per User
**What:**
- Each user gets own Sandbox
- Isolated OpenClaw instance
- Persistent storage in R2

**How:**
- Use Cloudflare Sandboxes
- Mount R2 per user
- Start OpenClaw Gateway per Sandbox

**Timeline:** 1-2 weeks

---

### Phase 3: Freemium Limits
**What:**
- Free: 100 msgs/month, sleeps when idle
- Pro: Unlimited, stays alive, faster

**How:**
- Track message count in R2
- Implement tier checks
- Handle Sandbox sleep/wake

**Timeline:** 1 week

---

## 🚀 Next Steps

### Immediate (This Week)
1. **Review research findings** ✅ Done
2. **Finalize MVP scope** ✅ Done
3. **Update architecture docs** ← Do this
4. **Create implementation plan** ← Do this

### Short-term (This Month)
5. **Deploy Workers + Sandbox** (test)
6. **Build Telegram signup flow**
7. **Implement Sandbox per user**
8. **Add freemium limits**

### Medium-term (Next Month)
9. **Launch MVP**
10. **Get first users**
11. **Iterate based on feedback**
12. **Add WhatsApp/Discord** (if needed)

---

## 📋 Architecture Updates Needed

### Based on Decisions

1. **Remove LobeChat references**
   - Update docs
   - Remove LobeChat research
   - Focus on Telegram

2. **Update MVP scope**
   - Telegram only
   - No web UI
   - Bot-based onboarding

3. **Implement freemium**
   - Message counting
   - Tier checks
   - Sandbox sleep/wake logic

---

## ✅ Validation

**Research Complete:** ✅
**Decisions Made:** ✅
**MVP Defined:** ✅
**Ready to Build:** ✅

---

**Status:** Ready to start implementation! 🚀
