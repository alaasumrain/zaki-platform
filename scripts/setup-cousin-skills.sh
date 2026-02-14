#!/bin/bash
# Setup Skills for Cousin's Instance
# Installs useful skills from ClawHub for Tasheel development

set -e

echo "🔧 Setting Up Skills for Cousin's Instance"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

# Get cousin's Telegram ID
read -p "Cousin's Telegram User ID: " TELEGRAM_ID

if [ -z "$TELEGRAM_ID" ]; then
    echo "❌ Telegram ID required!"
    exit 1
fi

INSTANCE_ID="user-${TELEGRAM_ID}"
WORKSPACE_DIR="/root/clawd-${INSTANCE_ID}"
SKILLS_DIR="${WORKSPACE_DIR}/skills"

echo ""
print_info "Setting up skills for instance: $INSTANCE_ID"
print_info "Workspace: $WORKSPACE_DIR"
echo ""

# Create skills directory
mkdir -p "$SKILLS_DIR"

# Recommended skills for Tasheel development
print_info "Recommended skills for cousin (Tasheel development):"
echo ""
echo "1. **Git Operations** - Commit, push, pull, branch management"
echo "2. **Code Review** - Review code for bugs and improvements"
echo "3. **Error Fixer** - Automatically fix common errors"
echo "4. **TypeScript Helper** - TypeScript-specific fixes and improvements"
echo "5. **Next.js Helper** - Next.js-specific development tools"
echo "6. **Supabase Helper** - Database queries and operations"
echo "7. **Vercel Deploy** - Deployment automation"
echo "8. **File Manager** - File operations and navigation"
echo "9. **Code Generator** - Generate boilerplate code"
echo "10. **Test Writer** - Write tests for code"
echo ""

# Check if clawhub CLI is available
if command -v clawhub > /dev/null 2>&1; then
    print_info "ClawHub CLI found! You can install skills with:"
    echo "   clawhub sync <skill-name>"
    echo ""
    echo "To browse available skills:"
    echo "   Visit: https://clawhub.ai"
    echo "   Or use: clawhub search <keyword>"
else
    print_info "ClawHub CLI not found. Skills can be installed manually:"
    echo ""
    echo "1. Browse skills at: https://clawhub.ai"
    echo "2. Download skill files to: $SKILLS_DIR"
    echo "3. Each skill needs a SKILL.md file"
    echo ""
fi

# Create a skills index file
print_info "Creating skills index..."
cat > "$SKILLS_DIR/README.md" << 'EOF'
# Skills Directory

This directory contains skills for the Tasheel development instance.

## Recommended Skills

### Development Skills
- **git-operations** - Git commit, push, pull, branch management
- **code-review** - Automated code review
- **error-fixer** - Fix common coding errors
- **typescript-helper** - TypeScript development tools
- **nextjs-helper** - Next.js specific tools
- **supabase-helper** - Database operations
- **vercel-deploy** - Deployment automation

### Utility Skills
- **file-manager** - File operations
- **code-generator** - Generate boilerplate
- **test-writer** - Write tests

## Installing Skills

### Via ClawHub CLI
```bash
clawhub sync <skill-name>
```

### Manually
1. Browse https://clawhub.ai
2. Find skill you want
3. Download SKILL.md and supporting files
4. Place in this directory

## Using Skills

Skills are automatically available to the instance. Just mention what you need:
- "Use git to commit these changes"
- "Review this code for bugs"
- "Fix the TypeScript errors"
EOF

print_success "Skills directory set up at: $SKILLS_DIR"
echo ""
print_info "Next steps:"
echo "1. Browse skills at: https://clawhub.ai"
echo "2. Install skills you want using ClawHub CLI or manually"
echo "3. Skills will be available to cousin's instance automatically"
echo ""
