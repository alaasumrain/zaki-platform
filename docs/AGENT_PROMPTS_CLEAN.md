# Agent Research Prompts - Ready to Use

**Date:** 2026-02-10  
**Give these to your 3 agents to research features for Zaki Platform**

---

## 🤖 Agent 1: OpenClaw Ecosystem Deep Dive

**Copy this prompt:**

```
Research OpenClaw ecosystem to find implementable features for Zaki Platform (multi-tenant AI assistant).

TASKS:
1. Search GitHub: gh search repos openclaw
2. Clone interesting repos to /tmp
3. Deep dive into code

REPOS TO EXPLORE:
- openclaw/openclaw (main repo)
- openclaw-ansible (security)
- moltworker (Cloudflare, R2)
- memU (memory)
- Any dashboard implementations

FIND THESE FEATURES:

1. Gateway Multi-User Patterns
   - Session routing
   - Port management
   - Token auth

2. Session Lock Handling
   - Prevention strategies
   - Cleanup methods
   - Concurrent handling

3. Channel Bot Assignment
   - Telegram bot assignment
   - Token management
   - Webhook patterns

4. Memory & Context
   - Workspace persistence
   - Session history
   - Storage patterns

5. Error Recovery
   - Gateway restarts
   - Health checks
   - Auto-recovery

OUTPUT FORMAT:
### Feature: [Name]
- Source: [repo/file]
- What: [description]
- Code: [snippet]
- Implement: [steps]
- Priority: High/Med/Low
- Effort: Low/Med/High

FOCUS: Features we can implement THIS WEEK.
```

---

## 🤖 Agent 2: LobeChat UI/UX Features

**Copy this prompt:**

```
Analyze LobeChat fork at /root/zaki-dashboard to find UX features for Zaki Platform.

TASKS:
1. Explore /root/zaki-dashboard codebase
2. Find ready-to-use components
3. Identify UX patterns

FOCUS AREAS:

1. Chat Message Rendering
   - Streaming display
   - Thinking blocks
   - Markdown/code
   - Media handling

2. Session Management UI
   - Conversation list
   - Session switching
   - Search/filter

3. Real-Time Features
   - Typing indicators
   - Live updates
   - Connection status

4. Settings UI
   - Model selection
   - API key management
   - Gateway status

5. Mobile Experience
   - Responsive patterns
   - Touch interactions

OUTPUT FORMAT:
### Feature: [Name]
- Source: [file path]
- UX benefit: [why]
- Component: [location]
- Implement: [steps]
- Priority: High/Med/Low

FOCUS: Ready-to-use components and patterns.
```

---

## 🤖 Agent 3: Multi-Tenant Best Practices

**Copy this prompt:**

```
Research multi-tenant AI platform patterns for Zaki Platform.

TASKS:
1. Research multi-tenant platforms
2. Find container patterns
3. Identify security strategies

FOCUS AREAS:

1. User Isolation
   - Container isolation
   - Network isolation
   - Resource limits

2. Resource Management
   - Auto-scaling
   - Quotas
   - Usage tracking

3. Security Patterns
   - Token encryption
   - Secret management
   - Access control

4. Monitoring
   - Health checks
   - Metrics
   - Alerting

5. Onboarding & UX
   - User flows
   - Error messages
   - Help systems

OUTPUT FORMAT:
### Pattern: [Name]
- Problem: [what it solves]
- How: [description]
- Implement: [approach]
- Priority: High/Med/Low
- Examples: [references]

FOCUS: Patterns we can implement NOW.
```

---

## 📋 How to Use

1. **Give Agent 1** the OpenClaw prompt → Get feature list
2. **Give Agent 2** the LobeChat prompt → Get UI components
3. **Give Agent 3** the Multi-Tenant prompt → Get best practices
4. **Synthesize results** → Create implementation plan
5. **Prioritize** → High impact, low effort first

---

**Status:** Ready to give to agents! 🚀
