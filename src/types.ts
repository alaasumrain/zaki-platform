/**
 * VM-based Environment Configuration
 * No Cloudflare dependencies
 */

export interface Env {
  // API Keys
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  
  // Gateway Configuration
  GATEWAY_TOKEN?: string;
  DEFAULT_MODEL?: string;
  
  // Server Configuration
  PORT?: string;
  NODE_ENV?: string;
  
  // Telegram
  TELEGRAM_BOT_TOKEN?: string;
  
  // Development
  DEV_MODE?: string;
}

export interface UserSandbox {
  userId: string;
  sandboxId: string;
  createdAt: number;
}
