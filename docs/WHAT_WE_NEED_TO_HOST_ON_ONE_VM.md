# What we're missing to host on one VM

**Goal:** One VM runs Zaki platform + Docker; users hit @zakified_bot → onboarding → get their own bot/instance (container on that VM).

---

## Already implemented

- Zaki platform (Express): Telegram **polling**, onboarding, instance manager.
- **Docker backend** (default): `createUserInstance` uses Docker, pulls `alpine/openclaw:latest`, assigns port, writes OpenClaw config, starts container.
- Config: `INSTANCE_BACKEND=docker`, port range 18790–18999, paths under `/root/...` (see `config.ts`).
- No webhook required: polling works without a public URL.

---

## What you need (checklist)

### 1. A Linux VM

- Any VPS or VDS (e.g. Contabo VPS, or VDS if you later want Fireclaw/KVM).
- Docker installed: `apt install docker.io` (or Docker CE). The user that runs the platform must be able to run `docker` (e.g. in `docker` group or run as root).

### 2. Environment variables (on that VM)

Set before starting the platform (e.g. in `.env` or `export`):

| Variable | Required | Notes |
|----------|----------|--------|
| `TELEGRAM_BOT_TOKEN` | Yes | Token for @zakified_bot (from BotFather). |
| `ANTHROPIC_API_KEY` | Yes* | Shared key for free-tier users who don’t bring their own. |
| `PORT` | No | Default 3000. |
| `OPENAI_API_KEY` | No | Optional shared fallback. |
| `GOOGLE_API_KEY` | No | Optional shared fallback. |
| `ZAKI_INSTANCE_BACKEND` | No | Omit or `docker`. Use `fireclaw` only if VM has KVM. |

\* If you don’t set it, users must bring their own Anthropic key in onboarding.

### 3. Docker image

- Platform expects **`alpine/openclaw:latest`**. Pull once on the VM:
  - `docker pull alpine/openclaw:latest`
- If that image doesn’t exist or you prefer upstream: change code to use `ghcr.io/openclaw/openclaw:latest` and pull that instead.

### 4. Paths (config.ts) — configurable

- You can override paths so nothing is tied to `/root`:
  - **One root for everything:** set `ZAKI_DATA_ROOT` (e.g. `/var/lib/zaki`). Then:
    - User data → `$ZAKI_DATA_ROOT/data/users`
    - Instance config → `$ZAKI_DATA_ROOT/instance-config`
    - Workspaces → `$ZAKI_DATA_ROOT/workspaces`
  - **Or set each path yourself:**
    - `ZAKI_USER_DATA_BASE` — user profiles and instance metadata
    - `ZAKI_INSTANCE_CONFIG_BASE` — OpenClaw config dir prefix (suffix `-user-<id>` is appended)
    - `ZAKI_INSTANCE_WORKSPACE_BASE` — workspace dir prefix (suffix `-user-<id>` is appended)
- If you set none of these, defaults stay under `/root/` for backward compatibility.

### 5. Run the platform and keep it up

- Build and run:
  - `npm install && npm run build && npm start`  
  - Or dev: `npm run dev`
- Keep it running: use **systemd** or **pm2** (no service file in repo yet). Example systemd idea:
  - `WorkingDirectory=/root/zaki-platform`, `ExecStart=/usr/bin/node dist/index.js`, load env from file.

### 6. (Optional) Public URL and webhook

- For **Telegram only**, **polling is enough**; no public URL needed.
- If you later want **webhook** (or a dashboard reachable from the internet): put the VM behind a reverse proxy (e.g. nginx + Let’s Encrypt) or use a tunnel (e.g. Cloudflare Tunnel), set `TELEGRAM_BOT_TOKEN` and call `/setup` with the public base URL so Telegram can POST to `https://your-domain/telegram/webhook`.

### 7. (Optional) Firewall

- If you only use polling: no inbound ports required for Telegram.
- If you expose dashboard or webhook: open 80/443 (or your chosen port) and point domain/tunnel to the app.

---

## Summary: minimal to “run it”

1. **VM** with Docker installed.
2. **`.env`** (or env) with at least `TELEGRAM_BOT_TOKEN` and `ANTHROPIC_API_KEY`.
3. **Pull** `alpine/openclaw:latest` (or switch code to another image and pull that).
4. **Run** from repo root: `npm install && npm run build && npm start`, then keep it running (systemd/pm2).
5. Paths are under `/root/...` — run the process on a host where that’s valid, or add env-based path overrides later.

**Not in repo yet:** a ready-made systemd unit or pm2 config, Path overrides are in `config.ts` via `ZAKI_DATA_ROOT` or the three path env vars. Everything else for “host on one VM with Docker” is already there.
