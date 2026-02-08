# OpenClaw Capabilities & Tier Management

**Date:** 2026-02-03

---

## ✅ Full OpenClaw Capabilities Per User

Each user gets their own **isolated Sandbox** with **full OpenClaw access**:

### Core Features Available:
- ✅ **AI Chat** - Full conversation with Claude/OpenAI models
- ✅ **Browser Automation** - Web scraping, screenshots, navigation (via Cloudflare Browser Rendering)
- ✅ **Terminal Access** - Run commands, scripts, install packages
- ✅ **File System** - Read/write files, manage workspace
- ✅ **Custom Skills** - Install and use custom OpenClaw skills
- ✅ **Multi-Channel** - Telegram, Discord, Slack, Web UI
- ✅ **Persistent Memory** - Chat history, context, long-term memory
- ✅ **Workspace** - Personal workspace at `/root/clawd/`
- ✅ **R2 Storage** - Persistent storage across Sandbox restarts

### What Users Can Do:
1. **Install packages** - `npm install`, `pip install`, etc.
2. **Run scripts** - Python, Node.js, bash scripts
3. **Browse the web** - Full browser automation via CDP
4. **Manage files** - Create, edit, delete files in their workspace
5. **Customize AI** - Configure models, prompts, instructions
6. **Add skills** - Install custom OpenClaw skills
7. **Access terminal** - Full shell access in their Sandbox

**Yes, users can explore OpenClaw to its FULL potential!** 🚀

---

## 🎚️ Tier System Design

### Tier Levels

#### **Free Tier** (Default)
- ✅ Basic AI chat
- ✅ Limited messages: **100 messages/month**
- ✅ Basic browser automation: **10 browser sessions/month**
- ✅ File storage: **100 MB**
- ✅ No custom skills installation
- ✅ Sandbox sleeps after **5 minutes** inactivity
- ❌ No terminal access
- ❌ No custom package installation

#### **Pro Tier** ($10/month)
- ✅ Unlimited AI chat
- ✅ Unlimited browser automation
- ✅ File storage: **10 GB**
- ✅ Custom skills installation
- ✅ Sandbox stays alive: **1 hour** inactivity
- ✅ Terminal access (limited commands)
- ✅ Custom package installation (whitelist)

#### **Enterprise Tier** ($50/month)
- ✅ Everything in Pro
- ✅ File storage: **100 GB**
- ✅ Sandbox stays alive: **24 hours** inactivity
- ✅ Full terminal access
- ✅ Priority support
- ✅ Custom model access
- ✅ API access

---

## 🔒 Vetting & Access Control

### 1. User Registration & Vetting

**Signup Flow:**
```
User Signs Up → Email Verification → Admin Review → Account Activated
```

**Vetting Options:**

#### Option A: **Auto-Approval** (Default)
- Users sign up → Get Free tier immediately
- No manual review needed
- Can upgrade to Pro/Enterprise

#### Option B: **Manual Approval**
- Users sign up → Wait for admin approval
- Admin reviews application
- Approve/Reject/Upgrade tier

#### Option C: **Invite-Only**
- Users need invite code
- Invite codes tied to specific tiers
- No public signup

### 2. Implementation

**User Management System:**

```typescript
interface User {
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'pending' | 'active' | 'suspended' | 'banned';
  createdAt: number;
  limits: {
    messagesUsed: number;
    messagesLimit: number;
    browserSessionsUsed: number;
    browserSessionsLimit: number;
    storageUsed: number; // bytes
    storageLimit: number; // bytes
  };
  features: {
    terminalAccess: boolean;
    customSkills: boolean;
    customPackages: boolean;
    apiAccess: boolean;
  };
}
```

**Vetting Workflow:**

```typescript
// 1. User signs up
POST /api/auth/signup
{
  email: "user@example.com",
  password: "..."
}

// 2. Admin reviews (if manual approval)
POST /api/admin/users/:userId/approve
POST /api/admin/users/:userId/reject
POST /api/admin/users/:userId/upgrade?tier=pro

// 3. User gets Sandbox
GET /api/sandbox/:userId
// Returns Sandbox with tier-based limits
```

---

## 🛡️ Limit Enforcement

### Rate Limiting

**Per-User Limits:**
```typescript
// Check limits before processing request
async function checkLimits(env: Env, userId: string): Promise<boolean> {
  const user = await getUser(env, userId);
  
  // Check message limit
  if (user.limits.messagesUsed >= user.limits.messagesLimit) {
    throw new Error('Message limit reached. Upgrade to Pro for unlimited.');
  }
  
  // Check storage limit
  const storageUsed = await getStorageUsage(env, userId);
  if (storageUsed >= user.limits.storageLimit) {
    throw new Error('Storage limit reached. Upgrade for more storage.');
  }
  
  return true;
}
```

**Sandbox Limits:**
```typescript
// Free tier: Sandbox sleeps after 5 min
const sandboxOptions = user.tier === 'free' 
  ? { sleepAfter: '5m' }
  : user.tier === 'pro'
  ? { sleepAfter: '1h' }
  : { keepAlive: true }; // Enterprise: always alive
```

### Feature Gating

**Terminal Access:**
```typescript
// Check if user has terminal access
if (!user.features.terminalAccess) {
  // Block terminal commands
  throw new Error('Terminal access not available on Free tier. Upgrade to Pro.');
}
```

**Custom Skills:**
```typescript
// Check if user can install custom skills
if (!user.features.customSkills) {
  // Block skill installation
  throw new Error('Custom skills not available on Free tier. Upgrade to Pro.');
}
```

---

## 📊 Usage Tracking

**Track Usage Per User:**
```typescript
// Increment usage counters
async function trackUsage(env: Env, userId: string, type: 'message' | 'browser' | 'storage') {
  const user = await getUser(env, userId);
  
  switch (type) {
    case 'message':
      user.limits.messagesUsed++;
      break;
    case 'browser':
      user.limits.browserSessionsUsed++;
      break;
    case 'storage':
      // Update storage usage from R2
      user.limits.storageUsed = await getStorageUsage(env, userId);
      break;
  }
  
  await saveUser(env, user);
}
```

**Storage Usage:**
```typescript
// Calculate storage used from R2
async function getStorageUsage(env: Env, userId: string): Promise<number> {
  const prefix = `users/${userId}/`;
  let totalSize = 0;
  
  // List all objects with user prefix
  const objects = await env.UserStorage.list({ prefix });
  
  for (const obj of objects.objects) {
    totalSize += obj.size;
  }
  
  return totalSize;
}
```

---

## 🎯 Admin Controls

### Admin Dashboard Features:

1. **User Management**
   - View all users
   - Approve/Reject signups
   - Upgrade/Downgrade tiers
   - Suspend/Ban users

2. **Usage Monitoring**
   - View usage per user
   - See who's hitting limits
   - Monitor resource usage

3. **Tier Configuration**
   - Set limits per tier
   - Adjust pricing
   - Configure features

4. **Sandbox Management**
   - View active Sandboxes
   - Restart Sandboxes
   - Monitor Sandbox health

---

## 🔐 Security & Abuse Prevention

### Abuse Prevention:

1. **Rate Limiting**
   - Per-user rate limits
   - Per-IP rate limits
   - Per-endpoint rate limits

2. **Resource Limits**
   - CPU time limits
   - Memory limits
   - Storage limits
   - Network limits

3. **Command Filtering**
   - Block dangerous commands (rm -rf /, etc.)
   - Whitelist allowed packages (for Free tier)
   - Monitor suspicious activity

4. **Sandbox Isolation**
   - Each user's Sandbox is completely isolated
   - No cross-user access
   - R2 prefixes ensure data isolation

---

## 📋 Implementation Checklist

### Phase 1: Basic Tier System
- [ ] User model with tier field
- [ ] Tier-based limits configuration
- [ ] Usage tracking
- [ ] Limit enforcement middleware

### Phase 2: Vetting System
- [ ] Signup flow
- [ ] Admin approval workflow
- [ ] Email verification
- [ ] Invite code system (optional)

### Phase 3: Advanced Controls
- [ ] Admin dashboard
- [ ] Usage monitoring
- [ ] Abuse detection
- [ ] Automated tier upgrades

---

## 💡 Recommendations

### For MVP:
1. **Start Simple**
   - Free tier: 100 messages/month, 5 min sleep
   - Pro tier: Unlimited, 1 hour sleep
   - Auto-approval for signups

2. **Manual Vetting** (Optional)
   - Admin reviews suspicious signups
   - Can upgrade users manually
   - Can suspend/ban users

3. **Gradual Rollout**
   - Start with invite-only
   - Open to public after testing
   - Monitor usage and adjust limits

### For Production:
1. **Automated Vetting**
   - Email verification required
   - Fraud detection
   - Automated tier recommendations

2. **Flexible Limits**
   - Adjust limits based on usage
   - Offer trial periods
   - Usage-based pricing options

---

**Yes, we CAN control tiers and vetting!** ✅

The system is designed to be flexible - you can:
- ✅ Set different limits per tier
- ✅ Manually approve users
- ✅ Auto-approve with limits
- ✅ Invite-only access
- ✅ Monitor and adjust as needed
