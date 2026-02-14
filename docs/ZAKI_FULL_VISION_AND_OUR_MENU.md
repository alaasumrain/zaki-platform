# Zaki full vision — and what we have on the menu

**Purpose:** Reply to the full vision doc. This ties what we’ve been building and discussing to the 13-point vision and states exactly what’s on the menu today.

**Basis:** This doc is grounded in **OpenClaw** (the AI runtime we use), our **LobeChat fork** (zaki-dashboard — the web UI), and **Zaki platform** (orchestrator, onboarding, instance manager). The vision and menu are built on top of OpenClaw’s capabilities and the Lobe fork as the control-panel frontend — see the OpenClaw foundation, LobeChat fork, and references below.

---

## OpenClaw foundation (what we’re building on)

Everything in the vision and menu assumes **OpenClaw** as the core runtime. OpenClaw gives us:

- **Gateway:** One process per instance; WebSocket + HTTP. Control UI, health, pairing, auth token. Same codepath for chat whether from Telegram, WhatsApp, or API.
- **Channels:** Telegram, WhatsApp, Discord, Slack, Signal, iMessage (BlueBubbles), Mattermost, Feishu, Google Chat, IRC, Matrix, LINE, WebChat, and more (plugins). We use Telegram today; WhatsApp and others are already in OpenClaw.
- **Multi-agent:** `agents.list` with per-agent workspace, model, skills; **bindings** to route by channel/account/peer; **sub-agents** (`sessions_spawn`) and **broadcast** so agents can talk to each other. This is what “our agents” and “groups” in Lobe map to (see LOBEHUB_TO_OPENCLAW_MAPPING.md).
- **Workspace:** Per-agent workspace (AGENTS.md, SOUL.md, TOOLS.md, IDENTITY.md, USER.md, HEARTBEAT.md, skills). Bootstrap ritual, memory, session scope (per-sender, reset triggers). Zaki gives each user their own workspace (e.g. under `ZAKI_DATA_ROOT`).
- **API:** OpenResponses `POST /v1/responses` on the gateway (when enabled). Model selection via `model: "openclaw:<agentId>"` or `x-openclaw-agent-id`; optional `x-openclaw-session-key`. Usage in response; we align to this for tracking (OPENCLAW_ALIGNMENT.md).
- **Session & security:** Session files per agent; pairing for DMs; allowlists; mention patterns for groups. We mirror this in our onboarding and instance config.

So: **Zaki platform** orchestrates **per-user OpenClaw instances** (Docker today; Fireclaw/Mac Mini later). We don’t replace OpenClaw — we run it, wire Lobe to it, and productize it (Cloud, for Developers, Enterprise, verticals). All 13 vision items assume this stack; verticals (Education, Support, Content, Real Estate, Clinics) add positioning and workflows on top of the same OpenClaw channels and agents.

---

## LobeChat fork (zaki-dashboard) — the web UI

The **control panel / agentic shell** is our fork of **LobeChat** (lobehub/lobe-chat), repo **zaki-dashboard**:

- **What it is:** Full LobeChat stack — chat, sessions, agents, groups, topics, settings, Home, Me, etc. We run it as the web frontend (e.g. port 3010) so users get a proper chat UI and (once wired) can manage their agents and talk to OpenClaw from the browser.
- **How it ties to OpenClaw:** Lobe’s **agents** map to OpenClaw `agents.list`; Lobe’s **groups** (supervisor + members) map to OpenClaw **sub-agents** and **broadcast**. Sessions/topics map to OpenClaw session keys (e.g. `agent:<id>:lobe:<sessionId>:<topicId>`). Full mapping: **LOBEHUB_TO_OPENCLAW_MAPPING.md**. Next step is wiring each user’s Lobe to their gateway URL + token.
- **Zaki shell:** We can turn the fork into a lighter “Zaki shell” by hiding tabs we don’t need first (e.g. **Community** / Discover, optionally Image, Pages, Resource) via a feature flag like `NEXT_PUBLIC_ZAKI_SHELL=true`. Chat, Home, Me, Setting stay; Control can be OpenClaw Control UI in an iframe or custom pages. Details: **zaki-dashboard/docs/ZAKI_WHAT_WE_CAN_DISABLE.md**.
- **Why a fork:** We keep our own copy (zaki-dashboard) so we can customize branding, hide Community, point settings to the user’s OpenClaw gateway, and later add Zaki-specific flows (onboarding link, usage, billing). Upstream remains lobehub/lobe-chat for updates we can pull in.

So the **full stack** for the vision is: **Zaki platform** (orchestrator) + **OpenClaw** (per-user runtime) + **LobeChat fork** (zaki-dashboard, the web UI). All 13 products use this; the fork is the “control panel” we refer to in the menu and in Zaki Cloud / for Developers / Enterprise.

---

## What we’ve been building and talking about (our “menu” right now)

- **Product flow:** Sign up via **@zakified_bot** (Telegram) → **onboarding** (language, name, APIs or shared keys, bot token) → **one OpenClaw instance per user** (Docker; optional Fireclaw later) → we give them **their bot link**. Later: **full control panel** (web + iOS + Android) so they control skills, add agents, run their company.
- **Frontend:** **LobeChat fork** (zaki-dashboard) as the agentic shell — chat, agents, groups, settings; can be trimmed to a “Zaki shell” (hide Community, etc.). Our **agents** = OpenClaw agents; our **groups** = OpenClaw sub-agents/broadcast. Control deck = OpenClaw Control UI (iframe or custom pages in Lobe) so they manage their instance.
- **Stack:** **Zaki platform** (orchestrator, onboarding, instance manager) + **OpenClaw** (runtime per user) + **LobeChat fork** (zaki-dashboard: chat + agents + groups). One VM runs platform + Lobe + Docker; paths configurable (`ZAKI_DATA_ROOT`).
- **Alignment:** LobeHub ↔ OpenClaw mapping doc; “our agents become OpenClaw agents”; “group thingy” = OpenClaw multi-agent. What’s missing: Lobe ↔ gateway wiring (per-user URL + token), usage tracking, conversation persistence, Control in Lobe.

That’s the **current menu**: Zaki Cloud–style entry (sign up → agent on Telegram) plus the base for “managed OpenClaw” and a clear path to control panel and multi-agent.

---

## How the 13-point vision maps to what we have and what’s next

| # | Vision item | Where it sits | What we have / what’s needed |
|---|-------------|---------------|------------------------------|
| 1 | **Zaki Cloud** — sign up, agent on Telegram/WhatsApp, managed (emails, calendar, research, reminders, content), individuals/SMB, subscription | **Core product we’re building** | We have: sign up, onboarding, instance per user, bot link. Need: Lobe wired to their gateway, control panel, billing tiers, and the “manages emails/calendar/…” as skills and workflows. |
| 2 | **Zaki Local** — Mac Mini, local models, 24/7, private, one-time + optional support | **Hardware + deployment variant** | Not in current VM stack. Same agent stack could run on a Mac Mini (or small server); “Zaki Local” = that stack + hardware/shipping and positioning. |
| 3 | **Zaki Enterprise** — multiple agents (researcher, developer, content, support), multiple instances, custom workflows, setup + retainer | **Scale-up of current stack** | We have: one instance per user, OpenClaw multi-agent (agents list, sub-agents). Enterprise = multi-instance per company + roles + workflows; extension of current platform. |
| 4 | **Zaki for Developers** — managed OpenClaw, API, custom models, usage-based | **Literally what we’re building** | We run OpenClaw per user; their gateway is their API. Productize as “Zaki for Developers” with docs, usage pricing, and maybe a dev tier. |
| 5 | **Zaki White Label** — agencies resell under their brand, we run backend, revenue share or per seat | **Platform / go-to-market** | Technically: multi-tenant already; need branding, billing, and “white-label” packaging (their domain, their name, our engine). |
| 6 | **Zaki for Education** — TawjihiAI bridge, study assistant, Arabic-first, curriculum-aware, parents/schools | **Vertical on same tech** | Same Zaki/OpenClaw stack; education wrapper, content, and distribution (TawjihiAI tie-in). Product layer on top of Cloud. |
| 7 | **Zaki for Customer Support** — WhatsApp/chat for businesses, 24/7, trained on docs/FAQs, MENA | **Vertical + use case** | Same channels (WhatsApp) and agents; add business onboarding, “train on your docs,” and per-conversation or monthly pricing. |
| 8 | **Zaki for Content Creators** — posting, captions, ideas, repurpose, Instagram/TikTok/YouTube/LinkedIn | **Vertical** | Same agent + channels; add creator workflows and social integrations. |
| 9 | **Zaki for Real Estate** — AI SDR, WhatsApp follow-up, qualify leads, book viewings | **Vertical** | Same stack; vertical packaging and pricing (per-agent or per-lead). |
| 10 | **Zaki for Clinics & Offices** — AI receptionist, booking via WhatsApp, reminders, reschedule | **Vertical** | Same stack; vertical packaging (booking, reminders) and per-location pricing. |
| 11 | **Zaki Marketplace** — others build and sell agents on Zaki, we take a cut | **Platform layer** | We have multi-tenant and agents; need marketplace (list, sell, rev share). |
| 12 | **Zaki API** — developers plug agent orchestration into their apps, pay per agent-hour/task | **Productization of gateway** | We already give each user a gateway (API); productize as “Zaki API” with public positioning and usage-based pricing. |
| 13 | **Zaki Box** — branded hardware (Mac Mini or future custom), “your AI employee” | **Hardware / brand** | Downstream of Zaki Local; branding and packaging, eventually custom hardware. Not in current code. |

---

## One-line summary for a reply

**We’re building the core that makes all of this possible:** sign up → your agent on Telegram/WhatsApp → your OpenClaw instance (managed) → soon a full control panel (web + mobile) so you control skills and agents. **Zaki Cloud (1) and Zaki for Developers (4) are the direct product of this.** Zaki Local (2) and Zaki Box (13) are the same stack on your hardware, branded. Enterprise (3), White Label (5), and API (12) are scale and packaging of the same platform. Education (6), Customer Support (7), Content Creators (8), Real Estate (9), and Clinics (10) are verticals on the same agent/channel stack. Marketplace (11) is the next platform layer once the core is live. So: **one core, many products** — and the VM we’re on is literally for that core.

---

## Exact reply you can paste (short version)

**Here’s everything we have on the menu from what we’ve been building and talking about:**

- **Product:** Sign up via @zakified_bot → onboarding (APIs, your bot token) → one OpenClaw instance per user → you get your bot link. Later: full control panel (web + iOS + Android) to control skills, add agents, run your company.
- **Tech:** Zaki platform (orchestrator) + **OpenClaw** (your AI runtime: gateway, Telegram/WhatsApp/Discord/etc., multi-agent, workspace, OpenResponses API) + **LobeChat fork** (zaki-dashboard: chat + agents + groups, “Zaki shell” by hiding Community etc.). Our agents = OpenClaw agents; our groups = OpenClaw sub-agents/broadcast. One VM runs it all; paths and backend are configurable. Vision and menu are based on this OpenClaw + Lobe fork stack.
- **Vision fit:** (1) Zaki Cloud and (4) Zaki for Developers are what we’re building directly. (2) Zaki Local and (13) Zaki Box are the same stack on hardware. (3) Enterprise, (5) White Label, (12) API are scaling and packaging of the same platform. (6)–(10) are verticals (Education, Support, Creators, Real Estate, Clinics) on the same agent/channel stack. (11) Marketplace is the next platform layer. So it’s **one core, many products** — and this VM is set up for that core.

Use the table and “One-line summary” above to expand or trim the reply as needed.

---

## References (OpenClaw, LobeChat fork, Zaki)

- **zaki-platform/docs/OPENCLAW_REFERENCE.md** — OpenClaw patterns: onboarding, workspace, sessions, channels, pairing, heartbeats, media; Zaki per-user equivalents.
- **zaki-platform/docs/OPENCLAW_ALIGNMENT.md** — How Zaki uses OpenClaw: config format, gateway startup, OpenResponses API, usage schema, instance isolation.
- **zaki-platform/docs/LOBEHUB_TO_OPENCLAW_MAPPING.md** — LobeChat fork (zaki-dashboard) agents/groups/sessions mapped to OpenClaw agents, multi-agent (sub-agents/broadcast), session keys.
- **zaki-dashboard** — Our fork of **lobehub/lobe-chat**; the web UI (chat, agents, groups, settings). Can be turned into a “Zaki shell” by hiding Community and optional tabs.
- **zaki-dashboard/docs/ZAKI_WHAT_WE_CAN_DISABLE.md** — What to hide in the Lobe fork for Zaki (Community first, then optional Image, Pages, Resource); how to keep Chat, Home, Me, Setting.
- **openclaw-source/docs/** — Upstream OpenClaw: `start/openclaw.md`, `concepts/architecture.md`, `concepts/multi-agent.md`, `concepts/agent-workspace.md`, `gateway/openresponses-http-api.md`, `channels/index.md`.
