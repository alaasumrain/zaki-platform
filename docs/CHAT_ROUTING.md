# Chat Routing Architecture

## How Messages Flow

### Current System (Shared Bot)

```
User → @zakified_bot (Telegram) → Router → User's Container → OpenClaw Gateway → Response
```

**Step-by-step flow:**

1. **User sends message** to `@zakified_bot` on Telegram
2. **Router receives** the message via Grammy bot framework
3. **Router looks up** user's container mapping (stored in `/var/zaki-platform/router/users.json`)
4. **Router forwards** message to container's OpenClaw gateway via HTTP POST:
   ```
   POST http://localhost:19001/v1/chat/completions
   Authorization: Bearer <token>
   Body: { model: "openclaw", user: "123456", messages: [...] }
   ```
5. **Container processes** message through OpenClaw agent
6. **Response flows back** through the same path
7. **Router sends** response to user via Telegram

### Why This Architecture?

**Current limitations:**
- One shared bot token (`@zakified_bot`)
- Telegram webhook can only point to ONE URL
- Multiple containers can't all poll the same token (they'd fight for messages)
- So we need a router to distribute messages

**What the router does:**
- Receives ALL messages to `@zakified_bot`
- Routes each message to the correct user's container
- Handles container provisioning, health checks, restarts
- Manages user → container → port mappings

### Container Isolation

Each user gets:
- **Own Docker container** (`zaki-user-{userId}`)
- **Own port** (19001, 19002, etc.)
- **Own data directory** (`/var/zaki-platform/users/user-{userId}/`)
- **Own OpenClaw instance** with isolated memory/sessions

### Session Lock Errors

**What causes them:**
- Multiple requests trying to write to the same session file simultaneously
- Stale lock files from crashed processes
- OpenClaw's session write lock mechanism (prevents corruption)

**How we handle them:**
1. **Retry logic** - Router retries up to 3 times with exponential backoff
2. **Lock cleanup** - Script removes stale locks (>30 min old or from dead processes)
3. **Error messages** - User-friendly messages instead of technical errors

**To clean stale locks manually:**
```bash
/root/zaki-platform/scripts/cleanup-stale-locks.sh
```

### Future: User-Owned Bots

**Planned architecture:**
```
User → User's Own Bot → Container (Telegram enabled) → OpenClaw Gateway
```

**Benefits:**
- No router needed
- Full proactive messaging support
- Complete privacy (user owns token)
- Native OpenClaw design

**Migration:**
- Users create their own bot via BotFather
- Paste token during onboarding
- Container configured with their bot token
- Direct connection, no routing layer

## Troubleshooting

### "Session file locked" error

**Symptoms:**
- Messages fail with timeout
- Error mentions `session file locked (timeout 10000ms)`

**Solutions:**
1. Run cleanup script: `./scripts/cleanup-stale-locks.sh`
2. Restart container: `docker restart zaki-user-{userId}`
3. Wait a few seconds and retry

### Messages not reaching container

**Check:**
1. Is router running? `ps aux | grep "router/index.js"`
2. Is container running? `docker ps | grep zaki-user-`
3. Check router logs for routing decisions
4. Verify user mapping exists in `/var/zaki-platform/router/users.json`

### Container not responding

**Check:**
1. Container status: `docker ps -a | grep zaki-user-`
2. Container logs: `docker logs zaki-user-{userId}`
3. Gateway health: `curl http://localhost:{port}/health` (if endpoint exists)
4. Port binding: `docker port zaki-user-{userId}`

## Logging

Router logs include:
- `📨 Message from {userId}` - Message received
- `→ Routing to container` - Routing decision
- `→ Sending to container on port {port}` - Forwarding message
- `← Response received` - Response received
- Error messages with context

## Files

- **Router:** `/root/zaki-platform/router/index.js`
- **User mappings:** `/var/zaki-platform/router/users.json`
- **User data:** `/var/zaki-platform/users/user-{userId}/`
- **Lock cleanup:** `/root/zaki-platform/scripts/cleanup-stale-locks.sh`
