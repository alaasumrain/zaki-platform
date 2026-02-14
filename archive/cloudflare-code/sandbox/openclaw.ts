/**
 * OpenClaw Integration - Run OpenClaw Gateway in Sandbox
 * 
 * This module handles starting and managing OpenClaw Gateway
 * inside a user's Sandbox container.
 * 
 * NOTE: Most functionality is now in manager.ts (ensureGateway)
 * This file is kept for compatibility but delegates to manager.
 */

import type { Env } from '../types';
import type { Sandbox } from '@cloudflare/sandbox';
import { getUserSandbox, ensureGateway } from './manager';
import { GATEWAY_PORT } from '../config';

export interface OpenClawConfig {
  anthropicApiKey?: string;
  aiGatewayUrl?: string;
  aiGatewayApiKey?: string;
  gatewayToken?: string;
}

/**
 * Start OpenClaw Gateway in Sandbox
 * Delegates to ensureGateway in manager.ts
 */
export async function startOpenClawGateway(
  env: Env,
  userId: string,
  config: OpenClawConfig
): Promise<void> {
  console.log(`Starting OpenClaw Gateway for user ${userId}...`);
  const sandbox = getUserSandbox(env, userId);
  await ensureGateway(sandbox, env);
  console.log(`OpenClaw Gateway started for user ${userId}`);
}

/**
 * Get OpenClaw Gateway status
 */
export async function getOpenClawStatus(env: Env, userId: string): Promise<{
  running: boolean;
  port?: number;
  version?: string;
  pid?: number;
}> {
  try {
    const sandbox = getUserSandbox(env, userId);
    const process = await findExistingGatewayProcess(sandbox);
    
    if (process) {
      return {
        running: process.status === 'running',
        port: GATEWAY_PORT,
        version: 'unknown', // Could get from process if available
        pid: parseInt(process.id) || undefined
      };
    }
    
    return {
      running: false,
      port: GATEWAY_PORT,
      version: 'unknown'
    };
  } catch (error) {
    console.error('Error checking OpenClaw status:', error);
    return {
      running: false,
      port: GATEWAY_PORT,
      version: 'unknown'
    };
  }
}

// Re-export findExistingGatewayProcess for use here
import { findExistingGatewayProcess } from './manager';
