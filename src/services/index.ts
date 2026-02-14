/**
 * Services Index
 * Central export for all services
 */

export { UserService } from './user';
export { AgentService } from './agent';
export { ChatService } from './chat';
export { OnboardingService } from './onboarding';
export { UsageService } from './usage';

import { Database, createDb } from '../db/client';
import { UserService } from './user';
import { AgentService } from './agent';
import { ChatService } from './chat';
import { OnboardingService } from './onboarding';
import { UsageService } from './usage';

/**
 * Create all services with a database connection
 */
export function createServices(databaseUrl: string) {
  const db = createDb(databaseUrl);
  
  const userService = new UserService(db);
  const agentService = new AgentService(db);
  const chatService = new ChatService(db);
  const usageService = new UsageService(db);
  const onboardingService = new OnboardingService(userService, agentService, chatService);

  return {
    db,
    user: userService,
    agent: agentService,
    chat: chatService,
    usage: usageService,
    onboarding: onboardingService,
  };
}

export type Services = ReturnType<typeof createServices>;
