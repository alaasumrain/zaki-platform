#!/bin/bash
# Quick Setup Script for Zaki Platform
# Run this to complete the setup

set -e

echo "🚀 Zaki Platform - Quick Setup"
echo "================================"
echo ""

# Check tsx
echo "1. Checking tsx..."
if command -v tsx &> /dev/null; then
    echo "   ✅ tsx is installed"
else
    echo "   ⚠️  tsx not found, installing..."
    npm install -g tsx || npm install --save-dev tsx
    echo "   ✅ tsx installed"
fi

# Check DATABASE_URL
echo ""
echo "2. Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "   ⚠️  DATABASE_URL not set"
    echo "   Please set it:"
    echo "   export DATABASE_URL='your-database-url'"
    echo ""
    read -p "   Enter DATABASE_URL (or press Enter to skip): " db_url
    if [ -n "$db_url" ]; then
        export DATABASE_URL="$db_url"
        echo "   ✅ DATABASE_URL set"
        # Add to .env if it exists
        if [ -f .env ]; then
            echo "DATABASE_URL=$db_url" >> .env
            echo "   ✅ Added to .env"
        fi
    else
        echo "   ⚠️  Skipped - usage tracking will be disabled"
    fi
else
    echo "   ✅ DATABASE_URL is set"
fi

# Check router directory
echo ""
echo "3. Checking router..."
if [ -f "router/index.js" ]; then
    echo "   ✅ Router found"
else
    echo "   ❌ Router not found!"
    exit 1
fi

# Check usage tracker
echo ""
echo "4. Checking usage tracker..."
if [ -f "router/usage-tracker.js" ]; then
    echo "   ✅ Usage tracker found"
else
    echo "   ⚠️  Usage tracker not found (will be created)"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start router: cd router && node index.js"
echo "2. Test in Telegram: Send a message"
echo "3. Check /usage: Should show stats"
echo ""
echo "For full guide, see: docs/ACTION_PLAN_NOW.md"
echo ""
