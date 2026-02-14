# Product vision & user journey

**Idea:** People start by talking to the shared bot, then we move them into onboarding. They add their APIs (and optionally their own bot). Later we give them a full control panel (web + iOS + Android) so they can control skills, add agents, and run their company.

---

## 1. Entry: talk to the shared bot

- **@zakified_bot** = first touchpoint.
- User opens Telegram, finds the bot, sends a message.
- We don’t leave them “just chatting” — we assign them to **onboarding**.

---

## 2. Onboarding (we assign them here)

- **Flow:** Language → name → purpose/style → **add their APIs** (or use shared keys) → bot token (own bot or skip for shared).
- They **choose** whether to bring their own keys (BYOK) or use shared; we collect bot token so they get their own bot + instance.
- Outcome: one instance per user, their bot (or shared), their keys or shared keys.

---

## 3. After onboarding: full control panel (later)

We give a **full control panel** so they’re not stuck in Telegram only:

- **Web** – dashboard to manage everything.
- **iOS** – native app.
- **Android** – native app.

So they can:

- **Control their skills** – turn on/off, configure, add custom skills.
- **Add and manage agents** – multiple agents, roles, models.
- **Run their company** – use Zaki for team/company workflows, not just personal chat.

---

## 4. One-line summary

**Talk to @zakified_bot → onboarding (add APIs, own bot) → later: full control panel (web + iOS + Android) to control skills, add agents, and run your company.**

---

## 5. How this fits current code

| Step | Current state |
|------|----------------|
| Entry @zakified_bot | ✅ Implemented (shared bot, webhook/polling) |
| Onboarding (APIs, bot token) | ✅ Implemented (steps in `onboarding.ts`, instance creation) |
| Control panel web | 🟡 Dashboard exists; full “skills + agents + company” UX to expand |
| Control panel iOS/Android | 📋 Planned |
| Skills/agents/company controls | 📋 Planned (OpenClaw supports agents/skills; we expose via panel) |

This doc is the north star: **shared bot → onboarding → full control panel (web + mobile) so users control skills, agents, and company.**
