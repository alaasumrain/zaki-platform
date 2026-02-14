# Infrastructure Improvements from GitHub Projects

**Date:** 2026-02-09  
**Based on:** openclaw-ansible, clawhub, and openclaw main repo

---

## 🎯 Current Status

**✅ Working:**
- Express server (port 3000)
- Instance Manager (creates isolated instances)
- Auto instance creation on first message
- Cloudflare Tunnel (webhook)
- Telegram bot integration

**🔄 Just Fixed:**
- Gateway startup command (removed --config flag)

---

## 📦 Improvements from openclaw-ansible

### 1. Systemd Services for Auto-Start

**Current:** Instances start on-demand  
**Improvement:** Auto-start instances on boot

**Implementation:**
```bash
# Create systemd service template
/etc/systemd/system/clawdbot@.service

[Unit]
Description=OpenClaw Gateway for user %i
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/.clawdbot-%i
Environment="OPENCLAW_CONFIG_DIR=/root/.clawdbot-%i"
ExecStart=/usr/bin/clawdbot gateway --port %i --verbose --bind lan
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Usage:**
```bash
systemctl start clawdbot@18793  # Start instance on port 18793
systemctl enable clawdbot@18793 # Auto-start on boot
```

---

### 2. Security Hardening

**From ansible playbook:**
- UFW firewall rules
- Fail2ban for SSH
- Non-root user option
- Resource limits

**Implementation:**
```bash
# Firewall rules
ufw allow 3000/tcp  # Express server
ufw allow 18790:18999/tcp  # User instance ports
ufw enable

# Resource limits (systemd)
[Service]
MemoryLimit=512M
CPUQuota=50%
```

---

### 3. Docker Isolation (Optional)

**From openclaw docker-compose:**
- Run each instance in Docker container
- Better isolation
- Easy cleanup

**Implementation:**
```yaml
# docker-compose-user-{id}.yml
services:
  openclaw-gateway:
    image: openclaw:local
    ports:
      - "${PORT}:18789"
    volumes:
      - ${CONFIG_DIR}:/root/.openclaw
      - ${WORKSPACE_DIR}:/root/clawd
    environment:
      OPENCLAW_CONFIG_DIR: /root/.openclaw
    restart: unless-stopped
```

---

## 📦 Improvements from ClawHub

### 4. Auto-Install Skills

**Current:** Manual skill installation  
**Improvement:** Auto-install recommended skills on instance creation

**Implementation:**
```typescript
// In InstanceManager.createUserInstance()
if (options?.autoInstallSkills) {
  await this.installRecommendedSkills(workspaceDir);
}

private async installRecommendedSkills(workspaceDir: string) {
  const skills = ['git', 'github', 'self-improving-agent'];
  for (const skill of skills) {
    await execAsync(`cd ${workspaceDir} && clawhub sync ${skill}`);
  }
}
```

---

### 5. Skill Updates

**From clawhub:**
- Auto-update skills
- Check for updates
- Update all skills

**Implementation:**
```bash
# Cron job to update skills
0 2 * * * cd /root/clawd-user-* && clawhub sync --all
```

---

## 📦 Improvements from openclaw Main Repo

### 6. Better Config Management

**From openclaw config patterns:**
- Environment-based configs
- Config validation
- Config migration

**Implementation:**
```typescript
// Validate config before starting
private async validateConfig(configPath: string): Promise<boolean> {
  // Check required fields
  // Validate port availability
  // Check workspace exists
}
```

---

### 7. Health Monitoring

**From openclaw health endpoints:**
- Health check endpoints
- Status monitoring
- Auto-restart on failure

**Implementation:**
```typescript
// Add health endpoint per instance
app.get('/instances/:userId/health', async (req, res) => {
  const status = await instanceManager.getInstanceStatus(req.params.userId);
  res.json(status);
});
```

---

## 🗺️ Implementation Roadmap

### Phase 1: Critical Fixes (Now)
- ✅ Gateway startup fix
- ⏳ Test instance creation
- ⏳ Verify message routing

### Phase 2: Stability (Next)
- Systemd services for auto-start
- Health monitoring
- Auto-restart on failure

### Phase 3: Enhancements (Later)
- Docker isolation (optional)
- Security hardening
- Resource limits
- Auto skill installation

---

## ✅ Quick Wins

**Easy to implement:**
1. **Systemd services** - 30 min
2. **Health endpoints** - 15 min
3. **Auto skill install** - 20 min

**Medium effort:**
4. **Security hardening** - 1-2 hours
5. **Resource limits** - 1 hour

**Complex:**
6. **Docker isolation** - 2-3 hours
7. **Full monitoring** - 2-3 hours

---

**Status:** Infrastructure working! Ready to enhance! 🚀
