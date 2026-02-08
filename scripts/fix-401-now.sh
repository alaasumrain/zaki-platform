#!/bin/bash
# IMMEDIATE FIX for 401 errors
# Usage: bash fix-401-now.sh <api-key-or-token>

set -e

export PATH="$HOME/.local/bin:$PATH"

if [ -z "$1" ]; then
    echo "⚡ IMMEDIATE 401 FIX"
    echo "==================="
    echo ""
    echo "Usage: $0 <anthropic-api-key-or-token>"
    echo ""
    echo "Example:"
    echo "  $0 sk-ant-api03-your-key-here"
    echo ""
    echo "Or get OAuth token first:"
    echo "  claude setup-token"
    echo "  # Then run this script with the token"
    echo ""
    exit 1
fi

TOKEN="$1"

echo "⚡ FIXING 401 ERROR NOW..."
echo ""

# Update auth profile immediately
AUTH_PROFILE="$HOME/.openclaw/agents/main/agent/auth-profiles.json"

node << EOFNODE
const fs = require('fs');
const path = require('path');

const authProfilePath = '$AUTH_PROFILE';
let authProfile = { version: 1, profiles: {}, lastGood: {} };

if (fs.existsSync(authProfilePath)) {
    try {
        authProfile = JSON.parse(fs.readFileSync(authProfilePath, 'utf8'));
    } catch (e) {
        console.log('Creating new profile');
    }
}

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

const dir = path.dirname(authProfilePath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(authProfilePath, JSON.stringify(authProfile, null, 2));
console.log('✅ Token updated:', anthropicKey);
EOFNODE

# Restart gateway immediately
echo "🔄 Restarting gateway..."
systemctl --user restart openclaw-gateway
sleep 4

# Verify
echo ""
echo "✅ FIXED! Testing..."
if curl -s http://localhost:18789/health > /dev/null 2>&1; then
    echo "✅ Gateway health OK"
else
    echo "⚠️  Gateway still starting (wait 5 more seconds)"
fi

echo ""
echo "🧪 TEST NOW:"
echo "  Have Alaa send a message to the bot"
echo ""
echo "If still 401, the token might be invalid - try a different one"
