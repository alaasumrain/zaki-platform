#!/bin/bash
# Zaki Platform VM Setup Script
# Run this on your new VM: bash <(curl -s https://raw.githubusercontent.com/alaasumrain/zaki-platform/master/scripts/vm-setup.sh)
# Or: curl -s https://raw.githubusercontent.com/alaasumrain/zaki-platform/master/scripts/vm-setup.sh | bash

set -e

echo "🚀 Zaki Platform VM Setup"
echo "========================="
echo ""

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
apt install -y \
    git \
    curl \
    wget \
    build-essential \
    nodejs \
    npm \
    python3 \
    python3-pip \
    openssh-server \
    sshpass

# Install Node.js 18+ if not already installed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm

# Clone repository
echo "📦 Cloning Zaki Platform repository..."
cd /root
if [ -d "zaki-platform" ]; then
    echo "Repository already exists, pulling latest..."
    cd zaki-platform
    git pull
else
    git clone https://github.com/alaasumrain/zaki-platform.git
    cd zaki-platform
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create .env.local file
echo "📝 Creating .env.local file..."
cat > .env.local << 'EOF'
# Cloudflare Workers Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Anthropic API Key (for OpenClaw)
ANTHROPIC_API_KEY=your_anthropic_key_here

# AI Gateway Configuration (optional)
AI_GATEWAY_BASE_URL=https://gateway.ai.cloudflare.com
AI_GATEWAY_API_KEY=your_gateway_key_here

# Cloudflare Access (for admin UI)
CF_ACCESS_TEAM_DOMAIN=your_team_domain_here
CF_ACCESS_AUD=your_aud_here

# Gateway Token (for secure access)
GATEWAY_TOKEN=$(openssl rand -hex 32)

# Development Mode
DEV_MODE=false
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local with your actual API keys"
echo "2. Set up Cloudflare Workers: npm run deploy"
echo "3. Install OpenClaw: see docs/OPENCLAW_SETUP.md"
echo ""
echo "🔑 Environment file created at: /root/zaki-platform/.env.local"
echo "📚 Documentation: /root/zaki-platform/README.md"
