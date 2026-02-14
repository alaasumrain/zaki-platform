# Next Steps - Complete Integration

**Date:** 2026-02-09  
**Status:** Ready to Deploy

---

## ✅ What's Done

1. ✅ **Usage Tracking System** - Complete
2. ✅ **Cost Calculation** - Complete
3. ✅ **OpenClaw Integration** - Aligned
4. ✅ **Router Integration** - Code added
5. ✅ **Documentation** - Complete

---

## 🚀 What to Do Now

### Step 1: Install Dependencies (if needed)

The router needs to load TypeScript modules. You have two options:

**Option A: Use tsx (Recommended)**
```bash
npm install -g tsx
# or
npm install --save-dev tsx
```

**Option B: Compile TypeScript First**
```bash
cd /root/zaki-platform
npm run build
# Then router can use dist/ files
```

### Step 2: Set Environment Variable

Make sure `DATABASE_URL` is set:

```bash
export DATABASE_URL="your-neon-database-url"
# Or add to .env file
```

### Step 3: Test the Integration

1. **Send a message** to your Telegram bot
2. **Check logs** - You should see:
   ```
   [Usage] Recorded: User 123, 100 input + 50 output tokens, $0.000150
   ```
3. **Check database**:
   ```sql
   SELECT * FROM usage ORDER BY date DESC LIMIT 10;
   ```
4. **Test /usage command**:
   - Send `/usage` in Telegram
   - Should show your usage stats

---

## 🔍 Verification Checklist

- [ ] Router is running
- [ ] DATABASE_URL is set
- [ ] TypeScript modules can load (tsx or compiled)
- [ ] Send test message
- [ ] Check logs for usage recording
- [ ] Check database for usage records
- [ ] Test `/usage` command
- [ ] Verify costs are calculated

---

## 🐛 Troubleshooting

### Issue: "Cannot load TypeScript modules"

**Solution:**
```bash
# Install tsx
npm install -g tsx

# Or compile first
npm run build
```

### Issue: "DATABASE_URL not set"

**Solution:**
```bash
export DATABASE_URL="postgresql://user:pass@host/db"
# Or add to .env and source it
```

### Issue: Usage not being recorded

**Check:**
1. Are logs showing usage extraction?
2. Is database connection working?
3. Are there any errors in logs?

**Debug:**
```javascript
// In router/index.js, add more logging
console.log('Response data:', JSON.stringify(data, null, 2));
```

### Issue: `/usage` shows "No usage recorded"

**Check:**
1. Is usage being recorded to database?
2. Is userId matching?
3. Check database directly:
   ```sql
   SELECT * FROM usage WHERE user_id = 'your-user-id';
   ```

---

## 📊 Expected Flow

```
1. User sends message
   ↓
2. Router calls OpenClaw gateway
   ↓
3. OpenClaw returns response with usage
   ↓
4. Router extracts usage
   ↓
5. Usage recorded to database
   ↓
6. User can check /usage command
```

---

## 🎯 Success Criteria

✅ Usage is being logged in console  
✅ Usage is being saved to database  
✅ `/usage` command shows stats  
✅ Costs are calculated correctly  
✅ No errors in logs  

---

## 📝 Files Modified

1. `router/index.js` - Added usage recording
2. `router/usage-tracker.js` - New file for usage tracking
3. `src/utils/usage-tracker.ts` - Updated to handle both formats
4. All documentation files

---

## 🚀 Deploy Steps

1. **Install tsx** (if not already):
   ```bash
   npm install -g tsx
   ```

2. **Set DATABASE_URL**:
   ```bash
   export DATABASE_URL="your-database-url"
   ```

3. **Restart router**:
   ```bash
   # If using PM2
   pm2 restart router
   
   # Or if running directly
   node router/index.js
   ```

4. **Test**:
   - Send a message
   - Check logs
   - Test `/usage`

---

## 🎉 You're Done!

Once usage is being recorded, you have:
- ✅ Complete usage tracking
- ✅ Cost calculation
- ✅ OpenClaw integration
- ✅ User-facing `/usage` command
- ✅ Database storage

**Everything is aligned with OpenClaw and ready to go!**

---

**Last Updated:** 2026-02-09
