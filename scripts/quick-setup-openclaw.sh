#!/bin/bash
# Quick setup for OpenClaw with Anthropic API key
# Based on official OpenClaw documentation

set -e

echo "🚀 Quick OpenClaw Setup"
echo "======================"
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
    echo "⚠️  Warning: API key doesn't look right (should start with 'sk-ant-')"
fi

echo ""
echo "📝 Setting up OpenClaw..."
echo ""

# Create config directory if needed
mkdir -p ~/.clawdbot
mkdir -p ~/.clawdbot/workspace

# Check if config exists
CONFIG_FILE="$HOME/.clawdbot/clawdbot.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "📝 Creating initial config..."
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
fi

# Update config with API key (if not using env var)
# Note: Best practice is to use env var, but we can also set in config
echo "✅ Config ready at $CONFIG_FILE"
echo ""

# Check if gateway is already running
if pgrep -f "clawdbot gateway\|openclaw gateway" > /dev/null 2>&1; then
    echo "✅ Gateway is already running"
    echo "   PID: $(pgrep -f 'clawdbot gateway\|openclaw gateway')"
    echo ""
    echo "📝 To restart:"
    echo "   kill \$(pgrep -f 'clawdbot gateway\|openclaw gateway')"
    echo "   $0"
    exit 0
fi

# Determine command
if command -v clawdbot > /dev/null 2>&1; then
    CMD="clawdbot"
elif command -v openclaw > /dev/null 2>&1; then
    CMD="openclaw"
else
    echo "❌ Error: Neither 'clawdbot' nor 'openclaw' found"
    exit 1
fi

echo "🚀 Starting Gateway..."
echo "   Command: $CMD"
echo "   Port: 18789"
echo "   API Key: ${ANTHROPIC_API_KEY:0:10}... (hidden)"
echo ""

# Start gateway in background
nohup $CMD gateway --port 18789 --verbose --allow-unconfigured --bind lan > /tmp/openclaw-gateway.log 2>&1 &
GATEWAY_PID=$!

# Wait a moment for startup
sleep 2

# Check if it's running
if ps -p $GATEWAY_PID > /dev/null 2>&1; then
    echo "✅ Gateway started!"
    echo "   PID: $GATEWAY_PID"
    echo "   Logs: /tmp/openclaw-gateway.log"
    echo ""
    echo "🌐 Access:"
    echo "   Dashboard: http://localhost:18789/"
    echo "   Health: http://localhost:18789/health"
    echo ""
    echo "📝 Commands:"
    echo "   View logs: tail -f /tmp/openclaw-gateway.log"
    echo "   Stop: kill $GATEWAY_PID"
    echo "   Status: $CMD gateway status"
    echo ""
    
    # Test health endpoint
    echo "🧪 Testing health endpoint..."
    sleep 3
    if curl -s http://localhost:18789/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed (may need more time to start)"
        echo "   Check logs: tail -f /tmp/openclaw-gateway.log"
    fi
else
    echo "❌ Gateway failed to start"
    echo "   Check logs: tail -f /tmp/openclaw-gateway.log"
    exit 1
fi
