#!/bin/bash
# Setup Cousin's Instance with Tasheel Platform Access
# Creates isolated instance with repo access and auto-fix capabilities

set -e

echo "🔧 Setting Up Cousin's Tasheel Instance"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Get cousin's info
echo "📝 Enter cousin's information:"
read -p "Cousin's Telegram User ID: " TELEGRAM_ID
read -p "Cousin's name: " COUSIN_NAME
read -p "Gateway port (default 18790): " GATEWAY_PORT
GATEWAY_PORT=${GATEWAY_PORT:-18790}

if [ -z "$TELEGRAM_ID" ]; then
    print_error "Telegram ID is required!"
    exit 1
fi

INSTANCE_ID="user-${TELEGRAM_ID}"
CONFIG_DIR="/root/.clawdbot-${INSTANCE_ID}"
WORKSPACE_DIR="/root/clawd-${INSTANCE_ID}"

echo ""
print_info "Setting up instance:"
echo "   Telegram ID: $TELEGRAM_ID"
echo "   Name: ${COUSIN_NAME:-Not provided}"
echo "   Instance ID: $INSTANCE_ID"
echo "   Port: $GATEWAY_PORT"
echo ""

# Check if port is available
if netstat -tlnp 2>/dev/null | grep -q ":$GATEWAY_PORT "; then
    print_warning "Port $GATEWAY_PORT is already in use!"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Create directories
print_info "Creating directories..."
mkdir -p "$CONFIG_DIR"
mkdir -p "$WORKSPACE_DIR"/{memory,skills,workspace,tasheel}

print_success "Directories created"

# Clone Tasheel repo into instance workspace
print_info "Setting up Tasheel repository access..."

TASHEEL_REPO_DIR="$WORKSPACE_DIR/tasheel-platform"

if [ ! -d "$TASHEEL_REPO_DIR" ]; then
    print_info "Cloning Tasheel repository..."
    cd "$WORKSPACE_DIR"
    
    # Check if we have GitHub access
    if gh auth status >/dev/null 2>&1; then
        gh repo clone alaasumrain/tasheel-platform tasheel-platform
        print_success "Tasheel repo cloned"
    else
        print_warning "GitHub CLI not authenticated. You'll need to clone manually:"
        echo "   cd $WORKSPACE_DIR"
        echo "   git clone https://github.com/alaasumrain/tasheel-platform.git"
    fi
else
    print_info "Tasheel repo already exists, updating..."
    cd "$TASHEEL_REPO_DIR"
    git pull || print_warning "Could not update repo"
fi

# Create config file
print_info "Creating OpenClaw config..."
cat > "$CONFIG_DIR/clawdbot.json" << EOF
{
  "agents": {
    "defaults": {
      "workspace": "$WORKSPACE_DIR",
      "model": {
        "primary": "anthropic/claude-opus-4-5"
      }
    }
  },
  "gateway": {
    "port": $GATEWAY_PORT,
    "mode": "local",
    "bind": "lan",
    "auth": {
      "token": "$(openssl rand -hex 32 2>/dev/null || python3 -c 'import secrets; print(secrets.token_hex(32))')"
    }
  }
}
EOF

print_success "Config created"

# Create enhanced SOUL.md with Tasheel context
print_info "Creating SOUL.md with Tasheel context..."
cat > "$WORKSPACE_DIR/SOUL.md" << EOF
# Zaki - Tasheel Platform Assistant

## Who You Are
You are **Zaki**, ${COUSIN_NAME:-"the developer"}'s AI assistant for the **Tasheel Platform** project.

## Your Role
You help develop, debug, and deploy the Tasheel Platform. You can:
- Read and understand code
- Fix bugs and errors
- Write new features
- Deploy to Vercel
- Explain code and architecture

## Tasheel Platform Context
- **Repository:** Located at \`workspace/tasheel-platform/\`
- **Tech Stack:** Next.js, Material UI, Tailwind CSS, Supabase
- **Deployment:** Vercel
- **Purpose:** Palestinian government-services concierge platform

## Your Capabilities
1. **Error Diagnosis:** When cousin reports an error, investigate the codebase
2. **Auto-Fix:** Fix bugs automatically and explain what was wrong
3. **Code Review:** Review code for issues before deployment
4. **Deployment:** Push fixes to GitHub and deploy to Vercel
5. **Documentation:** Update docs when making changes

## Workflow
When cousin reports an error:
1. Understand the error description
2. Search the codebase for related code
3. Identify the root cause
4. Fix the issue
5. Test the fix (if possible)
6. Commit and push to GitHub
7. Deploy to Vercel (if configured)
8. Report back what was fixed

## Git Access
- You have access to the Tasheel repository
- Always commit with clear messages
- Push to main branch (or create PR if needed)
- Include error description in commit message

## Deployment
- Vercel auto-deploys from GitHub main branch
- After pushing, Vercel will automatically deploy
- Monitor deployment status if needed

## Core Principles
- Be thorough in debugging
- Explain what you're fixing and why
- Test changes when possible
- Keep commits clean and descriptive
- Always verify fixes work
EOF

print_success "SOUL.md created"

# Create USER.md
print_info "Creating USER.md..."
cat > "$WORKSPACE_DIR/USER.md" << EOF
# About the User
- **Name:** ${COUSIN_NAME:-"Developer"}
- **Telegram ID:** $TELEGRAM_ID
- **Role:** Tasheel Platform Developer
- **Joined:** $(date +%Y-%m-%d)
- **Project:** Tasheel Platform
- **Repository:** workspace/tasheel-platform/
EOF

# Create TOOLS.md with Tasheel-specific tools
print_info "Creating TOOLS.md..."
cat > "$WORKSPACE_DIR/TOOLS.md" << EOF
# Available Tools for Tasheel Development

## Code Management
- **git** - Version control, commit, push
- **npm/pnpm** - Package management
- **vercel** - Deployment (if CLI installed)

## File Operations
- Read/write files in tasheel-platform/
- Create new components
- Update configurations
- Modify code

## Error Fixing Workflow
1. Read error message/description
2. Search codebase for related files
3. Identify problematic code
4. Fix the issue
5. Test locally (if possible)
6. Commit: "Fix: [error description]"
7. Push to GitHub
8. Vercel auto-deploys

## Common Tasks
- Fix TypeScript errors
- Fix build errors
- Update dependencies
- Fix UI bugs
- Fix API issues
- Update Supabase queries
EOF

# Create AGENTS.md
print_info "Creating AGENTS.md..."
cat > "$WORKSPACE_DIR/AGENTS.md" << EOF
# Agent Instructions

You are Zaki, an AI assistant helping develop the Tasheel Platform.

When the user reports an error:
1. Ask clarifying questions if needed
2. Navigate to the tasheel-platform directory
3. Search for the problematic code
4. Identify the issue
5. Fix it
6. Commit with message: "Fix: [error description]"
7. Push to origin main
8. Confirm fix and deployment

Always be helpful, thorough, and explain what you're doing.
EOF

# Create startup script
print_info "Creating startup script..."
cat > "/root/zaki-platform/scripts/start-cousin-gateway.sh" << 'SCRIPT_EOF'
#!/bin/bash
# Start Cousin's OpenClaw Gateway

set -e

INSTANCE_ID="user-TELEGRAM_ID_PLACEHOLDER"
GATEWAY_PORT="GATEWAY_PORT_PLACEHOLDER"
CONFIG_DIR="/root/.clawdbot-${INSTANCE_ID}"
LOG_FILE="/tmp/clawdbot-${INSTANCE_ID}-gateway.log"

# Check if already running
if pgrep -f "clawdbot gateway.*$GATEWAY_PORT\|openclaw gateway.*$GATEWAY_PORT" > /dev/null 2>&1; then
    echo "✅ Gateway already running on port $GATEWAY_PORT"
    exit 0
fi

# Determine command
if command -v clawdbot > /dev/null 2>&1; then
    CMD="clawdbot"
elif command -v openclaw > /dev/null 2>&1; then
    CMD="openclaw"
else
    echo "❌ Error: clawdbot or openclaw not found"
    exit 1
fi

echo "🚀 Starting gateway on port $GATEWAY_PORT..."
nohup $CMD gateway --config "$CONFIG_DIR/clawdbot.json" --port "$GATEWAY_PORT" --verbose --allow-unconfigured --bind lan > "$LOG_FILE" 2>&1 &
GATEWAY_PID=$!

echo "✅ Gateway started!"
echo "   PID: $GATEWAY_PID"
echo "   Port: $GATEWAY_PORT"
echo "   Logs: $LOG_FILE"
SCRIPT_EOF

# Replace placeholders in startup script
sed -i "s/TELEGRAM_ID_PLACEHOLDER/$TELEGRAM_ID/g" "/root/zaki-platform/scripts/start-cousin-gateway.sh"
sed -i "s/GATEWAY_PORT_PLACEHOLDER/$GATEWAY_PORT/g" "/root/zaki-platform/scripts/start-cousin-gateway.sh"
chmod +x "/root/zaki-platform/scripts/start-cousin-gateway.sh"

print_success "Startup script created"

# Create access document
ACCESS_DOC="/root/zaki-platform/docs/COUSIN_TASHEEL_ACCESS.md"

cat > "$ACCESS_DOC" << EOF
# Cousin's Tasheel Instance - Access Guide

**Created:** $(date)  
**Telegram ID:** $TELEGRAM_ID  
**Name:** ${COUSIN_NAME:-Not provided}

---

## 🚀 Your Instance

- **Instance ID:** $INSTANCE_ID
- **Gateway Port:** $GATEWAY_PORT
- **Gateway URL:** \`http://localhost:$GATEWAY_PORT\`
- **Config:** \`$CONFIG_DIR\`
- **Workspace:** \`$WORKSPACE_DIR\`

---

## 📱 How to Use

### 1. Access via Telegram Bot

**Option A: Use Main Bot (Recommended)**
- The Zaki Platform server will route your messages to your instance
- Just send messages to the bot normally
- Your instance handles them automatically

**Option B: Direct Gateway Access**
- Your gateway runs on port $GATEWAY_PORT
- Can be accessed directly if needed

### 2. Report Errors

Just tell the bot about errors:
\`\`\`
"There's an error in the login page, it's not redirecting"
\`\`\`

The instance will:
1. Understand the error
2. Search the codebase
3. Find and fix the issue
4. Commit and push to GitHub
5. Vercel auto-deploys
6. Report back what was fixed

### 3. Ask for Features

\`\`\`
"Add a dark mode toggle to the settings page"
\`\`\`

The instance will:
1. Understand the request
2. Find relevant files
3. Implement the feature
4. Test and commit
5. Deploy

---

## 🔧 Repository Access

**Tasheel Repo Location:**
\`$WORKSPACE_DIR/tasheel-platform/\`

**GitHub:**
- Repository: \`alaasumrain/tasheel-platform\`
- You have write access (via instance)
- Changes auto-push to main branch
- Vercel auto-deploys

---

## 🚀 Starting Your Instance

\`\`\`bash
# Start the gateway
/root/zaki-platform/scripts/start-cousin-gateway.sh

# Or manually:
clawdbot gateway --config $CONFIG_DIR/clawdbot.json --port $GATEWAY_PORT
\`\`\`

---

## ✅ Verify It's Running

\`\`\`bash
# Check process
ps aux | grep "clawdbot gateway.*$GATEWAY_PORT"

# Check port
netstat -tlnp | grep $GATEWAY_PORT

# Test health
curl http://localhost:$GATEWAY_PORT/health
\`\`\`

---

## 📝 Example Interactions

**Report Error:**
> "The quote form is showing an error when submitting"

**Instance will:**
1. Check \`tasheel-platform/src/app/actions/submit-quote-request.ts\`
2. Find the bug
3. Fix it
4. Commit: "Fix: quote form submission error"
5. Push to GitHub
6. Vercel deploys
7. Report: "Fixed the validation issue in submit-quote-request.ts"

**Request Feature:**
> "Add Arabic language support"

**Instance will:**
1. Check current i18n setup
2. Add Arabic translations
3. Update language switcher
4. Commit and deploy

---

## 🔐 Access Details

- **Telegram Bot:** Use main Zaki bot (your messages route to your instance)
- **GitHub:** Changes pushed automatically
- **Vercel:** Auto-deploys from GitHub
- **Supabase:** Access via environment variables in repo

---

**Status:** Ready to use! Just message the bot and start coding! 🚀
EOF

print_success "Access document created: $ACCESS_DOC"

# Summary
echo ""
print_success "Setup complete! 🎉"
echo ""
echo "📋 Summary:"
echo "   • Instance ID: $INSTANCE_ID"
echo "   • Port: $GATEWAY_PORT"
echo "   • Config: $CONFIG_DIR"
echo "   • Workspace: $WORKSPACE_DIR"
echo "   • Tasheel Repo: $TASHEEL_REPO_DIR"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start the gateway:"
echo "      /root/zaki-platform/scripts/start-cousin-gateway.sh"
echo ""
echo "   2. Start Zaki Platform server (if not running):"
echo "      cd /root/zaki-platform && npm run dev"
echo ""
echo "   3. Have cousin send /start to Telegram bot"
echo ""
echo "   4. Cousin can now report errors and instance will fix them!"
echo ""
