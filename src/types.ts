import type { Sandbox } from '@cloudflare/sandbox';

export interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  UserStorage: R2Bucket;
  BROWSER?: Fetcher; // Browser Rendering binding (optional)
  ANTHROPIC_API_KEY?: string;
  AI_GATEWAY_BASE_URL?: string;
  AI_GATEWAY_API_KEY?: string;
  GATEWAY_TOKEN?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  DEV_MODE?: string;
  // R2 mounting credentials (required for R2 mounting)
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  CF_ACCOUNT_ID?: string;
}

export interface UserSandbox {
  userId: string;
  sandboxId: string;
  createdAt: number;
}
