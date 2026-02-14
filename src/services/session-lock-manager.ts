/**
 * Session Lock Manager
 * 
 * Based on OpenClaw's gateway-lock.ts pattern
 * Prevents concurrent session access conflicts
 * 
 * Features:
 * - File-based distributed locks
 * - Automatic stale lock cleanup
 * - Process validation (checks if lock owner is alive)
 * - Timeout handling
 */

import { createHash } from "node:crypto";
import fsSync from "node:fs";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const DEFAULT_POLL_INTERVAL_MS = 100;
const DEFAULT_STALE_MS = 30000; // 30 seconds - locks older than this are considered stale

type LockPayload = {
  pid: number;
  createdAt: string;
  sessionPath: string;
  startTime?: number;
};

export type SessionLockHandle = {
  lockPath: string;
  sessionPath: string;
  release: () => Promise<void>;
};

export type SessionLockOptions = {
  timeoutMs?: number;
  pollIntervalMs?: number;
  staleMs?: number;
  platform?: NodeJS.Platform;
};

export class SessionLockError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SessionLockError";
  }
}

type LockOwnerStatus = "alive" | "dead" | "unknown";

function isAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLinuxStartTime(pid: number): number | null {
  try {
    const raw = fsSync.readFileSync(`/proc/${pid}/stat`, "utf8").trim();
    const closeParen = raw.lastIndexOf(")");
    if (closeParen < 0) {
      return null;
    }
    const rest = raw.slice(closeParen + 1).trim();
    const fields = rest.split(/\s+/);
    const startTime = Number.parseInt(fields[19] ?? "", 10);
    return Number.isFinite(startTime) ? startTime : null;
  } catch {
    return null;
  }
}

function resolveLockOwnerStatus(
  pid: number,
  payload: LockPayload | null,
  platform: NodeJS.Platform,
): LockOwnerStatus {
  if (!isAlive(pid)) {
    return "dead";
  }
  if (platform !== "linux") {
    return "alive";
  }

  // On Linux, verify it's the same process by checking start time
  const payloadStartTime = payload?.startTime;
  if (Number.isFinite(payloadStartTime)) {
    const currentStartTime = readLinuxStartTime(pid);
    if (currentStartTime == null) {
      return "unknown";
    }
    return currentStartTime === payloadStartTime ? "alive" : "dead";
  }

  return "alive";
}

async function readLockPayload(lockPath: string): Promise<LockPayload | null> {
  try {
    const raw = await fs.readFile(lockPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LockPayload>;
    if (typeof parsed.pid !== "number") {
      return null;
    }
    if (typeof parsed.createdAt !== "string") {
      return null;
    }
    if (typeof parsed.sessionPath !== "string") {
      return null;
    }
    const startTime = typeof parsed.startTime === "number" ? parsed.startTime : undefined;
    return {
      pid: parsed.pid,
      createdAt: parsed.createdAt,
      sessionPath: parsed.sessionPath,
      startTime,
    };
  } catch {
    return null;
  }
}

function resolveSessionLockPath(sessionPath: string): string {
  // Create a hash of the session path for the lock filename
  const hash = createHash("sha1").update(sessionPath).digest("hex").slice(0, 8);
  const lockDir = path.join(path.dirname(sessionPath), ".locks");
  const lockPath = path.join(lockDir, `session.${hash}.lock`);
  return lockPath;
}

/**
 * Acquire a lock for a session file
 * 
 * @param sessionPath - Path to the session file (e.g., /path/to/session.jsonl)
 * @param opts - Lock options
 * @returns Lock handle with release function, or null if locking is disabled
 */
export async function acquireSessionLock(
  sessionPath: string,
  opts: SessionLockOptions = {},
): Promise<SessionLockHandle | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = opts.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const staleMs = opts.staleMs ?? DEFAULT_STALE_MS;
  const platform = opts.platform ?? process.platform;
  
  const lockPath = resolveSessionLockPath(sessionPath);
  await fs.mkdir(path.dirname(lockPath), { recursive: true });

  const startedAt = Date.now();
  let lastPayload: LockPayload | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      // Try to create lock file exclusively
      const handle = await fs.open(lockPath, "wx");
      const startTime = platform === "linux" ? readLinuxStartTime(process.pid) : null;
      const payload: LockPayload = {
        pid: process.pid,
        createdAt: new Date().toISOString(),
        sessionPath,
      };
      if (typeof startTime === "number" && Number.isFinite(startTime)) {
        payload.startTime = startTime;
      }
      await handle.writeFile(JSON.stringify(payload), "utf8");
      
      return {
        lockPath,
        sessionPath,
        release: async () => {
          await handle.close().catch(() => undefined);
          await fs.rm(lockPath, { force: true });
        },
      };
    } catch (err) {
      const code = (err as { code?: unknown }).code;
      if (code !== "EEXIST") {
        throw new SessionLockError(`failed to acquire session lock at ${lockPath}`, err);
      }

      // Lock exists - check if owner is still alive
      lastPayload = await readLockPayload(lockPath);
      const ownerPid = lastPayload?.pid;
      const ownerStatus = ownerPid
        ? resolveLockOwnerStatus(ownerPid, lastPayload, platform)
        : "unknown";
      
      // If owner is dead, remove stale lock
      if (ownerStatus === "dead" && ownerPid) {
        await fs.rm(lockPath, { force: true });
        continue;
      }
      
      // If owner status is unknown, check if lock is stale
      if (ownerStatus !== "alive") {
        let stale = false;
        if (lastPayload?.createdAt) {
          const createdAt = Date.parse(lastPayload.createdAt);
          stale = Number.isFinite(createdAt) ? Date.now() - createdAt > staleMs : false;
        }
        if (!stale) {
          try {
            const st = await fs.stat(lockPath);
            stale = Date.now() - st.mtimeMs > staleMs;
          } catch {
            stale = true;
          }
        }
        if (stale) {
          await fs.rm(lockPath, { force: true });
          continue;
        }
      }

      // Wait before retrying
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  // Timeout - lock couldn't be acquired
  const owner = lastPayload?.pid ? ` (pid ${lastPayload.pid})` : "";
  throw new SessionLockError(
    `session file locked (timeout ${timeoutMs}ms): pid=${lastPayload?.pid || 'unknown'} ${sessionPath}.lock${owner}`
  );
}

/**
 * Clean up stale locks for a user's sessions
 * 
 * @param workspaceDir - User's workspace directory
 */
export async function cleanupStaleLocks(workspaceDir: string): Promise<number> {
  const locksDir = path.join(workspaceDir, ".locks");
  if (!existsSync(locksDir)) {
    return 0;
  }

  let cleaned = 0;
  const staleMs = DEFAULT_STALE_MS;
  const platform = process.platform;

  try {
    const entries = await fs.readdir(locksDir);
    for (const entry of entries) {
      if (!entry.endsWith(".lock")) {
        continue;
      }
      const lockPath = path.join(locksDir, entry);
      try {
        const payload = await readLockPayload(lockPath);
        if (!payload) {
          // Invalid lock file - remove it
          await fs.rm(lockPath, { force: true });
          cleaned++;
          continue;
        }

        const ownerStatus = resolveLockOwnerStatus(payload.pid, payload, platform);
        if (ownerStatus === "dead") {
          await fs.rm(lockPath, { force: true });
          cleaned++;
          continue;
        }

        // Check if stale
        const createdAt = Date.parse(payload.createdAt);
        const isStale = Number.isFinite(createdAt) ? Date.now() - createdAt > staleMs : true;
        if (isStale) {
          await fs.rm(lockPath, { force: true });
          cleaned++;
        }
      } catch (err) {
        // If we can't read the lock, it's probably stale - remove it
        console.warn(`Failed to read lock ${lockPath}, removing:`, err);
        await fs.rm(lockPath, { force: true });
        cleaned++;
      }
    }
  } catch (err) {
    console.warn(`Failed to cleanup locks in ${locksDir}:`, err);
  }

  return cleaned;
}
