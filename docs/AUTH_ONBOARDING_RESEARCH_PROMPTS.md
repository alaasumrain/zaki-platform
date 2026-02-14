# Authentication & Onboarding Research Prompts

**Date:** 2026-02-10  
**Goal:** Deep dive into authentication, token handling, and onboarding processing

---

## 🔐 Agent 1: Authentication & Token Security

**Copy this prompt:**

```
Research authentication and token security patterns for Zaki Platform's onboarding and instance management.

TASKS:
1. Analyze current authentication implementation in /root/zaki-platform
2. Research best practices for token management
3. Find security patterns for bot tokens, API keys, and gateway tokens

CURRENT IMPLEMENTATION TO REVIEW:
- /root/zaki-platform/src/index.ts (onboarding flow, token handling)
- /root/zaki-platform/src/services/instance-manager.ts (token generation, storage)
- /root/zaki-platform/src/utils/bot-config.ts (bot token management)
- /root/zaki-platform/router/index.js (token usage in containers)

FOCUS AREAS:

1. **Token Generation & Storage**
   - How are gateway tokens generated?
   - Where are tokens stored?
   - Are tokens encrypted?
   - Token rotation strategies
   - Token validation

2. **Bot Token Security**
   - How are Telegram bot tokens handled?
   - Are they encrypted at rest?
   - Token transmission security
   - Token validation with Telegram API
   - Revocation handling

3. **API Key Management**
   - How are user API keys stored?
   - Encryption at rest?
   - Key rotation
   - Access control
   - Key validation

4. **Gateway Authentication**
   - How does OpenClaw gateway authenticate?
   - Token-based auth flow
   - Challenge-response patterns
   - Session management
   - Token expiration

5. **Security Vulnerabilities**
   - Token exposure risks
   - Insecure storage patterns
   - Transmission vulnerabilities
   - Best practices to implement

OUTPUT FORMAT:
```
### Issue/Pattern: [Name]
- **Location:** [file path]
- **Current Implementation:** [what it does now]
- **Security Risk:** [if any]
- **Best Practice:** [what should be done]
- **Priority:** High/Medium/Low
- **Implementation:** [how to fix/improve]
```

PRIORITY: Find security issues and best practices we should implement NOW.
```

---

## 📋 Agent 2: Onboarding Flow Processing

**Copy this prompt:**

```
Research onboarding flow processing and state management in Zaki Platform.

TASKS:
1. Analyze onboarding implementation
2. Find state management patterns
3. Identify edge cases and error handling

CURRENT IMPLEMENTATION TO REVIEW:
- /root/zaki-platform/src/onboarding.ts (onboarding states, messages)
- /root/zaki-platform/src/index.ts (onboarding handler)
- /tmp/zaki-onboarding/ (onboarding state files)

FOCUS AREAS:

1. **State Management**
   - How is onboarding state stored?
   - State persistence across restarts
   - State cleanup
   - Concurrent state handling
   - State validation

2. **Flow Processing**
   - Step transitions
   - Input validation
   - Error recovery
   - Resume from interruption
   - Timeout handling

3. **User Input Handling**
   - Text input processing
   - Button/callback handling
   - Command handling (/start, /skip, etc.)
   - Validation logic
   - Error messages

4. **Edge Cases**
   - User sends /start mid-onboarding
   - Multiple messages during one step
   - State file corruption
   - Concurrent requests
   - Timeout scenarios

5. **Best Practices**
   - State machine patterns
   - Idempotency
   - Transaction-like behavior
   - Rollback mechanisms
   - User experience improvements

OUTPUT FORMAT:
```
### Issue/Pattern: [Name]
- **Location:** [file path]
- **Current Behavior:** [what happens now]
- **Problem:** [if any]
- **Best Practice:** [what should happen]
- **Priority:** High/Medium/Low
- **Fix:** [how to improve]
```

PRIORITY: Find bugs, edge cases, and UX improvements.
```

---

## 🔒 Agent 3: Token & Secret Management Best Practices

**Copy this prompt:**

```
Research token and secret management best practices for multi-tenant platforms.

TASKS:
1. Research industry best practices
2. Find patterns from similar platforms
3. Identify security standards

FOCUS AREAS:

1. **Token Storage**
   - Encryption at rest
   - Key management systems (KMS)
   - Environment variables vs files
   - Database encryption
   - Secret rotation

2. **Token Transmission**
   - HTTPS/TLS requirements
   - Token in URLs (bad)
   - Token in headers (good)
   - WebSocket token handling
   - API key transmission

3. **Token Lifecycle**
   - Generation (cryptographically secure)
   - Validation
   - Expiration
   - Rotation
   - Revocation

4. **Multi-Tenant Considerations**
   - Per-user token isolation
   - Token scoping
   - Access control
   - Audit logging
   - Token leakage prevention

5. **Compliance & Standards**
   - OWASP guidelines
   - PCI DSS (if applicable)
   - GDPR considerations
   - Industry standards

OUTPUT FORMAT:
```
### Pattern: [Name]
- **Problem it solves:** [what issue]
- **How it works:** [description]
- **Implementation for Zaki:** [specific approach]
- **Priority:** High/Medium/Low
- **Examples:** [references]
```

PRIORITY: Find patterns we can implement to improve security.
```

---

## 📋 How to Use

1. **Give Agent 1** the Authentication prompt → Get security analysis
2. **Give Agent 2** the Onboarding prompt → Get flow analysis
3. **Give Agent 3** the Best Practices prompt → Get industry patterns
4. **Synthesize results** → Create implementation plan
5. **Prioritize** → Security first, then UX improvements

---

## 🎯 Expected Outputs

### Agent 1 Output:
- Security vulnerabilities found
- Token storage issues
- Encryption gaps
- Best practices to implement

### Agent 2 Output:
- Onboarding flow bugs
- State management issues
- Edge cases
- UX improvements

### Agent 3 Output:
- Industry best practices
- Security standards
- Implementation patterns
- Compliance considerations

---

**Status:** Ready for agent research! 🚀
