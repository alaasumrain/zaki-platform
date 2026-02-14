# What starts / runs on this VM

**Checked:** 2026-02-14

---

## Currently running (as of check)

| Thing | How it runs | Port / note |
|-------|----------------|-------------|
| **Zaki platform** (Node) | Manual/background: `tsx watch src/index.ts` from `/root/zaki-platform` | 3000 (API, Telegram bot) |
| **Zaki landing** (Astro) | Tmux session `zaki-landing`: `npm run preview -- --host 0.0.0.0 --port 18790` | 18790 |
| **LobeChat fork** (zaki-dashboard) | Manual: `pnpm run dev` → `next dev -H 0.0.0.0 -p 3010` | 3010 |
| **OpenClaw user instances** | Docker containers (started by Zaki platform) | 19001, 19002 (host) → 18789 (container) |
| **OpenClaw gateways** | Processes `openclaw-gateway` (from containers or other runs) | — |

---

## System services (systemd)

- **Docker** — running (used for user OpenClaw containers).
- **MySQL, PostgreSQL, Redis** — running (DB/cache).
- **zaki-platform.service** — **enabled** but **inactive (dead)**.  
  - This unit runs `openclaw gateway --port 18791` from `/var/zaki-platform/users/default`, i.e. it’s an **OpenClaw gateway** service, not the Node Zaki platform. It was stopped on 2026-02-07. So the **Node** Zaki platform is **not** started by systemd; it’s started manually (e.g. `npm run dev` in `/root/zaki-platform`).

---

## Summary

- **Zaki platform** (orchestrator + Telegram bot): runs as a **manual** Node process from `/root/zaki-platform` (tsx watch). Not systemd.
- **Zaki landing**: runs in **tmux** (`zaki-landing`), port **18790**.
- **Lobe (zaki-dashboard)**: runs **manually** with `pnpm run dev`, port **3010**.
- **User OpenClaw instances**: run as **Docker** containers (e.g. 19001, 19002); started by the platform when users get an instance.
- **zaki-platform.service**: currently a separate OpenClaw gateway unit (port 18791); stopped and not the Node app. To have the Node Zaki platform start on boot, you’d add (or change) a systemd unit that runs `npm start` or `node dist/index.js` from `/root/zaki-platform`.
