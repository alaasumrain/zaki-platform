/**
 * Configuration constants for Zaki Platform (VM-based)
 */

/** Default port for main OpenClaw gateway */
export const DEFAULT_GATEWAY_PORT = 18789;

/** Starting port for user instances (auto-assigned) */
export const USER_INSTANCE_PORT_START = 18790;

/** Maximum port for user instances */
export const USER_INSTANCE_PORT_END = 18999;

/** Maximum time to wait for OpenClaw to start (3 minutes) */
export const STARTUP_TIMEOUT_MS = 180_000;

/** Optional: single root for all data; if set, paths below default to $ZAKI_DATA_ROOT/... */
const DATA_ROOT = process.env.ZAKI_DATA_ROOT?.trim() || '';

/** Base directory for user data (profiles, etc.). Override with ZAKI_USER_DATA_BASE or set ZAKI_DATA_ROOT. */
export const USER_DATA_BASE =
  process.env.ZAKI_USER_DATA_BASE?.trim() ||
  (DATA_ROOT ? `${DATA_ROOT}/data/users` : '') ||
  '/root/zaki-platform/data/users';

/** Base directory for instance configs. Override with ZAKI_INSTANCE_CONFIG_BASE or set ZAKI_DATA_ROOT. */
export const INSTANCE_CONFIG_BASE =
  process.env.ZAKI_INSTANCE_CONFIG_BASE?.trim() ||
  (DATA_ROOT ? `${DATA_ROOT}/instance-config` : '') ||
  '/root/.clawdbot';

/** Base directory for instance workspaces. Override with ZAKI_INSTANCE_WORKSPACE_BASE or set ZAKI_DATA_ROOT. */
export const INSTANCE_WORKSPACE_BASE =
  process.env.ZAKI_INSTANCE_WORKSPACE_BASE?.trim() ||
  (DATA_ROOT ? `${DATA_ROOT}/workspaces` : '') ||
  '/root/clawd';

/** Instance backend: 'docker' (default) or 'fireclaw' (Firecracker VMs, Linux+KVM only) */
export const INSTANCE_BACKEND = (process.env.ZAKI_INSTANCE_BACKEND || 'docker') as 'docker' | 'fireclaw';

/** Path to fireclaw CLI when using fireclaw backend (default: fireclaw from PATH) */
export const FIRECLAW_PATH = process.env.FIRECLAW_PATH || 'fireclaw';

/** Fireclaw state root (where .vm-<id> dirs live); must be readable for port/token after setup */
export const FIRECLAW_STATE_ROOT = process.env.FIRECLAW_STATE_ROOT || '/var/lib/fireclaw';
