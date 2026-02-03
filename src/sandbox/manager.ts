/**
 * Sandbox Manager - Handles user Sandbox lifecycle
 * 
 * Based on Moltworker patterns, adapted for multi-tenant use.
 */

import { getSandbox } from '@cloudflare/sandbox';
import type { Env } from '../types';

export interface SandboxOptions {
  userId: string;
  mountR2?: boolean;
  r2Prefix?: string;
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
 * Get or create user's Sandbox stub
 */
export function getUserSandbox(env: Env, userId: string) {
  const sandboxId = getUserSandboxId(userId);
  
  // Options for Sandbox initialization
  const options = {
    // TODO: Mount R2 storage for this user
    // mount: {
    //   '/workspace/storage': {
    //     bucket: env.UserStorage,
    //     prefix: `users/${userId}/`
    //   }
    // }
  };
  
  return getSandbox(env.Sandbox, sandboxId);
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
  
  // TODO: Mount R2 storage
  // TODO: Install OpenClaw if not already installed
  // TODO: Start OpenClaw Gateway
  
  return sandboxId;
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
    // TODO: Check Sandbox status
    // const status = await sandbox.status();
    // return status.state === 'running';
    return true; // Placeholder
  } catch (error) {
    console.error('Error checking Sandbox status:', error);
    return false;
  }
}
