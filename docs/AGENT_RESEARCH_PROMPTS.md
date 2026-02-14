# Agent Research Prompts - Feature Discovery

**Date:** 2026-02-10  
**Goal:** Use 3 AI agents to research and find implementable features for Zaki Platform

---

## 🤖 Agent 1: OpenClaw Ecosystem Deep Dive

**Prompt:**

```
Research OpenClaw ecosystem to find implementable features for Zaki Platform (multi-tenant AI assistant).

TASKS:
1. Search GitHub for openclaw-* repos using: gh search repos openclaw
2. Clone interesting repos to /tmp for analysis
3. Deep dive into code to find features

REPOS TO EXPLORE:
- openclaw/openclaw (main - gateway, channels, agents)
- Any dashboard implementations
- openclaw-ansible (security patterns)
- moltworker (Cloudflare integration, R2 storage)
- memU (memory systems)
- Any gateway wrapper implementations

FIND THESE SPECIFIC FEATURES:

1. **Gateway Multi-User Patterns**
   - How do they handle multiple users on one gateway?
   - Session routing/identification
   - Port management
   - Token-based auth patterns

2. **Session Lock Handling**
   - How do they prevent/prevent session locks?
   - Lock cleanup strategies
   - Concurrent request handling
   - Timeout management

3. **Channel Bot Assignment**
   - How do they assign Telegram bots to instances?
   - Bot token management
   - Webhook vs polling patterns
   - Multi-bot coordination

4. **Memory & Context**
   - Workspace persistence
   - Session history management
   - User context storage
   - R2/cloud storage patterns

5. **Error Recovery**
   - Gateway restart strategies
   - Container health checks
   - Auto-recovery patterns
   - Failure notifications

OUTPUT FORMAT (for each feature):
```
### Feature: [Name]
- **Source:** [repo/file path]
- **What it does:** [1-2 sentences]
- **Code example:** [relevant code snippet]
- **How to implement in Zaki:** [specific steps]
- **Priority:** High/Medium/Low
- **Effort:** Low/Medium/High
```

PRIORITY: Find features we can implement THIS WEEK. Focus on:
- Session lock fixes
- Gateway reliability
- Bot assignment patterns
- Error handling
```

---

## 🤖 Agent 2: LobeChat & Modern Chat UI Patterns

**Prompt:**

```
Analyze LobeChat and modern chat UIs to find UX features for Zaki Platform dashboard.

TASKS:
1. Explore /root/zaki-dashboard (LobeChat fork)
2. Research modern chat UI patterns
3. Find specific components we can use/adapt

FOCUS AREAS:

1. **Chat Message Rendering**
   - How do they show streaming responses?
   - Thinking/tool activity display
   - Markdown rendering
   - Code blocks, syntax highlighting
   - Image/media handling

2. **Session Management UI**
   - Conversation list/sidebar
   - Session switching
   - Context indicators
   - Search/filter conversations

3. **Real-Time Features**
   - Typing indicators
   - Live updates
   - Connection status
   - Error states

4. **Settings/Config UI**
   - Model selection interface
   - API key management
   - Preferences
   - Gateway status display

5. **Mobile Experience**
   - Responsive design patterns
   - Touch interactions
   - Mobile-optimized layouts

OUTPUT FORMAT:
```
### Feature: [Name]
- **Source:** [LobeChat file path or external example]
- **UX benefit:** [why it matters]
- **Component location:** [file path if in LobeChat]
- **How to implement:** [steps]
- **Priority:** High/Medium/Low
```

PRIORITY: Find ready-to-use components in LobeChat fork and UX patterns we should adopt.
```

---

## 🤖 Agent 3: Multi-Tenant AI Platform Best Practices

**Prompt:**

```
Research multi-tenant AI platform patterns to find features for Zaki Platform.

TASKS:
1. Research how other platforms handle multi-tenancy
2. Find container orchestration patterns
3. Identify security and isolation strategies

FOCUS AREAS:

1. **User Isolation**
   - Container isolation strategies
   - Network isolation
   - File system isolation
   - Resource limits (CPU, memory)

2. **Resource Management**
   - Auto-scaling patterns
   - Resource quotas
   - Usage tracking
   - Cost optimization

3. **Security Patterns**
   - Token encryption
   - Secret management
   - Access control
   - Audit logging

4. **Monitoring & Observability**
   - Health check patterns
   - Metrics collection
   - Logging strategies
   - Alerting

5. **Onboarding & UX**
   - User onboarding flows
   - Feature discovery
   - Help/documentation
   - Error messages

OUTPUT FORMAT:
```
### Pattern: [Name]
- **Problem it solves:** [what issue]
- **How it works:** [description]
- **Implementation for Zaki:** [specific approach]
- **Priority:** High/Medium/Low
- **Examples:** [references]
```

PRIORITY: Find patterns we can implement NOW to improve reliability and security.
```


---

## 🎯 Expected Outputs

### Agent 1 Output:
- List of OpenClaw features we can implement
- Code patterns and examples
- Priority ratings
- Implementation roadmap

### Agent 2 Output:
- UX features from LobeChat
- UI patterns we should adopt
- Mobile/responsive considerations
- Accessibility features

### Agent 3 Output:
- Multi-tenant best practices
- Security patterns
- Scaling strategies
- Operational features

---

## 📋 How to Use

1. **Run Agent 1** - Get OpenClaw feature list
2. **Run Agent 2** - Get UX/UI features
3. **Run Agent 3** - Get platform best practices
4. **Synthesize** - Combine findings into implementation plan
5. **Prioritize** - Rank features by impact vs effort
6. **Implement** - Start with high-priority, low-effort wins

---

**Status:** Ready for agent execution! 🚀
