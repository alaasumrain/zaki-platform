# What the client needs after onboarding

Once a user finishes onboarding, here’s what they get and what you need to give them so they can use their instance.

---

## 1. **Link to their Telegram bot** ✅ (already done)

- We send: **“Go to your bot”** with `https://t.me/{bot_username}`.
- **Client need:** Open that link and start chatting. Their bot is wired to their isolated instance (Docker or Fireclaw).

---

## 2. **Optional: OpenClaw web UI / gateway URL**

- Each instance has a **gateway** (port on your server + token).
- If you expose it (e.g. reverse proxy per user or a single gateway URL with token in header), you can give the client:
  - **Web UI URL** (e.g. `https://gateway.zaki.ai/app?token=...` or your OpenClaw TUI URL).
- **Client need:** A way to use OpenClaw in the browser, not only in Telegram (optional; many users will only use the bot).

---

## 3. **Optional: API access (token)**

- Instance config has a **gateway token** (stored in `instance.json` / profile).
- If the client wants to use their own client (e.g. CLI, script, another app), they need:
  - **Base URL** of their gateway (e.g. `http://your-server:PORT` or the public URL you proxy to).
  - **Token** (from instance config).
- You can show this in a “Settings” or “API” section in the dashboard, or send it once in a secure way after onboarding.

---

## 4. **What we do after onboarding (summary)**

| What we do | Where |
|------------|--------|
| Create instance (Docker or Fireclaw) | `instanceManager.createUserInstance()` |
| Save profile (name, language, apiKeys, template, skills) | `data/users/{userId}/profile.json` |
| Write USER.md / SOUL.md from onboarding | Same user dir (for Docker path; Fireclaw has its own workspace in the VM) |
| Send “complete” message with bot link | Telegram |

---

## 5. **Checklist: client-ready after onboarding**

- [ ] User gets **“Your Zaki is ready”** message with **link to their bot**.
- [ ] User can **open the bot** and **send a message** → message is routed to their instance.
- [ ] (Optional) You expose **web UI** and give them the link.
- [ ] (Optional) You provide **gateway URL + token** for API use.

No extra step is required for “basic” use: **bot link is enough**. Web UI and API token are optional upgrades.
