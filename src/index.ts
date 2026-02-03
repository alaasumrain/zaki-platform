/**
 * Zaki Platform - Multi-Tenant Personal AI Assistant Platform
 * 
 * Each user gets their own isolated OpenClaw Sandbox running on Cloudflare Workers.
 */

import { Hono } from 'hono';
import { getSandbox } from '@cloudflare/sandbox';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

/**
 * Get or create user's Sandbox ID
 */
function getUserSandboxId(userId: string): string {
  // Each user gets their own Sandbox with unique ID
  return `user-${userId}`;
}

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'zaki-platform' });
});

/**
 * Main API endpoint - routes to user's Sandbox
 */
app.post('/api/chat', async (c) => {
  try {
    // TODO: Extract userId from auth token
    const userId = c.req.header('X-User-Id') || 'test-user';
    
    // Get user's Sandbox ID
    const sandboxId = getUserSandboxId(userId);
    const sandbox = getSandbox(c.env.Sandbox, sandboxId);
    
    // TODO: Mount R2 storage for this user
    // TODO: Start OpenClaw Gateway in Sandbox
    // TODO: Route message to OpenClaw
    // TODO: Return response
    
    return c.json({ 
      message: 'Chat endpoint - coming soon',
      userId,
      sandboxId
    });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get user's Sandbox status
 */
app.get('/api/sandbox/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const sandboxId = getUserSandboxId(userId);
    const sandbox = getSandbox(c.env.Sandbox, sandboxId);
    
    // TODO: Check if Sandbox is running
    // TODO: Get Sandbox status
    
    return c.json({
      userId,
      sandboxId,
      status: 'active'
    });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
