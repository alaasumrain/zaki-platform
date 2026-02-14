/**
 * Docker Utilities - Better Docker command handling
 * Adapted from openclaw-core/src/agents/sandbox/docker.ts
 */

import { spawn } from 'child_process';

/**
 * Execute Docker command with proper error handling
 */
export function execDocker(args: string[], opts?: { allowFailure?: boolean }) {
  return new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
    const child = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      const exitCode = code ?? 0;
      if (exitCode !== 0 && !opts?.allowFailure) {
        reject(new Error(stderr.trim() || `docker ${args.join(' ')} failed`));
        return;
      }
      resolve({ stdout, stderr, code: exitCode });
    });
  });
}

/**
 * Check if Docker image exists
 */
async function dockerImageExists(image: string): Promise<boolean> {
  const result = await execDocker(['image', 'inspect', image], {
    allowFailure: true,
  });
  if (result.code === 0) {
    return true;
  }
  const stderr = result.stderr.trim();
  if (stderr.includes('No such image')) {
    return false;
  }
  throw new Error(`Failed to inspect image: ${stderr}`);
}

/**
 * Ensure Docker image exists, pull if missing
 */
export async function ensureDockerImage(image: string): Promise<void> {
  const exists = await dockerImageExists(image);
  if (exists) {
    return;
  }
  console.log(`Image ${image} not found, pulling...`);
  await execDocker(['pull', image]);
}

/**
 * Get container state (exists and running)
 */
export async function dockerContainerState(name: string): Promise<{ exists: boolean; running: boolean }> {
  const result = await execDocker(['inspect', '-f', '{{.State.Running}}', name], {
    allowFailure: true,
  });
  if (result.code !== 0) {
    return { exists: false, running: false };
  }
  return { exists: true, running: result.stdout.trim() === 'true' };
}

/**
 * Normalize Docker limit value (memory, etc.)
 */
function normalizeDockerLimit(value?: string | number): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Format ulimit value
 */
function formatUlimitValue(
  name: string,
  value: string | number | { soft?: number; hard?: number }
): string | null {
  if (!name.trim()) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const raw = String(value).trim();
    return raw ? `${name}=${raw}` : null;
  }
  const soft = typeof value.soft === 'number' ? Math.max(0, value.soft) : undefined;
  const hard = typeof value.hard === 'number' ? Math.max(0, value.hard) : undefined;
  if (soft === undefined && hard === undefined) {
    return null;
  }
  if (soft === undefined) {
    return `${name}=${hard}`;
  }
  if (hard === undefined) {
    return `${name}=${soft}`;
  }
  return `${name}=${soft}:${hard}`;
}

export interface DockerResourceLimits {
  cpus?: number;
  memory?: string | number;
  memorySwap?: string | number;
  pidsLimit?: number;
  ulimits?: Record<string, string | number | { soft?: number; hard?: number }>;
}

/**
 * Build Docker create arguments with resource limits
 */
export function buildDockerCreateArgs(params: {
  name: string;
  image: string;
  port: number;
  hostPort: number;
  volumes: string[];
  env?: Record<string, string>;
  labels?: Record<string, string>;
  resourceLimits?: DockerResourceLimits;
}): string[] {
  const args = ['create', '--name', params.name];
  
  // Labels
  args.push('--label', 'zaki.instance=1');
  args.push('--label', `zaki.createdAtMs=${Date.now()}`);
  for (const [key, value] of Object.entries(params.labels ?? {})) {
    if (key && value) {
      args.push('--label', `${key}=${value}`);
    }
  }
  
  // Port mapping
  args.push('-p', `${params.hostPort}:${params.port}`);
  
  // Volumes
  for (const volume of params.volumes) {
    args.push('-v', volume);
  }
  
  // Environment variables
  for (const [key, value] of Object.entries(params.env ?? {})) {
    args.push('-e', `${key}=${value}`);
  }
  
  // Resource limits
  if (params.resourceLimits) {
    const limits = params.resourceLimits;
    
    if (typeof limits.pidsLimit === 'number' && limits.pidsLimit > 0) {
      args.push('--pids-limit', String(limits.pidsLimit));
    }
    
    const memory = normalizeDockerLimit(limits.memory);
    if (memory) {
      args.push('--memory', memory);
    }
    
    const memorySwap = normalizeDockerLimit(limits.memorySwap);
    if (memorySwap) {
      args.push('--memory-swap', memorySwap);
    }
    
    if (typeof limits.cpus === 'number' && limits.cpus > 0) {
      args.push('--cpus', String(limits.cpus));
    }
    
    for (const [name, value] of Object.entries(limits.ulimits ?? {})) {
      const formatted = formatUlimitValue(name, value);
      if (formatted) {
        args.push('--ulimit', formatted);
      }
    }
  }
  
  // Security options
  args.push('--security-opt', 'no-new-privileges');
  
  // Image and command
  args.push(params.image);
  
  return args;
}
