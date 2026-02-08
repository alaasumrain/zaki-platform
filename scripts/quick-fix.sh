#!/bin/bash
# Quick Fix Script - Fixes common OpenClaw issues immediately
# Usage: bash quick-fix.sh [issue-type]

set -e

export PATH="$HOME/.local/bin:$PATH"

ISSUE="${1:-all}"

echo "🔧 Quick Fix - OpenClaw Troubleshooting"
echo "========================================"
echo ""

fix_auth() {
    echo "🔑 Fixing Auth Issues..."
    
    # Check if Claude CLI works
    if claude 'test' 2>&1 | grep -q -i "error\|invalid\|login"; then
        echo "❌ Claude CLI token invalid"
        echo "   Run: claude setup-token"
        echo "   Or set: export ANTHROPIC_API_KEY=sk-ant-..."
        return 1
    fi
    
    echo "✅ Claude CLI works"
    
    # Get token from CLI (if available)
    # Restart gateway to pick up any changes
    echo "🔄 Restarting gateway..."
    systemctl --user restart openclaw-gateway 2>/dev/null || pkill -f "openclaw gateway" 2>/dev/null || true
    sleep 3
    
    echo "✅ Gateway restarted"
    return 0
}

fix_gateway() {
    echo "🌐 Fixing Gateway Issues..."
    
    # Check if running
    if ! pgrep -f "openclaw gateway" > /dev/null 2>&1; then
        echo "❌ Gateway not running - starting..."
        systemctl --user start openclaw-gateway 2>/dev/null || {
            nohup openclaw gateway --port 18789 --verbose --allow-unconfigured --bind lan > /tmp/openclaw-gateway.log 2>&1 &
            sleep 3
        }
    fi
    
    # Check health
    if curl -s http://localhost:18789/health > /dev/null 2>&1; then
        echo "✅ Gateway health OK"
    else
        echo "⚠️  Gateway health check failed"
        echo "   Check logs: tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
    fi
}

fix_telegram() {
    echo "📱 Fixing Telegram Issues..."
    
    # Check if configured
    if [ -f ~/.openclaw/openclaw.json ]; then
        if grep -q "telegram" ~/.openclaw/openclaw.json; then
            echo "✅ Telegram configured"
        else
            echo "⚠️  Telegram not configured"
        fi
    fi
    
    # Restart to pick up changes
    systemctl --user restart openclaw-gateway 2>/dev/null || true
    sleep 2
}

diagnose() {
    echo "🔍 Quick Diagnosis:"
    echo ""
    
    # Gateway
    if pgrep -f "openclaw gateway" > /dev/null 2>&1; then
        echo "✅ Gateway: Running"
    else
        echo "❌ Gateway: Not running"
    fi
    
    # Health
    if curl -s http://localhost:18789/health > /dev/null 2>&1; then
        echo "✅ Health: OK"
    else
        echo "❌ Health: Failed"
    fi
    
    # Claude CLI
    if claude 'test' 2>&1 | grep -q -i "error\|invalid"; then
        echo "❌ Claude CLI: Token invalid"
    else
        echo "✅ Claude CLI: Working"
    fi
    
    # Telegram
    if [ -f ~/.openclaw/openclaw.json ] && grep -q "telegram" ~/.openclaw/openclaw.json; then
        echo "✅ Telegram: Configured"
    else
        echo "⚠️  Telegram: Not configured"
    fi
    
    echo ""
}

case "$ISSUE" in
    auth)
        fix_auth
        ;;
    gateway)
        fix_gateway
        ;;
    telegram)
        fix_telegram
        ;;
    diagnose|status)
        diagnose
        ;;
    all|*)
        diagnose
        echo ""
        fix_auth
        echo ""
        fix_gateway
        echo ""
        fix_telegram
        ;;
esac

echo ""
echo "✅ Quick fix complete!"
echo ""
echo "🧪 Test:"
echo "  claude 'hello'"
echo "  openclaw health"
echo "  # Send message to Telegram bot"
