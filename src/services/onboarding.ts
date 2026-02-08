/**
 * Onboarding Service
 * Handles new user setup and welcome flow
 */

import { UserService } from './user';
import { AgentService } from './agent';
import { ChatService } from './chat';
import { User, Agent, Session } from '../db/schema';

export interface OnboardingResult {
  user: User;
  agent: Agent;
  session: Session;
  welcomeMessage: string;
  isNewUser: boolean;
}

export class OnboardingService {
  constructor(
    private userService: UserService,
    private agentService: AgentService,
    private chatService: ChatService,
  ) {}

  /**
   * Handle /start command - main entry point for new and returning users
   */
  async handleStart(telegramUser: {
    id: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<OnboardingResult> {
    // Get or create user
    const { user, isNew } = await this.userService.getOrCreateFromTelegram(telegramUser);

    let agent: Agent;
    let welcomeMessage: string;

    if (isNew) {
      // New user - create default agent and welcome them
      agent = await this.agentService.createDefaultAgent(
        user.id,
        telegramUser.first_name
      );

      welcomeMessage = this.buildWelcomeMessage(telegramUser.first_name);
    } else {
      // Returning user - get their default agent
      agent = await this.agentService.getDefaultAgent(user.id) as Agent;
      
      if (!agent) {
        // Edge case: user exists but no agent (shouldn't happen)
        agent = await this.agentService.createDefaultAgent(
          user.id,
          telegramUser.first_name
        );
      }

      welcomeMessage = this.buildWelcomeBackMessage(telegramUser.first_name);
    }

    // Get or create session
    const session = await this.chatService.getOrCreateActiveSession(user.id, agent.id);

    return {
      user,
      agent,
      session,
      welcomeMessage,
      isNewUser: isNew,
    };
  }

  /**
   * Build welcome message for new users
   */
  private buildWelcomeMessage(firstName?: string): string {
    const name = firstName || 'there';
    
    return `Hey ${name}! 👋

Welcome to Zaki - your personal AI assistant.

I can help you with:
• 💬 Answering questions and brainstorming
• 📝 Writing and editing content  
• 🔍 Research and analysis
• 💡 Creative projects and ideas
• 📊 Data and calculations

Just send me a message and I'll help you out!

**Quick tips:**
• /agents - Manage your AI agents
• /new - Start a fresh conversation
• /help - See all commands

What would you like help with today?`;
  }

  /**
   * Build welcome back message for returning users
   */
  private buildWelcomeBackMessage(firstName?: string): string {
    const name = firstName || 'there';
    
    return `Welcome back, ${name}! 👋

Ready to pick up where we left off? Just send me a message.

Quick commands:
• /agents - Manage agents
• /new - Fresh conversation
• /help - All commands`;
  }

  /**
   * Check if user needs onboarding prompts
   */
  async needsOnboarding(userId: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    return user ? !user.isOnboarded : true;
  }

  /**
   * Complete onboarding for user
   */
  async completeOnboarding(userId: string): Promise<void> {
    await this.userService.markOnboarded(userId);
  }
}
