/**
 * Sandbox Manager - Handles user Sandbox lifecycle
 * 
 * Based on Moltworker patterns, adapted for multi-tenant use.
 * Uses Cloudflare Sandbox SDK (@cloudflare/sandbox)
 */

import { getSandbox } from '@cloudflare/sandbox';
import type { Env } from '../types';
import { R2_MOUNT_PATH, R2_BUCKET_NAME, GATEWAY_PORT, STARTUP_TIMEOUT_MS } from '../config';

// Process type from Sandbox SDK
type Process = {
  id: string;
  command: string;
  status: 'starting' | 'running' | 'stopped' | 'failed';
  waitForPort: (port: number, options: { mode: 'tcp'; timeout: number }) => Promise<void>;
  kill: () => Promise<void>;
  getLogs: () => Promise<{ stdout: string; stderr: string }>;
};

export interface SandboxOptions {
  userId: string;
  mountR2?: boolean;
  r2Prefix?: string;
  keepAlive?: boolean;
  sleepAfter?: string;
}

/**
 * Get user's Sandbox ID
 */
export function getUserSandboxId(userId: string): string {
  // Each user gets their own Sandbox with unique ID
  // Pattern: user-{userId} (e.g., user-123, user-456)
  return `user-${userId}`;
}

/**
 * Build Sandbox options based on user tier or defaults
 */
function buildSandboxOptions(options?: SandboxOptions): { keepAlive?: boolean; sleepAfter?: string } {
  const sandboxOptions: { keepAlive?: boolean; sleepAfter?: string } = {};
  if (options?.keepAlive) {
    sandboxOptions.keepAlive = true;
  } else if (options?.sleepAfter) {
    sandboxOptions.sleepAfter = options.sleepAfter;
  } else {
    // Default: keep alive (can be changed per tier later)
    sandboxOptions.keepAlive = true;
  }
  return sandboxOptions;
}

/**
 * Get or create user's Sandbox stub
 * Uses Cloudflare Sandbox SDK
 */
export function getUserSandbox(env: Env, userId: string, options?: SandboxOptions): any {
  const sandboxId = getUserSandboxId(userId);
  
  // Use getSandbox from @cloudflare/sandbox
  // This returns a sandbox instance with containerFetch, mountBucket, startProcess, etc.
  return getSandbox(env.Sandbox, sandboxId);
}

/**
 * Check if R2 is already mounted by looking at the mount table
 */
async function isR2Mounted(sandbox: any): Promise<boolean> {
  try {
    const proc = await sandbox.startProcess(`bash -c "mount | grep 's3fs on ${R2_MOUNT_PATH}'"`);
    // Wait for the command to complete
    let attempts = 0;
    while (proc.status === 'running' && attempts < 10) {
      await new Promise(r => setTimeout(r, 200));
      attempts++;
    }
    const logs = await proc.getLogs();
    // If stdout has content, the mount exists
    const mounted = !!(logs.stdout && logs.stdout.includes('s3fs'));
    console.log('isR2Mounted check:', mounted, 'stdout:', logs.stdout?.slice(0, 100));
    return mounted;
  } catch (err) {
    console.log('isR2Mounted error:', err);
    return false;
  }
}

/**
 * Mount R2 bucket for persistent storage (per-user prefix)
 */
export async function mountR2Storage(sandbox: any, env: Env, userId: string): Promise<boolean> {
  // Skip if R2 credentials are not configured
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.CF_ACCOUNT_ID) {
    console.log('R2 storage not configured (missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or CF_ACCOUNT_ID)');
    return false;
  }

  // Check if already mounted first - this avoids errors and is faster
  if (await isR2Mounted(sandbox)) {
    console.log('R2 bucket already mounted at', R2_MOUNT_PATH);
    return true;
  }

  try {
    console.log(`Mounting R2 bucket at ${R2_MOUNT_PATH} for user ${userId}`);
    // Note: For multi-tenant, we mount the whole bucket but use prefixes in the path
    // The startup script will handle per-user prefixes
    await sandbox.mountBucket(R2_BUCKET_NAME, R2_MOUNT_PATH, {
      endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      // Pass credentials explicitly since we use R2_* naming instead of AWS_*
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
    console.log('R2 bucket mounted successfully - user data will persist across sessions');
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.log('R2 mount error:', errorMessage);
    
    // Check again if it's mounted - the error might be misleading
    if (await isR2Mounted(sandbox)) {
      console.log('R2 bucket is mounted despite error');
      return true;
    }
    
    // Don't fail if mounting fails - OpenClaw can still run without persistent storage
    console.error('Failed to mount R2 bucket:', err);
    return false;
  }
}

/**
 * Initialize Sandbox with R2 storage mount
 */
export async function initializeSandbox(
  env: Env,
  userId: string
): Promise<string> {
  const sandboxId = getUserSandboxId(userId);
  const sandbox = getUserSandbox(env, userId);
  
  // Mount R2 storage (non-blocking if not configured)
  await mountR2Storage(sandbox, env, userId);
  
  return sandboxId;
}

/**
 * Find an existing OpenClaw gateway process
 */
export async function findExistingGatewayProcess(sandbox: any): Promise<Process | null> {
  try {
    const processes = await sandbox.listProcesses();
    for (const proc of processes) {
      // Only match the gateway process, not CLI commands
      const isGatewayProcess = 
        proc.command.includes('start-zaki.sh') ||
        proc.command.includes('clawdbot gateway');
      const isCliCommand = 
        proc.command.includes('clawdbot devices') ||
        proc.command.includes('clawdbot --version');
      
      if (isGatewayProcess && !isCliCommand) {
        if (proc.status === 'starting' || proc.status === 'running') {
          return proc;
        }
      }
    }
  } catch (e) {
    console.log('Could not list processes:', e);
  }
  return null;
}

/**
 * Build environment variables for OpenClaw Gateway
 */
function buildEnvVars(env: Env): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Normalize the base URL by removing trailing slashes
  const normalizedBaseUrl = env.AI_GATEWAY_BASE_URL?.replace(/\/+$/, '');
  const isOpenAIGateway = normalizedBaseUrl?.endsWith('/openai');

  // AI Gateway vars take precedence
  if (env.AI_GATEWAY_API_KEY) {
    if (isOpenAIGateway) {
      envVars.OPENAI_API_KEY = env.AI_GATEWAY_API_KEY;
    } else {
      envVars.ANTHROPIC_API_KEY = env.AI_GATEWAY_API_KEY;
    }
  }

  // Fall back to direct provider keys
  if (!envVars.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) {
    envVars.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }

  // Pass base URL
  if (normalizedBaseUrl) {
    envVars.AI_GATEWAY_BASE_URL = normalizedBaseUrl;
    if (isOpenAIGateway) {
      envVars.OPENAI_BASE_URL = normalizedBaseUrl;
    } else {
      envVars.ANTHROPIC_BASE_URL = normalizedBaseUrl;
    }
  }

  // Map GATEWAY_TOKEN to CLAWDBOT_GATEWAY_TOKEN (container expects this name)
  if (env.GATEWAY_TOKEN) envVars.CLAWDBOT_GATEWAY_TOKEN = env.GATEWAY_TOKEN;
  if (env.DEV_MODE) envVars.CLAWDBOT_DEV_MODE = env.DEV_MODE;

  return envVars;
}

/**
 * Ensure the OpenClaw gateway is running
 */
export async function ensureGateway(sandbox: any, env: Env): Promise<Process> {
  // Check if gateway is already running or starting
  const existingProcess = await findExistingGatewayProcess(sandbox);
  if (existingProcess) {
    console.log('Found existing gateway process:', existingProcess.id, 'status:', existingProcess.status);

    try {
      console.log('Waiting for gateway on port', GATEWAY_PORT, 'timeout:', STARTUP_TIMEOUT_MS);
      await existingProcess.waitForPort(GATEWAY_PORT, { mode: 'tcp', timeout: STARTUP_TIMEOUT_MS });
      console.log('Gateway is reachable');
      return existingProcess;
    } catch (e) {
      // Timeout waiting for port - process is likely dead or stuck, kill and restart
      console.log('Existing process not reachable after timeout, killing and restarting...');
      try {
        await existingProcess.kill();
      } catch (killError) {
        console.log('Failed to kill process:', killError);
      }
    }
  }

  // Start a new gateway
  console.log('Starting new gateway...');
  const envVars = buildEnvVars(env);
  const command = '/usr/local/bin/start-zaki.sh';

  console.log('Starting process with command:', command);
  console.log('Environment vars being passed:', Object.keys(envVars));

  let process: Process;
  try {
    process = await sandbox.startProcess(command, {
      env: Object.keys(envVars).length > 0 ? envVars : undefined,
    });
    console.log('Process started with id:', process.id, 'status:', process.status);
  } catch (startErr) {
    console.error('Failed to start process:', startErr);
    throw startErr;
  }

  // Wait for the gateway to be ready
  try {
    console.log('[Gateway] Waiting for gateway to be ready on port', GATEWAY_PORT);
    await process.waitForPort(GATEWAY_PORT, { mode: 'tcp', timeout: STARTUP_TIMEOUT_MS });
    console.log('[Gateway] Gateway is ready!');

    const logs = await process.getLogs();
    if (logs.stdout) console.log('[Gateway] stdout:', logs.stdout);
    if (logs.stderr) console.log('[Gateway] stderr:', logs.stderr);
  } catch (e) {
    console.error('[Gateway] waitForPort failed:', e);
    try {
      const logs = await process.getLogs();
      console.error('[Gateway] startup failed. Stderr:', logs.stderr);
      console.error('[Gateway] startup failed. Stdout:', logs.stdout);
      throw new Error(`Gateway failed to start. Stderr: ${logs.stderr || '(empty)'}`);
    } catch (logErr) {
      console.error('[Gateway] Failed to get logs:', logErr);
      throw e;
    }
  }

  return process;
}

/**
 * Check if Sandbox is running
 */
export async function isSandboxRunning(
  env: Env,
  userId: string
): Promise<boolean> {
  try {
    const sandbox = getUserSandbox(env, userId);
    const process = await findExistingGatewayProcess(sandbox);
    return process !== null && process.status === 'running';
  } catch (error) {
    console.error('Error checking Sandbox status:', error);
    return false;
  }
}

/**
 * Get Sandbox status information
 */
export async function getSandboxStatus(
  env: Env,
  userId: string
): Promise<{
  running: boolean;
  sandboxId: string;
  initialized: boolean;
}> {
  const sandboxId = getUserSandboxId(userId);
  const running = await isSandboxRunning(env, userId);
  
  // Check if R2 structure is initialized
  let initialized = false;
  try {
    const markerKey = `users/${userId}/.openclaw/.initialized`;
    await env.UserStorage.head(markerKey);
    initialized = true;
  } catch {
    initialized = false;
  }
  
  return {
    running,
    sandboxId,
    initialized
  };
}
