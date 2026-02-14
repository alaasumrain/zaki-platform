# How to Give Cousin Access - Simple Guide

**TL;DR:** Just give him the bot username and tell him to send `/start`. That's it!

---

## 🎯 The Simple Answer

**You give cousin:**
1. The Telegram bot username (e.g., `@zakibot`)
2. Tell him: "Send `/start` to the bot"

**That's it!** The system automatically:
- Creates his instance
- Clones Tasheel repo
- Sets everything up
- He can start using it immediately

---

## 📋 Step-by-Step

### Step 1: Find Your Bot Username

```bash
# If you have the bot token, you can get the username:
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

Or check your Telegram - the bot should have a username like `@yourbotname`

### Step 2: Give Cousin the Info

**Send him this:**

```
Hey! Here's your Zaki instance access:

1. Open Telegram
2. Search for: @yourbotname
3. Send: /start
4. Answer the questions
5. Start chatting!

The bot will automatically:
- Create your instance
- Clone Tasheel repo
- Fix errors when you report them
- Deploy to Vercel automatically

Just tell it about bugs and it fixes them!
```

### Step 3: That's It!

Cousin sends `/start` → System creates instance → He can use it

---

## 🔧 Optional: Pre-Create Instance

If you want to create the instance BEFORE cousin uses it:

```bash
cd /root/zaki-platform
./scripts/setup-cousin-tasheel-instance.sh
```

This will:
- Ask for cousin's Telegram ID
- Create instance immediately
- Clone Tasheel repo
- Set everything up

**But this is optional!** The instance is created automatically when cousin sends `/start` anyway.

---

## 💬 What Cousin Sees

### First Time (`/start`)

1. Bot: "Welcome! What language do you prefer?"
2. Cousin: Selects language
3. Bot: "What's your name?"
4. Cousin: "Ahmed" (or whatever)
5. Bot: "What's your main purpose?"
6. Cousin: Selects purpose
7. Bot: "Done! Your instance is ready. You can now report errors and I'll fix them!"

### After Onboarding

Cousin just chats normally:
- "The login form has a bug"
- "Add dark mode"
- "How does authentication work?"

---

## 🎯 The Key Point

**Everyone uses the SAME bot, but each person gets their OWN instance.**

- You → Your instance (port 18789 or whatever)
- Cousin → His instance (port 18790 or auto-assigned)
- User 3 → Their instance (port 18791, etc.)

**The bot automatically routes messages to the right instance based on Telegram User ID.**

---

## ✅ Checklist

- [ ] Get bot username
- [ ] Give cousin the username
- [ ] Tell him to send `/start`
- [ ] (Optional) Pre-create instance with setup script
- [ ] Done!

---

## 🚀 Quick Test

Want to test it yourself first?

```bash
# 1. Start the server
cd /root/zaki-platform
npm run dev

# 2. Send /start to your bot
# 3. Complete onboarding
# 4. Send a test message
# 5. See if instance is created
```

Check if it worked:
```bash
# See if instance was created
ls -la /root/.clawdbot-user-*
ls -la /root/clawd-user-*
```

---

## 📱 What to Tell Cousin

**Simple message:**

```
Hey! I set up a Zaki instance for you to work on Tasheel.

Just:
1. Open Telegram
2. Search for: @yourbotname
3. Send: /start
4. Answer the questions
5. Start reporting bugs!

The bot will automatically fix errors and deploy them. 
No manual Git or deployment needed - just tell it what's wrong!
```

---

**That's literally it!** Just the bot username and `/start`. Everything else is automatic! 🎉
