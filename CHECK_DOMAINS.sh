#!/bin/bash
# Domain Availability Checker
# Run this to check all domain options

echo "🔍 Checking Domain Availability..."
echo ""

domains=(
    "getzaki.com"
    "zaki.io"
    "zaki.dev"
    "zaki.app"
    "zaki.cloud"
    "zaki.tech"
    "zakiplatform.com"
    "zaki-platform.com"
    "zakiplatform.io"
    "zakiplatform.dev"
    "zakiplatform.app"
)

for domain in "${domains[@]}"; do
    echo "Checking: $domain"
    result=$(whois "$domain" 2>&1 | grep -iE "status|available|registered|domain name|no match|not found" | head -3)
    
    if echo "$result" | grep -qiE "available|no match|not found|free"; then
        echo "  ✅ AVAILABLE"
    elif echo "$result" | grep -qiE "registered|status.*active"; then
        echo "  ❌ TAKEN"
    else
        echo "  ⚠️  UNCLEAR - Check manually"
    fi
    echo ""
done

echo "💡 Tip: Also check at:"
echo "  - https://www.namecheap.com/domains/"
echo "  - https://www.godaddy.com/"
echo "  - https://domains.google/"
