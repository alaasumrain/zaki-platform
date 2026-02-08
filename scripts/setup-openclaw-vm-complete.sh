#!/bin/bash
# Complete OpenClaw setup on VM for Zaki Platform development
# This ensures OpenClaw is properly configured and working

set -e

echo "🦞 Complete OpenClaw Setup for Zaki Platform"
echo "============================================"
echo ""

# Check if API key is provided
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$1" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set"
    echo ""
    echo "Usage:"
    echo "  export ANTHROPIC_API_KEY=sk-ant-api03-..."
    echo "  $0"
    echo ""
    echo "Or:"
    echo "  $0 sk-ant-api03-your-key-here"
    echo ""
    echo "Or get OAuth token:"
    echo "  claude setup-token"
    echo ""
    exit 1
fi

# Set API key if provided as argument
if [ -n "$1" ]; then
    export ANTHROPIC_API_KEY="$1"
    echo "✅ API key set from argument"
fi

# Verify API key format
if [[ ! "$ANTHROPIC_API_KEY" =~ ^sk-ant- ]]; then
    echo "⚠️  Warning: API key format looks incorrect"
    echo "   Expected: sk-ant-api03-... or sk-ant-oat01-..."
fi

echo ""
echo "📝 Step 1: Ensuring OpenClaw is installed..."
which openclaw > /dev/null || which clawdbot > /dev/null || {
    echo "❌ OpenClaw not found. Install with:"
    echo "   npm install -g openclaw@latest"
    exit 1
}

echo "✅ OpenClaw found: $(which openclaw 2>/dev/null || which clawdbot)"

echo ""
echo "📝 Step 2: Creating config directory..."
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/agents/main/agent
mkdir -p ~/.openclaw/workspace
mkdir -p ~/.openclaw/credentials

echo "✅ Directories created"

echo ""
echo "📝 Step 3: Updating auth profile..."

AUTH_PROFILE="$HOME/.openclaw/agents/main/agent/auth-profiles.json"

# Create or update auth profile
node << EOFNODE
const fs = require('fs');
const path = require('path');

const authProfilePath = '$AUTH_PROFILE';
let authProfile = { version: 1, profiles: {}, lastGood: {} };

// Load existing if exists
if (fs.existsSync(authProfilePath)) {
    try {
        authProfile = JSON.parse(fs.readFileSync(authProfilePath, 'utf8'));
    } catch (e) {
        console.log('Creating new auth profile');
    }
}

// Find or create anthropic profile
const anthropicKey = Object.keys(authProfile.profiles || {}).find(
    key => key.startsWith('anthropic:')
) || 'anthropic:default';

authProfile.profiles = authProfile.profiles || {};
authProfile.profiles[anthropicKey] = {
    type: 'token',
    provider: 'anthropic',
    token: process.env.ANTHROPIC_API_KEY || '$ANTHROPIC_API_KEY'
};

authProfile.lastGood = authProfile.lastGood || {};
authProfile.lastGood.anthropic = anthropicKey;

// Ensure directory exists
const dir = path.dirname(authProfilePath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(authProfilePath, JSON.stringify(authProfile, null, 2));
console.log('✅ Auth profile updated:', anthropicKey);
EOFNODE

echo ""
echo "📝 Step 4: Setting up basic config..."

CONFIG_FILE="$HOME/.openclaw/openclaw.json"

if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << 'EOFCONFIG'
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "6042c55f93e34ec0eb98cbb0803cbae0c3e19e7573a90222"
    }
  }
}
EOFCONFIG
    echo "✅ Config created"
else
    echo "✅ Config already exists"
fi

echo ""
echo "📝 Step 5: Adding API key to environment..."

# Add to bashrc
if ! grep -q "ANTHROPIC_API_KEY" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Anthropic API Key for OpenClaw" >> ~/.bashrc
    echo "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"" >> ~/.bashrc
    echo "✅ Added to ~/.bashrc"
else
    sed -i "s|export ANTHROPIC_API_KEY=.*|export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"|" ~/.bashrc
    echo "✅ Updated ~/.bashrc"
fi

# Also add to profile
if ! grep -q "ANTHROPIC_API_KEY" ~/.profile 2>/dev/null; then
    echo "" >> ~/.profile
    echo "# Anthropic API Key for OpenClaw" >> ~/.profile
    echo "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"" >> ~/.profile
fi

echo ""
echo "📝 Step 6: Restarting gateway..."

# Stop existing gateway
systemctl --user stop openclaw-gateway 2>/dev/null || pkill -f "openclaw gateway" 2>/dev/null || true
sleep 2

# Start gateway
systemctl --user start openclaw-gateway 2>/dev/null || {
    echo "⚠️  Could not start via systemd, starting manually..."
    nohup openclaw gateway --port 18789 --verbose --allow-unconfigured --bind lan > /tmp/openclaw-gateway.log 2>&1 &
    sleep 3
}

echo ""
echo "📝 Step 7: Testing setup..."

sleep 2

# Test gateway
if curl -s http://localhost:18789/health > /dev/null 2>&1; then
    echo "✅ Gateway health check passed"
else
    echo "⚠️  Gateway health check failed (may need more time)"
fi

# Test Claude CLI
export ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
if claude 'hello' 2>&1 | grep -q -i "error\|invalid\|login"; then
    echo "⚠️  Claude CLI test failed - token may still be invalid"
    echo "   Check: claude 'hello'"
else
    echo "✅ Claude CLI test passed"
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Summary:"
echo "  - Config: $CONFIG_FILE"
echo "  - Auth: $AUTH_PROFILE"
echo "  - Workspace: ~/.openclaw/workspace"
echo "  - Gateway: http://localhost:18789"
echo ""
echo "🧪 Test Commands:"
echo "  claude 'hello'"
echo "  openclaw gateway status"
echo "  openclaw health"
echo "  openclaw tui ws://127.0.0.1:18789"
echo ""
echo "📝 Logs:"
echo "  tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
echo "  journalctl --user -u openclaw-gateway -f"
