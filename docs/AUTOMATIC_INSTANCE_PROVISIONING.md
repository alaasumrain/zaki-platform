# Automatic User Instance Provisioning - Infrastructure Design

**Date:** 2026-02-09  
**Goal:** Zaki Platform automatically creates isolated OpenClaw instances for each user

---

## 🎯 Architecture

```
User Signs Up → Zaki Platform → Auto-Provision Instance
├── Create user account
├── Generate unique instance ID
├── Provision isolated OpenClaw gateway
├── Assign dedicated port
├── Create config directory
├── Create workspace
└── Start gateway service
```

---

## 🏗️ Infrastructure Components

### 1. Instance Manager Service

**Location:** `src/services/instance-manager.ts`

**Responsibilities:**
- Create new user instances
- Manage instance lifecycle (start/stop/restart)
- Assign ports dynamically
- Monitor instance health
- Clean up unused instances

### 2. Instance Provisioning

**Methods:**

**Option A: Ansible-based (Recommended)**
- Use Ansible playbook to create isolated user
- Most secure and robust
- Full systemd integration

**Option B: Docker-based**
- Create Docker container per user
- Most isolated
- Easy to scale

**Option C: Direct Setup (Current)**
- Create config directories manually
- Start processes directly
- Simplest, but less robust

---

## 📋 Implementation Plan

### Phase 1: Instance Manager Service

```typescript
// src/services/instance-manager.ts
export class InstanceManager {
  async createUserInstance(userId: string, userName: string): Promise<InstanceConfig> {
    // 1. Generate instance ID
    const instanceId = `user-${userId}`;
    
    // 2. Find available port
    const port = await this.findAvailablePort();
    
    // 3. Create directories
    await this.createDirectories(instanceId);
    
    // 4. Create config
    await this.createConfig(instanceId, port);
    
    // 5. Start gateway
    await this.startGateway(instanceId, port);
    
    return { instanceId, port, status: 'running' };
  }
  
  async findAvailablePort(): Promise<number> {
    // Start from 18790, find first available
    for (let port = 18790; port < 18800; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error('No available ports');
  }
}
```

### Phase 2: Integration with User Onboarding

```typescript
// src/onboarding.ts - Add instance creation
export async function completeOnboarding(
  env: Env,
  telegramUserId: string,
  state: OnboardingState
): Promise<void> {
  // ... existing onboarding code ...
  
  // Create isolated instance
  const instanceManager = new InstanceManager(env);
  const instance = await instanceManager.createUserInstance(
    telegramUserId,
    state.name || 'User'
  );
  
  // Save instance config to R2
  await env.UserStorage.put(
    `users/${telegramUserId}/instance.json`,
    JSON.stringify(instance)
  );
}
```

### Phase 3: Gateway Routing

```typescript
// src/handlers/telegram.ts - Route to user's instance
export async function handleTelegramMessage(env: Env, message: any) {
  const userId = String(message.from.id);
  
  // Get user's instance config
  const instanceConfig = await getInstanceConfig(env, userId);
  
  // Route to user's gateway
  const response = await fetch(
    `http://localhost:${instanceConfig.port}/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${instanceConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'default',
        messages: [...],
      }),
    }
  );
}
```

---

## 🖥️ Server Sizing Recommendations

### Current Usage Analysis

**Your Current Setup:**
- Main instance: Port 18789
- Landing page: Port 18790
- LobeChat: Port 19001 (Docker)
- OpenClaw Dashboard: Port 18791

**Per User Resource Needs:**
- OpenClaw Gateway: ~100-200 MB RAM
- Workspace: ~100 MB - 1 GB storage
- CPU: Minimal (mostly idle)
- Network: Low bandwidth

### Server Recommendations

#### Option 1: Cloud VDS M (Recommended for Start)
**€35.84/month (12-month term)**
- 4 Physical Cores (AMD EPYC 7282)
- 32 GB RAM
- 240 GB NVMe
- 500 Mbit/s Port

**Capacity:**
- ~150-200 concurrent users
- Good for MVP and early growth
- Can handle 50-100 active instances

**Why This:**
- Enough RAM for many instances
- Good CPU for parallel processing
- Affordable for starting out
- Can upgrade later

#### Option 2: Cloud VDS L (Better for Growth)
**€51.20/month (12-month term)**
- 6 Physical Cores
- 48 GB RAM
- 360 GB NVMe
- 750 Mbit/s Port

**Capacity:**
- ~300-400 concurrent users
- Good for scaling
- Can handle 100-200 active instances

#### Option 3: Cloud VDS XL (Production Ready)
**€65.92/month (12-month term)**
- 8 Physical Cores
- 64 GB RAM
- 480 GB NVMe
- 1 Gbit/s Port

**Capacity:**
- ~500+ concurrent users
- Production-grade
- Can handle 200-300 active instances

#### Option 4: Dedicated Server (Enterprise)
**€86.40/month (12-month term)**
- 12 Cores (AMD Ryzen 9 7900)
- 64 GB RAM
- 1 TB NVMe
- 1 Gbit/s Port

**When to Use:**
- 500+ users
- Need guaranteed performance
- Enterprise customers
- High availability requirements

---

## 💰 Cost Analysis

### Per User Cost (Estimated)

**Resource Usage:**
- RAM: ~150 MB per active instance
- Storage: ~500 MB per user (workspace + config)
- CPU: Minimal (mostly idle)
- Network: Low

**Monthly Cost per User:**
- VDS M: €35.84 / 150 users = **€0.24/user/month**
- VDS L: €51.20 / 300 users = **€0.17/user/month**
- VDS XL: €65.92 / 500 users = **€0.13/user/month**

### Pricing Strategy

**Your Pricing:**
- Free: 50 msgs/mo
- Starter: $19/mo (500 msgs)
- Pro: $39/mo (2000 msgs)

**Profit Margins:**
- VDS M: $19 - €0.24 = **$18.76 profit/user**
- VDS L: $19 - €0.17 = **$18.83 profit/user**
- VDS XL: $19 - €0.13 = **$18.87 profit/user**

**Break-even:**
- VDS M: 2 paying users/month
- VDS L: 3 paying users/month
- VDS XL: 4 paying users/month

---

## 🚀 Recommendation

### Start with: Cloud VDS M (€35.84/month)

**Why:**
1. **Affordable** - Low risk, can test the market
2. **Sufficient** - Handles 150-200 users easily
3. **Scalable** - Can upgrade when needed
4. **Good ROI** - Only need 2-3 paying users to break even

### Upgrade Path:
```
VDS M (€35.84) → VDS L (€51.20) → VDS XL (€65.92) → Dedicated (€86.40)
  150 users        300 users         500 users         1000+ users
```

### When to Upgrade:
- **VDS M → VDS L:** When you have 100+ active users
- **VDS L → VDS XL:** When you have 250+ active users
- **VDS XL → Dedicated:** When you have 400+ active users or need guaranteed performance

---

## 🔧 Implementation Steps

### Step 1: Create Instance Manager

```bash
# Create the service
touch /root/zaki-platform/src/services/instance-manager.ts
```

### Step 2: Integrate with Onboarding

Update `src/onboarding.ts` to create instances automatically.

### Step 3: Add Port Management

Create port allocation system to avoid conflicts.

### Step 4: Add Health Monitoring

Monitor instance health and auto-restart if needed.

### Step 5: Add Cleanup

Clean up unused instances after inactivity period.

---

## 📊 Monitoring & Management

### Metrics to Track:
- Active instances count
- Port usage
- Memory usage per instance
- CPU usage per instance
- Storage usage
- Instance uptime

### Alerts:
- Port exhaustion (no available ports)
- High memory usage (>80% total)
- Instance failures
- Storage running low

---

## ✅ Next Steps

1. **Choose server size** - Start with VDS M
2. **Implement Instance Manager** - Create the service
3. **Integrate with onboarding** - Auto-create on signup
4. **Test with cousin** - Use as first test user
5. **Monitor and optimize** - Track usage and adjust

---

**Status:** Ready to implement! Start with VDS M, scale as needed! 🚀
