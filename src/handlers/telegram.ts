/**
 * Telegram Message Handlers
 * 
 * These handlers are called by OpenClaw when messages come from Telegram.
 * OpenClaw handles the Telegram API - we just process the business logic.
 */

import { Services } from '../services';

export interface TelegramUser {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  date: number;
}

/**
 * Handle /start command
 */
export async function handleStart(
  services: Services,
  telegramUser: TelegramUser
): Promise<string> {
  const result = await services.onboarding.handleStart(telegramUser);
  return result.welcomeMessage;
}

/**
 * Handle /help command
 */
export function handleHelp(): string {
  return `**Zaki Commands** 🤖

**Chat:**
• Just send a message to chat with your AI
• /new - Start a fresh conversation

**Agents:**
• /agents - List your agents
• /agent create <name> - Create new agent
• /agent switch <name> - Switch to agent
• /agent delete <name> - Delete agent

**Settings:**
• /settings - View your settings
• /usage - Check your usage stats

**Help:**
• /help - Show this message
• /about - About Zaki

Need something else? Just ask!`;
}

/**
 * Handle /agents command
 */
export async function handleAgents(
  services: Services,
  userId: string
): Promise<string> {
  const agents = await services.agent.findByUserId(userId);
  
  if (agents.length === 0) {
    return `You don't have any agents yet. Create one with /agent create <name>`;
  }

  const defaultAgent = agents.find(a => a.isDefault);
  
  const lines = agents.map(a => {
    const marker = a.isDefault ? '✅' : '○';
    return `${marker} **${a.name}** - ${a.description || 'No description'}`;
  });

  return `**Your Agents** (${agents.length})\n\n${lines.join('\n')}\n\n_Currently using: ${defaultAgent?.name || 'None'}_`;
}

/**
 * Handle /new command - start fresh conversation
 */
export async function handleNewConversation(
  services: Services,
  userId: string
): Promise<string> {
  const agent = await services.agent.getDefaultAgent(userId);
  
  if (!agent) {
    return `No agent found. Use /start to set up.`;
  }

  // Archive current session and create new one
  const currentSession = await services.chat.getOrCreateActiveSession(userId, agent.id);
  await services.chat.archiveSession(currentSession.id);
  
  const newSession = await services.chat.createSession(userId, agent.id);
  
  return `✨ Started a fresh conversation!\n\nWhat would you like to talk about?`;
}

/**
 * Handle /usage command
 */
export async function handleUsage(
  services: Services,
  userId: string
): Promise<string> {
  try {
    const stats = await services.usage.getUserStats(userId, 30);

    if (stats.totalRequests === 0) {
      return `**Usage Stats** 📊

_No usage recorded yet. Start chatting to see your stats!_

During beta, enjoy unlimited conversations! 🎉`;
    }

    // Format the response
    const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    const avgTokensPerRequest = Math.round(totalTokens / stats.totalRequests);
    
    let message = `**Usage Stats (Last 30 Days)** 📊\n\n`;
    
    message += `**Overview:**\n`;
    message += `• Requests: ${stats.totalRequests.toLocaleString()}\n`;
    message += `• Total Tokens: ${totalTokens.toLocaleString()}\n`;
    message += `  └ Input: ${stats.totalInputTokens.toLocaleString()}\n`;
    message += `  └ Output: ${stats.totalOutputTokens.toLocaleString()}\n`;
    message += `• Avg per Request: ${avgTokensPerRequest.toLocaleString()} tokens\n`;
    
    if (stats.totalCost > 0) {
      message += `• Estimated Cost: $${stats.totalCost.toFixed(4)}\n`;
    }
    
    // Show top models
    if (stats.byModel.length > 0) {
      message += `\n**By Model:**\n`;
      const topModels = stats.byModel
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);
      
      for (const model of topModels) {
        const modelTokens = model.inputTokens + model.outputTokens;
        message += `• ${model.model} (${model.provider}):\n`;
        message += `  ${model.requests} requests, ${modelTokens.toLocaleString()} tokens`;
        if (model.cost > 0) {
          message += `, $${model.cost.toFixed(4)}`;
        }
        message += `\n`;
      }
    }
    
    // Show recent activity (last 7 days)
    const recentDays = stats.byDate.slice(-7);
    if (recentDays.length > 0) {
      const recentRequests = recentDays.reduce((sum, d) => sum + d.requests, 0);
      const recentTokens = recentDays.reduce((sum, d) => sum + d.inputTokens + d.outputTokens, 0);
      
      message += `\n**Last 7 Days:**\n`;
      message += `• ${recentRequests.toLocaleString()} requests\n`;
      message += `• ${recentTokens.toLocaleString()} tokens\n`;
    }
    
    message += `\n_Stats update in real-time as you chat._`;
    
    return message;
  } catch (error: any) {
    console.error('Error fetching usage stats:', error);
    return `**Usage Stats** 📊\n\n_Sorry, couldn't fetch your stats right now. Please try again later._`;
  }
}

/**
 * Handle regular message (not a command)
 */
export async function handleMessage(
  services: Services,
  telegramUser: TelegramUser,
  text: string
): Promise<{ 
  response: string; 
  context: Array<{ role: string; content: string }>;
  agent: { systemPrompt: string; model: string; provider: string };
  session: { id: string };
}> {
  // Get or create user
  const { user } = await services.user.getOrCreateFromTelegram(telegramUser);
  
  // Get user's active agent
  let agent = await services.agent.getDefaultAgent(user.id);
  
  if (!agent) {
    // Create default agent if none exists
    agent = await services.agent.createDefaultAgent(user.id, telegramUser.first_name);
  }

  // Get or create session
  const session = await services.chat.getOrCreateActiveSession(user.id, agent.id);

  // Save user message
  await services.chat.addMessage({
    sessionId: session.id,
    userId: user.id,
    role: 'user',
    content: text,
  });

  // Build context from conversation history
  const context = await services.chat.buildContext(session.id);

  // Return context and agent info for AI call
  // OpenClaw will handle the actual AI call
  // Usage will be tracked when saveAssistantResponse is called with metadata
  return {
    response: '', // AI response will be generated by OpenClaw
    context,
    agent: {
      systemPrompt: agent.systemPrompt || '',
      model: agent.model || 'claude-sonnet-4-20250514',
      provider: agent.provider || 'anthropic',
    },
    session: {
      id: session.id,
    },
  };
}

/**
 * Save assistant response after AI generates it
 * Also records usage if token counts are provided
 */
export async function saveAssistantResponse(
  services: Services,
  sessionId: string,
  userId: string,
  content: string,
  metadata?: {
    model?: string;
    provider?: string;
    inputTokens?: number;
    outputTokens?: number;
  }
): Promise<void> {
  await services.chat.addMessage({
    sessionId,
    userId,
    role: 'assistant',
    content,
    model: metadata?.model,
    provider: metadata?.provider,
    inputTokens: metadata?.inputTokens,
    outputTokens: metadata?.outputTokens,
  });

  // Record usage if token counts are available
  if (metadata?.inputTokens !== undefined || metadata?.outputTokens !== undefined) {
    const { recordUsageFromTokens } = await import('../utils/usage-tracker');
    await recordUsageFromTokens(
      services.usage,
      userId,
      metadata.inputTokens || 0,
      metadata.outputTokens || 0,
      metadata.model || 'unknown',
      metadata.provider
    ).catch((error) => {
      // Log but don't fail if usage recording fails
      console.error('Failed to record usage:', error);
    });
  }
}

/**
 * Route incoming message to appropriate handler
 */
export async function routeMessage(
  services: Services,
  message: TelegramMessage
): Promise<string | { needsAI: true; context: any }> {
  const text = message.text?.trim() || '';
  const telegramUser = message.from;

  // Handle commands
  if (text.startsWith('/')) {
    const [command, ...args] = text.slice(1).split(' ');
    
    switch (command.toLowerCase()) {
      case 'start':
        return handleStart(services, telegramUser);
      
      case 'help':
        return handleHelp();
      
      case 'agents':
        const { user } = await services.user.getOrCreateFromTelegram(telegramUser);
        return handleAgents(services, user.id);
      
      case 'new':
        const { user: u } = await services.user.getOrCreateFromTelegram(telegramUser);
        return handleNewConversation(services, u.id);
      
      case 'usage':
        const { user: usr } = await services.user.getOrCreateFromTelegram(telegramUser);
        return handleUsage(services, usr.id);
      
      default:
        return `Unknown command: /${command}\n\nType /help to see available commands.`;
    }
  }

  // Regular message - needs AI processing
  const result = await handleMessage(services, telegramUser, text);
  
  return {
    needsAI: true,
    context: result,
  };
}
