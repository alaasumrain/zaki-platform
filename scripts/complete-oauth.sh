#!/bin/bash
# Complete OAuth flow and fix 401 error
# Run this after you get the callback URL

set -e

export PATH="$HOME/.local/bin:$PATH"

echo "🔐 Completing OAuth Flow"
echo "========================"
echo ""
echo "Step 1: Run this command:"
echo "   claude setup-token"
echo ""
echo "Step 2: When prompted, paste this callback URL:"
echo "   http://localhost:39043/callback?code=stTaVhJs61EaJGQBfI3mwbUZCnmKB5zwwNpTRqIX8Oo0Dsib&state=YVKlpRKqRKJD1sFMKnkvlvEcx0ApM_uw6LIXgaCdyro"
echo ""
echo "Step 3: After it completes, run this script again with --restart flag"
echo "   bash $0 --restart"
echo ""

if [ "$1" = "--restart" ]; then
    echo "🔄 Restarting gateway..."
    systemctl --user restart openclaw-gateway
    sleep 4
    
    echo ""
    echo "✅ Gateway restarted!"
    echo ""
    echo "🧪 Test: Have Alaa send a message to the bot"
    echo ""
    echo "📝 If still 401, check token:"
    echo "   cat ~/.openclaw/agents/main/agent/auth-profiles.json | jq -r '.profiles.\"anthropic:alaa\".token'"
fi
