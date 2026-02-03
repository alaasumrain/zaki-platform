import type { Sandbox } from '@cloudflare/sandbox';

export interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  UserStorage: R2Bucket;
  ANTHROPIC_API_KEY?: string;
  AI_GATEWAY_BASE_URL?: string;
  AI_GATEWAY_API_KEY?: string;
  GATEWAY_TOKEN?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  DEV_MODE?: string;
}

export interface UserSandbox {
  userId: string;
  sandboxId: string;
  createdAt: number;
}
