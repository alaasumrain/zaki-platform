# Zaki Platform - Critical Research Questions

**Date:** 2026-02-03  
**Purpose:** Comprehensive list of questions we need to answer before building

---

## 🎯 Interface Decision: LobeChat vs Custom

### Questions About LobeChat

#### 1. **What is LobeChat?**
- [ ] What does it do exactly?
- [ ] Is it open source?
- [ ] What's the license?
- [ ] Can we modify it?
- [ ] Does it support multi-channel (Telegram, WhatsApp)?

#### 2. **Architecture Fit**
- [ ] How does LobeChat connect to backends?
- [ ] Does it work with WebSocket APIs?
- [ ] Can it connect to our Workers API?
- [ ] Does it support multi-tenant (many users)?
- [ ] How does it handle authentication?

#### 3. **Features We Need**
- [ ] Does it have Telegram integration?
- [ ] Does it have WhatsApp integration?
- [ ] Does it have Discord integration?
- [ ] Can we add custom channels?
- [ ] Does it support file uploads/media?
- [ ] Does it have user management?

#### 4. **Technical Fit**
- [ ] What's it built with? (React? Vue? Next.js?)
- [ ] Can we deploy it on Cloudflare Pages?
- [ ] Does it need a backend server?
- [ ] How does it handle real-time updates?
- [ ] Can we customize the UI?

#### 5. **Integration with Zaki**
- [ ] Can it connect to OpenClaw Gateway?
- [ ] Can it work with our Sandbox architecture?
- [ ] How would user isolation work?
- [ ] Can we add Zaki-specific features?

---

## 🏗️ Architecture Questions

### Cloudflare Sandboxes

#### 1. **Cost & Limits (CRITICAL)**
- [ ] What's the cost per Sandbox?
- [ ] Are there free tiers?
- [ ] What's the pricing model? (per hour? per request?)
- [ ] What are the resource limits? (CPU, memory, storage)
- [ ] How many Sandboxes can we run simultaneously?
- [ ] Are there rate limits?

#### 2. **Scaling**
- [ ] How do Sandboxes scale?
- [ ] Can we auto-scale based on demand?
- [ ] What happens when a Sandbox is idle?
- [ ] Can Sandboxes sleep/wake on demand?
- [ ] How fast is Sandbox startup?

#### 3. **Persistence**
- [ ] How does R2 mounting work?
- [ ] What's the performance of R2 mounts?
- [ ] Can multiple Sandboxes share R2?
- [ ] What's the cost of R2 storage?
- [ ] How fast is R2 read/write?

#### 4. **Isolation**
- [ ] Are Sandboxes truly isolated?
- [ ] Can one Sandbox access another's data?
- [ ] How secure is the isolation?
- [ ] Can Sandboxes communicate with each other?

---

## 🔌 Integration Questions

### OpenClaw Gateway

#### 1. **Connection**
- [ ] How do we connect LobeChat to OpenClaw Gateway?
- [ ] Does Gateway support WebSocket?
- [ ] Can we proxy through Workers API?
- [ ] What's the Gateway protocol?

#### 2. **Multi-Tenancy**
- [ ] How does Gateway handle multiple users?
- [ ] Can one Gateway serve multiple users?
- [ ] Or do we need one Gateway per Sandbox? (we think yes)

#### 3. **Channels**
- [ ] How does Gateway handle Telegram?
- [ ] How does Gateway handle WhatsApp?
- [ ] Can we add custom channels?
- [ ] How does channel routing work?

---

## 💰 Business Model Questions

### Pricing & Tiers

#### 1. **Cost Structure**
- [ ] What does it cost to run one user's Sandbox?
- [ ] What's the break-even point?
- [ ] How do we price subscriptions?
- [ ] What tiers make sense? (Free, Pro, Enterprise?)

#### 2. **Resource Limits**
- [ ] What limits per tier?
- [ ] Sandbox uptime limits?
- [ ] Message limits?
- [ ] Storage limits?
- [ ] API call limits?

#### 3. **Monetization**
- [ ] Free tier with limits?
- [ ] Pay-per-use?
- [ ] Subscription model?
- [ ] Enterprise pricing?

---

## 🚀 Technical Questions

### Deployment

#### 1. **Workers**
- [ ] Can Workers handle WebSocket connections?
- [ ] How do we handle long-lived connections?
- [ ] What are Workers limits?
- [ ] How do we scale Workers?

#### 2. **Sandboxes**
- [ ] How do we deploy Sandbox containers?
- [ ] Can we use custom Docker images?
- [ ] How do we update Sandbox images?
- [ ] What's the deployment process?

#### 3. **Frontend**
- [ ] Where do we host LobeChat?
- [ ] Cloudflare Pages?
- [ ] Separate hosting?
- [ ] How does it connect to Workers API?

---

## 🔐 Security Questions

### Authentication & Authorization

#### 1. **User Auth**
- [ ] How do users sign up?
- [ ] Email/password?
- [ ] OAuth (Google, GitHub)?
- [ ] Magic links?
- [ ] How do we store user credentials?

#### 2. **API Security**
- [ ] How do we authenticate API requests?
- [ ] JWT tokens?
- [ ] API keys?
- [ ] How do we prevent abuse?

#### 3. **Sandbox Security**
- [ ] How secure are Sandboxes?
- [ ] Can users escape Sandbox?
- [ ] Can users access other users' data?
- [ ] How do we prevent resource abuse?

---

## 📱 Channel Questions

### Multi-Channel Support

#### 1. **Telegram**
- [ ] How does LobeChat handle Telegram?
- [ ] Do we need Telegram bot?
- [ ] Can users connect their own Telegram?
- [ ] How does pairing work?

#### 2. **WhatsApp**
- [ ] How does LobeChat handle WhatsApp?
- [ ] Do we need WhatsApp Business API?
- [ ] Can users connect personal WhatsApp?
- [ ] How does QR login work?

#### 3. **Discord**
- [ ] How does LobeChat handle Discord?
- [ ] Do we create Discord bots?
- [ ] Can users add bot to their servers?

#### 4. **Web Interface**
- [ ] Does LobeChat have web UI?
- [ ] Can users chat in browser?
- [ ] How does it work with Sandboxes?

---

## 🎨 UX Questions

### User Experience

#### 1. **Onboarding**
- [ ] How do users get started?
- [ ] What's the first-time experience?
- [ ] How do we explain Sandboxes?
- [ ] How do we make it simple?

#### 2. **Interface**
- [ ] What does the UI look like?
- [ ] Is LobeChat's UI good enough?
- [ ] What customizations do we need?
- [ ] How do we show "your AI assistant"?

#### 3. **Features**
- [ ] What features do users expect?
- [ ] File uploads?
- [ ] Voice messages?
- [ ] Image generation?
- [ ] Code execution?

---

## 🔄 Workflow Questions

### User Journey

#### 1. **Sign Up**
- [ ] How do users sign up?
- [ ] What info do we collect?
- [ ] Email verification?
- [ ] Payment setup?

#### 2. **First Use**
- [ ] What happens after signup?
- [ ] Sandbox creation?
- [ ] Onboarding wizard?
- [ ] First message?

#### 3. **Daily Use**
- [ ] How do users access Zaki?
- [ ] Web interface?
- [ ] Telegram?
- [ ] WhatsApp?
- [ ] All of the above?

#### 4. **Management**
- [ ] How do users manage settings?
- [ ] How do they see usage?
- [ ] How do they upgrade?
- [ ] How do they cancel?

---

## 📊 Research Priorities

### Must Answer (Before Building)

1. **Sandbox Cost & Limits** 🔴 CRITICAL
   - Can we afford to run Sandboxes?
   - What are the limits?
   - How do we scale?

2. **LobeChat Fit** 🟡 IMPORTANT
   - Does it work for our use case?
   - Can we integrate it?
   - Is it worth using?

3. **Gateway Protocol** 🟡 IMPORTANT
   - How do we connect to OpenClaw?
   - WebSocket? HTTP? Both?
   - What's the API?

### Should Answer (Before Launch)

4. **Pricing Model** 🟢 NICE TO HAVE
   - How do we price?
   - What tiers?
   - Free tier limits?

5. **Security Model** 🟢 NICE TO HAVE
   - How secure is isolation?
   - How do we prevent abuse?
   - What are the risks?

---

## 🎯 Next Research Steps

### Immediate (This Week)

1. **Research LobeChat**
   - [ ] Clone repo, read docs
   - [ ] Understand architecture
   - [ ] Test locally
   - [ ] Evaluate fit

2. **Research Sandbox Costs**
   - [ ] Check Cloudflare pricing
   - [ ] Calculate per-user cost
   - [ ] Understand limits
   - [ ] Plan pricing model

3. **Research Gateway Protocol**
   - [ ] Read OpenClaw Gateway docs
   - [ ] Understand WebSocket protocol
   - [ ] Test connection
   - [ ] Plan integration

### Short-term (This Month)

4. **Build Prototype**
   - [ ] Deploy Workers + Sandbox
   - [ ] Test single user
   - [ ] Test multi-user
   - [ ] Measure performance

5. **Evaluate LobeChat**
   - [ ] Build integration prototype
   - [ ] Test with OpenClaw
   - [ ] Evaluate UX
   - [ ] Decide: use or build custom

---

## 💡 Strategic Questions

### Big Picture

1. **Should we use LobeChat?**
   - Pros: Saves time, proven UI, open source
   - Cons: May not fit perfectly, adds dependency
   - Decision: Research first, then decide

2. **Should we build custom UI?**
   - Pros: Perfect fit, full control
   - Cons: More time, more code to maintain
   - Decision: Only if LobeChat doesn't fit

3. **What's our MVP?**
   - Web interface only?
   - Telegram only?
   - Multi-channel from day one?
   - Decision: Start simple, add channels

4. **What's our timeline?**
   - When do we want to launch?
   - What's the minimum viable product?
   - What can we defer?
   - Decision: Define MVP, then timeline

---

## 📝 Research Output Format

For each research item, document:

1. **What we learned**
2. **How it affects Zaki**
3. **Decision/Recommendation**
4. **Next steps**

---

## 🎯 Bottom Line

**We need to answer these questions before building:**

1. ✅ Can we afford Sandboxes? (Cost research)
2. ✅ Does LobeChat fit? (Architecture research)
3. ✅ How do we connect everything? (Integration research)
4. ✅ What's our MVP? (Product research)

**Let's research systematically and make informed decisions!**
