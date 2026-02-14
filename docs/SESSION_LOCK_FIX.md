# Session Lock Error Fix

## Problem

Users were experiencing session lock errors:
```
session file locked (timeout 10000ms): pid=471870 /root/.openclaw/agents/main/sessions/...
```

This happened when:
1. Multiple requests tried to access the same session file simultaneously
2. Stale lock files existed from crashed processes
3. OpenClaw's session write lock mechanism timed out

## Solutions Implemented

### 1. Lock Cleanup Script

**File:** `/root/zaki-platform/scripts/cleanup-stale-locks.sh`

**What it does:**
- Scans for stale lock files (>30 minutes old or from dead processes)
- Removes invalid locks
- Works on both host and container filesystems
- Safe to run automatically or manually

**Usage:**
```bash
/root/zaki-platform/scripts/cleanup-stale-locks.sh
```

**When to run:**
- After container crashes
- When seeing session lock errors
- As a scheduled cron job (optional)

### 2. Improved Router Error Handling

**File:** `/root/zaki-platform/router/index.js`

**Changes:**
- **Retry logic:** Automatically retries up to 3 times on session lock errors
- **Exponential backoff:** Waits 2s, 4s, 6s between retries
- **Automatic cleanup:** Attempts to clean stale locks on final failure
- **Better error messages:** User-friendly messages instead of technical errors
- **Timeout handling:** 60s timeout with proper cleanup
- **Connection error handling:** Distinguishes between different error types

**Error messages users see:**
- `⚠️ Session busy. Please try again in a moment.` - Session lock detected
- `⏱️ Request timed out. The AI might be busy.` - Timeout occurred
- `🔄 Container is starting up...` - Container not ready
- `Still warming up... try again in 30 secs 🔄` - Generic retry message

### 3. Enhanced Logging

**Added logging:**
- `📨 Message from {userId}` - Message received
- `→ Routing to container via @zakified_bot → zaki-user-{userId}` - Routing decision
- `→ Sending to container on port {port}...` - Forwarding message
- `← Response received ({length} chars)` - Response received
- `[Attempt X/3] Session lock detected...` - Retry attempts

**Benefits:**
- Easier debugging
- Clear visibility into routing flow
- Better understanding of where messages go

## How It Works

### Session Lock Mechanism

OpenClaw uses file-based locks to prevent concurrent writes to session files:
1. Process acquires lock by creating `.lock` file
2. Lock file contains PID and timestamp
3. Other processes wait or timeout if lock is held
4. Lock released when process finishes

### Why Locks Get Stuck

1. **Process crash:** Lock file remains but process is dead
2. **Timeout too short:** Legitimate operation takes longer than 10s
3. **Concurrent requests:** Multiple requests for same user hit simultaneously

### Our Solution Flow

```
User message → Router → Container
                      ↓
              Session lock detected?
                      ↓
              Retry (up to 3x)
                      ↓
              Still locked?
                      ↓
              Clean stale locks
                      ↓
              Return user-friendly error
```

## Testing

To test the fixes:

1. **Trigger a session lock:**
   - Send multiple rapid messages to the same bot
   - Or manually create a stale lock file

2. **Verify retry behavior:**
   - Check router logs for retry attempts
   - Should see `[Attempt X/3]` messages

3. **Test cleanup script:**
   ```bash
   # Create a test lock file
   echo '{"pid":999999,"createdAt":"2020-01-01T00:00:00.000Z"}' > /tmp/test.lock
   
   # Run cleanup (should remove it)
   ./scripts/cleanup-stale-locks.sh
   ```

## Monitoring

**Watch for:**
- Frequent session lock errors in logs
- High retry rates
- User complaints about timeouts

**If issues persist:**
1. Run cleanup script manually
2. Check container health: `docker ps | grep zaki-user-`
3. Check container logs: `docker logs zaki-user-{userId}`
4. Consider increasing timeout in OpenClaw config
5. Consider reducing concurrent requests per user

## Future Improvements

1. **Automatic cleanup:** Run cleanup script as cron job every 5 minutes
2. **Lock monitoring:** Alert when locks are held >1 minute
3. **Request queuing:** Queue requests per user instead of failing
4. **Lock timeout increase:** Increase OpenClaw's default 10s timeout
5. **Distributed locks:** Use Redis for multi-container scenarios

## Related Files

- Router: `/root/zaki-platform/router/index.js`
- Cleanup script: `/root/zaki-platform/scripts/cleanup-stale-locks.sh`
- Routing docs: `/root/zaki-platform/docs/CHAT_ROUTING.md`
- OpenClaw lock code: `/root/openclaw-source/src/agents/session-write-lock.ts`
