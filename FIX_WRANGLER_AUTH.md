# Fix Wrangler Authorization Error

**Date:** 2026-02-03  
**Error:** Invalid format for Authorization header [code: 6111]

---

## 🔍 The Problem

Wrangler has a bad/invalid API token stored. Need to clear it and login fresh.

---

## 🔧 Fix Steps

### Step 1: Clear Old Config
```bash
# Remove wrangler config
rm -rf ~/.wrangler/config/

# Or just remove the token file
rm ~/.wrangler/config/default.toml
```

### Step 2: Unset Environment Variables
```bash
# Unset any Cloudflare tokens
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID
```

### Step 3: Login Fresh
```bash
cd /root/zaki-platform
npx wrangler login
```

This will open browser for OAuth flow.

---

## 🚀 Quick Fix Commands

```bash
# 1. Clear old config
rm -rf ~/.wrangler/config/

# 2. Unset env vars
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID

# 3. Login fresh
cd /root/zaki-platform
npx wrangler login
```

---

## ✅ After Login

### Test
```bash
npx wrangler whoami
```

Should show your account info.

### Deploy
```bash
npx wrangler deploy
```

---

**Status:** Need to clear bad token and login fresh! 🔧
