#!/bin/bash
# Start OpenClaw Gateway on VM for Zaki Platform
# This is for local testing/development

set -e

echo "🦎 Starting OpenClaw Gateway for Zaki Platform"
echo "=============================================="

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set"
    echo "   Set it with: export ANTHROPIC_API_KEY=sk-ant-..."
    echo "   Or add to ~/.bashrc or ~/.profile"
fi

# Check if gateway is already running
if pgrep -f "clawdbot gateway\|openclaw gateway" > /dev/null 2>&1; then
    echo "✅ OpenClaw Gateway is already running"
    echo "   PID: $(pgrep -f 'clawdbot gateway\|openclaw gateway')"
    exit 0
fi

# Determine which command to use
if command -v clawdbot > /dev/null 2>&1; then
    CMD="clawdbot"
elif command -v openclaw > /dev/null 2>&1; then
    CMD="openclaw"
else
    echo "❌ Error: Neither 'clawdbot' nor 'openclaw' command found"
    echo "   Install with: npm install -g clawdbot@2026.1.24-3"
    exit 1
fi

# Start gateway
echo "🚀 Starting OpenClaw Gateway on port 18789..."
echo "   Command: $CMD"
echo "   Config: ~/.clawdbot/clawdbot.json"
echo "   Workspace: /root/clawd"
echo ""

# Start in background and log to file
nohup $CMD gateway --port 18789 --verbose --allow-unconfigured --bind lan > /tmp/openclaw-gateway.log 2>&1 &
GATEWAY_PID=$!

echo "✅ OpenClaw Gateway started!"
echo "   PID: $GATEWAY_PID"
echo "   Logs: /tmp/openclaw-gateway.log"
echo ""
echo "📝 To view logs: tail -f /tmp/openclaw-gateway.log"
echo "📝 To stop: kill $GATEWAY_PID"
echo ""
echo "🌐 Gateway will be available at: http://localhost:18789"
echo "   (or http://$(hostname -I | awk '{print $1}'):18789 from other machines)"
