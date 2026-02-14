/**
 * Health Check System
 * Adapted from openclaw-core/src/commands/health.ts
 */

import { InstanceManager } from './instance-manager';
import { readRegistry } from './container-registry';
import { dockerContainerState } from './docker-utils';

const HEALTH_REFRESH_INTERVAL_MS = 30_000; // 30 seconds

let healthCache: HealthSummary | null = null;
let healthCacheTs = 0;

export type InstanceHealth = {
  userId: string;
  instanceId: string;
  port: number;
  running: boolean;
  createdAt: Date;
  lastUsed: Date;
  uptimeMs: number;
  status: 'running' | 'stopped' | 'error';
};

export type HealthSummary = {
  ok: true;
  ts: number;
  durationMs: number;
  platform: {
    name: string;
    version: string;
    architecture: string;
  };
  instances: {
    total: number;
    running: number;
    stopped: number;
    health: InstanceHealth[];
  };
  system: {
    uptimeMs: number;
    memoryUsage?: NodeJS.MemoryUsage;
  };
};

export function getHealthCache(): HealthSummary | null {
  const now = Date.now();
  if (healthCache && now - healthCacheTs < HEALTH_REFRESH_INTERVAL_MS) {
    return healthCache;
  }
  return null;
}

export async function refreshHealthSnapshot(
  instanceManager: InstanceManager,
  opts?: { probe?: boolean }
): Promise<HealthSummary> {
  const start = Date.now();
  
  // Get all instances from registry
  const registry = await readRegistry();
  const instances: InstanceHealth[] = [];
  
  let runningCount = 0;
  let stoppedCount = 0;
  
  for (const entry of registry.entries) {
    const state = await dockerContainerState(entry.containerName);
    const running = state.running;
    
    if (running) {
      runningCount++;
    } else {
      stoppedCount++;
    }
    
    const uptimeMs = Date.now() - entry.createdAtMs;
    
    instances.push({
      userId: entry.userId,
      instanceId: entry.instanceId,
      port: entry.port,
      running,
      createdAt: new Date(entry.createdAtMs),
      lastUsed: new Date(entry.lastUsedAtMs),
      uptimeMs,
      status: running ? 'running' : 'stopped',
    });
  }
  
  // Sort by last used (most recent first)
  instances.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  
  const summary: HealthSummary = {
    ok: true,
    ts: Date.now(),
    durationMs: Date.now() - start,
    platform: {
      name: 'Zaki Platform',
      version: '0.2.0',
      architecture: 'VM-based',
    },
    instances: {
      total: instances.length,
      running: runningCount,
      stopped: stoppedCount,
      health: instances,
    },
    system: {
      uptimeMs: process.uptime() * 1000,
      memoryUsage: process.memoryUsage(),
    },
  };
  
  // Cache the result
  healthCache = summary;
  healthCacheTs = Date.now();
  
  return summary;
}

export async function getHealthSummary(
  instanceManager: InstanceManager,
  opts?: { probe?: boolean; useCache?: boolean }
): Promise<HealthSummary> {
  const wantsProbe = opts?.probe === true;
  const useCache = opts?.useCache !== false;
  
  if (!wantsProbe && useCache) {
    const cached = getHealthCache();
    if (cached) {
      // Refresh in background
      refreshHealthSnapshot(instanceManager, { probe: false }).catch(() => {
        // Ignore background refresh errors
      });
      return cached;
    }
  }
  
  return await refreshHealthSnapshot(instanceManager, { probe: wantsProbe });
}
