# Simple Cousin Setup

## What You Do

1. **Give cousin the bot username** (e.g., `@zkaified` or whatever your bot is)
2. **Tell him: "Send `/start` to the bot"**

## What Happens

- Cousin sends `/start`
- Answers questions
- Instance created automatically
- Done!

## If You Want Cousin to Have Tasheel Access

Just run this AFTER cousin sends `/start`:

```bash
cd /root/zaki-platform
./scripts/setup-cousin-tasheel-instance.sh
```

Enter cousin's Telegram ID when asked. It will:
- Clone Tasheel repo into his instance
- Set up error fixing
- Ready to go!

---

**That's it!** No complications. Just give him the bot and `/start`. 🚀
