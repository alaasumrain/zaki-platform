# OpenClaw VM Infrastructure - Research Findings

**Date:** 2026-02-09  
**Source:** GitHub search for OpenClaw infrastructure

---

## 🎯 Key Findings

Found comprehensive infrastructure for creating isolated VM instances with OpenClaw!

---

## 📦 Repository: `openclaw/openclaw-ansible`

**URL:** https://github.com/openclaw/openclaw-ansible  
**Description:** Automated, hardened Clawdbot installation with Tailscale VPN, UFW firewall, and Docker isolation  
**Last Updated:** 2026-02-09

### Features

✅ **Automated Installation**
- One-command install: `curl -fsSL https://raw.githubusercontent.com/pasogott/clawdbot-ansible/main/install.sh | bash`
- Ansible playbook for complete setup
- Supports Debian, Ubuntu, macOS

✅ **Docker Isolation**
- Docker CE + Compose V2
- Isolated containers
- Separate volumes per instance

✅ **Security**
- UFW firewall (Linux) / Application Firewall (macOS)
- Fail2ban for SSH protection
- Tailscale VPN for secure access
- Non-root user (`clawdbot`)
- Systemd hardening

✅ **Multi-Instance Support**
- Separate config directories
- Separate workspaces
- Different ports per instance
- Systemd services per instance

### Installation Modes

**Release Mode (Default):**
```bash
curl -fsSL https://raw.githubusercontent.com/pasogott/clawdbot-ansible/main/install.sh | bash
```

**Development Mode:**
```bash
git clone https://github.com/pasogott/clawdbot-ansible.git
cd clawdbot-ansible
ansible-playbook playbook.yml --ask-become-pass -e clawdbot_install_mode=development
```

### What Gets Installed

- Tailscale (mesh VPN)
- UFW firewall (SSH + Tailscale ports only)
- Docker CE + Compose V2
- Node.js 22.x + pnpm
- Clawdbot on host (not containerized)
- Systemd service (auto-start)

### Post-Install

```bash
# Switch to clawdbot user
sudo su - clawdbot

# Run onboarding
clawdbot onboard --install-daemon
```

---

## 🐳 Docker Setup from Main OpenClaw Repo

**URL:** https://github.com/openclaw/openclaw  
**Files Found:**
- `docker-compose.yml` - Multi-service setup
- `docker-setup.sh` - Setup script
- `Dockerfile` - Container image
- `Dockerfile.sandbox` - Sandbox container

### Docker Compose Structure

```yaml
services:
  openclaw-gateway:
    image: openclaw:local
    ports:
      - "${OPENCLAW_GATEWAY_PORT:-18789}:18789"
      - "${OPENCLAW_BRIDGE_PORT:-18790}:18790"
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
```

### Environment Variables

- `OPENCLAW_GATEWAY_PORT` - Gateway port (default: 18789)
- `OPENCLAW_BRIDGE_PORT` - Bridge port (default: 18790)
- `OPENCLAW_CONFIG_DIR` - Config directory
- `OPENCLAW_WORKSPACE_DIR` - Workspace directory
- `OPENCLAW_GATEWAY_TOKEN` - Auth token (auto-generated)

---

## 🔧 How to Create Isolated Instances

### Method 1: Using Ansible (Recommended)

**For Cousin's Instance:**

```bash
# 1. Clone ansible repo
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 2. Create separate user for cousin
ansible-playbook playbook.yml --ask-become-pass \
  -e clawdbot_user=cousin \
  -e clawdbot_home=/home/cousin

# 3. Switch to cousin user
sudo su - cousin

# 4. Configure
clawdbot onboard --install-daemon
```

### Method 2: Using Docker Compose

**Create separate docker-compose file:**

```yaml
# docker-compose-cousin.yml
services:
  openclaw-gateway-cousin:
    image: openclaw:local
    ports:
      - "18790:18789"  # Different port
    volumes:
      - ~/.clawdbot-cousin:/home/node/.openclaw
      - /root/clawd-cousin:/home/node/.openclaw/workspace
    environment:
      OPENCLAW_GATEWAY_PORT: 18789
      OPENCLAW_GATEWAY_TOKEN: ${COUSIN_GATEWAY_TOKEN}
```

**Run:**
```bash
OPENCLAW_CONFIG_DIR=~/.clawdbot-cousin \
OPENCLAW_WORKSPACE_DIR=/root/clawd-cousin \
OPENCLAW_GATEWAY_PORT=18790 \
docker compose -f docker-compose-cousin.yml up -d
```

### Method 3: Manual Setup (What We Already Have)

Our `provision-cousin-instance.sh` script does this:
- Creates separate config directory
- Creates separate workspace
- Uses different port
- Creates startup script

---

## 📋 Key Infrastructure Patterns

### 1. Separate Config Directories

```
~/.clawdbot/          # Main instance
~/.clawdbot-cousin/   # Cousin's instance
~/.clawdbot-user2/    # User 2 instance
```

### 2. Separate Workspaces

```
/root/clawd/          # Main instance
/root/clawd-cousin/   # Cousin's instance
/root/clawd-user2/    # User 2 instance
```

### 3. Different Ports

```
18789  # Main instance
18790  # Cousin's instance
18791  # User 2 instance
```

### 4. Systemd Services

```bash
# Each instance can have its own service
systemctl start clawdbot@cousin
systemctl start clawdbot@user2
```

---

## 🔍 Other Useful Repos Found

1. **`justlovemaki/OpenClaw-Docker-CN-IM`**
   - Docker version with Chinese IM platforms
   - Pre-configured plugins

2. **`ibelick/webclaw`**
   - Fast web client for OpenClaw
   - Could be useful for LobeChat integration

3. **`openclaw/clawhub`**
   - Skill directory
   - Marketplace for skills

4. **`cloudflare/moltworker`**
   - Cloudflare Workers version
   - (Not relevant for VM setup)

---

## 🚀 Recommended Approach for Cousin's Instance

### Option A: Use Ansible (Most Robust)

```bash
# Install ansible
sudo apt install ansible

# Clone repo
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# Create cousin user and install
ansible-playbook playbook.yml --ask-become-pass \
  -e clawdbot_user=cousin \
  -e clawdbot_home=/home/cousin \
  -e "clawdbot_ssh_keys=['ssh-key-here']"
```

### Option B: Use Our Script (Simpler)

```bash
cd /root/zaki-platform
./scripts/provision-cousin-instance.sh
```

### Option C: Docker Compose (Most Isolated)

```bash
# Use docker-compose with separate configs
OPENCLAW_CONFIG_DIR=~/.clawdbot-cousin \
OPENCLAW_WORKSPACE_DIR=/root/clawd-cousin \
OPENCLAW_GATEWAY_PORT=18790 \
docker compose -f docker-compose-cousin.yml up -d
```

---

## 📚 Documentation Links

- **Ansible Installer:** https://github.com/openclaw/openclaw-ansible
- **Main OpenClaw Repo:** https://github.com/openclaw/openclaw
- **Docker Setup:** See `docker-setup.sh` in main repo
- **Configuration Guide:** `docs/configuration.md` in ansible repo

---

## ✅ Next Steps

1. **Review Ansible playbook** - Understand what it does
2. **Choose approach** - Ansible, Docker, or our script
3. **Set up cousin's instance** - Use chosen method
4. **Configure LobeChat** - Point to cousin's gateway port
5. **Test isolation** - Verify instances don't interfere

---

**Status:** Infrastructure found! Ready to implement isolated instances! 🚀
