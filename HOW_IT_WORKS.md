# How Zaki Platform Works

## 🎯 The Simple Version

**One bot for everyone: `@zkaified`**

- Everyone chats with the same bot
- Each person gets their own isolated instance automatically
- No need to create separate bots

---

## 📱 User Flow

### For Regular Users

1. **User opens Telegram**
2. **Searches for `@zkaified`**
3. **Sends `/start`**
4. **Answers onboarding questions**
5. **Instance created automatically**
6. **Starts chatting**

**That's it!** Each user gets:
- Their own isolated instance
- Their own port (18790, 18791, etc.)
- Their own config directory
- Their own workspace
- Full control

---

## 🔧 How It Works Technically

```
User sends message to @zkaified
    ↓
Zaki Platform Server receives it
    ↓
Looks up user's Telegram ID
    ↓
Routes to user's instance (or creates one)
    ↓
Instance processes message
    ↓
Response sent back to user
```

**Key Point:** All users use the same bot, but messages are routed to their own instances based on Telegram User ID.

---

## 🎛️ Advanced: Own Bot (Optional)

**Future feature:** Users can optionally:
- Create their own Telegram bot
- Connect it to their instance
- Use their own bot instead of @zkaified

**But by default:** Everyone just uses @zkaified.

---

## 🔑 API Keys

**Current:** Shared API keys (you provide them)

**Future:** Users can add their own:
- Anthropic API key
- OpenAI API key
- Google API key
- etc.

**Or:** Use shared keys (default)

---

## ✅ Current Status

**What's Working:**
- ✅ One bot (@zkaified)
- ✅ Auto instance creation per user
- ✅ Message routing by Telegram ID
- ✅ Isolated instances
- ✅ Shared API keys

**What's Coming:**
- 🔜 User's own bot option
- 🔜 User's own API keys
- 🔜 More customization

---

## 📝 For Cousin

**Cousin just:**
1. Opens Telegram
2. Searches `@zkaified`
3. Sends `/start`
4. Gets his own instance automatically
5. Can report errors, get fixes, etc.

**No separate bot needed!** Just use @zkaified like everyone else.

---

**That's the architecture!** Simple and clean. 🚀
