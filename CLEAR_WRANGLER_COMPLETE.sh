#!/bin/bash
# Complete Wrangler Token Cleanup Script

echo "🧹 Clearing ALL wrangler config and tokens..."

# 1. Remove all wrangler config directories
echo "Removing wrangler config directories..."
rm -rf ~/.wrangler/
rm -rf ~/.config/.wrangler/

# 2. Remove from shell config files
echo "Cleaning shell config files..."
if [ -f ~/.bashrc ]; then
    grep -v CLOUDFLARE ~/.bashrc > ~/.bashrc.tmp && mv ~/.bashrc.tmp ~/.bashrc
fi
if [ -f ~/.bash_profile ]; then
    grep -v CLOUDFLARE ~/.bash_profile > ~/.bash_profile.tmp && mv ~/.bash_profile.tmp ~/.bash_profile
fi
if [ -f ~/.profile ]; then
    grep -v CLOUDFLARE ~/.profile > ~/.profile.tmp && mv ~/.profile.tmp ~/.profile
fi

# 3. Unset any current env vars
echo "Unsetting environment variables..."
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID
unset CLOUDFLARE_EMAIL

# 4. Verify
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Verifying no Cloudflare vars..."
env | grep CLOUDFLARE || echo "✅ No Cloudflare env vars found"

echo ""
echo "📋 Next steps:"
echo "  1. Start new shell session (or run: source ~/.bashrc)"
echo "  2. Run: cd /root/zaki-platform"
echo "  3. Run: npx wrangler login"
