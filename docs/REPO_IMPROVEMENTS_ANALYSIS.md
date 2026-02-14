# Repository Improvements Analysis & OpenClaw Research

**Date:** 2026-02-09  
**Status:** Analysis Complete - Recommendations Ready

---

## Executive Summary

After reviewing the Zaki Platform codebase and researching recent OpenClaw developments, I've identified several key areas for improvement. The platform has a solid foundation but can benefit from recent OpenClaw features, especially around cost tracking, usage analytics, and security enhancements.

---

## 🔍 Current Codebase Review

### ✅ What's Working Well

1. **Multi-language Onboarding** - Comprehensive onboarding flow with 6 languages
2. **Instance Management** - Robust Docker-based isolation per user
3. **Health Checks** - Kubernetes-compatible health endpoints
4. **Retry Policies** - Telegram API retry logic with exponential backoff
5. **Database Schema** - Usage tracking schema already defined
6. **Security** - Bot token validation and encryption

### ⚠️ Areas Needing Improvement

1. **Usage Tracking** - Schema exists but not implemented (`/usage` command is TODO)
2. **Cost Prediction** - No pre-run cost estimation
3. **Usage Analytics** - No dashboard or reporting
4. **Token Usage** - Not tracking from OpenClaw sessions
5. **Resource Monitoring** - Basic health checks but no detailed metrics
6. **Security Boundaries** - Missing execution guardrails mentioned in research

---

## 🆕 Recent OpenClaw Features (2025-2026)

### 1. Token Usage Dashboard (2026.2.6)
- **Feature:** Web UI token usage dashboard (#10072)
- **Benefit:** Real-time visibility into token consumption
- **Action:** Integrate similar dashboard into Zaki Platform

### 2. Usage Analytics Tabs (In Development)
- **Feature:** Usage Analytics tabs with cost tracking and provider quotas (PRs #5506, #5520)
- **Benefit:** Track costs per user, per model, per provider
- **Action:** Implement usage analytics similar to OpenClaw's approach

### 3. Cost Prediction (Requested Feature)
- **Feature:** Pre-run cost estimation (#2571 - closed but valuable)
- **Proposal:** Show estimated token usage, tool calls, and cost ranges before execution
- **Action:** Implement cost prediction for multi-step workflows

### 4. Memory Improvements
- **Feature:** Native Voyage AI support (#7078)
- **Feature:** QMD backend for workspace memory (#3160)
- **Benefit:** Better memory retrieval and storage
- **Action:** Evaluate Voyage AI integration for better embeddings

### 5. Security Enhancements
- **Feature:** Skill/plugin code safety scanner (#9806)
- **Feature:** Credential redaction from config responses (#9858)
- **Feature:** SSRF guardrails for skill installer downloads
- **Action:** Implement similar security scanning for user-provided code

### 6. Cron & Scheduling Improvements
- **Feature:** Better cron reliability, timer drift fixes (#10776)
- **Feature:** Per-run session keys and deep-links
- **Action:** Review cron implementation if using scheduled tasks

### 7. Model Support
- **Feature:** Anthropic Opus 4.6 support (#9853)
- **Feature:** xAI (Grok) provider support (#9885)
- **Feature:** Baidu Qianfan support (#8868)
- **Action:** Add support for newer models as they become available

---

## 🎯 Priority Improvements

### High Priority

#### 1. Implement Usage Tracking (`/usage` command)
**Current State:** Schema exists, handler is TODO  
**Action:**
- Query `usage` table from database
- Aggregate by date, model, provider
- Show token counts, costs, request counts
- Format as readable Telegram message

**Files to Update:**
- `src/handlers/telegram.ts` - Implement `handleUsage()`
- `src/services/chat.ts` - Track usage when processing messages
- `src/services/agent.ts` - Capture token usage from OpenClaw responses

#### 2. Cost Tracking Integration
**Current State:** Database schema supports cost tracking  
**Action:**
- Parse OpenClaw session responses for token usage
- Calculate costs based on model/provider pricing
- Store in `usage` table
- Display in `/usage` command

**Implementation:**
```typescript
// Example cost calculation
const costMicrocents = calculateCost(
  inputTokens,
  outputTokens,
  model,
  provider
);

await db.insert(usage).values({
  userId,
  model,
  provider,
  inputTokens,
  outputTokens,
  costMicrocents,
  date: new Date(),
});
```

#### 3. Pre-Run Cost Estimation
**Current State:** Not implemented  
**Action:**
- Estimate token usage before running complex workflows
- Show cost ranges (min/likely/max)
- Allow users to approve/reject based on cost
- Implement for multi-step agent tasks

**Example:**
```
🔍 Estimated Cost for this task:
• Input tokens: ~500-800
• Output tokens: ~200-400
• Estimated cost: $0.02 - $0.05
• Tool calls: 3-5

Continue? [Yes] [No] [Adjust]
```

### Medium Priority

#### 4. Usage Analytics Dashboard
**Current State:** Dashboard exists but no usage analytics  
**Action:**
- Add UsageWidget to dashboard
- Show charts: tokens over time, costs per model, provider breakdown
- Add filters: date range, model, provider
- Export to CSV

**Files:**
- `dashboard/client/src/components/UsageWidget.tsx` (new)
- `dashboard/server/routers.ts` - Add usage analytics endpoints

#### 5. Resource Monitoring Enhancement
**Current State:** Basic health checks  
**Action:**
- Track CPU/memory per instance over time
- Alert on high resource usage
- Show resource trends in dashboard
- Implement resource quotas per tier

#### 6. Security Enhancements
**Current State:** Basic validation  
**Action:**
- Add code safety scanner for user-provided skills
- Redact credentials from API responses
- Implement SSRF protection for external URLs
- Add execution guardrails for high-risk operations

### Low Priority

#### 7. Memory Backend Upgrade
**Current State:** Using default OpenClaw memory  
**Action:**
- Evaluate Voyage AI for embeddings
- Consider QMD backend for workspace memory
- Test performance improvements

#### 8. Additional Model Support
**Current State:** Supports Anthropic, OpenAI, Google  
**Action:**
- Add xAI (Grok) support
- Add Baidu Qianfan support
- Support Opus 4.6 when available

---

## 📊 Implementation Plan

### Phase 1: Usage Tracking (Week 1)
1. ✅ Database schema exists
2. ⬜ Implement usage capture from OpenClaw responses
3. ⬜ Implement `/usage` command handler
4. ⬜ Add cost calculation logic
5. ⬜ Test with real user sessions

### Phase 2: Cost Analytics (Week 2)
1. ⬜ Build UsageWidget component
2. ⬜ Add analytics API endpoints
3. ⬜ Create charts and visualizations
4. ⬜ Add date range filters
5. ⬜ Export functionality

### Phase 3: Cost Prediction (Week 3)
1. ⬜ Token estimation algorithm
2. ⬜ Cost calculation engine
3. ⬜ Pre-run approval flow
4. ⬜ Integration with agent workflows
5. ⬜ User testing

### Phase 4: Security & Monitoring (Week 4)
1. ⬜ Code safety scanner
2. ⬜ Credential redaction
3. ⬜ Enhanced resource monitoring
4. ⬜ Alert system
5. ⬜ Documentation

---

## 🔗 Related OpenClaw Repositories

### ClawHub (Skill Registry)
- **URL:** https://github.com/openclaw/clawhub
- **Stars:** 1,673
- **Features:** Skill publishing, versioning, vector search
- **Benefit:** Could integrate community skills into Zaki Platform
- **Action:** Research integration possibilities

### OpenClaw Source
- **URL:** https://github.com/openclaw/openclaw
- **Stars:** 181K+
- **Latest:** 2026.2.6 (Feb 2026)
- **Key Learnings:**
  - Token usage tracking patterns
  - Cost calculation methods
  - Security best practices
  - Memory backend options

---

## 🛡️ Security Considerations

Based on research, OpenClaw's viral adoption revealed important security concerns:

1. **Persistent Access Risk**
   - Agents have continuous access across systems
   - **Mitigation:** Implement time-bound execution windows
   - **Action:** Add session timeouts and approval checkpoints

2. **Prompt Injection Vulnerability**
   - Untrusted input can manipulate agent behavior
   - **Mitigation:** Input validation and sanitization
   - **Action:** Add prompt injection detection

3. **Control Boundaries**
   - Small inputs can propagate across systems
   - **Mitigation:** Clear execution limits and audit trails
   - **Action:** Implement action logging and approval gates

---

## 📝 Code Quality Improvements

### Immediate Fixes

1. **Error Handling**
   - Add try-catch blocks where missing
   - Improve error messages for users
   - Log errors with context

2. **Type Safety**
   - Add missing type definitions
   - Fix `any` types where possible
   - Improve TypeScript strictness

3. **Documentation**
   - Add JSDoc comments to public functions
   - Document API endpoints
   - Update README with latest features

4. **Testing**
   - Add unit tests for usage tracking
   - Test cost calculation logic
   - Integration tests for `/usage` command

---

## 🎯 Quick Wins (Can Implement Today)

1. **Implement `/usage` command** - 2-3 hours
   - Query database
   - Format response
   - Test with sample data

2. **Add usage capture** - 3-4 hours
   - Parse OpenClaw responses
   - Extract token counts
   - Store in database

3. **Cost calculation** - 2-3 hours
   - Model pricing lookup
   - Calculate costs
   - Store in microcents

4. **Basic usage widget** - 4-5 hours
   - Simple chart component
   - API endpoint
   - Display in dashboard

**Total:** ~12-15 hours for basic usage tracking and display

---

## 📚 References

- [OpenClaw Changelog](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)
- [Cost Prediction Feature Request](https://github.com/clawdbot/clawdbot/issues/2571)
- [ClawHub Repository](https://github.com/openclaw/clawhub)
- [OpenClaw Security Analysis](https://prompt.security/blog/what-clawdbots-virality-reveals-about-the-risks-of-agentic-ai)

---

## ✅ Next Steps

1. **Review this document** with team
2. **Prioritize improvements** based on user needs
3. **Start with Phase 1** (Usage Tracking)
4. **Iterate based on feedback**
5. **Monitor OpenClaw updates** for new features

---

**Last Updated:** 2026-02-09  
**Next Review:** After Phase 1 completion
