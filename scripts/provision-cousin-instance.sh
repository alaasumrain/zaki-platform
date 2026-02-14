#!/bin/bash
# Provision Cousin's Zaki Platform Instance on VM
# Creates separate OpenClaw gateway instance with own config and workspace

set -e

echo "🔧 Zaki Platform - Cousin Instance Provisioning (VM)"
echo "====================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if clawdbot/openclaw is installed
if ! command -v clawdbot > /dev/null 2>&1 && ! command -v openclaw > /dev/null 2>&1; then
    print_error "clawdbot or openclaw not found!"
    echo "   Install with: npm install -g clawdbot@2026.1.24-3"
    exit 1
fi

CMD="clawdbot"
if command -v openclaw > /dev/null 2>&1; then
    CMD="openclaw"
fi

# Get cousin's info
echo "📝 Enter cousin's information:"
read -p "Cousin's Telegram User ID: " TELEGRAM_ID
read -p "Cousin's name (optional): " COUSIN_NAME
read -p "Gateway port (default 18790): " GATEWAY_PORT
GATEWAY_PORT=${GATEWAY_PORT:-18790}

if [ -z "$TELEGRAM_ID" ]; then
    print_error "Telegram ID is required!"
    exit 1
fi

echo ""
print_info "Setting up instance for:"
echo "   Telegram ID: $TELEGRAM_ID"
echo "   Name: ${COUSIN_NAME:-Not provided}"
echo "   Gateway Port: $GATEWAY_PORT"
echo ""

# Check if port is available
if netstat -tlnp 2>/dev/null | grep -q ":$GATEWAY_PORT "; then
    print_warning "Port $GATEWAY_PORT is already in use!"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Create directories
print_info "Creating directories..."
mkdir -p ~/.clawdbot-cousin
mkdir -p /root/clawd-cousin/{memory,skills,workspace}

print_success "Directories created"

# Create config file
print_info "Creating config file..."
cat > ~/.clawdbot-cousin/clawdbot.json << EOF
{
  "agents": {
    "defaults": {
      "workspace": "/root/clawd-cousin",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": $GATEWAY_PORT,
    "mode": "local",
    "bind": "lan"
  }
}
EOF

print_success "Config file created: ~/.clawdbot-cousin/clawdbot.json"

# Create SOUL.md
print_info "Creating SOUL.md..."
cat > /root/clawd-cousin/SOUL.md << EOF
# Zaki - Personal AI Assistant

## Who You Are
You are **Zaki**, ${COUSIN_NAME:-"the user"}'s personal AI assistant.

## Your Style
Be helpful, friendly, and adapt to the user's needs.

## Core Principles
- Be genuinely helpful, not generic
- Remember context from previous conversations
- Be honest about your limitations
- Respect the user's time
EOF

# Create USER.md
print_info "Creating USER.md..."
cat > /root/clawd-cousin/USER.md << EOF
# About the User
- **Name:** ${COUSIN_NAME:-"User"}
- **Telegram ID:** $TELEGRAM_ID
- **Joined:** $(date +%Y-%m-%d)
EOF

print_success "Workspace files created"

# Create startup script
print_info "Creating startup script..."
cat > /root/zaki-platform/scripts/start-cousin-gateway.sh << 'SCRIPT_EOF'
#!/bin/bash
# Start Cousin's OpenClaw Gateway

set -e

GATEWAY_PORT="${GATEWAY_PORT:-18790}"
CONFIG_DIR="$HOME/.clawdbot-cousin"
LOG_FILE="/tmp/clawdbot-cousin-gateway.log"

# Check if already running
if pgrep -f "clawdbot gateway.*$GATEWAY_PORT\|openclaw gateway.*$GATEWAY_PORT" > /dev/null 2>&1; then
    echo "✅ Gateway already running on port $GATEWAY_PORT"
    exit 0
fi

# Determine command
if command -v clawdbot > /dev/null 2>&1; then
    CMD="clawdbot"
elif command -v openclaw > /dev/null 2>&1; then
    CMD="openclaw"
else
    echo "❌ Error: clawdbot or openclaw not found"
    exit 1
fi

echo "🚀 Starting cousin's gateway on port $GATEWAY_PORT..."
nohup $CMD gateway --config "$CONFIG_DIR/clawdbot.json" --port "$GATEWAY_PORT" --verbose --allow-unconfigured --bind lan > "$LOG_FILE" 2>&1 &
GATEWAY_PID=$!

echo "✅ Gateway started!"
echo "   PID: $GATEWAY_PID"
echo "   Port: $GATEWAY_PORT"
echo "   Logs: $LOG_FILE"
echo "   Config: $CONFIG_DIR/clawdbot.json"
SCRIPT_EOF

chmod +x /root/zaki-platform/scripts/start-cousin-gateway.sh
print_success "Startup script created"

# Create access document
ACCESS_DOC="/root/zaki-platform/docs/COUSIN_ACCESS_INFO.md"

cat > "$ACCESS_DOC" << EOF
# Cousin's Zaki Platform Instance

**Created:** $(date)  
**Telegram ID:** $TELEGRAM_ID  
**Name:** ${COUSIN_NAME:-Not provided}

---

## 🚀 Instance Details

- **Config Directory:** \`~/.clawdbot-cousin/\`
- **Workspace:** \`/root/clawd-cousin/\`
- **Gateway Port:** $GATEWAY_PORT
- **Gateway URL:** \`http://localhost:$GATEWAY_PORT\`

---

## 🔧 How to Start

\`\`\`bash
# Start the gateway
/root/zaki-platform/scripts/start-cousin-gateway.sh

# Or manually:
clawdbot gateway --config ~/.clawdbot-cousin/clawdbot.json --port $GATEWAY_PORT
\`\`\`

---

## ✅ Verify It's Running

\`\`\`bash
# Check process
ps aux | grep "clawdbot gateway.*$GATEWAY_PORT"

# Check port
netstat -tlnp | grep $GATEWAY_PORT

# Test health
curl http://localhost:$GATEWAY_PORT/health
\`\`\`

---

## 📊 Files Created

- Config: \`~/.clawdbot-cousin/clawdbot.json\`
- Workspace: \`/root/clawd-cousin/\`
- Startup script: \`/root/zaki-platform/scripts/start-cousin-gateway.sh\`
- Logs: \`/tmp/clawdbot-cousin-gateway.log\`

---

## 🆘 Troubleshooting

**Gateway won't start:**
- Check if port is in use: \`netstat -tlnp | grep $GATEWAY_PORT\`
- Check logs: \`tail -f /tmp/clawdbot-cousin-gateway.log\`
- Verify config: \`cat ~/.clawdbot-cousin/clawdbot.json\`

**Can't access gateway:**
- Check firewall: \`ufw status\`
- Test locally: \`curl http://localhost:$GATEWAY_PORT/health\`

---

**Status:** Ready to start! 🚀
EOF

print_success "Access document created: $ACCESS_DOC"
echo ""

print_success "Setup complete! 🎉"
echo ""
echo "📋 Summary:"
echo "   • Config: ~/.clawdbot-cousin/clawdbot.json"
echo "   • Workspace: /root/clawd-cousin/"
echo "   • Gateway Port: $GATEWAY_PORT"
echo "   • Startup Script: /root/zaki-platform/scripts/start-cousin-gateway.sh"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start the gateway:"
echo "      /root/zaki-platform/scripts/start-cousin-gateway.sh"
echo ""
echo "   2. Verify it's running:"
echo "      curl http://localhost:$GATEWAY_PORT/health"
echo ""
echo "   3. Configure Telegram bot to use this gateway (if needed)"
echo ""
