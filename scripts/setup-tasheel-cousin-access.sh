#!/bin/bash
# Setup script for granting cousin full access to Tasheel platform
# This script helps configure Telegram bot, GitHub, and Supabase access

set -e

echo "🚀 Tasheel Platform - Cousin Access Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration file
CONFIG_FILE="/root/zaki-platform/.tasheel-cousin-access.env"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\"\${input:-$default}\""
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to prompt for secret input
prompt_secret() {
    local prompt="$1"
    local var_name="$2"
    
    read -sp "$prompt: " input
    echo ""
    eval "$var_name=\"$input\""
}

# Check if config exists
if [ -f "$CONFIG_FILE" ]; then
    print_info "Found existing configuration file"
    read -p "Do you want to update it? (y/n): " update_config
    if [ "$update_config" != "y" ]; then
        print_info "Loading existing configuration..."
        source "$CONFIG_FILE"
    fi
fi

echo ""
print_info "Let's set up access for your cousin!"
echo ""

# Collect information
echo "📱 Telegram Bot Configuration"
echo "----------------------------"
prompt_input "Telegram Bot Token" "TELEGRAM_BOT_TOKEN"
prompt_input "Bot Username (e.g., @tasheel_bot)" "TELEGRAM_BOT_USERNAME"
prompt_input "Bot Name" "TELEGRAM_BOT_NAME" "TasheelBot"

echo ""
echo "🗄️  Supabase Configuration"
echo "------------------------"
prompt_input "Supabase Project URL" "SUPABASE_URL"
prompt_secret "Supabase Anon Key" "SUPABASE_ANON_KEY"
prompt_secret "Supabase Service Role Key (optional)" "SUPABASE_SERVICE_KEY"

echo ""
echo "🔗 Repository & Access"
echo "---------------------"
prompt_input "GitHub Repository URL" "GITHUB_REPO_URL"
prompt_input "Cousin's GitHub Username" "COUSIN_GITHUB_USERNAME"
prompt_input "Cousin's Email" "COUSIN_EMAIL"

echo ""
echo "🌐 Server Configuration"
echo "----------------------"
prompt_input "OpenClaw Dashboard URL" "OPENCLAW_DASHBOARD_URL" "http://62.171.148.105:18791"
prompt_input "OpenClaw Gateway URL" "OPENCLAW_GATEWAY_URL" "http://localhost:19001"

# Save configuration
echo ""
print_info "Saving configuration..."
cat > "$CONFIG_FILE" << EOF
# Tasheel Platform - Cousin Access Configuration
# Generated: $(date)

# Telegram Bot
TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
TELEGRAM_BOT_USERNAME="$TELEGRAM_BOT_USERNAME"
TELEGRAM_BOT_NAME="$TELEGRAM_BOT_NAME"

# Supabase
SUPABASE_URL="$SUPABASE_URL"
SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"

# GitHub
GITHUB_REPO_URL="$GITHUB_REPO_URL"
COUSIN_GITHUB_USERNAME="$COUSIN_GITHUB_USERNAME"
COUSIN_EMAIL="$COUSIN_EMAIL"

# OpenClaw
OPENCLAW_DASHBOARD_URL="$OPENCLAW_DASHBOARD_URL"
OPENCLAW_GATEWAY_URL="$OPENCLAW_GATEWAY_URL"
EOF

chmod 600 "$CONFIG_FILE"
print_success "Configuration saved to $CONFIG_FILE"

# Generate access document
echo ""
print_info "Generating access document for your cousin..."

ACCESS_DOC="/root/zaki-platform/docs/TASHEEL_COUSIN_ACCESS_CREDENTIALS.md"

cat > "$ACCESS_DOC" << EOF
# Tasheel Platform - Your Access Credentials

**Generated:** $(date)  
**For:** Cousin Access

---

## 🔐 Your Credentials

### Telegram Bot
- **Bot Token:** \`$TELEGRAM_BOT_TOKEN\`
- **Bot Username:** $TELEGRAM_BOT_USERNAME
- **Bot Name:** $TELEGRAM_BOT_NAME

**To configure:**
1. Go to OpenClaw Dashboard: $OPENCLAW_DASHBOARD_URL
2. Navigate to Settings → Channels
3. Add Telegram channel with the bot token above

---

### Supabase Access
- **Project URL:** $SUPABASE_URL
- **Anon Key:** \`$SUPABASE_ANON_KEY\`
- **Dashboard:** https://app.supabase.com/project/$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')

**Access Level:** Developer/Admin

**To access:**
1. Go to Supabase Dashboard
2. You should have received an email invitation
3. Log in with your email: $COUSIN_EMAIL

---

### GitHub Repository
- **Repository:** $GITHUB_REPO_URL
- **Your Username:** $COUSIN_GITHUB_USERNAME
- **Access Level:** Write/Admin

**To clone:**
\`\`\`bash
git clone $GITHUB_REPO_URL
cd tasheel-platform
\`\`\`

---

### OpenClaw Dashboard
- **Dashboard URL:** $OPENCLAW_DASHBOARD_URL
- **Gateway URL:** $OPENCLAW_GATEWAY_URL

**Features:**
- Gateway management
- Channel configuration
- Model settings
- Chat sessions

---

## 🚀 Quick Start

### 1. Clone Repository
\`\`\`bash
git clone $GITHUB_REPO_URL
cd tasheel-platform
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 3. Set Up Environment
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\`:
\`\`\`env
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
OPENCLAW_GATEWAY_URL=$OPENCLAW_GATEWAY_URL
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

---

## 📞 Need Help?

- Check the main documentation: \`docs/TASHEEL_COUSIN_ACCESS_SETUP.md\`
- Contact via Telegram
- Open GitHub Issues for bugs

---

**⚠️ Security Note:** Keep these credentials secure. Don't commit them to Git!

EOF

chmod 600 "$ACCESS_DOC"
print_success "Access document created: $ACCESS_DOC"

# Generate setup instructions
echo ""
print_info "Next steps:"
echo ""
echo "1. 📱 Telegram Bot:"
echo "   - Bot token: $TELEGRAM_BOT_TOKEN"
echo "   - Configure in OpenClaw Dashboard: $OPENCLAW_DASHBOARD_URL"
echo ""
echo "2. 🔗 GitHub:"
echo "   - Add $COUSIN_GITHUB_USERNAME as collaborator to: $GITHUB_REPO_URL"
echo "   - Grant 'Write' or 'Admin' access"
echo ""
echo "3. 🗄️  Supabase:"
echo "   - Go to: https://app.supabase.com"
echo "   - Invite $COUSIN_EMAIL to project"
echo "   - Grant 'Developer' or 'Admin' role"
echo ""
echo "4. 📄 Share access document:"
echo "   - File: $ACCESS_DOC"
echo "   - Send securely to your cousin"
echo ""
print_success "Setup complete! 🎉"
echo ""
print_warning "Remember to:"
echo "  - Add cousin to GitHub repository"
echo "  - Invite cousin to Supabase project"
echo "  - Share the access document securely"
echo ""
