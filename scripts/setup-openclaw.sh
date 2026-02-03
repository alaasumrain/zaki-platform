#!/bin/bash
# OpenClaw Installation Script for VM
# This installs OpenClaw on the VM (for testing/development)

set -e

echo "🦎 OpenClaw Installation"
echo "========================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from zaki-platform directory"
    exit 1
fi

# Install OpenClaw dependencies
echo "📦 Installing OpenClaw dependencies..."
npm install -g @openclaw/gateway || {
    echo "📦 Installing from source..."
    cd /tmp
    git clone https://github.com/openclaw/openclaw.git || echo "Repo may already exist"
    cd openclaw
    npm install
    npm link
}

# Create OpenClaw config directory
echo "📁 Creating OpenClaw config directory..."
mkdir -p ~/.openclaw

# Create default config
echo "📝 Creating default OpenClaw config..."
cat > ~/.openclaw/openclaw.json << 'EOF'
{
  "persona": {
    "name": "Zaki",
    "description": "Helpful AI assistant",
    "instructions": "You are Zaki, a helpful AI assistant.",
    "model": "claude-3-5-sonnet-20241022"
  },
  "skills": [],
  "tools": {
    "enabled": true,
    "list": ["browser", "terminal", "files"]
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0"
  }
}
EOF

echo ""
echo "✅ OpenClaw installed!"
echo ""
echo "🚀 To start OpenClaw Gateway:"
echo "   openclaw-gateway start"
echo ""
echo "📝 Config location: ~/.openclaw/openclaw.json"
