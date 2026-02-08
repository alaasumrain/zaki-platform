#!/bin/bash
# Fix OpenClaw token issue
# This script helps update the Anthropic API token

set -e

echo "🔧 OpenClaw Token Fix"
echo "===================="
echo ""

# Check if API key is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <your-anthropic-api-key>"
    echo ""
    echo "Example:"
    echo "  $0 sk-ant-api03-..."
    echo ""
    echo "Or set environment variable:"
    echo "  export ANTHROPIC_API_KEY=sk-ant-api03-..."
    echo "  $0"
    exit 1
fi

API_KEY="$1"

# Validate key format
if [[ ! "$API_KEY" =~ ^sk-ant- ]]; then
    echo "⚠️  Warning: API key doesn't start with 'sk-ant-'"
    echo "   Are you sure this is correct?"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📝 Updating OpenClaw configuration..."
echo ""

# Update auth profile
AUTH_PROFILE="$HOME/.openclaw/agents/main/agent/auth-profiles.json"

if [ ! -f "$AUTH_PROFILE" ]; then
    echo "❌ Auth profile not found: $AUTH_PROFILE"
    echo "   Run 'openclaw onboard' first"
    exit 1
fi

# Backup original
cp "$AUTH_PROFILE" "${AUTH_PROFILE}.backup"
echo "✅ Backed up auth profile"

# Update token using node/jq or sed
node << EOFNODE
const fs = require('fs');
const authProfile = JSON.parse(fs.readFileSync('$AUTH_PROFILE', 'utf8'));

// Find anthropic profile
const anthropicProfile = Object.keys(authProfile.profiles || {}).find(
    key => key.startsWith('anthropic:')
);

if (anthropicProfile) {
    authProfile.profiles[anthropicProfile].token = '$API_KEY';
    authProfile.lastGood.anthropic = anthropicProfile;
    console.log('✅ Updated profile:', anthropicProfile);
} else {
    // Create new profile
    authProfile.profiles = authProfile.profiles || {};
    authProfile.profiles['anthropic:default'] = {
        type: 'token',
        provider: 'anthropic',
        token: '$API_KEY'
    };
    authProfile.lastGood = authProfile.lastGood || {};
    authProfile.lastGood.anthropic = 'anthropic:default';
    console.log('✅ Created new profile: anthropic:default');
}

fs.writeFileSync('$AUTH_PROFILE', JSON.stringify(authProfile, null, 2));
console.log('✅ Auth profile updated');
EOFNODE

# Also set environment variable
export ANTHROPIC_API_KEY="$API_KEY"
echo "" >> ~/.bashrc
echo "# Anthropic API Key for OpenClaw" >> ~/.bashrc
echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
echo "✅ Added to ~/.bashrc"

echo ""
echo "✅ Token updated!"
echo ""
echo "🔄 Restarting gateway..."
systemctl --user restart openclaw-gateway || echo "⚠️  Could not restart via systemd, restart manually:"
echo ""
echo "   systemctl --user restart openclaw-gateway"
echo ""
echo "Or restart manually:"
echo "   systemctl --user stop openclaw-gateway"
echo "   openclaw gateway --port 18789 --verbose"
echo ""
echo "🧪 Test after restart:"
echo "   claude 'hello'"
echo "   openclaw tui ws://127.0.0.1:18789"
