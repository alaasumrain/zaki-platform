#!/bin/bash
# Quick setup for Claude (Anthropic) API with OpenClaw

set -e

echo "🦞 Setting up Claude (Anthropic) API"
echo "===================================="
echo ""

# Check if API key is provided
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$1" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set"
    echo ""
    echo "Usage:"
    echo "  export ANTHROPIC_API_KEY=sk-ant-..."
    echo "  $0"
    echo ""
    echo "Or:"
    echo "  $0 sk-ant-your-key-here"
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
    echo "   Expected format: sk-ant-api03-..."
fi

echo ""
echo "📝 Configuring OpenClaw to use Claude..."
echo ""

# Ensure config directory exists
mkdir -p ~/.clawdbot
mkdir -p ~/.clawdbot/workspace

CONFIG_FILE="$HOME/.clawdbot/clawdbot.json"

# Create or update config
if [ ! -f "$CONFIG_FILE" ]; then
    echo "📝 Creating new config..."
    cat > "$CONFIG_FILE" << 'EOF'
{
  "agents": {
    "defaults": {
      "workspace": "~/.clawdbot/workspace",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan"
  }
}
EOF
else
    echo "✅ Using existing config at $CONFIG_FILE"
fi

# Add API key to bashrc for persistence
if ! grep -q "ANTHROPIC_API_KEY" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Anthropic API Key for OpenClaw" >> ~/.bashrc
    echo "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"" >> ~/.bashrc
    echo "✅ Added API key to ~/.bashrc"
else
    sed -i "s|export ANTHROPIC_API_KEY=.*|export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"|" ~/.bashrc
    echo "✅ Updated API key in ~/.bashrc"
fi

echo ""
echo "✅ Claude (Anthropic) API configured!"
echo ""
echo "📝 API Key: ${ANTHROPIC_API_KEY:0:15}... (hidden)"
echo "📝 Config: $CONFIG_FILE"
echo ""
echo "🚀 Next steps:"
echo "   1. Start Gateway: openclaw gateway --port 18789 --verbose"
echo "   2. Or use wizard: openclaw onboard"
echo "   3. Test: curl http://localhost:18789/health"
echo ""
echo "💡 Note: OpenClaw reads ANTHROPIC_API_KEY from environment automatically!"
