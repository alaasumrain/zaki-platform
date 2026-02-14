# Cousin Setup - Super Simple Instructions

## 🎯 What You Need to Do

**Just 2 things:**

1. **Set cousin's Telegram ID** (one-time setup)
2. **Give cousin the bot username**

---

## Step 1: Set Cousin's Telegram ID

```bash
cd /root/zaki-platform

# Add to .env file
echo "COUSIN_TELEGRAM_ID=123456789" >> .env

# Or export it
export COUSIN_TELEGRAM_ID=123456789
```

**How to get cousin's Telegram ID:**
- Ask cousin to send a message to your bot
- Check the logs: `tail -f /tmp/zaki-server.log`
- Or use: `@userinfobot` on Telegram (cousin sends `/start` to it)

---

## Step 2: Give Cousin the Bot

**Send cousin this message:**

```
Hey! I set up Zaki for you to work on Tasheel.

Just:
1. Open Telegram
2. Search for: @yourbotname
3. Send: /start
4. Answer the questions
5. Start reporting bugs!

The bot will automatically:
✅ Create your instance
✅ Clone Tasheel repo
✅ Fix errors when you report them
✅ Deploy to Vercel automatically

Just tell it what's wrong and it fixes it!
```

---

## ✅ That's It!

When cousin sends `/start`:
1. ✅ Onboarding starts
2. ✅ Instance created automatically
3. ✅ Tasheel repo cloned automatically (because it's cousin)
4. ✅ Ready to use!

---

## 🧪 Test It

```bash
# 1. Set cousin's ID
export COUSIN_TELEGRAM_ID=123456789

# 2. Start server
cd /root/zaki-platform
npm run dev

# 3. Have cousin send /start
# 4. Check if Tasheel was cloned
ls -la /root/clawd-user-*/tasheel-platform
```

---

## 📝 Summary

**You do:**
- Set `COUSIN_TELEGRAM_ID` in environment
- Give cousin bot username

**Cousin does:**
- Sends `/start` to bot
- Answers questions
- Starts using it

**System does:**
- Everything else automatically!

---

**That's literally it!** 🚀
