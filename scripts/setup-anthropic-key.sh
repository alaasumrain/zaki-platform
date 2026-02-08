#!/bin/bash
# Setup Anthropic API Key for Clawbot/OpenClaw

set -e

echo "🔑 Anthropic API Key Setup"
echo "=========================="
echo ""

# Check if key is provided as argument
if [ -z "$1" ]; then
    echo "Usage: $0 <your-anthropic-api-key>"
    echo ""
    echo "Example:"
    echo "  $0 sk-ant-api03-..."
    echo ""
    echo "Or set manually:"
    echo "  export ANTHROPIC_API_KEY=sk-ant-..."
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

# Set in current session
export ANTHROPIC_API_KEY="$API_KEY"

# Add to ~/.bashrc for persistence
if ! grep -q "ANTHROPIC_API_KEY" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Anthropic API Key for Clawbot/OpenClaw" >> ~/.bashrc
    echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
    echo "✅ Added to ~/.bashrc"
else
    # Update existing entry
    sed -i "s|export ANTHROPIC_API_KEY=.*|export ANTHROPIC_API_KEY=\"$API_KEY\"|" ~/.bashrc
    echo "✅ Updated ~/.bashrc"
fi

# Also add to ~/.profile for non-interactive shells
if ! grep -q "ANTHROPIC_API_KEY" ~/.profile 2>/dev/null; then
    echo "" >> ~/.profile
    echo "# Anthropic API Key for Clawbot/OpenClaw" >> ~/.profile
    echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.profile
fi

echo ""
echo "✅ API Key configured!"
echo ""
echo "📝 Current session: ANTHROPIC_API_KEY is set"
echo "📝 Persistent: Added to ~/.bashrc and ~/.profile"
echo ""
echo "🚀 Next steps:"
echo "   1. Start Gateway: bash /root/zaki-platform/scripts/start-openclaw-vm.sh"
echo "   2. Test: curl http://localhost:18789/health"
echo ""
