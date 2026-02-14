# What we need next (from the repos)

**Source:** Zaki platform, dashboard, OpenClaw, roadmaps, TODOs, and status docs.  
**Purpose:** One prioritized list of what to do next, using the codebase as insight.

---

## 1. Get “host on one VM” running (infra)

**From:** `docs/WHAT_WE_NEED_TO_HOST_ON_ONE_VM.md`, `docs/CURRENT_ARCHITECTURE.md`

- [ ] **A Linux VM** with Docker (e.g. Contabo VPS). No KVM needed for Docker backend.
- [ ] **Env on that VM:** `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY` (and optionally `OPENAI_API_KEY`, `GOOGLE_API_KEY`).
- [ ] **Pull image:** `docker pull alpine/openclaw:latest` (or switch code to `ghcr.io/openclaw/openclaw:latest` if needed).
- [ ] **Run platform** from repo root; keep it up with **systemd or pm2** (no unit file in repo yet).
- [ ] **Optional:** Add env overrides for `USER_DATA_BASE`, `INSTANCE_CONFIG_BASE`, `INSTANCE_WORKSPACE_BASE` in `config.ts` so paths aren’t hardcoded to `/root/...`.

**Repos insight:** Instance manager and Docker backend are implemented; only deployment and env/paths are missing.

---

## 2. Usage tracking & database (platform)

**From:** `docs/ROADMAP_NEXT_STEPS.md`, `docs/ACTION_PLAN_NOW.md`, `docs/REPO_IMPROVEMENTS_ANALYSIS.md`, `dashboard/server/services/metricsCollector.ts` (TODO)

- [ ] **Database connection:** Set `DATABASE_URL` (e.g. Neon Postgres) so usage can be stored.
- [ ] **Wire usage recording:** Ensure platform records token/usage when talking to OpenClaw and writes to DB (schema exists; handler/recording may be partial or TODO).
- [ ] **`/usage` command:** Implement or finish so users get their stats in Telegram (ROADMAP: “Usage tracking code ready, needs DB setup”).
- [ ] **Dashboard metrics:** `metricsCollector.ts` has TODOs for “request count” and “error count” from logs — implement or plug in real metrics.

**Repos insight:** Schema and high-level design exist; the gap is DB setup + wiring record/query + `/usage` and dashboard metrics.

---

## 3. Conversation history persistence (platform)

**From:** `docs/ROADMAP_NEXT_STEPS.md`, `docs/CURRENT_STATE_ANALYSIS.md`

- [ ] **Persist history:** Conversation history is in-memory today (lost on restart). Either:
  - Save to DB (conversations/messages tables), or
  - Save to file per user (e.g. JSON in user data dir).
- [ ] **Load on startup** so the bot has context after restart.

**Repos insight:** Flow and “last 20 messages” are there; persistence is called out as the next step.

---

## 4. Dashboard: Chatbox & gateway polish (dashboard)

**From:** `dashboard/todo.md`, `docs/IMPLEMENTATION_ROADMAP.md`

- [ ] **Chatbox:** Session deletion confirmation; **streaming responses** (todo.md: “Implement streaming responses”).
- [ ] **Gateway management:** Real-time log viewer with filtering; resource usage charts (CPU/memory over time); alerts for critical events (todo.md).
- [ ] **Gateway logs:** `routers.ts` has TODOs for parsing timestamp/level from log lines — optional but improves UX.

**Repos insight:** Chatbox and Gateway Management are implemented; streaming, logs UX, and alerts are the next polish.

---

## 5. Platform–dashboard link (product)

**From:** `docs/CURRENT_STATE_ANALYSIS.md`, `docs/CURRENT_AUTH_ANALYSIS.md`, `docs/IMPLEMENTATION_ROADMAP.md`

- [ ] **Telegram user ↔ dashboard user:** Today Telegram users and dashboard (OAuth) users are separate; no mapping. Either:
  - Link Telegram user to dashboard account (e.g. “Connect dashboard” in bot), or
  - Document that dashboard is admin-only for now.
- [ ] **Per-user gateway in dashboard:** If a logged-in user is tied to a Telegram/user ID, show **their** instance (port, token, health) in the dashboard and optionally link to LobeChat/OpenClaw UI for that gateway.

**Repos insight:** Instance creation is by `telegramUserId`; dashboard doesn’t yet use that for “my instance” UX.

---

## 6. LobeChat / web chat (optional)

**From:** `docs/IMPLEMENTATION_ROADMAP.md`, `docs/CURRENT_STATE_ANALYSIS.md`, `clawd-user-6917531619/AGENTS_AND_LOBECHAT_WHAT_WE_NEED.md`

- [ ] **Point LobeChat at user gateway:** For each user, set `OPENAI_PROXY_URL` / `OPENAI_API_KEY` to their instance’s gateway URL + token so they can chat from the web UI.
- [ ] **Or:** Use OpenClaw’s built-in web UI (if exposed) and give users a link (e.g. `https://your-domain/gateway-proxy?token=...`).

**Repos insight:** LobeChat fork exists; “connect to user’s gateway” is in the roadmap but not required for “give them bot link only.”

---

## 7. Security & ops (nice-to-have)

**From:** `docs/REPO_IMPROVEMENTS_ANALYSIS.md`, `docs/BOT_TOKEN_SECURITY.md`, `docs/ONBOARDING_CLIENT_NEEDS.md`

- [ ] **Onboarding state:** Move from `/tmp/zaki-onboarding` to a persistent store (DB or under `USER_DATA_BASE`) so it survives reboots (STATUS_REPORT, INSTANCES_SUMMARY).
- [ ] **Token entry:** Web-based token entry (e.g. minimal page that posts token to backend, never in chat) is recommended in BOT_TOKEN_SECURITY.
- [ ] **Rate limiting:** Onboarding can be spammed; add simple rate limits (ZAKI_STATUS).

**Repos insight:** Documented as improvements; not blocking for first “one VM” run.

---

## 8. Later (product vision)

**From:** `docs/PRODUCT_VISION_USER_JOURNEY.md`, `docs/ROADMAP_NEXT_STEPS.md`, `docs/ZAKI_STRUCTURE_FREE_AND_PRO.md`

- **Full control panel (web + iOS + Android):** Control skills, add agents, “run your company” — planned after “give them bot link now.”
- **Stripe / Pro tiers:** Enforce Free vs BYOK vs Premium (ZAKI_STRUCTURE); landing has placeholders.
- **Usage analytics dashboard:** Charts, cost breakdown, model comparison (ROADMAP short term).
- **Multi-channel:** WhatsApp, Discord, web (ROADMAP medium term).
- **Memory/knowledge base:** Long-term memory, semantic search (ROADMAP).

---

## Priority order (recommended)

| Order | What | Why |
|-------|------|-----|
| 1 | **Host on one VM** (section 1) | So the product actually runs somewhere. |
| 2 | **Usage + DB + `/usage`** (section 2) | Repos say “code ready, needs DB”; unblocks visibility and billing later. |
| 3 | **Conversation persistence** (section 3) | Better UX and no lost context on restart. |
| 4 | **Dashboard polish** (section 4) | Streaming, logs, alerts — better ops and UX. |
| 5 | **Platform–dashboard link** (section 5) | So “my instance” and “my dashboard” feel like one product. |
| 6 | **LobeChat / web chat** (section 6) | Optional; bot link is enough for “what to give them now.” |
| 7 | **Security/ops** (section 7) | Then later vision items (section 8). |

---

## One-line summary

**Next:** Get the platform **running on one VM** with Docker and env set; then **turn on usage tracking** (DB + `/usage`); then **persist conversation history**; then **dashboard polish** and **linking Telegram to dashboard** for “my instance.” The repos already describe the rest (streaming, alerts, Stripe, control panel) as follow-ups.
