#!/bin/bash
# Update Anthropic token in OpenClaw Gateway
# Works with both OAuth tokens and API keys

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <token-or-api-key>"
    echo ""
    echo "Examples:"
    echo "  $0 sk-ant-api03-...          # API key"
    echo "  $0 sk-ant-oat01-...          # OAuth token"
    echo ""
    echo "Or set environment variable:"
    echo "  export ANTHROPIC_API_KEY=sk-ant-..."
    echo "  $0"
    exit 1
fi

TOKEN="$1"

# Use env var if provided
if [ -n "$ANTHROPIC_API_KEY" ]; then
    TOKEN="$ANTHROPIC_API_KEY"
fi

echo "🔑 Updating Anthropic token..."
echo ""

AUTH_PROFILE="$HOME/.openclaw/agents/main/agent/auth-profiles.json"

# Backup
if [ -f "$AUTH_PROFILE" ]; then
    cp "$AUTH_PROFILE" "${AUTH_PROFILE}.backup.$(date +%s)"
    echo "✅ Backed up auth profile"
fi

# Update auth profile
node << EOFNODE
const fs = require('fs');
const path = require('path');

const authProfilePath = '$AUTH_PROFILE';
let authProfile = { version: 1, profiles: {}, lastGood: {} };

// Load existing
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
    token: '$TOKEN'
};

authProfile.lastGood = authProfile.lastGood || {};
authProfile.lastGood.anthropic = anthropicKey;

// Ensure directory exists
const dir = path.dirname(authProfilePath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(authProfilePath, JSON.stringify(authProfile, null, 2));
console.log('✅ Updated auth profile:', anthropicKey);
console.log('   Token:', '$TOKEN'.substring(0, 20) + '...');
EOFNODE

# Also set environment variable
export ANTHROPIC_API_KEY="$TOKEN"
if ! grep -q "ANTHROPIC_API_KEY" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "export ANTHROPIC_API_KEY=\"$TOKEN\"" >> ~/.bashrc
else
    sed -i "s|export ANTHROPIC_API_KEY=.*|export ANTHROPIC_API_KEY=\"$TOKEN\"|" ~/.bashrc
fi

echo ""
echo "🔄 Restarting gateway to pick up new token..."
systemctl --user restart openclaw-gateway
sleep 3

echo ""
echo "✅ Token updated and gateway restarted!"
echo ""
echo "🧪 Test:"
echo "  claude 'hello'"
echo "  # Then have Alaa send a message to the bot"
echo ""
echo "📝 If still getting 401:"
echo "  - Token might be expired (get new one: claude setup-token)"
echo "  - Or use API key instead of OAuth token"
