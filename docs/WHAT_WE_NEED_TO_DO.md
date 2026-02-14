# What we need to do

**Purpose:** One prioritized list of next steps so we know what to do now. Based on WHAT_WE_NEED_NEXT_FROM_REPOS, ROADMAP_NEXT_STEPS, Lobe ↔ OpenClaw mapping, and the vision doc.

---

## Critical path (do first)

### 1. Wire LobeChat fork to each user’s OpenClaw gateway

**Why:** Without this, the web UI (zaki-dashboard) can’t talk to the user’s agent. Bot-only works today; control panel doesn’t.

- [ ] **Resolve “current user” → gateway:** Backend or client must know which user is in Lobe and return **their** `gatewayUrl` + `gatewayToken` (from Zaki platform / DB per `telegramUserId` or dashboard account).
- [ ] **Lobe chat → OpenClaw:** When user sends a message in Lobe, call that user’s gateway: `POST /v1/responses` (OpenResponses API) with their token. Use `model: "openclaw:main"` or `x-openclaw-agent-id` and optionally `x-openclaw-session-key` (e.g. `agent:main:lobe:<sessionId>:<topicId>`).
- [ ] **Settings in Lobe:** Point Lobe’s API/Proxy settings to the user’s gateway URL + token (injected by our backend so they don’t paste it).

**Ref:** LOBEHUB_TO_OPENCLAW_MAPPING.md, OPENCLAW_ALIGNMENT.md, openclaw-source/docs/gateway/openresponses-http-api.md.

---

### 2. Usage tracking: DB + recording + `/usage`

**Why:** Visibility and billing; roadmap says “code ready, needs DB.”

- [ ] **Database:** Set `DATABASE_URL` (e.g. Neon Postgres) and ensure migrations/schema are applied.
- [ ] **Record usage:** When we get a response from OpenClaw, extract usage from response (already aligned per OPENCLAW_ALIGNMENT) and write to DB.
- [ ] **`/usage` command:** Implement or finish so users get their stats in Telegram (and later in dashboard).
- [ ] **Optional:** Dashboard metrics (request count, error count) from real data.

**Ref:** ROADMAP_NEXT_STEPS.md, WHAT_WE_NEED_NEXT_FROM_REPOS.md §2.

---

### 3. Persist conversation history

**Why:** Today history is in-memory; restart = lost context.

- [ ] **Persist:** Either DB (conversations/messages tables) or file per user (e.g. under `USER_DATA_BASE`).
- [ ] **Load on startup** so the bot (and later Lobe) has context after restart.

**Ref:** ROADMAP_NEXT_STEPS.md, WHAT_WE_NEED_NEXT_FROM_REPOS.md §3.

---

## Important (right after critical)

### 4. Link Telegram user ↔ dashboard (Lobe) identity

**Why:** So “my instance” and “my dashboard” are one product.

- [ ] **Link:** Either “Connect dashboard” in bot (Telegram user → dashboard account) or document dashboard as admin-only for now.
- [ ] **Per-user gateway in UI:** When a user is identified, show **their** instance (port, token, health) and link to their Lobe/OpenClaw UI.

**Ref:** WHAT_WE_NEED_NEXT_FROM_REPOS.md §5.

---

### 5. Sync Lobe agents/groups to OpenClaw

**Why:** So “add agent” in Lobe actually creates/updates OpenClaw agents; groups use OpenClaw sub-agents/broadcast.

- [ ] **Agent create/update in Lobe** → POST/patch to user’s OpenClaw config or gateway API to add/update `agents.list` (and optionally `agents.defaults`).
- [ ] **Group in Lobe** → Ensure OpenClaw has supervisor + member agents; on group message, send to OpenClaw with the right session shape (or call per member and aggregate).
- [ ] **Session key:** Use e.g. `agent:<agentId>:lobe:<sessionId>:<topicId>` so history lines up.

**Ref:** LOBEHUB_TO_OPENCLAW_MAPPING.md §6.

---

### 6. Control in Lobe (OpenClaw Control UI)

**Why:** Users need to manage skills, config, and instance without SSH.

- [ ] **Embed OpenClaw Control UI** in Lobe (iframe or custom pages) so they can manage their gateway (health, pairing, config).
- [ ] **Or:** Link out to OpenClaw Control at a stable URL (e.g. gateway proxy with token).

**Ref:** ZAKI_FULL_VISION_AND_OUR_MENU.md (control deck).

---

## Polish and ops

### 7. Zaki shell (hide Community in Lobe fork)

- [ ] **Feature flag:** e.g. `NEXT_PUBLIC_ZAKI_SHELL=true`.
- [ ] **Hide:** Community (Discover) tab first; optionally Image, Pages, Resource.
- [ ] **Keep:** Chat, Home, Me, Setting.

**Ref:** zaki-dashboard/docs/ZAKI_WHAT_WE_CAN_DISABLE.md.

---

### 8. Onboarding and security

- [ ] **Onboarding state:** Move from `/tmp/zaki-onboarding` to persistent store (DB or under `USER_DATA_BASE`) so it survives reboots.
- [ ] **Token entry:** Prefer web-based token entry (not in chat) for bot token (BOT_TOKEN_SECURITY).
- [ ] **Rate limiting:** Simple rate limits on onboarding to avoid spam.

**Ref:** WHAT_WE_NEED_NEXT_FROM_REPOS.md §7.

---

### 9. Dashboard polish (if using platform dashboard)

- [ ] **Streaming responses** in chatbox.
- [ ] **Gateway logs:** Real-time log viewer, filtering, optional timestamp/level parsing.
- [ ] **Alerts** for critical events; resource charts (CPU/memory).

**Ref:** WHAT_WE_NEED_NEXT_FROM_REPOS.md §4.

---

## Later (vision)

- **Full control panel** (web + iOS + Android): control skills, add agents, “run your company.”
- **Stripe / Pro tiers:** Free vs BYOK vs Premium.
- **Usage analytics dashboard:** Charts, cost breakdown, model comparison.
- **Multi-channel:** WhatsApp, Discord, web (beyond Telegram).
- **Memory / knowledge base:** Long-term memory, semantic search.
- **Verticals:** Education, Customer Support, Content, Real Estate, Clinics (same stack, packaging + workflows).

**Ref:** PRODUCT_VISION_USER_JOURNEY.md, ZAKI_FULL_VISION_AND_OUR_MENU.md.

---

## Priority order (summary)

| Order | What |
|-------|------|
| 1 | **Wire Lobe to user’s OpenClaw gateway** (gatewayUrl + token, chat → `/v1/responses`) |
| 2 | **Usage: DB + record + `/usage`** |
| 3 | **Persist conversation history** |
| 4 | **Link Telegram ↔ dashboard** (identity + “my instance”) |
| 5 | **Sync Lobe agents/groups to OpenClaw** |
| 6 | **Control in Lobe** (OpenClaw Control UI iframe or link) |
| 7 | **Zaki shell** (hide Community, etc.) |
| 8 | **Onboarding persistence + security** |
| 9 | **Dashboard polish** (streaming, logs, alerts) |

---

## One-line summary

**Next:** Wire the **LobeChat fork to each user’s OpenClaw gateway** (so web chat works), then **usage DB + `/usage`** and **persist conversation history**, then **link Telegram to dashboard** and **sync Lobe agents/groups to OpenClaw**. After that: Control in Lobe, Zaki shell, onboarding/security, and polish.
